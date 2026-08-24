import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, PlayCircle, FileText, Clock, Users,
  ShieldCheck, Star, Lock, BookOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { courseService, type SyllabusLesson } from '@/features/courses/courseService';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

function formatDuration(secs: number | null) {
  if (!secs) return null;
  const h = Math.floor(secs / 3600);
  const m = Math.round((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function lessonLength(secs: number | null) {
  if (!secs) return null;
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

function LessonRow({
  lesson,
  index,
  locked,
  courseId,
}: {
  lesson: SyllabusLesson;
  index: number;
  locked: boolean;
  courseId: string;
}) {
  const Icon = lesson.contentType === 'VIDEO' ? PlayCircle : FileText;

  const body = (
    <>
      <span className="w-6 text-xs text-text-muted tabular-nums shrink-0">{index + 1}</span>
      <Icon size={15} className={cn('shrink-0', locked ? 'text-text-muted' : 'text-accent')} />
      <span className={cn('text-sm truncate flex-1', locked ? 'text-text-muted' : 'text-text-primary')}>
        {lesson.title}
      </span>
      {lesson.isFree && !locked && (
        <span className="text-2xs text-accent shrink-0">Free</span>
      )}
      {lessonLength(lesson.duration) && (
        <span className="text-2xs text-text-muted shrink-0">
          {lessonLength(lesson.duration)}
        </span>
      )}
      {locked && <Lock size={12} className="text-text-muted shrink-0" />}
    </>
  );

  const cls =
    'flex items-center gap-3 px-4 py-3 border-b border-border-subtle last:border-0 transition-colors';

  return locked ? (
    <div className={cn(cls, 'cursor-not-allowed')} title="Enrol to unlock this lesson">
      {body}
    </div>
  ) : (
    <Link to={`/courses/${courseId}/lessons/${lesson.id}`} className={cn(cls, 'hover:bg-base-elevated')}>
      {body}
    </Link>
  );
}

export default function CourseDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: () => courseService.getCourse(id),
    enabled: Boolean(id),
  });

  const enroll = useMutation({
    mutationFn: () => courseService.enroll(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['course', id] });
      qc.invalidateQueries({ queryKey: ['my-enrolled-courses'] });
      toast.success('You are enrolled');
      // Drop them straight into the first lesson — enrolling is a means, not an end.
      const first = course?.lessons?.[0];
      if (first) navigate(`/courses/${id}/lessons/${first.id}`);
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Could not enrol.');
    },
  });

  if (isLoading || !course) {
    return (
      <div className="min-h-dvh bg-base">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-4 animate-pulse">
          <div className="h-8 w-72 bg-base-elevated rounded-xl" />
          <div className="h-32 bg-base-elevated rounded-2xl" />
          <div className="h-64 bg-base-elevated rounded-2xl" />
        </div>
      </div>
    );
  }

  const tutor = course.tutorProfile;
  const duration = formatDuration(course.totalDuration);
  const nextLesson =
    course.lessons.find((l) => l.order >= 0) ?? course.lessons[0];

  return (
    <div className="min-h-dvh bg-base">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        <Link
          to="/courses"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={13} /> All courses
        </Link>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <section className="bg-base-surface border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
              {course.subject.icon} {course.subject.name}
            </span>
            <span className="text-2xs text-text-muted uppercase tracking-wider">
              {course.difficulty.replace('_', ' ')}
            </span>
          </div>

          <h1 className="font-display text-2xl font-bold text-text-primary leading-tight">
            {course.title}
          </h1>
          {course.description && (
            <p className="text-sm text-text-secondary mt-2 leading-relaxed">
              {course.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-text-muted mt-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <PlayCircle size={13} />{course.lessons.length} lessons
            </span>
            {duration && (
              <span className="flex items-center gap-1.5"><Clock size={13} />{duration}</span>
            )}
            {typeof course._count?.enrollments === 'number' && (
              <span className="flex items-center gap-1.5">
                <Users size={13} />{course._count.enrollments} enrolled
              </span>
            )}
          </div>

          {/* Enrolment state drives the primary action */}
          <div className="mt-5">
            {course.isEnrolled ? (
              <div className="space-y-3">
                <ProgressBar value={course.progress} showLabel label="Your progress" />
                {nextLesson && (
                  <Button asChild>
                    <Link to={`/courses/${course.id}/lessons/${nextLesson.id}`}>
                      <PlayCircle size={15} />
                      {course.progress > 0 ? 'Continue course' : 'Start first lesson'}
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <Button
                onClick={() => enroll.mutate()}
                loading={enroll.isPending}
                disabled={course.lessons.length === 0}
              >
                <BookOpen size={15} />
                Enrol — start learning
              </Button>
            )}
          </div>
        </section>

        {/* ── Tutor ──────────────────────────────────────────────────────── */}
        {tutor && (
          <section className="bg-base-surface border border-white/[0.06] rounded-2xl p-6">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-4">
              Your tutor
            </h2>
            <div className="flex items-start gap-4">
              <Avatar
                firstName={tutor.user.firstName}
                lastName={tutor.user.lastName}
                src={tutor.user.avatar ?? undefined}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <p className="font-display font-semibold text-text-primary flex items-center gap-1.5">
                  {tutor.user.firstName} {tutor.user.lastName}
                  {tutor.isVerified && (
                    <span className="inline-flex items-center gap-1 text-2xs font-semibold text-brand-success bg-brand-success/10 border border-brand-success/25 px-1.5 py-0.5 rounded-full">
                      <ShieldCheck size={9} /> Verified
                    </span>
                  )}
                </p>

                <div className="flex items-center gap-3 text-xs text-text-muted mt-1">
                  {Number(tutor.rating) > 0 && (
                    <span className="flex items-center gap-1">
                      <Star size={11} className="text-brand-xp fill-brand-xp" />
                      {Number(tutor.rating).toFixed(1)}
                      {tutor.totalReviews ? ` (${tutor.totalReviews} reviews)` : ''}
                    </span>
                  )}
                  {typeof tutor.yearsOfExperience === 'number' && tutor.yearsOfExperience > 0 && (
                    <span>{tutor.yearsOfExperience} yrs teaching</span>
                  )}
                </div>

                {tutor.bio && (
                  <p className="text-sm text-text-muted mt-2 leading-relaxed">{tutor.bio}</p>
                )}

                {tutor.specializations && tutor.specializations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {tutor.specializations.slice(0, 6).map((s) => (
                      <span
                        key={s}
                        className="text-2xs px-2 py-0.5 rounded-full bg-base-elevated border border-border-subtle text-text-muted"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── Syllabus ───────────────────────────────────────────────────── */}
        <section>
          <h2 className="font-display font-semibold text-text-primary mb-3">
            What you'll cover
          </h2>
          {course.lessons.length === 0 ? (
            <div className="text-center py-12 bg-base-surface border border-dashed border-border-subtle rounded-2xl">
              <p className="text-sm text-text-muted">This course has no lessons yet.</p>
            </div>
          ) : (
            <div className="bg-base-surface border border-white/[0.06] rounded-2xl overflow-hidden">
              {course.lessons.map((l, i) => (
                <LessonRow
                  key={l.id}
                  lesson={l}
                  index={i}
                  courseId={course.id}
                  // Before enrolling, only free-preview lessons are openable.
                  locked={!course.isEnrolled && !l.isFree}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Reviews ────────────────────────────────────────────────────── */}
        {course.reviews?.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-display font-semibold text-text-primary">What students say</h2>
            {course.reviews.map((r) => (
              <div key={r.id} className="bg-base-surface border border-white/[0.06] rounded-xl p-4">
                <div className="flex items-center gap-1 mb-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={11}
                      className={cn(
                        i < r.rating ? 'text-brand-xp fill-brand-xp' : 'text-text-muted/30'
                      )}
                    />
                  ))}
                </div>
                {r.comment && (
                  <p className="text-sm text-text-secondary leading-relaxed">{r.comment}</p>
                )}
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
