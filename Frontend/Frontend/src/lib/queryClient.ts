import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30,   // 30 minutes
      retry: (failureCount, error) => {
        // Don't retry on 401/403/404
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status === 401 || status === 403 || status === 404) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    // No global mutation onError — the axios interceptor toasts non-auth errors,
    // and auth mutations (login/register) own their own onError messages.
  },
});

// ─── Query Key Factory ────────────────────────────────────────────────────────
export const queryKeys = {
  // Auth & User
  user: {
    me: () => ['user', 'me'] as const,
    bookmarks: () => ['user', 'bookmarks'] as const,
  },

  // Subjects & Courses
  subjects: {
    all: (params?: Record<string, unknown>) => ['subjects', params] as const,
    bySlug: (slug: string) => ['subjects', slug] as const,
    topics: (slug: string) => ['subjects', slug, 'topics'] as const,
  },
  courses: {
    all: (params?: Record<string, unknown>) => ['courses', params] as const,
    bySlug: (slug: string) => ['courses', slug] as const,
  },
  lessons: {
    byId: (id: string) => ['lessons', id] as const,
  },

  // Quiz
  quiz: {
    all: (params?: Record<string, unknown>) => ['quizzes', params] as const,
    byId: (id: string) => ['quizzes', id] as const,
    attempts: () => ['quiz-attempts'] as const,
    attemptById: (id: string) => ['quiz-attempts', id] as const,
  },

  // Exam Simulation
  examSim: {
    all: () => ['exam-simulations'] as const,
    byId: (id: string) => ['exam-simulations', id] as const,
  },

  // AI Tutor
  aiSessions: {
    all: () => ['ai-sessions'] as const,
    byId: (id: string) => ['ai-sessions', id] as const,
    analysis: () => ['ai-analysis'] as const,
  },

  // Study Plans
  studyPlans: {
    all: (status?: string) => ['study-plans', status] as const,
    byId: (id: string) => ['study-plans', id] as const,
    items: (id: string) => ['study-plans', id, 'items'] as const,
  },

  // Flashcards
  flashcards: {
    decks: () => ['flashcard-decks'] as const,
    deckById: (id: string) => ['flashcard-decks', id] as const,
    due: (deckId?: string) => ['flashcards-due', deckId] as const,
  },

  // Progress & Learning Analytics
  progress: {
    me: () => ['progress', 'me'] as const,
    overview: () => ['progress', 'overview'] as const,
    weakAreas: (limit?: number) => ['progress', 'weak-areas', limit] as const,
    subjects: () => ['progress', 'subjects'] as const,
    subjectDetail: (subjectId: string) => ['progress', 'subjects', subjectId] as const,
    topics: (subjectId?: string, params?: Record<string, unknown>) =>
      ['progress', 'topics', subjectId, params] as const,
    topicMastery: () => ['progress', 'topic-mastery'] as const,
    heatmap: () => ['progress', 'heatmap'] as const,
    leaderboard: () => ['progress', 'leaderboard'] as const,
  },

  // Leaderboard
  leaderboard: {
    all: (params?: Record<string, unknown>) => ['leaderboard', params] as const,
  },

  // Tutors
  tutors: {
    all: (params?: Record<string, unknown>) => ['tutors', params] as const,
    byId: (id: string) => ['tutors', id] as const,
  },

  // Bookings
  bookings: {
    me: () => ['bookings', 'me'] as const,
  },

  // Live Classes
  liveClasses: {
    all: (params?: Record<string, unknown>) => ['live-classes', params] as const,
    byId: (id: string) => ['live-classes', id] as const,
  },

  // Notifications
  notifications: {
    all: (params?: Record<string, unknown>) => ['notifications', params] as const,
    preferences: () => ['notifications', 'preferences'] as const,
  },

  // Subscription
  subscription: {
    me: () => ['subscription', 'me'] as const,
    plans: () => ['subscription', 'plans'] as const,
  },

  // Parent
  parent: {
    children: () => ['parent', 'children'] as const,
    alerts: () => ['parent', 'alerts'] as const,
  },

  // School
  school: {
    me: () => ['school', 'me'] as const,
    students: () => ['school', 'students'] as const,
    license: () => ['school', 'license'] as const,
  },

  // Certificates
  certificates: {
    me: () => ['certificates', 'me'] as const,
  },

  // Referrals
  referrals: {
    me: () => ['referrals', 'me'] as const,
  },
} as const;
