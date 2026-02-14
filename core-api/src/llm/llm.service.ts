import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from '../notifications/notifications.service';
import axios from 'axios';

@Injectable()
export class LLMService {
  private readonly llmServiceUrl: string;
  private readonly apiKey: string;

  constructor(
    private configService: ConfigService,
    private notificationsService: NotificationsService,
  ) {
    this.llmServiceUrl =
      this.configService.get<string>('LLM_SERVICE_URL') ||
      'http://llm-service:8000';
    this.apiKey = this.configService.get<string>('CORE_API_SECRET') || '';
  }

  /**
   * Get headers with API key for LLM service requests
   */
  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  /**
   * Stream chat response from LLM service
   */
  async streamChat(
    userId: string,
    sessionId: string,
    message: string,
    context?: Record<string, unknown>,
    attachments?: any[],
  ): Promise<void> {
    console.log(`Starting chat stream for user ${userId}, session ${sessionId}`);
    try {
      console.log(`Calling LLM service at ${this.llmServiceUrl}/api/llm/chat/stream`);
      
      const response = await axios.post(
        `${this.llmServiceUrl}/api/llm/chat/stream`,
        {
          message,
          context,
          conversation_history: context?.conversation_history,
          attachments,
        },
        {
          responseType: 'stream',
          headers: this.getHeaders(),
        },
      );

      let fullResponse = '';

      response.data.on('data', (chunk: Buffer) => {
        const chunkStr = chunk.toString();
        const lines = chunkStr.split('\n').filter((line: string) => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              this.notificationsService.streamLLMComplete(
                userId,
                sessionId,
                fullResponse,
                { context },
              );
            } else {
              try {
                const parsed = JSON.parse(data);
                if (parsed.error) {
                  this.notificationsService.streamLLMError(
                    userId,
                    sessionId,
                    parsed.error,
                    { context },
                  );
                } else {
                  const content = parsed.content || '';
                  if (content) {
                    fullResponse += content;
                    this.notificationsService.streamLLMChunk(
                      userId,
                      sessionId,
                      content,
                      { context },
                    );
                  }
                }
              } catch (e) {}
            }
          }
        }
      });

      response.data.on('error', (error: Error) => {
        this.notificationsService.streamLLMError(
          userId,
          sessionId,
          error.message,
          { context },
        );
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.notificationsService.streamLLMError(
        userId,
        sessionId,
        errorMessage,
        { context },
      );
      throw error;
    }
  }

  /**
   * Stream CV parsing results
   */
  async streamCVParse(
    userId: string,
    sessionId: string,
    cvContent: string,
  ): Promise<void> {
    try {
      const response = await axios.post(
        `${this.llmServiceUrl}/api/llm/cv-parser/parse`,
        { cv_content: cvContent, stream: true },
        {
          responseType: 'stream',
          headers: this.getHeaders(),
        },
      );

      let fullResponse = '';

      response.data.on('data', (chunk: Buffer) => {
        const chunkStr = chunk.toString();
        fullResponse += chunkStr;
        this.notificationsService.streamLLMChunk(
          userId,
          sessionId,
          chunkStr,
          { type: 'cv-parse' },
        );
      });

      response.data.on('error', (error: Error) => {
        this.notificationsService.streamLLMError(
          userId,
          sessionId,
          error.message,
          { type: 'cv-parse' },
        );
      });

      response.data.on('end', () => {
        this.notificationsService.streamLLMComplete(
          userId,
          sessionId,
          fullResponse,
          { type: 'cv-parse' },
        );
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.notificationsService.streamLLMError(
        userId,
        sessionId,
        errorMessage,
        { type: 'cv-parse' },
      );
      throw error;
    }
  }

  /**
   * Stream document generation
   */
  async streamDocumentGeneration(
    userId: string,
    sessionId: string,
    documentType: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    try {
      console.log(`Starting document stream for user ${userId}, session ${sessionId}`);
      const response = await axios.post(
        `${this.llmServiceUrl}/api/llm/generate-document/stream`,
        {
          document_type: documentType,
          student_profile: data.student_profile || {},
          scholarship_info: data.scholarship_info || { name: data.scholarshipName },
          additional_context: data.additionalContext || {},
        },
        {
          responseType: 'stream',
          headers: this.getHeaders(),
        },
      );

      let fullResponse = '';

      response.data.on('data', (chunk: Buffer) => {
        const chunkStr = chunk.toString();
        const lines = chunkStr.split('\n').filter((line: string) => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') {
              this.notificationsService.notifyDocumentGenerationComplete(
                userId,
                sessionId,
                documentType,
                true,
                { content: fullResponse },
              );
            } else {
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.error) {
                  this.notificationsService.notifyDocumentGenerationComplete(
                    userId,
                    sessionId,
                    documentType,
                    false,
                    { error: parsed.error },
                  );
                } else {
                  const content = parsed.content || '';
                  if (content) {
                    fullResponse += content;
                    this.notificationsService.streamLLMChunk(
                      userId,
                      sessionId,
                      content,
                      { type: 'document-generation', documentType },
                    );
                  }
                }
              } catch (e) {}
            }
          }
        }
      });

