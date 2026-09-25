import { NextRequest, NextResponse } from 'next/server';
import { scoreCV, generateFallbackScore } from '@/lib/gemini';
import { auditCvQuality } from '@/lib/cvQualityEngine';

export const runtime = 'nodejs';

// Timeout wrapper for API calls
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms)
    ),
  ]) as Promise<T>;
}

export async function POST(req: NextRequest) {
  let trimmedCV = '';
  let trimmedJob: string | undefined = undefined;

  try {
    const body = await req.json();
    const { cvText, jobAdvertText } = body;

    if (!cvText || typeof cvText !== 'string' || cvText.trim().length < 20) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide valid CV text or upload a document with at least 20 words.',
        },
        { status: 400 }
      );
    }

    trimmedCV = cvText.trim();
    trimmedJob = typeof jobAdvertText === 'string' ? jobAdvertText.trim() : undefined;

    console.log(
      `[API /api/score] Received score request. CV chars: ${trimmedCV.length}, Job Advert provided: ${Boolean(
        trimmedJob && trimmedJob.length > 20
      )}`
    );

    const qualityAudit = auditCvQuality(trimmedCV);
    const scoreResult = await withTimeout(scoreCV(trimmedCV, trimmedJob), 16000);

    return NextResponse.json({
      success: true,
      result: {
        ...scoreResult,
        qualityAudit,
      },
      qualityAudit,
    });
  } catch (error: any) {
    console.error('[API /api/score] Error or timeout processing scoring request:', error?.message);

    // If we have valid CV text, return high-accuracy deterministic scoring fallback immediately so the user never gets stuck loading
    if (trimmedCV && trimmedCV.length >= 20) {
      console.log('[API /api/score] Seamlessly serving deterministic ATS scoring fallback.');
      const fallback = generateFallbackScore(trimmedCV, trimmedJob);
      const qualityAudit = auditCvQuality(trimmedCV);
      return NextResponse.json({
        success: true,
        result: {
          ...fallback,
          qualityAudit,
        },
        qualityAudit,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'An unexpected error occurred while scoring your CV. Please try again.',
      },
      { status: 500 }
    );
  }
}
