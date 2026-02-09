"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var NotificationsGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
let NotificationsGateway = NotificationsGateway_1 = class NotificationsGateway {
    jwtService;
    configService;
    server;
    logger = new common_1.Logger(NotificationsGateway_1.name);
    connectedClients = new Map();
    constructor(jwtService, configService) {
        this.jwtService = jwtService;
        this.configService = configService;
    }
    afterInit() {
        this.logger.log('WebSocket Gateway initialized');
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token ||
                client.handshake.headers?.authorization?.replace('Bearer ', '') ||
                client.handshake.query?.token;
            if (!token) {
                this.logger.warn(`Client ${client.id} connection rejected: No token`);
                client.disconnect();
                return;
            }
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get('JWT_SECRET') || 'your-secret-key',
            });
            client.userId = payload.sub;
            client.userRole = payload.role;
            this.connectedClients.set(client.userId, client);
            client.join(`user:${client.userId}`);
            if (client.userRole) {
                client.join(`role:${client.userRole}`);
            }
            this.logger.log(`Client connected: ${client.id} (User: ${client.userId}, Role: ${client.userRole})`);
            client.emit('connected', {
                message: 'Successfully connected to notifications',
                userId: client.userId,
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Client ${client.id} authentication failed: ${errorMessage}`);
            client.emit('error', { message: 'Authentication failed' });
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        if (client.userId) {
            this.connectedClients.delete(client.userId);
            this.logger.log(`Client disconnected: ${client.id} (User: ${client.userId})`);
        }
        else {
            this.logger.log(`Client disconnected: ${client.id}`);
        }
    }
    emitApplicationStatusUpdate(userId, applicationId, status, data) {
        this.server.to(`user:${userId}`).emit('application:status-update', {
            applicationId,
            status,
            timestamp: new Date().toISOString(),
            ...data,
        });
        this.logger.log(`Emitted application status update to user ${userId}: ${applicationId} -> ${status}`);
    }
    emitNewScholarshipMatch(userId, scholarship, matchScore) {
        this.server.to(`user:${userId}`).emit('scholarship:new-match', {
            scholarship,
            matchScore,
            timestamp: new Date().toISOString(),
        });
        this.logger.log(`Emitted new scholarship match to user ${userId}: ${scholarship.id}`);
    }
    emitDocumentGenerationComplete(userId, documentId, documentType, success, data) {
        this.server.to(`user:${userId}`).emit('document:generation-complete', {
            documentId,
            documentType,
            success,
            timestamp: new Date().toISOString(),
            ...data,
        });
        this.logger.log(`Emitted document generation complete to user ${userId}: ${documentId} (${success ? 'success' : 'failed'})`);
    }
    emitNotification(userId, type, title, message, data) {
        this.server.to(`user:${userId}`).emit('notification', {
            type,
            title,
            message,
            timestamp: new Date().toISOString(),
            ...data,
        });
        this.logger.log(`Emitted notification to user ${userId}: ${title}`);
    }
    emitLLMStreamChunk(userId, sessionId, chunk, metadata) {
        this.server.to(`user:${userId}`).emit('chat:chunk', {
            sessionId,
            chunk,
            done: false,
            timestamp: new Date().toISOString(),
            ...metadata,
        });
    }
    emitLLMStreamComplete(userId, sessionId, fullResponse, metadata) {
        this.server.to(`user:${userId}`).emit('chat:chunk', {
            sessionId,
            chunk: '',
            done: true,
            fullResponse,
            timestamp: new Date().toISOString(),
            ...metadata,
        });
        this.logger.log(`LLM stream completed for user ${userId}, session ${sessionId}`);
    }
    emitLLMStreamError(userId, sessionId, error, metadata) {
        this.server.to(`user:${userId}`).emit('chat:error', {
            sessionId,
            error,
            timestamp: new Date().toISOString(),
            ...metadata,
        });
        this.logger.error(`LLM stream error for user ${userId}, session ${sessionId}: ${error}`);
    }
    broadcastNotification(type, title, message, data) {
        this.server.emit('notification', {
            type,
            title,
            message,
            timestamp: new Date().toISOString(),
            ...data,
        });
        this.logger.log(`Broadcasted notification to all users: ${title}`);
    }
    broadcastToRole(role, type, title, message, data) {
        this.server.to(`role:${role}`).emit('notification', {
            type,
            title,
            message,
            timestamp: new Date().toISOString(),
            ...data,
        });
        this.logger.log(`Broadcasted notification to role ${role}: ${title}`);
    }
    handleSubscribe(client, data) {
        if (!client.userId) {
            return { error: 'Unauthorized' };
        }
        const { events } = data;
        events.forEach((event) => {
            client.join(`event:${event}`);
        });
        this.logger.log(`User ${client.userId} subscribed to events: ${events.join(', ')}`);
        return { success: true, subscribedEvents: events };
    }
    handleUnsubscribe(client, data) {
        if (!client.userId) {
            return { error: 'Unauthorized' };
        }
        const { events } = data;
        events.forEach((event) => {
            client.leave(`event:${event}`);
        });
        this.logger.log(`User ${client.userId} unsubscribed from events: ${events.join(', ')}`);
        return { success: true, unsubscribedEvents: events };
    }
    handlePing() {
        return { event: 'pong', data: { timestamp: new Date().toISOString() } };
    }
    getConnectedClientsCount() {
        return this.connectedClients.size;
    }
    isUserConnected(userId) {
        return this.connectedClients.has(userId);
    }
    getClientByUserId(userId) {
        return this.connectedClients.get(userId);
    }
};
exports.NotificationsGateway = NotificationsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], NotificationsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], NotificationsGateway.prototype, "handleSubscribe", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('unsubscribe'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], NotificationsGateway.prototype, "handleUnsubscribe", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('ping'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], NotificationsGateway.prototype, "handlePing", null);
exports.NotificationsGateway = NotificationsGateway = NotificationsGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: [
                process.env.FRONTEND_URL || 'http://localhost:3001',
                'http://localhost:3000',
                'http://localhost:3001',
            ],
            credentials: true,
        },
        namespace: '/notifications',
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService])
], NotificationsGateway);
//# sourceMappingURL=notifications.gateway.js.map