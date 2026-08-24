import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { User, Phone, School, MapPin, Pencil, Check, X, Camera, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

import api from '@/lib/axios';
import { queryClient, queryKeys } from '@/lib/queryClient';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { TierBadge } from '@/components/ui/Badge';
import { subjectService } from '@/features/subjects/subjectService';
import { GRADE_LEVELS, CURRICULA, EXAM_DISPLAY, type ExamCategory } from '@/types';
import type { MeResponse } from '@/features/auth/authService';

// ─── Schema ───────────────────────────────────────────────────────────────────
const profileSchema = z.object({
  firstName: z.string().min(2, 'Min 2 characters').max(50),
  lastName: z.string().min(2, 'Min 2 characters').max(50),
  phone: z.string().optional(),
  gradeLevel: z.string().optional(),
  curriculum: z.string().optional(),
  school: z.string().optional(),
  state: z.string().optional(),
});
type ProfileForm = z.infer<typeof profileSchema>;

// ─── Info row (read-only display) ─────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border-subtle last:border-0">
      <div className="w-8 h-8 rounded-lg bg-base-subtle flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={14} className="text-text-muted" />
      </div>
      <div>
        <p className="text-xs text-text-muted uppercase tracking-wide font-medium">{label}</p>
        <p className="text-sm text-text-primary mt-0.5">{value || '—'}</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, subscription, setUser } = useAuthStore();
  const [editing, setEditing] = useState(false);

  // Fetch fresh profile data including studentProfile
  const profileQuery = useQuery({
    queryKey: queryKeys.user.me(),
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: MeResponse }>('/users/me');
      return res.data.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const profile = profileQuery.data;
  const studentProfile = profile?.studentProfile;

  // Resolve preferredSubjectIds → subject names
  const subjectsQuery = useQuery({
    queryKey: queryKeys.subjects.all(),
    queryFn: () => subjectService.getAll(),
    staleTime: 1000 * 60 * 10,
    enabled: user?.role === 'STUDENT',
  });
  const subjectMap = Object.fromEntries(
    (subjectsQuery.data ?? []).map((s) => [s.id, s.name])
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phone: user?.phone ?? '',
      gradeLevel: studentProfile?.gradeLevel ?? '',
      curriculum: studentProfile?.curriculum ?? '',
      school: studentProfile?.school ?? '',
      state: studentProfile?.state ?? '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const res = await api.patch<{ success: boolean; data: typeof user }>('/users/me', data);
      return res.data.data;
    },
    onSuccess: (updatedUser) => {
      if (updatedUser) setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: queryKeys.user.me() });
      toast.success('Profile updated.');
      setEditing(false);
    },
  });

  const cancelEdit = () => {
    reset();
    setEditing(false);
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header card */}
      <div className="bg-base-surface border border-border-subtle rounded-2xl p-6">
        <div className="flex items-center gap-5">
          {/* Avatar with upload overlay */}
          <div className="relative shrink-0">
            <Avatar
              src={user.avatar}
              firstName={user.firstName}
              lastName={user.lastName}
              size="xl"
            />
            <button
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent
                         flex items-center justify-center shadow-lg
                         hover:bg-accent/90 transition-colors"
              title="Change avatar (upload coming soon)"
              onClick={() => toast('Avatar upload requires Cloudinary setup.', { icon: '📷' })}
            >
              <Camera size={13} className="text-base-elevated" />
            </button>
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl font-bold text-text-primary truncate">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-sm text-text-muted truncate mt-0.5">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              {subscription && <TierBadge tier={subscription.tier} />}
              <span className="text-xs px-2 py-0.5 rounded-full bg-base-subtle text-text-muted capitalize border border-border-subtle">
                {user.role.toLowerCase().replace('_', ' ')}
              </span>
              {user.isEmailVerified && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-success/10 text-brand-success border border-brand-success/20">
                  Verified
                </span>
              )}
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={editing ? <X size={14} /> : <Pencil size={14} />}
            onClick={editing ? cancelEdit : () => setEditing(true)}
          >
            {editing ? 'Cancel' : 'Edit'}
          </Button>
        </div>
      </div>

      {/* Editable form */}
      {editing ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-base-surface border border-border-subtle rounded-2xl p-6"
        >
          <h2 className="font-display font-semibold text-text-primary mb-5">Edit Profile</h2>
          <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First name"
                leftIcon={<User size={14} />}
                error={errors.firstName?.message}
                {...register('firstName')}
              />
              <Input
                label="Last name"
                leftIcon={<User size={14} />}
                error={errors.lastName?.message}
                {...register('lastName')}
              />
            </div>

            <Input
              label="Phone number"
              placeholder="+234 801 234 5678"
              leftIcon={<Phone size={14} />}
              error={errors.phone?.message}
              {...register('phone')}
            />

            {user.role === 'STUDENT' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label="Grade level"
                    options={GRADE_LEVELS.map((g) => ({ value: g, label: g }))}
                    error={errors.gradeLevel?.message}
                    {...register('gradeLevel')}
                  />
                  <Select
                    label="Curriculum"
                    options={CURRICULA.map((c) => ({ value: c, label: c }))}
                    error={errors.curriculum?.message}
                    {...register('curriculum')}
                  />
                </div>
                <Input
                  label="School"
                  placeholder="Your school name"
                  leftIcon={<School size={14} />}
                  error={errors.school?.message}
                  {...register('school')}
                />
                <Input
                  label="State"
                  placeholder="e.g. Lagos"
                  leftIcon={<MapPin size={14} />}
                  error={errors.state?.message}
                  {...register('state')}
                />
              </>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" size="md" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="md"
                loading={updateMutation.isPending}
                disabled={!isDirty}
                leftIcon={<Check size={14} />}
              >
                Save changes
              </Button>
            </div>
          </form>
        </motion.div>
      ) : (
        /* Read-only view */
        <div className="bg-base-surface border border-border-subtle rounded-2xl p-6">
          <h2 className="font-display font-semibold text-text-primary mb-4">Personal Info</h2>
          <InfoRow icon={User} label="Full name" value={`${user.firstName} ${user.lastName}`} />
          <InfoRow icon={Phone} label="Phone" value={user.phone} />

          {user.role === 'STUDENT' && studentProfile && (
            <>
              <InfoRow icon={School} label="Grade level" value={studentProfile.gradeLevel} />
              <InfoRow icon={School} label="Curriculum" value={studentProfile.curriculum} />
              <InfoRow icon={School} label="School" value={studentProfile.school} />
              <InfoRow icon={MapPin} label="State" value={studentProfile.state} />
            </>
          )}
        </div>
      )}

      {/* Stats (student only) */}
      {user.role === 'STUDENT' && studentProfile && (
        <div className="bg-base-surface border border-border-subtle rounded-2xl p-6">
          <h2 className="font-display font-semibold text-text-primary mb-5">Learning Stats</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'XP Earned', value: studentProfile.totalXp.toLocaleString() },
              { label: 'Day Streak', value: `${studentProfile.studyStreakDays}🔥` },
              { label: 'Longest Streak', value: `${studentProfile.longestStreak} days` },
            ].map(({ label, value }) => (
              <div key={label} className="text-center p-4 rounded-xl bg-base-subtle">
                <p className="font-display text-xl font-bold text-text-primary">{value}</p>
                <p className="text-xs text-text-muted mt-1">{label}</p>
              </div>
            ))}
          </div>

          {studentProfile.targetExams.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
                Target Exams
              </p>
              <div className="flex flex-wrap gap-2">
                {studentProfile.targetExams.map((exam) => (
                  <span
                    key={exam}
                    className="text-xs px-3 py-1 rounded-full bg-accent/10 text-accent border border-accent/20 font-medium"
                  >
                    {EXAM_DISPLAY[exam as ExamCategory] ?? exam}
                  </span>
                ))}
              </div>
            </div>
          )}

          {studentProfile.preferredSubjectIds.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
                Preferred Subjects
              </p>
              <div className="flex flex-wrap gap-2">
                {studentProfile.preferredSubjectIds.map((id) => (
                  <span
                    key={id}
                    className="text-xs px-3 py-1 rounded-full bg-base-subtle text-text-secondary border border-border-subtle font-medium"
                  >
                    {subjectMap[id] ?? id}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Account info */}
      <div className="bg-base-surface border border-border-subtle rounded-2xl p-6">
        <h2 className="font-display font-semibold text-text-primary mb-4">Account</h2>
        {profileQuery.isLoading ? (
          <div className="flex items-center gap-2 text-text-muted text-sm">
            <Loader2 size={14} className="animate-spin" /> Loading…
          </div>
        ) : (
          <>
            <InfoRow
              icon={User}
              label="Member since"
              value={user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : undefined}
            />
            <InfoRow
              icon={User}
              label="Last login"
              value={user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : undefined}
            />
          </>
        )}
        <div className="mt-4 pt-4 border-t border-border-subtle">
          <p className="text-xs text-text-muted">
            To change your password, go to{' '}
            <a href="/settings" className="text-accent hover:underline">Settings</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
