/**
 * CheckMyCV Worker Agent 5: Career Strategist
 * Generates the executive Shortlist Strategy Kit:
 * - Target company positioning & cultural cues
 * - Hiring manager direct outreach pitch (email + LinkedIn script)
 * - 30-60-90 day impact thesis
 * - Application timing & referral strategy
 */

import { JobContext } from '../types';
import { executeAgentPrompt } from '../llmClient';

export async function runCareerStrategist(ctx: JobContext): Promise<{ strategy_pack: string }> {
  const company = ctx.company || 'Target Employer';
  const roleTitle = ctx.role_title || 'Target Role';

  const systemPrompt = `You are the Lead Executive Career Strategist at CheckMyCV.
Your objective is to arm the candidate with an unfair competitive advantage when applying to ${company} for the ${roleTitle} position.
You will deliver a comprehensive, actionable **Executive Shortlist Kit**.

Tone: High-level management consulting style, highly strategic, insider recruitment perspective.`;

  const userPrompt = `### TARGET APPLICATION CONTEXT:
Company: ${company}
Target Role: ${roleTitle}
Target ATS: ${ctx.ats_name}

### CANDIDATE RESUME SUMMARY:
${(ctx.revised_cv || ctx.resume_text).slice(0, 1500)}

### TARGET JOB ADVERT:
${ctx.jd_text || 'Enterprise leadership & operational execution'}

---
Produce the complete Shortlist Strategy Kit in clean markdown:
1. **Target Company Strategic Positioning & Value Thesis** (Why this candidate is uniquely suited to solve ${company}'s immediate priorities).
2. **Direct Hiring Manager Outreach Script (Cold Email)** (Subject line + 3-paragraph value-first pitch).
3. **LinkedIn Connection Note (Under 300 Characters)** (High-conversion personalized intro).
4. **30-60-90 Day High-Impact Blueprint** (Month 1 discovery, Month 2 optimization, Month 3 scale).
5. **Backchannel Referral & Insider Networking Tactics** (How to identify internal champions before hitting submit).`;

  let response = await executeAgentPrompt(ctx, systemPrompt, userPrompt, 0.3);

  if (!response || response.trim().length < 100) {
    response = `### Executive Shortlist Strategy Kit
**Target Employer:** ${company} | **Position:** ${roleTitle}

---

#### 1. Strategic Value Proposition
When applying to ${company}, hiring executives look for candidates who minimize onboarding risk while accelerating immediate team velocity. Your profile positions you as a hands-on executor capable of translating business requirements into robust, high-availability outcomes.

#### 2. Direct Hiring Manager Outreach Email
**Subject:** ${roleTitle} at ${company} — Strategic Value & Infrastructure Alignment

Dear [Hiring Manager Name / Department Lead],

I noticed ${company} is currently expanding its ${roleTitle} team to support key business milestones. With a proven track record delivering measurable operational improvements and architecting robust solutions, I wanted to reach out directly.

In my recent engagements, I spearheaded initiatives that optimized workflow throughput, reduced operating overhead, and guaranteed 99.9%+ service reliability across cross-functional teams.

I would welcome 10 minutes to discuss how my hands-on background can help ${company} hit its quarterly delivery targets. I have attached my resume for your review.

Best regards,  
[Your Name]  
[Your Phone] | [Your LinkedIn]

#### 3. High-Conversion LinkedIn Connection Script (<300 chars)
> "Hi [Name], saw ${company}'s work in your division and would love to connect. I specialize in ${roleTitle} execution and follow your team's industry milestones closely. Looking forward to keeping in touch!"

#### 4. 30-60-90 Day Impact Blueprint
- **First 30 Days (Discovery & Calibration):** Audit existing workflows, establish stakeholder alignment, and document quick-win operational improvements.
- **Days 31-60 (Execution & Optimization):** Implement prioritized enhancements, automate repetitive tasks, and measure performance against team KPIs.
- **Days 61-90 (Scale & Knowledge Transfer):** Standardize SOPs, mentor peer contributors, and present quarterly optimization metrics to department leadership.`;
  }

  return {
    strategy_pack: response,
  };
}
