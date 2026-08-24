import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2, RefreshCw, ChevronDown,
  BookOpen, ArrowRight, Brain, BarChart3, Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { gapService } from '@/features/gaps/gapService';
import { cn } from '@/lib/utils';
import type { LearningGap, GapSeverity, GapStatus } from '@/types';

const SEVERITY_CONFIG: Record<GapSeverity, { label: string; color: string; bg: string }> = {
  CRITICAL: { label: 'Critical', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20' },
  HIGH:     { label: 'High',     color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20' },
  MEDIUM:   { label: 'Medium',   color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
  LOW:      { label: 'Low',      color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
};

const STATUS_CONFIG: Record<GapStatus, { label: string; color: string }> = {
  OPEN:          { label: 'Open',         color: 'text-red-400' },
  ACKNOWLEDGED:  { label: 'Acknowledged', color: 'text-yellow-400' },
  IN_PROGRESS:   { label: 'In Progress',  color: 'text-blue-400' },
  RESOLVED:      { label: 'Resolved',     color: 'text-brand-success' },
  MONITORING:    { label: 'Monitoring',   color: 'text-text-muted' },
};

function GapCard({ gap, onAcknowledge, onReEvaluate, isProcessing }: {
  gap: LearningGap;
  onAcknowledge: (id: string) => void;
  onReEvaluate: (id: string) => void;
  isProcessing: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const sev = SEVERITY_CONFIG[gap.severity];
  const sta = STATUS_CONFIG[gap.status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-base-surface border border-white/[0.06] rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-base-elevated/30 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={cn('text-xs font-bold px-2 py-0.5 rounded border shrink-0', sev.color, sev.bg)}>
            {sev.label}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {gap.topic?.name ?? 'Unknown topic'}
            </p>
            <p className="text-xs text-text-muted">
              {gap.topic?.subject?.name ?? gap.subject?.name ?? '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-3">
          <span className={cn('text-xs', sta.color)}>{sta.label}</span>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={14} className="text-text-muted" />
          </motion.div>
        </div>
      </button>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-white/[0.06]"
        >
          <div className="px-5 py-4 space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-base-elevated rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-text-primary">{gap.masteryAtDetection}%</p>
                <p className="text-xs text-text-muted">Mastery at detection</p>
              </div>
              <div className="bg-base-elevated rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-text-primary">{Math.round(gap.gapScore)}%</p>
                <p className="text-xs text-text-muted">Gap score</p>
              </div>
              <div className="bg-base-elevated rounded-xl p-3 text-center">
                <p className="text-sm font-bold text-text-primary">
                  {new Date(gap.detectedAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-text-muted">Detected</p>
              </div>
            </div>

            {/* Tutor brief */}
            {gap.tutorInsight?.brief && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-violet-400/10 border border-violet-400/20">
                <Brain size={14} className="text-violet-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-violet-300 mb-1">Tutor AI Brief</p>
                  <p className="text-xs text-violet-200 leading-relaxed">{gap.tutorInsight.brief}</p>
                  {(gap.tutorInsight.actionItems ?? []).length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {gap.tutorInsight.actionItems.map((item, i) => (
                        <li key={i} className="text-xs text-violet-300 flex items-start gap-1.5">
                          <span className="text-violet-400 shrink-0">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Link
                to="/ai-tutor"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs bg-accent text-base-elevated font-semibold hover:bg-accent/90 transition-colors"
              >
                <Brain size={13} /> Ask FlexBot
              </Link>
              <Link
                to="/courses"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs bg-base-elevated border border-white/[0.08] text-text-secondary hover:text-text-primary transition-colors"
              >
                <BookOpen size={13} /> Study Topic
              </Link>
              {gap.status === 'OPEN' && (
                <button
                  onClick={() => onAcknowledge(gap.id)}
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs bg-base-elevated border border-white/[0.08] text-text-secondary hover:text-text-primary transition-colors disabled:opacity-60"
                >
                  Acknowledge
                </button>
              )}
              {(gap.status === 'ACKNOWLEDGED' || gap.status === 'IN_PROGRESS') && (
                <button
                  onClick={() => onReEvaluate(gap.id)}
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs bg-brand-success/10 border border-brand-success/20 text-brand-success hover:bg-brand-success/20 transition-colors disabled:opacity-60"
                >
                  <RefreshCw size={13} /> Re-evaluate
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function GapDashboardPage() {
  const [statusFilter, setStatusFilter] = useState<GapStatus | 'ALL'>('OPEN');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['my-gaps', statusFilter],
    queryFn: () => gapService.getMyGaps({
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      limit: 20,
    }),
    staleTime: 60 * 1000,
  });

  const { mutate: detectMutation, isPending: isDetecting } = useMutation({
    mutationFn: gapService.detectGaps,
    onSuccess: (result) => {
      toast.success(`Found ${result.newGapsDetected} new gaps, updated ${result.totalWeakTopics} weak topics`);
      qc.invalidateQueries({ queryKey: ['my-gaps'] });
    },
    onError: () => toast.error('Gap detection failed. Try again shortly.'),
  });

  const { mutate: acknowledgeMutation, isPending: isAcknowledging } = useMutation({
    mutationFn: (gapId: string) => gapService.updateGapStatus(gapId, 'ACKNOWLEDGED'),
    onSuccess: () => {
      toast.success('Gap acknowledged');
      qc.invalidateQueries({ queryKey: ['my-gaps'] });
    },
  });

  const { mutate: reEvaluateMutation, isPending: isReEvaluating } = useMutation({
    mutationFn: (gapId: string) => gapService.reEvaluate(gapId),
    onSuccess: (result) => {
      const msg = result.regressedGaps > 0
        ? `Re-evaluated — ${result.regressedGaps} gaps remain`
        : 'Great progress! Gaps updated.';
      toast.success(msg);
      qc.invalidateQueries({ queryKey: ['my-gaps'] });
    },
    onError: () => toast.error('Re-evaluation failed.'),
  });

  const gaps = (data?.data ?? []) as LearningGap[];
  const total = data?.pagination?.total ?? 0;
  const isProcessing = isAcknowledging || isReEvaluating;

  const STATUS_TABS: Array<{ value: GapStatus | 'ALL'; label: string }> = [
    { value: 'ALL',         label: 'All' },
    { value: 'OPEN',        label: 'Open' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'ACKNOWLEDGED',label: 'Acknowledged' },
    { value: 'RESOLVED',    label: 'Resolved' },
  ];

  return (
    <div className="min-h-dvh bg-base">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-text-primary">Learning Gaps</h1>
            <p className="text-text-muted text-sm mt-1">
              AI-detected areas where you need to improve
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => detectMutation()}
              disabled={isDetecting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-base-surface border border-white/[0.08] text-text-secondary hover:text-text-primary transition-colors disabled:opacity-60"
            >
              <RefreshCw size={14} className={isDetecting ? 'animate-spin' : ''} />
              {isDetecting ? 'Detecting…' : 'Run Detection'}
            </button>
            <Link
              to="/exam/simulate"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-accent text-base-elevated font-semibold hover:bg-accent/90 transition-colors"
            >
              Take Exam
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* How it works */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-base-surface border border-white/[0.06]">
          <Info size={14} className="text-accent shrink-0 mt-0.5" />
          <p className="text-xs text-text-muted leading-relaxed">
            FlexBot monitors three signals simultaneously — quiz &amp; exam scores, flashcard failure patterns, and repeated AI Tutor questions on the same topic.
            When weakness is detected, a gap is created and your assigned tutor receives an AI-generated brief to guide their intervention.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total gaps', value: total },
            { label: 'Critical', value: gaps.filter(g => g.severity === 'CRITICAL').length },
            { label: 'With AI brief', value: gaps.filter(g => g.tutorInsight).length },
            { label: 'Resolved', value: gaps.filter(g => g.status === 'RESOLVED').length },
          ].map(({ label, value }) => (
            <div key={label} className="bg-base-surface border border-white/[0.06] rounded-xl p-4 text-center">
              <p className="text-xl font-bold text-text-primary">{value}</p>
              <p className="text-xs text-text-muted mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 p-1 bg-base-elevated rounded-xl border border-white/[0.06] overflow-x-auto">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                statusFilter === tab.value
                  ? 'bg-base-surface text-text-primary shadow'
                  : 'text-text-muted hover:text-text-secondary'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Gap list */}
        {isLoading ? (
          <div className="space-y-3">
            {[0,1,2].map(i => (
              <div key={i} className="h-16 bg-base-surface border border-white/[0.06] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : gaps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <CheckCircle2 size={40} className="text-brand-success/60" />
            <div>
              <p className="font-display font-semibold text-text-primary">
                {statusFilter === 'OPEN' ? 'No open gaps' : 'Nothing here yet'}
              </p>
              <p className="text-sm text-text-muted mt-1">
                {statusFilter === 'OPEN'
                  ? 'Complete quizzes and exams to let FlexBot identify weak areas.'
                  : 'Try a different filter.'}
              </p>
            </div>
            {statusFilter === 'OPEN' && (
              <Link
                to="/exam/simulate"
                className="px-4 py-2 rounded-xl bg-accent text-base-elevated text-sm font-semibold hover:bg-accent/90 transition-colors"
              >
                Take a practice exam
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {gaps.map(gap => (
              <GapCard
                key={gap.id}
                gap={gap}
                onAcknowledge={id => acknowledgeMutation(id)}
                onReEvaluate={id => reEvaluateMutation(id)}
                isProcessing={isProcessing}
              />
            ))}
          </div>
        )}

        {/* Exam readiness CTA */}
        <div className="bg-base-surface border border-white/[0.06] rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <BarChart3 size={18} className="text-accent" />
            <div>
              <p className="text-sm font-semibold text-text-primary">Check Exam Readiness</p>
              <p className="text-xs text-text-muted">See your score estimate and certification eligibility</p>
            </div>
          </div>
          <Link
            to="/progress"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-accent text-base-elevated font-semibold hover:bg-accent/90 transition-colors"
          >
            View Progress <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
