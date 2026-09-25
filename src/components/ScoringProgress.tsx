'use client';

import React, { useEffect, useState } from 'react';
import { TerminalWindow, CheckCircle, CircleNotch, ShieldCheck, Sparkle } from '@phosphor-icons/react';

const ANALYSIS_STEPS = [
  { label: 'Parsing document structure and header hierarchy', weight: 'Layout' },
  { label: 'Auditing keyword density against global role taxonomy (30% weight)', weight: 'Keywords' },
  { label: 'Scanning for Workday & Greenhouse parsing traps (20% weight)', weight: 'ATS Format' },
  { label: 'Evaluating XYZ quantified metrics vs passive duties (20% weight)', weight: 'Impact' },
  { label: 'Auditing domain relevance and seniority match (20% weight)', weight: 'Relevance' },
  { label: 'Verifying core technical proficiencies overlap (10% weight)', weight: 'Skills' },
  { label: 'Synthesizing global applicant percentile benchmark and coaching plan', weight: 'Diagnosis' },
];

export function ScoringProgress() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < ANALYSIS_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1200);

    return () => clearInterval(timer);
  }, []);

  const progressPercent = Math.min(96, Math.round(((currentStep + 1) / ANALYSIS_STEPS.length) * 100));

  return (
    <div className="max-w-2xl mx-auto my-12 px-4 animate-fadeIn">
      <div className="glass-card rounded-2xl overflow-hidden shadow-2xl relative border border-slate-700/80">
        {/* Subtle Top Radial Highlight */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-24 bg-blue-500/20 blur-2xl pointer-events-none rounded-full" />

        {/* Animated Scanning Radar Sweep */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse" />

        {/* Terminal Header */}
        <div className="bg-slate-900/90 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <TerminalWindow size={16} weight="bold" className="text-blue-400" />
            <span className="text-xs font-semibold text-slate-100">
              CheckMyCV Diagnostics Suite
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs text-blue-300 font-medium">
              Live AI Audit
            </span>
          </div>
        </div>

        {/* Progress Content */}
        <div className="p-6 space-y-6">
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Sparkle size={13} weight="bold" className="text-blue-400" />
                <span>Auditing candidate profile against worldwide ATS criteria...</span>
              </span>
              <span className="text-blue-400 font-bold font-mono">{progressPercent}%</span>
            </div>
            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-sky-400 transition-all duration-700 ease-out shadow-[0_0_12px_rgba(59,130,246,0.5)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-2 text-xs">
            {ANALYSIS_STEPS.map((step, idx) => {
              const isDone = idx < currentStep;
              const isCurrent = idx === currentStep;

              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-2.5 rounded-lg transition-all ${
                    isCurrent
                      ? 'bg-blue-950/40 border border-blue-500/50 text-white font-medium shadow-sm'
                      : isDone
                      ? 'bg-slate-900/40 text-slate-300 border border-slate-800/80 font-normal'
                      : 'text-slate-600 opacity-30 font-normal'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isDone ? (
                      <CheckCircle size={16} weight="fill" className="text-emerald-400 flex-shrink-0" />
                    ) : isCurrent ? (
                      <CircleNotch size={16} weight="bold" className="text-blue-400 animate-spin flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-700 flex-shrink-0" />
                    )}
                    <span>{step.label}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                    {step.weight}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-800/80 pt-3.5 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={15} weight="bold" className="text-blue-400" />
              <span>Zero data retention | 100% private server analysis</span>
            </span>
            <span className="font-mono text-[11px] text-blue-300 bg-blue-950/60 border border-blue-600/30 px-2 py-0.5 rounded">
              Intelligent Algorithm AI
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
