import { NextRequest, NextResponse } from 'next/server';
import { getStandardCV } from '@/lib/cvStandardData';
import { sendCvAndInvoiceEmail } from '@/lib/invoiceEmailService';
import { paymentRegistry } from '@/lib/paymentRegistry';
import {
  buildInvoiceNumber,
  getRewriteAmountCents,
  isPaystackConfigured,
  verifyPaystackSignature,
} from '@/lib/paystack';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!isPaystackConfigured()) {
    console.error('Paystack webhook received but PAYSTACK_SECRET_KEY is not configured.');
    return NextResponse.json(
      { error: 'Payment gateway is not configured on the server' },
      { status: 500 }
    );
  }

  // The signature covers the RAW body, so it must be read as text before parsing.
  const rawBody = await req.text();
  const signature = req.headers.get('x-paystack-signature');

  if (!verifyPaystackSignature(rawBody, signature)) {
    console.error('Paystack webhook signature verification failed.');
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  if (event?.event !== 'charge.success') {
    // Acknowledge everything else so Paystack stops retrying it.
    return NextResponse.json({ received: true });
  }

  const data = event?.data;
  if (!data || !data.reference) {
    return NextResponse.json({ error: 'Invalid event payload' }, { status: 400 });
  }

  const reference = String(data.reference).trim();
  const amountCents = Number(data.amount) || 0;
  const isPaid = data.status === 'success';

  // An underpaid transaction is acknowledged but never recorded as paid.
  if (isPaid && amountCents < getRewriteAmountCents()) {
    console.error(`Paystack webhook: ${reference} paid ${amountCents}, expected ${getRewriteAmountCents()}.`);
    return NextResponse.json({ received: true });
  }

  const rawMetadata = data.metadata && typeof data.metadata === 'object' ? data.metadata : {};
  const metadata: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawMetadata)) {
    if (value !== null && value !== undefined && typeof value !== 'object') {
      metadata[key] = String(value);
    }
  }

  const candidateEmail = data.customer?.email || '';
  const profileId = metadata.profileId || 'it_cloud';
  const candidateName = metadata.candidateName || 'Valued Candidate';

  // Paystack retries delivery until it gets a 200, so the same charge arrives
  // more than once. Only the first one should trigger the delivery email.
  const alreadyRecorded = await paymentRegistry
    .getPaymentBySessionId(reference)
    .catch(() => null);
  const wasAlreadyPaid = alreadyRecorded?.paymentStatus === 'paid';

  try {
    await paymentRegistry.recordPayment({
      sessionId: reference,
      customerEmail: candidateEmail,
      profileId,
      candidateName,
      paymentStatus: isPaid ? 'paid' : 'pending',
      amountCents,
      currency: data.currency || 'ZAR',
      invoiceNumber: buildInvoiceNumber(reference),
      createdAt: data.paid_at || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata,
    });
  } catch (regErr) {
    console.error('Error persisting Paystack payment in webhook:', regErr);
    // Non-2xx makes Paystack retry, so a paid customer is never left unrecorded.
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }

  if (candidateEmail && isPaid && !wasAlreadyPaid) {
    try {
      const cvData = getStandardCV(profileId);
      await sendCvAndInvoiceEmail({
        recipientEmail: candidateEmail,
        cvData,
        sessionId: reference,
        candidateName,
      });
    } catch (emailErr) {
      // Delivery failure must not trigger a webhook retry: the payment is recorded.
      console.error('Error dispatching Paystack confirmation email:', emailErr);
    }
  }

  return NextResponse.json({ received: true });
}
