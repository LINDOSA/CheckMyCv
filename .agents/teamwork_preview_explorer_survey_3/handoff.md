# Comprehensive Investigation Report: CV Quality & Standards Engine, Data Flow, and Test Infrastructure

**Agent**: Explorer 3 (`teamwork_preview_explorer_survey_3`)  
**Mission**: Investigate CV Quality & Standards Engine requirements, existing CV generation/rewriting data flows, schemas, and test infrastructure.  
**Authoritative Reference**: `.agents/ORIGINAL_REQUEST.md`

---

## 1. Observation

### 1.1 Project Structure & Dependencies
Direct inspection of `package.json` reveals:
- **Project Name & Version**: `score-my-cv` (version 1.0.0, Next.js 14.2.20, React 18.3.1, TypeScript 5.7.2).
- **Installed Scripts** (`package.json:5-10`):
  ```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
  ```
  *(Observation: There is **no `"test"` script** defined in `package.json`).*
- **Installed Production Dependencies** (`package.json:11-27`):
  - Document & Parsing: `docx` (^9.7.1), `html2canvas` (^1.4.1), `jspdf` (^4.2.1), `mammoth` (^1.8.0), `pdf-parse` (^1.1.1).
  - Payments & Email: `stripe` (^22.6.2), `nodemailer` (^10.0.10).
  - UI & Styling: `@phosphor-icons/react` (^2.1.10), `lucide-react` (^0.468.0), `clsx` (^2.1.1), `tailwind-merge` (^2.5.5).
- **Installed Dev Dependencies** (`package.json:28-38`):
  - `@types/node` (^20.17.10), `@types/pdf-parse` (^1.1.4), `@types/react` (^18.3.12), `@types/react-dom` (^18.3.1), `autoprefixer` (^10.4.20), `postcss` (^8.4.49), `tailwindcss` (^3.4.16), `typescript` (^5.7.2).
  *(Observation: **No test framework is installed**. Neither `jest`, `vitest`, `mocha`, nor `pytest` is present).*

### 1.2 CV Data Flow & Processing Pipeline

#### A. Document Ingestion & Parsing
- **API Endpoint**: `POST /api/parse` in `src/app/api/parse/route.ts:6-69`.
  - Accepts `multipart/form-data` with `file` (max 10MB).
  - Calls `extractTextFromFile(buffer, fileName, mimeType)` from `src/lib/fileParser.ts`.
- **Parsing Implementation** (`src/lib/fileParser.ts:19-80`):
  - PDF: `pdfParse(buffer)` (`pdf-parse:32`).
  - DOCX: `mammoth.extractRawText({ buffer })` (`mammoth:46`).
  - TXT/MD: `buffer.toString('utf-8')` (`line 59`).
  - Post-Processing: Text is cleaned and compressed via `compressCvText(rawText)` in `src/lib/textCompression.ts:7-26`, which strips control characters (`[\0\x08\x0B\x0C\x0E-\x1F\x7F]`), zero-width spaces (`[\u200B-\u200D\uFEFF\u00AD]`), collapses whitespace, and removes standalone page number lines (`/^page\s+\d+(\s+of\s+\d+)?$/i`).

#### B. Diagnostic Scoring Pipeline
- **API Endpoint**: `POST /api/score` in `src/app/api/score/route.ts:16-70`.
  - Accepts JSON `{ cvText: string, jobAdvertText?: string }`.
  - Wraps `scoreCV(trimmedCV, trimmedJob)` in a 16s timeout (`line 43`).
  - Fallback on timeout or error: `generateFallbackScore(trimmedCV, trimmedJob)` (`lines 55-59`).
- **Scoring Logic** (`src/lib/gemini.ts:367-432` & `src/lib/scoringEngine.ts:271-568`):
  - Deterministic empirical baseline calculated via `calculateEmpiricalScore(cvText, jobAdvertText)`.
  - Category weights defined in `scoringEngine.ts:398-406`:
    - Keyword Match: 30%
    - ATS Readability: 20%
    - Achievement Quality: 20%
    - Experience Relevance: 20%
    - Skills Match: 10%
  - Overall score formula (`scoringEngine.ts:399-405`):
    ```ts
    const weightedOverall = Math.round(
      (keywordScore * 0.30) +
      (atsScore * 0.20) +
      (achievementScore * 0.20) +
      (relevanceScore * 0.20) +
      (skillsScore * 0.10)
    );
    ```
  - LLM Enrichment (`src/lib/gemini.ts:388-428`): If `GEMINI_API_KEY`, `OPENROUTER_API_KEY`, or `OPENAI_API_KEY` is present, queries LLM for refined prose, but passes through `sanitizeScoreResult` (`gemini.ts:327-365`), which locks numeric scores strictly to empirical calculations.

