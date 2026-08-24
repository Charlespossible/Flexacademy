import { create } from 'zustand';
import type { ProgressOverview, WeakArea, SubjectProgress } from '@/types';

/**
 * Progress Store — maintains cached progress state
 * Synced via React Query in StudyDashboard
 */
interface ProgressState {
  // State
  overview: ProgressOverview | null;
  weakAreas: WeakArea[];
  subjectProgress: SubjectProgress[];
  isLoading: boolean;
  lastUpdated: string | null;

  // Actions
  setOverview: (data: ProgressOverview) => void;
  setWeakAreas: (areas: WeakArea[]) => void;
  setSubjectProgress: (progress: SubjectProgress[]) => void;
  setLoading: (value: boolean) => void;
  
  // Computed
  getTopWeakArea: () => WeakArea | null;
  getTotalMastery: () => number;
  getStreakStatus: () => string; // "🔥 5-day streak" or "Start a streak!"
  reset: () => void;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  // Initial state
  overview: null,
  weakAreas: [],
  subjectProgress: [],
  isLoading: false,
  lastUpdated: null,

  // Actions
  setOverview: (data) => {
    set({
      overview: data,
      lastUpdated: new Date().toISOString(),
    });
  },

  setWeakAreas: (areas) => {
    set({ weakAreas: areas });
  },

  setSubjectProgress: (progress) => {
    set({ subjectProgress: progress });
  },

  setLoading: (value) => {
    set({ isLoading: value });
  },

  // Computed helpers
  getTopWeakArea: () => {
    const { weakAreas } = get();
    return weakAreas.length > 0 ? weakAreas[0] : null;
  },

  getTotalMastery: () => {
    const { overview } = get();
    return overview?.avgMastery ?? 0;
  },

  getStreakStatus: () => {
    const { overview } = get();
    if (!overview) return 'Start a streak!';
    const streak = overview.currentStreak;
    if (streak === 0) return 'Start a streak!';
    if (streak === 1) return '🔥 1-day streak';
    if (streak < 7) return `🔥 ${streak}-day streak`;
    if (streak < 30) return `🔥 ${streak}-day streak (${Math.floor(streak / 7)} weeks)`;
    return `🔥 ${streak}-day streak (${Math.floor(streak / 30)} months)`;
  },

  reset: () => {
    set({
      overview: null,
      weakAreas: [],
      subjectProgress: [],
      isLoading: false,
      lastUpdated: null,
    });
  },
}));
