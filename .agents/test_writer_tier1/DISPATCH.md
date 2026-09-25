# Test Writer Assignment: Tier 1 Feature Coverage Test Suite

Task:
Write comprehensive opaque-box unit/integration test suites for Tier 1 Feature Coverage (>=5 tests per feature, minimum 50 tests total).

Location: `tests/e2e/tier1-features/`
- `tests/e2e/tier1-features/paywall-enforcement.test.ts`:
  Features 1, 2, 3:
  1. GET /api/export/docx without payment -> 402
  2. POST /api/export/docx with forged session -> 402
  3. GET /api/export/pdf without payment -> 402
  4. POST /api/export/pdf with unpaid session -> 402
  5. POST /api/email/send-cv without payment -> 402
  6. POST /api/email/send-cv with demo token -> 402
  7. GET /api/email/send-cv -> 405 Method Not Allowed
  8. Verified payment session allows DOCX export -> 200
  9. Verified payment session allows PDF export -> 200
  10. Verified payment session allows email send -> 200

- `tests/e2e/tier1-features/checkout-webhook.test.ts`:
  Features 5, 6, 7:
  1. POST /api/stripe/checkout missing email -> 400
  2. POST /api/stripe/checkout valid payload -> 200 with checkout URL & session
  3. POST /api/stripe/checkout metadata contains candidate and profile details
  4. POST /api/stripe/webhook missing Stripe-Signature -> 400
  5. POST /api/stripe/webhook invalid signature -> 400
  6. POST /api/stripe/webhook valid checkout.session.completed records paid status in registry
  7. POST /api/stripe/webhook handles duplicate event idempotently
  8. GET /api/stripe/verify with verified session returns paid: true
  9. GET /api/stripe/verify with unknown session returns paid: false
  10. Registry query by email returns all verified sessions for cross-device access

- `tests/e2e/tier1-features/cv-quality-engine.test.ts`:
  Features 8, 9, 10:
  1. XYZ metric saturation: 100% XYZ bullets -> high score, passes >=40% requirement
  2. XYZ metric saturation: bullets lacking metrics are identified and flagged
  3. XYZ metric saturation: 30% saturation fails >=40% threshold
  4. XYZ metric saturation: 50% saturation passes >=40% threshold
  5. Contact integrity: full name present and valid
  6. Contact integrity: placeholder/missing name flagged
  7. Contact integrity: valid phone number (7-15 digits) passes
  8. Contact integrity: invalid phone number flagged
  9. Contact integrity: professional email syntax verified
  10. Section hierarchy: Summary -> Skills -> Experience -> Education -> References passes
  11. Section hierarchy: out-of-order sections flagged
  12. References preservation: candidate references retained without hallucination
  13. Diagnostic scoring: returns structured overallScore (0-100) and line-by-line feedback array
  14. Actionable fixes: provides suggested revisions for non-compliant bullets
  15. Submission readiness: isSubmissionReady is true only when all benchmarks pass

- `tests/e2e/tier1-features/export-formatting.test.ts`:
  Features 1, 2, 10:
  1. Generated DOCX uses linear single-column layout
  2. Generated DOCX has no multi-cell layout tables
  3. Generated DOCX has no text boxes or floating graphics
  4. Generated PDF is text-based and parseable
  5. Generated PDF enforces single-column ATS flow
  6. Output document preserves full section content without truncation

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-09-17T12:09:36Z
You are test_writer_tier1.
Your working directory is: c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV/.agents/test_writer_tier1
Project root is: c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV

Read these documents first:
1. c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV/.agents/ORIGINAL_REQUEST.md
2. c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV/PROJECT.md
3. c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV/TEST_INFRA.md
4. c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV/.agents/test_writer_tier1/DISPATCH.md

Your exclusive write ownership:
- tests/e2e/tier1-features/
- .agents/test_writer_tier1/ (progress.md, handoff.md)

Task:
Write comprehensive opaque-box unit/integration tests for Tier 1: Feature Coverage (>=5 tests per feature across all 10 features, minimum 50 tests total).
Use the fixtures and helpers in `tests/e2e/helpers/fixtures.ts`, `tests/e2e/helpers/stripeMocks.ts`, and `tests/e2e/helpers/routeHarness.ts`.

Files to create:
1. `tests/e2e/tier1-features/paywall-enforcement.test.ts`:
   - Feature 1: DOCX export requires server-verified payment (402 on unpaid/forged, 200 on paid)
   - Feature 2: PDF export requires server-verified payment (402 on unpaid/forged, 200 on paid)
   - Feature 3: Email dispatch requires payment & valid email (402 on unpaid, 405 on GET, 200 on paid)
   - Feature 4: Client token forgery & email input bypass prevention
2. `tests/e2e/tier1-features/checkout-webhook.test.ts`:
   - Feature 5: Persistent payment registry verification and lookup
   - Feature 6: Stripe checkout session creation
   - Feature 7: Stripe webhook cryptographic verification & idempotency
3. `tests/e2e/tier1-features/cv-quality-engine.test.ts`:
   - Feature 8: XYZ metric saturation (>=40%, line-by-line feedback, suggestions)
   - Feature 9: Contact integrity (full name, 7-15 digit phone, valid email, location)
   - Feature 10: ATS section hierarchy (Summary -> Skills -> Experience -> Education -> References) & references preservation
4. `tests/e2e/tier1-features/export-formatting.test.ts`:
   - ATS formatting guardrails: single-column layout, no multi-cell tables, no text boxes/floating graphics in DOCX and PDF.

Ensure all tests import types, helpers, and modules cleanly with proper assertions.
Write `handoff.md` in your working directory with a complete inventory of tests written and verification steps.
Send a message back to parent when complete.
