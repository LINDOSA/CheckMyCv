import { describe, it, expect } from 'vitest';
import {
  auditCvQuality,
  evaluateBulletPoint,
  evaluateQuantifiableMetric,
  evaluateActionVerb,
  evaluateBusinessOutcome,
  evaluateContactIntegrity,
  evaluateSectionArchitecture,
  evaluateFormattingGuardrails,
  evaluateReferencesPreservation,
} from '@/lib/cvQualityEngine';
import {
  STANDARD_CV_ALEX,
  StandardCVDocument,
} from '@/lib/cvStandardData';

describe('CV Quality Engine: XYZ Formula & Bullet Impact Analyzer', () => {
  it('identifies fully compliant Google XYZ formula bullets', () => {
    const bullet =
      'Spearheaded zero-touch provisioning with Jamf MDM, cutting laptop deployment time by 68% and saving $24,000 annually.';
    const result = evaluateBulletPoint(bullet);

    expect(result.hasActionVerb).toBe(true);
    expect(result.hasQuantifiableMetric).toBe(true);
    expect(result.hasBusinessOutcome).toBe(true);
    expect(result.isXyzCompliant).toBe(true);
    expect(result.feedback).toContain('Strong XYZ-compliant bullet');
  });

  it('tolerates leading -ly adverbs before the power action verb', () => {
    const bullet =
      'Successfully engineered automated failover cluster across 2 datacenters, achieving 99.999% uptime and zero data loss.';
    const result = evaluateBulletPoint(bullet);

    expect(result.hasActionVerb).toBe(true);
    expect(result.hasQuantifiableMetric).toBe(true);
    expect(result.hasBusinessOutcome).toBe(true);
    expect(result.isXyzCompliant).toBe(true);
  });

  it('flags passive duty phrasing and provides actionable suggestions', () => {
    const bullet = 'Responsible for managing helpdesk tickets and helping users with printer issues.';
    const result = evaluateBulletPoint(bullet);

    expect(result.hasActionVerb).toBe(false);
    expect(result.hasQuantifiableMetric).toBe(false);
    expect(result.hasBusinessOutcome).toBe(false);
    expect(result.isXyzCompliant).toBe(false);
    expect(result.feedback).toContain('Passive duty opening');
    expect(result.suggestedRevision).toBeDefined();
    expect(result.suggestedRevision).toContain('Spearheaded');
  });

  it('detects bullets missing quantifiable metrics', () => {
    const bullet = 'Architected enterprise cloud migration strategy across AWS services to ensure high system availability.';
    const result = evaluateBulletPoint(bullet);

    expect(result.hasActionVerb).toBe(true);
    expect(result.hasQuantifiableMetric).toBe(false);
    expect(result.hasBusinessOutcome).toBe(true);
    expect(result.isXyzCompliant).toBe(false);
    expect(result.feedback).toContain('Lacks quantifiable metric');
  });

  it('detects bullets missing explicit business outcomes', () => {
    const bullet = 'Configured 150 Cisco Catalyst switches and 40 firewalls across 3 regional branch offices.';
    const result = evaluateBulletPoint(bullet);

    expect(result.hasActionVerb).toBe(true);
    expect(result.hasQuantifiableMetric).toBe(true);
    expect(result.hasBusinessOutcome).toBe(false);
    expect(result.isXyzCompliant).toBe(false);
    expect(result.feedback).toContain('Lacks explicit business outcome');
  });

  it('excludes software versions and technical specs as false-positive metrics', () => {
    // "Python 3.10" and "Windows 11" should NOT count as quantifiable metrics
    const nonMetric = evaluateQuantifiableMetric('Developed backend tools using Python 3.10 on Windows 11');
    expect(nonMetric).toBe(false);

    // Actual metrics like "$50k" or "40% faster" DO count
    const realMetric = evaluateQuantifiableMetric('Developed backend tools cutting execution time by 40%');
    expect(realMetric).toBe(true);
  });
});

