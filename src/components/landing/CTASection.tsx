'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CTASectionProps {
  onScrollToUpload?: () => void;
}

export function CTASection({ onScrollToUpload }: CTASectionProps) {
  const handleClick = (e?: React.MouseEvent) => {
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
    <section id="pricing" style={{ paddingTop: 0 }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5 }}
        className="cta-band"
      >
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
          Find out why your CV isn&apos;t getting shortlisted
        </h2>
        <p className="text-white/85 my-3 text-base sm:text-lg">
          Score your CV free. Then let us rewrite it so you actually get interviews.
        </p>
        <div className="mt-6">
          <a
            href="#upload"
            onClick={handleClick}
            className="btn btn-white btn-lg inline-flex"
          >
            Get my score now
          </a>
        </div>
      </motion.div>
    </section>
  );
}
