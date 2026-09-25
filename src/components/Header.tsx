'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Lightning, Moon, Sun, Question } from '@phosphor-icons/react';
import { InfoModalTab } from './InfoModal';

interface HeaderProps {
  onReset?: () => void;
  onOpenInfo?: (tab: InfoModalTab) => void;
}

export function Header({ onReset, onOpenInfo }: HeaderProps) {
  const [theme, setTheme] = useState<'dark' | 'cream'>('cream');

  useEffect(() => {
    const saved = (localStorage.getItem('scoremycv_theme') as 'dark' | 'cream') || 'cream';
    setTheme(saved);
    applyReactTheme(saved);
  }, []);

  const applyReactTheme = (newTheme: 'dark' | 'cream') => {
    if (newTheme === 'cream') {
      document.documentElement.setAttribute('data-theme', 'cream');
      document.documentElement.classList.add('theme-cream');
      document.body.classList.add('theme-cream');
      localStorage.setItem('scoremycv_theme', 'cream');
    } else {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.classList.remove('theme-cream');
      document.body.classList.remove('theme-cream');
      localStorage.setItem('scoremycv_theme', 'dark');
    }
  };

  const handleToggleTheme = (newTheme: 'dark' | 'cream') => {
    setTheme(newTheme);
    applyReactTheme(newTheme);
  };

  return (
    <header className="border-b border-border-theme bg-surface/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 h-14 sm:h-16 flex items-center shadow-sm transition-colors duration-200">
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between gap-2">
        {/* Brand */}
        <div
          onClick={onReset}
          className="flex items-center gap-2.5 cursor-pointer group select-none flex-shrink-0"
        >
          <Image
            src="/logo.svg"
            alt="CheckMyCV Global ATS Logo"
            width={26}
            height={26}
            className="rounded-lg shadow-sm"
          />
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base sm:text-lg tracking-tight text-text-main">
              CheckMy<span className="text-blue-500">CV</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] font-medium text-text-muted bg-surface-raised border border-border-theme px-2 py-0.5 rounded-full">
              Global ATS
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onOpenInfo && (
            <button
              type="button"
              onClick={() => onOpenInfo('faq')}
              className="hidden sm:flex items-center gap-1.5 text-xs text-text-muted hover:text-text-main px-2.5 py-1.5 rounded-lg hover:bg-surface-raised transition font-medium"
            >
              <Question size={14} weight="bold" className="text-blue-500" />
              <span>How It Works</span>
            </button>
          )}

          {/* Theme Toggle */}
          <div className="flex items-center bg-surface-raised border border-border-theme p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => handleToggleTheme('dark')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition font-medium ${
                theme === 'dark'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-text-muted hover:text-text-main'
              }`}
              title="Cyber Dark Mode"
            >
              <Moon size={13} weight="fill" />
              <span className="hidden sm:inline text-[11px]">Dark</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleTheme('cream')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition font-medium ${
                theme === 'cream'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-text-muted hover:text-text-main'
              }`}
              title="Warm Cream Paper Theme"
            >
              <Sun size={13} weight="bold" />
              <span className="hidden sm:inline text-[11px]">Cream</span>
            </button>
          </div>

          {/* Fast Scroll Button */}
          <button
            onClick={() => {
              const el = document.getElementById('score-card-container');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-semibold text-xs px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg transition shadow-sm flex items-center gap-1.5 whitespace-nowrap"
          >
            <Lightning size={13} weight="fill" />
            <span>Check My CV</span>
          </button>
        </div>
      </div>
    </header>
  );
}