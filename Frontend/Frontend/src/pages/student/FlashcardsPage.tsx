import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Loader2, RotateCcw, ChevronRight, X, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { queryKeys } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Deck {
  id: string;
  title: string;
  description: string | null;
  totalCards: number;
  dueCards: number;
  newCards: number;
  masteredCards: number;
  createdAt: string;
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
  easeFactor: number;
  repetitions: number;
  nextReviewAt: string;
  deck: { id: string; title: string };
}

// ─── Review session ───────────────────────────────────────────────────────────
const QUALITY_BUTTONS = [
  { quality: 0, label: 'Again', color: 'bg-brand-danger/10 text-brand-danger border-brand-danger/30 hover:bg-brand-danger/20' },
  { quality: 1, label: 'Hard',  color: 'bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500/20' },
  { quality: 3, label: 'Good',  color: 'bg-accent/10 text-accent border-accent/30 hover:bg-accent/20' },
  { quality: 4, label: 'Easy',  color: 'bg-brand-success/10 text-brand-success border-brand-success/30 hover:bg-brand-success/20' },
];

function ReviewSession({
  cards,
  onDone,
}: {
  cards: Flashcard[];
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [finished, setFinished] = useState(false);

  const reviewMutation = useMutation({
    mutationFn: ({ cardId, quality }: { cardId: string; quality: number }) =>
      api.post(`/flashcards/${cardId}/review`, { quality }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.flashcards.due() });
      qc.invalidateQueries({ queryKey: queryKeys.flashcards.decks() });
    },
  });

  const handleQuality = async (quality: number) => {
    await reviewMutation.mutateAsync({ cardId: cards[index].id, quality });
    if (index + 1 >= cards.length) {
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
      setFlipped(false);
    }
  };

  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
        <div className="text-5xl">🎉</div>
        <h2 className="font-display text-xl font-bold text-text-primary">Session complete!</h2>
        <p className="text-text-muted text-sm">You reviewed {cards.length} card{cards.length !== 1 ? 's' : ''}.</p>
        <Button onClick={onDone}>Back to decks</Button>
      </div>
    );
  }

  const card = cards[index];

  return (
    <div className="max-w-xl mx-auto py-8 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-text-muted">
          {index + 1} / {cards.length}
        </p>
        <button onClick={onDone} className="text-text-muted hover:text-text-primary transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-base-subtle rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-300"
          style={{ width: `${((index) / cards.length) * 100}%` }}
        />
      </div>

      {/* Flashcard */}
      <motion.div
        key={card.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          'relative min-h-[220px] rounded-2xl border p-6 cursor-pointer select-none',
          'bg-base-surface border-border-subtle shadow-card',
          'flex flex-col items-center justify-center text-center gap-4'
        )}
        onClick={() => setFlipped((f) => !f)}
      >
        <p className="text-xs text-text-muted uppercase tracking-wide font-medium">
          {flipped ? 'Answer' : 'Question — tap to flip'}
        </p>
        <AnimatePresence mode="wait">
          <motion.p
            key={flipped ? 'back' : 'front'}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="text-lg font-medium text-text-primary leading-snug"
          >
            {flipped ? card.back : card.front}
          </motion.p>
        </AnimatePresence>
        <p className="text-2xs text-text-muted">{card.deck.title}</p>
      </motion.div>

      {/* Rating buttons (only shown after flip) */}
      {flipped && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-4 gap-2"
        >
          {QUALITY_BUTTONS.map(({ quality, label, color }) => (
            <button
              key={quality}
              onClick={() => handleQuality(quality)}
              disabled={reviewMutation.isPending}
              className={cn(
                'py-2.5 rounded-xl border text-sm font-semibold transition-all duration-150',
                color
              )}
            >
              {label}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
}

// ─── Create deck modal ────────────────────────────────────────────────────────
function CreateDeckModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const createMutation = useMutation({
    mutationFn: () => api.post('/flashcards/decks', { title: title.trim(), description: description.trim() || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.flashcards.decks() });
      toast.success('Deck created!');
      onClose();
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 8 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 8 }}
        className="bg-base-elevated border border-border-subtle rounded-2xl p-6 w-full max-w-md shadow-card"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-text-primary">New Deck</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-3">
          <Input
            label="Deck title *"
            placeholder="e.g. WAEC Chemistry"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            label="Description (optional)"
            placeholder="What's this deck for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => createMutation.mutate()}
            loading={createMutation.isPending}
            disabled={!title.trim()}
          >
            Create deck
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Deck card ────────────────────────────────────────────────────────────────
function DeckCard({
  deck,
  onReview,
  onDelete,
}: {
  deck: Deck;
  onReview: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-base-surface border border-border-subtle rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-display font-semibold text-text-primary truncate">{deck.title}</h3>
          {deck.description && (
            <p className="text-xs text-text-muted mt-0.5 truncate">{deck.description}</p>
          )}
        </div>
        <button
          onClick={onDelete}
          className="text-text-muted hover:text-brand-danger transition-colors shrink-0"
          title="Delete deck"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 text-center">
        {[
          { label: 'Total', value: deck.totalCards, color: 'text-text-primary' },
          { label: 'New', value: deck.newCards, color: 'text-accent' },
          { label: 'Due', value: deck.dueCards, color: deck.dueCards > 0 ? 'text-amber-500' : 'text-text-muted' },
          { label: 'Done', value: deck.masteredCards, color: 'text-brand-success' },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-2 rounded-lg bg-base-subtle">
            <p className={cn('font-display font-bold text-base', color)}>{value}</p>
            <p className="text-2xs text-text-muted">{label}</p>
          </div>
        ))}
      </div>

      <Button
        size="sm"
        variant={deck.dueCards > 0 ? 'primary' : 'secondary'}
        rightIcon={<ChevronRight size={14} />}
        onClick={onReview}
        disabled={deck.totalCards === 0}
        className="w-full"
      >
        {deck.dueCards > 0 ? `Review ${deck.dueCards} due` : 'No cards due'}
      </Button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function FlashcardsPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [reviewingDeckId, setReviewingDeckId] = useState<string | null>(null);

  const decksQuery = useQuery({
    queryKey: queryKeys.flashcards.decks(),
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: Deck[] }>('/flashcards/decks/me');
      return res.data.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const dueQuery = useQuery({
    queryKey: queryKeys.flashcards.due(reviewingDeckId ?? undefined),
    queryFn: async () => {
      const params = reviewingDeckId ? `?deckId=${reviewingDeckId}` : '';
      const res = await api.get<{ success: boolean; data: Flashcard[] }>(`/flashcards/due${params}`);
      return res.data.data;
    },
    enabled: reviewingDeckId !== null,
    staleTime: 0,
  });

  const deleteMutation = useMutation({
    mutationFn: (deckId: string) => api.delete(`/flashcards/decks/${deckId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.flashcards.decks() });
      toast.success('Deck deleted.');
    },
  });

  // Review mode
  if (reviewingDeckId !== null) {
    if (dueQuery.isLoading) {
      return (
        <div className="flex items-center justify-center min-h-[50vh] gap-2 text-text-muted">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Loading cards…</span>
        </div>
      );
    }
    const cards = dueQuery.data ?? [];
    if (cards.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-center">
          <Zap size={28} className="text-accent opacity-70" />
          <h2 className="font-display font-semibold text-text-primary">Nothing due!</h2>
          <p className="text-sm text-text-muted">All cards for this deck are up to date.</p>
          <Button variant="secondary" onClick={() => setReviewingDeckId(null)}>
            <RotateCcw size={14} className="mr-2" /> Back to decks
          </Button>
        </div>
      );
    }
    return <ReviewSession cards={cards} onDone={() => setReviewingDeckId(null)} />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Flashcards</h1>
          <p className="text-sm text-text-muted mt-1">Spaced-repetition learning using SM-2 algorithm.</p>
        </div>
        <Button leftIcon={<Plus size={14} />} onClick={() => setShowCreate(true)}>
          New deck
        </Button>
      </div>

      {/* Decks grid */}
      {decksQuery.isLoading ? (
        <div className="flex items-center gap-2 text-text-muted text-sm py-6">
          <Loader2 size={14} className="animate-spin" /> Loading decks…
        </div>
      ) : decksQuery.data && decksQuery.data.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {decksQuery.data.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              onReview={() => setReviewingDeckId(deck.id)}
              onDelete={() => deleteMutation.mutate(deck.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center py-16 gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Zap size={24} className="text-accent" />
          </div>
          <h2 className="font-display font-semibold text-text-primary">No decks yet</h2>
          <p className="text-sm text-text-muted max-w-xs">
            Create your first flashcard deck to start learning with spaced repetition.
          </p>
          <Button leftIcon={<Plus size={14} />} onClick={() => setShowCreate(true)}>
            Create your first deck
          </Button>
        </div>
      )}

      {/* Create deck modal */}
      <AnimatePresence>
        {showCreate && <CreateDeckModal onClose={() => setShowCreate(false)} />}
      </AnimatePresence>
    </div>
  );
}
