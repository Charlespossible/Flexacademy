import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useAuthStore, refreshTokenStorage } from '@/stores/authStore';
import { authService } from '@/features/auth/authService';
import { Button } from '@/components/ui/Button';

// ─────────────────────────────────────────────────────────────────────────────
// The backend redirects here after Google OAuth success:
//   /auth/callback?access=<accessToken>&refresh=<refreshToken>
//
// On error:
//   /auth/callback?error=oauth_failed
// ─────────────────────────────────────────────────────────────────────────────

type State = 'loading' | 'error' | 'success';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const called = useRef(false); // prevent double-execution in StrictMode

  const accessToken = searchParams.get('access');
  const refreshToken = searchParams.get('refresh');
  const error = searchParams.get('error');

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    // Backend reported an error
    if (error) return;

    // Tokens missing
    if (!accessToken || !refreshToken) return;

    async function hydrate() {
      try {
        // Persist refresh token
        refreshTokenStorage.set(refreshToken!);

        // Temporarily set the access token so getMe() can authenticate
        useAuthStore.setState({ accessToken });

        // getMe() returns { user, studentProfile, subscription, ... }
        const data = await authService.getMe();
        const user = data.user;
        const subscription = data.subscription ?? {
          id: '',
          userId: user.id,
          tier: 'FREE' as const,
          status: 'ACTIVE' as const,
          cancelAtPeriodEnd: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setAuth(user, accessToken!, subscription);

        // New users → onboarding, existing → dashboard
        const isNewUser = !data.studentProfile?.targetExams?.length;
        navigate(isNewUser ? '/onboarding' : '/dashboard', { replace: true });
      } catch {
        // handled by rendering error state via error flag check below
        useAuthStore.setState({ accessToken: null, isInitialized: true });
      }
    }

    hydrate();
  }, [accessToken, refreshToken, error, navigate, setAuth]);

  // ── Determine render state ─────────────────────────────────────────────────
  const state: State =
    error || (!accessToken && !refreshToken) ? 'error' : 'loading';

  return (
    <div className="min-h-dvh bg-base flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        {/* Logo */}
        <div className="inline-flex items-center gap-2 mb-10">
          <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center">
            <span className="font-display font-bold text-accent text-base">F</span>
          </div>
          <span className="font-display font-bold text-xl text-text-primary">
            Flex<span className="text-accent">Academy</span>
          </span>
        </div>

        {state === 'loading' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Spinner ring */}
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-2 border-accent/10" />
              <div className="absolute inset-0 rounded-full border-t-2 border-accent animate-spin" />
              <div className="absolute inset-2 rounded-full bg-accent/5 flex items-center justify-center">
                <Loader2 size={20} className="text-accent animate-spin" />
              </div>
            </div>

            <div>
              <h2 className="font-display text-lg font-semibold text-text-primary">
                Signing you in…
              </h2>
              <p className="text-sm text-text-muted mt-1">
                Fetching your profile with Google
              </p>
            </div>

            {/* Animated dots */}
            <div className="flex items-center justify-center gap-1.5 pt-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-accent/50"
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {state === 'error' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-5"
          >
            <div className="w-14 h-14 rounded-full bg-brand-danger/10 border border-brand-danger/30 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} className="text-brand-danger" />
            </div>

            <div>
              <h2 className="font-display text-lg font-semibold text-text-primary">
                Sign-in failed
              </h2>
              <p className="text-sm text-text-muted mt-1">
                {error === 'oauth_failed'
                  ? 'Google authentication was unsuccessful.'
                  : 'Something went wrong during sign-in.'}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button asChild size="lg" className="w-full">
                <Link to="/login">Try again</Link>
              </Button>
              <Button asChild variant="ghost" size="md" className="w-full">
                <Link to="/register">Create an account</Link>
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
