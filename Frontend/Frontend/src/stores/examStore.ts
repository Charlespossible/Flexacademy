import { create } from 'zustand';
import type { Question, ExamCategory } from '@/types';

interface ExamAnswer {
  questionId: string;
  selectedOption?: string;
  timeTaken?: number;
}

interface ExamState {
  // Active simulation
  simulationId: string | null;
  examCategory: ExamCategory | null;
  title: string | null;
  questions: Question[];
  timeLimitMins: number;
  startedAt: string | null;
  answers: Record<string, ExamAnswer>; // questionId → answer
  currentQuestionIndex: number;
  isSubmitted: boolean;
  isAutoSubmitted: boolean;

  // Actions
  startExam: (params: {
    simulationId: string;
    examCategory: ExamCategory;
    title: string;
    questions: Question[];
    timeLimitMins: number;
    startedAt: string;
  }) => void;
  setAnswer: (questionId: string, selectedOption: string) => void;
  setCurrentQuestion: (index: number) => void;
  markSubmitted: (autoSubmitted?: boolean) => void;
  resetExam: () => void;

  // Computed
  getAnsweredCount: () => number;
  getRemainingSeconds: () => number;
  getAnswerForQuestion: (questionId: string) => ExamAnswer | undefined;
}

const initialState = {
  simulationId: null,
  examCategory: null,
  title: null,
  questions: [],
  timeLimitMins: 60,
  startedAt: null,
  answers: {},
  currentQuestionIndex: 0,
  isSubmitted: false,
  isAutoSubmitted: false,
};

export const useExamStore = create<ExamState>((set, get) => ({
  ...initialState,

  startExam: ({ simulationId, examCategory, title, questions, timeLimitMins, startedAt }) => {
    set({
      simulationId,
      examCategory,
      title,
      questions,
      timeLimitMins,
      startedAt,
      answers: {},
      currentQuestionIndex: 0,
      isSubmitted: false,
      isAutoSubmitted: false,
    });
  },

  setAnswer: (questionId, selectedOption) => {
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: { questionId, selectedOption },
      },
    }));
  },

  setCurrentQuestion: (index) => {
    set({ currentQuestionIndex: index });
  },

  markSubmitted: (autoSubmitted = false) => {
    set({ isSubmitted: true, isAutoSubmitted: autoSubmitted });
  },

  resetExam: () => {
    set(initialState);
  },

  getAnsweredCount: () => {
    return Object.keys(get().answers).length;
  },

  getRemainingSeconds: () => {
    const { startedAt, timeLimitMins } = get();
    if (!startedAt) return timeLimitMins * 60;
    const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000;
    return Math.max(0, timeLimitMins * 60 - elapsed);
  },

  getAnswerForQuestion: (questionId) => {
    return get().answers[questionId];
  },
}));
