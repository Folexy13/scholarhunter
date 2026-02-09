import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsArray,
  IsBoolean,
  IsObject,
} from 'class-validator';

export class CreateScholarshipDto {
  @IsString()
  name: string;

  @IsString()
  organization: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsDateString()
  deadline: string;

  @IsString()
  description: string;

  @IsObject()
  eligibility: any;

  @IsArray()
  @IsString({ each: true })
  requirements: string[];

  @IsString()
  applicationUrl: string;

  @IsArray()
  @IsString({ each: true })
  category: string[];

  @IsArray()
  @IsString({ each: true })
  country: string[];

  @IsArray()
  @IsString({ each: true })
  fieldOfStudy: string[];

  @IsArray()
  @IsString({ each: true })
  degreeLevel: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
