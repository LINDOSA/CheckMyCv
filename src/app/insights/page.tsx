'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Sparkle,
  LockKey,
  ShieldCheck,
  MagnifyingGlass,
  CheckCircle,
  WarningCircle,
  Check,
  Plus,
  Eye,
  Lightning,
  FileText,
  TrendUp,
} from '@phosphor-icons/react';
import { ScoreResult } from '@/types/scoring';
import { PaywallModal } from '@/components/PaywallModal';
import { FullRewriteModal } from '@/components/FullRewriteModal';
import { LiveRewritePreview } from '@/components/LiveRewritePreview';
import { Header } from '@/components/Header';
import { BackgroundMotion } from '@/components/BackgroundMotion';
import { isUserPaid } from '@/lib/paymentAccess';

// High-fidelity fallback diagnostic data when visiting /insights directly
const DEFAULT_INSIGHTS_RESULT: ScoreResult = {
  overall_score: 58,
  benchmark_percentile: 42,
  benchmark_text: 'Better than 42% of applicants in your field',
  headline: 'Solid foundational background, but bullet points lack quantitative impact and ATS keyword saturation.',
  is_general_health: true,
  target_role_detected: 'Experienced Professional',
  categories: [
    { name: 'Formatting & ATS Parseability', key: 'ats', score: 62, weight: 25, status: 'warning', detail: 'Multi-column layout risk; date headers require standardized month/year formatting.' },
    { name: 'Keyword & Competency Match', key: 'keyword', score: 54, weight: 30, status: 'warning', detail: 'Foundational terms identified, but high-value industry certifications and tools are missing.' },
    { name: 'Impact & XYZ Accomplishments', key: 'achievement', score: 48, weight: 25, status: 'critical', detail: 'Bullets describe daily tasks rather than measurable outcomes and business results.' },
    { name: 'Relevance to Market Standards', key: 'relevance', score: 70, weight: 10, status: 'good', detail: 'CV length is acceptable, but dense paragraphs reduce recruiter skim speed.' },
    { name: 'Core Skill Verification', key: 'skills', score: 68, weight: 10, status: 'good', detail: 'Tone is professional, though over-reliant on passive voice and generic buzzwords.' },
  ],
  top_issues: [
    {
      category_key: 'achievement',
      issue: 'Job Duties Listed Instead of Quantified Accomplishments (XYZ Formula Missing)',
      detail: 'Recruiters spend an average of 6 seconds reviewing a CV. When bullets start with "Responsible for" or "Handled", reviewers assume you merely occupied a seat rather than drove business results. Corporate ATS filters rank resumes by impact verbs and numeric metrics.',
      fix: 'Rewrite each bullet using Google’s XYZ formula: "Accomplished [X], as measured by [Y], by doing [Z]". Replace passive duty statements with verified volume, time-saved, or financial figures.',
    },
    {
      category_key: 'keyword',
      issue: 'Key Industry & ATS Keywords Buried in Body Paragraphs',
      detail: 'Enterprise applicant tracking systems (Workday, Taleo, Greenhouse) compute match scores by parsing keyword density in section headers and recent experience. If core competencies are scattered in long paragraphs, the scanner scores your profile as a low match.',
      fix: 'Create a dedicated "Core Competencies & Technical Skills" section at the top of Page 1. Align exact keyword terminology with target job specifications.',
    },
    {
      category_key: 'ats',
      issue: 'Unquantified Scope of Responsibility and Ambiguous Employment Dates',
      detail: 'Omission of team sizes, project scopes, user bases, or clear month/year timelines causes automated parsers to miscalculate years of relevant experience, frequently triggering automated rejection filters.',
      fix: 'Standardize all employment dates to "Month Year – Month Year" (e.g., "Jan 2022 – Present") and attach scope metrics to every role (e.g., "Supported 350+ corporate users across 4 branch offices").',
    },
  ],
  quick_wins: [
    'Convert routine duties into XYZ quantified achievements',
    'Inject enterprise cloud keywords into experience headers',
    'Standardize employment date formats to Month Year',
  ],
  strengths: [
    'Technical Troubleshooting',
    'Incident Management',
    'Active Directory',
    'Customer Escalations',
    'SLA Adherence',
    'Hardware Diagnostics',
    'System Configuration',
    'Cross-Functional Collaboration',
  ],
};

