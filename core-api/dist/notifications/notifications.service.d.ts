import { NotificationsGateway } from './notifications.gateway';
export declare class NotificationsService {
    private notificationsGateway;
    constructor(notificationsGateway: NotificationsGateway);
    notifyApplicationStatusUpdate(userId: string, applicationId: string, status: string, data?: Record<string, unknown>): void;
    notifyNewScholarshipMatch(userId: string, scholarship: Record<string, unknown>, matchScore?: number): void;
    notifyDocumentGenerationComplete(userId: string, documentId: string, documentType: string, success: boolean, data?: Record<string, unknown>): void;
    notifyUser(userId: string, type: 'info' | 'success' | 'warning' | 'error', title: string, message: string, data?: Record<string, unknown>): void;
    streamLLMChunk(userId: string, sessionId: string, chunk: string, metadata?: Record<string, unknown>): void;
    streamLLMComplete(userId: string, sessionId: string, fullResponse: string, metadata?: Record<string, unknown>): void;
    streamLLMError(userId: string, sessionId: string, error: string, metadata?: Record<string, unknown>): void;
    broadcastNotification(type: 'info' | 'success' | 'warning' | 'error', title: string, message: string, data?: Record<string, unknown>): void;
    broadcastToRole(role: string, type: 'info' | 'success' | 'warning' | 'error', title: string, message: string, data?: Record<string, unknown>): void;
    isUserConnected(userId: string): boolean;
    getConnectedClientsCount(): number;
}
