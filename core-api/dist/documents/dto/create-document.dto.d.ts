import { DocumentType } from '@prisma/client';
export declare class CreateDocumentDto {
    applicationId?: string;
    type: DocumentType;
    title: string;
    content: string;
    wordCount?: number;
    version?: number;
    isGenerated?: boolean;
    metadata?: any;
}
