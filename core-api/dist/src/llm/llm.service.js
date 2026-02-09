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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const notifications_service_1 = require("../notifications/notifications.service");
const axios_1 = __importDefault(require("axios"));
let LLMService = class LLMService {
    configService;
    notificationsService;
    llmServiceUrl;
    apiKey;
    constructor(configService, notificationsService) {
        this.configService = configService;
        this.notificationsService = notificationsService;
        this.llmServiceUrl =
            this.configService.get('LLM_SERVICE_URL') ||
                'http://llm-service:8000';
        this.apiKey = this.configService.get('CORE_API_SECRET') || '';
    }
    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
        };
    }
    async streamChat(userId, sessionId, message, context) {
        console.log(`Starting chat stream for user ${userId}, session ${sessionId}`);
        try {
            console.log(`Calling LLM service at ${this.llmServiceUrl}/api/llm/chat/stream`);
            const response = await axios_1.default.post(`${this.llmServiceUrl}/api/llm/chat/stream`, {
                message,
                context,
            }, {
                responseType: 'stream',
                headers: this.getHeaders(),
            });
            console.log(`LLM service responded, setting up stream handlers`);
            let fullResponse = '';
            response.data.on('data', (chunk) => {
                const chunkStr = chunk.toString();
                const lines = chunkStr.split('\n').filter((line) => line.trim());
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            console.log(`Stream complete, total response length: ${fullResponse.length}`);
                            this.notificationsService.streamLLMComplete(userId, sessionId, fullResponse, { context });
                        }
                        else {
                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.error) {
                                    console.error(`LLM service error: ${parsed.error}`);
                                    this.notificationsService.streamLLMError(userId, sessionId, parsed.error, { context });
                                }
                                else {
                                    const content = parsed.content || '';
                                    if (content) {
                                        fullResponse += content;
                                        this.notificationsService.streamLLMChunk(userId, sessionId, content, { context });
                                    }
                                }
                            }
                            catch (e) {
                                console.warn(`Failed to parse chunk: ${data}`);
                            }
                        }
                    }
                }
            });
            response.data.on('error', (error) => {
                console.error(`Stream error: ${error.message}`);
                this.notificationsService.streamLLMError(userId, sessionId, error.message, { context });
            });
            response.data.on('end', () => {
                console.log(`Stream ended, response length: ${fullResponse.length}`);
                if (fullResponse && !fullResponse.includes('[DONE]')) {
                    this.notificationsService.streamLLMComplete(userId, sessionId, fullResponse, { context });
                }
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`LLM service error: ${errorMessage}`);
            this.notificationsService.streamLLMError(userId, sessionId, errorMessage, { context });
            throw error;
        }
    }
    async streamCVParse(userId, sessionId, cvContent) {
        try {
            const response = await axios_1.default.post(`${this.llmServiceUrl}/api/cv-parser/parse`, {
                cv_content: cvContent,
                stream: true,
            }, {
                responseType: 'stream',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            let fullResponse = '';
            response.data.on('data', (chunk) => {
                const chunkStr = chunk.toString();
                fullResponse += chunkStr;
                this.notificationsService.streamLLMChunk(userId, sessionId, chunkStr, { type: 'cv-parse' });
            });
            response.data.on('error', (error) => {
                console.error(`CV parse stream error: ${error.message}`);
                this.notificationsService.streamLLMError(userId, sessionId, error.message, { type: 'cv-parse' });
            });
            response.data.on('end', () => {
                this.notificationsService.streamLLMComplete(userId, sessionId, fullResponse, { type: 'cv-parse' });
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`CV parse error: ${errorMessage}`);
            this.notificationsService.streamLLMError(userId, sessionId, errorMessage, { type: 'cv-parse' });
            throw error;
        }
    }
    async streamDocumentGeneration(userId, sessionId, documentType, data) {
        try {
            const response = await axios_1.default.post(`${this.llmServiceUrl}/api/document-generator/generate`, {
                document_type: documentType,
                data,
                stream: true,
            }, {
                responseType: 'stream',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            let fullResponse = '';
            response.data.on('data', (chunk) => {
                const chunkStr = chunk.toString();
                fullResponse += chunkStr;
                this.notificationsService.streamLLMChunk(userId, sessionId, chunkStr, { type: 'document-generation', documentType });
            });
            response.data.on('error', (error) => {
                console.error(`Document generation stream error: ${error.message}`);
                this.notificationsService.streamLLMError(userId, sessionId, error.message, { type: 'document-generation', documentType });
            });
            response.data.on('end', () => {
                this.notificationsService.streamLLMComplete(userId, sessionId, fullResponse, { type: 'document-generation', documentType });
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Document generation error: ${errorMessage}`);
            this.notificationsService.streamLLMError(userId, sessionId, errorMessage, { type: 'document-generation', documentType });
            throw error;
        }
    }
    async streamInterviewPrep(userId, sessionId, question, context) {
        try {
            const response = await axios_1.default.post(`${this.llmServiceUrl}/api/interview/practice`, {
                question,
                context,
                stream: true,
            }, {
                responseType: 'stream',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            let fullResponse = '';
            response.data.on('data', (chunk) => {
                const chunkStr = chunk.toString();
                fullResponse += chunkStr;
                this.notificationsService.streamLLMChunk(userId, sessionId, chunkStr, { type: 'interview-prep', ...context });
            });
            response.data.on('error', (error) => {
                console.error(`Interview prep stream error: ${error.message}`);
                this.notificationsService.streamLLMError(userId, sessionId, error.message, { type: 'interview-prep', ...context });
            });
            response.data.on('end', () => {
                this.notificationsService.streamLLMComplete(userId, sessionId, fullResponse, { type: 'interview-prep', ...context });
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Interview prep error: ${errorMessage}`);
            this.notificationsService.streamLLMError(userId, sessionId, errorMessage, { type: 'interview-prep', ...context });
            throw error;
        }
    }
    async request(endpoint, data) {
        try {
            const response = await axios_1.default.post(`${this.llmServiceUrl}${endpoint}`, data, {
                headers: this.getHeaders(),
            });
            return response.data;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`LLM service request error: ${errorMessage}`);
            throw error;
        }
    }
    async discoverScholarships(count = 10) {
        try {
            console.log(`Discovering ${count} scholarships from LLM service`);
            const response = await this.request('/api/llm/scholarships/discover', { count });
            console.log(`Discovered ${response.count} scholarships`);
            return response;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Scholarship discovery error: ${errorMessage}`);
            throw error;
        }
    }
};
exports.LLMService = LLMService;
exports.LLMService = LLMService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        notifications_service_1.NotificationsService])
], LLMService);
//# sourceMappingURL=llm.service.js.map