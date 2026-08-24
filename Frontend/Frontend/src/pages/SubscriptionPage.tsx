import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Zap, Sparkles, ArrowRight, Brain, BookOpen, Target, Users, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { paymentService } from '@/features/payment/paymentService';
import {
  pricingService,
  effectiveMonthlyKobo,
  savingsKobo,
  defaultPlan,
  naira,
} from '@/features/pricing/plans';
import type { SubscriptionTier } from '@/types';

const isFlexPass = (tier: SubscriptionTier) =>
  tier === 'BASIC' || tier === 'PRO' || tier === 'ELITE';

const FREE_FEATURES = [
  'Preview first 2 lessons per subject',
  '5 AI Tutor messages per day',
  'Basic flashcard decks',
  '10 quiz questions per day',
  'Leaderboard — view only',
  'Basic progress overview',
];

const FLEXPASS_FEATURES = [
  'All curriculum lessons — primary & secondary school',
  'Unlimited FlexBot AI Tutor, 24/7',
  'Full flashcard system with spaced repetition',
  'Gap detection from quizzes, flashcards & AI conversations',
  'Assigned tutor automatically alerted when you struggle',
  'Full exam simulation — WAEC, JAMB, NECO & more',
  'AI-generated personalised study plans',
  'Full leaderboard, XP & all badges',
  'Complete progress & analytics dashboard',
  'Parent dashboard access',
  'Verifiable digital certificates',
];

// ── Payment return banner ─────────────────────────────────────────────────────

