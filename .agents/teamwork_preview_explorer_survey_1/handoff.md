# ScoreMyCV Codebase Architecture & Paywall Security Survey Report

## 1. Observation

### 1.1 Tech Stack & Server Infrastructure
- **Framework & Version**: Next.js 14.2.20 (App Router), React 18.3.1, React-DOM 18.3.1 (`package.json:20, 23-24`).
- **Language & Runtime**: TypeScript 5.7.2 (`tsconfig.json:1-27`), Node.js runtime (`runtime = 'nodejs'` configured in API routes).
- **Styling**: Tailwind CSS 3.4.16, PostCSS 8.4.49, Autoprefixer 10.4.20 (`package.json:33-35`, `tailwind.config.ts`).
- **Iconography & UI**: `@phosphor-icons/react` 2.1.10, `lucide-react` 0.468.0, `clsx` 2.1.1, `tailwind-merge` 2.5.5 (`package.json:12, 14, 18, 26`).
- **Document & PDF Libraries**:
  - `docx` 9.7.1: Server-side and client-side docx generation (`package.json:15`).
  - `html2canvas` 1.4.1: Client-side DOM rasterization (`package.json:16`).
  - `jspdf` 4.2.1: Client-side PDF compilation from rasterized images (`package.json:17`).
  - `mammoth` 1.8.0 & `pdf-parse` 1.1.1: File text parsing on upload (`package.json:19, 22`).
- **Payment & Email Libraries**:
  - `stripe` 22.6.2 (`package.json:25`).
  - `nodemailer` 10.0.10 (`package.json:21`).
- **Build & Test Setup**:
  - `package.json:5-10`:
    ```json
    "scripts": {
      "dev": "next dev",
      "build": "next build",
      "start": "next start",
      "lint": "next lint"
    }
    ```
  - **No automated test framework** (Jest, Vitest, Playwright, or Cypress) is configured in `package.json` or devDependencies.
- **Middleware & Security Headers**:
  - `src/middleware.ts:4-40`: Enforces HTTPS redirect in production if `x-forwarded-proto === 'http'`. Sets headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
  - In non-local environments, sets `Strict-Transport-Security` and `Content-Security-Policy: upgrade-insecure-requests`.

### 1.2 Route Definitions & Endpoints
The application uses the Next.js 14 App Router layout located under `src/app`:
- **Frontend Pages**:
  - `src/app/page.tsx`: Core single-page application containing Hero, ScoreForm, ScoringProgress, ScoreDisplay, and PaymentNotification handler.
  - `src/app/insights/page.tsx`: Recruiter Insights & Keyword Gap Analysis page.
  - `src/app/layout.tsx`: Root HTML layout with Inter font and theme wrapper.
  - `src/app/sitemap.ts` & `src/app/robots.ts`: Dynamic metadata and SEO crawlers.
- **API Endpoints**:
  - `POST /api/score` (`src/app/api/score/route.ts`): Invokes `scoreCV` via `gemini.ts` (LLM via OpenRouter/OpenAI) with deterministic fallback to `scoringEngine.ts`.
  - `POST /api/parse` (`src/app/api/parse/route.ts`): Accepts PDF/DOCX/TXT file multipart upload up to 10MB; parses text via `fileParser.ts`.
  - `POST /api/rewrite` (`src/app/api/rewrite/route.ts`): Rewrites an individual bullet point into the Google XYZ formula using Gemini/OpenRouter.
  - `POST /api/agent/submission-readiness` (`src/app/api/agent/submission-readiness/route.ts`): Runs `auditCvForSubmission` or `ensureCvSubmissionReady` from `cvSubmissionAgent.ts`.
  - `POST /api/stripe/checkout` (`src/app/api/stripe/checkout/route.ts`): Generates a Stripe Checkout Session for $9.00 USD.
  - `GET /api/stripe/verify` (`src/app/api/stripe/verify/route.ts`): Verifies a Stripe session ID against Stripe API or test simulation bypass.
  - `POST /api/stripe/webhook` (`src/app/api/stripe/webhook/route.ts`): Stripe webhook handler for `checkout.session.completed` and `payment_intent.succeeded`.
  - `GET & POST /api/export/docx` (`src/app/api/export/docx/route.ts`): Generates binary DOCX download.
  - `GET & POST /api/email/send-cv` (`src/app/api/email/send-cv/route.ts`): Dispatches docx attachment and HTML tax invoice via Resend, SMTP, or simulated outbox.
  - **`/api/export/pdf`**: **Does NOT exist** anywhere in `src/app/api/`.

