import { NextRequest, NextResponse } from 'next/server';
import { JobContext, AtsEngineName } from '@/lib/workforce/types';
import { WorkforceEngine } from '@/lib/workforce/engine';
import { jobStore } from '@/lib/workforce/jobStore';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      resume_text,
      jd_text = '',
      ats_name = 'Generic',
      company = 'Enterprise Employer',
      role_title = 'Target Role',
    } = body;

    if (!resume_text || typeof resume_text !== 'string' || resume_text.trim().length < 20) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide valid resume text with at least 20 characters.',
        },
        { status: 400 }
      );
    }

    const validAtsNames: AtsEngineName[] = [
      'Workday',
      'Greenhouse',
      'Lever',
      'Taleo',
      'Ashby',
      'BambooHR',
      'Generic',
    ];
    const normalizedAts: AtsEngineName = validAtsNames.includes(ats_name as AtsEngineName)
      ? (ats_name as AtsEngineName)
      : 'Generic';

    const jobId = `job_${randomUUID().replace(/-/g, '').slice(0, 16)}`;

    const ctx: JobContext = {
      job_id: jobId,
      user_id: 'anonymous',
      resume_text: resume_text.trim(),
      jd_text: typeof jd_text === 'string' ? jd_text.trim() : '',
      ats_name: normalizedAts,
      company: typeof company === 'string' && company.trim().length > 0 ? company.trim() : 'Enterprise Employer',
      role_title: typeof role_title === 'string' && role_title.trim().length > 0 ? role_title.trim() : 'Target Role',
      ats_score: 0,
      human_score: 0,
      rewrite_loops: 0,
      worker_log: [],
      tokens_used: 0,
      cost_usd: 0,
      status: 'queued',
      started_at: new Date().toISOString(),
    };

    jobStore.saveJob(ctx);

    // Launch workforce engine asynchronously in the background
    const engine = new WorkforceEngine();
    // Fire and do not await so HTTP response returns instantly
    engine.run(ctx).catch((err) => {
      console.error(`[API /api/v1/jobs] Background execution error on ${jobId}:`, err);
    });

    return NextResponse.json({
      success: true,
      job_id: jobId,
      status: 'queued',
      ats_name: normalizedAts,
      company: ctx.company,
      role_title: ctx.role_title,
      stream_url: `/api/v1/jobs/${jobId}/stream`,
      status_url: `/api/v1/jobs/${jobId}`,
    });
  } catch (error: any) {
    console.error('[API /api/v1/jobs] Submission error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to submit workforce job.',
      },
      { status: 500 }
    );
  }
}
