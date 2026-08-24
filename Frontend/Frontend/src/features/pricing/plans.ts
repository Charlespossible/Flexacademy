import { api } from '@/lib/axios';
import type { ApiSuccess } from '@/types';

/**
 * The plan ladder — PRICING_SPEC.md §2.
 *
 * Rule 2: prices are never hardcoded. There are deliberately **no price
 * literals in this file**. Everything comes from `GET /subscriptions/plans`,
 * which reads `pricing.config.json` on the server — the same source the
 * checkout prices against, so the storefront cannot quote a figure the
 * payment provider will not honour.
 *
 * Rule 1: money crosses the wire as integer kobo. `naira()` is the only place
 * it becomes a display string, and nothing multiplies or divides it elsewhere.
 */

export interface Plan {
  id: string;
  name: string;
  termMonths: number;
  /** Total charged over the term, in kobo. */
  priceKobo: number;
  /** Number of separate charges. >1 means instalments. */
  charges: number;
  discountPercent: number;
  isDefault: boolean;
  /** Live 1:1 sessions granted per term — §8. Not per month. */
  includedLiveSessions: number;
  blurb: string;
}

/**
 * The paid trial — §9. Priced in days, not months, and credited toward the
 * first plan, so it is an entry point rather than a rung on the ladder.
 */
export interface Trial {
  name: string;
  priceKobo: number;
  durationDays: number;
  /** Comes off the first plan. 0 when the config does not credit it. */
  creditKobo: number;
  onePerHousehold: boolean;
  blurb: string;
}

export interface PlanLadder {
  configVersion: string;
  currency: string;
  /** One month at full price: what every discount is measured against. */
  anchorMonthlyKobo: number;
  /** Plans on sale right now — already filtered for seasonal windows. */
  plans: Plan[];
  /** An option against the annual plan rather than a rung of the ladder. */
  installmentOption: Plan | null;
  /** Null when the trial is switched off in config. */
  trial: Trial | null;
}

/** What a plan actually costs up front once the trial credit is applied. */
export function priceAfterTrialCredit(plan: Plan, trial: Trial | null): number {
  if (!trial) return plan.priceKobo;
  return Math.max(0, plan.priceKobo - trial.creditKobo);
}

export const pricingService = {
  /** GET /subscriptions/plans — the canonical ladder. */
  async getPlans(): Promise<PlanLadder> {
    const res = await api.get<ApiSuccess<PlanLadder>>('/subscriptions/plans');
    return res.data.data;
  },
};

// ─── Display helpers ─────────────────────────────────────────────────────────

/** Kobo → "₦45,000". Whole naira only — §13 forbids .99 pricing. */
export function naira(kobo: number): string {
  return `₦${Math.round(kobo / 100).toLocaleString('en-NG')}`;
}

/** What the plan works out to per month. Rounded for display only. */
export function effectiveMonthlyKobo(plan: Plan): number {
  return Math.round(plan.priceKobo / plan.termMonths);
}

/** Naira saved against paying monthly for the same duration. */
export function savingsKobo(plan: Plan, anchorMonthlyKobo: number): number {
  return anchorMonthlyKobo * plan.termMonths - plan.priceKobo;
}

/**
 * "3 months free" outperforms "25% off" (§13) — but only when the arithmetic
 * lands on a whole month. Returns null when it doesn't, so the caller falls
 * back to the naira figure rather than printing "2.4 months free".
 */
export function monthsFree(plan: Plan, anchorMonthlyKobo: number): number | null {
  const saved = savingsKobo(plan, anchorMonthlyKobo);
  if (saved <= 0) return null;
  const months = saved / anchorMonthlyKobo;
  return Number.isInteger(months) ? months : null;
}

/** Per-charge amount, for instalment plans. */
export function perChargeKobo(plan: Plan): number {
  return Math.round(plan.priceKobo / plan.charges);
}

/** The pre-selected plan. §13: default the selector to annual. */
export function defaultPlan(plans: Plan[]): Plan | undefined {
  return plans.find((p) => p.isDefault) ?? plans[0];
}
