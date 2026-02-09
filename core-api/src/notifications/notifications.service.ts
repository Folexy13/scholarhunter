import { Injectable } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(private notificationsGateway: NotificationsGateway) {}

  // Application status update
  notifyApplicationStatusUpdate(
    userId: string,
    applicationId: string,
    status: string,
    data?: Record<string, unknown>,
  ) {
    this.notificationsGateway.emitApplicationStatusUpdate(
      userId,
      applicationId,
      status,
      data,
    );
  }

  // New scholarship match
  notifyNewScholarshipMatch(
    userId: string,
    scholarship: Record<string, unknown>,
    matchScore?: number,
  ) {
    this.notificationsGateway.emitNewScholarshipMatch(
      userId,
      scholarship,
      matchScore,
    );
  }

  // Document generation completion
  notifyDocumentGenerationComplete(
    userId: string,
    documentId: string,
    documentType: string,
    success: boolean,
    data?: Record<string, unknown>,
  ) {
    this.notificationsGateway.emitDocumentGenerationComplete(
      userId,
      documentId,
      documentType,
      success,
      data,
    );
  }

  // General notification
  notifyUser(
    userId: string,
    type: 'info' | 'success' | 'warning' | 'error',
    title: string,
    message: string,
    data?: Record<string, unknown>,
  ) {
    this.notificationsGateway.emitNotification(
      userId,
      type,
      title,
      message,
      data,
    );
  }

  // Stream LLM response chunk
  streamLLMChunk(
    userId: string,
    sessionId: string,
    chunk: string,
    metadata?: Record<string, unknown>,
  ) {
    this.notificationsGateway.emitLLMStreamChunk(
      userId,
      sessionId,
      chunk,
      metadata,
    );
  }

  // Stream completion
  streamLLMComplete(
    userId: string,
    sessionId: string,
    fullResponse: string,
    metadata?: Record<string, unknown>,
  ) {
    this.notificationsGateway.emitLLMStreamComplete(
      userId,
      sessionId,
      fullResponse,
      metadata,
    );
  }

  // Stream error
  streamLLMError(
    userId: string,
    sessionId: string,
    error: string,
    metadata?: Record<string, unknown>,
  ) {
    this.notificationsGateway.emitLLMStreamError(
      userId,
      sessionId,
      error,
      metadata,
    );
  }

  // Broadcast to all users
  broadcastNotification(
    type: 'info' | 'success' | 'warning' | 'error',
    title: string,
    message: string,
    data?: Record<string, unknown>,
  ) {
    this.notificationsGateway.broadcastNotification(type, title, message, data);
  }

  // Broadcast to specific role
  broadcastToRole(
    role: string,
    type: 'info' | 'success' | 'warning' | 'error',
    title: string,
    message: string,
    data?: Record<string, unknown>,
  ) {
    this.notificationsGateway.broadcastToRole(role, type, title, message, data);
  }

  // Check if user is connected
  isUserConnected(userId: string): boolean {
    return this.notificationsGateway.isUserConnected(userId);
  }

  // Get connected clients count
  getConnectedClientsCount(): number {
    return this.notificationsGateway.getConnectedClientsCount();
  }
}