      response.data.on('error', (error: Error) => {
        this.notificationsService.notifyDocumentGenerationComplete(
          userId,
          sessionId,
          documentType,
          false,
          { error: error.message },
        );
      });
    } catch (error) {
      this.notificationsService.notifyDocumentGenerationComplete(
        userId,
        sessionId,
        documentType,
        false,
        { error: (error as any).message },
      );
      throw error;
    }
  }

  /**
   * Stream interview preparation
   */
  async streamInterviewPrep(
    userId: string,
    sessionId: string,
    question: string,
    context?: Record<string, unknown>,
  ): Promise<void> {
    try {
      const response = await axios.post(
        `${this.llmServiceUrl}/api/llm/interview/practice`,
        { question, context, stream: true },
        {
          responseType: 'stream',
          headers: this.getHeaders(),
        },
      );

      let fullResponse = '';

      response.data.on('data', (chunk: Buffer) => {
        const chunkStr = chunk.toString();
        fullResponse += chunkStr;
        this.notificationsService.streamLLMChunk(
          userId,
          sessionId,
          chunkStr,
          { type: 'interview-prep', ...context },
        );
      });

      response.data.on('error', (error: Error) => {
        this.notificationsService.streamLLMError(
          userId,
          sessionId,
          error.message,
          { type: 'interview-prep', ...context },
        );
      });

      response.data.on('end', () => {
        this.notificationsService.streamLLMComplete(
          userId,
          sessionId,
          fullResponse,
          { type: 'interview-prep', ...context },
        );
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.notificationsService.streamLLMError(
        userId,
        sessionId,
        errorMessage,
        { type: 'interview-prep', ...context },
      );
      throw error;
    }
  }

  /**
   * Non-streaming request to LLM service
   */
  async request<T>(endpoint: string, data: Record<string, unknown>): Promise<T> {
    try {
      console.log(`Calling LLM service at ${this.llmServiceUrl}${endpoint}`);
      const response = await axios.post<T>(
        `${this.llmServiceUrl}${endpoint}`,
        data,
        {
          headers: this.getHeaders(),
          timeout: 60000,
        },
      );
      return response.data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(`LLM service request error: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Discover faculty and universities
   */
  async discoverFaculty(
    mode: string,
    continent?: string,
    university?: string,
    department?: string,
    faculty_name?: string,
    student_profile?: Record<string, unknown>,
  ) {
    try {
      const response = await this.request<{ success: boolean; data: any }>(
        '/api/llm/faculty/discover',
        { mode, continent, university, department, faculty_name, student_profile },
      );
      return response.data;
    } catch (error) {
      console.error(`Faculty discovery error: ${(error as any).message}`);
      throw error;
    }
  }

  /**
   * Discover real scholarships using LLM service
   */
  async discoverScholarships(count: number = 10): Promise<{
    scholarships: any[];
    count: number;
  }> {
    try {
      const response = await this.request<{
        scholarships: any[];
        count: number;
      }>('/api/llm/scholarships/discover', { count });
      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(`Scholarship discovery error: ${errorMessage}`);
      throw error;
    }
  }
}
