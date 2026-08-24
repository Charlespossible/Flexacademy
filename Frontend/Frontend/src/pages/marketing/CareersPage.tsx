import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase, MapPin, Clock, ArrowRight, Heart, Laptop,
  GraduationCap, Plane, Coins, HeartPulse,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import {
  PageHero, Section, FadeIn, FeatureCard, CTASection,
} from '@/components/marketing/MarketingKit';

type Role = {
  title: string;
  team: 'Engineering' | 'Learning' | 'Growth' | 'Operations';
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract';
  desc: string;
};

const ROLES: Role[] = [
  {
    title: 'Senior Backend Engineer',
    team: 'Engineering',
    location: 'Lagos / Remote',
    type: 'Full-time',
    desc: 'Own the assessment and gap-detection services. Node, TypeScript, Postgres, Prisma. You will care a lot about p99 latency on bad networks.',
  },
  {
    title: 'Frontend Engineer (React)',
    team: 'Engineering',
    location: 'Remote (Nigeria)',
    type: 'Full-time',
    desc: 'Build the student experience. React, TypeScript, Tailwind. Bonus points if you have shipped something that works well offline.',
  },
  {
    title: 'Curriculum Lead — Sciences',
    team: 'Learning',
    location: 'Lagos',
    type: 'Full-time',
    desc: 'Map Physics, Chemistry and Biology content to the WAEC and JAMB syllabi. Ex-teacher strongly preferred.',
  },
  {
    title: 'Content Writer — Past Questions',
    team: 'Learning',
    location: 'Remote (Nigeria)',
    type: 'Contract',
    desc: 'Write and verify solutions for our question bank. Paid per verified question set, with a quality bonus.',
  },
  {
    title: 'Growth Marketer',
    team: 'Growth',
    location: 'Lagos / Abuja',
    type: 'Full-time',
    desc: 'Own acquisition across WhatsApp, TikTok and school partnerships. You will be measured on activated students, not impressions.',
  },
  {
    title: 'Student Support Associate',
    team: 'Operations',
    location: 'Abuja',
    type: 'Full-time',
    desc: 'Front line for our students and parents. Patient, fast, and genuinely good at explaining things twice without sighing.',
  },
];

const TEAMS = ['All', 'Engineering', 'Learning', 'Growth', 'Operations'] as const;

const PERKS = [
  { icon: Coins,        title: 'Equity for everyone',  desc: 'Every full-time hire gets meaningful ownership. No exceptions, no negotiation theatre.' },
  { icon: Laptop,       title: 'Your setup, funded',   desc: 'A ₦1.2M hardware budget plus a monthly data and power stipend.' },
  { icon: HeartPulse,   title: 'Health cover',         desc: 'Comprehensive HMO for you, your partner and up to four children.' },
  { icon: GraduationCap, title: 'Learning budget',     desc: '₦500k a year for courses, books and conferences. Use it or we will nag you.' },
  { icon: Plane,        title: 'Real time off',        desc: '25 days annual leave with a mandatory minimum of 15. Burnout is not a badge.' },
  { icon: Heart,        title: 'Family first',         desc: '16 weeks parental leave for primary carers, 6 weeks for secondary.' },
];