describe('CV Quality Engine: Metric Saturation Boundary Thresholds (>=40%)', () => {
  function makeCVWithMetrics(quantifiedCount: number, totalCount: number): StandardCVDocument {
    const bullets: string[] = [];
    for (let i = 0; i < totalCount; i++) {
      if (i < quantifiedCount) {
        bullets.push(
          `Spearheaded cloud optimization initiative #${i + 1}, reducing monthly AWS infrastructure spend by 25% and saving $18,000.`
        );
      } else {
        bullets.push(`Maintained server configurations and attended weekly status meetings for project #${i + 1}.`);
      }
    }

    return {
      ...STANDARD_CV_ALEX,
      experience: [
        {
          title: 'Senior Systems Engineer',
          company: 'TechCorp Global',
          dates: '2020 - Present',
          bullets,
        },
      ],
    };
  }

  it('fails at 0% metric saturation (0 out of 5 quantified)', () => {
    const cv = makeCVWithMetrics(0, 5);
    const result = auditCvQuality(cv);

    expect(result.metricSaturation).toBe(0);
    expect(result.isMetricSaturationCompliant).toBe(false);
    expect(result.criticalIssues.some((issue) => issue.includes('Low metric saturation'))).toBe(true);
  });

  it('fails at 20% metric saturation (1 out of 5 quantified)', () => {
    const cv = makeCVWithMetrics(1, 5);
    const result = auditCvQuality(cv);

    expect(result.metricSaturation).toBe(0.2);
    expect(result.isMetricSaturationCompliant).toBe(false);
  });

  it('fails at 39% boundary metric saturation (39 out of 100 quantified)', () => {
    const cv = makeCVWithMetrics(39, 100);
    const result = auditCvQuality(cv);

    expect(result.metricSaturation).toBe(0.39);
    expect(result.isMetricSaturationCompliant).toBe(false);
  });

  it('passes at exact 40% boundary metric saturation (4 out of 10 quantified)', () => {
    const cv = makeCVWithMetrics(4, 10);
    const result = auditCvQuality(cv);

    expect(result.metricSaturation).toBe(0.4);
    expect(result.isMetricSaturationCompliant).toBe(true);
  });

  it('correctly evaluates BOUNDARY_39_METRIC_CV as failing <40% threshold', async () => {
    const { BOUNDARY_39_METRIC_CV } = await import('../e2e/helpers/fixtures');
    const result = auditCvQuality(BOUNDARY_39_METRIC_CV);

    expect(result.metricSaturation).toBeLessThan(0.4);
    expect(result.isMetricSaturationCompliant).toBe(false);
  });

  it('correctly evaluates BOUNDARY_40_METRIC_CV as passing >=40% threshold', async () => {
    const { BOUNDARY_40_METRIC_CV } = await import('../e2e/helpers/fixtures');
    const result = auditCvQuality(BOUNDARY_40_METRIC_CV);

    expect(result.metricSaturation).toBeGreaterThanOrEqual(0.4);
    expect(result.isMetricSaturationCompliant).toBe(true);
  });

  it('passes at 60% metric saturation (3 out of 5 quantified)', () => {
    const cv = makeCVWithMetrics(3, 5);
    const result = auditCvQuality(cv);

    expect(result.metricSaturation).toBe(0.6);
    expect(result.isMetricSaturationCompliant).toBe(true);
  });

  it('passes at 100% metric saturation (5 out of 5 quantified)', () => {
    const cv = makeCVWithMetrics(5, 5);
    const result = auditCvQuality(cv);

    expect(result.metricSaturation).toBe(1.0);
    expect(result.isMetricSaturationCompliant).toBe(true);
  });
});