---

### 1.3 Document Export Endpoints Analysis

#### A. `/api/export/docx` (`src/app/api/export/docx/route.ts`)
1. **Implementation & Document Assembly**:
   - Accepts both `GET` (query params `session_id`, `profile`) and `POST` (JSON body `cvText`, `targetRole`, `profileId`, `sessionId`).
   - If `cvText` is supplied, calls `parseUserCvToStandardDocument(cvText, targetRole)` (`cvStandardData.ts:543-1105`).
   - Otherwise, retrieves predefined standard profile using `getStandardCV(profileId)` (`cvStandardData.ts:446-450`).
   - Compiles Word document via `createDocxFromStandardCV(cvData)` (`docxGenerator.ts:22-519`) and serializes to buffer via `Packer.toBuffer(doc)`.
   - Returns buffer as `Uint8Array` with `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document` and `Content-Disposition: attachment; filename="<Candidate>_ATS_Optimized_Resume.docx"`.
2. **Payment Authorization Mechanism**:
   - Calls `isPaymentAuthorized(sessionId)` (`src/app/api/export/docx/route.ts:10-32`):
     ```ts
     async function isPaymentAuthorized(sessionId: string | null): Promise<boolean> {
       if (!sessionId) return false;
       const allowTestBypass = process.env.ENABLE_PAYMENT_TEST_BYPASS === 'true';
       if (
         allowTestBypass &&
         (sessionId.startsWith('test_simulated_') || sessionId.startsWith('demo_'))
       ) {
         return true;
       }
       const stripe = getStripe();
       if (!stripe || !isStripeConfigured()) {
         return false;
       }
       try {
         const session = await stripe.checkout.sessions.retrieve(sessionId);
         return session.payment_status === 'paid';
       } catch {
         return false;
       }
     }
     ```
   - **Vulnerabilities**:
     - No server-side session persistence or database check: directly depends on Stripe API retrieval or `test_simulated_` prefix when `ENABLE_PAYMENT_TEST_BYPASS` is true.
     - When `STRIPE_SECRET_KEY` is omitted in `.env.local`, `isStripeConfigured()` returns false, causing all non-test requests to return 402 even if genuine, while test tokens bypass if flag enabled.

#### B. `/api/export/pdf`
- **Current Status**: **Non-existent on backend**.
- **Client implementation**: In `src/components/StandardCvPaperView.tsx:98-149`, `handleDownloadPdf` executes entirely client-side:
  - Dynamically imports `html2canvas` and `jspdf`.
  - Captures DOM node `#ats-printable-resume-paper` (`paperRef.current`).
  - Converts canvas to JPEG image data URL.
  - Slices image across A4 pages and triggers `pdf.save(...)`.
- **Flaws**:
  - No server-side payment verification is performed prior to releasing PDF data.
  - Generates image-based PDF (raster canvas) rather than accessible, selectable, ATS-parseable vector/text PDF.
  - Entire document content must already be loaded into the client DOM to create the PDF.

#### C. Email Dispatch Route `/api/email/send-cv` (`src/app/api/email/send-cv/route.ts`)
1. **Implementation**:
   - `POST` accepts `{ email, sessionId, profileId, cvText, targetRole, candidateName, cvData }`.
   - Generates DOCX attachment using `createDocxFromStandardCV(cvData)`.
   - Generates HTML receipt with `generateEmailHtml(cvData, invoice)`.
   - Dispatches via Resend API (`RESEND_API_KEY`), Nodemailer (`SMTP_HOST`), or pushes to in-memory `emailOutbox` array (`src/lib/invoiceEmailService.ts:22-23`).
