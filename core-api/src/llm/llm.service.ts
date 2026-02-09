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
      'Authorization': `Bearer ${this.apiKey}`,
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
  ): Promise<void> {
    console.log(`Starting chat stream for user ${userId}, session ${sessionId}`);
    try {
      console.log(`Calling LLM service at ${this.llmServiceUrl}/api/llm/chat/stream`);
      
      // Use the streaming endpoint
      const response = await axios.post(
        `${this.llmServiceUrl}/api/llm/chat/stream`,
        {
          message,
          context,
        },
        {
          responseType: 'stream',
          headers: this.getHeaders(),
        },
      );

      console.log(`LLM service responded, setting up stream handlers`);
      let fullResponse = '';

      // Handle streaming response
      response.data.on('data', (chunk: Buffer) => {
        const chunkStr = chunk.toString();
        const lines = chunkStr.split('\n').filter((line: string) => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              // Stream complete
              console.log(`Stream complete, total response length: ${fullResponse.length}`);
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
                  console.error(`LLM service error: ${parsed.error}`);
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
              } catch (e) {
                console.warn(`Failed to parse chunk: ${data}`);
              }
            }
          }
        }
      });

      response.data.on('error', (error: Error) => {
        console.error(`Stream error: ${error.message}`);
        this.notificationsService.streamLLMError(
          userId,
          sessionId,
          error.message,
          { context },
        );
      });

      response.data.on('end', () => {
        console.log(`Stream ended, response length: ${fullResponse.length}`);
        if (fullResponse && !fullResponse.includes('[DONE]')) {
          this.notificationsService.streamLLMComplete(
            userId,
            sessionId,
            fullResponse,
            { context },
          );
        }
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(`LLM service error: ${errorMessage}`);
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
        `${this.llmServiceUrl}/api/cv-parser/parse`,
        {
          cv_content: cvContent,
          stream: true,
        },
        {
          responseType: 'stream',
          headers: {
            'Content-Type': 'application/json',
          },
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
        console.error(`CV parse stream error: ${error.message}`);
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
      console.error(`CV parse error: ${errorMessage}`);
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
      const response = await axios.post(
        `${this.llmServiceUrl}/api/document-generator/generate`,
        {
          document_type: documentType,
          data,
          stream: true,
        },
        {
          responseType: 'stream',
          headers: {
            'Content-Type': 'application/json',
          },
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
          { type: 'document-generation', documentType },
        );
      });

      response.data.on('error', (error: Error) => {
        console.error(`Document generation stream error: ${error.message}`);
        this.notificationsService.streamLLMError(
          userId,
          sessionId,
          error.message,
          { type: 'document-generation', documentType },
        );
      });

      response.data.on('end', () => {
        this.notificationsService.streamLLMComplete(
          userId,
          sessionId,
          fullResponse,
          { type: 'document-generation', documentType },
        );
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(`Document generation error: ${errorMessage}`);
      this.notificationsService.streamLLMError(
        userId,
        sessionId,
        errorMessage,
        { type: 'document-generation', documentType },
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
        `${this.llmServiceUrl}/api/interview/practice`,
        {
          question,
          context,
          stream: true,
        },
        {
          responseType: 'stream',
          headers: {
            'Content-Type': 'application/json',
          },
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
        console.error(`Interview prep stream error: ${error.message}`);
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
      console.error(`Interview prep error: ${errorMessage}`);
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
   * Non-streaming request to LLM service (for simple requests)
   */
  async request<T>(
    endpoint: string,
    data: Record<string, unknown>,
  ): Promise<T> {
    try {
      console.log(`Calling LLM service at ${this.llmServiceUrl}${endpoint}`);
      const response = await axios.post<T>(
        `${this.llmServiceUrl}${endpoint}`,
        data,
        {
          headers: this.getHeaders(),
          timeout: 60000, // 60 seconds timeout
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
   * Discover real scholarships using LLM service
   */
  async discoverScholarships(count: number = 10): Promise<{
    scholarships: Array<{
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
    }>;
    count: number;
  }> {
    try {
      console.log(`Discovering ${count} scholarships from LLM service`);
      
      const response = await this.request<{
        scholarships: any[];
        count: number;
      }>('/api/llm/scholarships/discover', { count });

      console.log(`Discovered ${response.count} scholarships`);
      
      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(`Scholarship discovery error: ${errorMessage}`);
      throw error;
    }
  }
}
