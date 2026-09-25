import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import pdfParse from 'pdf-parse';
import { paymentRegistry, PaymentRecord } from '@/lib/paymentRegistry';
import { verifyServerPayment } from '@/lib/serverPaymentVerification';
import { generatePdfBuffer } from '@/lib/pdfGenerator';
import { STANDARD_CV_ALEX } from '@/lib/cvStandardData';
import { GET as docxGet, POST as docxPost } from '@/app/api/export/docx/route';
import { GET as pdfGet, POST as pdfPost } from '@/app/api/export/pdf/route';
import { GET as emailGet, POST as emailPost } from '@/app/api/email/send-cv/route';
import {
  createGetRequest,
  createJsonRequest,
  invokeRouteHandler,
} from '../e2e/helpers/routeHarness';

describe('Paywall Enforcement & Export Endpoints Unit Tests', () => {
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    process.env = { ...originalEnv };
    delete process.env.ENABLE_PAYMENT_TEST_BYPASS;
    await paymentRegistry.clear();
  });

  afterEach(async () => {
    process.env = { ...originalEnv };
    await paymentRegistry.clear();
  });

  describe('1. verifyServerPayment Helper', () => {
    it('rejects when no session ID and no customer email are provided', async () => {
      const res = await verifyServerPayment(null);
      expect(res.authorized).toBe(false);
      expect(res.reason).toContain('No payment session ID or customer email provided');
    });

    it('strictly rejects bypass tokens (unlocked_session, demo_*, 123456, fake_*)', async () => {
      const bypassTokens = [
        'unlocked_session',
        'demo_free_bypass',
        'demo_test',
        'cs_fake_bypass_token_000',
        'fake_token_123',
        '123456',
        'qwerty',
      ];

      for (const token of bypassTokens) {
        const res = await verifyServerPayment(token);
        expect(res.authorized).toBe(false);
        expect(res.reason).toContain('Bypass tokens and forged sessions are strictly rejected');
      }
    });

    it('unconditionally rejects test-mode tokens in production environment', async () => {
      process.env.NODE_ENV = 'production';
      process.env.ENABLE_PAYMENT_TEST_BYPASS = 'true';

      const res = await verifyServerPayment('test_simulated_sess_999');
      expect(res.authorized).toBe(false);
      expect(res.reason).toContain('forbidden in production');
    });

    it('authorizes test-mode tokens in non-production when ENABLE_PAYMENT_TEST_BYPASS is true', async () => {
      process.env.NODE_ENV = 'development';
      process.env.ENABLE_PAYMENT_TEST_BYPASS = 'true';

      const res = await verifyServerPayment('test_simulated_valid_001');
      expect(res.authorized).toBe(true);
      expect(res.record?.paymentStatus).toBe('paid');
    });

    it('authorizes valid paid session recorded in the persistent payment registry', async () => {
      const paidRecord: PaymentRecord = {
        sessionId: 'cs_live_real_paid_session_789',
        customerEmail: 'paying.customer@example.com',
        profileId: 'it_cloud',
        candidateName: 'Alex Morgan',
        paymentStatus: 'paid',
        amountCents: 900,
        currency: 'usd',
        invoiceNumber: 'INV-789',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await paymentRegistry.recordPayment(paidRecord);

      const res = await verifyServerPayment('cs_live_real_paid_session_789');
      expect(res.authorized).toBe(true);
      expect(res.record?.sessionId).toBe('cs_live_real_paid_session_789');
      expect(res.record?.customerEmail).toBe('paying.customer@example.com');
    });

    it('rejects session recorded as unpaid or pending in the registry', async () => {
      await paymentRegistry.recordPayment({
        sessionId: 'cs_unpaid_record_555',
        customerEmail: 'pending.customer@example.com',
        profileId: 'it_cloud',
        candidateName: 'Pending Person',
        paymentStatus: 'pending',
        amountCents: 900,
        currency: 'usd',
        invoiceNumber: 'INV-555',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const res = await verifyServerPayment('cs_unpaid_record_555');
      expect(res.authorized).toBe(false);
      expect(res.reason).toContain('Session payment status is "pending"');
    });

    it('restores cross-device access via customer email if previously verified in registry', async () => {
      await paymentRegistry.recordPayment({
        sessionId: 'cs_prior_paid_session',
        customerEmail: 'returning.buyer@domain.com',
        profileId: 'executive',
        candidateName: 'Returning Buyer',
        paymentStatus: 'paid',
        amountCents: 900,
        currency: 'usd',
        invoiceNumber: 'INV-RESTORE-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // User arrives on a new device with no local session ID, but provides email
      const res = await verifyServerPayment(null, { customerEmail: 'returning.buyer@domain.com' });
      expect(res.authorized).toBe(true);
      expect(res.record?.customerEmail).toBe('returning.buyer@domain.com');
    });
  });

  describe('2. Hardened DOCX Export Route (/api/export/docx)', () => {
    it('returns 402 with paywall headers on GET without session_id', async () => {
      const req = createGetRequest('/api/export/docx');
      const res = await invokeRouteHandler(docxGet, req);

      expect(res.status).toBe(402);
      expect(res.getHeader('X-Paywall-Required')).toBe('true');
      expect(res.getHeader('WWW-Authenticate')).toContain('CheckMyCV Paywall');
      const body = await res.json();
      expect(body.code).toBe('PAYMENT_REQUIRED');
    });

    it('returns 402 on POST with bypass token unlocked_session or demo_123', async () => {
      const req1 = createJsonRequest('/api/export/docx', { sessionId: 'unlocked_session' });
      const res1 = await invokeRouteHandler(docxPost, req1);
      expect(res1.status).toBe(402);
      expect(res1.getHeader('X-Paywall-Required')).toBe('true');

      const req2 = createJsonRequest('/api/export/docx', { sessionId: 'demo_12345' });
      const res2 = await invokeRouteHandler(docxPost, req2);
      expect(res2.status).toBe(402);
    });

    it('returns 200 with Word document binary when session is verified in registry', async () => {
      await paymentRegistry.recordPayment({
        sessionId: 'cs_verified_docx_sess',
        customerEmail: 'candidate@scoremycv.com',
        profileId: 'it_cloud',
        candidateName: 'Alex Morgan',
        paymentStatus: 'paid',
        amountCents: 900,
        currency: 'usd',
        invoiceNumber: 'INV-DOCX-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const req = createGetRequest('/api/export/docx', {
        searchParams: { session_id: 'cs_verified_docx_sess' },
      });
      const res = await invokeRouteHandler(docxGet, req);

      expect(res.status).toBe(200);
      expect(res.getHeader('Content-Type')).toContain('openxmlformats-officedocument');
      expect(res.getHeader('X-Payment-Verified')).toBe('true');

      const buffer = await res.buffer();
      expect(buffer.length).toBeGreaterThan(1000);
    });
  });

  describe('3. Hardened PDF Export Route (/api/export/pdf)', () => {
    it('returns 402 with paywall headers on GET without session_id', async () => {
      const req = createGetRequest('/api/export/pdf');
      const res = await invokeRouteHandler(pdfGet, req);

      expect(res.status).toBe(402);
      expect(res.getHeader('X-Paywall-Required')).toBe('true');
      expect(res.getHeader('WWW-Authenticate')).toContain('CheckMyCV Paywall');
      const body = await res.json();
      expect(body.code).toBe('PAYMENT_REQUIRED');
    });

    it('returns 402 on POST with forged session ID', async () => {
      const req = createJsonRequest('/api/export/pdf', { sessionId: 'forged_session_abc' });
      const res = await invokeRouteHandler(pdfPost, req);
      expect(res.status).toBe(402);
      expect(res.getHeader('X-Paywall-Required')).toBe('true');
    });

    it('returns 200 with native ATS PDF binary when session is verified in registry', async () => {
      await paymentRegistry.recordPayment({
        sessionId: 'cs_verified_pdf_sess',
        customerEmail: 'candidate@scoremycv.com',
        profileId: 'it_cloud',
        candidateName: 'Alex Morgan',
        paymentStatus: 'paid',
        amountCents: 900,
        currency: 'usd',
        invoiceNumber: 'INV-PDF-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const req = createGetRequest('/api/export/pdf', {
        searchParams: { session_id: 'cs_verified_pdf_sess' },
      });
      const res = await invokeRouteHandler(pdfGet, req);

      expect(res.status).toBe(200);
      expect(res.getHeader('Content-Type')).toBe('application/pdf');
      expect(res.getHeader('X-Payment-Verified')).toBe('true');

      const buffer = await res.buffer();
      expect(buffer.length).toBeGreaterThan(1000);

      // Verify that the PDF contains selectable, parseable ATS text
      const parsed = await pdfParse(buffer);
      expect(parsed.text).toContain('ALEX MORGAN');
      expect(parsed.text).toContain('Professional Summary');
      expect(parsed.text).toContain('Professional Experience');
      expect(parsed.text).toContain('Core Skills');
    });
  });

  describe('4. Hardened Email Dispatch Route (/api/email/send-cv)', () => {
    it('returns 402 when attempting to email CV without valid payment', async () => {
      const req = createJsonRequest('/api/email/send-cv', {
        email: 'unpaid.user@example.com',
        sessionId: 'unverified_sess_000',
      });
      const res = await invokeRouteHandler(emailPost, req);

      expect(res.status).toBe(402);
      expect(res.getHeader('X-Paywall-Required')).toBe('true');
    });

    it('strictly rejects bypass tokens (unlocked_session, demo_*) on email endpoint', async () => {
      const req1 = createJsonRequest('/api/email/send-cv', {
        email: 'attacker@example.com',
        sessionId: 'unlocked_session',
      });
      const res1 = await invokeRouteHandler(emailPost, req1);
      expect(res1.status).toBe(402);

      const req2 = createJsonRequest('/api/email/send-cv', {
        email: 'attacker@example.com',
        sessionId: 'demo_free_bypass',
      });
      const res2 = await invokeRouteHandler(emailPost, req2);
      expect(res2.status).toBe(402);

      const req3 = createJsonRequest('/api/email/send-cv', {
        email: 'attacker@example.com',
        sessionId: '123456', // length > 5 fallback
      });
      const res3 = await invokeRouteHandler(emailPost, req3);
      expect(res3.status).toBe(402);
    });

    it('rejects unauthenticated GET requests with 405 Method Not Allowed, preventing PII leak', async () => {
      const req = createGetRequest('/api/email/send-cv');
      const res = await invokeRouteHandler(emailGet, req);

      expect(res.status).toBe(405);
      const text = await res.text();
      expect(text).not.toContain('emailOutbox');
      expect(text).not.toContain('recipientEmail');
    });

    it('successfully dispatches email when session is verified in registry', async () => {
      await paymentRegistry.recordPayment({
        sessionId: 'cs_verified_email_sess',
        customerEmail: 'recipient.buyer@example.com',
        profileId: 'it_cloud',
        candidateName: 'Alex Morgan',
        paymentStatus: 'paid',
        amountCents: 900,
        currency: 'usd',
        invoiceNumber: 'INV-EMAIL-01',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const req = createJsonRequest('/api/email/send-cv', {
        email: 'recipient.buyer@example.com',
        sessionId: 'cs_verified_email_sess',
      });
      const res = await invokeRouteHandler(emailPost, req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.recipient).toBe('recipient.buyer@example.com');
    });
  });

  describe('5. Native ATS PDF Generator Unit Test', () => {
    it('generates single-column vector text PDF with all canonical ATS sections', async () => {
      const pdfBuffer = generatePdfBuffer(STANDARD_CV_ALEX);
      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      expect(pdfBuffer.length).toBeGreaterThan(1000);

      // Verify PDF header magic bytes '%PDF-'
      const header = pdfBuffer.subarray(0, 5).toString('ascii');
      expect(header).toBe('%PDF-');

      // Parse text content with pdf-parse
      const parsed = await pdfParse(pdfBuffer);
      expect(parsed.text).toContain('ALEX MORGAN');
      expect(parsed.text).toContain('Professional Summary');
      expect(parsed.text).toContain('Core Skills');
      expect(parsed.text).toContain('Professional Experience');
      expect(parsed.text).toContain('Education & Certifications');
      expect(parsed.text).toContain('Professional References');
      expect(parsed.text).toContain('alex.morgan@email.com');
      expect(parsed.text).toContain('+1 (555) 234-5678');
    });
  });
});
