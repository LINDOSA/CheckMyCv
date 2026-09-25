import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getStandardCV } from '@/lib/cvStandardData';
import { sendCvAndInvoiceEmail } from '@/lib/invoiceEmailService';
import { paymentRegistry } from '@/lib/paymentRegistry';

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 500 }
    );
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  let event;

  // Unsigned events are only ever accepted in local development, and only when
  // no webhook secret is configured AND the developer test flag is on.
  const allowUnsignedDevEvents =
    process.env.NODE_ENV !== 'production' &&
    process.env.ENABLE_PAYMENT_TEST_BYPASS === 'true' &&
    !webhookSecret;

  if (webhookSecret) {
    if (!signature) {
      return NextResponse.json(
        { error: 'Webhook Error: missing stripe-signature header' },
        { status: 400 }
      );
    }
    // Stripe's SDK only rejects stale timestamps; also reject ones set in the future
    const tsMatch = /(?:^|,)t=(\d+)/.exec(signature);
    if (tsMatch && Number(tsMatch[1]) > Math.floor(Date.now() / 1000) + 300) {
      return NextResponse.json(
        { error: 'Webhook Error: signature timestamp is too far in the future' },
        { status: 400 }
      );
    }
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('⚠️ Stripe Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }
  } else if (allowUnsignedDevEvents) {
    try {
      event = JSON.parse(body);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
  } else {
    console.error('⚠️ STRIPE_WEBHOOK_SECRET is not set; refusing to process unsigned webhook.');
    return NextResponse.json(
      { error: 'Webhook secret is not configured on the server' },
      { status: 500 }
    );
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data?.object;
      if (!session || !session.id) {
        return NextResponse.json({ error: 'Invalid event payload' }, { status: 400 });
      }
      const candidateEmail = session.customer_details?.email || session.customer_email;
      const profileId = session.metadata?.profileId || 'executive';
      const candidateName = session.metadata?.candidateName || 'Valued Candidate';

      const isPaid = session.payment_status === 'paid';
      console.log(`Stripe Checkout completed for session ${session.id} (payment_status: ${session.payment_status})`);

      try {
        await paymentRegistry.recordPayment({
          sessionId: session.id,
          customerEmail: candidateEmail || '',
          profileId,
          candidateName,
          paymentStatus: isPaid ? 'paid' : 'pending',
          amountCents: session.amount_total || 900,
          currency: session.currency || 'usd',
          invoiceNumber: `INV-${session.id.slice(-8).toUpperCase()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: session.metadata || {},
        });
        console.log(`✅ Recorded payment in registry for session: ${session.id}`);
      } catch (regErr) {
        console.error('⚠️ Error persisting payment in webhook:', regErr);
        // Non-2xx makes Stripe retry delivery, so a paid customer is never left unrecorded
        return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
      }

      if (candidateEmail && isPaid) {
        try {
          const cvData = getStandardCV(profileId);
          await sendCvAndInvoiceEmail({
            recipientEmail: candidateEmail,
            cvData,
            sessionId: session.id,
            candidateName,
          });
          console.log(`✅ CV and Invoice automatically dispatched to: ${candidateEmail}`);
        } catch (emailErr) {
          console.error('⚠️ Error dispatching email in webhook:', emailErr);
        }
      }
      break;
    }
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      console.log('✅ PaymentIntent was successful:', paymentIntent.id);
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
