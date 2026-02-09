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
exports.DocumentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DocumentsService = class DocumentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, createDocumentDto) {
        return this.prisma.document.create({
            data: {
                userId,
                ...createDocumentDto,
            },
        });
    }
    async findAll(userId) {
        const where = userId ? { userId } : {};
        return this.prisma.document.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                application: {
                    select: {
                        id: true,
                        status: true,
                        scholarship: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id, userId) {
        const document = await this.prisma.document.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                application: {
                    select: {
                        id: true,
                        status: true,
                        scholarship: true,
                    },
                },
            },
        });
        if (!document) {
            throw new common_1.NotFoundException(`Document with ID ${id} not found`);
        }
        if (userId && document.userId !== userId) {
            throw new common_1.ForbiddenException('You do not have access to this document');
        }
        return document;
    }
    async update(id, userId, updateDocumentDto) {
        const document = await this.prisma.document.findUnique({
            where: { id },
        });
        if (!document) {
            throw new common_1.NotFoundException(`Document with ID ${id} not found`);
        }
        if (document.userId !== userId) {
            throw new common_1.ForbiddenException('You do not have access to this document');
        }
        return this.prisma.document.update({
            where: { id },
            data: updateDocumentDto,
        });
    }
    async remove(id, userId) {
        const document = await this.prisma.document.findUnique({
            where: { id },
        });
        if (!document) {
            throw new common_1.NotFoundException(`Document with ID ${id} not found`);
        }
        if (document.userId !== userId) {
            throw new common_1.ForbiddenException('You do not have access to this document');
        }
        await this.prisma.document.delete({ where: { id } });
        return { message: 'Document deleted successfully' };
    }
    async getUserDocuments(userId) {
        return this.prisma.document.findMany({
            where: { userId },
            include: {
                application: {
                    select: {
                        id: true,
                        status: true,
                        scholarship: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.DocumentsService = DocumentsService;
exports.DocumentsService = DocumentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DocumentsService);
//# sourceMappingURL=documents.service.js.map