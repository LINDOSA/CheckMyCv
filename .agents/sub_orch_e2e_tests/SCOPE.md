# Scope: E2E Testing Track

## Architecture
Opaque-box, requirement-driven E2E test suite for ScoreMyCV.
Tests validate backend paywall enforcement, Stripe checkout and webhook verification, document generation integrity (DOCX and PDF ATS formatting), and the CV Quality Standards Engine.

```
tests/e2e/
├── helpers/
│   ├── apiHarness.ts       # Next.js Route Handler invocation harness (mocks Request/Response if in Node)
│   ├── fixtures.ts         # High/low quality CV fixtures, valid/invalid Stripe sessions
│   └── testStripeMock.ts   # Cryptographic webhook signature generator & Stripe mock fixtures
├── tier1-features/
│   ├── paywall-enforcement.test.ts   (>=10 tests)
│   ├── checkout-webhook.test.ts      (>=10 tests)
│   ├── cv-quality-engine.test.ts     (>=15 tests)
│   └── export-generation.test.ts     (>=15 tests)
├── tier2-boundaries/
│   ├── paywall-bypass-attacks.test.ts (>=15 tests)
│   ├── cv-boundary-edge-cases.test.ts (>=20 tests)
│   └── webhook-tampering.test.ts      (>=15 tests)
├── tier3-combinations/
│   ├── cross-feature-flows.test.ts    (>=15 tests)
└── tier4-scenarios/
    ├── real-world-cv-workloads.test.ts (>=10 tests)
```

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Test Infra Setup | Install Vitest, configure npm test, create helpers | M-E2E-1 | Task Req 1 |
| 2 | Paywall Enforcement Tests (Tier 1) | Verify 402 on unpaid requests to /api/export/* and email | M-E2E-2 | R1, AC |
| 3 | Checkout & Webhook Tests (Tier 1) | Verify checkout creation and webhook signature handling | M-E2E-2 | R3, AC |
| 4 | CV Quality Engine Tests (Tier 1) | Verify XYZ saturation, contact integrity, section hierarchy | M-E2E-2 | R2, AC |
| 5 | Export Formatting Tests (Tier 1) | Verify DOCX & PDF ATS single-column compliance | M-E2E-2 | R2, AC |
| 6 | Boundary & Bypass Attacks (Tier 2) | Forged tokens, negative saturation, extreme lengths, empty inputs | M-E2E-3 | R1, R2, AC |
| 7 | Cross-Feature Interactions (Tier 3) | Checkout -> Webhook -> Registry -> Export -> Quality audit pipeline | M-E2E-4 | R1+R2+R3 |
| 8 | Real-World Workloads (Tier 4) | Full realistic candidate CVs, malformed PDFs, multi-device access | M-E2E-4 | AC |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M-E2E-1 | Test Infra Setup | Vitest installation, package.json scripts, test harnesses & fixtures | none | IN_PROGRESS |
| M-E2E-2 | Tier 1 Test Suite | Feature coverage (>=50 tests across 10 features) | M-E2E-1 | PLANNED |
| M-E2E-3 | Tier 2 Test Suite | Boundary, corner cases, and security bypass attacks (>=50 tests) | M-E2E-1 | PLANNED |
| M-E2E-4 | Tier 3 & Tier 4 Test Suites | Cross-feature combinations and real-world application scenarios (>=25 tests) | M-E2E-2, M-E2E-3 | PLANNED |
| M-E2E-5 | Verification & TEST_READY | Full test execution, reviewer + auditor verification, publish TEST_READY.md | M-E2E-4 | PLANNED |
