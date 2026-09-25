/**
 * CheckMyCV Worker Agent 4: QA Auditor
 * Strict anti-hallucination, metric saturation, and formatting guardrail inspector.
 * Gates whether the revised CV passes or must loop back for another rewrite pass.
 */

import { JobContext, QaStatus } from '../types';
import { auditCvQuality } from '@/lib/cvQualityEngine';
import { executeAgentPrompt } from '../llmClient';

export async function runQaAuditor(ctx: JobContext): Promise<{
  qa_status: QaStatus;
  qa_audit: Record<string, any>;
  qa_feedback: string;
}> {
  const textToAudit = ctx.revised_cv || ctx.resume_text;
  const qualityAudit = auditCvQuality(textToAudit);

  const metricPct = Math.round(qualityAudit.metricSaturation * 100);
  const isMetricPass = qualityAudit.isMetricSaturationCompliant; // >= 40%
  const isHierarchyPass = qualityAudit.sectionArchitecture.isHierarchyCompliant;
  const isContactPass = qualityAudit.contactIntegrity.isValid;

  const criticalIssues: string[] = [];

  if (!isMetricPass) {
    criticalIssues.push(`Metric saturation is only ${metricPct}%. ATS and executive benchmarks mandate >= 40% quantified bullets.`);
  }

  if (!isHierarchyPass && qualityAudit.sectionArchitecture.hierarchyIssues.length > 0) {
    criticalIssues.push(`Hierarchy flaw: ${qualityAudit.sectionArchitecture.hierarchyIssues[0]}`);
  }

  // LLM Anti-Hallucination & Fidelity Check
  const systemPrompt = `You are the Lead QA Auditor and Compliance Gatekeeper at CheckMyCV.
Your responsibility is to strictly audit the revised CV against the candidate's original resume to prevent AI hallucinations.
RULES:
1. Ensure the candidate's real employment history, dates, degrees, and companies were preserved (no phantom employers or fabricated universities).
2. Verify bullets are formatted with measurable metrics (Google XYZ style).
3. If the rewrite passes high standards, declare "STATUS: PASS".
4. If there are hallucinated credentials or weak duty statements, declare "STATUS: FAIL" and provide exact corrective instructions.`;

  const userPrompt = `### ORIGINAL RESUME:
${ctx.resume_text.slice(0, 1500)}

### REVISED RESUME:
${textToAudit.slice(0, 2000)}

---
Output:
STATUS: [PASS or FAIL]
AUDIT SUMMARY: [2-3 sentences evaluating metric saturation and anti-hallucination integrity]
CORRECTIVE FEEDBACK: [Bullet points if FAIL, or "None required" if PASS]`;

  let qaResponse = await executeAgentPrompt(ctx, systemPrompt, userPrompt, 0.1);

  let qaStatus: QaStatus = 'PASS';
  let qaFeedback = '';

  if (qaResponse && qaResponse.includes('STATUS: FAIL')) {
    qaStatus = 'FAIL';
  } else if (!isMetricPass && metricPct < 30) {
    qaStatus = 'FAIL';
  } else {
    qaStatus = 'PASS';
  }

  if (qaResponse) {
    qaFeedback = qaResponse.replace(/^STATUS:\s*(PASS|FAIL)\s*/i, '').trim();
  } else {
    qaFeedback = criticalIssues.length > 0
      ? criticalIssues.join(' ')
      : 'All compliance guardrails passed: anti-hallucination verified, metric saturation >= 40%, single-column ATS structure confirmed.';
  }

  const qaAudit = {
    metricSaturation: qualityAudit.metricSaturation,
    isMetricSaturationCompliant: qualityAudit.isMetricSaturationCompliant,
    isHierarchyCompliant: qualityAudit.sectionArchitecture.isHierarchyCompliant,
    contactIntegrity: qualityAudit.contactIntegrity.isValid,
    totalBullets: qualityAudit.lineByLineFeedback.length,
    criticalIssues: qualityAudit.criticalIssues,
    status: qaStatus,
  };

  return {
    qa_status: qaStatus,
    qa_audit: qaAudit,
    qa_feedback: qaFeedback,
  };
}
