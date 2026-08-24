import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users, ClipboardList, ShieldCheck, TrendingUp,
  ChevronRight, AlertCircle, UserCheck, Clock,
} from 'lucide-react';
import { adminService } from '@/features/admin/adminService';
import { useAuthStore } from '@/stores/authStore';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function StatCard({
  label, value, icon: Icon, color = 'text-accent', bg = 'bg-accent/10', sub, urgent,
}: {
  label: string; value: string | number; icon: React.ElementType;
  color?: string; bg?: string; sub?: string; urgent?: boolean;
}) {
  return (
    <div className={cn(
      'bg-base-surface border rounded-2xl p-5 flex items-start gap-4',
      urgent ? 'border-yellow-400/30 ring-1 ring-yellow-400/20' : 'border-white/[0.06]'
    )}>
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', bg)}>
        <Icon size={18} className={color} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-text-primary leading-none">{value}</p>
        <p className="text-xs text-text-muted mt-1">{label}</p>
        {sub && <p className="text-2xs text-text-muted mt-0.5 opacity-60">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-56 bg-base-elevated rounded-xl" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[0,1,2,3].map(i => <div key={i} className="h-24 bg-base-elevated rounded-2xl" />)}
      </div>
      <div className="h-48 bg-base-elevated rounded-2xl" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const user = useAuthStore(s => s.user);

  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminService.getStats,
    staleTime: 60 * 1000,
  });

  const { data: appsData } = useQuery({
    queryKey: ['admin-applications', { page: 1, limit: 5 }],
    queryFn: () => adminService.getTutorApplications({ page: 1, limit: 5 }),
    staleTime: 30 * 1000,
  });

  if (isLoading) return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8"><Skeleton /></div>
  );

  if (isError || !stats) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <p className="text-text-muted text-sm">Failed to load dashboard stats.</p>
    </div>
  );

  const pendingCount = stats.applications.pending;
  const recentApps = appsData?.applications.filter(
    a => a.status === 'PENDING' || a.status === 'UNDER_REVIEW'
  ) ?? [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="font-display text-2xl font-bold text-text-primary">
            Admin Console
          </h1>
          <span className={cn(
            'text-xs font-semibold px-2 py-0.5 rounded-full border',
            user?.role === 'SUPER_ADMIN'
              ? 'text-violet-400 bg-violet-400/10 border-violet-400/20'
              : 'text-amber-400 bg-amber-400/10 border-amber-400/20'
          )}>
            {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
          </span>
        </div>
        <p className="text-sm text-text-muted">
          Welcome back, {user?.firstName}. Here's what's happening on the platform.
        </p>
      </div>

      {/* Pending applications alert */}
      {pendingCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-2xl bg-yellow-400/10 border border-yellow-400/20"
        >
          <AlertCircle size={18} className="text-yellow-400 shrink-0" />
          <p className="text-sm text-yellow-200 flex-1">
            <strong>{pendingCount}</strong> tutor application{pendingCount !== 1 ? 's are' : ' is'} awaiting your review.
          </p>
          <Link
            to="/admin/applications"
            className="flex items-center gap-1 text-xs font-semibold text-yellow-300 hover:text-yellow-200 shrink-0"
          >
            Review now <ChevronRight size={13} />
          </Link>
        </motion.div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Total users"
          value={stats.users.total.toLocaleString()}
          icon={Users}
          color="text-accent"
          bg="bg-accent/10"
          sub={`${stats.recentSignups} new this week`}
        />
        <StatCard
          label="Students"
          value={stats.users.students.toLocaleString()}
          icon={UserCheck}
          color="text-blue-400"
          bg="bg-blue-400/10"
        />
        <StatCard
          label="Pending applications"
          value={pendingCount}
          icon={ClipboardList}
          color="text-yellow-400"
          bg="bg-yellow-400/10"
          urgent={pendingCount > 0}
          sub={`${stats.applications.approved} approved total`}
        />
        <StatCard
          label="Paid subscriptions"
          value={stats.paidSubscriptions.toLocaleString()}
          icon={TrendingUp}
          color="text-brand-success"
          bg="bg-brand-success/10"
        />
      </div>

      {/* Role breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { role: 'Tutors', count: stats.users.tutors, icon: ShieldCheck, color: 'text-violet-400' },
          { role: 'Parents', count: stats.users.parents, icon: Users, color: 'text-blue-400' },
          { role: 'Admins', count: stats.users.admins, icon: ShieldCheck, color: 'text-amber-400' },
        ].map(({ role, count, icon: Icon, color }) => (
          <div key={role} className="bg-base-surface border border-white/[0.06] rounded-2xl p-4 flex items-center gap-3">
            <Icon size={16} className={color} />
            <span className="text-sm text-text-secondary">{role}</span>
            <span className="ml-auto text-lg font-bold text-text-primary">{count}</span>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent pending applications */}
        <div className="lg:col-span-2 bg-base-surface border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ClipboardList size={15} className="text-yellow-400" />
              <h2 className="font-display font-semibold text-text-primary text-sm">Pending Applications</h2>
            </div>
            <Link to="/admin/applications" className="text-xs text-accent hover:text-accent/80 flex items-center gap-1">
              View all <ChevronRight size={12} />
            </Link>
          </div>

          {recentApps.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <ShieldCheck size={24} className="text-brand-success mx-auto" />
              <p className="text-sm text-text-muted">No pending applications — you're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentApps.map(app => (
                <div key={app.id} className="flex items-center gap-3 p-3 rounded-xl bg-base-elevated hover:bg-base-subtle transition-colors">
                  <Avatar
                    firstName={app.tutorProfile.user.firstName}
                    lastName={app.tutorProfile.user.lastName}
                    src={app.tutorProfile.user.avatar ?? undefined}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {app.tutorProfile.user.firstName} {app.tutorProfile.user.lastName}
                    </p>
                    <p className="text-xs text-text-muted truncate">{app.tutorProfile.user.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-2xs text-text-muted flex items-center gap-1">
                      <Clock size={10} />
                      {timeAgo(app.submittedAt)}
                    </span>
                    <Link
                      to="/admin/applications"
                      className="text-xs font-semibold text-accent hover:text-accent/80 transition-colors"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="bg-base-surface border border-white/[0.06] rounded-2xl p-5 space-y-1">
          <h2 className="font-display font-semibold text-text-primary text-sm mb-4">Admin Tools</h2>
          {[
            { to: '/admin/applications', icon: ClipboardList, label: 'Tutor Applications',  desc: 'Review & approve tutors',   badge: pendingCount > 0 ? pendingCount : undefined },
            { to: '/admin/users',        icon: Users,         label: 'User Management',      desc: 'Search, roles & suspension' },
            { to: '/notifications',      icon: AlertCircle,   label: 'Notifications',        desc: 'Platform alerts'            },
            { to: '/settings',           icon: ShieldCheck,   label: 'Settings',             desc: 'Platform configuration'     },
          ].map(({ to, icon: Icon, label, desc, badge }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-base-elevated transition-colors group"
            >
              <Icon size={15} className="text-text-muted group-hover:text-accent transition-colors shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">{label}</p>
                <p className="text-xs text-text-muted">{desc}</p>
              </div>
              {badge !== undefined && (
                <span className="w-5 h-5 rounded-full bg-yellow-400/20 text-yellow-400 text-2xs font-bold flex items-center justify-center">
                  {badge}
                </span>
              )}
              <ChevronRight size={13} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
