# Test Writer Assignment: Tier 2 Boundary & Corner Cases Test Suite

Task:
Write comprehensive boundary, corner case, and security bypass test suites for Tier 2 (>=5 tests per feature, minimum 50 tests total).

Location: `tests/e2e/tier2-boundaries/`
- `tests/e2e/tier2-boundaries/paywall-bypass-attacks.test.ts`:
  1. Header spoofing: X-Payment-Bypass, X-Admin-Override rejected
  2. SQL injection strings in sessionId (' OR '1'='1) rejected
  3. Path traversal patterns in sessionId (../../etc/passwd) rejected
  4. Null bytes and non-printable characters in sessionId rejected
  5. Session ID with invalid prefix (non-cs_ or malformed UUID) rejected
  6. Tampered query parameters (?bypass=1&free=true) rejected
  7. Client storage spoofing: ratemycv_paid=true in cookie/header does not grant access
  8. Empty/whitespace-only sessionId rejected with 402/400
  9. Session ID belonging to another user's email cannot be claimed
  10. Session ID marked as 'unpaid' or 'refunded' in registry returns 402
  11. Rapid duplicate export calls handle gracefully without race condition leaks
  12. Large payload attack on export endpoints handled gracefully
  13. Content-Type mismatch attacks on POST export routes rejected

- `tests/e2e/tier2-boundaries/cv-boundary-edge-cases.test.ts`:
  1. Exact boundary saturation at 39% (fails requirement)
  2. Exact boundary saturation at 40% (passes requirement)
  3. Exact boundary saturation at 41% (passes requirement)
  4. Extreme 0% metric saturation (all generic text) produces accurate 0% metric score
  5. Extreme 100% metric saturation on all bullets
  6. Empty CV input (empty text or empty JSON) handled gracefully with error report
  7. Single-word bullet points ("Managed.", "Helped.") flagged appropriately
  8. Extremely long bullet points (>200 words) processed without stack overflow or crash
  9. Unicode / emojis in bullet points handled without corrupting XYZ parser
  10. Boundary phone number length: 6 digits (too short, fails)
  11. Boundary phone number length: 7 digits (passes)
  12. Boundary phone number length: 15 digits (passes)
  13. Boundary phone number length: 16 digits (too long, fails)
  14. International phone numbers (+44 20 7946 0958, +1-555-0199) correctly parsed
  15. Truncated / malformed email addresses (test@, @domain.com, user@.com) rejected
  16. Missing candidate name (null, empty, whitespace) rejected
  17. Placeholder candidate names ("Candidate Name", "Your Name Here", "John Doe") flagged
  18. Section order: completely reversed sections (References first, Summary last) detected
  19. Duplicate section headers handled gracefully
  20. References section with missing contacts or placeholder "Available upon request" handled

- `tests/e2e/tier2-boundaries/webhook-tampering.test.ts`:
  1. Webhook payload with altered amount/currency detected via signature mismatch
  2. Webhook payload with timestamp older than 300 seconds rejected as expired replay
  3. Webhook with future timestamp (>300 seconds) rejected
  4. Webhook with malformed Stripe signature format (missing t= or v1=) rejected
  5. Webhook with valid signature but unrecognized event type (e.g. customer.discount.created) ignored with 200/ok
  6. Webhook with missing data.object in payload handled gracefully without 500 crash
  7. Webhook with empty body returns 400
  8. Webhook with wrong signing secret fails verification

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-09-17T12:09:36Z
You are test_writer_tier2.
Your working directory is: c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV/.agents/test_writer_tier2
Project root is: c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV

Read these documents first:
1. c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV/.agents/ORIGINAL_REQUEST.md
2. c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV/PROJECT.md
3. c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV/TEST_INFRA.md
4. c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV/.agents/test_writer_tier2/DISPATCH.md

Your exclusive write ownership:
- tests/e2e/tier2-boundaries/
- .agents/test_writer_tier2/ (progress.md, handoff.md)

Task:
Write comprehensive boundary value analysis, corner case, and bypass attack tests for Tier 2 (>=5 tests per feature, minimum 50 tests total).
Use the fixtures and helpers in `tests/e2e/helpers/`.

Files to create:
1. `tests/e2e/tier2-boundaries/paywall-bypass-attacks.test.ts`:
   - Header spoofing attacks (X-Payment-Bypass, X-Forwarded-User)
   - SQL injection & path traversal in session ID
   - Null bytes and non-printable characters
   - Malformed session ID prefixes
   - Client storage tampering (ratemycv_paid=true cookie/storage)
   - Empty/whitespace session IDs
   - Mismatched email/profile authorization
   - Unpaid/refunded registry states
   - Rapid concurrent duplicate export attempts
2. `tests/e2e/tier2-boundaries/cv-boundary-edge-cases.test.ts`:
   - Exact boundary metric saturation: 39% (fail) vs 40% (pass) vs 41% (pass)
   - Extreme 0% metric saturation vs 100% metric saturation
   - Empty CV input / empty string handling
   - Single-word bullets vs extremely long (>200 words) bullets
   - Unicode, emojis, special characters in CV
   - Boundary phone numbers: 6 digits (fail), 7 digits (pass), 15 digits (pass), 16 digits (fail)
   - International phone numbers (+44, +1, +49)
   - Malformed emails (@domain, user@, missing TLD)
   - Placeholder candidate names ("Candidate Name", "John Doe")
   - Reversed section order (References first, Summary last)
   - Duplicate section headers
   - Anonymous references ("Available upon request")
3. `tests/e2e/tier2-boundaries/webhook-tampering.test.ts`:
   - Altered payload with forged HMAC signature
   - Replay attacks: timestamp older than 300 seconds
   - Future timestamp >300 seconds
   - Malformed signature format (missing t= or v1=)
   - Unrecognized event types
   - Missing data.object payload
   - Empty body
   - Wrong secret

Write `handoff.md` in your working directory with a complete inventory of tests written and verification steps.
Send a message back to parent when complete.
