# Milestone 3 Explorer 1 Investigation Report & Handoff
**Target System**: Automated CV Quality & Professional Standards Engine (`src/lib/cvQualityEngine.ts`)  
**Date**: 2026-09-17  
**Explorer**: Explorer M3-1  
**Status**: Ready for Implementation  

---

## 1. Observation

### 1.1 Codebase Files Inspected
1. **`src/lib/cvStandardData.ts`**:
   - Lines 3–11: `CVReference` interface:
     ```typescript
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
   - Lines 13–49: `StandardCVDocument` interface:
     Contains `id`, `name`, `title`, `contact` (`email`, `phone`, `location`, `nationality?`, `linkedin?`), `summary`, `experience` (array of `title`, `company`, `dates`, `bullets: string[]`), `education` (array of `qualification`, `institution?`, `certificationCode?`, `year`), `skillsGrid` (array of `category`, `skills`), `additionalInfo?`, `references?: CVReference[]`.
   - Lines 543–1105: `parseUserCvToStandardDocument(cvText: string, targetRole?: string): StandardCVDocument`:
     Dynamically parses raw text using regex-based section classification (`classifyCvLineAsSection` lines 456–536), name extraction (lines 578–618), contact extraction (lines 620–655), work experience clustering (lines 670–802), summary extraction (lines 818–838), education extraction (lines 841–904), skills grid generation (lines 907–980), references parsing (lines 983–1049), and additional info extraction (lines 1051–1083).
   - Lines 442–451: `storeDynamicCV` and `getStandardCV`.

2. **`src/types/scoring.ts`**:
   - Lines 1–9: `CategoryScore` (`key: 'keyword' | 'ats' | 'achievement' | 'relevance' | 'skills'`, `score: number`, `weight: number`, `status`, `detail`, `bullet_examples?`).
   - Lines 11–16: `TopIssue` (`category_key`, `issue`, `detail`, `fix`).
   - Lines 18–29: `ScoreResult` (`overall_score`, `headline`, `is_general_health`, `target_role_detected?`, `benchmark_percentile`, `benchmark_text`, `categories`, `top_issues`, `strengths`, `quick_wins`).
   - Lines 31–58: `CVProfile` interface (alternative schema with `personal`, `experience.employer`, `education`, `skills: string[]`).

3. **`src/lib/cvSubmissionAgent.ts`**:
   - Lines 3–25: `SubmissionCheckItem` and `SubmissionAuditReport` (`overallReadinessScore: number`, `isSubmissionReady: boolean`, `verdict`, `certificationBadge`, `checks: SubmissionCheckItem[]`, `missingCriticalItems: string[]`, `autoFixesApplied: string[]`, `refereesCount: number`).
   - Lines 31–33: `generateContextualReferences(cv: StandardCVDocument): CVReference[]` preserves `cv.references`.
   - Lines 38–268: `auditCvForSubmission(cv: StandardCVDocument)` evaluates 7 checks: `contact_integrity`, `executive_summary`, `experience_metrics`, `education_credentials`, `skills_categorization`, `languages`, `professional_references`.
   - Line 109–114: `metricRatio` is calculated as `quantifiedBullets / totalBullets`, passing if `metricRatio >= 0.4`.
   - Lines 274–310: `ensureCvSubmissionReady(cv: StandardCVDocument)` applies fixes (e.g. setting `'References available upon request'` if `references` is empty).

4. **`src/app/api/score/route.ts`**:
   - Lines 21–48: `POST` endpoint accepts `{ cvText, jobAdvertText }`. Calls `scoreCV(trimmedCV, trimmedJob)` with a 16s timeout.
   - Lines 49–69: Fallback catch block serves `generateFallbackScore(trimmedCV, trimmedJob)` from `src/lib/gemini.ts` (which delegates to `calculateEmpiricalScore` in `src/lib/scoringEngine.ts`).

5. **`src/lib/scoringEngine.ts`**:
   - Lines 69–91: `extractBullets(cvText)` extracts bullets matching `^[•\-\*\–\—\+]|\d+[\.\)]\s+` or action verbs.
   - Lines 96–113: `isQuantifiedBullet(bullet)` checks percentages (`\d+%`), currency (`$`, `€`, `£`, etc.), operational units (`users`, `servers`, etc.), `\d+\+`, and SLA/KPI with numbers.
   - Lines 118–127: `isPassiveDutyBullet` and `startsWithPowerVerb`.
   - Lines 271–568: `calculateEmpiricalScore(cvText: string, jobAdvertText?: string): ScoreResult`. Computes 5 weighted categories (Keyword 30%, ATS 20%, Achievement 20%, Relevance 20%, Skills 10%).

6. **`src/lib/docxGenerator.ts`**:
   - Lines 120–167: Experience header rendered via `Table` with 2 cells (Title on left, Dates on right).
   - Lines 190–235: Education rendered via `Table` with 2 cells.
   - Lines 263–303: Skills grid rendered via `Table` with 2 cells (left & right columns).
   - *Observation*: These multi-cell tables conflict with the strict single-column requirement of ATS guardrails in Milestone 3.

---

## 2. Logic Chain

1. **Current Bullet Evaluation vs Milestone 3 Requirement**:
   - *Observation*: `scoringEngine.ts:96-113` checks for quantified strings and `cvSubmissionAgent.ts:110` checks regex `/\d+%|\$\d+|\d+\+|\d+ (users|stores...)/`.
   - *Logic*: Neither engine evaluates the full Google XYZ formula (Accomplished [X] as measured by [Y] by doing [Z]). Specifically, neither evaluates whether an individual bullet has:
     (a) high-impact action verb start (`hasActionVerb`),
     (b) quantifiable metric (`hasQuantifiableMetric`), and
     (c) verified business outcome (`hasBusinessOutcome`).
   - *Conclusion*: A new parser is required in `cvQualityEngine.ts` that evaluates every bullet item individually, calculates `metricSaturation = metrics / total`, enforces `isMetricSaturationCompliant = metricSaturation >= 0.40`, and returns line-by-line feedback (`lineByLineFeedback: BulletEvaluation[]`) with actionable rewrite suggestions.

2. **Contact Integrity Gap**:
   - *Observation*: `scoringEngine.ts:343-346` and `cvSubmissionAgent.ts:44-60` check if email has `@` and phone has digits >= 7.
   - *Logic*: They do not validate against placeholder/dummy names (`"Candidate Name"`, `"John Doe"`), dummy email domains (`@example.com`), or phone digit bounds (must be between 7 and 15 digits per E.164 standard).
   - *Conclusion*: `cvQualityEngine.ts` must implement `ContactIntegrityReport` with `hasFullName`, `candidateName`, `hasPhoneNumber`, `phoneNumber`, `hasProfessionalEmail`, `email`, `hasLocation`, `location`, `isValid`, and `issues: string[]`.

3. **Section Architecture & ATS Hierarchy Gap**:
   - *Observation*: `scoringEngine.ts:321-340` uses `headerAudit` to find headers anywhere in text regardless of sequence.
   - *Logic*: ATS engines (Workday, Greenhouse, Taleo) expect a canonical top-down structure:
     `Summary -> Skills Grid -> Experience -> Education -> References`.
     If Education precedes Experience for experienced professionals, or if Skills is placed at the end, parsers miss or misclassify sections.
   - *Conclusion*: `cvQualityEngine.ts` must inspect the physical order of sections, returning `detectedSections: string[]`, `isHierarchyCompliant: boolean`, and `hierarchyIssues: string[]`.

4. **Formatting Guardrails Gap**:
   - *Observation*: `docxGenerator.ts` currently uses 2-cell tables for experience, education, and skills.
   - *Logic*: Enterprise ATS parsers break on multi-column tables, text boxes, and graphics.
   - *Conclusion*: `cvQualityEngine.ts` must inspect and flag multi-cell tables, text boxes, and graphics (`FormattingGuardrailReport`), and the document generators (`docxGenerator.ts`, `pdfGenerator.ts`) must be updated to pure linear single-column layouts in M3.2.

5. **References Preservation & Privacy Gap**:
   - *Observation*: `cvStandardData.ts` and `cvSubmissionAgent.ts` attempt to keep references, but lack explicit validation that references are non-hallucinated and truthful.
   - *Logic*: Candidate references must either be verified original entries (with valid name, company/title, and phone/email) OR follow the standard professional ATS privacy declaration (`"References available upon request"`). Generating fake referees or placeholder names violates recruitment compliance.
   - *Conclusion*: `cvQualityEngine.ts` must evaluate `ReferencesPreservationReport` with `hasReferences`, `referencesCount`, `isPreservedWithoutHallucination`, and `issues: string[]`.

6. **Input Normalization (`StandardCVDocument | string`)**:
   - *Observation*: The application deals with both raw text (`string` from `/api/score`, file uploads) and structured documents (`StandardCVDocument` from `/api/agent/submission-readiness`, `/api/export/docx`).
   - *Logic*: If `auditCvQuality` receives a `string`, it must inspect raw text formatting/order cues AND invoke `parseUserCvToStandardDocument` to produce a structured document. If it receives a `StandardCVDocument`, it directly evaluates the structured entities while validating single-column layout properties.
   - *Conclusion*: A unified normalization pipeline provides 100% interoperability across the entire platform.

---

## 3. Caveats

- **No Caveats on Core Architecture**: The requirements and interface contracts in `PROJECT.md` and `SCOPE.md` are completely unambiguous.
- **DOCX/PDF Generation Scope**: Updating `src/lib/docxGenerator.ts` and creating `src/lib/pdfGenerator.ts` belongs to Milestone 3.2. However, the formatting guardrails in `src/lib/cvQualityEngine.ts` directly define the compliance standard that those generators must fulfill.
- **Backward Compatibility**: Existing clients calling `/api/score` expect `{ success: true, result: ScoreResult }`. Adding `qualityAudit` both to `result.qualityAudit` and top-level response ensures complete backward compatibility without breaking existing frontend consumers.

---

## 4. Conclusion & Technical Specification

### 4.1 TypeScript Data Models (`src/types/scoring.ts` & `src/lib/cvQualityEngine.ts`)

```typescript
import { StandardCVDocument, CVReference } from './cvStandardData';

