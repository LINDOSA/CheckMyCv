/**
 * Smoke Test: E2E Test Infrastructure Verification
 * Verifies that Vitest runner, TypeScript compilation, path aliases,
 * fixtures, Stripe mock utilities, and Route Harness function correctly.
 */

import { describe, it, expect } from 'vitest';
import path from 'path';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

// Test path alias import
import { REWRITE_PRODUCT } from '@/lib/stripe';
import { STANDARD_CV_ALEX } from '@/lib/cvStandardData';

// Test helper imports
import {
  HIGH_QUALITY_ATS_CV,
  LOW_QUALITY_NO_METRICS_CV,
  MISSING_CONTACT_CV,
  BROKEN_HIERARCHY_CV,
  BOUNDARY_39_METRIC_CV,
  BOUNDARY_40_METRIC_CV,
  SAMPLE_PAYMENT_RECORDS,
  VALID_PAID_SESSION_ID,
  FORGED_SESSION_ID,
  TEST_CUSTOMER_EMAIL,
} from './helpers/fixtures';

import {
  generateMockWebhookSignature,
  generateForgedWebhookSignature,
  generateExpiredWebhookSignature,
  createMockCheckoutSessionCompletedEvent,
  createMockPaymentIntentSucceededEvent,
  createMockStripeClient,
} from './helpers/stripeMocks';

import {
  buildTestUrl,
  createTestRequest,
  createJsonRequest,
  createGetRequest,
  createRawRequest,
  invokeRouteHandler,
} from './helpers/routeHarness';

