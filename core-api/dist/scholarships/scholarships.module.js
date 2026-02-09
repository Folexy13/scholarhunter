"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScholarshipsModule = void 0;
const common_1 = require("@nestjs/common");
const scholarships_service_1 = require("./scholarships.service");
const scholarships_controller_1 = require("./scholarships.controller");
const scholarships_seeder_service_1 = require("./scholarships-seeder.service");
const prisma_module_1 = require("../prisma/prisma.module");
const llm_module_1 = require("../llm/llm.module");
let ScholarshipsModule = class ScholarshipsModule {
};
exports.ScholarshipsModule = ScholarshipsModule;
exports.ScholarshipsModule = ScholarshipsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, llm_module_1.LLMModule],
        controllers: [scholarships_controller_1.ScholarshipsController],
        providers: [scholarships_service_1.ScholarshipsService, scholarships_seeder_service_1.ScholarshipSeederService],
        exports: [scholarships_service_1.ScholarshipsService, scholarships_seeder_service_1.ScholarshipSeederService],
    })
], ScholarshipsModule);
//# sourceMappingURL=scholarships.module.js.map