export interface BulletEvaluation {
  bulletIndex: number;
  rawText: string;
  hasActionVerb: boolean;
  hasQuantifiableMetric: boolean;
  hasBusinessOutcome: boolean;
  isXyzCompliant: boolean;
  feedback: string;
  suggestedRevision?: string;
}

export interface ContactIntegrityReport {
  hasFullName: boolean;
  candidateName: string;
  hasPhoneNumber: boolean;
  phoneNumber: string;
  hasProfessionalEmail: boolean;
  email: string;
  hasLocation: boolean;
  location: string;
  isValid: boolean;
  issues: string[];
}

export interface SectionArchitectureReport {
  detectedSections: string[];
  isHierarchyCompliant: boolean; // Summary -> Skills Grid -> Experience -> Education -> References
  hierarchyIssues: string[];
}

export interface FormattingGuardrailReport {
  isSingleColumn: boolean;
  hasMultiCellTables: boolean;
  hasTextBoxes: boolean;
  hasGraphics: boolean;
  isCompliant: boolean;
  violations: string[];
}

export interface ReferencesPreservationReport {
  hasReferences: boolean;
  referencesCount: number;
  isPreservedWithoutHallucination: boolean;
  issues: string[];
}

export interface QualityAuditResult {
  overallScore: number; // 0 - 100
  metricSaturation: number; // e.g. 0.45 (45%)
  isMetricSaturationCompliant: boolean; // >= 0.40
  contactIntegrity: ContactIntegrityReport;
  sectionArchitecture: SectionArchitectureReport;
  formattingGuardrails: FormattingGuardrailReport;
  referencesPreservation: ReferencesPreservationReport;
  lineByLineFeedback: BulletEvaluation[];
  isSubmissionReady: boolean;
  criticalIssues: string[];
  actionableFixes: string[];
}

