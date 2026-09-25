import { NextRequest, NextResponse } from 'next/server';
import { rewriteBulletPoint } from '@/lib/gemini';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bulletText, targetRole, issueContext } = body;

    if (!bulletText || typeof bulletText !== 'string' || bulletText.trim().length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide a valid CV bullet point or sentence to rewrite.',
        },
        { status: 400 }
      );
    }

    const trimmedBullet = bulletText.trim();
    const trimmedRole = typeof targetRole === 'string' ? targetRole.trim() : undefined;
    const trimmedContext = typeof issueContext === 'string' ? issueContext.trim() : undefined;

    console.log(`[API /api/rewrite] Rewriting bullet point for role: ${trimmedRole || 'General'}`);

    const rewrite = await rewriteBulletPoint(trimmedBullet, trimmedRole, trimmedContext);

    return NextResponse.json({
      success: true,
      result: rewrite,
    });
  } catch (error: any) {
    console.error('[API /api/rewrite] Error processing rewrite request:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to rewrite bullet point.',
      },
      { status: 500 }
    );
  }
}
