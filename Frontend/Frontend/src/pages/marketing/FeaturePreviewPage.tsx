import { Link } from 'react-router-dom';
import {
  FileQuestion, CalendarDays, Video, Award,
  CheckCircle2, ArrowRight, Bell,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import {
  PageHero, Section, FadeIn, FeatureCard, ComingSoonBadge,
} from '@/components/marketing/MarketingKit';

// ─── Feature registry ─────────────────────────────────────────────────────────
type FeatureKey = 'questions' | 'study-plans' | 'live-classes' | 'certificates';

type Feature = {
  icon: React.ElementType;
  eyebrow: string;
  title: string;
  highlight: string;
  subtitle: string;
  /** Route a signed-in user can already use today, if any. */
  liveRoute?: { to: string; label: string };
  highlights: { icon: React.ElementType; title: string; desc: string }[];
  bullets: string[];
};

const FEATURES: Record<FeatureKey, Feature> = {
  questions: {
    icon: FileQuestion,
    eyebrow: 'Past questions',
    title: 'Every past question,',
    highlight: 'properly explained.',
    subtitle:
      'Two decades of WAEC, JAMB and NECO papers — indexed by topic, verified by our curriculum team, and paired with a worked solution rather than just a letter.',
    liveRoute: { to: '/courses', label: 'Browse courses' },
    highlights: [
      { icon: FileQuestion, title: 'Twenty years deep',    desc: 'Papers from 2005 onward across ten examinations, tagged down to sub-topic level.' },
      { icon: CheckCircle2, title: 'Verified solutions',   desc: 'Every answer is checked by a subject specialist. Report an error and we credit you.' },
      { icon: CalendarDays, title: 'Filter by anything',   desc: 'Year, topic, difficulty, or the specific gaps our engine found in your own work.' },
    ],
    bullets: [
      'Practise by topic instead of grinding whole papers',
      'See how often each topic has actually appeared, year by year',
      'Every wrong answer feeds your gap profile automatically',
    ],
  },

  'study-plans': {
    icon: CalendarDays,
    eyebrow: 'Study plans',
    title: 'A revision timetable',
    highlight: 'that adapts to you.',
    subtitle:
      'Tell us your exam date and how many hours a week you have. We build the schedule, then rebuild it every week based on what you actually mastered.',
    liveRoute: { to: '/dashboard', label: 'Open dashboard' },
    highlights: [
      { icon: CalendarDays, title: 'Built around your date', desc: 'Work backwards from May. The plan front-loads the topics that carry the most marks.' },
      { icon: CheckCircle2, title: 'Rebuilt weekly',         desc: 'Miss a session or bomb a quiz and next week reshuffles. No guilt, just a new plan.' },
      { icon: Bell,         title: 'Gentle accountability',  desc: 'Daily reminders you can actually turn off, plus a weekly review of what moved.' },
    ],
    bullets: [
      'Balances your weak subjects against the ones worth the most marks',
      'Respects the hours you actually have, not an idealised timetable',
      'Slots in spaced-repetition reviews automatically',
    ],
  },

  'live-classes': {
    icon: Video,
    eyebrow: 'Live classes',
    title: 'Live sessions with',
    highlight: 'verified tutors.',
    subtitle:
      'Book a one-to-one or small-group session with a vetted tutor who has already read your gap report — so the first twenty minutes are not spent working out what you do not know.',
    liveRoute: { to: '/become-a-tutor', label: 'Teach a class' },
    highlights: [
      { icon: Video,        title: 'One-to-one or group',   desc: 'Private sessions for deep gaps, small groups for topic revision at a lower cost.' },
      { icon: CheckCircle2, title: 'Verified tutors only',  desc: 'Credentials and references checked before any tutor can take a booking.' },
      { icon: CalendarDays, title: 'Book around school',    desc: 'Evening and weekend slots, rescheduling free up to 12 hours before.' },
    ],
    bullets: [
      'Your tutor arrives already briefed on your specific gaps',
      'Session notes and recordings saved to your account afterwards',
      'Parents can read the notes and message the tutor directly',
    ],
  },

  certificates: {
    icon: Award,
    eyebrow: 'Certificates',
    title: 'Proof of what',
    highlight: 'you have mastered.',
    subtitle:
      'Complete a subject track and earn a verifiable FlexAcademy certificate — with a shareable link that shows exactly which topics you demonstrated mastery in.',
    liveRoute: { to: '/progress', label: 'View my progress' },
    highlights: [
      { icon: Award,        title: 'Topic-level detail',   desc: 'Not a participation trophy. The certificate lists the specific competencies you proved.' },
      { icon: CheckCircle2, title: 'Independently verifiable', desc: 'Each certificate carries a unique link anyone can check against our register.' },
      { icon: Video,        title: 'Share anywhere',       desc: 'Add to LinkedIn, a scholarship application, or a school portfolio in one click.' },
    ],
    bullets: [
      'Earned through demonstrated mastery, not hours logged',
      'Recognised by partner schools in our institutional programme',
      'Free to earn and free to verify, on every plan',
    ],
  },
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function FeaturePreviewPage({ feature: key }: { feature: FeatureKey }) {
  const f = FEATURES[key];
  const user = useAuthStore((s) => s.user);

  const notify = () => {
    toast.success(
      user
        ? 'We will email you the moment this ships.'
        : 'Create a free account and we will let you know when it ships.'
    );
  };

  return (
    <div className="bg-base">
      <PageHero
        eyebrow={f.eyebrow}
        eyebrowIcon={f.icon}
        title={f.title}
        highlight={f.highlight}
        subtitle={f.subtitle}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-brand-xp/8 border border-brand-xp/25">
            <ComingSoonBadge />
            <span className="text-sm text-text-secondary">
              This experience is rolling out over the coming weeks
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button size="lg" onClick={notify}>
              <Bell size={15} />
              Notify me at launch
            </Button>
            {f.liveRoute && (
              <Button asChild variant="secondary" size="lg">
                <Link to={f.liveRoute.to}>
                  {f.liveRoute.label}
                  <ArrowRight size={15} />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </PageHero>

      {/* ── Highlights ───────────────────────────────────────────────────── */}
      <Section heading="What it does" className="pt-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {f.highlights.map((h, i) => (
            <FadeIn key={h.title} delay={i * 0.07}>
              <FeatureCard icon={h.icon} title={h.title} desc={h.desc} />
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ── Bullets ──────────────────────────────────────────────────────── */}
      <Section narrow className="bg-base-surface/40 border-y border-border-subtle">
        <FadeIn>
          <ul className="bg-base-surface border border-border-subtle rounded-2xl divide-y divide-border-subtle overflow-hidden">
            {f.bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 px-5 py-4">
                <CheckCircle2 size={15} className="text-accent shrink-0 mt-0.5" />
                <span className="text-sm text-text-secondary leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>
        </FadeIn>
      </Section>

      {/* ── Meanwhile ────────────────────────────────────────────────────── */}
      <Section narrow>
        <FadeIn>
          <div className="text-center">
            <h2 className="font-display text-xl font-bold text-text-primary mb-3">
              In the meantime
            </h2>
            <p className="text-sm text-text-muted leading-relaxed max-w-lg mx-auto mb-6">
              Everything else on FlexAcademy is live today — the AI tutor, exam simulation, gap
              detection and flashcards. Start there and this will be waiting when it ships.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link to={user ? '/dashboard' : '/register'}>
                  {user ? 'Go to my dashboard' : 'Get started free'}
                  <ArrowRight size={15} />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link to="/pricing">See what&apos;s included</Link>
              </Button>
            </div>
          </div>
        </FadeIn>
      </Section>
    </div>
  );
}