#### C. Data Models & Schemas
- **Diagnostic Result Schema** (`src/types/scoring.ts:1-29`):
  - `CategoryScore`: `{ key: 'keyword'|'ats'|'achievement'|'relevance'|'skills', name, score, weight, status: 'critical'|'warning'|'good'|'excellent', detail, bullet_examples? }`
  - `TopIssue`: `{ category_key, issue, detail, fix }`
  - `ScoreResult`: `{ overall_score, headline, is_general_health, target_role_detected?, benchmark_percentile, benchmark_text, categories, top_issues, strengths, quick_wins }`
- **Standardized CV Document Model** (`src/lib/cvStandardData.ts:3-49`):
  - `CVReference`:
    ```ts
    export interface CVReference {
      name: string;
      title: string;
      company: string;
      relationship: string;
      phone: string;
      email: string;
      location?: string;
    }
    ```
  - `StandardCVDocument`:
    ```ts
    export interface StandardCVDocument {
      id: string;
      name: string;
      title: string;
      contact: {
        email: string;
        phone: string;
        location: string;
        nationality?: string;
        linkedin?: string;
      };
      summary: string;
      experience: Array<{
        title: string;
        company: string;
        dates: string;
        bullets: string[];
      }>;
      education: Array<{
        qualification: string;
        institution?: string;
        certificationCode?: string;
        year: string;
      }>;
      skillsGrid: Array<{
        category: string;
        skills: string;
      }>;
      additionalInfo?: {
        languages?: string[];
        references?: string;
        driversLicense?: string;
        noticePeriod?: string;
        workEligibility?: string;
      };
      references?: CVReference[];
    }
    ```
- **Submission Readiness Agent Schema** (`src/lib/cvSubmissionAgent.ts:5-25`):
  - `SubmissionCheckItem`: `{ id, category, title, status: 'passed'|'warning'|'critical', weight, score, feedback, recommendations: string[] }`
  - `SubmissionAuditReport`: `{ overallReadinessScore, isSubmissionReady, verdict, certificationBadge, checks, missingCriticalItems, autoFixesApplied, refereesCount }`

#### D. Text Transformation & Section Extraction
- Function `parseUserCvToStandardDocument(cvText, targetRole)` in `src/lib/cvStandardData.ts:543-1105`:
  - Uses `classifyCvLineAsSection(line)` (`lines 467-536`) to classify lines into 9 sections: `header`, `summary`, `experience`, `education`, `skills`, `certifications`, `languages`, `references`, `additional`.
  - Name extraction (`lines 578-618`): filters header lines for names; falls back to email prefix or `'Candidate Name'`.
  - Contact extraction (`lines 620-655`): regex for email, phone (7-15 digits), location, LinkedIn, nationality.
  - Role resolution (`lines 657-668`): calls `resolveCandidateRoleAndDomain` (`src/lib/domainTaxonomy.ts`).
  - Work Experience (`lines 670-802`): extracts title, company, dates via `DATE_SPLIT_REGEX`, bullets via symbol matching (`/^[-•*–—\d.]+\s*/`).
  - Summary (`lines 818-838`): extracts candidate summary; if absent, synthesizes a conservative statement without fabricated metrics.
  - Education (`lines 841-904`): degree keyword matching + year regex.
  - Skills (`lines 906-980`): extracts categorized skill pairs or splits into "Core Competencies" and "Technical & Domain Tools".
  - References (`lines 982-1048`): extracts referee contacts or defaults to `'References available upon request'`.

#### E. Rewriting Engine
- **Single-Bullet Rewriting**: `POST /api/rewrite` (`src/app/api/rewrite/route.ts`) calls `rewriteBulletPoint` in `src/lib/gemini.ts:442-514`. Prompts LLM to format bullet using XYZ formula (Accomplished [X] as measured by [Y] by doing [Z]).
- **Full CV Rewriting**: **No automated full-document LLM rewriting pipeline currently exists**. The UI in `src/components/FullRewriteModal.tsx` and `src/components/StandardCvPaperView.tsx` parses raw CV text using `parseUserCvToStandardDocument` and runs `ensureCvSubmissionReady`, which structures and formats the candidate's existing content into the standard single-column layout without rewriting every bullet point.

