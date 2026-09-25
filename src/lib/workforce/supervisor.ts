/**
 * CheckMyCV Workforce Engine: Supervisor Routing Logic
 * Implements the autonomous manager state machine that routes
 * between the 6 specialized workers based on quantitative score gates and loop limits.
 */

import { JobContext, WorkerName } from './types';

export const SUPERVISOR_CONFIG = {
  TARGET_ATS: 85,
  TARGET_HUMAN: 80,
  MAX_REWRITE_LOOPS: 3,
};

/**
 * Evaluates the current JobContext state and decides the next worker agent to run.
 * Returns the WorkerName or 'STOP' when the workforce pipeline is complete.
 */
export function decideNextWorker(ctx: JobContext): WorkerName | 'STOP' {
  // Step 1: Baseline ATS Diagnostic Audit
  if (!ctx.ats_report) {
    return 'ats_analyst';
  }

  // Step 2: Baseline Human Recruiter Skim Audit
  if (!ctx.hr_report) {
    return 'hr_director';
  }

  // Step 3: Check if initial scores meet top-tier thresholds (ATS >= 85 and Human >= 80)
  const scoresSatisfied =
    ctx.ats_score >= SUPERVISOR_CONFIG.TARGET_ATS &&
    ctx.human_score >= SUPERVISOR_CONFIG.TARGET_HUMAN;

  // If scores need improvement and we haven't done a rewrite yet
  if (!scoresSatisfied && !ctx.revised_cv && ctx.rewrite_loops < SUPERVISOR_CONFIG.MAX_REWRITE_LOOPS) {
    return 'cv_rewriter';
  }

  // Step 4: After a rewrite is produced, QA Auditor must inspect truth and metric saturation
  if (ctx.revised_cv && !ctx.qa_status) {
    return 'qa_auditor';
  }

  // Step 5: If QA failed and loops remain, loop back to CV rewriter with QA feedback
  if (ctx.qa_status === 'FAIL' && ctx.rewrite_loops < SUPERVISOR_CONFIG.MAX_REWRITE_LOOPS) {
    return 'cv_rewriter';
  }

  // Step 6: Once passing (or max loops reached), produce executive deliverables
  if (!ctx.strategy_pack) {
    return 'career_strategist';
  }

  if (!ctx.interview_pack) {
    return 'interview_coach';
  }

  // All deliverables generated and reviewed
  return 'STOP';
}
