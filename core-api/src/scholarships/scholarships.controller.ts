import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ScholarshipsService } from './scholarships.service';
import { CreateScholarshipDto } from './dto/create-scholarship.dto';
import { UpdateScholarshipDto } from './dto/update-scholarship.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ScholarshipSeederService } from './scholarships-seeder.service';

@Controller('scholarships')
export class ScholarshipsController {
  constructor(
    private readonly scholarshipsService: ScholarshipsService,
    private readonly seederService: ScholarshipSeederService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() createScholarshipDto: CreateScholarshipDto) {
    return this.scholarshipsService.create(createScholarshipDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Query('isActive') isActive?: string,
    @Query('country') country?: string,
    @Query('category') category?: string,
    @Query('fieldOfStudy') fieldOfStudy?: string,
    @Query('degreeLevel') degreeLevel?: string,
  ) {
    const filters: any = {};
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (country) filters.country = country;
    if (category) filters.category = category;
    if (fieldOfStudy) filters.fieldOfStudy = fieldOfStudy;
    if (degreeLevel) filters.degreeLevel = degreeLevel;

    return this.scholarshipsService.findAll(filters);
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  search(@Query('q') query: string) {
    return this.scholarshipsService.search(query);
  }

  @Get('matches')
  @UseGuards(JwtAuthGuard)
  getMatches() {
    // Return active scholarships in randomized order
    // TODO: Implement AI-based matching based on user profile
    return this.scholarshipsService.findAll({
      isActive: true,
      randomize: true,
    } as any);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.scholarshipsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateScholarshipDto: UpdateScholarshipDto,
  ) {
    return this.scholarshipsService.update(id, updateScholarshipDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.scholarshipsService.remove(id);
  }

  @Post('admin/refresh')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async refreshScholarships(@Query('count') count?: string) {
    const scholarshipCount = count ? parseInt(count, 10) : 10;
    return this.seederService.refreshScholarships(scholarshipCount);
  }

  @Delete('admin/clear-all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async clearAllScholarships() {
    return this.scholarshipsService.removeAll();
  }
}
