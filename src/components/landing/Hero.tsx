'use client';

import React from 'react';
import { CvMockCard } from './CvMockCard';

interface HeroProps {
  onScrollToUpload?: () => void;
}

export function Hero({ onScrollToUpload }: HeroProps) {
  const handleUploadClick = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (onScrollToUpload) {
      onScrollToUpload();
    } else {
      const el = document.getElementById('upload');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section className="hero">
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <span className="pill">✦ Free — no account needed</span>
          <h1>
            Your CV is getting <span className="blue">rejected by software</span> before a human reads it
          </h1>
          <p>
            Upload your CV and get a score in 10 seconds. See exactly which keywords are missing, what&apos;s breaking the parser, and how to fix it.
          </p>
          <div className="hero-cta">
            <a
              href="#upload"
              onClick={handleUploadClick}
              className="btn btn-primary btn-lg"
            >
              Check my CV free <span>→</span>
            </a>
            <span className="free-note">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" />
              </svg>{' '}
              Free to score. Revamp to get hired.
            </span>
          </div>
          <div className="social">
            <div className="avatars">
              <span className="av-1">JM</span>
              <span className="av-2">KT</span>
              <span className="av-3">AR</span>
              <span className="av-4">SL</span>
            </div>
            <div className="social-txt">
              <span className="stars">★★★★★</span>
              <br />
              <b>10,000+</b> CVs scored
            </div>
          </div>
        </div>

        {/* floating CV previews */}
        <div className="cv-stage">
          <CvMockCard variant="main" />
          <CvMockCard variant="alt" />
          <div
            className="scroll-hint cursor-pointer"
            onClick={handleUploadClick}
            role="button"
            tabIndex={0}
          >
            Try it free <span className="chev">▾</span>
          </div>
        </div>
      </div>
    </section>
  );
}
