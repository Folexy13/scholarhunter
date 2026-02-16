import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

@WebSocketGateway({
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3001',
      'http://localhost:3000',
      'http://localhost:3001',
    ],
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private connectedClients = new Map<string, AuthenticatedSocket>();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake auth or query
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.headers?.authorization as string)?.replace(
          'Bearer ',
          '',
        ) ||
        (client.handshake.query?.token as string);

      if (!token) {
        this.logger.warn(`Client ${client.id} connection rejected: No token`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret:
          this.configService.get<string>('JWT_SECRET') || 'your-secret-key',
      });

      // Attach user info to socket
      client.userId = payload.sub;
      client.userRole = payload.role;

      // Store connected client
      this.connectedClients.set(client.userId, client);

      // Join user-specific room
      client.join(`user:${client.userId}`);

      // Join role-specific room
      if (client.userRole) {
        client.join(`role:${client.userRole}`);
      }

      this.logger.log(
        `Client connected: ${client.id} (User: ${client.userId}, Role: ${client.userRole})`,
      );

      // Send connection confirmation
      client.emit('connected', {
        message: 'Successfully connected to notifications',
        userId: client.userId,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Client ${client.id} authentication failed: ${errorMessage}`,
      );
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedClients.delete(client.userId);
      this.logger.log(
        `Client disconnected: ${client.id} (User: ${client.userId})`,
      );
    } else {
      this.logger.log(`Client disconnected: ${client.id}`);
    }
  }

  // Application status update event
  emitApplicationStatusUpdate(
    userId: string,
    applicationId: string,
    status: string,
    data?: Record<string, unknown>,
  ) {
    this.server.to(`user:${userId}`).emit('application:status-update', {
      applicationId,
      status,
      timestamp: new Date().toISOString(),
      ...data,
    });

    this.logger.log(
      `Emitted application status update to user ${userId}: ${applicationId} -> ${status}`,
    );
  }

  // New scholarship match event
  emitNewScholarshipMatch(
    userId: string,
    scholarship: Record<string, unknown>,
    matchScore?: number,
  ) {
    this.server.to(`user:${userId}`).emit('scholarship:new-match', {
      scholarship,
      matchScore,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(
      `Emitted new scholarship match to user ${userId}: ${scholarship.id as string}`,
    );
  }

  // Document generation completion event
  emitDocumentGenerationComplete(
    userId: string,
    documentId: string,
    documentType: string,
    success: boolean,
    data?: Record<string, unknown>,
  ) {
    this.server.to(`user:${userId}`).emit('document:generation-complete', {
      documentId,
      documentType,
      success,
      timestamp: new Date().toISOString(),
      ...data,
    });

    this.logger.log(
      `Emitted document generation complete to user ${userId}: ${documentId} (${success ? 'success' : 'failed'})`,
    );
  }

  // General notification event
  emitNotification(
    userId: string,
    type: 'info' | 'success' | 'warning' | 'error',
    title: string,
    message: string,
    data?: Record<string, unknown>,
  ) {
    this.server.to(`user:${userId}`).emit('notification', {
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      ...data,
    });

    this.logger.log(`Emitted notification to user ${userId}: ${title}`);
  }

  // Stream LLM response chunk
  emitLLMStreamChunk(
    userId: string,
    sessionId: string,
    chunk: string,
    metadata?: Record<string, unknown>,
  ) {
    this.server.to(`user:${userId}`).emit('chat:chunk', {
      sessionId,
      chunk,
      done: false,
      timestamp: new Date().toISOString(),
      ...metadata,
    });
  }

  // Stream completion
  emitLLMStreamComplete(
    userId: string,
    sessionId: string,
    fullResponse: string,
    metadata?: Record<string, unknown>,
  ) {
    this.server.to(`user:${userId}`).emit('chat:chunk', {
      sessionId,
      chunk: '',
      done: true,
      fullResponse,
      timestamp: new Date().toISOString(),
      ...metadata,
    });

    this.logger.log(
      `LLM stream completed for user ${userId}, session ${sessionId}`,
    );
  }

  // Stream error
  emitLLMStreamError(
    userId: string,
    sessionId: string,
    error: string,
    metadata?: Record<string, unknown>,
  ) {
    this.server.to(`user:${userId}`).emit('chat:error', {
      sessionId,
      error,
      timestamp: new Date().toISOString(),
      ...metadata,
    });

    this.logger.error(
      `LLM stream error for user ${userId}, session ${sessionId}: ${error}`,
    );
  }

  // Broadcast to all users
  broadcastNotification(
    type: 'info' | 'success' | 'warning' | 'error',
    title: string,
    message: string,
    data?: Record<string, unknown>,
  ) {
    this.server.emit('notification', {
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      ...data,
    });

    this.logger.log(`Broadcasted notification to all users: ${title}`);
  }

  // Broadcast to specific role
  broadcastToRole(
    role: string,
    type: 'info' | 'success' | 'warning' | 'error',
    title: string,
    message: string,
    data?: Record<string, unknown>,
  ) {
    this.server.to(`role:${role}`).emit('notification', {
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      ...data,
    });

    this.logger.log(`Broadcasted notification to role ${role}: ${title}`);
  }

  // Subscribe to specific events (client-side subscription)
  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { events: string[] },
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    const { events } = data;
    events.forEach((event) => {
      client.join(`event:${event}`);
    });

    this.logger.log(
      `User ${client.userId} subscribed to events: ${events.join(', ')}`,
    );

    return { success: true, subscribedEvents: events };
  }

  // Unsubscribe from specific events
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { events: string[] },
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    const { events } = data;
    events.forEach((event) => {
      client.leave(`event:${event}`);
    });

    this.logger.log(
      `User ${client.userId} unsubscribed from events: ${events.join(', ')}`,
    );

    return { success: true, unsubscribedEvents: events };
  }

  // Ping/pong for connection health check
  @SubscribeMessage('ping')
  handlePing() {
    return { event: 'pong', data: { timestamp: new Date().toISOString() } };
  }

  // Get connected clients count (admin only)
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  // Interview WebSocket handler - for real-time interview communication
  @SubscribeMessage('interview:message')
  async handleInterviewMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: {
      mode: string;
      persona: string;
      interview_type: string;
      user_answer?: string;
      history?: any[];
      student_profile?: Record<string, unknown>;
      selected_panelists?: any[];
      is_conclusion?: boolean;
    },
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    this.logger.log(
      `Interview message from user ${client.userId}: mode=${data.mode}`,
    );

    // Emit that we're processing
    client.emit('interview:processing', {
      timestamp: new Date().toISOString(),
    });

    try {
      // Import axios dynamically to make the request
      const axios = await import('axios');
      const llmServiceUrl =
        this.configService.get<string>('LLM_SERVICE_URL') ||
        'http://llm-service:8000';
      const apiKey = this.configService.get<string>('CORE_API_SECRET') || '';

      const response = await axios.default.post(
        `${llmServiceUrl}/api/llm/interview/interactive`,
        {
          mode: data.mode,
          persona: data.persona,
          interview_type: data.interview_type,
          user_answer: data.user_answer,
          history: data.history,
          student_profile: data.student_profile,
          selected_panelists: data.selected_panelists,
          is_conclusion: data.is_conclusion,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          timeout: 60000,
        },
      );

      // Emit the response
      client.emit('interview:response', {
        success: true,
        data: response.data.data,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`Interview response sent to user ${client.userId}`);

      return { success: true };
    } catch (error) {
      // Extract detailed error information from axios errors
      let errorMessage = 'Unknown error';
      let errorDetails: Record<string, unknown> = {};

      if (error && typeof error === 'object') {
        const axiosError = error as {
          response?: {
            status?: number;
            data?: unknown;
            statusText?: string;
          };
          message?: string;
          code?: string;
        };

        if (axiosError.response) {
          // The request was made and the server responded with a status code
          errorMessage = `LLM Service Error (${axiosError.response.status}): ${axiosError.response.statusText || 'Unknown'}`;
          errorDetails = {
            status: axiosError.response.status,
            statusText: axiosError.response.statusText,
            data: axiosError.response.data,
          };
        } else if (axiosError.message) {
          errorMessage = axiosError.message;
          if (axiosError.code) {
            errorDetails.code = axiosError.code;
          }
        }
      }

      this.logger.error(
        `Interview error for user ${client.userId}: ${errorMessage}`,
        errorDetails,
      );

      client.emit('interview:error', {
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString(),
      });

      return { error: errorMessage, details: errorDetails };
    }
  }

  // Check if user is connected
  isUserConnected(userId: string): boolean {
    return this.connectedClients.has(userId);
  }

  // Get client by user ID
  getClientByUserId(userId: string): AuthenticatedSocket | undefined {
    return this.connectedClients.get(userId);
  }
}
