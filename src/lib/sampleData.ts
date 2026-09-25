export interface SampleProfile {
  id: string;
  name: string;
  role: string;
  industry: string;
  experienceLevel: string;
  targetCompany: string;
  originalScore: number;
  rewrittenScore: number;
  cv: string;
  job: string;
  rewrittenCv: string;
}

export const SAMPLE_PROFILES: SampleProfile[] = [
  {
    id: 'it_cloud',
    name: 'Alex Morgan',
    role: 'IT & Cloud Systems Lead',
    industry: 'Cloud Infrastructure',
    experienceLevel: '4+ Years',
    targetCompany: 'CloudScale Global Technologies',
    originalScore: 39,
    rewrittenScore: 96,
    cv: `ALEX MORGAN
New York, NY / London, UK / Remote | +1 (555) 234-5678 | alex.morgan@email.com | linkedin.com/in/alexmorgan-tech

PROFESSIONAL SUMMARY
Dedicated and adaptable IT Systems Specialist with over 4 years of experience delivering enterprise technical support, identity management, and cloud systems administration. Proven collaborator with strong problem-solving skills, focused on minimizing downtime and optimizing end-user service desk operations.

WORK EXPERIENCE
IT Support Specialist - NexaCloud Systems
March 2022 - Present
- Responsible for providing tier-1 and tier-2 technical support for 350+ remote and hybrid corporate users.
- Handled daily helpdesk ticketing queues in Jira and resolved incoming hardware and software requests.
- Deployed and configured Windows 11 and macOS laptops for global onboarding cohorts.
- Assisted network operations team with VPN access, Single Sign-On (SSO), and Google Workspace administration.
- Tracked hardware asset inventories, software licenses, and peripheral provisioning in spreadsheets.

Junior Systems Administrator - Apex Digital Media
January 2020 - February 2022
- Maintained user accounts, group policies, and access controls in Microsoft Active Directory and Azure AD.
- Managed automated endpoint patch updates and troubleshooting across 120+ workstations.
- Supported Zoom Rooms, Slack enterprise channels, and audio-visual conference room equipment.
- Monitored daily cloud backup routines and assisted with emergency recovery tests.

EDUCATION & CREDENTIALS
Bachelor of Science in Information Technology
State University / Global Institute of Technology (2016 - 2020)

CERTIFICATIONS & TECHNICAL SKILLS
- Systems: Microsoft 365, Azure Active Directory, Google Workspace, Intune MDM
- Operating Systems: Windows 10/11, macOS, Linux (Ubuntu/Debian basics)
- Networking: TCP/IP, DNS, DHCP, VPN, Meraki Wi-Fi
- IT Service Management: Jira Service Desk, Zendesk, ServiceNow
- Certifications: CompTIA Security+, Microsoft Certified: Azure Fundamentals (AZ-900)`,
    job: `Senior IT Support & Operations Lead
Company: CloudScale Global Technologies
Location: New York / London / Remote (US, UK, Europe, Worldwide)
Employment Type: Full-Time

About the Role:
CloudScale is seeking an experienced Senior IT Support & Operations Lead to head our modern global service desk. In this role, you will champion automated IT workflows, oversee identity and access management (Okta, Azure AD), implement zero-touch device provisioning, and uphold world-class SLAs for over 600 distributed team members across the globe.

Key Responsibilities:
- Lead the global IT Service Desk, maintaining a 96%+ first-contact resolution rate and sub-15 minute initial response SLA.
- Manage identity governance, SAML/SSO integrations, and endpoint compliance via Okta, Microsoft Entra ID (Azure AD), and Jamf/Intune.
- Architect automated laptop onboarding and offboarding workflows with zero-touch MDM deployment.
- Troubleshoot complex distributed networking issues, cloud VPN gateways, and SaaS security compliance.
- Mentor junior support engineers, author comprehensive IT knowledge base documentation, and conduct quarterly disaster recovery audits.

Requirements & Qualifications:
- 4+ years in IT systems support, with at least 1-2 years leading service desk operations or mentoring team members.
- Deep hands-on experience with Microsoft 365, Azure AD / Entra ID, Intune, and Okta identity provisioning.
- Strong knowledge of ITIL frameworks (Incident, Problem, and Change Management) and SOC2 compliance standards.
- Proven track record of automating manual provisioning tasks using PowerShell, Bash, or API integrations.
- Relevant industry certifications: CompTIA Network+/Security+, Jamf Certified Associate, or Microsoft Enterprise Administrator Expert.
- Exceptional cross-functional communication skills across multi-time-zone distributed teams.`,
    rewrittenCv: `ALEX MORGAN
New York, NY / London, UK / Remote | +1 (555) 234-5678 | alex.morgan@email.com | linkedin.com/in/alexmorgan-tech

PROFESSIONAL SUMMARY
Results-driven Senior IT Support & Operations Lead with 4+ years of experience directing distributed service desk operations, zero-touch endpoint provisioning, and enterprise identity governance (Okta, Microsoft Entra ID / Azure AD). Proven track record maintaining 98.4% first-contact SLA resolution across 600+ multi-time-zone personnel while reducing ticket turnaround by 34% through automated PowerShell and Jamf workflows. Certified in ITIL frameworks, CompTIA Security+, and Microsoft Azure Fundamentals.

CORE COMPETENCIES & ATS KEYWORDS
- Identity Governance: Okta SSO, SAML 2.0, Microsoft Entra ID (Azure AD), Role-Based Access Control (RBAC)
- Endpoint Management: Jamf Pro, Microsoft Intune MDM, Zero-Touch Provisioning, Automated Patch Deployment
- Frameworks & Compliance: ITIL v4 (Incident, Problem & Change Management), SOC2 Type II, Disaster Recovery
- Cloud & Infrastructure: Microsoft 365 Enterprise, Google Workspace, AWS/Azure VPN Gateways, Meraki Wi-Fi
- Automation & Scripting: PowerShell, Bash scripting, Jira Service Desk API, Zendesk Enterprise, ServiceNow

PROFESSIONAL EXPERIENCE

Senior IT Support Specialist / Team Lead - NexaCloud Systems
March 2022 - Present | Remote / Global
- Spearheaded Tier-1 and Tier-2 global IT service desk operations for 350+ remote and hybrid users across 4 time zones, achieving a 98.4% first-contact SLA resolution rate and reducing average ticket resolution time from 4.2 hours to 45 minutes.
- Automated zero-touch device provisioning for global onboarding cohorts using Microsoft Intune and Jamf MDM, cutting manual laptop deployment time by 68% and eliminating shipment delays.
- Partnered with Security Operations to enforce SOC2 compliance across 400+ endpoints, managing SAML/SSO integrations in Okta and Entra ID with 100% audit pass rate.
- Authored 45+ comprehensive standard operating procedure (SOP) runbooks and internal knowledge base articles, accelerating junior support engineer ramp-up time by 40%.
- Negotiated vendor software renewal contracts for enterprise SaaS tools (Jira, Slack, Google Workspace), generating $24,000 in annual licensing cost savings.

Junior Systems Administrator - Apex Digital Media
January 2020 - February 2022 | New York, NY
- Administered directory services, group policy objects (GPOs), and multi-factor authentication (MFA) across Microsoft Active Directory and Azure AD for 120+ corporate workstations.
- Implemented automated overnight endpoint patch management schedules, reducing system vulnerabilities by 82% and achieving zero unscheduled downtime.
- Orchestrated audiovisual infrastructure and encrypted Zoom Room setups for executive town halls with 500+ live participants.
- Conducted quarterly disaster recovery restoration audits and maintained encrypted cloud backup schedules with 100% data integrity retention.

EDUCATION & CREDENTIALS
Bachelor of Science in Information Technology
Global Institute of Technology | Graduated 2020

CERTIFICATIONS
- CompTIA Security+ (SY0-601)
- Microsoft Certified: Azure Fundamentals (AZ-900)
- ITIL v4 Foundation Certificate in IT Service Management
- Jamf Certified Associate`,
  },
  {
    id: 'software_eng',
    name: 'David Chen',
    role: 'Senior Software Engineer',
    industry: 'Fintech & Web Platforms',
    experienceLevel: '5+ Years',
    targetCompany: 'Stripe / Global Fintech Labs',
    originalScore: 54,
    rewrittenScore: 97,
    cv: `DAVID CHEN
San Francisco, CA / London / Remote | +1 (415) 890-1234 | david.chen.dev@gmail.com | github.com/dchen-code

PROFESSIONAL SUMMARY
Senior Software Engineer with 5+ years of experience engineering high-throughput distributed microservices, REST/GraphQL APIs, and resilient web applications using TypeScript, Node.js, Next.js, and PostgreSQL. Experienced with containerized AWS deployments, CI/CD pipelines, and event-driven architectures.

WORK EXPERIENCE
Full-Stack Software Engineer - FinStream Global
August 2021 - Present
- Built payment reconciliation microservices processing over $12M in monthly merchant transactions using Node.js, NestJS, and Redis.
- Migrated legacy customer dashboard from client-rendered React SPA to Next.js App Router, cutting page load latency by 45%.
- Implemented real-time fraud alert webhooks utilizing Apache Kafka and AWS Lambda.
- Collaborated with product and compliance teams to ensure PCI-DSS Level 1 certification across customer checkout funnels.
- Authored automated end-to-end and unit test suites with Jest and Playwright, lifting test coverage from 52% to 88%.

Software Engineer - Velocity Labs
June 2019 - July 2021
- Developed responsive front-end components in React, TypeScript, and Tailwind CSS for multi-tenant analytics SaaS.
- Refactored PostgreSQL relational queries and added indexing, reducing p99 database response times from 850ms to 120ms.
- Built automated deployment workflows in GitHub Actions for Docker containers on AWS ECS Fargate.
- Participated in weekly on-call incident triage and post-mortem root cause analysis.

EDUCATION
Bachelor of Science in Computer Science
University of California, Berkeley (2015 - 2019)

CORE SKILLS & TECHNOLOGIES
- Languages: TypeScript, JavaScript (ES6+), Python, SQL, Go (working knowledge)
- Frontend: React, Next.js, Tailwind CSS, Redux Toolkit, Webpack
- Backend & Cloud: Node.js, Express, NestJS, PostgreSQL, Redis, Docker, AWS (ECS, Lambda, S3, RDS)
- Architecture & Tools: Microservices, RESTful APIs, GraphQL, Kafka, Git, GitHub Actions, Datadog`,
    job: `Senior Software Engineer - Core Platform & Payments
Company: Global FinTech Infrastructure
Location: San Francisco / New York / Remote Worldwide
Employment Type: Full-Time

About the Role:
We are hiring a Senior Software Engineer to build the backbone of our global payments orchestration engine. You will design, scale, and maintain mission-critical payment services that process hundreds of millions in volume with 99.999% uptime.

What You Will Do:
- Architect scalable backend microservices and public-facing APIs handling high-concurrency payment processing.
- Collaborate with infrastructure engineers to optimize distributed SQL/NoSQL storage (PostgreSQL, Redis, DynamoDB).
- Partner with product managers and security leads to build fraud mitigation systems and zero-downtime ledger migrations.
- Drive engineering excellence: conduct rigorous code reviews, mentor engineers, and champion automated testing standards.
- Participate in an on-call rotation maintaining strict service level objectives (SLOs) and incident resolution.

Requirements:
- 5+ years of production software engineering experience in modern backend languages (TypeScript/Node.js, Go, Java, or Python).
- Proven track record designing distributed systems, caching strategies, and event-driven architectures (Kafka, RabbitMQ, SQS).
- Deep experience with relational databases (PostgreSQL/MySQL), transaction isolation, and query optimization at scale.
- Strong grounding in cloud-native infrastructure (AWS/GCP), Docker containerization, and automated CI/CD pipelines.
- Experience with financial, payments, or compliance-heavy platforms (SOC2, PCI-DSS) is a major plus.
- Clear written and spoken communication skills across distributed asynchronous teams.`,
    rewrittenCv: `DAVID CHEN
San Francisco, CA / London / Remote | +1 (415) 890-1234 | david.chen.dev@gmail.com | github.com/dchen-code

PROFESSIONAL SUMMARY
Senior Software Engineer with 5+ years of experience architecting high-throughput distributed microservices, real-time financial ledgers, and event-driven payment APIs using TypeScript, Node.js, Next.js, and PostgreSQL. Experienced designing fault-tolerant architectures processing $12M+ monthly merchant transaction volume with 99.999% uptime. Proven track record leading PCI-DSS Level 1 compliance audits, reducing p99 database latency by 86%, and lifting test automation coverage to 88%.

CORE COMPETENCIES & TECHNICAL KEYWORDS
- Backend Architecture: Distributed Microservices, Event-Driven Architecture, RESTful APIs, GraphQL, gRPC
- Languages & Frameworks: TypeScript, JavaScript (ES6+), Node.js, NestJS, Python, SQL, Go
- Data & Messaging: PostgreSQL, Redis Caching, Apache Kafka, DynamoDB, RabbitMQ, Connection Pooling
- Cloud & DevOps: AWS (ECS Fargate, Lambda, S3, RDS, CloudFront), Docker, Terraform, GitHub Actions CI/CD
- Security & Compliance: PCI-DSS Level 1, OAuth 2.0, JWT, SOC2 Type II, End-to-End Ledger Reconciliation

PROFESSIONAL EXPERIENCE

Senior Software Engineer - FinStream Global
August 2021 - Present | San Francisco, CA / Remote
- Architected and scaled distributed payment reconciliation microservices in Node.js and NestJS handling $12M+ in monthly transaction volume across 40+ countries with 99.999% platform availability.
- Optimized PostgreSQL relational queries, transaction isolation levels, and composite indexing, reducing p99 database response latency from 850ms to 120ms (86% speed improvement).
- Spearheaded real-time fraud mitigation webhooks using Apache Kafka and AWS Lambda, intercepting $1.8M in fraudulent merchant charges with sub-200ms evaluation speed.
- Led technical preparation and audit remediation for PCI-DSS Level 1 certification, implementing zero-trust tokenization across customer checkout funnels.
- Championed automated testing standards with Jest, Supertest, and Playwright, elevating test coverage from 52% to 88% and cutting production regression incidents by 65%.

Software Engineer - Velocity Labs
June 2019 - July 2021 | Remote
- Engineered responsive multi-tenant SaaS analytics frontends utilizing React, TypeScript, and Next.js, cutting dashboard initial bundle size by 45%.
- Built automated Docker container build and deployment pipelines on AWS ECS Fargate via GitHub Actions, accelerating release cycles from weekly to multi-daily deployments.
- Participated in primary on-call rotation for distributed services, consistently resolving high-priority incidents well within strict 15-minute SLA windows.

EDUCATION
Bachelor of Science in Computer Science
University of California, Berkeley (2015 - 2019)`,
  },
  {
    id: 'product_mgmt',
    name: 'Elena Rostova',
    role: 'Lead Growth Product Manager',
    industry: 'Consumer & B2B SaaS',
    experienceLevel: '6+ Years',
    targetCompany: 'ScaleWave Global SaaS',
    originalScore: 61,
    rewrittenScore: 98,
    cv: `ELENA ROSTOVA
Seattle, WA / Berlin / Remote | +1 (206) 456-7890 | elena.rostova.pm@gmail.com | linkedin.com/in/elenarostova-pm

EXECUTIVE SUMMARY
Results-driven Product Manager with 6+ years of experience leading cross-functional squads to drive user acquisition, retention, and monetization for high-growth SaaS and marketplace platforms. Adept at combining rigorous quantitative data analysis with empathetic user research to ship high-impact features.

PROFESSIONAL EXPERIENCE
Senior Product Manager, Growth - CloudFlow Software
January 2022 - Present
- Led a 9-person cross-functional squad (4 engineers, 1 designer, 1 data scientist, 2 QA, 1 marketer) focused on self-serve customer onboarding and activation.
- Re-architected free-to-paid upgrade funnels, generating a 28% increase in trial-to-paid conversion rate and adding $3.4M in incremental ARR within 12 months.
- Designed and executed 35+ multivariate A/B tests on signup workflows, pricing tiers, and referral loops using Optimizely and Mixpanel.
- Collaborated with executive leadership to establish quarterly OKRs and communicated roadmap priorities to company-wide stakeholders.

Product Manager - Novus Mobile Apps
September 2018 - December 2021
- Owned the end-to-end product lifecycle for consumer iOS and Android productivity apps with 2.5M monthly active users.
- Improved 30-day user retention by 18 percentage points through personalized push notifications and streamlined onboarding checklists.
- Managed sprint backlogs, authored detailed PRDs and user stories in Jira, and facilitated bi-weekly sprint planning and retrospectives.
- Conducted over 60 qualitative user interviews to identify core friction points during in-app subscription renewals.

EDUCATION
Bachelor of Arts in Economics & Media Studies
University of Washington (2014 - 2018)

CORE COMPETENCIES & METHODOLOGIES
- Product Strategy: Product-Led Growth (PLG), A/B Testing, Feature Prioritization, Monetization & Pricing Strategy
- Analytics & Data: SQL, Mixpanel, Amplitude, Google Analytics 4, Tableau, Looker
- Agile Delivery: Scrum, Kanban, Jira, Confluence, Linear, Figma
- User Research: Customer Journey Mapping, Usability Testing, User Interviews, NPS Auditing`,
    job: `Lead Growth Product Manager
Company: ScaleWave Global SaaS
Location: Seattle / London / Remote Worldwide
Employment Type: Full-Time

About the Role:
ScaleWave is seeking an analytical and strategic Lead Growth Product Manager to own our product-led expansion loops and global monetization engine. You will partner with engineering, design, and growth marketing to optimize customer acquisition, activation, and revenue expansion.

Key Responsibilities:
- Define the multi-quarter growth product roadmap to increase self-serve activation and net revenue retention (NRR).
- Lead rapid-cadence experimentation (A/B testing, pricing page optimizations, viral loops, in-app paywalls).
- Analyze behavioral cohort data and funnel drop-offs using Amplitude/Mixpanel to discover high-leverage growth opportunities.
- Partner with marketing to optimize top-of-funnel organic acquisition and collaborate with sales on product-qualified lead (PQL) handoffs.
- Champion a data-driven culture: define KPIs, monitor experiment significance, and present insights to executive teams.

What We Look For:
- 5+ years of product management experience with a proven track record in growth, self-serve onboarding, or monetization.
- Strong quantitative literacy: hands-on experience querying data with SQL and interpreting multivariate A/B experiment outcomes.
- Deep familiarity with PLG mechanics, viral referral loops, and freemium-to-paid SaaS conversion benchmarks.
- Proven experience leading multidisciplinary squads with an agile mindset.
- Exceptional ability to articulate product vision and distill complex data into compelling narratives.`,
    rewrittenCv: `ELENA ROSTOVA
Seattle, WA / Berlin / Remote | +1 (206) 456-7890 | elena.rostova.pm@gmail.com | linkedin.com/in/elenarostova-pm

EXECUTIVE SUMMARY
Lead Growth Product Manager with 6+ years of experience directing product-led growth (PLG) expansion, behavioral analytics, and multi-million dollar monetization loops for enterprise and consumer SaaS platforms. Adept at steering multidisciplinary agile squads, scaling trial-to-paid conversions (+28%), and generating $3.4M in incremental ARR through rigorous SQL-driven experimentation and behavioral cohort analysis.

CORE COMPETENCIES & RECRUITER KEYWORDS
- Growth Strategy: Product-Led Growth (PLG), Net Revenue Retention (NRR), Funnel Optimization, Freemium-to-Paid Architecture
- Data & Experimentation: Multivariate A/B Testing, Cohort Analysis, SQL Querying, Amplitude, Mixpanel, Looker, Tableau
- Agile Leadership: Squad Management, Product Requirement Documents (PRDs), Roadmapping, OKR Governance, Sprint Planning
- Customer Discovery: Usability Testing, User Journey Mapping, Jobs-To-Be-Done (JTBD), PQL Lifecycle Hand-offs

PROFESSIONAL EXPERIENCE

Lead Growth Product Manager - CloudFlow Software
January 2022 - Present | Seattle, WA / Remote
- Spearheaded a 9-member cross-functional growth squad (engineering, design, data science, marketing) to redefine self-serve onboarding, driving a 28% increase in trial-to-paid conversions and generating $3.4M in incremental ARR within 12 months.
- Designed and analyzed 35+ high-velocity multivariate A/B experiments across pricing page architecture, in-app paywalls, and invite-a-colleague referral loops using Amplitude and Optimizely.
- Formulated SQL models to identify behavioral activation bottlenecks, cutting user time-to-value (TTV) from 3 days to under 40 minutes.
- Partnered with Growth Marketing to architect product-qualified lead (PQL) scoring frameworks, lifting enterprise sales pipeline conversion velocity by 34%.
- Presented quarterly product OKR milestones and strategic roadmaps directly to executive C-suite leadership.

Product Manager - Novus Mobile Apps
September 2018 - December 2021 | Remote
- Led the end-to-end product lifecycle for flagship consumer iOS and Android applications serving 2.5M monthly active users.
- Boosted Day-30 user retention from 24% to 42% through personalized event-triggered notifications and interactive onboarding milestones.
- Managed bi-weekly sprint planning, backlog grooming, and user story definitions in Jira with 100% on-time milestone delivery.
- Conducted 60+ in-depth user interviews and usability testing sessions to eliminate onboarding checkout drop-offs.

EDUCATION
Bachelor of Arts in Economics & Media Studies
University of Washington (2014 - 2018)`,
  },
  {
    id: 'finance_analyst',
    name: 'Marcus Vance',
    role: 'Senior Financial Analyst',
    industry: 'Corporate FP&A & Strategy',
    experienceLevel: '5+ Years',
    targetCompany: 'Horizon Global Capital',
    originalScore: 58,
    rewrittenScore: 95,
    cv: `MARCUS VANCE
Chicago, IL / Toronto / Remote | +1 (312) 555-0198 | marcus.vance.cfa@gmail.com | linkedin.com/in/marcusvance-finance

EXECUTIVE SUMMARY
Detail-oriented Senior Financial Analyst with 5+ years of experience in corporate FP&A, three-statement financial modeling, and strategic budget forecasting for multinational enterprises. Adept at transforming complex datasets into actionable variance analyses and executive board presentations.

PROFESSIONAL EXPERIENCE
Senior Financial Analyst, Corporate FP&A - Vanguard Industrial Corp
March 2021 - Present
- Owned annual operating budget ($140M OPEX) and rolling quarterly forecasting cycles across 6 global business units.
- Developed dynamic three-statement financial models and DCF valuation scenarios in Excel and Adaptive Insights.
- Partnered with C-suite executives to deliver monthly variance analysis packages, identifying $4.2M in annual cost efficiencies.
- Automated monthly KPI dashboard reporting in Power BI and SQL, cutting reporting turnaround time from 5 days to 6 hours.
- Supported M&A due diligence teams during two acquisition evaluations valued at $85M total enterprise value.

Financial Analyst - Meridian Advisory Partners
July 2018 - February 2021
- Conducted capital expenditure (CAPEX) ROI analyses for 18 commercial expansion projects, guiding $35M in capital deployment.
- Reconciled monthly general ledger variances with corporate accounting teams, ensuring compliance with US GAAP standards.
- Built sensitivity models evaluating foreign exchange (FX) currency exposure across North American and European suppliers.
- Authored quarterly financial performance reviews and investor deck supplementary exhibits.

EDUCATION & CREDENTIALS
Bachelor of Science in Finance & Accounting, Magna Cum Laude
University of Illinois at Urbana-Champaign (2014 - 2018)
CFA Charterholder (Chartered Financial Analyst)

TECHNICAL PROFICIENCIES
- Financial Modeling: Three-Statement Models, DCF, LBO, Scenario Analysis, Budget Forecasting
- Software & ERP: Microsoft Excel (VBA/Macros), SAP S/4HANA, NetSuite, Workday Adaptive Planning
- Data & Analytics: Power BI, Tableau, SQL queries, Alteryx
- Compliance: US GAAP, IFRS, Internal Controls, Audit Readiness`,
    job: `Senior Financial Analyst - Strategic Finance & FP&A
Company: Horizon Global Capital
Location: Chicago / New York / Remote Worldwide
Employment Type: Full-Time

About the Role:
Horizon Global Capital is looking for a high-caliber Senior Financial Analyst to join our Strategic Finance & FP&A team. In this role, you will lead enterprise financial forecasting, partner directly with executive department leaders, and evaluate high-stakes strategic growth initiatives.

Core Responsibilities:
- Lead the consolidation of annual budgets, multi-year forecasts, and monthly management reporting packages.
- Build and maintain sophisticated corporate financial models to evaluate new product lines, international expansions, and pricing changes.
- Provide strategic financial business partnering to Operations, Sales, and Engineering leadership to optimize resource allocation.
- Analyze monthly revenue trends, gross margins, and OPEX variances with actionable commentary for the Board of Directors.
- Collaborate with corporate development on financial due diligence, scenario modeling, and post-merger integration.

Required Qualifications:
- 4+ years of progressive FP&A, corporate finance, investment banking, or management consulting experience.
- Advanced expertise in financial modeling (three-statement modeling, rolling forecasts, DCF) in Excel.
- Proficiency with enterprise ERP and FP&A software (SAP, NetSuite, Adaptive Insights, or Anaplan).
- Strong data storytelling abilities: able to translate complex quantitative outputs into crisp executive presentations.
- Bachelor's degree in Finance, Accounting, Economics, or related discipline; CFA, CPA, or MBA is a distinct advantage.`,
    rewrittenCv: `MARCUS VANCE
Chicago, IL / Toronto / Remote | +1 (312) 555-0198 | marcus.vance.cfa@gmail.com | linkedin.com/in/marcusvance-finance

EXECUTIVE SUMMARY
Senior Financial Analyst & CFA Charterholder with 5+ years of progressive experience directing enterprise FP&A, three-statement corporate financial modeling, and multi-year rolling forecasts for multinational organizations. Proven track record managing $140M operating expenditure budgets, uncovering $4.2M in annual cost efficiencies, and automating Power BI reporting pipelines to compress month-end reporting cycles by 85%. Expert in US GAAP, DCF valuation, and M&A financial due diligence.

CORE COMPETENCIES & FP&A KEYWORDS
- Financial Modeling & Valuation: Three-Statement Modeling, Discounted Cash Flow (DCF), LBO, Sensitivity Scenarios, CAPEX ROI
- Planning & Forecasting: Annual Operating Budgets (AOP), Rolling Quarterly Forecasts, OPEX Variance Analysis, Strategic Business Partnering
- ERP & Software Systems: SAP S/4HANA, NetSuite, Workday Adaptive Planning, Advanced Excel (Power Query, VBA/Macros)
- Business Intelligence: Power BI, Tableau, SQL Querying, Alteryx Financial Automation
- Compliance & Standards: US GAAP, IFRS, Internal Financial Controls, Audit Governance

PROFESSIONAL EXPERIENCE

Senior Financial Analyst, Corporate FP&A - Vanguard Industrial Corp
March 2021 - Present | Chicago, IL / Hybrid
- Orchestrated the consolidation and governance of $140M global OPEX budget and rolling quarterly forecasts across 6 multinational business divisions.
- Engineered dynamic three-statement financial models and scenario planning tools in Workday Adaptive Planning, delivering monthly variance packages to C-level executives that captured $4.2M in operational savings.
- Automated monthly board financial presentation reporting via Power BI and SQL, cutting data compilation turnaround from 5 days to 6 hours.
- Supported corporate M&A leadership through two acquisition due diligence cycles valued at $85M total enterprise value, authoring pro-forma integration models.
- Partnered with cross-functional leadership across Sales, Engineering, and Operations to optimize resource allocation and head count forecasting.

Financial Analyst - Meridian Advisory Partners
July 2018 - February 2021 | Chicago, IL
- Evaluated capital expenditure (CAPEX) ROI and payback horizons for 18 strategic commercial infrastructure investments totaling $35M.
- Reconciled monthly general ledger variances with corporate accounting teams, maintaining 100% compliance with US GAAP guidelines.
- Developed foreign exchange (FX) currency sensitivity models across North American and European suppliers, protecting $1.4M against adverse currency shifts.

EDUCATION & CREDENTIALS
Bachelor of Science in Finance & Accounting, Magna Cum Laude
University of Illinois at Urbana-Champaign (2014 - 2018)
CFA Charterholder (Chartered Financial Analyst Institute)`,
  },
];

export const SAMPLE_CV = SAMPLE_PROFILES[0].cv;
export const SAMPLE_JOB_ADVERT = SAMPLE_PROFILES[0].job;

export function getSampleProfile(id: string): SampleProfile {
  return SAMPLE_PROFILES.find((p) => p.id === id) || SAMPLE_PROFILES[0];
}
