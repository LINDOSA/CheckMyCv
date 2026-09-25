# Scope: Milestone 3 — Automated CV Quality & Professional Standards Engine

## Architecture
Milestone 3 establishes a deterministic, high-precision CV Quality & Professional Standards Engine in `src/lib/cvQualityEngine.ts`, updates `src/lib/docxGenerator.ts` and creates `src/lib/pdfGenerator.ts` to strictly enforce single-column ATS layouts, and integrates diagnostic scoring into `src/app/api/score/route.ts` and `src/types/scoring.ts`.

```
Candidate CV (StandardCVDocument | string)
   │
   ▼
[ cvQualityEngine.ts ]
   ├── 1. Impact Density Analyzer (Action Verbs + Metrics + Outcomes, >=40% Saturation)
   ├── 2. Contact Integrity Validator (Full Name, Phone 7-15 digits, Email, Location)
   ├── 3. Section Architecture Validator (Summary -> Skills Grid -> Experience -> Education -> References)
   ├── 4. Formatting Guardrail Inspector (Single-column, zero multi-cell tables, no text boxes/graphics)
   ├── 5. References Preservation Checker (Preserve original references, no hallucinations)
   └── 6. Diagnostic Scorer (0-100 score + line-by-line feedback with actionable fixes)
   │
   ├──► Diagnostic API: /api/score (and cvSubmissionAgent.ts)
   └──► Document Generators:
          ├── docxGenerator.ts (strictly single-column ATS DOCX, linear layout)
          └── pdfGenerator.ts (strictly single-column native text ATS PDF)
```

## Feature Inventory (Milestone 3 Scope)
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 11 | XYZ Metric Saturation Engine | Bullet point parsing for Action Verb + Quantifiable Metric + Business Outcome, >=40% saturation | M3 | ORIGINAL_REQUEST R2, AC |
| 12 | Contact Integrity Validation | Validates full name (non-placeholder), phone (7-15 digits), professional email, location | M3 | ORIGINAL_REQUEST R2, AC |
| 13 | Section Architecture ATS Hierarchy | Enforces Summary -> Skills Grid -> Experience -> Education -> References | M3 | ORIGINAL_REQUEST R2, AC |
| 14 | Formatting Guardrails (Single-Column) | Linear ATS layout in DOCX and PDF; removes multi-cell tables, text boxes, graphics | M3 | ORIGINAL_REQUEST R2, AC |
| 15 | References Preservation & Privacy | Preserves candidate references without hallucinated data or privacy violations | M3 | ORIGINAL_REQUEST R2, AC |
| 16 | Structured Diagnostic Scoring (0-100) | 0-100 scoring with line-by-line feedback array and actionable rewrite fixes | M3 | ORIGINAL_REQUEST R2, AC |

## Milestones & Work Breakdown
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M3.1 | CV Quality Engine Core | `src/lib/cvQualityEngine.ts` with XYZ formula analyzer, metric saturation, contact integrity, section hierarchy, formatting guardrails, references preservation, diagnostic scoring | none | IN_PROGRESS |
| M3.2 | Single-Column Document Generators | `src/lib/docxGenerator.ts` (single-column ATS) & `src/lib/pdfGenerator.ts` (native text single-column ATS) | M3.1 | PLANNED |
| M3.3 | Scoring API & Agent Integration | `src/types/scoring.ts`, `src/app/api/score/route.ts`, and `src/lib/cvSubmissionAgent.ts` | M3.1 | PLANNED |
| M3.4 | Unit Tests Verification | Comprehensive unit tests for all quality engine rules and doc generators | M3.1, M3.2, M3.3 | PLANNED |

## Interface Contracts

### CV Quality & Standards Engine Contract (`src/lib/cvQualityEngine.ts`)
```typescript
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

export function auditCvQuality(cv: any): QualityAuditResult;
```

## Write Ownership
Milestone 3 exclusive file ownership:
- `src/lib/cvQualityEngine.ts`
- `src/lib/docxGenerator.ts`
- `src/lib/pdfGenerator.ts`
- `src/app/api/score/route.ts`
- `src/types/scoring.ts`
- `src/lib/cvSubmissionAgent.ts`
- `tests/unit/cvQualityEngine.test.ts` (and related M3 tests)
