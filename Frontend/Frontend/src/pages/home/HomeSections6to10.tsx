import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Star,
  Shield, Clock, Users, UserCheck,
  Trophy, ChevronRight, TrendingUp, Award,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { FadeIn, SectionLabel } from './HomeSections1to5';

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — TESTIMONIALS (2 focused cards)
// ─────────────────────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    name: 'Ngozi Obi',
    role: 'SS3 Student — Chemistry WAEC A1',
    avatar: 'N',
    text: 'FlexBot spotted my Chemistry weakness before I even knew I had one. My assigned tutor sent a recovery plan the same day. Two weeks later: 44% → 82%. I didn\'t book anything — it just happened.',
    stars: 5,
    exam: 'WAEC',
    highlight: true,
  },
  {
    name: 'Emeka Adeyemi',
    role: 'JAMB 2024 — 312/400 · UNILAG Medicine',
    avatar: 'E',
    text: 'AI analysis after each simulation told me exactly what to focus on. Three months of past questions, 312 on JAMB. Life changed.',
    stars: 5,
    exam: 'JAMB',
    highlight: false,
  },
];

function TestimonialsSection() {
  return (
    <section className="py-20 overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        <FadeIn className="text-center mb-10">
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary">
            50,000 students.{' '}
            <span className="text-gradient">Real results.</span>
          </h2>
        </FadeIn>

        <div className="grid md:grid-cols-2 gap-5">
          {TESTIMONIALS.map(({ name, role, avatar, text, stars, exam, highlight }, i) => (
            <FadeIn key={name} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={cn(
                  'rounded-2xl p-6 h-full flex flex-col shadow-card transition-all duration-300',
                  highlight
                    ? 'bg-base-surface border border-accent/25 hover:shadow-glow'
                    : 'bg-base-surface border border-border-subtle hover:border-accent/15'
                )}
              >
                {/* Stars + exam */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(stars)].map((_, j) => (
                    <Star key={j} size={13} className="text-brand-xp fill-brand-xp" />
                  ))}
                  <span className="ml-auto text-2xs font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                    {exam}
                  </span>
                </div>

                {/* Quote */}
                <p className="text-sm text-text-secondary leading-relaxed flex-1 mb-5">
                  &ldquo;{text}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-sm font-bold text-accent shrink-0">
                    {avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{name}</p>
                    <p className="text-2xs text-text-muted">{role}</p>
                  </div>
                </div>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — FINAL CTA
// ─────────────────────────────────────────────────────────────────────────────

function FinalCTASection() {
  return (
    <section className="py-16 sm:py-20 lg:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-[0.35] pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.08]"
        style={{ background: 'radial-gradient(ellipse at center, #6ee7b7 0%, transparent 62%)' }}
      />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-accent/[0.06] pointer-events-none" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full border border-accent/[0.09] pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <FadeIn>
          <motion.div
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-accent/10 border border-accent/25 shadow-glow mb-8"
          >
            <span className="text-4xl">🚀</span>
          </motion.div>

          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary mb-4 leading-[1.06]">
            You&apos;re never{' '}
            <span className="text-gradient">studying alone.</span>
          </h2>

          <p className="text-lg text-text-secondary max-w-md mx-auto mb-9 leading-relaxed">
            AI working 24/7 and a verified human tutor watching your back.
            Start free — no credit card required.
          </p>

          <div className="flex flex-wrap gap-4 justify-center mb-10">
            <Button size="xl" className="shadow-glow gap-2.5" asChild>
              <Link to="/register">
                Create free account
                <ArrowRight size={18} />
              </Link>
            </Button>
            <Button variant="secondary" size="xl" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
          </div>

          {/* Trust row */}
          <div className="flex flex-wrap items-center justify-center gap-5 lg:gap-8">
            {[
              { icon: Shield,    label: 'SSL Secured'      },
              { icon: UserCheck, label: 'Verified tutors'  },
              { icon: Clock,     label: 'Cancel anytime'   },
              { icon: Users,     label: '50K+ students'    },
              { icon: Star,      label: '4.9 / 5 rating'   },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-text-muted">
                <Icon size={14} className="text-accent shrink-0" />
                {label}
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY STUBS — kept so existing imports don't break
// ─────────────────────────────────────────────────────────────────────────────

const LEADERBOARD_ENTRIES = [
  { rank: 1, name: 'Chidinma O.', school: 'GGSS Abuja',         score: 14280, badge: '🥇' },
  { rank: 2, name: 'Emeka A.',    school: 'Kings College Lagos', score: 13950, badge: '🥈' },
  { rank: 3, name: 'Kemi B.',     school: 'FGGC Sagamu',         score: 13720, badge: '🥉' },
  { rank: 4, name: 'Ibrahim M.',  school: 'GHS Kano',            score: 13450, badge: ''   },
  { rank: 5, name: 'Adaeze N.',   school: 'Loyola Jesuit Abuja', score: 13100, badge: ''   },
];

function LeaderboardSection() {
  return (
    <section className="py-24 bg-base-surface/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <FadeIn>
            <div className="bg-base-surface border border-border-subtle rounded-2xl overflow-hidden shadow-card">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle bg-base-elevated/40">
                <div className="flex items-center gap-2">
                  <Trophy size={17} className="text-brand-xp" />
                  <span className="font-display font-bold text-text-primary text-sm">Weekly Leaderboard</span>
                </div>
                <span className="text-2xs text-text-muted px-2.5 py-1 rounded-full bg-base-elevated border border-border-subtle">
                  National · All Subjects
                </span>
              </div>
              {LEADERBOARD_ENTRIES.map(({ rank, name, school, score, badge }, i) => (
                <motion.div
                  key={rank}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 + 0.3 }}
                  className={cn(
                    'flex items-center gap-4 px-5 py-3.5 border-b border-border-subtle hover:bg-base-subtle transition-colors',
                    rank === 1 && 'bg-brand-xp/[0.03]'
                  )}
                >
                  <span className="w-6 text-center font-display font-bold text-sm text-text-muted">{badge || rank}</span>
                  <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-sm font-bold text-accent shrink-0">
                    {name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary">{name}</p>
                    <p className="text-xs text-text-muted truncate">{school}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-brand-xp">{score.toLocaleString()}</p>
                    <p className="text-2xs text-text-muted">XP</p>
                  </div>
                </motion.div>
              ))}
              <div className="flex items-center justify-between px-5 py-3 bg-base-elevated/30">
                <span className="text-xs text-text-muted">Your rank: <span className="text-text-primary font-semibold">#1,247</span></span>
                <Link to="/register" className="text-xs text-accent hover:underline flex items-center gap-0.5">
                  Join & compete <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.15}>
            <SectionLabel>Competitive learning</SectionLabel>
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-text-primary mt-4 mb-5">
              Compete. Win. <span className="text-gradient">Dominate.</span>
            </h2>
            <p className="text-text-secondary text-lg leading-relaxed mb-7">
              Earn XP for every quiz, unlock badges for every milestone, and climb
              the national leaderboard while you study.
            </p>
            {[
              { icon: TrendingUp, text: 'Daily, weekly & all-time leaderboards' },
              { icon: Award,      text: '40+ badge types — from Streak Master to JAMB Slayer' },
              { icon: Users,      text: 'School-scoped leagues for class competitions' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3 mb-3.5">
                <div className="w-8 h-8 rounded-lg bg-brand-xp/10 border border-brand-xp/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={14} className="text-brand-xp" />
                </div>
                <span className="text-sm text-text-secondary leading-relaxed">{text}</span>
              </div>
            ))}
            <Button variant="secondary" size="lg" className="mt-6" asChild>
              <Link to="/register">Join the competition →</Link>
            </Button>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

function AiTutorSection() { return null; }
function TutorTrustSection() { return null; }
function PricingSection() { return null; }

export {
  AiTutorSection,
  TutorTrustSection,
  LeaderboardSection,
  PricingSection,
  TestimonialsSection,
  FinalCTASection,
};
