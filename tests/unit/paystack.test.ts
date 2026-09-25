/**
 * Paystack payment rail: signature verification, pricing guards, and the
 * webhook / verify routes that decide whether a candidate's CV is unlocked.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import crypto from 'crypto';

import { POST as paystackWebhook } from '@/app/api/paystack/webhook/route';
import { GET as paystackVerify } from '@/app/api/paystack/verify/route';
import { POST as paystackCheckout } from '@/app/api/paystack/checkout/route';

import {
  buildInvoiceNumber,
  generatePaystackReference,
  getRewriteAmountCents,
  isPaystackReference,
  verifyPaystackSignature,
} from '@/lib/paystack';
import { paymentRegistry } from '@/lib/paymentRegistry';
import { emailOutbox } from '@/lib/invoiceEmailService';
import { verifyServerPayment } from '@/lib/serverPaymentVerification';

import {
  createRawRequest,
  createGetRequest,
  createJsonRequest,
  invokeRouteHandler,
} from '../e2e/helpers/routeHarness';

const TEST_SECRET = 'sk_test_paystack_unit_suite_secret_key';

function sign(body: string, secret: string = TEST_SECRET): string {
  return crypto.createHmac('sha512', secret).update(body, 'utf-8').digest('hex');
}

function chargeSuccessEvent(overrides: Record<string, any> = {}) {
  return {
    event: 'charge.success',
    data: {
      reference: overrides.reference ?? 'smcv_1700000000000_abcdef123456',
      status: overrides.status ?? 'success',
      amount: overrides.amount ?? 16000,
      currency: overrides.currency ?? 'ZAR',
      paid_at: '2026-09-19T08:00:00.000Z',
      customer: { email: overrides.email ?? 'candidate@example.com' },
      metadata: overrides.metadata ?? { profileId: 'it_cloud', candidateName: 'Alex Morgan' },
    },
  };
}

describe('Paystack payment rail', () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(async () => {
    process.env.PAYSTACK_SECRET_KEY = TEST_SECRET;
    delete process.env.PAYSTACK_AMOUNT_CENTS;
    emailOutbox.length = 0;
    await paymentRegistry.clear();
  });

  afterEach(async () => {
    await paymentRegistry.clear();
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // Signature verification (HMAC SHA512 over the raw body, signed with the key)
  // ==========================================================================
  describe('Webhook signature verification', () => {
    it('accepts a signature computed with the account secret key', () => {
      const body = JSON.stringify(chargeSuccessEvent());
      expect(verifyPaystackSignature(body, sign(body))).toBe(true);
    });

    it('rejects a signature produced with a different secret', () => {
      const body = JSON.stringify(chargeSuccessEvent());
      expect(verifyPaystackSignature(body, sign(body, 'sk_test_attacker_key'))).toBe(false);
    });

    it('rejects a valid signature once the body has been tampered with', () => {
      const body = JSON.stringify(chargeSuccessEvent({ amount: 16000 }));
      const signature = sign(body);
      const tampered = body.replace('"amount":16000', '"amount":100');
      expect(verifyPaystackSignature(tampered, signature)).toBe(false);
    });

    it('rejects a missing or empty signature', () => {
      const body = JSON.stringify(chargeSuccessEvent());
      expect(verifyPaystackSignature(body, null)).toBe(false);
      expect(verifyPaystackSignature(body, '')).toBe(false);
    });

    it('rejects a truncated signature without throwing on length mismatch', () => {
      const body = JSON.stringify(chargeSuccessEvent());
      expect(() => verifyPaystackSignature(body, sign(body).slice(0, 40))).not.toThrow();
      expect(verifyPaystackSignature(body, sign(body).slice(0, 40))).toBe(false);
    });
  });

  // ==========================================================================
  // Pricing and references
  // ==========================================================================
  describe('Pricing and reference helpers', () => {
    it('defaults to R160.00 expressed in ZAR cents', () => {
      expect(getRewriteAmountCents()).toBe(16000);
    });

    it('honours a PAYSTACK_AMOUNT_CENTS override', () => {
      process.env.PAYSTACK_AMOUNT_CENTS = '24900';
      expect(getRewriteAmountCents()).toBe(24900);
    });

    it('ignores a zero, negative or non-numeric override', () => {
      for (const bad of ['0', '-5000', 'free']) {
        process.env.PAYSTACK_AMOUNT_CENTS = bad;
        expect(getRewriteAmountCents()).toBe(16000);
      }
    });

    it('generates unique, recognisable references', () => {
      const a = generatePaystackReference();
      const b = generatePaystackReference();
      expect(a).not.toBe(b);
      expect(isPaystackReference(a)).toBe(true);
      expect(isPaystackReference('cs_test_stripe_session')).toBe(false);
      expect(isPaystackReference(null)).toBe(false);
    });

    it('derives a deterministic invoice number from the reference', () => {
      expect(buildInvoiceNumber('smcv_1700000000000_abcdef123456')).toBe('INV-EF123456');
    });
  });

  // ==========================================================================
  // Webhook route
  // ==========================================================================
  describe('POST /api/paystack/webhook', () => {
    it('records a paid transaction when the signature is valid', async () => {
      const event = chargeSuccessEvent({ reference: 'smcv_valid_paid_001' });
      const body = JSON.stringify(event);

      const res = await invokeRouteHandler(
        paystackWebhook,
        createRawRequest('/api/paystack/webhook', body, {
          headers: { 'content-type': 'application/json', 'x-paystack-signature': sign(body) },
        })
      );

      expect(res.status).toBe(200);
      const record = await paymentRegistry.getPaymentBySessionId('smcv_valid_paid_001');
      expect(record?.paymentStatus).toBe('paid');
      expect(record?.amountCents).toBe(16000);
      expect(record?.currency).toBe('ZAR');
      expect(record?.customerEmail).toBe('candidate@example.com');
    });

    it('rejects a forged signature with 400 and records nothing', async () => {
      const body = JSON.stringify(chargeSuccessEvent({ reference: 'smcv_forged_001' }));

      const res = await invokeRouteHandler(
        paystackWebhook,
        createRawRequest('/api/paystack/webhook', body, {
          headers: { 'x-paystack-signature': sign(body, 'sk_test_attacker_key') },
        })
      );

      expect(res.status).toBe(400);
      expect(await paymentRegistry.getPaymentBySessionId('smcv_forged_001')).toBeNull();
    });

    it('rejects a delivery with no signature header', async () => {
      const body = JSON.stringify(chargeSuccessEvent({ reference: 'smcv_unsigned_001' }));
      const res = await invokeRouteHandler(
        paystackWebhook,
        createRawRequest('/api/paystack/webhook', body)
      );

      expect(res.status).toBe(400);
      expect(await paymentRegistry.getPaymentBySessionId('smcv_unsigned_001')).toBeNull();
    });

    it('refuses to process webhooks when no secret key is configured', async () => {
      delete process.env.PAYSTACK_SECRET_KEY;
      const body = JSON.stringify(chargeSuccessEvent({ reference: 'smcv_nokey_001' }));

      const res = await invokeRouteHandler(
        paystackWebhook,
        createRawRequest('/api/paystack/webhook', body, {
          headers: { 'x-paystack-signature': sign(body) },
        })
      );

      expect(res.status).toBe(500);
      expect(await paymentRegistry.getPaymentBySessionId('smcv_nokey_001')).toBeNull();
    });

    it('does not grant access for an underpaid transaction', async () => {
      const event = chargeSuccessEvent({ reference: 'smcv_underpaid_001', amount: 100 });
      const body = JSON.stringify(event);

      const res = await invokeRouteHandler(
        paystackWebhook,
        createRawRequest('/api/paystack/webhook', body, {
          headers: { 'x-paystack-signature': sign(body) },
        })
      );

      // Acknowledged so Paystack stops retrying, but never recorded as paid.
      expect(res.status).toBe(200);
      expect(await paymentRegistry.isSessionVerified('smcv_underpaid_001')).toBe(false);
    });

    it('acknowledges unrelated event types without recording a payment', async () => {
      const body = JSON.stringify({
        event: 'transfer.success',
        data: { reference: 'smcv_transfer_001', status: 'success', amount: 16000 },
      });

      const res = await invokeRouteHandler(
        paystackWebhook,
        createRawRequest('/api/paystack/webhook', body, {
          headers: { 'x-paystack-signature': sign(body) },
        })
      );

      expect(res.status).toBe(200);
      expect(await paymentRegistry.getPaymentBySessionId('smcv_transfer_001')).toBeNull();
    });

    it('stays idempotent across repeated deliveries of the same charge', async () => {
      const body = JSON.stringify(chargeSuccessEvent({ reference: 'smcv_idempotent_001' }));
      const signature = sign(body);

      for (let i = 0; i < 3; i++) {
        const res = await invokeRouteHandler(
          paystackWebhook,
          createRawRequest('/api/paystack/webhook', body, {
            headers: { 'x-paystack-signature': signature },
          })
        );
        expect(res.status).toBe(200);
      }

      const all = await paymentRegistry.getAllPayments();
      expect(all.filter((r) => r.sessionId === 'smcv_idempotent_001')).toHaveLength(1);
      // The candidate must not be emailed their CV three times.
      expect(emailOutbox).toHaveLength(1);
    });
  });

  // ==========================================================================
  // Verify route and export gating
  // ==========================================================================
  describe('GET /api/paystack/verify', () => {
    it('returns 400 when no reference is supplied', async () => {
      const res = await invokeRouteHandler(
        paystackVerify,
        createGetRequest('/api/paystack/verify')
      );
      expect(res.status).toBe(400);
      expect((await res.json()).verified).toBe(false);
    });

    it('confirms a reference already recorded as paid without calling Paystack', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      await paymentRegistry.recordPayment({
        sessionId: 'smcv_registry_hit_001',
        customerEmail: 'candidate@example.com',
        profileId: 'it_cloud',
        candidateName: 'Alex Morgan',
        paymentStatus: 'paid',
        amountCents: 16000,
        currency: 'ZAR',
        invoiceNumber: 'INV-HIT00001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const res = await invokeRouteHandler(
        paystackVerify,
        createGetRequest('/api/paystack/verify', {
          searchParams: { reference: 'smcv_registry_hit_001' },
        })
      );

      expect(res.status).toBe(200);
      expect((await res.json()).verified).toBe(true);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('does not trust an unpaid reference returned by Paystack', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(
          JSON.stringify({
            status: true,
            data: { reference: 'smcv_abandoned_001', status: 'abandoned', amount: 0 },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      );

      const res = await invokeRouteHandler(
        paystackVerify,
        createGetRequest('/api/paystack/verify', {
          searchParams: { reference: 'smcv_abandoned_001' },
        })
      );

      expect((await res.json()).verified).toBe(false);
      expect(await paymentRegistry.isSessionVerified('smcv_abandoned_001')).toBe(false);
    });
  });

  describe('POST /api/paystack/checkout', () => {
    it('requires a valid email address', async () => {
      const res = await invokeRouteHandler(
        paystackCheckout,
        createJsonRequest('/api/paystack/checkout', { email: 'not-an-email' })
      );
      expect(res.status).toBe(400);
    });

    it('returns 503 rather than a fake unlock when no secret key is configured', async () => {
      delete process.env.PAYSTACK_SECRET_KEY;
      const res = await invokeRouteHandler(
        paystackCheckout,
        createJsonRequest('/api/paystack/checkout', { email: 'candidate@example.com' })
      );
      expect(res.status).toBe(503);
      expect((await res.json()).success).toBe(false);
    });

    it('sets the amount server-side, ignoring any amount sent by the client', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(
          JSON.stringify({
            status: true,
            data: {
              authorization_url: 'https://checkout.paystack.com/abc123',
              access_code: 'abc123',
              reference: 'smcv_from_paystack_001',
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      );

      const res = await invokeRouteHandler(
        paystackCheckout,
        createJsonRequest('/api/paystack/checkout', {
          email: 'candidate@example.com',
          amount: 1,
          amountCents: 1,
        })
      );

      expect(res.status).toBe(200);
      const sentBody = JSON.parse((fetchSpy.mock.calls[0][1] as any).body);
      expect(sentBody.amount).toBe(16000);
      expect(sentBody.currency).toBe('ZAR');
    });
  });

  describe('Export gating via verifyServerPayment', () => {
    it('authorizes a Paystack reference recorded as paid', async () => {
      await paymentRegistry.recordPayment({
        sessionId: 'smcv_gate_paid_001',
        customerEmail: 'candidate@example.com',
        profileId: 'it_cloud',
        candidateName: 'Alex Morgan',
        paymentStatus: 'paid',
        amountCents: 16000,
        currency: 'ZAR',
        invoiceNumber: 'INV-GATE0001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const result = await verifyServerPayment('smcv_gate_paid_001');
      expect(result.authorized).toBe(true);
    });

    it('refuses an invented reference that Paystack does not recognise', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ status: false, message: 'Transaction not found' }), {
          status: 404,
          headers: { 'content-type': 'application/json' },
        })
      );

      const result = await verifyServerPayment('smcv_invented_by_attacker');
      expect(result.authorized).toBe(false);
    });
  });
});
