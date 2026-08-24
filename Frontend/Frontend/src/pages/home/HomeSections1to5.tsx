import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  ArrowRight, Play, Star, CheckCircle,
  Brain, Target, Zap, Trophy,
  Sparkles, UserCheck, TrendingUp,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// SHARED UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-64px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-accent/10 border border-accent/20 text-accent">
      <Sparkles size={10} />
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — HERO
// ─────────────────────────────────────────────────────────────────────────────

const EXAM_CHIPS = ['WAEC', 'JAMB', 'NECO', 'IELTS', 'SAT', 'IGCSE', '+4 more'];

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-grid opacity-[0.45] pointer-events-none" />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none opacity-[0.12]"
        style={{ background: 'radial-gradient(ellipse at center top, #6ee7b7 0%, transparent 68%)' }}
      />
      <div
        className="absolute -left-48 top-1/3 w-96 h-96 rounded-full opacity-[0.07] blur-3xl pointer-events-none"
        style={{ backgroundColor: '#6ee7b7' }}
      />
      <div
        className="absolute -right-32 bottom-1/4 w-72 h-72 rounded-full opacity-[0.05] blur-3xl pointer-events-none"
        style={{ backgroundColor: '#60a5fa' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 w-full grid md:grid-cols-2 gap-10 lg:gap-14 items-center">

        {/* ── LEFT ─────────────────────────────────────────────── */}
        <div>
          {/* Chip */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6 inline-flex"
          >
            <span className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-accent/10 border border-accent/25 text-accent">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              AI + Human tutors · Nigeria&apos;s hybrid learning platform
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-4xl sm:text-5xl lg:text-[4.25rem] font-bold leading-[1.04] tracking-tight text-text-primary mb-5"
          >
            Learn{' '}
            <span className="text-gradient">deep.</span>
            <br />
            Think{' '}
            <span className="text-gradient">clear.</span>
            <br />
            Score{' '}
            <motion.span
              className="relative inline-block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
            >
              high.
              <motion.span
                className="absolute top-2 -right-5 text-2xl select-none"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.95, type: 'spring', stiffness: 300 }}
              >
                🔥
              </motion.span>
            </motion.span>
          </motion.h1>

          {/* Subheadline — one sentence, hybrid pitch */}
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="text-lg text-text-secondary leading-relaxed max-w-md mb-7"
          >
            AI spots your weak areas. A verified human tutor steps in to fix them.
            All automatic — no booking required.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24 }}
            className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6"
          >
            <Button size="xl" className="shadow-glow gap-2 w-full sm:w-auto" asChild>
              <Link to="/register">
                Start learning free
                <ArrowRight size={18} />
              </Link>
            </Button>
            <Button variant="secondary" size="xl" className="gap-2.5 w-full sm:w-auto" asChild>
              <Link to="/exam/simulate">
                <Play size={15} className="text-accent" />
                Try a free exam
              </Link>
            </Button>
          </motion.div>

          {/* Exam chips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.32 }}
            className="flex flex-wrap items-center gap-1.5 mb-8"
          >
            <span className="text-2xs text-text-muted font-medium mr-0.5">Covers:</span>
            {EXAM_CHIPS.map((exam) => (
              <span
                key={exam}
                className="text-2xs px-2.5 py-0.5 rounded-full bg-base-elevated border border-border-subtle text-text-secondary font-medium"
              >
                {exam}
              </span>
            ))}
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap items-center gap-4"
          >
            <div className="flex">
              {['C', 'A', 'E', 'K', 'O'].map((l, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-base flex items-center justify-center text-xs font-bold text-white -ml-2 first:ml-0"
                  style={{ background: `hsl(${160 + i * 15}, 60%, 35%)`, zIndex: 5 - i }}
                >
                  {l}
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-0.5 mb-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={12} className="text-brand-xp fill-brand-xp" />
                ))}
                <span className="text-xs text-text-muted ml-1">4.9/5</span>
              </div>
              <p className="text-xs text-text-muted">
                Trusted by{' '}
                <span className="text-text-primary font-semibold">50,000+ students</span>
              </p>
            </div>

            <div className="h-6 w-px bg-border-subtle" />

            {[
              { value: '97%',  label: 'pass rate'      },
              { value: '200K+', label: 'past questions' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-sm font-bold text-text-primary leading-none">{value}</p>
                <p className="text-xs text-text-muted mt-0.5">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── RIGHT: Dashboard preview ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative hidden md:block"
        >
          <div className="bg-base-surface border border-border-subtle rounded-2xl p-5 shadow-card relative overflow-hidden">
            <div
              className="absolute top-0 right-0 w-48 h-48 pointer-events-none opacity-[0.15]"
              style={{ background: 'radial-gradient(circle, #6ee7b7, transparent 70%)' }}
            />

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-text-muted mb-0.5">Today&apos;s Progress</p>
                <p className="font-display text-base font-bold text-text-primary">Study Session</p>
              </div>
              <span className="text-2xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 font-semibold">
                ● LIVE
              </span>
            </div>

            {/* Subject bars */}
            <div className="space-y-3 mb-4">
              {[
                { subject: 'Mathematics',      pct: 82, color: 'accent'   as const },
                { subject: 'English Language', pct: 91, color: 'success'  as const },
                { subject: 'Physics',          pct: 58, color: 'warning'  as const },
                { subject: 'Chemistry',        pct: 44, color: 'danger'   as const },
              ].map(({ subject, pct, color }) => (
                <div key={subject}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-secondary">{subject}</span>
                    <span className={cn(
                      'font-medium',
                      color === 'danger' ? 'text-brand-danger' : 'text-text-muted'
                    )}>
                      {pct}%
                    </span>
                  </div>
                  <ProgressBar value={pct} color={color} size="xs" />
                </div>
              ))}
            </div>

            {/* FlexBot message */}
            <div className="bg-base-elevated border border-border-subtle rounded-xl p-3 mb-3">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-4 h-4 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center">
                  <Brain size={8} className="text-accent" />
                </div>
                <span className="text-2xs font-semibold text-accent">FlexBot</span>
                <span className="ml-auto text-3xs text-brand-success">● Active</span>
              </div>
              <div className="space-y-1.5">
                <div className="text-2xs bg-accent/10 text-accent rounded-lg px-2 py-1 ml-5 border border-accent/15">
                  Chemistry mastery at 44% — gap detected
                </div>
                <div className="text-2xs bg-base-subtle text-text-secondary rounded-lg px-2 py-1 mr-5 border border-border-subtle">
                  Notifying your tutor now 📋
                </div>
              </div>
            </div>

            {/* Tutor response (animated) */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.4 }}
              className="bg-base-elevated border border-blue-500/20 rounded-xl p-3 flex items-start gap-2.5"
            >
              <div className="w-7 h-7 rounded-full bg-blue-500/10 border border-blue-400/25 flex items-center justify-center shrink-0 mt-0.5">
                <UserCheck size={12} className="text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-2xs font-semibold text-text-primary">Mr. Okon · Chemistry</p>
                <p className="text-2xs text-text-secondary leading-snug mt-0.5">
                  Reviewed your gap — recovery plan ready!
                </p>
                <p className="text-3xs text-text-muted mt-1">Just now · Tutor Notification</p>
              </div>
            </motion.div>
          </div>

          {/* Floating XP badge (lg only) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.6, type: 'spring', stiffness: 200 }}
            className="absolute -bottom-4 -left-5 bg-base-surface border border-border-subtle rounded-2xl px-3.5 py-2.5 shadow-card hidden lg:flex items-center gap-2"
          >
            <div className="w-7 h-7 rounded-full bg-brand-xp/15 flex items-center justify-center">
              <Trophy size={12} className="text-brand-xp" />
            </div>
            <div>
              <p className="text-xs font-bold text-text-primary">+150 XP</p>
              <p className="text-2xs text-text-muted">Streak · Day 14</p>
            </div>
          </motion.div>

          {/* Floating improvement badge (lg only) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.8, type: 'spring', stiffness: 200 }}
            className="absolute -top-4 -right-4 bg-base-surface border border-accent/20 rounded-2xl px-3.5 py-2.5 shadow-card hidden lg:flex items-center gap-2"
          >
            <TrendingUp size={14} className="text-accent" />
            <div>
              <p className="text-xs font-bold text-accent">+34%</p>
              <p className="text-2xs text-text-muted">This week</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — FEATURES (Bento)
// ─────────────────────────────────────────────────────────────────────────────

const SMALL_FEATURES = [
  {
    icon: Target,
    title: 'Exam Simulation',
    desc: 'Full-length timed exams with year-specific past papers. Auto-submits like the real thing.',
  },
  {
    icon: Zap,
    title: 'SM-2 Flashcards',
    desc: 'Spaced repetition flashcards. FlexBot generates custom decks from any topic in seconds.',
  },
  {
    icon: Trophy,
    title: 'XP & Leaderboards',
    desc: 'Earn XP, unlock 40+ badges, and compete on the national leaderboard.',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 lg:py-28" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <FadeIn className="text-center mb-12">
          <SectionLabel>Platform features</SectionLabel>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary mt-4 mb-3">
            Everything you need to{' '}
            <span className="text-gradient">Excel.</span>
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto">
           A hybrid system of  AI that never sleeps and Human tutors who never miss a gap.
          </p>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-5">

          {/* AI Tutor — hero card */}
          <FadeIn className="md:col-span-2">
            <motion.div
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="relative rounded-2xl p-7 h-full flex flex-col overflow-hidden bg-base-surface border border-accent/30 shadow-glow"
            >
              <div
                className="absolute inset-0 pointer-events-none rounded-2xl"
                style={{ background: 'radial-gradient(ellipse at top right, rgba(110,231,183,0.10), transparent 55%)' }}
              />
              <div className="relative">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center shrink-0">
                    <Brain size={22} className="text-accent" />
                  </div>
                  <div>
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <h3 className="font-display text-xl font-bold text-text-primary">AI Tutor — FlexBot</h3>
                      <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-accent text-base-elevated">
                        STAR FEATURE
                      </span>
                    </div>
                    <p className="text-base text-text-secondary leading-relaxed max-w-lg">
                      Ask anything in English or Pidgin. Curriculum-aware, explains step by step —
                      and when it spots a weak area, your human tutor is notified instantly.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Any exam curriculum aware', 'Streams answers in real-time', 'Auto-alerts your human tutor'].map((pill) => (
                    <span
                      key={pill}
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-accent/10 text-accent border border-accent/20"
                    >
                      <CheckCircle size={10} className="shrink-0" />
                      {pill}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </FadeIn>

          {/* Human Tutors card */}
          <FadeIn delay={0.07}>
            <motion.div
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="relative rounded-2xl p-7 h-full flex flex-col overflow-hidden bg-base-surface border border-blue-500/25 shadow-card"
            >
              <div
                className="absolute inset-0 pointer-events-none rounded-2xl"
                style={{ background: 'radial-gradient(ellipse at top right, rgba(96,165,250,0.08), transparent 60%)' }}
              />
              <div className="relative flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-400/25 flex items-center justify-center shrink-0">
                    <UserCheck size={22} className="text-blue-400" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-text-primary leading-snug">
                    Verified Human Tutors
                  </h3>
                </div>
                <p className="text-base text-text-secondary leading-relaxed mb-5 flex-1">
                  Get an assigned, background-checked tutor on Pro. AI flags your gaps,
                  they step in with a personalised recovery plan. No booking needed.
                </p>
                <div className="flex flex-col gap-2">
                  {['Auto-assigned on Pro & Premium', 'AI-notified instantly', 'Recovery plans to your dashboard'].map((item) => (
                    <span key={item} className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
                      <CheckCircle size={10} className="text-blue-400 shrink-0" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </FadeIn>

          {/* Small feature cards */}
          {SMALL_FEATURES.map(({ icon: Icon, title, desc }, i) => (
            <FadeIn key={title} delay={(i + 2) * 0.07}>
              <motion.div
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="relative rounded-2xl p-6 h-full flex flex-col overflow-hidden bg-base-surface border border-border-subtle shadow-card hover:border-accent/20 transition-colors duration-300"
              >
                <div
                  className="absolute inset-0 opacity-0 hover:opacity-100 pointer-events-none rounded-2xl transition-opacity duration-300"
                  style={{ background: 'radial-gradient(ellipse at top right, rgba(110,231,183,0.05), transparent 60%)' }}
                />
                <div className="w-10 h-10 rounded-xl bg-base-elevated border border-border-subtle flex items-center justify-center mb-4">
                  <Icon size={18} className="text-accent" />
                </div>
                <h3 className="font-display text-base font-bold text-text-primary mb-2">{title}</h3>
                <p className="text-base text-text-secondary leading-relaxed">{desc}</p>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — HYBRID HANDOFF
// ─────────────────────────────────────────────────────────────────────────────

const HYBRID_FLOW = [
  {
    icon: Brain,
    iconColor: 'text-accent',
    iconBg: 'bg-accent/10 border-accent/25',
    step: '01',
    title: 'AI detects the gap',
    detail: 'FlexBot flags weak areas after every session and notifies your tutor immediately.',
    tag: 'Real-time · Automatic',
    tagStyle: 'text-accent bg-accent/10 border-accent/20',
  },
  {
    icon: UserCheck,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10 border-blue-400/25',
    step: '02',
    title: 'Your tutor responds',
    detail: 'Your assigned, verified tutor reviews the insight and sends a personalised recovery plan.',
    tag: 'Within 24 hours',
    tagStyle: 'text-blue-400 bg-blue-500/10 border-blue-400/20',
  },
  {
    icon: TrendingUp,
    iconColor: 'text-brand-success',
    iconBg: 'bg-brand-success/10 border-brand-success/25',
    step: '03',
    title: 'Gap closed. Mastery up.',
    detail: 'FlexBot re-evaluates. Chemistry 44% → 78% in two weeks. You never studied blind.',
    tag: 'AI-verified · Tracked',
    tagStyle: 'text-brand-success bg-brand-success/10 border-brand-success/20',
  },
];

export function HybridSection() {
  return (
    <section className="py-20 lg:py-28 relative overflow-hidden" id="hybrid">
      <div className="absolute inset-0 bg-base-surface/60 pointer-events-none" />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] pointer-events-none opacity-[0.06]"
        style={{ background: 'radial-gradient(ellipse at center, #6ee7b7 0%, #60a5fa 50%, transparent 72%)' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <FadeIn className="text-center mb-12">
          <SectionLabel>The FlexAcademy difference</SectionLabel>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary mt-4 mb-3">
            AI and Human.{' '}
            <span className="text-gradient">One system.</span>
          </h2>
          <p className="text-text-secondary max-w-lg mx-auto">
            The first Nigerian ed-tech platform where AI and human tutors operate as a single connected loop.
          </p>
        </FadeIn>

        <div className="grid sm:grid-cols-3 gap-5 lg:gap-8">
          {HYBRID_FLOW.map(({ icon: Icon, iconColor, iconBg, step, title, detail, tag, tagStyle }, i) => (
            <FadeIn key={step} delay={i * 0.12}>
              <div className="relative bg-base-surface border border-border-subtle rounded-2xl p-7 h-full flex flex-col shadow-card group hover:border-accent/15 hover:shadow-glow transition-all duration-300">

                {/* Connector arrow */}
                {i < HYBRID_FLOW.length - 1 && (
                  <div className="absolute top-[52px] -right-4 lg:-right-5 z-10 hidden sm:flex items-center gap-0.5">
                    <div className="w-3 lg:w-4 h-px" style={{ background: i === 0 ? '#6ee7b780' : '#60a5fa80' }} />
                    <div className="w-0 h-0" style={{
                      borderTop: '4px solid transparent',
                      borderBottom: '4px solid transparent',
                      borderLeft: `5px solid ${i === 0 ? '#60a5fa80' : '#4ade8080'}`,
                    }} />
                  </div>
                )}

                <div className={cn('w-[52px] h-[52px] rounded-2xl border flex items-center justify-center mb-5 shrink-0 group-hover:scale-105 transition-transform duration-200', iconBg)}>
                  <Icon size={24} className={iconColor} />
                </div>

                <p className="text-2xs font-bold uppercase tracking-widest text-text-muted mb-1.5">
                  Step {step}
                </p>
                <h3 className="font-display text-base font-bold text-text-primary mb-2 leading-snug">
                  {title}
                </h3>
                <p className="text-base text-text-secondary leading-relaxed flex-1 mb-4">
                  {detail}
                </p>
                <span className={cn('inline-flex self-start text-2xs font-semibold px-2.5 py-1 rounded-full border', tagStyle)}>
                  {tag}
                </span>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.4} className="text-center mt-10">
          <p className="text-text-muted text-sm mb-4">
            Automatic on every{' '}
            <span className="text-accent font-semibold">Pro</span> and{' '}
            <span className="text-accent font-semibold">Premium</span> plan.
          </p>
          <Button size="lg" className="shadow-glow gap-2" asChild>
            <Link to="/register">
              Get your first tutor free
              <ArrowRight size={16} />
            </Link>
          </Button>
        </FadeIn>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY STUBS — retained for any future consumers
// ─────────────────────────────────────────────────────────────────────────────

export function HowItWorksSection() { return null; }
export function ExamCategoriesSection() { return null; }
export function StatsSection() { return null; }
