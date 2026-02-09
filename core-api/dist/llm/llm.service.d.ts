import { ConfigService } from '@nestjs/config';
import { NotificationsService } from '../notifications/notifications.service';
export declare class LLMService {
    private configService;
    private notificationsService;
    private readonly llmServiceUrl;
    private readonly apiKey;
    constructor(configService: ConfigService, notificationsService: NotificationsService);
    private getHeaders;
    streamChat(userId: string, sessionId: string, message: string, context?: Record<string, unknown>): Promise<void>;
    streamCVParse(userId: string, sessionId: string, cvContent: string): Promise<void>;
    streamDocumentGeneration(userId: string, sessionId: string, documentType: string, data: Record<string, unknown>): Promise<void>;
    streamInterviewPrep(userId: string, sessionId: string, question: string, context?: Record<string, unknown>): Promise<void>;
    request<T>(endpoint: string, data: Record<string, unknown>): Promise<T>;
    discoverScholarships(count?: number): Promise<{
        scholarships: Array<{
            title: string;
            provider: string;
            description: string;
            amount: number;
            currency: string;
            deadline: string;
            country: string;
            educationLevel: string;
            fieldOfStudy: string;
            eligibilityCriteria: string[];
            applicationUrl: string;
            isActive: boolean;
        }>;
        count: number;
    }>;
}
