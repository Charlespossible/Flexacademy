import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, User } from 'lucide-react';

import { AuthLayout } from '@/features/auth/AuthLayout';
import { registerSchema, type RegisterFormData } from '@/features/auth/schemas';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input, PasswordInput, Select } from '@/components/ui/Input';
import { Divider } from '@/components/ui/Tooltip';
import { getPasswordStrength } from '@/lib/utils';
import { GRADE_LEVELS, CURRICULA } from '@/types';

type Role = 'STUDENT' | 'TUTOR' | 'PARENT';

const ROLES: { value: Role; label: string; desc: string }[] = [
  { value: 'STUDENT', label: '🎓 Student',  desc: 'I want to learn and ace my exams' },
  { value: 'TUTOR',   label: '📚 Tutor',    desc: 'I want to teach and earn on the platform' },
  { value: 'PARENT',  label: '👨‍👩‍👧 Parent',  desc: 'I want to monitor my child\'s progress' },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser, isRegistering, isAuthenticated, user, loginWithGoogle } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Role>('STUDENT');

  // Redirect if already authenticated — role-aware
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (user.role === 'PARENT') navigate('/parent/dashboard', { replace: true });
    else if (user.role === 'TUTOR') navigate('/tutor/dashboard', { replace: true });
    else navigate('/dashboard', { replace: true });
  }, [isAuthenticated, user, navigate]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'STUDENT',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      gradeLevel: '',
      curriculum: '',
    },
  });

  const passwordValue = watch('password');
  const strength = getPasswordStrength(passwordValue ?? '');

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setValue('role', role, { shouldValidate: true });
  };

  const onSubmit = (data: RegisterFormData) => {
    const payload = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      role: data.role,
      ...(data.role === 'STUDENT' && {
        gradeLevel: data.gradeLevel,
        curriculum: data.curriculum,
      }),
    };
    registerUser(payload);
  };

  return (
    <AuthLayout
      heading="Create your account"
      subheading="Join 50,000+ students preparing for their exams"
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
        Sign up with Google
      </Button>

      <Divider label="or register with email" className="mb-6" />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

        {/* Role selector — 3 cards */}
        <div>
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">
            I am a
          </p>
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map(({ value, label, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleRoleSelect(value)}
                className={`
                  relative p-3 rounded-xl border text-left transition-all duration-150
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60
                  ${selectedRole === value
                    ? 'border-accent/40 bg-accent/5 ring-1 ring-accent/20'
                    : 'border-border-subtle bg-base-elevated hover:border-accent/25'
                  }
                `}
              >
                <p className="text-sm font-semibold text-text-primary leading-tight">{label}</p>
                <p className="text-xs text-text-muted mt-1 leading-snug hidden sm:block">{desc}</p>
                {selectedRole === value && (
                  <motion.div
                    layoutId="role-indicator"
                    className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Role context hint */}
          <AnimatePresence mode="wait">
            {selectedRole === 'PARENT' && (
              <motion.p
                key="parent-hint"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-text-muted mt-2 leading-relaxed"
              >
                After registering, you'll link to your child's account using their email address from your parent dashboard.
              </motion.p>
            )}
            {selectedRole === 'TUTOR' && (
              <motion.p
                key="tutor-hint"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-text-muted mt-2 leading-relaxed"
              >
                Tutor accounts require profile approval before going live. You'll be notified within 48 hours.
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First name"
            placeholder="Chidi"
            autoComplete="given-name"
            leftIcon={<User size={15} />}
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <Input
            label="Last name"
            placeholder="Okonkwo"
            autoComplete="family-name"
            leftIcon={<User size={15} />}
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>

        {/* Email */}
        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          leftIcon={<Mail size={15} />}
          error={errors.email?.message}
          {...register('email')}
        />

        {/* Password */}
        <PasswordInput
          label="Password"
          placeholder="Min 8 chars, uppercase, number"
          autoComplete="new-password"
          error={errors.password?.message}
          showStrength
          strength={strength}
          value={passwordValue}
          {...register('password')}
        />

        {/* Confirm password */}
        <PasswordInput
          label="Confirm password"
          placeholder="Repeat your password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        {/* Student-only fields */}
        <AnimatePresence>
          {selectedRole === 'STUDENT' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-3 pt-1">
                <Select
                  label="Grade level"
                  placeholder="Select grade"
                  error={errors.gradeLevel?.message}
                  options={GRADE_LEVELS.map((g) => ({ value: g, label: g }))}
                  {...register('gradeLevel')}
                />
                <Select
                  label="Curriculum"
                  placeholder="Select curriculum"
                  error={errors.curriculum?.message}
                  options={CURRICULA.map((c) => ({ value: c, label: c }))}
                  {...register('curriculum')}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Terms */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            className="mt-0.5 w-4 h-4 rounded border border-border-subtle bg-base-elevated
                       text-accent focus:ring-1 focus:ring-accent/40 focus:ring-offset-0
                       checked:bg-accent checked:border-accent cursor-pointer shrink-0"
            {...register('agreeTerms')}
          />
          <span className="text-xs text-text-muted leading-relaxed">
            I agree to FlexAcademy&apos;s{' '}
            <Link to="/terms" className="text-accent hover:underline">Terms of Service</Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-accent hover:underline">Privacy Policy</Link>
          </span>
        </label>
        {errors.agreeTerms && (
          <p className="text-xs text-brand-danger -mt-2">⚠ {errors.agreeTerms.message}</p>
        )}

        <Button type="submit" size="lg" className="w-full mt-2" loading={isRegistering}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-muted">
        Already have an account?{' '}
        <Link to="/login" className="text-accent hover:text-accent/80 font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
