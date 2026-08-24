import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { User, Subscription, SubscriptionTier } from '@/types';
import { TIER_ORDER } from '@/types';
import { storage } from '@/lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────
const REFRESH_TOKEN_KEY = 'fa_rt';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AuthState {
  user: User | null;
  accessToken: string | null;
  subscription: Subscription | null;
  isAuthenticated: boolean;
  isInitialized: boolean; // has initial auth check completed

  // Actions
  setAuth: (user: User, accessToken: string, subscription: Subscription) => void;
  setAccessToken: (token: string) => void;
  setUser: (user: User) => void;
  setSubscription: (subscription: Subscription) => void;
  clearAuth: () => void;
  initialize: () => void;

  // Helpers
  hasRole: (...roles: User['role'][]) => boolean;
  hasFeature: (minTier: SubscriptionTier) => boolean;
  isAdmin: () => boolean;
  isTutor: () => boolean;
  isParent: () => boolean;
  isSchoolAdmin: () => boolean;
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useAuthStore = create<AuthState>()(
  subscribeWithSelector((set, get) => ({
    user: null,
    accessToken: null,
    subscription: null,
    isAuthenticated: false,
    isInitialized: false,

    setAuth: (user, accessToken, subscription) => {
      set({
        user,
        accessToken,
        subscription,
        isAuthenticated: true,
        isInitialized: true,
      });
    },

    setAccessToken: (token) => {
      set({ accessToken: token });
    },

    setUser: (user) => {
      set({ user });
    },

    setSubscription: (subscription) => {
      set({ subscription });
    },

    clearAuth: () => {
      storage.remove(REFRESH_TOKEN_KEY);
      set({
        user: null,
        accessToken: null,
        subscription: null,
        isAuthenticated: false,
        isInitialized: true,
      });
    },

    initialize: () => {
      // Called on app mount — just marks as initialized if no persisted session
      const { isInitialized } = get();
      if (!isInitialized) {
        set({ isInitialized: true });
      }
    },

    // ─── Helpers ──────────────────────────────────────────────────────────────
    hasRole: (...roles) => {
      const { user } = get();
      return user ? roles.includes(user.role) : false;
    },

    hasFeature: (minTier) => {
      const { subscription } = get();
      if (!subscription) return false;
      if (subscription.status !== 'ACTIVE' && subscription.status !== 'TRIAL') return false;
      return TIER_ORDER[subscription.tier] >= TIER_ORDER[minTier];
    },

    isAdmin: () => {
      const { user } = get();
      return user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
    },

    isTutor: () => {
      const { user } = get();
      return user?.role === 'TUTOR';
    },

    isParent: () => {
      const { user } = get();
      return user?.role === 'PARENT';
    },

    isSchoolAdmin: () => {
      const { user } = get();
      return user?.role === 'SCHOOL_ADMIN';
    },
  }))
);

// ─── Refresh Token Persistence Helpers ───────────────────────────────────────
export const refreshTokenStorage = {
  get: (): string | null => storage.get<string>(REFRESH_TOKEN_KEY),
  set: (token: string): void => storage.set(REFRESH_TOKEN_KEY, token),
  remove: (): void => storage.remove(REFRESH_TOKEN_KEY),
};
