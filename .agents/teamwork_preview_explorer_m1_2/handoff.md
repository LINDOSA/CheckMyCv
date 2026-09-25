# Handoff Report: Backend Paywall Hardening, Bypass Audit & PDF Export

**Agent**: Explorer 2 (`teamwork_preview_explorer_m1_2`)  
**Parent**: M1 Sub-Orchestrator (`27730049-a06a-48a6-a5fe-6872a2cd5f3e`)  
**Milestone**: Milestone 1: Secure Backend Paywall Enforcement & Registry  
**Date**: 2026-09-17  
**Type**: Hard Handoff (Investigation Complete)  

---

## 1. Observation

Direct code inspections revealed the following specific findings:

1. **Hardcoded Payment Bypass Tokens in Email Route**:
   - In `src/app/api/email/send-cv/route.ts` lines 9–20:
     ```typescript
     async function isPaymentAuthorized(sessionId: string | null): Promise<boolean> {
       if (!sessionId) return false;
       if (
         sessionId.startsWith('test_simulated_') ||
         sessionId.startsWith('demo_') ||
         sessionId === 'unlocked_session'
       ) {
         return true;
       }
       if (!isStripeConfigured()) {
         return sessionId.length > 5;
       }
       ...
     ```
     `sessionId === 'unlocked_session'`, `sessionId.startsWith('demo_')`, and `sessionId.startsWith('test_simulated_')` return `true` unconditionally without environment checks. Furthermore, if `isStripeConfigured()` is false, any session ID with length > 5 returns `true`.

2. **Unauthenticated Public Outbox & PII Data Leak**:
   - In `src/app/api/email/send-cv/route.ts` lines 92–110:
     ```typescript
     export async function GET(req: NextRequest) {
       const { searchParams } = new URL(req.url);
       const email = searchParams.get('email');

       if (email) {
         const matching = emailOutbox.filter((e) => e.recipientEmail.toLowerCase() === email.toLowerCase());
         return NextResponse.json({
           success: true,
           count: matching.length,
           emails: matching,
         });
       }

       return NextResponse.json({
         success: true,
         totalSent: emailOutbox.length,
         latest: emailOutbox[emailOutbox.length - 1] || null,
       });
     }
     ```
     Any unauthenticated HTTP `GET /api/email/send-cv` call dumps the latest sent candidate email or all sent emails for a target address, leaking candidate names, emails, invoices, and full HTML containing complete CV text.

3. **Isolated DOCX Export Gating**:
   - In `src/app/api/export/docx/route.ts` lines 10–32:
     The endpoint directly calls Stripe checkout session retrieval rather than querying a persistent registry. It lacks cross-validation between the session customer and requested CV data, and does not return standard paywall cache control headers.

4. **Missing PDF Export Route**:
   - In `src/app/api/export`:
     Only `docx/` exists (`src/app/api/export/docx/route.ts`). There is NO `pdf/route.ts`.

5. **Client-Side Document Generation & Unredacted DOM Leak**:
   - In `src/components/StandardCvPaperView.tsx` lines 98–149:
     PDF generation is performed client-side using `html2canvas` + `jsPDF`, creating an image-rasterized PDF that fails ATS text extraction.
   - In `src/components/StandardCvPaperView.tsx` lines 646–650:
     Unpaid preview uses CSS blur (`filter blur-[5px]`), leaving full plain text in the DOM tree.
   - In `src/lib/paymentAccess.ts` lines 6–12:
     `isUserPaid()` inspects unauthenticated `localStorage.getItem('ratemycv_paid') === 'true'`.

6. **Installed Dependencies**:
   - In `package.json`:
     `jspdf: "^4.2.1"`, `pdf-parse: "^1.1.1"`, `docx: "^9.7.1"`, and `stripe: "^22.6.2"` are already installed.

---

## 2. Logic Chain

