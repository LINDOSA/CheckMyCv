# Handoff Report: Milestone 1 Architecture & Technical Design

**Agent**: Explorer 1 (Milestone 1 - Secure Backend Paywall Enforcement & Registry)  
**Recipient**: M1 Sub-Orchestrator (`27730049-a06a-48a6-a5fe-6872a2cd5f3e`)  
**Artifact**: `.agents/teamwork_preview_explorer_m1_1/analysis.md`  

---

## 1. Observation

1. **Test Runner Gap**:
   - In `package.json`: Lines 5-10 define `"scripts": { "dev": "next dev", "build": "next build", "start": "next start", "lint": "next lint" }`. There is no `"test"` script.
   - In `package.json`: Lines 28-37 list `devDependencies` (`@types/node`, `@types/pdf-parse`, `@types/react`, `@types/react-dom`, `autoprefixer`, `postcss`, `tailwindcss`, `typescript`). Neither `vitest` nor `jest` is present.
   - In `vitest.config.ts`: Lines 4-15 configure Vitest with `environment: 'node'` and `@/*` alias pointing to `./src`.
   - In `tests/e2e/helpers/`: `fixtures.ts` (479 lines) and `stripeMocks.ts` (215 lines) already contain test CVs, payment records, and Stripe mock generators.

