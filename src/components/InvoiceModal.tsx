'use client';

import React, { useState } from 'react';
import {
  X,
  Printer,
  CheckCircle,
  Envelope,
  ShieldCheck,
  CircleNotch,
  PaperPlaneTilt,
  FileDoc,
} from '@phosphor-icons/react';
import { InvoiceData } from '@/lib/invoiceTypes';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceData | null;
  onResendEmail?: (email: string) => Promise<void>;
}

export function InvoiceModal({
  isOpen,
  onClose,
  invoice,
  onResendEmail,
}: InvoiceModalProps) {
  const [resendEmail, setResendEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = resendEmail.trim() || invoice.customerEmail;
    if (!targetEmail || !targetEmail.includes('@')) {
      setSendError('Please provide a valid email address.');
      return;
    }

    setIsSending(true);
    setSendError(null);
    try {
      if (onResendEmail) {
        await onResendEmail(targetEmail);
      } else {
        const res = await fetch('/api/email/send-cv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: targetEmail,
            sessionId: invoice.sessionId,
            candidateName: invoice.customerName,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to dispatch email.');
        }
      }
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 3500);
    } catch (err: any) {
      setSendError(err?.message || 'Error emailing invoice.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative bg-surface rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-text-main border border-border-theme">
        
        {/* Modal Top Controls */}
        <div className="p-4 sm:p-5 border-b border-border-theme flex items-center justify-between bg-surface-raised print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
              <CheckCircle size={18} weight="bold" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-text-main">
                Official Tax Invoice &amp; Receipt
              </h3>
              <p className="text-[11px] text-text-muted">
                Transaction Ref: <span className="font-mono">{invoice.invoiceNumber}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="bg-surface hover:bg-surface-subtle text-text-main border border-border-theme px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
              title="Print or Save PDF"
            >
              <Printer size={14} weight="bold" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-main p-1.5 rounded-lg hover:bg-surface transition cursor-pointer"
            >
              <X size={18} weight="bold" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Invoice Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 bg-white text-slate-900 font-sans" id="printable-tax-invoice">
          
          {/* Invoice Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-slate-900 pb-5">
            <div>
              <div className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                CheckMyCV
              </div>
              <p className="text-xs text-slate-600 mt-1">{invoice.companyName}</p>
              <p className="text-xs text-slate-500">{invoice.companyAddress}</p>
              <p className="text-xs text-blue-600 mt-0.5">{invoice.supportEmail}</p>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Official Receipt
              </span>
              <div className="text-base sm:text-lg font-bold font-mono text-slate-900">
                {invoice.invoiceNumber}
              </div>
              <div className="text-xs text-slate-600">{invoice.date}</div>
              <div className="pt-1">
                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-300 uppercase">
                  ✓ Paid in Full
                </span>
              </div>
            </div>
          </div>

          {/* Billed To & Payment Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Billed To
              </span>
              <div className="font-bold text-sm text-slate-900">{invoice.customerName}</div>
              <div className="text-slate-600">{invoice.customerEmail}</div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Payment Method &amp; Reference
              </span>
              <div className="font-semibold text-slate-900">{invoice.paymentMethod}</div>
              <div className="text-slate-500 font-mono text-[11px] break-all">
                Payment Ref: {invoice.sessionId}
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                  <th className="p-3">Service Description</th>
                  <th className="p-3 text-center w-16">Qty</th>
                  <th className="p-3 text-right w-24">Unit Price</th>
                  <th className="p-3 text-right w-24">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="p-3.5 space-y-1">
                    <strong className="font-bold text-slate-900 text-xs sm:text-sm block">
                      {invoice.packageName}
                    </strong>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Single-column ATS formatting (Workday, Greenhouse, Taleo &amp; Lever compliant), quantified Google XYZ bullet conversion, and verifiable managerial references. Includes editable Word (.docx) document delivery.
                    </p>
                  </td>
                  <td className="p-3.5 text-center font-medium">1</td>
                  <td className="p-3.5 text-right font-medium">{invoice.amountPaid}</td>
                  <td className="p-3.5 text-right font-bold text-slate-900">{invoice.amountPaid}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total Calculation */}
          <div className="flex justify-end">
            <div className="w-full sm:w-64 space-y-2 text-xs border-t-2 border-slate-900 pt-3">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{invoice.subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax (0% VAT/Sales Tax):</span>
                <span>$0.00 USD</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Paid:</span>
                <span className="text-emerald-700">{invoice.total}</span>
              </div>
            </div>
          </div>

          {/* Footnote */}
          <div className="text-center pt-4 border-t border-slate-200 text-[11px] text-slate-500 leading-relaxed">
            Thank you for choosing CheckMyCV. Your updated CV and official invoice have been dispatched to your email address.<br />
            For support inquiries or questions, contact <strong>{invoice.supportEmail}</strong>.
          </div>
        </div>

        {/* Resend to Email Footer Bar */}
        <div className="p-4 bg-surface-raised border-t border-border-theme print:hidden">
          <form onSubmit={handleResend} className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-grow w-full">
              <Envelope size={15} weight="bold" className="text-text-dim absolute left-3 top-3" />
              <input
                type="email"
                placeholder={invoice.customerEmail || 'Send copy to email...'}
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                className="w-full bg-surface-subtle border border-border-theme rounded-lg pl-9 pr-3 py-2 text-xs text-text-main placeholder:text-text-dim focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={isSending}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2 rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 flex-shrink-0"
            >
              {isSending ? (
                <>
                  <CircleNotch size={14} weight="bold" className="animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <PaperPlaneTilt size={14} weight="bold" />
                  <span>Resend CV &amp; Invoice</span>
                </>
              )}
            </button>
          </form>

          {sendSuccess && (
            <p className="text-xs text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg mt-2 flex items-center gap-1.5">
              <CheckCircle size={14} weight="bold" />
              <span>CV document (.docx) and tax invoice sent successfully!</span>
            </p>
          )}

          {sendError && (
            <p className="text-xs text-rose-600 bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg mt-2">
              {sendError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
