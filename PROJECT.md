# Project: ScoreMyCV Backend Hardening & Quality Standards Engine

## Architecture
ScoreMyCV is a Next.js 14 App Router application with React 18 and TypeScript.
This project hardens the backend architecture against paywall bypasses, adds a persistent payment registry, establishes safe checkout and webhook verification, implements a comprehensive automated CV Quality & ATS Standards Engine, and creates full automated test suites.

```
[ Client Browser ]
   │
   ├── (1) POST /api/stripe/checkout ──► Stripe Hosted Checkout
   ├── (2) Stripe Webhook (signed) ────► POST /api/stripe/webhook ──► Persistent Payment Registry
   ├── (3) Verify / Restore Access ────► GET /api/stripe/verify / check-access ──► Registry
   ├── (4) Document Exports ───────────► GET/POST /api/export/docx, /api/export/pdf
   │                                           │ (402 if unverified in Registry)
   │                                           ▼
   │                                     CV Quality Engine (Validation & Single-Column Layout)
   │                                           │
   │                                           ▼
   │                                     Binary DOCX / Text PDF Generation
   └── (5) Quality Diagnostics ────────► POST /api/score, /api/quality/audit
                                               │
                                               ▼
                                         Diagnostic Scoring (0-100) + Line-by-Line XYZ Feedback
```

## Payment Rail

Paystack is the live payment provider (South Africa, ZAR). Stripe does not issue
direct accounts to South African businesses — its own availability page routes
South Africa to Paystack, which Stripe owns. The `/api/stripe/*` routes are kept
intact but dormant for a future international rollout; with no `STRIPE_SECRET_KEY`
they return 503 and unlock nothing.

Paystack has no checkout "session" object. A transaction is initialized and
identified by a `reference`, which is stored in the payment registry as
`sessionId` — so export gating, invoices and cross-device restore are unchanged.
The account's secret key doubles as the webhook signing key (HMAC SHA512 over the
raw body, sent in `x-paystack-signature`).

## Code Layout
- `src/lib/paystack.ts`: Paystack client — transaction initialize/verify, HMAC SHA512 webhook signature verification, ZAR pricing (`PAYSTACK_AMOUNT_CENTS`).
- `src/app/api/paystack/checkout/route.ts`: Initializes a transaction; the amount is fixed server-side and cannot be influenced by the client.
- `src/app/api/paystack/verify/route.ts`: Confirms a reference against the registry, then Paystack itself; rejects underpayment.
- `src/app/api/paystack/webhook/route.ts`: Signature-verified `charge.success` handler; idempotent, emails the candidate once.
- `src/lib/paymentRegistry.ts`: Persistent payment registry. Postgres-backed when `DATABASE_URL` is set (required on serverless hosts such as Vercel); file-backed for local development.
- `src/lib/postgresPaymentRegistry.ts`: Postgres implementation of `IPaymentRegistry`; creates its table on first use, upserts so repeated webhook deliveries stay a single record.
- `src/lib/serverPaymentVerification.ts`: Server-side payment validation helper for export and dispatch routes.
- `src/app/api/stripe/checkout/route.ts`: Stripe checkout session creation with customer email and product metadata.
- `src/app/api/stripe/webhook/route.ts`: Stripe webhook event handler with mandatory cryptographic signature verification.
- `src/app/api/stripe/verify/route.ts`: Payment status verification endpoint backed by registry.
- `src/app/api/export/docx/route.ts`: Server-verified Word document export endpoint.
- `src/app/api/export/pdf/route.ts`: Server-verified native text ATS-compatible PDF export endpoint.
- `src/app/api/email/send-cv/route.ts`: Hardened email dispatch route with strict payment enforcement.
- `src/lib/cvQualityEngine.ts`: Automated CV Quality & Professional Standards Engine (XYZ metric saturation, contact integrity, section hierarchy, formatting guardrails, references preservation, 0-100 diagnostic scoring).
- `src/lib/docxGenerator.ts`: Single-column ATS-compliant DOCX generator (linear layouts, zero multi-cell tables).
- `src/lib/pdfGenerator.ts`: Native text-based single-column ATS-compliant PDF generator.
- `src/lib/receiptService.ts`: Server-side deterministic tax invoice and receipt generator.
- `src/components/StandardCvPaperView.tsx`: Hardened paper view without DOM text leakage for unpaid users.
- `src/components/PaywallModal.tsx`: Secure checkout modal without client-side bypass.
- `src/lib/paymentAccess.ts`: Client-side access sync bound to server-verified status.
- `tests/`: Automated unit, integration, and 4-tier E2E test suites (Vitest).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Test Infrastructure Setup | Install Vitest, configure npm test, setup test harnesses | E2E-Track & M1 | Survey |
| 2 | Persistent Payment Registry | Persistent file-backed database registry recording verified payments across devices | M1 | ORIGINAL_REQUEST R1 |
| 3 | Server-Verified DOCX Export | `/api/export/docx` requires server-verified payment; returns 402 if unverified | M1 | ORIGINAL_REQUEST R1, AC |
| 4 | Server-Verified Native PDF Export | `/api/export/pdf` requires server-verified payment; text-based ATS PDF | M1 | ORIGINAL_REQUEST R1, AC |
| 5 | Email Dispatch Hardening | `/api/email/send-cv` strictly enforces payment; eliminates fake/demo tokens; closes GET leak | M1 | ORIGINAL_REQUEST R1, AC |
| 6 | Paywall Client & DOM Hardening | Prevent `ratemycv_paid` forgery; prevent DOM text leakage via blur; enforce server-gated exports | M1 | ORIGINAL_REQUEST R1, AC |
| 7 | Stripe Checkout Creation | Safe checkout session creation with candidate email and metadata | M2 | ORIGINAL_REQUEST R3 |
| 8 | Webhook Cryptographic Verification | `/api/stripe/webhook` strictly verifies signature; updates persistent registry | M2 | ORIGINAL_REQUEST R3 |
| 9 | Cross-Device Payment Restore | Email-based payment lookup matching registry for cross-device access | M2 | ORIGINAL_REQUEST R1, R3 |
| 10 | Deterministic Receipt Generation | Server-side official invoice generation tied to Stripe transaction ID | M2 | ORIGINAL_REQUEST R3 |
| 11 | XYZ Metric Saturation Engine | Bullet point parsing for Action Verb + Quantifiable Metric + Business Outcome, >=40% saturation | M3 | ORIGINAL_REQUEST R2, AC |
| 12 | Contact Integrity Validation | Validates full name (non-placeholder), phone (7-15 digits), professional email, location | M3 | ORIGINAL_REQUEST R2, AC |
| 13 | Section Architecture ATS Hierarchy | Enforces Summary -> Skills Grid -> Experience -> Education -> References | M3 | ORIGINAL_REQUEST R2, AC |
| 14 | Formatting Guardrails (Single-Column) | Linear ATS layout in DOCX and PDF; removes multi-cell tables, text boxes, graphics | M3 | ORIGINAL_REQUEST R2, AC |
| 15 | References Preservation & Privacy | Preserves candidate references without hallucinated data or privacy violations | M3 | ORIGINAL_REQUEST R2, AC |
| 16 | Structured Diagnostic Scoring (0-100) | 0-100 scoring with line-by-line feedback array and actionable rewrite fixes | M3 | ORIGINAL_REQUEST R2, AC |
| 17 | E2E Test Suite (Tiers 1-4) | Comprehensive opaque-box test suite for all features and edge cases | E2E-Track & M4 | Project Architecture |
| 18 | Adversarial Hardening (Tier 5) | White-box stress-testing and boundary verification | M4 | Project Architecture |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Secure Backend Paywall Enforcement & Registry | Persistent payment registry, `/api/export/docx`, `/api/export/pdf`, `/api/email/send-cv` payment enforcement, client paywall hardening, test runner installation | none | PLANNED |
| M2 | Safe Checkout & Verification Infrastructure | Stripe checkout session creation, webhook signature verification, email matching & cross-device restore, deterministic receipts | M1 | PLANNED |
| M3 | Automated CV Quality & Professional Standards Engine | Standalone CV Quality Engine (XYZ formula >=40% saturation, contact integrity, section hierarchy, single-column DOCX/PDF formatting, references preservation, line-by-line diagnostic scoring 0-100) | none | PLANNED |
| M4 | Final Milestone (E2E Pass & Adversarial Hardening) | Pass 100% of E2E test suite (Tiers 1-4) and complete Tier 5 adversarial coverage hardening | M1, M2, M3, E2E-Track | PLANNED |

