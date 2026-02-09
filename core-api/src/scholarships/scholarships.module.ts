import { Module } from '@nestjs/common';
import { ScholarshipsService } from './scholarships.service';
import { ScholarshipsController } from './scholarships.controller';
import { ScholarshipSeederService } from './scholarships-seeder.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LLMModule } from '../llm/llm.module';

@Module({
  imports: [PrismaModule, LLMModule],
  controllers: [ScholarshipsController],
  providers: [ScholarshipsService, ScholarshipSeederService],
  exports: [ScholarshipsService, ScholarshipSeederService],
})
export class ScholarshipsModule {}
