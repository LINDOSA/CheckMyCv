'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ShareNetwork,
  ArrowClockwise,
  TrendUp,
  LockKey,
  Sparkle,
  CheckCircle,
  WarningCircle,
  MagnifyingGlass,
  Check,
  ShieldCheck,
  X,
  FileText,
} from '@phosphor-icons/react';
import { ScoreResult } from '@/types/scoring';
import { PaywallModal } from './PaywallModal';
import { ShareCardModal } from './ShareCardModal';
import { FullRewriteModal } from './FullRewriteModal';
import { isUserPaid } from '@/lib/paymentAccess';

interface ScoreDisplayProps {
  result: ScoreResult;
  cvText?: string;
  jobAdvertText?: string;
  onReset: () => void;
  isPaid?: boolean;
}

export function ScoreDisplay({
  result,
  cvText,
  jobAdvertText,
  onReset,
  isPaid: initialPaid,
}: ScoreDisplayProps) {
  const [showPaywall, setShowPaywall] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showTestProfileModal, setShowTestProfileModal] = useState(false);
  const [showPostScorePrompt, setShowPostScorePrompt] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);
  const [isPaid, setIsPaid] = useState(() => initialPaid ?? isUserPaid());

  useEffect(() => {
    if (typeof initialPaid === 'boolean') {
      setIsPaid(initialPaid);
    } else {
      setIsPaid(isUserPaid());
    }

    const checkPaid = () => {
      setIsPaid(isUserPaid());
    };
    window.addEventListener('storage', checkPaid);
    return () => window.removeEventListener('storage', checkPaid);
  }, [initialPaid]);

  // Smooth Count-Up Animation for the Overall Score
  useEffect(() => {
    let start = 0;
    const target = result.overall_score;
    const duration = 1000;
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * target));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [result.overall_score]);

  // Save active score and CV into sessionStorage for the /insights page,
  // and trigger the CV Revamp Package selection prompt 1.2s after score animation finishes
  useEffect(() => {
    try {
      sessionStorage.setItem('ratemycv_latest_result', JSON.stringify(result));
      if (cvText) {
        sessionStorage.setItem('ratemycv_cv_text', cvText);
      }
    } catch (e) {
      console.error('Session storage error:', e);
    }

    const timer = setTimeout(() => {
      setShowPostScorePrompt(true);
    }, 1200);

    return () => clearTimeout(timer);
  }, [result, cvText]);

  const getScoreColor = (score: number) => {
    if (score >= 75) {
      return {
        text: 'text-emerald-500',
        stroke: '#10b981',
        bg: 'bg-emerald-500',
        border: 'border-emerald-500/30',
        badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      };
    }
    if (score >= 55) {
      return {
        text: 'text-amber-500',
        stroke: '#f59e0b',
        bg: 'bg-amber-500',
        border: 'border-amber-500/30',
        badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      };
    }
    return {
      text: 'text-rose-500',
      stroke: '#f43f5e',
      bg: 'bg-rose-500',
      border: 'border-rose-500/30',
      badge: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    };
  };

  const getScoreVerdict = (score: number) => {
    if (score >= 75) return 'Strong ATS Match. High Interview Probability';
    if (score >= 55) return 'Competitive Contender. Needs Metric Polish';
    return 'ATS Red Flag. High Risk of Automated Rejection';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 85) return 'Exceptional';
    if (score >= 75) return 'Strong';
    if (score >= 60) return 'Competitive';
    if (score >= 45) return 'Needs Work';
    return 'Critical';
  };

  const mainColor = getScoreColor(result.overall_score);
  const scoreLabel = getScoreLabel(result.overall_score);

  // SVG Circular Ring calculation
  const circleSize = 136;
  const strokeWidth = 8;
  const center = circleSize / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  // Callback probability
  const callbackProbability = Math.round(
    Math.min(96, Math.max(25, result.overall_score * 0.95 - result.top_issues.length * 2))
  );

  const getCallbackBadge = (prob: number) => {
    if (prob >= 70)
      return {
        cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        Icon: CheckCircle,
        color: 'text-emerald-500',
        label: 'Submission Ready',
        desc: 'High probability. Matches modern ATS parsing criteria.',
      };
    if (prob >= 50)
      return {
        cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        Icon: WarningCircle,
        color: 'text-amber-500',
        label: 'Almost There',
        desc: 'Moderate probability. Needs keyword density calibration and metric polish.',
      };
    return {
      cls: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
      Icon: WarningCircle,
      color: 'text-rose-500',
      label: 'Do Not Submit Yet',
      desc: 'Low probability. High risk of automated rejection. Missing key credentials.',
    };
  };

  const callback = getCallbackBadge(callbackProbability);

  return (
    <section className="py-6 px-4 sm:px-6 max-w-3xl mx-auto w-full space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between border-b border-border-theme pb-3 text-xs">
        <button
          onClick={onReset}
          className="text-text-muted hover:text-text-main flex items-center gap-1.5 transition font-medium cursor-pointer"
        >
          <ArrowClockwise size={14} weight="bold" />
          <span>Score Another CV</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowShare(true)}
            className="text-text-muted hover:text-text-main flex items-center gap-1.5 transition font-medium cursor-pointer"
          >
            <ShareNetwork size={14} weight="bold" className="text-blue-500" />
            <span className="hidden sm:inline">Share</span>
          </button>
          <span className="text-border-theme-strong">|</span>
          <span className="text-blue-500 font-medium">
            {result.is_general_health ? 'General CV Health' : 'Advert Matched'}
          </span>
        </div>
      </div>

      {/* Primary Score Board Surface */}
      <div className="card-surface rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          {/* Circular SVG Dial */}
          <div className="flex-shrink-0 relative flex items-center justify-center">
            <svg
              width={circleSize}
              height={circleSize}
              className="transform -rotate-90"
            >
              {/* Neutral Theme Background Track */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke="var(--border-theme-strong)"
                strokeWidth={strokeWidth}
              />
              {/* Progress */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={mainColor.stroke}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-[stroke-dashoffset] duration-300 ease-out"
              />
            </svg>

            {/* Numbers */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-4xl sm:text-5xl font-bold font-mono tracking-tight text-text-main leading-none">
                {displayScore}
              </span>
              <span className="text-[10px] text-text-dim uppercase tracking-wider font-semibold mt-1">
                out of 100
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border mt-1 ${mainColor.badge}`}>
                {scoreLabel}
              </span>
            </div>
          </div>

          {/* Headline and Global Benchmark */}
          <div className="space-y-2 flex-grow">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted bg-surface-raised border border-border-theme px-3 py-1 rounded-full">
              <TrendUp size={13} weight="bold" className="text-blue-500" />
              <span>{result.benchmark_text}</span>
            </div>

            <h1 className="text-lg sm:text-xl font-semibold text-text-main leading-snug">
              &quot;{result.headline}&quot;
            </h1>

            {/* Callback Probability Badge */}
            <div className="pt-1.5 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${callback.cls}`}>
                  <callback.Icon size={13} weight="bold" className={callback.color} />
                  <span>{callback.label}</span>
                </span>
                <span className="text-xs font-bold text-text-main">
                  {callbackProbability}% Callback Probability
                </span>
              </div>
              <p className="text-xs text-text-muted leading-normal">
                {callback.desc}
              </p>
            </div>

            <p className="text-xs text-text-dim font-normal pt-0.5">
              Verdict: <span className={`${mainColor.text} font-medium`}>{getScoreVerdict(result.overall_score)}</span>
            </p>
          </div>
        </div>

        {/* 5 Category Progress Bars */}
        <div className="border-t border-border-theme pt-5 space-y-3">
          <h3 className="text-sm font-semibold text-text-main">Category Breakdown</h3>

          <div className="space-y-3">
            {result.categories.map((cat) => {
              const catColor = getScoreColor(cat.score);
              return (
                <div key={cat.key} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-text-main">
                      {cat.name}{' '}
                      <span className="text-text-dim font-normal">
                        ({cat.weight}%)
                      </span>
                    </span>
                    <span className={`font-semibold tabular-nums ${catColor.text}`}>
                      {cat.score}/100
                    </span>
                  </div>

                  <div className="h-1.5 w-full bg-surface-raised rounded overflow-hidden border border-border-theme">
                    <div
                      className={`h-full ${catColor.bg} transition-all duration-700`}
                      style={{ width: `${cat.score}%` }}
                    />
                  </div>

                  <p className="text-xs text-text-muted leading-relaxed font-normal">
                    {cat.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* PROMINENT LINK TO DEDICATED RECRUITER INSIGHTS PAGE */}
        <div className="border-t border-border-theme pt-5">
          <Link
            href="/insights"
            className="p-5 bg-surface-subtle hover:bg-surface-raised border border-border-theme hover:border-blue-500/40 rounded-xl flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center flex-shrink-0">
                <MagnifyingGlass size={20} weight="bold" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-text-main group-hover:text-blue-500 transition">
                    View Full Recruiter Insights &amp; Keyword Gap Analysis
                  </h4>
                  <span className="text-[10px] font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20 px-2 py-0.5 rounded-full">
                    Separate Report
                  </span>
                </div>
                <p className="text-xs text-text-muted">
                  Top 3 interview blockers, recruiter 6-second scan audit, keyword match breakdown, and interactive XYZ rewrite.
                </p>
              </div>
            </div>
            <ArrowRight
              size={18}
              weight="bold"
              className="text-text-dim group-hover:text-blue-500 group-hover:translate-x-1 transition-transform flex-shrink-0 ml-3"
            />
          </Link>
        </div>

        {/* PROMINENT CV REVAMP PACKAGE SELECTOR CARD */}
        <div className="border-t border-border-theme pt-5 space-y-4">
          <div className="p-5 bg-surface-raised border-2 border-blue-500/30 rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-600 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  <ShieldCheck size={13} weight="bold" />
                  <span>ATS Pass Guarantee</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-text-main">
                  Select the Executive CV Revamp Package
                </h3>
                <p className="text-xs text-text-muted">
                  Transform your {result.overall_score}/100 score into interview calls with a single-column, ATS-verified document.
                </p>
              </div>

              <div className="text-left sm:text-right flex-shrink-0">
                <span className="text-xs text-text-dim block">One-Time Fee</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-bold text-text-main font-mono">R160</span>
                  <span className="text-xs text-text-dim line-through">R320</span>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    50% Off
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-text-muted">
              <div className="flex items-start gap-2">
                <Check size={15} weight="bold" className="text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Single-column Workday &amp; Greenhouse certified format.</span>
              </div>
              <div className="flex items-start gap-2">
                <Check size={15} weight="bold" className="text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Every bullet converted to quantified XYZ achievements.</span>
              </div>
              <div className="flex items-start gap-2">
                <Check size={15} weight="bold" className="text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Keywords injected into section headers and summaries.</span>
              </div>
              <div className="flex items-start gap-2">
                <Check size={15} weight="bold" className="text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Word (.docx) &amp; PDF (.pdf) instant downloadable files.</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
              {isPaid ? (
                <button
                  type="button"
                  onClick={() => setShowTestProfileModal(true)}
                  className="w-full flex-grow bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold py-2.5 px-5 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <CheckCircle size={15} weight="bold" />
                  <span>View &amp; Download Revamped CV (Unlocked)</span>
                  <ArrowRight size={14} weight="bold" />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setShowTestProfileModal(true)}
                    className="w-full sm:w-auto bg-surface hover:bg-surface-subtle active:scale-[0.98] text-text-main font-medium py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-1.5 border border-border-theme shadow-sm cursor-pointer"
                  >
                    <LockKey size={13} weight="bold" className="text-amber-500" />
                    <span>Preview Format (Locked)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPaywall(true)}
                    className="w-full sm:w-auto flex-grow bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-semibold py-2.5 px-5 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <LockKey size={14} weight="bold" />
                    <span>Unlock Executive CV Revamp (R160)</span>
                    <ArrowRight size={14} weight="bold" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* POST-SCORE PROMPT MODAL (Auto-triggered after score check) */}
      {showPostScorePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative card-surface rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-4 border border-border-theme">
            <button
              onClick={() => setShowPostScorePrompt(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-main p-1 rounded hover:bg-surface-raised transition cursor-pointer"
            >
              <X size={18} weight="bold" />
            </button>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-600 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                <ShieldCheck size={14} weight="bold" />
                <span>ATS Diagnostic Ready</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-text-main">
                Your CV Scored {result.overall_score}/100
              </h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Up to 75% of CVs are rejected by automated applicant tracking filters before human recruiters ever see them. Select our Executive CV Revamp Package to guarantee ATS passage with XYZ metric bullets.
              </p>
            </div>

            <div className="p-3.5 bg-surface-subtle border border-border-theme rounded-xl text-xs space-y-2 text-text-muted">
              <div className="flex items-center gap-2 text-text-main font-medium">
                <CheckCircle size={15} weight="bold" className="text-emerald-500 flex-shrink-0" />
                <span>Single-column ATS format (Workday &amp; Greenhouse pass)</span>
              </div>
              <div className="flex items-center gap-2 text-text-main font-medium">
                <CheckCircle size={15} weight="bold" className="text-emerald-500 flex-shrink-0" />
                <span>Google XYZ quantified achievement bullets</span>
              </div>
              <div className="flex items-center gap-2 text-text-main font-medium">
                <CheckCircle size={15} weight="bold" className="text-emerald-500 flex-shrink-0" />
                <span>Editable Word (.docx) &amp; print PDF downloads</span>
              </div>
            </div>

            <div className="pt-2 space-y-2.5">
              {isPaid ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowPostScorePrompt(false);
                    setShowTestProfileModal(true);
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <CheckCircle size={14} weight="bold" />
                  <span>View Unlocked ATS Rewrite</span>
                  <ArrowRight size={14} weight="bold" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowPostScorePrompt(false);
                    setShowPaywall(true);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <LockKey size={14} weight="bold" />
                  <span>Select CV Revamp Package (R160)</span>
                  <ArrowRight size={14} weight="bold" />
                </button>
              )}

              <div className="flex items-center justify-between text-xs pt-1 px-1">
                <Link
                  href="/insights"
                  onClick={() => setShowPostScorePrompt(false)}
                  className="text-blue-600 hover:text-blue-500 font-medium flex items-center gap-1"
                >
                  <span>View Full Insights Report</span>
                  <ArrowRight size={12} weight="bold" />
                </Link>

                <button
                  type="button"
                  onClick={() => setShowPostScorePrompt(false)}
                  className="text-text-muted hover:text-text-main text-xs transition cursor-pointer"
                >
                  Review Score First
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => {
          setShowPaywall(false);
          setIsPaid(isUserPaid());
        }}
        overallScore={result.overall_score}
        profileId="executive"
        candidateName={result.target_role_detected ? `${result.target_role_detected} Professional` : 'Candidate'}
      />

      <FullRewriteModal
        isOpen={showTestProfileModal}
        onClose={() => setShowTestProfileModal(false)}
        userScore={result.overall_score}
        cvText={cvText}
        targetRole={result.target_role_detected}
        isPaid={isPaid}
        onOpenPaywall={() => {
          setShowTestProfileModal(false);
          setShowPaywall(true);
        }}
      />

      <ShareCardModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        result={result}
      />
    </section>
  );
}