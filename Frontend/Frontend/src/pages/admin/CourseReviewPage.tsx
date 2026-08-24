import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Video, FileText, CheckCircle2, XCircle,
  ChevronDown, PlayCircle, Inbox,
} from 'lucide-react';
import toast from 'react-hot-toast';

import {
  adminService,
  type AdminCourseSubmission,
  type AdminCourseStatus,
} from '@/features/admin/adminService';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { cn, formatRelative } from '@/lib/utils';

const TABS: { key: AdminCourseStatus; label: string }[] = [
  { key: 'PENDING_REVIEW', label: 'Awaiting review' },
  { key: 'APPROVED',       label: 'Published' },
  { key: 'REJECTED',       label: 'Rejected' },
];

function formatDuration(secs: number) {
  if (!secs) return '—';
  const h = Math.floor(secs / 3600);
  const m = Math.round((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function lessonDuration(secs: number | null) {
  if (!secs) return null;
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

// ─── One submission ───────────────────────────────────────────────────────────
function SubmissionCard({ course }: { course: AdminCourseSubmission }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState('');

  const review = useMutation({
    mutationFn: (v: { action: 'approve' | 'reject'; reviewNote?: string }) =>
      adminService.reviewCourse(course.id, v.action, v.reviewNote),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['admin-courses'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success(v.action === 'approve' ? 'Course published' : 'Sent back to the tutor');
      setRejecting(false);
      setNote('');
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Could not complete the review.');
    },
  });

  const author = course.tutorProfile?.user;
  const pending = course.status === 'PENDING_REVIEW';

  return (
    <div className="bg-base-surface border border-white/[0.06] rounded-2xl overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <h3 className="font-display font-semibold text-text-primary leading-snug">
              {course.title}
            </h3>
            {course.description && (
              <p className="text-sm text-text-muted mt-1 leading-relaxed line-clamp-2">
                {course.description}
              </p>
            )}
            <div className="flex items-center gap-2.5 text-xs text-text-muted mt-2 flex-wrap">
              <span className="text-accent/70">{course.subject.name}</span>
              <span className="opacity-40">·</span>
              <span>{course.difficulty.replace('_', ' ')}</span>
              <span className="opacity-40">·</span>
              <span>{course.totalLessons} lesson{course.totalLessons === 1 ? '' : 's'}</span>
              <span className="opacity-40">·</span>
              <span>{formatDuration(course.totalDuration)}</span>
              {course.submittedAt && (
                <>
                  <span className="opacity-40">·</span>
                  <span>submitted {formatRelative(course.submittedAt)}</span>
                </>
              )}
            </div>
          </div>

          {/* Author */}
          {author && (
            <div className="flex items-center gap-2.5 shrink-0">
              <Avatar
                firstName={author.firstName}
                lastName={author.lastName}
                src={author.avatar ?? undefined}
                size="sm"
              />
              <div className="min-w-0">
                <p className="text-xs font-medium text-text-primary truncate">
                  {author.firstName} {author.lastName}
                </p>
                <p className="text-2xs text-text-muted truncate">{author.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Reviewers must be able to see what they are approving */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 mt-3 text-xs text-text-muted hover:text-text-primary transition-colors"
        >
          <ChevronDown size={13} className={cn('transition-transform', open && 'rotate-180')} />
          {open ? 'Hide' : 'Review'} {course.lessons.length} lesson
          {course.lessons.length === 1 ? '' : 's'}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/[0.06]"
          >
            <div className="p-5 space-y-2 bg-base/40">
              {course.lessons.length === 0 ? (
                <p className="text-xs text-text-muted">This course has no lessons.</p>
              ) : (
                course.lessons.map((l, i) => {
                  const Icon = l.contentType === 'VIDEO' ? Video : FileText;
                  return (
                    <div
                      key={l.id}
                      className="flex items-center gap-3 bg-base-surface border border-white/[0.06] rounded-xl px-3 py-2.5"
                    >
                      <span className="w-5 text-xs text-text-muted tabular-nums shrink-0">
                        {i + 1}
                      </span>
                      <Icon size={13} className="text-accent shrink-0" />
                      <span className="text-sm text-text-primary truncate flex-1">{l.title}</span>
                      {lessonDuration(l.duration) && (
                        <span className="text-2xs text-text-muted shrink-0">
                          {lessonDuration(l.duration)}
                        </span>
                      )}
                      {l.isFree && (
                        <span className="text-2xs text-accent shrink-0">Free</span>
                      )}
                      {l.videoUrl && (
                        <a
                          href={l.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Watch lesson"
                          className="text-text-muted hover:text-accent transition-colors shrink-0"
                        >
                          <PlayCircle size={15} />
                        </a>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decision */}
      {pending && (
        <div className="border-t border-white/[0.06] p-4">
          {rejecting ? (
            <div className="space-y-2.5">
              <textarea
                autoFocus
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What needs to change? The tutor sees this verbatim."
                className="input-base resize-none"
              />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => { setRejecting(false); setNote(''); }}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={!note.trim()}
                  loading={review.isPending}
                  onClick={() => review.mutate({ action: 'reject', reviewNote: note })}
                >
                  Send back
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setRejecting(true)}>
                <XCircle size={14} /> Request changes
              </Button>
              <Button
                size="sm"
                loading={review.isPending}
                onClick={() => review.mutate({ action: 'approve' })}
              >
                <CheckCircle2 size={14} /> Approve &amp; publish
              </Button>
            </div>
          )}
        </div>
      )}

      {course.status === 'REJECTED' && course.reviewNote && (
        <div className="border-t border-white/[0.06] px-5 py-3 bg-brand-danger/5">
          <p className="text-xs text-text-muted">
            <span className="text-brand-danger font-medium">Feedback given: </span>
            {course.reviewNote}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CourseReviewPage() {
  const [tab, setTab] = useState<AdminCourseStatus>('PENDING_REVIEW');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-courses', tab],
    queryFn: () => adminService.getCourseSubmissions({ status: tab, limit: 50 }),
  });

  const courses = data?.data ?? [];

  return (
    <div className="min-h-dvh bg-base">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Course Review</h1>
          <p className="text-sm text-text-muted mt-1">
            Tutor-submitted content. Nothing reaches students until it's approved here.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto -mx-1 px-1 py-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                tab === t.key
                  ? 'bg-accent/10 text-accent border-accent/30'
                  : 'bg-base-surface text-text-muted border-border-subtle hover:text-text-primary'
              )}
            >
              {t.label}
              {/* Only the active tab's data is loaded, so a count is only
                  meaningful for the tab currently being viewed. */}
              {tab === t.key && courses.length > 0 && (
                <span className="ml-1.5 opacity-70">{courses.length}</span>
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-40 rounded-2xl bg-base-elevated animate-pulse" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center bg-base-surface border border-white/[0.06] rounded-2xl">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              {tab === 'PENDING_REVIEW' ? (
                <Inbox size={24} className="text-accent" />
              ) : (
                <BookOpen size={24} className="text-accent" />
              )}
            </div>
            <p className="font-display font-semibold text-text-primary">
              {tab === 'PENDING_REVIEW' ? 'Nothing awaiting review' : 'Nothing here yet'}
            </p>
            <p className="text-sm text-text-muted max-w-sm">
              {tab === 'PENDING_REVIEW'
                ? 'Submitted courses appear here for approval before students can see them.'
                : 'Courses will show up once they have been reviewed.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {courses.map((c) => <SubmissionCard key={c.id} course={c} />)}
          </div>
        )}
      </div>
    </div>
  );
}
