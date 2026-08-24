import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowLeft, AlertTriangle } from 'lucide-react';

import { AuthLayout } from '@/features/auth/AuthLayout';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/features/auth/schemas';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { PasswordInput } from '@/components/ui/Input';
import { getPasswordStrength } from '@/lib/utils';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword, isResettingPassword } = useAuth();

  const token = searchParams.get('token');

  // Redirect to forgot-password if no token provided
  useEffect(() => {
    if (!token) navigate('/forgot-password', { replace: true });
  }, [token, navigate]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const passwordValue = watch('newPassword');
  const strength = getPasswordStrength(passwordValue ?? '');

  const onSubmit = (data: ResetPasswordFormData) => {
    if (!token) return;
    resetPassword({ token, newPassword: data.newPassword });
  };

  // Token missing UI
  if (!token) {
    return (
      <AuthLayout heading="Invalid link" subheading="This reset link is invalid or has expired">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-brand-warning/10 border border-brand-warning/30 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} className="text-brand-warning" />
          </div>
          <p className="text-sm text-text-secondary mb-6">
            Please request a new password reset link.
          </p>
          <Button asChild size="lg" className="w-full">
            <Link to="/forgot-password">Request new link</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      heading="Set new password"
      subheading="Choose a strong password you haven't used before"
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Security badge */}
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-accent/5 border border-accent/15 mb-6">
          <ShieldCheck size={18} className="text-accent shrink-0" />
          <p className="text-xs text-text-secondary">
            Your reset link is valid for{' '}
            <span className="text-text-primary font-medium">15 minutes</span>. Choose a strong
            password.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* New password with strength */}
          <PasswordInput
            label="New password"
            placeholder="Min 8 chars, uppercase, number"
            autoComplete="new-password"
            autoFocus
            error={errors.newPassword?.message}
            showStrength
            strength={strength}
            value={passwordValue}
            {...register('newPassword')}
          />

          {/* Confirm */}
          <PasswordInput
            label="Confirm new password"
            placeholder="Repeat your new password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          {/* Requirements checklist */}
          <div className="p-3 rounded-lg bg-base-elevated border border-white/[0.06] space-y-1.5">
            {[
              { label: 'At least 8 characters', met: (passwordValue?.length ?? 0) >= 8 },
              { label: 'One uppercase letter', met: /[A-Z]/.test(passwordValue ?? '') },
              { label: 'One lowercase letter', met: /[a-z]/.test(passwordValue ?? '') },
              { label: 'One number', met: /\d/.test(passwordValue ?? '') },
            ].map(({ label, met }) => (
              <div key={label} className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold ${met ? 'text-brand-success' : 'text-text-muted'}`}
                >
                  {met ? '✓' : '○'}
                </span>
                <span className={`text-xs ${met ? 'text-text-secondary' : 'text-text-muted'}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full mt-2"
            loading={isResettingPassword}
          >
            Reset password
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
    </AuthLayout>
  );
}
