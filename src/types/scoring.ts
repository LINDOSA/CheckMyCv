export interface CategoryScore {
  key: 'keyword' | 'ats' | 'achievement' | 'relevance' | 'skills';
  name: string;
  score: number; // 0-100
  weight: number; // e.g. 30, 20, 20, 20, 10
  status: 'critical' | 'warning' | 'good' | 'excellent';
  detail: string; // Coaching observation
  bullet_examples?: string[];
}

export interface TopIssue {
  category_key: 'keyword' | 'ats' | 'achievement' | 'relevance' | 'skills';
  issue: string; // Coaching headline
  detail: string; // Why recruiters care
  fix: string; // Actionable coaching guidance to resolve
}

export interface ScoreResult {
  overall_score: number; // 0-100
  headline: string;
  is_general_health: boolean; // true if scored without job advert
  target_role_detected?: string;
  benchmark_percentile: number; // e.g. 64%
  benchmark_text: string; // "You scored higher than 64% of IT Support applicants worldwide"
  categories: CategoryScore[];
  top_issues: TopIssue[];
  strengths: string[];
  quick_wins: string[];
  qualityAudit?: QualityAuditResult;
}

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

export interface CVProfile {
  personal: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    languages?: string[];
  };
  summary?: string;
  experience?: Array<{
    title: string;
    employer: string;
    start_date?: string;
    end_date?: string;
    bullets: string[];
  }>;
  education?: Array<{
    qualification: string;
    institution: string;
    year?: string;
  }>;
  certifications?: Array<{
    name: string;
    issuer?: string;
    year?: string;
  }>;
  skills?: string[];
}

export interface JobAdvert {
  title?: string;
  raw_text: string;
  extracted_keywords?: string[];
  required_skills?: string[];
  seniority_level?: string;
}

export interface ParseFileResponse {
  success: boolean;
  fileName: string;
  fileType: string;
  text: string;
  wordCount: number;
  error?: string;
}
