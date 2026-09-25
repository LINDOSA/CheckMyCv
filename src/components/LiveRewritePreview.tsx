'use client';

import React, { useState } from 'react';
import {
  Sparkle,
  Check,
  CircleNotch,
  Copy,
  Lightning,
  ShieldCheck,
} from '@phosphor-icons/react';

interface LiveRewritePreviewProps {
  targetRole?: string;
  onOpenPaywall?: () => void;
}

export function LiveRewritePreview({ targetRole }: LiveRewritePreviewProps) {
  const [selectedBulletIndex, setSelectedBulletIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Realistic sample transformations
  const SAMPLE_TRANSFORMATIONS = [
    {
      role: 'IT & Cloud Operations',
      original: 'Responsible for providing tier-1 and tier-2 technical support for 350+ remote and hybrid corporate users.',
      rewritten:
        'Spearheaded Tier-1 and Tier-2 enterprise support for 350+ distributed users across 4 time zones, maintaining a 98.4% first-contact SLA resolution and decreasing average ticket cycle time by 32%.',
      formula: 'Action Verb (Spearheaded) + Distributed Scope (350+ Users) + Quantified Outcome (98.4% SLA, -32% Time)',
      keywords: ['SLA Resolution', 'Enterprise Support', 'Ticketing Optimization', 'Cross-Functional Delivery'],
      atsVerdict: 'Workday & Greenhouse: 96% Match',
    },
    {
      role: 'Software Engineering',
      original: 'Built payment microservices and handled database queries for our customer dashboard.',
      rewritten:
        'Architected high-throughput payment reconciliation microservices in TypeScript and Node.js processing $12M+ monthly volume, optimizing PostgreSQL indexing to cut p99 latency from 850ms to 120ms.',
      formula: 'Action Verb (Architected) + Volume Scale ($12M+ Volume) + Performance Metric (p99 latency -86%)',
      keywords: ['High Throughput', 'PostgreSQL Optimization', 'Microservices Architecture', 'PCI-DSS'],
      atsVerdict: 'Lever & Ashby: 98% Match',
    },
    {
      role: 'Product Management',
      original: 'Helped redesign the onboarding process and worked with engineers to launch new features.',
      rewritten:
        'Orchestrated cross-functional squad of 9 across product, design, and engineering to revamp self-serve onboarding, driving a 28% increase in trial-to-paid conversions and generating $3.4M in incremental ARR.',
      formula: 'Action Verb (Orchestrated) + Team Leadership (Squad of 9) + Financial Impact (+28% Conversion, +$3.4M ARR)',
      keywords: ['Product-Led Growth', 'Conversion Optimization', 'ARR Expansion', 'Agile Leadership'],
      atsVerdict: 'Taleo & Workday: 95% Match',
    },
  ];

  const current = SAMPLE_TRANSFORMATIONS[selectedBulletIndex];

  const [customOriginal, setCustomOriginal] = useState('');
  const [customResult, setCustomResult] = useState<{
    original: string;
    rewritten: string;
    formula: string;
    improvements: string[];
    keywords_added: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLiveAIGenerate = async () => {
    const textToRewrite = customOriginal.trim() || current.original;
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bulletText: textToRewrite,
          targetRole: targetRole || current.role,
          issueContext: 'Duty-heavy CV bullet point needing XYZ quantified achievement formula',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate live rewrite.');
      }

      setCustomResult(data.result);
    } catch (err: any) {
      setError(err?.message || 'Error communicating with rewriting engine.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeRewritten = customResult ? customResult.rewritten : current.rewritten;
  const activeFormula = customResult ? customResult.formula : current.formula;
  const activeKeywords = customResult ? customResult.keywords_added : current.keywords;

  return (
    <div className="border-t border-border-theme pt-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="inline-flex items-center gap-1.5 text-blue-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <Lightning size={14} weight="fill" />
            <span>Interactive Rewrite Demonstration</span>
          </div>
          <h3 className="text-sm sm:text-base font-semibold text-text-main">
            How Routine Duties Transform Into Metric-Driven Statements
          </h3>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center bg-surface-raised border border-border-theme p-0.5 rounded-lg self-start sm:self-auto text-xs">
          {SAMPLE_TRANSFORMATIONS.map((t, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setSelectedBulletIndex(idx);
                setCustomResult(null);
                setCustomOriginal('');
              }}
              className={`px-2.5 py-1 rounded-md transition text-xs font-medium ${
                selectedBulletIndex === idx && !customResult
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              {t.role.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* BEFORE CARD */}
        <div className="p-4 bg-surface-subtle border border-rose-500/20 rounded-xl space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-rose-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
              Before: Passive Job Duty
            </span>
            <span className="text-[10px] font-mono text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded">
              High Rejection Risk
            </span>
          </div>

          <p className="text-text-muted leading-relaxed italic">
            &quot;{customResult ? customResult.original : current.original}&quot;
          </p>

          <div className="text-[11px] text-text-dim border-t border-border-theme pt-2 space-y-0.5">
            <span className="text-rose-500 font-medium">Recruiter Perspective:</span>
            <p className="leading-normal">
              Lists daily duties without answering: <em>How many? What measurable outcome did you achieve?</em>
            </p>
          </div>
        </div>

        {/* AFTER CARD */}
        <div className="p-4 bg-surface-subtle border border-emerald-500/20 rounded-xl space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-emerald-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              After: XYZ Quantified Achievement
            </span>
            <span className="text-[10px] font-mono text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1">
              <ShieldCheck size={12} weight="bold" />
              <span>{current.atsVerdict}</span>
            </span>
          </div>

          <p className="text-text-main font-medium leading-relaxed">
            &quot;{activeRewritten}&quot;
          </p>

          <div className="text-[11px] bg-surface-raised border border-border-theme p-2.5 rounded-lg text-text-muted space-y-0.5">
            <div className="text-blue-500 font-semibold flex items-center gap-1 text-[11px]">
              <Sparkle size={12} weight="bold" />
              <span>XYZ Formula Applied:</span>
            </div>
            <p className="leading-snug">{activeFormula}</p>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs">
            <div className="flex flex-wrap gap-1">
              {activeKeywords.map((kw, i) => (
                <span
                  key={i}
                  className="text-[10px] bg-blue-500/10 text-blue-600 border border-blue-500/20 px-1.5 py-0.5 rounded font-mono"
                >
                  +{kw}
                </span>
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleCopy(activeRewritten)}
              className="text-xs text-text-muted hover:text-text-main flex items-center gap-1 bg-surface-raised border border-border-theme px-2.5 py-1 rounded-md transition font-medium ml-2 flex-shrink-0"
            >
              {copied ? (
                <>
                  <Check size={13} weight="bold" className="text-emerald-500" />
                  <span className="text-emerald-500">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={13} weight="bold" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Trigger Bar */}
      <div className="p-3 bg-surface-raised border border-border-theme rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-text-muted">
          <ShieldCheck size={15} weight="bold" className="text-blue-500 flex-shrink-0" />
          <span>Calibrated to Fortune 500 executive resume standards.</span>
        </div>

        <button
          type="button"
          onClick={handleLiveAIGenerate}
          disabled={isGenerating}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-medium py-1.5 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <CircleNotch size={14} weight="bold" className="animate-spin" />
              <span>Rewriting...</span>
            </>
          ) : (
            <>
              <Lightning size={14} weight="fill" />
              <span>Run Sample Rewrite</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <p className="text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg">
          {error}
        </p>
      )}
    </div>
  );
}
