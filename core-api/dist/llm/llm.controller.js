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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMController = void 0;
const common_1 = require("@nestjs/common");
const llm_service_1 = require("./llm.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const uuid_1 = require("uuid");
let LLMController = class LLMController {
    llmService;
    constructor(llmService) {
        this.llmService = llmService;
    }
    async chat(user, body) {
        const sessionId = (0, uuid_1.v4)();
        this.llmService
            .streamChat(user.id, sessionId, body.message, body.context)
            .catch((error) => {
            console.error('Chat stream error:', error);
        });
        return {
            sessionId,
            message: 'Chat stream started. Listen for WebSocket events.',
        };
    }
    async parseCv(user, body) {
        const sessionId = (0, uuid_1.v4)();
        this.llmService
            .streamCVParse(user.id, sessionId, body.cvContent)
            .catch((error) => {
            console.error('CV parse stream error:', error);
        });
        return {
            sessionId,
            message: 'CV parsing stream started. Listen for WebSocket events.',
        };
    }
    async generateDocument(user, body) {
        const sessionId = (0, uuid_1.v4)();
        this.llmService
            .streamDocumentGeneration(user.id, sessionId, body.documentType, body.data)
            .catch((error) => {
            console.error('Document generation stream error:', error);
        });
        return {
            sessionId,
            message: 'Document generation stream started. Listen for WebSocket events.',
        };
    }
    async interviewPrep(user, body) {
        const sessionId = (0, uuid_1.v4)();
        this.llmService
            .streamInterviewPrep(user.id, sessionId, body.question, body.context)
            .catch((error) => {
            console.error('Interview prep stream error:', error);
        });
        return {
            sessionId,
            message: 'Interview prep stream started. Listen for WebSocket events.',
        };
    }
};
exports.LLMController = LLMController;
__decorate([
    (0, common_1.Post)('chat'),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], LLMController.prototype, "chat", null);
__decorate([
    (0, common_1.Post)('cv-parse'),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], LLMController.prototype, "parseCv", null);
__decorate([
    (0, common_1.Post)('generate-document'),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], LLMController.prototype, "generateDocument", null);
__decorate([
    (0, common_1.Post)('interview-prep'),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], LLMController.prototype, "interviewPrep", null);
exports.LLMController = LLMController = __decorate([
    (0, common_1.Controller)('llm'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [llm_service_1.LLMService])
], LLMController);
//# sourceMappingURL=llm.controller.js.map