2. **Payment Authorization Mechanism**:
   - Lines 9-29 of `src/app/api/email/send-cv/route.ts`:
     ```ts
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
       const stripe = getStripe();
       if (!stripe) return false;
       try {
         const session = await stripe.checkout.sessions.retrieve(sessionId);
         return session.payment_status === 'paid';
       } catch {
         return false;
       }
     }
     ```
   - **Severe Vulnerabilities**:
     - Hardcoded token `'unlocked_session'` bypasses payment unconditionally!
     - `sessionId.startsWith('test_simulated_')` and `sessionId.startsWith('demo_')` bypass payment unconditionally **without checking `ENABLE_PAYMENT_TEST_BYPASS`**.
     - If Stripe is not configured (`!isStripeConfigured()`), **ANY string with length > 5** (e.g. `"123456"`, `"secret"`, `"bypass"`) passes as authorized!
     - `GET /api/email/send-cv` has **no authentication or payment check whatsoever**: calling `GET /api/email/send-cv` dumps the entire in-memory `emailOutbox` including recipient emails, invoice numbers, amounts, and full HTML content.

---

### 1.4 Paywall Implementation & Client Bypass Vectors

#### A. Client-Side Token Storage (`src/lib/paymentAccess.ts`)
- In `src/lib/paymentAccess.ts:6-21`:
  ```ts
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
- **Bypass Vector 1**: A user can open browser developer tools console and type:
  `localStorage.setItem('ratemycv_paid', 'true'); location.reload()`
  This immediately sets `isPaid = true` throughout `src/app/page.tsx`, `ScoreDisplay.tsx`, and `StandardCvPaperView.tsx`.

#### B. Full CV Data Leakage via DOM & CSS Blur (`src/components/StandardCvPaperView.tsx`)
- In `src/components/StandardCvPaperView.tsx:643-650`:
  ```tsx
  {/* BODY SECTIONS WRAPPER WITH PAYWALL BLUR */}
  <div className="relative">
    <div
      className={
        !isPaid
          ? 'filter blur-[5px] select-none pointer-events-none opacity-40 transition-all duration-300'
          : ''
      }
    >
  ```
- Lines 651-876 render all sections: Professional Summary, Experience bullets, Education, Core Skills, Additional Information, and References.
- **Bypass Vector 2**: The rewritten CV is **not withheld on the server**. It is delivered to the unpaid client and merely obscured with CSS `blur-[5px]`. Inspecting DOM elements or removing the CSS class reveals 100% of the document content.
- **Bypass Vector 3**: When `isPaid` is toggled in the browser, `handleDownloadDocx` calls `generateDocxBlob(editableCv)` (`StandardCvPaperView.tsx:86`) and generates the complete `.docx` file **entirely inside the browser without contacting the backend**.

#### C. Checkout & Verification Simulation Flow
- In `src/app/api/stripe/checkout/route.ts:18-44`:
  If `isStripeConfigured()` is false and `ENABLE_PAYMENT_TEST_BYPASS === 'true'`, it crafts:
  `redirectUrl = origin + '/?payment=success&session_id=test_simulated_' + Date.now() + '&testMode=true'`
- In `src/app/page.tsx:44-98`, `PaymentNotification` inspects `payment === 'success'`:
  - It fetches `/api/stripe/verify?session_id=...`.
  - In `src/app/api/stripe/verify/route.ts:19-41`, if `sessionId.startsWith('test_simulated_')` and `ENABLE_PAYMENT_TEST_BYPASS === 'true'`, it returns `{ verified: true }`.
  - Frontend runs `markUserPaid(sessionId)`, permanently writing `ratemycv_paid = 'true'` into `localStorage`.
  - It immediately invokes `POST /api/email/send-cv` with the simulated session ID.
- **Bypass Vector 4**: Simply navigating to `https://<site>/?payment=success&session_id=test_simulated_123` executes the verification and automatically sets `ratemycv_paid` in client storage if test bypass is active.

