/**
 * Stripe Test Utilities and Mock Generators
 * Provides mock Stripe webhook events, HMAC-SHA256 signature generation,
 * forged signature generators, and mock Stripe client factories.
 */

import crypto from 'crypto';

export interface MockStripeSessionOptions {
  sessionId?: string;
  customerEmail?: string;
  candidateName?: string;
  profileId?: string;
  amountTotal?: number;
  currency?: string;
  paymentStatus?: 'paid' | 'unpaid' | 'no_payment_required';
  metadata?: Record<string, string>;
}

export interface MockStripeEvent<T = any> {
  id: string;
  object: 'event';
  api_version: string;
  created: number;
  type: string;
  data: {
    object: T;
  };
  livemode: boolean;
  pending_webhooks: number;
  request: {
    id: string | null;
    idempotency_key: string | null;
  };
}

/**
 * Creates a valid Stripe webhook signature header (t=timestamp,v1=signature).
 * Uses real HMAC-SHA256 as required by Stripe SDK and endpoint verification.
 */
export function generateMockWebhookSignature(
  payload: string | object,
  secret: string,
  timestamp: number = Math.floor(Date.now() / 1000)
): string {
  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const signedPayload = `${timestamp}.${payloadString}`;
  const hmac = crypto.createHmac('sha256', secret);
  const signature = hmac.update(signedPayload, 'utf8').digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

/**
 * Creates a forged/invalid Stripe webhook signature header.
 */
export function generateForgedWebhookSignature(
  payload: string | object,
  wrongSecret: string = 'whsec_invalid_attacker_key_12345',
  timestamp: number = Math.floor(Date.now() / 1000)
): string {
  return generateMockWebhookSignature(payload, wrongSecret, timestamp);
}

/**
 * Creates an expired Stripe webhook signature (timestamp older than Stripe tolerance, e.g. > 300s).
 */
export function generateExpiredWebhookSignature(
  payload: string | object,
  secret: string,
  ageSeconds: number = 600
): string {
  const oldTimestamp = Math.floor(Date.now() / 1000) - ageSeconds;
  return generateMockWebhookSignature(payload, secret, oldTimestamp);
}

/**
 * Generates a mock `checkout.session.completed` Stripe event payload.
 */
export function createMockCheckoutSessionCompletedEvent(
  options: MockStripeSessionOptions = {}
): MockStripeEvent {
  const sessionId = options.sessionId || `cs_test_${Date.now()}`;
  const customerEmail = options.customerEmail || 'candidate.test@example.com';
  const candidateName = options.candidateName || 'Alex Morgan';
  const profileId = options.profileId || 'it_cloud_01';
  const amountTotal = options.amountTotal ?? 900;
  const currency = options.currency || 'usd';
  const paymentStatus = options.paymentStatus || 'paid';

  return {
    id: `evt_test_${Date.now()}`,
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    type: 'checkout.session.completed',
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: `req_test_${Date.now()}`,
      idempotency_key: `idemp_${Date.now()}`,
    },
    data: {
      object: {
        id: sessionId,
        object: 'checkout.session',
        amount_total: amountTotal,
        amount_subtotal: amountTotal,
        currency,
        customer: `cus_test_${Date.now()}`,
        customer_email: customerEmail,
        customer_details: {
          email: customerEmail,
          name: candidateName,
          phone: '+15552345678',
        },
        mode: 'payment',
        payment_status: paymentStatus,
        status: 'complete',
        metadata: {
          profileId,
          candidateName,
          ...options.metadata,
        },
      },
    },
  };
}

/**
 * Generates a mock `payment_intent.succeeded` Stripe event payload.
 */
export function createMockPaymentIntentSucceededEvent(
  options: { paymentIntentId?: string; amount?: number; currency?: string } = {}
): MockStripeEvent {
  const id = options.paymentIntentId || `pi_test_${Date.now()}`;
  return {
    id: `evt_test_${Date.now()}`,
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    type: 'payment_intent.succeeded',
    livemode: false,
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
    data: {
      object: {
        id,
        object: 'payment_intent',
        amount: options.amount ?? 900,
        currency: options.currency || 'usd',
        status: 'succeeded',
      },
    },
  };
}

/**
 * Generates a mock `charge.refunded` Stripe event payload.
 */
export function createMockChargeRefundedEvent(
  options: { chargeId?: string; amountRefunded?: number } = {}
): MockStripeEvent {
  return {
    id: `evt_test_${Date.now()}`,
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    type: 'charge.refunded',
    livemode: false,
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
    data: {
      object: {
        id: options.chargeId || `ch_test_${Date.now()}`,
        object: 'charge',
        amount_refunded: options.amountRefunded ?? 900,
        refunded: true,
      },
    },
  };
}

/**
 * Factory for creating a mock Stripe client instance compatible with Next.js route testing.
 */
export function createMockStripeClient(webhookSecret: string = 'whsec_test_secret_key_12345') {
  return {
    checkout: {
      sessions: {
        create: async (params: any) => ({
          id: `cs_test_mock_${Date.now()}`,
          url: `https://checkout.stripe.com/pay/cs_test_mock_${Date.now()}`,
          customer_email: params.customer_email,
          metadata: params.metadata,
        }),
        retrieve: async (sessionId: string) => ({
          id: sessionId,
          payment_status: sessionId.includes('paid') && !sessionId.includes('unpaid') ? 'paid' : 'unpaid',
          customer_email: 'candidate.test@example.com',
          amount_total: 900,
        }),
      },
    },
    webhooks: {
      constructEvent: (payload: string, header: string, secret: string) => {
        if (secret !== webhookSecret) {
          throw new Error('No signatures found matching the expected signature for payload');
        }
        const parsed = JSON.parse(payload);
        return parsed;
      },
    },
  };
}
