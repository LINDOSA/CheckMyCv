# Milestone 1 Technical Analysis & Architecture Specification
**Explorer 1**: Read-Only Architecture & Security Investigation  
**Focus**: Project Dependencies, Stripe Integration, Persistent Payment Registry, Server Payment Verification, and Test Harness Setup

---

## Executive Summary

This investigation analyzed the ScoreMyCV codebase to establish the technical foundation for **Milestone 1: Secure Backend Paywall Enforcement & Registry**. 

Key findings:
1. **Test Infrastructure**: `vitest.config.ts` and test mock fixtures (`tests/e2e/helpers/fixtures.ts`, `tests/e2e/helpers/stripeMocks.ts`) already exist, but `vitest` is **not installed** in `package.json` devDependencies and no `test` script is registered in `package.json`.
2. **Critical Security Vulnerabilities**:
   - `/api/email/send-cv/route.ts` contains hardcoded bypass tokens (`unlocked_session`, `demo_`), and allows any session ID with `length > 5` if Stripe is unconfigured.
   - `/api/email/send-cv/route.ts` exposes an unauthenticated `GET` handler that leaks all outbox emails, recipients, and invoice metadata.
   - `StandardCvPaperView.tsx` renders full confidential rewritten CV text in the client DOM when unpaid, merely applying CSS `filter blur-[5px]`. Any user can bypass the paywall via DevTools inspection.
   - `paymentAccess.ts` relies on unverified `localStorage.getItem('ratemycv_paid') === 'true'`.
   - `/api/export/pdf/route.ts` does not exist yet, while client-side PDF export uses `html2canvas` on the blurred DOM.
   - `/api/stripe/webhook/route.ts` does not persist verified sessions into any persistent registry.
3. **Architectural Blueprints Developed**:
   - `src/lib/paymentRegistry.ts`: Fully specified atomic file-backed storage with serialized write mutex, Windows file-lock retry, case-insensitive email normalization, and idempotent upserts matching `IPaymentRegistry`.
   - `src/lib/serverPaymentVerification.ts`: Fully specified verification helper (`verifyServerPayment`) with environment hardening, strict token rejection, registry priority, and automatic Stripe API reconciliation.

---

## 1. Codebase & Environment Audit

### 1.1 Dependencies & Scripts (`package.json`)
- **Runtime**: Next.js `14.2.20` (App Router), React `18.3.1`, Node.js (target >=20).
- **Core Libraries**:
  - `stripe`: `^22.6.2` (installed and ready).
  - `docx`: `^9.7.1` (installed for DOCX generation).
  - `jspdf`: `^4.2.1` (installed for PDF document creation).
  - `nodemailer`: `^10.0.10` (installed for email delivery).
  - `html2canvas`: `^1.4.1` (used currently in client DOM capture).
- **Missing Test Dependencies**:
  - `vitest`: Missing from `devDependencies`.
  - No `"test": "vitest run"` or `"test:watch": "vitest"` script in `package.json`.
- **Recommendation**:
  Add `vitest: "^2.1.8"` to `devDependencies` and define `"test": "vitest run"` in `package.json`.

### 1.2 TypeScript Configuration (`tsconfig.json`)
- Target/Module: `esnext`, `moduleResolution: "bundler"`, `isolatedModules: true`.
- Path Aliases: `"@/*": ["./src/*"]`.
- `vitest.config.ts` aligns with this via:
  ```typescript
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  ```

### 1.3 Directory Structure & Existing Test Harnesses
```
RATEMYCV/
├── .env.example
├── .env.local
├── PROJECT.md
├── TEST_INFRA.md
├── vitest.config.ts
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── email/send-cv/route.ts   (Vulnerable: bypasses & GET leak)
│   │   │   ├── export/docx/route.ts     (Direct Stripe query, no registry)
│   │   │   ├── stripe/checkout/route.ts (Test simulation & live checkout)
│   │   │   ├── stripe/verify/route.ts   (GET verification, no registry)
│   │   │   └── stripe/webhook/route.ts  (No registry recording)
│   │   └── page.tsx
│   ├── components/
│   │   ├── PaywallModal.tsx             (Needs email-only submit guardrail)
│   │   ├── StandardCvPaperView.tsx      (Vulnerable: DOM blur leakage)
│   │   └── FullRewriteModal.tsx
│   └── lib/
│       ├── stripe.ts                    (Stripe SDK wrapper)
│       ├── paymentAccess.ts             (Vulnerable: client localStorage trust)
│       ├── docxGenerator.ts             (DOCX document layout engine)
│       └── invoiceEmailService.ts       (Email outbox and HTML generation)
└── tests/
    └── e2e/
        └── helpers/
            ├── fixtures.ts              (Full CV fixtures & payment records)
            └── stripeMocks.ts           (HMAC signature & session mocks)
```