export default function InsightsPage() {
  const [result, setResult] = useState<ScoreResult>(DEFAULT_INSIGHTS_RESULT);
  const [cvText, setCvText] = useState<string>('');
  const [showPaywall, setShowPaywall] = useState(false);
  const [showFullRewrite, setShowFullRewrite] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  // Load user score result, CV text, and payment status from sessionStorage
  useEffect(() => {
    setIsPaid(isUserPaid());

    const handleStorage = () => {
      setIsPaid(isUserPaid());
    };
    window.addEventListener('storage', handleStorage);

    try {
      const storedResult = sessionStorage.getItem('ratemycv_latest_result');
      const storedCv = sessionStorage.getItem('ratemycv_cv_text');
      if (storedResult) {
        const parsed = JSON.parse(storedResult);
        if (parsed && typeof parsed.overall_score === 'number') {
          setResult(parsed);
        }
      }
      if (storedCv) {
        setCvText(storedCv);
      }
    } catch (e) {
      console.error('Error reading saved session score:', e);
    }

    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const getScoreBadge = (score: number) => {
    if (score >= 75) {
      return {
        text: 'text-emerald-500',
        badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        label: 'Strong Contender',
      };
    }
    if (score >= 55) {
      return {
        text: 'text-amber-500',
        badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        label: 'Needs Metric Polish',
      };
    }
    return {
      text: 'text-rose-500',
      badge: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
      label: 'High Rejection Risk',
    };
  };

  const badge = getScoreBadge(result.overall_score);

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-background text-text-main">
      <BackgroundMotion />
      <Header />

      <main className="flex-grow py-8 px-4 sm:px-6 max-w-4xl mx-auto w-full space-y-8">
        {/* Navigation Breadcrumb & Back Link */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-theme pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-text-muted hover:text-text-main transition group"
          >
            <ArrowLeft size={16} weight="bold" className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to Score Dashboard</span>
          </Link>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setShowFullRewrite(true)}
              className="bg-surface hover:bg-surface-subtle text-text-main text-xs font-medium px-3.5 py-1.5 rounded-lg border border-border-theme transition flex items-center gap-1.5"
            >
              <Sparkle size={13} weight="bold" className="text-blue-500" />
              <span>Preview ATS Rewrite</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPaywall(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-sm"
            >
              <LockKey size={13} weight="bold" />
              <span>CV Revamp Package (R160)</span>
            </button>
          </div>
        </div>

        {/* Page Hero Header */}
        <div className="card-surface rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-raised border border-border-theme text-xs font-medium text-text-muted">
              <MagnifyingGlass size={14} weight="bold" className="text-blue-500" />
              <span>Comprehensive Recruiter Diagnostic</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted font-medium">ATS Score:</span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${badge.badge}`}>
                {result.overall_score}/100 • {badge.label}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-text-main tracking-tight">
              Recruiter Insights &amp; Keyword Gap Analysis
            </h1>
            <p className="text-sm text-text-muted max-w-2xl leading-relaxed">
              Detailed breakdown of why your CV is being filtered by enterprise ATS systems (Workday, Taleo, Greenhouse) and actionable recruiter fixes to guarantee interview calls.
            </p>
          </div>

          {result.target_role_detected && (
            <div className="pt-2 border-t border-border-theme flex items-center gap-2 text-xs text-text-dim">
              <span>Target Role Analyzed:</span>
              <span className="font-semibold text-text-main bg-surface-raised border border-border-theme px-2.5 py-0.5 rounded">
                {result.target_role_detected}
              </span>
            </div>
          )}
        </div>

        {/* SECTION 1: Top 3 Things Holding Back Your Interviews */}
        <section className="card-surface rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-rose-500 text-xs font-semibold uppercase tracking-wider">
              <WarningCircle size={14} weight="bold" />
              <span>Critical ATS &amp; Recruiter Audit</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-text-main">
              Top 3 Things Holding Back Your Interviews
            </h2>
            <p className="text-xs text-text-muted">
              Identified from 6-second recruiter scanning models and enterprise ATS parsing algorithms.
            </p>
          </div>

          <div className="space-y-4">
            {result.top_issues.map((issue, idx) => (
              <div
                key={idx}
                className="p-5 bg-surface-subtle border border-border-theme rounded-xl space-y-3.5"
              >
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-500 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5 border border-rose-500/20">
                    {idx + 1}
                  </span>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-text-main text-sm sm:text-base">
                      {issue.issue}
                    </h3>
                  </div>
                </div>

                {/* Why Recruiters Reject This */}
                <div className="p-3.5 bg-surface-raised border border-rose-500/20 rounded-lg text-xs space-y-1">
                  <span className="text-rose-500 font-bold flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                    <WarningCircle size={13} weight="bold" />
                    <span>Why Recruiters Reject This:</span>
                  </span>
                  <p className="text-text-muted leading-relaxed font-normal">
                    {issue.detail}
                  </p>
                </div>

                {/* How to Fix This */}
                <div className="p-3.5 bg-surface-raised border border-blue-500/20 rounded-lg text-xs space-y-1">
                  <span className="text-blue-500 font-bold flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                    <CheckCircle size={13} weight="bold" />
                    <span>How to Fix This:</span>
                  </span>
                  <p className="text-text-main leading-relaxed font-normal">
                    {issue.fix}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 2: Keyword Gap Analysis */}
        <section className="card-surface rounded-2xl p-6 sm:p-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 text-blue-500 text-xs font-semibold uppercase tracking-wider mb-1">
                <MagnifyingGlass size={14} weight="bold" />
                <span>Applicant Tracking System Index</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-text-main">
                Keyword Gap Analysis
              </h2>
            </div>
            <span className="text-xs text-text-dim">
              Calibrated against modern ATS filter standards
            </span>
          </div>

          <p className="text-xs text-text-muted leading-relaxed">
            Applicant Tracking Systems match resume text directly against job requisitions. Below are the verified core keywords found in your CV versus high-priority missing terms needed to pass automated screening:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Found Keywords */}
            <div className="p-4 bg-surface-subtle border border-emerald-500/20 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 uppercase tracking-wider">
                  <CheckCircle size={15} weight="bold" />
                  <span>Found in Your CV</span>
                </div>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded border border-emerald-500/20">
                  Verified
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {(result.strengths && result.strengths.length > 0
                  ? result.strengths
                  : ['Technical Troubleshooting', 'Active Directory', 'Incident Management', 'SLA Adherence', 'System Configuration']
                ).map((kw, i) => (
                  <span
                    key={i}
                    className="text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2.5 py-1 rounded-md flex items-center gap-1.5"
                  >
                    <Check size={12} weight="bold" />
                    <span>{kw}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Missing Keywords */}
            <div className="p-4 bg-surface-subtle border border-rose-500/20 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-500 uppercase tracking-wider">
                  <WarningCircle size={15} weight="bold" />
                  <span>Missing High-Impact Keywords</span>
                </div>
                <span className="text-[10px] font-mono bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded border border-rose-500/20">
                  Add to CV
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {(result.top_issues && result.top_issues.length > 0
                  ? result.top_issues.map((t) => t.issue.replace(/^(Missing|Lack of|Weak)\s+/i, ''))
                  : [
                      'Quantified Accomplishment Metrics (XYZ Formula)',
                      'Enterprise Cloud Infrastructure (AWS / Azure)',
                      'Automated Scripting & Tooling',
                      'SLA Resolution Percentages',
                    ]
                ).map((kw, i) => (
                  <span
                    key={i}
                    className="text-xs font-medium bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2.5 py-1 rounded-md flex items-center gap-1.5"
                  >
                    <Plus size={12} weight="bold" />
                    <span>{kw}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: The Recruiter's Eye (Before vs After) */}
        <section className="card-surface rounded-2xl p-6 sm:p-8 space-y-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-blue-500 text-xs font-semibold uppercase tracking-wider">
              <Eye size={14} weight="bold" />
              <span>The 6-Second Recruiter Scan</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-text-main">
              The Recruiter&apos;s Eye
            </h2>
            <p className="text-xs text-text-muted">
              Recruiters scan CVs rapidly looking for business impact, scope, and numbers. Here is how they evaluate a passive job duty versus an interview-winning accomplishment:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* What Gets Skipped */}
            <div className="p-5 bg-surface-subtle border border-rose-500/20 rounded-xl space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
                <WarningCircle size={14} weight="bold" />
                <span>What Gets Skipped (Passive Duty)</span>
              </div>

              <p className="text-text-muted leading-relaxed italic text-xs sm:text-sm bg-surface-raised p-3 rounded-lg border border-border-theme">
                &quot;Responsible for providing technical support to retail stores and handling customer refund queries on the mobile app.&quot;
              </p>

              <div className="text-xs text-rose-500 space-y-1">
                <strong>Why this gets rejected:</strong>
                <p className="text-text-muted leading-relaxed font-normal">
                  Sounds like a cut-and-paste job description. Gives zero evidence of work volume, speed, reliability, or business value.
                </p>
              </div>
            </div>

            {/* What Gets Shortlisted */}
            <div className="p-5 bg-surface-subtle border border-emerald-500/20 rounded-xl space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                <CheckCircle size={14} weight="bold" />
                <span>What Gets Shortlisted (High-Impact Proof)</span>
              </div>

              <p className="text-text-main leading-relaxed font-normal text-xs sm:text-sm bg-surface-raised p-3 rounded-lg border border-emerald-500/20">
                &quot;Led Level 1 &amp; 2 retail support across <strong className="text-text-main">120+ supermarket branches</strong>, resolving <strong className="text-text-main">150+ tickets weekly</strong> within strict SLA and maintaining a <strong className="text-text-main">98.4% customer satisfaction rate</strong>.&quot;
              </p>

              <div className="text-xs text-emerald-600 space-y-1">
                <strong>Why recruiters shortlist this:</strong>
                <p className="text-text-muted leading-relaxed font-normal">
                  Clear action verb (Led), verifiable business scope (120+ branches), quantifiable output (150+ tickets), and proven quality metric (98.4% CSAT).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: Interactive Rewrite Demonstration */}
        <section className="card-surface rounded-2xl p-6 sm:p-8 space-y-5">
          <LiveRewritePreview
            targetRole={result.target_role_detected}
            onOpenPaywall={() => setShowPaywall(true)}
          />
        </section>

        {/* SECTION 5: CV Revamp Package Promotion Card */}
        <section className="card-surface rounded-2xl p-6 sm:p-8 border-2 border-blue-500/30 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-600 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                <ShieldCheck size={14} weight="bold" />
                <span>Turn Diagnostic Gaps Into Interview Calls</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-text-main">
                Select the Executive CV Revamp Package
              </h2>
              <p className="text-xs sm:text-sm text-text-muted max-w-xl leading-relaxed">
                Stop losing job applications to automated filters. We transform your existing experience into a single-column, ATS-guaranteed resume in both Word (.docx) and PDF formats.
              </p>
            </div>

            <div className="text-left sm:text-right flex-shrink-0">
              <span className="text-xs text-text-dim block">One-Time Fee</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-text-main font-mono">R160</span>
                <span className="text-xs text-text-dim line-through">R320</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                50% Off Launch Special
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-text-muted">
            <div className="flex items-start gap-2.5 p-3 bg-surface-subtle border border-border-theme rounded-xl">
              <Check size={16} weight="bold" className="text-emerald-500 flex-shrink-0 mt-0.5" />
              <span><strong>Single-Column ATS Layout:</strong> 100% parseable by Workday, Greenhouse, Taleo &amp; Lever.</span>
            </div>
            <div className="flex items-start gap-2.5 p-3 bg-surface-subtle border border-border-theme rounded-xl">
              <Check size={16} weight="bold" className="text-emerald-500 flex-shrink-0 mt-0.5" />
              <span><strong>Google XYZ Formula:</strong> Every bullet rewritten into measurable achievement statements.</span>
            </div>
            <div className="flex items-start gap-2.5 p-3 bg-surface-subtle border border-border-theme rounded-xl">
              <Check size={16} weight="bold" className="text-emerald-500 flex-shrink-0 mt-0.5" />
              <span><strong>Keyword Saturation:</strong> Hardcoded industry keywords injected for maximum match rank.</span>
            </div>
            <div className="flex items-start gap-2.5 p-3 bg-surface-subtle border border-border-theme rounded-xl">
              <Check size={16} weight="bold" className="text-emerald-500 flex-shrink-0 mt-0.5" />
              <span><strong>Word &amp; PDF Downloads:</strong> Fully editable Word (.docx) and high-res PDF delivered instantly.</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border-theme">
            <Link
              href="/"
              className="text-xs text-text-muted hover:text-text-main flex items-center gap-1.5 transition font-medium"
            >
              <ArrowLeft size={14} weight="bold" />
              <span>Back to Score Dashboard</span>
            </Link>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {isPaid ? (
                <button
                  type="button"
                  onClick={() => setShowFullRewrite(true)}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold py-2.5 px-6 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <CheckCircle size={15} weight="bold" />
                  <span>View &amp; Download Document (Unlocked)</span>
                  <ArrowRight size={14} weight="bold" />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setShowFullRewrite(true)}
                    className="w-full sm:w-auto bg-surface hover:bg-surface-subtle active:scale-[0.98] text-text-main font-medium py-2.5 px-4 rounded-xl text-xs transition border border-border-theme flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <LockKey size={13} weight="bold" className="text-amber-500" />
                    <span>Preview Format (Locked)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPaywall(true)}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-semibold py-2.5 px-6 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <LockKey size={14} weight="bold" />
                    <span>Select CV Revamp Package (R160)</span>
                    <ArrowRight size={14} weight="bold" />
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

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
        isOpen={showFullRewrite}
        onClose={() => setShowFullRewrite(false)}
        userScore={result.overall_score}
        cvText={cvText}
        targetRole={result.target_role_detected}
        isPaid={isPaid}
        onOpenPaywall={() => {
          setShowFullRewrite(false);
          setShowPaywall(true);
        }}
      />
    </div>
  );
}
