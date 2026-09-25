/**
 * E2E Test Fixtures for ScoreMyCV
 * Contains CV documents (ATS high quality, low quality, broken hierarchy, missing contacts),
 * raw text variants, and payment session test fixtures.
 */

import type { StandardCVDocument, CVReference } from '@/lib/cvStandardData';

export interface TestPaymentRecord {
  sessionId: string;
  customerEmail: string;
  profileId: string;
  candidateName: string;
  paymentStatus: 'paid' | 'unpaid' | 'pending';
  amountCents: number;
  currency: string;
  invoiceNumber: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, string>;
}

// ==========================================
// PAYMENT SESSION CONSTANTS
// ==========================================
export const VALID_PAID_SESSION_ID = 'cs_test_valid_paid_session_789';
export const UNPAID_SESSION_ID = 'cs_test_unpaid_session_456';
export const FORGED_SESSION_ID = 'cs_fake_bypass_token_000';
export const EXPIRED_SESSION_ID = 'cs_test_expired_session_111';
export const TEST_CUSTOMER_EMAIL = 'candidate.alex@example.com';
export const UNPAID_CUSTOMER_EMAIL = 'unpaid.candidate@example.com';

export const SAMPLE_PAYMENT_RECORDS: {
  verifiedPaidRecord: TestPaymentRecord;
  unpaidRecord: TestPaymentRecord;
  pendingRecord: TestPaymentRecord;
} = {
  verifiedPaidRecord: {
    sessionId: VALID_PAID_SESSION_ID,
    customerEmail: TEST_CUSTOMER_EMAIL,
    profileId: 'it_cloud_01',
    candidateName: 'Alex Morgan',
    paymentStatus: 'paid',
    amountCents: 900,
    currency: 'usd',
    invoiceNumber: 'INV-2026-0001',
    createdAt: '2026-09-17T10:00:00.000Z',
    updatedAt: '2026-09-17T10:05:00.000Z',
    metadata: { tier: 'executive_rewrite', candidateId: 'alex_01' },
  },
  unpaidRecord: {
    sessionId: UNPAID_SESSION_ID,
    customerEmail: UNPAID_CUSTOMER_EMAIL,
    profileId: 'junior_dev_02',
    candidateName: 'Jordan Smith',
    paymentStatus: 'unpaid',
    amountCents: 900,
    currency: 'usd',
    invoiceNumber: 'INV-2026-0002',
    createdAt: '2026-09-17T10:00:00.000Z',
    updatedAt: '2026-09-17T10:00:00.000Z',
  },
  pendingRecord: {
    sessionId: 'cs_test_pending_session_222',
    customerEmail: 'pending.candidate@example.com',
    profileId: 'finance_03',
    candidateName: 'Morgan Lee',
    paymentStatus: 'pending',
    amountCents: 900,
    currency: 'usd',
    invoiceNumber: 'INV-2026-0003',
    createdAt: '2026-09-17T11:00:00.000Z',
    updatedAt: '2026-09-17T11:00:00.000Z',
  },
};

// ==========================================
// CV DOCUMENT FIXTURES
// ==========================================

/**
 * High quality ATS compliant CV with >80% XYZ metric saturation,
 * complete contact integrity, valid hierarchy, and preserved references.
 */
