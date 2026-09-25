/**
 * Tier 1: Feature Coverage Test Suite
 * Automated CV Quality & ATS Standards Engine
 *
 * Covers:
 * - Feature 8: XYZ Metric Saturation Engine (>=40% Saturation, Line-by-Line Feedback & Suggestions)
 * - Feature 9: Contact Integrity & Professional Data Validation (Name, Phone, Email, Location)
 * - Feature 10: ATS Section Architecture Hierarchy & References Preservation
 */

import { describe, it, expect } from 'vitest';
import {
  auditCvQuality,
  evaluateBulletPoint,
  evaluateActionVerb,
  evaluateQuantifiableMetric,
  evaluateBusinessOutcome,
  evaluateContactIntegrity,
  evaluateSectionArchitecture,
  evaluateReferencesPreservation,
  computeDiagnosticScore,
  CANONICAL_ATS_ORDER,
} from '@/lib/cvQualityEngine';
import type { StandardCVDocument } from '@/lib/cvStandardData';
import {
  HIGH_QUALITY_ATS_CV,
  LOW_QUALITY_NO_METRICS_CV,
  MISSING_CONTACT_CV,
  BROKEN_HIERARCHY_CV,
  BOUNDARY_39_METRIC_CV,
  BOUNDARY_40_METRIC_CV,
  MALFORMED_REFERENCES_CV,
  HIGH_QUALITY_RAW_CV_TEXT,
  LOW_QUALITY_RAW_CV_TEXT,
} from '../helpers/fixtures';

