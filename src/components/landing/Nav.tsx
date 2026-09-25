'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { List, X } from '@phosphor-icons/react';

export function Nav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -70;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-200 border-b ${
        isScrolled
          ? 'bg-white/90 backdrop-blur-md border-[#e6eaf2] shadow-[0_4px_20px_rgba(15,23,42,0.04)]'
          : 'bg-white/80 backdrop-blur-sm border-[#e6eaf2]'
      }`}
    >
      <div className="max-w-[1160px] mx-auto px-6 h-[70px] flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 font-extrabold text-[1.2rem] tracking-[-0.02em] text-[#2563eb]"
        >
          <span className="w-8 h-8 rounded-[9px] grid place-items-center bg-[#2563eb] text-white text-[0.95rem] font-black shadow-sm">
            C
          </span>
          <span>CheckMyCV</span>
        </Link>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center gap-8 text-[0.95rem] text-[#334155] font-medium">
          <button
            type="button"
            onClick={() => scrollTo('features')}
            className="hover:text-[#2563eb] transition-colors cursor-pointer"
          >
            Features
          </button>
          <button
            type="button"
            onClick={() => scrollTo('how')}
            className="hover:text-[#2563eb] transition-colors cursor-pointer"
          >
            How it works
          </button>
          <button
            type="button"
            onClick={() => scrollTo('reviews')}
            className="hover:text-[#2563eb] transition-colors cursor-pointer"
          >
            Reviews
          </button>
          <button
            type="button"
            onClick={() => scrollTo('pricing')}
            className="hover:text-[#2563eb] transition-colors cursor-pointer"
          >
            Pricing
          </button>
          <button
            type="button"
            onClick={() => scrollTo('upload')}
            className="inline-flex items-center justify-center gap-2 px-[26px] py-[11px] rounded-full font-semibold text-[0.95rem] bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-[0_6px_18px_rgba(37,99,235,0.3)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer active:translate-y-0"
          >
            Check my CV
          </button>
        </nav>

        {/* Mobile Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-[#0f172a] hover:text-[#2563eb] transition-colors"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X size={24} weight="bold" /> : <List size={24} weight="bold" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#e6eaf2] px-6 py-5 shadow-lg flex flex-col gap-4 text-[0.95rem] font-medium text-[#334155]">
          <button
            type="button"
            onClick={() => scrollTo('features')}
            className="text-left py-1 hover:text-[#2563eb]"
          >
            Features
          </button>
          <button
            type="button"
            onClick={() => scrollTo('how')}
            className="text-left py-1 hover:text-[#2563eb]"
          >
            How it works
          </button>
          <button
            type="button"
            onClick={() => scrollTo('reviews')}
            className="text-left py-1 hover:text-[#2563eb]"
          >
            Reviews
          </button>
          <button
            type="button"
            onClick={() => scrollTo('pricing')}
            className="text-left py-1 hover:text-[#2563eb]"
          >
            Pricing
          </button>
          <div className="pt-3 border-t border-[#e6eaf2]">
            <button
              type="button"
              onClick={() => scrollTo('upload')}
              className="w-full text-center py-3 rounded-full font-semibold bg-[#2563eb] text-white shadow-sm"
            >
              Check my CV
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
