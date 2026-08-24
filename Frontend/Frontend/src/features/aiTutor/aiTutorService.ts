import { api } from '@/lib/axios';
import type { ApiSuccess, ApiPaginated, PaginationQuery } from '@/types';

/** One stored message, as persisted in AiTutorSession.messages */
export interface StoredChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

/** Sidebar row — transcript stripped, preview derived server-side */
export interface AiSessionSummary {
  id: string;
  subject: string | null;
  topic: string | null;
  createdAt: string;
  updatedAt: string;
  tokensUsed: number;
  messageCount: number;
  preview: string;
}

/** A single conversation with its full transcript */
export interface AiSessionDetail extends Omit<AiSessionSummary, 'messageCount' | 'preview'> {
  messages: StoredChatMessage[];
}

export const aiTutorService = {
  /** GET /api/v1/ai-tutor/sessions — conversation list for the sidebar */
  async getSessions(params: PaginationQuery = {}): Promise<ApiPaginated<AiSessionSummary>> {
    const res = await api.get<ApiPaginated<AiSessionSummary>>('/ai-tutor/sessions', { params });
    return res.data;
  },

  /** GET /api/v1/ai-tutor/sessions/:id — full transcript to reopen a chat */
  async getSession(sessionId: string): Promise<AiSessionDetail> {
    const res = await api.get<ApiSuccess<AiSessionDetail>>(`/ai-tutor/sessions/${sessionId}`);
    return res.data.data;
  },

  /** DELETE /api/v1/ai-tutor/sessions/:id */
  async deleteSession(sessionId: string): Promise<void> {
    await api.delete(`/ai-tutor/sessions/${sessionId}`);
  },
};