2. **Paywall Bypass Vulnerabilities in Routes**:
   - In `src/app/api/email/send-cv/route.ts`:
     - Lines 9-17:
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
       ```
       Accepts `unlocked_session`, `demo_`, and any session string longer than 5 characters when Stripe is not configured.
     - Lines 92-110:
       ```typescript
       export async function GET(req: NextRequest) {
         const { searchParams } = new URL(req.url);
         const email = searchParams.get('email');
         if (email) {
           const matching = emailOutbox.filter((e) => e.recipientEmail.toLowerCase() === email.toLowerCase());
           return NextResponse.json({ success: true, count: matching.length, emails: matching });
         }
         return NextResponse.json({ success: true, totalSent: emailOutbox.length, latest: ... });
       }
       ```
       An unauthenticated GET request leaks all customer emails, recipient details, and invoices.
   - In `src/app/api/export/docx/route.ts`:
     - Lines 10-32: Verifies directly against `stripe.checkout.sessions.retrieve(sessionId)`. Does not consult or update any persistent database or registry.
   - In `src/app/api/export/pdf/`:
     - Route directory and `route.ts` **do not exist**.
   - In `src/app/api/stripe/webhook/route.ts`:
     - Lines 40-65: On `checkout.session.completed`, emails the CV but never stores payment data to disk or database.

3. **Client-Side & DOM Text Leakage**:
   - In `src/components/StandardCvPaperView.tsx`:
     - Lines 644-650:
       ```tsx
       <div
         className={
           !isPaid
             ? 'filter blur-[5px] select-none pointer-events-none opacity-40 transition-all duration-300'
             : ''
         }
       >
       ```
       The complete rewritten resume text (experience, summary, skills, references) is rendered into the DOM and only blurred with CSS. Unpaid visitors can extract the full text via DevTools.
     - Lines 79-95 & 98-148: `handleDownloadDocx` calls `generateDocxBlob(editableCv)` and `handleDownloadPdf` calls `html2canvas` directly in the browser if `isPaid` is true.
   - In `src/lib/paymentAccess.ts`:
     - Lines 6-12: `isUserPaid()` checks `localStorage.getItem('ratemycv_paid') === 'true'`, allowing client-side tampering to unlock downloads.

---

## 2. Logic Chain

1. **Need for Persistent Registry**:
   - Observations show neither `/api/stripe/webhook` nor `/api/stripe/verify` nor export routes record verified payments in local storage.
   - Without a local persistent registry, every export/verify request must query Stripe live. If Stripe is rate-limited, unreachable, or in test environments, user access fails.
   - Furthermore, cross-device access by customer email (R1, R3) requires a registry mapping email to verified purchases.
   - Therefore, `src/lib/paymentRegistry.ts` must implement `PaymentRecord` and `IPaymentRegistry` with atomic file-backed persistence, concurrency locking, and case-insensitive email indexing.

2. **Need for Unified Verification Helper**:
   - Observations show inconsistent, duplicate, and vulnerable verification logic across routes (`/api/export/docx` vs `/api/email/send-cv`).
   - `/api/email/send-cv` contains critical bypasses (`unlocked_session`, `demo_`, length > 5).
   - Consolidating verification into `src/lib/serverPaymentVerification.ts` (`verifyServerPayment`) ensures uniform security rules:
     - Check persistent registry first (fast, reliable, cross-device).
     - Fallback to Stripe API and cache result into registry.
     - Strict rejection of bypass tokens (`unlocked_session`, `demo_`, fake tokens).
     - Strict rejection of test mode bypasses when `NODE_ENV === 'production'`.

3. **Need for Route & Client Hardening**:
   - `/api/export/docx`, new `/api/export/pdf`, and `/api/email/send-cv` must all call `verifyServerPayment()` and return 402 if unverified.
   - The unauthenticated GET endpoint in `/api/email/send-cv` must be deleted to eliminate data leakage.
   - `StandardCvPaperView.tsx` must replace CSS-blurred confidential DOM nodes with redacted placeholder lines so unpaid candidates cannot inspect DOM to extract the text.

4. **Need for Test Harness Activation**:
   - `vitest.config.ts` and test mock fixtures are ready, but `vitest` is not installed.
   - Adding `vitest` to `package.json` devDependencies and `"test": "vitest run"` enables immediate automated test execution for unit and integration verification.

---

## 3. Caveats

1. **Storage Choice (File-Backed vs SQLite)**:
   - File-backed atomic JSON storage was selected over `better-sqlite3` to avoid native C++ build tool dependencies (`node-gyp`, MSBuild) on Windows. If high multi-process concurrency is needed in the future, SQLite or Redis can be swapped under the identical `IPaymentRegistry` interface.
2. **Local Environment Variables**:
   - `.env.local` does not currently contain active Stripe live keys. Verification in local testing relies on mock Stripe clients (`tests/e2e/helpers/stripeMocks.ts`) or `ENABLE_PAYMENT_TEST_BYPASS` in non-production environments.
3. **No Direct Code Modifications**:
   - As an Explorer with read-only boundaries, this report proposes exact technical specifications and code structures without modifying source code files.

---

## 4. Conclusion

The existing codebase provides a solid Next.js 14 base with Stripe SDK installed, but suffers from:
1. Complete lack of payment persistence across sessions and devices.
2. Multiple critical bypass paths and data leak vulnerabilities in backend routes.
3. DOM-level text exposure on unpaid previews.
4. Missing test runner installation.

Full technical designs for `src/lib/paymentRegistry.ts`, `src/lib/serverPaymentVerification.ts`, route hardening, DOM redaction, and Vitest test suites have been completed and documented in `analysis.md`. The implementation phase (Milestone 1 developers) can proceed with zero ambiguity.

---

## 5. Verification Method

1. **Inspect Analysis File**:
   - Read `.agents/teamwork_preview_explorer_m1_1/analysis.md` to verify the detailed class designs, interface contracts, and implementation blueprints.
2. **Inspect Vulnerabilities**:
   - View `src/app/api/email/send-cv/route.ts` lines 9-20 and lines 92-110 to verify reported bypass and GET leak issues.
   - View `src/components/StandardCvPaperView.tsx` lines 644-650 to verify reported DOM blur text leakage.
   - View `package.json` lines 5-10 and 28-37 to verify missing `vitest` and test scripts.
3. **Post-Implementation Verification (For Implementers)**:
   - Install `vitest`: `npm install -D vitest`
   - Run tests: `npm test`
   - Run specific M1 test suite: `npx vitest run tests/e2e/tier1-features/payment-registry.test.ts`
