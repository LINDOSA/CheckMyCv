import { NextRequest, NextResponse } from 'next/server';
import { Packer } from 'docx';
import { getStandardCV, parseUserCvToStandardDocument } from '@/lib/cvStandardData';
import { createDocxFromStandardCV } from '@/lib/docxGenerator';
import { verifyServerPayment } from '@/lib/serverPaymentVerification';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function createPaymentRequiredResponse(reason?: string) {
  return NextResponse.json(
    {
      success: false,
      error: 'Payment required. A verified $9 CV Revamp Package purchase is required to export documents.',
      code: 'PAYMENT_REQUIRED',
      status: 402,
      checkoutUrl: '/api/stripe/checkout',
      details: {
        reason: reason || 'Missing, unverified, or unpaid Stripe session ID.',
        package: 'Executive ATS CV Revamp',
        priceCents: 900,
        currency: 'usd',
      },
    },
    {
      status: 402,
      headers: {
        'WWW-Authenticate': 'Stripe realm="CheckMyCV Paywall"',
        'X-Paywall-Required': 'true',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId =
      searchParams.get('session_id') ||
      searchParams.get('sessionId') ||
      req.headers.get('x-session-id');

    const email = searchParams.get('email') || undefined;
    const profileId = searchParams.get('profile') || searchParams.get('profileId') || 'executive';

    const verification = await verifyServerPayment(sessionId, {
      customerEmail: email,
      profileId,
    });

    if (!verification.authorized) {
      return createPaymentRequiredResponse(verification.reason);
    }

    const cvData = getStandardCV(profileId);
    const doc = createDocxFromStandardCV(cvData);
    const buffer = await Packer.toBuffer(doc);

    const safeName = cvData.name.replace(/\s+/g, '_');
    const filename = `${safeName}_ATS_Optimized_Resume.docx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Payment-Verified': 'true',
      },
    });
  } catch (error: any) {
    console.error('[API /api/export/docx GET] Error generating docx:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate Word document.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { searchParams } = new URL(req.url);
    const { cvText, targetRole, profileId, sessionId: bodySessionId, email: bodyEmail, cvData: bodyCvData } = body;

    const sessionId =
      bodySessionId ||
      searchParams.get('session_id') ||
      searchParams.get('sessionId') ||
      req.headers.get('x-session-id');

    const email = bodyEmail || searchParams.get('email') || undefined;
    const resolvedProfileId = profileId || searchParams.get('profile') || 'executive';

    const verification = await verifyServerPayment(sessionId, {
      customerEmail: email,
      profileId: resolvedProfileId,
    });

    if (!verification.authorized) {
      return createPaymentRequiredResponse(verification.reason);
    }

    const cvData = bodyCvData && typeof bodyCvData === 'object' && bodyCvData.name
      ? bodyCvData
      : cvText && cvText.trim().length >= 20
        ? parseUserCvToStandardDocument(cvText, targetRole)
        : getStandardCV(resolvedProfileId);

    const doc = createDocxFromStandardCV(cvData);
    const buffer = await Packer.toBuffer(doc);

    const safeName = cvData.name.replace(/\s+/g, '_');
    const filename = `${safeName}_ATS_Optimized_Resume.docx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Payment-Verified': 'true',
      },
    });
  } catch (error: any) {
    console.error('[API /api/export/docx POST] Error generating docx:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate Word document.' },
      { status: 500 }
    );
  }
}
