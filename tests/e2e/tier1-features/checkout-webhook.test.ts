/**
 * Tier 1: Feature Coverage Test Suite
 * Checkout & Webhook Infrastructure
 *
 * Covers:
 * - Feature 5: Persistent Payment Registry Verification & Lookup
 * - Feature 6: Stripe Checkout Session Creation (/api/stripe/checkout)
 * - Feature 7: Stripe Webhook Cryptographic Verification & Idempotency (/api/stripe/webhook & /api/stripe/verify)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import { paymentRegistry, FilePaymentRegistry, PaymentRecord } from '@/lib/paymentRegistry';
import { POST as checkoutPost } from '@/app/api/stripe/checkout/route';
import { POST as webhookPost } from '@/app/api/stripe/webhook/route';
import { GET as verifyGet } from '@/app/api/stripe/verify/route';
import {
  invokeRouteHandler,
  createJsonRequest,
  createGetRequest,
  createRawRequest,
  createTestRequest,
} from '../helpers/routeHarness';
import {
  SAMPLE_PAYMENT_RECORDS,
  VALID_PAID_SESSION_ID,
  UNPAID_SESSION_ID,
  TEST_CUSTOMER_EMAIL,
  UNPAID_CUSTOMER_EMAIL,
} from '../helpers/fixtures';
import {
  generateMockWebhookSignature,
  generateForgedWebhookSignature,
  createMockCheckoutSessionCompletedEvent,
  createMockPaymentIntentSucceededEvent,
} from '../helpers/stripeMocks';

const TEST_WEBHOOK_SECRET = 'whsec_test_secret_key_12345';

// Mock Stripe library with authentic cryptographic validation
const mockStripeClient = {
  checkout: {
    sessions: {
      create: vi.fn(async (params: any) => ({
        id: `cs_test_mock_${Date.now()}`,
        url: `https://checkout.stripe.com/pay/cs_test_mock_${Date.now()}`,
        customer_email: params.customer_email,
        metadata: params.metadata,
      })),
      retrieve: vi.fn(async (sessionId: string) => {
        if (sessionId.includes('notfound') || sessionId.includes('error')) {
          throw new Error('No such checkout.session');
        }
        const isPaid =
          (sessionId.includes('paid') && !sessionId.includes('unpaid')) || sessionId === VALID_PAID_SESSION_ID;
        return {
          id: sessionId,
          payment_status: isPaid ? 'paid' : 'unpaid',
          customer_email: isPaid ? TEST_CUSTOMER_EMAIL : UNPAID_CUSTOMER_EMAIL,
          customer_details: { email: isPaid ? TEST_CUSTOMER_EMAIL : UNPAID_CUSTOMER_EMAIL },
          amount_total: 900,
          metadata: {
            profileId: 'it_cloud',
            candidateName: 'Alex Morgan',
          },
        };
      }),
    },
  },
  webhooks: {
    constructEvent: vi.fn((payload: string, header: string, secret: string) => {
      if (!header || !header.includes('t=') || !header.includes('v1=')) {
        throw new Error('Unable to extract timestamp and signatures from header');
      }

      // Parse timestamp and signature
      const parts = header.split(',');
      const tPart = parts.find((p) => p.startsWith('t='));
      const v1Part = parts.find((p) => p.startsWith('v1='));
      const timestamp = tPart?.slice(2);
      const signature = v1Part?.slice(3);

      const expectedHmac = crypto
        .createHmac('sha256', secret)
        .update(`${timestamp}.${payload}`, 'utf8')
        .digest('hex');

      if (signature !== expectedHmac) {
        throw new Error('No signatures found matching the expected signature for payload');
      }

      return JSON.parse(payload);
    }),
  },
};

vi.mock('@/lib/stripe', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    getStripe: () => mockStripeClient,
    isStripeConfigured: () => true,
  };
});

describe('Tier 1: Checkout & Webhook Infrastructure', () => {
  const originalWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  beforeEach(async () => {
    process.env.STRIPE_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;
    await paymentRegistry.recordPayment(SAMPLE_PAYMENT_RECORDS.verifiedPaidRecord);
    await paymentRegistry.recordPayment(SAMPLE_PAYMENT_RECORDS.unpaidRecord);
  });

  afterEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = originalWebhookSecret;
    vi.clearAllMocks();
  });

  // ==========================================================================
  // FEATURE 5: PERSISTENT PAYMENT REGISTRY STATUS & LOOKUP
  // ==========================================================================
  describe('Feature 5: Persistent Payment Registry Status & Lookup', () => {
    it('5.1 Records payment record and verifies isSessionVerified returns true for paid session', async () => {
      const customRecord: PaymentRecord = {
        sessionId: 'cs_custom_test_paid_999',
        customerEmail: 'test.custom@example.com',
        profileId: 'executive',
        candidateName: 'Custom Candidate',
        paymentStatus: 'paid',
        amountCents: 900,
        currency: 'usd',
        invoiceNumber: 'INV-CUSTOM-01',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await paymentRegistry.recordPayment(customRecord);
      const isVerified = await paymentRegistry.isSessionVerified('cs_custom_test_paid_999');
      expect(isVerified).toBe(true);

      const retrieved = await paymentRegistry.getPaymentBySessionId('cs_custom_test_paid_999');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.customerEmail).toBe('test.custom@example.com');
      expect(retrieved?.paymentStatus).toBe('paid');
    });

    it('5.2 isSessionVerified returns false for unknown/non-existent session ID', async () => {
      const isVerified = await paymentRegistry.isSessionVerified('cs_unknown_session_random_123');
      expect(isVerified).toBe(false);

      const record = await paymentRegistry.getPaymentBySessionId('cs_unknown_session_random_123');
      expect(record).toBeNull();
    });

    it('5.3 isSessionVerified returns false for unpaid or pending sessions', async () => {
      const isUnpaidVerified = await paymentRegistry.isSessionVerified(UNPAID_SESSION_ID);
      expect(isUnpaidVerified).toBe(false);

      const unpaidRecord = await paymentRegistry.getPaymentBySessionId(UNPAID_SESSION_ID);
      expect(unpaidRecord?.paymentStatus).toBe('unpaid');
    });

    it('5.4 getPaymentsByEmail performs case-insensitive email lookup', async () => {
      const upperEmail = TEST_CUSTOMER_EMAIL.toUpperCase();
      const records = await paymentRegistry.getPaymentsByEmail(upperEmail);

      expect(records.length).toBeGreaterThan(0);
      expect(records.some((r) => r.sessionId === VALID_PAID_SESSION_ID)).toBe(true);
    });

    it('5.5 getPaymentsByEmail returns empty array for unregistered email', async () => {
      const records = await paymentRegistry.getPaymentsByEmail('unregistered.stranger@domain.org');
      expect(records).toEqual([]);
    });

    it('5.6 isEmailVerified returns true for customer with verified purchase, false for unpaid', async () => {
      const isPaidEmailVerified = await paymentRegistry.isEmailVerified(TEST_CUSTOMER_EMAIL);
      expect(isPaidEmailVerified).toBe(true);

      const isUnpaidEmailVerified = await paymentRegistry.isEmailVerified(UNPAID_CUSTOMER_EMAIL);
      expect(isUnpaidEmailVerified).toBe(false);
    });

    it('5.7 File-backed registry atomically persists to disk and reloads cleanly', async () => {
      const tempPath = path.resolve(process.cwd(), `data/temp_test_registry_${Date.now()}.json`);
      const customRegistry = new FilePaymentRegistry(tempPath);

      try {
        await customRegistry.recordPayment(SAMPLE_PAYMENT_RECORDS.verifiedPaidRecord);
        expect(await customRegistry.isSessionVerified(VALID_PAID_SESSION_ID)).toBe(true);

        // Instantiate a second registry instance pointing to the exact same file
        const secondRegistryInstance = new FilePaymentRegistry(tempPath);
        expect(await secondRegistryInstance.isSessionVerified(VALID_PAID_SESSION_ID)).toBe(true);

        const loadedRecord = await secondRegistryInstance.getPaymentBySessionId(VALID_PAID_SESSION_ID);
        expect(loadedRecord?.customerEmail).toBe(TEST_CUSTOMER_EMAIL);
      } finally {
        await customRegistry.clear();
        try {
          await fs.unlink(tempPath);
        } catch {}
      }
    });
  });

  // ==========================================================================
  // FEATURE 6: STRIPE CHECKOUT SESSION CREATION (/api/stripe/checkout)
  // ==========================================================================
  describe('Feature 6: Stripe Checkout Session Creation', () => {
    it('6.1 POST /api/stripe/checkout with valid payload returns 200 with checkout URL and session ID', async () => {
      const req = createJsonRequest('/api/stripe/checkout', {
        email: 'candidate.checkout@example.com',
        profileId: 'it_cloud',
        candidateName: 'Jordan Vance',
      });
      const res = await invokeRouteHandler(checkoutPost, req);

      expect(res.status).toBe(200);
      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.url).toContain('https://checkout.stripe.com');
      expect(data.sessionId).toContain('cs_test_mock_');
      expect(data.isTestMode).toBe(false);
    });

    it('6.2 POST /api/stripe/checkout includes candidate and profile details in metadata', async () => {
      const req = createJsonRequest('/api/stripe/checkout', {
        email: 'alex.director@example.com',
        profileId: 'executive_lead',
        candidateName: 'Alex Lead',
      });
      await invokeRouteHandler(checkoutPost, req);

      expect(mockStripeClient.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_email: 'alex.director@example.com',
          metadata: expect.objectContaining({
            profileId: 'executive_lead',
            candidateName: 'Alex Lead',
            product: 'executive_ats_rewrite',
          }),
        })
      );
    });

    it('6.3 POST /api/stripe/checkout configures correct line item price ($9.00 USD)', async () => {
      const req = createJsonRequest('/api/stripe/checkout', {
        email: 'candidate@example.com',
      });
      await invokeRouteHandler(checkoutPost, req);

      expect(mockStripeClient.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({
                currency: 'usd',
                unit_amount: 900,
              }),
              quantity: 1,
            }),
          ],
        })
      );
    });

    it('6.4 POST /api/stripe/checkout applies fallback defaults when optional fields are omitted', async () => {
      const req = createJsonRequest('/api/stripe/checkout', {});
      const res = await invokeRouteHandler(checkoutPost, req);

      expect(res.status).toBe(200);
      expect(mockStripeClient.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            profileId: 'it_cloud',
            candidateName: 'Candidate',
          }),
        })
      );
    });

    it('6.5 POST /api/stripe/checkout returns 500 when Stripe API fails during session creation', async () => {
      mockStripeClient.checkout.sessions.create.mockRejectedValueOnce(
        new Error('Stripe API network timeout')
      );

      const req = createJsonRequest('/api/stripe/checkout', {
        email: 'candidate@example.com',
      });
      const res = await invokeRouteHandler(checkoutPost, req);

      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Stripe API network timeout');
    });
  });

  // ==========================================================================
  // FEATURE 7: STRIPE WEBHOOK VERIFICATION & IDEMPOTENCY (/api/stripe/webhook & verify)
  // ==========================================================================
  describe('Feature 7: Stripe Webhook Cryptographic Verification & Idempotency', () => {
    it('7.1 POST /api/stripe/webhook missing Stripe-Signature header returns 400 Bad Request', async () => {
      const event = createMockCheckoutSessionCompletedEvent();
      const rawBody = JSON.stringify(event);

      // Request without stripe-signature header
      const req = createRawRequest('/api/stripe/webhook', rawBody);
      const res = await invokeRouteHandler(webhookPost, req);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it('7.2 POST /api/stripe/webhook with forged/invalid signature returns 400 Bad Request', async () => {
      const event = createMockCheckoutSessionCompletedEvent();
      const rawBody = JSON.stringify(event);
      const forgedSignature = generateForgedWebhookSignature(
        rawBody,
        'whsec_attacker_wrong_secret_key'
      );

      const req = createTestRequest('/api/stripe/webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': forgedSignature,
          'content-type': 'text/plain; charset=utf-8',
        },
        body: rawBody,
      });
      const res = await invokeRouteHandler(webhookPost, req);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Webhook Error');
    });

    it('7.3 POST /api/stripe/webhook with valid signature processes checkout.session.completed event', async () => {
      const newSessionId = `cs_webhook_paid_${Date.now()}`;
      const event = createMockCheckoutSessionCompletedEvent({
        sessionId: newSessionId,
        customerEmail: 'webhook.candidate@domain.com',
        candidateName: 'Webhook Candidate',
        amountTotal: 900,
      });
      const rawBody = JSON.stringify(event);
      const validSignature = generateMockWebhookSignature(rawBody, TEST_WEBHOOK_SECRET);

      const req = createTestRequest('/api/stripe/webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': validSignature,
          'content-type': 'text/plain; charset=utf-8',
        },
        body: rawBody,
      });
      const res = await invokeRouteHandler(webhookPost, req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.received).toBe(true);
    });

    it('7.4 POST /api/stripe/webhook handles duplicate events idempotently without throwing', async () => {
      const dupSessionId = `cs_dup_test_${Date.now()}`;
      const event = createMockCheckoutSessionCompletedEvent({ sessionId: dupSessionId });
      const rawBody = JSON.stringify(event);
      const signature = generateMockWebhookSignature(rawBody, TEST_WEBHOOK_SECRET);

      const makeRequest = () =>
        createTestRequest('/api/stripe/webhook', {
          method: 'POST',
          headers: {
            'stripe-signature': signature,
            'content-type': 'text/plain; charset=utf-8',
          },
          body: rawBody,
        });

      // Send event first time
      const res1 = await invokeRouteHandler(webhookPost, makeRequest());
      expect(res1.status).toBe(200);

      // Send same event second time (duplicate webhook delivery)
      const res2 = await invokeRouteHandler(webhookPost, makeRequest());
      expect(res2.status).toBe(200);
      const data2 = await res2.json();
      expect(data2.received).toBe(true);
    });

    it('7.5 POST /api/stripe/webhook handles other event types (payment_intent.succeeded) gracefully', async () => {
      const event = createMockPaymentIntentSucceededEvent();
      const rawBody = JSON.stringify(event);
      const signature = generateMockWebhookSignature(rawBody, TEST_WEBHOOK_SECRET);

      const req = createTestRequest('/api/stripe/webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': signature,
          'content-type': 'text/plain; charset=utf-8',
        },
        body: rawBody,
      });
      const res = await invokeRouteHandler(webhookPost, req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.received).toBe(true);
    });

    it('7.6 GET /api/stripe/verify with verified paid session returns verified: true and paymentStatus: paid', async () => {
      const req = createGetRequest('/api/stripe/verify', {
        searchParams: { session_id: VALID_PAID_SESSION_ID },
      });
      const res = await invokeRouteHandler(verifyGet, req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.verified).toBe(true);
      expect(data.paymentStatus).toBe('paid');
      expect(data.sessionId).toBe(VALID_PAID_SESSION_ID);
    });

    it('7.7 GET /api/stripe/verify with unpaid session returns verified: false', async () => {
      const req = createGetRequest('/api/stripe/verify', {
        searchParams: { session_id: UNPAID_SESSION_ID },
      });
      const res = await invokeRouteHandler(verifyGet, req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.verified).toBe(false);
      expect(data.paymentStatus).toBe('unpaid');
    });

    it('7.8 GET /api/stripe/verify missing session_id parameter returns 400 Bad Request', async () => {
      const req = createGetRequest('/api/stripe/verify');
      const res = await invokeRouteHandler(verifyGet, req);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.verified).toBe(false);
      expect(data.error).toContain('Missing session_id');
    });
  });
});