#### D. Unauthenticated Webhook Parsing (`src/app/api/stripe/webhook/route.ts`)
- In `src/app/api/stripe/webhook/route.ts:22-36`:
  ```ts
  if (webhookSecret && signature) {
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) { ... }
  } else {
    // If webhook secret is not set in dev, parse event directly for testing
    try {
      event = JSON.parse(body);
    } catch (err) { ... }
  }
  ```
- **Bypass Vector 5**: If `STRIPE_WEBHOOK_SECRET` is not set, `/api/stripe/webhook` parses raw untrusted JSON with no signature verification and automatically invokes `sendCvAndInvoiceEmail(...)`.

#### E. Ephemeral Server Cache (`src/lib/cvStandardData.ts`)
- `DYNAMIC_CV_CACHE = new Map<string, StandardCVDocument>()` (`cvStandardData.ts:440`).
- No persistent storage (database or Redis) exists. Any server restart or serverless container rotation destroys cached parsed CVs.

---

## 2. Logic Chain

1. **Observation**: `StandardCvPaperView.tsx` renders the complete rewritten CV into the DOM regardless of `isPaid`, applying only `filter blur-[5px] select-none pointer-events-none opacity-40`.
   **Inference**: An unpaid user can read the text directly via browser DevTools or copy the DOM text without paying.

2. **Observation**: `StandardCvPaperView.tsx:86` calls `generateDocxBlob(editableCv)` client-side using the `docx` npm package, and lines 98-149 render the PDF client-side via `html2canvas` + `jspdf`.
   **Inference**: Once the client-side variable `isPaid` is true, no backend request to `/api/export/docx` or `/api/export/pdf` is required to download complete files.

3. **Observation**: `isUserPaid()` in `src/lib/paymentAccess.ts` checks `localStorage.getItem('ratemycv_paid') === 'true'`.
   **Inference**: Forging a single string in browser storage grants full UI access and enables client-side document generation without any backend validation.

4. **Observation**: In `src/app/api/email/send-cv/route.ts:11-20`, `isPaymentAuthorized` returns `true` if `sessionId === 'unlocked_session'`, if `sessionId` starts with `'test_simulated_'` or `'demo_'` (without checking any environment flag), or if `!isStripeConfigured()` and `sessionId.length > 5`.
   **Inference**: An unauthenticated attacker can trigger `/api/email/send-cv` with `sessionId: 'unlocked_session'` or `sessionId: '123456'` and receive the complete `.docx` file and invoice at any email address.

5. **Observation**: `src/app/api/export/docx/route.ts:10-32` checks Stripe directly via `stripe.checkout.sessions.retrieve(sessionId)` but does not verify whether the session corresponds to this customer, this CV, this profile, or whether it has already been used. No database or persistent payment registry records purchases.
   **Inference**: If a candidate switches devices or clears browser data, their purchase cannot be restored without re-verifying a raw session ID from Stripe.

6. **Observation**: No `/api/export/pdf` endpoint exists in `src/app/api/export/`.
   **Inference**: PDF export currently relies entirely on client-side screenshotting of the blurred/unblurred DOM rather than a secure server-rendered PDF engine.

7. **Observation**: In `cvSubmissionAgent.ts`, `auditCvForSubmission` validates 7 pillars: Contact integrity, Executive summary, Work experience XYZ metrics, Education & credentials, Skills matrix, Languages, and Professional references. However, this is currently an advisory check and is not wired as a mandatory quality gate blocking export of substandard or unverified CVs.

---

