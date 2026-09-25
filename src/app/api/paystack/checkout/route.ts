import { NextRequest, NextResponse } from 'next/server';
import {
  REWRITE_PRODUCT,
  generatePaystackReference,
  getRewriteAmountCents,
  initializePaystackTransaction,
  isPaystackConfigured,
} from '@/lib/paystack';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, profileId, candidateName } = body;

    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    // Paystack requires a customer email: it is the receipt address and the key
    // we use to restore access on another device.
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'A valid email address is required to start checkout.' },
        { status: 400 }
      );
    }

    if (!isPaystackConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Payment gateway is not yet configured. Add PAYSTACK_SECRET_KEY in .env.local to process payments.',
        },
        { status: 503 }
      );
    }

    const host = req.headers.get('host') || 'localhost:3000';
    const proto = req.headers.get('x-forwarded-proto') || 'http';
    const origin = process.env.NEXT_PUBLIC_SITE_URL || req.headers.get('origin') || `${proto}://${host}`;

    const selectedProfile = typeof profileId === 'string' && profileId ? profileId : 'it_cloud';
    const reference = generatePaystackReference();

    // The amount is fixed server-side. Nothing the client sends can change it.
    const amountCents = getRewriteAmountCents();

    const result = await initializePaystackTransaction({
      email: cleanEmail,
      amountCents,
      reference,
      currency: REWRITE_PRODUCT.currency,
      callbackUrl: `${origin}/?payment=success&reference=${encodeURIComponent(reference)}`,
      metadata: {
        profileId: selectedProfile,
        candidateName: typeof candidateName === 'string' && candidateName ? candidateName : 'Candidate',
        product: 'executive_ats_rewrite',
      },
    });

    return NextResponse.json({
      success: true,
      url: result.authorizationUrl,
      reference: result.reference,
      amountCents,
      currency: REWRITE_PRODUCT.currency,
    });
  } catch (error: any) {
    console.error('Paystack checkout error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to initialize Paystack checkout.' },
      { status: 500 }
    );
  }
}
