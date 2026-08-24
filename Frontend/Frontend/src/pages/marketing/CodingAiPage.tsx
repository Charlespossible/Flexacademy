import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Code2, Braces, Bot, Cpu, Globe, Database,
  GraduationCap, Sparkles, ArrowRight, CheckCircle2,
} from 'lucide-react';

import {
  FadeIn, PageHero, Section, FeatureCard, StatStrip, CTASection, ComingSoonBadge,
} from '@/components/marketing/MarketingKit';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// ─── Tracks ──────────────────────────────────────────────────────────────────
const TRACKS = [
  {
    icon: Braces,
    title: 'Programming foundations',
    desc: 'Python from first principles — variables, logic, loops, functions. The same problem-solving muscles that make Further Maths click.',
  },
  {
    icon: Globe,
    title: 'Web development',
    desc: 'HTML, CSS and JavaScript, then React. Finish with a portfolio site you actually deployed, not a certificate nobody checks.',
  },
  {
    icon: Database,
    title: 'Data & spreadsheets',
    desc: 'Reading data properly, cleaning it, charting it. The most immediately employable skill on this list, and the least taught.',
  },
  {
    icon: Bot,
    title: 'Working with AI',
    desc: 'How large language models actually work, where they fail, and how to use them as a tool rather than a shortcut that costs you the learning.',
  },
  {
    icon: Cpu,
    title: 'Machine learning basics',
    desc: 'What training really means, why data quality decides everything, and building a first model end to end.',
  },
  {
    icon: Code2,
    title: 'Build something real',
    desc: 'Every track ends in a project you ship. Assessed by a tutor, not auto-graded against a hidden test file.',
  },
];

const FOR_WHOM = [
  {
    title: 'Students sitting WAEC or JAMB',
    desc: 'Coding is not a distraction from exams. Computer Science and Data Processing are examinable subjects, and the logical thinking transfers straight into Mathematics.',
  },
  {
    title: 'School leavers deciding what next',
    desc: 'A portfolio and demonstrable skills open doors that a waiting year does not — whether that leads to university, an internship or freelance work.',
  },
  {
    title: 'Anyone told to "just use AI"',
    desc: 'Being handed a chatbot is not training. Understanding what it is doing, and when it is confidently wrong, is the difference between a tool and a crutch.',
  },
];

const FAQS = [
  {
    q: 'Do I need a laptop?',
    a: 'For the programming tracks, yes — you cannot learn to code on a phone alone. The AI literacy and data tracks work on a mid-range Android phone, and we are designing them phone-first because that is what most Nigerian students actually have.',
  },
  {
    q: 'Will this clash with my exam preparation?',
    a: 'It is designed not to. Lessons are short and the study planner treats coding as a secondary track, so your exam subjects always take priority when time is tight.',
  },
  {
    q: 'Is it included in FlexPass?',
    a: 'Yes. Coding & AI is part of the same subscription — there is no separate tier or upsell, the same as every other subject on the platform.',
  },
  {
    q: 'Who teaches it?',
    a: 'The same vetted-tutor model as the rest of FlexAcademy. Lessons are authored by working developers and reviewed before publication, and the AI tutor is there when you get stuck at 1am.',
  },
];

