import {
  Compass, Heart, Target, Rocket, Users, Globe,
  ShieldCheck, Lightbulb, TrendingUp,
} from 'lucide-react';

import { Avatar } from '@/components/ui/Avatar';
import {
  PageHero, Section, FadeIn, FeatureCard, StatStrip, CTASection,
} from '@/components/marketing/MarketingKit';

const VALUES = [
  { icon: Target,      title: 'Outcomes over hours',   desc: 'We do not measure success in time spent on the app. We measure it in exam scores, admissions and confidence.' },
  { icon: Heart,       title: 'Built for Nigeria',     desc: 'WAEC, JAMB and NECO are not afterthoughts bolted onto a foreign product. They are the reason we exist.' },
  { icon: ShieldCheck, title: 'Honest about AI',       desc: 'Our AI explains, drills and diagnoses. It does not do a student\'s homework for them, and we will never pretend otherwise.' },
  { icon: Globe,       title: 'Access first',          desc: 'Low-bandwidth mode, offline flashcards and a genuinely useful free tier. Cost should never decide who gets to learn.' },
];

const MILESTONES = [
  { year: '2023', title: 'The first whiteboard',  desc: 'Two tutors in Lagos, frustrated that their best students still could not get personalised practice between sessions.' },
  { year: '2024', title: 'FlexAcademy launches',  desc: 'Public beta ships with the AI tutor, past-question bank and the first version of the gap-detection engine.' },
  { year: '2025', title: 'Tutor marketplace',     desc: 'Verified human tutors join the platform, working alongside the AI rather than competing with it.' },
  { year: '2026', title: 'Schools & scale',       desc: 'Institutional dashboards enter pilot with schools across Lagos, Abuja and Port Harcourt.' },
];

const TEAM = [
  { firstName: 'Cosmas',  lastName: 'Nduka',   role: 'Founder & CEO',        bio: 'Former secondary-school maths tutor. Builds the thing he wishes he had at 16.' },
  { firstName: 'Amara',   lastName: 'Obi',     role: 'Head of Learning',     bio: 'Curriculum designer. Owns the mapping between our content and the WAEC/JAMB syllabi.' },
  { firstName: 'Tunde',   lastName: 'Adeyemi', role: 'Engineering Lead',     bio: 'Keeps the platform fast on a 3G connection in Ibadan, not just on office fibre.' },
  { firstName: 'Chioma',  lastName: 'Okafor',  role: 'Student Success',      bio: 'Talks to more Nigerian students in a week than most edtechs do in a year.' },
];

