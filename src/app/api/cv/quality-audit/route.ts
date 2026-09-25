import { NextRequest, NextResponse } from 'next/server';
import { auditCvQuality } from '@/lib/cvQualityEngine';
import { getStandardCV } from '@/lib/cvStandardData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { cvText, cv, profileId } = body;

    let targetInput: any = cvText;

    if (!targetInput && cv) {
      targetInput = cv;
    } else if (!targetInput && profileId) {
      targetInput = getStandardCV(profileId);
    }

    if (!targetInput) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide cvText, a structured cv object, or a profileId to audit.',
        },
        { status: 400 }
      );
    }

    const audit = auditCvQuality(targetInput);

    return NextResponse.json({
      success: true,
      audit,
      isSubmissionReady: audit.isSubmissionReady,
      overallScore: audit.overallScore,
      metricSaturation: audit.metricSaturation,
      isMetricSaturationCompliant: audit.isMetricSaturationCompliant,
      criticalIssues: audit.criticalIssues,
      actionableFixes: audit.actionableFixes,
    });
  } catch (error: any) {
    console.error('[API /api/cv/quality-audit] Error executing CV audit:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to execute CV quality audit.',
      },
      { status: 500 }
    );
  }
}