export const HIGH_QUALITY_ATS_CV: StandardCVDocument = {
  id: 'high_quality_ats_cv_01',
  name: 'ALEX MORGAN',
  title: 'Senior IT Support & Operations Lead',
  contact: {
    email: 'alex.morgan@executivemail.com',
    phone: '+1 (555) 234-5678',
    location: 'New York, NY / London / Remote',
    nationality: 'US / UK Authorized',
    linkedin: 'https://linkedin.com/in/alexmorgan-lead',
  },
  summary:
    'Results-driven Senior IT Support & Operations Lead with 5+ years of experience directing distributed service desk operations, zero-touch endpoint provisioning, and enterprise identity governance. Proven track record maintaining 98.4% first-contact SLA resolution across 600+ personnel while reducing ticket turnaround by 34% through automated PowerShell workflows. Certified in ITIL frameworks, CompTIA Security+, and Microsoft Azure Fundamentals.',
  skillsGrid: [
    {
      category: 'Cloud & Systems',
      skills: 'AWS, Microsoft Azure, Microsoft Intune, Jamf Pro, Active Directory, Okta SSO',
    },
    {
      category: 'Automation & Scripting',
      skills: 'PowerShell, Bash, Python, Jira Automation, REST APIs, Git',
    },
    {
      category: 'Compliance & Governance',
      skills: 'SOC2 Type II, ITIL v4, ISO 27001, Endpoint Patch Management, Disaster Recovery',
    },
  ],
  experience: [
    {
      title: 'Senior IT Support Specialist / Team Lead',
      company: 'NexaCloud Systems',
      dates: '03/2022 - Present',
      bullets: [
        'Spearheaded Tier-1 and Tier-2 global IT service desk operations for 350+ remote users, achieving 98.4% first-contact SLA resolution and cutting turnaround from 4.2 hours to 45 minutes.',
        'Automated zero-touch device provisioning for global onboarding cohorts using Microsoft Intune and Jamf MDM, cutting manual laptop deployment time by 68%.',
        'Partnered with Security Operations to enforce SOC2 compliance across 400+ endpoints, managing SAML/SSO integrations in Okta with 100% audit pass rate.',
        'Authored 45+ comprehensive standard operating procedure (SOP) runbooks, accelerating junior support engineer ramp-up time by 40%.',
        'Negotiated vendor software renewal contracts for enterprise SaaS tools, generating $24,000 in annual licensing cost savings.',
      ],
    },
    {
      title: 'Junior Systems Administrator',
      company: 'Apex Digital Media',
      dates: '01/2020 - 02/2022',
      bullets: [
        'Administered Active Directory, GPOs, and multi-factor authentication across Azure AD for 120+ workstations, reducing security incidents by 92%.',
        'Implemented automated overnight endpoint patch management schedules, reducing system vulnerabilities by 82% and achieving zero unscheduled downtime.',
        'Orchestrated audiovisual infrastructure and encrypted Zoom Room setups for executive town halls with 500+ live participants.',
        'Conducted quarterly disaster recovery restoration audits and maintained encrypted cloud backup schedules with 100% data integrity retention.',
      ],
    },
  ],
  education: [
    {
      qualification: 'Bachelor of Science in Information Technology',
      institution: 'Global Institute of Technology',
      year: '2020',
    },
    {
      qualification: 'CompTIA Security+ Certification (SY0-601)',
      institution: 'CompTIA',
      year: '2021',
    },
    {
      qualification: 'Microsoft Certified: Azure Fundamentals (AZ-900)',
      institution: 'Microsoft',
      year: '2022',
    },
  ],
  references: [
    {
      name: 'Sarah Jenkins',
      title: 'VP of Technology',
      company: 'NexaCloud Systems',
      relationship: 'Former Direct Manager',
      phone: '+1 (555) 876-5432',
      email: 's.jenkins@nexacloud.com',
      location: 'San Francisco, CA',
    },
    {
      name: 'David Reynolds',
      title: 'Director of Infrastructure',
      company: 'Apex Digital Media',
      relationship: 'Former Department Head',
      phone: '+1 (555) 987-6543',
      email: 'd.reynolds@apexdigital.com',
      location: 'Austin, TX',
    },
  ],
};

/**
 * Low quality CV lacking quantifiable metrics (0% metric saturation).
 * Uses passive duty-focused phrases without numbers or business outcomes.
 */
