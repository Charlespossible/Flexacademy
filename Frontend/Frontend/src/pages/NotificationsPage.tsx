import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, Trash2, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '@/lib/axios';
import { queryKeys } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

interface NotifResponse {
  data: Notification[];
  meta: { page: number; limit: number; total: number; unreadCount: number };
}

const TYPE_ICON: Record<string, string> = {
  BADGE_EARNED: '🏅',
  EXAM_READINESS_UPDATED: '🎯',
  STUDY_REMINDER: '📚',
  BOOKING_CONFIRMED: '📅',
  PAYMENT_SUCCESS: '💳',
  SYSTEM: '🔔',
};

export default function NotificationsPage() {
  const qc = useQueryClient();
  const [unreadOnly, setUnreadOnly] = useState(false);

  const notifQuery = useQuery({
    queryKey: queryKeys.notifications.all({ unreadOnly }),
    queryFn: async () => {
      const res = await api.get<{ success: boolean } & NotifResponse>(
        `/notifications/me?unreadOnly=${unreadOnly}`
      );
      return res.data;
    },
    staleTime: 1000 * 30,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = notifQuery.data?.data ?? [];
  const unreadCount = notifQuery.data?.meta.unreadCount ?? 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-text-muted mt-1">{unreadCount} unread</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setUnreadOnly((v) => !v)}
            className={unreadOnly ? 'text-accent bg-accent/10' : ''}
          >
            {unreadOnly ? 'Show all' : 'Unread only'}
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<CheckCheck size={14} />}
              loading={markAllMutation.isPending}
              onClick={() => markAllMutation.mutate()}
            >
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* List */}
      {notifQuery.isLoading ? (
        <div className="flex items-center gap-2 text-text-muted text-sm py-8">
          <Loader2 size={14} className="animate-spin" /> Loading notifications…
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3 text-center">
          <Bell size={32} className="text-text-muted opacity-30" />
          <p className="font-display font-semibold text-text-primary">
            {unreadOnly ? 'No unread notifications' : 'No notifications yet'}
          </p>
          <p className="text-sm text-text-muted">
            {unreadOnly
              ? 'Switch to "Show all" to see your history.'
              : 'Notifications about your progress and activity will appear here.'}
          </p>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'flex items-start gap-4 p-4 rounded-2xl border transition-colors',
                n.isRead
                  ? 'bg-base-surface border-border-subtle'
                  : 'bg-base-elevated border-accent/20'
              )}
            >
              {/* Icon */}
              <div className="text-2xl shrink-0 mt-0.5">
                {TYPE_ICON[n.type] ?? '🔔'}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn('text-sm font-semibold', n.isRead ? 'text-text-secondary' : 'text-text-primary')}>
                    {n.title}
                  </p>
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-accent shrink-0 mt-1.5" />
                  )}
                </div>
                <p className="text-xs text-text-muted mt-0.5 leading-snug">{n.body}</p>
                <p className="text-2xs text-text-muted mt-1.5">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {!n.isRead && (
                  <button
                    title="Mark as read"
                    onClick={() => markReadMutation.mutate(n.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                  >
                    <Check size={13} />
                  </button>
                )}
                <button
                  title="Delete"
                  onClick={() => deleteMutation.mutate(n.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-brand-danger hover:bg-brand-danger/10 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}
