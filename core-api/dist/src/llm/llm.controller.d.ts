import { LLMService } from './llm.service';
export declare class LLMController {
    private readonly llmService;
    constructor(llmService: LLMService);
    chat(user: {
        id: string;
    }, body: {
        message: string;
        context?: Record<string, unknown>;
    }): Promise<{
        sessionId: string;
        message: string;
    }>;
    parseCv(user: {
        id: string;
    }, body: {
        cvContent: string;
    }): Promise<{
        sessionId: string;
        message: string;
    }>;
    generateDocument(user: {
        id: string;
    }, body: {
        documentType: string;
        data: Record<string, unknown>;
    }): Promise<{
        sessionId: string;
        message: string;
    }>;
    interviewPrep(user: {
        id: string;
    }, body: {
        question: string;
        context?: Record<string, unknown>;
    }): Promise<{
        sessionId: string;
        message: string;
    }>;
}
