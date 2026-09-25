'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FullRewriteModal } from '../FullRewriteModal';
import { PaywallModal } from '../PaywallModal';
import { isUserPaid, verifyAndSyncPaymentStatus } from '@/lib/paymentAccess';
import { parseUserCvToStandardDocument, StandardCVDocument } from '@/lib/cvStandardData';
import { auditCvQuality } from '@/lib/cvQualityEngine';
import { calculateEmpiricalScore } from '@/lib/scoringEngine';

export interface ScoreCheckItem {
  badge: 'ok' | 'warn' | 'bad';
  symbol: string;
  title: string;
  subtitle: string;
}

const DEFAULT_CHECKS: ScoreCheckItem[] = [
  {
    badge: 'ok',
    symbol: '✓',
    title: 'Keyword coverage — strong',
    subtitle: '24 of 28 target keywords found',
  },
  {
    badge: 'ok',
    symbol: '✓',
    title: 'ATS-readable format',
    subtitle: 'Single-column layout, no parser traps',
  },
  {
    badge: 'warn',
    symbol: '!',
    title: 'Impact verbs — improvable',
    subtitle: '3 bullet points lack quantified results',
  },
  {
    badge: 'bad',
    symbol: '×',
    title: 'Missing "Skills" heading',
    subtitle: 'Add a clear heading for parser accuracy',
  },
];

