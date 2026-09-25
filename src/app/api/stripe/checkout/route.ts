import { NextRequest, NextResponse } from 'next/server';
import { getStripe, isStripeConfigured, REWRITE_PRODUCT } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, profileId, candidateName } = body;

    // Determine host origin for redirect URLs
    const host = req.headers.get('host') || 'localhost:3000';
    const proto = req.headers.get('x-forwarded-proto') || 'http';
    const origin = req.headers.get('origin') || `${proto}://${host}`;

    const selectedProfile = profileId || 'it_cloud';

    const stripe = getStripe();

    if (!stripe || !isStripeConfigured()) {
      const allowTestBypass = process.env.ENABLE_PAYMENT_TEST_BYPASS === 'true';
      if (!allowTestBypass) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Stripe payment gateway is not yet configured. Please add STRIPE_SECRET_KEY in your .env.local file to process real payments securely.',
          },
          { status: 503 }
        );
      }

      // Explicit developer test mode bypass only if ENABLE_PAYMENT_TEST_BYPASS is true
      const demoSessionId = `test_simulated_${Date.now()}`;
      const userEmail = email && email.includes('@') ? email.trim() : 'candidate@example.com';
      const redirectUrl = `${origin}/?payment=success&session_id=${demoSessionId}&profileId=${encodeURIComponent(selectedProfile)}&email=${encodeURIComponent(userEmail)}&testMode=true`;

      return NextResponse.json({
        success: true,
        url: redirectUrl,
        sessionId: demoSessionId,
        isTestMode: true,
        message:
          'Stripe developer test simulation active. Configure STRIPE_SECRET_KEY to enable live checkout.',
      });
    }

    // Create live or test Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: REWRITE_PRODUCT.currency,
            product_data: {
              name: REWRITE_PRODUCT.name,
              description: REWRITE_PRODUCT.description,
              images: [`${origin}/logo.svg`],
            },
            unit_amount: REWRITE_PRODUCT.amountCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: email && email.includes('@') ? email.trim() : undefined,
      metadata: {
        profileId: selectedProfile,
        candidateName: candidateName || 'Candidate',
        product: 'executive_ats_rewrite',
      },
      success_url: `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}&profileId=${encodeURIComponent(selectedProfile)}`,
      cancel_url: `${origin}/?payment=cancelled`,
    });

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
      isTestMode: false,
    });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to initialize Stripe checkout session.',
      },
      { status: 500 }
    );
  }
}
