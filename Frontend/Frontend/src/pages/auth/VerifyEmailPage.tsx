import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

import { authService } from '@/features/auth/authService';
import { Button } from '@/components/ui/Button';

type State = 'loading' | 'success' | 'error';

export default function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<State>('loading');
  const called = useRef(false);

  useEffect(() => {
    if (called.current || !token) return;
    called.current = true;

    authService
      .verifyEmail(token)
      .then(() => setState('success'))
      .catch(() => setState('error'));
  }, [token]);

  return (
    <div className="min-h-dvh bg-base flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-base-surface border border-white/[0.06] rounded-2xl p-8 text-center shadow-card">
        {/* Logo */}
        <Link to="/" className="inline-flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center">
            <span className="font-display font-bold text-accent text-sm">F</span>
          </div>
          <span className="font-display font-bold text-lg text-text-primary">
            Flex<span className="text-accent">Academy</span>
          </span>
        </Link>

        {state === 'loading' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <Loader2 size={40} className="text-accent animate-spin mx-auto" />
            <p className="font-display text-lg font-semibold text-text-primary">
              Verifying your email…
            </p>
            <p className="text-sm text-text-muted">This will only take a moment.</p>
          </motion.div>
        )}

        {state === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="space-y-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 260 }}
              className="w-16 h-16 rounded-full bg-brand-success/10 border border-brand-success/30 flex items-center justify-center mx-auto"
            >
              <CheckCircle size={30} className="text-brand-success" />
            </motion.div>

            <div>
              <h2 className="font-display text-xl font-bold text-text-primary">
                Email verified! 🎉
              </h2>
              <p className="text-sm text-text-secondary mt-2">
                Your account is now active. Sign in to start your learning journey.
              </p>
            </div>

            <Button asChild size="lg" className="w-full mt-2">
              <Link to="/login?message=verified">Sign in to FlexAcademy</Link>
            </Button>
          </motion.div>
        )}

        {state === 'error' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-brand-danger/10 border border-brand-danger/30 flex items-center justify-center mx-auto">
              <XCircle size={30} className="text-brand-danger" />
            </div>

            <div>
              <h2 className="font-display text-xl font-bold text-text-primary">
                Verification failed
              </h2>
              <p className="text-sm text-text-secondary mt-2">
                This link may have expired (links are valid for 24 hours) or has already been used.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button asChild size="lg" className="w-full">
                <Link to="/login">Go to login</Link>
              </Button>
              <p className="text-xs text-text-muted">
                Need a new link?{' '}
                <Link to="/login" className="text-accent hover:underline">
                  Sign in and we&apos;ll resend it.
                </Link>
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
