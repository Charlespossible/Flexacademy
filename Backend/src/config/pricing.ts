import fs from "fs";
import path from "path";
import { logger } from "../utils/logger";

/**
 * Pricing config loader — PRICING_SPEC.md §0 and Rule 2.
 *
 * The JSON file is the single source of truth for every price on the platform.
 * It is read once at boot, validated against §2's ladder invariants, and cached.
 * A bad price stops the process rather than reaching a customer: §16 puts this
 * ahead of everything else in the build order for exactly that reason.
 *
 * Money is integer kobo throughout (Rule 1). Naira exists only in display code.
 */

export interface PricingPlan {
  id: string;
  name: string;
  term_months: number;
  price_kobo: number;
  charges: number;
  discount_percent: number;
  is_default: boolean;
  included_live_1to1_sessions_per_term: number;
  sell_window_months?: { from: number; to: number };
  displaces_while_selling?: string;
  blurb: string;
}

export interface TrialConfig {
  enabled: boolean;
  name: string;
  price_kobo: number;
  duration_days: number;
  /** How much of the trial fee comes off the first plan. */
  credit_kobo: number;
  credited_to_first_plan: boolean;
  one_per_household: boolean;
  blurb: string;
}

export interface PricingConfig {
  version: string;
  currency: string;
  anchor_monthly_kobo: number;
  plans: PricingPlan[];
  trial?: TrialConfig;
  tax: { rate: number; prices_are_inclusive: boolean };
  payment_processing: {
    verify_before_launch: boolean;
    local_card: {
      percentage: number;
      flat_fee_kobo: number;
      flat_fee_waived_below_kobo: number;
      cap_kobo: number;
    };
  };
  display_rules: Record<string, unknown>;
}

const CONFIG_PATH = path.resolve(process.cwd(), "pricing.config.json");

/**
 * The §2 invariants. Returns human-readable failures rather than throwing, so
 * the caller can report all of them at once instead of one per restart.
 */
export function validatePricingConfig(cfg: PricingConfig): string[] {
  const errors: string[] = [];
  const anchor = cfg.anchor_monthly_kobo;

  if (!Array.isArray(cfg.plans) || cfg.plans.length === 0) {
    return ["config.plans is empty"];
  }

  for (const p of cfg.plans) {
    if (!Number.isInteger(p.price_kobo) || p.price_kobo <= 0) {
      errors.push(`${p.id}: price_kobo must be a positive integer (kobo, not naira)`);
    }
    if (!Number.isInteger(p.term_months) || p.term_months <= 0) {
      errors.push(`${p.id}: term_months must be a positive integer`);
    }
    if (p.price_kobo > anchor * p.term_months) {
      errors.push(`${p.id}: costs more than paying monthly for ${p.term_months} months`);
    }
  }

  // Effective monthly must strictly decrease as term length grows.
  const lump = cfg.plans
    .filter((p) => p.charges === 1)
    .sort((a, b) => a.term_months - b.term_months);
  for (let i = 1; i < lump.length; i++) {
    const prev = lump[i - 1].price_kobo / lump[i - 1].term_months;
    const cur = lump[i].price_kobo / lump[i].term_months;
    if (cur >= prev) {
      errors.push(
        `${lump[i].id}: effective monthly must be strictly lower than ${lump[i - 1].id}`
      );
    }
  }

  const annual = cfg.plans.find((p) => p.id === "annual");
  if (annual && annual.price_kobo / annual.term_months > anchor * 0.8) {
    errors.push("annual: effective monthly must be ≤ 80% of the anchor");
  }

  const inst = cfg.plans.find((p) => p.id === "annual_installments");
  if (annual && inst) {
    if (!(inst.price_kobo > annual.price_kobo && inst.price_kobo < anchor * 12)) {
      errors.push(
        "annual_installments: total must sit strictly between the annual lump sum and 12× monthly"
      );
    }
  }

  const defaults = cfg.plans.filter((p) => p.is_default);
  if (defaults.length !== 1) {
    errors.push(`exactly one plan must be default-selected, found ${defaults.length}`);
  }

  const ids = cfg.plans.map((p) => p.id);
  if (new Set(ids).size !== ids.length) {
    errors.push("plan ids must be unique");
  }
  if (ids.includes("trial")) {
    errors.push(
      'a plan may not use the id "trial" — the trial is configured separately, outside the ladder'
    );
  }

  // The trial sits outside the ladder, so it gets its own rules.
  const t = cfg.trial;
  if (t?.enabled) {
    if (!Number.isInteger(t.price_kobo) || t.price_kobo <= 0) {
      errors.push("trial: price_kobo must be a positive integer (kobo, not naira)");
    }
    if (!Number.isInteger(t.duration_days) || t.duration_days <= 0) {
      errors.push("trial: duration_days must be a positive integer");
    }
    // A trial costing as much as a real plan is not a trial, it is a bad plan.
    const cheapest = Math.min(...cfg.plans.map((p) => p.price_kobo));
    if (t.price_kobo >= cheapest) {
      errors.push(
        `trial: price (${t.price_kobo}) must be below the cheapest plan (${cheapest})`
      );
    }
    // Crediting more than was paid would hand out free money on every signup.
    if (!Number.isInteger(t.credit_kobo) || t.credit_kobo < 0) {
      errors.push("trial: credit_kobo must be a non-negative integer");
    } else if (t.credit_kobo > t.price_kobo) {
      errors.push(
        `trial: credit (${t.credit_kobo}) cannot exceed the trial price (${t.price_kobo})`
      );
    }
  }

  return errors;
}

