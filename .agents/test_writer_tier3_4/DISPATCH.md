# Test Writer Assignment: Tier 3 & Tier 4 Test Suites

Task:
Write comprehensive cross-feature combination (Tier 3) and real-world application scenario (Tier 4) test suites (minimum 25 tests total).

Location:
`tests/e2e/tier3-combinations/cross-feature-flows.test.ts` (Tier 3)
`tests/e2e/tier4-scenarios/real-world-cv-workloads.test.ts` (Tier 4)

Tier 3 Requirements:
1. End-to-end payment lifecycle: Checkout Session -> Webhook Event -> Persistent Registry -> Verify Endpoint
2. Payment gating matrix: Verified session unlocks DOCX, PDF, and Email; unverified locks all three with 402
3. Cross-device lookup: Querying payment registry by candidate email restores paid status across devices
4. Audit-to-Export workflow: Auditing CV quality produces diagnostics; document generation consumes audited CV and applies single-column ATS guardrails
5. Failed checkout flow: Created session that is never paid remains unverified; export attempts return 402
6. Webhook idempotency flow: Repeated webhook deliveries maintain single consistent paid record in registry
7. Multi-document export consistency: Single verified payment allows downloading both DOCX and PDF formats
8. Profile ID to Session mapping: Payment associated with specific profile ID cannot unlock a different profile ID if mismatched
9. Email dispatch with attachment flow: Paid session generates single-column document buffer and forwards to nodemailer transport
10. Quality Audit remediation loop: Audited low-quality CV with fixes -> revisions applied -> re-audited CV score improves

Tier 4 Requirements (Real-World Workloads):
1. Realistic Senior Tech Lead CV: 6 roles, 18 bullet points with metrics (XYZ saturation >70%), complete contact details, ATS section hierarchy -> Evaluated with score >=85 and isSubmissionReady: true
2. Realistic Junior Career Switcher CV: Weak bullets lacking metrics (e.g. "Responsible for bug fixes"), missing phone number -> Audit identifies exact failing lines, metric saturation <30%, score <55, isSubmissionReady: false, actionable fixes provided
3. Adversarial Paywall Bypass Simulation: Multi-vector attack script attempting 10 distinct bypass patterns (forged localStorage keys, fake test tokens, modified URL params, spoofed admin headers) -> 100% blocked with HTTP 402
4. Candidate Cross-Device Journey: Candidate initiates checkout on phone, completes purchase, switches to desktop browser, verifies via email lookup, and successfully downloads single-column PDF
5. Privacy & References Preservation: Candidate with sensitive references marked "Available upon request" is audited without false hallucination of placeholder names; candidate with 3 explicit referees has all 3 preserved accurately
6. Malformed / Hostile Input Hardening: Injected XSS tags in summary, 50,000-character experience text, non-UTF8 binary strings -> Graceful handling with structured error reporting, zero unhandled 500 exceptions

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-09-17T12:09:36Z
You are test_writer_tier3_4.
Your working directory is: c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV/.agents/test_writer_tier3_4
Project root is: c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV

Read these documents first:
1. c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV/.agents/ORIGINAL_REQUEST.md
2. c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV/PROJECT.md
3. c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV/TEST_INFRA.md
4. c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV/.agents/test_writer_tier3_4/DISPATCH.md

Your exclusive write ownership:
- tests/e2e/tier3-combinations/
- tests/e2e/tier4-scenarios/
- .agents/test_writer_tier3_4/ (progress.md, handoff.md)

Task:
Write comprehensive cross-feature combinatorial (Tier 3) and real-world application scenario (Tier 4) tests (minimum 25 tests total: >=15 in Tier 3, >=10 in Tier 4).
Use the fixtures and helpers in tests/e2e/helpers/.