## Interface Contracts

### Payment Registry Contract (`src/lib/paymentRegistry.ts`)
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

### Server Payment Verification Contract (`src/lib/serverPaymentVerification.ts`)
```typescript
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

### CV Quality & Standards Engine Contract (`src/lib/cvQualityEngine.ts`)
```typescript
export interface BulletEvaluation {
  bulletIndex: number;
  rawText: string;
  hasActionVerb: boolean;
  hasQuantifiableMetric: boolean;
  hasBusinessOutcome: boolean;
  isXyzCompliant: boolean;
  feedback: string;
  suggestedRevision?: string;
}

export interface ContactIntegrityReport {
  hasFullName: boolean;
  candidateName: string;
  hasPhoneNumber: boolean;
  phoneNumber: string;
  hasProfessionalEmail: boolean;
  email: string;
  hasLocation: boolean;
  location: string;
  isValid: boolean;
  issues: string[];
}

export interface SectionArchitectureReport {
  detectedSections: string[];
  isHierarchyCompliant: boolean; // Summary -> Skills Grid -> Experience -> Education -> References
  hierarchyIssues: string[];
}

export interface FormattingGuardrailReport {
  isSingleColumn: boolean;
  hasMultiCellTables: boolean;
  hasTextBoxes: boolean;
  hasGraphics: boolean;
  isCompliant: boolean;
  violations: string[];
}

export interface ReferencesPreservationReport {
  hasReferences: boolean;
  referencesCount: number;
  isPreservedWithoutHallucination: boolean;
  issues: string[];
}

export interface QualityAuditResult {
  overallScore: number; // 0 - 100
  metricSaturation: number; // e.g. 0.45 (45%)
  isMetricSaturationCompliant: boolean; // >= 0.40
  contactIntegrity: ContactIntegrityReport;
  sectionArchitecture: SectionArchitectureReport;
  formattingGuardrails: FormattingGuardrailReport;
  referencesPreservation: ReferencesPreservationReport;
  lineByLineFeedback: BulletEvaluation[];
  isSubmissionReady: boolean;
  criticalIssues: string[];
  actionableFixes: string[];
}

export function auditCvQuality(cv: StandardCVDocument | string): QualityAuditResult;
```
