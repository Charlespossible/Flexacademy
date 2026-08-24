import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Gift, Copy, Check, Share2, Users, Wallet, Trophy,
  UserPlus, CreditCard, Sparkles, ArrowRight, Twitter, Facebook,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import {
  PageHero, Section, FadeIn, FeatureCard, CTASection, StatStrip,
} from '@/components/marketing/MarketingKit';

// ─── Reward tiers ─────────────────────────────────────────────────────────────
const TIERS = [
  { referrals: '1 – 4',   perFriend: '₦1,000', bonus: '—',          label: 'Starter'   },
  { referrals: '5 – 14',  perFriend: '₦1,500', bonus: '1 month free', label: 'Advocate'  },
  { referrals: '15 – 29', perFriend: '₦2,000', bonus: '3 months free', label: 'Champion'  },
  { referrals: '30+',     perFriend: '₦2,500', bonus: 'Elite for life', label: 'Legend'   },
];

const STEPS = [
  { icon: Share2,   title: 'Share your link',   desc: 'Send your unique referral link to friends, classmates or your study group.' },
  { icon: UserPlus, title: 'They sign up',      desc: 'Your friend creates a free FlexAcademy account using your link.' },
  { icon: CreditCard, title: 'They subscribe',  desc: 'Once they upgrade to any paid plan, your reward unlocks automatically.' },
  { icon: Wallet,   title: 'You both get paid', desc: 'You earn cash credit, they get 20% off their first month. Everybody wins.' },
];

const FAQS = [
  { q: 'When do I get paid?',            a: 'Rewards are credited to your FlexAcademy wallet within 48 hours of your friend\'s first successful payment. You can withdraw to any Nigerian bank account once your balance reaches ₦5,000.' },
  { q: 'Is there a limit to referrals?', a: 'No limit. The more friends you bring, the higher your tier and the more you earn per referral.' },
  { q: 'Can I refer my school?',         a: 'Yes — and you should. Schools referred through your link qualify for our institutional programme, and you earn a bulk commission. Contact us for details.' },
  { q: 'What if my friend cancels?',     a: 'Rewards are locked in after your friend completes their first billing cycle. Cancellations after that do not affect what you have already earned.' },
];

