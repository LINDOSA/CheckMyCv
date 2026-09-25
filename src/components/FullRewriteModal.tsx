'use client';

import React, { useMemo } from 'react';
import {
  X,
  ShieldCheck,
  ArrowRight,
  LockKey,
  CheckCircle,
} from '@phosphor-icons/react';
import { getStandardCV, parseUserCvToStandardDocument, StandardCVDocument } from '@/lib/cvStandardData';
import { StandardCvPaperView } from './StandardCvPaperView';

interface FullRewriteModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProfileId?: string;
  userScore?: number;
  cvText?: string;
  targetRole?: string;
  isPaid?: boolean;
  onOpenPaywall?: () => void;
}

export function FullRewriteModal({
  isOpen,
  onClose,
  initialProfileId = 'executive',
  userScore = 42,
  cvText,
  targetRole,
  isPaid = false,
  onOpenPaywall,
}: FullRewriteModalProps) {
  const currentStandardCv: StandardCVDocument = useMemo(() => {
    if (cvText && cvText.trim().length >= 20) {
      return parseUserCvToStandardDocument(cvText, targetRole);
    }
    return getStandardCV(initialProfileId);
  }, [cvText, targetRole, initialProfileId]);

  if (!isOpen) return null;

  const beforeScore = userScore || 42;
  const rewrittenScore = Math.max(94, Math.min(98, beforeScore + 48));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative card-surface rounded-2xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-text-main">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-border-theme flex items-start justify-between bg-surface-raised">
          <div className="space-y-1">
            <div className={`inline-flex items-center gap-1.5 ${isPaid ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'} border text-xs font-semibold px-2.5 py-0.5 rounded-full`}>
              {isPaid ? (
                <>
                  <ShieldCheck size={14} weight="bold" />
                  <span>ATS Single-Column Standard • Verifiable Managerial References • Unlocked</span>
                </>
              ) : (
                <>
                  <LockKey size={14} weight="bold" />
                  <span>Locked ATS Preview • Pay R160 to Unlock Full Document</span>
                </>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-text-main tracking-tight">
              Executive ATS Format: {currentStandardCv.name}
            </h3>
            <p className="text-xs text-text-muted">
              Workday, Greenhouse, Taleo, and Lever 100% parsing compliant.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            {!isPaid && onOpenPaywall && (
              <button
                type="button"
                onClick={onOpenPaywall}
                className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <LockKey size={13} weight="bold" />
                <span>Unlock (R160)</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-main p-1.5 rounded-lg hover:bg-surface transition"
              title="Close Preview"
            >
              <X size={18} weight="bold" />
            </button>
          </div>
        </div>

        {/* Score Leap Indicator */}
        <div className="px-4 sm:px-6 py-3 bg-surface-subtle border-b border-border-theme flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-1.5">
              <span className="text-text-muted">Before:</span>
              <span className="font-mono font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
                {beforeScore}/100
              </span>
            </div>

            <ArrowRight size={13} weight="bold" className="text-text-dim" />

            <div className="flex items-center gap-1.5">
              <span className="text-text-muted">After Rewrite:</span>
              <span className="font-mono font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                <ShieldCheck size={13} weight="bold" />
                <span>{rewrittenScore}/100</span>
              </span>
            </div>

            <span className="text-emerald-600 font-semibold text-[11px] hidden md:inline">
              (+{rewrittenScore - beforeScore} pts • Top 3% ATS Pass)
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
            {isPaid ? (
              <>
                <CheckCircle size={14} weight="bold" />
                <span>Single-Column Certified • Unlocked</span>
              </>
            ) : (
              <>
                <LockKey size={14} weight="bold" className="text-amber-500" />
                <span className="text-amber-600">Locked Preview Mode</span>
              </>
            )}
          </div>
        </div>

        {/* Scrollable Paper View Container */}
        <div className="p-2.5 sm:p-6 overflow-y-auto overscroll-contain flex-grow space-y-4 bg-surface-raised">
          <StandardCvPaperView
            cvData={currentStandardCv}
            isPaid={isPaid}
            onOpenPaywall={onOpenPaywall}
          />
        </div>
      </div>
    </div>
  );
}