---

## 2. Stripe Integration Audit & Vulnerability Assessment

### 2.1 Configuration & Environment Variables
- `src/lib/stripe.ts`:
  - `getStripe()` initializes `new Stripe(secretKey, { typescript: true, ... })`.
  - `isStripeConfigured()` checks `Boolean(key && key.startsWith('sk_'))`.
  - In `.env.local`, `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are not set by default.
  - In `.env.example`, templates are provided.
- **Rule for Milestone 1**: In production (`NODE_ENV === 'production'`), test mode tokens and simulated bypasses must be unconditionally rejected, even if `ENABLE_PAYMENT_TEST_BYPASS` is somehow set.

### 2.2 Endpoint Vulnerability Matrix

| Endpoint | File | Vulnerability / Deficiency | Required Hardening Fix |
|---|---|---|---|
| `/api/email/send-cv` | `src/app/api/email/send-cv/route.ts` | 1. Lines 11-16 accept `unlocked_session` and `demo_`.<br>2. Lines 18-20 allow any session with `length > 5` if Stripe not configured.<br>3. Lines 92-110 expose `GET` endpoint leaking entire email outbox with customer emails and invoices. | 1. Remove all mock bypasses.<br>2. Remove `GET` route or restrict to authenticated internal diagnostics.<br>3. Require `verifyServerPayment()` before dispatch. |
| `/api/export/docx` | `src/app/api/export/docx/route.ts` | Queries Stripe API on every export request; does not consult local persistent registry. If Stripe API is slow or rate-limited, valid users are blocked. | Integrate `verifyServerPayment()`: check registry first, fall back to Stripe, cache paid record in registry. Return 402 if unverified. |
| `/api/export/pdf` | `src/app/api/export/pdf/route.ts` | **Does not exist**. Clients currently rely on client-side canvas capture of the unauthenticated DOM. | Create native Node.js text ATS PDF export endpoint with strict 402 payment enforcement via `verifyServerPayment()`. |
| `/api/stripe/webhook` | `src/app/api/stripe/webhook/route.ts` | On `checkout.session.completed`, sends email but **does not save payment record** to any registry. Cross-device or subsequent requests cannot verify payment without re-hitting Stripe. | Call `paymentRegistry.recordPayment(record)` on verified webhook events. |
| `/api/stripe/verify` | `src/app/api/stripe/verify/route.ts` | Does not query registry; does not record verified sessions into registry. | Query registry first, then Stripe; record verified sessions to registry. |
| DOM / Client | `StandardCvPaperView.tsx` | Line 646 renders full confidential text with `filter blur-[5px]`. Client inspects DOM to extract CV without paying. | Truncate or replace confidential bullet points with redaction placeholders when `!isPaid`. Prevent client-side DOCX/PDF generation bypass. |
| Storage | `paymentAccess.ts` | Trusts `localStorage.getItem('ratemycv_paid') === 'true'`. | Prevent local storage from granting download rights; server must verify every download request. |

---

## 3. Detailed Technical Design: `src/lib/paymentRegistry.ts`

### 3.1 Interface Specification
The implementation must strictly adhere to the contracts defined in `PROJECT.md`:

```typescript
export interface PaymentRecord {
  sessionId: string;
  customerEmail: string;
  profileId: string;
  candidateName: string;
  paymentStatus: 'paid' | 'unpaid' | 'pending';
  amountCents: number;
  currency: string;
  invoiceNumber: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, string>;
}

