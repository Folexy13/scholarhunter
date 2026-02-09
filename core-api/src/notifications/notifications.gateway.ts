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

  // Check if user is connected
  isUserConnected(userId: string): boolean {
    return this.connectedClients.has(userId);
  }

  // Get client by user ID
  getClientByUserId(userId: string): AuthenticatedSocket | undefined {
    return this.connectedClients.get(userId);
  }
}
