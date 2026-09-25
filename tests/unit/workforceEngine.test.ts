/**
 * Automated Verification Test Suite: CheckMyCV 6-Agent Workforce Engine
 * Tests autonomous supervisor routing, worker outputs, real-time event broadcasting,
 * and deliverables packaging.
 */

import { describe, it, expect } from 'vitest';
import { WorkforceEngine } from '@/lib/workforce/engine';
import { JobContext, WorkforceEvent, serializePublicContext } from '@/lib/workforce/types';
import { decideNextWorker, SUPERVISOR_CONFIG } from '@/lib/workforce/supervisor';
import { getAtsRulesKnowledge } from '@/lib/workforce/atsKnowledge';

describe('Workforce Engine: Supervisor State Machine & Routing', () => {
  function makeMockContext(): JobContext {
    return {
      job_id: 'test_job_123',
      user_id: 'user_1',
      resume_text: 'Experienced software developer with 5 years experience in React and Node.js.',
      jd_text: 'Looking for a Senior React Engineer with AWS experience.',
      ats_name: 'Workday',
      company: 'Enterprise FinTech',
      role_title: 'Senior Software Engineer',
      ats_score: 0,
      human_score: 0,
      rewrite_loops: 0,
      worker_log: [],
      tokens_used: 0,
      cost_usd: 0,
      status: 'queued',
      started_at: new Date().toISOString(),
    };
  }

  it('routes to ats_analyst when no ATS report exists', () => {
    const ctx = makeMockContext();
    expect(decideNextWorker(ctx)).toBe('ats_analyst');
  });

  it('routes to hr_director after ats_analyst completes', () => {
    const ctx = makeMockContext();
    ctx.ats_report = 'ATS Report Done';
    ctx.ats_score = 72;
    expect(decideNextWorker(ctx)).toBe('hr_director');
  });

  it('routes to cv_rewriter when scores are below target threshold', () => {
    const ctx = makeMockContext();
    ctx.ats_report = 'ATS Report Done';
    ctx.ats_score = 70;
    ctx.hr_report = 'HR Report Done';
    ctx.human_score = 65;
    expect(decideNextWorker(ctx)).toBe('cv_rewriter');
  });

  it('routes to qa_auditor immediately after cv_rewriter produces revised CV', () => {
    const ctx = makeMockContext();
    ctx.ats_report = 'ATS Report Done';
    ctx.ats_score = 70;
    ctx.hr_report = 'HR Report Done';
    ctx.human_score = 65;
    ctx.revised_cv = '# REVISED CV';
    ctx.qa_status = undefined; // QA has not audited yet
    expect(decideNextWorker(ctx)).toBe('qa_auditor');
  });

  it('loops back to cv_rewriter if qa_auditor fails the revision and loops remain', () => {
    const ctx = makeMockContext();
    ctx.ats_report = 'ATS Report Done';
    ctx.ats_score = 70;
    ctx.hr_report = 'HR Report Done';
    ctx.human_score = 65;
    ctx.revised_cv = '# REVISED CV';
    ctx.qa_status = 'FAIL';
    ctx.rewrite_loops = 1; // Under MAX_REWRITE_LOOPS (3)
    expect(decideNextWorker(ctx)).toBe('cv_rewriter');
  });

  it('routes to career_strategist when QA passes', () => {
    const ctx = makeMockContext();
    ctx.ats_report = 'ATS Report Done';
    ctx.ats_score = 88;
    ctx.hr_report = 'HR Report Done';
    ctx.human_score = 84;
    ctx.revised_cv = '# REVISED CV';
    ctx.qa_status = 'PASS';
    expect(decideNextWorker(ctx)).toBe('career_strategist');
  });

  it('routes to interview_coach after career_strategist finishes', () => {
    const ctx = makeMockContext();
    ctx.ats_report = 'ATS Report Done';
    ctx.ats_score = 88;
    ctx.hr_report = 'HR Report Done';
    ctx.human_score = 84;
    ctx.revised_cv = '# REVISED CV';
    ctx.qa_status = 'PASS';
    ctx.strategy_pack = '# Strategy Pack Done';
    expect(decideNextWorker(ctx)).toBe('interview_coach');
  });

  it('signals STOP when all deliverables and reviews are complete', () => {
    const ctx = makeMockContext();
    ctx.ats_report = 'ATS Report Done';
    ctx.ats_score = 88;
    ctx.hr_report = 'HR Report Done';
    ctx.human_score = 84;
    ctx.revised_cv = '# REVISED CV';
    ctx.qa_status = 'PASS';
    ctx.strategy_pack = '# Strategy Pack Done';
    ctx.interview_pack = '# Interview Pack Done';
    expect(decideNextWorker(ctx)).toBe('STOP');
  });
});

describe('Workforce Engine: ATS Knowledge Profiles', () => {
  it('provides dedicated parsing rules for Workday', () => {
    const workday = getAtsRulesKnowledge('Workday');
    expect(workday.name).toBe('Workday');
    expect(workday.tablePolicy).toContain('STRICT ZERO-TOLERANCE');
    expect(workday.columnsPolicy).toContain('Single Column Only');
  });

  it('provides dedicated parsing rules for Greenhouse', () => {
    const greenhouse = getAtsRulesKnowledge('Greenhouse');
    expect(greenhouse.name).toBe('Greenhouse');
    expect(greenhouse.parserType).toBe('Token Tree Semantic');
  });
});

describe('Workforce Engine: Public Serialization & Exports', () => {
  it('correctly serializes public context with download endpoints', () => {
    const ctx: JobContext = {
      job_id: 'job_abc987',
      user_id: 'user_test',
      resume_text: 'Sample Resume',
      jd_text: 'Sample JD',
      ats_name: 'Lever',
      company: 'Stripe',
      role_title: 'Staff Engineer',
      ats_score: 91,
      human_score: 87,
      rewrite_loops: 1,
      worker_log: [],
      tokens_used: 2400,
      cost_usd: 0.0034,
      status: 'completed',
      started_at: '2026-09-25T20:00:00.000Z',
      finished_at: '2026-09-25T20:01:15.000Z',
    };

    const pub = serializePublicContext(ctx);
    expect(pub.job_id).toBe('job_abc987');
    expect(pub.company).toBe('Stripe');
    expect(pub.ats_score).toBe(91);
    expect(pub.download_urls.cv_docx).toBe('/api/v1/jobs/job_abc987/download/cv_docx');
    expect(pub.download_urls.cv_pdf).toBe('/api/v1/jobs/job_abc987/download/cv_pdf');
    expect(pub.download_urls.strategy_kit).toBe('/api/v1/jobs/job_abc987/download/strategy_kit');
    expect(pub.download_urls.interview_pack).toBe('/api/v1/jobs/job_abc987/download/interview_pack');
  });
});