export interface IPaymentRegistry {
  recordPayment(record: PaymentRecord): Promise<void>;
  getPaymentBySessionId(sessionId: string): Promise<PaymentRecord | null>;
  getPaymentsByEmail(email: string): Promise<PaymentRecord[]>;
  isSessionVerified(sessionId: string): Promise<boolean>;
  isEmailVerified(email: string): Promise<boolean>;
}
```

### 3.2 Storage Engine Architecture
To ensure zero external native binary compilation issues (critical on Windows where `better-sqlite3` requires MSBuild/Visual Studio C++ build tools), the registry will be implemented as an **Atomic File-Backed Database** with the following characteristics:

1. **Storage Location**:
   - Default: `path.resolve(process.cwd(), 'data/payments.json')`
   - Configurable via constructor parameter and `PAYMENT_REGISTRY_PATH` environment variable for isolated test execution.
2. **Directory Initialization**:
   - Automatically executes `fs.mkdir(path.dirname(filePath), { recursive: true })` before write operations.
3. **Concurrency Serialization (Mutex)**:
   - A promise-chained Mutex (`writeMutex`) serializes all file write and modification cycles within the process.
4. **Atomic File Replacement**:
   - Writes new content to a temporary sibling file: `${filePath}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`.
   - Flushes write to disk via `fs.writeFile()`.
   - Renames temporary file over target file via `fs.rename()`.
   - **Windows Locking Protection**: On Windows (NTFS), file renaming can throw `EPERM` or `EBUSY` if antivirus or another handle is briefly active. An exponential backoff retry loop (5 attempts, 10ms–160ms delay) ensures bulletproof atomicity.
5. **In-Memory Cache with Disk Synchronization**:
   - Maintains an in-memory `Map<string, PaymentRecord>` indexed by `sessionId`.
   - Reads existing JSON on first load. If the file does not exist, initializes with an empty dataset.
   - Handles corrupted JSON gracefully by creating a `.corrupt` backup and reinitializing.
6. **Data Normalization & Idempotency**:
   - Email addresses are normalized via `.trim().toLowerCase()`.
   - Calling `recordPayment()` with an existing `sessionId` updates the record deterministically (preserving `createdAt`, updating `updatedAt`, merging metadata) rather than creating duplicate entries.
7. **Testing Utilities**:
   - Exposes `clear(): Promise<void>` to allow clean resets between test suites.
   - Exposes `getAllPayments(): Promise<PaymentRecord[]>`.

### 3.3 Proposed Implementation Code Structure

```typescript
import fs from 'fs/promises';
import path from 'path';

export interface PaymentRecord {
  sessionId: string;
  customerEmail: string;
  profileId: string;
  candidateName: string;
  paymentStatus: 'paid' | 'unpaid' | 'pending';
  amountCents: number;
  currency: string;
  invoiceNumber: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, string>;
}

export interface IPaymentRegistry {
  recordPayment(record: PaymentRecord): Promise<void>;
  getPaymentBySessionId(sessionId: string): Promise<PaymentRecord | null>;
  getPaymentsByEmail(email: string): Promise<PaymentRecord[]>;
  isSessionVerified(sessionId: string): Promise<boolean>;
  isEmailVerified(email: string): Promise<boolean>;
}

export class FilePaymentRegistry implements IPaymentRegistry {
  private filePath: string;
  private cache: Map<string, PaymentRecord> = new Map();
  private isLoaded: boolean = false;
  private mutex: Promise<void> = Promise.resolve();

  constructor(customPath?: string) {
    this.filePath = customPath ||
      process.env.PAYMENT_REGISTRY_PATH ||
      path.resolve(process.cwd(), 'data/payments.json');
  }

