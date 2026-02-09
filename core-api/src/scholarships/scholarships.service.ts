import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScholarshipDto } from './dto/create-scholarship.dto';
import { UpdateScholarshipDto } from './dto/update-scholarship.dto';

@Injectable()
export class ScholarshipsService {
  constructor(private prisma: PrismaService) {}

  async create(createScholarshipDto: CreateScholarshipDto) {
    return this.prisma.scholarship.create({
      data: createScholarshipDto,
    });
  }

  async findAll(filters?: {
    isActive?: boolean;
    country?: string;
    category?: string;
    fieldOfStudy?: string;
    degreeLevel?: string;
  }) {
    const where: any = {};

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

    // Randomize if requested
    if (filters && 'randomize' in filters && filters['randomize']) {
      return this.shuffleArray(scholarships);
    }

    return scholarships;
  }

  /**
   * Fisher-Yates shuffle algorithm to randomize array
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  async findOne(id: string) {
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
      throw new NotFoundException(`Scholarship with ID ${id} not found`);
    }

    return scholarship;
  }

  async update(id: string, updateScholarshipDto: UpdateScholarshipDto) {
    const scholarship = await this.prisma.scholarship.findUnique({
      where: { id },
    });

    if (!scholarship) {
      throw new NotFoundException(`Scholarship with ID ${id} not found`);
    }

    return this.prisma.scholarship.update({
      where: { id },
      data: updateScholarshipDto,
    });
  }

  async remove(id: string) {
    const scholarship = await this.prisma.scholarship.findUnique({
      where: { id },
    });

    if (!scholarship) {
      throw new NotFoundException(`Scholarship with ID ${id} not found`);
    }

    await this.prisma.scholarship.delete({ where: { id } });

    return { message: 'Scholarship deleted successfully' };
  }

  async search(query: string) {
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
}
