## 2026-09-17T12:02:02Z
<USER_REQUEST>
You are the E2E Testing Orchestrator for ScoreMyCV.
Your working directory is:
c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV/.agents/sub_orch_e2e_tests

Your Parent is the top-level Project Orchestrator (conversation ID: afb789d1-cf2a-486e-bac7-5b47b7113904).
You MUST communicate all status, reports, and handoffs back to your parent using send_message.

MANDATORY FIRST STEP:
Read the authoritative user request at:
c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV/.agents/ORIGINAL_REQUEST.md
and the master project document at:
c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV/PROJECT.md

Your Mission (E2E Testing Track):
1. Establish test infrastructure: Install Vitest and configure `package.json` with `"test": "vitest run"` if not already configured.
2. Formulate test architecture and write `TEST_INFRA.md` at project root using the standard template:
   - Category-Partition + Boundary Value Analysis + Pairwise Combinatorial + Real-World Workload Testing.
   - Feature inventory coverage from ORIGINAL_REQUEST.md (R1, R2, R3).
3. Design and implement comprehensive 4-Tier opaque-box test suites:
   - Tier 1: Feature Coverage (>=5 tests per feature)
   - Tier 2: Boundary & Corner Cases (>=5 tests per feature)
   - Tier 3: Cross-Feature Combinations (pairwise interactions)
   - Tier 4: Real-World Application Scenarios (realistic CV inputs, paywall bypass attempts, malformed CVs)
   - Minimum threshold: ~11 * N + max(5, N / 2) test cases.
4. Publish `TEST_READY.md` at project root when the test suite is ready, documenting the test runner command, tier breakdown, and feature checklist.
5. You are an Orchestrator: Decompose tasks and delegate implementation to workers/test writers (`teamwork_preview_worker`, `teamwork_preview_test_writer`, `teamwork_preview_reviewer`, `teamwork_preview_auditor`). Do not write test code directly yourself.
6. Report completion and test suite status back to your parent via send_message.
</USER_REQUEST>
