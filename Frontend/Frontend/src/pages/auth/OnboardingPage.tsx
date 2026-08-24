import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import api from '@/lib/axios';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { subjectService } from '@/features/subjects/subjectService';
import { queryKeys } from '@/lib/queryClient';
import { EXAM_DISPLAY, type ExamCategory } from '@/types';

// ─── Static data ──────────────────────────────────────────────────────────────
const TARGET_EXAMS: { key: ExamCategory; emoji: string; description: string }[] = [
  { key: 'WAEC', emoji: '📘', description: 'West African Examinations Council' },
  { key: 'JAMB', emoji: '🎯', description: 'Joint Admissions & Matriculation Board' },
  { key: 'NECO', emoji: '📗', description: 'National Examinations Council' },
  { key: 'GCE', emoji: '📕', description: 'General Certificate of Education' },
  { key: 'IGCSE', emoji: '🌍', description: 'International GCSE (Cambridge)' },
  { key: 'SAT', emoji: '🏆', description: 'Scholastic Assessment Test (US)' },
  { key: 'IELTS', emoji: '✈️', description: 'English proficiency (International)' },
  { key: 'COMMON_ENTRANCE', emoji: '🏫', description: 'Common Entrance Examination' },
];

const GOAL_OPTIONS = [
  { mins: 30, label: '30 min/day', desc: 'Light — great for maintenance' },
  { mins: 60, label: '1 hr/day', desc: 'Moderate — recommended baseline' },
  { mins: 90, label: '1.5 hrs/day', desc: 'Focused — exam in 3–6 months' },
  { mins: 120, label: '2 hrs/day', desc: 'Intensive — exam coming soon' },
  { mins: 180, label: '3 hrs/day', desc: 'Full prep — exam next month' },
  { mins: 240, label: '4 hrs/day', desc: 'Maximum — final push mode' },
];

// Subject emoji map
const SUBJECT_EMOJI: Record<string, string> = {
  mathematics: '📐',
  'english language': '📝',
  physics: '⚛️',
  chemistry: '🧪',
  biology: '🔬',
  economics: '📊',
  government: '⚖️',
  literature: '📚',
  geography: '🗺️',
  history: '🏛️',
  accounting: '🧾',
  commerce: '🏪',
  'further mathematics': '📏',
  'agricultural science': '🌱',
  'computer science': '💻',
};

