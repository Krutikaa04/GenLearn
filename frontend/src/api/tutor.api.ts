import api from '../lib/axios';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const tutorApi = {
  chat: (payload: {
    topic: string;
    message: string;
    conversationHistory: ConversationMessage[];
    documentIds?: string[];
    studentContext?: Record<string, unknown>;
  }) => api.post('/tutor/chat', payload),
};
