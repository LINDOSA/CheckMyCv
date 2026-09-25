import Stripe from 'stripe';

export const REWRITE_PRODUCT = {
  name: 'CheckMyCV - Executive ATS Resume Rewrite Pass',
  description:
    'Single-column Workday & Greenhouse certified format, XYZ accomplishment bullets, keyword match, Word (.docx) & PDF (.pdf)',
  amountCents: 900, // $9.00 USD
  currency: 'usd',
};

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return null;
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(secretKey, {
      typescript: true,
      appInfo: {
        name: 'CheckMyCV',
        version: '1.0.0',
      },
    });
  }

  return stripeInstance;
}

export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY;
  return Boolean(key && key.startsWith('sk_'));
}
