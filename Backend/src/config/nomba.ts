import { createHmac } from "crypto";
import { logger } from "../utils/logger";

const BASE_URL = process.env.NOMBA_BASE_URL ?? "https://api.nomba.com/v1";
const CLIENT_ID = process.env.NOMBA_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.NOMBA_CLIENT_SECRET ?? "";
export const NOMBA_ACCOUNT_ID = process.env.NOMBA_ACCOUNT_ID ?? "";
export const NOMBA_WEBHOOK_SECRET = process.env.NOMBA_WEBHOOK_SECRET ?? "";

// ── Token management ──────────────────────────────────────────────────────────

interface TokenStore {
  accessToken: string;
  refreshToken: string;
  fetchedAt: number;
}

let _token: TokenStore | null = null;
// Refresh 5 min before Nomba's 30-min expiry
const TTL_MS = 25 * 60 * 1000;

async function fetchNewToken(): Promise<TokenStore> {
  const res = await fetch(`${BASE_URL}/auth/token/issue`, {
    method: "POST",
    headers: { "Content-Type": "application/json", accountId: NOMBA_ACCOUNT_ID },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Nomba auth failed ${res.status}: ${body}`);
  }

  const data = (await res.json()) as { access_token: string; refresh_token: string };
  return { accessToken: data.access_token, refreshToken: data.refresh_token, fetchedAt: Date.now() };
}

async function tryRefreshToken(refreshToken: string): Promise<TokenStore | null> {
  try {
    const res = await fetch(`${BASE_URL}/auth/token/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", accountId: NOMBA_ACCOUNT_ID },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token: string; refresh_token: string };
    return { accessToken: data.access_token, refreshToken: data.refresh_token, fetchedAt: Date.now() };
  } catch {
    return null;
  }
}

export async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (_token && now - _token.fetchedAt < TTL_MS) return _token.accessToken;

  if (_token?.refreshToken) {
    const refreshed = await tryRefreshToken(_token.refreshToken);
    if (refreshed) {
      _token = refreshed;
      return _token.accessToken;
    }
  }

  _token = await fetchNewToken();
  return _token.accessToken;
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────

async function nombaFetch(
  path: string,
  options: RequestInit & { searchParams?: Record<string, string> } = {}
): Promise<unknown> {
  const token = await getAccessToken();
  const url = new URL(`${BASE_URL}${path}`);
  if (options.searchParams) {
    for (const [k, v] of Object.entries(options.searchParams)) url.searchParams.set(k, v);
  }

  const { searchParams: _sp, ...fetchOptions } = options;
  const res = await fetch(url.toString(), {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      accountId: NOMBA_ACCOUNT_ID,
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });

  const data = (await res.json()) as Record<string, unknown>;

  if (!res.ok) {
    logger.error({ path, status: res.status, data }, "Nomba API error");
    throw new Error(`Nomba API ${res.status}: ${JSON.stringify(data)}`);
  }

  return data;
}

// ── Checkout order ────────────────────────────────────────────────────────────

export interface CreateOrderParams {
  orderReference: string;
  amount: number; // Naira (e.g. 3500 = ₦3,500)
  currency?: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  callbackUrl: string;
  tokenizeCard?: boolean;
  metadata?: Record<string, unknown>;
}

export interface CreateOrderResult {
  checkoutLink: string;
  orderReference: string;
}

export async function createCheckoutOrder(
  params: CreateOrderParams
): Promise<CreateOrderResult> {
  const resp = (await nombaFetch("/checkout/order", {
    method: "POST",
    body: JSON.stringify({
      orderReference: params.orderReference,
      customerId: params.customerId,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
      amount: params.amount,
      currency: params.currency ?? "NGN",
      callbackUrl: params.callbackUrl,
      tokenizeCard: params.tokenizeCard ?? false,
      metadata: params.metadata ?? {},
    }),
  })) as { data?: { checkoutLink?: string; orderReference?: string } };

  return {
    checkoutLink: resp.data?.checkoutLink ?? "",
    orderReference: resp.data?.orderReference ?? params.orderReference,
  };
}

// ── Recurring / tokenized billing ─────────────────────────────────────────────

export interface TokenizedPaymentParams {
  tokenKey: string;
  orderReference: string;
  customerId: string;
  amount: number;
  currency?: string;
}

export async function chargeTokenizedCard(
  params: TokenizedPaymentParams
): Promise<{ success: boolean; transactionId?: string }> {
  const resp = (await nombaFetch("/checkout/tokenized-card-payment", {
    method: "POST",
    body: JSON.stringify({
      tokenKey: params.tokenKey,
      orderReference: params.orderReference,
      customerId: params.customerId,
      amount: params.amount,
      currency: params.currency ?? "NGN",
    }),
  })) as { responseCode?: string; data?: { transactionId?: string } };

  return {
    success: resp.responseCode === "00",
    transactionId: resp.data?.transactionId,
  };
}

// ── Transaction verification ──────────────────────────────────────────────────

export async function verifyTransaction(
  orderReference: string
): Promise<{ success: boolean; amount?: number; transactionId?: string }> {
  const resp = (await nombaFetch("/transactions/accounts/single", {
    method: "GET",
    searchParams: { orderReference },
  })) as { responseCode?: string; data?: { amount?: number; transactionId?: string } };

  return {
    success: resp.responseCode === "00",
    amount: resp.data?.amount,
    transactionId: resp.data?.transactionId,
  };
}

// ── Webhook signature verification ────────────────────────────────────────────

export interface NombaWebhookPayload {
  event_type: string;
  requestId: string;
  data: {
    merchant?: { userId?: string; walletId?: string };
    transaction?: {
      transactionId?: string;
      transactionType?: string;
      transactionTime?: string;
      responseCode?: string;
    };
    tokenKey?: string;
    orderReference?: string;
    customerEmail?: string;
    customerId?: string;
  };
}

export function verifyWebhookSignature(
  payload: NombaWebhookPayload,
  signature: string,
  timestamp: string,
  secret: string
): boolean {
  if (!secret) {
    logger.warn("NOMBA_WEBHOOK_SECRET not configured — bypassing signature check");
    return true;
  }

  const m = payload.data?.merchant ?? {};
  const t = payload.data?.transaction ?? {};

  const raw = [
    payload.event_type,
    payload.requestId,
    m.userId ?? "",
    m.walletId ?? "",
    t.transactionId ?? "",
    t.transactionType ?? "",
    t.transactionTime ?? "",
    t.responseCode ?? "",
    timestamp,
  ].join(":");

  const expected = createHmac("sha256", secret).update(raw).digest("base64");
  return expected === signature;
}