describe('CV Quality Engine: Contact Integrity Validator', () => {
  it('validates a complete, authentic candidate contact profile', () => {
    const report = evaluateContactIntegrity(STANDARD_CV_ALEX);

    expect(report.hasFullName).toBe(true);
    expect(report.hasPhoneNumber).toBe(true);
    expect(report.hasProfessionalEmail).toBe(true);
    expect(report.hasLocation).toBe(true);
    expect(report.isValid).toBe(true);
    expect(report.issues).toHaveLength(0);
  });

  it('rejects single-word names', () => {
    const cv: StandardCVDocument = {
      ...STANDARD_CV_ALEX,
      name: 'Alex',
    };
    const report = evaluateContactIntegrity(cv);

    expect(report.hasFullName).toBe(false);
    expect(report.isValid).toBe(false);
    expect(report.issues.some((i) => i.includes('at least 2 words'))).toBe(true);
  });

  it('rejects common placeholder names', () => {
    const placeholders = ['John Doe', 'Jane Doe', 'Candidate Name', 'Your Name', 'Test User'];
    for (const name of placeholders) {
      const cv: StandardCVDocument = { ...STANDARD_CV_ALEX, name };
      const report = evaluateContactIntegrity(cv);
      expect(report.hasFullName).toBe(false);
      expect(report.isValid).toBe(false);
    }
  });

  it('enforces ITU-T E.164 phone digit length (7 to 15 digits)', () => {
    // Too short (5 digits)
    const shortPhoneDoc: StandardCVDocument = {
      ...STANDARD_CV_ALEX,
      contact: { ...STANDARD_CV_ALEX.contact, phone: '12345' },
    };
    expect(evaluateContactIntegrity(shortPhoneDoc).hasPhoneNumber).toBe(false);

    // Too long (18 digits)
    const longPhoneDoc: StandardCVDocument = {
      ...STANDARD_CV_ALEX,
      contact: { ...STANDARD_CV_ALEX.contact, phone: '+123456789012345678' },
    };
    expect(evaluateContactIntegrity(longPhoneDoc).hasPhoneNumber).toBe(false);

    // Valid UK international phone (+44 20 7946 0912 = 12 digits)
    const validPhoneDoc: StandardCVDocument = {
      ...STANDARD_CV_ALEX,
      contact: { ...STANDARD_CV_ALEX.contact, phone: '+44 20 7946 0912' },
    };
    expect(evaluateContactIntegrity(validPhoneDoc).hasPhoneNumber).toBe(true);
  });

  it('rejects dummy repetitive or sequential phone numbers', () => {
    const repetitiveDoc: StandardCVDocument = {
      ...STANDARD_CV_ALEX,
      contact: { ...STANDARD_CV_ALEX.contact, phone: '0000000000' },
    };
    expect(evaluateContactIntegrity(repetitiveDoc).hasPhoneNumber).toBe(false);

    const sequentialDoc: StandardCVDocument = {
      ...STANDARD_CV_ALEX,
      contact: { ...STANDARD_CV_ALEX.contact, phone: '1234567890' },
    };
    expect(evaluateContactIntegrity(sequentialDoc).hasPhoneNumber).toBe(false);
  });

  it('rejects placeholder and dummy email addresses', () => {
    const dummyEmails = [
      'candidate@example.com',
      'john.doe@test.com',
      'email@domain.com',
      'invalid-email-format',
    ];
    for (const email of dummyEmails) {
      const cv: StandardCVDocument = {
        ...STANDARD_CV_ALEX,
        contact: { ...STANDARD_CV_ALEX.contact, email },
      };
      const report = evaluateContactIntegrity(cv);
      expect(report.hasProfessionalEmail).toBe(false);
    }
  });

  it('rejects placeholder locations', () => {
    const placeholderLocations = ['City, State', 'Location Here', 'Address Line 1', 'Anytown', 'TBD'];
    for (const location of placeholderLocations) {
      const cv: StandardCVDocument = {
        ...STANDARD_CV_ALEX,
        contact: { ...STANDARD_CV_ALEX.contact, location },
      };
      const report = evaluateContactIntegrity(cv);
      expect(report.hasLocation).toBe(false);
    }
  });
});

