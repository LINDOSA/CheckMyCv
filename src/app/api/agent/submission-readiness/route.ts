import { NextRequest, NextResponse } from 'next/server';
import { getStandardCV } from '@/lib/cvStandardData';
import { auditCvForSubmission, ensureCvSubmissionReady } from '@/lib/cvSubmissionAgent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { cv: clientCv, profileId, action = 'auto_fix' } = body;

    const baseCv = clientCv || getStandardCV(profileId || 'it_cloud');

    if (action === 'audit') {
      const report = auditCvForSubmission(baseCv);
      return NextResponse.json({
        success: true,
        cv: baseCv,
        report,
      });
    }

    // Default: 'auto_fix' / ensure complete submission readiness
    const { cv: readyCv, report } = ensureCvSubmissionReady(baseCv);

    return NextResponse.json({
      success: true,
      cv: readyCv,
      report,
    });
  } catch (error: any) {
    console.error('Submission readiness agent error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'CV Submission Readiness Agent failed to execute audit.',
      },
      { status: 500 }
    );
  }
}
