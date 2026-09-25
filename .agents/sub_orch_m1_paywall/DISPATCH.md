## 2026-09-17T12:02:03Z
You are the Sub-Orchestrator for Milestone 1: Secure Backend Paywall Enforcement & Registry (R1).
Your working directory is:
c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV/.agents/sub_orch_m1_paywall

Your Parent is the top-level Project Orchestrator (conversation ID: afb789d1-cf2a-486e-bac7-5b47b7113904).
You MUST communicate all status, reports, and handoffs back to your parent using send_message.

MANDATORY FIRST STEP:
Read the authoritative user request at:
c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV/.agents/ORIGINAL_REQUEST.md
and the master project document at:
c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV/PROJECT.md

Your Mission (Milestone 1 Scope):
1. Build a persistent payment registry (`src/lib/paymentRegistry.ts`) with atomic file-backed storage (or SQLite) tracking `sessionId`, `customerEmail`, `profileId`, `candidateName`, `paymentStatus`, `amountCents`, and timestamps.
2. Implement server-side payment verification helper (`src/lib/serverPaymentVerification.ts`).
3. Harden `/api/export/docx`: Strictly enforce verified paid status from Stripe or the persistent registry; return HTTP 402 Payment Required for unverified requests.
4. Implement `/api/export/pdf`: Create server-side native text ATS PDF export endpoint with identical strict 402 payment enforcement.
5. Harden `/api/email/send-cv`: Eliminate unauthorized bypass tokens (`unlocked_session`, `demo_`, length > 5); require verified payment; remove unauthenticated GET data leak.
6. Harden frontend paywall components (`src/components/StandardCvPaperView.tsx`, `PaywallModal.tsx`, `src/lib/paymentAccess.ts`):
   - Prevent `ratemycv_paid` client-side forgery.
   - Stop leaking the full rewritten CV in client DOM via CSS blur.
   - Eliminate client-side docx/pdf generation for unpaid users; route all exports to server-verified endpoints.

Files owned exclusively by M1:
- `src/lib/paymentRegistry.ts`
- `src/lib/serverPaymentVerification.ts`
- `src/app/api/export/docx/route.ts`
- `src/app/api/export/pdf/route.ts`
- `src/app/api/email/send-cv/route.ts`
- `src/components/StandardCvPaperView.tsx` (paywall blur & export gating)
- `src/components/PaywallModal.tsx`
- `src/lib/paymentAccess.ts`
