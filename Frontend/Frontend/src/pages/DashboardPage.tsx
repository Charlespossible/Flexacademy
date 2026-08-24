import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen, Brain, Target, Zap, Trophy, TrendingUp,
  AlertTriangle, CheckCircle2, Clock, Flame, ChevronRight,
  BarChart3, Star, ArrowRight, Sparkles, PlayCircle,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { progressService } from '@/features/progress/progressService';
import { gapService } from '@/features/gaps/gapService';
import { studyPlanService } from '@/features/studyPlan/studyPlanService';
import { courseService } from '@/features/courses/courseService';
import { TutorBadge } from '@/components/shared/TutorBadge';
import { cn, formatClock } from '@/lib/utils';
import type { WeakArea, LearningGap, GapSeverity, SubscriptionTier } from '@/types';

// Any paid tier = full FlexPass access
const isFlexPass = (tier: SubscriptionTier) =>
  tier === 'BASIC' || tier === 'PRO' || tier === 'ELITE';

function SubscriptionCard({ tier, status }: { tier: SubscriptionTier; status: string }) {
  const fullAccess = isFlexPass(tier);
  return (
    <div className={cn(
      'rounded-2xl overflow-hidden border',
      fullAccess
        ? 'bg-accent/5 border-accent/20'
        : 'bg-base-surface border-white/[0.06]'
    )}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          {fullAccess
            ? <Sparkles size={14} className="text-accent" />
            : <Zap size={14} className="text-text-muted" />
          }
          <h2 className="font-display font-semibold text-text-primary text-sm">Your Plan</h2>
        </div>
        <Link to="/subscription" className="text-xs text-accent hover:text-accent/80 transition-colors">
          Manage
        </Link>
      </div>
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className={cn(
            'inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border',
            fullAccess
              ? 'bg-accent/10 border-accent/25 text-accent'
              : 'bg-base-elevated border-border-subtle text-text-muted'
          )}>
            {fullAccess ? <Sparkles size={10} /> : <Zap size={10} />}
            {fullAccess ? 'FlexPass' : 'Free'}
          </span>
          <span className={cn(
            'text-xs px-2 py-0.5 rounded-full border font-medium',
            status === 'ACTIVE'
              ? 'bg-brand-success/10 border-brand-success/20 text-brand-success'
              : 'bg-base-subtle border-border-subtle text-text-muted'
          )}>
            {status}
          </span>
        </div>
        <p className="text-xs text-text-muted leading-relaxed">
          {fullAccess
            ? 'Full access — AI, lessons, assigned tutor, exam simulation and more.'
            : 'You\'re on the free plan. Upgrade to unlock the full platform.'}
        </p>
        {!fullAccess && (
          <Link
            to="/subscription"
            className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent/80 transition-colors"
          >
            <ArrowRight size={12} />
            Get FlexPass — ₦3,500/mo
          </Link>
        )}
      </div>
    </div>
  );
}

