import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsObject,
} from 'class-validator';
import { ApplicationStatus, Priority } from '@prisma/client';

export class CreateApplicationDto {
  @IsString()
  scholarshipId: string;

  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @IsOptional()
  @IsNumber()
  matchScore?: number;

  @IsOptional()
  @IsObject()
  matchRationale?: any;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsString()
  notes?: string;
}
