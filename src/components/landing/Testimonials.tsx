'use client';

import React from 'react';
import { motion } from 'framer-motion';

const REVIEWS = [
  {
    stars: '★★★★★',
    quote:
      '“My score went from 61 to 88 in one evening. The keyword gap list alone was worth it — I finally understood why I kept getting auto-rejected.”',
    initials: 'SM',
    name: 'Sara M.',
    role: 'Product Manager',
  },
  {
    stars: '★★★★★',
    quote:
      '“As a career coach I send every client here first. The fixes are concrete, not generic \'improve your CV\' fluff.”',
    initials: 'DK',
    name: 'Daniel K.',
    role: 'Career Coach',
  },
  {
    stars: '★★★★☆',
    quote:
      '“The format check caught a hidden table that was breaking ATS parsers on my old template. Landed two interviews the following week.”',
    initials: 'AR',
    name: 'Aisha R.',
    role: 'Data Analyst',
  },
];

export function Testimonials() {
  return (
    <section id="reviews" style={{ paddingTop: 0 }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5 }}
        className="sec-head"
      >
        <span className="sec-tag">Reviews</span>
        <h2>People who fixed their CV and got interviews</h2>
      </motion.div>

      <div className="grid-3">
        {REVIEWS.map((review, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
            className="quote"
          >
            <div className="stars">{review.stars}</div>
            <p className="text-[#0f172a] text-[0.95rem] leading-relaxed mb-[18px]">
              {review.quote}
            </p>
            <div className="who">
              <span className="avatar">{review.initials}</span>
              <div>
                <b className="text-[#0f172a] text-[0.9rem] block">{review.name}</b>
                <small className="text-[#5b6b83] text-[0.8rem] block">{review.role}</small>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
