# Forensic Auditor Assignment: Integrity Forensics on E2E Test Suites

Assignment:
Perform a forensic integrity audit on all files under `tests/e2e/` and `tests/e2e/helpers/`:
1. Static Analysis: Scan for hardcoded test results, cheat flags, trivial assertions (`expect(true).toBe(true)`), mock facades that bypass real checks.
2. Code authenticity: Verify that tests genuinely exercise route handlers, cryptographic HMAC functions, and CV Quality Engine evaluations.
3. No shortcuts: Ensure test fixtures represent real structures and that assertions verify concrete fields, HTTP status codes, and error bodies.
4. Report your forensic verdict (CLEAN or INTEGRITY VIOLATION) in `handoff.md` with full evidence.
