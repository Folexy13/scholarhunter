import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
interface AuthenticatedSocket extends Socket {
    userId?: string;
    userRole?: string;
}
export declare class NotificationsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private jwtService;
    private configService;
    server: Server;
    private readonly logger;
    private connectedClients;
    constructor(jwtService: JwtService, configService: ConfigService);
    afterInit(): void;
    handleConnection(client: AuthenticatedSocket): Promise<void>;
    handleDisconnect(client: AuthenticatedSocket): void;
    emitApplicationStatusUpdate(userId: string, applicationId: string, status: string, data?: Record<string, unknown>): void;
    emitNewScholarshipMatch(userId: string, scholarship: Record<string, unknown>, matchScore?: number): void;
    emitDocumentGenerationComplete(userId: string, documentId: string, documentType: string, success: boolean, data?: Record<string, unknown>): void;
    emitNotification(userId: string, type: 'info' | 'success' | 'warning' | 'error', title: string, message: string, data?: Record<string, unknown>): void;
    emitLLMStreamChunk(userId: string, sessionId: string, chunk: string, metadata?: Record<string, unknown>): void;
    emitLLMStreamComplete(userId: string, sessionId: string, fullResponse: string, metadata?: Record<string, unknown>): void;
    emitLLMStreamError(userId: string, sessionId: string, error: string, metadata?: Record<string, unknown>): void;
    broadcastNotification(type: 'info' | 'success' | 'warning' | 'error', title: string, message: string, data?: Record<string, unknown>): void;
    broadcastToRole(role: string, type: 'info' | 'success' | 'warning' | 'error', title: string, message: string, data?: Record<string, unknown>): void;
    handleSubscribe(client: AuthenticatedSocket, data: {
        events: string[];
    }): {
        error: string;
        success?: undefined;
        subscribedEvents?: undefined;
    } | {
        success: boolean;
        subscribedEvents: string[];
        error?: undefined;
    };
    handleUnsubscribe(client: AuthenticatedSocket, data: {
        events: string[];
    }): {
        error: string;
        success?: undefined;
        unsubscribedEvents?: undefined;
    } | {
        success: boolean;
        unsubscribedEvents: string[];
        error?: undefined;
    };
    handlePing(): {
        event: string;
        data: {
            timestamp: string;
        };
    };
    getConnectedClientsCount(): number;
    isUserConnected(userId: string): boolean;
    getClientByUserId(userId: string): AuthenticatedSocket | undefined;
}
export {};
