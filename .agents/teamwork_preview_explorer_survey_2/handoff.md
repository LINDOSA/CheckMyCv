# Explorer 2 Survey Report: Stripe Checkout, Webhooks, Payment Verification & Persistence

**Investigator**: Explorer 2 (Survey Phase)  
**Date**: 2026-09-17  
**Scope**: Stripe checkout integration, webhook processing, payment verification & persistence, receipt generation, and security bypass vulnerabilities.  
**Target Codebase**: `c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV`

---

## 1. Observation

### 1.1 Stripe Checkout Session Creation & Client Configuration
- **Stripe Client Configuration (`src/lib/stripe.ts`)**:
  - Client initialization:
    ```typescript
    // src/lib/stripe.ts:13-30
    export function getStripe(): Stripe | null {
      const secretKey = process.env.STRIPE_SECRET_KEY;
      if (!secretKey) return null;
      if (!stripeInstance) {
        stripeInstance = new Stripe(secretKey, {
          typescript: true,
          appInfo: { name: 'ScoreMyCV', version: '1.0.0' },
        });
      }
      return stripeInstance;
    }
    ```
  - Configuration check:
    ```typescript
    // src/lib/stripe.ts:32-35
    export function isStripeConfigured(): boolean {
      const key = process.env.STRIPE_SECRET_KEY;
      return Boolean(key && key.startsWith('sk_'));
    }
    ```
  - Pricing & Product Metadata:
    ```typescript
    // src/lib/stripe.ts:3-9
    export const REWRITE_PRODUCT = {
      name: 'ScoreMyCV - Executive ATS Resume Rewrite Pass',
      description: 'Single-column Workday & Greenhouse certified format, XYZ accomplishment bullets, keyword match, Word (.docx) & PDF (.pdf)',
      amountCents: 900, // $9.00 USD
      currency: 'usd',
    };
    ```
- **Checkout Route (`src/app/api/stripe/checkout/route.ts`)**:
  - `POST /api/stripe/checkout` receives `{ email, profileId, candidateName }`.
  - When Stripe is configured (lines 47-73):
    ```typescript
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: REWRITE_PRODUCT.currency,
          product_data: {
            name: REWRITE_PRODUCT.name,
            description: REWRITE_PRODUCT.description,
            images: [`${origin}/logo.svg`],
          },
          unit_amount: REWRITE_PRODUCT.amountCents,
        },
        quantity: 1,
      }],
      mode: 'payment',
      customer_email: email && email.includes('@') ? email.trim() : undefined,
      metadata: {
        profileId: selectedProfile,
        candidateName: candidateName || 'Candidate',
        product: 'executive_ats_rewrite',
      },
      success_url: `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}&profileId=${encodeURIComponent(selectedProfile)}`,
      cancel_url: `${origin}/?payment=cancelled`,
    });
    ```
  - Test mode fallback (lines 18-44):
    If Stripe is not configured:
    - If `process.env.ENABLE_PAYMENT_TEST_BYPASS === 'true'`, returns synthetic `demoSessionId = test_simulated_${Date.now()}` with redirect URL `/?payment=success&session_id=...&testMode=true`.
    - Else returns 503 error.

---

### 1.2 Webhook Handling & Processing
- **Webhook Endpoint**:
  - Located at `src/app/api/stripe/webhook/route.ts` (API path `/api/stripe/webhook`, not `/api/webhooks/stripe`).
- **Signature Verification Defect (`src/app/api/stripe/webhook/route.ts:22-36`)**:
  ```typescript
  if (webhookSecret && signature) {
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('⚠️ Stripe Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }
  } else {
    // If webhook secret is not set in dev, parse event directly for testing
    try {
      event = JSON.parse(body);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
  }
  ```
  - Directly observed: When `STRIPE_WEBHOOK_SECRET` or the `stripe-signature` header is missing, the endpoint falls back to parsing raw JSON.
- **Event Handling (`src/app/api/stripe/webhook/route.ts:40-64`)**:
  - On `checkout.session.completed`:
    - Extracts `candidateEmail = session.customer_details?.email || session.customer_email`.
    - Extracts `profileId` and `candidateName` from `session.metadata`.
    - Calls `sendCvAndInvoiceEmail({ recipientEmail, cvData, sessionId, candidateName })`.
    - **No persistence**: No database, file, or cache write occurs. Payment confirmation is ephemeral.

---

### 1.3 Payment Verification & Persistence Status
- **Zero Persistent Backend Storage**:
  - In `package.json`:
    - No database engine or ORM: no `better-sqlite3`, `sqlite3`, `prisma`, `@prisma/client`, `pg`, `mysql2`, `mongoose`, `ioredis`, or KV store.
  - In `src/lib/invoiceEmailService.ts:23`:
    ```typescript
    export const emailOutbox: SentEmailRecord[] = [];
    ```
    - The only storage on the backend is an in-memory array (`emailOutbox`) in Node.js process memory.
