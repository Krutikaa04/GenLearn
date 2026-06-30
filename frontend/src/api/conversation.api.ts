import api from '../lib/axios';

export interface ConversationSummary {
  conversationId: string;
  topic: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  followUpSuggestions?: string[];
  createdAt: string;
}

export const conversationApi = {
  sendMessage: (payload: {
    conversationId?: string;
    topic: string;
    message: string;
    documentIds?: string[];
    studentContext?: Record<string, unknown>;
  }) => api.post('/conversations/message', payload),

  list: (page = 1, pageSize = 20) => api.get('/conversations', { params: { page, pageSize } }),

  getById: (conversationId: string) => api.get(`/conversations/${conversationId}`),

  delete: (conversationId: string) => api.delete(`/conversations/${conversationId}`),
};