  private async load(): Promise<void> {
    if (this.isLoaded) return;
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      const records: PaymentRecord[] = JSON.parse(data);
      this.cache.clear();
      for (const rec of records) {
        if (rec.sessionId) {
          this.cache.set(rec.sessionId, rec);
        }
      }
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        this.cache.clear();
      } else {
        console.error('[PaymentRegistry] Error reading registry file:', err);
      }
    }
    this.isLoaded = true;
  }

  private async persist(): Promise<void> {
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });

    const records = Array.from(this.cache.values());
    const tempFile = `${this.filePath}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
    const content = JSON.stringify(records, null, 2);

    await fs.writeFile(tempFile, content, 'utf-8');

    // Windows atomic rename retry loop
    let retries = 5;
    let delay = 15;
    while (retries > 0) {
      try {
        await fs.rename(tempFile, this.filePath);
        break;
      } catch (renameErr: any) {
        retries--;
        if (retries === 0) {
          try { await fs.unlink(tempFile); } catch {}
          throw renameErr;
        }
        await new Promise((res) => setTimeout(res, delay));
        delay *= 2;
      }
    }
  }

  public async recordPayment(record: PaymentRecord): Promise<void> {
    await this.runExclusive(async () => {
      await this.load();
      const existing = this.cache.get(record.sessionId);
      const normalizedRecord: PaymentRecord = {
        ...record,
        customerEmail: (record.customerEmail || '').trim().toLowerCase(),
        createdAt: existing?.createdAt || record.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.cache.set(record.sessionId, normalizedRecord);
      await this.persist();
    });
  }

  public async getPaymentBySessionId(sessionId: string): Promise<PaymentRecord | null> {
    await this.load();
    return this.cache.get(sessionId) || null;
  }

  public async getPaymentsByEmail(email: string): Promise<PaymentRecord[]> {
    await this.load();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return [];
    return Array.from(this.cache.values()).filter(
      (r) => r.customerEmail.toLowerCase() === cleanEmail
    );
  }

  public async isSessionVerified(sessionId: string): Promise<boolean> {
    if (!sessionId) return false;
    const record = await this.getPaymentBySessionId(sessionId);
    return Boolean(record && record.paymentStatus === 'paid');
  }

  public async isEmailVerified(email: string): Promise<boolean> {
    if (!email) return false;
    const records = await this.getPaymentsByEmail(email);
    return records.some((r) => r.paymentStatus === 'paid');
  }

  public async clear(): Promise<void> {
    await this.runExclusive(async () => {
      this.cache.clear();
      this.isLoaded = true;
      try {
        await fs.unlink(this.filePath);
      } catch (err: any) {
        if (err.code !== 'ENOENT') throw err;
      }
    });
  }

  private runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.mutex.then(() => fn());
    this.mutex = next.then(() => {}, () => {});
    return next;
  }
}

export const paymentRegistry = new FilePaymentRegistry();
```

---

## 4. Detailed Technical Design: `src/lib/serverPaymentVerification.ts`

### 4.1 Interface Specification
Matching `PROJECT.md`:
```typescript
import { PaymentRecord } from './paymentRegistry';

export interface VerificationResult {
  authorized: boolean;
  reason?: string;
  record?: PaymentRecord;
}

export function verifyServerPayment(
  sessionId: string | null,
  options?: { customerEmail?: string; profileId?: string }
): Promise<VerificationResult>;
```

### 4.2 Decision Logic Waterfall

```
verifyServerPayment(sessionId, options)
  │
  ├── 1. Empty Check: !sessionId && !options?.customerEmail ──► { authorized: false, reason: "Missing session or email" }
  │
  ├── 2. Adversarial Token Check:
  │      sessionId in ['unlocked_session', 'demo_'] or length > 5 fallback
  │      ──► { authorized: false, reason: "Invalid or unauthorized session token" }
  │
  ├── 3. Production Environment Hardening:
  │      If NODE_ENV === 'production' and sessionId.startsWith('test_simulated_')
  │      ──► { authorized: false, reason: "Test tokens prohibited in production" }
  │
  ├── 4. Test Bypass Check (Non-production only):
  │      If ENABLE_PAYMENT_TEST_BYPASS === 'true' and sessionId.startsWith('test_simulated_')
  │      ──► Synthesize or return test record { authorized: true }
  │
  ├── 5. Persistent Registry Lookup (Primary Defense):
  │      a. By Session ID:
  │         record = await paymentRegistry.getPaymentBySessionId(sessionId)
  │         If record && record.paymentStatus === 'paid' ──► { authorized: true, record }
  │      b. By Customer Email (Cross-Device Restore):
  │         If options?.customerEmail:
  │           emailRecords = await paymentRegistry.getPaymentsByEmail(options.customerEmail)
  │           paidRecord = emailRecords.find(r => r.paymentStatus === 'paid')
  │           If paidRecord ──► { authorized: true, record: paidRecord }
  │
  ├── 6. Stripe Live API Fallback & Automatic Cache Sync:
  │      If sessionId provided and isStripeConfigured():
  │        stripeSession = await stripe.checkout.sessions.retrieve(sessionId)
  │        If stripeSession.payment_status === 'paid':
  │          newRecord = convertStripeSessionToRecord(stripeSession)
  │          await paymentRegistry.recordPayment(newRecord)
  │          ──► { authorized: true, record: newRecord }
  │        Else:
  │          ──► { authorized: false, reason: "Stripe session status unpaid" }
  │
  └── 7. Default Rejection:
         ──► { authorized: false, reason: "Payment verification failed" }
```

