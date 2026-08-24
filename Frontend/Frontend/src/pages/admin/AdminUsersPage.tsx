import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Search, ShieldOff, ShieldCheck, Mail, Calendar,
  UserCheck, AlertCircle, ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService, type AdminUser } from '@/features/admin/adminService';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_FILTERS = ['All', 'STUDENT', 'TUTOR', 'PARENT', 'ADMIN'];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    STUDENT:     'text-blue-400 bg-blue-400/10 border-blue-400/20',
    TUTOR:       'text-violet-400 bg-violet-400/10 border-violet-400/20',
    PARENT:      'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    ADMIN:       'text-amber-400 bg-amber-400/10 border-amber-400/20',
    SUPER_ADMIN: 'text-red-400 bg-red-400/10 border-red-400/20',
  };
  return (
    <span className={cn('text-2xs font-semibold px-2 py-0.5 rounded-full border', map[role] ?? 'text-text-muted border-border-subtle bg-base-elevated')}>
      {role.replace('_', ' ')}
    </span>
  );
}

// ─── User row ─────────────────────────────────────────────────────────────────

function UserRow({ user, onToggle }: { user: AdminUser; onToggle: () => void }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reason, setReason] = useState('');

  // Suspension is now soft: the account still works, but the user is shown this
  // reason on their dashboard. The API rejects a suspension without one.
  const isSuspended = Boolean(user.suspendedAt);

  const qc = useQueryClient();
  const { mutate: toggle, isPending } = useMutation({
    mutationFn: () =>
      adminService.toggleUserSuspension(user.id, !isSuspended, reason.trim() || undefined),
    onSuccess: () => {
      toast.success(isSuspended ? 'User reinstated.' : 'User suspended.');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      setConfirmOpen(false);
      setReason('');
      onToggle();
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Action failed. Please try again.');
    },
  });

  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

  return (
    <motion.div layout className="rounded-xl hover:bg-base-elevated transition-colors group">
    <div className="flex items-center gap-3 p-3">
      <Avatar
        firstName={user.firstName}
        lastName={user.lastName}
        src={user.avatar ?? undefined}
        size="sm"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-text-primary truncate">
            {user.firstName} {user.lastName}
          </p>
          <RoleBadge role={user.role} />
          {isSuspended && (
            <span
              title={user.suspensionReason ?? undefined}
              className="text-2xs font-semibold text-brand-danger bg-brand-danger/10 border border-brand-danger/20 px-1.5 py-0.5 rounded-full"
            >
              Suspended
            </span>
          )}
          {!user.isActive && (
            <span className="text-2xs font-semibold text-text-muted bg-base-subtle border border-border-subtle px-1.5 py-0.5 rounded-full">
              Deactivated
            </span>
          )}
          {user.role === 'TUTOR' && user.tutorProfile?.isVerified && (
            <span className="text-2xs font-semibold text-brand-success bg-brand-success/10 border border-brand-success/20 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <ShieldCheck size={9} /> Verified
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-text-muted flex items-center gap-1 truncate">
            <Mail size={10} />{user.email}
          </span>
          <span className="text-xs text-text-muted flex items-center gap-1 shrink-0">
            <Calendar size={10} />{formatDate(user.createdAt)}
          </span>
        </div>
      </div>

      {/* Suspend / reinstate — never offered for admin accounts here */}
      {!isAdmin && (
        <div className="shrink-0">
          {!confirmOpen ? (
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className={cn(
                'flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border opacity-0 group-hover:opacity-100 transition-all',
                !isSuspended
                  ? 'text-brand-danger bg-brand-danger/10 border-brand-danger/20 hover:bg-brand-danger/20'
                  : 'text-brand-success bg-brand-success/10 border-brand-success/20 hover:bg-brand-success/20'
              )}
            >
              {!isSuspended
                ? <><ShieldOff size={11} /> Suspend</>
                : <><UserCheck size={11} /> Reinstate</>}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setConfirmOpen(false); setReason(''); }}
                className="text-xs text-text-muted hover:text-text-secondary px-2 py-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => toggle()}
                disabled={isPending || (!isSuspended && !reason.trim())}
                className={cn(
                  'text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors',
                  !isSuspended
                    ? 'text-brand-danger bg-brand-danger/20 border-brand-danger/30 hover:bg-brand-danger/30'
                    : 'text-brand-success bg-brand-success/20 border-brand-success/30 hover:bg-brand-success/30',
                  (isPending || (!isSuspended && !reason.trim())) && 'opacity-40 cursor-not-allowed'
                )}
              >
                {isPending ? '…' : 'Confirm'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>

    {/* The reason is shown to the user on their dashboard, so it is mandatory
        and worth writing carefully — hence a real field, not a prompt(). */}
    {confirmOpen && !isSuspended && (
      <div className="px-3 pb-3 -mt-1">
        <textarea
          autoFocus
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why is this account being suspended? The user sees this verbatim."
          className="input-base resize-none text-xs"
        />
      </div>
    )}

    {isSuspended && user.suspensionReason && (
      <p className="px-3 pb-3 -mt-1 text-xs text-text-muted">
        <span className="text-brand-danger font-medium">Reason: </span>
        {user.suspensionReason}
      </p>
    )}
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [roleFilter, setRoleFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSearchChange = useCallback((val: string) => {
    setSearch(val);
    clearTimeout((window as any)._searchTimeout);
    (window as any)._searchTimeout = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 400);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', { role: roleFilter, search: debouncedSearch, page, refreshKey }],
    queryFn: () =>
      adminService.getUsers({
        role: roleFilter === 'All' ? undefined : roleFilter,
        search: debouncedSearch || undefined,
        page,
        limit: 20,
      }),
    staleTime: 30 * 1000,
  });

  const users = data?.users ?? [];
  const pagination = data?.pagination;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">User Management</h1>
        <p className="text-sm text-text-muted mt-1">
          Search users, filter by role, and manage account status.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search name or email…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-base-elevated border border-white/[0.08] focus:border-accent/40 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors"
          />
        </div>

        {/* Role filter */}
        <div className="relative">
          <select
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            className="appearance-none pl-4 pr-8 py-2.5 rounded-xl bg-base-elevated border border-white/[0.08] focus:border-accent/40 text-sm text-text-primary outline-none transition-colors cursor-pointer"
          >
            {ROLE_FILTERS.map(r => <option key={r} value={r}>{r === 'All' ? 'All roles' : r}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        </div>
      </div>

      {/* Summary */}
      {pagination && (
        <p className="text-xs text-text-muted">
          Showing {users.length} of {pagination.total} users
        </p>
      )}

      {/* User list */}
      <div className="bg-base-surface border border-white/[0.06] rounded-2xl divide-y divide-white/[0.04] overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[0,1,2,3,4].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-base-elevated" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-40 bg-base-elevated rounded-full" />
                  <div className="h-2.5 w-56 bg-base-elevated rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <AlertCircle size={24} className="text-text-muted" />
            <p className="text-sm text-text-muted">No users match your filters.</p>
          </div>
        ) : (
          <div className="p-2">
            {users.map(user => (
              <UserRow
                key={user.id}
                user={user}
                onToggle={() => setRefreshKey(k => k + 1)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between text-sm text-text-muted">
          <span>Page {pagination.page} of {pagination.pages}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg bg-base-elevated border border-white/[0.06] text-text-secondary disabled:opacity-40 hover:text-text-primary transition-colors"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
              disabled={page >= pagination.pages}
              className="px-3 py-1.5 rounded-lg bg-base-elevated border border-white/[0.06] text-text-secondary disabled:opacity-40 hover:text-text-primary transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
