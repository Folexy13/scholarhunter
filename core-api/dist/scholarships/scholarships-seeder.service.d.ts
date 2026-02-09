import { PrismaService } from '../prisma/prisma.service';
import { LLMService } from '../llm/llm.service';
export declare class ScholarshipSeederService {
    private prisma;
    private llmService;
    private readonly logger;
    constructor(prisma: PrismaService, llmService: LLMService);
    private updateDeadlineTo2026;
    private parseAmount;
    seedScholarships(count?: number): Promise<any[]>;
    discoverScholarshipsCron(): Promise<void>;
    seedIfEmpty(): Promise<void>;
    refreshScholarships(count?: number): Promise<{
        message: string;
        newCount: number;
        deletedCount: number;
    }>;
}
