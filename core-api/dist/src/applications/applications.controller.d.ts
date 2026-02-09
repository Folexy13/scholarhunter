import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
export declare class ApplicationsController {
    private readonly applicationsService;
    constructor(applicationsService: ApplicationsService);
    create(user: any, createApplicationDto: CreateApplicationDto): Promise<{
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
        documents: {
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
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        scholarshipId: string;
        status: import("@prisma/client").$Enums.ApplicationStatus;
        matchScore: number | null;
        matchRationale: import("@prisma/client/runtime/library").JsonValue | null;
        priority: import("@prisma/client").$Enums.Priority;
        notes: string | null;
        submittedAt: Date | null;
    }>;
    findAll(user: any): Promise<({
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
        documents: {
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
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        scholarshipId: string;
        status: import("@prisma/client").$Enums.ApplicationStatus;
        matchScore: number | null;
        matchRationale: import("@prisma/client/runtime/library").JsonValue | null;
        priority: import("@prisma/client").$Enums.Priority;
        notes: string | null;
        submittedAt: Date | null;
    })[]>;
    findOne(id: string, user: any): Promise<{
        user: {
            email: string;
            firstName: string | null;
            lastName: string | null;
            id: string;
        };
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
        documents: {
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
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        scholarshipId: string;
        status: import("@prisma/client").$Enums.ApplicationStatus;
        matchScore: number | null;
        matchRationale: import("@prisma/client/runtime/library").JsonValue | null;
        priority: import("@prisma/client").$Enums.Priority;
        notes: string | null;
        submittedAt: Date | null;
    }>;
    update(id: string, user: any, updateApplicationDto: UpdateApplicationDto): Promise<{
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
        documents: {
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
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        scholarshipId: string;
        status: import("@prisma/client").$Enums.ApplicationStatus;
        matchScore: number | null;
        matchRationale: import("@prisma/client/runtime/library").JsonValue | null;
        priority: import("@prisma/client").$Enums.Priority;
        notes: string | null;
        submittedAt: Date | null;
    }>;
    remove(id: string, user: any): Promise<{
        message: string;
    }>;
}
