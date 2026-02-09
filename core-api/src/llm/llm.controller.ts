import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LLMService } from './llm.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { v4 as uuidv4 } from 'uuid';

@Controller('llm')
@UseGuards(JwtAuthGuard)
export class LLMController {
  constructor(private readonly llmService: LLMService) {}

  @Post('chat')
  @HttpCode(HttpStatus.ACCEPTED)
  async chat(
    @CurrentUser() user: { id: string },
    @Body() body: { message: string; context?: Record<string, unknown> },
  ) {
    const sessionId = uuidv4();

    // Start streaming in background
    this.llmService
      .streamChat(user.id, sessionId, body.message, body.context)
      .catch((error) => {
        console.error('Chat stream error:', error);
      });

    return {
      sessionId,
      message: 'Chat stream started. Listen for WebSocket events.',
    };
  }

  @Post('cv-parse')
  @HttpCode(HttpStatus.ACCEPTED)
  async parseCv(
    @CurrentUser() user: { id: string },
    @Body() body: { cvContent: string },
  ) {
    const sessionId = uuidv4();

    // Start streaming in background
    this.llmService
      .streamCVParse(user.id, sessionId, body.cvContent)
      .catch((error) => {
        console.error('CV parse stream error:', error);
      });

    return {
      sessionId,
      message: 'CV parsing stream started. Listen for WebSocket events.',
    };
  }

  @Post('generate-document')
  @HttpCode(HttpStatus.ACCEPTED)
  async generateDocument(
    @CurrentUser() user: { id: string },
    @Body()
    body: { documentType: string; data: Record<string, unknown> },
  ) {
    const sessionId = uuidv4();

    // Start streaming in background
    this.llmService
      .streamDocumentGeneration(
        user.id,
        sessionId,
        body.documentType,
        body.data,
      )
      .catch((error) => {
        console.error('Document generation stream error:', error);
      });

    return {
      sessionId,
      message: 'Document generation stream started. Listen for WebSocket events.',
    };
  }

  @Post('interview-prep')
  @HttpCode(HttpStatus.ACCEPTED)
  async interviewPrep(
    @CurrentUser() user: { id: string },
    @Body() body: { question: string; context?: Record<string, unknown> },
  ) {
    const sessionId = uuidv4();

    // Start streaming in background
    this.llmService
      .streamInterviewPrep(user.id, sessionId, body.question, body.context)
      .catch((error) => {
        console.error('Interview prep stream error:', error);
      });

    return {
      sessionId,
      message: 'Interview prep stream started. Listen for WebSocket events.',
    };
  }
}
