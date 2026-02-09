export declare class CreateScholarshipDto {
    name: string;
    organization: string;
    amount?: number;
    currency?: string;
    deadline: string;
    description: string;
    eligibility: any;
    requirements: string[];
    applicationUrl: string;
    category: string[];
    country: string[];
    fieldOfStudy: string[];
    degreeLevel: string[];
    isActive?: boolean;
}