- **Client-Side Authorization Flag (`src/lib/paymentAccess.ts:6-21`)**:
  ```typescript
  export function isUserPaid(): boolean {
    if (typeof window === 'undefined') return false;
    return (
      sessionStorage.getItem('ratemycv_paid') === 'true' ||
      localStorage.getItem('ratemycv_paid') === 'true'
    );
  }

  export function markUserPaid(sessionId?: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('ratemycv_paid', 'true');
    localStorage.setItem('ratemycv_paid', 'true');
    if (sessionId) {
      sessionStorage.setItem('ratemycv_session_id', sessionId);
    }
  }
  ```
- **Session Verification Endpoint (`src/app/api/stripe/verify/route.ts:6-64`)**:
  - `GET /api/stripe/verify?session_id=...`
  - Validates `session_id` by calling `stripe.checkout.sessions.retrieve(sessionId)` and checking `session.payment_status === 'paid'`.
  - Checks `sessionId.startsWith('test_simulated_') || sessionId.startsWith('demo_')` gated by `process.env.ENABLE_PAYMENT_TEST_BYPASS === 'true'`.
  - Does NOT persist the verified session into any database or cache.
- **Cross-Device Gaps**:
  - If a user completes checkout on Mobile Device A, Device B cannot access the unlocked CV because `ratemycv_paid` is local to Device A's browser storage.
  - Entering an email in `PaywallModal` only writes `sessionStorage.setItem('ratemycv_customer_email', cleanEmail)` (line 39) and triggers checkout; there is no endpoint to restore access by matching candidate email against a verified payment registry.

---

### 1.4 Receipt Generation
- **Invoice Data Model (`src/lib/invoiceTypes.ts:1-56`)**:
  - `InvoiceData` interface defines: `invoiceNumber`, `date`, `customerName`, `customerEmail`, `sessionId`, `packageName`, `amountPaid`, `subtotal`, `tax`, `total`, `status`, `paymentMethod`, `companyName`, `companyAddress`, `supportEmail`.
  - `createInvoiceData`: Generates a randomized serial `INV-YYYY-XXXXXX` using `Math.floor(100000 + Math.random() * 900000)`.
  - `generateInvoiceHtml`: Returns an HTML string formatted as an official tax invoice with print stylesheet (`@media print`).
- **Email Delivery Service (`src/lib/invoiceEmailService.ts:28-379`)**:
  - `generateEmailHtml`: Injects the receipt details into the email HTML body.
  - `sendCvAndInvoiceEmail`: Asynchronously dispatches via Resend API, Nodemailer SMTP, or in-memory sandbox.
- **Client Receipt View (`src/components/InvoiceModal.tsx:36-38, 100-106`)**:
  - Displays the invoice modal and relies on `window.print()` to print or export PDF.
- **Server-Side Receipt PDF**:
  - No server-side PDF generator exists for receipts.
  - Invoice numbers change on every function invocation because they are randomized rather than tied deterministically to the Stripe payment intent or checkout session ID.

---

### 1.5 Security Vulnerabilities & Bypass Vectors
1. **Client-Side Storage Forgery (LocalStorage Bypass)**:
   - `src/components/StandardCvPaperView.tsx:79-96`:
     ```typescript
     const handleDownloadDocx = async () => {
       if (!isPaid) {
         onOpenPaywall?.();
         return;
       }
       setIsGeneratingDocx(true);
       try {
         const blob = await generateDocxBlob(editableCv);
         const filename = `${editableCv.name.replace(/\s+/g, '_')}_ATS_Resume.docx`;
         downloadBlobAsFile(blob, filename);
       } ...
     ```
     Because `isPaid` is derived from `localStorage.getItem('ratemycv_paid') === 'true'`, running `localStorage.setItem('ratemycv_paid', 'true')` in browser DevTools immediately unlocks:
     - Full client-side `.docx` generation via `docx` library (`generateDocxBlob`).
     - Full client-side `.pdf` generation via `html2canvas` + `jsPDF` (`handleDownloadPdf`, lines 98-148).
     - Full plaintext clipboard copy (`handleCopyText`, lines 180-218).
     - Full referee editor (`handleUpdateReference`, lines 221-250).
2. **DOM-Level Paywall Blur Vulnerability**:
   - `src/components/StandardCvPaperView.tsx:645-649`:
     ```tsx
     <div className={
       !isPaid
         ? 'filter blur-[5px] select-none pointer-events-none opacity-40 transition-all duration-300'
         : ''
     }>
     ```
     The entire rewritten CV content (Summary, Professional Experience bullets, Education, Core Skills, and References) is fully rendered in the client DOM. Removing the CSS blur class in browser DevTools or inspecting the DOM exposes 100% of the rewritten CV without payment.