describe('Tier 1: Automated CV Quality & ATS Standards Engine', () => {
  // ==========================================================================
  // FEATURE 8: XYZ METRIC SATURATION ENGINE (>=40%)
  // ==========================================================================
  describe('Feature 8: XYZ Metric Saturation Engine (>=40%)', () => {
    it('8.1 High-quality CV with 100% XYZ bullets passes >=40% requirement with high score', () => {
      const result = auditCvQuality(HIGH_QUALITY_ATS_CV);

      expect(result.metricSaturation).toBeGreaterThanOrEqual(0.7);
      expect(result.isMetricSaturationCompliant).toBe(true);
      expect(result.overallScore).toBeGreaterThanOrEqual(80);
      expect(result.lineByLineFeedback.length).toBeGreaterThan(0);

      // Verify that all bullets in high quality CV are evaluated
      const compliantBullets = result.lineByLineFeedback.filter((b) => b.isXyzCompliant);
      expect(compliantBullets.length).toBeGreaterThanOrEqual(
        result.lineByLineFeedback.length * 0.7
      );
    });

    it('8.2 Low-quality CV with 0% metrics fails >=40% threshold and generates critical issues', () => {
      const result = auditCvQuality(LOW_QUALITY_NO_METRICS_CV);

      expect(result.metricSaturation).toBe(0);
      expect(result.isMetricSaturationCompliant).toBe(false);
      expect(result.criticalIssues.some((issue) => issue.includes('metric saturation'))).toBe(true);
      expect(result.actionableFixes.some((fix) => fix.includes('40%'))).toBe(true);
    });

    it('8.3 Boundary value 39% metric saturation fails >=40% threshold', () => {
      const result = auditCvQuality(BOUNDARY_39_METRIC_CV);

      expect(result.metricSaturation).toBeLessThan(0.4);
      expect(result.isMetricSaturationCompliant).toBe(false);
      expect(result.criticalIssues.some((issue) => issue.includes('metric saturation'))).toBe(true);
    });

    it('8.4 Boundary value 40% metric saturation passes >=40% threshold', () => {
      const result = auditCvQuality(BOUNDARY_40_METRIC_CV);

      expect(result.metricSaturation).toBe(0.4);
      expect(result.isMetricSaturationCompliant).toBe(true);
      expect(result.criticalIssues.some((issue) => issue.includes('metric saturation'))).toBe(false);
    });

    it('8.5 CV with 50% metric saturation passes >=40% threshold', () => {
      const cv50: StandardCVDocument = {
        ...HIGH_QUALITY_ATS_CV,
        id: 'cv_50_metrics',
        experience: [
          {
            title: 'Engineer',
            company: 'Tech Co',
            dates: '2022 - Present',
            bullets: [
              'Increased system throughput by 45% using Redis caching.', // Metric 1
              'Reduced query latency from 250ms to 40ms.', // Metric 2
              'Attended weekly engineering standup meetings.', // No metric
              'Assisted colleagues with pull request code reviews.', // No metric
            ],
          },
        ],
      };

      const result = auditCvQuality(cv50);
      expect(result.metricSaturation).toBe(0.5);
      expect(result.isMetricSaturationCompliant).toBe(true);
    });

    it('8.6 Excludes non-metric false positives like software versions and technical specs', () => {
      const bulletWithVersions =
        'Developed backend services using Python 3.10 and Windows 11 on Tier 2 network with IPv6 support.';
      const hasMetric = evaluateQuantifiableMetric(bulletWithVersions);

      // Software version numbers (3.10, 11, Tier 2, IPv6) should NOT be counted as quantifiable accomplishments
      expect(hasMetric).toBe(false);

      const bulletWithActualMetric =
        'Developed backend services using Python 3.10, reducing server memory usage by 35% across 400+ nodes.';
      expect(evaluateQuantifiableMetric(bulletWithActualMetric)).toBe(true);
    });

    it('8.7 Flags passive duty openings and requires strong active verbs', () => {
      const passive1 = evaluateActionVerb('Responsible for managing the team.');
      expect(passive1.hasActionVerb).toBe(false);
      expect(passive1.isPassive).toBe(true);

      const passive2 = evaluateActionVerb('Assisted with onboarding new hires.');
      expect(passive2.hasActionVerb).toBe(false);
      expect(passive2.isPassive).toBe(true);

      const active = evaluateActionVerb('Spearheaded the migration of 400+ endpoints.');
      expect(active.hasActionVerb).toBe(true);
      expect(active.isPassive).toBe(false);
      expect(active.verb).toBe('spearheaded');
    });

    it('8.8 Generates structured line-by-line feedback and actionable Google XYZ suggestions', () => {
      const weakBullet = 'Helped configure network routers around the office.';
      const evaluation = evaluateBulletPoint(weakBullet, 0);

      expect(evaluation.isXyzCompliant).toBe(false);
      expect(evaluation.hasQuantifiableMetric).toBe(false);
      expect(evaluation.hasActionVerb).toBe(false);
      expect(evaluation.feedback).toContain('Passive duty opening');
      expect(evaluation.suggestedRevision).toBeDefined();
      expect(evaluation.suggestedRevision).toContain('Spearheaded');
      expect(evaluation.suggestedRevision).toMatch(/\d+%/);
    });
  });

  // ==========================================================================
  // FEATURE 9: CONTACT INTEGRITY & PROFESSIONAL DATA VALIDATION
  // ==========================================================================
  describe('Feature 9: Contact Integrity & Professional Data Validation', () => {
    it('9.1 High quality candidate with full name, phone, email, and location passes contact integrity', () => {
      const report = evaluateContactIntegrity(HIGH_QUALITY_ATS_CV);

      expect(report.hasFullName).toBe(true);
      expect(report.hasPhoneNumber).toBe(true);
      expect(report.hasProfessionalEmail).toBe(true);
      expect(report.hasLocation).toBe(true);
      expect(report.isValid).toBe(true);
      expect(report.issues).toHaveLength(0);
    });

    it('9.2 Detects and flags placeholder names (Candidate Name, John Doe, Your Name)', () => {
      const placeholderNames = ['Candidate Name', 'John Doe', 'Jane Doe', 'Your Name Here', 'Resume Name'];

      for (const name of placeholderNames) {
        const doc: StandardCVDocument = {
          ...HIGH_QUALITY_ATS_CV,
          name,
        };
        const report = evaluateContactIntegrity(doc);
        expect(report.hasFullName).toBe(false);
        expect(report.isValid).toBe(false);
        expect(report.issues.some((i) => i.includes('Placeholder name'))).toBe(true);
      }
    });

    it('9.3 Single-word names fail full name validation (minimum 2 words required)', () => {
      const doc: StandardCVDocument = {
        ...HIGH_QUALITY_ATS_CV,
        name: 'Cher',
      };
      const report = evaluateContactIntegrity(doc);

      expect(report.hasFullName).toBe(false);
      expect(report.isValid).toBe(false);
      expect(report.issues.some((i) => i.includes('at least 2 words'))).toBe(true);
    });

    it('9.4 Validates ITU-T E.164 phone numbers (7 to 15 digits)', () => {
      // 7 digits (local standard)
      const doc7: StandardCVDocument = {
        ...HIGH_QUALITY_ATS_CV,
        contact: { ...HIGH_QUALITY_ATS_CV.contact, phone: '+1 555-1234' }, // 7 digits
      };
      expect(evaluateContactIntegrity(doc7).hasPhoneNumber).toBe(true);

      // 10 digits (US standard)
      const doc10: StandardCVDocument = {
        ...HIGH_QUALITY_ATS_CV,
        contact: { ...HIGH_QUALITY_ATS_CV.contact, phone: '+1 (555) 234-5678' }, // 10 digits
      };
      expect(evaluateContactIntegrity(doc10).hasPhoneNumber).toBe(true);

      // 15 digits (International max E.164)
      const doc15: StandardCVDocument = {
        ...HIGH_QUALITY_ATS_CV,
        contact: { ...HIGH_QUALITY_ATS_CV.contact, phone: '+44 20 7946 0912345' }, // 15 digits
      };
      expect(evaluateContactIntegrity(doc15).hasPhoneNumber).toBe(true);
    });

    it('9.5 Flags invalid phone number lengths (<7 digits or >15 digits)', () => {
      const docShort: StandardCVDocument = {
        ...HIGH_QUALITY_ATS_CV,
        contact: { ...HIGH_QUALITY_ATS_CV.contact, phone: '12345' }, // 5 digits
      };
      const reportShort = evaluateContactIntegrity(docShort);
      expect(reportShort.hasPhoneNumber).toBe(false);
      expect(reportShort.issues.some((i) => i.includes('between 7 and 15 digits'))).toBe(true);

      const docLong: StandardCVDocument = {
        ...HIGH_QUALITY_ATS_CV,
        contact: { ...HIGH_QUALITY_ATS_CV.contact, phone: '12345678901234567' }, // 17 digits
      };
      const reportLong = evaluateContactIntegrity(docLong);
      expect(reportLong.hasPhoneNumber).toBe(false);
      expect(reportLong.issues.some((i) => i.includes('between 7 and 15 digits'))).toBe(true);
    });

    it('9.6 Flags dummy or repetitive phone numbers (0000000, 1234567, 555-0100)', () => {
      const dummyPhones = ['000-000-0000', '1234567', '555-0199', '9999999999'];

      for (const phone of dummyPhones) {
        const doc: StandardCVDocument = {
          ...HIGH_QUALITY_ATS_CV,
          contact: { ...HIGH_QUALITY_ATS_CV.contact, phone },
        };
        const report = evaluateContactIntegrity(doc);
        expect(report.hasPhoneNumber).toBe(false);
        expect(report.issues.some((i) => i.includes('Placeholder or invalid dummy phone'))).toBe(true);
      }
    });

    it('9.7 Professional email validation enforces RFC syntax and bans dummy placeholder domains', () => {
      // Valid RFC email
      const docValid: StandardCVDocument = {
        ...HIGH_QUALITY_ATS_CV,
        contact: { ...HIGH_QUALITY_ATS_CV.contact, email: 'alex.lead@techops.org' },
      };
      expect(evaluateContactIntegrity(docValid).hasProfessionalEmail).toBe(true);

      // Dummy domains (example.com, test.com, placeholder.com)
      const dummyEmails = ['user@example.com', 'test@test.com', 'candidate@company.com', 'email@sample.com'];
      for (const email of dummyEmails) {
        const doc: StandardCVDocument = {
          ...HIGH_QUALITY_ATS_CV,
          contact: { ...HIGH_QUALITY_ATS_CV.contact, email },
        };
        const report = evaluateContactIntegrity(doc);
        expect(report.hasProfessionalEmail).toBe(false);
        expect(report.issues.some((i) => i.includes('Dummy or placeholder email'))).toBe(true);
      }
    });

    it('9.8 Flags missing or placeholder locations (City, State, Anytown, too brief)', () => {
      const dummyLocations = ['', 'NY', 'City, State', 'Anytown', 'Location Here', 'TBD'];

      for (const location of dummyLocations) {
        const doc: StandardCVDocument = {
          ...HIGH_QUALITY_ATS_CV,
          contact: { ...HIGH_QUALITY_ATS_CV.contact, location },
        };
        const report = evaluateContactIntegrity(doc);
        expect(report.hasLocation).toBe(false);
      }
    });
  });

  // ==========================================================================
  // FEATURE 10: ATS SECTION HIERARCHY & REFERENCES PRESERVATION
  // ==========================================================================
  describe('Feature 10: ATS Section Architecture Hierarchy & References Preservation', () => {
    it('10.1 Canonical ATS section hierarchy (Summary -> Skills Grid -> Experience -> Education -> References) passes', () => {
      const report = evaluateSectionArchitecture(HIGH_QUALITY_RAW_CV_TEXT, HIGH_QUALITY_ATS_CV);

      expect(report.isHierarchyCompliant).toBe(true);
      expect(report.hierarchyIssues).toHaveLength(0);
      expect(report.detectedSections).toContain('Summary');
      expect(report.detectedSections).toContain('Skills Grid');
      expect(report.detectedSections).toContain('Experience');
      expect(report.detectedSections).toContain('Education');
      expect(report.detectedSections).toContain('References');
    });

    it('10.2 Flags out-of-order section hierarchy (Experience placed before Skills Grid)', () => {
      const outOfOrderRawText = `
ALEX MORGAN
alex.morgan@executivemail.com | +1 (555) 234-5678

PROFESSIONAL SUMMARY
Experienced leader in IT operations.

PROFESSIONAL EXPERIENCE
Senior IT Lead | NexaCloud
- Spearheaded Tier 1 operations.

CORE SKILLS
- AWS, Azure, Python

EDUCATION
- B.S. IT | GIT | 2020

REFERENCES
- Sarah Jenkins | NexaCloud
`.trim();

      const report = evaluateSectionArchitecture(outOfOrderRawText, HIGH_QUALITY_ATS_CV);

      expect(report.isHierarchyCompliant).toBe(false);
      expect(report.hierarchyIssues.some((i) => i.includes('appears before'))).toBe(true);
    });

    it('10.3 Detects and flags missing mandatory sections in broken hierarchy document', () => {
      const report = evaluateSectionArchitecture('', BROKEN_HIERARCHY_CV);

      expect(report.isHierarchyCompliant).toBe(false);
      expect(report.hierarchyIssues.some((i) => i.includes("Missing mandatory section: 'Summary'"))).toBe(true);
      expect(report.hierarchyIssues.some((i) => i.includes("Missing mandatory section: 'Skills Grid'"))).toBe(true);
    });

    it('10.4 Genuine candidate references are preserved without hallucination', () => {
      const report = evaluateReferencesPreservation(HIGH_QUALITY_ATS_CV);

      expect(report.hasReferences).toBe(true);
      expect(report.referencesCount).toBe(2);
      expect(report.isPreservedWithoutHallucination).toBe(true);
      expect(report.issues).toHaveLength(0);
    });

    it('10.5 Professional privacy declaration (References available upon request) passes without hallucination', () => {
      const cvWithDeclaration: StandardCVDocument = {
        ...HIGH_QUALITY_ATS_CV,
        references: [],
        additionalInfo: {
          references: 'References available upon request.',
        },
      };

      const report = evaluateReferencesPreservation(cvWithDeclaration);

      expect(report.hasReferences).toBe(true);
      expect(report.referencesCount).toBe(0);
      expect(report.isPreservedWithoutHallucination).toBe(true);
      expect(report.issues).toHaveLength(0);
    });

    it('10.6 Flags placeholder referee names (Available Upon Request, Referee 1) as hallucination', () => {
      const report = evaluateReferencesPreservation(MALFORMED_REFERENCES_CV);

      expect(report.isPreservedWithoutHallucination).toBe(false);
      expect(report.issues.some((i) => i.includes('placeholder or invalid name'))).toBe(true);
    });

    it('10.7 Submission readiness: isSubmissionReady is true ONLY when overallScore >= 75 and all benchmarks pass', () => {
      const validResult = auditCvQuality(HIGH_QUALITY_ATS_CV);
      expect(validResult.overallScore).toBeGreaterThanOrEqual(75);
      expect(validResult.isSubmissionReady).toBe(true);
      expect(validResult.criticalIssues).toHaveLength(0);

      const invalidResult = auditCvQuality(LOW_QUALITY_NO_METRICS_CV);
      expect(invalidResult.isSubmissionReady).toBe(false);
      expect(invalidResult.criticalIssues.length).toBeGreaterThan(0);

      const missingContactResult = auditCvQuality(MISSING_CONTACT_CV);
      expect(missingContactResult.isSubmissionReady).toBe(false);
    });
  });
});