export default function CodingAiPage() {
  const [email, setEmail] = useState('');

  const notify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Enter an email address first.');
      return;
    }
    // No waitlist endpoint exists yet — say so rather than pretending it saved.
    toast.success('Noted. We will email you the moment the first track opens.');
    setEmail('');
  };

  return (
    <div className="bg-base">
      <PageHero
        eyebrow="Coding & AI"
        eyebrowIcon={Code2}
        title="Learn to build,"
        highlight="not just to pass."
        subtitle="A practical coding and AI track built for Nigerian students — taught by working developers, assessed on what you ship, and included in the subscription you already have."
      >
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <ComingSoonBadge />
          <span className="text-sm text-text-muted">
            First tracks open soon — add your email below.
          </span>
        </div>
      </PageHero>

      {/* ── Why ─────────────────────────────────────────────────────────── */}
      <Section narrow>
        <FadeIn>
          <div className="bg-base-surface border border-border-subtle rounded-2xl p-7 sm:p-8">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-text-primary mb-4">
              Why we are adding this
            </h2>
            <div className="space-y-4 text-sm sm:text-base text-text-secondary leading-relaxed">
              <p>
                FlexAcademy exists to get students through WAEC, JAMB and NECO. That
                does not stop at the exam hall. The question that follows every result
                slip is <em>what now</em>, and for a growing number of Nigerian
                students the honest answer involves a keyboard.
              </p>
              <p>
                Coding is also examinable. Computer Science and Data Processing sit on
                the same syllabus as everything else we teach, and they are badly
                served by rote memorisation of code printed in a textbook.
              </p>
              <p>
                And there is AI itself. Students are already using it — often in ways
                that quietly remove the struggle that learning depends on. We would
                rather teach what these systems actually do, where they fail, and how
                to stay the one doing the thinking.
              </p>
            </div>
          </div>
        </FadeIn>
      </Section>

      {/* ── Tracks ──────────────────────────────────────────────────────── */}
      <Section
        heading="What you will learn"
        sub="Six tracks, each ending in something you built and can show someone."
        className="bg-base-surface/40 border-y border-border-subtle"
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TRACKS.map((t, i) => (
            <FadeIn key={t.title} delay={i * 0.05}>
              <FeatureCard icon={t.icon} title={t.title} desc={t.desc} />
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ── Who it is for ───────────────────────────────────────────────── */}
      <Section heading="Who it is for">
        <div className="grid sm:grid-cols-3 gap-5">
          {FOR_WHOM.map(({ title, desc }, i) => (
            <FadeIn key={title} delay={i * 0.06}>
              <div className="h-full bg-base-surface border border-border-subtle rounded-2xl p-6">
                <CheckCircle2 size={18} className="text-accent mb-3" />
                <h3 className="font-display font-semibold text-text-primary mb-2">{title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ── How it fits ─────────────────────────────────────────────────── */}
      <Section
        heading="It works the way the rest of the platform does"
        className="bg-base-surface/40 border-y border-border-subtle"
      >
        <StatStrip
          stats={[
            { value: 'Same', label: 'FlexPass subscription' },
            { value: 'AI', label: 'tutor on every lesson' },
            { value: 'Gap', label: 'detection built in' },
            { value: '1:1', label: 'tutor when you stall' },
          ]}
        />
        <FadeIn delay={0.15}>
          <p className="mt-8 text-center text-sm text-text-muted max-w-2xl mx-auto leading-relaxed">
            When the AI notices you are stuck on recursion the same way it notices you
            are stuck on quadratics, it briefs a tutor and a session gets arranged. You
            never book anyone, and nothing costs extra.
          </p>
        </FadeIn>
      </Section>

      {/* ── Notify ──────────────────────────────────────────────────────── */}
      <Section narrow>
        <FadeIn>
          <div className="bg-accent/5 border border-accent/25 rounded-2xl p-7 sm:p-8 text-center">
            <Sparkles size={20} className="text-accent mx-auto mb-3" />
            <h2 className="font-display text-xl font-bold text-text-primary mb-2">
              Be first in when it opens
            </h2>
            <p className="text-sm text-text-muted mb-6 max-w-md mx-auto leading-relaxed">
              We are building the first track now. Leave your email and we will tell you
              the day it goes live — no other mail.
            </p>
            <form
              onSubmit={notify}
              className="flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto"
            >
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="lg" className="shrink-0 gap-2">
                Notify me
                <ArrowRight size={15} />
              </Button>
            </form>
          </div>
        </FadeIn>
      </Section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <Section heading="Questions" narrow className="bg-base-surface/40 border-y border-border-subtle">
        <div className="space-y-4">
          {FAQS.map(({ q, a }, i) => (
            <FadeIn key={q} delay={i * 0.05}>
              <div className="bg-base-surface border border-border-subtle rounded-2xl p-6">
                <h3 className="font-display font-semibold text-text-primary mb-2">{q}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{a}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      <CTASection
        title="Start with the exams. Stay for what comes after."
        sub="Everything on FlexAcademy sits behind one subscription — including this, when it lands."
        primaryLabel="Get started free"
        primaryTo="/register"
        secondaryLabel="See pricing"
        secondaryTo="/pricing"
      />

      <div className="pb-12 text-center">
        <Link
          to="/courses"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-accent transition-colors"
        >
          <GraduationCap size={15} />
          Browse what is available today
        </Link>
      </div>
    </div>
  );
}
