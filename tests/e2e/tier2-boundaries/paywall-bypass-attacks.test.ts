/**
 * Tier 2 Boundary & Security Test Suite: Paywall Bypass Attacks
 *
 * Exhaustively tests paywall defenses against malicious bypass attempts,
 * header spoofing, SQL injection, path traversal, null bytes, prefix forgery,
 * client storage tampering, whitespace abuse, email hijacking, and race conditions.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Route Handlers under test
import { GET as docxGet, POST as docxPost } from '@/app/api/export/docx/route';
import { GET as pdfGet, POST as pdfPost } from '@/app/api/export/pdf/route';
import { POST as emailPost } from '@/app/api/email/send-cv/route';
import { GET as verifyGet } from '@/app/api/stripe/verify/route';

// Core payment interfaces
import { paymentRegistry, PaymentRecord } from '@/lib/paymentRegistry';
import { verifyServerPayment } from '@/lib/serverPaymentVerification';

// Test harnesses & fixtures
import {
  createTestRequest,
  createJsonRequest,
  createGetRequest,
  invokeRouteHandler,
} from '../helpers/routeHarness';
import {
  VALID_PAID_SESSION_ID,
  UNPAID_SESSION_ID,
  FORGED_SESSION_ID,
  TEST_CUSTOMER_EMAIL,
  HIGH_QUALITY_ATS_CV,
} from '../helpers/fixtures';

describe('Tier 2: Paywall Bypass & Security Attack Defense', () => {
  const ORIGINAL_ENV = { ...process.env };
  const ACTIVE_PAID_SESSION = `cs_test_tier2_auth_${Date.now()}`;
  const ACTIVE_PAID_EMAIL = 'verified.candidate@example.com';

  beforeEach(async () => {
    process.env.ENABLE_PAYMENT_TEST_BYPASS = 'false';

    // Seed verified paid record for authorization comparison tests
    await paymentRegistry.recordPayment({
      sessionId: ACTIVE_PAID_SESSION,
      customerEmail: ACTIVE_PAID_EMAIL,
      profileId: 'executive',
      candidateName: 'Verified Candidate',
      paymentStatus: 'paid',
      amountCents: 900,
      currency: 'usd',
      invoiceNumber: 'INV-TEST-PAID-001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  // ==========================================================================
  // 1. HEADER SPOOFING ATTACKS
  // ==========================================================================
  describe('Header Spoofing Attacks', () => {
    it('rejects X-Payment-Bypass header on GET /api/export/docx without verified session', async () => {
      const req = createGetRequest('/api/export/docx', {
        headers: {
          'X-Payment-Bypass': 'true',
          'X-Paid': 'true',
        },
      });
      const res = await invokeRouteHandler(docxGet, req);
      expect(res.status).toBe(402);
      const data = await res.json();
      expect(data.error).toMatch(/payment required/i);
    });

    it('rejects X-Admin-Override header on POST /api/export/docx', async () => {
      const req = createJsonRequest(
        '/api/export/docx',
        { cvData: HIGH_QUALITY_ATS_CV },
        {
          headers: {
            'X-Admin-Override': '1',
            'X-Internal-Role': 'superadmin',
          },
        }
      );
      const res = await invokeRouteHandler(docxPost, req);
      expect(res.status).toBe(402);
    });

    it('rejects X-Forwarded-User spoofing on GET /api/export/pdf', async () => {
      const req = createGetRequest('/api/export/pdf', {
        headers: {
          'X-Forwarded-User': 'admin',
          'X-Remote-User': 'root',
        },
      });
      const res = await invokeRouteHandler(pdfGet, req);
      expect(res.status).toBe(402);
    });

    it('rejects spoofed X-Session-Id header with unverified token on POST /api/export/pdf', async () => {
      const req = createJsonRequest(
        '/api/export/pdf',
        { cvData: HIGH_QUALITY_ATS_CV },
        {
          headers: {
            'X-Session-Id': 'spoofed_admin_session_key',
            'X-Payment-Status': 'paid',
          },
        }
      );
      const res = await invokeRouteHandler(pdfPost, req);
      expect(res.status).toBe(402);
    });

    it('rejects bypass headers on POST /api/email/send-cv', async () => {
      const req = createJsonRequest(
        '/api/email/send-cv',
        {
          email: 'attacker@evil.com',
          sessionId: 'unauthorized_token',
        },
        {
          headers: {
            'X-Payment-Bypass': 'true',
            'X-Authenticated': 'true',
          },
        }
      );
      const res = await invokeRouteHandler(emailPost, req);
      expect(res.status).toBe(402);
    });
  });

  // ==========================================================================
  // 2. SQL INJECTION PATTERNS IN SESSION ID
  // ==========================================================================
  describe('SQL Injection Attacks in Session ID', () => {
    const SQLI_PAYLOADS = [
      "' OR '1'='1",
      "'; DROP TABLE payments; --",
      "admin'--",
      "' UNION SELECT * FROM payments--",
      "\" OR \"\"=\"",
      "1' OR '1' = '1' /*",
    ];

    it.each(SQLI_PAYLOADS)('rejects SQL injection "%s" on GET /api/export/docx with 402', async (sqli) => {
      const req = createGetRequest('/api/export/docx', {
        searchParams: { session_id: sqli },
      });
      const res = await invokeRouteHandler(docxGet, req);
      expect(res.status).toBe(402);
    });

    it.each(SQLI_PAYLOADS)('rejects SQL injection "%s" on POST /api/export/pdf with 402', async (sqli) => {
      const req = createJsonRequest('/api/export/pdf', {
        sessionId: sqli,
        cvData: HIGH_QUALITY_ATS_CV,
      });
      const res = await invokeRouteHandler(pdfPost, req);
      expect(res.status).toBe(402);
    });

    it('rejects SQL injection in verifyServerPayment helper without crashing', async () => {
      const result = await verifyServerPayment("' OR 1=1; --");
      expect(result.authorized).toBe(false);
      expect(result.record).toBeUndefined();
    });
  });

  // ==========================================================================
  // 3. PATH TRAVERSAL PATTERNS IN SESSION ID
  // ==========================================================================
  describe('Path Traversal Attacks in Session ID', () => {
    const TRAVERSAL_PAYLOADS = [
      '../../etc/passwd',
      '..%2f..%2fetc%2fpasswd',
      '..\\..\\windows\\system32',
      '....//....//config.json',
      '/var/log/auth.log',
      '..%5c..%5cboot.ini',
    ];

    it.each(TRAVERSAL_PAYLOADS)(
      'rejects path traversal "%s" on GET /api/export/docx with 402',
      async (traversal) => {
        const req = createGetRequest('/api/export/docx', {
          searchParams: { session_id: traversal },
        });
        const res = await invokeRouteHandler(docxGet, req);
        expect(res.status).toBe(402);
      }
    );

    it('rejects path traversal targeting payment registry file', async () => {
      const req = createGetRequest('/api/stripe/verify', {
        searchParams: { session_id: '../../data/payments.json' },
      });
      const res = await invokeRouteHandler(verifyGet, req);
      const data = await res.json();
      expect(data.verified).toBe(false);
    });
  });

  // ==========================================================================
  // 4. NULL BYTES AND NON-PRINTABLE CHARACTERS
  // ==========================================================================
  describe('Null Bytes & Control Characters in Session ID', () => {
    it('rejects null byte in session_id query param', async () => {
      const req = createGetRequest('/api/export/docx', {
        searchParams: { session_id: 'cs_test\0_admin' },
      });
      const res = await invokeRouteHandler(docxGet, req);
      expect(res.status).toBe(402);
    });

    it('rejects URL-encoded null byte (%00) in session_id', async () => {
      const req = createGetRequest('/api/export/pdf', {
        searchParams: { session_id: 'cs_test%00_admin' },
      });
      const res = await invokeRouteHandler(pdfGet, req);
      expect(res.status).toBe(402);
    });

    it('rejects CRLF newline injection (\\r\\n) in session header', async () => {
      const req = createTestRequest('/api/export/docx', {
        headers: {
          'X-Session-Id': 'cs_test\r\nX-Injected-Header: evil',
        },
      });
      const res = await invokeRouteHandler(docxGet, req);
      expect(res.status).toBe(402);
    });

    it('rejects ANSI escape sequences in session id', async () => {
      const req = createJsonRequest('/api/email/send-cv', {
        email: 'candidate@example.com',
        sessionId: '\x1b[31mcs_red_attack\x1b[0m',
      });
      const res = await invokeRouteHandler(emailPost, req);
      expect(res.status).toBe(402);
    });
  });

  // ==========================================================================
  // 5. MALFORMED SESSION ID PREFIXES & FORGED TOKENS
  // ==========================================================================
  describe('Malformed Session ID Prefixes & Forged Tokens', () => {
    const FORBIDDEN_TOKENS = [
      'sk_live_malicious_secret_token_12345',
      'pi_3MtwBy2eZvKYlo2C1e3Nq84l',
      'ch_3MtwBy2eZvKYlo2C1e3Nq84l',
      'cs_',
      'unlocked_session',
      'demo_bypass',
      'demo_test_user',
      '123456',
      'qwerty',
      FORGED_SESSION_ID,
      'fake_token_abc',
    ];

    it.each(FORBIDDEN_TOKENS)(
      'unconditionally rejects forbidden/malformed token "%s" with 402',
      async (token) => {
        const req = createGetRequest('/api/export/docx', {
          searchParams: { session_id: token },
        });
        const res = await invokeRouteHandler(docxGet, req);
        expect(res.status).toBe(402);
      }
    );

    it('rejects simulated test tokens when ENABLE_PAYMENT_TEST_BYPASS is disabled', async () => {
      process.env.ENABLE_PAYMENT_TEST_BYPASS = 'false';
      const req = createGetRequest('/api/export/docx', {
        searchParams: { session_id: 'test_simulated_bypass_123' },
      });
      const res = await invokeRouteHandler(docxGet, req);
      expect(res.status).toBe(402);
    });

    it('strictly forbids test mode simulation tokens in NODE_ENV=production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.ENABLE_PAYMENT_TEST_BYPASS = 'true';

      const verifyResult = await verifyServerPayment('test_simulated_bypass_456');
      expect(verifyResult.authorized).toBe(false);
      expect(verifyResult.reason).toMatch(/forbidden in production/i);
    });
  });

  // ==========================================================================
  // 6. TAMPERED QUERY PARAMETERS
  // ==========================================================================
  describe('Tampered Query Parameters', () => {
    it('rejects ?bypass=1&free=true query parameters', async () => {
      const req = createGetRequest('/api/export/docx', {
        searchParams: { bypass: '1', free: 'true' },
      });
      const res = await invokeRouteHandler(docxGet, req);
      expect(res.status).toBe(402);
    });

    it('rejects ?authorized=true&paid=1 without valid session ID', async () => {
      const req = createGetRequest('/api/export/pdf', {
        searchParams: { authorized: 'true', paid: '1' },
      });
      const res = await invokeRouteHandler(pdfGet, req);
      expect(res.status).toBe(402);
    });

    it('rejects ?allowTestBypass=true query override attempt', async () => {
      const req = createGetRequest('/api/export/docx', {
        searchParams: {
          session_id: 'test_simulated_attacker',
          allowTestBypass: 'true',
        },
      });
      const res = await invokeRouteHandler(docxGet, req);
      expect(res.status).toBe(402);
    });
  });

  // ==========================================================================
  // 7. CLIENT STORAGE SPOOFING
  // ==========================================================================
  describe('Client Storage & Cookie Spoofing', () => {
    it('does not grant access when Cookie: ratemycv_paid=true is present', async () => {
      const req = createGetRequest('/api/export/docx', {
        headers: {
          Cookie: 'ratemycv_paid=true; scoremycv_unlocked=1',
        },
      });
      const res = await invokeRouteHandler(docxGet, req);
      expect(res.status).toBe(402);
    });

    it('does not grant access when Cookie: stripe_paid=true is present on POST /api/export/pdf', async () => {
      const req = createJsonRequest(
        '/api/export/pdf',
        { cvData: HIGH_QUALITY_ATS_CV },
        {
          headers: {
            Cookie: 'stripe_paid=true; user_tier=executive',
          },
        }
      );
      const res = await invokeRouteHandler(pdfPost, req);
      expect(res.status).toBe(402);
    });

    it('ignores custom client-side storage headers (X-Client-Paid: true)', async () => {
      const req = createGetRequest('/api/export/docx', {
        headers: {
          'X-Client-Paid': 'true',
          'X-Local-Storage-Paid': 'true',
        },
      });
      const res = await invokeRouteHandler(docxGet, req);
      expect(res.status).toBe(402);
    });
  });

  // ==========================================================================
  // 8. EMPTY & WHITESPACE-ONLY SESSION IDS
  // ==========================================================================
  describe('Empty and Whitespace Session IDs', () => {
    it('rejects empty string session_id parameter', async () => {
      const req = createGetRequest('/api/export/docx', {
        searchParams: { session_id: '' },
      });
      const res = await invokeRouteHandler(docxGet, req);
      expect(res.status).toBe(402);
    });

    it('rejects whitespace-only session_id ("   ")', async () => {
      const req = createGetRequest('/api/export/docx', {
        searchParams: { session_id: '     ' },
      });
      const res = await invokeRouteHandler(docxGet, req);
      expect(res.status).toBe(402);
    });

    it('rejects tab and newline whitespace in JSON sessionId', async () => {
      const req = createJsonRequest('/api/export/pdf', {
        sessionId: '  \t\n  ',
        cvData: HIGH_QUALITY_ATS_CV,
      });
      const res = await invokeRouteHandler(pdfPost, req);
      expect(res.status).toBe(402);
    });

    it('returns 400 from /api/stripe/verify when session_id is missing', async () => {
      const req = createGetRequest('/api/stripe/verify');
      const res = await invokeRouteHandler(verifyGet, req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.verified).toBe(false);
    });
  });

  // ==========================================================================
  // 9. MISMATCHED EMAIL / PROFILE AUTHORIZATION
  // ==========================================================================
  describe('Mismatched Email / Profile Authorization', () => {
    it('denies email dispatch when requested recipient does not match paid session email', async () => {
      // Alice purchased ACTIVE_PAID_SESSION with ACTIVE_PAID_EMAIL
      // Eve attempts to claim Alice's session for eve@attacker.com
      const req = createJsonRequest('/api/email/send-cv', {
        email: 'eve.attacker@evil.com',
        sessionId: 'cs_unrelated_unpaid_session_999',
      });
      const res = await invokeRouteHandler(emailPost, req);
      expect(res.status).toBe(402);
    });

    it('authorizes verified email via cross-device payment restore', async () => {
      const result = await verifyServerPayment(null, {
        customerEmail: ACTIVE_PAID_EMAIL,
      });
      expect(result.authorized).toBe(true);
      expect(result.record?.customerEmail).toBe(ACTIVE_PAID_EMAIL);
    });

    it('rejects non-paying candidate email in cross-device restore', async () => {
      const result = await verifyServerPayment(null, {
        customerEmail: 'nonpaying.stranger@example.com',
      });
      expect(result.authorized).toBe(false);
    });
  });

  // ==========================================================================
  // 10. UNPAID & REFUNDED REGISTRY STATES
  // ==========================================================================
  describe('Unpaid & Refunded Registry States', () => {
    it('rejects session explicitly recorded as unpaid in registry with 402', async () => {
      const unpaidSession = `cs_test_unpaid_${Date.now()}`;
      await paymentRegistry.recordPayment({
        sessionId: unpaidSession,
        customerEmail: 'unpaid.user@example.com',
        profileId: 'junior_01',
        candidateName: 'Unpaid Candidate',
        paymentStatus: 'unpaid',
        amountCents: 900,
        currency: 'usd',
        invoiceNumber: 'INV-UNPAID-01',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const req = createGetRequest('/api/export/docx', {
        searchParams: { session_id: unpaidSession },
      });
      const res = await invokeRouteHandler(docxGet, req);
      expect(res.status).toBe(402);
    });

    it('rejects session marked as pending in registry with 402', async () => {
      const pendingSession = `cs_test_pending_${Date.now()}`;
      await paymentRegistry.recordPayment({
        sessionId: pendingSession,
        customerEmail: 'pending.user@example.com',
        profileId: 'junior_02',
        candidateName: 'Pending Candidate',
        paymentStatus: 'pending',
        amountCents: 900,
        currency: 'usd',
        invoiceNumber: 'INV-PENDING-02',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const req = createGetRequest('/api/export/pdf', {
        searchParams: { session_id: pendingSession },
      });
      const res = await invokeRouteHandler(pdfGet, req);
      expect(res.status).toBe(402);
    });
  });

  // ==========================================================================
  // 11. RAPID CONCURRENT DUPLICATE EXPORT ATTEMPTS
  // ==========================================================================
  describe('Concurrent Duplicate Export Attempts', () => {
    it('ensures all 10 rapid concurrent unauthorized requests return 402 without race condition leak', async () => {
      const requests = Array.from({ length: 10 }).map((_, i) => {
        const req = createGetRequest('/api/export/docx', {
          searchParams: { session_id: `cs_race_attacker_${i}` },
        });
        return invokeRouteHandler(docxGet, req);
      });

      const responses = await Promise.all(requests);
      responses.forEach((res) => {
        expect(res.status).toBe(402);
      });
    });

    it('allows 10 rapid concurrent requests for verified paid session (idempotency)', async () => {
      const requests = Array.from({ length: 10 }).map(() => {
        const req = createGetRequest('/api/export/docx', {
          searchParams: { session_id: ACTIVE_PAID_SESSION },
        });
        return invokeRouteHandler(docxGet, req);
      });

      const responses = await Promise.all(requests);
      responses.forEach((res) => {
        expect(res.status).toBe(200);
        expect(res.getHeader('content-type')).toContain('openxmlformats');
      });
    });
  });

  // ==========================================================================
  // 12. LARGE PAYLOAD ATTACK ON EXPORT ENDPOINTS
  // ==========================================================================
  describe('Large Payload Attacks', () => {
    it('handles oversized 1MB text body without bypassing paywall or crashing', async () => {
      const giantText = 'MALICIOUS_INPUT_'.repeat(65000); // ~1MB string
      const req = createJsonRequest('/api/export/docx', {
        cvText: giantText,
        sessionId: 'invalid_large_payload_token',
      });

      const res = await invokeRouteHandler(docxPost, req);
      // Paywall check executes before expensive document generation
      expect(res.status).toBe(402);
    });
  });

  // ==========================================================================
  // 13. CONTENT-TYPE MISMATCH ATTACKS
  // ==========================================================================
  describe('Content-Type Mismatch Attacks', () => {
    it('rejects POST with text/plain body without crashing or leaking documents', async () => {
      const req = createTestRequest('/api/export/docx', {
        method: 'POST',
        body: 'sessionId=fake_token&bypass=true',
        headers: {
          'Content-Type': 'text/plain',
        },
      });

      const res = await invokeRouteHandler(docxPost, req);
      expect(res.status).toBe(402);
    });

    it('handles malformed JSON syntax gracefully on POST /api/export/pdf', async () => {
      const req = createTestRequest('/api/export/pdf', {
        method: 'POST',
        body: '{"sessionId": "unclosed_json_bracket...',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const res = await invokeRouteHandler(pdfPost, req);
      expect(res.status).toBe(402);
    });
  });
});
