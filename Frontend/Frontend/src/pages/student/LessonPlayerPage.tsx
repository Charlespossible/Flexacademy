import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2, Circle,
  PlayCircle, FileText, Bookmark, List, X,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { courseService } from '@/features/courses/courseService';
import { MarkdownMessage } from '@/components/shared/MarkdownMessage';
import { TutorBadge } from '@/components/shared/TutorBadge';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ConfirmModal } from '@/components/ui/Modal';
import { cn, formatClock } from '@/lib/utils';

export default function LessonPlayerPage() {
  const { courseId = '', lessonId = '' } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showSyllabus, setShowSyllabus] = useState(false);

  // ── Watch-position tracking ─────────────────────────────────────────────
  // A heartbeat every 25s rather than on every timeupdate (which fires ~4×/s).
  // At scale that difference is the whole write budget: 4/s/student would put
  // thousands of upserts per second on lesson_progress for no added accuracy.
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSavedRef = useRef(0);
  const positionRef = useRef(0);
  const resumedRef = useRef(false);
  const [resumedFrom, setResumedFrom] = useState<number | null>(null);

  const SAVE_EVERY_SECS = 25;
  /** Below this the position is noise — skip the write entirely. */
  const MIN_DELTA_SECS = 10;

  const savePosition = useCallback(
    (secs: number, force = false) => {
      if (!lessonId) return;
      const rounded = Math.floor(secs);
      if (rounded <= 0) return;
      if (!force && Math.abs(rounded - lastSavedRef.current) < MIN_DELTA_SECS) return;
      lastSavedRef.current = rounded;
      void courseService.saveProgress(lessonId, rounded).catch(() => {
        // Losing one heartbeat is harmless; the next one carries the position.
      });
    },
    [lessonId]
  );

  const { data: course } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => courseService.getCourse(courseId),
    enabled: Boolean(courseId),
  });

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => courseService.getLesson(lessonId),
    enabled: Boolean(lessonId),
  });

  const complete = useMutation({
    mutationFn: () => courseService.completeLesson(lessonId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lesson', lessonId] });
      qc.invalidateQueries({ queryKey: ['course', courseId] });
      qc.invalidateQueries({ queryKey: ['my-enrolled-courses'] });
      toast.success('Lesson complete');
    },
    onError: () => toast.error('Could not save your progress.'),
  });

  const bookmark = useMutation({
    mutationFn: () => courseService.toggleBookmark(lessonId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lesson', lessonId] }),
  });

  // Scroll to top when moving between lessons, or you land mid-page.
  useEffect(() => { window.scrollTo({ top: 0 }); }, [lessonId]);

  // Reset tracking whenever the lesson changes, so a position from the previous
  // lesson can never be written against the new one.
  useEffect(() => {
    lastSavedRef.current = 0;
    positionRef.current = 0;
    resumedRef.current = false;
    setResumedFrom(null);
  }, [lessonId]);

  // ── Soft nudge ──────────────────────────────────────────────────────────
  // Opening a lesson while a different one is genuinely part-watched offers a
  // way back to it. Deliberately not a block: a hard lock would strand students
  // on a broken lesson and would stop a tutor sending them to remedial content,
  // which is the journey the whole platform is built around.
  const { data: myCourses } = useQuery({
    queryKey: ['my-enrolled-courses'],
    queryFn: courseService.getMyCourses,
    staleTime: 60_000,
  });

  const [nudgeDismissed, setNudgeDismissed] = useState(false);

  const unfinished = (myCourses ?? [])
    .map((c) => ({ course: c, resume: c.resume }))
    .find(
      ({ course, resume }) =>
        resume &&
        resume.hasStarted &&
        resume.lessonId !== lessonId &&
        resume.watchedSecs > 30 &&
        !course.isCompleted
    );

  // Once per lesson visit, and never again after it is answered.
  const nudgeKey = `nudge:${lessonId}`;
  useEffect(() => {
    setNudgeDismissed(sessionStorage.getItem(nudgeKey) === '1');
  }, [nudgeKey]);

  const closeNudge = () => {
    sessionStorage.setItem(nudgeKey, '1');
    setNudgeDismissed(true);
  };

  const showNudge = Boolean(unfinished) && !nudgeDismissed;

  // Flush on unmount (navigating to the next lesson) and on tab close.
  useEffect(() => {
    const flush = () => {
      const secs = Math.floor(positionRef.current);
      if (secs > 0 && Math.abs(secs - lastSavedRef.current) >= 1) {
        courseService.flushProgressOnUnload(lessonId, secs);
      }
    };

    // 'pagehide' fires reliably on mobile Safari where 'beforeunload' does not.
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('beforeunload', flush);
      flush();
    };
  }, [lessonId]);

  const lessons = course?.lessons ?? [];
  const index = lessons.findIndex((l) => l.id === lessonId);
  const prev = index > 0 ? lessons[index - 1] : null;
  const next = index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : null;

  if (isLoading || !lesson) {
    return (
      <div className="min-h-dvh bg-base">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-4 animate-pulse">
          <div className="h-6 w-48 bg-base-elevated rounded-lg" />
          <div className="aspect-video bg-base-elevated rounded-2xl" />
          <div className="h-40 bg-base-elevated rounded-2xl" />
        </div>
      </div>
    );
  }

  const goNext = () => {
    if (!lesson.isCompleted) complete.mutate();
    if (next) navigate(`/courses/${courseId}/lessons/${next.id}`);
    else navigate(`/courses/${courseId}`);
  };

  return (
    <div className="min-h-dvh bg-base">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Breadcrumb */}
        <div className="flex items-center justify-between gap-3">
          <Link
            to={`/courses/${courseId}`}
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors min-w-0"
          >
            <ArrowLeft size={13} className="shrink-0" />
            <span className="truncate">{lesson.course.title}</span>
          </Link>

          <button
            onClick={() => setShowSyllabus(true)}
            className="lg:hidden flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary shrink-0"
          >
            <List size={13} /> Lessons
          </button>
        </div>

        {course && (
          <ProgressBar value={course.progress} size="xs" />
        )}

        {/* Title */}
        <div>
          <p className="text-2xs uppercase tracking-widest text-text-muted mb-1">
            Lesson {index >= 0 ? index + 1 : '—'} of {lessons.length}
          </p>
          <h1 className="font-display text-xl font-bold text-text-primary leading-tight">
            {lesson.title}
          </h1>
        </div>

        {/* ── Content ────────────────────────────────────────────────────── */}
        {lesson.contentType === 'VIDEO' && lesson.videoUrl ? (
          <>
          <div className="rounded-2xl overflow-hidden bg-black border border-white/[0.06]">
            <video
              key={lesson.id}
              ref={videoRef}
              src={lesson.videoUrl}
              controls
              playsInline
              className="w-full aspect-video"
              onLoadedMetadata={(e) => {
                if (resumedRef.current) return;
                resumedRef.current = true;

                const el = e.currentTarget;
                const saved = lesson.watchedSeconds ?? 0;

                // Don't "resume" a few seconds in, and don't drop someone at the
                // very end of a lesson they had all but finished — either way
                // they would just have to seek back themselves.
                //
                // The tail has to scale with length: a flat 15s window swallows
                // an entire short clip (on a 15s video every position past 0.5s
                // would count as "near the end" and resume would never fire).
                const tail = el.duration ? Math.min(15, el.duration * 0.1) : 0;
                const nearEnd = Boolean(el.duration) && saved > el.duration - tail;

                if (saved > 5 && !nearEnd && !lesson.isCompleted) {
                  el.currentTime = saved;
                  lastSavedRef.current = Math.floor(saved);
                  positionRef.current = saved;
                  setResumedFrom(saved);
                }
              }}
              onTimeUpdate={(e) => {
                const secs = e.currentTarget.currentTime;
                positionRef.current = secs;
                if (Math.floor(secs) - lastSavedRef.current >= SAVE_EVERY_SECS) {
                  savePosition(secs);
                }
              }}
              // Pausing is a strong signal they are stepping away — save now
              // rather than waiting out the rest of the interval.
              onPause={(e) => savePosition(e.currentTarget.currentTime, true)}
              // Marking complete on 'ended' means progress reflects actually
              // watching, not just opening the page.
              onEnded={() => { if (!lesson.isCompleted) complete.mutate(); }}
            />
          </div>

          {resumedFrom !== null && (
            <button
              onClick={() => {
                if (videoRef.current) videoRef.current.currentTime = 0;
                setResumedFrom(null);
              }}
              className="mt-2 text-xs text-text-muted hover:text-text-primary transition-colors"
            >
              Resumed from {formatClock(resumedFrom)} — start from the beginning instead
            </button>
          )}
          </>
        ) : lesson.content ? (
          <div className="bg-base-surface border border-white/[0.06] rounded-2xl p-6">
            <MarkdownMessage content={lesson.content} />
          </div>
        ) : (
          <div className="bg-base-surface border border-dashed border-border-subtle rounded-2xl p-10 text-center">
            <FileText size={20} className="text-text-muted mx-auto mb-2 opacity-50" />
            <p className="text-sm text-text-muted">This lesson has no content yet.</p>
          </div>
        )}

        {/* ── Actions ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => bookmark.mutate()}
              className={cn(
                'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors',
                lesson.isBookmarked
                  ? 'text-accent bg-accent/10 border-accent/25'
                  : 'text-text-muted bg-base-surface border-border-subtle hover:text-text-primary'
              )}
            >
              <Bookmark size={12} className={cn(lesson.isBookmarked && 'fill-accent')} />
              {lesson.isBookmarked ? 'Saved' : 'Save'}
            </button>

            {lesson.isCompleted ? (
              <span className="flex items-center gap-1.5 text-xs text-brand-success px-3 py-1.5">
                <CheckCircle2 size={13} /> Completed
              </span>
            ) : (
              <button
                onClick={() => complete.mutate()}
                disabled={complete.isPending}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border-subtle text-text-muted hover:text-text-primary transition-colors"
              >
                <Circle size={12} /> Mark complete
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {prev && (
              <Button asChild variant="secondary" size="sm">
                <Link to={`/courses/${courseId}/lessons/${prev.id}`}>
                  <ChevronLeft size={14} /> Previous
                </Link>
              </Button>
            )}
            <Button size="sm" onClick={goNext}>
              {next ? <>Next lesson <ChevronRight size={14} /></> : <>Finish course <CheckCircle2 size={14} /></>}
            </Button>
          </div>
        </div>

        {/* ── Tutor ──────────────────────────────────────────────────────── */}
        {course?.tutorProfile && (
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-border-subtle">
            <TutorBadge tutor={course.tutorProfile} size="md" />
            <Link
              to={`/courses/${courseId}`}
              className="text-xs text-accent hover:underline shrink-0"
            >
              About this course
            </Link>
          </div>
        )}

        {/* ── Syllabus: inline on desktop, drawer on mobile ──────────────── */}
        <section className="hidden lg:block pt-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-2">
            Course lessons
          </h2>
          <div className="bg-base-surface border border-white/[0.06] rounded-2xl overflow-hidden">
            {lessons.map((l, i) => (
              <Link
                key={l.id}
                to={`/courses/${courseId}/lessons/${l.id}`}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 border-b border-border-subtle last:border-0 transition-colors',
                  l.id === lessonId ? 'bg-accent/10' : 'hover:bg-base-elevated'
                )}
              >
                <span className="w-5 text-xs text-text-muted tabular-nums shrink-0">{i + 1}</span>
                {l.contentType === 'VIDEO'
                  ? <PlayCircle size={13} className="text-accent shrink-0" />
                  : <FileText size={13} className="text-accent shrink-0" />}
                <span className={cn(
                  'text-sm truncate flex-1',
                  l.id === lessonId ? 'text-accent font-medium' : 'text-text-secondary'
                )}>
                  {l.title}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Mobile syllabus drawer */}
      {showSyllabus && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowSyllabus(false)} />
          <div className="absolute inset-y-0 right-0 w-80 max-w-[85vw] bg-base-surface border-l border-border-subtle overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle sticky top-0 bg-base-surface">
              <span className="text-xs font-semibold uppercase tracking-widest text-text-muted">
                Lessons
              </span>
              <button onClick={() => setShowSyllabus(false)} aria-label="Close"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary">
                <X size={15} />
              </button>
            </div>
            {lessons.map((l, i) => (
              <Link
                key={l.id}
                to={`/courses/${courseId}/lessons/${l.id}`}
                onClick={() => setShowSyllabus(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 border-b border-border-subtle',
                  l.id === lessonId ? 'bg-accent/10 text-accent' : 'text-text-secondary'
                )}
              >
                <span className="w-5 text-xs text-text-muted tabular-nums">{i + 1}</span>
                <span className="text-sm truncate">{l.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Soft nudge — offers the unfinished lesson, never blocks this one. */}
      {unfinished?.resume && (
        <ConfirmModal
          open={showNudge}
          onClose={closeNudge}
          onConfirm={() => {
            closeNudge();
            navigate(
              `/courses/${unfinished.course.id}/lessons/${unfinished.resume!.lessonId}`
            );
          }}
          title="Pick up where you left off?"
          description={`You're ${formatClock(unfinished.resume.watchedSecs)} into "${unfinished.resume.title}" in ${unfinished.course.title}.`}
          confirmLabel="Resume that lesson"
          cancelLabel="Start this one"
        />
      )}
    </div>
  );
}
