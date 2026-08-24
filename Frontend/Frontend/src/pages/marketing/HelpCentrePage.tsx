import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LifeBuoy, Search, Rocket, CreditCard, Brain, GraduationCap,
  UserCog, ShieldAlert, MessageSquare, Mail, ArrowRight,
} from 'lucide-react';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { PageHero, Section, FadeIn } from '@/components/marketing/MarketingKit';

type Article = { q: string; a: string; topic: Topic };
type Topic =
  | 'Getting started' | 'Billing & plans' | 'AI tutor'
  | 'Tutors & sessions' | 'Account' | 'Trouble';

const TOPICS: { name: Topic; icon: React.ElementType; blurb: string }[] = [
  { name: 'Getting started',    icon: Rocket,      blurb: 'Set up your account and first study plan' },
  { name: 'Billing & plans',    icon: CreditCard,  blurb: 'Payments, upgrades, refunds and receipts' },
  { name: 'AI tutor',           icon: Brain,       blurb: 'How FlexBot works and what it can do' },
  { name: 'Tutors & sessions',  icon: GraduationCap, blurb: 'Booking, rescheduling and tutor matching' },
  { name: 'Account',            icon: UserCog,     blurb: 'Profile, password, linked children' },
  { name: 'Trouble',            icon: ShieldAlert, blurb: 'Something is broken or behaving oddly' },
];

const ARTICLES: Article[] = [
  { topic: 'Getting started', q: 'How do I choose my exam and subjects?', a: 'After signing up you will be walked through onboarding, where you pick your target exam (WAEC, JAMB, NECO and others) and the subjects you are sitting. You can change these any time from Settings → Learning profile.' },
  { topic: 'Getting started', q: 'What is the difference between the free and paid plans?', a: 'The free plan gives you the past-question bank, basic flashcards and a limited number of AI tutor messages per day. Paid plans unlock unlimited AI tutoring, exam simulation, gap detection, study plans and human tutor booking. See the pricing page for a full comparison.' },
  { topic: 'Getting started', q: 'Can I use FlexAcademy offline?', a: 'Flashcards and downloaded question sets work offline and sync when you reconnect. The AI tutor and live sessions need a connection.' },

  { topic: 'Billing & plans', q: 'Which payment methods do you accept?', a: 'We accept Nigerian debit and credit cards, bank transfers and USSD through our payment partner. Card details are never stored on our servers.' },
  { topic: 'Billing & plans', q: 'How do I cancel my subscription?', a: 'Go to Settings → Subscription and choose Cancel plan. You keep full access until the end of the period you have already paid for — we do not cut you off mid-cycle.' },
  { topic: 'Billing & plans', q: 'Can I get a refund?', a: 'Yes, within 7 days of your first payment on any plan, no questions asked. Contact support with your account email and we will process it within three business days.' },
  { topic: 'Billing & plans', q: 'Do you offer discounts for families?', a: 'Family plans cover up to four children under one subscription at a significant discount versus individual plans. Schools get separate institutional pricing.' },

  { topic: 'AI tutor', q: 'Will the AI just give my child the answers?', a: 'No. FlexBot is built to explain and question rather than solve. When a student asks for an answer outright, it responds with a guided method and checks understanding along the way. Parents can review every conversation.' },
  { topic: 'AI tutor', q: 'What subjects does the AI tutor cover?', a: 'All core WAEC and JAMB subjects, plus the international boards we support. Coverage is deepest in Mathematics, the sciences and English.' },
  { topic: 'AI tutor', q: 'Is the AI tutor available to tutors and parents?', a: 'FlexBot is a student-facing study aid, so it is available on student accounts. Tutors get the gap-report tooling instead, and parents get progress dashboards.' },

  { topic: 'Tutors & sessions', q: 'How are tutors matched to me?', a: 'We match on subject, exam board, your current gap profile and tutor availability. You can also browse and book a specific tutor directly.' },
  { topic: 'Tutors & sessions', q: 'Can I reschedule a booked session?', a: 'Yes, free of charge up to 12 hours before the session. Inside 12 hours the session is charged, since your tutor has reserved the slot.' },
  { topic: 'Tutors & sessions', q: 'Are tutors background-checked?', a: 'Every tutor submits qualifications and two professional references, which our team verifies before approving the account. Approved tutors carry a verified badge.' },

  { topic: 'Account', q: 'I forgot my password.', a: 'Use the "Forgot password?" link on the login page. A reset link is emailed to you and stays valid for one hour.' },
  { topic: 'Account', q: 'How do I link my child\'s account?', a: 'Create a Parent account, then go to your parent dashboard and choose Link a child. Enter their FlexAcademy email — they will get a request to approve the link.' },
  { topic: 'Account', q: 'How do I delete my account and data?', a: 'Settings → Account → Delete account. This permanently removes your personal data within 30 days. Anonymised performance statistics may be retained for research.' },

  { topic: 'Trouble', q: 'The app is slow or not loading.', a: 'First try a hard refresh and check your connection. If it persists, tell us your device, browser and roughly when it started — that detail genuinely speeds up the fix.' },
  { topic: 'Trouble', q: 'My payment went through but my plan did not upgrade.', a: 'Bank confirmations occasionally lag by a few minutes. If it has been more than 30 minutes, contact support with your payment reference and we will resolve it manually.' },
  { topic: 'Trouble', q: 'A question or answer looks wrong.', a: 'Use the "Report" flag on the question itself. Our curriculum team reviews every report, and we credit students who find genuine errors.' },
];

