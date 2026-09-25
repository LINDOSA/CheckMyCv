'use client';

import React, { useState } from 'react';
import { X, Check, ArrowRight, LockKey, Envelope, CircleNotch, ShieldCheck } from '@phosphor-icons/react';

type Provider = 'paystack' | 'stripe';

interface ProviderConfig {
  id: Provider;
  label: string;
  flag: string;
  price: string;
  currency: string;
  subtext: string;
  securityNote: string;
  loadingLabel: string;
  buttonLabel: string;
  endpoint: string;
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: 'paystack',
    label: 'Paystack',
    flag: '🇿🇦',
    price: 'R160',
    currency: 'ZAR',
    subtext: 'Cards, EFT · South Africa',
    securityNote: 'Paystack 256-bit encrypted checkout',
    loadingLabel: 'Connecting to Paystack...',
    buttonLabel: 'Pay R160 via Paystack',
    endpoint: '/api/paystack/checkout',
  },
  {
    id: 'stripe',
    label: 'Stripe',
    flag: '🌍',
    price: '$9',
    currency: 'USD',
    subtext: 'Cards, Apple Pay, Google Pay',
    securityNote: 'Stripe 256-bit encrypted checkout',
    loadingLabel: 'Connecting to Stripe...',
    buttonLabel: 'Pay $9 via Stripe',
    endpoint: '/api/stripe/checkout',
  },
];

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  overallScore: number;
  profileId?: string;
  candidateName?: string;
}

