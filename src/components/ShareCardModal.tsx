'use client';

import React, { useState } from 'react';
import { X, Copy, Check, ShareNetwork, WhatsappLogo } from '@phosphor-icons/react';
import { ScoreResult } from '@/types/scoring';

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ScoreResult;
}

export function ShareCardModal({ isOpen, onClose, result }: ShareCardModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareText = `My CV scored ${result.overall_score}/100 on CheckMyCV!
${result.benchmark_text}

Recruiter Diagnosis: "${result.headline}"

Find out why your CV is not landing interviews in 10 seconds:
https://www.checkmycv.co.za`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative glass-card border border-slate-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-100 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShareNetwork size={18} weight="bold" className="text-blue-400" />
            <h3 className="text-base font-bold text-white">
              Share Your Score Card
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Clean Card Preview */}
        <div className="bg-[#111622] border border-slate-750 rounded-lg p-5 space-y-4 text-center">
          <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800 pb-2">
            <span className="font-semibold text-white">CheckMyCV Global</span>
            <span className="text-[11px] font-medium text-slate-300">Verified ATS Audit</span>
          </div>

          <div className="py-2">
            <div className="text-5xl font-bold tracking-tight text-white font-mono">
              {result.overall_score}
              <span className="text-xl text-blue-400 font-sans font-normal">/100</span>
            </div>
            <p className="text-xs text-blue-300 mt-1 font-medium">
              {result.benchmark_text}
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded text-left text-xs text-slate-300 border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 block mb-1">
              Recruiter Diagnosis:
            </span>
            <p className="text-xs leading-relaxed italic text-slate-200">
              &quot;{result.headline}&quot;
            </p>
          </div>

          <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
            <span>Free 10s ATS Diagnosis</span>
            <span className="text-blue-400 font-semibold">checkmycv.co.za</span>
          </div>
        </div>

        {/* Referral message */}
        <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-lg text-xs">
          <p className="text-emerald-300 leading-relaxed">
            <strong>Referral Perk:</strong> Share with another job seeker. When they score their CV, you unlock your full rewrite free.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleWhatsAppShare}
            className="w-full bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.98] text-slate-950 font-bold py-3 px-4 rounded-lg text-xs transition flex items-center justify-center gap-2 shadow-sm"
          >
            <WhatsappLogo size={18} weight="bold" />
            <span>Share to WhatsApp Status</span>
          </button>

          <button
            onClick={handleCopy}
            className="w-full border border-slate-750 hover:border-slate-700 bg-slate-900 active:scale-[0.98] text-slate-200 font-medium py-2.5 px-4 rounded-lg text-xs transition flex items-center justify-center gap-2"
          >
            {copied ? <Check size={16} weight="bold" className="text-emerald-400" /> : <Copy size={16} weight="bold" />}
            <span>{copied ? 'Score Card Copied' : 'Copy Text for Bio or LinkedIn'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
