'use client';

import React from 'react';

export function BackgroundMotion() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none select-none">
      {/* Crisp Architectural Micro-Grid (Whisper quiet, adapts cleanly to dark and cream) */}
      <div
        className="absolute inset-0 opacity-[0.07] [data-theme='cream']:opacity-[0.03]"
        style={{
          backgroundImage:
            'radial-gradient(currentColor 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
    </div>
  );
}