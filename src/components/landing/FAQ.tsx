'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FAQ_ITEMS = [
  {
    question: 'Is it actually free?',
    answer:
      'Scoring, keyword gaps, and fix suggestions are free. The CV revamp is paid — that\'s where we rewrite your CV so it actually gets you interviews. Most people need it.',
  },
  {
    question: 'What file formats do you accept?',
    answer:
      'PDF. That is what most ATS platforms require anyway.',
  },
  {
    question: 'Does my CV get uploaded to a server?',
    answer:
      'No. Everything runs in your browser. Your file never leaves your device.',
  },
  {
    question: 'How is the score calculated?',
    answer:
      'We check keyword coverage, section structure, formatting that parsers can read, and the quality of your bullet points. Each factor is weighted and combined into a 0-100 score.',
  },
];

export function FAQ() {
  const [openIndices, setOpenIndices] = useState<number[]>([]);

  const toggleItem = (idx: number) => {
    setOpenIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <section id="faq" style={{ paddingTop: 0 }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5 }}
        className="sec-head"
      >
        <span className="sec-tag">FAQ</span>
        <h2>Questions before you try it</h2>
      </motion.div>

      <div className="faq">
        {FAQ_ITEMS.map((item, idx) => {
          const isOpen = openIndices.includes(idx);
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.3, delay: idx * 0.06 }}
              className={`qa ${isOpen ? 'open' : ''}`}
            >
              <button
                type="button"
                onClick={() => toggleItem(idx)}
                aria-expanded={isOpen}
              >
                <span>{item.question}</span>
                <span className="chev">▾</span>
              </button>
              <div
                className="ans"
                style={{
                  maxHeight: isOpen ? '160px' : '0',
                }}
              >
                <div>{item.answer}</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
