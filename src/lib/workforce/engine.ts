/**
 * CheckMyCV Workforce Engine: The Main Workforce Orchestrator
 * Coordinates the autonomous multi-agent pipeline, emits real-time events,
 * and tracks token and monetary cost.
 */

import { JobContext, WorkerName, WorkforceEvent, EventBroadcaster } from './types';
import { decideNextWorker } from './supervisor';
import { jobStore } from './jobStore';

// Workers
import { runAtsAnalyst } from './workers/atsAnalyst';
import { runHrDirector } from './workers/hrDirector';
import { runCvRewriter } from './workers/cvRewriter';
import { runQaAuditor } from './workers/qaAuditor';
import { runCareerStrategist } from './workers/careerStrategist';
import { runInterviewCoach } from './workers/interviewCoach';

const WORKER_METADATA: Record<WorkerName, { label: string; description: string }> = {
  ats_analyst: {
    label: 'ATS Systems Analyst',
    description: 'Scanning parser compliance, font/table traps, and keyword coverage against target ATS engine.',
  },
  hr_director: {
    label: 'Executive Talent Director',
    description: 'Executing the 6-second recruiter skim test, evaluating executive presence and commercial achievements.',
  },
  cv_rewriter: {
    label: 'Master Resume Writer',
    description: 'Transforming passive duties into high-impact Google XYZ formula bullets and injecting domain keywords.',
  },
  qa_auditor: {
    label: 'Quality & Truth Auditor',
    description: 'Verifying anti-hallucination guardrails, checking metric saturation, and auditing section hierarchy.',
  },
  career_strategist: {
    label: 'Career Strategist',
    description: 'Drafting executive shortlist kit, cold outreach pitch to hiring manager, and 30-60-90 day blueprint.',
  },
  interview_coach: {
    label: 'Interview Simulation Coach',
    description: 'Generating 5 core technical questions, 3 behavioral curveballs, STAR blueprints, and salary negotiation posture.',
  },
};

export class WorkforceEngine {
  private emit: EventBroadcaster;

  constructor(emit?: EventBroadcaster) {
    this.emit = emit || ((event) => jobStore.broadcast(event));
  }

  public async run(ctx: JobContext): Promise<JobContext> {
    ctx.status = 'running';
    jobStore.saveJob(ctx);

    this.emit({
      event: 'job_started',
      job_id: ctx.job_id,
      timestamp: new Date().toISOString(),
      data: {
        summary: `Workforce initiated for ${ctx.role_title || 'Target Role'} at ${ctx.company || 'Enterprise Employer'} (${ctx.ats_name})`,
      },
    });

    try {
      while (true) {
        const nextWorker = decideNextWorker(ctx);

        if (nextWorker === 'STOP') {
          break;
        }

        const meta = WORKER_METADATA[nextWorker];
        const loop = nextWorker === 'cv_rewriter' ? ctx.rewrite_loops + 1 : ctx.rewrite_loops;

        this.emit({
          event: 'worker_started',
          job_id: ctx.job_id,
          timestamp: new Date().toISOString(),
          data: {
            worker: nextWorker,
            worker_label: meta.label,
            description: meta.description,
            loop,
          },
        });

        // Execute worker
        const workerStart = Date.now();
        let summary = '';

        if (nextWorker === 'ats_analyst') {
          const res = await runAtsAnalyst(ctx);
          ctx.ats_report = res.ats_report;
          ctx.ats_score = res.ats_score;
          summary = `ATS Compliance Audit completed. Score: ${res.ats_score}/100.`;
        } else if (nextWorker === 'hr_director') {
          const res = await runHrDirector(ctx);
          ctx.hr_report = res.hr_report;
          ctx.human_score = res.human_score;
          summary = `Recruiter Skim completed. Human Score: ${res.human_score}/100.`;
        } else if (nextWorker === 'cv_rewriter') {
          ctx.rewrite_loops += 1;
          const res = await runCvRewriter(ctx);
          ctx.revised_cv = res.revised_cv;
          ctx.change_log = res.change_log;
          // Clear QA status so QA auditor re-inspects the new revision
          ctx.qa_status = undefined;
          summary = `CV rewrite pass #${ctx.rewrite_loops} completed using Google XYZ formula.`;
        } else if (nextWorker === 'qa_auditor') {
          const res = await runQaAuditor(ctx);
          ctx.qa_status = res.qa_status;
          ctx.qa_audit = res.qa_audit;
          ctx.qa_feedback = res.qa_feedback;
          summary = `QA Compliance Audit: ${res.qa_status} (Metric Saturation: ${Math.round((res.qa_audit.metricSaturation || 0) * 100)}%).`;
        } else if (nextWorker === 'career_strategist') {
          const res = await runCareerStrategist(ctx);
          ctx.strategy_pack = res.strategy_pack;
          summary = 'Executive Shortlist Strategy Kit & outreach scripts generated.';
        } else if (nextWorker === 'interview_coach') {
          const res = await runInterviewCoach(ctx);
          ctx.interview_pack = res.interview_pack;
          summary = 'Interview simulation questions, STAR answer blueprints, and negotiation scripts generated.';
        }

        const elapsedMs = Date.now() - workerStart;

        ctx.worker_log.push({
          worker: nextWorker,
          action: meta.label,
          summary,
          ats_score: ctx.ats_score,
          human_score: ctx.human_score,
          qa_status: ctx.qa_status,
          loop: ctx.rewrite_loops,
          timestamp: new Date().toISOString(),
        });

        jobStore.saveJob(ctx);

        this.emit({
          event: 'worker_finished',
          job_id: ctx.job_id,
          timestamp: new Date().toISOString(),
          data: {
            worker: nextWorker,
            worker_label: meta.label,
            ats_score: ctx.ats_score,
            human_score: ctx.human_score,
            qa_status: ctx.qa_status,
            loop: ctx.rewrite_loops,
            summary,
          },
        });
      }

      ctx.status = 'completed';
      ctx.finished_at = new Date().toISOString();
      jobStore.saveJob(ctx);

      this.emit({
        event: 'job_finished',
        job_id: ctx.job_id,
        timestamp: new Date().toISOString(),
        data: {
          summary: 'All 6 workforce agents completed successfully.',
          ats_score: ctx.ats_score,
          human_score: ctx.human_score,
          qa_status: ctx.qa_status,
        },
      });

      return ctx;
    } catch (err: any) {
      console.error('[WorkforceEngine] Error during pipeline execution:', err);
      ctx.status = 'failed';
      ctx.error = err?.message || 'Unexpected workforce pipeline error';
      jobStore.saveJob(ctx);

      this.emit({
        event: 'worker_failed',
        job_id: ctx.job_id,
        timestamp: new Date().toISOString(),
        data: {
          error: ctx.error,
        },
      });

      return ctx;
    }
  }
}