3. **Webhook Authentication Bypass**:
   - `src/app/api/stripe/webhook/route.ts:29-36`:
     Absence of `STRIPE_WEBHOOK_SECRET` causes the route to fall back to `JSON.parse(body)`. Anyone can issue a forged `POST /api/stripe/webhook` with a fabricated `checkout.session.completed` event to force dispatch of revamped CVs to any email address.
4. **Hardcoded Payment Bypasses in `/api/email/send-cv`**:
   - `src/app/api/email/send-cv/route.ts:9-20`:
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
     - Unlike `/api/stripe/verify` and `/api/export/docx`, this endpoint does NOT verify `process.env.ENABLE_PAYMENT_TEST_BYPASS === 'true'`. Passing `sessionId: 'unlocked_session'` or `sessionId: 'demo_bypass'` succeeds unconditionally, even in production.
     - If Stripe keys are unconfigured, ANY session ID longer than 5 characters authorizes sending the CV.
5. **Information Disclosure in `/api/email/send-cv`**:
   - `src/app/api/email/send-cv/route.ts:92-110`:
     `GET /api/email/send-cv?email=...` exposes all sent candidate records, recipient emails, and full HTML invoice contents to unauthenticated callers.
6. **No Server-Side PDF Export Route**:
   - There is no `/api/export/pdf` route. All PDF downloads occur via client-side canvas rasterization in the browser without server authorization.
7. **Client API Fallback Bug**:
   - `src/components/StandardCvPaperView.tsx:91`:
     `window.open('/api/export/docx?profile=' + editableCv.id, '_blank')` fails to pass `session_id`. If client-side docx generation fails, valid paying users receive a 402 Payment Required error from `/api/export/docx`.

---

## 2. Logic Chain

1. **Premise 1 (Storage Architecture)**:
   - Observation 1.3 shows no database driver in `package.json` and no database files in the repository.
   - Observation 1.2 shows that `checkout.session.completed` in `src/app/api/stripe/webhook/route.ts` only triggers email dispatch, writing nothing to any storage.
   - **Inference 1**: Payment status exists exclusively in the candidate's browser `localStorage` (`ratemycv_paid`) and ephemeral query parameters (`?payment=success&session_id=...`). Consequently, cross-device access and persistent candidate email matching are impossible in the current codebase without adding a persistent backend storage layer.

2. **Premise 2 (Paywall Enforcement Mechanics)**:
   - Observation 1.5 (1 & 2) shows that `FullRewriteModal` and `StandardCvPaperView` generate the revamped CV in React memory and render it to the DOM with CSS `filter blur-[5px]`.
   - Furthermore, `handleDownloadDocx` and `handleDownloadPdf` run `generateDocxBlob` and `html2canvas`/`jsPDF` directly on the client if `isPaid` is true.
   - **Inference 2**: The client browser is currently the gatekeeper of the revamped document. Setting `localStorage.setItem('ratemycv_paid', 'true')` or modifying CSS in DevTools completely unlocks the product without contacting any backend verification endpoint.

3. **Premise 3 (Server Endpoint Discrepancies)**:
   - Observation 1.1 & 1.3 shows `/api/export/docx` and `/api/stripe/verify` gate simulated sessions with `process.env.ENABLE_PAYMENT_TEST_BYPASS === 'true'`.
   - Observation 1.5 (4) shows `/api/email/send-cv` permits `sessionId.startsWith('demo_')`, `test_simulated_`, or `'unlocked_session'` without checking `ENABLE_PAYMENT_TEST_BYPASS`.
   - Observation 1.5 (3) shows `/api/stripe/webhook` parses unauthenticated JSON if webhook secrets are missing.
   - **Inference 3**: Even if the client-side vulnerabilities are fixed, the backend services possess critical security holes allowing unauthenticated document dispatch and simulated token exploitation.

---

## 3. Caveats

1. **Network & External Stripe Mode**:
   - Stripe API keys (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) were not invoked against live Stripe endpoints during this survey because the exploration is strictly local and read-only.
2. **Server-Side PDF Dependencies**:
   - Node.js PDF rendering (if implementing `/api/export/pdf`) will require an appropriate backend tool (e.g. `jspdf`, `pdfkit`, or an HTML-to-PDF pipeline) compatible with the current Next.js 14 server runtime.
3. **Database Choice**:
   - Because no database currently exists, introducing persistent storage should be lightweight and zero-dependency where possible (e.g. SQLite via `better-sqlite3` or a typed JSON file registry with atomic file locking) unless an external Postgres/Redis connection is configured via environment variables.

---

## 4. Conclusion

The payment infrastructure of ScoreMyCV contains foundational Stripe checkout logic and email dispatch, but suffers from three primary architectural and security deficits:

