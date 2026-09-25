'use client';

import React from 'react';
import { CheckCircle, ShieldCheck, ArrowDown } from '@phosphor-icons/react';

interface HeroProps {
  className?: string;
}

export function Hero({ className = '' }: HeroProps) {
  return (
    <section className={`relative px-4 sm:px-6 pt-12 pb-8 max-w-4xl mx-auto w-full text-center space-y-5 ${className}`}>
      {/* Eyebrow Badge */}
      <div className="inline-flex items-center gap-2 bg-surface border border-border-theme px-3 py-1 rounded-full text-text-muted text-xs font-medium shadow-sm">
        <ShieldCheck size={14} weight="bold" className="text-blue-500" />
        <span>Enterprise ATS Diagnostic &amp; Executive Rewriter</span>
      </div>

      {/* Main Headline — High-Contrast, Authoritative Typography */}
      <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-text-main leading-[1.15] max-w-3xl mx-auto">
        Find out why your CV is <span className="text-blue-500">not landing interviews.</span>
      </h1>

      {/* Clear, Human Subtitle */}
      <p className="text-sm sm:text-base text-text-muted max-w-2xl mx-auto leading-relaxed">
        Audit keyword saturation against Workday, Greenhouse, and Taleo filters, calculate true callback odds, and unlock an executive single-column rewrite in under 10 seconds.
      </p>

      {/* Grounded Trust Signals (No glowing neon pills) */}
      <div className="pt-2 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs text-text-muted font-medium">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface border border-border-theme">
          <CheckCircle size={14} weight="bold" className="text-emerald-500" />
          <span>100% Free Diagnostic</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface border border-border-theme">
          <CheckCircle size={14} weight="bold" className="text-blue-500" />
          <span>Single-Column Word &amp; PDF</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface border border-border-theme">
          <CheckCircle size={14} weight="bold" className="text-emerald-500" />
          <span>Zero Data Retention</span>
        </div>
      </div>

      {/* Jump Link */}
      <div className="pt-1">
        <a
          href="#score-card-container"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-main font-medium underline underline-offset-4 decoration-border-theme-strong transition"
        >
          <span>Upload your CV below to begin</span>
          <ArrowDown size={12} weight="bold" />
        </a>
      </div>
    </section>
  );
}