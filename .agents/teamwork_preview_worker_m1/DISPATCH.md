## 2026-09-17T12:09:33Z

You are the Worker for Milestone 1: Secure Backend Paywall Enforcement & Registry.
Your working directory is:
c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV/.agents/teamwork_preview_worker_m1/
Your parent is the M1 Sub-Orchestrator (Conversation ID: 27730049-a06a-48a6-a5fe-6872a2cd5f3e).

MANDATORY FIRST STEP:
Read the authoritative user request at:
c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV/.agents/ORIGINAL_REQUEST.md
Read the project master document at:
c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV/PROJECT.md
Read the M1 scope document at:
c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV/.agents/sub_orch_m1_paywall/SCOPE.md

Read the 3 Explorer handoff reports before implementing:
- `c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV/.agents/teamwork_preview_explorer_m1_1/handoff.md` (and `analysis.md`)
- `c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV/.agents/teamwork_preview_explorer_m1_2/handoff.md` (and `analysis.md`)
- `c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV/.agents/teamwork_preview_explorer_m1_3/handoff.md` (and `analysis.md`)

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

EXCLUSIVE FILE WRITE OWNERSHIP:
You own and have exclusive write permission on:
- `src/lib/paymentRegistry.ts`
- `src/lib/serverPaymentVerification.ts`
- `src/lib/pdfGenerator.ts`
- `src/app/api/export/docx/route.ts`
- `src/app/api/export/pdf/route.ts`
- `src/app/api/email/send-cv/route.ts`
- `src/components/StandardCvPaperView.tsx`
- `src/components/PaywallModal.tsx`
- `src/lib/paymentAccess.ts`
- `package.json`
- `tests/unit/payment-registry.test.ts`
- `tests/unit/paywall-enforcement.test.ts`
- Any data directory required for persistent storage (e.g. `data/payments.json` or `.data/payments.json`).

IMPLEMENTATION TASKS:
1. **Persistent Payment Registry (`src/lib/paymentRegistry.ts`)**:
   - Implement `PaymentRecord` and `IPaymentRegistry` interfaces matching `PROJECT.md`.
   - Implement atomic file-backed JSON persistence (e.g. writing to `data/payments.json` via temp file atomic rename `fs.promises.rename`, handling Windows file locks `EBUSY`/`EPERM` with retries, and in-memory promise mutex queue).
   - Methods: `recordPayment(record)`, `getPaymentBySessionId(sessionId)`, `getPaymentsByEmail(email)`, `isSessionVerified(sessionId)`, `isEmailVerified(email)`. Email matching must be case-insensitive.
2. **Server Payment Verification (`src/lib/serverPaymentVerification.ts`)**:
   - Implement `verifyServerPayment(sessionId: string | null, options?: { customerEmail?: string; profileId?: string }): Promise<VerificationResult>`.
   - Waterfall:
     a. Check `paymentRegistry.isSessionVerified(sessionId)`.
     b. If not in registry and Stripe is configured, query Stripe API (`stripe.checkout.sessions.retrieve`). If paid, atomically save to `paymentRegistry`.
     c. Reject all bypass tokens (`unlocked_session`, `demo_`, string length > 5 fallback).
     d. In production (`process.env.NODE_ENV === 'production'`), reject any test-mode tokens unconditionally.
3. **Native ATS PDF Generator (`src/lib/pdfGenerator.ts`)**:
   - Implement server-side native text ATS PDF generator using `jsPDF` (already installed in `package.json`).
   - Generates single-column vector text A4 PDF with Candidate Name, Contact info, Summary, Skills, Experience, Education, References. Text must be selectable and parseable by `pdf-parse`.
4. **Hardened Export Endpoints**:
   - `src/app/api/export/docx/route.ts`: Use `verifyServerPayment`. Return HTTP 402 Payment Required with headers (`WWW-Authenticate: Stripe realm="ScoreMyCV Paywall"`, `X-Paywall-Required: true`, `Cache-Control: no-store, no-cache, must-revalidate`) and structured JSON error if unverified.
   - `src/app/api/export/pdf/route.ts`: Create route. Use `verifyServerPayment` with identical strict 402 enforcement. Return native PDF binary (`application/pdf`) if paid.
5. **Hardened Email Endpoint (`src/app/api/email/send-cv/route.ts`)**:
   - Enforce `verifyServerPayment`.
   - Delete all hardcoded bypasses (`unlocked_session`, `demo_`, length > 5).
   - Delete or restrict unauthenticated `GET` handler to eliminate customer PII, email, and CV text leakage.
6. **Frontend Paywall & DOM Hardening**:
   - `src/components/StandardCvPaperView.tsx`: Replace visual CSS blur with actual DOM tree redaction/omission when unpaid (`!isPaid`). Redact experience bullets (except first bullet of first role), skills, and references so unpurchased CV content does not exist in the DOM tree. Replace client-side generation (`html2canvas`/`generateDocxBlob`) with calls to `/api/export/docx` and `/api/export/pdf`.
   - `src/components/PaywallModal.tsx`: Ensure email input does not grant instant paid access or unlock downloads.
   - `src/lib/paymentAccess.ts`: Bind payment access to verified session ID.
7. **Testing & Build Verification**:
   - Install `vitest` in devDependencies in `package.json` (`npm install -D vitest`) and add `"test": "vitest run"` script.
   - Write automated unit tests:
     - `tests/unit/payment-registry.test.ts`
     - `tests/unit/paywall-enforcement.test.ts`
   - Run `npm test` and `npm run build` to verify all tests pass and build succeeds.
