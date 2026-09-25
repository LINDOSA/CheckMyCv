import { NextRequest, NextResponse } from 'next/server';
import { jobStore } from '@/lib/workforce/jobStore';
import { serializePublicContext } from '@/lib/workforce/types';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const jobId = params.id;
  const ctx = jobStore.getJob(jobId);

  if (!ctx) {
    return NextResponse.json(
      {
        success: false,
        error: `Job with ID '${jobId}' was not found.`,
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    job: serializePublicContext(ctx),
  });
}
