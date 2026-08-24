import { api } from '@/lib/axios';
import type {
  ExamSimulation, ExamCategory, Question,
  ApiSuccess, ApiPaginated, PaginationQuery, SubmittedAnswer,
} from '@/types';

export interface StartSimulationResponse {
  simulation: Pick<
    ExamSimulation,
    'id' | 'examCategory' | 'totalQuestions' | 'timeLimitMins' | 'startedAt'
  > & { totalMarks: number };
  questions: Pick<Question, 'id' | 'body' | 'questionType' | 'options' | 'marks' | 'imageUrl'>[];
}

export interface SimulationResultsResponse {
  simulation: Pick<
    ExamSimulation,
    'id' | 'examCategory' | 'title' | 'score' | 'totalMarks' | 'percentage' | 'isPassed' | 'submittedAt'
  >;
  performance: {
    totalQuestions: number;
    correctAnswers: number;
    wrongAnswers: number;
    percentage?: number;
  };
  details: {
    allAnswers: Array<{
      questionId: string;
      questionBody?: string;
      userAnswer?: string;
      correctAnswer?: string;
      isCorrect: boolean;
      marksAwarded: number;
      explanation?: string;
    }>;
    wrongAnswers: SimulationResultsResponse['details']['allAnswers'];
  };
}

export const examSimulationService = {
  /** POST /api/v1/exams/simulate — start a timed exam simulation */
  async startSimulation(data: {
    examCategory: ExamCategory;
    subjectId?: string;
    year?: number;
    timeLimitMins?: number;
  }): Promise<StartSimulationResponse> {
    const res = await api.post<ApiSuccess<StartSimulationResponse>>('/exams/simulate', data);
    return res.data.data;
  },

  /** GET /api/v1/exams/simulate/me — user's simulation history */
  async getMySimulations(params: PaginationQuery = {}): Promise<ApiPaginated<ExamSimulation>> {
    const res = await api.get<ApiPaginated<ExamSimulation>>('/exams/simulate/me', { params });
    return res.data;
  },

  /** GET /api/v1/exams/simulate/:id — get live simulation state + seconds remaining */
  async getSimulation(simulationId: string): Promise<{
    simulation: ExamSimulation;
    secondsRemaining: number | null;
    isExpired: boolean;
  }> {
    const res = await api.get<ApiSuccess<{
      simulation: ExamSimulation;
      secondsRemaining: number | null;
      isExpired: boolean;
    }>>(`/exams/simulate/${simulationId}`);
    return res.data.data;
  },

  /** POST /api/v1/exams/simulate/:id/submit — submit answers */
  async submitSimulation(
    simulationId: string,
    answers: SubmittedAnswer[]
  ): Promise<{
    simulation: ExamSimulation;
    results: { score: number; totalMarks: number; percentage: number; isPassed: boolean; answersCount: number };
  }> {
    const res = await api.post<ApiSuccess<{
      simulation: ExamSimulation;
      results: { score: number; totalMarks: number; percentage: number; isPassed: boolean; answersCount: number };
    }>>(`/exams/simulate/${simulationId}/submit`, { answers });
    return res.data.data;
  },

  /** GET /api/v1/exams/simulate/:id/results — get detailed results */
  async getResults(simulationId: string): Promise<SimulationResultsResponse> {
    const res = await api.get<ApiSuccess<SimulationResultsResponse>>(
      `/exams/simulate/${simulationId}/results`
    );
    return res.data.data;
  },
};
