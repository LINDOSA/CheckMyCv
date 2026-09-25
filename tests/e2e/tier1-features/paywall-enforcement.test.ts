/**
 * Tier 1: Feature Coverage Test Suite
 * Paywall Enforcement & Secure Export Gating
 *
 * Covers:
 * - Feature 1: Server-Verified DOCX Export (/api/export/docx)
 * - Feature 2: Server-Verified Native PDF Export (/api/export/pdf)
 * - Feature 3: Hardened Email Dispatch (/api/email/send-cv)
 * - Feature 4: Paywall Bypass Prevention & Token Forgery
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import { GET as docxGet, POST as docxPost } from '@/app/api/export/docx/route';
import { GET as pdfGet, POST as pdfPost } from '@/app/api/export/pdf/route';
import { GET as emailGet, POST as emailPost } from '@/app/api/email/send-cv/route';
import { paymentRegistry, FilePaymentRegistry } from '@/lib/paymentRegistry';
import {
  invokeRouteHandler,
  createGetRequest,
  createJsonRequest,
  createTestRequest,
} from '../helpers/routeHarness';
import {
  VALID_PAID_SESSION_ID,
  UNPAID_SESSION_ID,
  FORGED_SESSION_ID,
  TEST_CUSTOMER_EMAIL,
  UNPAID_CUSTOMER_EMAIL,
  SAMPLE_PAYMENT_RECORDS,
  HIGH_QUALITY_ATS_CV,
} from '../helpers/fixtures';

describe('Tier 1: Paywall Enforcement & Export Gating', () => {
  beforeEach(async () => {
    // Ensure test payment records are cleanly registered
    await paymentRegistry.recordPayment(SAMPLE_PAYMENT_RECORDS.verifiedPaidRecord);
    await paymentRegistry.recordPayment(SAMPLE_PAYMENT_RECORDS.unpaidRecord);
  });

  // ==========================================================================
  // FEATURE 1: SECURE DOCX EXPORT GATING (/api/export/docx)
  // ==========================================================================
  describe('Feature 1: Secure DOCX Export Gating', () => {
    it('1.1 GET /api/export/docx without session ID returns 402 Payment Required', async () => {
      const req = createGetRequest('/api/export/docx');
      const res = await invokeRouteHandler(docxGet, req);

      expect(res.status).toBe(402);
      expect(res.ok).toBe(false);
      expect(res.getHeader('x-paywall-required')).toBe('true');
      expect(res.getHeader('www-authenticate')).toContain('Stripe');
      expect(res.getHeader('cache-control')).toContain('no-store');

      const data = await res.json();
      expect(data.code).toBe('PAYMENT_REQUIRED');
      expect(data.status).toBe(402);
      expect(data.error).toContain('Payment required');
    });

    it('1.2 GET /api/export/docx with empty session parameter returns 402 Payment Required', async () => {
      const req = createGetRequest('/api/export/docx', {
        searchParams: { session_id: '   ' },
      });
      const res = await invokeRouteHandler(docxGet, req);

      expect(res.status).toBe(402);
      const data = await res.json();
      expect(data.status).toBe(402);
      expect(data.code).toBe('PAYMENT_REQUIRED');
    });

    it('1.3 POST /api/export/docx without payment session returns 402 Payment Required', async () => {
      const req = createJsonRequest('/api/export/docx', {
        profileId: 'executive',
        cvText: 'Senior IT Support Specialist with 5 years experience...',
      });
      const res = await invokeRouteHandler(docxPost, req);

      expect(res.status).toBe(402);
      const data = await res.json();
      expect(data.code).toBe('PAYMENT_REQUIRED');
    });

    it('1.4 POST /api/export/docx with unpaid session in registry returns 402 Payment Required', async () => {
      const req = createJsonRequest('/api/export/docx', {
        sessionId: UNPAID_SESSION_ID,
        profileId: 'junior_dev_02',
      });
      const res = await invokeRouteHandler(docxPost, req);

      expect(res.status).toBe(402);
      const data = await res.json();
      expect(data.code).toBe('PAYMENT_REQUIRED');
      expect(data.details.reason).toContain('unpaid');
    });

    it('1.5 GET /api/export/docx with verified payment session returns 200 with valid Word document binary', async () => {
      const req = createGetRequest('/api/export/docx', {
        searchParams: { session_id: VALID_PAID_SESSION_ID, profile: 'executive' },
      });
      const res = await invokeRouteHandler(docxGet, req);

      expect(res.status).toBe(200);
      expect(res.ok).toBe(true);
      expect(res.getHeader('content-type')).toBe(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      expect(res.getHeader('content-disposition')).toContain('attachment; filename=');
      expect(res.getHeader('content-disposition')).toContain('.docx');

      const buffer = await res.buffer();
      expect(buffer.length).toBeGreaterThan(100);
      // Verify standard PK zip magic header (50 4B 03 04) for DOCX / OpenXML
      expect(buffer.subarray(0, 4).toString('hex')).toBe('504b0304');
    });

    it('1.6 POST /api/export/docx with verified payment session and custom CV returns 200 with Word binary', async () => {
      const req = createJsonRequest('/api/export/docx', {
        sessionId: VALID_PAID_SESSION_ID,
        cvData: HIGH_QUALITY_ATS_CV,
      });
      const res = await invokeRouteHandler(docxPost, req);

      expect(res.status).toBe(200);
      expect(res.ok).toBe(true);
      expect(res.getHeader('content-type')).toBe(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );

      const buffer = await res.buffer();
      expect(buffer.length).toBeGreaterThan(500);
      expect(buffer.subarray(0, 4).toString('hex')).toBe('504b0304');
    });

    it('1.7 GET /api/export/docx accepts session token via x-session-id HTTP header', async () => {
      const req = createTestRequest('/api/export/docx', {
        method: 'GET',
        headers: {
          'x-session-id': VALID_PAID_SESSION_ID,
        },
      });
      const res = await invokeRouteHandler(docxGet, req);

      expect(res.status).toBe(200);
      expect(res.ok).toBe(true);
      expect(res.getHeader('content-type')).toContain('officedocument.wordprocessingml.document');
    });
  });

  // ==========================================================================
  // FEATURE 2: SECURE PDF EXPORT GATING (/api/export/pdf)
  // ==========================================================================
  describe('Feature 2: Secure PDF Export Gating', () => {
    it('2.1 GET /api/export/pdf without session ID returns 402 Payment Required', async () => {
      const req = createGetRequest('/api/export/pdf');
      const res = await invokeRouteHandler(pdfGet, req);

      expect(res.status).toBe(402);
      expect(res.ok).toBe(false);
      expect(res.getHeader('x-paywall-required')).toBe('true');
      expect(res.getHeader('www-authenticate')).toContain('Stripe');

      const data = await res.json();
      expect(data.code).toBe('PAYMENT_REQUIRED');
      expect(data.status).toBe(402);
    });

    it('2.2 GET /api/export/pdf with empty/missing session_id query param returns 402', async () => {
      const req = createGetRequest('/api/export/pdf', {
        searchParams: { session_id: '' },
      });
      const res = await invokeRouteHandler(pdfGet, req);

      expect(res.status).toBe(402);
      const data = await res.json();
      expect(data.code).toBe('PAYMENT_REQUIRED');
    });

    it('2.3 POST /api/export/pdf without payment session returns 402 Payment Required', async () => {
      const req = createJsonRequest('/api/export/pdf', {
        profileId: 'executive',
        cvData: HIGH_QUALITY_ATS_CV,
      });
      const res = await invokeRouteHandler(pdfPost, req);

      expect(res.status).toBe(402);
      const data = await res.json();
      expect(data.code).toBe('PAYMENT_REQUIRED');
    });

    it('2.4 POST /api/export/pdf with unpaid session in registry returns 402 Payment Required', async () => {
      const req = createJsonRequest('/api/export/pdf', {
        sessionId: UNPAID_SESSION_ID,
        profileId: 'junior_dev_02',
      });
      const res = await invokeRouteHandler(pdfPost, req);

      expect(res.status).toBe(402);
      const data = await res.json();
      expect(data.code).toBe('PAYMENT_REQUIRED');
      expect(data.details.reason).toContain('unpaid');
    });

    it('2.5 GET /api/export/pdf with verified payment session returns 200 with native PDF binary', async () => {
      const req = createGetRequest('/api/export/pdf', {
        searchParams: { session_id: VALID_PAID_SESSION_ID, profile: 'executive' },
      });
      const res = await invokeRouteHandler(pdfGet, req);

      expect(res.status).toBe(200);
      expect(res.ok).toBe(true);
      expect(res.getHeader('content-type')).toBe('application/pdf');
      expect(res.getHeader('content-disposition')).toContain('attachment; filename=');
      expect(res.getHeader('content-disposition')).toContain('.pdf');
      expect(res.getHeader('x-payment-verified')).toBe('true');

      const buffer = await res.buffer();
      expect(buffer.length).toBeGreaterThan(100);
      // Verify standard PDF header (%PDF-)
      expect(buffer.subarray(0, 5).toString('utf-8')).toBe('%PDF-');
    });

    it('2.6 POST /api/export/pdf with verified payment session and custom CV returns 200 with PDF binary', async () => {
      const req = createJsonRequest('/api/export/pdf', {
        sessionId: VALID_PAID_SESSION_ID,
        cvData: HIGH_QUALITY_ATS_CV,
      });
      const res = await invokeRouteHandler(pdfPost, req);

      expect(res.status).toBe(200);
      expect(res.ok).toBe(true);
      expect(res.getHeader('content-type')).toBe('application/pdf');

      const buffer = await res.buffer();
      expect(buffer.length).toBeGreaterThan(500);
      expect(buffer.subarray(0, 5).toString('utf-8')).toBe('%PDF-');
    });

    it('2.7 POST /api/export/pdf accepts session token via x-session-id HTTP header', async () => {
      const req = createTestRequest('/api/export/pdf', {
        method: 'POST',
        headers: {
          'x-session-id': VALID_PAID_SESSION_ID,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ profileId: 'executive' }),
      });
      const res = await invokeRouteHandler(pdfPost, req);

      expect(res.status).toBe(200);
      expect(res.ok).toBe(true);
      expect(res.getHeader('content-type')).toBe('application/pdf');
    });
  });

  // ==========================================================================
  // FEATURE 3: SECURE EMAIL DISPATCH GATING (/api/email/send-cv)
  // ==========================================================================
  describe('Feature 3: Secure Email Dispatch Gating', () => {
    it('3.1 POST /api/email/send-cv without payment session returns 402 Payment Required', async () => {
      const req = createJsonRequest('/api/email/send-cv', {
        email: TEST_CUSTOMER_EMAIL,
        profileId: 'executive',
      });
      const res = await invokeRouteHandler(emailPost, req);

      expect(res.status).toBe(402);
      expect(res.ok).toBe(false);
      const data = await res.json();
      expect(data.code).toBe('PAYMENT_REQUIRED');
      expect(data.error).toContain('Payment required');
    });

    it('3.2 POST /api/email/send-cv with unpaid session in registry returns 402 Payment Required', async () => {
      const req = createJsonRequest('/api/email/send-cv', {
        email: UNPAID_CUSTOMER_EMAIL,
        sessionId: UNPAID_SESSION_ID,
      });
      const res = await invokeRouteHandler(emailPost, req);

      expect(res.status).toBe(402);
      const data = await res.json();
      expect(data.code).toBe('PAYMENT_REQUIRED');
    });

    it('3.3 POST /api/email/send-cv with missing recipient email returns 400 Bad Request', async () => {
      const req = createJsonRequest('/api/email/send-cv', {
        sessionId: VALID_PAID_SESSION_ID,
        email: '',
      });
      const res = await invokeRouteHandler(emailPost, req);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('valid recipient email');
    });

    it('3.4 POST /api/email/send-cv with malformed email (no @) returns 400 Bad Request', async () => {
      const req = createJsonRequest('/api/email/send-cv', {
        sessionId: VALID_PAID_SESSION_ID,
        email: 'invalid-email-no-at-sign.com',
      });
      const res = await invokeRouteHandler(emailPost, req);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('valid recipient email');
    });

    it('3.5 GET /api/email/send-cv returns 405 Method Not Allowed (closes data leak)', async () => {
      const req = createGetRequest('/api/email/send-cv');
      const res = await invokeRouteHandler(emailGet as any, req);

      expect(res.status).toBe(405);
      expect(res.getHeader('allow')).toBe('POST');
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Method Not Allowed');
    });

    it('3.6 POST /api/email/send-cv with verified payment session returns 200 and dispatches document', async () => {
      const req = createJsonRequest('/api/email/send-cv', {
        email: TEST_CUSTOMER_EMAIL,
        sessionId: VALID_PAID_SESSION_ID,
        profileId: 'executive',
        candidateName: 'Alex Morgan',
      });
      const res = await invokeRouteHandler(emailPost, req);

      expect(res.status).toBe(200);
      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.recipient).toBe(TEST_CUSTOMER_EMAIL);
      expect(data.delivered).toBe(true);
      expect(data.filename).toContain('.docx');
    });

    it('3.7 POST /api/email/send-cv accepts verified session token via x-session-id HTTP header', async () => {
      const req = createTestRequest('/api/email/send-cv', {
        method: 'POST',
        headers: {
          'x-session-id': VALID_PAID_SESSION_ID,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: TEST_CUSTOMER_EMAIL,
          candidateName: 'Alex Morgan',
        }),
      });
      const res = await invokeRouteHandler(emailPost, req);

      expect(res.status).toBe(200);
      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });

  // ==========================================================================
  // FEATURE 4: PAYWALL BYPASS PREVENTION & TOKEN FORGERY
  // ==========================================================================
  describe('Feature 4: Paywall Bypass Prevention & Token Forgery', () => {
    it('4.1 Legacy unlocked_session token is strictly rejected on DOCX export', async () => {
      const req = createGetRequest('/api/export/docx', {
        searchParams: { session_id: 'unlocked_session' },
      });
      const res = await invokeRouteHandler(docxGet, req);

      expect(res.status).toBe(402);
      const data = await res.json();
      expect(data.code).toBe('PAYMENT_REQUIRED');
    });

    it('4.2 Demo token (demo_token_123) is strictly rejected on PDF export', async () => {
      const req = createGetRequest('/api/export/pdf', {
        searchParams: { session_id: 'demo_token_123' },
      });
      const res = await invokeRouteHandler(pdfGet, req);

      expect(res.status).toBe(402);
      const data = await res.json();
      expect(data.code).toBe('PAYMENT_REQUIRED');
    });

    it('4.3 Forged session token (cs_fake_bypass_token_000) is strictly rejected on email dispatch', async () => {
      const req = createJsonRequest('/api/email/send-cv', {
        email: 'attacker@evil.com',
        sessionId: FORGED_SESSION_ID,
      });
      const res = await invokeRouteHandler(emailPost, req);

      expect(res.status).toBe(402);
      const data = await res.json();
      expect(data.code).toBe('PAYMENT_REQUIRED');
    });

    it('4.4 Arbitrary string > 5 characters fallback (qwerty123456) is rejected with 402', async () => {
      const req = createGetRequest('/api/export/docx', {
        searchParams: { session_id: 'qwerty123456' },
      });
      const res = await invokeRouteHandler(docxGet, req);

      expect(res.status).toBe(402);
      const data = await res.json();
      expect(data.code).toBe('PAYMENT_REQUIRED');
    });

    it('4.5 Submitting email address alone without paid record does NOT unlock DOCX export', async () => {
      const req = createGetRequest('/api/export/docx', {
        searchParams: { email: 'unpaid.visitor@randomsite.com' },
      });
      const res = await invokeRouteHandler(docxGet, req);

      expect(res.status).toBe(402);
      const data = await res.json();
      expect(data.code).toBe('PAYMENT_REQUIRED');
    });

    it('4.6 Submitting email address alone without paid record does NOT unlock PDF export', async () => {
      const req = createGetRequest('/api/export/pdf', {
        searchParams: { email: 'unpaid.visitor@randomsite.com' },
      });
      const res = await invokeRouteHandler(pdfGet, req);

      expect(res.status).toBe(402);
      const data = await res.json();
      expect(data.code).toBe('PAYMENT_REQUIRED');
    });

    it('4.7 Forged client claim ratemycv_paid=true does NOT grant export access', async () => {
      const req = createJsonRequest('/api/export/docx', {
        ratemycv_paid: true,
        isPaid: true,
        sessionId: 'fake_paid_claim_999',
      });
      const res = await invokeRouteHandler(docxPost, req);

      expect(res.status).toBe(402);
      const data = await res.json();
      expect(data.code).toBe('PAYMENT_REQUIRED');
    });
  });
});
