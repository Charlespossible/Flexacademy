import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, ChevronLeft, ChevronRight, CheckCircle2,
  AlertTriangle, Flag, BarChart3, Target, ArrowLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { examSimulationService } from '@/features/examSimulation/examSimulationService';
import { ConfirmModal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import type { ExamCategory, Question } from '@/types';
import { EXAM_DISPLAY } from '@/types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SimQuestion extends Pick<Question, 'id' | 'body' | 'questionType' | 'marks' | 'imageUrl'> {
  options?: Array<{ id: string; text: string }>;
}

// ─── Start Screen ─────────────────────────────────────────────────────────────

const EXAM_CONFIGS: { category: ExamCategory; timeMin: number; questionRange: string }[] = [
  { category: 'WAEC',   timeMin: 180, questionRange: '50–60' },
  { category: 'JAMB',   timeMin: 120, questionRange: '100' },
  { category: 'NECO',   timeMin: 180, questionRange: '50–60' },
  { category: 'GCE',    timeMin: 150, questionRange: '50' },
  { category: 'IGCSE',  timeMin: 90,  questionRange: '40' },
  { category: 'SAT',    timeMin: 70,  questionRange: '52' },
];

function StartScreen({ onStart }: { onStart: (cfg: { examCategory: ExamCategory; timeLimitMins: number; year?: number }) => void; isStarting: boolean }) {
  const [selected, setSelected] = useState<ExamCategory>('WAEC');
  const [year, setYear] = useState<string>('');
  const cfg = EXAM_CONFIGS.find(c => c.category === selected)!;
  const { mutate, isPending } = useMutation({
    mutationFn: ({ examCategory, timeLimitMins, year }: { examCategory: ExamCategory; timeLimitMins: number; year?: number }) =>
      examSimulationService.startSimulation({ examCategory, timeLimitMins, year }),
    onSuccess: () => onStart({ examCategory: selected, timeLimitMins: cfg.timeMin }),
    onError: () => toast.error('Could not start simulation. No questions available for this configuration.'),
  });

  return (
    <div className="min-h-dvh bg-base flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-base-surface border border-white/[0.06] rounded-2xl shadow-card overflow-hidden"
      >
        <div className="p-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Target size={18} className="text-accent" />
            </div>
            <div>
              <h1 className="font-display font-bold text-text-primary text-lg">Exam Simulation</h1>
              <p className="text-xs text-text-muted">Timed, exam-condition mock test</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Exam category */}
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2 block">
              Select Exam
            </label>
            <div className="grid grid-cols-3 gap-2">
              {EXAM_CONFIGS.map(({ category }) => (
                <button
                  key={category}
                  onClick={() => setSelected(category)}
                  className={cn(
                    'py-2.5 rounded-xl text-sm font-medium border transition-all',
                    selected === category
                      ? 'bg-accent text-base-elevated border-accent shadow-glow-sm'
                      : 'bg-base-elevated border-white/[0.06] text-text-secondary hover:text-text-primary hover:border-white/20'
                  )}
                >
                  {EXAM_DISPLAY[category]}
                </button>
              ))}
            </div>
          </div>

          {/* Optional year filter */}
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2 block">
              Year (optional)
            </label>
            <input
              type="number"
              placeholder="e.g. 2022"
              min={1990}
              max={new Date().getFullYear()}
              value={year}
              onChange={e => setYear(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-base-elevated border border-white/[0.06] text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>

          {/* Config summary */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-base-elevated border border-white/[0.04]">
            <div className="flex-1 text-center border-r border-white/[0.06]">
              <p className="text-xs text-text-muted">Questions</p>
              <p className="text-lg font-bold text-text-primary">{cfg.questionRange}</p>
            </div>
            <div className="flex-1 text-center border-r border-white/[0.06]">
              <p className="text-xs text-text-muted">Time</p>
              <p className="text-lg font-bold text-text-primary">{cfg.timeMin}min</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-xs text-text-muted">Pass mark</p>
              <p className="text-lg font-bold text-text-primary">50%</p>
            </div>
          </div>

          <p className="text-xs text-text-muted text-center">
            Once started, the timer cannot be paused. Submit before time expires.
          </p>

          <button
            onClick={() => mutate({ examCategory: selected, timeLimitMins: cfg.timeMin, year: year ? Number(year) : undefined })}
            disabled={isPending}
            className="w-full py-3 rounded-xl bg-accent text-base-elevated font-semibold text-sm hover:bg-accent/90 transition-colors disabled:opacity-60 shadow-glow-sm"
          >
            {isPending ? 'Starting…' : 'Start Exam'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Timer ────────────────────────────────────────────────────────────────────

function Timer({ secondsLeft, onExpire }: { secondsLeft: number; onExpire: () => void }) {
  const [secs, setSecs] = useState(secondsLeft);
  const expiredRef = useRef(false);

  useEffect(() => {
    setSecs(secondsLeft);
  }, [secondsLeft]);

  useEffect(() => {
    if (secs <= 0) {
      if (!expiredRef.current) {
        expiredRef.current = true;
        onExpire();
      }
      return;
    }
    const id = setTimeout(() => setSecs(s => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secs, onExpire]);

  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const label = h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  const isWarning = secs < 300;
  const isDanger  = secs < 60;

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-mono font-bold transition-colors',
      isDanger  ? 'text-red-400 bg-red-400/10 border-red-400/30 animate-pulse' :
      isWarning ? 'text-orange-400 bg-orange-400/10 border-orange-400/20' :
                  'text-text-secondary bg-base-elevated border-white/[0.06]'
    )}>
      <Clock size={14} />
      {label}
    </div>
  );
}

// ─── Exam Screen ──────────────────────────────────────────────────────────────

function ExamScreen({
  questions,
  secondsRemaining,
  onSubmit,
  isSubmitting,
}: {
  simulationId: string;
  questions: SimQuestion[];
  secondsRemaining: number;
  onSubmit: (answers: Array<{ questionId: string; selectedOption?: string }>) => void;
  isSubmitting: boolean;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState(0);
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [showGrid, setShowGrid] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const question = questions[current];
  const answered = Object.keys(answers).length;
  const progress = Math.round((answered / questions.length) * 100);

  const handleSelect = (optId: string) => {
    setAnswers(prev => ({ ...prev, [question.id]: optId }));
  };

  const toggleFlag = () => {
    setFlagged(prev => {
      const next = new Set(prev);
      if (next.has(question.id)) next.delete(question.id);
      else next.add(question.id);
      return next;
    });
  };

  /** Submits unconditionally. Used on timer expiry, where asking is not an option. */
  const submitNow = () => {
    setConfirmSubmit(false);
    const ans = questions.map(q => ({ questionId: q.id, selectedOption: answers[q.id] }));
    onSubmit(ans);
  };

  /** Student-initiated submit — checks for unanswered questions first. */
  const handleSubmit = () => {
    if (answered < questions.length) {
      setConfirmSubmit(true);
      return;
    }
    submitNow();
  };

  return (
    <div className="min-h-dvh bg-base flex flex-col">
      {/* Top bar */}
      <div className="sticky top-16 z-30 bg-base/80 backdrop-blur border-b border-white/[0.06] px-4 py-2">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-muted">Q {current + 1}/{questions.length}</span>
            <div className="w-32 h-1.5 bg-base-elevated rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-text-muted">{answered} answered</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Time up means time up — submit outright rather than prompting. */}
            <Timer secondsLeft={secondsRemaining} onExpire={submitNow} />
            <button
              onClick={() => setShowGrid(v => !v)}
              className="px-3 py-1.5 rounded-xl text-xs bg-base-elevated border border-white/[0.06] text-text-secondary hover:text-text-primary transition-colors"
            >
              Grid
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-xl text-xs bg-accent text-base-elevated font-semibold hover:bg-accent/90 transition-colors disabled:opacity-60"
            >
              {isSubmitting ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </div>
      </div>

      {/* Question grid overlay */}
      <AnimatePresence>
        {showGrid && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed inset-0 z-40 bg-black/60 flex items-start justify-center pt-20 px-4"
            onClick={() => setShowGrid(false)}
          >
            <motion.div
              className="bg-base-elevated border border-white/[0.08] rounded-2xl p-5 w-full max-w-sm shadow-card"
              onClick={e => e.stopPropagation()}
            >
              <p className="text-sm font-semibold text-text-primary mb-3">Question Navigator</p>
              <div className="grid grid-cols-8 gap-1.5">
                {questions.map((q, i) => (
                  <button
                    key={q.id}
                    onClick={() => { setCurrent(i); setShowGrid(false); }}
                    className={cn(
                      'w-8 h-8 rounded-lg text-xs font-medium transition-all',
                      i === current ? 'bg-accent text-base-elevated' :
                      answers[q.id] ? 'bg-brand-success/20 text-brand-success border border-brand-success/30' :
                      flagged.has(q.id) ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30' :
                      'bg-base-subtle text-text-muted hover:bg-base-surface'
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-brand-success/20 border border-brand-success/30" /> Answered</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-400/20 border border-yellow-400/30" /> Flagged</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question body */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18 }}
            className="bg-base-surface border border-white/[0.06] rounded-2xl overflow-hidden"
          >
            {/* Question header */}
            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-white/[0.06]">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-text-muted bg-base-elevated px-2 py-0.5 rounded border border-white/[0.06]">
                    Q{current + 1}
                  </span>
                  <span className="text-xs text-text-muted">{question.marks} mark{question.marks !== 1 ? 's' : ''}</span>
                </div>
                <p className="text-base text-text-primary leading-relaxed">{question.body}</p>
              </div>
              <button
                onClick={toggleFlag}
                className={cn(
                  'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border transition-all',
                  flagged.has(question.id)
                    ? 'bg-yellow-400/20 border-yellow-400/30 text-yellow-400'
                    : 'bg-base-elevated border-white/[0.06] text-text-muted hover:text-yellow-400'
                )}
                title="Flag for review"
              >
                <Flag size={14} />
              </button>
            </div>

            {/* Image */}
            {question.imageUrl && (
              <div className="px-6 py-4 border-b border-white/[0.06]">
                <img
                  src={question.imageUrl}
                  alt="Question illustration"
                  className="max-h-48 rounded-lg object-contain"
                />
              </div>
            )}

            {/* Options */}
            <div className="p-5 grid gap-3">
              {(question.options ?? []).map((opt) => {
                const selected = answers[question.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelect(opt.id)}
                    className={cn(
                      'w-full text-left flex items-center gap-4 p-4 rounded-xl border transition-all',
                      selected
                        ? 'bg-accent/10 border-accent/40 text-text-primary'
                        : 'bg-base-elevated border-white/[0.06] text-text-secondary hover:text-text-primary hover:border-white/20'
                    )}
                  >
                    <div className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                      selected ? 'border-accent bg-accent' : 'border-text-muted'
                    )}>
                      {selected && <div className="w-2 h-2 rounded-full bg-base-elevated" />}
                    </div>
                    <span className="text-sm leading-relaxed">{opt.text}</span>
                  </button>
                );
              })}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between px-5 pb-5">
              <button
                onClick={() => setCurrent(c => Math.max(0, c - 1))}
                disabled={current === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-text-secondary hover:text-text-primary hover:bg-base-elevated transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-white/[0.06]"
              >
                <ChevronLeft size={15} /> Previous
              </button>
              {current < questions.length - 1 ? (
                <button
                  onClick={() => setCurrent(c => c + 1)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-text-secondary hover:text-text-primary hover:bg-base-elevated transition-all border border-white/[0.06]"
                >
                  Next <ChevronRight size={15} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm bg-accent text-base-elevated font-semibold hover:bg-accent/90 transition-all disabled:opacity-60"
                >
                  <CheckCircle2 size={15} />
                  {isSubmitting ? 'Submitting…' : 'Submit Exam'}
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <ConfirmModal
        open={confirmSubmit}
        onClose={() => setConfirmSubmit(false)}
        onConfirm={submitNow}
        title="Submit with questions unanswered?"
        description={`You've answered ${answered} of ${questions.length}. The remaining ${questions.length - answered} will be marked wrong.`}
        confirmLabel="Submit exam"
        cancelLabel="Keep working"
        danger
        loading={isSubmitting}
      />
    </div>
  );
}

// ─── Results Screen ───────────────────────────────────────────────────────────

function ResultsScreen({ simulationId }: { simulationId: string }) {
  const navigate = useNavigate();

  const { data: results, isLoading } = useQuery({
    queryKey: ['simulation-results', simulationId],
    queryFn: () => examSimulationService.getResults(simulationId),
  });

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-base flex items-center justify-center">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-accent/10" />
          <div className="absolute inset-0 rounded-full border-t-2 border-accent animate-spin" />
        </div>
      </div>
    );
  }

  if (!results) return null;

  const { simulation, performance, details } = results;
  const passed = simulation.isPassed;

  return (
    <div className="min-h-dvh bg-base flex flex-col items-center justify-start py-12 px-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-base-surface border border-white/[0.06] rounded-2xl p-8 text-center"
        >
          <div className={cn(
            'w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center border-4',
            passed
              ? 'bg-brand-success/10 border-brand-success/30 text-brand-success'
              : 'bg-red-400/10 border-red-400/30 text-red-400'
          )}>
            {passed
              ? <CheckCircle2 size={32} />
              : <AlertTriangle size={32} />}
          </div>
          <h1 className="font-display text-3xl font-bold text-text-primary mb-2">
            {passed ? 'Passed!' : 'Not yet'}
          </h1>
          <p className="text-text-muted text-sm mb-6">{simulation.examCategory} Simulation</p>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-base-elevated rounded-xl p-4">
              <p className="text-2xl font-bold text-text-primary">{simulation.percentage}%</p>
              <p className="text-xs text-text-muted mt-1">Score</p>
            </div>
            <div className="bg-base-elevated rounded-xl p-4">
              <p className="text-2xl font-bold text-text-primary">{performance.correctAnswers}</p>
              <p className="text-xs text-text-muted mt-1">Correct</p>
            </div>
            <div className="bg-base-elevated rounded-xl p-4">
              <p className="text-2xl font-bold text-text-primary">{performance.wrongAnswers}</p>
              <p className="text-xs text-text-muted mt-1">Wrong</p>
            </div>
          </div>
        </motion.div>

        {/* AI pipeline note */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-violet-400/10 border border-violet-400/20">
          <BarChart3 size={16} className="text-violet-400 shrink-0" />
          <p className="text-sm text-violet-300">
            FlexBot has updated your topic mastery and is analyzing learning gaps in the background.
          </p>
        </div>

        {/* Wrong answers review */}
        {details.wrongAnswers.length > 0 && (
          <div className="bg-base-surface border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06]">
              <h2 className="font-display font-semibold text-text-primary">Review Wrong Answers</h2>
              <p className="text-xs text-text-muted mt-0.5">{details.wrongAnswers.length} questions to review</p>
            </div>
            <div className="divide-y divide-white/[0.04] max-h-96 overflow-y-auto">
              {details.wrongAnswers.slice(0, 10).map((a, i) => (
                <div key={a.questionId} className="px-6 py-4">
                  <p className="text-sm text-text-primary mb-2">
                    <span className="text-text-muted mr-2">{i + 1}.</span>
                    {a.questionBody}
                  </p>
                  <div className="flex flex-col gap-1 text-xs">
                    <span className="text-red-400">Your answer: {a.userAnswer ?? 'No answer'}</span>
                    <span className="text-brand-success">Correct: {a.correctAnswer}</span>
                    {a.explanation && (
                      <p className="text-text-muted mt-1 italic">{a.explanation}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/gaps')}
            className="flex-1 py-3 rounded-xl bg-base-surface border border-white/[0.06] text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            View Learning Gaps
          </button>
          <button
            onClick={() => navigate('/exam/simulate')}
            className="flex-1 py-3 rounded-xl bg-accent text-base-elevated text-sm font-semibold hover:bg-accent/90 transition-colors"
          >
            Take Another Exam
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page Controller ─────────────────────────────────────────────────────

type Stage = 'start' | 'exam' | 'results';

export default function ExamSimulationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qc = useQueryClient();

  const [stage, setStage] = useState<Stage>('start');
  const [simulationId, setSimulationId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<SimQuestion[]>([]);
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  const resumeId = searchParams.get('resume');

  // Resume an in-progress simulation
  const { data: resumed } = useQuery({
    queryKey: ['simulation', resumeId],
    queryFn: () => examSimulationService.getSimulation(resumeId!),
    enabled: !!resumeId && !simulationId,
    retry: false,
  });

  useEffect(() => {
    if (resumed && resumed.simulation.status === 'IN_PROGRESS') {
      setSimulationId(resumed.simulation.id);
      const snap = (resumed.simulation.questionSnapshot ?? []) as SimQuestion[];
      setQuestions(snap);
      setSecondsRemaining(resumed.secondsRemaining ?? 0);
      setStage('exam');
    }
  }, [resumed]);

  const { mutate: submitMutation, isPending: isSubmitting } = useMutation({
    mutationFn: (args: { id: string; answers: Array<{ questionId: string; selectedOption?: string }> }) =>
      examSimulationService.submitSimulation(args.id, args.answers),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-simulations'] });
      qc.invalidateQueries({ queryKey: ['my-gaps'] });
      setStage('results');
    },
    onError: () => toast.error('Submission failed. Please try again.'),
  });

  const { mutate: startMutation, isPending: isStarting } = useMutation({
    mutationFn: (cfg: { examCategory: ExamCategory; timeLimitMins: number; year?: number }) =>
      examSimulationService.startSimulation(cfg),
    onSuccess: (data) => {
      setSimulationId(data.simulation.id);
      setQuestions(data.questions as SimQuestion[]);
      setSecondsRemaining(data.simulation.timeLimitMins * 60);
      setStage('exam');
    },
    onError: () => toast.error('Could not start simulation. No questions available for this configuration.'),
  });

  const handleSubmit = (answers: Array<{ questionId: string; selectedOption?: string }>) => {
    if (!simulationId) return;
    submitMutation({ id: simulationId, answers });
  };

  return (
    <>
      {/* Back nav */}
      {stage === 'start' && (
        <div className="fixed top-4 left-4 z-20">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-text-muted hover:text-text-primary hover:bg-base-elevated border border-white/[0.06] transition-all"
          >
            <ArrowLeft size={14} /> Dashboard
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {stage === 'start' && (
          <motion.div key="start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <StartScreen
              onStart={(cfg) => startMutation(cfg)}
              isStarting={isStarting}
            />
          </motion.div>
        )}

        {stage === 'exam' && simulationId && questions.length > 0 && (
          <motion.div key="exam" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ExamScreen
              simulationId={simulationId}
              questions={questions}
              secondsRemaining={secondsRemaining}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </motion.div>
        )}

        {stage === 'results' && simulationId && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ResultsScreen simulationId={simulationId} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