#### F. Document Generation & Export
- **Word (.docx)**:
  - `createDocxFromStandardCV(data: StandardCVDocument)` in `src/lib/docxGenerator.ts:22-519` builds a Word document with `docx` package (`Packer.toBuffer` / `Packer.toBlob`).
  - Endpoints: `GET /api/export/docx` and `POST /api/export/docx` in `src/app/api/export/docx/route.ts:34-118`.
- **PDF (.pdf)**:
  - Currently **only exists client-side** in `src/components/StandardCvPaperView.tsx:98-149`.
  - Uses `html2canvas` to screenshot the DOM paper element and inserts a JPEG into `jsPDF`.
  - **No backend `/api/export/pdf` route exists in `src/app/api/export`**.
- **Email Delivery**:
  - `POST /api/email/send-cv` in `src/app/api/email/send-cv/route.ts:31-90` calls `sendCvAndInvoiceEmail` in `src/lib/invoiceEmailService.ts`, which compiles the docx buffer and attaches it via `nodemailer`.

---

### 1.3 Quality Engine Requirements vs Existing Implementation Audit

| Quality Dimension | Required Standard (ORIGINAL_REQUEST.md R2) | Existing Implementation Status | Code Location | Gap / Deficiency Identified |
|---|---|---|---|---|
| **Impact Density** | XYZ formula (Action Verb + Quantifiable Metric + Business Outcome), >=40% metric saturation check | Partial check | `scoringEngine.ts:96-127`, `cvSubmissionAgent.ts:107-137` | Checks only %/$ /counts (`isQuantifiedBullet`) and power verbs (`startsWithPowerVerb`). Does **not** validate the 3rd component (Business Outcome clause: e.g. "resulting in...", "cutting downtime by..."). Does **not** produce line-by-line bullet evaluations. |
| **Contact Integrity** | Full candidate name, phone number, professional email, location | Partial check | `cvSubmissionAgent.ts:44-77`, `cvStandardData.ts:578-646` | Only checks `@` in email, digits >=7 in phone, length >2 in location. Does not validate full name completeness (allows placeholder `'Candidate Name'`) or professional email domain standards. |
| **Section Architecture** | Standard ATS hierarchy: Summary, Skills Grid, Experience, Education, References | Non-compliant ordering | `docxGenerator.ts:72-420`, `StandardCvPaperView.tsx:651-860` | Current order is: Summary -> **Experience** -> **Education** -> **Core Skills** -> References. Skills Grid is positioned after Education, violating the required ATS sequence. |
| **Formatting Guardrails** | Strict single-column ATS structure, no graphics, text boxes, or unparseable tables in docx/pdf | Violations in both DOCX and PDF | `docxGenerator.ts:120-303`, `StandardCvPaperView.tsx:98-149` | DOCX uses multi-cell `Table` components for role headers (75%/25%), education (80%/20%), and skills (50%/50% 2-column table). PDF is a raster JPEG screenshot from `html2canvas`, yielding zero parseable text for ATS systems. No backend PDF endpoint exists. |
| **References Preservation** | Honest preservation of candidate references without hallucinations, privacy standards | Partial / Conflicted | `cvStandardData.ts:51-430`, `cvSubmissionAgent.ts:28-33`, `PaywallModal.tsx:101` | Parser handles "available upon request" correctly. However, static sample profiles contain fabricated references, and `PaywallModal.tsx:101` advertises "Synthesized manager contacts", contradicting anti-hallucination rules. |
| **Scoring & Feedback** | Structured diagnostic score (0-100) with line-by-line quality feedback and actionable fixes | Missing line-by-line structure | `scoringEngine.ts:425-567`, `types/scoring.ts:1-29` | Returns aggregate category scores (0-100) and 3 top issues, but flags only 1 `samplePassiveBullet`. Does **not** return a line-by-line audit array with bullet index, failure rationale, and specific rewrite fixes. |

---