## 3. Caveats
- **Live Stripe Keys**: As observed in `.env.local`, `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are not yet populated with live credentials. The codebase falls back to simulation logic when `ENABLE_PAYMENT_TEST_BYPASS` is true.
- **Database Layer**: There is currently no ORM (Prisma/Drizzle/Mongoose) or database client installed in `package.json`. A persistent backend payment status registry (e.g. SQLite, JSON file store, KV store, or Stripe session sync) must be designed to satisfy Requirement R1 without adding incompatible runtime dependencies.
- **Test Setup**: `package.json` contains no test runner. Automated tests required by Acceptance Criteria (R2) will need a testing setup (e.g., node test runner or vitest/jest).

---

## 4. Conclusion
1. **Paywall Hardening is Urgent**: The current paywall is implemented almost entirely on the client, with major bypass vectors:
   - Full document text leaked in the DOM with CSS blur.
   - Client-side storage token `ratemycv_paid` trivially forged.
   - Unconditional bypass tokens (`'unlocked_session'`, `'test_simulated_'`, `length > 5`) in `/api/email/send-cv`.
   - Missing `/api/export/pdf` endpoint.
   - Absence of a persistent backend payment registry.
2. **CV Standards Engine Baseline Exists**: `cvSubmissionAgent.ts` and `scoringEngine.ts` contain foundational logic for XYZ metric detection, single-column architecture, contact integrity, and reference preservation, but need to be formalized into an automated backend quality checking pipeline that scores (0-100) and structurally verifies exported documents.

---

## 5. Detailed File Inventory

### Server Endpoints & Handlers
| File Path | Role & Description |
|-----------|--------------------|
| `src/app/api/export/docx/route.ts` | Server endpoint for generating and downloading ATS Word (.docx) documents. Performs payment checks via `isPaymentAuthorized`. |
| `src/app/api/email/send-cv/route.ts` | Server endpoint for emailing revamped CV (.docx) and tax receipt. Contains critical authorization bypass vulnerabilities. |
| `src/app/api/stripe/checkout/route.ts` | Creates Stripe Checkout sessions or test simulation redirect URLs. |
| `src/app/api/stripe/verify/route.ts` | Verifies Stripe Checkout session payment status. |
| `src/app/api/stripe/webhook/route.ts` | Stripe webhook event handler (`checkout.session.completed`). Parses raw JSON if webhook secret is absent. |
| `src/app/api/agent/submission-readiness/route.ts` | API gateway for the CV Submission Readiness Agent (audit & auto-fix). |
| `src/app/api/score/route.ts` | Main CV scoring API combining LLM analysis and deterministic heuristic scoring. |
| `src/app/api/rewrite/route.ts` | Bullet point rewrite API transforming duties into XYZ formula achievements. |
| `src/app/api/parse/route.ts` | File upload text extraction for PDF, DOCX, and TXT files. |

### Frontend Components & Pages
| File Path | Role & Description |
|-----------|--------------------|
| `src/app/page.tsx` | Main application page. Handles `PaymentNotification`, unlocks profiles, calls `/api/stripe/verify` and `/api/email/send-cv`. |
| `src/app/insights/page.tsx` | Recruiter Insights & Keyword Gap Analysis page. Links to PaywallModal and FullRewriteModal. |
| `src/components/PaywallModal.tsx` | Paywall dialog collecting receipt email and redirecting to Stripe checkout. |
| `src/components/StandardCvPaperView.tsx` | Black & white ATS resume view. Handles client-side docx & pdf generation; applies CSS blur overlay when unpaid. |
| `src/components/FullRewriteModal.tsx` | Modal displaying `StandardCvPaperView` with score leap comparison indicator. |
| `src/components/ScoreDisplay.tsx` | Interactive score display showing category breakdown and revamp package selector card. |
| `src/components/InvoiceModal.tsx` | Tax invoice and official receipt modal with resend email action. |
| `src/components/LiveRewritePreview.tsx` | Interactive demonstration comparing passive duties with XYZ metric bullets. |
| `src/components/ScoreForm.tsx` | CV text / job advert input and file upload form. |
| `src/components/ScoringProgress.tsx` | Animated 4-step progress indicator during scoring. |
| `src/components/Header.tsx` | App header navigation and action triggers. |
| `src/components/Hero.tsx` | Landing hero section. |
| `src/components/InfoModal.tsx` | Terms, Privacy Policy, and FAQ modal. |
| `src/components/ShareCardModal.tsx` | Social share card generator for score results. |
| `src/components/BackgroundMotion.tsx` | Subtle canvas background motion. |

### Libraries & Backend Core
| File Path | Role & Description |
|-----------|--------------------|
| `src/lib/paymentAccess.ts` | Client-side payment access helpers (`isUserPaid`, `markUserPaid`, `clearUserPaid`) reading/writing `ratemycv_paid`. |
| `src/lib/stripe.ts` | Stripe client initialization (`getStripe`, `isStripeConfigured`, `REWRITE_PRODUCT`). |
| `src/lib/docxGenerator.ts` | Generates single-column ATS Word documents using `docx` package (`createDocxFromStandardCV`, `generateDocxBlob`). |
| `src/lib/invoiceEmailService.ts` | Email dispatch service supporting Resend, SMTP, and simulated outbox with attached docx. |
| `src/lib/invoiceTypes.ts` | Data models and HTML generator for official tax receipts/invoices. |
| `src/lib/cvSubmissionAgent.ts` | 7-Pillar CV Submission Readiness Agent (`auditCvForSubmission`, `ensureCvSubmissionReady`). |
| `src/lib/cvStandardData.ts` | Standard CV schemas (`StandardCVDocument`), role profiles, and `parseUserCvToStandardDocument`. |
| `src/lib/scoringEngine.ts` | Comprehensive deterministic ATS scoring engine analyzing metric saturation, XYZ formulas, and keywords. |
| `src/lib/domainTaxonomy.ts` | Domain taxonomy classification (IT, Software, Finance, Product, etc.). |
| `src/lib/gemini.ts` | LLM client for scoring and rewriting using OpenRouter / OpenAI. |
| `src/lib/fileParser.ts` | Buffer parser extracting text from PDF and DOCX files. |
| `src/lib/sampleData.ts` | Sample CV datasets for demo and testing. |
| `src/lib/textCompression.ts` | Text compression and normalization utilities. |

### Configuration & Infrastructure
| File Path | Role & Description |
|-----------|--------------------|
| `package.json` | Project dependencies, scripts, and package metadata. |
| `tsconfig.json` | TypeScript configuration with `@/*` path mapping. |
| `src/middleware.ts` | Global Next.js middleware enforcing HTTPS and security headers. |
| `.env.example` | Template for environment variables (`OPENROUTER_API_KEY`, `STRIPE_SECRET_KEY`, etc.). |
| `.env.local` | Local environment variables file. |

---

## 6. Verification Method

To independently verify these findings:
1. **Verify No Backend PDF Export Route**:
   - Inspect `src/app/api/export` directory: notice only `docx/` exists; `pdf/` is absent.
   - Inspect `src/components/StandardCvPaperView.tsx:98-149` to confirm PDF export is executed purely on the client via `html2canvas` and `jspdf`.
2. **Verify Client Paywall Storage Vulnerability**:
   - Inspect `src/lib/paymentAccess.ts:6-12`: confirm `isUserPaid` reads directly from `localStorage.getItem('ratemycv_paid')`.
   - Inspect `src/components/StandardCvPaperView.tsx:645-649`: confirm the CV text is rendered directly into the DOM and merely blurred using Tailwind class `filter blur-[5px]`.
3. **Verify Email Route Payment Bypass**:
   - Inspect `src/app/api/email/send-cv/route.ts:11-20`: observe hardcoded string `'unlocked_session'`, `'test_simulated_'`, and `sessionId.length > 5` when Stripe is not configured.
4. **Verify Docx Export Route Payment Logic**:
   - Inspect `src/app/api/export/docx/route.ts:10-32`: observe lack of session ownership validation or persistent database registry.
5. **Verify Lack of Automated Test Setup**:
   - Inspect `package.json:5-10`: confirm only `dev`, `build`, `start`, `lint` exist. No `test` script or test harness is installed.
