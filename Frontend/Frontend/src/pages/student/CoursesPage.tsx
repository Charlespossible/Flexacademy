import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { PlayCircle, Clock, Users, Search, GraduationCap } from 'lucide-react';

import { courseService, type CatalogueCourse } from '@/features/courses/courseService';
import { subjectService } from '@/features/subjects/subjectService';
import { TutorBadge } from '@/components/shared/TutorBadge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

function formatDuration(secs: number) {
  if (!secs) return null;
  const h = Math.floor(secs / 3600);
  const m = Math.round((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function CourseCard({ course, showProgress = false }: { course: CatalogueCourse; showProgress?: boolean }) {
  const duration = formatDuration(course.totalDuration);
  const lessons = course._count?.lessons ?? course.totalLessons;

  return (
    <Link
      to={`/courses/${course.id}`}
      className="group flex flex-col h-full bg-base-surface border border-white/[0.06] rounded-2xl overflow-hidden hover:border-border-active transition-colors"
    >
      {/* Cover. No image pipeline yet, so a subject-tinted gradient stands in
          rather than a broken <img>. */}
      <div
        className="relative h-28 shrink-0 flex items-center justify-center"
        style={{
          background:
            'linear-gradient(135deg, var(--accent-glow), transparent 65%), var(--bg-elevated)',
        }}
      >
        {course.thumbnail ? (
          <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-3xl select-none">{course.subject.icon ?? '📘'}</span>
        )}
        <span className="absolute bottom-2 left-3 text-2xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-base/70 backdrop-blur text-accent border border-accent/20">
          {course.subject.name}
        </span>
      </div>

      <div className="flex flex-col flex-1 p-4">
        <h3 className="font-display font-semibold text-text-primary leading-snug group-hover:text-accent transition-colors line-clamp-2">
          {course.title}
        </h3>
        {course.description && (
          <p className="text-xs text-text-muted mt-1.5 leading-relaxed line-clamp-2 flex-1">
            {course.description}
          </p>
        )}

        <div className="flex items-center gap-3 text-2xs text-text-muted mt-3">
          <span className="flex items-center gap-1">
            <PlayCircle size={11} />{lessons} lesson{lessons === 1 ? '' : 's'}
          </span>
          {duration && (
            <span className="flex items-center gap-1"><Clock size={11} />{duration}</span>
          )}
          {typeof course._count?.enrollments === 'number' && course._count.enrollments > 0 && (
            <span className="flex items-center gap-1"><Users size={11} />{course._count.enrollments}</span>
          )}
        </div>

        {showProgress && typeof course.progress === 'number' && (
          <div className="mt-3">
            <ProgressBar value={course.progress} />
            <p className="text-2xs text-text-muted mt-1">
              {Math.round(course.progress)}% complete
            </p>
          </div>
        )}

        {/* Who taught it */}
        <div className="mt-3 pt-3 border-t border-border-subtle">
          <TutorBadge tutor={course.tutorProfile} />
        </div>
      </div>
    </Link>
  );
}

function CardSkeleton() {
  return <div className="h-72 rounded-2xl bg-base-elevated animate-pulse" />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CoursesPage() {
  // The subject filter lives in the URL so it survives a refresh, can be
  // shared, and gives the retired /subjects/:slug routes somewhere to land.
  const [params, setParams] = useSearchParams();
  const subject = params.get('subject') ?? '';
  const setSubject = (slug: string) => {
    const next = new URLSearchParams(params);
    if (slug) next.set('subject', slug);
    else next.delete('subject');
    setParams(next, { replace: true });
  };

  const [search, setSearch] = useState('');

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => subjectService.getAll(),
    staleTime: 5 * 60_000,
  });

  const { data: enrolled, isLoading: loadingMine } = useQuery({
    queryKey: ['my-enrolled-courses'],
    queryFn: courseService.getMyCourses,
  });

  const { data: catalogue, isLoading } = useQuery({
    queryKey: ['courses', subject],
    queryFn: () => courseService.getCourses({ subject: subject || undefined, limit: 50 }),
  });

  const all = catalogue?.data ?? [];
  const mine = enrolled ?? [];
  const enrolledIds = new Set(mine.map((c) => c.id));

  // Client-side title/tutor search — the catalogue is small enough that a
  // round-trip per keystroke would be worse than filtering here.
  const q = search.trim().toLowerCase();
  const visible = all.filter((c) => {
    if (!q) return true;
    const tutor = c.tutorProfile
      ? `${c.tutorProfile.user.firstName} ${c.tutorProfile.user.lastName}`.toLowerCase()
      : '';
    return c.title.toLowerCase().includes(q) || tutor.includes(q);
  });

  const inProgress = mine.filter((c) => !c.isCompleted);

  return (
    <div className="min-h-dvh bg-base">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Courses</h1>
          <p className="text-sm text-text-muted mt-1">
            Video lessons from verified FlexAcademy tutors.
          </p>
        </div>

        {/* ── Continue learning ──────────────────────────────────────────── */}
        {loadingMine ? null : inProgress.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
              Continue learning
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {inProgress.slice(0, 3).map((c) => (
                <CourseCard key={c.id} course={c} showProgress />
              ))}
            </div>
          </section>
        )}

        {/* ── Filters ────────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search courses or tutors…"
                leftIcon={<Search size={15} />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto -mx-1 px-1 py-1">
            <button
              onClick={() => setSubject('')}
              className={cn(
                'shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                subject === ''
                  ? 'bg-accent/10 text-accent border-accent/30'
                  : 'bg-base-surface text-text-muted border-border-subtle hover:text-text-primary'
              )}
            >
              All subjects
            </button>
            {(subjects ?? []).map((s) => (
              <button
                key={s.id}
                onClick={() => setSubject(s.slug)}
                className={cn(
                  'shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                  subject === s.slug
                    ? 'bg-accent/10 text-accent border-accent/30'
                    : 'bg-base-surface text-text-muted border-border-subtle hover:text-text-primary'
                )}
              >
                {s.icon} {s.name}
              </button>
            ))}
          </div>
        </section>

        {/* ── Catalogue ──────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2, 3, 4, 5].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center bg-base-surface border border-white/[0.06] rounded-2xl">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              <GraduationCap size={24} className="text-accent" />
            </div>
            <p className="font-display font-semibold text-text-primary">
              {q || subject ? 'Nothing matches that' : 'No courses published yet'}
            </p>
            <p className="text-sm text-text-muted max-w-sm">
              {q || subject
                ? 'Try a different subject or search term.'
                : 'Tutors are building the first courses. Check back shortly.'}
            </p>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {visible.map((c) => (
              <CourseCard
                key={c.id}
                course={c}
                showProgress={enrolledIds.has(c.id)}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