### 1.4 Test Infrastructure Audit
- **Installed Test Packages**: None found in `package.json` dependencies or devDependencies.
- **Test Scripts in `package.json`**: None. Executing `npm test` triggers: `npm ERR! Missing script: "test"`.
- **Existing Tests**:
  - `src/`: Zero test files (`*.test.ts`, `*.spec.ts`, `__tests__`).
  - `scratch/`: Found 4 ad-hoc node execution scripts without assertion libraries:
    - `scratch/test-agent-submission.js` (10-line placeholder)
    - `scratch/test-css-status.js` (fetches `http://localhost:3000`)
    - `scratch/test-docx.js` (generates sample docx file)
    - `scratch/test-full-docx.js` (standalone Node.js docx generator)
  - None of these verify acceptance criteria or use assertion frameworks (such as `expect()`, `assert`, `test()`, `describe()`).

---

## 2. Logic Chain

1. **Premise 1 (Data Flow Ingestion & Parsing)**: The existing parsing pipeline in `src/lib/fileParser.ts` uses mature libraries (`pdf-parse` 1.1.1 and `mammoth` 1.8.0) and sanitizes input through `src/lib/textCompression.ts`. This successfully extracts raw text from PDF and Word documents.
2. **Premise 2 (CV Transformation Flow)**: Raw text is parsed into `StandardCVDocument` via `parseUserCvToStandardDocument` in `src/lib/cvStandardData.ts`. However, when transforming to Word documents (`src/lib/docxGenerator.ts`), the code relies on `Table` constructs (`headerTable`, `eduTable`, `skillsTable`) to simulate columns. This introduces unparseable or multi-cell table structures into generated `.docx` files, contradicting the strict single-column ATS guardrails.
3. **Premise 3 (PDF Generation Gap)**: Currently, candidate PDF downloads are generated entirely in browser memory (`StandardCvPaperView.tsx:98-149`) using `html2canvas` which renders the document to a canvas image and saves it via `jsPDF`. This produces a raster image PDF without selectable text or DOM text layers. Enterprise ATS engines (like Taleo, Workday, or Greenhouse) parsing this PDF extract empty strings. Furthermore, there is no server-side `/api/export/pdf` route, making it impossible to enforce backend Stripe paywalls on PDF downloads.
4. **Premise 4 (Quality Engine Deficiencies)**: While `src/lib/scoringEngine.ts` and `src/lib/cvSubmissionAgent.ts` implement basic metric saturation checks (`metricRatio >= 0.4`), they lack:
   - Complete XYZ formula evaluation (Action Verb + Quantifiable Metric + Business Outcome).
   - Line-by-line quality feedback arrays detailing exactly which bullets fail and how to fix each one.
   - Standard ATS hierarchy ordering: `docxGenerator.ts` and `StandardCvPaperView.tsx` place Skills Grid after Education instead of immediately after Summary.
   - Contact integrity validation for full name and professional email standards.
5. **Premise 5 (Test Infrastructure Absence)**: Acceptance criteria AC4 requires: *"Automated tests verify that low-quality or malformed CVs are identified and flagged with specific actionable fixes."* Because no test runner or test dependencies are installed in `package.json`, automated test execution cannot currently run.

---

## 3. Caveats

1. **No External Network Calls**: The investigation was conducted in local read-only mode. External API connections to Stripe live environments or Gemini LLM endpoints were not tested live; analysis was based on source code implementations and environment configurations.
2. **Client-Side vs Server-Side DOCX Generation**: `StandardCvPaperView.tsx` supports both client-side blob generation (`generateDocxBlob`) and a fallback to `/api/export/docx`. If client-side generation is triggered without server paywall verification, client bypasses are possible unless client generation is strictly bound to backend verification tokens.
3. **PDF Generation Library Selection**: The project already has `jspdf` installed (^4.2.1). `jspdf` can generate native text PDFs programmatically on the server without `html2canvas`, or `@react-pdf/renderer` / `pdfkit` / headless browser approaches could be used. Server-side implementation should use text-drawing primitives to ensure 100% ATS text parseability.

---

## 4. Conclusion

The application has strong foundational modules for text extraction (`fileParser.ts`), empirical scoring (`scoringEngine.ts`), and basic CV restructuring (`cvStandardData.ts`, `cvSubmissionAgent.ts`). However, to satisfy the authoritative requirements in `ORIGINAL_REQUEST.md`, four key structural implementations and hardenings are required:

