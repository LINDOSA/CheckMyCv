import { paymentRegistry, PaymentRecord } from './paymentRegistry';
import { getStripe, isStripeConfigured } from './stripe';
import {
  buildInvoiceNumber,
  getRewriteAmountCents,
  isPaystackConfigured,
  isPaystackReference,
  verifyPaystackTransaction,
} from './paystack';

export interface VerificationResult {
  authorized: boolean;
  reason?: string;
  record?: PaymentRecord;
}

export async function verifyServerPayment(
  sessionId: string | null,
  options?: { customerEmail?: string; profileId?: string; allowEmailOnlyRestore?: boolean }
): Promise<VerificationResult> {
  const isProduction = process.env.NODE_ENV === 'production';
  const cleanSessionId = sessionId?.trim() || null;
  const cleanEmail = options?.customerEmail?.trim().toLowerCase() || null;

  // 1. Guard against missing identifiers
  if (!cleanSessionId && !cleanEmail) {
    return {
      authorized: false,
      reason: 'No payment session ID or customer email provided for verification.',
    };
  }

  // 2. Unconditional rejection of known bypass tokens, demo tokens, and fake tokens
  if (
    cleanSessionId === 'unlocked_session' ||
    cleanSessionId?.startsWith('demo_') ||
    cleanSessionId === 'cs_fake_bypass_token_000' ||
    cleanSessionId?.startsWith('fake_') ||
    cleanSessionId === '123456' ||
    cleanSessionId === 'qwerty'
  ) {
    return {
      authorized: false,
      reason: 'Bypass tokens and forged sessions are strictly rejected.',
    };
  }

  // 3. Test mode simulation tokens (e.g. test_simulated_*)
  if (cleanSessionId?.startsWith('test_simulated_')) {
    if (isProduction) {
      return {
        authorized: false,
        reason: 'Test mode bypass tokens are forbidden in production environments.',
      };
    }

    const allowTestBypass = process.env.ENABLE_PAYMENT_TEST_BYPASS === 'true';
    if (!allowTestBypass) {
      return {
        authorized: false,
        reason: 'Test simulation bypass is disabled. Verified payment required.',
      };
    }

    // Check if recorded in registry
    const existingTestRecord = await paymentRegistry.getPaymentBySessionId(cleanSessionId);
    if (existingTestRecord && existingTestRecord.paymentStatus === 'paid') {
      return { authorized: true, record: existingTestRecord };
    }

    const synthesizedTestRecord: PaymentRecord = {
      sessionId: cleanSessionId,
      customerEmail: cleanEmail || 'candidate.test@scoremycv.com',
      profileId: options?.profileId || 'it_cloud',
      candidateName: 'Test Mode Candidate',
      paymentStatus: 'paid',
      amountCents: 900,
      currency: 'usd',
      invoiceNumber: `INV-TEST-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: { isTestMode: 'true' },
    };

    // Store in registry so subsequent checks are instant
    await paymentRegistry.recordPayment(synthesizedTestRecord);
    return { authorized: true, record: synthesizedTestRecord };
  }

  // 4. Primary defense: Persistent Registry lookup by Session ID
  if (!cleanSessionId) {
    if (options?.allowEmailOnlyRestore && cleanEmail) {
      const emailRecords = await paymentRegistry.getPaymentsByEmail(cleanEmail);
      const paidRecord = emailRecords.find((r) => r.paymentStatus === 'paid');
      if (paidRecord) {
        return { authorized: true, record: paidRecord };
      }
    }
    return {
      authorized: false,
      reason: 'Missing session ID. Payment verification requires a valid checkout session.',
    };
  }

  const record = await paymentRegistry.getPaymentBySessionId(cleanSessionId);
  if (record) {
    if (record.paymentStatus === 'paid') {
      return { authorized: true, record };
    }
    return {
      authorized: false,
      reason: `Session payment status is "${record.paymentStatus}". Full payment required.`,
      record,
    };
  }

  // 5. Cross-Device Email reconciliation (only if valid sessionId was presented)
  if (cleanEmail) {
    const emailRecords = await paymentRegistry.getPaymentsByEmail(cleanEmail);
    const paidRecord = emailRecords.find((r) => r.paymentStatus === 'paid');
    if (paidRecord) {
      return { authorized: true, record: paidRecord };
    }
  }

  // 6. Live Paystack API fallback: the webhook may not have arrived yet, or this
  //    serverless instance may be cold. Paystack itself is the authority.
  if (isPaystackReference(cleanSessionId) && isPaystackConfigured()) {
    try {
      const transaction = await verifyPaystackTransaction(cleanSessionId);

      if (!transaction.isPaid) {
        return {
          authorized: false,
          reason: `Paystack transaction status is "${transaction.status}". Full payment required.`,
        };
      }

      if (transaction.amountCents < getRewriteAmountCents()) {
        return {
          authorized: false,
          reason: 'The amount paid does not match the amount due.',
        };
      }

      const paystackRecord: PaymentRecord = {
        sessionId: transaction.reference,
        customerEmail: transaction.customerEmail || cleanEmail || '',
        profileId: transaction.metadata.profileId || options?.profileId || 'it_cloud',
        candidateName: transaction.metadata.candidateName || 'Valued Candidate',
        paymentStatus: 'paid',
        amountCents: transaction.amountCents,
        currency: transaction.currency,
        invoiceNumber: buildInvoiceNumber(transaction.reference),
        createdAt: transaction.paidAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: transaction.metadata,
      };

      await paymentRegistry.recordPayment(paystackRecord);
      return { authorized: true, record: paystackRecord };
    } catch (paystackErr: any) {
      return {
        authorized: false,
        reason: `Paystack verification failed: ${paystackErr?.message || 'Unknown error'}`,
      };
    }
  }

  // 7. Live Stripe API Fallback & Automatic Registry Synchronization
  if (cleanSessionId && isStripeConfigured()) {
    const stripe = getStripe();
    if (stripe) {
      try {
        const session = await stripe.checkout.sessions.retrieve(cleanSessionId);
        if (session.payment_status === 'paid') {
          const email =
            session.customer_details?.email ||
            session.customer_email ||
            cleanEmail ||
            '';
          const profileId =
            (session.metadata?.profileId as string | undefined) ||
            options?.profileId ||
            'executive';
          const candidateName =
            (session.metadata?.candidateName as string | undefined) ||
            'Valued Candidate';

          const invoiceNumber =
            typeof session.invoice === 'string'
              ? session.invoice
              : `INV-${session.id.slice(-8).toUpperCase()}`;

          const newRecord: PaymentRecord = {
            sessionId: session.id,
            customerEmail: email,
            profileId,
            candidateName,
            paymentStatus: 'paid',
            amountCents: session.amount_total || 900,
            currency: session.currency || 'usd',
            invoiceNumber,
            createdAt: new Date(session.created * 1000).toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: session.metadata as Record<string, string> | undefined,
          };

          // Cache in registry for subsequent fast lookups and cross-device access
          await paymentRegistry.recordPayment(newRecord);
          return { authorized: true, record: newRecord };
        } else {
          return {
            authorized: false,
            reason: `Stripe checkout session status is "${session.payment_status}". Full payment required.`,
          };
        }
      } catch (stripeErr: any) {
        return {
          authorized: false,
          reason: `Stripe session verification failed: ${stripeErr.message || 'Unknown error'}`,
        };
      }
    }
  }

  return {
    authorized: false,
    reason: 'Payment not verified. Please complete checkout to unlock this asset.',
  };
}
