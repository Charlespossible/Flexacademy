import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BookOpen, Plus, Clock, AlertTriangle, CheckCircle2,
  FileText, ChevronRight, X,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { authoringService, type AuthoredCourse, type CourseStatus } from '@/features/authoring/authoringService';
import { subjectService } from '@/features/subjects/subjectService';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { SuspensionBanner } from '@/components/shared/SuspensionBanner';
import { cn, formatRelative } from '@/lib/utils';

const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXAM_READY'];

const STATUS_META: Record<CourseStatus, { label: string; cls: string; icon: React.ElementType }> = {
  DRAFT:          { label: 'Draft',          cls: 'bg-base-elevated text-text-muted border-border-subtle', icon: FileText },
  PENDING_REVIEW: { label: 'Under review',   cls: 'bg-brand-xp/10 text-brand-xp border-brand-xp/25',       icon: Clock },
  APPROVED:       { label: 'Published',      cls: 'bg-brand-success/10 text-brand-success border-brand-success/25', icon: CheckCircle2 },
  REJECTED:       { label: 'Changes needed', cls: 'bg-brand-danger/10 text-brand-danger border-brand-danger/25',    icon: AlertTriangle },
  ARCHIVED:       { label: 'Archived',       cls: 'bg-base-elevated text-text-muted border-border-subtle', icon: FileText },
};

function StatusPill({ status }: { status: CourseStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-semibold border shrink-0',
      m.cls
    )}>
      <m.icon size={11} />
      {m.label}
    </span>
  );
}

function formatDuration(secs: number) {
  if (!secs) return '—';
  const h = Math.floor(secs / 3600);
  const m = Math.round((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ─── New course modal ─────────────────────────────────────────────────────────
function NewCourseModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [difficulty, setDifficulty] = useState('INTERMEDIATE');
  const [description, setDescription] = useState('');

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => subjectService.getAll(),
    staleTime: 5 * 60_000,
  });

  const create = useMutation({
    mutationFn: () => authoringService.createCourse({ subjectId, title, description, difficulty }),
    onSuccess: (course) => {
      qc.invalidateQueries({ queryKey: ['my-courses'] });
      toast.success('Draft created');
      navigate(`/tutor/courses/${course.id}`);
    },
    onError: () => toast.error('Could not create the course.'),
  });

  const subjectOptions = (subjects ?? []).map((s) => ({ value: s.id, label: s.name }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-lg bg-base-surface border border-border-subtle rounded-2xl p-6"
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-display text-lg font-bold text-text-primary">New course</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Start a draft. Nothing is visible to students until it's approved.
            </p>
          </div>
          <button onClick={onClose} aria-label="Close"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-base-elevated transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="space-y-4">
          <Input
            label="Course title"
            placeholder="e.g. WAEC Quadratic Equations"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Select
            label="Subject"
            placeholder="Choose a subject…"
            options={subjectOptions}
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
          />
          <Select
            label="Difficulty"
            options={DIFFICULTIES.map((d) => ({ value: d, label: d.replace('_', ' ') }))}
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          />
          <Textarea
            label="Description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What will a student be able to do after this course?"
          />
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => create.mutate()}
            loading={create.isPending}
            disabled={!title.trim() || !subjectId}
          >
            Create draft
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Course card ──────────────────────────────────────────────────────────────
function CourseCard({ course }: { course: AuthoredCourse }) {
  return (
    <Link
      to={`/tutor/courses/${course.id}`}
      className="group block bg-base-surface border border-white/[0.06] rounded-2xl p-5 hover:border-border-active transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-display font-semibold text-text-primary leading-snug group-hover:text-accent transition-colors min-w-0">
          {course.title}
        </h3>
        <StatusPill status={course.status} />
      </div>

      {course.description && (
        <p className="text-sm text-text-muted leading-relaxed line-clamp-2 mb-3">
          {course.description}
        </p>
      )}

      {/* Rejection feedback is the most important thing on the card */}
      {course.status === 'REJECTED' && course.reviewNote && (
        <div className="flex items-start gap-2 mb-3 p-2.5 rounded-xl bg-brand-danger/8 border border-brand-danger/20">
          <AlertTriangle size={13} className="text-brand-danger shrink-0 mt-0.5" />
          <p className="text-xs text-brand-danger/90 leading-relaxed">{course.reviewNote}</p>
        </div>
      )}

      <div className="flex items-center gap-3 text-xs text-text-muted">
        <span className="text-accent/70">{course.subject.name}</span>
        <span className="opacity-40">·</span>
        <span>{course.totalLessons} lesson{course.totalLessons === 1 ? '' : 's'}</span>
        <span className="opacity-40">·</span>
        <span>{formatDuration(course.totalDuration)}</span>
        <span className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          Edit <ChevronRight size={12} />
        </span>
      </div>

      <p className="text-2xs text-text-muted mt-2 opacity-60">
        Updated {formatRelative(course.updatedAt)}
      </p>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MyCoursesPage() {
  const [showNew, setShowNew] = useState(false);

  const { data: courses, isLoading } = useQuery({
    queryKey: ['my-courses'],
    queryFn: authoringService.listCourses,
  });

  const all = courses ?? [];
  const needsAttention = all.filter((c) => c.status === 'REJECTED');
  const rest = all.filter((c) => c.status !== 'REJECTED');

  return (
    <div className="min-h-dvh bg-base">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        <SuspensionBanner />

      {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-2xl font-bold text-text-primary">My Courses</h1>
            <p className="text-sm text-text-muted mt-1">
              Create lessons for your students. Every course is reviewed before it goes live.
            </p>
          </div>
          <Button onClick={() => setShowNew(true)}>
            <Plus size={15} />
            New course
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-36 rounded-2xl bg-base-elevated animate-pulse" />
            ))}
          </div>
        ) : all.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center bg-base-surface border border-white/[0.06] rounded-2xl">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              <BookOpen size={24} className="text-accent" />
            </div>
            <div>
              <p className="font-display font-semibold text-text-primary">No courses yet</p>
              <p className="text-sm text-text-muted mt-1 max-w-sm">
                Start with one topic you teach well. You can add lessons, then submit
                the course for review when it's ready.
              </p>
            </div>
            <Button onClick={() => setShowNew(true)}>
              <Plus size={15} />
              Create your first course
            </Button>
          </div>
        ) : (
          <>
            {needsAttention.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-brand-danger">
                  Needs your attention
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {needsAttention.map((c) => <CourseCard key={c.id} course={c} />)}
                </div>
              </section>
            )}

            {rest.length > 0 && (
              <section className="space-y-3">
                {needsAttention.length > 0 && (
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
                    All courses
                  </h2>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {rest.map((c) => <CourseCard key={c.id} course={c} />)}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {showNew && <NewCourseModal onClose={() => setShowNew(false)} />}
    </div>
  );
}