export const LOW_QUALITY_NO_METRICS_CV: StandardCVDocument = {
  id: 'low_quality_no_metrics_cv_02',
  name: 'JORDAN SMITH',
  title: 'IT Support Assistant',
  contact: {
    email: 'jordan.smith@genericmail.com',
    phone: '+1 (555) 345-6789',
    location: 'Chicago, IL',
  },
  summary:
    'Dedicated IT support worker looking for opportunities to help companies with computer systems and customer service. Hard worker with good communication skills.',
  skillsGrid: [
    {
      category: 'General IT',
      skills: 'Windows, Mac, Hardware setup, Troubleshooting, Email',
    },
  ],
  experience: [
    {
      title: 'IT Technician',
      company: 'Midwest Retail Services',
      dates: '2021 - Present',
      bullets: [
        'Responsible for answering incoming support calls and helping users with computer issues.',
        'Assisted employees with password resets and account unlock requests.',
        'Helped install desktop software and monitors around the office.',
        'Handled general maintenance tasks assigned by the supervisor.',
      ],
    },
    {
      title: 'Help Desk Intern',
      company: 'Local Community Library',
      dates: '2020 - 2021',
      bullets: [
        'Showed patrons how to use the public computer terminals and printers.',
        'Troubleshot network cable connections when the internet was down.',
        'Maintained computer equipment in clean working condition.',
      ],
    },
  ],
  education: [
    {
      qualification: 'Associate Degree in Computer Science',
      institution: 'City Community College',
      year: '2020',
    },
  ],
};

/**
 * CV missing critical contact integrity fields (placeholder name, missing phone, missing location, invalid email).
 */
export const MISSING_CONTACT_CV: StandardCVDocument = {
  id: 'missing_contact_cv_03',
  name: 'Candidate Name', // Generic placeholder
  title: 'Software Developer',
  contact: {
    email: 'email@example.com', // Generic placeholder
    phone: '', // Missing phone
    location: '', // Missing location
  },
  summary: 'Experienced developer building web applications with modern frameworks.',
  skillsGrid: [
    {
      category: 'Frontend',
      skills: 'React, TypeScript, CSS',
    },
  ],
  experience: [
    {
      title: 'Web Developer',
      company: 'Tech Agency',
      dates: '2022 - 2024',
      bullets: [
        'Developed interactive web applications using React and Tailwind CSS, increasing user engagement by 25%.',
        'Refactored frontend codebase to improve page load speed by 35%.',
      ],
    },
  ],
  education: [
    {
      qualification: 'B.S. in Computer Science',
      year: '2022',
    },
  ],
};

/**
 * Broken hierarchy CV violating ATS architecture:
 * Missing summary or skillsGrid, or unordered sections.
 */
export const BROKEN_HIERARCHY_CV: StandardCVDocument = {
  id: 'broken_hierarchy_cv_04',
  name: 'TAYLOR REED',
  title: 'Product Operations Analyst',
  contact: {
    email: 'taylor.reed@sampledomain.com',
    phone: '+1 (555) 456-7890',
    location: 'Seattle, WA',
  },
  summary: '', // Empty summary violates required ATS hierarchy
  skillsGrid: [], // Missing skills grid
  experience: [
    {
      title: 'Operations Analyst',
      company: 'Global Retail Corp',
      dates: '2022 - 2024',
      bullets: [
        'Analyzed supply chain telemetry data across 4 warehouses, reducing freight costs by 18%.',
      ],
    },
  ],
  education: [
    {
      qualification: 'B.A. in Business Administration',
      institution: 'State University',
      year: '2021',
    },
  ],
};

/**
 * Boundary CV: Exactly 39% metric saturation (e.g. 7 bullets lacking metrics, 3 bullets with metrics = 30-39%).
 * Used for Boundary Value Analysis probing the >=40% threshold.
 */
