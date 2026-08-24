import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Check, Trash2, Pencil, Plus, Loader2, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { authoringService, type AuthoredCard } from '@/features/authoring/authoringService';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

/**
 * Revision cards for one lesson, from the tutor's side.
 *
 * Claude drafts; the tutor approves. Drafts are visually separated and cannot
 * reach a student until approved, because an AI card with a wrong answer
 * teaches the mistake and then costs the student marks in the exam.
 */

function CardRow({
  card,
  onSave,
  onDelete,
  onApprove,
  busy,
}: {
  card: AuthoredCard;
  onSave: (front: string, back: string) => void;
  onDelete: () => void;
  onApprove: () => void;
  busy: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [front, setFront] = useState(card.front);
  const [back, setBack] = useState(card.back);

  const dirty = front !== card.front || back !== card.back;

  if (editing) {
    return (
      <div className="p-4 border-b border-border-subtle bg-base-elevated space-y-3">
        <Input
          label="Question"
          value={front}
          onChange={(e) => setFront(e.target.value)}
        />
        <Textarea
          label="Answer"
          rows={3}
          value={back}
          onChange={(e) => setBack(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            disabled={!front.trim() || !back.trim() || !dirty}
            onClick={() => {
              onSave(front.trim(), back.trim());
              setEditing(false);
            }}
          >
            Save
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setFront(card.front);
              setBack(card.back);
              setEditing(false);
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group flex items-start gap-3 p-4 border-b border-border-subtle last:border-0',
        !card.isVerified && 'bg-brand-xp/[0.04]'
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          {!card.isVerified && (
            <span className="inline-flex items-center gap-1 text-3xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-brand-xp/10 text-brand-xp border border-brand-xp/25">
              <Sparkles size={8} /> AI draft
            </span>
          )}
          {card.isVerified && card.aiGenerated && (
            <span className="text-3xs uppercase tracking-wider text-text-muted">
              AI · approved
            </span>
          )}
        </div>
        <p className="text-sm font-medium text-text-primary">{card.front}</p>
        <p className="text-sm text-text-muted mt-1 leading-relaxed">{card.back}</p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {!card.isVerified && (
          <button
            onClick={onApprove}
            disabled={busy}
            title="Approve — makes this visible to students"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-brand-success hover:bg-brand-success/10 transition-colors disabled:opacity-40"
          >
            <Check size={15} />
          </button>
        )}
        <button
          onClick={() => setEditing(true)}
          title="Edit"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-base-subtle transition-colors"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={onDelete}
          disabled={busy}
          title="Delete"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-brand-danger hover:bg-brand-danger/10 transition-colors disabled:opacity-40"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export function LessonFlashcardsPanel({ lessonId }: { lessonId: string }) {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');

  const key = ['lesson-flashcards', lessonId];
  const refresh = () => qc.invalidateQueries({ queryKey: key });

  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: () => authoringService.getLessonFlashcards(lessonId),
  });

  const fail = (e: unknown, fallback: string) => {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
    toast.error(msg ?? fallback);
  };

  const generate = useMutation({
    mutationFn: () => authoringService.generateFlashcards(lessonId),
    onSuccess: (r) => {
      refresh();
      toast.success(`${r.generated} drafts ready — review them below`);
    },
    onError: (e) => fail(e, 'Could not generate cards.'),
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof authoringService.updateFlashcard>[1] }) =>
      authoringService.updateFlashcard(id, patch),
    onSuccess: refresh,
    onError: (e) => fail(e, 'Could not save the card.'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => authoringService.deleteFlashcard(id),
    onSuccess: () => { refresh(); toast.success('Card deleted'); },
    onError: (e) => fail(e, 'Could not delete the card.'),
  });

  const add = useMutation({
    mutationFn: () => authoringService.addFlashcard(lessonId, newFront.trim(), newBack.trim()),
    onSuccess: () => {
      refresh();
      setNewFront('');
      setNewBack('');
      setAdding(false);
      toast.success('Card added');
    },
    onError: (e) => fail(e, 'Could not add the card.'),
  });

  const approveAll = useMutation({
    mutationFn: () => authoringService.verifyAllFlashcards(lessonId),
    onSuccess: (r) => { refresh(); toast.success(`${r.verified} cards approved`); },
    onError: (e) => fail(e, 'Could not approve the cards.'),
  });

  const cards = data?.cards ?? [];
  const pending = data?.pendingReview ?? 0;
  const live = cards.length - pending;
  const busy = update.isPending || remove.isPending || approveAll.isPending;

  return (
    <div className="border-t border-border-subtle bg-base-surface">
      {/* No title here — the toggle that opens this panel already names it. */}
      <div className="flex items-center gap-2 flex-wrap px-4 py-3 border-b border-border-subtle">
        <span className="text-2xs text-text-muted mr-1">
          {live} live
          {pending > 0 && (
            <span className="text-brand-xp font-semibold"> · {pending} awaiting review</span>
          )}
        </span>
        <Button
          size="sm"
          onClick={() => generate.mutate()}
          loading={generate.isPending}
          disabled={data ? !data.hasSourceContent : true}
        >
          <Sparkles size={13} />
          {cards.length > 0 ? 'Generate more' : 'Generate with AI'}
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setAdding((v) => !v)}>
          <Plus size={13} /> Add manually
        </Button>
        {pending > 0 && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => approveAll.mutate()}
            loading={approveAll.isPending}
          >
            <Check size={13} /> Approve all {pending}
          </Button>
        )}
      </div>

      {data && !data.hasSourceContent && (
        <div className="flex items-start gap-2.5 px-4 py-3 text-xs text-text-muted bg-base-elevated border-b border-border-subtle">
          <AlertTriangle size={14} className="text-brand-xp mt-0.5 shrink-0" />
          <p className="leading-relaxed">
            This lesson has too little written content for the AI to draft from. Add
            lesson notes in the field above — the AI reads those, not the video — or
            write cards by hand.
          </p>
        </div>
      )}

      {/* Manual add */}
      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border-subtle"
          >
            <div className="p-4 space-y-3 bg-base-elevated">
              <Input
                label="Question"
                placeholder="e.g. What does Newton's Second Law state?"
                value={newFront}
                onChange={(e) => setNewFront(e.target.value)}
              />
              <Textarea
                label="Answer"
                rows={2}
                placeholder="e.g. Force equals mass times acceleration (F = ma)."
                value={newBack}
                onChange={(e) => setNewBack(e.target.value)}
              />
              <Button
                size="sm"
                onClick={() => add.mutate()}
                loading={add.isPending}
                disabled={!newFront.trim() || !newBack.trim()}
              >
                Add card
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards */}
      {isLoading ? (
        <div className="flex items-center gap-2 px-4 py-8 text-sm text-text-muted">
          <Loader2 size={14} className="animate-spin" /> Loading cards…
        </div>
      ) : cards.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <p className="text-sm text-text-muted">No revision cards on this lesson yet.</p>
          <p className="text-xs text-text-muted mt-1">
            Generate a set from your lesson notes, then keep the good ones.
          </p>
        </div>
      ) : (
        <div>
          {cards.map((card) => (
            <CardRow
              key={card.id}
              card={card}
              busy={busy}
              onApprove={() => update.mutate({ id: card.id, patch: { isVerified: true } })}
              onSave={(front, back) => update.mutate({ id: card.id, patch: { front, back } })}
              onDelete={() => remove.mutate(card.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default LessonFlashcardsPanel;
