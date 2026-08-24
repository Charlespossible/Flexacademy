import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Check, ArrowRight, CalendarClock, Sparkles, AlertCircle, Timer } from 'lucide-react';

import {
  pricingService,
  effectiveMonthlyKobo,
  savingsKobo,
  monthsFree,
  perChargeKobo,
  priceAfterTrialCredit,
  defaultPlan,
  naira,
  type Plan,
  type Trial,
} from '@/features/pricing/plans';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

/**
 * The plan ladder, merchandised per PRICING_SPEC.md §13:
 *  - lead with the effective per-month figure, term total in smaller text
 *  - express savings in naira, not percent
 *  - prefer "months free" framing where the arithmetic lands cleanly
 *  - default the selector to annual
 *  - at most three plans on screen at once (the server already applies this)
 *  - publish the renewal price and honour it
 *
 * Prices come from the API, never from this file — see `plans.ts`.
 */

function SavingsLine({ plan, anchor }: { plan: Plan; anchor: number }) {
  const saved = savingsKobo(plan, anchor);
  if (saved <= 0) return null;

  const free = monthsFree(plan, anchor);
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-success">
      <Sparkles size={11} className="shrink-0" />
      {free ? `${free} month${free === 1 ? '' : 's'} free` : `Save ${naira(saved)}`}
      {free && <span className="text-text-muted font-normal">· save {naira(saved)}</span>}
    </span>
  );
}

function PlanCard({
  plan,
  anchor,
  selected,
  onSelect,
}: {
  plan: Plan;
  anchor: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const perMonth = effectiveMonthlyKobo(plan);
  const isAnchorPlan = plan.termMonths === 1;

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18 }}
      aria-pressed={selected}
      className={cn(
        'relative flex flex-col text-left rounded-2xl p-6 h-full border transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
        selected
          ? 'bg-accent/5 border-accent/40 shadow-glow'
          : 'bg-base-surface border-border-subtle hover:border-accent/25'
      )}
    >
      {plan.isDefault && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-accent text-base-elevated text-2xs font-bold uppercase tracking-wider whitespace-nowrap">
          Best value
        </span>
      )}

      <div className="flex items-center justify-between gap-2 mb-4">
        <h3 className="font-display font-bold text-text-primary">{plan.name}</h3>
        <span
          className={cn(
            'w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center',
            selected ? 'border-accent bg-accent' : 'border-border-active'
          )}
        >
          {selected && <Check size={9} className="text-base-elevated" strokeWidth={4} />}
        </span>
      </div>

      {/* Effective monthly leads. The term total is the supporting detail. */}
      <div className="flex items-baseline gap-1">
        <span className="font-display text-3xl font-extrabold text-text-primary">
          {naira(perMonth)}
        </span>
        <span className="text-sm text-text-muted">/month</span>
      </div>

      <p className="text-xs text-text-muted mt-1.5">
        {isAnchorPlan
          ? 'Billed monthly'
          : `Billed ${naira(plan.priceKobo)} every ${plan.termMonths} months`}
      </p>

      <div className="mt-3 min-h-[20px]">
        <SavingsLine plan={plan} anchor={anchor} />
      </div>

      <p className="text-sm text-text-secondary leading-relaxed mt-4 flex-1">{plan.blurb}</p>

      {plan.includedLiveSessions > 0 && (
        <p className="mt-4 pt-4 border-t border-border-subtle text-xs text-text-secondary flex items-start gap-2">
          <Check size={13} className="text-accent mt-0.5 shrink-0" />
          {plan.includedLiveSessions} live 1:1 session
          {plan.includedLiveSessions === 1 ? '' : 's'} with a tutor, included
        </p>
      )}
    </motion.button>
  );
}

/**
 * The paid trial — §9. Rendered as a band above the ladder rather than a
 * fourth card: it is the step *before* choosing a plan, and §13 caps the grid
 * at three. Showing it as a peer would both break that cap and misrepresent
 * seven days as a competing term.
 */