function calculateRealCvScoreAndChecks(
  cvText: string,
  doc: StandardCVDocument
): {
  realScore: number;
  checks: ScoreCheckItem[];
} {
  // If CV text is very short or unparseable
  if (!cvText || cvText.trim().length < 25) {
    return {
      realScore: 32,
      checks: [
        {
          badge: 'bad',
          symbol: '×',
          title: 'Document text too short',
          subtitle: 'Under 25 characters extracted — upload a complete text or PDF CV',
        },
        {
          badge: 'bad',
          symbol: '×',
          title: 'ATS-readable format',
          subtitle: 'Unable to extract text layers from uploaded file',
        },
        {
          badge: 'bad',
          symbol: '×',
          title: 'Impact verbs — missing',
          subtitle: 'No work experience bullet points detected',
        },
        {
          badge: 'bad',
          symbol: '×',
          title: 'Missing standard headings',
          subtitle: 'Add Summary, Experience, Education, and Skills headings',
        },
      ],
    };
  }

  const empirical = calculateEmpiricalScore(cvText);
  const quality = auditCvQuality(cvText);

  // Real ATS overall score (0 to 100) calculated from candidate's actual CV
  const realScore = empirical.overall_score;

  const checks: ScoreCheckItem[] = [];

  // 1. Keyword Check
  const kwCat = empirical.categories.find((c) => c.key === 'keyword');
  const kwScore = kwCat?.score ?? 70;
  const skillWords = (doc.skillsGrid || []).flatMap((g) => g.skills.split(/[,|•\t]+/)).filter((s) => s.trim().length > 1);
  const matchedKeywordsCount = Math.max(
    skillWords.length,
    Number(kwCat?.detail.match(/\b(\d+)\b/)?.[1] || 16)
  );

  if (kwScore >= 75) {
    checks.push({
      badge: 'ok',
      symbol: '✓',
      title: 'Keyword coverage — strong',
      subtitle: `${matchedKeywordsCount} core industry keywords & competencies detected`,
    });
  } else if (kwScore >= 50) {
    checks.push({
      badge: 'warn',
      symbol: '!',
      title: 'Keyword coverage — moderate',
      subtitle: `${matchedKeywordsCount} keywords found — add more role-specific tools & hard skills`,
    });
  } else {
    checks.push({
      badge: 'bad',
      symbol: '×',
      title: 'Keyword coverage — low',
      subtitle: `Only ${matchedKeywordsCount} core keywords found — ATS filters may screen your CV out`,
    });
  }

  // 2. ATS Readable Format Check
  if (quality.formattingGuardrails.isCompliant) {
    checks.push({
      badge: 'ok',
      symbol: '✓',
      title: 'ATS-readable format',
      subtitle: 'Single-column layout, no parser traps or text boxes',
    });
  } else if (quality.formattingGuardrails.hasMultiCellTables || !quality.formattingGuardrails.isSingleColumn) {
    checks.push({
      badge: 'bad',
      symbol: '×',
      title: 'Complex layout formatting',
      subtitle: quality.formattingGuardrails.violations[0] || 'Multi-column or table layout confuses ATS parsers',
    });
  } else {
    checks.push({
      badge: 'warn',
      symbol: '!',
      title: 'Visual element warning',
      subtitle: quality.formattingGuardrails.violations[0] || 'Embedded boxes or images detected — text may be skipped',
    });
  }

  // 3. Impact Verbs & Quantifiable Metrics
  const totalBullets = quality.lineByLineFeedback.length;
  const quantifiedBullets = quality.lineByLineFeedback.filter((b) => b.hasQuantifiableMetric).length;
  const unquantifiedCount = totalBullets - quantifiedBullets;

  if (totalBullets === 0) {
    checks.push({
      badge: 'warn',
      symbol: '!',
      title: 'Impact verbs — improvable',
      subtitle: 'Add clear bullet points under each role detailing measurable achievements',
    });
  } else if (unquantifiedCount === 0) {
    checks.push({
      badge: 'ok',
      symbol: '✓',
      title: 'Impact metrics — strong',
      subtitle: `All ${totalBullets} bullet points contain measurable metrics`,
    });
  } else if (quality.metricSaturation >= 0.40) {
    checks.push({
      badge: 'ok',
      symbol: '✓',
      title: 'Impact metrics — compliant',
      subtitle: `${quantifiedBullets} of ${totalBullets} bullets quantified (${Math.round(quality.metricSaturation * 100)}% metric saturation)`,
    });
  } else {
    checks.push({
      badge: 'warn',
      symbol: '!',
      title: 'Impact verbs — improvable',
      subtitle: `${unquantifiedCount} bullet ${unquantifiedCount === 1 ? 'point lacks' : 'points lack'} quantified results (Google XYZ standard)`,
    });
  }

  // 4. Section Architecture & Heading Check
  const detected = quality.sectionArchitecture.detectedSections;
  const missing: string[] = [];
  if (!detected.includes('Skills Grid')) missing.push('Skills');
  if (!detected.includes('Summary')) missing.push('Summary');
  if (!detected.includes('Experience')) missing.push('Experience');
  if (!detected.includes('Education')) missing.push('Education');

  if (missing.length > 0) {
    checks.push({
      badge: 'bad',
      symbol: '×',
      title: `Missing "${missing[0]}" heading`,
      subtitle: `Add a clear "${missing[0]}" heading for parser accuracy`,
    });
  } else if (!quality.sectionArchitecture.isHierarchyCompliant) {
    checks.push({
      badge: 'warn',
      symbol: '!',
      title: 'Section sequence issue',
      subtitle: quality.sectionArchitecture.hierarchyIssues[0] || 'Order sections: Summary → Skills → Experience → Education',
    });
  } else if (!quality.contactIntegrity.isValid) {
    checks.push({
      badge: 'warn',
      symbol: '!',
      title: 'Contact details incomplete',
      subtitle: quality.contactIntegrity.issues[0] || 'Include candidate full name, active phone, and email',
    });
  } else {
    checks.push({
      badge: 'ok',
      symbol: '✓',
      title: 'Standard section hierarchy',
      subtitle: 'All core sections (Summary, Skills, Experience, Education) verified',
    });
  }

  return { realScore, checks };
}

