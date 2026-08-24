import { api } from '@/lib/axios';
import type {
  TutorInsight, TutorIntervention,
  ApiSuccess, ApiPaginated, PaginationQuery,
} from '@/types';

export const insightService = {
  /** GET /api/v1/insights/me — student: get my own AI insight briefs */
  async getMyInsights(params: PaginationQuery = {}): Promise<ApiPaginated<TutorInsight>> {
    const res = await api.get<ApiPaginated<TutorInsight>>('/insights/me', { params });
    return res.data;
  },

  /** GET /api/v1/insights/tutor/me — tutor: get all student insights assigned to me */
  async getTutorInsights(
    params: PaginationQuery & { studentId?: string; isResolved?: boolean } = {}
  ): Promise<ApiPaginated<TutorInsight>> {
    const res = await api.get<ApiPaginated<TutorInsight>>('/insights/tutor/me', { params });
    return res.data;
  },

  /** GET /api/v1/insights/:id — get single insight with interventions */
  async getInsight(insightId: string): Promise<TutorInsight> {
    const res = await api.get<ApiSuccess<TutorInsight>>(`/insights/${insightId}`);
    return res.data.data;
  },

  /** POST /api/v1/insights/:id/interventions — log an intervention */
  async logIntervention(
    insightId: string,
    data: { method: string; notes?: string; outcome?: string }
  ): Promise<TutorIntervention> {
    const res = await api.post<ApiSuccess<TutorIntervention>>(
      `/insights/${insightId}/interventions`,
      data
    );
    return res.data.data;
  },

  /** PATCH /api/v1/insights/:id/resolve — mark insight as resolved */
  async resolveInsight(insightId: string): Promise<TutorInsight> {
    const res = await api.patch<ApiSuccess<TutorInsight>>(`/insights/${insightId}/resolve`);
    return res.data.data;
  },
};