export default function ReferralsPage() {
  const user = useAuthStore((s) => s.user);
  const [copied, setCopied] = useState(false);

  // Referral code derives from the user id; visitors see a sample.
  const code = user ? `FLEX-${user.id.slice(0, 6).toUpperCase()}` : 'FLEX-XXXXXX';
  const link = `${window.location.origin}/register?ref=${code}`;

  const copy = async () => {
    if (!user) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy — please copy it manually.');
    }
  };

  const shareText = encodeURIComponent(
    'I use FlexAcademy to prep for WAEC & JAMB with an AI tutor. Sign up with my link and get 20% off:'
  );

  return (
    <div className="bg-base">
      <PageHero
        eyebrow="Referral programme"
        eyebrowIcon={Gift}
        title="Learn together."
        highlight="Earn together."
        subtitle="Invite your friends to FlexAcademy. They get 20% off their first month — you earn up to ₦2,500 in cash credit for every one who subscribes."
      />

      {/* ── Referral link panel ──────────────────────────────────────────── */}
      <Section narrow className="pt-12 pb-4">
        <FadeIn>
          <div className="relative overflow-hidden bg-base-surface border border-accent/20 rounded-2xl p-6 sm:p-8">
            <div
              className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-40 pointer-events-none"
              style={{ background: 'radial-gradient(circle, var(--accent-glow), transparent 70%)' }}
            />

            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={14} className="text-accent" />
                <h2 className="font-display font-semibold text-text-primary">
                  {user ? 'Your referral link' : 'Your link is one sign-up away'}
                </h2>
              </div>
              <p className="text-sm text-text-muted mb-5">
                {user
                  ? 'Share this anywhere — WhatsApp, class group chats, Twitter.'
                  : 'Create a free account to unlock your personal referral link and start earning.'}
              </p>

              {/* Link row */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div
                  className={cn(
                    'flex-1 min-w-0 flex items-center px-4 h-12 rounded-xl',
                    'bg-base-elevated border border-border-subtle',
                    !user && 'opacity-50 select-none'
                  )}
                >
                  <span className="font-mono text-sm text-text-secondary truncate">{link}</span>
                </div>

                {user ? (
                  <Button size="lg" onClick={copy} className="shrink-0 h-12">
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copied' : 'Copy link'}
                  </Button>
                ) : (
                  <Button asChild size="lg" className="shrink-0 h-12">
                    <Link to="/register">
                      Get my link
                      <ArrowRight size={16} />
                    </Link>
                  </Button>
                )}
              </div>

              {/* Social share */}
              {user && (
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-xs text-text-muted mr-1">Share via</span>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(link)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Share on Twitter"
                    className="w-8 h-8 rounded-lg bg-base-elevated border border-border-subtle flex items-center justify-center text-text-muted hover:text-accent hover:border-accent/30 transition-colors"
                  >
                    <Twitter size={14} />
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Share on Facebook"
                    className="w-8 h-8 rounded-lg bg-base-elevated border border-border-subtle flex items-center justify-center text-text-muted hover:text-accent hover:border-accent/30 transition-colors"
                  >
                    <Facebook size={14} />
                  </a>
                  <a
                    href={`https://wa.me/?text=${shareText}%20${encodeURIComponent(link)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Share on WhatsApp"
                    className="px-3 h-8 rounded-lg bg-base-elevated border border-border-subtle flex items-center justify-center text-xs font-medium text-text-muted hover:text-accent hover:border-accent/30 transition-colors"
                  >
                    WhatsApp
                  </a>
                </div>
              )}
            </div>
          </div>
        </FadeIn>
      </Section>

      {/* ── Live stats (only meaningful once signed in) ──────────────────── */}
      {user && (
        <Section narrow className="py-6">
          <StatStrip
            stats={[
              { value: '0',      label: 'Friends invited'  },
              { value: '0',      label: 'Subscribed'       },
              { value: '₦0',     label: 'Earned'           },
              { value: 'Starter', label: 'Current tier'    },
            ]}
          />
        </Section>
      )}

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <Section heading="How it works" sub="Four steps. No paperwork, no waiting around.">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((s, i) => (
            <FadeIn key={s.title} delay={i * 0.08}>
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

      {/* ── Reward tiers ─────────────────────────────────────────────────── */}
      <Section
        heading="Reward tiers"
        sub="Your earnings scale as you bring more people in. Tiers reset every calendar year."
        className="bg-base-surface/40 border-y border-border-subtle"
      >
        <FadeIn>
          {/* Scrolls horizontally on small screens rather than breaking the layout */}
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[520px] border-separate border-spacing-0">
              <thead>
                <tr className="text-left">
                  {['Tier', 'Referrals', 'Per friend', 'Milestone bonus'].map((h) => (
                    <th
                      key={h}
                      className="text-xs font-semibold uppercase tracking-widest text-text-muted pb-3 px-4"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIERS.map((t, i) => (
                  <tr key={t.label}>
                    <td className={cn('px-4 py-4 bg-base-surface border-y border-l border-border-subtle rounded-l-xl', i > 0 && 'pt-4')}>
                      <span className="inline-flex items-center gap-2 font-display font-semibold text-text-primary text-sm">
                        <Trophy size={13} className="text-brand-xp" />
                        {t.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 bg-base-surface border-y border-border-subtle text-sm text-text-secondary">
                      {t.referrals}
                    </td>
                    <td className="px-4 py-4 bg-base-surface border-y border-border-subtle text-sm font-semibold text-accent">
                      {t.perFriend}
                    </td>
                    <td className="px-4 py-4 bg-base-surface border-y border-r border-border-subtle rounded-r-xl text-sm text-text-secondary">
                      {t.bonus}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <p className="text-xs text-text-muted text-center mt-6 max-w-xl mx-auto">
            Payouts are made to any Nigerian bank account once your balance reaches ₦5,000.
            Referral credit can also be applied directly to your own subscription.
          </p>
        </FadeIn>
      </Section>

      {/* ── Why refer ────────────────────────────────────────────────────── */}
      <Section heading="Why students love it">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FadeIn delay={0}>
            <FeatureCard
              icon={Wallet}
              title="Real cash, not points"
              desc="Withdraw to your bank account or put it toward your own subscription. Your call."
            />
          </FadeIn>
          <FadeIn delay={0.08}>
            <FeatureCard
              icon={Users}
              title="Study groups earn more"
              desc="Refer your whole class and you will hit Champion tier before your first CA."
              accent="text-blue-400"
              bg="bg-blue-400/10"
            />
          </FadeIn>
          <FadeIn delay={0.16}>
            <FeatureCard
              icon={Gift}
              title="Your friend wins too"
              desc="They get 20% off their first month — so it never feels like you are selling to them."
              accent="text-brand-xp"
              bg="bg-brand-xp/10"
            />
          </FadeIn>
        </div>
      </Section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <Section heading="Questions" narrow className="bg-base-surface/40 border-y border-border-subtle">
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
        title="Start earning this week"
        sub="It takes about ten seconds to grab your link."
        primaryLabel={user ? 'Back to my dashboard' : 'Create free account'}
        primaryTo={user ? '/dashboard' : '/register'}
        secondaryLabel="See pricing"
        secondaryTo="/pricing"
      />
    </div>
  );
}
