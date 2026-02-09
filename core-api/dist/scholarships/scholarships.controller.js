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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScholarshipsController = void 0;
const common_1 = require("@nestjs/common");
const scholarships_service_1 = require("./scholarships.service");
const create_scholarship_dto_1 = require("./dto/create-scholarship.dto");
const update_scholarship_dto_1 = require("./dto/update-scholarship.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const scholarships_seeder_service_1 = require("./scholarships-seeder.service");
let ScholarshipsController = class ScholarshipsController {
    scholarshipsService;
    seederService;
    constructor(scholarshipsService, seederService) {
        this.scholarshipsService = scholarshipsService;
        this.seederService = seederService;
    }
    create(createScholarshipDto) {
        return this.scholarshipsService.create(createScholarshipDto);
    }
    findAll(isActive, country, category, fieldOfStudy, degreeLevel) {
        const filters = {};
        if (isActive !== undefined)
            filters.isActive = isActive === 'true';
        if (country)
            filters.country = country;
        if (category)
            filters.category = category;
        if (fieldOfStudy)
            filters.fieldOfStudy = fieldOfStudy;
        if (degreeLevel)
            filters.degreeLevel = degreeLevel;
        return this.scholarshipsService.findAll(filters);
    }
    search(query) {
        return this.scholarshipsService.search(query);
    }
    getMatches() {
        return this.scholarshipsService.findAll({
            isActive: true,
            randomize: true,
        });
    }
    findOne(id) {
        return this.scholarshipsService.findOne(id);
    }
    update(id, updateScholarshipDto) {
        return this.scholarshipsService.update(id, updateScholarshipDto);
    }
    remove(id) {
        return this.scholarshipsService.remove(id);
    }
    async refreshScholarships(count) {
        const scholarshipCount = count ? parseInt(count, 10) : 10;
        return this.seederService.refreshScholarships(scholarshipCount);
    }
    async clearAllScholarships() {
        return this.scholarshipsService.removeAll();
    }
};
exports.ScholarshipsController = ScholarshipsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_scholarship_dto_1.CreateScholarshipDto]),
    __metadata("design:returntype", void 0)
], ScholarshipsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Query)('isActive')),
    __param(1, (0, common_1.Query)('country')),
    __param(2, (0, common_1.Query)('category')),
    __param(3, (0, common_1.Query)('fieldOfStudy')),
    __param(4, (0, common_1.Query)('degreeLevel')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], ScholarshipsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ScholarshipsController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('matches'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ScholarshipsController.prototype, "getMatches", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ScholarshipsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_scholarship_dto_1.UpdateScholarshipDto]),
    __metadata("design:returntype", void 0)
], ScholarshipsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ScholarshipsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('admin/refresh'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Query)('count')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ScholarshipsController.prototype, "refreshScholarships", null);
__decorate([
    (0, common_1.Delete)('admin/clear-all'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScholarshipsController.prototype, "clearAllScholarships", null);
exports.ScholarshipsController = ScholarshipsController = __decorate([
    (0, common_1.Controller)('scholarships'),
    __metadata("design:paramtypes", [scholarships_service_1.ScholarshipsService,
        scholarships_seeder_service_1.ScholarshipSeederService])
], ScholarshipsController);
//# sourceMappingURL=scholarships.controller.js.map