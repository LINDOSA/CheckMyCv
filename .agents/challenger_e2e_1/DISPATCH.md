# Challenger Assignment: Empirical Verification & Flakiness Check

Assignment:
Evaluate all tests in `tests/e2e/` (Tiers 1, 2, 3, 4).
1. Analyze test design for potential flakiness, hardcoded timeouts, or unhandled asynchronous race conditions.
2. Verify that test assertions are strong enough to fail when implementation bugs exist. Note the bugs identified by test_writer_tier3_4 (in `serverPaymentVerification.ts` and `webhook/route.ts`).
3. Check whether mock implementations properly simulate edge conditions rather than bypassing checks.
4. Report your empirical verdict (APPROVE or REQUEST_CHANGES) in `handoff.md`.
