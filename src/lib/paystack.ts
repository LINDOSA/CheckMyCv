import crypto from 'crypto';

/**
 * Paystack payment infrastructure for ScoreMyCV (South Africa).
 *
 * Paystack is the South African payment rail (owned by Stripe). Unlike Stripe
 * Checkout there is no "session" object: you initialize a transaction, get back
 * an authorization_url to redirect to, and later confirm it by its `reference`.
 *
 * The reference is what we store in the payment registry as `sessionId`, so the
 * rest of the app (export gating, invoices, cross-device restore) is unchanged.
 */

export const PAYSTACK_API_BASE = 'https://api.paystack.co';

/** Paystack's published webhook source IPs. */
export const PAYSTACK_WEBHOOK_IPS = ['52.31.139.75', '52.49.173.169', '52.214.14.220'];

export const REWRITE_PRODUCT = {
  name: 'CheckMyCV - Executive ATS Resume Rewrite Pass',
  description:
    'Single-column Workday & Greenhouse certified format, XYZ accomplishment bullets, keyword match, Word (.docx) & PDF (.pdf)',
  currency: 'ZAR',
};

/**
 * Price in ZAR cents. R160.00 by default; override with PAYSTACK_AMOUNT_CENTS
 * so the price can change without a code deploy.
 */
export function getRewriteAmountCents(): number {
  const override = Number(process.env.PAYSTACK_AMOUNT_CENTS);
  if (Number.isFinite(override) && override > 0) {
    return Math.round(override);
  }
  return 16000;
}

export function isPaystackConfigured(): boolean {
  const key = process.env.PAYSTACK_SECRET_KEY;
  return Boolean(key && key.startsWith('sk_'));
}

export function isPaystackLiveMode(): boolean {
  return Boolean(process.env.PAYSTACK_SECRET_KEY?.startsWith('sk_live_'));
}

/** Our own transaction reference. Prefixed so it is recognisable in the registry. */
export function generatePaystackReference(): string {
  return `smcv_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
}

export function isPaystackReference(reference: string | null | undefined): boolean {
  return Boolean(reference && reference.trim().startsWith('smcv_'));
}

/**
 * Verify a webhook delivery.
 *
 * Paystack signs the RAW request body with HMAC SHA512 using the account's
 * secret key (there is no separate webhook secret) and sends the hex digest in
 * the `x-paystack-signature` header.
 */
export function verifyPaystackSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !signature) return false;

  const expected = crypto.createHmac('sha512', secret).update(rawBody, 'utf-8').digest('hex');
  const expectedBuf = Buffer.from(expected, 'utf-8');
  const receivedBuf = Buffer.from(signature.trim(), 'utf-8');

  // timingSafeEqual throws on length mismatch, so compare lengths first.
  if (expectedBuf.length !== receivedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}

export interface PaystackInitializeParams {
  email: string;
  amountCents: number;
  reference: string;
  callbackUrl: string;
  currency?: string;
  metadata?: Record<string, unknown>;
}

export interface PaystackInitializeResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

async function paystackFetch(path: string, init: RequestInit = {}): Promise<any> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured on the server.');
  }

  const res = await fetch(`${PAYSTACK_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    cache: 'no-store',
  });

  const payload = await res.json().catch(() => ({}));

  if (!res.ok || payload?.status === false) {
    throw new Error(payload?.message || `Paystack request failed with HTTP ${res.status}`);
  }

  return payload;
}

export async function initializePaystackTransaction(
  params: PaystackInitializeParams
): Promise<PaystackInitializeResult> {
  const payload = await paystackFetch('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email: params.email,
      amount: params.amountCents,
      currency: params.currency || REWRITE_PRODUCT.currency,
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata || {},
    }),
  });

  const data = payload?.data || {};
  if (!data.authorization_url) {
    throw new Error('Paystack did not return an authorization URL.');
  }

  return {
    authorizationUrl: data.authorization_url,
    accessCode: data.access_code,
    reference: data.reference || params.reference,
  };
}

export interface PaystackVerifiedTransaction {
  reference: string;
  isPaid: boolean;
  status: string;
  amountCents: number;
  currency: string;
  customerEmail: string;
  paidAt: string | null;
  metadata: Record<string, string>;
}

/**
 * Ask Paystack directly whether a reference was actually paid.
 * This is the authority: never trust a reference that only came back in a URL.
 */
export async function verifyPaystackTransaction(
  reference: string
): Promise<PaystackVerifiedTransaction> {
  const payload = await paystackFetch(`/transaction/verify/${encodeURIComponent(reference.trim())}`, {
    method: 'GET',
  });

  const data = payload?.data || {};
  const rawMetadata = data.metadata && typeof data.metadata === 'object' ? data.metadata : {};
  const metadata: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawMetadata)) {
    if (value !== null && value !== undefined && typeof value !== 'object') {
      metadata[key] = String(value);
    }
  }

  return {
    reference: data.reference || reference,
    isPaid: data.status === 'success',
    status: data.status || 'unknown',
    amountCents: Number(data.amount) || 0,
    currency: data.currency || REWRITE_PRODUCT.currency,
    customerEmail: data.customer?.email || '',
    paidAt: data.paid_at || data.paidAt || null,
    metadata,
  };
}

/** Deterministic invoice number derived from the transaction reference. */
export function buildInvoiceNumber(reference: string): string {
  return `INV-${reference.slice(-8).toUpperCase()}`;
}