describe('CV Quality Engine: Section Architecture & Canonical ATS Hierarchy', () => {
  const CANONICAL_RAW_CV = `
Alex Morgan
alex.morgan@email.com | +1 555 234 5678 | New York, NY

Professional Summary
Senior IT Support Lead with 8+ years experience scaling enterprise infrastructure and service desks.

Core Skills
Cloud Systems: AWS, Microsoft Azure, Google Cloud Platform
IT Operations: Jamf Pro, Microsoft Intune, ServiceNow, Active Directory

Professional Experience
Lead Systems Administrator | Global Enterprise Inc
2020 - Present
- Spearheaded zero-touch provisioning, reducing deployment time by 68% and saving $24,000.
- Orchestrated migration of 450 users to Azure AD, cutting authentication latency by 45%.

Education & Certifications
B.S. in Computer Science | New York University | 2016

Professional References
References available upon request.
  `;

  it('validates canonical ATS section hierarchy: Summary -> Skills Grid -> Experience -> Education -> References', () => {
    const report = evaluateSectionArchitecture(CANONICAL_RAW_CV, STANDARD_CV_ALEX);

    expect(report.isHierarchyCompliant).toBe(true);
    expect(report.hierarchyIssues).toHaveLength(0);
    expect(report.detectedSections).toContain('Summary');
    expect(report.detectedSections).toContain('Skills Grid');
    expect(report.detectedSections).toContain('Experience');
    expect(report.detectedSections).toContain('Education');
    expect(report.detectedSections).toContain('References');
  });

  it('flags inverted section hierarchy when Education precedes Experience', () => {
    const INVERTED_RAW_CV = `
Alex Morgan
alex.morgan@email.com | +1 555 234 5678 | New York, NY

Professional Summary
Experienced systems engineer with 8+ years background.

Education & Certifications
B.S. in Computer Science | New York University | 2016

Professional Experience
Lead Systems Administrator | Global Enterprise Inc
2020 - Present
- Spearheaded zero-touch provisioning, cutting laptop setup time by 68%.

Core Skills
Cloud Systems: AWS, Azure

Professional References
References available upon request.
    `;

    const report = evaluateSectionArchitecture(INVERTED_RAW_CV, STANDARD_CV_ALEX);

    expect(report.isHierarchyCompliant).toBe(false);
    expect(
      report.hierarchyIssues.some((issue) =>
        issue.includes("Section 'Education' appears before 'Professional Experience'") ||
        issue.includes("Education' appears before")
      )
    ).toBe(true);
  });

  it('flags missing mandatory sections', () => {
    const MISSING_SECTIONS_CV = `
Alex Morgan
alex.morgan@email.com | +1 555 234 5678 | New York, NY

Professional Experience
Lead Systems Administrator | Global Enterprise Inc
2020 - Present
- Spearheaded zero-touch provisioning, cutting deployment time by 68%.
    `;

    const dummyDoc: StandardCVDocument = {
      ...STANDARD_CV_ALEX,
      summary: '',
      skillsGrid: [],
      education: [],
      references: [],
      additionalInfo: {},
    };

    const report = evaluateSectionArchitecture(MISSING_SECTIONS_CV, dummyDoc);

    expect(report.isHierarchyCompliant).toBe(false);
    expect(report.hierarchyIssues.some((i) => i.includes('Summary'))).toBe(true);
    expect(report.hierarchyIssues.some((i) => i.includes('Skills Grid'))).toBe(true);
    expect(report.hierarchyIssues.some((i) => i.includes('Education'))).toBe(true);
  });
});

