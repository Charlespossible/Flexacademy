import { authApi } from '@/lib/axios';
import { refreshTokenStorage, useAuthStore } from '@/stores/authStore';
import type { AuthResponse, User, Subscription } from '@/types';

// Shape returned by GET /users/me
export interface MeResponse {
  user: User;
  subscription: Subscription | null;
  studentProfile: User['studentProfile'];
  tutorProfile: User['tutorProfile'];
  badges: unknown[];
}

// ─── Default FREE subscription (used when backend omits it) ──────────────────
function buildFreeSubscription(userId: string): Subscription {
  return {
    id: '',
    userId,
    tier: 'FREE',
    status: 'ACTIVE',
    cancelAtPeriodEnd: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ─── Auth Service ─────────────────────────────────────────────────────────────

export const authService = {
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
    gradeLevel?: string;
    curriculum?: string;
  }): Promise<AuthResponse> {
    const res = await authApi.register(data);
    return res.data.data as AuthResponse;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await authApi.login({ email, password });
    return res.data.data as AuthResponse;
  },

  async logout(): Promise<void> {
    await authApi.logout().catch(() => {
      // Ignore errors — still clear local state
    });
  },

  async forgotPassword(email: string): Promise<void> {
    await authApi.forgotPassword(email);
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await authApi.resetPassword(token, newPassword);
  },

  async verifyEmail(token: string): Promise<void> {
    await authApi.verifyEmail(token);
  },

  // Returns the full /users/me shape — user is nested under `user` key
  async getMe(): Promise<MeResponse> {
    const res = await authApi.getMe();
    return res.data.data as MeResponse;
  },

  // Persist tokens and hydrate store
  // Works for both login (subscription included) and register (subscription absent)
  persistSession(data: AuthResponse): void {
    refreshTokenStorage.set(data.refreshToken);
    const subscription = data.subscription ?? buildFreeSubscription(data.user.id);
    useAuthStore.getState().setAuth(data.user, data.accessToken, subscription);
  },

  clearSession(): void {
    useAuthStore.getState().clearAuth();
  },

  // Build Google OAuth URL
  getGoogleOAuthUrl(): string {
    const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1';
    return `${base}/auth/google`;
  },
};
