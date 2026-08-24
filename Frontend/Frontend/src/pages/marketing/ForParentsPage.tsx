import { Link } from 'react-router-dom';
import {
  Users, Eye, Bell, TrendingUp, ShieldCheck, Wallet,
  MessageCircle, CheckCircle2, LineChart,
} from 'lucide-react';

import {
  PageHero, Section, FadeIn, FeatureCard, CTASection, StatStrip,
} from '@/components/marketing/MarketingKit';

const FEATURES = [
  { icon: Eye,        title: 'See real progress',      desc: 'Not just hours logged. Actual topic mastery, exam-readiness scores, and which subjects are trending down.' },
  { icon: Bell,       title: 'Alerts that matter',     desc: 'A weekly digest plus instant alerts if your child stops studying or a mock score drops sharply.' },
  { icon: LineChart,  title: 'Exam-readiness score',   desc: 'One number that answers the question you actually care about: are they on track for May?' },
  { icon: ShieldCheck, title: 'Safe by default',       desc: 'Every AI conversation is logged and reviewable. Content is filtered and age-appropriate.' },
  { icon: Wallet,     title: 'One plan, all children', desc: 'Family plans cover up to four children on a single subscription with separate dashboards.' },
  { icon: MessageCircle, title: 'Talk to their tutor', desc: 'Message your child\'s verified human tutor directly, and read the session notes after each class.' },
];

const CONCERNS = [
  {
    q: '"Is my child actually studying, or just opening the app?"',
    a: 'Your dashboard separates time-on-app from questions attempted and topics mastered. A child who opened the app for two hours and answered four questions will look very different from one who did thirty minutes of focused drills.',
  },
  {
    q: '"I don\'t understand the subjects well enough to help."',
    a: 'You do not need to. The dashboard tells you in plain English which topics are weak and what the platform is doing about it. Your job is encouragement and follow-through, not teaching Further Maths.',
  },
  {
    q: '"Will this just be another screen distraction?"',
    a: 'FlexAcademy has no feed, no autoplay video and no infinite scroll. Sessions are structured around a goal and end when the goal is met. Screen time here is closer to a past-question booklet than to TikTok.',
  },
  {
    q: '"How do I know the AI is not just doing their homework?"',
    a: 'Our AI tutor is built to explain and question, not to hand over answers. When a student asks for a solution outright, it walks them through the method instead. You can read every conversation.',
  },
];

const STEPS = [
  { title: 'Create a parent account', desc: 'Sign up and choose the Parent role — it takes about a minute.' },
  { title: 'Link your child',         desc: 'Enter their FlexAcademy email or share your invite code. They approve the link.' },
  { title: 'Set your alerts',         desc: 'Choose what you want to hear about and how often. Weekly digest is the default.' },
];

export default function ForParentsPage() {
  return (
    <div className="bg-base">
      <PageHero
        eyebrow="For parents"
        eyebrowIcon={Users}
        title="Know how they're doing"
        highlight="before the results arrive."
        subtitle="Link your child's account and get an honest view of their exam preparation — what they've mastered, where they're slipping, and whether they're actually on track for WAEC and JAMB."
      />

      <Section className="pt-12 pb-6">
        <StatStrip
          stats={[
            { value: '4',    label: 'Children per family plan' },
            { value: 'Weekly', label: 'Progress digests'       },
            { value: '10',   label: 'Exams tracked'            },
            { value: '100%', label: 'Conversations reviewable' },
          ]}
        />
      </Section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <Section
        heading="What you can see"
        sub="Enough visibility to help, not so much that it becomes surveillance."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <FadeIn key={f.title} delay={i * 0.06}>
              <FeatureCard icon={f.icon} title={f.title} desc={f.desc} />
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ── Getting started ──────────────────────────────────────────────── */}
      <Section
        heading="Getting set up"
        sub="Three steps, about five minutes."
        narrow
        className="bg-base-surface/40 border-y border-border-subtle"
      >
        <div className="space-y-3">
          {STEPS.map((s, i) => (
            <FadeIn key={s.title} delay={i * 0.07}>
              <div className="flex gap-4 items-start bg-base-surface border border-border-subtle rounded-xl p-5">
                <span className="shrink-0 w-8 h-8 rounded-lg bg-accent/10 text-accent font-bold text-sm flex items-center justify-center">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-display font-semibold text-text-primary text-sm">{s.title}</p>
                  <p className="text-sm text-text-muted mt-1 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ── Honest answers ───────────────────────────────────────────────── */}
      <Section
        heading="The questions parents actually ask"
        sub="Straight answers, including to the sceptical ones."
        narrow
      >
        <div className="space-y-4">
          {CONCERNS.map((c, i) => (
            <FadeIn key={c.q} delay={i * 0.06}>
              <div className="bg-base-surface border border-border-subtle rounded-2xl p-6">
                <p className="font-display font-semibold text-text-primary mb-3 leading-snug">
                  {c.q}
                </p>
                <p className="text-sm text-text-muted leading-relaxed">{c.a}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ── Trust strip ──────────────────────────────────────────────────── */}
      <Section narrow className="bg-base-surface/40 border-y border-border-subtle">
        <FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: ShieldCheck, label: 'No ads, ever' },
              { icon: CheckCircle2, label: 'Data never sold' },
              { icon: TrendingUp,  label: 'Cancel anytime' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center justify-center gap-2.5 bg-base-surface border border-border-subtle rounded-xl py-4 px-3"
              >
                <Icon size={15} className="text-brand-success shrink-0" />
                <span className="text-sm text-text-secondary">{label}</span>
              </div>
            ))}
          </div>
        </FadeIn>
      </Section>

      <Section narrow className="pt-10 pb-0">
        <FadeIn>
          <p className="text-center text-sm text-text-muted">
            Already have an account?{' '}
            <Link to="/parent/dashboard" className="text-accent hover:underline">
              Go to your parent dashboard
            </Link>
          </p>
        </FadeIn>
      </Section>

      <CTASection
        title="Start with the free plan"
        sub="Link one child, see the dashboard, and decide from there. No card required."
        primaryLabel="Create parent account"
        primaryTo="/register"
        secondaryLabel="Compare plans"
        secondaryTo="/pricing"
      />
    </div>
  );
}