function load(): PricingConfig {
  let raw: string;
  try {
    raw = fs.readFileSync(CONFIG_PATH, "utf8");
  } catch {
    throw new Error(
      `Pricing config not found at ${CONFIG_PATH}. The platform cannot price anything without it.`
    );
  }

  let cfg: PricingConfig;
  try {
    cfg = JSON.parse(raw) as PricingConfig;
  } catch (err) {
    throw new Error(`Pricing config is not valid JSON: ${(err as Error).message}`);
  }

  const errors = validatePricingConfig(cfg);
  if (errors.length) {
    // Refuse to start. A wrong price that reaches a customer is worse than downtime.
    throw new Error(
      `Pricing config violates the plan ladder invariants:\n  - ${errors.join("\n  - ")}`
    );
  }

  logger.info(
    { version: cfg.version, plans: cfg.plans.length },
    "Pricing config loaded and validated"
  );
  return cfg;
}

/** Loaded once at import; cached for the process lifetime. */
export const pricingConfig: PricingConfig = load();

/** The version a new subscription is sold under — Rule 4. */
export const PRICING_CONFIG_VERSION = pricingConfig.version;

export function getPlan(id: string): PricingPlan | undefined {
  return pricingConfig.plans.find((p) => p.id === id);
}

/** The paid trial, or null when switched off in config. */
export function getTrial(): TrialConfig | null {
  const t = pricingConfig.trial;
  return t?.enabled ? t : null;
}

/**
 * Plans that may be sold right now. Seasonal plans fall outside their window,
 * and a seasonal plan displaces a rung rather than adding one so the storefront
 * stays within the three-plan cap in §13.
 *
 * `annual_installments` is excluded — it is an option on the annual plan, not a
 * competing card — but it remains directly purchasable by id.
 */
export function sellablePlans(now: Date = new Date()): PricingPlan[] {
  const month = now.getMonth() + 1;

  const inWindow = (p: PricingPlan) => {
    if (!p.sell_window_months) return true;
    const { from, to } = p.sell_window_months;
    return month >= from && month <= to;
  };

  const live = pricingConfig.plans.filter(
    (p) => p.id !== "annual_installments" && inWindow(p)
  );

  const displaced = new Set(
    live.flatMap((p) => (p.displaces_while_selling ? [p.displaces_while_selling] : []))
  );

  return live.filter((p) => !displaced.has(p.id));
}

/** True when this plan can be bought today. Guards checkout against off-season sales. */
export function isPurchasable(id: string, now: Date = new Date()): boolean {
  if (id === "annual_installments") return true;
  return sellablePlans(now).some((p) => p.id === id);
}

// ─── Money math — §4 ─────────────────────────────────────────────────────────

/** VAT already contained in a VAT-inclusive gross amount. */
export function vatComponent(grossKobo: number): number {
  const rate = pricingConfig.tax.rate;
  return Math.round((grossKobo * rate) / (1 + rate));
}

/** Processing fee for a single charge. */
export function processingFee(grossKobo: number): number {
  const p = pricingConfig.payment_processing.local_card;
  let fee = grossKobo * p.percentage;
  if (grossKobo >= p.flat_fee_waived_below_kobo) fee += p.flat_fee_kobo;
  return Math.round(Math.min(fee, p.cap_kobo));
}

/** gross − VAT − processing fees. Instalments pay the flat fee once per charge. */
export function netRevenue(grossKobo: number, charges = 1): number {
  const perCharge = Math.round(grossKobo / charges);
  const fees = processingFee(perCharge) * charges;
  return grossKobo - vatComponent(grossKobo) - fees;
}
