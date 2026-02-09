"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateScholarshipDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_scholarship_dto_1 = require("./create-scholarship.dto");
class UpdateScholarshipDto extends (0, mapped_types_1.PartialType)(create_scholarship_dto_1.CreateScholarshipDto) {
}
exports.UpdateScholarshipDto = UpdateScholarshipDto;
//# sourceMappingURL=update-scholarship.dto.js.map