import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BookOpen, Brain, Flame, Trophy, Clock, Target,
  TrendingUp, AlertTriangle, CheckCircle, Loader2,
} from 'lucide-react';
import api from '@/lib/axios';
import { queryClient as _qc, queryKeys } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProgressOverview {
  avgMastery: number;
  topicsLearned: number;
  coursesEnrolled: number;
  coursesCompleted: number;
  totalStudyMins: number;
  totalXp: number;
  badgesEarned: number;
  currentStreak: number;
  longestStreak: number;
}

interface SubjectProgress {
  subjectId: string;
  name: string;
  totalTopics: number;
  learnedTopics: number;
  avgMastery: number;
  completionPercent: number;
}

interface WeakArea {
  topicId: string;
  topicName: string;
  masteryLevel: number;
  accuracy: number;
  totalAttempts: number;
  recommendedStudyTime: number;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM';
}

interface HeatmapCell {
  week: number;
  day: number;
  minutes: number;
  intensity: 0 | 1 | 2 | 3;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtMins(mins: number) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const PRIORITY_COLOR = {
  URGENT: 'text-brand-danger bg-brand-danger/10 border-brand-danger/20',
  HIGH: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  MEDIUM: 'text-accent bg-accent/10 border-accent/20',
};

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-base-surface border border-border-subtle rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
          <Icon size={17} className="text-accent" />
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wide font-medium">{label}</p>
          <p className="font-display text-xl font-bold text-text-primary mt-0.5">{value}</p>
          {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Activity heatmap ─────────────────────────────────────────────────────────
const INTENSITY_COLOR = [
  'bg-base-subtle',
  'bg-accent/30',
  'bg-accent/60',
  'bg-accent',
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function ActivityHeatmap({ cells }: { cells: HeatmapCell[] }) {
  // Build week × day grid (53 weeks × 7 days)
  const grid: HeatmapCell[][] = Array.from({ length: 53 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const cell = cells.find((c) => c.week === w && c.day === d);
      return cell ?? { week: w, day: d, minutes: 0, intensity: 0 };
    })
  );

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-0.5 min-w-max">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-1">
          <div className="w-5 h-3" /> {/* header spacer */}
          {DAY_LABELS.map((d, i) => (
            <div key={d} className={cn('h-3 text-3xs text-text-muted leading-3', i % 2 === 0 ? 'opacity-100' : 'opacity-0')}>
              {d}
            </div>
          ))}
        </div>
        {grid.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            <div className="w-3 h-3" /> {/* month label placeholder */}
            {week.map((cell) => (
              <div
                key={`${cell.week}-${cell.day}`}
                title={cell.minutes > 0 ? `${cell.minutes} min studied` : 'No activity'}
                className={cn('w-3 h-3 rounded-[2px] transition-colors', INTENSITY_COLOR[cell.intensity])}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-2 justify-end">
        <span className="text-2xs text-text-muted">Less</span>
        {INTENSITY_COLOR.map((c, i) => (
          <div key={i} className={cn('w-3 h-3 rounded-[2px]', c)} />
        ))}
        <span className="text-2xs text-text-muted">More</span>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center py-10 gap-2 text-text-muted">
      <Brain size={28} className="opacity-30" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ProgressPage() {
  const overviewQuery = useQuery({
    queryKey: queryKeys.progress.me(),
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: { overview: ProgressOverview } }>('/progress/me');
      return res.data.data.overview;
    },
    staleTime: 1000 * 60 * 5,
  });

  const subjectsQuery = useQuery({
    queryKey: queryKeys.progress.subjects(),
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: SubjectProgress[] }>('/progress/me/subjects');
      return res.data.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const weakQuery = useQuery({
    queryKey: queryKeys.progress.weakAreas(8),
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: WeakArea[] }>('/progress/me/weak-areas?limit=8');
      return res.data.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const heatmapQuery = useQuery({
    queryKey: queryKeys.progress.heatmap(),
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: HeatmapCell[] }>('/progress/me/heatmap');
      return res.data.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const o = overviewQuery.data;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">My Progress</h1>
        <p className="text-sm text-text-muted mt-1">Track your mastery, activity, and exam readiness.</p>
      </div>

      {/* ── Overview stats ────────────────────────────────────────────────────── */}
      {overviewQuery.isLoading ? (
        <div className="flex items-center gap-2 text-text-muted text-sm py-4">
          <Loader2 size={14} className="animate-spin" /> Loading stats…
        </div>
      ) : o ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          <StatCard icon={Brain} label="Avg Mastery" value={`${o.avgMastery}%`} sub={`${o.topicsLearned} topics learned`} />
          <StatCard icon={Flame} label="Streak" value={`${o.currentStreak}🔥`} sub={`Best: ${o.longestStreak} days`} />
          <StatCard icon={Clock} label="Study Time" value={fmtMins(o.totalStudyMins)} sub="Total" />
          <StatCard icon={Trophy} label="XP Earned" value={o.totalXp.toLocaleString()} sub={`${o.badgesEarned} badges`} />
        </motion.div>
      ) : null}

      {/* ── Activity heatmap ─────────────────────────────────────────────────── */}
      <div className="bg-base-surface border border-border-subtle rounded-2xl p-5">
        <h2 className="font-display font-semibold text-text-primary mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-accent" />
          Study Activity
        </h2>
        {heatmapQuery.isLoading ? (
          <div className="flex items-center gap-2 text-text-muted text-sm">
            <Loader2 size={14} className="animate-spin" /> Loading…
          </div>
        ) : heatmapQuery.data ? (
          <ActivityHeatmap cells={heatmapQuery.data} />
        ) : (
          <EmptyState label="No activity data yet. Start studying!" />
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* ── Subject progress ────────────────────────────────────────────────── */}
        <div className="bg-base-surface border border-border-subtle rounded-2xl p-5">
          <h2 className="font-display font-semibold text-text-primary mb-4 flex items-center gap-2">
            <BookOpen size={16} className="text-accent" />
            Subjects
          </h2>
          {subjectsQuery.isLoading ? (
            <div className="flex items-center gap-2 text-text-muted text-sm">
              <Loader2 size={14} className="animate-spin" /> Loading…
            </div>
          ) : subjectsQuery.data && subjectsQuery.data.length > 0 ? (
            <div className="space-y-3">
              {subjectsQuery.data.map((s) => (
                <div key={s.subjectId}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-text-primary truncate">{s.name}</span>
                    <span className="text-xs text-text-muted ml-2 shrink-0">{s.avgMastery}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-base-subtle overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        s.avgMastery >= 80 ? 'bg-brand-success' :
                        s.avgMastery >= 50 ? 'bg-accent' : 'bg-brand-danger'
                      )}
                      style={{ width: `${s.avgMastery}%` }}
                    />
                  </div>
                  <p className="text-2xs text-text-muted mt-0.5">
                    {s.learnedTopics}/{s.totalTopics} topics · {s.completionPercent}% complete
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState label="No subject progress yet. Complete some quizzes!" />
          )}
        </div>

        {/* ── Weak areas ──────────────────────────────────────────────────────── */}
        <div className="bg-base-surface border border-border-subtle rounded-2xl p-5">
          <h2 className="font-display font-semibold text-text-primary mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-accent" />
            Areas to Improve
          </h2>
          {weakQuery.isLoading ? (
            <div className="flex items-center gap-2 text-text-muted text-sm">
              <Loader2 size={14} className="animate-spin" /> Loading…
            </div>
          ) : weakQuery.data && weakQuery.data.length > 0 ? (
            <div className="space-y-2.5">
              {weakQuery.data.map((w) => (
                <div
                  key={w.topicId}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-base-elevated border border-border-subtle"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{w.topicName}</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {w.accuracy}% accuracy · {w.totalAttempts} attempts · ~{w.recommendedStudyTime}min needed
                    </p>
                  </div>
                  <span className={cn('text-2xs px-2 py-0.5 rounded-full border font-semibold shrink-0', PRIORITY_COLOR[w.priority])}>
                    {w.priority}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 gap-2">
              <CheckCircle size={28} className="text-brand-success opacity-70" />
              <p className="text-sm text-text-muted">No weak areas — great work!</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Courses summary ─────────────────────────────────────────────────── */}
      {o && (
        <div className="bg-base-surface border border-border-subtle rounded-2xl p-5">
          <h2 className="font-display font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Target size={16} className="text-accent" />
            Courses
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Enrolled', value: o.coursesEnrolled },
              { label: 'Completed', value: o.coursesCompleted },
              { label: 'In Progress', value: o.coursesEnrolled - o.coursesCompleted },
              { label: 'Topics Learned', value: o.topicsLearned },
            ].map(({ label, value }) => (
              <div key={label} className="text-center p-3 rounded-xl bg-base-subtle">
                <p className="font-display text-xl font-bold text-text-primary">{value}</p>
                <p className="text-xs text-text-muted mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
