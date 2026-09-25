## 2026-09-17T12:07:24Z

You are Worker 1 for Milestone 3: Automated CV Quality & Professional Standards Engine.

Read the authoritative requirements, project specifications, and Explorer handoff reports:
- ORIGINAL_REQUEST.md: c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV/.agents/ORIGINAL_REQUEST.md
- PROJECT.md: c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV/PROJECT.md
- SCOPE.md: c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV/.agents/sub_orch_m3_cv_quality/SCOPE.md
- Explorer 1 Report (Architecture & Data Models): c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV/.agents/explorer_m3_1/handoff.md
- Explorer 2 Report (Rules, Taxonomies & Regex Patterns): c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV/.agents/explorer_m3_2/handoff.md
- Explorer 3 Report (Document Generators & Guardrails): c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV/.agents/explorer_m3_3/handoff.md

Your Working Directory:
c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV/.agents/worker_m3_1

Write Ownership (Files you own exclusively):
- `src/lib/cvQualityEngine.ts`
- `src/lib/docxGenerator.ts`
- `src/lib/pdfGenerator.ts`
- `src/app/api/score/route.ts`
- `src/types/scoring.ts`
- `src/lib/cvSubmissionAgent.ts`
- `tests/unit/cvQualityEngine.test.ts`
- `tests/unit/docxGenerator.test.ts`
- `tests/unit/pdfGenerator.test.ts`

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Tasks:
1. Implement `src/lib/cvQualityEngine.ts` strictly following the interfaces and algorithms detailed in the Explorer reports:
   - Impact Density & XYZ Formula Validation (Action Verb taxonomy, robust metric regexes with non-metric exclusions, business outcome indicators, >=40% metric saturation threshold, line-by-line feedback with suggested revisions).
   - Contact Integrity (Name >=2 words non-placeholder, phone 7-15 digits ITU-T E.164, professional RFC email non-dummy, non-placeholder location).
   - Section Architecture (Standard ATS hierarchy: Summary -> Skills Grid -> Experience -> Education -> References, with sequence validation).
   - Formatting Guardrails (single-column validation, zero multi-cell tables, zero text boxes, zero graphics).
   - References Preservation & Privacy (truthful preservation of candidate references without hallucinated data, standard privacy declaration 'References available upon request').
   - Diagnostic Scoring (0-100 rubric with mathematical weights, line-by-line feedback, critical issues, and actionable fixes).
   - Input Normalization (`StandardCVDocument | string`).
2. Update `src/types/scoring.ts` to export the quality engine types and attach `qualityAudit?: QualityAuditResult` to `ScoreResult`.
3. Update `src/app/api/score/route.ts` to execute `auditCvQuality` and include `qualityAudit` in the response.
4. Update `src/lib/cvSubmissionAgent.ts` to integrate and align with `auditCvQuality`.
5. Refactor `src/lib/docxGenerator.ts` to strictly adhere to single-column ATS standards:
   - Eliminate all 2-cell / multi-cell tables in Experience, Education, and Skills Grid.
   - Re-order sections to strictly follow canonical ATS sequence: Summary -> Core Skills -> Experience -> Education -> References.
6. Create `src/lib/pdfGenerator.ts`:
   - Native text-based single-column ATS PDF generator using `jspdf` (already installed in package.json).
   - Clean linear layout, selectable text, standard ATS hierarchy, zero raster images.
   - Exports `generatePdfBuffer` and `generatePdfBlob`.
7. Create comprehensive unit tests:
   - `tests/unit/cvQualityEngine.test.ts`: test XYZ formula, 40% metric saturation boundary (39% fail, 40% pass), contact integrity, section order, references, 0-100 score.
   - `tests/unit/docxGenerator.test.ts`: test 0 multi-cell tables, single-column linear layout, correct section hierarchy.
   - `tests/unit/pdfGenerator.test.ts`: test valid PDF buffer generation, selectable text, correct section order, zero images.
8. Verify everything:
   - Run type checking (`npx tsc --noEmit`) and run tests (`npx vitest run` or equivalent test command). Ensure 0 errors and all tests pass!
9. Write a comprehensive handoff report to:
   `c:/Users/user/Documents/AI WONDER LAND/Anti Gravity Projects/RATEMYCV/.agents/worker_m3_1/handoff.md`
   and send a message to parent upon completion.