export default function AboutPage() {
  return (
    <div className="bg-base">
      <PageHero
        eyebrow="About us"
        eyebrowIcon={Compass}
        title="Every Nigerian student deserves a"
        highlight="tutor who never sleeps."
        subtitle="FlexAcademy exists because talent is evenly distributed across Nigeria, but access to great teaching is not. We are closing that gap with AI, verified human tutors, and a stubborn focus on exam results."
      />

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <Section className="pt-12 pb-6">
        <StatStrip
          stats={[
            { value: '40,000+', label: 'Students learning' },
            { value: '1.2M',    label: 'Questions answered' },
            { value: '10',      label: 'Exams covered' },
            { value: '92%',     label: 'Report score gains' },
          ]}
        />
      </Section>

      {/* ── Mission ──────────────────────────────────────────────────────── */}
      <Section narrow>
        <FadeIn>
          <div className="bg-base-surface border border-border-subtle rounded-2xl p-7 sm:p-9">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-5">
              <Rocket size={18} className="text-accent" />
            </div>
            <h2 className="font-display text-2xl font-bold text-text-primary mb-4 tracking-tight">
              Our mission
            </h2>
            <div className="space-y-4 text-text-secondary leading-relaxed">
              <p>
                In a typical Nigerian classroom one teacher is responsible for sixty students.
                That teacher is often excellent — but no one can diagnose sixty different sets of
                knowledge gaps, then design sixty different revision plans, every single week.
              </p>
              <p>
                So most students revise blind. They re-read the topics they already understand
                because those feel comfortable, and quietly avoid the ones that will actually cost
                them marks in May.
              </p>
              <p className="text-text-primary font-medium">
                FlexAcademy fixes the diagnosis problem. We find the specific gaps between a student
                and their target score, then close them — with AI explanations, targeted drills,
                and a human tutor when the machine is not enough.
              </p>
            </div>
          </div>
        </FadeIn>
      </Section>

      {/* ── Values ───────────────────────────────────────────────────────── */}
      <Section
        heading="What we believe"
        sub="Four principles that decide what we build and, more often, what we refuse to build."
        className="bg-base-surface/40 border-y border-border-subtle"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {VALUES.map((v, i) => (
            <FadeIn key={v.title} delay={i * 0.07}>
              <FeatureCard icon={v.icon} title={v.title} desc={v.desc} />
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ── Timeline ─────────────────────────────────────────────────────── */}
      <Section heading="How we got here" narrow>
        <div className="relative">
          {/* Spine */}
          <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border-subtle" aria-hidden />

          <div className="space-y-7">
            {MILESTONES.map((m, i) => (
              <FadeIn key={m.year} delay={i * 0.08}>
                <div className="relative flex gap-5">
                  <div className="relative z-10 shrink-0 w-10 h-10 rounded-full bg-base-surface border border-accent/30 flex items-center justify-center">
                    <span className="text-2xs font-bold text-accent">{m.year.slice(2)}</span>
                  </div>
                  <div className="pt-1.5 min-w-0">
                    <div className="flex items-baseline gap-2.5 flex-wrap">
                      <h3 className="font-display font-semibold text-text-primary">{m.title}</h3>
                      <span className="text-xs text-text-muted font-mono">{m.year}</span>
                    </div>
                    <p className="text-sm text-text-muted leading-relaxed mt-1.5">{m.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Team ─────────────────────────────────────────────────────────── */}
      <Section
        heading="The team"
        sub="Small, opinionated, and mostly made up of people who used to teach."
        className="bg-base-surface/40 border-y border-border-subtle"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TEAM.map((p, i) => (
            <FadeIn key={p.firstName + p.lastName} delay={i * 0.07}>
              <div className="h-full bg-base-surface border border-border-subtle rounded-2xl p-6 text-center hover:border-border-active transition-colors">
                <div className="flex justify-center mb-4">
                  <Avatar firstName={p.firstName} lastName={p.lastName} size="lg" />
                </div>
                <h3 className="font-display font-semibold text-text-primary text-sm">
                  {p.firstName} {p.lastName}
                </h3>
                <p className="text-xs text-accent mt-0.5 mb-3">{p.role}</p>
                <p className="text-xs text-text-muted leading-relaxed">{p.bio}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ── Working here ─────────────────────────────────────────────────── */}
      <Section narrow>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FadeIn delay={0}>
            <FeatureCard icon={Lightbulb} title="Ideas beat titles" desc="The best argument wins, whoever makes it." />
          </FadeIn>
          <FadeIn delay={0.08}>
            <FeatureCard icon={Users} title="Remote-friendly" desc="Lagos and Abuja hubs, flexible everywhere else." accent="text-blue-400" bg="bg-blue-400/10" />
          </FadeIn>
          <FadeIn delay={0.16}>
            <FeatureCard icon={TrendingUp} title="Real ownership" desc="Equity for every full-time role, no exceptions." accent="text-brand-xp" bg="bg-brand-xp/10" />
          </FadeIn>
        </div>
      </Section>

      <CTASection
        title="Come build with us"
        sub="Whether that means joining the team, teaching on the platform, or just studying here."
        primaryLabel="See open roles"
        primaryTo="/careers"
        secondaryLabel="Contact us"
        secondaryTo="/contact"
      />
    </div>
  );
}
