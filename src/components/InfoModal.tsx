'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Question,
  ShieldCheck,
  FileText,
  CheckCircle,
  Sparkle,
  LockKey,
} from '@phosphor-icons/react';

export type InfoModalTab = 'faq' | 'privacy' | 'terms';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: InfoModalTab;
}

const FAQS = [
  {
    q: 'How does CheckMyCV analyze my CV or resume?',
    a: 'CheckMyCV evaluates your document against enterprise ATS algorithms (Workday, Greenhouse, Taleo, Lever, and iCIMS). We benchmark keyword saturation, XYZ accomplishment formulas (measuring impact, scale, and metrics), chronological parsing, and layout readability.',
  },
  {
    q: 'What is an ATS (Applicant Tracking System)?',
    a: 'An ATS is automated recruitment software used by over 98% of Fortune 500 employers to filter, rank, and eliminate applicants before human recruiters review documents. A single parsing error or low keyword match often leads to automated rejection.',
  },
  {
    q: 'Does CheckMyCV accommodate international job applications?',
    a: 'Yes. The system is calibrated across North America, the United Kingdom, European Union, South Africa, Asia-Pacific, and remote global engineering and corporate teams.',
  },
  {
    q: 'Will my CV or personal contact details ever be stored or sold?',
    a: 'Never. CheckMyCV adheres to a strict Zero-Data Retention policy. All document uploads and text parsing occur ephemerally in volatile memory and are permanently discarded immediately after your diagnostic report is generated.',
  },
  {
    q: 'What format should I download: Word (.docx) or PDF (.pdf)?',
    a: 'Both are industry standards. For enterprise ATS portals (Workday, Taleo, iCIMS), clean single-column Word (.docx) provides 100% parsing accuracy with zero text box distortion. Our PDF generator outputs high-DPI vector-grade documents ideal for direct email submissions.',
  },
];

export function InfoModal({ isOpen, onClose, initialTab = 'faq' }: InfoModalProps) {
  const [activeTab, setActiveTab] = useState<InfoModalTab>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl card-surface rounded-2xl shadow-xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-border-theme flex items-center justify-between bg-surface-raised">
          <div className="flex items-center bg-surface border border-border-theme p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('faq')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition font-medium ${
                activeTab === 'faq'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              <Question size={14} weight="bold" />
              <span>FAQ</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition font-medium ${
                activeTab === 'privacy'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              <ShieldCheck size={14} weight="bold" />
              <span>Privacy Policy</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('terms')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition font-medium ${
                activeTab === 'terms'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              <FileText size={14} weight="bold" />
              <span>Terms</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-main p-1.5 rounded-lg hover:bg-surface-subtle transition"
            title="Close Dialog"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-text-main">
          {/* FAQ TAB */}
          {activeTab === 'faq' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-text-main tracking-tight">
                  Frequently Asked Questions
                </h3>
                <p className="text-xs text-text-muted">
                  Everything you need to know about enterprise ATS filters, scoring criteria, and executive rewrites.
                </p>
              </div>

              <div className="space-y-3 pt-1">
                {FAQS.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-surface-subtle border border-border-theme rounded-xl space-y-2 text-xs"
                  >
                    <h4 className="text-sm font-semibold text-text-main flex items-start gap-2">
                      <CheckCircle size={16} weight="bold" className="text-blue-500 flex-shrink-0 mt-0.5" />
                      <span>{item.q}</span>
                    </h4>
                    <p className="text-text-muted leading-relaxed pl-6 text-xs">
                      {item.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PRIVACY TAB */}
          {activeTab === 'privacy' && (
            <div className="space-y-4 animate-fadeIn text-xs sm:text-sm">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-text-main tracking-tight">
                  Privacy Policy &amp; Security Guarantee
                </h3>
                <p className="text-xs text-text-muted">
                  Effective date: September 2026. Designed with candidate privacy as a first principle.
                </p>
              </div>

              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 text-xs space-y-1">
                <p className="font-semibold">
                  We never store, retain, or monetize your resume data.
                </p>
                <p className="text-text-muted leading-relaxed">
                  Unlike traditional recruitment boards, uploaded files are processed in ephemeral memory for the duration of the audit session only and destroyed immediately after report calculation.
                </p>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-text-muted">
                <h4 className="font-semibold text-text-main text-sm">1. Data Handling &amp; Processing</h4>
                <p>
                  When you upload or paste your CV, the text is extracted purely to compute scoring metrics (keyword matches, brevity, impact formula). We do not create user accounts, build background candidate dossiers, or train third-party public models on your personal resume.
                </p>

                <h4 className="font-semibold text-text-main text-sm pt-2">2. Zero Contact Tracking</h4>
                <p>
                  Your telephone numbers, residential locations, and email addresses parsed from resume headers are strictly sanitized and never harvested for marketing, recruitment agencies, or sales pitches.
                </p>

                <h4 className="font-semibold text-text-main text-sm pt-2">3. Payment Information Security</h4>
                <p>
                  All billing for executive rewrite services is processed via PCI-DSS Level 1 certified gateways (Paystack). CheckMyCV never sees or stores full credit card numbers or banking credentials.
                </p>
              </div>
            </div>
          )}

          {/* TERMS TAB */}
          {activeTab === 'terms' && (
            <div className="space-y-4 animate-fadeIn text-xs sm:text-sm">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-text-main tracking-tight">
                  Terms of Service &amp; Fair Use
                </h3>
                <p className="text-xs text-text-muted">
                  Plain-English terms for our ATS diagnostic and resume transformation tools.
                </p>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-text-muted">
                <h4 className="font-semibold text-text-main text-sm">1. Service Scope</h4>
                <p>
                  CheckMyCV provides informational resume diagnostics and algorithmic ATS formatting designed to optimize applicant documents against modern recruitment filters. While our formats reflect verified Fortune 500 standards, hiring outcomes remain at the ultimate discretion of individual employers.
                </p>

                <h4 className="font-semibold text-text-main text-sm pt-2">2. Single-Column ATS Guarantee</h4>
                <p>
                  Our generated documents conform to single-column, tableless, and graphic-free structures recommended by Workday, Greenhouse, Taleo, and Lever engineers to prevent software parsing truncations.
                </p>

                <h4 className="font-semibold text-text-main text-sm pt-2">3. User Responsibility</h4>
                <p>
                  You certify that you own or have permission to submit the documents analyzed. You are responsible for the factual accuracy of personal achievements, job dates, and qualifications represented in your final exported resume.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border-theme bg-surface-raised flex items-center justify-between">
          <span className="text-xs text-text-dim">
            CheckMyCV • Zero Data Retention
          </span>
          <button
            type="button"
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2 rounded-lg transition shadow-sm active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
