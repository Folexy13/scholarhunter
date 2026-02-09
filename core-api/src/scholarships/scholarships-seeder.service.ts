import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { LLMService } from '../llm/llm.service';

@Injectable()
export class ScholarshipSeederService {
  private readonly logger = new Logger(ScholarshipSeederService.name);

  constructor(
    private prisma: PrismaService,
    private llmService: LLMService,
  ) {}

  /**
   * Update old deadlines to 2026/2027
   */
  private updateDeadlineTo2026(oldDeadline: string): Date {
    const date = new Date(oldDeadline);
    const month = date.getMonth();
    const day = date.getDate();
    
    // If deadline is in Jan-June, use 2027, otherwise use 2026
    const year = month < 6 ? 2027 : 2026;
    
    return new Date(year, month, day);
  }

  /**
   * Parse amount from string (e.g., "1181 (Monthly Allowance)" -> 1181)
   */
  private parseAmount(amount: any): number | null {
    if (typeof amount === 'number') {
      return amount;
    }
    if (typeof amount === 'string') {
      // Extract first number from string
      const match = amount.match(/[\d,]+/);
      if (match) {
        return parseFloat(match[0].replace(/,/g, ''));
      }
    }
    return null;
  }

  /**
   * Discover and save new scholarships, preventing duplicates
   */
  async seedScholarships(count: number = 10): Promise<any[]> {
    try {
      this.logger.log(`Discovering ${count} real scholarships from LLM service...`);

      // Call LLM service to discover scholarships
      const response = await this.llmService.discoverScholarships(count);

      if (!response || !response.scholarships || response.scholarships.length === 0) {
        this.logger.warn('No scholarships discovered from LLM service');
        return [];
      }

      this.logger.log(`Discovered ${response.scholarships.length} scholarships. Checking for duplicates...`);

      // Save scholarships to database, preventing duplicates
      let savedCount = 0;
      let duplicateCount = 0;
      
      for (const scholarship of response.scholarships) {
        try {
          // Check if scholarship already exists (by name OR similar name)
          // Enhanced duplicate detection with multiple strategies
          const nameWords = scholarship.title.split(' ').filter(w => w.length > 2);
          const orgWords = scholarship.provider.split(' ').filter(w => w.length > 2);
          
          const existing = await this.prisma.scholarship.findFirst({
            where: {
              OR: [
                // Exact match
                {
                  name: scholarship.title,
                  organization: scholarship.provider,
                },
                // Same name, similar organization (first 3 significant words)
                {
                  name: scholarship.title,
                  organization: {
                    contains: orgWords.slice(0, 3).join(' '),
                    mode: 'insensitive',
                  },
                },
                // Similar name (first 3 words), same organization
                {
                  name: {
                    contains: nameWords.slice(0, 3).join(' '),
                    mode: 'insensitive',
                  },
                  organization: scholarship.provider,
                },
                // Both similar (fuzzy match)
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

          // Update deadline to 2026/2027 if it's in the past
          const originalDeadline = new Date(scholarship.deadline);
          const updatedDeadline = originalDeadline < new Date()
            ? this.updateDeadlineTo2026(scholarship.deadline)
            : originalDeadline;

          // Parse amount to number
          const parsedAmount = this.parseAmount(scholarship.amount);

          // Create new scholarship
          await this.prisma.scholarship.create({
            data: {
              name: scholarship.title,
              organization: scholarship.provider,
              description: scholarship.description,
              amount: parsedAmount,
              currency: scholarship.currency,
              deadline: updatedDeadline,
              country: [scholarship.country], // Convert to array
              degreeLevel: [scholarship.educationLevel], // Convert to array
              fieldOfStudy: [scholarship.fieldOfStudy], // Convert to array
              eligibility: scholarship.eligibilityCriteria || [], // JSON field
              requirements: scholarship.eligibilityCriteria || [],
              applicationUrl: scholarship.applicationUrl,
              category: [], // Empty for now
              isActive: scholarship.isActive !== false,
            },
          });
          savedCount++;
          this.logger.log(`✓ Saved: ${scholarship.title}`);
        } catch (error) {
          this.logger.error(`Failed to save scholarship: ${scholarship.title}`, error);
        }
      }

      this.logger.log(`Scholarship discovery complete: ${savedCount} new, ${duplicateCount} duplicates skipped`);
      return response.scholarships;
    } catch (error) {
      this.logger.error('Error seeding scholarships:', error);
      throw error;
    }
  }

  /**
   * Cron job: Discover new scholarships every 10 minutes
   */
  @Cron('*/10 * * * *', {
    name: 'discover-scholarships',
  })
  async discoverScholarshipsCron(): Promise<void> {
    this.logger.log('🔍 Running scheduled opportunity discovery...');
    await this.seedScholarships(5);  // Discover 5 opportunities (scholarships, fellowships, internships) to avoid timeout
  }

  async seedIfEmpty(): Promise<void> {
    try {
      const count = await this.prisma.scholarship.count();
      
      if (count === 0) {
        this.logger.log('Database is empty. Seeding with real opportunities...');
        await this.seedScholarships(5);  // Discover 5 opportunities to avoid timeout
      } else {
        this.logger.log(`Database already has ${count} opportunities`);
      }
    } catch (error) {
      this.logger.error('Error checking/seeding opportunities:', error);
    }
  }

  async refreshScholarships(count: number = 10): Promise<{ message: string; newCount: number; deletedCount: number }> {
    this.logger.log(`🔄 Refreshing scholarships: deleting all and discovering ${count} new ones...`);
    
    // Delete all existing scholarships
    const deleteResult = await this.prisma.scholarship.deleteMany({});
    this.logger.log(`🗑️  Deleted ${deleteResult.count} old scholarships`);
    
    // Discover new scholarships
    const newScholarships = await this.seedScholarships(count);
    
    return {
      message: 'Scholarships refreshed successfully',
      deletedCount: deleteResult.count,
      newCount: newScholarships.length,
    };
  }
}