describe('CV Quality Engine: Formatting Guardrails', () => {
  it('passes pure single-column text format', () => {
    const cleanText = `
Alex Morgan
alex.morgan@email.com | +1 555 234 5678

Professional Summary
Senior IT Lead.

Core Skills
Systems: AWS, Azure
    `;
    const report = evaluateFormattingGuardrails(cleanText);

    expect(report.isSingleColumn).toBe(true);
    expect(report.hasMultiCellTables).toBe(false);
    expect(report.hasTextBoxes).toBe(false);
    expect(report.hasGraphics).toBe(false);
    expect(report.isCompliant).toBe(true);
    expect(report.violations).toHaveLength(0);
  });

  it('flags multi-cell markdown tables', () => {
    const tableText = `
| Skill Category | Skills | Level |
|---|---|---|
| Cloud | AWS, Azure | Expert |
| Database | PostgreSQL, Redis | Senior |
    `;
    const report = evaluateFormattingGuardrails(tableText);

    expect(report.hasMultiCellTables).toBe(true);
    expect(report.isCompliant).toBe(false);
    expect(report.violations.some((v) => v.includes('Multi-cell tables'))).toBe(true);
  });

  it('flags text boxes or sidebars', () => {
    const textBoxText = `
Alex Morgan
[sidebar]
Contact: 555-1234
Skills: AWS, Azure
[/sidebar]
Summary: Experienced Engineer
    `;
    const report = evaluateFormattingGuardrails(textBoxText);

    expect(report.hasTextBoxes).toBe(true);
    expect(report.isCompliant).toBe(false);
    expect(report.violations.some((v) => v.includes('Text boxes'))).toBe(true);
  });

  it('flags graphics or images', () => {
    const imageText = `
![Candidate Photo](https://example.com/avatar.jpg)
Alex Morgan
Summary: Senior IT Professional
    `;
    const report = evaluateFormattingGuardrails(imageText);

    expect(report.hasGraphics).toBe(true);
    expect(report.isCompliant).toBe(false);
    expect(report.violations.some((v) => v.includes('Graphics or raster images'))).toBe(true);
  });
});

describe('CV Quality Engine: References Preservation & Privacy', () => {
  it('preserves genuine candidate references without hallucination', () => {
    const report = evaluateReferencesPreservation(STANDARD_CV_ALEX);

    expect(report.hasReferences).toBe(true);
    expect(report.referencesCount).toBe(2);
    expect(report.isPreservedWithoutHallucination).toBe(true);
    expect(report.issues).toHaveLength(0);
  });

  it('validates standard ATS privacy declaration ("References available upon request")', () => {
    const cvWithoutRefs: StandardCVDocument = {
      ...STANDARD_CV_ALEX,
      references: undefined,
      additionalInfo: {
        ...STANDARD_CV_ALEX.additionalInfo,
        references: 'References available upon request',
      },
    };

    const report = evaluateReferencesPreservation(cvWithoutRefs);

    expect(report.hasReferences).toBe(true);
    expect(report.referencesCount).toBe(0);
    expect(report.isPreservedWithoutHallucination).toBe(true);
    expect(report.issues).toHaveLength(0);
  });

  it('flags missing references when neither referees nor declaration are provided', () => {
    const cvMissingRefs: StandardCVDocument = {
      ...STANDARD_CV_ALEX,
      references: [],
      additionalInfo: {
        ...STANDARD_CV_ALEX.additionalInfo,
        references: undefined,
      },
    };

    const report = evaluateReferencesPreservation(cvMissingRefs);

    expect(report.isPreservedWithoutHallucination).toBe(false);
    expect(report.issues.some((i) => i.includes('Missing references section'))).toBe(true);
  });

  it('flags placeholder or synthetic referee names', () => {
    const fakeRefCV: StandardCVDocument = {
      ...STANDARD_CV_ALEX,
      references: [
        {
          name: 'Referee 1',
          title: 'Manager',
          company: 'Acme',
          relationship: 'Direct supervisor',
          phone: '+1 555 111 2222',
          email: 'ref1@acme.com',
        },
      ],
    };

    const report = evaluateReferencesPreservation(fakeRefCV);

    expect(report.isPreservedWithoutHallucination).toBe(false);
    expect(report.issues.some((i) => i.includes('placeholder or invalid name'))).toBe(true);
  });
});

