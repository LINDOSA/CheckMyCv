import { NextRequest, NextResponse } from 'next/server';
import { getStripe, isStripeConfigured } from '@/lib/stripe';
import { paymentRegistry } from '@/lib/paymentRegistry';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { verified: false, error: 'Missing session_id parameter' },
        { status: 400 }
      );
    }

    // Check for test mode simulation session (strictly gated by environment flag)
    if (sessionId.startsWith('test_simulated_') || sessionId.startsWith('demo_')) {
      const allowTestBypass = process.env.ENABLE_PAYMENT_TEST_BYPASS === 'true';
      if (!allowTestBypass) {
        return NextResponse.json(
          {
            verified: false,
            error: 'Test simulation bypass is disabled. Real payment through Stripe is required.',
          },
          { status: 403 }
        );
      }
      const profileId = searchParams.get('profileId') || 'it_cloud';
      const customerEmail = searchParams.get('email') || 'candidate@scoremycv.com';
      return NextResponse.json({
        verified: true,
        isTestMode: true,
        sessionId,
        profileId,
        customerEmail,
        candidateName: 'Valued Candidate',
        amountPaid: '$9.00 USD (Test Pass)',
      });
    }

    const stripe = getStripe();
    if (!stripe || !isStripeConfigured()) {
      return NextResponse.json({
        verified: false,
        error: 'Stripe is not configured on the server.',
      });
    }

    // Retrieve real Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const isPaid = session.payment_status === 'paid';
    if (isPaid) {
      try {
        await paymentRegistry.recordPayment({
          sessionId: session.id,
          customerEmail: session.customer_details?.email || session.customer_email || '',
          profileId: session.metadata?.profileId || 'it_cloud',
          candidateName: session.metadata?.candidateName || 'Candidate',
          paymentStatus: 'paid',
          amountCents: session.amount_total || 900,
          currency: session.currency || 'usd',
          invoiceNumber: `INV-${session.id.slice(-8).toUpperCase()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: session.metadata || {},
        });
      } catch (regErr) {
        console.error('Failed to persist payment in registry:', regErr);
      }
    }

    return NextResponse.json({
      verified: isPaid,
      paymentStatus: session.payment_status,
      sessionId: session.id,
      customerEmail: session.customer_details?.email || session.customer_email,
      profileId: session.metadata?.profileId || 'it_cloud',
      candidateName: session.metadata?.candidateName || 'Candidate',
      amountTotal: session.amount_total ? session.amount_total / 100 : 9,
    });
  } catch (error: any) {
    console.error('Stripe verify error:', error);
    return NextResponse.json(
      {
        verified: false,
        error: error?.message || 'Failed to verify Stripe checkout session.',
      },
      { status: 500 }
    );
  }
}
