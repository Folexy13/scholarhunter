import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
export declare class DocumentsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, createDocumentDto: CreateDocumentDto): Promise<{
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
    findAll(userId?: string): Promise<({
        user: {
            email: string;
            firstName: string | null;
            lastName: string | null;
            id: string;
        };
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
    findOne(id: string, userId?: string): Promise<{
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
    update(id: string, userId: string, updateDocumentDto: UpdateDocumentDto): Promise<{
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
    remove(id: string, userId: string): Promise<{
        message: string;
    }>;
    getUserDocuments(userId: string): Promise<({
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
}