1. **From Observation 1**: Because `sessionId === 'unlocked_session'`, `demo_`, and `sessionId.length > 5` return `true` without verifying Stripe payment or environment guards, any user or script can bypass the paywall on `/api/email/send-cv` and receive full CV documents and invoices without paying.
2. **From Observation 2**: Because `GET /api/email/send-cv` requires no authentication or payment session and dumps the in-memory outbox, any external visitor can scrape candidate PII and CV contents, creating a severe data leak vulnerability.
3. **From Observation 3**: Because `export/docx` relies solely on ad-hoc Stripe API retrieval without a local persistent registry, any Stripe API rate limiting, webhook delay, or network disruption prevents paying users from retrieving their documents.
4. **From Observation 4 & 6**: Because `/api/export/pdf` does not exist and `jspdf` is installed in `package.json`, creating `src/lib/pdfGenerator.ts` and `src/app/api/export/pdf/route.ts` using Node.js `jsPDF` vector text methods (`doc.text()`) provides a lightweight (<5ms), ATS-compatible, single-column native text PDF generator protected by server-side payment verification.
5. **From Observation 5**: Because client-side components allow downloading documents via browser-side generation or scraping blurred text from the DOM, backend hardening must be paired with client DOM redaction and routing download buttons exclusively to verified server export endpoints.
6. **Conclusion**: Standardizing all export and email endpoints to enforce server-side payment verification via `verifyServerPayment`, returning HTTP 402 with unified headers and structured error payloads, eliminates all identified bypass vectors.

---

## 3. Caveats

1. **Email Outbox Persistence**: `emailOutbox` is currently an in-memory array in `src/lib/invoiceEmailService.ts`. While closing the public `GET` leak is immediate, long-term email audit logging should ideally be backed by the persistent payment registry or a dedicated secure store.
2. **Stripe Test Mode in Staging**: If automated testing or staging requires simulated checkouts, it must be strictly restricted to `NODE_ENV !== 'production'` AND `ENABLE_PAYMENT_TEST_BYPASS === 'true'` within `verifyServerPayment`, completely eliminating arbitrary token strings like `unlocked_session` or length fallbacks.
3. **Client Redaction Scope**: Explorer 2 investigated backend endpoints and identified frontend attack surfaces (`StandardCvPaperView.tsx` and `paymentAccess.ts`), but implementation of frontend changes falls under Milestone 1 frontend hardening tasks.

---

## 4. Conclusion

1. **Endpoint Vulnerabilities**: `src/app/api/email/send-cv/route.ts` contains 3 critical bypass vectors (`unlocked_session`, `demo_`, length > 5 fallback) and 1 severe PII data leak on GET. All must be eradicated.
2. **Unified Payment Gating**: `src/app/api/export/docx/route.ts`, `src/app/api/export/pdf/route.ts`, and `src/app/api/email/send-cv/route.ts` must all delegate authorization to `verifyServerPayment(sessionId, options)` backed by `PaymentRegistry`.
3. **Native Text PDF Generator**: A server-side PDF generator (`src/lib/pdfGenerator.ts`) must be created using `jsPDF` to produce single-column, native-text A4 documents that pass ATS parsing (`pdf-parse`) and are served via `/api/export/pdf`.
4. **Strict HTTP 402 Specification**: Any unverified request to protected endpoints must return:
   - Status: `402 Payment Required`
   - Headers: `WWW-Authenticate: Stripe realm="ScoreMyCV Paywall"`, `X-Paywall-Required: true`, `Cache-Control: no-store, no-cache, must-revalidate`
   - Body: Standard JSON error payload containing `code: "PAYMENT_REQUIRED"`, `status: 402`, and price details.

---

## 5. Verification Method

To independently verify these findings and the implementation fixes:

1. **Code Inspection**:
   - Inspect `src/app/api/email/send-cv/route.ts:9-29` and `92-110` to confirm bypass tokens and public outbox dump.
   - Inspect `src/app/api/export/docx/route.ts:10-32` to confirm isolated verification.
   - Inspect `src/app/api/export/pdf` to confirm route absence.
2. **Bypass Reproduction (Pre-Fix)**:
   - Send `POST /api/email/send-cv` with body `{"email": "test@example.com", "sessionId": "unlocked_session"}` -> observe HTTP 200 (Bypass confirmed).
   - Send `GET /api/email/send-cv` -> observe HTTP 200 with dumped email objects (Data leak confirmed).
3. **Automated Test Suite (Post-Fix Verification)**:
   - Run Vitest integration suite: `npx vitest run tests/e2e/paywall-bypass.test.ts`.
   - Verify that forged tokens (`unlocked_session`, `demo_123`, `123456`, `test_simulated_`) return HTTP 402 with `X-Paywall-Required: true`.
   - Verify that `GET /api/email/send-cv` returns HTTP 405 or 402 with 0 leaked records.
   - Verify that `GET /api/export/pdf?session_id=valid_paid_session` returns `application/pdf` containing selectable text parseable by `pdf-parse`.
4. **Invalidation Conditions**:
   - If any endpoint returns HTTP 200 or document binary for an unverified session ID, the security gate is invalidated.
