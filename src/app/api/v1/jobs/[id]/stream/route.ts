import { NextRequest } from 'next/server';
import { jobStore } from '@/lib/workforce/jobStore';
import { WorkforceEvent } from '@/lib/workforce/types';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const jobId = params.id;
  const ctx = jobStore.getJob(jobId);

  if (!ctx) {
    return new Response(
      JSON.stringify({ error: `Job with ID '${jobId}' not found.` }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 1. Send current status immediately upon connection
      const initialEvent: WorkforceEvent = {
        event: ctx.status === 'completed' ? 'job_finished' : 'job_started',
        job_id: ctx.job_id,
        timestamp: new Date().toISOString(),
        data: {
          summary: `Connected to workforce stream for ${ctx.role_title} at ${ctx.company}`,
          ats_score: ctx.ats_score,
          human_score: ctx.human_score,
          qa_status: ctx.qa_status,
          loop: ctx.rewrite_loops,
        },
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialEvent)}\n\n`));

      // If already finished, close stream cleanly
      if (ctx.status === 'completed' || ctx.status === 'failed') {
        controller.close();
        return;
      }

      // 2. Subscribe to live progress broadcasts
      const unsubscribe = jobStore.subscribe(jobId, (event: WorkforceEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          if (event.event === 'job_finished' || event.event === 'worker_failed') {
            unsubscribe();
            controller.close();
          }
        } catch (err) {
          unsubscribe();
        }
      });

      // Handle client disconnect
      req.signal.addEventListener('abort', () => {
        unsubscribe();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
