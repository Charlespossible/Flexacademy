import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Trash2, LogOut, ChevronRight, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import api from '@/lib/axios';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { PasswordInput } from '@/components/ui/Input';
import { getPasswordStrength } from '@/lib/utils';

// ─── Schemas ──────────────────────────────────────────────────────────────────
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Min 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[a-z]/, 'Must contain a lowercase letter')
      .regex(/\d/, 'Must contain a number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-base-surface border border-border-subtle rounded-2xl p-6">
      <div className="mb-5">
        <h2 className="font-display font-semibold text-text-primary">{title}</h2>
        {description && <p className="text-sm text-text-muted mt-1">{description}</p>}
      </div>
      {children}
    </div>
  );
}

// ─── Setting row (for toggle-style items) ─────────────────────────────────────
function SettingRow({
  label,
  description,
  action,
}: {
  label: string;
  description?: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border-subtle last:border-0">
      <div>
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {description && <p className="text-xs text-text-muted mt-0.5">{description}</p>}
      </div>
      <div className="ml-4 shrink-0">{action}</div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();
  const [pwDone, setPwDone] = useState(false);
  const isOAuthUser = !!(user?.googleId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const newPassword = watch('newPassword');

  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordForm) =>
      api.patch('/users/me/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    onSuccess: () => {
      toast.success('Password changed successfully.');
      reset();
      setPwDone(true);
      setTimeout(() => setPwDone(false), 4000);
    },
  });

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-sm text-text-muted mt-1">Manage your account security and preferences.</p>
      </div>

      {/* ── Password ──────────────────────────────────────────────────────── */}
      <Section
        title="Change Password"
        description={
          isOAuthUser
            ? 'Your account uses Google sign-in — password change is not available.'
            : 'Choose a strong password you don\'t use anywhere else.'
        }
      >
        {isOAuthUser ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-base-subtle text-sm text-text-muted">
            <Lock size={16} className="text-accent shrink-0" />
            Signed in with Google. Password management is handled by Google.
          </div>
        ) : (
          <form
            onSubmit={handleSubmit((data) => changePasswordMutation.mutate(data))}
            className="space-y-4"
          >
            <PasswordInput
              label="Current password"
              autoComplete="current-password"
              error={errors.currentPassword?.message}
              value={watch('currentPassword')}
              {...register('currentPassword')}
            />
            <PasswordInput
              label="New password"
              autoComplete="new-password"
              error={errors.newPassword?.message}
              showStrength
              strength={getPasswordStrength(newPassword)}
              value={newPassword}
              {...register('newPassword')}
            />
            <PasswordInput
              label="Confirm new password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              value={watch('confirmPassword')}
              {...register('confirmPassword')}
            />
            <div className="flex items-center gap-3">
              <Button
                type="submit"
                size="md"
                loading={changePasswordMutation.isPending}
                leftIcon={pwDone ? <CheckCircle size={14} /> : <Lock size={14} />}
              >
                {pwDone ? 'Password changed!' : 'Update password'}
              </Button>
              <AnimatePresence>
                {pwDone && (
                  <motion.p
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-brand-success"
                  >
                    Done!
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </form>
        )}
      </Section>

      {/* ── Account Actions ───────────────────────────────────────────────── */}
      <Section title="Account Actions">
        <SettingRow
          label="Sign out of all devices"
          description="This will invalidate your current session token."
          action={
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<LogOut size={13} />}
              onClick={() => logout()}
            >
              Sign out
            </Button>
          }
        />
        <SettingRow
          label="Export my data"
          description="Download a copy of your account data."
          action={
            <button
              className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors"
              onClick={() => toast('Data export coming soon.', { icon: '📦' })}
            >
              Request export <ChevronRight size={12} />
            </button>
          }
        />
        <SettingRow
          label="Delete account"
          description="Permanently remove your account and all data."
          action={
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 size={13} />}
              onClick={() =>
                toast.error('Account deletion requires contacting support for now.', { duration: 5000 })
              }
            >
              Delete
            </Button>
          }
        />
      </Section>

      {/* ── App Info ─────────────────────────────────────────────────────── */}
      <div className="text-center text-xs text-text-muted space-y-1 pb-4">
        <p>FlexAcademy · Version 1.0.0</p>
        <p>
          <a href="/privacy" className="hover:text-accent transition-colors">Privacy Policy</a>
          {' · '}
          <a href="/terms" className="hover:text-accent transition-colors">Terms of Service</a>
        </p>
      </div>
    </div>
  );
}