export default function HelpCentrePage() {
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState<Topic | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ARTICLES.filter((a) => {
      const matchesTopic = !topic || a.topic === topic;
      const matchesQuery = !q || a.q.toLowerCase().includes(q) || a.a.toLowerCase().includes(q);
      return matchesTopic && matchesQuery;
    });
  }, [query, topic]);

  const searching = query.trim().length > 0 || topic !== null;

  return (
    <div className="bg-base">
      <PageHero
        eyebrow="Help centre"
        eyebrowIcon={LifeBuoy}
        title="How can we"
        highlight="help?"
        subtitle="Search our guides, or browse by topic. If you cannot find what you need, our support team replies within 24 hours."
      >
        <div className="max-w-lg mx-auto">
          <Input
            placeholder="Search for an answer…"
            leftIcon={<Search size={15} />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </PageHero>

      {/* ── Topic grid ───────────────────────────────────────────────────── */}
      <Section className="pt-12 pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOPICS.map((t, i) => {
            const active = topic === t.name;
            return (
              <FadeIn key={t.name} delay={i * 0.05}>
                <button
                  onClick={() => setTopic(active ? null : t.name)}
                  className={cn(
                    'w-full h-full text-left bg-base-surface border rounded-2xl p-5 transition-colors',
                    active
                      ? 'border-accent/40 bg-accent/5'
                      : 'border-border-subtle hover:border-border-active'
                  )}
                >
                  <div
                    className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center mb-3',
                      active ? 'bg-accent/15' : 'bg-accent/10'
                    )}
                  >
                    <t.icon size={16} className="text-accent" />
                  </div>
                  <h3 className="font-display font-semibold text-text-primary text-sm mb-1">
                    {t.name}
                  </h3>
                  <p className="text-xs text-text-muted leading-relaxed">{t.blurb}</p>
                </button>
              </FadeIn>
            );
          })}
        </div>
      </Section>

      {/* ── Articles ─────────────────────────────────────────────────────── */}
      <Section narrow className="pt-4">
        <FadeIn className="flex items-center justify-between gap-4 mb-5 flex-wrap">
          <h2 className="font-display text-lg font-bold text-text-primary">
            {searching ? `${results.length} result${results.length === 1 ? '' : 's'}` : 'Common questions'}
            {topic && <span className="ml-2 text-sm font-normal text-accent">· {topic}</span>}
          </h2>
          {searching && (
            <button
              onClick={() => { setQuery(''); setTopic(null); }}
              className="text-xs text-text-muted hover:text-accent transition-colors"
            >
              Clear filters
            </button>
          )}
        </FadeIn>

        {results.length === 0 ? (
          <FadeIn>
            <div className="text-center bg-base-surface border border-dashed border-border-subtle rounded-2xl py-12 px-6">
              <p className="text-sm text-text-secondary mb-1">No articles match that search.</p>
              <p className="text-xs text-text-muted mb-5">
                Try different words, or just ask us directly — a human will answer.
              </p>
              <Button asChild size="sm">
                <Link to="/contact?category=support">Contact support</Link>
              </Button>
            </div>
          </FadeIn>
        ) : (
          <div className="space-y-3">
            {results.map((a, i) => (
              <FadeIn key={a.q} delay={Math.min(i * 0.04, 0.3)}>
                <details className="group bg-base-surface border border-border-subtle rounded-xl overflow-hidden">
                  <summary className="flex items-start justify-between gap-4 px-5 py-4 cursor-pointer list-none">
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-text-primary">{a.q}</span>
                      {!topic && (
                        <span className="block text-2xs uppercase tracking-wider text-text-muted mt-1">
                          {a.topic}
                        </span>
                      )}
                    </div>
                    <span className="text-text-muted text-lg leading-none shrink-0 group-open:rotate-45 transition-transform">
                      +
                    </span>
                  </summary>
                  <div className="px-5 pb-4 text-sm text-text-muted leading-relaxed">{a.a}</div>
                </details>
              </FadeIn>
            ))}
          </div>
        )}
      </Section>

      {/* ── Still stuck ──────────────────────────────────────────────────── */}
      <Section narrow className="bg-base-surface/40 border-y border-border-subtle">
        <FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-base-surface border border-border-subtle rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <MessageSquare size={17} className="text-accent" />
              </div>
              <h3 className="font-display font-semibold text-text-primary mb-2">Live chat</h3>
              <p className="text-sm text-text-muted leading-relaxed mb-4">
                Available 24/7 from inside the app. Fastest route for anything urgent.
              </p>
              <Button asChild variant="secondary" size="sm">
                <Link to="/dashboard">Open the app</Link>
              </Button>
            </div>

            <div className="bg-base-surface border border-border-subtle rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-blue-400/10 flex items-center justify-center mb-4">
                <Mail size={17} className="text-blue-400" />
              </div>
              <h3 className="font-display font-semibold text-text-primary mb-2">Email support</h3>
              <p className="text-sm text-text-muted leading-relaxed mb-4">
                Reply within 24 hours on business days. Good for billing and account issues.
              </p>
              <Button asChild variant="secondary" size="sm">
                <Link to="/contact?category=support">
                  Contact us
                  <ArrowRight size={14} />
                </Link>
              </Button>
            </div>
          </div>
        </FadeIn>
      </Section>
    </div>
  );
}