function TrialBand({ trial, selected }: { trial: Trial; selected: Plan }) {
  const afterCredit = priceAfterTrialCredit(selected, trial);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-accent/25 bg-accent/5 p-5">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center shrink-0">
          <Timer size={16} className="text-accent" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary">
            Try everything for {trial.durationDays} days — {naira(trial.priceKobo)}
          </p>
          <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
            {trial.creditKobo > 0 ? (
              <>
                Credited in full toward your first plan, so {selected.name} would then be{' '}
                <span className="text-text-secondary font-medium">{naira(afterCredit)}</span>.
              </>
            ) : (
              trial.blurb
            )}
            {trial.onePerHousehold && ' One per household.'}
          </p>
        </div>
      </div>

      <Button variant="secondary" className="shrink-0" asChild>
        <Link to="/register?plan=trial">Start {trial.durationDays}-day trial</Link>
      </Button>
    </div>
  );
}

function LadderSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-72 rounded-2xl bg-base-elevated animate-pulse" />
      ))}
    </div>
  );
}

export function PricingTable() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['pricing-plans'],
    queryFn: pricingService.getPlans,
    staleTime: 10 * 60_000,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (isLoading) return <div className="pt-4"><LadderSkeleton /></div>;

  if (isError || !data || data.plans.length === 0) {
    // Never invent a price to fill the gap — an incorrect figure here is worse
    // than no figure at all.
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-border-subtle bg-base-surface p-5">
        <AlertCircle size={16} className="text-brand-danger mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="text-text-primary font-medium">Prices are unavailable right now.</p>
          <p className="text-text-muted text-xs mt-0.5">
            Please refresh in a moment, or{' '}
            <Link to="/contact" className="text-accent hover:underline">
              contact us
            </Link>{' '}
            and we will quote you directly.
          </p>
        </div>
      </div>
    );
  }

  const { plans, anchorMonthlyKobo, installmentOption, trial } = data;
  const selected =
    plans.find((p) => p.id === selectedId) ?? defaultPlan(plans) ?? plans[0];
  const showInstallments = selected.id === 'annual' && installmentOption;

  return (
    // pt-4 gives the "Best value" badge room; it is positioned above the card.
    <div className="space-y-6 pt-4">
      {trial && <TrialBand trial={trial} selected={selected} />}

      <div
        className={cn(
          'grid gap-5',
          plans.length >= 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2'
        )}
      >
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            anchor={anchorMonthlyKobo}
            selected={plan.id === selected.id}
            onSelect={() => setSelectedId(plan.id)}
          />
        ))}
      </div>

      {/* Instalments surface only against the annual plan — the barrier is
          having ₦45,000 today, not the value (§13). */}
      {showInstallments && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-start gap-3 rounded-xl bg-base-surface border border-border-subtle p-4"
        >
          <CalendarClock size={16} className="text-accent mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="text-text-primary font-medium">
              Prefer to spread it? {installmentOption.charges} payments of{' '}
              {naira(perChargeKobo(installmentOption))}.
            </p>
            <p className="text-text-muted text-xs mt-0.5">
              {naira(installmentOption.priceKobo)} in total — still{' '}
              {naira(savingsKobo(installmentOption, anchorMonthlyKobo))} less than paying
              monthly.
            </p>
          </div>
        </motion.div>
      )}

      {/* Summary + CTA. Renewal price is published up front, never a jump. */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-base-surface border border-border-subtle p-5">
        <div>
          <p className="text-sm text-text-primary">
            <span className="font-semibold">{selected.name}</span> —{' '}
            {naira(effectiveMonthlyKobo(selected))}/month
            {selected.termMonths > 1 && (
              <span className="text-text-muted">
                , billed as {naira(selected.priceKobo)}
              </span>
            )}
          </p>
          <p className="text-xs text-text-muted mt-1">
            Renews at {naira(selected.priceKobo)} every {selected.termMonths}{' '}
            {selected.termMonths === 1 ? 'month' : 'months'}. No introductory rate, no jump.
          </p>
        </div>

        <Button size="lg" className="shrink-0 shadow-glow gap-2" asChild>
          <Link to={`/register?plan=${selected.id}`}>
            Get FlexPass
            <ArrowRight size={15} />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default PricingTable;
