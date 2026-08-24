import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy, Loader2, Crown } from 'lucide-react';
import api from '@/lib/axios';
import { queryKeys } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  score: number;
  isCurrentUser: boolean;
}

interface LeaderboardResponse {
  data: LeaderboardEntry[];
  meta: { period: string; currentUserRank: number | null };
}

const PERIODS = [
  { key: 'all-time', label: 'All Time' },
  { key: 'monthly',  label: 'Monthly' },
  { key: 'weekly',   label: 'Weekly' },
  { key: 'daily',    label: 'Daily' },
] as const;

const RANK_STYLE: Record<number, string> = {
  1: 'bg-amber-400/20 border-amber-400/40 text-amber-400',
  2: 'bg-slate-400/20 border-slate-400/40 text-slate-400',
  3: 'bg-orange-400/20 border-orange-400/40 text-orange-400',
};

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<string>('all-time');

  const query = useQuery({
    queryKey: queryKeys.leaderboard.all({ period }),
    queryFn: async () => {
      const res = await api.get<{ success: boolean } & LeaderboardResponse>(
        `/leaderboard?period=${period}&limit=50`
      );
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const entries = query.data?.data ?? [];
  const currentUserRank = query.data?.meta.currentUserRank;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
          <Trophy size={20} className="text-accent" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Leaderboard</h1>
          <p className="text-sm text-text-muted">Top learners ranked by XP earned.</p>
        </div>
      </div>

      {/* Period tabs */}
      <div className="flex items-center gap-1 p-1 bg-base-subtle rounded-xl w-fit">
        {PERIODS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
              period === key
                ? 'bg-base-elevated text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Current user rank callout */}
      {currentUserRank && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-accent/5 border border-accent/20">
          <Crown size={15} className="text-accent shrink-0" />
          <p className="text-sm text-text-primary">
            You&apos;re ranked <span className="font-bold text-accent">#{currentUserRank}</span> for {period}.
          </p>
        </div>
      )}

      {/* List */}
      {query.isLoading ? (
        <div className="flex items-center gap-2 text-text-muted text-sm py-8">
          <Loader2 size={14} className="animate-spin" /> Loading…
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3 text-center">
          <Trophy size={32} className="text-text-muted opacity-30" />
          <p className="font-display font-semibold text-text-primary">No entries yet</p>
          <p className="text-sm text-text-muted">Complete quizzes to earn XP and appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, i) => (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
              className={cn(
                'flex items-center gap-4 px-4 py-3 rounded-xl border transition-colors',
                entry.isCurrentUser
                  ? 'bg-accent/5 border-accent/30'
                  : 'bg-base-surface border-border-subtle'
              )}
            >
              {/* Rank */}
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border',
                RANK_STYLE[entry.rank] ?? 'bg-base-subtle border-border-subtle text-text-muted'
              )}>
                {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
              </div>

              {/* Avatar */}
              <Avatar
                firstName={entry.firstName}
                lastName={entry.lastName}
                src={entry.avatar}
                size="sm"
              />

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-sm font-semibold truncate',
                  entry.isCurrentUser ? 'text-accent' : 'text-text-primary'
                )}>
                  {entry.firstName} {entry.lastName}
                  {entry.isCurrentUser && <span className="text-2xs ml-1 opacity-70">(you)</span>}
                </p>
              </div>

              {/* Score */}
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-text-primary">{entry.score.toLocaleString()}</p>
                <p className="text-2xs text-text-muted">XP</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
