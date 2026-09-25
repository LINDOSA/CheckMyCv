'use client';

import React from 'react';

interface CvMockCardProps {
  variant: 'main' | 'alt';
}

export function CvMockCard({ variant }: CvMockCardProps) {
  if (variant === 'alt') {
    return (
      <div className="cv-card cv-alt select-none">
        <h4>SAMIRA KHAN</h4>
        <div className="cv-role">Data Engineer</div>
        <div className="cv-sec">
          CERTIFICATIONS <span className="tag">Verified</span>
        </div>
        <div className="cv-item">
          <b>AWS Solutions Architect</b>
          <small>2025</small>
        </div>
        <div className="cv-line w70" />
        <div className="cv-sec">EXPERIENCE</div>
        <div className="cv-item">
          <b>Data Engineer</b>
          <small>2020 – Present</small>
        </div>
        <div className="cv-line w85" />
        <div className="cv-line w40" />
        <div className="cv-sec">LANGUAGES</div>
        <div className="cv-item">
          <b>English</b>
          <small>Native</small>
        </div>
        <div className="cv-item">
          <b>Arabic</b>
          <small>Fluent</small>
        </div>
      </div>
    );
  }

  return (
    <div className="cv-card cv-main select-none">
      <div className="score-chip">
        92 <small>/100 ATS</small>
      </div>
      <h4>JORDAN LEE</h4>
      <div className="cv-role">Senior Product Designer</div>
      <div className="cv-line w85" />
      <div className="cv-line w70" />
      <div className="cv-sec">EXPERIENCE</div>
      <div className="cv-item">
        <b>Senior Product Designer</b>
        <small>2021 – Present</small>
      </div>
      <div className="cv-line w85" />
      <div className="cv-line w55" />
      <div className="cv-item">
        <b>Product Designer</b>
        <small>2018 – 2021</small>
      </div>
      <div className="cv-line w70" />
      <div className="cv-sec">
        PROJECTS <span className="tag">3 shipped</span>
      </div>
      <div className="cv-item">
        <b>Design system rollout</b>
        <small>2024</small>
      </div>
      <div className="cv-line w55" />
      <div className="cv-sec">SKILLS</div>
      <div className="cv-skill-row">
        <span>
          <span className="cv-dot" />
          Figma
        </span>
        <span>
          <span className="cv-dot" />
          UX Research
        </span>
        <span>
          <span className="cv-dot" />
          Prototyping
        </span>
        <span>
          <span className="cv-dot" />
          Design Ops
        </span>
        <span>
          <span className="cv-dot" />
          HTML/CSS
        </span>
        <span>
          <span className="cv-dot" />
          Motion
        </span>
      </div>
    </div>
  );
}
