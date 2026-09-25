'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function FeatureBlock() {
  return (
    <>
      {/* FEATURES */}
      <section id="features">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5 }}
          className="sec-head"
        >
          <span className="sec-tag">Features</span>
          <h2>Know why you&apos;re not getting interviews</h2>
          <p>
            75% of CVs are auto-rejected before a recruiter sees them. Here&apos;s what we check.
          </p>
        </motion.div>

        <div className="grid-3">
          {/* Card 1: ATS score */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="card"
          >
            <div className="icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2 text-[#0f172a]">ATS score out of 100</h3>
            <p className="text-[#5b6b83] text-[0.93rem] leading-relaxed">
              See your exact score before you apply. 70+ passes most ATS filters.
            </p>
          </motion.div>

          {/* Card 2: Keyword gaps */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="card"
          >
            <div className="icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2 text-[#0f172a]">Missing keywords, listed</h3>
            <p className="text-[#5b6b83] text-[0.93rem] leading-relaxed">
              We show you the exact terms the job expects that your CV doesn&apos;t have.
            </p>
          </motion.div>

          {/* Card 3: Line-level fixes */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="card"
          >
            <div className="icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2 text-[#0f172a]">Line-level fixes, not generic tips</h3>
            <p className="text-[#5b6b83] text-[0.93rem] leading-relaxed">
              Each suggestion targets a specific bullet. Apply it in under a minute.
            </p>
          </motion.div>

          {/* Card 4: Format check */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="card"
          >
            <div className="icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16v16H4z" />
                <path d="M4 9h16M9 9v11" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2 text-[#0f172a]">Format errors that kill your chances</h3>
            <p className="text-[#5b6b83] text-[0.93rem] leading-relaxed">
              Tables, columns, and graphics confuse parsers. We flag them before they cost you an interview.
            </p>
          </motion.div>

          {/* Card 5: Impact bullets */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="card"
          >
            <div className="icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2 text-[#0f172a]">Turn duties into results recruiters want</h3>
            <p className="text-[#5b6b83] text-[0.93rem] leading-relaxed">
              We show you how to rewrite weak bullet points with numbers and outcomes.
            </p>
          </motion.div>

          {/* Card 6: Privacy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="card"
          >
            <div className="icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2 text-[#0f172a]">Your CV never leaves your device</h3>
            <p className="text-[#5b6b83] text-[0.93rem] leading-relaxed">
              Analysis runs in your browser. Nothing is uploaded or stored.
            </p>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ paddingTop: 0 }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5 }}
          className="sec-head"
        >
          <span className="sec-tag">How it works</span>
          <h2>Ready in under a minute</h2>
        </motion.div>

        <div className="steps">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="step"
          >
            <span className="step-number">01</span>
            <h3 className="font-bold text-lg mb-2 text-[#0f172a]">Upload your CV</h3>
            <p className="text-[#5b6b83] text-[0.92rem]">
              PDF or paste your text. No account. No email.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="step"
          >
            <span className="step-number">02</span>
            <h3 className="font-bold text-lg mb-2 text-[#0f172a]">Get your score in 10 seconds</h3>
            <p className="text-[#5b6b83] text-[0.92rem]">
              Keywords, structure, and impact graded against real ATS criteria.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="step"
          >
            <span className="step-number">03</span>
            <h3 className="font-bold text-lg mb-2 text-[#0f172a]">Fix it and re-score for free</h3>
            <p className="text-[#5b6b83] text-[0.92rem]">
              Apply the fixes, re-upload, and watch your score climb.
            </p>
          </motion.div>
        </div>
      </section>
    </>
  );
}