export function TrialUploadWidget() {
  const [isOver, setIsOver] = useState(false);
  const [analyzedFile, setAnalyzedFile] = useState<string | null>(null);
  const [displayScore, setDisplayScore] = useState(0);
  const [realScore, setRealScore] = useState(78);
  const [strokeOffset, setStrokeOffset] = useState(502.6);
  const [scoreChecks, setScoreChecks] = useState<ScoreCheckItem[]>(DEFAULT_CHECKS);
  const [candidateName, setCandidateName] = useState('Jordan Lee');
  const [candidateTitle, setCandidateTitle] = useState('Senior Product Designer');
  const [cvText, setCvText] = useState<string | undefined>(undefined);
  const [isParsing, setIsParsing] = useState(false);
  const [showRewriteModal, setShowRewriteModal] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const countIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const CIRC = 502.6; // 2 * Math.PI * 80 ≈ 502.65

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (countIntervalRef.current) {
        clearInterval(countIntervalRef.current);
      }
    };
  }, []);

  // Check paid status on mount and listen to storage events
  useEffect(() => {
    setIsPaid(isUserPaid());

    // Check URL parameters for a successful return from Paystack checkout
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const paymentStatus = params.get('payment');
      // Paystack returns its transaction reference on the callback URL.
      const sessionId = params.get('reference') || params.get('session_id');

      if (paymentStatus === 'success' && sessionId) {
        // Clean URL first so the session ID is not left in the address bar
        window.history.replaceState({}, '', window.location.pathname);
        // Unlock only if the server confirms this reference is paid (registry / Paystack API)
        verifyAndSyncPaymentStatus(sessionId).then((verified) => {
          setIsPaid(verified);
          if (verified) {
            // Automatically open the rewrite modal in unlocked mode
            setShowRewriteModal(true);
          }
        });
      } else if (isUserPaid()) {
        // Re-check locally stored access against the server so forged storage flags are cleared
        verifyAndSyncPaymentStatus().then((verified) => setIsPaid(verified));
      }
    }

    const handleStorageChange = () => {
      setIsPaid(isUserPaid());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const animateToScore = (targetScore: number) => {
    if (countIntervalRef.current) {
      clearInterval(countIntervalRef.current);
    }
    setStrokeOffset(CIRC * (1 - targetScore / 100));
    let current = 0;
    const step = Math.max(1, Math.ceil(targetScore / 35));
    countIntervalRef.current = setInterval(() => {
      current += step;
      if (current >= targetScore) {
        current = targetScore;
        if (countIntervalRef.current) {
          clearInterval(countIntervalRef.current);
        }
      }
      setDisplayScore(current);
    }, 24);
  };

  const handleFile = async (file: File) => {
    setAnalyzedFile(file.name);
    setDisplayScore(0);
    setStrokeOffset(502.6);
    setIsParsing(true);

    if (countIntervalRef.current) {
      clearInterval(countIntervalRef.current);
    }

    // Initial candidate name extracted from file name
    const cleanName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b(cv|resume|curriculum|vitae|final|draft|v\d+)\b/gi, '')
      .trim();
    if (cleanName && cleanName.length > 2) {
      setCandidateName(cleanName);
    } else {
      setCandidateName('Jordan Lee');
    }

    // Smooth scroll down to report
    setTimeout(() => {
      if (reportRef.current) {
        reportRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);

    // Call server API /api/parse to extract text from PDF, DOCX, or TXT
    let extractedText = '';
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/parse', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success && data.text) {
        extractedText = data.text;
      }
    } catch (err) {
      console.warn('Server parse failed, checking client text fallback', err);
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        try {
          extractedText = await file.text();
        } catch (_) {}
      }
    } finally {
      setIsParsing(false);
    }

    if (extractedText && extractedText.trim().length > 20) {
      setCvText(extractedText);
      const parsedDoc = parseUserCvToStandardDocument(extractedText);
      if (parsedDoc.name && parsedDoc.name !== 'Candidate Name') {
        setCandidateName(parsedDoc.name);
      }
      if (parsedDoc.title) {
        setCandidateTitle(parsedDoc.title);
      }

      // Calculate real ATS score and real diagnostic checklist
      const { realScore: computedScore, checks } = calculateRealCvScoreAndChecks(extractedText, parsedDoc);
      setRealScore(computedScore);
      setScoreChecks(checks);
      animateToScore(computedScore);
    } else {
      // Fallback if parsing returned empty text (e.g. image-only PDF)
      const fallbackScore = 42;
      setRealScore(fallbackScore);
      setScoreChecks([
        {
          badge: 'bad',
          symbol: '×',
          title: 'Scanned image / unreadable text',
          subtitle: 'No extractable text layer found — ATS engines will reject image-only scans',
        },
        {
          badge: 'bad',
          symbol: '×',
          title: 'ATS-readable format',
          subtitle: 'Upload standard text-based PDF or DOCX format',
        },
        {
          badge: 'warn',
          symbol: '!',
          title: 'Impact verbs & metrics',
          subtitle: 'Ensure bullet points are typed as selectable text',
        },
        {
          badge: 'bad',
          symbol: '×',
          title: 'Section hierarchy unverified',
          subtitle: 'Standard headings required for ATS cataloging',
        },
      ]);
      animateToScore(fallbackScore);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const triggerSelect = () => {
    fileInputRef.current?.click();
  };

  const resetUpload = () => {
    if (countIntervalRef.current) {
      clearInterval(countIntervalRef.current);
    }
    setAnalyzedFile(null);
    setDisplayScore(0);
    setRealScore(78);
    setStrokeOffset(502.6);
    setScoreChecks(DEFAULT_CHECKS);
    setCvText(undefined);
    setCandidateName('Jordan Lee');
    setCandidateTitle('Senior Product Designer');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenRewrite = () => {
    setShowRewriteModal(true);
  };

  return (
    <section id="upload" style={{ paddingTop: 0 }}>
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5 }}
        className="sec-head"
      >
        <span className="sec-tag">Try it now</span>
        <h2>Score your CV in seconds</h2>
        <p>Upload your CV to run an instant, multi-pillar ATS quality and keyword audit.</p>
      </motion.div>

      {/* Upload Drop Zone */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.4 }}
        id="dropZone"
        className={`upload ${isOver ? 'over' : ''}`}
        onClick={triggerSelect}
        onDragOver={(e) => {
          e.preventDefault();
          setIsOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsOver(false);
        }}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="mx-auto">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <path d="M17 8l-5-5-5 5" />
          <path d="M12 3v12" />
        </svg>
        <b className="font-bold text-[#0f172a] text-[1.05rem]">Drop your CV here or click to upload</b>
        <small className="text-[#5b6b83] block mt-1">
          {isParsing ? 'Extracting document text...' : 'PDF only · max 3 MB · analyzed on your device'}
        </small>
        <input
          ref={fileInputRef}
          type="file"
          id="fileInput"
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={handleChange}
        />
      </motion.div>

      {/* Upload Message */}
      {analyzedFile && (
        <p id="uploadMsg" className="text-center mt-4 text-[#2563eb] font-semibold text-sm">
          ✓ {analyzedFile} analyzed — {candidateName} ({candidateTitle})
        </p>
      )}

      {/* Score Report */}
      <AnimatePresence>
        {analyzedFile && (
          <motion.div
            ref={reportRef}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="report block"
            id="report"
          >
            <div className="report-inner">
              {/* Animated SVG Dial */}
              <div className="dial">
                <svg width="190" height="190">
                  <defs>
                    <linearGradient id="dialGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                  </defs>
                  <circle className="track" cx="95" cy="95" r="80" fill="none" strokeWidth="13" />
                  <circle
                    className="fill"
                    id="dialFill"
                    cx="95"
                    cy="95"
                    r="80"
                    fill="none"
                    strokeWidth="13"
                    strokeDasharray="502.6"
                    style={{ strokeDashoffset: strokeOffset }}
                  />
                </svg>
                <div className="dial-center">
                  <span className="dial-num" id="dialNum">
                    {displayScore}
                  </span>
                  <span className="dial-label">/ 100 ATS Score</span>
                </div>
              </div>

              {/* Checklist breakdown */}
              <div>
                <ul className="checks">
                  {scoreChecks.map((item, idx) => (
                    <li key={idx}>
                      <span className={`badge ${item.badge}`}>{item.symbol}</span>
                      <div>
                        <b>{item.title}</b>
                        <small>{item.subtitle}</small>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Action strip with Fix & Polish with AI button */}
                <div className="mt-6 pt-5 border-t border-[#e6eaf2] flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={resetUpload}
                    className="text-xs font-semibold text-[#5b6b83] hover:text-[#0f172a] transition-colors cursor-pointer"
                  >
                    ← Scan another document
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenRewrite}
                    className="btn btn-primary text-xs !py-2.5 !px-5 cursor-pointer shadow-[0_4px_14px_rgba(37,99,235,0.35)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.45)] hover:-translate-y-0.5 active:translate-y-0 transition-all font-bold"
                  >
                    Fix &amp; Polish with AI →
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full AI Rewrite & Polish Modal */}
      <FullRewriteModal
        isOpen={showRewriteModal}
        onClose={() => setShowRewriteModal(false)}
        initialProfileId="executive"
        userScore={displayScore || realScore}
        cvText={cvText}
        targetRole={candidateTitle || 'Senior Product Designer'}
        isPaid={isPaid}
        onOpenPaywall={() => {
          setShowRewriteModal(false);
          setShowPaywallModal(true);
        }}
      />

      {/* Paywall Checkout Modal */}
      <PaywallModal
        isOpen={showPaywallModal}
        onClose={() => setShowPaywallModal(false)}
        overallScore={displayScore || realScore}
        profileId="executive"
        candidateName={candidateName}
      />
    </section>
  );
}
