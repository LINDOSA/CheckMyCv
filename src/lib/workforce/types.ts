/**
 * CheckMyCV Workforce Engine: Types & Interfaces
 * The unified JobContext and SSE streaming protocol for the 6-agent workforce.
 */

export type AtsEngineName =
  | 'Workday'
  | 'Greenhouse'
  | 'Lever'
  | 'Taleo'
  | 'Ashby'
  | 'BambooHR'
  | 'Generic';

export type WorkerName =
  | 'ats_analyst'
  | 'hr_director'
  | 'cv_rewriter'
  | 'qa_auditor'
  | 'career_strategist'
  | 'interview_coach';

export type QaStatus = 'PASS' | 'FAIL' | 'REVIEW';

export interface WorkerLogEntry {
  worker: WorkerName | 'supervisor';
  action: string;
  summary: string;
  ats_score?: number;
  human_score?: number;
  qa_status?: QaStatus;
  loop?: number;
  timestamp: string;
}

export interface JobContext {
  // ── Input ──
  job_id: string;
  user_id: string;
  resume_text: string;
  jd_text: string;
  ats_name: AtsEngineName;
  company: string;
  role_title: string;

  // ── Worker outputs ──
  ats_report?: string;
  ats_score: number;
  hr_report?: string;
  human_score: number;
  revised_cv?: string;
  change_log?: string;
  qa_status?: QaStatus;
  qa_audit?: Record<string, any>;
  qa_feedback?: string;
  strategy_pack?: string;
  interview_pack?: string;

  // ── Control & Tracking ──
  rewrite_loops: number;
  worker_log: WorkerLogEntry[];
  tokens_used: number;
  cost_usd: number;
  status: 'queued' | 'running' | 'completed' | 'failed';
  error?: string;
  started_at: string;
  finished_at?: string;
}

export type WorkforceEventType =
  | 'job_started'
  | 'worker_started'
  | 'worker_progress'
  | 'worker_finished'
  | 'worker_failed'
  | 'loop_decision'
  | 'job_finished';

export interface WorkforceEvent {
  event: WorkforceEventType;
  job_id: string;
  timestamp: string;
  data: {
    worker?: WorkerName | 'supervisor';
    worker_label?: string;
    description?: string;
    loop?: number;
    ats_score?: number;
    human_score?: number;
    qa_status?: QaStatus;
    summary?: string;
    error?: string;
    result?: Record<string, any>;
  };
}

export type EventBroadcaster = (event: WorkforceEvent) => void;

/**
 * Public DTO safe to return to the frontend UI
 */
export function serializePublicContext(ctx: JobContext): Record<string, any> {
  return {
    job_id: ctx.job_id,
    status: ctx.status,
    company: ctx.company,
    role_title: ctx.role_title,
    ats_name: ctx.ats_name,
    ats_score: ctx.ats_score,
    human_score: ctx.human_score,
    qa_status: ctx.qa_status,
    ats_report: ctx.ats_report,
    hr_report: ctx.hr_report,
    revised_cv: ctx.revised_cv,
    change_log: ctx.change_log,
    qa_feedback: ctx.qa_feedback,
    strategy_pack: ctx.strategy_pack,
    interview_pack: ctx.interview_pack,
    rewrite_loops: ctx.rewrite_loops,
    worker_log: ctx.worker_log,
    started_at: ctx.started_at,
    finished_at: ctx.finished_at,
    cost_usd: Math.round(ctx.cost_usd * 10000) / 10000,
    download_urls: {
      cv_docx: `/api/v1/jobs/${ctx.job_id}/download/cv_docx`,
      cv_pdf: `/api/v1/jobs/${ctx.job_id}/download/cv_pdf`,
      strategy_kit: `/api/v1/jobs/${ctx.job_id}/download/strategy_kit`,
      interview_pack: `/api/v1/jobs/${ctx.job_id}/download/interview_pack`,
    },
  };
}
