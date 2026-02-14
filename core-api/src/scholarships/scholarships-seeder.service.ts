import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LLMService } from '../llm/llm.service';

interface ScholarshipInput {
  title: string;
  provider: string;
  description: string;
  amount: number;
  currency: string;
  deadline: string;
  country: string;
  educationLevel: string;
  fieldOfStudy: string;
  eligibilityCriteria: string[];
  applicationUrl: string;
  isActive: boolean;
}

@Injectable()
export class ScholarshipSeederService implements OnModuleInit {
  private readonly logger = new Logger(ScholarshipSeederService.name);

  constructor(
    private prisma: PrismaService,
    private llmService: LLMService,
  ) {}

  async onModuleInit() {
    // We don't seed on init to avoid blocking startup
    // Seed is called manually or via main.ts
  }

  async seedIfEmpty() {
    const count = await this.prisma.scholarship.count();
    if (count === 0) {
      this.logger.log('Database is empty. Starting initial seed...');
      await this.seedRealScholarships(20);
    } else {
      this.logger.log(`Database already has ${count} opportunities`);
    }
  }

  async seedRealScholarships(count: number = 10) {
    try {
      this.logger.log(`Discovering ${count} real scholarships from LLM service...`);
      const response = await this.llmService.discoverScholarships(count);

      if (!response || !response.scholarships || response.scholarships.length === 0) {
        this.logger.warn('No scholarships discovered from LLM service');
        return;
      }

      this.logger.log(`Discovered ${response.scholarships.length} scholarships. Checking for duplicates...`);

      let createdCount = 0;
      for (const scholarship of response.scholarships as ScholarshipInput[]) {
        try {
          const nameWords = scholarship.title.split(' ').filter((w: string) => w.length > 2);
          const orgWords = scholarship.provider.split(' ').filter((w: string) => w.length > 2);

          const existing = await this.prisma.scholarship.findFirst({
            where: {
              OR: [
                { name: { equals: scholarship.title, mode: 'insensitive' } },
                {
                  AND: [
                    { name: { contains: nameWords.slice(0, 3).join(' '), mode: 'insensitive' } },
                    { organization: { contains: orgWords.slice(0, 3).join(' '), mode: 'insensitive' } },
                  ],
                },
                {
                  AND: [
                    { name: { contains: nameWords.slice(0, 3).join(' '), mode: 'insensitive' } },
                    { organization: { equals: scholarship.provider, mode: 'insensitive' } },
                  ],
                },
                {
                  AND: [
                    { organization: { contains: orgWords.slice(0, 3).join(' '), mode: 'insensitive' } },
                    { name: { contains: nameWords.slice(0, 3).join(' '), mode: 'insensitive' } },
                  ],
                },
              ],
            },
          });

          if (!existing) {
            await this.prisma.scholarship.create({
              data: {
                name: scholarship.title,
                organization: scholarship.provider,
                description: scholarship.description,
                amount: scholarship.amount,
                currency: scholarship.currency,
                deadline: new Date(scholarship.deadline),
                country: [scholarship.country],
                degreeLevel: [scholarship.educationLevel],
                fieldOfStudy: [scholarship.fieldOfStudy],
                eligibility: scholarship.eligibilityCriteria,
                applicationUrl: scholarship.applicationUrl,
                isActive: scholarship.isActive,
              },
            });
            createdCount++;
          } else {
            this.logger.debug(`Duplicate scholarship found: ${scholarship.title} from ${scholarship.provider}`);
          }
        } catch (e) {
          this.logger.error(`Failed to create scholarship: ${scholarship.title}`, e.stack);
        }
      }

      this.logger.log(`Seed complete. Created ${createdCount} new opportunities.`);
    } catch (error) {
      this.logger.error('Failed to seed real scholarships', error.stack);
    }
  }

  async refreshScholarships(count: number = 10) {
    return this.seedRealScholarships(count);
  }
}
