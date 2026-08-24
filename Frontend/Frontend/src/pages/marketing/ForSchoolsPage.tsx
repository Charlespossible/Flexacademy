import { useState } from 'react';
import {
  School, BarChart3, Users, FileSpreadsheet, ShieldCheck,
  Layers, CheckCircle2, ArrowRight, Building2,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  PageHero, Section, FadeIn, FeatureCard, ComingSoonBadge,
} from '@/components/marketing/MarketingKit';

const CAPABILITIES = [
  { icon: BarChart3,       title: 'Whole-school analytics',   desc: 'Performance by class, subject and topic — so you can see that SS2 Chemistry is drifting before the mock results say so.' },
  { icon: Users,           title: 'Teacher dashboards',       desc: 'Every teacher sees their own classes, the gaps their students share, and which drills to assign this week.' },
  { icon: FileSpreadsheet, title: 'Bulk roll management',     desc: 'Upload your student roll once. Accounts, classes and parent links are provisioned automatically.' },
  { icon: Layers,          title: 'Syllabus alignment',       desc: 'Map FlexAcademy content to your scheme of work so the platform reinforces what you taught on Tuesday.' },
  { icon: ShieldCheck,     title: 'Safeguarding controls',    desc: 'Admin oversight on AI conversations, content filters, and full audit logs for every account.' },
  { icon: Building2,       title: 'Multi-campus support',     desc: 'Run several campuses under one licence with consolidated reporting for the proprietor or board.' },
];

const PILOT_STEPS = [
  { title: 'Discovery call',     desc: 'Thirty minutes to understand your exam profile, class sizes and current results.' },
  { title: 'Roll onboarding',    desc: 'We provision accounts for one year group and train your teaching staff.' },
  { title: 'Six-week pilot',     desc: 'Students use the platform alongside normal lessons. We track the delta, not the vibes.' },
  { title: 'Results review',     desc: 'A written report on measured gain, then a decision on rolling out school-wide.' },
];

export default function ForSchoolsPage() {
  const [form, setForm] = useState({ school: '', name: '', email: '', students: '' });
  const [submitted, setSubmitted] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.school.trim() || !form.name.trim()) {
      toast.error('Please add your school name and your name.');
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setSubmitted(true);
    toast.success('You are on the pilot waitlist — we will be in touch.');
  };

  return (
    <div className="bg-base">
      <PageHero
        eyebrow="For schools"
        eyebrowIcon={School}
        title="Give every teacher"
        highlight="sixty teaching assistants."
        subtitle="FlexAcademy for Schools brings whole-school analytics, teacher dashboards and bulk student management to Nigerian secondary schools. Currently in pilot with a limited number of institutions."
      >
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-brand-xp/8 border border-brand-xp/25">
          <ComingSoonBadge />
          <span className="text-sm text-text-secondary">
            Launching for the 2026/27 session — pilot places open now
          </span>
        </div>
      </PageHero>

      {/* ── The problem ──────────────────────────────────────────────────── */}
      <Section narrow className="pt-12">
        <FadeIn>
          <div className="bg-base-surface border border-border-subtle rounded-2xl p-7 sm:p-9">
            <h2 className="font-display text-2xl font-bold text-text-primary mb-4 tracking-tight">
              You already know which students are struggling.
            </h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              What you do not have is the twelve hours a week it would take to diagnose exactly{' '}
              <em className="text-text-primary not-italic font-medium">which</em> sub-topics each of
              them is failing on, and build a different revision plan for every one.
            </p>
            <p className="text-text-secondary leading-relaxed">
              That is the part we automate. Your teachers keep doing what only humans can do —
              teaching, motivating, and knowing which student had a hard week at home.
            </p>
          </div>
        </FadeIn>
      </Section>

      {/* ── Capabilities ─────────────────────────────────────────────────── */}
      <Section
        heading="What schools get"
        sub="Everything in the student product, plus the institutional layer on top."
        className="bg-base-surface/40 border-y border-border-subtle"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CAPABILITIES.map((c, i) => (
            <FadeIn key={c.title} delay={i * 0.06}>
              <FeatureCard icon={c.icon} title={c.title} desc={c.desc} />
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ── Pilot process ────────────────────────────────────────────────── */}
      <Section heading="How the pilot works" narrow>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PILOT_STEPS.map((s, i) => (
            <FadeIn key={s.title} delay={i * 0.07}>
              <div className="h-full bg-base-surface border border-border-subtle rounded-2xl p-6">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-accent/10 text-accent text-xs font-bold mb-4">
                  {i + 1}
                </span>
                <h3 className="font-display font-semibold text-text-primary mb-2">{s.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{s.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ── Waitlist form ────────────────────────────────────────────────── */}
      <Section narrow className="bg-base-surface/40 border-y border-border-subtle">
        <FadeIn>
          <div className="relative overflow-hidden bg-base-surface border border-accent/20 rounded-2xl p-7 sm:p-9">
            <div
              className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-40 pointer-events-none"
              style={{ background: 'radial-gradient(circle, var(--accent-glow), transparent 70%)' }}
            />

            <div className="relative">
              {submitted ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-2xl bg-brand-success/10 border border-brand-success/25 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={22} className="text-brand-success" />
                  </div>
                  <h2 className="font-display text-xl font-bold text-text-primary mb-2">
                    You&apos;re on the list
                  </h2>
                  <p className="text-sm text-text-muted max-w-sm mx-auto leading-relaxed">
                    We&apos;ll email <span className="text-text-secondary">{form.email}</span> when
                    pilot places open for your region. Expect to hear from us within two weeks.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <ComingSoonBadge />
                    <h2 className="font-display text-xl font-bold text-text-primary">
                      Join the pilot waitlist
                    </h2>
                  </div>
                  <p className="text-sm text-text-muted mb-6 max-w-md">
                    Tell us about your school. We&apos;re onboarding a small number of institutions
                    each term so we can support each one properly.
                  </p>

                  <form onSubmit={submit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="School name"
                        placeholder="e.g. Greenfield College"
                        value={form.school}
                        onChange={(e) => setForm({ ...form, school: e.target.value })}
                      />
                      <Input
                        label="Your name"
                        placeholder="e.g. Mrs. Adaeze Nwosu"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Work email"
                        type="email"
                        placeholder="you@school.edu.ng"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                      />
                      <Input
                        label="Approx. student count"
                        type="number"
                        placeholder="e.g. 450"
                        value={form.students}
                        onChange={(e) => setForm({ ...form, students: e.target.value })}
                      />
                    </div>

                    <Button type="submit" size="lg" className="w-full sm:w-auto">
                      Request pilot access
                      <ArrowRight size={16} />
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>
        </FadeIn>
      </Section>

      {/* ── Pricing note ─────────────────────────────────────────────────── */}
      <Section narrow>
        <FadeIn>
          <div className="text-center">
            <h2 className="font-display text-xl font-bold text-text-primary mb-3">
              What does it cost?
            </h2>
            <p className="text-sm text-text-muted leading-relaxed max-w-xl mx-auto mb-6">
              Institutional pricing is per student per session and drops sharply with roll size.
              Pilot schools get the first term free and locked-in pricing for two years afterwards.
            </p>
            <Button asChild variant="secondary" size="lg">
              <a href="mailto:schools@flexacademy.ng">Talk to our schools team</a>
            </Button>
          </div>
        </FadeIn>
      </Section>
    </div>
  );
}