// ─── Step components ──────────────────────────────────────────────────────────
function StepExams({
  selected,
  onToggle,
}: {
  selected: ExamCategory[];
  onToggle: (key: ExamCategory) => void;
}) {
  return (
    <div>
      <h3 className="font-display text-lg font-semibold text-text-primary mb-1.5">
        Which exams are you preparing for?
      </h3>
      <p className="text-sm text-text-muted mb-6">Select all that apply</p>
      <div className="grid grid-cols-2 gap-3">
        {TARGET_EXAMS.map(({ key, emoji, description }) => {
          const isSelected = selected.includes(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onToggle(key)}
              className={`
                relative p-4 rounded-xl border text-left transition-all duration-150
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60
                ${isSelected
                  ? 'border-accent/40 bg-accent/5 ring-1 ring-accent/20'
                  : 'border-border-subtle bg-base-elevated hover:border-border-subtle'
                }
              `}
            >
              <span className="text-2xl mb-2 block">{emoji}</span>
              <p className="text-sm font-semibold text-text-primary">{EXAM_DISPLAY[key]}</p>
              <p className="text-xs text-text-muted mt-0.5 leading-snug">{description}</p>
              {isSelected && (
                <CheckCircle
                  size={16}
                  className="absolute top-3 right-3 text-accent"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepGoal({
  selected,
  onSelect,
}: {
  selected: number;
  onSelect: (mins: number) => void;
}) {
  return (
    <div>
      <h3 className="font-display text-lg font-semibold text-text-primary mb-1.5">
        How much do you want to study daily?
      </h3>
      <p className="text-sm text-text-muted mb-6">
        Consistent daily practice beats marathon sessions
      </p>
      <div className="space-y-2.5">
        {GOAL_OPTIONS.map(({ mins, label, desc }) => {
          const isSelected = selected === mins;
          return (
            <button
              key={mins}
              type="button"
              onClick={() => onSelect(mins)}
              className={`
                w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-150
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60
                ${isSelected
                  ? 'border-accent/40 bg-accent/5 ring-1 ring-accent/20'
                  : 'border-border-subtle bg-base-elevated hover:border-border-subtle'
                }
              `}
            >
              {/* Visual bar */}
              <div className="w-24 h-2 bg-base-subtle rounded-full overflow-hidden shrink-0">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-300"
                  style={{ width: `${(mins / 240) * 100}%` }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary">{label}</p>
                <p className="text-xs text-text-muted">{desc}</p>
              </div>
              {isSelected && (
                <CheckCircle size={16} className="text-accent shrink-0" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepSubjects({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const { data: subjects, isLoading } = useQuery({
    queryKey: queryKeys.subjects.all(),
    queryFn: () => subjectService.getAll(),
    staleTime: 1000 * 60 * 10,
  });

  return (
    <div>
      <h3 className="font-display text-lg font-semibold text-text-primary mb-1.5">
        Pick your subjects
      </h3>
      <p className="text-sm text-text-muted mb-6">
        We&apos;ll build your personalised study path around these
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center py-10 gap-2 text-text-muted">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Loading subjects…</span>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2.5">
          {(subjects ?? []).map((subject) => {
            const emoji = subject.icon ?? SUBJECT_EMOJI[subject.name.toLowerCase()] ?? '📖';
            const isSelected = selected.includes(subject.id);
            return (
              <button
                key={subject.id}
                type="button"
                onClick={() => onToggle(subject.id)}
                className={`
                  relative p-3.5 rounded-xl border text-center transition-all duration-150
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60
                  ${isSelected
                    ? 'border-accent/40 bg-accent/5 ring-1 ring-accent/20'
                    : 'border-border-subtle bg-base-elevated hover:border-border-subtle'
                  }
                `}
              >
                <span className="text-2xl mb-1.5 block">{emoji}</span>
                <p className="text-xs font-medium text-text-primary leading-tight">{subject.name}</p>
                {isSelected && (
                  <CheckCircle
                    size={12}
                    className="absolute top-2 right-2 text-accent"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Onboarding Page ─────────────────────────────────────────────────────
const STEPS = ['Target Exams', 'Daily Goal', 'Your Subjects'];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [step, setStep] = useState(0);
  const [targetExams, setTargetExams] = useState<ExamCategory[]>([]);
  const [weeklyGoalMins, setWeeklyGoalMins] = useState(60);
  const [subjects, setSubjects] = useState<string[]>([]);

  const toggleExam = (key: ExamCategory) =>
    setTargetExams((prev) =>
      prev.includes(key) ? prev.filter((e) => e !== key) : [...prev, key]
    );

  const toggleSubject = (id: string) =>
    setSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );

  // Validation per step
  const canAdvance = () => {
    if (step === 0) return targetExams.length > 0;
    if (step === 1) return weeklyGoalMins > 0;
    if (step === 2) return subjects.length > 0;
    return false;
  };

  // Save onboarding — sends real subject IDs to the database
  const saveMutation = useMutation({
    mutationFn: async () => {
      await api.patch('/users/me', {
        weeklyGoalMins,
        targetExams,
        preferredSubjectIds: subjects,
      });
      const res = await api.get<{ success: boolean; data: { user: import('@/types').User } }>('/users/me');
      return res.data.data;
    },
    onSuccess: (data) => {
      setUser(data.user);
      toast.success(`Welcome to FlexAcademy, ${user?.firstName}! 🚀`);
      navigate('/dashboard', { replace: true });
    },
    onError: () => {
      toast.error('Failed to save your preferences. You can update them in settings.');
      navigate('/dashboard', { replace: true });
    },
  });

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      saveMutation.mutate();
    }
  };

  return (
    <div className="min-h-dvh bg-base flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between border-b border-border-subtle">
        <div className="inline-flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center">
            <span className="font-display font-bold text-accent text-sm">F</span>
          </div>
          <span className="font-display font-bold text-lg text-text-primary">
            Flex<span className="text-accent">Academy</span>
          </span>
        </div>
        <p className="text-sm text-text-muted">
          Step {step + 1} of {STEPS.length}
        </p>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-base-subtle">
        <motion.div
          className="h-full bg-accent"
          animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl">
          {/* Step pills */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2 shrink-0">
                <div
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border
                    transition-all duration-200
                    ${i === step
                      ? 'bg-accent/10 border-accent/30 text-accent'
                      : i < step
                      ? 'bg-brand-success/10 border-brand-success/30 text-brand-success'
                      : 'bg-base-elevated border-border-subtle text-text-muted'
                    }
                  `}
                >
                  {i < step ? <CheckCircle size={12} /> : <span>{i + 1}</span>}
                  {label}
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-6 h-px bg-border-subtle" />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          <div className="bg-base-surface border border-border-subtle rounded-2xl p-7 shadow-card">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                {step === 0 && (
                  <StepExams selected={targetExams} onToggle={toggleExam} />
                )}
                {step === 1 && (
                  <StepGoal selected={weeklyGoalMins} onSelect={setWeeklyGoalMins} />
                )}
                {step === 2 && (
                  <StepSubjects selected={subjects} onToggle={toggleSubject} />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Validation hint */}
            {!canAdvance() && (
              <p className="mt-4 text-xs text-text-muted">
                {step === 0 && 'Select at least one exam to continue.'}
                {step === 2 && 'Select at least one subject to continue.'}
              </p>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-5">
            <Button
              variant="ghost"
              size="md"
              leftIcon={<ChevronLeft size={16} />}
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
            >
              Back
            </Button>

            <Button
              size="lg"
              onClick={handleNext}
              disabled={!canAdvance()}
              loading={saveMutation.isPending}
              rightIcon={step < STEPS.length - 1 ? <ChevronRight size={16} /> : undefined}
            >
              {step < STEPS.length - 1 ? 'Continue' : "Let's go! 🚀"}
            </Button>
          </div>

          {/* Skip */}
          {step < STEPS.length - 1 && (
            <p className="text-center mt-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard', { replace: true })}
                className="text-xs text-text-muted hover:text-text-secondary transition-colors"
              >
                Skip for now — I&apos;ll set this up later
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
