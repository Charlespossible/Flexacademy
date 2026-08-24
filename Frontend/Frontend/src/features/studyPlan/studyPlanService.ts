import { api } from '@/lib/axios';
import type { StudyPlan, ApiSuccess, ApiPaginated, ExamCategory } from '@/types';

/**
 * Study Plan Service — handles personalized study planning
 * Integrates AI-generated plans via Claude
 */
export const studyPlanService = {
  /**
   * GET /api/v1/study-plans/me
   * Fetch user's study plans (active by default)
   */
  async getUserStudyPlans(
    status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED' = 'ACTIVE',
    page = 1,
    limit = 20
  ) {
    const res = await api.get<ApiPaginated<StudyPlan>>('/study-plans/me', {
      params: {
        status,
        page,
        limit: Math.min(limit, 100),
      },
    });
    return res.data;
  },

  /**
   * GET /api/v1/study-plans/:id
   * Get a specific study plan with items and progress
   */
  async getStudyPlan(planId: string) {
    const res = await api.get<ApiSuccess<StudyPlan>>(`/study-plans/${planId}`);
    return res.data.data;
  },

  /**
   * POST /api/v1/study-plans
   * Create a manual study plan with custom items
   */
  async createStudyPlan(
    title: string,
    targetDate: string,
    items: Array<{
      topicId: string;
      title: string;
      durationMins: number;
      dueDate: string;
      priority: 'HIGH' | 'MEDIUM' | 'LOW';
    }>
  ) {
    const res = await api.post<ApiSuccess<StudyPlan>>('/study-plans', {
      title,
      targetDate,
      items,
    });
    return res.data.data;
  },

  /**
   * POST /api/v1/study-plans/generate
   * Generate an AI study plan using Claude
   * Analyzes weak areas and creates prioritized schedule
   */
  async generateAiStudyPlan(
    examCategory: ExamCategory,
    targetDate: string,
    dailyGoalMins = 60
  ) {
    const res = await api.post<ApiSuccess<StudyPlan>>('/study-plans/generate', {
      examCategory,
      targetDate,
      dailyGoalMins,
    });
    return res.data.data;
  },

  /**
   * PATCH /api/v1/study-plans/:id
   * Update a study plan (title, target date, status)
   */
  async updateStudyPlan(
    planId: string,
    updates: {
      title?: string;
      targetDate?: string;
      status?: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ABANDONED';
    }
  ) {
    const res = await api.patch<ApiSuccess<StudyPlan>>(`/study-plans/${planId}`, updates);
    return res.data.data;
  },

  /**
   * PATCH /api/v1/study-plans/:planId/items/:itemId/complete
   * Mark a study plan item as completed
   */
  async completeStudyPlanItem(planId: string, itemId: string) {
    const res = await api.patch<ApiSuccess<any>>(
      `/study-plans/${planId}/items/${itemId}/complete`
    );
    return res.data.data;
  },

  /**
   * DELETE /api/v1/study-plans/:id
   * Delete a study plan
   */
  async deleteStudyPlan(planId: string): Promise<void> {
    await api.delete(`/study-plans/${planId}`);
  },

  /**
   * POST /api/v1/study-plans/:planId/items
   * Add an item to an existing study plan
   */
  async addStudyPlanItem(
    planId: string,
    item: {
      topicId: string;
      title: string;
      durationMins: number;
      dueDate: string;
      priority: 'HIGH' | 'MEDIUM' | 'LOW';
    }
  ) {
    const res = await api.post<ApiSuccess<any>>(`/study-plans/${planId}/items`, item);
    return res.data.data;
  },
};
