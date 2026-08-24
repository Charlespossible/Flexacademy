import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import toast from 'react-hot-toast';

import { AuthLayout } from '@/features/auth/AuthLayout';
import { loginSchema, type LoginFormData } from '@/features/auth/schemas';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input, PasswordInput } from '@/components/ui/Input';
import { Divider } from '@/components/ui/Tooltip';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isLoggingIn, isAuthenticated, user, loginWithGoogle } = useAuth();

  // Redirect if already authenticated — role-aware
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') navigate('/admin/dashboard', { replace: true });
    else if (user.role === 'PARENT') navigate('/parent/dashboard', { replace: true });
    else if (user.role === 'TUTOR') navigate('/tutor/dashboard', { replace: true });
    else navigate('/dashboard', { replace: true });
  }, [isAuthenticated, user, navigate]);

  // Show message from redirect (e.g. after email verify)
  useEffect(() => {
    const msg = searchParams.get('message');
    if (msg === 'verified') toast.success('Email verified! You can now log in.');
    if (msg === 'reset') toast.success('Password reset successfully.');
    if (msg === 'expired') toast.error('Your session expired. Please log in again.');
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const passwordValue = watch('password');

  const onSubmit = (data: LoginFormData) => {
    login({ email: data.email, password: data.password });
  };

  return (
    <AuthLayout
      heading="Welcome back"
      subheading="Sign in to continue your learning journey"
    >
      {/* Google OAuth */}
      <Button
        variant="secondary"
        size="lg"
        className="w-full mb-6"
        leftIcon={<GoogleIcon />}
        onClick={loginWithGoogle}
        type="button"
      >
        Continue with Google
      </Button>

      <Divider label="or sign in with email" className="mb-6" />

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          leftIcon={<Mail size={15} />}
          error={errors.email?.message}
          {...register('email')}
        />

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs text-accent hover:text-accent/80 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            placeholder="Enter your password"
            autoComplete="current-password"
            error={errors.password?.message}
            value={passwordValue}
            {...register('password')}
          />
        </div>

        {/* Remember me */}
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border border-border-subtle bg-base-elevated text-accent
                       focus:ring-1 focus:ring-accent/40 focus:ring-offset-0
                       checked:bg-accent checked:border-accent cursor-pointer"
            {...register('rememberMe')}
          />
          <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
            Keep me signed in
          </span>
        </label>

        <Button
          type="submit"
          size="lg"
          className="w-full mt-2"
          loading={isLoggingIn}
        >
          Sign in
        </Button>
      </form>

      {/* Sign up link */}
      <p className="mt-6 text-center text-sm text-text-muted">
        Don&apos;t have an account?{' '}
        <Link
          to="/register"
          className="text-accent hover:text-accent/80 font-medium transition-colors"
        >
          Create one free
        </Link>
      </p>

      {/* Demo hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-6 p-3 rounded-lg bg-accent/5 border border-accent/10"
      >
        <p className="text-xs text-text-muted text-center">
          <span className="text-accent font-medium">Demo:</span>{' '}
          demo@flexacademy.ng · password: Demo1234
        </p>
      </motion.div>
    </AuthLayout>
  );
}

// ─── Google Icon SVG ──────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
