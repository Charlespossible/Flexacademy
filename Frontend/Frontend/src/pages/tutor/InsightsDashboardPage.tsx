import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, CheckCircle2, ChevronDown,
  MessageSquarePlus, User, BookOpen, Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { insightService } from '@/features/insights/insightService';
import { cn } from '@/lib/utils';
import type { TutorInsight, GapSeverity } from '@/types';

const SEVERITY_CONFIG: Record<GapSeverity, { label: string; color: string; bg: string }> = {
  CRITICAL: { label: 'Critical', color: 'text-red-400',    bg: 'bg-red-400/10 border-red-400/20' },
  HIGH:     { label: 'High',     color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20' },
  MEDIUM:   { label: 'Medium',   color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
  LOW:      { label: 'Low',      color: 'text-blue-400',   bg: 'bg-blue-400/10 border-blue-400/20' },
};

function InterventionForm({
  insightId,
  onDone,
}: {
  insightId: string;
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const [method, setMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [outcome, setOutcome] = useState('');

  const METHODS = [
    'One-on-one session',
    'Video explanation',
    'Practice questions assigned',
    'Written feedback',
    'Group discussion',
    'Worked example walkthrough',
  ];

  const { mutate, isPending } = useMutation({
    mutationFn: () => insightService.logIntervention(insightId, { method, notes, outcome }),
    onSuccess: () => {
      toast.success('Intervention logged');
      qc.invalidateQueries({ queryKey: ['tutor-insights'] });
      onDone();
    },
    onError: () => toast.error('Failed to log intervention'),
  });

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="border-t border-white/[0.06] px-5 py-4 space-y-3"
    >
      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Log Intervention</p>

      <div>
        <label className="text-xs text-text-muted mb-1.5 block">Method</label>
        <div className="flex flex-wrap gap-1.5">
          {METHODS.map(m => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs border transition-all',
                method === m
                  ? 'bg-accent text-base-elevated border-accent'
                  : 'bg-base-elevated border-white/[0.06] text-text-secondary hover:text-text-primary'
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-text-muted mb-1.5 block">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          placeholder="What did you cover? Any observations…"
          className="w-full px-3 py-2 rounded-xl bg-base-elevated border border-white/[0.06] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40 resize-none"
        />
      </div>

      <div>
        <label className="text-xs text-text-muted mb-1.5 block">Outcome (optional)</label>
        <input
          value={outcome}
          onChange={e => setOutcome(e.target.value)}
          placeholder="Student response, next steps…"
          className="w-full px-3 py-2 rounded-xl bg-base-elevated border border-white/[0.06] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onDone()}
          className="flex-1 py-2 rounded-xl text-xs bg-base-elevated border border-white/[0.06] text-text-secondary hover:text-text-primary transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => mutate()}
          disabled={!method || isPending}
          className="flex-1 py-2 rounded-xl text-xs bg-accent text-base-elevated font-semibold hover:bg-accent/90 transition-colors disabled:opacity-60"
        >
          {isPending ? 'Saving…' : 'Log Intervention'}
        </button>
      </div>
    </motion.div>
  );
}

function InsightCard({ insight }: { insight: TutorInsight }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const sev = SEVERITY_CONFIG[insight.priority];

  const { mutate: resolve, isPending: resolving } = useMutation({
    mutationFn: () => insightService.resolveInsight(insight.id),
    onSuccess: () => {
      toast.success('Insight marked as resolved');
      qc.invalidateQueries({ queryKey: ['tutor-insights'] });
    },
    onError: () => toast.error('Failed to resolve'),
  });

  const studentName = insight.student
    ? `${insight.student.firstName} ${insight.student.lastName}`
    : 'Unknown student';

  const interventionCount = (insight.interventions ?? []).length;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-base-surface border rounded-2xl overflow-hidden transition-all',
        insight.isResolved ? 'border-brand-success/20 opacity-70' : 'border-white/[0.06]'
      )}
    >
      {/* Header row */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-base-elevated/30 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-base-elevated border border-white/[0.06] flex items-center justify-center shrink-0 overflow-hidden">
            {insight.student?.avatar
              ? <img src={insight.student.avatar} alt="" className="w-full h-full object-cover" />
              : <User size={14} className="text-text-muted" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-text-primary">{studentName}</p>
              <span className={cn('text-xs px-2 py-0.5 rounded border', sev.color, sev.bg)}>
                {sev.label}
              </span>
              {insight.isResolved && (
                <span className="text-xs text-brand-success bg-brand-success/10 border border-brand-success/20 px-2 py-0.5 rounded">
                  Resolved
                </span>
              )}
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              {insight.gap?.topic?.name ?? '—'} ·{' '}
              {new Date(insight.createdAt).toLocaleDateString()}
              {interventionCount > 0 && ` · ${interventionCount} intervention${interventionCount !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} className="text-text-muted" />
        </motion.div>
      </button>

      {/* Expanded body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="border-t border-white/[0.06] px-5 py-4 space-y-4">
              {/* AI Brief */}
              <div className="p-4 rounded-xl bg-violet-400/10 border border-violet-400/20">
                <div className="flex items-center gap-2 mb-2">
                  <Brain size={14} className="text-violet-400" />
                  <p className="text-xs font-semibold text-violet-300">AI-Generated Brief</p>
                </div>
                <p className="text-sm text-violet-200 leading-relaxed">{insight.brief}</p>
              </div>

              {/* Action items */}
              {(insight.actionItems ?? []).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-text-secondary mb-2 flex items-center gap-1.5">
                    <BookOpen size={12} />
                    Recommended Actions
                  </p>
                  <ul className="space-y-1.5">
                    {insight.actionItems.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                        <span className="text-accent mt-0.5 shrink-0">→</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Prior interventions */}
              {(insight.interventions ?? []).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-text-secondary mb-2 flex items-center gap-1.5">
                    <Clock size={12} />
                    Intervention History
                  </p>
                  <div className="space-y-2">
                    {insight.interventions!.map(iv => (
                      <div key={iv.id} className="p-3 rounded-xl bg-base-elevated border border-white/[0.04] text-xs">
                        <p className="font-medium text-text-primary">{iv.method}</p>
                        {iv.notes && <p className="text-text-muted mt-1">{iv.notes}</p>}
                        {iv.outcome && <p className="text-brand-success mt-1">Outcome: {iv.outcome}</p>}
                        <p className="text-text-muted mt-1">{new Date(iv.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {!insight.isResolved && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowForm(v => !v)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs bg-accent text-base-elevated font-semibold hover:bg-accent/90 transition-colors"
                  >
                    <MessageSquarePlus size={13} />
                    Log Intervention
                  </button>
                  <button
                    onClick={() => resolve()}
                    disabled={resolving}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs bg-brand-success/10 border border-brand-success/20 text-brand-success hover:bg-brand-success/20 transition-colors disabled:opacity-60"
                  >
                    <CheckCircle2 size={13} />
                    {resolving ? 'Resolving…' : 'Mark Resolved'}
                  </button>
                </div>
              )}
            </div>

            {/* Intervention form */}
            <AnimatePresence>
              {showForm && (
                <InterventionForm
                  insightId={insight.id}
                  onDone={() => setShowForm(false)}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function InsightsDashboardPage() {
  const [showResolved, setShowResolved] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['tutor-insights', { isResolved: showResolved }],
    queryFn: () => insightService.getTutorInsights({ isResolved: showResolved, limit: 30 }),
    staleTime: 60 * 1000,
  });

  const insights = (data?.data ?? []) as TutorInsight[];
  const total = data?.pagination?.total ?? 0;
  const critical = insights.filter(i => i.priority === 'CRITICAL').length;
  const high = insights.filter(i => i.priority === 'HIGH').length;

  return (
    <div className="min-h-dvh bg-base">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-text-primary">Student Insights</h1>
            <p className="text-text-muted text-sm mt-1">
              AI-generated briefs about your students' learning gaps
            </p>
          </div>
          <button
            onClick={() => setShowResolved(v => !v)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm border transition-colors',
              showResolved
                ? 'bg-brand-success/10 border-brand-success/20 text-brand-success'
                : 'bg-base-surface border-white/[0.06] text-text-secondary hover:text-text-primary'
            )}
          >
            <CheckCircle2 size={14} />
            {showResolved ? 'Showing resolved' : 'Show resolved'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total insights', value: total },
            { label: 'Critical',       value: critical,   color: 'text-red-400' },
            { label: 'High priority',  value: high,       color: 'text-orange-400' },
            { label: 'Pending action', value: insights.filter(i => !i.isResolved).length },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-base-surface border border-white/[0.06] rounded-xl p-4 text-center">
              <p className={cn('text-xl font-bold', color ?? 'text-text-primary')}>{value}</p>
              <p className="text-xs text-text-muted mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        {!isLoading && insights.length === 0 && !showResolved && (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-violet-400/10 border border-violet-400/30 flex items-center justify-center">
              <Brain size={28} className="text-violet-400" />
            </div>
            <div>
              <p className="font-display font-semibold text-text-primary">No insights yet</p>
              <p className="text-sm text-text-muted mt-1 max-w-sm">
                Insights appear automatically when your assigned students complete quizzes or exams and FlexBot detects learning gaps that need your attention.
              </p>
            </div>
          </div>
        )}

        {/* Insights list */}
        {isLoading ? (
          <div className="space-y-3">
            {[0,1,2].map(i => (
              <div key={i} className="h-20 bg-base-surface border border-white/[0.06] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {insights.map(insight => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