1. **Lack of Persistent Payment Registry**:
   - Verified purchases are not recorded in any database.
   - Cross-device restore and candidate email matching are not possible.
   - Webhook `checkout.session.completed` does not persist payment state.
2. **Complete Client-Side Paywall Bypass**:
   - Revamped CVs are rendered in the DOM with CSS blur.
   - Word (.docx) and PDF (.pdf) files are compiled client-side when `localStorage.getItem('ratemycv_paid') === 'true'`.
   - Client storage tokens can be forged trivially in browser DevTools.
3. **Severe API Vulnerabilities**:
   - `/api/stripe/webhook` bypasses signature checks when secrets are unset.
   - `/api/email/send-cv` allows arbitrary fake session tokens (`demo_`, `test_simulated_`, `unlocked_session`) in any environment without checking `ENABLE_PAYMENT_TEST_BYPASS`.
   - `/api/email/send-cv` leaks candidate emails and invoices via unauthenticated `GET`.
   - No server-side `/api/export/pdf` route exists.

### Actionable Implementation Roadmap for Builder:
1. **Persistent Payment Registry**:
   - Implement a persistent database/store (e.g. SQLite or atomic JSON registry) tracking `sessionId`, `customerEmail`, `profileId`, `candidateName`, `paymentStatus`, `amountCents`, and `createdAt`.
   - Update `checkout.session.completed` in `src/app/api/stripe/webhook/route.ts` to persist verified payments.
   - Add `/api/stripe/check-access` or restore endpoint to verify customer email across devices.
2. **Harden Backend Export & Email Routes**:
   - Require verified `sessionId` from the persistent registry (or Stripe API retrieval) before generating documents in `/api/export/docx`.
   - Implement `/api/export/pdf` with identical server-side verification.
   - Remove fake session IDs (`unlocked_session`, `demo_`, `test_simulated_`) from `/api/email/send-cv` unless explicitly enabled by `ENABLE_PAYMENT_TEST_BYPASS === 'true'`.
   - Remove or authenticate `GET /api/email/send-cv`.
3. **Harden Frontend Paywall**:
   - Do NOT render full rewritten CV body in the DOM when unpaid; only render truncated preview or teaser text from the server.
   - Remove client-side docx and pdf generation for unpaid users; route all downloads through server-authenticated endpoints (`/api/export/docx` and `/api/export/pdf`).
   - Remove `markUserPaid` from purely client-controlled paths.
4. **Deterministic Server Receipts**:
   - Tie invoice numbers directly to Stripe transaction refs (e.g., `INV-${session.created}-${session.id.slice(-6)}`).
   - Store invoice metadata in the persistent payment registry.

---

## 5. Verification Method

To independently verify these findings:

1. **Verify Client-Side Bypass in DevTools**:
   - Open the web application at `http://localhost:3000`.
   - Score a CV to reach the Score Display page.
   - In the browser console, execute:
     ```javascript
     localStorage.setItem('ratemycv_paid', 'true');
     window.dispatchEvent(new Event('storage'));
     ```
   - Observe: Clicking "Preview Format (Locked)" or "View & Download Revamped CV" immediately unlocks the full document, enables Word (.docx) download, PDF download, and referee editor without ever purchasing.
2. **Verify DOM-Level Leak**:
   - Inspect the blurred paper element (`#ats-printable-resume-paper`) in DevTools while unpaid.
   - Inspect the inner HTML or run `document.getElementById('ats-printable-resume-paper').innerText`.
   - Observe: The complete rewritten CV text is fully present in plain text.
3. **Verify API Endpoint Bypasses**:
   - In terminal/PowerShell, test `/api/email/send-cv` without payment:
     ```bash
     curl -X POST http://localhost:3000/api/email/send-cv \
       -H "Content-Type: application/json" \
       -d '{"email":"test@example.com","sessionId":"unlocked_session","profileId":"it_cloud"}'
     ```
     Observe: Returns HTTP 200 `{ "success": true, "delivered": true }` because of lines 11-17 in `src/app/api/email/send-cv/route.ts`.
   - Test data leakage in `GET /api/email/send-cv`:
     ```bash
     curl http://localhost:3000/api/email/send-cv
     ```
     Observe: Returns HTTP 200 with complete history of sent emails and invoices.
4. **Inspect Source Files**:
   - `src/lib/stripe.ts` (lines 13-35)
   - `src/lib/paymentAccess.ts` (lines 6-28)
   - `src/app/api/stripe/checkout/route.ts` (lines 18-79)
   - `src/app/api/stripe/webhook/route.ts` (lines 22-64)
   - `src/app/api/stripe/verify/route.ts` (lines 19-64)
   - `src/app/api/export/docx/route.ts` (lines 10-48)
   - `src/app/api/email/send-cv/route.ts` (lines 9-29, 92-110)
   - `src/components/StandardCvPaperView.tsx` (lines 79-150, 644-650)
