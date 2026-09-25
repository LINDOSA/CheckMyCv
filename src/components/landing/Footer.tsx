'use client';

import React from 'react';
import Link from 'next/link';

export function Footer() {
  const scrollTo = (id: string, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer>
      <div className="wrap foot">
        <Link
          href="/"
          className="logo"
          style={{ fontSize: '1rem' }}
        >
          <span
            className="logo-mark"
            style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}
          >
            C
          </span>
          <span>CheckMyCV</span>
        </Link>

        <div className="foot-links">
          <a
            href="#features"
            onClick={(e) => scrollTo('features', e)}
          >
            Features
          </a>
          <a
            href="#faq"
            onClick={(e) => scrollTo('faq', e)}
          >
            FAQ
          </a>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/refund-policy">Refund Policy</Link>
        </div>

        <span>© 2026 CheckMyCV. All rights reserved.</span>
      </div>
    </footer>
  );
}
