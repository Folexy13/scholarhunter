import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
export declare class DocumentsController {
    private readonly documentsService;
    constructor(documentsService: DocumentsService);
    create(user: any, createDocumentDto: CreateDocumentDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        type: import("@prisma/client").$Enums.DocumentType;
        applicationId: string | null;
        content: string;
        wordCount: number | null;
        version: number;
        isGenerated: boolean;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    findAll(user: any): Promise<({
        application: {
            scholarship: {
                id: string;
                name: string;
            };
            id: string;
            status: import("@prisma/client").$Enums.ApplicationStatus;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        type: import("@prisma/client").$Enums.DocumentType;
        applicationId: string | null;
        content: string;
        wordCount: number | null;
        version: number;
        isGenerated: boolean;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
    findOne(id: string, user: any): Promise<{
        user: {
            email: string;
            firstName: string | null;
            lastName: string | null;
            id: string;
        };
        application: {
            scholarship: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                fieldOfStudy: string[];
                category: string[];
                description: string;
                organization: string;
                amount: number | null;
                currency: string;
                deadline: Date;
                eligibility: import("@prisma/client/runtime/library").JsonValue;
                requirements: string[];
                applicationUrl: string;
                country: string[];
                degreeLevel: string[];
            };
            id: string;
            status: import("@prisma/client").$Enums.ApplicationStatus;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        type: import("@prisma/client").$Enums.DocumentType;
        applicationId: string | null;
        content: string;
        wordCount: number | null;
        version: number;
        isGenerated: boolean;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    update(id: string, user: any, updateDocumentDto: UpdateDocumentDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        type: import("@prisma/client").$Enums.DocumentType;
        applicationId: string | null;
        content: string;
        wordCount: number | null;
        version: number;
        isGenerated: boolean;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    remove(id: string, user: any): Promise<{
        message: string;
    }>;
}
