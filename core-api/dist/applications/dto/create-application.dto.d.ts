import { ApplicationStatus, Priority } from '@prisma/client';
export declare class CreateApplicationDto {
    scholarshipId: string;
    status?: ApplicationStatus;
    matchScore?: number;
    matchRationale?: any;
    priority?: Priority;
    notes?: string;
}
