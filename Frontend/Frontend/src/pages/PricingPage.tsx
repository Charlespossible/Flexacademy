import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Check, X as XIcon, ArrowRight, ChevronDown,
  Zap, Sparkles, Brain, BookOpen, Target, Users,
  Shield, Trophy, Building2, GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PricingTable } from '@/components/pricing/PricingTable';
import { cn } from '@/lib/utils';

// ── FadeIn helper ─────────────────────────────────────────────────────────────
function FadeIn({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
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

// ── Feature comparison data ───────────────────────────────────────────────────
const COMPARISON: {
  category: string;
  rows: { label: string; free: boolean | string; flex: boolean | string }[];
}[] = [
  {
    category: 'Lessons & content',
    rows: [
      { label: 'Curriculum lessons per subject', free: 'First 2 only',  flex: 'All lessons'       },
      { label: 'Primary & secondary subjects',   free: false,           flex: true                },
      { label: 'Lesson bookmarks',               free: false,           flex: true                },
    ],
  },
  {
    category: 'AI features',
    rows: [
      { label: 'FlexBot AI Tutor',              free: '5 msgs/day',   flex: 'Unlimited'          },
      { label: 'AI-generated study plans',       free: false,          flex: true                 },
      { label: 'AI performance analysis',        free: false,          flex: true                 },
      { label: 'Multi-signal gap detection',     free: false,          flex: true                 },
    ],
  },
  {
    category: 'Flashcards',
    rows: [
      { label: 'Flashcard decks',               free: 'Basic',        flex: 'Full + gap-linked'  },
      { label: 'Spaced repetition (SM-2)',       free: false,          flex: true                 },
      { label: 'Flashcard gap signal to AI',     free: false,          flex: true                 },
    ],
  },
  {
    category: 'Quizzes & exams',
    rows: [
      { label: 'Quiz questions per day',         free: '10',           flex: 'Unlimited'          },
      { label: 'Full past question bank',        free: false,          flex: true                 },
      { label: 'Exam simulation',                free: false,          flex: 'WAEC, JAMB, NECO+'  },
    ],
  },
  {
    category: 'Tutor & support',
    rows: [
      { label: 'Assigned tutor',                 free: false,          flex: true                 },
      { label: 'Auto tutor alert on gap',        free: false,          flex: true                 },
      { label: 'Parent dashboard',               free: false,          flex: true                 },
    ],
  },
  {
    category: 'Progress & rewards',
    rows: [
      { label: 'Leaderboard',                    free: 'View only',    flex: 'Full + compete'     },
      { label: 'XP & badges',                    free: false,          flex: true                 },
      { label: 'Digital certificates',           free: false,          flex: true                 },
      { label: 'Analytics dashboard',            free: false,          flex: true                 },
    ],
  },
];

// ── FAQ data ──────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: 'What is FlexPass?',
    a: 'FlexPass is a single subscription that unlocks every feature on FlexAcademy — all lessons, unlimited AI Tutor, full exam simulation, spaced-repetition flashcards, AI-driven gap detection, an assigned tutor who is alerted automatically when you struggle, and more. There are no hidden tiers or locked upgrades.',
  },
  {
    q: 'What does the Free plan include?',
    a: 'The Free plan is a genuine teaser of the platform — not crippled software. You get the first two lessons of every subject, five AI Tutor messages per day, basic flashcard decks, ten quiz questions per day, and a view of the leaderboard. Enough to know this is for you, not enough to replace the full product.',
  },
  {
    q: 'How does the tutor assignment work?',
    a: 'When you subscribe to FlexPass, a verified tutor is assigned to your account based on your subjects. You never book or pay for sessions separately. The AI monitors your performance across quizzes, flashcard reviews and AI Tutor conversations — when it detects a pattern of struggle, it automatically briefs your tutor, who then reaches out to guide you.',
  },
  {
    q: 'Can I cancel my subscription anytime?',
    a: 'Yes. Cancel from your account settings at any time. Your FlexPass remains active until the end of the current billing period. No cancellation fees and no mid-cycle charges.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'We accept all major Nigerian debit and credit cards via Paystack, as well as bank transfers. Payment integration is coming soon — you will be notified the moment it goes live.',
  },
  {
    q: 'Do you offer school or institution licences?',
    a: 'Yes. Schools and institutions get volume pricing, a dedicated admin dashboard and per-student reporting. Contact us at schools@flexacademy.ng for a quote.',
  },
];

