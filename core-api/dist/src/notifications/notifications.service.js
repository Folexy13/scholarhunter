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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const notifications_gateway_1 = require("./notifications.gateway");
let NotificationsService = class NotificationsService {
    notificationsGateway;
    constructor(notificationsGateway) {
        this.notificationsGateway = notificationsGateway;
    }
    notifyApplicationStatusUpdate(userId, applicationId, status, data) {
        this.notificationsGateway.emitApplicationStatusUpdate(userId, applicationId, status, data);
    }
    notifyNewScholarshipMatch(userId, scholarship, matchScore) {
        this.notificationsGateway.emitNewScholarshipMatch(userId, scholarship, matchScore);
    }
    notifyDocumentGenerationComplete(userId, documentId, documentType, success, data) {
        this.notificationsGateway.emitDocumentGenerationComplete(userId, documentId, documentType, success, data);
    }
    notifyUser(userId, type, title, message, data) {
        this.notificationsGateway.emitNotification(userId, type, title, message, data);
    }
    streamLLMChunk(userId, sessionId, chunk, metadata) {
        this.notificationsGateway.emitLLMStreamChunk(userId, sessionId, chunk, metadata);
    }
    streamLLMComplete(userId, sessionId, fullResponse, metadata) {
        this.notificationsGateway.emitLLMStreamComplete(userId, sessionId, fullResponse, metadata);
    }
    streamLLMError(userId, sessionId, error, metadata) {
        this.notificationsGateway.emitLLMStreamError(userId, sessionId, error, metadata);
    }
    broadcastNotification(type, title, message, data) {
        this.notificationsGateway.broadcastNotification(type, title, message, data);
    }
    broadcastToRole(role, type, title, message, data) {
        this.notificationsGateway.broadcastToRole(role, type, title, message, data);
    }
    isUserConnected(userId) {
        return this.notificationsGateway.isUserConnected(userId);
    }
    getConnectedClientsCount() {
        return this.notificationsGateway.getConnectedClientsCount();
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [notifications_gateway_1.NotificationsGateway])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map