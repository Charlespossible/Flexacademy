import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ────────────────────────────────────────────────────────────────────
export type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

// ─── DOM helper ───────────────────────────────────────────────────────────────
// Applies data-theme attribute to <html> and sets color-scheme so native
// browser controls (scrollbars, date pickers, form inputs) match the theme.
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  root.style.colorScheme = theme;
}

// ─── Pre-render flash prevention ─────────────────────────────────────────────
// This runs synchronously at module evaluation time — before React mounts —
// so the correct theme is applied before the first paint, eliminating the
// white flash on a dark-mode user's page reload.
(function applyPersistedThemeImmediately() {
  try {
    const raw = localStorage.getItem('fa-theme');
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: { theme?: Theme } };
      const saved = parsed?.state?.theme;
      if (saved === 'light' || saved === 'dark') {
        applyTheme(saved);
        return;
      }
    }
  } catch {
    // JSON parse failure — fall through to default
  }
  // Default: dark mode
  applyTheme('dark');
})();

// ─── Zustand store ────────────────────────────────────────────────────────────
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark' as Theme,

      setTheme: (theme: Theme) => {
        applyTheme(theme);
        set({ theme });
      },

      toggle: () => {
        const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        set({ theme: next });
      },
    }),
    {
      name: 'fa-theme',
      // Re-apply on hydration in case SSR or stale DOM
      onRehydrateStorage: () => (state) => {
        if (state?.theme) applyTheme(state.theme);
      },
    }
  )
);
