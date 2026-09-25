/**
 * CheckMyCV Worker Agent 6: Interview Coach
 * Generates tailored interview simulation pack:
 * - 5 high-probability technical & domain questions
 * - 3 behavioral curveballs
 * - Model STAR-framework talking points (Situation, Task, Action, Result)
 * - Strategic questions to ask the interview panel
 * - Salary negotiation strategy & anchor points
 */

import { JobContext } from '../types';
import { executeAgentPrompt } from '../llmClient';

export async function runInterviewCoach(ctx: JobContext): Promise<{ interview_pack: string }> {
  const company = ctx.company || 'Target Employer';
  const roleTitle = ctx.role_title || 'Target Role';

  const systemPrompt = `You are the Lead Executive Interview Coach at CheckMyCV.
Your mission is to prepare the candidate to completely dominate their interview loop at ${company} for the ${roleTitle} position.
Generate a tailored, high-converting **Interview Simulation & Preparation Pack**.

Tone: Elite executive interview coaching, empowering, concrete talking points.`;

  const userPrompt = `### INTERVIEW TARGET:
Company: ${company}
Role Title: ${roleTitle}

### CANDIDATE CV HIGHLIGHTS:
${(ctx.revised_cv || ctx.resume_text).slice(0, 1600)}

### JOB REQUIREMENTS:
${ctx.jd_text || 'Senior professional execution, cross-functional delivery'}

---
Produce the complete Interview Preparation Pack in clean markdown:
1. **The 5 High-Probability Core Role Questions** (With model bulleted answer blueprints).
2. **The 3 Behavioral Curveballs** (Conflict resolution, high-pressure failure recovery, scope pushback).
3. **Google STAR Framework Stories** (2 comprehensive STAR stories grounded in the candidate's actual experience: Situation, Task, Action, Result).
4. **5 Strategic Reverse-Questions to Ask the Executive Panel** (Questions that make interviewers say "Wow, great question").
5. **Salary Negotiation Posture & Compensation Anchoring** (Scripts on how to deflect early salary screens and negotiate top-of-band compensation).`;

  let response = await executeAgentPrompt(ctx, systemPrompt, userPrompt, 0.3);

  if (!response || response.trim().length < 100) {
    response = `### Master Interview Preparation & Simulation Pack
**Target Employer:** ${company} | **Position:** ${roleTitle}

---

#### 1. Core Technical & Competency Questions
1. **"Walk me through your most complex project relevant to ${roleTitle}."**
   - *Key Talking Points:* Frame the business problem, your architectural choices, cross-functional collaboration, and the quantified metric outcome.
2. **"How do you prioritize competing deadlines across multiple stakeholders?"**
   - *Key Talking Points:* Outline your framework (Impact vs Effort matrix), transparent communication cadences, and proactive expectation setting.
3. **"Describe a time you identified an operational inefficiency and fixed it."**
   - *Key Talking Points:* Reference concrete time or dollar savings achieved through automation or process refinement.

#### 2. Behavioral Curveball Questions & Handling
- **"Tell me about a time a project failed or missed its delivery target."**
  - *Strategy:* Never blame teammates. Own the outcome, explain root-cause analysis, and highlight the systemic safeguard you instituted to ensure it never occurred again.
- **"How do you handle disagreement with a senior stakeholder or manager?"**
  - *Strategy:* Focus on data over opinion. Validate their perspective, present objective impact models, and commit 100% once a decision is finalized.

#### 3. High-Impact STAR Story Blueprint
- **Situation:** Identified performance bottlenecks and escalating operational spend across legacy infrastructure.
- **Task:** Mandated to modernize core pipelines while maintaining zero unscheduled downtime for end users.
- **Action:** Spearheaded containerization, introduced automated CI/CD validation, and implemented auto-scaling guardrails.
- **Result:** Cut deployment latency by 65%, eliminated manual rollbacks, and saved $35,000+ in annual operational overhead.

#### 4. High-Caliber Reverse Questions to Ask the Panel
1. *"What does the ideal outcome look like for this role in the first 90 days?"*
2. *"What is the biggest operational hurdle your team is currently working to resolve this quarter?"*
3. *"How does the executive leadership team measure excellence in this division?"*

#### 5. Salary Negotiation Posture & Anchoring
When asked: *"What are your salary expectations?"*
> **Script:** *"I want to ensure this is an exceptional long-term mutual fit for both of us before focusing on compensation. Once we agree that I am the ideal candidate to deliver outcomes for ${company}, I am confident we will arrive at a competitive package aligned with market benchmarks."*`;
  }

  return {
    interview_pack: response,
  };
}
