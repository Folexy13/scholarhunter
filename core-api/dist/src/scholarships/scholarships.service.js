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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScholarshipsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ScholarshipsService = class ScholarshipsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createScholarshipDto) {
        return this.prisma.scholarship.create({
            data: createScholarshipDto,
        });
    }
    async findAll(filters) {
        const where = {};
        if (filters?.isActive !== undefined) {
            where.isActive = filters.isActive;
        }
        if (filters?.country) {
            where.country = { has: filters.country };
        }
        if (filters?.category) {
            where.category = { has: filters.category };
        }
        if (filters?.fieldOfStudy) {
            where.fieldOfStudy = { has: filters.fieldOfStudy };
        }
        if (filters?.degreeLevel) {
            where.degreeLevel = { has: filters.degreeLevel };
        }
        const scholarships = await this.prisma.scholarship.findMany({
            where,
            orderBy: { deadline: 'asc' },
        });
        if (filters && 'randomize' in filters && filters['randomize']) {
            return this.shuffleArray(scholarships);
        }
        return scholarships;
    }
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    async findOne(id) {
        const scholarship = await this.prisma.scholarship.findUnique({
            where: { id },
            include: {
                applications: {
                    select: {
                        id: true,
                        status: true,
                        matchScore: true,
                        user: {
                            select: {
                                id: true,
                                email: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
        });
        if (!scholarship) {
            throw new common_1.NotFoundException(`Scholarship with ID ${id} not found`);
        }
        return scholarship;
    }
    async update(id, updateScholarshipDto) {
        const scholarship = await this.prisma.scholarship.findUnique({
            where: { id },
        });
        if (!scholarship) {
            throw new common_1.NotFoundException(`Scholarship with ID ${id} not found`);
        }
        return this.prisma.scholarship.update({
            where: { id },
            data: updateScholarshipDto,
        });
    }
    async remove(id) {
        const scholarship = await this.prisma.scholarship.findUnique({
            where: { id },
        });
        if (!scholarship) {
            throw new common_1.NotFoundException(`Scholarship with ID ${id} not found`);
        }
        await this.prisma.scholarship.delete({ where: { id } });
        return { message: 'Scholarship deleted successfully' };
    }
    async search(query) {
        return this.prisma.scholarship.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { organization: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } },
                ],
                isActive: true,
            },
            orderBy: { deadline: 'asc' },
        });
    }
    async removeAll() {
        const result = await this.prisma.scholarship.deleteMany({});
        return {
            message: `Successfully deleted ${result.count} scholarships`,
            count: result.count,
        };
    }
};
exports.ScholarshipsService = ScholarshipsService;
exports.ScholarshipsService = ScholarshipsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ScholarshipsService);
//# sourceMappingURL=scholarships.service.js.map