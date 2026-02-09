import { PrismaService } from '../prisma/prisma.service';
import { CreateScholarshipDto } from './dto/create-scholarship.dto';
import { UpdateScholarshipDto } from './dto/update-scholarship.dto';
export declare class ScholarshipsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createScholarshipDto: CreateScholarshipDto): Promise<{
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
    }>;
    findAll(filters?: {
        isActive?: boolean;
        country?: string;
        category?: string;
        fieldOfStudy?: string;
        degreeLevel?: string;
    }): Promise<{
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
    }[]>;
    private shuffleArray;
    findOne(id: string): Promise<{
        applications: {
            user: {
                email: string;
                firstName: string | null;
                lastName: string | null;
                id: string;
            };
            id: string;
            status: import("@prisma/client").$Enums.ApplicationStatus;
            matchScore: number | null;
        }[];
    } & {
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
    }>;
    update(id: string, updateScholarshipDto: UpdateScholarshipDto): Promise<{
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
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
    search(query: string): Promise<{
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
    }[]>;
    removeAll(): Promise<{
        message: string;
        count: number;
    }>;
}
