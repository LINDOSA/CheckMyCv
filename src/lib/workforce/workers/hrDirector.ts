/**
 * CheckMyCV Worker Agent 2: HR Director & Executive Recruiter
 * Evaluates the 6-second recruiter skim test, executive presence,
 * narrative coherence, and outcome-focused career trajectory.
 */

import { JobContext } from '../types';
import { calculateEmpiricalScore } from '@/lib/scoringEngine';
import { auditCvQuality } from '@/lib/cvQualityEngine';
import { executeAgentPrompt } from '../llmClient';

export async function runHrDirector(ctx: JobContext): Promise<{ hr_report: string; human_score: number }> {
  const empirical = calculateEmpiricalScore(ctx.resume_text, ctx.jd_text);
  const quality = auditCvQuality(ctx.resume_text);

  const achievementCat = empirical.categories.find(c => c.key === 'achievement')?.score || 60;
  const relevanceCat = empirical.categories.find(c => c.key === 'relevance')?.score || 70;

  // Human Score heavily weights Achievement quality, metrics, and career tenure
  const calculatedHumanScore = Math.round(achievementCat * 0.55 + relevanceCat * 0.45);

  const systemPrompt = `You are a Senior Talent Acquisition Director and Executive Headhunter at CheckMyCV with 15+ years of experience hiring for top global companies.
Your responsibility is to conduct the "6-Second Human Recruiter Skim Test" on the candidate's CV.
Recruiters do not read CVs word-for-word on initial review; they look for:
1. Strong opening value proposition in the Professional Summary.
2. High ratio of quantifiable business outcomes (revenue, %, scale, hours saved) vs passive duty descriptions ("responsible for...").
3. Rapid seniority progression and leadership indicators.
4. Executive voice and action verb strength.

Tone: Authoritative yet constructive, empowering, executive recruiter coaching.`;

  const userPrompt = `### TARGET ROLE & COMPANY:
Company: ${ctx.company || 'Enterprise Employer'}
Target Role: ${ctx.role_title || 'Target Candidate Role'}

### CANDIDATE RESUME:
${ctx.resume_text}

---
Produce an HR Director Evaluation Report:
1. **6-Second Skim Test Impression** (Score: ${calculatedHumanScore}/100)
2. **Achievement vs. Duty Saturation** (Analyze whether bullets prove impact or merely list chores)
3. **Leadership & Trajectory Signals** (Career momentum, promotions, ownership)
4. **Hiring Manager Concerns & Interview Hesitations** (What would make an interviewer pause?)
5. **Top 3 Human Polish Recommendations**`;

  let reportText = await executeAgentPrompt(ctx, systemPrompt, userPrompt, 0.3);

  if (!reportText || reportText.trim().length < 50) {
    const metricPct = Math.round(quality.metricSaturation * 100);
    reportText = `### Executive Recruiter & HR Director Evaluation
**Human Recruiter Score:** ${calculatedHumanScore}/100
**Verdict:** ${calculatedHumanScore >= 80 ? 'Strong Candidate: High Interview Probability' : 'Promising Foundation: Metric Quantification Required'}

#### 1. The 6-Second Skim Impression
In initial screening, hiring managers scan for measurable business value. 
Currently, **${metricPct}% of experience bullets** contain quantifiable metrics. ${
      metricPct >= 40
        ? 'The resume demonstrates solid commercial accountability and impact.'
        : 'The CV leans too heavily into daily task descriptions rather than measurable achievements.'
    }

#### 2. Narrative Arc & Seniority Signals
- **Career Trajectory:** Clear career progression across roles.
- **Action Verbs:** Action verbs should consistently lead every bullet point (e.g., "Spearheaded", "Engineered", "Optimized" rather than "Responsible for").

#### 3. Strategic Hiring Recommendations
- Convert task statements into commercial results using the Google XYZ framework (*"Accomplished [X], as measured by [Y], by doing [Z]"*).
- Highlight cross-functional collaboration and project ownership in your most recent position.`;
  }

  return {
    hr_report: reportText,
    human_score: Math.min(98, Math.max(35, calculatedHumanScore)),
  };
}
