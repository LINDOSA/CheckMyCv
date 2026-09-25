import { NextRequest, NextResponse } from 'next/server';
import { getStandardCV, parseUserCvToStandardDocument } from '@/lib/cvStandardData';
import { sendCvAndInvoiceEmail } from '@/lib/invoiceEmailService';
import { verifyServerPayment } from '@/lib/serverPaymentVerification';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function createPaymentRequiredResponse(reason?: string) {
  return NextResponse.json(
    {
      success: false,
      error: 'Payment required. A verified $9 CV Revamp Package purchase is required before delivery.',
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, sessionId, profileId, cvText, targetRole, candidateName, cvData: bodyCvData } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid recipient email address.' },
        { status: 400 }
      );
    }

    const sessionToCheck = sessionId || req.headers.get('x-session-id');
    const resolvedProfileId = profileId || 'executive';

    // Strictly verify payment via persistent registry & Stripe reconciliation
    const verification = await verifyServerPayment(sessionToCheck, {
      customerEmail: email,
      profileId: resolvedProfileId,
    });

    if (!verification.authorized) {
      return createPaymentRequiredResponse(verification.reason);
    }

    // Resolve accurate standard CV document
    const cvData =
      bodyCvData && typeof bodyCvData === 'object' && bodyCvData.name
        ? bodyCvData
        : cvText && cvText.trim().length >= 20
          ? parseUserCvToStandardDocument(cvText, targetRole)
          : getStandardCV(resolvedProfileId);

    // Send email with attached Word .docx and official invoice
    const sendResult = await sendCvAndInvoiceEmail({
      recipientEmail: email.trim(),
      cvData,
      sessionId: sessionToCheck || verification.record?.sessionId || 'paid_verified',
      candidateName: candidateName || cvData.name,
    });

    return NextResponse.json({
      success: true,
      recipient: email.trim(),
      delivered: sendResult.delivered,
      isSimulated: sendResult.isSimulated,
      invoice: sendResult.invoice,
      filename: sendResult.filename,
      emailHtml: sendResult.emailHtml,
      message: sendResult.isSimulated
        ? `CV and Invoice dispatched (Simulated Delivery to ${email.trim()}).`
        : `CV and Invoice successfully emailed to ${email.trim()}.`,
    });
  } catch (error: any) {
    console.error('[API /api/email/send-cv POST] Error dispatching email:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to email CV and invoice.' },
      { status: 500 }
    );
  }
}

/**
 * Reject GET requests to prevent public unauthenticated scraping of candidate PII,
 * outbox history, and invoice records.
 */
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method Not Allowed. Outbox inspection is restricted.',
    },
    {
      status: 405,
      headers: {
        Allow: 'POST',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