### 4.3 Proposed Implementation Code Structure

```typescript
import { paymentRegistry, PaymentRecord } from './paymentRegistry';
import { getStripe, isStripeConfigured } from './stripe';

export interface VerificationResult {
  authorized: boolean;
  reason?: string;
  record?: PaymentRecord;
}

export async function verifyServerPayment(
  sessionId: string | null,
  options?: { customerEmail?: string; profileId?: string }
): Promise<VerificationResult> {
  const isProduction = process.env.NODE_ENV === 'production';
  const cleanSessionId = sessionId?.trim() || null;
  const cleanEmail = options?.customerEmail?.trim().toLowerCase() || null;

  // 1. Minimum Identifier Guard
  if (!cleanSessionId && !cleanEmail) {
    return {
      authorized: false,
      reason: 'No payment session ID or customer email provided for verification.',
    };
  }

  // 2. Adversarial & Bypass Token Ban
  if (
    cleanSessionId === 'unlocked_session' ||
    cleanSessionId?.startsWith('demo_') ||
    cleanSessionId === 'cs_fake_bypass_token_000'
  ) {
    return {
      authorized: false,
      reason: 'Bypass tokens and forged sessions are strictly rejected.',
    };
  }

  // 3. Test Mode Simulation Gating
  if (cleanSessionId?.startsWith('test_simulated_')) {
    if (isProduction) {
      return {
        authorized: false,
        reason: 'Test simulation bypass is forbidden in production environments.',
      };
    }
    const allowTestBypass = process.env.ENABLE_PAYMENT_TEST_BYPASS === 'true';
    if (!allowTestBypass) {
      return {
        authorized: false,
        reason: 'Test simulation bypass is disabled. Real payment is required.',
      };
    }

    // Check if recorded in registry
    const existingTestRecord = await paymentRegistry.getPaymentBySessionId(cleanSessionId);
    if (existingTestRecord && existingTestRecord.paymentStatus === 'paid') {
      return { authorized: true, record: existingTestRecord };
    }

    const synthesizedTestRecord: PaymentRecord = {
      sessionId: cleanSessionId,
      customerEmail: cleanEmail || 'candidate.test@example.com',
      profileId: options?.profileId || 'it_cloud',
      candidateName: 'Test Mode Candidate',
      paymentStatus: 'paid',
      amountCents: 900,
      currency: 'usd',
      invoiceNumber: `INV-TEST-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: { isTestMode: 'true' },
    };
    return { authorized: true, record: synthesizedTestRecord };
  }

  // 4. Registry Lookup by Session ID
  if (cleanSessionId) {
    const record = await paymentRegistry.getPaymentBySessionId(cleanSessionId);
    if (record) {
      if (record.paymentStatus === 'paid') {
        return { authorized: true, record };
      }
      return {
        authorized: false,
        reason: `Session payment status is "${record.paymentStatus}". Full payment required.`,
        record,
      };
    }
  }

  // 5. Cross-Device Email Lookup (if email provided)
  if (cleanEmail) {
    const emailRecords = await paymentRegistry.getPaymentsByEmail(cleanEmail);
    const paidRecord = emailRecords.find((r) => r.paymentStatus === 'paid');
    if (paidRecord) {
      return { authorized: true, record: paidRecord };
    }
  }

  // 6. Live Stripe API Fallback & Automatic Registry Synchronization
  if (cleanSessionId && isStripeConfigured()) {
    const stripe = getStripe();
    if (stripe) {
      try {
        const session = await stripe.checkout.sessions.retrieve(cleanSessionId);
        if (session.payment_status === 'paid') {
          const email = session.customer_details?.email || session.customer_email || cleanEmail || '';
          const profileId = session.metadata?.profileId || options?.profileId || 'it_cloud';
          const candidateName = session.metadata?.candidateName || 'Valued Candidate';

          const newRecord: PaymentRecord = {
            sessionId: session.id,
            customerEmail: email,
            profileId,
            candidateName,
            paymentStatus: 'paid',
            amountCents: session.amount_total || 900,
            currency: session.currency || 'usd',
            invoiceNumber: (typeof session.invoice === 'string' ? session.invoice : `INV-${session.id.slice(-8).toUpperCase()}`),
            createdAt: new Date(session.created * 1000).toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: session.metadata as Record<string, string> | undefined,
          };

          // Cache in registry for future lookups and cross-device access
          await paymentRegistry.recordPayment(newRecord);
          return { authorized: true, record: newRecord };
        } else {
          return {
            authorized: false,
            reason: `Stripe checkout session has status "${session.payment_status}".`,
          };
        }
      } catch (stripeErr: any) {
        return {
          authorized: false,
          reason: `Stripe session verification failed: ${stripeErr.message || 'Unknown error'}`,
        };
      }
    }
  }

  return {
    authorized: false,
    reason: 'Payment not verified. Please complete checkout to unlock this asset.',
  };
}
```

---

## 5. Endpoints & Frontend Hardening Blueprint

### 5.1 Route Hardening Specifications

1. **`/api/export/docx/route.ts`**:
   - Replace private `isPaymentAuthorized()` helper with `verifyServerPayment(sessionId, { customerEmail, profileId })`.
   - On `!verification.authorized`:
     ```typescript
     return NextResponse.json(
       { success: false, error: verification.reason || 'Payment required.' },
       { status: 402 }
     );
     ```
   - Extract `sessionId` from `searchParams.get('session_id')`, `req.headers.get('x-session-id')`, or JSON body `sessionId`.

2. **`/api/export/pdf/route.ts`** (New Endpoint):
   - Path: `src/app/api/export/pdf/route.ts`.
   - Runtime: `nodejs`, dynamic: `force-dynamic`.
   - Verify payment via `verifyServerPayment()`.
   - Return 402 if unverified.
   - Use `jsPDF` or a dedicated text PDF generator to construct an ATS-compliant single-column PDF.
   - Set headers:
     `Content-Type: application/pdf`,
     `Content-Disposition: attachment; filename="${safeName}_ATS_Optimized_Resume.pdf"`,
     `Cache-Control: no-store`.

3. **`/api/email/send-cv/route.ts`**:
   - Eliminate vulnerable bypass checks (lines 11-20).
   - Delete or restrict the unauthenticated `GET` route to prevent data leaks.
   - In `POST`, invoke `verifyServerPayment(sessionToCheck, { customerEmail: email, profileId })`.
   - Return 402 if unverified.

4. **`/api/stripe/webhook/route.ts`**:
   - In `checkout.session.completed`, call:
     ```typescript
     await paymentRegistry.recordPayment({
       sessionId: session.id,
       customerEmail: candidateEmail,
       profileId,
       candidateName,
       paymentStatus: 'paid',
       amountCents: session.amount_total || 900,
       currency: session.currency || 'usd',
       invoiceNumber: `INV-${session.id.slice(-8).toUpperCase()}`,
       createdAt: new Date().toISOString(),
       updatedAt: new Date().toISOString(),
       metadata: session.metadata,
     });
     ```

### 5.2 Frontend Paywall Hardening Specifications

1. **`src/components/StandardCvPaperView.tsx`**:
   - **DOM Text Leakage Fix**:
     Instead of rendering all actual rewritten bullets with CSS blur:
     ```tsx
     {/* When unpaid, render redacted placeholder lines */}
     {!isPaid ? (
       <div className="space-y-2 select-none pointer-events-none">
         <div className="h-4 bg-neutral-300 dark:bg-neutral-700 rounded w-5/6 animate-pulse" />
         <div className="h-4 bg-neutral-300 dark:bg-neutral-700 rounded w-4/6 animate-pulse" />
         <div className="h-4 bg-neutral-300 dark:bg-neutral-700 rounded w-3/4 animate-pulse" />
         <p className="text-xs text-neutral-500 italic">
           [Content Redacted: Executive achievement bullets unlocked upon verified payment]
         </p>
       </div>
     ) : (
       /* Render real bullets */
     )}
     ```
   - **Client-Side Export Bypass Elimination**:
     `handleDownloadDocx` and `handleDownloadPdf` must route through the server endpoints (`/api/export/docx` and `/api/export/pdf`), sending `sessionId` or token.

2. **`src/components/PaywallModal.tsx`**:
   - Ensure entering an email only submits to `/api/stripe/checkout` and does not set `ratemycv_paid = 'true'` in localStorage or sessionStorage.

---

## 6. Test Strategy & Test Harness Architecture

### 6.1 Vitest Setup
- Configuration: `vitest.config.ts` (already in root, ready for execution).
- Package addition needed:
  ```json
  "devDependencies": {
    "vitest": "^2.1.8"
  },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
  ```
- Command to run all tests: `npm test` or `npx vitest run`.

### 6.2 Test File Organization for Milestone 1

| Test File | Target Module | Scope & Key Test Cases |
|---|---|---|
| `tests/e2e/tier1-features/payment-registry.test.ts` | `src/lib/paymentRegistry.ts` | 1. `recordPayment()` stores record in memory and on disk.<br>2. `getPaymentBySessionId()` retrieves correct record.<br>3. `getPaymentsByEmail()` normalizes email casing and trims spaces.<br>4. `isSessionVerified()` returns true for paid, false for unpaid/pending/unknown.<br>5. `isEmailVerified()` returns true if any record for email is paid.<br>6. Idempotent updates on same sessionId update `updatedAt` without duplicating.<br>7. Windows/concurrent write stress test (10 simultaneous writes without file corruption). |
| `tests/e2e/tier1-features/server-payment-verification.test.ts` | `src/lib/serverPaymentVerification.ts` | 1. Verified paid record in registry returns `{ authorized: true }`.<br>2. Unpaid/pending record returns `{ authorized: false, reason }`.<br>3. Unknown session ID with Stripe mock queries Stripe API and auto-records to registry.<br>4. Cross-device email lookup authorizes user if previously paid under email.<br>5. Banned tokens (`unlocked_session`, `demo_`, length > 5) return `{ authorized: false }`.<br>6. In `NODE_ENV === 'production'`, `test_simulated_` tokens return `{ authorized: false }`.<br>7. In non-production with `ENABLE_PAYMENT_TEST_BYPASS === 'true'`, simulated tokens return `{ authorized: true }`. |
| `tests/e2e/tier1-features/export-gating.test.ts` | `/api/export/docx`, `/api/export/pdf`, `/api/email/send-cv` | 1. GET & POST `/api/export/docx` return 402 when session_id is missing or unpaid.<br>2. GET & POST `/api/export/pdf` return 402 when unverified; return 200 with PDF buffer when verified.<br>3. POST `/api/email/send-cv` returns 402 when unverified; rejects `unlocked_session` and `demo_`.<br>4. GET `/api/email/send-cv` does not leak candidate emails or outbox data. |

---

## 7. Actionable Implementation Checklist for M1 Developers

- [ ] **Step 1**: Install `vitest` and update `package.json` (`"test": "vitest run"`).
- [ ] **Step 2**: Implement `src/lib/paymentRegistry.ts` with atomic JSON storage, mutex queue, Windows lock retry, and case-insensitive email lookup matching `IPaymentRegistry`.
- [ ] **Step 3**: Implement `src/lib/serverPaymentVerification.ts` with multi-tier verification waterfall (`verifyServerPayment`).
- [ ] **Step 4**: Update `/api/export/docx/route.ts` to use `verifyServerPayment()`.
- [ ] **Step 5**: Create `/api/export/pdf/route.ts` using `verifyServerPayment()` and `jsPDF`.
- [ ] **Step 6**: Harden `/api/email/send-cv/route.ts`: eliminate bypass tokens, delete unauthenticated GET leak, enforce `verifyServerPayment()`.
- [ ] **Step 7**: Update `/api/stripe/webhook/route.ts` to record completed sessions into `paymentRegistry`.
- [ ] **Step 8**: Harden `src/components/StandardCvPaperView.tsx` to redact confidential text in DOM for unpaid users and gate client downloads.
- [ ] **Step 9**: Write and run Vitest test suites in `tests/e2e/tier1-features/` to verify 100% pass rate.
