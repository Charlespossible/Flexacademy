import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Brain, Calendar, Users, Star, CheckCircle2, BookOpen,
  AlertTriangle, Flame, Clock, ChevronRight, User,
  TrendingUp, ShieldCheck,
} from 'lucide-react';
import { tutorService, type TutorDashboardStudent, type TutorDashboardBooking } from '@/features/tutor/tutorService';
import { useAuthStore } from '@/stores/authStore';
import { Avatar } from '@/components/ui/Avatar';
import { SuspensionBanner } from '@/components/shared/SuspensionBanner';
import { cn } from '@/lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number | null) {
  if (score === null) return 'text-text-muted';
  if (score >= 70) return 'text-brand-success';
  if (score >= 50) return 'text-yellow-400';
  return 'text-brand-danger';
}

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
}

function formatBookingTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' })
    + ' · '
    + d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color = 'text-accent',
  bg = 'bg-accent/10',
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color?: string;
  bg?: string;
  sub?: string;
}) {
  return (
    <div className="bg-base-surface border border-white/[0.06] rounded-2xl p-5 flex items-start gap-4">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', bg)}>
        <Icon size={18} className={color} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-text-primary leading-none">{value}</p>
        <p className="text-xs text-text-muted mt-1">{label}</p>
        {sub && <p className="text-xs text-text-muted mt-0.5 opacity-60">{sub}</p>}
      </div>
    </div>
  );
}

function StudentCard({ s }: { s: TutorDashboardStudent }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-base-surface border border-white/[0.06] rounded-2xl p-4 flex flex-col gap-3"
    >
      <div className="flex items-center gap-3">
        <Avatar
          firstName={s.firstName}
          lastName={s.lastName}
          src={s.avatar ?? undefined}
          size="md"
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate">
            {s.firstName} {s.lastName}
          </p>
          <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 mt-0.5">
            {s.subject}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {/* Last score */}
        <div className="bg-base-elevated rounded-xl p-2.5 text-center">
          <p className={cn('text-base font-bold leading-none', scoreColor(s.lastScore))}>
            {s.lastScore !== null ? `${Math.round(s.lastScore)}%` : '—'}
          </p>
          <p className="text-2xs text-text-muted mt-1">Last score</p>
        </div>

        {/* Open gaps */}
        <div className="bg-base-elevated rounded-xl p-2.5 text-center">
          <p className={cn('text-base font-bold leading-none', s.openGaps > 0 ? 'text-brand-danger' : 'text-brand-success')}>
            {s.openGaps}
          </p>
          <p className="text-2xs text-text-muted mt-1">Open gaps</p>
        </div>

        {/* Streak */}
        <div className="bg-base-elevated rounded-xl p-2.5 text-center">
          <p className="text-base font-bold leading-none text-orange-400 flex items-center justify-center gap-0.5">
            <Flame size={12} />
            {s.streakDays}
          </p>
          <p className="text-2xs text-text-muted mt-1">Streak</p>
        </div>
      </div>

      {(s.gradeLevel || s.curriculum) && (
        <p className="text-xs text-text-muted">
          {[s.gradeLevel, s.curriculum].filter(Boolean).join(' · ')}
        </p>
      )}
    </motion.div>
  );
}

