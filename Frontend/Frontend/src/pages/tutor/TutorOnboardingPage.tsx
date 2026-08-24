import { useState, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ChevronRight, ChevronLeft, Loader2, X, Plus } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { tutorService } from '@/features/tutor/tutorService';
import { subjectService } from '@/features/subjects/subjectService';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { queryKeys } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

// ─── Subject emoji map ────────────────────────────────────────────────────────
const SUBJECT_EMOJI: Record<string, string> = {
  mathematics: '📐', 'english language': '📝', physics: '⚛️',
  chemistry: '🧪', biology: '🔬', economics: '📊', government: '⚖️',
  literature: '📚', geography: '🗺️', history: '🏛️', accounting: '🧾',
  commerce: '🏪', 'further mathematics': '📏', 'agricultural science': '🌱',
  'computer science': '💻',
};

// ─── Reusable tag input ───────────────────────────────────────────────────────
function TagInput({
  label,
  placeholder,
  hint,
  tags,
  onAdd,
  onRemove,
}: {
  label: string;
  placeholder: string;
  hint?: string;
  tags: string[];
  onAdd: (val: string) => void;
  onRemove: (val: string) => void;
}) {
  const [draft, setDraft] = useState('');

  const commit = () => {
    const val = draft.trim();
    if (val && !tags.includes(val)) onAdd(val);
    setDraft('');
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit(); }
    if (e.key === 'Backspace' && !draft && tags.length) onRemove(tags[tags.length - 1]);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-1.5">{label}</label>
      {hint && <p className="text-xs text-text-muted mb-2">{hint}</p>}
      <div className="min-h-[52px] flex flex-wrap gap-2 p-3 rounded-xl bg-base-elevated border border-white/[0.08] focus-within:border-accent/40 transition-colors">
        {tags.map((t) => (
          <span key={t} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/20 text-xs text-accent font-medium">
            {t}
            <button type="button" onClick={() => onRemove(t)} className="hover:text-brand-danger transition-colors">
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          onBlur={commit}
          placeholder={tags.length === 0 ? placeholder : 'Add another…'}
          className="flex-1 min-w-32 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
        />
      </div>
      <p className="text-2xs text-text-muted mt-1.5 opacity-60">Press Enter or comma to add</p>
    </div>
  );
}

// ─── Step 1 — Professional Background ────────────────────────────────────────
function StepBackground({
  bio, setBio,
  experience, setExperience,
  rate, setRate,
}: {
  bio: string; setBio: (v: string) => void;
  experience: string; setExperience: (v: string) => void;
  rate: string; setRate: (v: string) => void;
}) {
  const remaining = Math.max(0, 50 - bio.length);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-display text-lg font-semibold text-text-primary mb-1">Tell students about yourself</h3>
        <p className="text-sm text-text-muted">This bio will appear on your public tutor profile</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          Bio <span className="text-text-muted font-normal">(min 50 characters)</span>
        </label>
        <textarea
          rows={5}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="I am a passionate educator with a strong background in… I specialize in helping students understand…"
          className="w-full px-4 py-3 rounded-xl bg-base-elevated border border-white/[0.08] focus:border-accent/40 text-sm text-text-primary placeholder:text-text-muted outline-none resize-none transition-colors"
        />
        {remaining > 0 && (
          <p className="text-xs text-text-muted mt-1">{remaining} more characters needed</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Years of experience</label>
          <input
            type="number"
            min="0"
            max="50"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            placeholder="e.g. 3"
            className="w-full px-4 py-3 rounded-xl bg-base-elevated border border-white/[0.08] focus:border-accent/40 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Hourly rate <span className="text-text-muted font-normal">(₦)</span>
          </label>
          <input
            type="number"
            min="0"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="e.g. 2500"
            className="w-full px-4 py-3 rounded-xl bg-base-elevated border border-white/[0.08] focus:border-accent/40 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Step 2 — Subjects & Specializations ─────────────────────────────────────
function StepSubjects({
  selectedSubjects, onToggleSubject,
  specializations, onAddSpec, onRemoveSpec,
}: {
  selectedSubjects: string[]; onToggleSubject: (id: string) => void;
  specializations: string[]; onAddSpec: (v: string) => void; onRemoveSpec: (v: string) => void;
}) {
  const { data: subjects, isLoading } = useQuery({
    queryKey: queryKeys.subjects.all(),
    queryFn: () => subjectService.getAll(),
    staleTime: 1000 * 60 * 10,
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-lg font-semibold text-text-primary mb-1">What do you teach?</h3>
        <p className="text-sm text-text-muted">Select every subject you're qualified to teach</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10 gap-2 text-text-muted">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Loading subjects…</span>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2.5">
          {(subjects ?? []).map((subject) => {
            const emoji = subject.icon ?? SUBJECT_EMOJI[subject.name.toLowerCase()] ?? '📖';
            const isSelected = selectedSubjects.includes(subject.id);
            return (
              <button
                key={subject.id}
                type="button"
                onClick={() => onToggleSubject(subject.id)}
                className={cn(
                  'relative p-3.5 rounded-xl border text-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
                  isSelected
                    ? 'border-accent/40 bg-accent/5 ring-1 ring-accent/20'
                    : 'border-border-subtle bg-base-elevated hover:border-accent/25'
                )}
              >
                <span className="text-2xl mb-1.5 block">{emoji}</span>
                <p className="text-xs font-medium text-text-primary leading-tight">{subject.name}</p>
                {isSelected && (
                  <CheckCircle size={12} className="absolute top-2 right-2 text-accent" />
                )}
              </button>
            );
          })}
        </div>
      )}

      <TagInput
        label="Specializations"
        placeholder="e.g. WAEC Mathematics, JAMB Physics…"
        hint="Specific exams or topics you specialize in — this helps students find you"
        tags={specializations}
        onAdd={onAddSpec}
        onRemove={onRemoveSpec}
      />
    </div>
  );
}

// ─── Step 3 — Qualifications ──────────────────────────────────────────────────
function StepQualifications({
  qualifications, onAdd, onRemove,
}: {
  qualifications: string[]; onAdd: (v: string) => void; onRemove: (v: string) => void;
}) {
  const EXAMPLES = [
    'B.Sc Mathematics, University of Lagos',
    'PGDE, University of Ibadan',
    'M.Sc Physics, Obafemi Awolowo University',
    'NCE, Federal College of Education',
    'WAEC Chief Examiner (retired)',
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-lg font-semibold text-text-primary mb-1">Your qualifications</h3>
        <p className="text-sm text-text-muted">Add your degrees, certifications, and teaching credentials</p>
      </div>

      <TagInput
        label="Qualifications"
        placeholder="e.g. B.Sc Mathematics, University of Lagos"
        tags={qualifications}
        onAdd={onAdd}
        onRemove={onRemove}
      />

      {qualifications.length === 0 && (
        <div>
          <p className="text-xs text-text-muted mb-2">Suggestions — click to add:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => onAdd(ex)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-base-elevated border border-white/[0.06] text-xs text-text-secondary hover:text-text-primary hover:border-accent/30 transition-all"
              >
                <Plus size={10} /> {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 rounded-xl bg-blue-400/10 border border-blue-400/20">
        <p className="text-xs text-blue-300 leading-relaxed">
          <strong>Note:</strong> Your profile will be reviewed by our team before going live.
          Providing accurate qualifications speeds up the approval process — typically within 48 hours.
        </p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
const STEPS = ['Background', 'Subjects', 'Qualifications'];

export default function TutorOnboardingPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  // Step 1
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');
  const [rate, setRate] = useState('');

  // Step 2
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);

  // Step 3
  const [qualifications, setQualifications] = useState<string[]>([]);

  const toggleSubject = (id: string) =>
    setSelectedSubjects((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  const canAdvance = () => {
    if (step === 0) return bio.length >= 50 && experience !== '' && rate !== '';
    if (step === 1) return selectedSubjects.length > 0 && specializations.length > 0;
    if (step === 2) return qualifications.length > 0;
    return false;
  };

  const { mutate: submit, isPending } = useMutation({
    mutationFn: () => tutorService.submitApplication({
      bio,
      qualifications,
      specializations,
      subjectIds: selectedSubjects,
      yearsOfExperience: Number(experience),
      hourlyRate: Number(rate),
    }),
    onSuccess: () => {
      setDone(true);
    },
    onError: () => {
      toast.error('Could not submit your application. Please try again.');
    },
  });

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else submit();
  };

  // ── Application submitted — show confirmation ──────────────────────────────
  if (done) {
    return (
      <div className="min-h-dvh bg-base flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md bg-base-surface border border-border-subtle rounded-2xl p-10 text-center space-y-5 shadow-card">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 20 }}
            className="w-16 h-16 rounded-2xl bg-brand-success/10 border border-brand-success/20 flex items-center justify-center mx-auto"
          >
            <CheckCircle size={30} className="text-brand-success" />
          </motion.div>

          <div>
            <h2 className="font-display text-xl font-bold text-text-primary">Application submitted!</h2>
            <p className="text-sm text-text-muted mt-2 leading-relaxed">
              Thanks, <strong className="text-text-secondary">{user?.firstName}</strong>. Your tutor application
              is now <strong className="text-text-secondary">under review</strong>.
              We typically respond within <strong className="text-text-secondary">48 hours</strong>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-blue-400/10 border border-blue-400/20 text-left">
            <p className="text-xs text-blue-300 leading-relaxed">
              While you wait, you can explore your dashboard. Teaching features will unlock once your profile is approved by our team.
            </p>
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={() => navigate('/tutor/dashboard', { replace: true })}
          >
            Go to my dashboard
          </Button>
        </div>
      </div>
    );
  }

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
        <div className="text-right">
          <p className="text-xs text-text-muted">Tutor profile setup</p>
          <p className="text-sm font-medium text-text-secondary">Step {step + 1} of {STEPS.length}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-base-subtle">
        <motion.div
          className="h-full bg-accent"
          animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl">

          {/* Step pills */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2 shrink-0">
                <div className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200',
                  i === step
                    ? 'bg-accent/10 border-accent/30 text-accent'
                    : i < step
                    ? 'bg-brand-success/10 border-brand-success/30 text-brand-success'
                    : 'bg-base-elevated border-border-subtle text-text-muted'
                )}>
                  {i < step ? <CheckCircle size={12} /> : <span>{i + 1}</span>}
                  {label}
                </div>
                {i < STEPS.length - 1 && <div className="w-6 h-px bg-border-subtle" />}
              </div>
            ))}
          </div>

          {/* Step card */}
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
                  <StepBackground
                    bio={bio} setBio={setBio}
                    experience={experience} setExperience={setExperience}
                    rate={rate} setRate={setRate}
                  />
                )}
                {step === 1 && (
                  <StepSubjects
                    selectedSubjects={selectedSubjects}
                    onToggleSubject={toggleSubject}
                    specializations={specializations}
                    onAddSpec={(v) => setSpecializations((p) => [...p, v])}
                    onRemoveSpec={(v) => setSpecializations((p) => p.filter((s) => s !== v))}
                  />
                )}
                {step === 2 && (
                  <StepQualifications
                    qualifications={qualifications}
                    onAdd={(v) => setQualifications((p) => [...p, v])}
                    onRemove={(v) => setQualifications((p) => p.filter((q) => q !== v))}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {!canAdvance() && step === 0 && bio.length < 50 && bio.length > 0 && (
              <p className="mt-3 text-xs text-text-muted">
                Bio needs {50 - bio.length} more characters.
              </p>
            )}
            {!canAdvance() && step === 1 && selectedSubjects.length === 0 && (
              <p className="mt-3 text-xs text-text-muted">Select at least one subject to continue.</p>
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
              loading={isPending}
              rightIcon={step < STEPS.length - 1 ? <ChevronRight size={16} /> : undefined}
            >
              {step < STEPS.length - 1 ? 'Continue' : 'Complete Setup 🚀'}
            </Button>
          </div>

          {/* Skip */}
          <p className="text-center mt-4">
            <button
              type="button"
              onClick={() => navigate('/tutor/dashboard', { replace: true })}
              className="text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              Skip for now — I'll complete my profile later
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
