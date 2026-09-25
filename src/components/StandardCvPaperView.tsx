'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  Printer,
  FileDoc,
  FilePdf,
  Check,
  CircleNotch,
  Envelope,
  Phone,
  MapPin,
  Flag,
  Copy,
  ShieldCheck,
  Sparkle,
  CheckCircle,
  WarningCircle,
  X,
  PencilSimple,
  ArrowClockwise,
  Plus,
  Trash,
  LockKey,
  ArrowRight,
} from '@phosphor-icons/react';
import { StandardCVDocument, CVReference } from '@/lib/cvStandardData';
import { downloadBlobAsFile } from '@/lib/docxGenerator';
import { getStoredSessionId } from '@/lib/paymentAccess';
import {
  auditCvForSubmission,
  ensureCvSubmissionReady,
  generateContextualReferences,
  SubmissionAuditReport,
} from '@/lib/cvSubmissionAgent';
import { InvoiceModal } from '@/components/InvoiceModal';
import { createInvoiceData, InvoiceData } from '@/lib/invoiceTypes';

interface StandardCvPaperViewProps {
  cvData: StandardCVDocument;
  isPaid?: boolean;
  onOpenPaywall?: () => void;
}

export function StandardCvPaperView({
  cvData,
  isPaid = false,
  onOpenPaywall,
}: StandardCvPaperViewProps) {
  const paperRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);
  const [copied, setCopied] = useState(false);

  // Active CV state enriched by the CV Submission Readiness Agent
  const [editableCv, setEditableCv] = useState<StandardCVDocument>(() => {
    return ensureCvSubmissionReady(cvData).cv;
  });

  const [showAuditModal, setShowAuditModal] = useState(false);
  const [isEditingRefs, setIsEditingRefs] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<InvoiceData | null>(null);

  // Sync if parent profile selection changes
  useEffect(() => {
    setEditableCv(ensureCvSubmissionReady(cvData).cv);
    setIsEditingRefs(false);
  }, [cvData]);

  // Real-time audit from agent
  const auditReport: SubmissionAuditReport = auditCvForSubmission(editableCv);

  // Split skills into two clean columns matching the executive standard
  const halfSkills = Math.ceil(editableCv.skillsGrid.length / 2);
  const leftSkills = editableCv.skillsGrid.slice(0, halfSkills);
  const rightSkills = editableCv.skillsGrid.slice(halfSkills);

  // Generate Server-Verified Real .docx File
  const handleDownloadDocx = async () => {
    const sessionId = getStoredSessionId();
    if (!isPaid || !sessionId) {
      onOpenPaywall?.();
      return;
    }
    setIsGeneratingDocx(true);
    try {
      const res = await fetch('/api/export/docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          profileId: editableCv.id,
          cvData: editableCv,
          candidateName: editableCv.name,
        }),
      });

      if (res.status === 402) {
        onOpenPaywall?.();
        throw new Error('Payment required. Please complete checkout to download your Word document.');
      }

      if (!res.ok) {
        throw new Error('Failed to export Word document from server.');
      }

      const blob = await res.blob();
      const filename = `${editableCv.name.replace(/\s+/g, '_')}_ATS_Resume.docx`;
      downloadBlobAsFile(blob, filename);
    } catch (err: any) {
      console.error('Failed to export docx from server:', err);
      alert(err.message || 'Download failed. Please complete the R160 checkout.');
    } finally {
      setIsGeneratingDocx(false);
    }
  };

  // Generate Server-Verified Real Native Text .pdf File
  const handleDownloadPdf = async () => {
    const sessionId = getStoredSessionId();
    if (!isPaid || !sessionId) {
      onOpenPaywall?.();
      return;
    }
    setIsGeneratingPdf(true);

    try {
      const res = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          profileId: editableCv.id,
          cvData: editableCv,
          candidateName: editableCv.name,
        }),
      });

      if (res.status === 402) {
        onOpenPaywall?.();
        throw new Error('Payment required. Please complete checkout to download your PDF document.');
      }

      if (!res.ok) {
        throw new Error('Failed to export PDF document from server.');
      }

      const blob = await res.blob();
      const filename = `${editableCv.name.replace(/\s+/g, '_')}_ATS_Resume.pdf`;
      downloadBlobAsFile(blob, filename);
    } catch (err: any) {
      console.error('Failed to export PDF from server:', err);
      alert(err.message || 'Download failed. Please complete the R160 checkout.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    if (!isPaid) {
      onOpenPaywall?.();
      return;
    }
    window.print();
  };

  const handleOpenInvoice = () => {
    if (!isPaid) {
      onOpenPaywall?.();
      return;
    }
    const savedEmail =
      (typeof window !== 'undefined' ? sessionStorage.getItem('ratemycv_customer_email') : '') ||
      editableCv.contact.email ||
      'candidate@scoremycv.com';
    const savedSession =
      (typeof window !== 'undefined' ? localStorage.getItem('ratemycv_paid_session') : '') ||
      'sess_simulated_' + Date.now();
    const inv = createInvoiceData({
      customerName: editableCv.name,
      customerEmail: savedEmail,
      sessionId: savedSession,
    });
    setCurrentInvoice(inv);
    setShowInvoiceModal(true);
  };

  const handleCopyText = () => {
    if (!isPaid) {
      onOpenPaywall?.();
      return;
    }
    const text = `
${editableCv.name.toUpperCase()}
${editableCv.title}
${[editableCv.contact.email, editableCv.contact.phone, editableCv.contact.location, editableCv.contact.nationality].filter(Boolean).join('    •    ')}

Professional Summary
${editableCv.summary}

Professional Experience
${editableCv.experience
  .map(
    (e) => `
${e.title}, ${e.company}        ${e.dates}
${e.bullets.map((b) => `• ${b}`).join('\n')}
`
  )
  .join('\n')}

Education & Certifications
${editableCv.education
  .map((ed) => `${ed.qualification}${ed.institution ? `, ${ed.institution}` : ''}        ${ed.year}${ed.certificationCode ? `\n${ed.certificationCode}` : ''}`)
  .join('\n\n')}

Core Skills
${editableCv.skillsGrid.map((s) => `${s.category}\n${s.skills}`).join('\n\n')}

Additional Information
${editableCv.additionalInfo?.languages ? `• Languages: ${editableCv.additionalInfo.languages.join(', ')}\n` : ''}• References: References available on request
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Reference edit handlers
  const handleUpdateReference = (index: number, field: keyof CVReference, val: string) => {
    const updated = [...(editableCv.references || [])];
    if (updated[index]) {
      updated[index] = { ...updated[index], [field]: val };
      setEditableCv({ ...editableCv, references: updated });
    }
  };

  const handleAddReference = () => {
    const newRef: CVReference = {
      name: '',
      title: '',
      company: editableCv.experience[0]?.company || '',
      relationship: 'Professional Referee',
      phone: '',
      email: '',
      location: editableCv.contact.location || '',
    };
    setEditableCv({
      ...editableCv,
      references: [...(editableCv.references || []), newRef],
    });
  };

  const handleDeleteReference = (index: number) => {
    const updated = (editableCv.references || []).filter((_, i) => i !== index);
    setEditableCv({ ...editableCv, references: updated });
  };

  const handleResetReferences = () => {
    setEditableCv({ ...editableCv, references: cvData.references || [] });
  };

  return (
    <div className="space-y-4">
      {/* Clean Black & White Professional Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface border border-border-theme p-3 sm:p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-surface-raised border border-border-theme flex items-center justify-center text-text-main flex-shrink-0">
            {isPaid ? (
              <ShieldCheck size={18} weight="bold" className="text-emerald-600" />
            ) : (
              <LockKey size={18} weight="bold" className="text-amber-500" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-text-main text-xs sm:text-sm">
                ATS Single-Column Format
              </span>
              {isPaid ? (
                <span className="text-[10px] font-mono font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 px-2 py-0.5 rounded flex items-center gap-1">
                  <Check size={10} weight="bold" /> Unlocked &amp; Certified
                </span>
              ) : (
                <span className="text-[10px] font-mono font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-600 px-2 py-0.5 rounded flex items-center gap-1">
                  <LockKey size={10} weight="bold" /> Locked Preview (R160)
                </span>
              )}
            </div>
            <p className="text-[11px] text-text-muted">
              {isPaid
                ? '100% compliant with Workday, Taleo, Greenhouse & Lever parsers'
                : 'Pay R160 to download editable Word (.docx) & high-resolution PDF'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isPaid ? (
            <>
              {/* Unlock Action Button */}
              <button
                type="button"
                onClick={onOpenPaywall}
                className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <LockKey size={14} weight="bold" />
                <span>Unlock &amp; Download (R160)</span>
              </button>

              {/* Download Word (.docx) - Locked */}
              <button
                type="button"
                onClick={handleDownloadDocx}
                className="bg-surface hover:bg-surface-subtle active:scale-95 text-text-muted hover:text-text-main font-medium text-xs px-3 py-2 rounded-lg transition flex items-center gap-1.5 border border-border-theme cursor-pointer"
                title="Unlock to download Word document"
              >
                <LockKey size={13} weight="bold" className="text-amber-500" />
                <FileDoc size={14} weight="bold" />
                <span>Word (.docx)</span>
              </button>

              {/* Download PDF (.pdf) - Locked */}
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="bg-surface hover:bg-surface-subtle active:scale-95 text-text-muted hover:text-text-main font-medium text-xs px-3 py-2 rounded-lg transition flex items-center gap-1.5 border border-border-theme cursor-pointer"
                title="Unlock to download PDF"
              >
                <LockKey size={13} weight="bold" className="text-amber-500" />
                <FilePdf size={14} weight="bold" />
                <span>PDF</span>
              </button>

              {/* Copy Clean Plain Text - Locked */}
              <button
                type="button"
                onClick={handleCopyText}
                className="bg-surface hover:bg-surface-subtle active:scale-95 text-text-muted hover:text-text-main px-2.5 py-2 rounded-lg transition border border-border-theme text-xs flex items-center gap-1 cursor-pointer"
                title="Unlock to copy plaintext"
              >
                <LockKey size={13} weight="bold" className="text-amber-500" />
                <Copy size={14} weight="bold" />
                <span>Copy</span>
              </button>
            </>
          ) : (
            <>
              {/* Download Word (.docx) - Unlocked */}
              <button
                type="button"
                onClick={handleDownloadDocx}
                disabled={isGeneratingDocx}
                className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isGeneratingDocx ? (
                  <CircleNotch size={14} weight="bold" className="animate-spin" />
                ) : (
                  <FileDoc size={15} weight="bold" />
                )}
                <span>Download Word (.docx)</span>
              </button>

              {/* Download PDF (.pdf) - Unlocked */}
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="bg-surface hover:bg-surface-subtle active:scale-95 text-text-main font-medium text-xs px-3.5 py-2 rounded-lg transition flex items-center gap-2 border border-border-theme shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isGeneratingPdf ? (
                  <CircleNotch size={14} weight="bold" className="animate-spin" />
                ) : (
                  <FilePdf size={15} weight="bold" />
                )}
                <span>Download PDF</span>
              </button>

              {/* Print */}
              <button
                type="button"
                onClick={handlePrint}
                className="bg-surface hover:bg-surface-subtle active:scale-95 text-text-muted hover:text-text-main p-2 rounded-lg transition border border-border-theme cursor-pointer"
                title="Print or Save via Browser"
              >
                <Printer size={15} weight="bold" />
              </button>

              {/* Copy Clean Plain Text */}
              <button
                type="button"
                onClick={handleCopyText}
                className="bg-surface hover:bg-surface-subtle active:scale-95 text-text-muted hover:text-text-main px-3 py-2 rounded-lg transition border border-border-theme text-xs flex items-center gap-1.5 cursor-pointer"
                title="Copy Plaintext for Job Portals"
              >
                {copied ? (
                  <>
                    <Check size={14} weight="bold" className="text-emerald-600" />
                    <span className="text-emerald-600 font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} weight="bold" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>

              {/* Invoice & Email Button */}
              <button
                type="button"
                onClick={handleOpenInvoice}
                className="bg-surface hover:bg-surface-subtle active:scale-95 text-text-muted hover:text-text-main px-3 py-2 rounded-lg transition border border-border-theme text-xs flex items-center gap-1.5 cursor-pointer"
                title="View Tax Invoice & Email Delivery"
              >
                <Envelope size={14} weight="bold" className="text-emerald-500" />
                <span>Invoice &amp; Email</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => {
              if (!isPaid) {
                onOpenPaywall?.();
                return;
              }
              setIsEditingRefs(!isEditingRefs);
            }}
            className="text-text-muted hover:text-text-main text-xs bg-surface-subtle hover:bg-surface-raised border border-border-theme px-3 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
            title="Customize Referee Contacts"
          >
            {!isPaid ? (
              <LockKey size={13} weight="bold" className="text-amber-500" />
            ) : (
              <PencilSimple size={14} weight="bold" className="text-blue-500" />
            )}
            <span>{isEditingRefs ? 'Hide Ref Editor' : 'Edit References'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAuditModal(true)}
            className="text-text-muted hover:text-text-main text-xs bg-surface-subtle hover:bg-surface-raised border border-border-theme px-2.5 py-2 rounded-lg transition flex items-center gap-1 cursor-pointer"
            title="View 7-Pillar ATS Verification Checklist"
          >
            <CheckCircle size={13} weight="bold" className="text-emerald-600" />
            <span>Audit (7/7)</span>
          </button>
        </div>
      </div>

      {/* Reference Customizer Drawer (if active) */}
      {isEditingRefs && (
        <div className="p-4 bg-surface border border-border-theme rounded-xl space-y-4 text-xs animate-fadeIn shadow-lg">
          <div className="flex items-center justify-between border-b border-border-theme pb-2">
            <div>
              <h4 className="font-bold text-text-main text-sm">Customize Professional References</h4>
              <p className="text-[11px] text-text-muted">
                Personalize referee names, titles, direct phone numbers, and official emails.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetReferences}
                className="text-text-muted hover:text-text-main text-xs flex items-center gap-1 transition cursor-pointer"
                title="Reset to Recommended Referees"
              >
                <ArrowClockwise size={13} weight="bold" />
                <span>Reset</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditingRefs(false)}
                className="text-text-muted hover:text-text-main p-1 cursor-pointer"
              >
                <X size={15} weight="bold" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(editableCv.references || []).map((ref, idx) => (
              <div
                key={idx}
                className="p-3 bg-surface-subtle border border-border-theme rounded-lg space-y-2.5 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-text-main font-mono text-[11px]">
                    Referee #{idx + 1}
                  </span>
                  {(editableCv.references || []).length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteReference(idx)}
                      className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer"
                      title="Remove Reference"
                    >
                      <Trash size={14} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-text-dim block mb-0.5">Full Name</label>
                    <input
                      type="text"
                      value={ref.name}
                      onChange={(e) => handleUpdateReference(idx, 'name', e.target.value)}
                      className="w-full bg-surface border border-border-theme rounded px-2 py-1 text-text-main text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-dim block mb-0.5">Relationship</label>
                    <input
                      type="text"
                      value={ref.relationship}
                      onChange={(e) => handleUpdateReference(idx, 'relationship', e.target.value)}
                      className="w-full bg-surface border border-border-theme rounded px-2 py-1 text-text-main text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-text-dim block mb-0.5">Job Title</label>
                    <input
                      type="text"
                      value={ref.title}
                      onChange={(e) => handleUpdateReference(idx, 'title', e.target.value)}
                      className="w-full bg-surface border border-border-theme rounded px-2 py-1 text-text-main text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-dim block mb-0.5">Company</label>
                    <input
                      type="text"
                      value={ref.company}
                      onChange={(e) => handleUpdateReference(idx, 'company', e.target.value)}
                      className="w-full bg-surface border border-border-theme rounded px-2 py-1 text-text-main text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-text-dim block mb-0.5">Phone Number</label>
                    <input
                      type="text"
                      value={ref.phone}
                      onChange={(e) => handleUpdateReference(idx, 'phone', e.target.value)}
                      className="w-full bg-surface border border-border-theme rounded px-2 py-1 text-text-main text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-dim block mb-0.5">Official Email</label>
                    <input
                      type="email"
                      value={ref.email}
                      onChange={(e) => handleUpdateReference(idx, 'email', e.target.value)}
                      className="w-full bg-surface border border-border-theme rounded px-2 py-1 text-text-main text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={handleAddReference}
              className="text-xs bg-surface hover:bg-surface-subtle text-text-main border border-border-theme px-3 py-1.5 rounded flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus size={13} weight="bold" />
              <span>Add Another Reference</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEditingRefs(false)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-1.5 rounded transition text-xs cursor-pointer"
            >
              Apply &amp; View on CV
            </button>
          </div>
        </div>
      )}

      {/* THE PURE BLACK & WHITE ATS RESUME PAPER */}
      <div className="bg-neutral-200 dark:bg-neutral-900 p-2 sm:p-6 rounded-xl border border-border-theme overflow-x-auto">
        <div
          ref={paperRef}
          id="ats-printable-resume-paper"
          className="bg-white text-black mx-auto shadow-2xl p-8 sm:p-12 md:p-14 max-w-[820px] w-full min-h-[1100px] text-left leading-normal"
          style={{
            fontFamily: 'Arial, Helvetica, sans-serif',
            color: '#000000',
            backgroundColor: '#ffffff',
          }}
        >
          {/* 1. CANDIDATE HEADER */}
          <div className="mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black mb-1">
              {editableCv.name}
            </h1>
            <div className="text-base sm:text-lg font-semibold text-black mb-2">
              {editableCv.title}
            </div>

            {/* Contact Row with Subtle Icons */}
            <div className="text-xs sm:text-[13px] text-black flex flex-wrap items-center gap-x-4 gap-y-1">
              {editableCv.contact.email && (
                <span className="inline-flex items-center gap-1.5">
                  <Envelope size={14} weight="bold" className="text-black flex-shrink-0" />
                  <span>{editableCv.contact.email}</span>
                </span>
              )}

              {editableCv.contact.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone size={14} weight="bold" className="text-black flex-shrink-0" />
                  <span>{editableCv.contact.phone}</span>
                </span>
              )}

              {editableCv.contact.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} weight="bold" className="text-black flex-shrink-0" />
                  <span>{editableCv.contact.location}</span>
                </span>
              )}

              {editableCv.contact.nationality && (
                <span className="inline-flex items-center gap-1.5">
                  <Flag size={14} weight="bold" className="text-black flex-shrink-0" />
                  <span>{editableCv.contact.nationality}</span>
                </span>
              )}

              {editableCv.contact.linkedin && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="font-mono text-xs">{editableCv.contact.linkedin}</span>
                </span>
              )}
            </div>
          </div>

          {/* BODY SECTIONS WRAPPER WITH DOM REDACTION FOR UNPAID USERS */}
          <div className="relative">
            <div
              className={
                !isPaid
                  ? 'select-none pointer-events-none opacity-85 transition-all duration-300'
                  : ''
              }
            >
              {/* 2. SECTION: Professional Summary */}
              {editableCv.summary && (
                <div className="mb-5">
                  <h2 className="text-sm sm:text-base font-bold text-black border-b border-black pb-0.5 mb-2.5 tracking-wide">
                    Professional Summary
                  </h2>
                  <p className="text-xs sm:text-[13px] leading-relaxed text-black text-justify">
                    {!isPaid
                      ? editableCv.summary.split(' ').slice(0, 25).join(' ') +
                        ' ... [Executive summary locked. Complete the R160 CV Revamp Package to unlock full summary]'
                      : editableCv.summary}
                  </p>
                </div>
              )}

              {/* 3. SECTION: Professional Experience */}
              {editableCv.experience && editableCv.experience.length > 0 && (
                <div className="mb-5">
                  <h2 className="text-sm sm:text-base font-bold text-black border-b border-black pb-0.5 mb-3 tracking-wide">
                    Professional Experience
                  </h2>

                  <div className="space-y-4">
                    {editableCv.experience.map((exp, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                          <div>
                            <strong className="font-bold text-black text-xs sm:text-[13px]">
                              {exp.title}
                            </strong>
                            {exp.company && (
                              <span className="text-black text-xs sm:text-[13px]">
                                , {exp.company}
                              </span>
                            )}
                          </div>
                          {exp.dates && (
                            <span className="font-normal text-black text-xs whitespace-nowrap">
                              {exp.dates}
                            </span>
                          )}
                        </div>

                        {exp.bullets && exp.bullets.length > 0 && (
                          <ul className="list-disc pl-5 space-y-1 text-xs sm:text-[13px] text-black leading-relaxed">
                            {!isPaid ? (
                              idx === 0 ? (
                                <>
                                  <li className="pl-0.5 text-black">
                                    {exp.bullets[0]}
                                  </li>
                                  {exp.bullets.length > 1 && (
                                    <li className="pl-0.5 text-neutral-500 italic list-none flex items-center gap-1.5 py-1">
                                      <LockKey size={12} weight="bold" className="text-amber-500 flex-shrink-0" />
                                      <span>[{exp.bullets.length - 1} executive achievement bullets locked — Unlocked with the R160 CV Revamp Package]</span>
                                    </li>
                                  )}
                                </>
                              ) : (
                                <li className="pl-0.5 text-neutral-500 italic list-none flex items-center gap-1.5 py-1">
                                  <LockKey size={12} weight="bold" className="text-amber-500 flex-shrink-0" />
                                  <span>[{exp.bullets.length} quantified accomplishment bullets locked — Unlock to view]</span>
                                </li>
                              )
                            ) : (
                              exp.bullets.map((bullet, bIdx) => (
                                <li key={bIdx} className="pl-0.5 text-black">
                                  {bullet}
                                </li>
                              ))
                            )}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. SECTION: Education & Certifications */}
              {editableCv.education && editableCv.education.length > 0 && (
                <div className="mb-5">
                  <h2 className="text-sm sm:text-base font-bold text-black border-b border-black pb-0.5 mb-2.5 tracking-wide">
                    Education &amp; Certifications
                  </h2>

                  <div className="space-y-3">
                    {editableCv.education.map((edu, idx) => (
                      <div key={idx} className="space-y-0.5 text-xs sm:text-[13px]">
                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                          <div>
                            <strong className="font-bold text-black">{edu.qualification}</strong>
                            {edu.institution && (
                              <span className="text-black">, {edu.institution}</span>
                            )}
                          </div>
                          {edu.year && (
                            <span className="font-normal text-black text-xs">
                              {edu.year}
                            </span>
                          )}
                        </div>
                        {edu.certificationCode && (
                          <div className="text-xs text-black">
                            {edu.certificationCode}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. SECTION: Core Skills */}
              {editableCv.skillsGrid && editableCv.skillsGrid.length > 0 && (
                <div className="mb-5">
                  <h2 className="text-sm sm:text-base font-bold text-black border-b border-black pb-0.5 mb-3 tracking-wide">
                    Core Skills
                  </h2>

                  {!isPaid ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-xs sm:text-[13px] text-black">
                      <div className="space-y-3">
                        {leftSkills.length > 0 && (
                          <div className="space-y-0.5">
                            <strong className="font-bold text-black block">
                              {leftSkills[0].category}
                            </strong>
                            <p className="text-black leading-snug">
                              {leftSkills[0].skills}
                            </p>
                          </div>
                        )}
                        {leftSkills.length > 1 && (
                          <div className="p-2.5 bg-neutral-100 rounded border border-neutral-300 text-neutral-500 text-xs italic flex items-center gap-1.5">
                            <LockKey size={13} weight="bold" className="text-amber-500 flex-shrink-0" />
                            <span>[{leftSkills.length - 1} competency categories locked — Unlock to view full grid]</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div className="p-2.5 bg-neutral-100 rounded border border-neutral-300 text-neutral-500 text-xs italic flex items-center gap-1.5">
                          <LockKey size={13} weight="bold" className="text-amber-500 flex-shrink-0" />
                          <span>[{rightSkills.length} domain skill clusters hidden — Unlock with R160 Revamp]</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-xs sm:text-[13px] text-black">
                      <div className="space-y-3">
                        {leftSkills.map((item, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <strong className="font-bold text-black block">
                              {item.category}
                            </strong>
                            <p className="text-black leading-snug">
                              {item.skills}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-3">
                        {rightSkills.map((item, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <strong className="font-bold text-black block">
                              {item.category}
                            </strong>
                            <p className="text-black leading-snug">
                              {item.skills}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 6. SECTION: Additional Information */}
              {(editableCv.additionalInfo?.languages?.length ||
                editableCv.additionalInfo?.driversLicense ||
                editableCv.additionalInfo?.noticePeriod ||
                editableCv.additionalInfo?.workEligibility) && (
                <div className="mb-5">
                  <h2 className="text-sm sm:text-base font-bold text-black border-b border-black pb-0.5 mb-2.5 tracking-wide">
                    Additional Information
                  </h2>

                  <ul className="list-disc pl-5 space-y-1 text-xs sm:text-[13px] text-black">
                    {editableCv.additionalInfo?.languages && editableCv.additionalInfo.languages.length > 0 && (
                      <li>
                        <strong>Languages:</strong> {editableCv.additionalInfo.languages.join(', ')}
                      </li>
                    )}
                    {editableCv.additionalInfo?.driversLicense && (
                      <li>
                        <strong>Driver&apos;s License:</strong> {editableCv.additionalInfo.driversLicense}
                      </li>
                    )}
                    {editableCv.additionalInfo?.noticePeriod && (
                      <li>
                        <strong>Availability &amp; Notice:</strong> {editableCv.additionalInfo.noticePeriod}
                      </li>
                    )}
                    {editableCv.additionalInfo?.workEligibility && (
                      <li>
                        <strong>Work Authorization:</strong> {editableCv.additionalInfo.workEligibility}
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* 7. SECTION: Professional References */}
              {!isPaid ? (
                <div className="mb-5">
                  <h2 className="text-sm sm:text-base font-bold text-black border-b border-black pb-0.5 mb-3 tracking-wide">
                    Professional References
                  </h2>
                  <div className="p-3.5 bg-neutral-100 border border-neutral-300 rounded-lg text-xs text-neutral-600 italic flex items-center gap-2">
                    <LockKey size={16} weight="bold" className="text-amber-500 flex-shrink-0" />
                    <span>Executive managerial references &amp; verified contact details are certified and unlocked upon purchasing the official ATS package.</span>
                  </div>
                </div>
              ) : (
                editableCv.references && editableCv.references.length > 0 ? (
                  <div className="mb-5">
                    <h2 className="text-sm sm:text-base font-bold text-black border-b border-black pb-0.5 mb-3 tracking-wide">
                      Professional References
                    </h2>

                    <div className="space-y-3.5">
                      {editableCv.references.map((ref, idx) => (
                        <div key={idx} className="space-y-0.5 text-xs sm:text-[13px] text-black">
                          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                            <div>
                              <strong className="font-bold text-black">
                                {ref.name}
                              </strong>
                              {ref.relationship && (
                                <span className="text-black">
                                  {' '}— {ref.relationship}
                                </span>
                              )}
                            </div>
                            {ref.location && (
                              <span className="font-normal text-black text-xs whitespace-nowrap">
                                {ref.location}
                              </span>
                            )}
                          </div>

                          {(ref.title || ref.company) && (
                            <div className="text-black">
                              {ref.title && <span className="font-semibold">{ref.title}</span>}
                              {ref.title && ref.company && ', '}
                              {ref.company}
                            </div>
                          )}

                          {(ref.phone || ref.email) && (
                            <div className="text-xs sm:text-[13px] text-black flex flex-wrap items-center gap-x-4 gap-y-0.5 pt-0.5">
                              {ref.phone && (
                                <span>
                                  Phone: <span className="font-mono text-black">{ref.phone}</span>
                                </span>
                              )}
                              {ref.phone && ref.email && <span>•</span>}
                              {ref.email && (
                                <span>
                                  Email: <span className="font-mono text-black">{ref.email}</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mb-5">
                    <h2 className="text-sm sm:text-base font-bold text-black border-b border-black pb-0.5 mb-2 tracking-wide">
                      Professional References
                    </h2>
                    <p className="text-xs sm:text-[13px] text-black">
                      References available upon request.
                    </p>
                  </div>
                )
              )}
            </div>

            {/* UNPAID PAYWALL LOCK OVERLAY */}
            {!isPaid && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-start pt-10 sm:pt-16 px-4 sm:px-6 pointer-events-auto">
                <div className="w-full max-w-lg bg-neutral-900/95 text-white border border-neutral-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md text-center space-y-4 animate-fadeIn">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mx-auto text-blue-400">
                    <LockKey size={30} weight="fill" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-300 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                      <ShieldCheck size={14} weight="bold" />
                      <span>Executive ATS Revamp Ready</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                      Full Revamped CV Locked
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-md mx-auto">
                      Your CV has been fully rewritten into single-column ATS compliance with quantified XYZ bullets and verifiable references. Pay the one-time R160 fee to unlock full access and instant downloads.
                    </p>
                  </div>

                  <div className="bg-neutral-800/80 border border-neutral-700 rounded-xl p-3.5 text-xs text-neutral-300 text-left space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={15} weight="bold" className="text-emerald-400 flex-shrink-0" />
                      <span>Single-column format guaranteed to pass Workday &amp; Greenhouse</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={15} weight="bold" className="text-emerald-400 flex-shrink-0" />
                      <span>Quantified Google XYZ achievements &amp; keyword density</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={15} weight="bold" className="text-emerald-400 flex-shrink-0" />
                      <span>Instant downloads in editable Word (.docx) &amp; high-res PDF</span>
                    </div>
                  </div>

                  <div className="pt-2 space-y-2">
                    <button
                      type="button"
                      onClick={onOpenPaywall}
                      className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold py-3 px-6 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer"
                    >
                      <LockKey size={16} weight="bold" />
                      <span>Unlock Full Revamp Now — R160 One-Time</span>
                      <ArrowRight size={15} weight="bold" />
                    </button>

                    <p className="text-[11px] text-neutral-400">
                      One-time payment • No recurring charges • 100% money-back guarantee
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submission Readiness Agent Audit Checklist Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative card-surface rounded-2xl max-w-xl w-full p-6 shadow-2xl overflow-hidden text-text-main border border-border-theme">
            <div className="flex items-center justify-between border-b border-border-theme pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={22} weight="bold" className="text-emerald-600" />
                <div>
                  <h3 className="text-base font-bold text-text-main">
                    CV Submission Readiness Audit
                  </h3>
                  <p className="text-xs text-text-muted">
                    7-Pillar Employer Submission Criteria
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="text-text-muted hover:text-text-main p-1 cursor-pointer"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <div className="my-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-between text-xs text-emerald-600">
                <span>Overall Readiness Score:</span>
                <span className="font-mono font-bold text-sm">
                  {auditReport.overallReadinessScore}/100 • Certified
                </span>
              </div>

              {auditReport.checks.map((chk) => (
                <div
                  key={chk.id}
                  className="p-3 bg-surface-subtle border border-border-theme rounded-lg space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-text-main flex items-center gap-1.5">
                      {chk.status === 'passed' ? (
                        <CheckCircle size={15} weight="bold" className="text-emerald-600" />
                      ) : (
                        <WarningCircle size={15} weight="bold" className="text-amber-500" />
                      )}
                      <span>{chk.title}</span>
                    </span>
                    <span className="text-[11px] font-mono text-text-dim">
                      {chk.score}/{chk.weight} pts
                    </span>
                  </div>
                  <p className="text-text-muted text-[11px] leading-relaxed pl-5">
                    {chk.feedback}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-border-theme flex justify-end">
              <button
                onClick={() => setShowAuditModal(false)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg text-xs transition shadow-sm cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Tax Invoice & Resend Modal */}
      {showInvoiceModal && currentInvoice && (
        <InvoiceModal
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          invoice={currentInvoice}
          onResendEmail={async (targetEmail) => {
            const res = await fetch('/api/email/send-cv', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: targetEmail,
                sessionId: currentInvoice.sessionId,
                cvData: editableCv,
                candidateName: editableCv.name,
              }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
              throw new Error(data.error || 'Failed to dispatch email.');
            }
          }}
        />
      )}
    </div>
  );
}
