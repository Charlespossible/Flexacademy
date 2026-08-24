import { api } from '@/lib/axios';
import type {
  Quiz, QuizAttempt, AttemptAnswer,
  ExamCategory, DifficultyLevel,
  ApiSuccess, ApiPaginated, PaginationQuery, SubmittedAnswer,
} from '@/types';

export const quizService = {
  /** GET /api/v1/quizzes — list available quizzes */
  async getQuizzes(params: PaginationQuery & {
    examCategory?: ExamCategory;
    difficulty?: DifficultyLevel;
    subject?: string;
  } = {}): Promise<ApiPaginated<Quiz>> {
    const res = await api.get<ApiPaginated<Quiz>>('/quizzes', { params });
    return res.data;
  },

  /** GET /api/v1/quizzes/:id — quiz detail + questions */
  async getQuiz(quizId: string): Promise<Quiz> {
    const res = await api.get<ApiSuccess<Quiz>>(`/quizzes/${quizId}`);
    return res.data.data;
  },

  /** POST /api/v1/quizzes/:id/start — start a new attempt */
  async startAttempt(quizId: string): Promise<{
    attempt: QuizAttempt;
    quiz: Pick<Quiz, 'id' | 'title' | 'timeLimit'>;
  }> {
    const res = await api.post<ApiSuccess<{
      attempt: QuizAttempt;
      quiz: Pick<Quiz, 'id' | 'title' | 'timeLimit'>;
    }>>(`/quizzes/${quizId}/start`);
    return res.data.data;
  },

  /** POST /api/v1/quizzes/attempts/:id/submit — submit answers */
  async submitAttempt(
    attemptId: string,
    answers: SubmittedAnswer[],
    timeTaken?: number
  ): Promise<{
    attempt: QuizAttempt;
    results: { totalScore: number; maxMarks: number; percentage: number; isPassed: boolean };
  }> {
    const res = await api.post<ApiSuccess<{
      attempt: QuizAttempt;
      results: { totalScore: number; maxMarks: number; percentage: number; isPassed: boolean };
    }>>(`/quizzes/attempts/${attemptId}/submit`, { answers, timeTaken });
    return res.data.data;
  },

  /** GET /api/v1/quizzes/attempts/:id/results — detailed results with explanations */
  async getAttemptResults(attemptId: string): Promise<{
    attempt: QuizAttempt;
    answers: (AttemptAnswer & { question: { id: string; body: string; explanation?: string; options?: unknown } })[];
    wrongAnswers: AttemptAnswer[];
    performance: { correct: number; total: number; percentage?: number; passed?: boolean };
  }> {
    const res = await api.get<ApiSuccess<{
      attempt: QuizAttempt;
      answers: AttemptAnswer[];
      wrongAnswers: AttemptAnswer[];
      performance: { correct: number; total: number; percentage?: number; passed?: boolean };
    }>>(`/quizzes/attempts/${attemptId}/results`);
    return res.data.data as never;
  },

  /** GET /api/v1/quizzes/me/attempts — my quiz attempt history */
  async getMyAttempts(params: PaginationQuery = {}): Promise<ApiPaginated<QuizAttempt>> {
    const res = await api.get<ApiPaginated<QuizAttempt>>('/quizzes/me/attempts', { params });
    return res.data;
  },
};
