import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';

import { router } from '@/app/router';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore, refreshTokenStorage } from '@/stores/authStore';
import { useThemeStore, applyTheme } from '@/stores/themeStore';

// ─── ThemeInitializer ─────────────────────────────────────────────────────────
// Ensures the persisted theme is re-applied after React hydrates.
// The themeStore module already applies the theme synchronously at import time
// (pre-render, no flash), but this component guards against edge cases where
// the Zustand store hydrates asynchronously from localStorage.
function ThemeInitializer() {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return null;
}

// ─── Auth Initializer ────────────────────────────────────────────────────────
function AuthInitializer() {
  const { setAuth, clearAuth, initialize, isInitialized } = useAuthStore();

  useEffect(() => {
    if (isInitialized) return;

    async function restoreSession() {
      const refreshToken = refreshTokenStorage.get();
      if (!refreshToken) {
        initialize();
        return;
      }
      try {
        const { api } = await import('@/lib/axios');
        const res = await api.post<{
          success: boolean;
          data: { accessToken: string; refreshToken: string };
        }>('/auth/refresh', { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = res.data.data;
        refreshTokenStorage.set(newRefreshToken);
        useAuthStore.setState({ accessToken });

        // /users/me returns { user, studentProfile, tutorProfile, subscription, badges }
        const userRes = await api.get<{ success: boolean; data: { user: import('@/types').User; subscription: import('@/types').Subscription | null } }>('/users/me');
        const { user, subscription: sub } = userRes.data.data;
        const subscription = sub ?? {
          id: '',
          userId: user.id,
          tier: 'FREE' as const,
          status: 'ACTIVE' as const,
          cancelAtPeriodEnd: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setAuth(user, accessToken, subscription);
      } catch {
        clearAuth();
      }
    }

    restoreSession();
  }, [isInitialized, setAuth, clearAuth, initialize]);

  return null;
}

// ─── Theme-aware Toaster ──────────────────────────────────────────────────────
// Reads CSS variables at render time so toast colours respond to theme switches.
function ThemedToaster() {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';

  return (
    <Toaster
      position="top-right"
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background:   isDark ? '#1a1e2e' : '#ffffff',
          color:        isDark ? '#f1f5f9' : '#0f172a',
          border:       isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
          borderRadius: '12px',
          fontSize:     '14px',
          fontFamily:   'DM Sans, sans-serif',
          boxShadow:    isDark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.1)',
          padding:      '12px 16px',
          maxWidth:     '380px',
        },
        success: {
          iconTheme: {
            primary:   isDark ? '#34d399' : '#059669',
            secondary: isDark ? '#1a1e2e' : '#ffffff',
          },
        },
        error: {
          iconTheme: {
            primary:   isDark ? '#f87171' : '#dc2626',
            secondary: isDark ? '#1a1e2e' : '#ffffff',
          },
          duration: 5000,
        },
      }}
    />
  );
}

// ─── Root Providers ───────────────────────────────────────────────────────────
export function Providers() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Theme: apply persisted theme immediately, guard against async hydration */}
      <ThemeInitializer />

      {/* Auth: silently restore session from refresh token */}
      <AuthInitializer />

      {/* The router owns the entire render tree */}
      <RouterProvider router={router} />

      {/* Theme-aware toasts — portalled outside the router tree */}
      <ThemedToaster />

      {/* React Query devtools — dev only */}
      {import.meta.env.DEV && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      )}
    </QueryClientProvider>
  );
}
