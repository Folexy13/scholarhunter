"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ScholarshipSeederService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScholarshipSeederService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const llm_service_1 = require("../llm/llm.service");
let ScholarshipSeederService = ScholarshipSeederService_1 = class ScholarshipSeederService {
    prisma;
    llmService;
    logger = new common_1.Logger(ScholarshipSeederService_1.name);
    constructor(prisma, llmService) {
        this.prisma = prisma;
        this.llmService = llmService;
    }
    updateDeadlineTo2026(oldDeadline) {
        const date = new Date(oldDeadline);
        const month = date.getMonth();
        const day = date.getDate();
        const year = month < 6 ? 2027 : 2026;
        return new Date(year, month, day);
    }
    parseAmount(amount) {
        if (typeof amount === 'number') {
            return amount;
        }
        if (typeof amount === 'string') {
            const match = amount.match(/[\d,]+/);
            if (match) {
                return parseFloat(match[0].replace(/,/g, ''));
            }
        }
        return null;
    }
    async seedScholarships(count = 10) {
        try {
            this.logger.log(`Discovering ${count} real scholarships from LLM service...`);
            const response = await this.llmService.discoverScholarships(count);
            if (!response || !response.scholarships || response.scholarships.length === 0) {
                this.logger.warn('No scholarships discovered from LLM service');
                return [];
            }
            this.logger.log(`Discovered ${response.scholarships.length} scholarships. Checking for duplicates...`);
            let savedCount = 0;
            let duplicateCount = 0;
            for (const scholarship of response.scholarships) {
                try {
                    const nameWords = scholarship.title.split(' ').filter(w => w.length > 2);
                    const orgWords = scholarship.provider.split(' ').filter(w => w.length > 2);
                    const existing = await this.prisma.scholarship.findFirst({
                        where: {
                            OR: [
                                {
                                    name: scholarship.title,
                                    organization: scholarship.provider,
                                },
                                {
                                    name: scholarship.title,
                                    organization: {
                                        contains: orgWords.slice(0, 3).join(' '),
                                        mode: 'insensitive',
                                    },
                                },
                                {
                                    name: {
                                        contains: nameWords.slice(0, 3).join(' '),
                                        mode: 'insensitive',
                                    },
                                    organization: scholarship.provider,
                                },
                                {
                                    name: {
                                        contains: nameWords.slice(0, 3).join(' '),
                                        mode: 'insensitive',
                                    },
                                    organization: {
                                        contains: orgWords.slice(0, 3).join(' '),
                                        mode: 'insensitive',
                                    },
                                },
                            ],
                        },
                    });
                    if (existing) {
                        this.logger.debug(`Duplicate scholarship found: ${scholarship.title} from ${scholarship.provider} (matches existing: ${existing.name} from ${existing.organization})`);
                        duplicateCount++;
                        continue;
                    }
                    const originalDeadline = new Date(scholarship.deadline);
                    const updatedDeadline = originalDeadline < new Date()
                        ? this.updateDeadlineTo2026(scholarship.deadline)
                        : originalDeadline;
                    const parsedAmount = this.parseAmount(scholarship.amount);
                    await this.prisma.scholarship.create({
                        data: {
                            name: scholarship.title,
                            organization: scholarship.provider,
                            description: scholarship.description,
                            amount: parsedAmount,
                            currency: scholarship.currency,
                            deadline: updatedDeadline,
                            country: [scholarship.country],
                            degreeLevel: [scholarship.educationLevel],
                            fieldOfStudy: [scholarship.fieldOfStudy],
                            eligibility: scholarship.eligibilityCriteria || [],
                            requirements: scholarship.eligibilityCriteria || [],
                            applicationUrl: scholarship.applicationUrl,
                            category: [],
                            isActive: scholarship.isActive !== false,
                        },
                    });
                    savedCount++;
                    this.logger.log(`✓ Saved: ${scholarship.title}`);
                }
                catch (error) {
                    this.logger.error(`Failed to save scholarship: ${scholarship.title}`, error);
                }
            }
            this.logger.log(`Scholarship discovery complete: ${savedCount} new, ${duplicateCount} duplicates skipped`);
            return response.scholarships;
        }
        catch (error) {
            this.logger.error('Error seeding scholarships:', error);
            throw error;
        }
    }
    async discoverScholarshipsCron() {
        this.logger.log('🔍 Running scheduled opportunity discovery...');
        await this.seedScholarships(5);
    }
    async seedIfEmpty() {
        try {
            const count = await this.prisma.scholarship.count();
            if (count === 0) {
                this.logger.log('Database is empty. Seeding with real opportunities...');
                await this.seedScholarships(5);
            }
            else {
                this.logger.log(`Database already has ${count} opportunities`);
            }
        }
        catch (error) {
            this.logger.error('Error checking/seeding opportunities:', error);
        }
    }
    async refreshScholarships(count = 10) {
        this.logger.log(`🔄 Refreshing scholarships: deleting all and discovering ${count} new ones...`);
        const deleteResult = await this.prisma.scholarship.deleteMany({});
        this.logger.log(`🗑️  Deleted ${deleteResult.count} old scholarships`);
        const newScholarships = await this.seedScholarships(count);
        return {
            message: 'Scholarships refreshed successfully',
            deletedCount: deleteResult.count,
            newCount: newScholarships.length,
        };
    }
};
exports.ScholarshipSeederService = ScholarshipSeederService;
__decorate([
    (0, schedule_1.Cron)('*/10 * * * *', {
        name: 'discover-scholarships',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScholarshipSeederService.prototype, "discoverScholarshipsCron", null);
exports.ScholarshipSeederService = ScholarshipSeederService = ScholarshipSeederService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        llm_service_1.LLMService])
], ScholarshipSeederService);
//# sourceMappingURL=scholarships-seeder.service.js.map