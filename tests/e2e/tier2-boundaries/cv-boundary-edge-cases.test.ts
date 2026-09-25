/**
 * Tier 2 Boundary & Corner Cases: CV Quality & ATS Standards Engine
 *
 * Exhaustively verifies boundary conditions, edge cases, negative inputs,
 * metric saturation thresholds (39% vs 40% vs 41%), extreme 0% vs 100%,
 * empty string handling, unicode/emojis, phone number ITU-T E.164 boundary lengths,
 * international phones, malformed emails, placeholder detection, reversed section hierarchy,
 * duplicate section headers, and references preservation.
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
  evaluateFormattingGuardrails,
  evaluateReferencesPreservation,
  computeDiagnosticScore,
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
} from '../helpers/fixtures';

describe('Tier 2: CV Boundary & Edge Cases Test Suite', () => {
  // ==========================================================================
  // 1. EXACT BOUNDARY METRIC SATURATION: 39% (FAIL) vs 40% (PASS) vs 41% (PASS)
  // ==========================================================================
  describe('Metric Saturation Boundary Threshold (>= 40%)', () => {
    it('fails metric compliance when saturation is exactly 39% (< 40%)', () => {
      // Construct CV with exactly 39% metric saturation (39 quantified, 61 unquantified out of 100)
      const bullets39: string[] = [
        ...Array.from({ length: 39 }, (_, i) =>
          `Spearheaded cloud initiative #${i + 1}, reducing infrastructure spend by 25% across 100 servers.`
        ),
        ...Array.from({ length: 61 }, (_, i) =>
          `Assisted team members with routine internal documentation and general tasks #${i + 1}.`
        ),
      ];

      const cv39: StandardCVDocument = {
        ...HIGH_QUALITY_ATS_CV,
        id: 'boundary_39_test_doc',
        experience: [
          {
            title: 'Lead Systems Engineer',
            company: 'ScaleCo',
            dates: '2022 - Present',
            bullets: bullets39,
          },
        ],
      };

      const audit = auditCvQuality(cv39);
      expect(audit.metricSaturation).toBe(0.39);
      expect(audit.isMetricSaturationCompliant).toBe(false);
      expect(audit.criticalIssues.some((issue) => issue.includes('39%'))).toBe(true);
      expect(audit.isSubmissionReady).toBe(false);
    });

    it('passes metric compliance when saturation is exactly 40% (>= 40%)', () => {
      // 2 quantified bullets out of 5 total = exactly 40.0%
      const cv40: StandardCVDocument = {
        ...BOUNDARY_40_METRIC_CV,
      };

      const audit = auditCvQuality(cv40);
      expect(audit.metricSaturation).toBe(0.4);
      expect(audit.isMetricSaturationCompliant).toBe(true);
      expect(audit.criticalIssues.some((issue) => issue.includes('Low metric saturation'))).toBe(false);
    });

    it('passes metric compliance when saturation is 41% (> 40%)', () => {
      // 41 quantified bullets out of 100 = exactly 41.0%
      const bullets41: string[] = [
        ...Array.from({ length: 41 }, (_, i) =>
          `Automated deployment pipeline #${i + 1}, cutting release cycle by 35% across 50 nodes.`
        ),
        ...Array.from({ length: 59 }, (_, i) =>
          `Supported daily operational syncs and regular standups with engineers #${i + 1}.`
        ),
      ];

      const cv41: StandardCVDocument = {
        ...HIGH_QUALITY_ATS_CV,
        id: 'boundary_41_test_doc',
        experience: [
          {
            title: 'Infrastructure Specialist',
            company: 'TechCorp',
            dates: '2021 - Present',
            bullets: bullets41,
          },
        ],
      };

      const audit = auditCvQuality(cv41);
      expect(audit.metricSaturation).toBe(0.41);
      expect(audit.isMetricSaturationCompliant).toBe(true);
    });

    it('validates BOUNDARY_39_METRIC_CV fixture fails compliance', () => {
      const audit = auditCvQuality(BOUNDARY_39_METRIC_CV);
      expect(audit.metricSaturation).toBeLessThan(0.4);
      expect(audit.isMetricSaturationCompliant).toBe(false);
    });

    it('validates BOUNDARY_40_METRIC_CV fixture meets threshold exactly', () => {
      const audit = auditCvQuality(BOUNDARY_40_METRIC_CV);
      expect(audit.metricSaturation).toBeGreaterThanOrEqual(0.4);
      expect(audit.isMetricSaturationCompliant).toBe(true);
    });
  });

  // ==========================================================================
  // 2. EXTREME METRIC SATURATION: 0% VS 100%
  // ==========================================================================
  describe('Extreme Metric Saturation (0% vs 100%)', () => {
    it('accurately scores extreme 0% metric saturation on generic duty CV', () => {
      const audit = auditCvQuality(LOW_QUALITY_NO_METRICS_CV);
      expect(audit.metricSaturation).toBe(0);
      expect(audit.isMetricSaturationCompliant).toBe(false);
      expect(audit.lineByLineFeedback.every((b) => !b.hasQuantifiableMetric)).toBe(true);
      expect(audit.overallScore).toBeLessThan(65);
    });

    it('accurately scores extreme 100% metric saturation where all bullets have quantifiable metrics', () => {
      const cv100: StandardCVDocument = {
        ...HIGH_QUALITY_ATS_CV,
        experience: [
          {
            title: 'Lead Reliability Architect',
            company: 'Global FinTech',
            dates: '2022 - Present',
            bullets: [
              'Spearheaded global microservices migration across 450+ containers, achieving 99.99% uptime SLA.',
              'Engineered automated database sharding that decreased p99 query latency from 320ms to 45ms.',
              'Negotiated AWS Enterprise Discount Program saving $180,000 annually across 12 production accounts.',
              'Mentored 18 junior cloud engineers, reducing onboarding time by 45% and achieving 100% retention.',
            ],
          },
        ],
      };

      const audit = auditCvQuality(cv100);
      expect(audit.metricSaturation).toBe(1.0);
      expect(audit.isMetricSaturationCompliant).toBe(true);
      expect(audit.lineByLineFeedback.every((b) => b.hasQuantifiableMetric)).toBe(true);
    });
  });

  // ==========================================================================
  // 3. EMPTY CV INPUT & MINIMAL STRING HANDLING
  // ==========================================================================
  describe('Empty CV Input & Minimal Text Handling', () => {
    it('handles empty string gracefully without throwing or NaN', () => {
      const audit = auditCvQuality('');
      expect(audit.overallScore).toBeLessThanOrEqual(15);
      expect(audit.isSubmissionReady).toBe(false);
      expect(audit.criticalIssues.length).toBeGreaterThan(0);
      expect(audit.metricSaturation).toBe(0);
      expect(Number.isNaN(audit.overallScore)).toBe(false);
    });

    it('handles whitespace-only text gracefully', () => {
      const audit = auditCvQuality('   \n\t\n   ');
      expect(audit.overallScore).toBeLessThanOrEqual(15);
      expect(audit.isSubmissionReady).toBe(false);
    });

    it('handles short text under 20 characters gracefully', () => {
      const audit = auditCvQuality('CV of Developer');
      expect(audit.overallScore).toBeLessThanOrEqual(15);
      expect(audit.criticalIssues.some((issue) => issue.includes('insufficient text'))).toBe(true);
    });

    it('handles structured CV object with all empty fields without runtime exceptions', () => {
      const emptyDoc: StandardCVDocument = {
        id: 'empty_doc',
        name: '',
        title: '',
        contact: { email: '', phone: '', location: '' },
        summary: '',
        skillsGrid: [],
        experience: [],
        education: [],
        references: [],
      };

      const audit = auditCvQuality(emptyDoc);
      expect(audit.overallScore).toBeLessThan(40);
      expect(audit.contactIntegrity.isValid).toBe(false);
      expect(audit.isSubmissionReady).toBe(false);
      expect(audit.metricSaturation).toBe(0);
    });
  });

  // ==========================================================================
  // 4. SINGLE-WORD BULLETS VS EXTREMELY LONG (>200 WORDS) BULLETS
  // ==========================================================================
  describe('Bullet Length Boundaries: Single-Word vs >200 Words', () => {
    it('flags single-word bullets ("Managed.", "Helped.") as non-compliant and duty-like', () => {
      const b1 = evaluateBulletPoint('Managed.', 0);
      expect(b1.hasQuantifiableMetric).toBe(false);
      expect(b1.hasBusinessOutcome).toBe(false);
      expect(b1.isXyzCompliant).toBe(false);
      expect(b1.suggestedRevision).toBeDefined();

      const b2 = evaluateBulletPoint('Helped.', 1);
      expect(b2.hasActionVerb).toBe(false); // "Helped" is in passive duty regex
      expect(b2.isXyzCompliant).toBe(false);
    });

    it('processes extremely long bullet (>200 words) without stack overflow or catastrophic regex backtracking', () => {
      const longText =
        'Spearheaded cross-functional enterprise architecture redesign ' +
        'incorporating advanced zero-trust perimeter defenses and multi-cloud resilience across North American data centers '.repeat(
          15
        ) +
        'resulting in a 42% reduction in unauthenticated access attempts and saving $250,000 annually across 12 business units.';

      const words = longText.split(/\s+/).length;
      expect(words).toBeGreaterThan(200);

      const startTime = Date.now();
      const evaluation = evaluateBulletPoint(longText, 0);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100); // Execution must be near-instant, verifying no ReDoS
      expect(evaluation.hasActionVerb).toBe(true);
      expect(evaluation.hasQuantifiableMetric).toBe(true);
      expect(evaluation.hasBusinessOutcome).toBe(true);
      expect(evaluation.isXyzCompliant).toBe(true);
    });
  });

  // ==========================================================================
  // 5. UNICODE, EMOJIS, AND SPECIAL CHARACTERS
  // ==========================================================================
  describe('Unicode, Emojis, and Special Characters in CV Text', () => {
    it('correctly extracts metrics and verbs from bullets containing emojis', () => {
      const emojiBullet =
        '🚀 Spearheaded cloud containerization 💻 cutting deployment time by 48% across 120 nodes 🔥';
      const evaluation = evaluateBulletPoint(emojiBullet, 0);

      expect(evaluation.hasQuantifiableMetric).toBe(true);
      expect(evaluation.hasActionVerb).toBe(true);
    });

    it('handles accented candidate names and European locations without character corruption', () => {
      const accentedCv: StandardCVDocument = {
        ...HIGH_QUALITY_ATS_CV,
        name: 'José François González',
        contact: {
          ...HIGH_QUALITY_ATS_CV.contact,
          location: 'Genève, Switzerland / München, Germany',
        },
      };

      const contact = evaluateContactIntegrity(accentedCv);
      expect(contact.hasFullName).toBe(true);
      expect(contact.candidateName).toBe('José François González');
      expect(contact.hasLocation).toBe(true);
      expect(contact.location).toContain('Genève');
    });

    it('detects multiple international currencies (€, £, ¥, R) as valid quantifiable metrics', () => {
      expect(evaluateQuantifiableMetric('Delivered €450,000 in operational cost reductions')).toBe(true);
      expect(evaluateQuantifiableMetric('Generated £1.2M in recurring software subscription revenue')).toBe(true);
      expect(evaluateQuantifiableMetric('Reduced procurement overhead by R850,000 across regional suppliers')).toBe(true);
      expect(evaluateQuantifiableMetric('Secured contracts valued at ¥25,000,000 across Tokyo branches')).toBe(true);
    });
  });

  // ==========================================================================
  // 6. BOUNDARY PHONE NUMBERS (ITU-T E.164: 7 TO 15 DIGITS)
  // ==========================================================================
  describe('Boundary Phone Number Lengths (ITU-T E.164 Standard)', () => {
    it('fails when phone has 6 digits (boundary too short: 6 < 7)', () => {
      const cv: StandardCVDocument = {
        ...HIGH_QUALITY_ATS_CV,
        contact: { ...HIGH_QUALITY_ATS_CV.contact, phone: '834-291' }, // 6 digits
      };
      const contact = evaluateContactIntegrity(cv);
      expect(contact.hasPhoneNumber).toBe(false);
      expect(contact.issues.some((i) => i.includes('7 and 15 digits'))).toBe(true);
    });

    it('passes when phone has exactly 7 digits (boundary lower limit: 7 digits)', () => {
      const cv: StandardCVDocument = {
        ...HIGH_QUALITY_ATS_CV,
        contact: { ...HIGH_QUALITY_ATS_CV.contact, phone: '834-2915' }, // 7 non-dummy digits
      };
      const contact = evaluateContactIntegrity(cv);
      expect(contact.hasPhoneNumber).toBe(true);
    });

    it('passes when phone has exactly 15 digits (boundary upper limit: 15 digits)', () => {
      const cv: StandardCVDocument = {
        ...HIGH_QUALITY_ATS_CV,
        contact: { ...HIGH_QUALITY_ATS_CV.contact, phone: '+123456789012345' }, // 15 digits
      };
      const contact = evaluateContactIntegrity(cv);
      expect(contact.hasPhoneNumber).toBe(true);
    });

    it('fails when phone has 16 digits (boundary too long: 16 > 15)', () => {
      const cv: StandardCVDocument = {
        ...HIGH_QUALITY_ATS_CV,
        contact: { ...HIGH_QUALITY_ATS_CV.contact, phone: '+1234567890123456' }, // 16 digits
      };
      const contact = evaluateContactIntegrity(cv);
      expect(contact.hasPhoneNumber).toBe(false);
      expect(contact.issues.some((i) => i.includes('7 and 15 digits'))).toBe(true);
    });
  });

  // ==========================================================================
  // 7. INTERNATIONAL PHONE NUMBER FORMATS & DUMMY PHONE REJECTION
  // ==========================================================================
  describe('International Phone Formats & Dummy Phone Rejection', () => {
    it('accepts valid UK international phone format (+44 20 7946 0958)', () => {
      const cv: StandardCVDocument = {
        ...HIGH_QUALITY_ATS_CV,
        contact: { ...HIGH_QUALITY_ATS_CV.contact, phone: '+44 20 7946 0958' },
      };
      const contact = evaluateContactIntegrity(cv);
      expect(contact.hasPhoneNumber).toBe(true);
    });

    it('accepts valid German international phone format (+49 30 1234567)', () => {
      const cv: StandardCVDocument = {
        ...HIGH_QUALITY_ATS_CV,
        contact: { ...HIGH_QUALITY_ATS_CV.contact, phone: '+49 30 1234567' },
      };
      const contact = evaluateContactIntegrity(cv);
      expect(contact.hasPhoneNumber).toBe(true);
    });

    it('rejects dummy repetitive phone numbers like "000-000-0000" and "1111111"', () => {
      const cv: StandardCVDocument = {
        ...HIGH_QUALITY_ATS_CV,
        contact: { ...HIGH_QUALITY_ATS_CV.contact, phone: '000-000-0000' },
      };
      const contact = evaluateContactIntegrity(cv);
      expect(contact.hasPhoneNumber).toBe(false);
      expect(contact.issues.some((i) => i.includes('dummy'))).toBe(true);
    });

    it('rejects sequential phone numbers like "123456789"', () => {
      const cv: StandardCVDocument = {
        ...HIGH_QUALITY_ATS_CV,
        contact: { ...HIGH_QUALITY_ATS_CV.contact, phone: '123456789' },
      };
      const contact = evaluateContactIntegrity(cv);
      expect(contact.hasPhoneNumber).toBe(false);
    });
  });

  // ==========================================================================
  // 8. MALFORMED & PLACEHOLDER EMAIL ADDRESSES
  // ==========================================================================
  describe('Malformed and Placeholder Email Addresses', () => {
    const MALFORMED_EMAILS = [
      'candidate@',
      '@domain.com',
      'candidate@domain',
      'candidate@.com',
      'user name@domain.com',
      'user@domain..com',
      'candidate',
    ];

    it.each(MALFORMED_EMAILS)('rejects non-RFC malformed email "%s"', (badEmail) => {
      const cv: StandardCVDocument = {
        ...HIGH_QUALITY_ATS_CV,
        contact: { ...HIGH_QUALITY_ATS_CV.contact, email: badEmail },
      };
      const contact = evaluateContactIntegrity(cv);
      expect(contact.hasProfessionalEmail).toBe(false);
    });

    const PLACEHOLDER_EMAILS = [
      'email@example.com',
      'candidate@sample.com',
      'test@test.com',
      'john.doe@company.com',
      'youremail@domain.com',
    ];

    it.each(PLACEHOLDER_EMAILS)('rejects generic placeholder email "%s"', (dummyEmail) => {
      const cv: StandardCVDocument = {
        ...HIGH_QUALITY_ATS_CV,
        contact: { ...HIGH_QUALITY_ATS_CV.contact, email: dummyEmail },
      };
      const contact = evaluateContactIntegrity(cv);
      expect(contact.hasProfessionalEmail).toBe(false);
      expect(contact.issues.some((i) => i.includes('Dummy or placeholder email'))).toBe(true);
    });
  });

  // ==========================================================================
  // 9. PLACEHOLDER CANDIDATE NAMES
  // ==========================================================================
  describe('Placeholder & Invalid Candidate Names', () => {
    const PLACEHOLDER_NAMES = [
      'Candidate Name',
      'John Doe',
      'Jane Doe',
      'Your Name Here',
      'Full Name',
      'Curriculum Vitae',
      'Resume Profile',
    ];

    it.each(PLACEHOLDER_NAMES)('flags placeholder candidate name "%s"', (placeholder) => {
      const cv: StandardCVDocument = {
        ...HIGH_QUALITY_ATS_CV,
        name: placeholder,
      };
      const contact = evaluateContactIntegrity(cv);
      expect(contact.hasFullName).toBe(false);
      expect(contact.issues.some((i) => i.includes('Placeholder name'))).toBe(true);
    });

    it('rejects single-word name ("Alex") requiring at least first and last name', () => {
      const cv: StandardCVDocument = {
        ...HIGH_QUALITY_ATS_CV,
        name: 'Alex',
      };
      const contact = evaluateContactIntegrity(cv);
      expect(contact.hasFullName).toBe(false);
      expect(contact.issues.some((i) => i.includes('at least 2 words'))).toBe(true);
    });

    it('rejects names with numbers or special symbols ("Alex 123 Morgan")', () => {
      const cv: StandardCVDocument = {
        ...HIGH_QUALITY_ATS_CV,
        name: 'Alex 123 Morgan',
      };
      const contact = evaluateContactIntegrity(cv);
      expect(contact.hasFullName).toBe(false);
    });
  });

  // ==========================================================================
  // 10. REVERSED SECTION ORDER DETECTION
  // ==========================================================================
  describe('Section Architecture & Order Hierarchy', () => {
    it('detects completely reversed section hierarchy (References first, Summary last)', () => {
      const reversedCvText = `
ALEX MORGAN
alex.morgan@executivemail.com | +1 (555) 234-5678 | New York, NY

PROFESSIONAL REFERENCES
- Sarah Jenkins, VP of Technology | +1 (555) 876-5432

EDUCATION
- B.S. in Computer Science | Global Institute of Technology | 2020

PROFESSIONAL EXPERIENCE
Senior IT Lead | NexaCloud | 2022 - Present
- Spearheaded 45+ migrations cutting costs by 34%.

CORE SKILLS
- Cloud: AWS, Azure, Intune, Active Directory

PROFESSIONAL SUMMARY
Results-driven Senior IT Lead with 5+ years of experience directing service operations.
      `.trim();

      const report = evaluateSectionArchitecture(reversedCvText, HIGH_QUALITY_ATS_CV);
      expect(report.isHierarchyCompliant).toBe(false);
      expect(report.hierarchyIssues.length).toBeGreaterThan(0);
      expect(report.hierarchyIssues.some((issue) => issue.includes('References'))).toBe(true);
    });

    it('flags broken hierarchy when summary or skills grid is missing from structured CV', () => {
      const audit = auditCvQuality(BROKEN_HIERARCHY_CV);
      expect(audit.sectionArchitecture.isHierarchyCompliant).toBe(false);
      expect(audit.sectionArchitecture.hierarchyIssues.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // 11. DUPLICATE SECTION HEADERS
  // ==========================================================================
  describe('Duplicate Section Headers Handling', () => {
    it('handles duplicate section headers gracefully without crashing or duplicating keys', () => {
      const duplicateHeadersText = `
ALEX MORGAN
alex.morgan@executivemail.com | +1 (555) 234-5678 | New York, NY

PROFESSIONAL SUMMARY
Executive IT leader with 10 years experience.

CORE SKILLS
Cloud Architecture, Intune, PowerShell

PROFESSIONAL EXPERIENCE
Role 1 | Company A | 2022 - Present
- Delivered 35% performance improvement across 100 systems.

PROFESSIONAL EXPERIENCE
Role 2 | Company B | 2020 - 2022
- Maintained 99.9% uptime for 50 servers.

EDUCATION
B.S. in IT | 2020

PROFESSIONAL REFERENCES
References available upon request.
      `.trim();

      const audit = auditCvQuality(duplicateHeadersText);
      expect(audit.sectionArchitecture.detectedSections).toContain('Experience');
      expect(Number.isNaN(audit.overallScore)).toBe(false);
    });
  });

  // ==========================================================================
  // 12. PROFESSIONAL REFERENCES: ANONYMOUS VS PLACEHOLDER VS VERIFIED
  // ==========================================================================
  describe('Professional References Preservation & Privacy Standards', () => {
    it('accepts standard privacy declaration "References available upon request" as compliant', () => {
      const cvWithDeclaration: StandardCVDocument = {
        ...HIGH_QUALITY_ATS_CV,
        references: [],
        additionalInfo: {
          references: 'Professional references available upon request.',
        },
      };

      const refReport = evaluateReferencesPreservation(cvWithDeclaration);
      expect(refReport.hasReferences).toBe(true);
      expect(refReport.isPreservedWithoutHallucination).toBe(true);
      expect(refReport.issues.length).toBe(0);
    });

    it('flags MALFORMED_REFERENCES_CV where placeholder "Available Upon Request" is entered as a referee name', () => {
      const refReport = evaluateReferencesPreservation(MALFORMED_REFERENCES_CV);
      expect(refReport.isPreservedWithoutHallucination).toBe(false);
      expect(refReport.issues.some((i) => i.includes('placeholder or invalid name'))).toBe(true);
    });

    it('flags missing references section when neither explicit referees nor privacy declaration are present', () => {
      const cvNoRefs: StandardCVDocument = {
        ...HIGH_QUALITY_ATS_CV,
        references: [],
        additionalInfo: {},
      };

      const refReport = evaluateReferencesPreservation(cvNoRefs);
      expect(refReport.isPreservedWithoutHallucination).toBe(false);
      expect(refReport.issues.some((i) => i.includes('Missing references section'))).toBe(true);
    });
  });
});
