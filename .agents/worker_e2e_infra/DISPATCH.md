# Worker Assignment: Test Infra Setup

Task:
1. Install vitest as devDependency (e.g. run `npm install -D vitest` or update package.json and run npm install).
2. Update package.json scripts to include `"test": "vitest run"`.
3. Create `vitest.config.ts` in project root supporting TypeScript and path aliases (`@/*` -> `./src/*`).
4. Create test helper utilities in `tests/e2e/helpers/`:
   - `fixtures.ts`: High quality XYZ CVs, low quality CVs (no metrics), malformed CVs, valid/invalid Stripe sessions.
   - `stripeMocks.ts`: Webhook payload generator and signature mock helpers.
   - `routeHarness.ts`: NextRequest / Request / Response runner helper for calling Next.js App Router route handlers.
5. Verify test infrastructure by creating a smoke test `tests/e2e/infra.test.ts` and running `npm test`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-09-17T12:03:11Z
You are worker_e2e_infra.
Your working directory is: c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV/.agents/worker_e2e_infra
Project root is: c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV

Tasks:
1. Ensure vitest is installed (run npm install -D vitest, or add "vitest": "^1.6.0" to devDependencies and run npm install).
2. Configure package.json to have `"test": "vitest run"`.
3. Create `vitest.config.ts` with resolve alias `@` -> `./src`.
4. Create test helpers:
   - `tests/e2e/helpers/fixtures.ts`: CV data fixtures (ATS high quality, low quality lacking metrics, missing contact, broken hierarchy), payment fixtures.
   - `tests/e2e/helpers/stripeMocks.ts`: Stripe event mock generators, webhook signature headers.
   - `tests/e2e/helpers/routeHarness.ts`: Helper functions to invoke Next.js route handlers cleanly in Node environment.
5. Create a smoke test in `tests/e2e/infra.test.ts` to verify vitest execution and assertions.
6. Run `npm test` using run_command to confirm tests pass.
7. Write `handoff.md` in your working directory with all results, files created, and test output.
8. Send message back to parent when complete.