describe('E2E Test Infrastructure Smoke Test', () => {
  describe('Vitest & Path Alias Resolution', () => {
    it('executes basic assertions and arithmetic cleanly', () => {
      expect(1 + 1).toBe(2);
      expect(true).toBe(true);
      expect([1, 2, 3]).toContain(2);
    });

    it('resolves TypeScript path alias @/* to ./src/*', () => {
      expect(REWRITE_PRODUCT).toBeDefined();
      expect(REWRITE_PRODUCT.amountCents).toBe(900);
      expect(REWRITE_PRODUCT.currency).toBe('usd');

      expect(STANDARD_CV_ALEX).toBeDefined();
      expect(STANDARD_CV_ALEX.name).toBe('ALEX MORGAN');
      expect(STANDARD_CV_ALEX.contact.email).toBe('alex.morgan@email.com');
    });
  });

  describe('Fixtures Integrity', () => {
    it('provides valid High Quality ATS CV with contact integrity and XYZ metrics', () => {
      expect(HIGH_QUALITY_ATS_CV.name).toBe('ALEX MORGAN');
      expect(HIGH_QUALITY_ATS_CV.contact.email).toContain('@');
      expect(HIGH_QUALITY_ATS_CV.contact.phone).toBeDefined();
      expect(HIGH_QUALITY_ATS_CV.skillsGrid.length).toBeGreaterThan(0);
      expect(HIGH_QUALITY_ATS_CV.experience.length).toBeGreaterThan(0);

      // Check that experience bullets have quantifiable numbers/percentages
      const allBullets = HIGH_QUALITY_ATS_CV.experience.flatMap((exp) => exp.bullets);
      const bulletsWithNumbers = allBullets.filter((b) => /\d+%|\d+x|\$\d+|\d+\+?/.test(b));
      const metricSaturation = bulletsWithNumbers.length / allBullets.length;
      expect(metricSaturation).toBeGreaterThanOrEqual(0.7); // High quality should be well above 40%
    });

    it('provides Low Quality CV lacking metrics for negative testing', () => {
      expect(LOW_QUALITY_NO_METRICS_CV.name).toBe('JORDAN SMITH');
      const allBullets = LOW_QUALITY_NO_METRICS_CV.experience.flatMap((exp) => exp.bullets);
      const bulletsWithNumbers = allBullets.filter((b) => /\d+%|\d+x|\$\d+/.test(b));
      expect(bulletsWithNumbers.length).toBe(0); // 0% metric saturation
    });

    it('provides Boundary CVs for BVA testing of 40% threshold', () => {
      // 39% boundary should fail the >=40% threshold
      const b39Bullets = BOUNDARY_39_METRIC_CV.experience.flatMap((e) => e.bullets);
      const b39Metrics = b39Bullets.filter((b) => /\d+%|\d+\s*hours/.test(b));
      const b39Saturation = b39Metrics.length / b39Bullets.length;
      expect(b39Saturation).toBeLessThan(0.4);

      // 40% boundary should meet the threshold exactly
      const b40Bullets = BOUNDARY_40_METRIC_CV.experience.flatMap((e) => e.bullets);
      const b40Metrics = b40Bullets.filter((b) => /\d+%/.test(b));
      const b40Saturation = b40Metrics.length / b40Bullets.length;
      expect(b40Saturation).toBe(0.4);
    });

    it('provides Payment Fixtures matching registry interfaces', () => {
      const { verifiedPaidRecord, unpaidRecord } = SAMPLE_PAYMENT_RECORDS;
      expect(verifiedPaidRecord.sessionId).toBe(VALID_PAID_SESSION_ID);
      expect(verifiedPaidRecord.paymentStatus).toBe('paid');
      expect(verifiedPaidRecord.customerEmail).toBe(TEST_CUSTOMER_EMAIL);

      expect(unpaidRecord.paymentStatus).toBe('unpaid');
      expect(FORGED_SESSION_ID).toContain('fake');
    });
  });

  describe('Stripe Mock Utilities', () => {
    const testSecret = 'whsec_test_secret_key_12345';
    const payload = JSON.stringify({ id: 'evt_123', type: 'checkout.session.completed' });

    it('generates valid HMAC-SHA256 Stripe signatures matching Stripe protocol', () => {
      const now = Math.floor(Date.now() / 1000);
      const header = generateMockWebhookSignature(payload, testSecret, now);

      expect(header).toMatch(/^t=\d+,v1=[0-9a-f]{64}$/);
      expect(header).toContain(`t=${now}`);

      // Verify HMAC matches independent calculation
      const expectedHmac = crypto
        .createHmac('sha256', testSecret)
        .update(`${now}.${payload}`, 'utf8')
        .digest('hex');
      expect(header).toContain(`v1=${expectedHmac}`);
    });

    it('creates distinguishable forged and expired signatures', () => {
      const validHeader = generateMockWebhookSignature(payload, testSecret);
      const forgedHeader = generateForgedWebhookSignature(payload, 'wrong_secret');
      expect(validHeader).not.toBe(forgedHeader);

      const expiredHeader = generateExpiredWebhookSignature(payload, testSecret, 1000);
      const timestampMatch = expiredHeader.match(/t=(\d+)/);
      expect(timestampMatch).not.toBeNull();
      const headerTime = parseInt(timestampMatch![1], 10);
      const currentTime = Math.floor(Date.now() / 1000);
      expect(currentTime - headerTime).toBeGreaterThanOrEqual(990);
    });

    it('generates realistic Stripe checkout.session.completed event structures', () => {
      const event = createMockCheckoutSessionCompletedEvent({
        sessionId: 'cs_live_test_001',
        customerEmail: 'candidate@domain.com',
        amountTotal: 900,
      });

      expect(event.type).toBe('checkout.session.completed');
      expect(event.data.object.id).toBe('cs_live_test_001');
      expect(event.data.object.payment_status).toBe('paid');
      expect(event.data.object.amount_total).toBe(900);
      expect(event.data.object.customer_details?.email).toBe('candidate@domain.com');
    });
  });

  describe('Route Harness & Next.js Execution', () => {
    it('builds test URLs with query parameters correctly', () => {
      const url = buildTestUrl('/api/export/docx', {
        sessionId: 'cs_123',
        format: 'word',
        count: 5,
      });
      expect(url).toBe('http://localhost:3000/api/export/docx?sessionId=cs_123&format=word&count=5');
    });

    it('creates NextRequest instances with proper headers and JSON body', async () => {
      const req = createJsonRequest('/api/score', {
        cvText: 'Test CV Content with 20 words for scoring evaluation.',
      });

      expect(req.method).toBe('POST');
      expect(req.headers.get('content-type')).toContain('application/json');
      const body = await req.json();
      expect(body.cvText).toBe('Test CV Content with 20 words for scoring evaluation.');
    });

    it('invokes route handlers cleanly and parses JSON and status responses', async () => {
      // Mock Next.js route handler
      async function sampleHandler(req: NextRequest) {
        const body = await req.json();
        if (!body.name) {
          return NextResponse.json({ error: 'Missing name' }, { status: 400 });
        }
        return NextResponse.json({ greeting: `Hello, ${body.name}` }, { status: 200 });
      }

      const reqValid = createJsonRequest('/api/greet', { name: 'Alice' });
      const resValid = await invokeRouteHandler(sampleHandler, reqValid);

      expect(resValid.status).toBe(200);
      expect(resValid.ok).toBe(true);
      const dataValid = await resValid.json();
      expect(dataValid.greeting).toBe('Hello, Alice');

      const reqInvalid = createJsonRequest('/api/greet', {});
      const resInvalid = await invokeRouteHandler(sampleHandler, reqInvalid);
      expect(resInvalid.status).toBe(400);
      const dataInvalid = await resInvalid.json();
      expect(dataInvalid.error).toBe('Missing name');
    });
  });
});