// ── FAQ Item ──────────────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn(
      'rounded-xl overflow-hidden border transition-colors duration-150',
      open ? 'border-accent/25 bg-accent/5' : 'border-border-subtle bg-base-surface'
    )}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-semibold text-text-primary">{q}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0 text-accent">
          <ChevronDown size={16} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-5 text-sm text-text-secondary leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Cell ──────────────────────────────────────────────────────────────────────
function Cell({ value, highlight = false }: { value: boolean | string; highlight?: boolean }) {
  if (typeof value === 'boolean') {
    return value
      ? <Check size={15} className={cn('mx-auto', highlight ? 'text-accent' : 'text-brand-success')} />
      : <XIcon size={13} className="mx-auto text-text-muted opacity-40" />;
  }
  return <span className={cn('text-xs font-medium', highlight ? 'text-accent' : 'text-text-secondary')}>{value}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function PricingPage() {
  return (
    <div className="bg-base min-h-screen pt-20 overflow-x-hidden">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative py-20 lg:py-28 text-center overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-35 pointer-events-none" />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] opacity-[0.1] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center top, #6ee7b7, transparent 65%)' }}
        />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/25 text-accent text-xs font-semibold mb-6">
              <Sparkles size={11} />
              Simple pricing — one plan, full access
            </span>
          </FadeIn>

          <FadeIn delay={0.08}>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary mb-5 leading-tight">
              Everything for one{' '}
              <span className="text-gradient">honest price.</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.15}>
            <p className="text-lg text-text-secondary leading-relaxed max-w-xl mx-auto">
               Subscribe once and access the complete FlexAcademy ecosystem.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── Plan ladder ───────────────────────────────────────────────────── */}
      <section className="pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <PricingTable />
          </FadeIn>

          {/* Free tier stays available, but it is an entry point, not a rung
              on the ladder — so it sits below rather than competing for the
              three slots §13 allows. */}
          <FadeIn delay={0.15} className="mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-dashed border-border-subtle p-5">
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  Not ready to pay? Start free.
                </p>
                <p className="text-xs text-text-muted mt-1">
                  First 2 lessons per subject, 5 AI Tutor messages a day, basic flashcards.
                  No card needed.
                </p>
              </div>
              <Button variant="secondary" className="shrink-0" asChild>
                <Link to="/register">Start free</Link>
              </Button>
            </div>
          </FadeIn>

          <FadeIn delay={0.2} className="mt-5 text-center">
            <p className="text-sm text-text-muted">
              Prices in Nigerian Naira, VAT inclusive.{' '}
              <Link to="/contact" className="text-accent font-medium hover:underline">
                Need school or family billing?
              </Link>
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-base-surface/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-12">
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-text-primary mb-3">
              What FlexPass actually does
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              This is not a features list. This is how the ecosystem functions when you subscribe.
            </p>
          </FadeIn>

          <div className="grid sm:grid-cols-2 gap-5">
            {[
              {
                icon: BookOpen,
                step: '01',
                title: 'You take curriculum-based lessons',
                desc: 'Structured lessons uploaded by vetted Nigerian teachers — primary through secondary. You progress at your own pace inside the app.',
              },
              {
                icon: Brain,
                step: '02',
                title: 'You ask FlexBot when you\'re stuck',
                desc: 'FlexBot explains difficult topics in clear language, using Nigerian examples. It generates practice questions on demand and walks through solutions step by step.',
              },
              {
                icon: Target,
                step: '03',
                title: 'You take quizzes and review flashcards',
                desc: 'The AI watches silently — not just your quiz scores, but your flashcard failure patterns and how often you ask FlexBot the same question. Three independent signals.',
              },
              {
                icon: Users,
                step: '04',
                title: 'AI alerts your assigned tutor',
                desc: 'When the signals converge on a genuine gap, AI automatically briefs your assigned tutor with a precise breakdown. Your tutor reaches out — you never have to book anything.',
              },
            ].map(({ icon: Icon, step, title, desc }) => (
              <FadeIn key={step}>
                <div className="flex gap-4 p-5 rounded-2xl bg-base-surface border border-border-subtle hover:border-accent/20 transition-colors">
                  <div className="shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                      <Icon size={18} className="text-accent" />
                    </div>
                  </div>
                  <div>
                    <span className="text-2xs font-bold text-accent tracking-widest uppercase">{step}</span>
                    <h3 className="font-display font-semibold text-text-primary text-sm mb-1 mt-0.5">{title}</h3>
                    <p className="text-xs text-text-secondary leading-relaxed">{desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature comparison ────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center mb-12">
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-text-primary mb-3">
              Free vs FlexPass
            </h2>
            <p className="text-text-secondary">Everything you need to make the call.</p>
          </FadeIn>

          <FadeIn>
            <div className="rounded-2xl overflow-hidden border border-border-subtle shadow-card overflow-x-auto">
              {/* Header */}
              <div className="grid grid-cols-3 bg-base-elevated border-b border-border-subtle">
                <div className="p-4">
                  <span className="text-2xs font-bold uppercase tracking-widest text-text-muted">Feature</span>
                </div>
                <div className="p-4 text-center">
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted">
                    <Zap size={12} /> Free
                  </div>
                </div>
                <div className="p-4 text-center bg-accent/5">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-accent">
                    <Sparkles size={12} /> FlexPass
                  </div>
                </div>
              </div>

              {COMPARISON.map(({ category, rows }) => (
                <div key={category}>
                  <div className="px-4 py-2.5 bg-base-elevated/60 border-t border-border-subtle">
                    <span className="text-2xs font-bold uppercase tracking-widest text-text-muted">{category}</span>
                  </div>
                  {rows.map(({ label, free, flex }, ri) => (
                    <div
                      key={label}
                      className={cn(
                        'grid grid-cols-3 text-center items-center border-t border-border-subtle',
                        ri % 2 === 0 ? 'bg-base-surface' : 'bg-transparent'
                      )}
                    >
                      <div className="p-3.5 px-4 text-left">
                        <span className="text-xs text-text-secondary">{label}</span>
                      </div>
                      <div className="p-3.5 flex items-center justify-center">
                        <Cell value={free} />
                      </div>
                      <div className="p-3.5 flex items-center justify-center bg-accent/[0.04]">
                        <Cell value={flex} highlight />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Schools / enterprise ──────────────────────────────────────────── */}
      <section className="py-16 bg-base-surface/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              {
                icon: Building2,
                title: 'Schools & institutions',
                desc: 'Volume licences with an admin dashboard, per-student reporting and curriculum alignment for your school\'s classes.',
                cta: 'Contact us',
                to: '/contact',
              },
              {
                icon: GraduationCap,
                title: 'Parents & families',
                desc: 'Manage up to five children under one FlexPass subscription. Parent dashboard included — track progress from your own screen.',
                cta: 'Get started',
                to: '/register',
              },
            ].map(({ icon: Icon, title, desc, cta, to }, i) => (
              <FadeIn key={title} delay={i * 0.08}>
                <div className="rounded-2xl p-6 h-full flex flex-col bg-base-surface border border-border-subtle shadow-card">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
                    <Icon size={18} className="text-accent" />
                  </div>
                  <h3 className="font-display text-base font-bold text-text-primary mb-2">{title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed flex-1 mb-4">{desc}</p>
                  <Button variant="secondary" size="sm" asChild>
                    <Link to={to}>{cta} →</Link>
                  </Button>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center mb-10">
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-text-primary mb-3">
              Common questions
            </h2>
          </FadeIn>
          <FadeIn>
            <div className="space-y-3">
              {FAQS.map((faq) => <FaqItem key={faq.q} {...faq} />)}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────────────── */}
      <section className="py-20 text-center">
        <FadeIn>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-text-primary mb-4">
            Start free.{' '}
            <span className="text-gradient">Upgrade when you&apos;re ready.</span>
          </h2>
          <p className="text-text-secondary mb-8">No credit card required. Cancel anytime.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="xl" className="shadow-glow gap-2" asChild>
              <Link to="/register">
                Create free account
                <ArrowRight size={16} />
              </Link>
            </Button>
            <Button variant="secondary" size="xl" asChild>
              <Link to="/contact">Talk to us</Link>
            </Button>
          </div>
          <div className="flex flex-wrap justify-center gap-6 mt-8">
            {[
              { icon: Shield,  label: 'SSL secured payments' },
              { icon: Zap,     label: 'Instant activation'   },
              { icon: Trophy,  label: 'Cancel anytime'       },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-text-muted">
                <Icon size={14} className="text-accent" />
                {label}
              </div>
            ))}
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
