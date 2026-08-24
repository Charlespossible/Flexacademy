import { api } from '@/lib/axios';
import type {
  ProgressOverview, WeakArea, SubjectProgress, ExamReadiness, ExamCategory,
  ApiSuccess, ApiPaginated,
} from '@/types';

/**
 * Progress Service — handles all progress-related API calls
 * Connects to backend /api/v1/progress/* endpoints
 */
export const progressService = {
  /**
   * GET /api/v1/progress/me
   * Fetch overall learning progress summary
   */
  async getUserProgress(): Promise<ProgressOverview> {
    const res = await api.get<ApiSuccess<ProgressOverview>>('/progress/me');
    return res.data.data;
  },

  /**
   * GET /api/v1/progress/me/weak-areas
   * Get topics with mastery < 70% (weak areas)
   */
  async getWeakAreas(limit = 10): Promise<WeakArea[]> {
    const res = await api.get<ApiSuccess<WeakArea[]>>('/progress/me/weak-areas', {
      params: { limit },
    });
    return res.data.data;
  },

  /**
   * GET /api/v1/progress/me/subjects
   * Per-subject progress breakdown
   */
  async getSubjectProgress(): Promise<SubjectProgress[]> {
    const res = await api.get<ApiSuccess<SubjectProgress[]>>('/progress/me/subjects');
    return res.data.data;
  },

  /**
   * GET /api/v1/progress/me/topics
   * Per-topic progress with mastery and accuracy details
   */
  async getTopicProgress(subjectId?: string, page = 1, limit = 20) {
    const params: Record<string, unknown> = { page, limit };
    if (subjectId) params.subjectId = subjectId;

    const res = await api.get<ApiPaginated<any>>('/progress/me/topics', { params });
    return res.data;
  },

  /**
   * GET /api/v1/leaderboard
   * User's leaderboard rank and position
   */
  async getUserLeaderboardRank(limit = 1) {
    const res = await api.get<ApiSuccess<any>>('/leaderboard', {
      params: { limit },
    });
    return res.data.data;
  },

  /**
   * GET /api/v1/progress/me/exam-readiness
   * Exam readiness score, eligibility for certification, and open gaps count
   */
  async getExamReadiness(examCategory: ExamCategory): Promise<ExamReadiness> {
    const res = await api.get<ApiSuccess<ExamReadiness>>('/progress/me/exam-readiness', {
      params: { examCategory },
    });
    return res.data.data;
  },

  /**
   * POST /api/v1/progress/me/reset (optional backend endpoint)
   * Reset progress (for testing/onboarding purposes)
   */
  async resetProgress(): Promise<void> {
    await api.post('/progress/me/reset');
  },
};
