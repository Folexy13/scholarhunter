import {
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  IsBoolean,
  IsObject,
} from 'class-validator';
import { DocumentType } from '@prisma/client';

export class CreateDocumentDto {
  @IsOptional()
  @IsString()
  applicationId?: string;

  @IsEnum(DocumentType)
  type: DocumentType;

  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsInt()
  wordCount?: number;

  @IsOptional()
  @IsInt()
  version?: number;

  @IsOptional()
  @IsBoolean()
  isGenerated?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: any;
}
