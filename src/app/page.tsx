'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Nav } from '@/components/landing/Nav';
import { Hero } from '@/components/landing/Hero';
import { FeatureBlock } from '@/components/landing/FeatureBlock';

// Heavy below-the-fold components loaded lazily so they don't block initial render
const TrialUploadWidget = dynamic(
  () => import('@/components/landing/TrialUploadWidget').then((m) => ({ default: m.TrialUploadWidget })),
  { ssr: false }
);
const Testimonials = dynamic(
  () => import('@/components/landing/Testimonials').then((m) => ({ default: m.Testimonials }))
);
const FAQ = dynamic(
  () => import('@/components/landing/FAQ').then((m) => ({ default: m.FAQ }))
);
const CTASection = dynamic(
  () => import('@/components/landing/CTASection').then((m) => ({ default: m.CTASection }))
);
const Footer = dynamic(
  () => import('@/components/landing/Footer').then((m) => ({ default: m.Footer }))
);

export default function HomePage() {
  const scrollToUpload = () => {
    const el = document.getElementById('upload');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#0f172a] flex flex-col">
      {/* Header */}
      <Nav />

      {/* Hero */}
      <Hero onScrollToUpload={scrollToUpload} />

      {/* Main container matching mockup structure */}
      <main className="wrap">
        {/* Features & How It Works */}
        <FeatureBlock />

        {/* Upload & Gauge Score Report */}
        <TrialUploadWidget />

        {/* Reviews */}
        <Testimonials />

        {/* FAQ */}
        <FAQ />

        {/* Final CTA */}
        <CTASection onScrollToUpload={scrollToUpload} />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
