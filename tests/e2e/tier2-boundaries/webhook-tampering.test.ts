/**
 * Tier 2 Boundary & Security Test Suite: Stripe Webhook Tampering & Signature Verification
 *
 * Exhaustively tests cryptographic webhook verification against tampering attacks,
 * forged HMAC signatures, replay attacks (stale timestamps >300s), future timestamps,
 * malformed headers, unknown event types, payload truncation, empty bodies, and wrong secrets.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';

// Route Handler under test
import { POST as webhookPost } from '@/app/api/stripe/webhook/route';

// Test harnesses & mock utilities
import { createRawRequest, invokeRouteHandler } from '../helpers/routeHarness';
import {
  generateMockWebhookSignature,
  generateForgedWebhookSignature,
  generateExpiredWebhookSignature,
  createMockCheckoutSessionCompletedEvent,
  createMockPaymentIntentSucceededEvent,
} from '../helpers/stripeMocks';

describe('Tier 2: Stripe Webhook Tampering & Cryptographic Defense', () => {
  const ORIGINAL_ENV = { ...process.env };
  const TEST_WEBHOOK_SECRET = 'whsec_test_secret_for_tier2_tampering_suite_9999';
  const TEST_STRIPE_KEY = 'sk_test_mock_key_for_tier2_suite_12345';

  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = TEST_STRIPE_KEY;
    process.env.STRIPE_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  // ==========================================================================
  // 1. ALTERED PAYLOAD & HMAC SIGNATURE MISMATCH
  // ==========================================================================
  describe('Payload Tampering with Mismatched Signature', () => {
    it('detects altered transaction amount (e.g. 900 -> 100) via cryptographic signature mismatch with 400', async () => {
      const originalEvent = createMockCheckoutSessionCompletedEvent({
        sessionId: 'cs_test_tamper_amt_01',
        amountTotal: 900,
      });
      const originalPayload = JSON.stringify(originalEvent);
      const signature = generateMockWebhookSignature(originalPayload, TEST_WEBHOOK_SECRET);

      // Attacker intercepts and modifies payload body to $1.00 instead of $9.00
      const tamperedPayload = originalPayload.replace('"amount_total":900', '"amount_total":100');

      const req = createRawRequest('/api/stripe/webhook', tamperedPayload, {
        headers: {
          'stripe-signature': signature,
          'content-type': 'application/json',
        },
      });

      const res = await invokeRouteHandler(webhookPost, req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/webhook error|signature/i);
    });

    it('detects altered customer email address in intercepted payload with 400', async () => {
      const originalEvent = createMockCheckoutSessionCompletedEvent({
        customerEmail: 'paying.victim@example.com',
      });
      const originalPayload = JSON.stringify(originalEvent);
      const signature = generateMockWebhookSignature(originalPayload, TEST_WEBHOOK_SECRET);

      // Attacker changes victim email to attacker email
      const tamperedPayload = originalPayload.replace(
        'paying.victim@example.com',
        'attacker@evil.com'
      );

      const req = createRawRequest('/api/stripe/webhook', tamperedPayload, {
        headers: {
          'stripe-signature': signature,
          'content-type': 'application/json',
        },
      });

      const res = await invokeRouteHandler(webhookPost, req);
      expect(res.status).toBe(400);
    });

    it('detects altered currency (usd -> jpy) with 400', async () => {
      const originalEvent = createMockCheckoutSessionCompletedEvent({ currency: 'usd' });
      const originalPayload = JSON.stringify(originalEvent);
      const signature = generateMockWebhookSignature(originalPayload, TEST_WEBHOOK_SECRET);

      const tamperedPayload = originalPayload.replace('"currency":"usd"', '"currency":"jpy"');

      const req = createRawRequest('/api/stripe/webhook', tamperedPayload, {
        headers: {
          'stripe-signature': signature,
          'content-type': 'application/json',
        },
      });

      const res = await invokeRouteHandler(webhookPost, req);
      expect(res.status).toBe(400);
    });
  });

  // ==========================================================================
  // 2. REPLAY ATTACKS: EXPIRED TIMESTAMPS (> 300 SECONDS)
  // ==========================================================================
  describe('Replay Attack Prevention (Tolerance <= 300s)', () => {
    it('rejects webhook payload with timestamp 305 seconds old (outside tolerance)', async () => {
      const event = createMockCheckoutSessionCompletedEvent({
        sessionId: 'cs_test_stale_replay_01',
      });
      const payload = JSON.stringify(event);

      // Generate signature with timestamp 305s ago
      const staleSignature = generateExpiredWebhookSignature(payload, TEST_WEBHOOK_SECRET, 305);

      const req = createRawRequest('/api/stripe/webhook', payload, {
        headers: {
          'stripe-signature': staleSignature,
          'content-type': 'application/json',
        },
      });

      const res = await invokeRouteHandler(webhookPost, req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/tolerance|timestamp|signature/i);
    });

    it('rejects webhook payload with timestamp 600 seconds old (expired replay attack)', async () => {
      const event = createMockCheckoutSessionCompletedEvent({
        sessionId: 'cs_test_stale_replay_02',
      });
      const payload = JSON.stringify(event);
      const expiredSignature = generateExpiredWebhookSignature(payload, TEST_WEBHOOK_SECRET, 600);

      const req = createRawRequest('/api/stripe/webhook', payload, {
        headers: {
          'stripe-signature': expiredSignature,
          'content-type': 'application/json',
        },
      });

      const res = await invokeRouteHandler(webhookPost, req);
      expect(res.status).toBe(400);
    });
  });

  // ==========================================================================
  // 3. FUTURE TIMESTAMP ATTACKS (> 300 SECONDS)
  // ==========================================================================
  describe('Future Timestamp Attacks', () => {
    it('rejects signature with timestamp 600 seconds in the future', async () => {
      const event = createMockCheckoutSessionCompletedEvent({
        sessionId: 'cs_test_future_time_01',
      });
      const payload = JSON.stringify(event);

      const futureTimestamp = Math.floor(Date.now() / 1000) + 600;
      const futureSignature = generateMockWebhookSignature(
        payload,
        TEST_WEBHOOK_SECRET,
        futureTimestamp
      );

      const req = createRawRequest('/api/stripe/webhook', payload, {
        headers: {
          'stripe-signature': futureSignature,
          'content-type': 'application/json',
        },
      });

      const res = await invokeRouteHandler(webhookPost, req);
      expect(res.status).toBe(400);
    });
  });

  // ==========================================================================
  // 4. MALFORMED STRIPE-SIGNATURE HEADER FORMAT
  // ==========================================================================
  describe('Malformed Signature Header Formats', () => {
    const event = createMockCheckoutSessionCompletedEvent();
    const payload = JSON.stringify(event);

    it('rejects header missing t= timestamp parameter (e.g. "v1=...")', async () => {
      const req = createRawRequest('/api/stripe/webhook', payload, {
        headers: {
          'stripe-signature': 'v1=e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          'content-type': 'application/json',
        },
      });
      const res = await invokeRouteHandler(webhookPost, req);
      expect(res.status).toBe(400);
    });

    it('rejects header missing v1= signature parameter (e.g. "t=1700000000")', async () => {
      const req = createRawRequest('/api/stripe/webhook', payload, {
        headers: {
          'stripe-signature': `t=${Math.floor(Date.now() / 1000)}`,
          'content-type': 'application/json',
        },
      });
      const res = await invokeRouteHandler(webhookPost, req);
      expect(res.status).toBe(400);
    });

    it('rejects non-standard authorization format ("Bearer my_test_token")', async () => {
      const req = createRawRequest('/api/stripe/webhook', payload, {
        headers: {
          'stripe-signature': 'Bearer secret_webhook_token',
          'content-type': 'application/json',
        },
      });
      const res = await invokeRouteHandler(webhookPost, req);
      expect(res.status).toBe(400);
    });

    it('rejects completely empty stripe-signature header', async () => {
      const req = createRawRequest('/api/stripe/webhook', payload, {
        headers: {
          'stripe-signature': '',
          'content-type': 'application/json',
        },
      });
      const res = await invokeRouteHandler(webhookPost, req);
      expect(res.status).toBe(400);
    });

    it('rejects request with missing stripe-signature header when secret is configured', async () => {
      const req = createRawRequest('/api/stripe/webhook', payload, {
        headers: {
          'content-type': 'application/json',
        },
      });
      const res = await invokeRouteHandler(webhookPost, req);
      expect(res.status).toBe(400);
    });
  });

  // ==========================================================================
  // 5. UNRECOGNIZED & UNHANDLED EVENT TYPES
  // ==========================================================================
  describe('Unrecognized & Non-Payment Event Types', () => {
    it('safely acknowledges unrecognized event type (customer.discount.created) with 200 OK', async () => {
      const unhandledEvent = {
        id: `evt_discount_${Date.now()}`,
        object: 'event',
        api_version: '2023-10-16',
        created: Math.floor(Date.now() / 1000),
        type: 'customer.discount.created',
        livemode: false,
        data: {
          object: {
            id: 'di_test_123',
            coupon: { id: 'promo_save10' },
          },
        },
      };

      const payload = JSON.stringify(unhandledEvent);
      const signature = generateMockWebhookSignature(payload, TEST_WEBHOOK_SECRET);

      const req = createRawRequest('/api/stripe/webhook', payload, {
        headers: {
          'stripe-signature': signature,
          'content-type': 'application/json',
        },
      });

      const res = await invokeRouteHandler(webhookPost, req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.received).toBe(true);
    });

    it('safely acknowledges invoice.payment_action_required with 200 OK without crashing', async () => {
      const event = {
        id: `evt_inv_${Date.now()}`,
        object: 'event',
        type: 'invoice.payment_action_required',
        created: Math.floor(Date.now() / 1000),
        data: { object: { id: 'in_test_789' } },
      };
      const payload = JSON.stringify(event);
      const signature = generateMockWebhookSignature(payload, TEST_WEBHOOK_SECRET);

      const req = createRawRequest('/api/stripe/webhook', payload, {
        headers: {
          'stripe-signature': signature,
          'content-type': 'application/json',
        },
      });

      const res = await invokeRouteHandler(webhookPost, req);
      expect(res.status).toBe(200);
    });
  });

  // ==========================================================================
  // 6. MISSING DATA.OBJECT IN EVENT PAYLOAD
  // ==========================================================================
  describe('Missing or Malformed data.object Payload', () => {
    it('handles payload with missing data.object without unhandled 500 crash', async () => {
      const malformedEvent = {
        id: `evt_bad_data_${Date.now()}`,
        object: 'event',
        type: 'checkout.session.completed',
        created: Math.floor(Date.now() / 1000),
        data: {}, // Missing .object
      };

      const payload = JSON.stringify(malformedEvent);
      const signature = generateMockWebhookSignature(payload, TEST_WEBHOOK_SECRET);

      const req = createRawRequest('/api/stripe/webhook', payload, {
        headers: {
          'stripe-signature': signature,
          'content-type': 'application/json',
        },
      });

      const res = await invokeRouteHandler(webhookPost, req);
      // Must not crash with 500 (accepts gracefully or returns 200/400)
      expect(res.status).toBeLessThan(500);
    });
  });

  // ==========================================================================
  // 7. EMPTY BODY & CORRUPT JSON
  // ==========================================================================
  describe('Empty Body and Invalid JSON Payloads', () => {
    it('returns 400 when body is completely empty', async () => {
      const signature = generateMockWebhookSignature('', TEST_WEBHOOK_SECRET);
      const req = createRawRequest('/api/stripe/webhook', '', {
        headers: {
          'stripe-signature': signature,
          'content-type': 'application/json',
        },
      });

      const res = await invokeRouteHandler(webhookPost, req);
      expect(res.status).toBe(400);
    });

    it('returns 400 when body contains unparseable corrupted JSON', async () => {
      const corruptPayload = '{"id": "evt_123", "type": "checkout.session.completed", broken...';
      const signature = generateMockWebhookSignature(corruptPayload, TEST_WEBHOOK_SECRET);

      const req = createRawRequest('/api/stripe/webhook', corruptPayload, {
        headers: {
          'stripe-signature': signature,
          'content-type': 'application/json',
        },
      });

      const res = await invokeRouteHandler(webhookPost, req);
      expect(res.status).toBe(400);
    });
  });

  // ==========================================================================
  // 8. WRONG SIGNING SECRET
  // ==========================================================================
  describe('Wrong Signing Secret Verification', () => {
    it('fails signature verification when signed with attacker secret key', async () => {
      const event = createMockCheckoutSessionCompletedEvent();
      const payload = JSON.stringify(event);

      // Signed with attacker's secret key instead of server's TEST_WEBHOOK_SECRET
      const attackerSignature = generateForgedWebhookSignature(
        payload,
        'whsec_attacker_controlled_secret_key_666'
      );

      const req = createRawRequest('/api/stripe/webhook', payload, {
        headers: {
          'stripe-signature': attackerSignature,
          'content-type': 'application/json',
        },
      });

      const res = await invokeRouteHandler(webhookPost, req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/signature/i);
    });
  });

  // ==========================================================================
  // 9. IDEMPOTENT DELIVERY & DUPLICATE WEBHOOK HANDLING
  // ==========================================================================
  describe('Idempotency & Duplicate Webhook Handling', () => {
    it('handles duplicate delivery of the same checkout.session.completed event idempotently', async () => {
      const duplicateSessionId = `cs_test_duplicate_idemp_${Date.now()}`;
      const event = createMockCheckoutSessionCompletedEvent({
        sessionId: duplicateSessionId,
        customerEmail: 'duplicate.candidate@example.com',
      });
      const payload = JSON.stringify(event);
      const signature = generateMockWebhookSignature(payload, TEST_WEBHOOK_SECRET);

      // 1st delivery
      const req1 = createRawRequest('/api/stripe/webhook', payload, {
        headers: {
          'stripe-signature': signature,
          'content-type': 'application/json',
        },
      });
      const res1 = await invokeRouteHandler(webhookPost, req1);
      expect(res1.status).toBe(200);

      // 2nd delivery (Stripe retry simulation)
      const req2 = createRawRequest('/api/stripe/webhook', payload, {
        headers: {
          'stripe-signature': signature,
          'content-type': 'application/json',
        },
      });
      const res2 = await invokeRouteHandler(webhookPost, req2);
      expect(res2.status).toBe(200);
      const data2 = await res2.json();
      expect(data2.received).toBe(true);
    });
  });
});