export function auditCvQuality(cv: StandardCVDocument | string): QualityAuditResult;
```

---

### 4.2 Engine Architecture & Pillar Implementation Details

The engine comprises six deterministic, self-contained audit pillars:

#### Pillar 1: Impact Density & XYZ Formula Engine
- **Target**: Every bullet point in the candidate's work experience.
- **Rule Definitions**:
  1. **Action Verb (Z)**: Bullet starts with (or opens after adverb with) a verified high-impact power verb:
     `Spearheaded|Architected|Orchestrated|Engineered|Automated|Reduced|Increased|Improved|Delivered|Maximized|Accelerated|Negotiated|Deployed|Resolved|Implemented|Designed|Led|Managed|Executed|Established|Initiated|Directed|Formulated|Transformed|Championed|Administered|Developed|Built|Scaled|Optimized|Authored|Consolidated|Eliminated|Cut|Partnered|Supervised|Modernized|Audited|Conducted|Generated|Structured|Integrated|Standardized`
     *Disqualification*: Bullets starting with passive duty phrases (`Responsible for`, `Duties included`, `Tasked with`, `Assisted with`, `Helped to`, `Worked on`, `Participated in`) are flagged with `hasActionVerb = false`.
  2. **Quantifiable Metric (Y)**:
     - Percentages: `\b\d+(\.\d+)?%`
     - Financial amounts: `(\$|€|£|R|¥|USD|ZAR|EUR|GBP)\s*[\d,]+|\b[\d,]+\s*(dollars|euros|pounds|k|m|million|billion)\b`
     - Operational scale: `\b\d+([,\.]\d+)?\s*(users|clients|customers|stakeholders|projects|tickets|systems|servers|accounts|staff|endpoints|devices|vendors|incidents|hours|days|weeks|months|years|stores|nodes|sprints|runbooks)\b`
     - Scale indicators: `\b\d+\+\b`, `\b\d+x\b`, `\b\d+:\d+\b`, `\b(sla|uptime|roi|kpi|nps|p99|p95|sub-\d+ms)\b`
  3. **Business Outcome (X)**:
     - Outcome vocabulary: `reduced|reducing|reduction|increased|increasing|increase|improved|improving|improvement|saved|saving|savings|generated|generating|boosted|cutting|accelerated|achieved|eliminated|prevented|intercepted|grew|growth|lifted|mitigated|compressed|retention|sla resolution|uptime|compliance|audit pass|turnaround|conversion|efficiency|cost savings|revenue|time-to-value`
  4. **Compliance**: `isXyzCompliant = hasActionVerb && hasQuantifiableMetric && hasBusinessOutcome`.
  5. **Metric Saturation**:
     $$\text{metricSaturation} = \frac{\text{Bullets with Quantifiable Metrics}}{\text{Total Bullets}}$$
     $$\text{isMetricSaturationCompliant} = \text{metricSaturation} \ge 0.40$$
  6. **Line-by-line Feedback & Suggested Revision**:
     - For non-compliant bullets, provide specific feedback (e.g. "Lacks quantifiable metric and business outcome; describes daily task") and a concrete template suggestion (e.g. `"Spearheaded [Core Task], achieving [Metric e.g. 25% efficiency / $X savings], by [Action / Method]."`).

#### Pillar 2: Contact Integrity Validator
- **Validations**:
  - `hasFullName`: Candidate name >= 2 characters, not empty, and not matching placeholder patterns (`/(?:candidate|your)\s+name|john\s+doe|jane\s+doe|first\s+last|insert\s+name/i`).
  - `hasPhoneNumber`: Phone digits `cleanDigits = phone.replace(/\D/g, '')` must satisfy `cleanDigits.length >= 7 && cleanDigits.length <= 15`, and not be all repeating single digits (e.g. `0000000`, `1111111`).
  - `hasProfessionalEmail`: Must match RFC email format `/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/` and not use dummy domains (`@example.com`, `@test.com`, `@placeholder.com`).
  - `hasLocation`: Location string length >= 3 and not generic placeholder (`/(?:location|city[,\s]+state|address)/i`).
  - `isValid = hasFullName && hasPhoneNumber && hasProfessionalEmail && hasLocation`.

#### Pillar 3: Section Architecture & ATS Hierarchy Validator
- **Canonical Sequence**:
  1. `Summary` / `Profile`
  2. `Skills Grid` / `Core Skills`
  3. `Experience` / `Employment History`
  4. `Education` / `Qualifications`
  5. `References`
- **Rules**:
  - Detect sequential line positions of headers.
  - Inversions (e.g. Education above Experience, or Skills after References) mark `isHierarchyCompliant = false` and add specific warnings into `hierarchyIssues`.
  - Missing any of the 5 canonical sections flags a hierarchy violation.

#### Pillar 4: Formatting Guardrails Inspector
- **Checks**:
  - `hasMultiCellTables`: Flags markdown tables (`|---|`), multiple pipes per line (`| a | b |`), or multi-cell table structures.
  - `hasTextBoxes`: Flags text-box tags (`[sidebar]`, `[textbox]`), HTML `<aside>`, or multi-column text containers.
  - `hasGraphics`: Flags images (`![]()`, `<img`, `[Photo]`, `[Image]`).
  - `isSingleColumn`: Must be true (single linear flow).
  - `isCompliant = isSingleColumn && !hasMultiCellTables && !hasTextBoxes && !hasGraphics`.

#### Pillar 5: References Preservation & Privacy Checker
- **Rules**:
  - If candidate provides explicit referees (`references` array):
    - Each referee must contain non-placeholder name and at least one contact channel (phone or email).
    - Checks for duplicate hallucinated contacts.
  - If no explicit referees provided:
    - Must contain professional ATS privacy declaration: `"References available upon request"`.
  - `isPreservedWithoutHallucination`: True if candidate references are intact without fake generated data or if valid privacy declaration is present.
  - Flags missing or hallucinated reference records.

#### Pillar 6: Diagnostic Scoring (0–100) & Submissions Readiness
- **Mathematical Weights**:
  - **Metric Saturation & XYZ Quality**: 35 points
    - Up to 20 points for metric saturation ($\ge 40\%$ gives full 20 pts; otherwise $\text{saturation} \times 50$).
    - Up to 15 points for XYZ compliance ratio ($\text{ratio} \times 15$).
  - **Contact Integrity**: 20 points (5 pts each: Name, Phone, Email, Location).
  - **Section Architecture**: 20 points (15 pts for 5 sections presence [3 pts each], 5 pts for correct ATS hierarchy order).
  - **Formatting Guardrails**: 15 points (15 pts for pure single-column; -5 per violation: multi-cell tables, text boxes, graphics).
  - **References Preservation**: 10 points (10 pts for preserved referees or privacy declaration; 0 if hallucinated or missing).
  - **Total**: Exactly 100 points maximum.
- **Readiness Verdict**:
  $$\text{isSubmissionReady} = (\text{overallScore} \ge 75) \land \text{isMetricSaturationCompliant} \land \text{contactIntegrity.isValid} \land \text{formattingGuardrails.isCompliant} \land (\text{criticalIssues.length} = 0)$$

---

### 4.3 Input Normalization Pipeline

```typescript
export function auditCvQuality(cv: StandardCVDocument | string): QualityAuditResult {
  let doc: StandardCVDocument;
  let rawTextForLayout = '';

  if (typeof cv === 'string') {
    rawTextForLayout = cv;
    if (!cv || cv.trim().length < 20) {
      return createEmptyFailedAuditResult('CV document contains insufficient text (less than 20 characters).');
    }
    // Parse raw text into structured StandardCVDocument using existing tested parser
    doc = parseUserCvToStandardDocument(cv);
  } else {
    doc = cv;
    // For structured documents, reconstruct text representation for layout check if needed,
    // or inspect document properties directly
    rawTextForLayout = serializeStandardCVToText(doc);
  }

  // 1. Evaluate Bullets & Metric Saturation
  const lineByLineFeedback = evaluateAllBullets(doc);
  const totalBullets = lineByLineFeedback.length;
  const quantifiedBullets = lineByLineFeedback.filter(b => b.hasQuantifiableMetric).length;
  const metricSaturation = totalBullets > 0 ? Number((quantifiedBullets / totalBullets).toFixed(2)) : 0;
  const isMetricSaturationCompliant = metricSaturation >= 0.40;

  // 2. Evaluate Contact Integrity
  const contactIntegrity = evaluateContactIntegrity(doc);

  // 3. Evaluate Section Architecture & Hierarchy
  const sectionArchitecture = evaluateSectionArchitecture(rawTextForLayout, doc);

  // 4. Evaluate Formatting Guardrails
  const formattingGuardrails = evaluateFormattingGuardrails(rawTextForLayout);

  // 5. Evaluate References Preservation
  const referencesPreservation = evaluateReferencesPreservation(doc, rawTextForLayout);

  // 6. Compute 0-100 Score and Diagnostics
  return computeDiagnosticScore({
    metricSaturation,
    isMetricSaturationCompliant,
    contactIntegrity,
    sectionArchitecture,
    formattingGuardrails,
    referencesPreservation,
    lineByLineFeedback,
  });
}
```

---

### 4.4 API Integration Blueprint

#### `src/app/api/score/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { scoreCV, generateFallbackScore } from '@/lib/gemini';
import { auditCvQuality } from '@/lib/cvQualityEngine';

