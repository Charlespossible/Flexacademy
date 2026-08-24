import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, AlertTriangle, TrendingUp, Flame, Star,
  LinkIcon, Loader2, CheckCircle2, Bell, ChevronRight,
  BookOpen, Brain, ArrowRight, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChildSummary {
  linkId: string;
  isVerified: boolean;
  nickname: string | null;
  child: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    email: string;
    openGapsCount: number;
    lastScore: number | null;
    lastActive: string | null;
    studentProfile: {
      gradeLevel: string;
      curriculum: string;
      studyStreakDays: number;
      longestStreak: number;
      totalXp: number;
    } | null;
  };
}

interface ParentAlert {
  id: string;
  alertType: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link: {
    nickname: string | null;
    child: { firstName: string; lastName: string };
  };
}

// ── API helpers ───────────────────────────────────────────────────────────────

const parentApi = {
  getChildren: async (): Promise<ChildSummary[]> => {
    const res = await api.get('/parent/children');
    return res.data.data;
  },
  linkChild: async (studentEmail: string): Promise<{ childName: string }> => {
    const res = await api.post('/parent/link-child', { studentEmail });
    return res.data.data;
  },
  getAlerts: async (): Promise<ParentAlert[]> => {
    const res = await api.get('/parent/alerts');
    return res.data.data;
  },
  markAlertRead: async (alertId: string): Promise<void> => {
    await api.patch(`/parent/alerts/${alertId}/read`);
  },
};

// ── Alert type label ──────────────────────────────────────────────────────────

function alertIcon(type: string) {
  if (type === 'gap_detected') return <Brain size={14} className="text-orange-400" />;
  if (type === 'low_score') return <TrendingUp size={14} className="text-red-400" />;
  if (type === 'inactivity') return <Flame size={14} className="text-yellow-400" />;
  return <Bell size={14} className="text-text-muted" />;
}

// ── Child card ────────────────────────────────────────────────────────────────