function RoleRow({ role }: { role: Role }) {
  return (
    <FadeIn>
      <div className="group bg-base-surface border border-border-subtle rounded-2xl p-5 sm:p-6 hover:border-border-active transition-colors">
        <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h3 className="font-display font-semibold text-text-primary">{role.title}</h3>
              <span className="text-2xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                {role.team}
              </span>
            </div>
            <p className="text-sm text-text-muted leading-relaxed mb-3">{role.desc}</p>
            <div className="flex items-center gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-1.5">
                <MapPin size={12} className="text-accent/60" />
                {role.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={12} className="text-accent/60" />
                {role.type}
              </span>
            </div>
          </div>

          <Button asChild variant="secondary" size="sm" className="shrink-0">
            <Link to={`/contact?role=${encodeURIComponent(role.title)}`}>
              Apply
              <ArrowRight size={14} />
            </Link>
          </Button>
        </div>
      </div>
    </FadeIn>
  );
}

export default function CareersPage() {
  const [team, setTeam] = useState<(typeof TEAMS)[number]>('All');
  const visible = team === 'All' ? ROLES : ROLES.filter((r) => r.team === team);

  return (
    <div className="bg-base">
      <PageHero
        eyebrow="Careers"
        eyebrowIcon={Briefcase}
        title="Help us teach"
        highlight="a generation."
        subtitle="We are a small team in Lagos and Abuja building the learning infrastructure Nigerian students should have had a decade ago. If that sounds like your kind of problem, we should talk."
      />

      {/* ── Open roles ───────────────────────────────────────────────────── */}
      <Section narrow className="pt-12">
        <FadeIn className="mb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="font-display text-xl font-bold text-text-primary">
              Open roles
              <span className="ml-2 text-sm font-normal text-text-muted">({visible.length})</span>
            </h2>

            {/* Team filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto -mx-1 px-1 py-1">
              {TEAMS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTeam(t)}
                  className={cn(
                    'shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                    team === t
                      ? 'bg-accent/10 text-accent border-accent/30'
                      : 'bg-base-surface text-text-muted border-border-subtle hover:text-text-primary'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </FadeIn>

        <div className="space-y-3">
          {visible.map((r) => (
            <RoleRow key={r.title} role={r} />
          ))}
        </div>

        <FadeIn delay={0.1}>
          <div className="mt-6 text-center bg-base-surface border border-dashed border-border-subtle rounded-2xl p-6">
            <p className="text-sm text-text-secondary mb-1">Nothing here fits?</p>
            <p className="text-xs text-text-muted mb-4 max-w-md mx-auto">
              We hire ahead of the roadmap for exceptional people. Send us what you have built and
              why FlexAcademy specifically.
            </p>
            <Button asChild variant="secondary" size="sm">
              <Link to="/contact?category=careers">Send an open application</Link>
            </Button>
          </div>
        </FadeIn>
      </Section>

      {/* ── Perks ────────────────────────────────────────────────────────── */}
      <Section
        heading="What we offer"
        sub="The boring-but-important things, done properly."
        className="bg-base-surface/40 border-y border-border-subtle"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PERKS.map((p, i) => (
            <FadeIn key={p.title} delay={i * 0.06}>
              <FeatureCard icon={p.icon} title={p.title} desc={p.desc} />
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ── Process ──────────────────────────────────────────────────────── */}
      <Section heading="Our hiring process" narrow>
        <div className="space-y-3">
          {[
            { step: 'Application',    desc: 'You apply. We read every single one — a human, not a filter.' },
            { step: 'Intro call',     desc: '30 minutes with the hiring manager. Mutual sniff test, no whiteboards.' },
            { step: 'Paid work trial', desc: 'A realistic take-home or a paid day of work. We pay for your time, always.' },
            { step: 'Team conversation', desc: 'Meet two people you would work with daily. Ask us the hard questions.' },
            { step: 'Offer',          desc: 'Decision within 48 hours of the last conversation. No ghosting, ever.' },
          ].map((s, i) => (
            <FadeIn key={s.step} delay={i * 0.06}>
              <div className="flex gap-4 items-start bg-base-surface border border-border-subtle rounded-xl p-4">
                <span className="shrink-0 w-7 h-7 rounded-lg bg-accent/10 text-accent font-bold text-xs flex items-center justify-center">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-text-primary text-sm">{s.step}</p>
                  <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      <CTASection
        title="Not looking for a full-time role?"
        sub="You can still teach on FlexAcademy — set your own hours and rate as a verified tutor."
        primaryLabel="Become a tutor"
        primaryTo="/become-a-tutor"
        secondaryLabel="About FlexAcademy"
        secondaryTo="/about"
      />
    </div>
  );
}
