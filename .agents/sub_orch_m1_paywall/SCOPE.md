# Scope: Milestone 1 - Secure Backend Paywall Enforcement & Registry

## Architecture
Milestone 1 establishes the security foundation of ScoreMyCV:
1. Persistent Payment Registry (`src/lib/paymentRegistry.ts`): Atomic file-backed storage (or SQLite) for payment records.
2. Server Payment Verification Helper (`src/lib/serverPaymentVerification.ts`): Reusable verifier checking registry and Stripe directly.
3. Export Endpoints:
   - `/api/export/docx`: Server-verified paid check, returning 402 Payment Required for unverified requests.
   - `/api/export/pdf`: Native text ATS PDF export endpoint with identical strict 402 payment enforcement.
4. Email Endpoint (`src/app/api/email/send-cv/route.ts`):
   - Remove bypass tokens (`unlocked_session`, `demo_`, length > 5 fallback).
   - Eliminate unauthenticated GET data leak.
   - Strictly require verified payment before sending CV documents.
5. Frontend Paywall Hardening:
   - `src/lib/paymentAccess.ts`: Sync client state securely, prevent `ratemycv_paid` local storage bypass without verified server confirmation.
   - `src/components/StandardCvPaperView.tsx`: Replace CSS blur text leakage in client DOM with actual server/client truncation or redacted placeholders so unpaid users cannot inspect DOM to extract the rewritten CV. Gated exports route to server endpoints.
   - `src/components/PaywallModal.tsx`: Entering an email address must not grant instant paid status or unlock CV downloads.

## Feature Inventory (M1 Scope)
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Test Infrastructure Setup | Setup Vitest configuration and test commands | M1 | PROJECT.md #1 |
| 2 | Persistent Payment Registry | File-backed atomic storage for payment records across devices | M1 | PROJECT.md #2 |
| 3 | Server-Verified DOCX Export | Strict 402 payment enforcement on `/api/export/docx` | M1 | PROJECT.md #3 |
| 4 | Server-Verified Native PDF Export | `/api/export/pdf` with strict 402 payment enforcement | M1 | PROJECT.md #4 |
| 5 | Email Dispatch Hardening | Eliminate bypasses and GET leak in `/api/email/send-cv` | M1 | PROJECT.md #5 |
| 6 | Paywall Client & DOM Hardening | Prevent DOM text leakage and client storage forgery | M1 | PROJECT.md #6 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1 Exploration | Map existing implementations, vulnerabilities, and interfaces | none | IN_PROGRESS |
| 2 | M1 Implementation | Implement registry, verification, endpoints, frontend hardening, and tests | M1 Exploration | PLANNED |
| 3 | M1 Verification & Gate | 2 Reviewers, 2 Challengers, 1 Forensic Auditor | M1 Implementation | PLANNED |

## Interface Contracts

### Payment Record & Registry Interface
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

### Server Payment Verification
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