function BookingRow({ b }: { b: TutorDashboardBooking }) {
  const isPending = b.status === 'PENDING';
  return (
    <div className="flex items-center gap-4 py-3 border-b border-white/[0.04] last:border-0">
      <div className="w-8 h-8 rounded-full bg-base-elevated border border-white/[0.06] flex items-center justify-center shrink-0 overflow-hidden">
        {b.student.avatar
          ? <img src={b.student.avatar} alt="" className="w-full h-full object-cover" />
          : <span className="text-xs font-bold text-text-muted">{b.student.firstName[0]}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">
          {b.student.firstName} {b.student.lastName}
        </p>
        <p className="text-xs text-text-muted">
          {b.subject}{b.topic ? ` · ${b.topic}` : ''} · {b.durationMins} min
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs text-text-secondary">{formatBookingTime(b.scheduledAt)}</p>
        <span className={cn(
          'text-2xs font-semibold px-1.5 py-0.5 rounded-full border',
          isPending
            ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
            : 'text-brand-success bg-brand-success/10 border-brand-success/20'
        )}>
          {b.status}
        </span>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-base-elevated rounded-xl" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[0,1,2,3].map(i => <div key={i} className="h-24 bg-base-elevated rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0,1,2].map(i => <div key={i} className="h-40 bg-base-elevated rounded-2xl" />)}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TutorDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tutor-dashboard'],
    queryFn: tutorService.getDashboard,
    staleTime: 60 * 1000,
  });

  // New tutors (applicationStatus='PENDING' means no application submitted yet) go to onboarding
  useEffect(() => {
    if (!isLoading && data && data.profile.applicationStatus === 'PENDING') {
      navigate('/tutor/onboarding', { replace: true });
    }
  }, [data, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-base">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <Skeleton />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-dvh bg-base flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-text-muted">Could not load your dashboard.</p>
          <p className="text-xs text-text-muted opacity-60">
            Make sure your tutor profile is set up or contact support.
          </p>
        </div>
      </div>
    );
  }

  const { profile, stats, students, upcomingBookings } = data;

  return (
    <div className="min-h-dvh bg-base">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Renders nothing unless the account is suspended */}
        <SuspensionBanner />

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-display text-2xl font-bold text-text-primary">
                Welcome, {user?.firstName}
              </h1>
              {profile.isVerified && (
                <span className="flex items-center gap-1 text-xs text-brand-success bg-brand-success/10 border border-brand-success/20 px-2 py-0.5 rounded-full">
                  <ShieldCheck size={11} />
                  Verified
                </span>
              )}
              {!profile.isVerified && (
                <span className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded-full">
                  Pending approval
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-text-muted">
              <span className="flex items-center gap-1">
                <Star size={13} className="text-yellow-400 fill-yellow-400" />
                {profile.rating.toFixed(1)} ({profile.totalReviews} reviews)
              </span>
              <span>·</span>
              <span>{stats.completedSessions} sessions completed</span>
            </div>
          </div>

          <Link
            to="/tutor/insights"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-base-elevated text-sm font-semibold hover:bg-accent/90 transition-colors"
          >
            <Brain size={15} />
            Student Insights
            {stats.unreadInsights > 0 && (
              <span className="ml-1 w-5 h-5 rounded-full bg-white/20 text-xs flex items-center justify-center font-bold">
                {stats.unreadInsights}
              </span>
            )}
          </Link>
        </div>

        {/* ── Unread insights alert ────────────────────────────────────────── */}
        {stats.unreadInsights > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20"
          >
            <Brain size={18} className="text-violet-400 shrink-0" />
            <p className="text-sm text-violet-200 flex-1">
              You have <strong>{stats.unreadInsights}</strong> unread AI insight{stats.unreadInsights !== 1 ? 's' : ''} about your students' learning gaps.
            </p>
            <Link
              to="/tutor/insights"
              className="flex items-center gap-1 text-xs font-semibold text-violet-300 hover:text-violet-200 shrink-0"
            >
              Review now <ChevronRight size={13} />
            </Link>
          </motion.div>
        )}

        {/* ── Stats ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Assigned students"
            value={stats.assignedStudents}
            icon={Users}
            color="text-accent"
            bg="bg-accent/10"
          />
          <StatCard
            label="Unread insights"
            value={stats.unreadInsights}
            icon={Brain}
            color="text-violet-400"
            bg="bg-violet-400/10"
          />
          <StatCard
            label="Upcoming sessions"
            value={stats.upcomingBookings}
            icon={Calendar}
            color="text-blue-400"
            bg="bg-blue-400/10"
            sub="next 7 days"
          />
          <StatCard
            label="Monthly earnings"
            value={formatNaira(stats.monthlyEarnings)}
            icon={TrendingUp}
            color="text-brand-success"
            bg="bg-brand-success/10"
            sub={`₦${stats.totalEarnings.toLocaleString()} total`}
          />
        </div>

        {/* ── Main grid ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Students (2/3 width) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-text-primary">My Students</h2>
              {students.length > 0 && (
                <span className="text-xs text-text-muted">{students.length} active</span>
              )}
            </div>

            {students.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-4 text-center bg-base-surface border border-white/[0.06] rounded-2xl">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <Users size={20} className="text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-text-primary text-sm">No students assigned yet</p>
                  <p className="text-xs text-text-muted mt-1 max-w-xs">
                    Students will appear here once they're matched to you through the AI pipeline or direct booking.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {students.map((s) => (
                  <StudentCard key={s.assignmentId} s={s} />
                ))}
              </div>
            )}
          </div>

          {/* Right column — upcoming sessions + quick links */}
          <div className="space-y-4">

            {/* Upcoming sessions */}
            <div className="bg-base-surface border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={15} className="text-blue-400" />
                <h2 className="font-display font-semibold text-text-primary text-sm">Upcoming Sessions</h2>
              </div>

              {upcomingBookings.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <Clock size={22} className="text-text-muted mx-auto" />
                  <p className="text-xs text-text-muted">No sessions in the next 7 days</p>
                </div>
              ) : (
                <div>
                  {upcomingBookings.map((b) => (
                    <BookingRow key={b.id} b={b} />
                  ))}
                </div>
              )}
            </div>

            {/* Quick links */}
            <div className="bg-base-surface border border-white/[0.06] rounded-2xl p-5 space-y-2">
              <h2 className="font-display font-semibold text-text-primary text-sm mb-3">Quick Links</h2>
              {[
                { to: '/tutor/insights', icon: Brain,         label: 'Student Insights',  desc: 'AI gap briefs'        },
                { to: '/tutor/courses',  icon: BookOpen,      label: 'My Courses',         desc: 'Author lessons'      },
                { to: '/profile',        icon: User,          label: 'My Profile',         desc: 'Edit tutor profile'  },
                { to: '/leaderboard',    icon: TrendingUp,    label: 'Leaderboard',        desc: 'Student rankings'    },
                { to: '/notifications',  icon: AlertTriangle, label: 'Notifications',      desc: 'Alerts & updates'    },
                { to: '/settings',       icon: CheckCircle2,  label: 'Settings',           desc: 'Profile & account'   },
              ].map(({ to, icon: Icon, label, desc }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-base-elevated transition-colors group"
                >
                  <Icon size={14} className="text-text-muted group-hover:text-accent transition-colors shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">{label}</p>
                    <p className="text-xs text-text-muted">{desc}</p>
                  </div>
                  <ChevronRight size={13} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
