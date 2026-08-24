import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ApiResponse } from "../utils/ApiResponse";
import {
  pricingConfig,
  sellablePlans,
  getTrial,
  type PricingPlan,
} from "../config/pricing";

/**
 * Shape sent to clients. Money stays in kobo across the wire (Rule 1) — the
 * browser converts to naira for display and nowhere else.
 *
 * Derived figures (effective monthly, savings, months free) are deliberately
 * NOT computed here: they follow deterministically from price + term, so the
 * client derives them from these fields. Shipping both the inputs and the
 * outputs would create two numbers that could disagree.
 */
interface PlanDto {
  id: string;
  name: string;
  termMonths: number;
  priceKobo: number;
  charges: number;
  discountPercent: number;
  isDefault: boolean;
  includedLiveSessions: number;
  blurb: string;
}

function toDto(p: PricingPlan): PlanDto {
  return {
    id: p.id,
    name: p.name,
    termMonths: p.term_months,
    priceKobo: p.price_kobo,
    charges: p.charges,
    discountPercent: p.discount_percent,
    isDefault: p.is_default,
    includedLiveSessions: p.included_live_1to1_sessions_per_term,
    blurb: p.blurb,
  };
}

/**
 * GET /api/v1/subscriptions/plans
 *
 * The one endpoint every price on the platform comes from — marketing page,
 * in-app subscription page and checkout all read it, so they cannot drift.
 *
 * Public: the pricing page is visible to signed-out visitors.
 */
export const getPlans = async (_req: Request, res: Response): Promise<void> => {
  const plans = sellablePlans();
  const installments = pricingConfig.plans.find((p) => p.id === "annual_installments");
  const trial = getTrial();

  res.status(StatusCodes.OK).json(
    ApiResponse.success(
      {
        configVersion: pricingConfig.version,
        currency: pricingConfig.currency,
        anchorMonthlyKobo: pricingConfig.anchor_monthly_kobo,
        plans: plans.map(toDto),
        // Surfaced separately: an option against the annual plan, not a rung.
        installmentOption: installments ? toDto(installments) : null,
        // Also outside the ladder — an entry point, priced in days not months.
        trial: trial
          ? {
              name: trial.name,
              priceKobo: trial.price_kobo,
              durationDays: trial.duration_days,
              creditKobo: trial.credited_to_first_plan ? trial.credit_kobo : 0,
              onePerHousehold: trial.one_per_household,
              blurb: trial.blurb,
            }
          : null,
      },
      "Plans retrieved"
    )
  );
};
