import { Link } from 'react-router-dom';
import {
  GraduationCap, Wallet, Clock, Brain, Users, BadgeCheck,
  FileText, CalendarCheck, Banknote, ArrowRight,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import {
  PageHero, Section, FadeIn, FeatureCard, StatStrip, CTASection,
} from '@/components/marketing/MarketingKit';

const BENEFITS = [
  { icon: Wallet,  title: 'Set your own rate',      desc: 'You decide what an hour of your time is worth. We take a flat 15% — no hidden deductions, no lead fees.' },
  { icon: Clock,   title: 'Teach when you want',    desc: 'Publish your availability and students book around it. Evenings only, weekends only, whatever fits.' },
  { icon: Brain,   title: 'Walk in already briefed', desc: 'Our AI hands you a gap report before every session. You will never waste twenty minutes working out what a student does not know.' },
  { icon: Users,   title: 'Students find you',      desc: 'We match students to tutors by subject, exam board and past results. You do not have to hustle for clients.' },
  { icon: Banknote, title: 'Paid every Friday',     desc: 'Earnings clear to your Nigerian bank account weekly. Track every naira in your tutor dashboard.' },
  { icon: BadgeCheck, title: 'Verified badge',      desc: 'Once approved you get a verified badge that visibly lifts your booking rate.' },
];

const REQUIREMENTS = [
  'A degree, or current enrolment in a degree, in your subject area',
  'Demonstrable teaching experience — formal or private tuition both count',
  'Deep familiarity with at least one of WAEC, JAMB, NECO or an international board',
  'A reliable internet connection and a quiet space for live sessions',
  'Two professional references we can contact',
];

const STEPS = [
  { icon: FileText,      title: 'Submit your application', desc: 'Tell us your subjects, qualifications and experience. Takes about ten minutes.' },
  { icon: BadgeCheck,    title: 'Verification review',     desc: 'Our team checks your credentials and references. Most decisions land within 48 hours.' },
  { icon: CalendarCheck, title: 'Set your availability',   desc: 'Once approved, publish your rate and calendar. Your profile goes live to matched students.' },
  { icon: Wallet,        title: 'Teach and earn',          desc: 'Take bookings, run sessions, get paid every Friday. Your rating grows with every good review.' },
];

const FAQS = [
  { q: 'How much can I realistically earn?', a: 'Tutors setting a ₦4,000/hour rate and teaching 10 hours a week earn roughly ₦136,000 monthly after our 15% fee. Top tutors in high-demand subjects like Further Maths and Physics clear considerably more.' },
  { q: 'Do I need to be a full-time teacher?', a: 'No. Most of our tutors are university students, recent graduates or working professionals teaching a few evenings a week.' },
  { q: 'What if my application is rejected?', a: 'We tell you exactly why, and you can reapply after 30 days once you have addressed the gap. Rejection is usually about missing documentation, not ability.' },
  { q: 'Am I competing with the AI tutor?', a: 'No — the AI handles drilling and explanation at scale, then flags the students who need a human. You get sent the cases where a person genuinely makes the difference.' },
];

export default function BecomeTutorPage() {
  const user = useAuthStore((s) => s.user);
  const isTutor = user?.role === 'TUTOR';

  return (
    <div className="bg-base">
      <PageHero
        eyebrow="Become a tutor"
        eyebrowIcon={GraduationCap}
        title="Teach on your terms."
        highlight="Get paid every Friday."
        subtitle="Join FlexAcademy's network of verified tutors. Set your own rate, choose your own hours, and walk into every session already knowing exactly where your student is stuck."
      >
        <Button asChild size="lg">
          <Link to={isTutor ? '/tutor/onboarding' : '/register?role=tutor'}>
            {isTutor ? 'Complete my application' : 'Start your application'}
            <ArrowRight size={16} />
          </Link>
        </Button>
      </PageHero>

      <Section className="pt-12 pb-6">
        <StatStrip
          stats={[
            { value: '₦4,500', label: 'Median hourly rate' },
            { value: '15%',    label: 'Flat platform fee'  },
            { value: '48h',    label: 'Approval turnaround' },
            { value: 'Weekly', label: 'Payouts'            },
          ]}
        />
      </Section>

      {/* ── Why teach here ───────────────────────────────────────────────── */}
      <Section
        heading="Why teach on FlexAcademy"
        sub="Built by tutors who got tired of chasing payments and guessing what to cover."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BENEFITS.map((b, i) => (
            <FadeIn key={b.title} delay={i * 0.06}>
              <FeatureCard icon={b.icon} title={b.title} desc={b.desc} />
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ── The AI briefing — the differentiator ─────────────────────────── */}
      <Section narrow className="bg-base-surface/40 border-y border-border-subtle">
        <FadeIn>
          <div className="bg-base-surface border border-accent/20 rounded-2xl p-7 sm:p-9">
            <div className="w-10 h-10 rounded-xl bg-violet-400/10 flex items-center justify-center mb-5">
              <Brain size={18} className="text-violet-400" />
            </div>
            <h2 className="font-display text-2xl font-bold text-text-primary mb-4 tracking-tight">
              You get the gap report before the session
            </h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              Every student you are matched with has been drilling on FlexAcademy between sessions.
              Our engine tracks every wrong answer and clusters them into specific, named gaps.
            </p>
            <p className="text-text-secondary leading-relaxed mb-5">
              So instead of &ldquo;he says he struggles with Maths&rdquo;, you open your dashboard
              and read: <em className="text-text-primary not-italic">
                &ldquo;Chidi is at 41% on simultaneous equations with fractional coefficients —
                specifically, he is not clearing denominators before substituting.&rdquo;
              </em>
            </p>
            <p className="text-sm text-text-muted leading-relaxed border-t border-border-subtle pt-5">
              That is twenty minutes of diagnosis you no longer have to do in the session, on the
              clock, while a teenager watches you think.
            </p>
          </div>
        </FadeIn>
      </Section>

      {/* ── Process ──────────────────────────────────────────────────────── */}
      <Section heading="How to join" sub="Four steps from application to your first booking.">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((s, i) => (
            <FadeIn key={s.title} delay={i * 0.07}>
              <div className="relative h-full">
                <span className="absolute -top-2 -left-1 font-display text-5xl font-bold text-accent/8 select-none leading-none">
                  {i + 1}
                </span>
                <div className="relative">
                  <FeatureCard icon={s.icon} title={s.title} desc={s.desc} />
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ── Requirements ─────────────────────────────────────────────────── */}
      <Section heading="What we look for" narrow className="bg-base-surface/40 border-y border-border-subtle">
        <FadeIn>
          <ul className="bg-base-surface border border-border-subtle rounded-2xl divide-y divide-border-subtle overflow-hidden">
            {REQUIREMENTS.map((r) => (
              <li key={r} className="flex items-start gap-3 px-5 py-4">
                <BadgeCheck size={15} className="text-accent shrink-0 mt-0.5" />
                <span className="text-sm text-text-secondary leading-relaxed">{r}</span>
              </li>
            ))}
          </ul>
        </FadeIn>
        <FadeIn delay={0.08}>
          <p className="text-xs text-text-muted text-center mt-5 max-w-lg mx-auto">
            Missing one of these? Apply anyway and tell us why in your cover letter — we read every
            application, and exceptional teaching experience can outweigh a missing credential.
          </p>
        </FadeIn>
      </Section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <Section heading="Questions" narrow>
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <FadeIn key={f.q} delay={i * 0.05}>
              <details className="group bg-base-surface border border-border-subtle rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none">
                  <span className="text-sm font-medium text-text-primary">{f.q}</span>
                  <span className="text-text-muted text-lg leading-none shrink-0 group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <div className="px-5 pb-4 text-sm text-text-muted leading-relaxed">{f.a}</div>
              </details>
            </FadeIn>
          ))}
        </div>
      </Section>

      <CTASection
        title="Ready to start teaching?"
        sub="Applications are reviewed within 48 hours. There is no fee to apply."
        primaryLabel={isTutor ? 'Complete my application' : 'Apply to teach'}
        primaryTo={isTutor ? '/tutor/onboarding' : '/register?role=tutor'}
        secondaryLabel="Talk to our team"
        secondaryTo="/contact?category=partnership"
      />
    </div>
  );
}
