import apiClient from './api-client';

// Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'STUDENT' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface UserProfile {
  id: string;
  userId: string;
  phone?: string;
  location?: string;
  citizenship?: string;
  dateOfBirth?: string;
  gender?: string;
  ethnicity?: string;
  gpa?: string; // Changed to string to support formats like "4.25/5" or "3.75/4"
  major?: string;
  university?: string;
  graduationYear?: number;
  linkedIn?: string;
  website?: string;
  bio?: string;
  cvData?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Scholarship {
  id: string;
  name: string; // Changed from 'title' to match backend
  description: string;
  organization: string; // Changed from 'provider' to match backend
  amount: number | null; // Allow null values
  currency: string;
  deadline: string;
  eligibility: string[] | Record<string, unknown>; // Changed from 'eligibilityCriteria' to match backend, allow both formats
  requiredDocuments: string[];
  applicationUrl?: string;
  fieldOfStudy?: string[];
  educationLevel?: string[];
  nationality?: string[];
  country?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: string;
  userId: string;
  scholarshipId: string;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  submittedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  scholarship?: Scholarship;
}

export interface Document {
  id: string;
  userId: string;
  applicationId?: string;
  title: string;
  type: 'CV' | 'COVER_LETTER' | 'TRANSCRIPT' | 'RECOMMENDATION' | 'ESSAY' | 'OTHER';
  fileUrl?: string;
  content?: string;
  status: 'DRAFT' | 'FINAL' | 'SUBMITTED';
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  context?: string;
}

export interface ChatResponse {
  response: string;
  context?: string;
}

// Auth API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<{ access_token: string }> => {
    const response = await apiClient.post('/auth/refresh', { refresh_token: refreshToken });
    return response.data;
  },
};

// Users API
export const usersApi = {
  getProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get('/users/profile');
    return response.data;
  },

  updateProfile: async (data: Partial<UserProfile>): Promise<UserProfile> => {
    const response = await apiClient.patch('/users/profile', data);
    return response.data;
  },

  createProfile: async (data: Partial<UserProfile>): Promise<UserProfile> => {
    const response = await apiClient.post('/users/profile', data);
    return response.data;
  },
};

// Scholarships API
export const scholarshipsApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    fieldOfStudy?: string;
    educationLevel?: string;
    country?: string;
  }): Promise<{ data: Scholarship[]; total: number; page: number; limit: number }> => {
    const response = await apiClient.get('/scholarships', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Scholarship> => {
    const response = await apiClient.get(`/scholarships/${id}`);
    return response.data;
  },

  getMatches: async (): Promise<Scholarship[]> => {
    const response = await apiClient.get('/scholarships/matches');
    return response.data;
  },
};

// Applications API
export const applicationsApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{ data: Application[]; total: number; page: number; limit: number }> => {
    const response = await apiClient.get('/applications', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Application> => {
    const response = await apiClient.get(`/applications/${id}`);
    return response.data;
  },

  create: async (data: { scholarshipId: string; notes?: string }): Promise<Application> => {
    const response = await apiClient.post('/applications', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Application>): Promise<Application> => {
    const response = await apiClient.patch(`/applications/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/applications/${id}`);
  },

  submit: async (id: string): Promise<Application> => {
    const response = await apiClient.post(`/applications/${id}/submit`);
    return response.data;
  },

  withdraw: async (id: string): Promise<Application> => {
    const response = await apiClient.post(`/applications/${id}/withdraw`);
    return response.data;
  },
};

// Documents API
export const documentsApi = {
  getAll: async (params?: {
    applicationId?: string;
    type?: string;
  }): Promise<Document[]> => {
    const response = await apiClient.get('/documents', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Document> => {
    const response = await apiClient.get(`/documents/${id}`);
    return response.data;
  },

  create: async (data: {
    title: string;
    type: Document['type'];
    applicationId?: string;
    content?: string;
    fileUrl?: string;
  }): Promise<Document> => {
    const response = await apiClient.post('/documents', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Document>): Promise<Document> => {
    const response = await apiClient.patch(`/documents/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/documents/${id}`);
  },

  upload: async (file: File, data: {
    title: string;
    type: Document['type'];
    applicationId?: string;
  }): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', data.title);
    formData.append('type', data.type);
    if (data.applicationId) {
      formData.append('applicationId', data.applicationId);
    }

    const response = await apiClient.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// AI/LLM Features API (proxied through Core API)
export const aiApi = {
  chat: async (data: { message: string; context?: Record<string, unknown> }): Promise<{ sessionId: string; message: string }> => {
    const response = await apiClient.post('/llm/chat', data);
    return response.data;
  },

  parseCV: async (data: { cvContent: string }): Promise<{ sessionId: string; message: string }> => {
    const response = await apiClient.post('/llm/cv-parse', data);
    return response.data;
  },

  generateDocument: async (data: {
    documentType: string;
    data: Record<string, unknown>;
  }): Promise<{ sessionId: string; message: string }> => {
    const response = await apiClient.post('/llm/generate-document', data);
    return response.data;
  },

  interviewPrep: async (data: {
    question: string;
    context?: Record<string, unknown>;
  }): Promise<{ sessionId: string; message: string }> => {
    const response = await apiClient.post('/llm/interview-prep', data);
    return response.data;
  },
};

export default {
  auth: authApi,
  users: usersApi,
  scholarships: scholarshipsApi,
  applications: applicationsApi,
  documents: documentsApi,
  ai: aiApi,
};
