import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/features/auth/authService';
import { queryClient, queryKeys } from '@/lib/queryClient';
import { getErrorMessage } from '@/lib/utils';
import type { LoginFormData, RegisterFormData } from '@/features/auth/schemas';

// ─── useAuth ──────────────────────────────────────────────────────────────────
export function useAuth() {
  const store = useAuthStore();
  const navigate = useNavigate();

  // ── Login ──────────────────────────────────────────────────────────────────
  const loginMutation = useMutation({
    mutationFn: ({ email, password }: Pick<LoginFormData, 'email' | 'password'>) =>
      authService.login(email, password),
    onSuccess: (data) => {
      authService.persistSession(data);
      queryClient.invalidateQueries({ queryKey: queryKeys.user.me() });
      toast.success(`Welcome back, ${data.user.firstName}!`);
      // Role-based redirect
      if (data.user.role === 'ADMIN' || data.user.role === 'SUPER_ADMIN') {
        navigate('/admin/dashboard');
      } else if (data.user.role === 'PARENT') {
        navigate('/parent/dashboard');
      } else if (data.user.role === 'TUTOR') {
        navigate('/tutor/dashboard');
      } else {
        navigate('/dashboard');
      }
    },
    onError: (error) => {
      toast.error(getErrorMessage(error), { id: 'login-error', duration: 5000 });
    },
  });

  // ── Register ───────────────────────────────────────────────────────────────
  const registerMutation = useMutation({
    mutationFn: (data: Omit<RegisterFormData, 'confirmPassword' | 'agreeTerms'>) =>
      authService.register(data),
    onSuccess: (data) => {
      authService.persistSession(data);
      toast.success('Account created! Check your email to verify.');
      // Non-student roles skip the student onboarding flow
      if (data.user.role === 'PARENT') {
        navigate('/parent/dashboard');
      } else if (data.user.role === 'TUTOR') {
        navigate('/tutor/dashboard');
      } else {
        navigate('/onboarding');
      }
    },
    onError: (error) => {
      toast.error(getErrorMessage(error), { id: 'register-error', duration: 5000 });
    },
  });

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      authService.clearSession();
      queryClient.clear();
      navigate('/login', { replace: true });
    },
  });

  // ── Forgot password ────────────────────────────────────────────────────────
  const forgotPasswordMutation = useMutation({
    mutationFn: (email: string) => authService.forgotPassword(email),
    onSuccess: () => {
      toast.success('If that email exists, a reset link is on its way.');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error), { id: 'forgot-pw-error', duration: 5000 });
    },
  });

  // ── Reset password ─────────────────────────────────────────────────────────
  const resetPasswordMutation = useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
      authService.resetPassword(token, newPassword),
    onSuccess: () => {
      toast.success('Password reset successfully. Please log in.');
      navigate('/login');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error), { id: 'reset-pw-error', duration: 5000 });
    },
  });

  // ── Current user (background refresh — syncs store after token refresh) ──
  const meQuery = useQuery({
    queryKey: queryKeys.user.me(),
    queryFn: async () => {
      const data = await authService.getMe();
      // Sync fresh user + subscription into the store
      const subscription = data.subscription ?? {
        id: '',
        userId: data.user.id,
        tier: 'FREE' as const,
        status: 'ACTIVE' as const,
        cancelAtPeriodEnd: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      useAuthStore.getState().setUser(data.user);
      useAuthStore.getState().setSubscription(subscription);
      return data;
    },
    enabled: store.isAuthenticated,
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: false,
  });

  return {
    // State
    user: store.user,
    accessToken: store.accessToken,
    subscription: store.subscription,
    isAuthenticated: store.isAuthenticated,
    isInitialized: store.isInitialized,
    isFetchingMe: meQuery.isLoading,

    // Role helpers
    hasRole: store.hasRole,
    hasFeature: store.hasFeature,
    isAdmin: store.isAdmin(),
    isTutor: store.isTutor(),
    isParent: store.isParent(),
    isSchoolAdmin: store.isSchoolAdmin(),

    // Mutations
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,

    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,

    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,

    forgotPassword: forgotPasswordMutation.mutate,
    isSendingReset: forgotPasswordMutation.isPending,
    forgotPasswordSuccess: forgotPasswordMutation.isSuccess,

    resetPassword: resetPasswordMutation.mutate,
    resetPasswordAsync: resetPasswordMutation.mutateAsync,
    isResettingPassword: resetPasswordMutation.isPending,

    // Google OAuth
    loginWithGoogle: () => {
      window.location.href = authService.getGoogleOAuthUrl();
    },
  };
}
