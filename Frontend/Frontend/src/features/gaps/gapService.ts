import { api } from '@/lib/axios';
import type {
  LearningGap, GapDetectionResult, GapStatus,
  ApiSuccess, ApiPaginated, PaginationQuery,
} from '@/types';

export const gapService = {
  /** GET /api/v1/gaps/me — my open learning gaps */
  async getMyGaps(
    params: PaginationQuery & { status?: GapStatus; severity?: string } = {}
  ): Promise<ApiPaginated<LearningGap>> {
    const res = await api.get<ApiPaginated<LearningGap>>('/gaps/me', { params });
    return res.data;
  },

  /** POST /api/v1/gaps/detect — run gap detection now */
  async detectGaps(): Promise<GapDetectionResult> {
    const res = await api.post<ApiSuccess<GapDetectionResult>>('/gaps/detect');
    return res.data.data;
  },

  /** PATCH /api/v1/gaps/:id/status — acknowledge / mark in-progress */
  async updateGapStatus(gapId: string, status: GapStatus): Promise<LearningGap> {
    const res = await api.patch<ApiSuccess<LearningGap>>(`/gaps/${gapId}/status`, { status });
    return res.data.data;
  },

  /** POST /api/v1/gaps/:id/re-evaluate — trigger re-evaluation after studying */
  async reEvaluate(gapId: string): Promise<GapDetectionResult> {
    const res = await api.post<ApiSuccess<GapDetectionResult>>(`/gaps/${gapId}/re-evaluate`);
    return res.data.data;
  },

  /** GET /api/v1/gaps/student/:id — tutor views a student's gaps */
  async getStudentGaps(
    studentId: string,
    params: PaginationQuery & { status?: GapStatus } = {}
  ): Promise<ApiPaginated<LearningGap>> {
    const res = await api.get<ApiPaginated<LearningGap>>(`/gaps/student/${studentId}`, { params });
    return res.data;
  },
};