export const BOUNDARY_39_METRIC_CV: StandardCVDocument = {
  id: 'boundary_39_cv_05',
  name: 'SAMUEL CARTER',
  title: 'Operations Coordinator',
  contact: {
    email: 'samuel.carter@operationshub.com',
    phone: '+1 (555) 789-0123',
    location: 'Boston, MA',
  },
  summary: 'Operations coordinator with 4 years of logistics and scheduling experience.',
  skillsGrid: [
    {
      category: 'Operations',
      skills: 'Logistics, ERP, Scheduling, Vendor Management',
    },
  ],
  experience: [
    {
      title: 'Operations Coordinator',
      company: 'Logistics North',
      dates: '2022 - Present',
      bullets: [
        'Negotiated 3 freight contracts resulting in 12% lower shipping overhead.', // Metric 1
        'Automated dispatch scheduling using Excel macros, saving 15 hours weekly.', // Metric 2
        'Decreased inventory discrepancies by 22% through bi-weekly cycle counts.', // Metric 3
        'Responsible for answering incoming vendor emails and questions.', // No metric
        'Coordinated with warehouse managers on daily shipping schedules.', // No metric
        'Helped organize annual safety inspection documentation.', // No metric
        'Reviewed purchase orders for accuracy before submitting to finance.', // No metric
        'Assisted customer service representatives with parcel tracking lookups.', // No metric
      ],
    },
  ],
  education: [
    {
      qualification: 'Bachelor of Arts in Management',
      institution: 'Boston College',
      year: '2020',
    },
  ],
};

/**
 * Boundary CV: Exactly 40% metric saturation (e.g. 2 out of 5 bullets with metrics = 40%).
 * Threshold compliant for R2 requirements.
 */
export const BOUNDARY_40_METRIC_CV: StandardCVDocument = {
  id: 'boundary_40_cv_06',
  name: 'ELENA ROSTOVA',
  title: 'Associate Product Manager',
  contact: {
    email: 'elena.rostova@prodgrowth.com',
    phone: '+1 (555) 890-1234',
    location: 'Denver, CO',
  },
  summary: 'Associate Product Manager experienced in sprint planning and customer discovery.',
  skillsGrid: [
    {
      category: 'Product Management',
      skills: 'Jira, Figma, SQL, Agile Scrum, User Research',
    },
  ],
  experience: [
    {
      title: 'Associate PM',
      company: 'Peak SaaS Co',
      dates: '2022 - Present',
      bullets: [
        'Launched onboarding product tour that lifted 30-day user activation by 18%.', // Metric 1
        'Streamlined Jira backlog triage process, reducing sprint spillover by 25%.', // Metric 2
        'Conducted weekly user interviews and synthesized feedback for engineering team.', // No metric
        'Collaborated with design leads on user wireframes and feature mockups.', // No metric
        'Assisted senior product manager with release notes and customer webinars.', // No metric
      ],
    },
  ],
  education: [
    {
      qualification: 'B.S. in Information Systems',
      institution: 'University of Colorado',
      year: '2021',
    },
  ],
};

/**
 * CV with malformed/hallucinated references (placeholders, fake phone numbers).
 */
export const MALFORMED_REFERENCES_CV: StandardCVDocument = {
  ...HIGH_QUALITY_ATS_CV,
  id: 'malformed_references_cv_07',
  references: [
    {
      name: 'Available Upon Request',
      title: 'Manager',
      company: 'Company Inc',
      relationship: 'Supervisor',
      phone: '000-000-0000',
      email: 'notavailable@unknown.com',
    },
  ],
};

// ==========================================
// RAW TEXT CV FIXTURES (for parser & scoring APIs)
// ==========================================

