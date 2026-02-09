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
exports.ApplicationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
let ApplicationsService = class ApplicationsService {
    prisma;
    notificationsService;
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    async create(userId, createApplicationDto) {
        return this.prisma.application.create({
            data: {
                userId,
                ...createApplicationDto,
            },
            include: {
                scholarship: true,
                documents: true,
            },
        });
    }
    async findAll(userId) {
        const where = userId ? { userId } : {};
        return this.prisma.application.findMany({
            where,
            include: {
                scholarship: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                documents: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id, userId) {
        const application = await this.prisma.application.findUnique({
            where: { id },
            include: {
                scholarship: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                documents: true,
            },
        });
        if (!application) {
            throw new common_1.NotFoundException(`Application with ID ${id} not found`);
        }
        if (userId && application.userId !== userId) {
            throw new common_1.ForbiddenException('You do not have access to this application');
        }
        return application;
    }
    async update(id, userId, updateApplicationDto) {
        const application = await this.prisma.application.findUnique({
            where: { id },
        });
        if (!application) {
            throw new common_1.NotFoundException(`Application with ID ${id} not found`);
        }
        if (application.userId !== userId) {
            throw new common_1.ForbiddenException('You do not have access to this application');
        }
        const updatedApplication = await this.prisma.application.update({
            where: { id },
            data: updateApplicationDto,
            include: {
                scholarship: true,
                documents: true,
            },
        });
        if (updateApplicationDto.status &&
            updateApplicationDto.status !== application.status) {
            this.notificationsService.notifyApplicationStatusUpdate(userId, id, updateApplicationDto.status, {
                scholarshipName: updatedApplication.scholarship?.name,
                previousStatus: application.status,
            });
        }
        return updatedApplication;
    }
    async remove(id, userId) {
        const application = await this.prisma.application.findUnique({
            where: { id },
        });
        if (!application) {
            throw new common_1.NotFoundException(`Application with ID ${id} not found`);
        }
        if (application.userId !== userId) {
            throw new common_1.ForbiddenException('You do not have access to this application');
        }
        await this.prisma.application.delete({ where: { id } });
        return { message: 'Application deleted successfully' };
    }
    async getUserApplications(userId) {
        return this.prisma.application.findMany({
            where: { userId },
            include: {
                scholarship: true,
                documents: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.ApplicationsService = ApplicationsService;
exports.ApplicationsService = ApplicationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], ApplicationsService);
//# sourceMappingURL=applications.service.js.map