const SEVERITY_COLOR: Record<GapSeverity, string> = {
  CRITICAL: 'text-red-400 bg-red-400/10 border-red-400/20',
  HIGH:     'text-orange-400 bg-orange-400/10 border-orange-400/20',
  MEDIUM:   'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  LOW:      'text-blue-400 bg-blue-400/10 border-blue-400/20',
};

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-base-surface border border-white/[0.06] rounded-2xl p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center',
          accent ? 'bg-accent/10' : 'bg-base-elevated'
        )}>
          <Icon size={17} className={accent ? 'text-accent' : 'text-text-muted'} />
        </div>
        <span className="text-xs text-text-muted">{label}</span>
      </div>
      <div>
        <p className="text-2xl font-display font-bold text-text-primary">{value}</p>
        {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const subscription = useAuthStore((s) => s.subscription);

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['progress-overview'],
    queryFn: () => progressService.getUserProgress(),
    staleTime: 2 * 60 * 1000,
  });

  const { data: weakAreas } = useQuery({
    queryKey: ['weak-areas'],
    queryFn: () => progressService.getWeakAreas(5),
    staleTime: 5 * 60 * 1000,
  });

  const { data: gapsPage } = useQuery({
    queryKey: ['my-gaps', 'open'],
    queryFn: () => gapService.getMyGaps({ status: 'OPEN', limit: 4 }),
    staleTime: 3 * 60 * 1000,
  });

  const { data: studyPlans } = useQuery({
    queryKey: ['study-plans', 'active'],
    queryFn: () => studyPlanService.getUserStudyPlans('ACTIVE', 1, 3),
    staleTime: 5 * 60 * 1000,
  });

  const { data: myCourses } = useQuery({
    queryKey: ['my-enrolled-courses'],
    queryFn: courseService.getMyCourses,
    staleTime: 60 * 1000,
  });

  const openGaps = (gapsPage?.data ?? []) as LearningGap[];
  const activePlans = studyPlans?.data ?? [];
  const inProgress = (myCourses ?? []).filter((c) => !c.isCompleted).slice(0, 3);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="min-h-dvh bg-base">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-text-primary">
                {greeting}{user ? `, ${user.firstName}` : ''}
              </h1>
              <p className="text-text-muted text-sm mt-1">
                Here's what's happening with your studies today.
              </p>
            </div>
            <Link
              to="/exam/simulate"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-base-elevated text-sm font-semibold hover:bg-accent/90 transition-colors shadow-glow-sm"
            >
              <Target size={15} />
              Start Exam Sim
            </Link>
          </div>
        </motion.div>

        {/* ── Stats Row ───────────────────────────────────────────────── */}
        {overviewLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[0,1,2,3].map(i => (
              <div key={i} className="bg-base-surface border border-white/[0.06] rounded-2xl p-5 h-28 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Flame}
              label="Day streak"
              value={overview?.currentStreak ?? 0}
              sub={`Best: ${overview?.longestStreak ?? 0} days`}
              accent
            />
            <StatCard
              icon={Star}
              label="Total XP"
              value={(overview?.totalXp ?? 0).toLocaleString()}
              sub="Experience points"
            />
            <StatCard
              icon={BarChart3}
              label="Avg mastery"
              value={`${overview?.avgMastery ?? 0}%`}
              sub={`${overview?.topicsLearned ?? 0} topics`}
            />
            <StatCard
              icon={Trophy}
              label="Badges"
              value={overview?.badgesEarned ?? 0}
              sub={`${overview?.coursesCompleted ?? 0} courses done`}
            />
          </div>
        )}

        {/* ── Continue learning ───────────────────────────────────────── */}
        {inProgress.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <BookOpen size={16} className="text-accent" />
                <h2 className="font-display font-semibold text-text-primary text-sm">
                  Continue learning
                </h2>
              </div>
              <Link
                to="/courses"
                className="text-xs text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
              >
                All courses <ChevronRight size={13} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {inProgress.map((course) => (
                <Link
                  key={course.id}
                  // Straight back into the lesson, not the course landing page —
                  // one click from the dashboard to where they stopped.
                  to={
                    course.resume
                      ? `/courses/${course.id}/lessons/${course.resume.lessonId}`
                      : `/courses/${course.id}`
                  }
                  className="group bg-base-surface border border-white/[0.06] rounded-2xl p-5 hover:border-accent/40 transition-colors"
                >
                  <span className="text-2xs font-semibold uppercase tracking-wider text-accent">
                    {course.subject.icon} {course.subject.name}
                  </span>
                  <h3 className="font-display font-semibold text-text-primary text-sm leading-snug mt-1.5 line-clamp-2 group-hover:text-accent transition-colors">
                    {course.title}
                  </h3>

                  {/* Who taught it — authorship travels with the course. */}
                  <div className="mt-3">
                    <TutorBadge tutor={course.tutorProfile} />
                  </div>

                  {course.resume && (
                    <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-base-elevated border border-white/[0.06] px-3 py-2.5">
                      <PlayCircle size={16} className="text-accent shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-2xs font-semibold text-text-primary">
                          {course.resume.hasStarted ? 'Resume' : 'Start'}
                        </p>
                        <p className="text-2xs text-text-muted truncate">
                          {course.resume.title}
                          {course.resume.hasStarted &&
                            ` · ${formatClock(course.resume.watchedSecs)}`}
                          {course.resume.hasStarted && course.resume.duration
                            ? ` / ${formatClock(course.resume.duration)}`
                            : ''}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-2xs text-text-muted">Progress</span>
                      <span className="text-2xs font-semibold text-text-primary">
                        {Math.round(course.progress ?? 0)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-base-subtle rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent transition-all"
                        style={{ width: `${Math.round(course.progress ?? 0)}%` }}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Main Grid ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left column (2/3) ──────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Learning gaps panel */}
            <div className="bg-base-surface border border-white/[0.06] rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle size={16} className="text-orange-400" />
                  <h2 className="font-display font-semibold text-text-primary text-sm">
                    Open Learning Gaps
                  </h2>
                  {openGaps.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-orange-400/10 text-orange-400 border border-orange-400/20">
                      {openGaps.length}
                    </span>
                  )}
                </div>
                <Link
                  to="/gaps"
                  className="text-xs text-accent hover:text-accent/80 flex items-center gap-1 transition-colors"
                >
                  View all <ChevronRight size={12} />
                </Link>
              </div>

              {openGaps.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-center px-6">
                  <CheckCircle2 size={28} className="text-brand-success" />
                  <p className="text-sm text-text-primary font-medium">No open gaps detected</p>
                  <p className="text-xs text-text-muted max-w-xs">
                    Complete quizzes and exams to let the AI identify areas for improvement.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {openGaps.map((gap) => (
                    <div key={gap.id} className="flex items-center justify-between px-6 py-4 hover:bg-base-elevated/50 transition-colors">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={cn(
                          'mt-0.5 px-2 py-0.5 rounded text-xs font-semibold border shrink-0',
                          SEVERITY_COLOR[gap.severity]
                        )}>
                          {gap.severity}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {gap.topic?.name ?? 'Unknown topic'}
                          </p>
                          <p className="text-xs text-text-muted mt-0.5">
                            Mastery at detection: {gap.masteryAtDetection}%
                          </p>
                        </div>
                      </div>
                      <Link
                        to="/gaps"
                        className="text-xs text-accent hover:underline shrink-0 ml-4"
                      >
                        Study now
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Weak areas */}
            {(weakAreas ?? []).length > 0 && (
              <div className="bg-base-surface border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2.5">
                    <TrendingUp size={16} className="text-accent" />
                    <h2 className="font-display font-semibold text-text-primary text-sm">
                      Weak Topics to Focus On
                    </h2>
                  </div>
                  <Link to="/progress" className="text-xs text-accent hover:text-accent/80 flex items-center gap-1 transition-colors">
                    Full report <ChevronRight size={12} />
                  </Link>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(weakAreas as WeakArea[]).slice(0, 4).map((area) => (
                    <div
                      key={area.topicId}
                      className="flex items-center gap-3 p-3 rounded-xl bg-base-elevated border border-white/[0.04]"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{area.name}</p>
                        <p className="text-xs text-text-muted">{area.subjectName}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={cn(
                          'text-sm font-bold',
                          area.masteryLevel < 30 ? 'text-red-400' :
                          area.masteryLevel < 50 ? 'text-orange-400' : 'text-yellow-400'
                        )}>
                          {area.masteryLevel}%
                        </p>
                        <p className="text-xs text-text-muted">{area.attempts} attempts</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right column (1/3) ─────────────────────── */}
          <div className="space-y-6">

            {/* Subscription status */}
            {subscription && (
              <SubscriptionCard
                tier={subscription.tier}
                status={subscription.status}
              />
            )}

            {/* Quick actions */}
            <div className="bg-base-surface border border-white/[0.06] rounded-2xl p-5">
              <h2 className="font-display font-semibold text-text-primary text-sm mb-4">Quick Actions</h2>
              <div className="space-y-2">
                {[
                  { to: '/ai-tutor', icon: Brain, label: 'Ask FlexBot', desc: 'AI tutoring session', color: 'text-violet-400 bg-violet-400/10' },
                  { to: '/exam/simulate', icon: Target, label: 'Exam Simulation', desc: 'Timed mock exam', color: 'text-accent bg-accent/10' },
                  { to: '/flashcards', icon: Zap, label: 'Flashcards', desc: 'Spaced repetition', color: 'text-yellow-400 bg-yellow-400/10' },
                  { to: '/courses', icon: BookOpen, label: 'Browse Courses', desc: 'Study content', color: 'text-blue-400 bg-blue-400/10' },
                ].map(({ to, icon: Icon, label, desc, color }) => (
                  <Link
                    key={to}
                    to={to}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-base-elevated transition-colors group"
                  >
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', color)}>
                      <Icon size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">{label}</p>
                      <p className="text-xs text-text-muted">{desc}</p>
                    </div>
                    <ArrowRight size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Active study plans */}
            <div className="bg-base-surface border border-white/[0.06] rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Clock size={15} className="text-text-muted" />
                  <h2 className="font-display font-semibold text-text-primary text-sm">Study Plans</h2>
                </div>
                <Link to="/ai-tutor" className="text-xs text-accent hover:text-accent/80 transition-colors">
                  Generate plan
                </Link>
              </div>
              {activePlans.length === 0 ? (
                <div className="p-5 text-center">
                  <p className="text-sm text-text-muted mb-3">No active study plans</p>
                  <Link
                    to="/ai-tutor"
                    className="text-xs text-accent hover:underline"
                  >
                    Ask FlexBot to generate one →
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {activePlans.map((plan) => (
                    <div
                      key={plan.id}
                      className="flex items-center justify-between px-5 py-3.5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{plan.title}</p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {plan.targetExam ?? 'Personal'} · {plan.dailyGoalMins}min/day
                        </p>
                      </div>
                      {plan.isAiGenerated && (
                        <span className="text-xs text-violet-400 bg-violet-400/10 border border-violet-400/20 rounded px-1.5 py-0.5 ml-3 shrink-0">
                          AI
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