export const HIGH_QUALITY_RAW_CV_TEXT = `
ALEX MORGAN
alex.morgan@executivemail.com | +1 (555) 234-5678 | New York, NY / Remote
LinkedIn: https://linkedin.com/in/alexmorgan-lead

PROFESSIONAL SUMMARY
Results-driven Senior IT Support & Operations Lead with 5+ years of experience directing distributed service desk operations, zero-touch endpoint provisioning, and enterprise identity governance. Proven track record maintaining 98.4% first-contact SLA resolution across 600+ personnel while reducing ticket turnaround by 34% through automated PowerShell workflows. Certified in ITIL frameworks, CompTIA Security+, and Microsoft Azure Fundamentals.

CORE SKILLS
- Cloud & Infrastructure: AWS, Microsoft Azure, Microsoft Intune, Jamf Pro, Active Directory, Okta SSO
- Automation & Scripting: PowerShell, Bash, Python, Jira Automation, REST APIs, Git
- Compliance & Governance: SOC2 Type II, ITIL v4, ISO 27001, Endpoint Patch Management, Disaster Recovery

PROFESSIONAL EXPERIENCE
Senior IT Support Specialist / Team Lead | NexaCloud Systems | 03/2022 - Present
- Spearheaded Tier-1 and Tier-2 global IT service desk operations for 350+ remote users, achieving 98.4% first-contact SLA resolution and cutting turnaround from 4.2 hours to 45 minutes.
- Automated zero-touch device provisioning for global onboarding cohorts using Microsoft Intune and Jamf MDM, cutting manual laptop deployment time by 68%.
- Partnered with Security Operations to enforce SOC2 compliance across 400+ endpoints, managing SAML/SSO integrations in Okta with 100% audit pass rate.
- Authored 45+ comprehensive standard operating procedure (SOP) runbooks, accelerating junior support engineer ramp-up time by 40%.
- Negotiated vendor software renewal contracts for enterprise SaaS tools, generating $24,000 in annual licensing cost savings.

Junior Systems Administrator | Apex Digital Media | 01/2020 - 02/2022
- Administered Active Directory, GPOs, and multi-factor authentication across Azure AD for 120+ workstations, reducing security incidents by 92%.
- Implemented automated overnight endpoint patch management schedules, reducing system vulnerabilities by 82% and achieving zero unscheduled downtime.
- Orchestrated audiovisual infrastructure and encrypted Zoom Room setups for executive town halls with 500+ live participants.
- Conducted quarterly disaster recovery restoration audits and maintained encrypted cloud backup schedules with 100% data integrity retention.

EDUCATION & CERTIFICATIONS
- Bachelor of Science in Information Technology | Global Institute of Technology | 2020
- CompTIA Security+ Certification (SY0-601) | CompTIA | 2021
- Microsoft Certified: Azure Fundamentals (AZ-900) | Microsoft | 2022

REFERENCES
- Sarah Jenkins, VP of Technology, NexaCloud Systems | +1 (555) 876-5432 | s.jenkins@nexacloud.com
- David Reynolds, Director of Infrastructure, Apex Digital Media | +1 (555) 987-6543 | d.reynolds@apexdigital.com
`.trim();

export const LOW_QUALITY_RAW_CV_TEXT = `
JORDAN SMITH
jordan.smith@genericmail.com | +1 (555) 345-6789 | Chicago, IL

SUMMARY
Dedicated IT support worker looking for opportunities to help companies with computer systems and customer service. Hard worker with good communication skills.

SKILLS
Windows, Mac, Hardware setup, Troubleshooting, Email

EXPERIENCE
IT Technician | Midwest Retail Services | 2021 - Present
- Responsible for answering incoming support calls and helping users with computer issues.
- Assisted employees with password resets and account unlock requests.
- Helped install desktop software and monitors around the office.
- Handled general maintenance tasks assigned by the supervisor.

Help Desk Intern | Local Community Library | 2020 - 2021
- Showed patrons how to use the public computer terminals and printers.
- Troubleshot network cable connections when the internet was down.
- Maintained computer equipment in clean working condition.

EDUCATION
Associate Degree in Computer Science | City Community College | 2020
`.trim();

export const MALFORMED_RAW_CV_TEXT = `
CV Text
Just some random text without proper headings or contact details.
`.trim();
