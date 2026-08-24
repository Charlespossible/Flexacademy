import { useState, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Trash2, GripVertical, Video, FileText,
  Clock, CheckCircle2, AlertTriangle, Send, Undo2, Lock,
  UploadCloud, X, Loader2, PlayCircle, Layers, ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';

import {
  authoringService,
  type AuthoredCourse,
  type AuthoredLesson,
  type ContentType,
} from '@/features/authoring/authoringService';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { ConfirmModal } from '@/components/ui/Modal';
import { LessonFlashcardsPanel } from '@/components/authoring/LessonFlashcardsPanel';
import { cn } from '@/lib/utils';


const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXAM_READY'];

function formatDuration(secs: number | null) {
  if (!secs) return null;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** A course is only editable before review and after rejection. */
function isEditable(status: AuthoredCourse['status']) {
  return status === 'DRAFT' || status === 'REJECTED';
}

// ─── Add-lesson panel ─────────────────────────────────────────────────────────
function AddLessonPanel({
  courseId,
  onDone,
  onCancel,
}: {
  courseId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState<ContentType>('VIDEO');
  const [content, setContent] = useState('');
  const [isFree, setIsFree] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [publicId, setPublicId] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = useMutation({
    mutationFn: async (f: File) => {
      const sig = await authoringService.getUploadSignature('video');
      return authoringService.uploadToCloudinary(f, sig, setProgress);
    },
    onSuccess: (r) => {
      setPublicId(r.publicId);
      setProgress(null);
      toast.success('Video uploaded');
    },
    onError: (e: unknown) => {
      setProgress(null);
      const msg =
        (e as { response?: { status?: number } })?.response?.status === 503
          ? 'Video uploads are not configured yet. Add a TEXT lesson, or ask an admin to set up Cloudinary.'
          : (e as Error).message || 'Upload failed.';
      toast.error(msg, { duration: 6000 });
    },
  });

  const create = useMutation({
    mutationFn: () =>
      authoringService.createLesson(courseId, {
        title,
        contentType,
        content: content || undefined,
        videoPublicId: publicId ?? undefined,
        isFree,
      }),
    onSuccess: () => {
      toast.success('Lesson added');
      onDone();
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Could not add the lesson.');
    },
  });

  const needsVideo = contentType === 'VIDEO';
  const ready = title.trim() && (!needsVideo || publicId);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="bg-base-surface border border-accent/25 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-text-primary text-sm">New lesson</h3>
          <button onClick={onCancel} aria-label="Cancel"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-base-elevated transition-colors">
            <X size={15} />
          </button>
        </div>

        <Input
          label="Lesson title"
          placeholder="e.g. Factorising quadratics"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <Select
          label="Lesson type"
          options={[
            { value: 'VIDEO', label: 'Video' },
            { value: 'TEXT', label: 'Text / notes' },
          ]}
          value={contentType}
          onChange={(e) => setContentType(e.target.value as ContentType)}
        />

        {needsVideo ? (
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">
              Video file
            </label>

            {publicId ? (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-brand-success/8 border border-brand-success/25">
                <CheckCircle2 size={15} className="text-brand-success shrink-0" />
                <span className="text-sm text-text-secondary truncate flex-1">
                  {file?.name ?? 'Video ready'}
                </span>
                <button
                  onClick={() => { setPublicId(null); setFile(null); }}
                  className="text-xs text-text-muted hover:text-brand-danger transition-colors"
                >
                  Replace
                </button>
              </div>
            ) : progress !== null ? (
              <div className="p-3 rounded-xl bg-base-elevated border border-border-subtle">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 size={13} className="text-accent animate-spin" />
                  <span className="text-xs text-text-secondary">Uploading… {progress}%</span>
                </div>
                <div className="h-1 rounded-full bg-base overflow-hidden">
                  <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full flex flex-col items-center gap-2 p-6 rounded-xl border border-dashed border-border-subtle
                           text-text-muted hover:text-text-primary hover:border-border-active transition-colors"
              >
                <UploadCloud size={20} />
                <span className="text-sm">Choose a video file</span>
                <span className="text-2xs opacity-70">Uploads directly to Cloudinary</span>
              </button>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setFile(f); upload.mutate(f); }
              }}
            />
          </div>
        ) : (
          <Textarea
            label="Lesson content"
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write the lesson. Markdown is supported."
          />
        )}

        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={isFree}
            onChange={(e) => setIsFree(e.target.checked)}
            className="w-4 h-4 rounded border border-border-subtle bg-base-elevated checked:bg-accent checked:border-accent cursor-pointer"
          />
          <span className="text-sm text-text-secondary">
            Free preview — visible without a subscription
          </span>
        </label>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button onClick={() => create.mutate()} loading={create.isPending} disabled={!ready}>
            Add lesson
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Lesson row ───────────────────────────────────────────────────────────────
function LessonRow({
  lesson,
  index,
  editable,
  onDelete,
  onMove,
  isFirst,
  isLast,
}: {
  lesson: AuthoredLesson;
  index: number;
  editable: boolean;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [confirm, setConfirm] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const Icon = lesson.contentType === 'VIDEO' ? Video : FileText;

  return (
    <div className="group bg-base-surface border border-white/[0.06] rounded-xl overflow-hidden">
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Reorder */}
      {editable ? (
        <div className="flex flex-col -space-y-1 shrink-0">
          <button
            onClick={() => onMove(-1)}
            disabled={isFirst}
            aria-label="Move up"
            className="text-text-muted hover:text-accent disabled:opacity-20 disabled:cursor-not-allowed text-2xs leading-none py-0.5"
          >
            ▲
          </button>
          <button
            onClick={() => onMove(1)}
            disabled={isLast}
            aria-label="Move down"
            className="text-text-muted hover:text-accent disabled:opacity-20 disabled:cursor-not-allowed text-2xs leading-none py-0.5"
          >
            ▼
          </button>
        </div>
      ) : (
        <GripVertical size={13} className="text-text-muted/30 shrink-0" />
      )}

      <span className="w-5 text-xs text-text-muted tabular-nums shrink-0">{index + 1}</span>

      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
        <Icon size={14} className="text-accent" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary truncate">{lesson.title}</p>
        <div className="flex items-center gap-2 text-2xs text-text-muted mt-0.5">
          <span>{lesson.contentType === 'VIDEO' ? 'Video' : 'Text'}</span>
          {lesson.duration && (
            <><span className="opacity-40">·</span><span>{formatDuration(lesson.duration)}</span></>
          )}
          {lesson.isFree && (
            <><span className="opacity-40">·</span><span className="text-accent">Free preview</span></>
          )}
        </div>
      </div>

      {lesson.videoUrl && (
        <a
          href={lesson.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Preview video"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-accent transition-colors shrink-0"
        >
          <PlayCircle size={15} />
        </a>
      )}

      {editable && (
        <div className="shrink-0">
          {confirm ? (
            <div className="flex items-center gap-1">
              <button onClick={onDelete}
                className="px-2 py-0.5 rounded text-2xs font-semibold text-brand-danger hover:bg-brand-danger/10">
                Delete
              </button>
              <button onClick={() => setConfirm(false)}
                className="px-2 py-0.5 rounded text-2xs text-text-muted hover:text-text-primary">
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirm(true)}
              aria-label="Delete lesson"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-brand-danger hover:bg-brand-danger/10 transition-all"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      )}
    </div>

      {/* Revision cards live with the lesson they came from, so a tutor never
          has to think about decks as a separate thing to manage. */}
      <button
        onClick={() => setShowCards((v) => !v)}
        className={cn(
          'w-full flex items-center gap-2 px-4 py-2 text-2xs font-medium border-t border-border-subtle transition-colors',
          showCards
            ? 'text-accent bg-accent/5'
            : 'text-text-muted hover:text-text-primary hover:bg-base-elevated'
        )}
      >
        <Layers size={12} />
        Revision cards
        <ChevronDown
          size={12}
          className={cn('ml-auto transition-transform', showCards && 'rotate-180')}
        />
      </button>

      {showCards && (
        <LessonFlashcardsPanel lessonId={lesson.id} />
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CourseEditorPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: course, isLoading } = useQuery({
    queryKey: ['authored-course', id],
    queryFn: () => authoringService.getCourse(id),
    enabled: Boolean(id),
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['authored-course', id] });
    qc.invalidateQueries({ queryKey: ['my-courses'] });
  };

  const saveMeta = useMutation({
    mutationFn: (payload: { title?: string; description?: string; difficulty?: string }) =>
      authoringService.updateCourse(id, payload),
    onSuccess: () => { refresh(); toast.success('Saved'); },
    onError: () => toast.error('Could not save.'),
  });

  const submit = useMutation({
    mutationFn: () => authoringService.submitCourse(id),
    onSuccess: () => { refresh(); toast.success('Submitted for review'); },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Could not submit.');
    },
  });

  const withdraw = useMutation({
    mutationFn: () => authoringService.withdrawCourse(id),
    onSuccess: () => { refresh(); toast.success('Withdrawn — you can edit again'); },
    onError: () => toast.error('Could not withdraw.'),
  });

  const removeLesson = useMutation({
    mutationFn: (lessonId: string) => authoringService.deleteLesson(lessonId),
    onSuccess: () => { refresh(); toast.success('Lesson removed'); },
    onError: () => toast.error('Could not remove the lesson.'),
  });

  const reorder = useMutation({
    mutationFn: (lessonIds: string[]) => authoringService.reorderLessons(id, lessonIds),
    onSuccess: refresh,
    onError: () => { refresh(); toast.error('Could not reorder.'); },
  });

  const removeCourse = useMutation({
    mutationFn: () => authoringService.deleteCourse(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-courses'] });
      toast.success('Course deleted');
      navigate('/tutor/courses');
    },
    onError: () => toast.error('Could not delete.'),
  });

  if (isLoading || !course) {
    return (
      <div className="min-h-dvh bg-base">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-4 animate-pulse">
          <div className="h-8 w-64 bg-base-elevated rounded-xl" />
          <div className="h-40 bg-base-elevated rounded-2xl" />
          <div className="h-64 bg-base-elevated rounded-2xl" />
        </div>
      </div>
    );
  }

  const editable = isEditable(course.status);
  const lessons = course.lessons ?? [];

  const move = (index: number, dir: -1 | 1) => {
    const next = [...lessons];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    reorder.mutate(next.map((l) => l.id));
  };

  return (
    <div className="min-h-dvh bg-base">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        <Link to="/tutor/courses"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors">
          <ArrowLeft size={13} /> My courses
        </Link>

        {/* ── Status banner ────────────────────────────────────────────── */}
        {course.status === 'PENDING_REVIEW' && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-brand-xp/8 border border-brand-xp/25">
            <Clock size={16} className="text-brand-xp shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-brand-xp">Under review</p>
              <p className="text-xs text-text-muted mt-0.5">
                An admin is reviewing this course. Editing is locked until it's decided —
                withdraw it if you need to make changes.
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => withdraw.mutate()} loading={withdraw.isPending}>
              <Undo2 size={13} /> Withdraw
            </Button>
          </div>
        )}

        {course.status === 'REJECTED' && course.reviewNote && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-brand-danger/8 border border-brand-danger/25">
            <AlertTriangle size={16} className="text-brand-danger shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-brand-danger">Changes requested</p>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">{course.reviewNote}</p>
            </div>
          </div>
        )}

        {course.status === 'APPROVED' && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-brand-success/8 border border-brand-success/25">
            <CheckCircle2 size={16} className="text-brand-success shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-brand-success">Published</p>
              <p className="text-xs text-text-muted mt-0.5">
                Students can see this course. It's locked — create a new version to change it.
              </p>
            </div>
          </div>
        )}

        {/* ── Course details ───────────────────────────────────────────── */}
        <section className="bg-base-surface border border-white/[0.06] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display font-semibold text-text-primary">Course details</h2>
            {!editable && (
              <span className="inline-flex items-center gap-1.5 text-2xs text-text-muted">
                <Lock size={11} /> Locked
              </span>
            )}
          </div>

          <Input
            label="Title"
            defaultValue={course.title}
            disabled={!editable}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (editable && v && v !== course.title) saveMeta.mutate({ title: v });
            }}
          />
          <Textarea
            label="Description"
            rows={3}
            defaultValue={course.description ?? ''}
            disabled={!editable}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (editable && v !== (course.description ?? '')) saveMeta.mutate({ description: v });
            }}
          />
          <Select
            label="Difficulty"
            options={DIFFICULTIES.map((d) => ({ value: d, label: d.replace('_', ' ') }))}
            defaultValue={course.difficulty}
            disabled={!editable}
            onChange={(e) => editable && saveMeta.mutate({ difficulty: e.target.value })}
          />

          <p className="text-xs text-text-muted">
            {course.subject.name} · {course.totalLessons} lesson{course.totalLessons === 1 ? '' : 's'}
          </p>
        </section>

        {/* ── Lessons ──────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-text-primary">Lessons</h2>
            {editable && !adding && (
              <Button size="sm" variant="secondary" onClick={() => setAdding(true)}>
                <Plus size={13} /> Add lesson
              </Button>
            )}
          </div>

          <AnimatePresence>
            {adding && (
              <AddLessonPanel
                courseId={id}
                onDone={() => { setAdding(false); refresh(); }}
                onCancel={() => setAdding(false)}
              />
            )}
          </AnimatePresence>

          {lessons.length === 0 ? (
            <div className="text-center py-12 bg-base-surface border border-dashed border-border-subtle rounded-2xl">
              <FileText size={20} className="text-text-muted mx-auto mb-2 opacity-50" />
              <p className="text-sm text-text-secondary">No lessons yet</p>
              <p className="text-xs text-text-muted mt-1">
                A course needs at least one lesson before it can be submitted.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {lessons.map((l, i) => (
                <LessonRow
                  key={l.id}
                  lesson={l}
                  index={i}
                  editable={editable}
                  isFirst={i === 0}
                  isLast={i === lessons.length - 1}
                  onMove={(dir) => move(i, dir)}
                  onDelete={() => removeLesson.mutate(l.id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Actions ──────────────────────────────────────────────────── */}
        {editable && (
          <section className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-border-subtle">
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-xs text-text-muted hover:text-brand-danger transition-colors"
            >
              Delete course
            </button>

            <Button
              onClick={() => submit.mutate()}
              loading={submit.isPending}
              disabled={lessons.length === 0}
            >
              <Send size={14} />
              Submit for review
            </Button>
          </section>
        )}
      </div>

      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => removeCourse.mutate()}
        title="Delete this course?"
        description={
          lessons.length > 0
            ? `“${course.title}” and its ${lessons.length} lesson${lessons.length === 1 ? '' : 's'} will be permanently removed. This cannot be undone.`
            : `“${course.title}” will be permanently removed. This cannot be undone.`
        }
        confirmLabel="Delete course"
        danger
        loading={removeCourse.isPending}
      />
    </div>
  );
}
