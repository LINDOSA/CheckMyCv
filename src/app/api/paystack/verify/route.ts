import { NextRequest, NextResponse } from 'next/server';
import { paymentRegistry } from '@/lib/paymentRegistry';
import {
  buildInvoiceNumber,
  getRewriteAmountCents,
  isPaystackConfigured,
  verifyPaystackTransaction,
} from '@/lib/paystack';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get('reference') || searchParams.get('session_id');

    if (!reference || !reference.trim()) {
      return NextResponse.json(
        { verified: false, error: 'Missing reference parameter' },
        { status: 400 }
      );
    }

    const cleanReference = reference.trim();

    // A reference already confirmed by the webhook needs no second round trip.
    const existing = await paymentRegistry.getPaymentBySessionId(cleanReference);
    if (existing && existing.paymentStatus === 'paid') {
      return NextResponse.json({
        verified: true,
        paymentStatus: 'paid',
        reference: cleanReference,
        customerEmail: existing.customerEmail,
        profileId: existing.profileId,
        candidateName: existing.candidateName,
        amountTotal: existing.amountCents / 100,
        currency: existing.currency,
        invoiceNumber: existing.invoiceNumber,
      });
    }

    if (!isPaystackConfigured()) {
      return NextResponse.json({
        verified: false,
        error: 'Payment gateway is not configured on the server.',
      });
    }

    const transaction = await verifyPaystackTransaction(cleanReference);

    // Guard against an underpaid or tampered transaction.
    const expectedAmount = getRewriteAmountCents();
    if (transaction.isPaid && transaction.amountCents < expectedAmount) {
      console.error(
        `Paystack reference ${cleanReference} paid ${transaction.amountCents} but ${expectedAmount} was due.`
      );
      return NextResponse.json({
        verified: false,
        paymentStatus: 'underpaid',
        reference: cleanReference,
        error: 'The amount paid does not match the amount due.',
      });
    }

    if (transaction.isPaid) {
      try {
        await paymentRegistry.recordPayment({
          sessionId: transaction.reference,
          customerEmail: transaction.customerEmail,
          profileId: transaction.metadata.profileId || 'it_cloud',
          candidateName: transaction.metadata.candidateName || 'Candidate',
          paymentStatus: 'paid',
          amountCents: transaction.amountCents,
          currency: transaction.currency,
          invoiceNumber: buildInvoiceNumber(transaction.reference),
          createdAt: transaction.paidAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: transaction.metadata,
        });
      } catch (regErr) {
        console.error('Failed to persist Paystack payment in registry:', regErr);
      }
    }

    return NextResponse.json({
      verified: transaction.isPaid,
      paymentStatus: transaction.isPaid ? 'paid' : transaction.status,
      reference: transaction.reference,
      customerEmail: transaction.customerEmail,
      profileId: transaction.metadata.profileId || 'it_cloud',
      candidateName: transaction.metadata.candidateName || 'Candidate',
      amountTotal: transaction.amountCents / 100,
      currency: transaction.currency,
    });
  } catch (error: any) {
    console.error('Paystack verify error:', error);
    return NextResponse.json(
      { verified: false, error: error?.message || 'Failed to verify the Paystack transaction.' },
      { status: 500 }
    );
  }
}
