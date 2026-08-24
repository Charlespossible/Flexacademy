import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Zap,
  Target,
  TrendingUp,
  Clock,
  Award,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuthStore } from '@/stores/authStore';
import { useProgressStore } from '@/stores/progressStore';
import { queryKeys } from '@/lib/queryClient';
import { progressService } from '@/features/progress/progressService';
import { flashcardService } from '@/features/flashcards/flashcardService';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/shared/Loader';

// ─── Animation helper ─────────────────────────────────────────────────────────
function FadeInUp({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── WelcomeCard ──────────────────────────────────────────────────────────────
function WelcomeCard({
  firstName,
  streak,
  xp,
}: {
  firstName: string;
  streak: number;
  xp: number;
}) {
  const streakEmoji = streak === 0 ? '🔥' : streak >= 7 ? '🔥' : '💪';
  const streakText =
    streak === 0
      ? 'Start a streak'
      : streak === 1
        ? '1-day streak'
        : `${streak}-day streak`;

  return (
    <FadeInUp delay={0}>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/10 via-accent/5 to-base-surface border border-accent/20 p-8 shadow-card">
        {/* Animated background elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent/5 rounded-full blur-3xl -mr-20 -mt-20" />

        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-text-primary mb-2">
            Welcome back, <span className="text-accent">{firstName}!</span>
          </h1>
          <p className="text-text-muted mb-6">
            Let's keep your learning momentum going
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-base-elevated border border-white/[0.06] backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{streakEmoji}</span>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wide">
                    Streak
                  </p>
                  <p className="font-semibold text-text-primary">{streakText}</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-base-elevated border border-white/[0.06] backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <span className="text-3xl">⚡</span>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wide">
                    This Week
                  </p>
                  <p className="font-semibold text-text-primary">{xp} XP</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FadeInUp>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  highlight,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  unit?: string;
  highlight?: boolean;
  delay: number;
}) {
  return (
    <FadeInUp delay={delay}>
      <div
        className={`p-6 rounded-xl border backdrop-blur-sm transition-all ${
          highlight
            ? 'bg-accent/10 border-accent/30 ring-1 ring-accent/20'
            : 'bg-base-elevated border-white/[0.06]'
        }`}
      >
        <div className="flex items-start justify-between mb-4">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              highlight ? 'bg-accent/20' : 'bg-base-surface'
            }`}
          >
            <Icon
              size={20}
              className={highlight ? 'text-accent' : 'text-text-muted'}
            />
          </div>
        </div>
        <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
          {label}
        </p>
        <p className="text-3xl font-bold text-text-primary">
          {value.toLocaleString()}
          {unit && <span className="text-base text-text-muted ml-1">{unit}</span>}
        </p>
      </div>
    </FadeInUp>
  );
}

// ─── StatsGrid ────────────────────────────────────────────────────────────────
function StatsGrid({
  overview,
}: {
  overview: any;
}) {
  if (!overview) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={TrendingUp}
        label="Overall Mastery"
        value={overview.avgMastery}
        unit="%"
        highlight
        delay={0.1}
      />
      <StatCard
        icon={BookOpen}
        label="Topics Learned"
        value={overview.topicsLearned}
        delay={0.15}
      />
      <StatCard
        icon={Clock}
        label="Study Time"
        value={overview.totalStudyMins}
        unit="min"
        delay={0.2}
      />
      <StatCard
        icon={Award}
        label="Badges Earned"
        value={overview.badgesEarned}
        delay={0.25}
      />
    </div>
  );
}

// ─── WeakAreaCard ─────────────────────────────────────────────────────────────
function WeakAreaCard({
  topic,
  onStudy,
  delay,
}: {
  topic: any;
  onStudy: () => void;
  delay: number;
}) {
  const masteryPercent = Math.min(100, Math.max(0, topic.masteryLevel));
  const masteryColor =
    masteryPercent < 30 ? 'bg-red-500' : masteryPercent < 60 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <FadeInUp delay={delay}>
      <div className="p-4 rounded-xl bg-base-elevated border border-white/[0.06] hover:border-white/[0.12] transition-all">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-semibold text-text-primary">{topic.name}</h4>
            <p className="text-xs text-text-muted">{topic.subjectName}</p>
          </div>
          <span className="text-2xl font-bold text-text-primary ml-2">
            {masteryPercent}%
          </span>
        </div>

        {/* Mastery bar */}
        <div className="w-full h-2 bg-base-surface rounded-full overflow-hidden mb-4">
          <div
            className={`h-full ${masteryColor} transition-all duration-500`}
            style={{ width: `${masteryPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-text-muted mb-4">
          <span>{topic.attempts} attempts</span>
          <span>{topic.accuracy}% accuracy</span>
        </div>

        <Button
          onClick={onStudy}
          variant="secondary"
          size="sm"
          className="w-full"
          leftIcon={<BookOpen size={14} />}
        >
          Study Topic
        </Button>
      </div>
    </FadeInUp>
  );
}

// ─── WeakAreasSection ──────────────────────────────────────────────────────────
function WeakAreasSection({ weakAreas }: { weakAreas: any[] }) {
  const navigate = useNavigate();

  if (weakAreas.length === 0) {
    return (
      <FadeInUp delay={0.4}>
        <div className="text-center p-12 rounded-xl bg-base-elevated border border-white/[0.06]">
          <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="text-green-500" size={24} />
          </div>
          <p className="font-semibold text-text-primary mb-1">All Topics Mastered!</p>
          <p className="text-sm text-text-muted">
            Keep practicing to maintain your knowledge
          </p>
        </div>
      </FadeInUp>
    );
  }

  return (
    <FadeInUp delay={0.35}>
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-display font-bold text-text-primary mb-1">
              Focus Areas
            </h2>
            <p className="text-sm text-text-muted">
              Topics with less than 70% mastery
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {weakAreas.slice(0, 6).map((topic, idx) => (
            <WeakAreaCard
              key={topic.topicId}
              topic={topic}
              onStudy={() => navigate(`/study/topic/${topic.topicId}`)}
              delay={0.4 + idx * 0.05}
            />
          ))}
        </div>

        {weakAreas.length > 6 && (
          <div className="mt-4 text-center">
            <Button
              variant="secondary"
              onClick={() => navigate('/progress/analytics')}
            >
              View all focus areas
            </Button>
          </div>
        )}
      </div>
    </FadeInUp>
  );
}

// ─── QuickActionsSection ──────────────────────────────────────────────────────
function QuickActionsSection() {
  const navigate = useNavigate();

  const actions = [
    {
      icon: BookOpen,
      label: 'Study Plan',
      description: 'Continue or start a study plan',
      onClick: () => navigate('/study/plans'),
      color: 'from-blue-500/10 to-blue-500/5',
    },
    {
      icon: Zap,
      label: 'Flashcards',
      description: 'Review due flashcards',
      onClick: () => navigate('/study/flashcards'),
      color: 'from-yellow-500/10 to-yellow-500/5',
    },
    {
      icon: Target,
      label: 'Practice Quiz',
      description: 'Take a random practice quiz',
      onClick: () => navigate('/study/quiz'),
      color: 'from-green-500/10 to-green-500/5',
    },
    {
      icon: Award,
      label: 'Exam Sim',
      description: 'Start a timed exam simulation',
      onClick: () => navigate('/study/exams'),
      color: 'from-purple-500/10 to-purple-500/5',
    },
  ];

  return (
    <FadeInUp delay={0.5}>
      <div>
        <h2 className="text-xl font-display font-bold text-text-primary mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map(({ icon: Icon, label, description, onClick, color }, idx) => (
            <FadeInUp key={label} delay={0.5 + idx * 0.05}>
              <button
                onClick={onClick}
                className={`
                  relative p-6 rounded-xl border border-white/[0.06] 
                  bg-gradient-to-br ${color}
                  hover:border-white/[0.12] hover:shadow-md 
                  transition-all group overflow-hidden
                `}
              >
                {/* Background glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-lg bg-base-surface flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Icon size={20} className="text-text-primary" />
                  </div>
                  <p className="font-semibold text-text-primary text-left mb-1">{label}</p>
                  <p className="text-xs text-text-muted text-left">{description}</p>
                </div>
              </button>
            </FadeInUp>
          ))}
        </div>
      </div>
    </FadeInUp>
  );
}

// ─── RecentActivitySection ────────────────────────────────────────────────────
function RecentActivitySection({
  dueFlashcards,
  activeStudyPlans,
}: {
  dueFlashcards?: number;
  activeStudyPlans?: number;
}) {
  const navigate = useNavigate();

  return (
    <FadeInUp delay={0.6}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Due Flashcards */}
        <div className="p-6 rounded-xl bg-base-elevated border border-white/[0.06]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-text-primary">Due Flashcards</h3>
              <p className="text-xs text-text-muted">Ready to review today</p>
            </div>
            <span className="text-2xl font-bold text-accent">{dueFlashcards ?? 0}</span>
          </div>
          {(dueFlashcards ?? 0) > 0 && (
            <Button
              onClick={() => navigate('/study/flashcards')}
              variant="secondary"
              size="sm"
              className="w-full"
            >
              Start Review
            </Button>
          )}
        </div>

        {/* Active Study Plans */}
        <div className="p-6 rounded-xl bg-base-elevated border border-white/[0.06]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-text-primary">Active Plans</h3>
              <p className="text-xs text-text-muted">Study plans in progress</p>
            </div>
            <span className="text-2xl font-bold text-accent">{activeStudyPlans ?? 0}</span>
          </div>
          {(activeStudyPlans ?? 0) > 0 ? (
            <Button
              onClick={() => navigate('/study/plans')}
              variant="secondary"
              size="sm"
              className="w-full"
            >
              View Plans
            </Button>
          ) : (
            <Button
              onClick={() => navigate('/study/plans')}
              variant="secondary"
              size="sm"
              className="w-full"
            >
              Create Plan
            </Button>
          )}
        </div>
      </div>
    </FadeInUp>
  );
}

// ─── Main StudyDashboard ──────────────────────────────────────────────────────
export default function StudyDashboard() {
  const user = useAuthStore((s) => s.user);
  const setOverview = useProgressStore((s) => s.setOverview);
  const setWeakAreas = useProgressStore((s) => s.setWeakAreas);

  // Fetch progress overview
  const overviewQuery = useQuery({
    queryKey: queryKeys.progress.me(),
    queryFn: progressService.getUserProgress,
    enabled: !!user,
  });

  // Fetch weak areas
  const weakAreasQuery = useQuery({
    queryKey: queryKeys.progress.weakAreas(10),
    queryFn: () => progressService.getWeakAreas(10),
    enabled: !!user,
  });

  // Fetch due flashcards count
  const dueFlashcardsQuery = useQuery({
    queryKey: queryKeys.flashcards.due(),
    queryFn: () => flashcardService.getDueFlashcards({ limit: 1 }),
    enabled: !!user,
  });

  // Sync with store
  useEffect(() => {
    if (overviewQuery.data) {
      setOverview(overviewQuery.data);
    }
  }, [overviewQuery.data, setOverview]);

  useEffect(() => {
    if (weakAreasQuery.data) {
      setWeakAreas(weakAreasQuery.data);
    }
  }, [weakAreasQuery.data, setWeakAreas]);

  // Error handling
  useEffect(() => {
    if (overviewQuery.error) {
      toast.error('Failed to load progress data');
    }
  }, [overviewQuery.error]);

  const isLoading =
    overviewQuery.isLoading || weakAreasQuery.isLoading || dueFlashcardsQuery.isLoading;

  return (
    <div className="min-h-screen bg-base">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <Spinner />
          </div>
        ) : (
          <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Welcome + Streak + XP */}
            {user && overviewQuery.data && (
              <WelcomeCard
                firstName={user.firstName}
                streak={overviewQuery.data.currentStreak}
                xp={overviewQuery.data.totalXp}
              />
            )}

            {/* 4-stat grid */}
            {overviewQuery.data && <StatsGrid overview={overviewQuery.data} />}

            {/* Weak areas / Focus areas */}
            {weakAreasQuery.data && (
              <WeakAreasSection weakAreas={weakAreasQuery.data} />
            )}

            {/* Quick actions */}
            <QuickActionsSection />

            {/* Recent activity */}
            <RecentActivitySection
              dueFlashcards={dueFlashcardsQuery.data?.pagination?.total ?? 0}
              activeStudyPlans={0}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