describe('CV Quality Engine: Comprehensive 0-100 Diagnostic Scoring & Input Normalization', () => {
  it('awards high score (>=85) and marks submission ready for standard executive CV', () => {
    const result = auditCvQuality(STANDARD_CV_ALEX);

    expect(result.overallScore).toBeGreaterThanOrEqual(85);
    expect(result.isMetricSaturationCompliant).toBe(true);
    expect(result.contactIntegrity.isValid).toBe(true);
    expect(result.sectionArchitecture.isHierarchyCompliant).toBe(true);
    expect(result.formattingGuardrails.isCompliant).toBe(true);
    expect(result.referencesPreservation.isPreservedWithoutHallucination).toBe(true);
    expect(result.criticalIssues).toHaveLength(0);
    expect(result.isSubmissionReady).toBe(true);
  });

  it('gracefully handles empty or very short strings (<20 chars)', () => {
    const result = auditCvQuality('Too short');

    expect(result.overallScore).toBeLessThanOrEqual(20);
    expect(result.isSubmissionReady).toBe(false);
    expect(result.criticalIssues.length).toBeGreaterThan(0);
    expect(result.criticalIssues[0]).toContain('insufficient text');
  });

  it('accurately parses raw text strings and runs complete audit', () => {
    const rawCvText = `
David Kim
david.kim@techcorp.com | +1 (415) 890-1234 | San Francisco, CA

Professional Summary
Senior DevOps Architect with 7+ years building enterprise Kubernetes clusters and CI/CD pipelines.

Core Skills
Cloud Infrastructure: AWS, Terraform, Kubernetes, Docker
CI/CD: GitHub Actions, ArgoCD, Prometheus, Grafana

Professional Experience
Principal DevOps Engineer | CloudScale Systems
2021 - Present
- Spearheaded Kubernetes cluster consolidation across 8 regions, cutting cloud costs by 32% and saving $140,000.
- Engineered automated GitOps pipelines with ArgoCD, accelerating deployment velocity from 3 days to under 40 minutes.
- Automated zero-trust security scanning across 120 container images, achieving a 100% audit pass rate.

Education & Certifications
B.S. in Software Engineering | University of California, Berkeley | 2017

Professional References
References available upon request.
    `;

    const result = auditCvQuality(rawCvText);

    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.metricSaturation).toBeGreaterThanOrEqual(0.4);
    expect(result.isMetricSaturationCompliant).toBe(true);
    expect(result.contactIntegrity.isValid).toBe(true);
    expect(result.contactIntegrity.candidateName).toBe('David Kim');
    expect(result.sectionArchitecture.isHierarchyCompliant).toBe(true);
    expect(result.formattingGuardrails.isCompliant).toBe(true);
    expect(result.isSubmissionReady).toBe(true);
  });

  it('flags LOW_QUALITY_NO_METRICS_CV with low score and critical issues', async () => {
    const { LOW_QUALITY_NO_METRICS_CV } = await import('../e2e/helpers/fixtures');
    const result = auditCvQuality(LOW_QUALITY_NO_METRICS_CV);

    expect(result.metricSaturation).toBe(0);
    expect(result.isMetricSaturationCompliant).toBe(false);
    expect(result.isSubmissionReady).toBe(false);
    expect(result.criticalIssues.some((issue) => issue.includes('Low metric saturation'))).toBe(true);
  });

  it('flags MISSING_CONTACT_CV with contact integrity failures', async () => {
    const { MISSING_CONTACT_CV } = await import('../e2e/helpers/fixtures');
    const result = auditCvQuality(MISSING_CONTACT_CV);

    expect(result.contactIntegrity.isValid).toBe(false);
    expect(result.isSubmissionReady).toBe(false);
    expect(result.criticalIssues.length).toBeGreaterThan(0);
  });

  it('flags BROKEN_HIERARCHY_CV with architecture and section issues', async () => {
    const { BROKEN_HIERARCHY_CV } = await import('../e2e/helpers/fixtures');
    const result = auditCvQuality(BROKEN_HIERARCHY_CV);

    expect(result.sectionArchitecture.isHierarchyCompliant).toBe(false);
    expect(result.sectionArchitecture.hierarchyIssues.length).toBeGreaterThan(0);
    expect(result.isSubmissionReady).toBe(false);
  });
});
