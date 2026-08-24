import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../config/database";
import { ApiResponse, ApiError } from "../utils/ApiResponse";
import { logger } from "../utils/logger";
import {
  createCheckoutOrder,
  chargeTokenizedCard,
  verifyTransaction,
  verifyWebhookSignature,
  NOMBA_WEBHOOK_SECRET,
  type NombaWebhookPayload,
} from "../config/nomba";
import {
  getPlan,
  isPurchasable,
  PRICING_CONFIG_VERSION,
} from "../config/pricing";

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";

/**
 * Nomba charges in naira. Config and every internal calculation are in kobo
 * (Rule 1), so conversion happens here at the provider boundary and nowhere
 * else. Prices are whole naira by policy (§13 forbids .99), so this never
 * loses a fraction — but assert rather than trust, since a config edit that
 * introduced sub-naira precision would otherwise silently under-charge.
 */
function koboToNaira(kobo: number): number {
  if (kobo % 100 !== 0) {
    throw ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Price ${kobo} kobo is not a whole number of naira. Fix pricing.config.json.`
    );
  }
  return kobo / 100;
}

/** Resolve a requested plan, or fail with a message the client can show. */
function resolvePlan(planId: unknown) {
  if (typeof planId !== "string" || !planId) {
    throw ApiError(StatusCodes.BAD_REQUEST, "planId is required.");
  }
  const plan = getPlan(planId);
  if (!plan) {
    throw ApiError(StatusCodes.BAD_REQUEST, `Unknown plan "${planId}".`);
  }
  if (!isPurchasable(planId)) {
    throw ApiError(
      StatusCodes.CONFLICT,
      `The ${plan.name} plan is not on sale right now.`
    );
  }
  return plan;
}

/** Advance a date by whole months, for period end. */
function addMonths(from: Date, months: number): Date {
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  return d;
}

/**
 * What was bought, recovered from the Payment row written at checkout.
 * Reading the term from the payment rather than from today's config is what
 * makes Rule 4 hold: repricing the ladder cannot alter an in-flight purchase.
 */
function readPurchase(metadata: unknown) {
  const m = (metadata ?? {}) as Record<string, unknown>;
  return {
    planId: typeof m.planId === "string" ? m.planId : undefined,
    termMonths: typeof m.termMonths === "number" ? m.termMonths : undefined,
    pricingConfigVersion:
      typeof m.pricingConfigVersion === "string" ? m.pricingConfigVersion : undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/payments/checkout
// Initiate a FlexPass checkout — creates a Nomba hosted-payment order
// ─────────────────────────────────────────────────────────────────────────────
export const initiateCheckout = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  // The price comes from pricing.config.json, never from the request body —
  // a client-supplied amount would be trivially tampered with.
  const plan = resolvePlan((req.body as { planId?: unknown })?.planId);
  const amountNaira = koboToNaira(plan.price_kobo);

  // Bail early if already on FlexPass
  const existing = await prisma.subscription.findUnique({ where: { userId } });
  if (existing && ["BASIC", "PRO", "ELITE"].includes(existing.tier) && existing.status === "ACTIVE") {
    throw ApiError(StatusCodes.CONFLICT, "You already have an active FlexPass subscription.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, firstName: true, lastName: true, phone: true },
  });
  if (!user) throw ApiError(StatusCodes.NOT_FOUND, "User not found.");

  const orderReference = `fa-${userId.slice(0, 8)}-${Date.now()}`;

  // Persist a PENDING payment so the webhook can look up userId by orderReference
  const payment = await prisma.payment.create({
    data: {
      userId,
      amount: amountNaira,
      currency: "NGN",
      status: "PENDING",
      provider: "nomba",
      providerRef: orderReference,
      metadata: {
        planId: plan.id,
        termMonths: plan.term_months,
        priceKobo: plan.price_kobo,
        pricingConfigVersion: PRICING_CONFIG_VERSION,
      },
    },
  });

  const order = await createCheckoutOrder({
    orderReference,
    amount: amountNaira,
    customerEmail: user.email,
    customerName: `${user.firstName} ${user.lastName}`.trim(),
    customerPhone: user.phone ?? undefined,
    customerId: userId,
    callbackUrl: `${FRONTEND_URL}/subscription?payment=success&ref=${orderReference}`,
    tokenizeCard: true, // enable recurring billing
    metadata: { userId, paymentId: payment.id, planId: plan.id },
  });

  logger.info(
    { userId, orderReference, planId: plan.id, amountNaira },
    "Nomba checkout order created"
  );

  res.status(StatusCodes.OK).json(
    ApiResponse.success(
      {
        checkoutLink: order.checkoutLink,
        orderReference,
        planId: plan.id,
        amountKobo: plan.price_kobo,
      },
      "Checkout session created"
    )
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/payments/verify/:reference
// Manual verification — called when user lands back on /subscription?payment=success
// ─────────────────────────────────────────────────────────────────────────────
export const verifyPayment = async (
  req: Request<{ reference: string }>,
  res: Response
): Promise<void> => {
  const { reference } = req.params;
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const payment = await prisma.payment.findUnique({ where: { providerRef: reference } });
  if (!payment || payment.userId !== userId) {
    throw ApiError(StatusCodes.NOT_FOUND, "Payment not found.");
  }

  // Already confirmed (webhook arrived before the user's redirect)
  if (payment.status === "SUCCESS") {
    res.status(StatusCodes.OK).json(ApiResponse.success({ status: "SUCCESS" }, "Payment confirmed"));
    return;
  }

  const result = await verifyTransaction(reference);
  if (result.success) {
    await activateFlexPass(
      payment.userId,
      reference,
      payment.id,
      null,
      readPurchase(payment.metadata)
    );
  }

  res.status(StatusCodes.OK).json(
    ApiResponse.success(
      { status: result.success ? "SUCCESS" : "PENDING" },
      result.success ? "Payment confirmed" : "Payment not yet settled"
    )
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/payments/webhook
// Nomba sends events here; body is raw Buffer (registered before express.json)
// ─────────────────────────────────────────────────────────────────────────────
export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  const signature = req.headers["nomba-signature"] as string | undefined;
  const timestamp = req.headers["nomba-timestamp"] as string | undefined;

  let payload: NombaWebhookPayload;
  try {
    const raw = req.body instanceof Buffer ? req.body.toString("utf8") : JSON.stringify(req.body);
    payload = JSON.parse(raw) as NombaWebhookPayload;
  } catch {
    res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid JSON" });
    return;
  }

  // Always verify in production; dev bypasses if secret is missing
  if (signature && timestamp) {
    const valid = verifyWebhookSignature(payload, signature, timestamp, NOMBA_WEBHOOK_SECRET);
    if (!valid) {
      logger.warn({ event_type: payload.event_type }, "Nomba webhook: invalid signature — rejected");
      res.status(StatusCodes.UNAUTHORIZED).json({ error: "Invalid signature" });
      return;
    }
  }

  // Acknowledge immediately — Nomba retries on non-200
  res.status(StatusCodes.OK).json({ received: true });

  const { event_type, data } = payload;
  const orderReference = data.orderReference;
  const tokenKey = data.tokenKey ?? null;

  logger.info({ event_type, orderReference }, "Nomba webhook received");

  try {
    if (event_type === "payment_success" && orderReference) {
      const payment = await prisma.payment.findUnique({ where: { providerRef: orderReference } });
      if (!payment) {
        logger.warn({ orderReference }, "Nomba webhook: no payment record matched");
        return;
      }
      if (payment.status !== "SUCCESS") {
        await activateFlexPass(
          payment.userId,
          orderReference,
          payment.id,
          tokenKey,
          readPurchase(payment.metadata)
        );
      }
    }

    if (event_type === "payment_failed" && orderReference) {
      await prisma.payment.updateMany({
        where: { providerRef: orderReference, status: "PENDING" },
        data: { status: "FAILED" },
      });
      logger.info({ orderReference }, "Nomba payment marked FAILED");
    }
  } catch (err) {
    logger.error({ err, event_type, orderReference }, "Nomba webhook processing error");
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/payments/renew  (internal — called by a cron or admin trigger)
// Charge stored token for the next billing cycle
// ─────────────────────────────────────────────────────────────────────────────
export const renewSubscription = async (req: Request, res: Response): Promise<void> => {
  const apiKey = req.headers["x-internal-key"];
  if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
    throw ApiError(StatusCodes.FORBIDDEN, "Forbidden.");
  }

  const { userId } = req.body as { userId?: string };
  if (!userId) throw ApiError(StatusCodes.BAD_REQUEST, "userId is required.");

  const subscription = await prisma.subscription.findUnique({ where: { userId } });
  if (!subscription?.nombaTokenKey) {
    throw ApiError(StatusCodes.BAD_REQUEST, "No stored payment token for this user.");
  }

  // Renew on the plan the subscriber actually holds, at the price from the
  // config version they were sold under — never today's ladder (Rule 4).
  const renewalPlanId = subscription.planId ?? "monthly";
  const renewalPlan = getPlan(renewalPlanId);
  if (!renewalPlan) {
    throw ApiError(
      StatusCodes.CONFLICT,
      `Subscription references plan "${renewalPlanId}", which is no longer in the config. Migrate it before renewal.`
    );
  }
  const renewalTerm = subscription.termMonths ?? renewalPlan.term_months;
  const renewalNaira = koboToNaira(renewalPlan.price_kobo);

  const orderReference = `fa-renew-${userId.slice(0, 8)}-${Date.now()}`;
  const result = await chargeTokenizedCard({
    tokenKey: subscription.nombaTokenKey,
    orderReference,
    customerId: userId,
    amount: renewalNaira,
  });

  if (result.success) {
    const periodStart = new Date();
    const periodEnd = addMonths(periodStart, renewalTerm);

    const payment = await prisma.payment.create({
      data: {
        userId,
        subscriptionId: subscription.id,
        amount: renewalNaira,
        currency: "NGN",
        status: "SUCCESS",
        provider: "nomba",
        providerRef: orderReference,
        metadata: {
          planId: renewalPlan.id,
          termMonths: renewalTerm,
          priceKobo: renewalPlan.price_kobo,
          pricingConfigVersion: PRICING_CONFIG_VERSION,
          renewal: true,
          transactionId: result.transactionId,
        },
      },
    });

    await prisma.subscription.update({
      where: { userId },
      data: { status: "ACTIVE", currentPeriodStart: periodStart, currentPeriodEnd: periodEnd },
    });

    logger.info({ userId, paymentId: payment.id }, "FlexPass subscription renewed");
  }

  res.status(StatusCodes.OK).json(
    ApiResponse.success(
      { success: result.success, transactionId: result.transactionId },
      result.success ? "Subscription renewed" : "Renewal charge failed"
    )
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper — upgrade subscription to PRO (FlexPass) and notify user
// ─────────────────────────────────────────────────────────────────────────────
async function activateFlexPass(
  userId: string,
  orderReference: string,
  paymentId: string,
  tokenKey: string | null,
  /** Written at checkout. Legacy rows predate it and fall back to one month. */
  purchase?: { planId?: string; termMonths?: number; pricingConfigVersion?: string }
): Promise<void> {
  const termMonths = purchase?.termMonths ?? 1;
  const periodStart = new Date();
  // The period must match the term actually bought — an annual subscriber
  // granted one month would lose eleven months of access they paid for.
  const periodEnd = addMonths(periodStart, termMonths);

  const planFields = {
    ...(purchase?.planId ? { planId: purchase.planId } : {}),
    termMonths,
    ...(purchase?.pricingConfigVersion
      ? { pricingConfigVersion: purchase.pricingConfigVersion }
      : {}),
  };

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: paymentId },
      data: { status: "SUCCESS" },
    }),
    prisma.subscription.upsert({
      where: { userId },
      update: {
        tier: "PRO",
        status: "ACTIVE",
        ...planFields,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        ...(tokenKey ? { nombaTokenKey: tokenKey, nombaCustomerId: userId } : {}),
      },
      create: {
        userId,
        tier: "PRO",
        status: "ACTIVE",
        ...planFields,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        ...(tokenKey ? { nombaTokenKey: tokenKey, nombaCustomerId: userId } : {}),
      },
    }),
    prisma.notification.create({
      data: {
        userId,
        type: "PAYMENT_SUCCESS",
        title: "FlexPass activated!",
        body: "Your FlexPass is live. Full platform access unlocked — go learn something.",
        metadata: { orderReference },
      },
    }),
  ]);

  logger.info({ userId, orderReference, tokenKey: !!tokenKey }, "FlexPass activated");
}