function PaymentReturnBanner({ reference }: { reference: string }) {
  const [status, setStatus] = useState<'verifying' | 'success' | 'pending'>('verifying');

  useEffect(() => {
    paymentService.verifyPayment(reference)
      .then((res) => setStatus(res.status === 'SUCCESS' ? 'success' : 'pending'))
      .catch(() => setStatus('pending'));
  }, [reference]);

  if (status === 'verifying') {
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl border bg-base-surface border-border-subtle">
        <Loader2 size={16} className="text-accent animate-spin" />
        <p className="text-sm text-text-secondary">Confirming your payment…</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3 p-4 rounded-2xl border bg-brand-success/5 border-brand-success/20"
      >
        <CheckCircle2 size={18} className="text-brand-success shrink-0" />
        <div>
          <p className="text-sm font-semibold text-text-primary">FlexPass is active!</p>
          <p className="text-xs text-text-muted mt-0.5">Full access unlocked. Refresh the page if features don't appear immediately.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl border bg-base-surface border-border-subtle">
      <AlertCircle size={16} className="text-yellow-400 shrink-0" />
      <div>
        <p className="text-sm font-medium text-text-primary">Payment is being confirmed</p>
        <p className="text-xs text-text-muted mt-0.5">This can take a moment. Your plan will update automatically once settled.</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function SubscriptionPage() {
  const subscription = useAuthStore((s) => s.subscription);
  const currentTier = (subscription?.tier ?? 'FREE') as SubscriptionTier;
  const onFlexPass = isFlexPass(currentTier);

  const [searchParams] = useSearchParams();
  const paymentReturn = searchParams.get('payment');
  const paymentRef = searchParams.get('ref');

  // Same endpoint the marketing page reads, so the two can never disagree.
  const { data: ladder, isLoading: loadingPlans } = useQuery({
    queryKey: ['pricing-plans'],
    queryFn: pricingService.getPlans,
    staleTime: 10 * 60_000,
  });

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const plans = ladder?.plans ?? [];
  const selectedPlan =
    plans.find((p) => p.id === selectedPlanId) ?? defaultPlan(plans);

  const checkoutMutation = useMutation({
    mutationFn: (planId: string) => paymentService.initiateCheckout(planId),
    onSuccess: (data) => {
      if (data.checkoutLink) {
        window.location.href = data.checkoutLink;
      } else {
        toast.error('Could not open payment page. Please try again.');
      }
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to start checkout. Please try again.');
    },
  });

  const handleUpgrade = () => {
    if (!selectedPlan) {
      toast.error('Prices are still loading. One moment.');
      return;
    }
    checkoutMutation.mutate(selectedPlan.id);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">Subscription</h1>
        <p className="text-sm text-text-muted mt-1">Manage your plan and billing.</p>
      </div>

      {/* Payment return banner */}
      <AnimatePresence>
        {paymentReturn === 'success' && paymentRef && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <PaymentReturnBanner reference={paymentRef} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current plan banner */}
      {subscription && (
        <div className={cn(
          'flex items-center gap-4 p-5 rounded-2xl border',
          onFlexPass ? 'bg-accent/5 border-accent/25' : 'bg-base-elevated border-border-subtle'
        )}>
          <div className="flex-1">
            <p className="text-xs text-text-muted font-medium uppercase tracking-wide mb-1.5">
              Current plan
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border',
                onFlexPass
                  ? 'bg-accent/10 border-accent/25 text-accent'
                  : 'bg-base-subtle border-border-subtle text-text-muted'
              )}>
                {onFlexPass ? <Sparkles size={11} /> : <Zap size={11} />}
                {onFlexPass ? 'FlexPass' : 'Free'}
              </span>
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full border font-medium',
                subscription.status === 'ACTIVE'
                  ? 'bg-brand-success/10 border-brand-success/20 text-brand-success'
                  : 'bg-base-subtle border-border-subtle text-text-muted'
              )}>
                {subscription.status}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-2">
              {onFlexPass
                ? 'You have full access to every feature on FlexAcademy.'
                : 'Upgrade to FlexPass to unlock the complete platform.'}
            </p>
          </div>
          {onFlexPass && subscription.currentPeriodEnd && (
            <p className="text-xs text-text-muted shrink-0">
              Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
      )}

      {/* Plan cards */}
      <div className="grid sm:grid-cols-2 gap-5">

        {/* Free */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className={cn(
            'relative flex flex-col gap-5 p-6 rounded-2xl border bg-base-surface',
            !onFlexPass ? 'ring-2 ring-accent/20 border-border-subtle' : 'border-border-subtle'
          )}
        >
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap size={16} className="text-text-muted" />
              <h3 className="font-display font-bold text-text-primary">Free</h3>
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="font-display text-3xl font-extrabold text-text-primary">₦0</span>
              <span className="text-sm text-text-muted">forever</span>
            </div>
            <p className="text-xs text-text-muted">A taste of the platform — no credit card needed.</p>
          </div>

          <ul className="space-y-2.5 flex-1">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                <Check size={13} className="text-text-muted mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {!onFlexPass ? (
            <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent text-sm font-semibold">
              <Check size={14} />
              Current plan
            </div>
          ) : (
            <div className="py-2.5 rounded-xl text-center text-xs text-text-muted bg-base-elevated border border-border-subtle">
              Your previous plan
            </div>
          )}
        </motion.div>

        {/* FlexPass */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.07 }}
          className={cn(
            'relative flex flex-col gap-5 p-6 rounded-2xl border bg-accent/5',
            onFlexPass ? 'ring-2 ring-accent/30 border-accent/40' : 'border-accent/25'
          )}
        >
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs px-3 py-0.5 rounded-full bg-accent text-base-elevated font-bold shadow-sm whitespace-nowrap">
            ✦ Full access
          </span>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-accent" />
              <h3 className="font-display font-bold text-text-primary">FlexPass</h3>
            </div>
            {loadingPlans || !selectedPlan ? (
              <div className="h-9 w-32 rounded-lg bg-base-elevated animate-pulse mb-1" />
            ) : (
              <>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="font-display text-3xl font-extrabold text-text-primary">
                    {naira(effectiveMonthlyKobo(selectedPlan))}
                  </span>
                  <span className="text-sm text-text-muted">/month</span>
                </div>
                <p className="text-xs text-text-muted">
                  {selectedPlan.termMonths === 1
                    ? 'Billed monthly'
                    : `Billed ${naira(selectedPlan.priceKobo)} every ${selectedPlan.termMonths} months`}
                </p>
              </>
            )}
          </div>

          {/* Term selector — the same ladder the pricing page shows, since both
              read GET /subscriptions/plans. */}
          {!onFlexPass && plans.length > 1 && ladder && (
            <div className="flex flex-wrap gap-1.5">
              {plans.map((p) => {
                const active = p.id === selectedPlan?.id;
                const saved = savingsKobo(p, ladder.anchorMonthlyKobo);
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlanId(p.id)}
                    aria-pressed={active}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                      active
                        ? 'bg-accent/10 text-accent border-accent/30'
                        : 'bg-base-surface text-text-muted border-border-subtle hover:text-text-primary'
                    )}
                  >
                    {p.name}
                    {saved > 0 && (
                      <span className="ml-1 text-2xs text-brand-success">
                        −{naira(saved)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <ul className="space-y-2.5 flex-1">
            {FLEXPASS_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                <Check size={13} className="text-accent mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {onFlexPass ? (
            <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent text-sm font-semibold">
              <Check size={14} />
              Current plan
            </div>
          ) : (
            <Button
              size="md"
              className="w-full shadow-glow"
              leftIcon={checkoutMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : undefined}
              onClick={handleUpgrade}
              disabled={checkoutMutation.isPending}
            >
              {checkoutMutation.isPending ? 'Opening payment…' : 'Upgrade to FlexPass'}
            </Button>
          )}
        </motion.div>
      </div>

      {/* Why FlexPass works — shown only to free users */}
      {!onFlexPass && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-base-surface border border-border-subtle rounded-2xl p-6 space-y-4"
        >
          <h2 className="font-display font-semibold text-text-primary">Why FlexPass works</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: Brain, title: 'AI that watches silently', desc: 'FlexBot monitors quizzes, flashcard reviews and AI conversations — three independent signals — to detect exactly where you\'re struggling.' },
              { icon: Users, title: 'A tutor in your corner', desc: 'When AI detects a gap, it automatically briefs your assigned tutor. No booking, no waiting — they reach out to you.' },
              { icon: BookOpen, title: 'Full curriculum access', desc: 'Every lesson from primary to secondary school, structured by curriculum and uploaded by vetted Nigerian teachers.' },
              { icon: Target, title: 'Exam simulation', desc: 'WAEC, JAMB, NECO and more — timed full-paper simulations with AI performance analysis after every attempt.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={14} className="text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary mb-0.5">{title}</p>
                  <p className="text-xs text-text-muted leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <Button
            size="md"
            className="w-full gap-2 shadow-glow mt-2"
            leftIcon={checkoutMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : undefined}
            onClick={handleUpgrade}
            disabled={checkoutMutation.isPending}
          >
            {checkoutMutation.isPending
              ? 'Opening payment…'
              : selectedPlan
                ? `Get FlexPass — ${naira(effectiveMonthlyKobo(selectedPlan))}/month`
                : 'Get FlexPass'}
            {!checkoutMutation.isPending && <ArrowRight size={14} />}
          </Button>
        </motion.div>
      )}

      {/* FAQ */}
      <div className="bg-base-surface border border-border-subtle rounded-2xl p-6 space-y-4">
        <h2 className="font-display font-semibold text-text-primary">About billing</h2>
        {[
          ['How does payment work?', 'We use Nomba — a secure Nigerian payment processor. You\'ll be redirected to Nomba\'s hosted checkout page to pay with your card. Your card details never touch our servers.'],
          ['Will my card be charged automatically?', 'Yes — FlexPass is a monthly subscription. Your card is tokenised on the first payment so we can bill you automatically each month without redirecting you again.'],
          ['Can I cancel anytime?', 'Yes — your FlexPass stays active until the end of the current billing period. No cancellation fees, no mid-cycle charges.'],
          ['What happens to my data if I downgrade?', 'All your lessons, flashcards and progress history are preserved. Feature access reverts to the free tier, but nothing is deleted.'],
          ['Do you offer school licences?', 'Yes. Contact us at schools@flexacademy.ng for bulk pricing, admin dashboards and per-student reporting.'],
        ].map(([q, a]) => (
          <div key={q}>
            <p className="text-sm font-medium text-text-primary">{q}</p>
            <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
