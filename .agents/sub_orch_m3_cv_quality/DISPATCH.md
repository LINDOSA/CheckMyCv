## 2026-09-17T12:02:03Z

You are the Sub-Orchestrator for Milestone 3: Automated CV Quality & Professional Standards Engine (R2).
Your working directory is:
c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV/.agents/sub_orch_m3_cv_quality

Your Parent is the top-level Project Orchestrator (conversation ID: afb789d1-cf2a-486e-bac7-5b47b7113904).
You MUST communicate all status, reports, and handoffs back to your parent using send_message.

MANDATORY FIRST STEP:
Read the authoritative user request at:
c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV/.agents/ORIGINAL_REQUEST.md
and the master project document at:
c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV/PROJECT.md

Your Mission (Milestone 3 Scope):
1. Build the standalone Automated CV Quality & Standards Engine (`src/lib/cvQualityEngine.ts`):
   - Impact Density: Validate bullet points follow the XYZ formula (Action Verb + Quantifiable Metric + Business Outcome) with minimum 40% metric saturation.
   - Contact Integrity: Full candidate name (first + last, non-placeholder), phone number (7-15 digits), valid professional email, and location.
   - Section Architecture: Standard ATS hierarchy (`Summary` -> `Skills Grid` -> `Experience` -> `Education` -> `References`).
   - Formatting Guardrails: Structural validation for strict single-column ATS layout without unparseable tables, text boxes, or graphics.
   - References Preservation: Honest preservation of candidate references without hallucinations, respecting privacy standards.
   - Diagnostic Scoring: Structured 0-100 score with line-by-line quality feedback mapping bullet index, detected issues, and actionable revision suggestions.
2. Update `src/lib/docxGenerator.ts` to strictly adhere to single-column ATS formatting (eliminate multi-cell `Table` elements; reorder sections to Summary -> Skills Grid -> Experience -> Education -> References).
3. Create `src/lib/pdfGenerator.ts` for native text-based ATS single-column PDF generation.
4. Integrate Quality Engine into diagnostic scoring (`src/app/api/score/route.ts` and `src/types/scoring.ts`).

Files owned exclusively by M3:
- `src/lib/cvQualityEngine.ts`
- `src/lib/docxGenerator.ts`
- `src/lib/pdfGenerator.ts`
- `src/app/api/score/route.ts`
- `src/types/scoring.ts`
- `src/lib/cvSubmissionAgent.ts`

Orchestration Procedure:
- You are a Sub-Orchestrator: Follow the Orchestrator Iteration Loop (Explorer -> Worker -> Reviewer -> Challenger -> Auditor -> Gate). Do NOT write application code yourself.
- MANDATORY: Include path to `ORIGINAL_REQUEST.md` in all subagent dispatches.
- MANDATORY: Include the verbatim Integrity Warning in Worker dispatches.
- Verify that automated unit tests pass for CV quality checks, XYZ formula parsing, metric saturation, and formatting guardrails.
- Send handoff report to parent when Milestone 3 passes all gate criteria.