export function PaywallModal({
  isOpen,
  onClose,
  overallScore,
  profileId = 'executive',
  candidateName = 'Candidate',
}: PaywallModalProps) {
  const [email, setEmail] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('ratemycv_customer_email') || '';
    }
    return '';
  });
  const [selectedProvider, setSelectedProvider] = useState<Provider>('paystack');
  const [isLoadingCheckout, setIsLoadingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  if (!isOpen) return null;

  const provider = PROVIDERS.find((p) => p.id === selectedProvider)!;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingCheckout(true);
    setCheckoutError(null);

    const cleanEmail = email.trim();
    if (cleanEmail && typeof window !== 'undefined') {
      sessionStorage.setItem('ratemycv_customer_email', cleanEmail);
    }

    try {
      const res = await fetch(provider.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail || undefined,
          profileId,
          candidateName,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.url) {
        throw new Error(data.error || 'Failed to initialize checkout session.');
      }

      window.location.href = data.url;
    } catch (err: any) {
      console.error(`${provider.label} checkout error:`, err);
      setCheckoutError(err?.message || 'Could not connect to payment gateway. Please try again.');
      setIsLoadingCheckout(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative card-surface rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl overflow-hidden text-text-main">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text-main p-1 rounded hover:bg-surface-raised transition"
        >
          <X size={18} weight="bold" />
        </button>

        <div className="space-y-5">
          {/* Header */}
          <div>
            <div className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-600 text-xs font-medium px-2.5 py-1 rounded-full mb-3">
              <ShieldCheck size={14} weight="bold" />
              <span>CV Revamp Package • ATS Pass Guarantee</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-text-main tracking-tight">
              Executive CV Revamp Package
            </h3>
            <p className="text-xs sm:text-sm text-text-muted mt-1.5 leading-relaxed">
              Transform your {overallScore}/100 diagnostic score into interview calls. We rewrite your CV into a single-column, ATS-verified document engineered to bypass Workday, Greenhouse, and Lever filters.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-2 bg-surface-subtle border border-border-theme p-4 rounded-xl text-xs text-text-muted">
            <div className="flex items-start gap-2">
              <Check size={16} weight="bold" className="text-emerald-500 flex-shrink-0 mt-0.5" />
              <span><strong>Single-Column ATS Format:</strong> 100% parseable by Workday, Greenhouse, Taleo, and Lever.</span>
            </div>
            <div className="flex items-start gap-2">
              <Check size={16} weight="bold" className="text-emerald-500 flex-shrink-0 mt-0.5" />
              <span><strong>XYZ Impact Bullets:</strong> Transformed from passive duties into measurable achievements.</span>
            </div>
            <div className="flex items-start gap-2">
              <Check size={16} weight="bold" className="text-emerald-500 flex-shrink-0 mt-0.5" />
              <span><strong>Your References, Preserved:</strong> Your real referees carried across exactly as you supplied them.</span>
            </div>
            <div className="flex items-start gap-2">
              <Check size={16} weight="bold" className="text-emerald-500 flex-shrink-0 mt-0.5" />
              <span><strong>Word (.docx) &amp; PDF (.pdf):</strong> High-fidelity downloadable files.</span>
            </div>
          </div>

          {/* Price row — dynamic based on selected provider */}
          <div className="flex items-baseline justify-between border-b border-border-theme pb-3">
            <div>
              <span className="text-xs text-text-dim block font-medium">One-Time Fee</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold text-text-main">{provider.price}</span>
                <span className="text-xs text-text-dim font-medium">{provider.currency}</span>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">
                  50% Off
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-text-muted font-medium">Once-off payment</span>
              <p className="text-[11px] text-text-dim">No subscription</p>
            </div>
          </div>

          {/* Error */}
          {checkoutError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-600 text-xs flex items-center justify-between">
              <span>{checkoutError}</span>
              <button
                type="button"
                onClick={() => setCheckoutError(null)}
                className="text-rose-600 hover:underline text-[10px] font-mono ml-2"
              >
                Dismiss
              </button>
            </div>
          )}

          <form onSubmit={handleCheckout} className="space-y-3.5">
            {/* Email */}
            <div>
              <label className="block text-xs text-text-main mb-1.5 font-medium">
                Receipt Email <span className="text-text-dim">(Where we deliver your files)</span>
              </label>
              <div className="relative">
                <Envelope size={16} weight="bold" className="text-text-dim absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="candidate@example.com"
                  className="w-full text-xs font-sans bg-surface-subtle border border-border-theme rounded-lg pl-9 pr-3 py-2.5 text-text-main placeholder:text-text-dim focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Provider selector */}
            <div>
              <label className="block text-xs text-text-main mb-1.5 font-medium">
                Payment method
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedProvider(p.id);
                      setCheckoutError(null);
                    }}
                    className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all ${
                      selectedProvider === p.id
                        ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/40'
                        : 'border-border-theme bg-surface-subtle hover:border-blue-400/50 hover:bg-blue-500/5'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 w-full">
                      <span className="text-base leading-none">{p.flag}</span>
                      <span className="text-xs font-semibold text-text-main">{p.label}</span>
                      {selectedProvider === p.id && (
                        <span className="ml-auto">
                          <Check size={13} weight="bold" className="text-blue-500" />
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-text-main">
                      {p.price} <span className="text-[10px] font-medium text-text-dim">{p.currency}</span>
                    </span>
                    <span className="text-[10px] text-text-dim leading-tight">{p.subtext}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoadingCheckout}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold py-2.5 px-4 rounded-lg text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              {isLoadingCheckout ? (
                <>
                  <CircleNotch size={15} weight="bold" className="animate-spin text-white" />
                  <span>{provider.loadingLabel}</span>
                </>
              ) : (
                <>
                  <LockKey size={14} weight="bold" />
                  <span>{provider.buttonLabel}</span>
                  <ArrowRight size={13} weight="bold" />
                </>
              )}
            </button>

            <div className="text-center text-[11px] text-text-dim pt-1 space-y-0.5">
              <p className="flex items-center justify-center gap-1.5 text-text-muted">
                <ShieldCheck size={13} weight="bold" className="text-emerald-500" />
                <span>{provider.securityNote}</span>
              </p>
              <p>Cards, Apple Pay, Google Pay accepted</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