function ChildCard({ summary }: { summary: ChildSummary }) {
  const { child, nickname } = summary;
  const profile = child.studentProfile;
  const displayName = nickname ?? child.firstName;

  const scoreColor =
    child.lastScore === null ? 'text-text-muted' :
    child.lastScore >= 70 ? 'text-brand-success' :
    child.lastScore >= 50 ? 'text-yellow-400' : 'text-red-400';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-base-surface border border-white/[0.06] rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center font-display font-bold text-accent text-base">
            {child.firstName.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">{displayName}</p>
            <p className="text-xs text-text-muted">
              {profile?.gradeLevel ?? '—'} · {profile?.curriculum ?? '—'}
            </p>
          </div>
        </div>
        {child.openGapsCount > 0 && (
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-orange-400/10 border border-orange-400/20 text-orange-400 font-semibold">
            <AlertTriangle size={11} />
            {child.openGapsCount} gap{child.openGapsCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 divide-x divide-white/[0.06]">
        <div className="py-4 text-center">
          <p className="text-lg font-bold text-brand-xp">{profile?.studyStreakDays ?? 0}</p>
          <p className="text-xs text-text-muted flex items-center justify-center gap-1">
            <Flame size={11} className="text-brand-xp" /> Streak
          </p>
        </div>
        <div className="py-4 text-center">
          <p className={cn('text-lg font-bold', scoreColor)}>
            {child.lastScore !== null ? `${Math.round(child.lastScore)}%` : '—'}
          </p>
          <p className="text-xs text-text-muted">Last score</p>
        </div>
        <div className="py-4 text-center">
          <p className="text-lg font-bold text-brand-xp">{(profile?.totalXp ?? 0).toLocaleString()}</p>
          <p className="text-xs text-text-muted flex items-center justify-center gap-1">
            <Star size={11} className="text-brand-xp" /> XP
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between">
        <p className="text-xs text-text-muted">
          {child.lastActive
            ? `Last active ${new Date(child.lastActive).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}`
            : 'No recent activity'}
        </p>
        <button
          className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors font-medium"
          onClick={() => toast('Full progress view coming soon.', { icon: '📊' })}
        >
          View progress <ChevronRight size={12} />
        </button>
      </div>
    </motion.div>
  );
}

// ── Link child modal ──────────────────────────────────────────────────────────

function LinkChildPanel({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const qc = useQueryClient();

  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: (e: string) => parentApi.linkChild(e),
    onSuccess: (data) => {
      toast.success(`Linked to ${data.childName}!`);
      qc.invalidateQueries({ queryKey: ['parent-children'] });
      setTimeout(onClose, 1200);
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message ?? 'Could not link child. Check the email and try again.');
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-base-surface border border-accent/20 rounded-2xl p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LinkIcon size={15} className="text-accent" />
          <h3 className="font-display font-semibold text-text-primary text-sm">Link a child</h3>
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
          <X size={16} />
        </button>
      </div>

      <p className="text-xs text-text-muted leading-relaxed">
        Enter the email address your child used to register on FlexAcademy. You'll be linked immediately and can start monitoring their progress.
      </p>

      {isSuccess ? (
        <div className="flex items-center gap-2 text-brand-success text-sm">
          <CheckCircle2 size={16} />
          Linked successfully!
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            placeholder="child@example.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
          />
          <Button
            size="sm"
            onClick={() => email.trim() && mutate(email.trim())}
            disabled={!email.trim() || isPending}
            leftIcon={isPending ? <Loader2 size={13} className="animate-spin" /> : undefined}
          >
            Link
          </Button>
        </div>
      )}
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ParentDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [showLinkPanel, setShowLinkPanel] = useState(false);
  const qc = useQueryClient();

  const { data: children = [], isLoading: childrenLoading } = useQuery({
    queryKey: ['parent-children'],
    queryFn: parentApi.getChildren,
    staleTime: 2 * 60 * 1000,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['parent-alerts'],
    queryFn: parentApi.getAlerts,
    staleTime: 60 * 1000,
  });

  const { mutate: markRead } = useMutation({
    mutationFn: parentApi.markAlertRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parent-alerts'] }),
  });

  const unreadAlerts = alerts.filter((a) => !a.isRead);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="min-h-dvh bg-base">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between flex-wrap gap-4 mt-6">
            <div>
              <h1 className="font-display text-2xl font-bold text-text-primary">
                {greeting}{user ? `, ${user.firstName}` : ''}
              </h1>
              <p className="text-text-muted text-sm mt-1">
                Here's how your {children.length === 1 ? 'child is' : 'children are'} doing today.
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<LinkIcon size={14} />}
              onClick={() => setShowLinkPanel((v) => !v)}
            >
              Link a child
            </Button>
          </div>
        </motion.div>

        {/* Unread alerts banner */}
        <AnimatePresence>
          {unreadAlerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-orange-400/5 border border-orange-400/20 rounded-2xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Bell size={14} className="text-orange-400" />
                  <p className="text-sm font-semibold text-text-primary">
                    {unreadAlerts.length} new alert{unreadAlerts.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => unreadAlerts.forEach((a) => markRead(a.id))}
                  className="text-xs text-text-muted hover:text-text-secondary transition-colors"
                >
                  Mark all read
                </button>
              </div>
              <div className="space-y-2">
                {unreadAlerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="flex items-start gap-2.5">
                    {alertIcon(alert.alertType)}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-text-secondary leading-relaxed">{alert.message}</p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {alert.link.nickname ?? alert.link.child.firstName} ·{' '}
                        {new Date(alert.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <button
                      onClick={() => markRead(alert.id)}
                      className="text-text-muted hover:text-text-primary transition-colors shrink-0"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Link child panel */}
        <AnimatePresence>
          {showLinkPanel && (
            <LinkChildPanel onClose={() => setShowLinkPanel(false)} />
          )}
        </AnimatePresence>

        {/* Children grid */}
        {childrenLoading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[0, 1].map((i) => (
              <div key={i} className="bg-base-surface border border-white/[0.06] rounded-2xl h-52 animate-pulse" />
            ))}
          </div>
        ) : children.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 gap-5 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Users size={28} className="text-accent" />
            </div>
            <div>
              <p className="font-display font-semibold text-text-primary text-lg">No children linked yet</p>
              <p className="text-sm text-text-muted mt-1 max-w-sm">
                Link your child's account using the email they registered with. You'll see their progress, streaks, and AI-detected gaps here.
              </p>
            </div>
            <Button onClick={() => setShowLinkPanel(true)} leftIcon={<LinkIcon size={14} />}>
              Link your first child
            </Button>
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {children.map((summary) => (
              <ChildCard key={summary.linkId} summary={summary} />
            ))}
          </div>
        )}

        {/* How it works (shown when no children) */}
        {children.length === 0 && (
          <div className="bg-base-surface border border-white/[0.06] rounded-2xl p-6 space-y-4">
            <h2 className="font-display font-semibold text-text-primary text-sm">What you can monitor</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { icon: TrendingUp, title: 'Quiz & exam scores', desc: 'See every quiz score and exam simulation result in real time.' },
                { icon: Brain, title: 'AI-detected gaps', desc: 'FlexBot flags topics where your child is struggling before exams do.' },
                { icon: Flame, title: 'Streaks & XP', desc: 'Daily study streaks and experience points show consistency and effort.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                    <Icon size={14} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary mb-0.5">{title}</p>
                    <p className="text-xs text-text-muted leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Past alerts (read) */}
        {alerts.filter((a) => a.isRead).length > 0 && (
          <div className="bg-base-surface border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-text-muted" />
                <h2 className="font-display font-semibold text-text-primary text-sm">Past alerts</h2>
              </div>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {alerts.filter((a) => a.isRead).slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 px-5 py-3.5">
                  {alertIcon(alert.alertType)}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-muted leading-relaxed">{alert.message}</p>
                    <p className="text-xs text-text-muted/60 mt-0.5">
                      {alert.link.nickname ?? alert.link.child.firstName} ·{' '}
                      {new Date(alert.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick tips for new parents */}
        {children.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="mailto:support@flexacademy.ng"
              className="flex items-center gap-3 flex-1 p-4 rounded-2xl bg-base-surface border border-white/[0.06] hover:border-accent/20 transition-colors group"
            >
              <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                <BookOpen size={15} className="text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Parent guides</p>
                <p className="text-xs text-text-muted">How to read your child's reports</p>
              </div>
              <ArrowRight size={14} className="text-text-muted ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            <a
              href="mailto:support@flexacademy.ng"
              className="flex items-center gap-3 flex-1 p-4 rounded-2xl bg-base-surface border border-white/[0.06] hover:border-accent/20 transition-colors group"
            >
              <div className="w-9 h-9 rounded-xl bg-violet-400/10 border border-violet-400/20 flex items-center justify-center">
                <Brain size={15} className="text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Contact support</p>
                <p className="text-xs text-text-muted">Questions about your child's account</p>
              </div>
              <ArrowRight size={14} className="text-text-muted ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
