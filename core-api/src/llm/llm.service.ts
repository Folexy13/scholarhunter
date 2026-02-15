import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from '../notifications/notifications.service';
import axios from 'axios';

@Injectable()
export class LLMService {
  private readonly llmServiceUrl: string;
  private readonly apiKey: string;
  private readonly azureSpeechKey: string;
  private readonly azureSpeechRegion: string;

  constructor(
    private configService: ConfigService,
    private notificationsService: NotificationsService,
  ) {
    this.llmServiceUrl =
      this.configService.get<string>('LLM_SERVICE_URL') ||
      'http://llm-service:8000';
    this.apiKey = this.configService.get<string>('CORE_API_SECRET') || '';
    this.azureSpeechKey = this.configService.get<string>('AZURE_SPEECH_KEY') || '';
    this.azureSpeechRegion = this.configService.get<string>('AZURE_SPEECH_REGION') || 'eastus2';
  }

  async getSpeechToken(): Promise<{ token: string; region: string }> {
    if (!this.azureSpeechKey) {
      throw new Error('Azure Speech Key not configured');
    }

    try {
      const response = await axios.post(
        `https://${this.azureSpeechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
        null,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': this.azureSpeechKey,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );
      return { token: response.data, region: this.azureSpeechRegion };
    } catch (error) {
      console.error('Failed to get Azure Speech Token:', error);
      throw new Error('Failed to get Azure Speech Token');
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  async streamChat(
    userId: string,
    sessionId: string,
    message: string,
    context?: Record<string, unknown>,
    attachments?: any[],
  ): Promise<void> {
    try {
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
              this.notificationsService.streamLLMComplete(userId, sessionId, fullResponse, { context });
            } else {
              try {
                const parsed = JSON.parse(data);
                if (parsed.error) {
                  this.notificationsService.streamLLMError(userId, sessionId, parsed.error, { context });
                } else {
                  const content = parsed.content || '';
                  if (content) {
                    fullResponse += content;
                    this.notificationsService.streamLLMChunk(userId, sessionId, content, { context });
                  }
                }
              } catch (e) {}
            }
          }
        }
      });
    } catch (error) {
      this.notificationsService.streamLLMError(userId, sessionId, (error as any).message, { context });
    }
  }

  async streamCVParse(userId: string, sessionId: string, cvContent: string): Promise<void> {
    try {
      const response = await axios.post(
        `${this.llmServiceUrl}/api/llm/cv-parser/parse`,
        { cv_content: cvContent, stream: true },
        { responseType: 'stream', headers: this.getHeaders() },
      );
      let fullResponse = '';
      response.data.on('data', (chunk: Buffer) => {
        const chunkStr = chunk.toString();
        fullResponse += chunkStr;
        this.notificationsService.streamLLMChunk(userId, sessionId, chunkStr, { type: 'cv-parse' });
      });
      response.data.on('end', () => {
        this.notificationsService.streamLLMComplete(userId, sessionId, fullResponse, { type: 'cv-parse' });
      });
    } catch (error) {
      this.notificationsService.streamLLMError(userId, sessionId, (error as any).message, { type: 'cv-parse' });
    }
  }

  async streamDocumentGeneration(
    userId: string,
    sessionId: string,
    documentType: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    try {
      const response = await axios.post(
        `${this.llmServiceUrl}/api/llm/generate-document/stream`,
        {
          document_type: documentType,
          student_profile: data.student_profile || {},
          scholarship_info: data.scholarship_info || { name: data.scholarshipName },
          additional_context: data.additionalContext || {},
        },
        { responseType: 'stream', headers: this.getHeaders() },
      );

      let fullResponse = '';
      response.data.on('data', (chunk: Buffer) => {
        const chunkStr = chunk.toString();
        const lines = chunkStr.split('\n').filter((line: string) => line.trim());
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') {
              this.notificationsService.notifyDocumentGenerationComplete(userId, sessionId, documentType, true, { content: fullResponse });
            } else {
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.error) {
                  this.notificationsService.notifyDocumentGenerationComplete(userId, sessionId, documentType, false, { error: parsed.error });
                } else {
                  const content = parsed.content || '';
                  if (content) {
                    fullResponse += content;
                    this.notificationsService.streamLLMChunk(userId, sessionId, content, { type: 'document-generation', documentType });
                  }
                }
              } catch (e) {}
            }
          }
        }
      });
    } catch (error) {
      this.notificationsService.notifyDocumentGenerationComplete(userId, sessionId, documentType, false, { error: (error as any).message });
    }
  }

  async streamInterviewPrep(userId: string, sessionId: string, question: string, context?: Record<string, unknown>): Promise<void> {
    try {
      const response = await axios.post(
        `${this.llmServiceUrl}/api/llm/interview/practice`,
        { question, context, stream: true },
        { responseType: 'stream', headers: this.getHeaders() },
      );
      let fullResponse = '';
      response.data.on('data', (chunk: Buffer) => {
        const chunkStr = chunk.toString();
        fullResponse += chunkStr;
        this.notificationsService.streamLLMChunk(userId, sessionId, chunkStr, { type: 'interview-prep', ...context });
      });
      response.data.on('end', () => {
        this.notificationsService.streamLLMComplete(userId, sessionId, fullResponse, { type: 'interview-prep', ...context });
      });
    } catch (error) {
      this.notificationsService.streamLLMError(userId, sessionId, (error as any).message, { type: 'interview-prep', ...context });
    }
  }

  async request<T>(endpoint: string, data: Record<string, unknown>): Promise<T> {
    try {
      const response = await axios.post<T>(`${this.llmServiceUrl}${endpoint}`, data, { headers: this.getHeaders(), timeout: 60000 });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async discoverFaculty(mode: string, continent?: string, university?: string, department?: string, faculty_name?: string, student_profile?: Record<string, unknown>) {
    try {
      const response = await this.request<{ success: boolean; data: any }>('/api/llm/faculty/discover', { mode, continent, university, department, faculty_name, student_profile });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async discoverScholarships(count: number = 10): Promise<{ scholarships: any[]; count: number }> {
    try {
      const response = await this.request<{ scholarships: any[]; count: number }>('/api/llm/scholarships/discover', { count });
      return response;
    } catch (error) {
      throw error;
    }
  }

  async interactiveInterview(
    mode: string,
    persona: string,
    interview_type: string,
    user_answer?: string,
    history?: any[],
    student_profile?: Record<string, unknown>
  ) {
    try {
      const response = await this.request<{ success: boolean; data: any }>('/api/llm/interview/interactive', {
        mode,
        persona,
        interview_type,
        user_answer,
        history,
        student_profile,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }
}
