import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, XCircle, ChevronDown, ChevronUp, Clock,
  Star, Briefcase, BookOpen, Mail, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService, type AdminApplication } from '@/features/admin/adminService';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusFilter = 'AWAITING' | 'APPROVED' | 'REJECTED';

const TABS: { key: StatusFilter; label: string; apiStatus?: string }[] = [
  { key: 'AWAITING',  label: 'Awaiting Review' },
  { key: 'APPROVED',  label: 'Approved',        apiStatus: 'APPROVED'  },
  { key: 'REJECTED',  label: 'Rejected',         apiStatus: 'REJECTED'  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING:      'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    UNDER_REVIEW: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    APPROVED:     'text-brand-success bg-brand-success/10 border-brand-success/20',
    REJECTED:     'text-brand-danger bg-brand-danger/10 border-brand-danger/20',
  };
  const label: Record<string, string> = {
    PENDING: 'Pending', UNDER_REVIEW: 'Under Review',
    APPROVED: 'Approved', REJECTED: 'Rejected',
  };
  return (
    <span className={cn('text-2xs font-semibold px-2 py-0.5 rounded-full border', map[status] ?? '')}>
      {label[status] ?? status}
    </span>
  );
}

// ─── Application card ─────────────────────────────────────────────────────────

function ApplicationCard({ app }: { app: AdminApplication }) {
  const [expanded, setExpanded] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [reviewNote, setReviewNote] = useState('');

  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-applications'] });
    qc.invalidateQueries({ queryKey: ['admin-stats'] });
  };

  const { mutate: approve, isPending: isApproving } = useMutation({
    mutationFn: () => adminService.reviewApplication(app.tutorProfile.id, 'approve'),
    onSuccess: () => { toast.success('Tutor approved and verified!'); invalidate(); },
    onError: () => toast.error('Failed to approve. Please try again.'),
  });

  const { mutate: reject, isPending: isRejecting } = useMutation({
    mutationFn: () => adminService.reviewApplication(app.tutorProfile.id, 'reject', reviewNote),
    onSuccess: () => { toast.success('Application rejected.'); setShowRejectInput(false); invalidate(); },
    onError: () => toast.error('Failed to reject. Please try again.'),
  });

  const isAwaitingReview = app.status === 'PENDING' || app.status === 'UNDER_REVIEW';
  const { user: tutor } = app.tutorProfile;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-base-surface border border-white/[0.06] rounded-2xl overflow-hidden"
    >
      {/* Card header */}
      <div className="p-5 flex items-start gap-4">
        <Avatar
          firstName={tutor.firstName}
          lastName={tutor.lastName}
          src={tutor.avatar ?? undefined}
          size="lg"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="font-semibold text-text-primary">
                {tutor.firstName} {tutor.lastName}
              </p>
              <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                <Mail size={11} />
                {tutor.email}
              </p>
            </div>
            <StatusBadge status={app.status} />
          </div>

          {/* Quick stats row */}
          <div className="flex flex-wrap gap-3 mt-3">
            {app.tutorProfile.yearsOfExperience > 0 && (
              <span className="flex items-center gap-1 text-xs text-text-muted">
                <Briefcase size={11} />
                {app.tutorProfile.yearsOfExperience} yrs exp
              </span>
            )}
            {app.tutorProfile.hourlyRate && (
              <span className="flex items-center gap-1 text-xs text-text-muted">
                <Star size={11} />
                ₦{Number(app.tutorProfile.hourlyRate).toLocaleString()}/hr
              </span>
            )}
            {app.tutorProfile.subjects.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-text-muted">
                <BookOpen size={11} />
                {app.tutorProfile.subjects.length} subject{app.tutorProfile.subjects.length !== 1 ? 's' : ''}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-text-muted">
              <Clock size={11} />
              Submitted {formatDate(app.submittedAt)}
            </span>
          </div>

          {/* Subjects */}
          {app.tutorProfile.subjects.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {app.tutorProfile.subjects.map(s => (
                <span key={s.id} className="px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-2xs text-accent font-medium">
                  {s.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expandable details */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-5 py-2 border-t border-white/[0.04] text-xs text-text-muted hover:text-text-secondary hover:bg-base-elevated/50 transition-colors"
      >
        <span>{expanded ? 'Hide' : 'View'} full application</span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-white/[0.04]">

              {/* Bio */}
              {app.tutorProfile.bio && (
                <div>
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">Bio</p>
                  <p className="text-sm text-text-secondary leading-relaxed">{app.tutorProfile.bio}</p>
                </div>
              )}

              {/* Qualifications */}
              {app.tutorProfile.qualifications.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">Qualifications</p>
                  <div className="flex flex-wrap gap-1.5">
                    {app.tutorProfile.qualifications.map(q => (
                      <span key={q} className="px-2.5 py-1 rounded-lg bg-base-elevated border border-white/[0.06] text-xs text-text-secondary">
                        {q}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Specializations */}
              {app.tutorProfile.specializations.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">Specializations</p>
                  <div className="flex flex-wrap gap-1.5">
                    {app.tutorProfile.specializations.map(s => (
                      <span key={s} className="px-2.5 py-1 rounded-lg bg-violet-400/10 border border-violet-400/20 text-xs text-violet-300">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cover letter */}
              {app.coverLetter && (
                <div>
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">Cover Letter</p>
                  <p className="text-sm text-text-secondary leading-relaxed bg-base-elevated rounded-xl p-3 border border-white/[0.06]">
                    {app.coverLetter}
                  </p>
                </div>
              )}

              {/* Review note (if rejected) */}
              {app.reviewNote && (
                <div>
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">Review Note</p>
                  <p className="text-sm text-brand-danger/80 leading-relaxed bg-brand-danger/5 rounded-xl p-3 border border-brand-danger/20">
                    {app.reviewNote}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action area — only shown for awaiting-review applications */}
      {isAwaitingReview && (
        <div className="px-5 pb-5 border-t border-white/[0.04] pt-4 space-y-3">
          <AnimatePresence>
            {showRejectInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 mb-3">
                  <label className="text-xs font-medium text-text-secondary">
                    Rejection reason <span className="text-brand-danger">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={reviewNote}
                    onChange={e => setReviewNote(e.target.value)}
                    placeholder="Explain why this application is being rejected…"
                    className="w-full px-3 py-2.5 rounded-xl bg-base-elevated border border-brand-danger/30 focus:border-brand-danger/60 text-sm text-text-primary placeholder:text-text-muted outline-none resize-none transition-colors"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-3">
            {!showRejectInput ? (
              <>
                <Button
                  size="md"
                  variant="danger"
                  leftIcon={<XCircle size={14} />}
                  onClick={() => setShowRejectInput(true)}
                  className="flex-1"
                >
                  Reject
                </Button>
                <Button
                  size="md"
                  leftIcon={<ShieldCheck size={14} />}
                  onClick={() => approve()}
                  loading={isApproving}
                  className="flex-1 bg-brand-success hover:bg-brand-success/90"
                >
                  Approve
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => { setShowRejectInput(false); setReviewNote(''); }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  size="md"
                  variant="danger"
                  leftIcon={<XCircle size={14} />}
                  onClick={() => reject()}
                  loading={isRejecting}
                  disabled={!reviewNote.trim()}
                  className="flex-1"
                >
                  Confirm Rejection
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TutorApplicationsPage() {
  const [activeTab, setActiveTab] = useState<StatusFilter>('AWAITING');
  const [page, setPage] = useState(1);

  const apiStatus = TABS.find(t => t.key === activeTab)?.apiStatus;

  const { data, isLoading } = useQuery({
    queryKey: ['admin-applications', { status: apiStatus, page }],
    queryFn: () => adminService.getTutorApplications({
      status: activeTab === 'AWAITING' ? undefined : apiStatus,
      page,
      limit: 10,
    }),
    staleTime: 30 * 1000,
  });

  // For AWAITING tab, filter client-side to show PENDING + UNDER_REVIEW
  const applications = activeTab === 'AWAITING'
    ? (data?.applications ?? []).filter(a => a.status === 'PENDING' || a.status === 'UNDER_REVIEW')
    : (data?.applications ?? []);

  const pagination = data?.pagination;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">Tutor Applications</h1>
        <p className="text-sm text-text-muted mt-1">
          Review, approve or reject tutor applications submitted through the platform.
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1 bg-base-elevated rounded-xl p-1 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => { setActiveTab(tab.key); setPage(1); }}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150',
              activeTab === tab.key
                ? 'bg-base-surface text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[0,1,2].map(i => <div key={i} className="h-48 bg-base-elevated rounded-2xl" />)}
        </div>
      ) : applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center bg-base-surface border border-white/[0.06] rounded-2xl">
          <AlertCircle size={28} className="text-text-muted" />
          <div>
            <p className="font-semibold text-text-primary text-sm">No applications here</p>
            <p className="text-xs text-text-muted mt-1">
              {activeTab === 'AWAITING'
                ? 'All caught up — no pending applications.'
                : `No ${activeTab.toLowerCase()} applications yet.`}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map(app => (
            <ApplicationCard key={app.id} app={app} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between text-sm text-text-muted">
          <span>Page {pagination.page} of {pagination.pages} ({pagination.total} total)</span>
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