export async function POST(req: NextRequest) {
  // ... existing validation ...
  const trimmedCV = cvText.trim();
  const qualityAudit = auditCvQuality(trimmedCV);
  const scoreResult = await withTimeout(scoreCV(trimmedCV, trimmedJob), 16000);

  return NextResponse.json({
    success: true,
    result: {
      ...scoreResult,
      qualityAudit,
    },
    qualityAudit,
  });
}
```

#### `src/lib/cvSubmissionAgent.ts`
Update `auditCvForSubmission` and `ensureCvSubmissionReady` to directly consume `auditCvQuality(cv)`:
- Replace loose regexes with `qualityAudit.metricSaturation` and `qualityAudit.isMetricSaturationCompliant`.
- Leverage `qualityAudit.contactIntegrity` and `qualityAudit.referencesPreservation`.
- Synchronize readiness verdicts.

---

## 5. Verification Method

### 5.1 Independent File Inspection
1. Inspect `src/lib/cvStandardData.ts` lines 13–49 and 543–1105 to verify that `StandardCVDocument` and `parseUserCvToStandardDocument` match the structured schema utilized above.
2. Inspect `src/types/scoring.ts` lines 18–29 to confirm `ScoreResult` schema and extension point.
3. Inspect `src/lib/scoringEngine.ts` lines 96–127 to confirm existing regexes and where XYZ formula expands upon them.

### 5.2 Test Plan for Implementation
Once `src/lib/cvQualityEngine.ts` is implemented:
1. **Unit Test Suite**: `tests/unit/cvQualityEngine.test.ts`
   - Test 1: Standard CVs (`STANDARD_CV_ALEX`, `STANDARD_CV_DAVID`) pass with `isMetricSaturationCompliant === true` ($\ge 40\%$) and high quality score ($\ge 85$).
   - Test 2: Bullet points with duty statements (`"Responsible for daily server maintenance"`) fail XYZ compliance and return actionable rewrite recommendations.
   - Test 3: Bullet points with XYZ formula (`"Automated zero-touch provisioning with Jamf MDM, cutting deployment time by 68%"`) pass XYZ compliance.
   - Test 4: Missing contact information (e.g. empty phone, 4-digit phone, placeholder name `"John Doe"`, invalid email) correctly triggers `contactIntegrity.isValid === false` and lists specific issues.
   - Test 5: Section hierarchy inversions (e.g. Education preceding Experience, or Skills after References) flag `isHierarchyCompliant === false`.
   - Test 6: Markdown tables (`| Col 1 | Col 2 |`) or multi-column layouts flag `formattingGuardrails.isCompliant === false`.
   - Test 7: Empty or short string input gracefully returns score < 20 with descriptive critical issues.
   - Test 8: References preserved accurately without hallucination, and privacy declaration (`"References available upon request"`) correctly handled.
2. **Type Check Command**:
   ```pwsh
   npx tsc --noEmit
   ```
   Must pass with 0 type errors.
