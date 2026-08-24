import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

import { AuthLayout } from '@/features/auth/AuthLayout';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/features/auth/schemas';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ForgotPasswordPage() {
  const { forgotPassword, isSendingReset, forgotPasswordSuccess } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const email = watch('email');

  const onSubmit = (data: ForgotPasswordFormData) => {
    forgotPassword(data.email);
  };

  return (
    <AuthLayout
      heading="Reset your password"
      subheading="Enter your email and we'll send you a reset link"
    >
      <AnimatePresence mode="wait">
        {/* ── Success state ─────────────────────────────────────────────── */}
        {forgotPasswordSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1, type: 'spring', stiffness: 200 }}
              className="w-16 h-16 rounded-full bg-brand-success/10 border border-brand-success/30 flex items-center justify-center mx-auto mb-5"
            >
              <CheckCircle size={28} className="text-brand-success" />
            </motion.div>

            <h3 className="font-display text-xl font-semibold text-text-primary mb-2">
              Check your inbox
            </h3>
            <p className="text-sm text-text-secondary mb-1">
              We&apos;ve sent a password reset link to:
            </p>
            <p className="text-sm font-semibold text-accent mb-6 break-all">{email}</p>

            <div className="space-y-3 p-4 rounded-xl bg-base-elevated border border-white/[0.06] text-left mb-6">
              {[
                'Open the email from FlexAcademy',
                'Click the "Reset Password" link',
                'Link expires in 15 minutes',
              ].map((step, i) => (
                <div key={step} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center shrink-0 text-2xs font-bold text-accent">
                    {i + 1}
                  </span>
                  <span className="text-sm text-text-secondary">{step}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-text-muted">
              Didn&apos;t receive it?{' '}
              <button
                type="button"
                onClick={() => handleSubmit(onSubmit)()}
                className="text-accent hover:underline"
              >
                Resend email
              </button>{' '}
              or check your spam folder.
            </p>

            <Link
              to="/login"
              className="mt-6 inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft size={14} />
              Back to login
            </Link>
          </motion.div>
        ) : (
          /* ── Form state ────────────────────────────────────────────────── */
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
                leftIcon={<Mail size={15} />}
                error={errors.email?.message}
                hint="We'll send a reset link to this address"
                {...register('email')}
              />

              <Button
                type="submit"
                size="lg"
                className="w-full"
                loading={isSendingReset}
              >
                Send reset link
              </Button>
            </form>

            <Link
              to="/login"
              className="mt-6 flex items-center justify-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft size={14} />
              Back to login
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}