1. **Automated CV Quality & Standards Engine (`src/lib/cvQualityEngine.ts`)**:
   - Build a standalone verification engine that takes raw or rewritten CV text / `StandardCVDocument` and computes:
     - **Impact Density**: Per-bullet XYZ formula parsing (Action Verb + Quantifiable Metric + Business Outcome) and overall metric saturation calculation (enforcing `>= 40%`).
     - **Contact Integrity**: Full candidate name (first + last, non-placeholder), phone number (7-15 digits), valid professional email, and location.
     - **Section Architecture**: Enforce standard ATS hierarchy: `Summary` -> `Skills Grid` -> `Experience` -> `Education` -> `References`.
     - **Formatting Guardrails**: Structural validation for single-column linear layout without tables or text boxes.
     - **References Preservation**: Honest preservation of candidate references without hallucinations, defaulting to "References available upon request" when omitted.
     - **Diagnostic Scoring (0-100)**: Return structured diagnostic results with a dedicated `lineByLineFeedback` array mapping bullet index, flagged issues, and actionable revision suggestions.
2. **Section Hierarchy & Layout Correction in DOCX & Paper View**:
   - Update `src/lib/docxGenerator.ts` and `src/components/StandardCvPaperView.tsx` to position `Skills Grid` directly after `Professional Summary`.
   - In `docxGenerator.ts`, replace multi-cell tables with pure single-column paragraphs (e.g. bold role title with dates right-tabbed or linear on a dedicated line) to ensure 100% single-column ATS parser compliance.
3. **Server-Side ATS-Parseable PDF Export Endpoint (`/api/export/pdf`)**:
   - Create `src/app/api/export/pdf/route.ts` requiring verified Stripe payment confirmation before returning a native text-based single-column PDF.
   - Eliminate rasterized `html2canvas` PDF generation in favor of genuine text streams so enterprise ATS parsers can read the output.
4. **Test Infrastructure Installation & Test Suites**:
   - Install `vitest` (or `jest`) and configure `"test": "vitest run"` in `package.json`.
   - Implement unit tests covering:
     - XYZ formula parsing and metric saturation threshold (>=40%).
     - Contact integrity checks.
     - Section architecture validation.
     - DOCX / PDF structural single-column validation.
     - References privacy and hallucination prevention.

---

## 5. Verification Method

To independently verify these findings, perform the following steps:

### A. Inspect Missing Test Infrastructure
1. View `package.json` lines 5-10 and 28-38:
   - Confirm absence of `"test"` script.
   - Confirm absence of `jest`, `vitest`, `mocha`, or `@types/jest`.
2. Inspect `scratch/`:
   - View `scratch/test-agent-submission.js` and `scratch/test-full-docx.js`.
   - Confirm they are standalone Node execution scripts, not assertion-based unit tests.

### B. Verify Document Order and Table Usage in DOCX
1. View `src/lib/docxGenerator.ts:100-305`:
   - Observe lines 100-167: Professional Experience.
   - Observe lines 170-236: Education & Certifications.
   - Observe lines 239-304: Core Skills (placed *after* Experience and Education).
   - Observe lines 120-153, 190-233, 263-303: Usage of `new Table()` with multiple cells.

### C. Verify PDF Export Implementation
1. Inspect `src/app/api/export/`:
   - Confirm only `docx/route.ts` exists; `pdf/route.ts` is absent.
2. View `src/components/StandardCvPaperView.tsx:98-149`:
   - Observe usage of `html2canvas(paperRef.current)` and `pdf.addImage(imgData, 'JPEG', ...)` confirming PDF is an image screenshot.

### D. Verify Existing Impact Density & Feedback Logic
1. View `src/lib/scoringEngine.ts:96-127` and `cvSubmissionAgent.ts:107-137`:
   - Confirm `isQuantifiedBullet` checks for numbers and units, but does not parse Business Outcome clauses.
   - Confirm `ScoreResult` schema in `src/types/scoring.ts:18-29` has no line-by-line feedback array.

### Invalidation Conditions
- If `vitest` or `jest` is already present in `node_modules` or root configuration, this finding would be invalidated. (Verified: `package.json` does not include them).
- If `/api/export/pdf` existed in another directory, this finding would be invalidated. (Verified: `find_by_name` on `src` returned only `app/api/export/docx`).
