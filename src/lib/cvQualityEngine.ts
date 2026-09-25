import { StandardCVDocument, CVReference, parseUserCvToStandardDocument } from './cvStandardData';
import {
  BulletEvaluation,
  ContactIntegrityReport,
  SectionArchitectureReport,
  FormattingGuardrailReport,
  ReferencesPreservationReport,
  QualityAuditResult,
} from '@/types/scoring';

export type {
  BulletEvaluation,
  ContactIntegrityReport,
  SectionArchitectureReport,
  FormattingGuardrailReport,
  ReferencesPreservationReport,
  QualityAuditResult,
};

// ============================================================================
// 1. ACTION VERB TAXONOMY & BLACKLISTS
// ============================================================================

export const PASSIVE_DUTY_REGEX =
  /^(?:responsible\s+for|duties\s+(?:included|consisted\s+of)|tasked\s+with|assisted\b|helped\b|worked\s+(?:on|with)|involved\s+in|participated\s+in|daily\s+duties|assigned\s+to|was\s+responsible\s+for|contributed\s+to|handled|dealt\s+with|supported\s+daily)\b/i;

export const STRONG_ACTION_VERBS: Set<string> = new Set([
  // Leadership & Strategy
  'spearheaded', 'spearhead', 'spearheading',
  'orchestrated', 'orchestrate', 'orchestrating',
  'directed', 'direct', 'directing',
  'championed', 'champion', 'championing',
  'piloted', 'pilot', 'piloting',
  'mobilized', 'mobilize', 'mobilizing',
  'steered', 'steer', 'steering',
  'founded', 'found', 'founding',
  'negotiated', 'negotiate', 'negotiating',
  'navigated', 'navigate', 'navigating',
  'influenced', 'influence', 'influencing',
  'instituted', 'institute', 'instituting',
  'overhauled', 'overhaul', 'overhauling',
  'revitalized', 'revitalize', 'revitalizing',
  'mentored', 'mentor', 'mentoring',
  'guided', 'guide', 'guiding',
  'empowered', 'empower', 'empowering',
  'aligned', 'align', 'aligning',
  'cultivated', 'cultivate', 'cultivating',
  'chaired', 'chair', 'chairing',
  'presided', 'preside', 'presiding',
  'mediated', 'mediate', 'mediating',
  'united', 'unite', 'uniting',
  'fostered', 'foster', 'fostering',
  'transformed', 'transform', 'transforming',
  'headed', 'head', 'heading',
  'appointed', 'appoint', 'appointing',
  'delegated', 'delegate', 'delegating',
  'regulated', 'regulate', 'regulating',
  'commanded', 'command', 'commanding',
  'supervised', 'supervise', 'supervising',
  'sponsored', 'sponsor', 'sponsoring',
  'advised', 'advise', 'advising',
  'led', 'lead', 'leading',
  'managed', 'manage', 'managing',
  'executed', 'execute', 'executing',
  'established', 'establish', 'establishing',
  'initiated', 'initiate', 'initiating',
  'formulated', 'formulate', 'formulating',

  // Technical & Engineering
  'architected', 'architect', 'architecting',
  'engineered', 'engineer', 'engineering',
  'automated', 'automate', 'automating',
  'deployed', 'deploy', 'deploying',
  'refactored', 'refactor', 'refactoring',
  'containerized', 'containerize', 'containerizing',
  'configured', 'configure', 'configuring',
  'instrumented', 'instrument', 'instrumenting',
  'provisioned', 'provision', 'provisioning',
  'benchmarked', 'benchmark', 'benchmarking',
  'integrated', 'integrate', 'integrating',
  'migrated', 'migrate', 'migrating',
  'programmed', 'program', 'programming',
  'coded', 'code', 'coding',
  'optimized', 'optimize', 'optimizing',
  'debugged', 'debug', 'debugging',
  'administered', 'administer', 'administering',
  'calibrated', 'calibrate', 'calibrating',
  'synchronized', 'synchronize', 'synchronizing',
  'patched', 'patch', 'patching',
  'compiled', 'compile', 'compiling',
  'virtualized', 'virtualize', 'virtualizing',
  'encrypted', 'encrypt', 'encrypting',
  'clustered', 'cluster', 'clustering',
  'queried', 'query', 'querying',
  'scaffolded', 'scaffold', 'scaffolding',
  'hardened', 'harden', 'hardening',
  'standardized', 'standardize', 'standardizing',
  'implemented', 'implement', 'implementing',
  'installed', 'install', 'installing',
  'troubleshot', 'troubleshoot', 'troubleshooting',
  'diagnosed', 'diagnose', 'diagnosing',
  'restored', 'restore', 'restoring',
  'built', 'build', 'building',
  'developed', 'develop', 'developing',
  'authored', 'author', 'authoring',
  'designed', 'design', 'designing',
  'scaled', 'scale', 'scaling',

  // Business, Finance & Growth
  'maximized', 'maximize', 'maximizing',
  'generated', 'generate', 'generating',
  'captured', 'capture', 'capturing',
  'expanded', 'expand', 'expanding',
  'boosted', 'boost', 'boosting',
  'accelerated', 'accelerate', 'accelerating',
  'increased', 'increase', 'increasing',
  'closed', 'close', 'closing',
  'prospected', 'prospect', 'prospecting',
  'monetized', 'monetize', 'monetizing',
  'forecasted', 'forecast', 'forecasting',
  'capitalized', 'capitalize', 'capitalizing',
  'audited', 'audit', 'auditing',
  'consolidated', 'consolidate', 'consolidating',
  'reconciled', 'reconcile', 'reconciling',
  'outpaced', 'outpace', 'outpacing',
  'acquired', 'acquire', 'acquiring',
  'doubled', 'double', 'doubling',
  'tripled', 'triple', 'tripling',
  'outflanked', 'outflank', 'outflanking',
  'outperformed', 'outperform', 'outperforming',
  'transacted', 'transact', 'transacting',
  'delivered', 'deliver', 'delivering',
  'yielded', 'yield', 'yielding',
  'converted', 'convert', 'converting',
  'raised', 'raise', 'raising',

  // Operational & Process Efficiency
  'streamlined', 'streamline', 'streamlining',
  'eliminated', 'eliminate', 'eliminating',
  'compressed', 'compress', 'compressing',
  'reduced', 'reduce', 'reducing',
  'cut', 'cutting',
  'trimmed', 'trim', 'trimming',
  'minimized', 'minimize', 'minimizing',
  'expedited', 'expedite', 'expediting',
  'centralized', 'centralize', 'centralizing',
  'simplified', 'simplify', 'simplifying',
  'restructured', 'restructure', 'restructuring',
  'resolved', 'resolve', 'resolving',
  'curtailed', 'curtail', 'curtailing',
  'condensed', 'condense', 'condensing',
  'rectified', 'rectify', 'rectifying',
  'upgraded', 'upgrade', 'upgrading',
  'dispatched', 'dispatch', 'dispatching',

  // Research, Design & Innovation
  'devised', 'devise', 'devising',
  'pioneered', 'pioneer', 'pioneering',
  'modeled', 'model', 'modeling',
  'prototyped', 'prototype', 'prototyping',
  'launched', 'launch', 'launching',
  'invented', 'invent', 'inventing',
  'conceptualized', 'conceptualize', 'conceptualizing',
  'validated', 'validate', 'validating',
  'mapped', 'map', 'mapping',
  'published', 'publish', 'publishing',
  'surveyed', 'survey', 'surveying',
  'tested', 'test', 'testing',
  'iterated', 'iterate', 'iterating',
  'uncovered', 'uncover', 'uncovering',
  'analyzed', 'analyze', 'analyzing',
  'synthesized', 'synthesize', 'synthesizing',
  'curated', 'curate', 'curating',
]);

// ============================================================================
// 2. METRIC EXTRACTION REGEXES & EXCLUSION FILTER
// ============================================================================

export const NON_METRIC_EXCLUSIONS =
  /\b(?:python\s+\d+(?:\.\d+)*|windows\s+(?:10|11|server)|java\s+\d+|angular\s+\d+|react\s+\d+|node(?:\.js)?\s+\d+|iso\s+\d+|soc\s*(?:1|2)|tier[- ](?:1|2|3)|layer[- ]\d+|ipv[46]|level[- ]\d+|pci[- ]dss\s+level\s+\d+|room\s+\d+|step\s+\d+)\b/gi;

export const METRIC_REGEXES = [
  // Percentages: 98.4%, +28%, -15%, 34 percent
  /(?:[+-]?\b\d+(?:\.\d+)?%(?!\w)|\b\d+(?:\.\d+)?\s*(?:percent|percentage\s+points)\b)/i,
  // Currency: $12M, $24,000, €500K, £1.8M, R4.2M, 1.8M USD
  /(?:[\$€£¥R]|USD|EUR|GBP|ZAR)\s*\d+(?:,\d{3})*(?:\.\d+)?(?:\s*[kmb]|(?:\s*(?:thousand|million|billion|k|m|b)))?\b|\b\d+(?:,\d{3})*(?:\.\d+)?\s*(?:dollars|euros|pounds|rands)\b/i,
  // Multipliers: 2x, 3.5x, 10-fold
  /\b\d+(?:\.\d+)?x\b|\b(?:two|three|four|five|ten|hundred|\d+)-fold\b/i,
  // Plus counts / scale suffixes: 350+, 400+ endpoints
  /\b\d+(?:,\d{3})*\+\s*(?:[a-zA-Z]+)?\b/i,
  // Operational units with quantities: 350 users, 40 countries, 120 workstations
  /\b\d+(?:,\d{3})*(?:\.\d+)?\s*(?:users|clients|customers|stakeholders|projects|tickets|systems|servers|accounts|staff|personnel|team\s+members|endpoints|locations|branches|branch\s+offices|offices|devices|vendors|terabytes|tb|gigabytes|gb|cases|incidents|hours|days|weeks|months|years|stores|calls|nodes|microservices|pipelines|queries|transactions|orders|members|cohorts|runbooks|workstations|switches|firewalls)\b/i,
  // Time & Latency deltas: from 4.2 hours to 45 minutes, sub-200ms
  /\b(?:from\s+\d+(?:\.\d+)?\s*(?:hours?|mins?|minutes?|days?|ms|seconds?)\s+to\s+\d+(?:\.\d+)?\s*(?:hours?|mins?|minutes?|days?|ms|seconds?)|sub-\d+\s*(?:ms|seconds?|minutes?))\b/i,
  // SLA / Uptime / KPI with numbers
  /\b(?:sla|uptime|roi|kpi|nps|p99|p95|csat)\b.*?\b\d+|\b\d+.*?\b(?:sla|uptime|roi|kpi|nps|p99|p95|csat)\b|\b(?:99\.9+|100%)\s*(?:uptime|availability|retention|pass\s+rate|adherence)\b/i,
];

export const BUSINESS_OUTCOME_INDICATORS = [
  // Causal connectives & gerunds
  /\b(?:resulting\s+in|leading\s+to|generating|driving(?:\s+a|\s+an)?|reducing|cutting|increasing|saving|enabling|improving|accelerating|eliminating|yielding|delivering|achieving|producing|lowering|protecting|preventing|capturing|intercepting|uncovering|securing|elevating|lifting|compressing|to\s+achieve|to\s+ensure|to\s+mitigate|with\s+(?:\d+|zero|100%|sub-))\b/i,
  // Impact nouns
  /\b(?:cost savings|revenue growth|licensing savings|turnaround time|downtime|retention|conversion velocity|audit pass rate|sla resolution|churn|efficiency gain|data integrity|profitability|time-to-market|productivity)\b/i,
];

// ============================================================================
// 3. PILLAR 1: BULLET POINT & XYZ EVALUATION
// ============================================================================

export function evaluateActionVerb(cleanText: string): { hasActionVerb: boolean; isPassive: boolean; verb?: string } {
  if (PASSIVE_DUTY_REGEX.test(cleanText)) {
    return { hasActionVerb: false, isPassive: true };
  }

  const tokens = cleanText.split(/\s+/);
  let firstToken = tokens[0]?.toLowerCase().replace(/[^a-z]/g, '');
  if (!firstToken) {
    return { hasActionVerb: false, isPassive: false };
  }

  // If first token is an adverb ending in -ly, look at second token
  if (firstToken.endsWith('ly') && tokens.length > 1) {
    firstToken = tokens[1]?.toLowerCase().replace(/[^a-z]/g, '');
  }

  const hasActionVerb = STRONG_ACTION_VERBS.has(firstToken);
  return { hasActionVerb, isPassive: false, verb: firstToken };
}

export function evaluateQuantifiableMetric(text: string): boolean {
  // Strip non-metric false positives first (e.g., Python 3.10, Windows 11)
  const filteredText = text.replace(NON_METRIC_EXCLUSIONS, ' ');

  for (const regex of METRIC_REGEXES) {
    if (regex.test(filteredText)) {
      return true;
    }
  }
  return false;
}

export function evaluateBusinessOutcome(text: string): boolean {
  for (const regex of BUSINESS_OUTCOME_INDICATORS) {
    if (regex.test(text)) {
      return true;
    }
  }
  return false;
}

export function evaluateBulletPoint(rawBullet: string, index: number = 0): BulletEvaluation {
  const clean = rawBullet.replace(/^[-•*–—\d.)\]\s]+/, '').trim();
  if (!clean) {
    return {
      bulletIndex: index,
      rawText: rawBullet,
      hasActionVerb: false,
      hasQuantifiableMetric: false,
      hasBusinessOutcome: false,
      isXyzCompliant: false,
      feedback: 'Empty bullet point.',
      suggestedRevision: undefined,
    };
  }

  const { hasActionVerb, isPassive } = evaluateActionVerb(clean);
  const hasQuantifiableMetric = evaluateQuantifiableMetric(clean);
  const hasBusinessOutcome = evaluateBusinessOutcome(clean);
  const isXyzCompliant = hasActionVerb && hasQuantifiableMetric && hasBusinessOutcome;

  let feedback = '';
  let suggestedRevision: string | undefined = undefined;

  if (isXyzCompliant) {
    feedback = 'Strong XYZ-compliant bullet: features a decisive action verb, quantifiable metric, and clear business outcome.';
  } else {
    const flaws: string[] = [];
    if (isPassive) {
      flaws.push("Passive duty opening ('Responsible for', 'Helped with'). Begin with a strong active verb.");
    } else if (!hasActionVerb) {
      flaws.push("Lacks strong action verb at the start. Begin with a power verb like 'Spearheaded', 'Engineered', or 'Streamlined'.");
    }
    if (!hasQuantifiableMetric) {
      flaws.push('Lacks quantifiable metric. Add measurable scale, percentage, currency, or unit figures.');
    }
    if (!hasBusinessOutcome) {
      flaws.push("Lacks explicit business outcome. State the organizational impact (e.g. 'resulting in...', 'cutting turnaround by 30%').");
    }
    feedback = flaws.join(' ');

    // Generate actionable revision suggestion demonstrating Google XYZ formula
    const coreSubject = clean
      .replace(PASSIVE_DUTY_REGEX, '')
      .replace(/^[a-z]+\s+/i, '')
      .trim();

    suggestedRevision = `Spearheaded ${coreSubject || 'core technical and operational initiatives'}, delivering a 35% efficiency improvement and reducing turnaround time by 40%.`;
  }

  return {
    bulletIndex: index,
    rawText: rawBullet,
    hasActionVerb,
    hasQuantifiableMetric,
    hasBusinessOutcome,
    isXyzCompliant,
    feedback,
    suggestedRevision,
  };
}

// ============================================================================
// 4. PILLAR 2: CONTACT INTEGRITY VALIDATOR
// ============================================================================

export const PLACEHOLDER_NAME_REGEX =
  /(?:candidate|applicant|client|user|first|last|your|enter|sample|demo|test)\s+(?:name|last|user)|john\s+doe|jane\s+doe|john\s+smith|name\s+here|full\s+name|curriculum\s+vitae|resume|cv|profile|unknown|n\/a|none|anonymous|available\s+upon\s+request|upon\s+request/i;

export const PLACEHOLDER_EMAIL_REGEX =
  /^(?:email|youremail|your\.email|candidate|placeholder|test|user|john\.doe|jane\.doe|name)@|@(example\.(?:com|org)|test\.com|localhost|invalid|placeholder\.com)$/i;

export const PLACEHOLDER_LOCATION_REGEX =
  /(?:city[,\s]+country|city[,\s]+state|your\s+city|location\s+here|address\s+line|anytown|somewhere|tbd|n\/a|^none$|^address$)/i;

export function evaluateContactIntegrity(doc: StandardCVDocument): ContactIntegrityReport {
  const issues: string[] = [];
  const name = (doc.name || '').trim();
  const phone = (doc.contact?.phone || '').trim();
  const email = (doc.contact?.email || '').trim();
  const location = (doc.contact?.location || '').trim();

  // 1. Full Name Validation
  const nameTokens = name.split(/\s+/).filter((t) => t.length >= 2);
  const isValidNameTokens = nameTokens.length >= 2;
  const isNotPlaceholderName = !PLACEHOLDER_NAME_REGEX.test(name);
  const isValidNameChars = /^[a-zA-ZÀ-ÿ\s.'-]+$/.test(name);
  const hasFullName = Boolean(name && isValidNameTokens && isNotPlaceholderName && isValidNameChars);

  if (!hasFullName) {
    if (!name) {
      issues.push('Candidate name is missing from document header.');
    } else if (PLACEHOLDER_NAME_REGEX.test(name)) {
      issues.push(`Placeholder name detected ('${name}'). Must provide actual candidate full name.`);
    } else if (!isValidNameTokens) {
      issues.push(`Full name must contain at least 2 words (first and last name). Found: '${name}'.`);
    } else if (!isValidNameChars) {
      issues.push('Candidate name contains invalid non-alphabetic characters.');
    }
  }

  // 2. Phone Number Validation (ITU-T E.164: 7 to 15 digits)
  const cleanDigits = phone.replace(/\D/g, '');
  const isValidDigitCount = cleanDigits.length >= 7 && cleanDigits.length <= 15;
  const isRepetitiveDigits = /^(\d)\1+$/.test(cleanDigits);
  const isSequentialDigits = /^(0123456|1234567|2345678|3456789|9876543|8765432|7654321)/.test(cleanDigits);
  const isDummyPhone =
    isRepetitiveDigits ||
    isSequentialDigits ||
    /555-01\d{2}/.test(phone) ||
    phone.toLowerCase().includes('tbd') ||
    phone.toLowerCase().includes('n/a');
  const hasPhoneNumber = Boolean(phone && isValidDigitCount && !isDummyPhone);

  if (!hasPhoneNumber) {
    if (!phone) {
      issues.push('Contact telephone/mobile number is missing.');
    } else if (!isValidDigitCount) {
      issues.push(`Phone number must contain between 7 and 15 digits (ITU-T E.164 standard). Found ${cleanDigits.length} digits.`);
    } else if (isDummyPhone) {
      issues.push(`Placeholder or invalid dummy phone number detected ('${phone}').`);
    }
  }

  // 3. Professional Email Validation (RFC 5322 & Non-dummy)
  const isRfcEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  const isNotPlaceholderEmail = !PLACEHOLDER_EMAIL_REGEX.test(email);
  const hasProfessionalEmail = Boolean(email && isRfcEmail && isNotPlaceholderEmail);

  if (!hasProfessionalEmail) {
    if (!email) {
      issues.push('Professional email address is missing.');
    } else if (!isRfcEmail) {
      issues.push(`Email address '${email}' does not conform to standard RFC email format.`);
    } else if (!isNotPlaceholderEmail) {
      issues.push(`Dummy or placeholder email address detected ('${email}'). Recruiters require a valid active mailbox.`);
    }
  }

  // 4. Location Validation
  const isValidLocationLength = location.length >= 3;
  const isNotPlaceholderLocation = !PLACEHOLDER_LOCATION_REGEX.test(location);
  const hasLocation = Boolean(location && isValidLocationLength && isNotPlaceholderLocation);

  if (!hasLocation) {
    if (!location) {
      issues.push('Geographic location (city/state or region) is missing.');
    } else if (PLACEHOLDER_LOCATION_REGEX.test(location)) {
      issues.push(`Placeholder location detected ('${location}'). Include candidate metropolitan area or city/country.`);
    } else {
      issues.push('Location is too brief (must be at least 3 characters).');
    }
  }

  const isValid = hasFullName && hasPhoneNumber && hasProfessionalEmail && hasLocation && issues.length === 0;

  const formattedCandidateName = name
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  return {
    hasFullName,
    candidateName: formattedCandidateName || name,
    hasPhoneNumber,
    phoneNumber: phone,
    hasProfessionalEmail,
    email,
    hasLocation,
    location,
    isValid,
    issues,
  };
}

// ============================================================================
// 5. PILLAR 3: SECTION ARCHITECTURE HIERARCHY ENGINE
// ============================================================================

export const CANONICAL_ATS_ORDER = [
  'Summary',
  'Skills Grid',
  'Experience',
  'Education',
  'References',
] as const;

export const SECTION_HEADER_PATTERNS: Array<{ section: string; regex: RegExp }> = [
  {
    section: 'Summary',
    regex: /^(?:#{1,3}\s*)?(?:professional\s+summary|executive\s+summary|career\s+summary|professional\s+profile|profile|summary|about\s+me|career\s+objective|personal\s+statement)\s*:?$/i,
  },
  {
    section: 'Skills Grid',
    regex: /^(?:#{1,3}\s*)?(?:skills\s*(?:&|and)\s*competencies|skills\s*(?:&|and)\s*expertise|technical\s+skills|core\s+skills|core\s+competencies|key\s+competencies|skills\s+grid|skills\s+matrix|skills|competencies|areas\s+of\s+expertise|technologies|tools\s*(?:&|and)\s*technologies)\s*:?$/i,
  },
  {
    section: 'Experience',
    regex: /^(?:#{1,3}\s*)?(?:professional\s+experience|work\s+experience|employment\s+history|experience|work\s+history|career\s+history|relevant\s+experience|employment)\s*:?$/i,
  },
  {
    section: 'Education',
    regex: /^(?:#{1,3}\s*)?(?:education\s*(?:&|and)\s*certifications|education\s*(?:&|and)\s*training|education|academic\s+qualifications|qualifications|academic\s+background|academic\s+history|degrees|credentials)\s*:?$/i,
  },
  {
    section: 'References',
    regex: /^(?:#{1,3}\s*)?(?:professional\s+references|references|referees)\s*:?$/i,
  },
];

export function evaluateSectionArchitecture(
  rawText: string,
  doc: StandardCVDocument
): SectionArchitectureReport {
  const issues: string[] = [];
  const detectedSectionsWithPos: Array<{ section: string; lineIndex: number }> = [];

  if (rawText && rawText.trim().length > 0) {
    const lines = rawText.split(/\r?\n/);
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      for (const item of SECTION_HEADER_PATTERNS) {
        if (item.regex.test(trimmed)) {
          if (!detectedSectionsWithPos.some((d) => d.section === item.section)) {
            detectedSectionsWithPos.push({ section: item.section, lineIndex: idx });
          }
          break;
        }
      }
    });
  }

  // Fallback / augmentation for structured StandardCVDocument
  const hasSummary = Boolean(doc.summary && doc.summary.trim().length >= 20);
  const hasSkills = Boolean(doc.skillsGrid && doc.skillsGrid.length > 0);
  const hasExperience = Boolean(doc.experience && doc.experience.length > 0);
  const hasEducation = Boolean(doc.education && doc.education.length > 0);
  const hasReferences = Boolean(
    (doc.references && doc.references.length > 0) ||
      (doc.additionalInfo?.references && doc.additionalInfo.references.trim().length > 0)
  );

  const detectedSections = detectedSectionsWithPos.map((d) => d.section);

  // If raw text didn't pick up some sections present in doc, ensure they are accounted for
  if (hasSummary && !detectedSections.includes('Summary')) detectedSections.push('Summary');
  if (hasSkills && !detectedSections.includes('Skills Grid')) detectedSections.push('Skills Grid');
  if (hasExperience && !detectedSections.includes('Experience')) detectedSections.push('Experience');
  if (hasEducation && !detectedSections.includes('Education')) detectedSections.push('Education');
  if (hasReferences && !detectedSections.includes('References')) detectedSections.push('References');

  // Check mandatory section presence
  for (const expected of CANONICAL_ATS_ORDER) {
    if (!detectedSections.includes(expected)) {
      issues.push(`Missing mandatory section: '${expected}'. ATS parsers require this section.`);
    }
  }

  // Check pairwise relative order if we have line positions from rawText
  if (detectedSectionsWithPos.length >= 2) {
    for (let i = 0; i < detectedSectionsWithPos.length - 1; i++) {
      const current = detectedSectionsWithPos[i];
      const next = detectedSectionsWithPos[i + 1];

      const currentIndex = CANONICAL_ATS_ORDER.indexOf(current.section as any);
      const nextIndex = CANONICAL_ATS_ORDER.indexOf(next.section as any);

      if (currentIndex !== -1 && nextIndex !== -1 && currentIndex > nextIndex) {
        issues.push(
          `Section '${current.section}' appears before '${next.section}'. Standard ATS hierarchy mandates: Summary -> Skills Grid -> Experience -> Education -> References.`
        );
      }
    }
  }

  return {
    detectedSections,
    isHierarchyCompliant: issues.length === 0,
    hierarchyIssues: issues,
  };
}

// ============================================================================
// 6. PILLAR 4: FORMATTING GUARDRAILS INSPECTOR
// ============================================================================

export function evaluateFormattingGuardrails(
  rawText: string,
  doc?: StandardCVDocument
): FormattingGuardrailReport {
  const violations: string[] = [];
  let hasMultiCellTables = false;
  let hasTextBoxes = false;
  let hasGraphics = false;
  let isSingleColumn = true;

  if (rawText) {
    // Check for Markdown / ASCII tables (lines with |---| or lines with multiple |)
    const lines = rawText.split(/\r?\n/);
    let pipeRowCount = 0;
    for (const line of lines) {
      const trimmed = line.trim();
      if (/^\|[-:\s|]+\|$/.test(trimmed)) {
        hasMultiCellTables = true;
      }
      const pipes = (trimmed.match(/\|/g) || []).length;
      const isInlineSeparator =
        trimmed.includes('@') ||
        /\|\s*(?:remote|london|new york|san francisco|austin|chicago|seattle|\+?\d|\d{4})\b/i.test(trimmed);
      if (
        (trimmed.startsWith('|') && trimmed.endsWith('|') && pipes >= 2) ||
        (pipes >= 3 && !isInlineSeparator)
      ) {
        pipeRowCount++;
      }
      // HTML table elements
      if (/<(?:table|tr|td|th)\b/i.test(trimmed)) {
        hasMultiCellTables = true;
      }
    }
    if (pipeRowCount >= 2) {
      hasMultiCellTables = true;
    }

    // Check for text boxes or sidebars
    if (/\[(?:sidebar|textbox|text\s*box)\]|<aside\b|class=["'].*?sidebar.*?["']/i.test(rawText)) {
      hasTextBoxes = true;
    }

    // Check for graphics/images
    if (/!\[.*?\]\(.*?\)|<img\b|data:image\/|\[(?:photo|image|headshot|logo)\]/i.test(rawText)) {
      hasGraphics = true;
    }

    // Check for multi-column layout indicators
    if (/column-count:\s*[2-9]|:::columns|grid-cols-[2-9]/i.test(rawText) || hasMultiCellTables) {
      isSingleColumn = false;
    }
  }

  if (hasMultiCellTables) {
    violations.push('Multi-cell tables detected. ATS parsers misread tabular data as column breaks.');
  }
  if (hasTextBoxes) {
    violations.push('Text boxes or sidebars detected. Content in text boxes is ignored by many ATS engines.');
  }
  if (hasGraphics) {
    violations.push('Graphics or raster images detected. ATS parsers cannot read text in images.');
  }
  if (!isSingleColumn) {
    violations.push('Multi-column layout detected. Pure single-column linear layout is required.');
  }

  const isCompliant = isSingleColumn && !hasMultiCellTables && !hasTextBoxes && !hasGraphics;

  return {
    isSingleColumn,
    hasMultiCellTables,
    hasTextBoxes,
    hasGraphics,
    isCompliant,
    violations,
  };
}

// ============================================================================
// 7. PILLAR 5: REFERENCES PRESERVATION & PRIVACY CHECKER
// ============================================================================

export function evaluateReferencesPreservation(
  doc: StandardCVDocument,
  rawText?: string
): ReferencesPreservationReport {
  const issues: string[] = [];
  const refs = doc.references || [];
  const hasExplicitRefs = Array.isArray(refs) && refs.length > 0;

  const rawReferencesDeclaration = Boolean(
    (doc.additionalInfo?.references &&
      /references\s+available\s+upon\s+request|available\s+upon\s+request/i.test(
        doc.additionalInfo.references
      )) ||
      (rawText &&
        /references\s+available\s+upon\s+request|available\s+upon\s+request/i.test(rawText))
  );

  let isPreservedWithoutHallucination = true;

  if (hasExplicitRefs) {
    // Candidate provided named referees: verify genuine entries without fake placeholder tokens
    for (let i = 0; i < refs.length; i++) {
      const ref = refs[i];
      if (!ref.name || PLACEHOLDER_NAME_REGEX.test(ref.name) || /^referee\s+\d+$/i.test(ref.name)) {
        isPreservedWithoutHallucination = false;
        issues.push(`Referee #${i + 1} contains placeholder or invalid name ('${ref.name}').`);
      }
      if (!ref.phone && !ref.email) {
        issues.push(`Referee #${i + 1} ('${ref.name}') lacks direct contact phone or email.`);
      }
    }
  } else if (rawReferencesDeclaration) {
    // Compliant with professional international privacy standard
    isPreservedWithoutHallucination = true;
  } else {
    // Neither explicit referees nor privacy declaration present
    isPreservedWithoutHallucination = false;
    issues.push(
      "Missing references section. ATS standard requires either verified referees or professional privacy declaration: 'References available upon request'."
    );
  }

  const hasReferences = hasExplicitRefs || rawReferencesDeclaration;

  return {
    hasReferences,
    referencesCount: refs.length,
    isPreservedWithoutHallucination,
    issues,
  };
}

// ============================================================================
// 8. PILLAR 6: DIAGNOSTIC SCORER & OVERALL AUDIT
// ============================================================================

export function computeDiagnosticScore(params: {
  metricSaturation: number;
  isMetricSaturationCompliant: boolean;
  contactIntegrity: ContactIntegrityReport;
  sectionArchitecture: SectionArchitectureReport;
  formattingGuardrails: FormattingGuardrailReport;
  referencesPreservation: ReferencesPreservationReport;
  lineByLineFeedback: BulletEvaluation[];
}): QualityAuditResult {
  const {
    metricSaturation,
    isMetricSaturationCompliant,
    contactIntegrity,
    sectionArchitecture,
    formattingGuardrails,
    referencesPreservation,
    lineByLineFeedback,
  } = params;

  // 1. Metric Saturation & XYZ Score (Max 35 pts)
  let impactScore = 0;
  if (metricSaturation >= 0.40) {
    impactScore += 20;
    // Bonus up to 5 points for saturation > 0.40
    const bonus = Math.min(5, Math.round((metricSaturation - 0.40) * 12.5));
    impactScore += bonus;
  } else {
    impactScore += Math.round((metricSaturation / 0.40) * 15);
  }

  const totalBullets = lineByLineFeedback.length;
  const verbCount = lineByLineFeedback.filter((b) => b.hasActionVerb).length;
  const outcomeCount = lineByLineFeedback.filter((b) => b.hasBusinessOutcome).length;

  if (totalBullets > 0) {
    const verbRatio = verbCount / totalBullets;
    impactScore += verbRatio >= 0.70 ? 5 : Math.round((verbRatio / 0.70) * 5);

    const outcomeRatio = outcomeCount / totalBullets;
    impactScore += outcomeRatio >= 0.50 ? 5 : Math.round((outcomeRatio / 0.50) * 5);
  }
  impactScore = Math.min(35, Math.max(0, impactScore));

  // 2. Contact Integrity Score (Max 20 pts: 5 pts each)
  let contactScore = 0;
  if (contactIntegrity.hasFullName) contactScore += 5;
  if (contactIntegrity.hasPhoneNumber) contactScore += 5;
  if (contactIntegrity.hasProfessionalEmail) contactScore += 5;
  if (contactIntegrity.hasLocation) contactScore += 5;

  // 3. Section Architecture Score (Max 20 pts)
  let sectionScore = 0;
  const canonicalSections = CANONICAL_ATS_ORDER;
  for (const section of canonicalSections) {
    if (sectionArchitecture.detectedSections.includes(section)) {
      sectionScore += 3; // 5 * 3 = 15 pts max for sections
    }
  }
  if (sectionArchitecture.isHierarchyCompliant) {
    sectionScore += 5; // 5 pts for correct sequential ATS hierarchy
  }

  // 4. Formatting Guardrails Score (Max 15 pts)
  let formattingScore = 0;
  if (formattingGuardrails.isSingleColumn) formattingScore += 6;
  if (!formattingGuardrails.hasMultiCellTables) formattingScore += 3;
  if (!formattingGuardrails.hasTextBoxes) formattingScore += 3;
  if (!formattingGuardrails.hasGraphics) formattingScore += 3;

  // 5. References Preservation Score (Max 10 pts)
  let referencesScore = 0;
  if (referencesPreservation.isPreservedWithoutHallucination) {
    referencesScore += 6;
  }
  if (referencesPreservation.hasReferences && referencesPreservation.issues.length === 0) {
    referencesScore += 4;
  }

  const overallScore = Math.min(
    100,
    Math.max(0, impactScore + contactScore + sectionScore + formattingScore + referencesScore)
  );

  // Compile Critical Issues & Actionable Fixes
  const criticalIssues: string[] = [];
  const actionableFixes: string[] = [];

  if (!isMetricSaturationCompliant) {
    criticalIssues.push(
      `Low metric saturation: only ${Math.round(
        metricSaturation * 100
      )}% of bullets contain quantifiable metrics. ATS and recruiter benchmarks mandate at least 40%.`
    );
    actionableFixes.push(
      'Quantify at least 40% of experience bullets with measurable metrics ($ savings, % gains, user scale, latency).'
    );
  }

  if (!contactIntegrity.isValid) {
    criticalIssues.push(...contactIntegrity.issues);
    actionableFixes.push(
      'Provide complete, genuine candidate contact information: full name, active telephone (7-15 digits), RFC email, and city/region.'
    );
  }

  if (!sectionArchitecture.isHierarchyCompliant) {
    criticalIssues.push(...sectionArchitecture.hierarchyIssues);
    actionableFixes.push(
      'Re-order sections to strictly follow standard ATS hierarchy: Summary -> Skills Grid -> Experience -> Education -> References.'
    );
  }

  if (!formattingGuardrails.isCompliant) {
    criticalIssues.push(...formattingGuardrails.violations);
    actionableFixes.push(
      'Convert document to strict single-column layout without multi-cell tables, sidebars, text boxes, or graphics.'
    );
  }

  if (!referencesPreservation.isPreservedWithoutHallucination) {
    criticalIssues.push(...referencesPreservation.issues);
    actionableFixes.push(
      "Preserve genuine candidate references or use the compliant standard declaration: 'References available upon request'."
    );
  }

  const isSubmissionReady =
    overallScore >= 75 &&
    isMetricSaturationCompliant &&
    contactIntegrity.isValid &&
    sectionArchitecture.isHierarchyCompliant &&
    formattingGuardrails.isCompliant &&
    referencesPreservation.isPreservedWithoutHallucination &&
    criticalIssues.length === 0;

  return {
    overallScore,
    metricSaturation,
    isMetricSaturationCompliant,
    contactIntegrity,
    sectionArchitecture,
    formattingGuardrails,
    referencesPreservation,
    lineByLineFeedback,
    isSubmissionReady,
    criticalIssues,
    actionableFixes,
  };
}

// ============================================================================
// 9. INPUT NORMALIZATION & MAIN ENTRY POINT
// ============================================================================

export function auditCvQuality(cv: StandardCVDocument | string): QualityAuditResult {
  let doc: StandardCVDocument;
  let rawTextForLayout = '';

  if (typeof cv === 'string') {
    rawTextForLayout = cv.trim();
    if (rawTextForLayout.length < 20) {
      return {
        overallScore: 10,
        metricSaturation: 0,
        isMetricSaturationCompliant: false,
        contactIntegrity: {
          hasFullName: false,
          candidateName: '',
          hasPhoneNumber: false,
          phoneNumber: '',
          hasProfessionalEmail: false,
          email: '',
          hasLocation: false,
          location: '',
          isValid: false,
          issues: ['CV document contains insufficient text (less than 20 characters).'],
        },
        sectionArchitecture: {
          detectedSections: [],
          isHierarchyCompliant: false,
          hierarchyIssues: ['CV document contains insufficient text to detect sections.'],
        },
        formattingGuardrails: {
          isSingleColumn: true,
          hasMultiCellTables: false,
          hasTextBoxes: false,
          hasGraphics: false,
          isCompliant: true,
          violations: [],
        },
        referencesPreservation: {
          hasReferences: false,
          referencesCount: 0,
          isPreservedWithoutHallucination: false,
          issues: ['No references detected in empty CV.'],
        },
        lineByLineFeedback: [],
        isSubmissionReady: false,
        criticalIssues: ['CV document contains insufficient text (less than 20 characters).'],
        actionableFixes: ['Provide a complete professional CV containing work experience, skills, and contact details.'],
      };
    }
    doc = parseUserCvToStandardDocument(rawTextForLayout);
  } else {
    doc = cv;
    // Build text representation from structured doc for formatting checks
    rawTextForLayout = [
      doc.name,
      doc.title,
      doc.contact?.email,
      doc.contact?.phone,
      doc.contact?.location,
      ...(doc.summary && doc.summary.trim().length >= 20 ? ['Professional Summary', doc.summary] : []),
      ...(doc.skillsGrid && doc.skillsGrid.length > 0
        ? ['Core Skills', ...doc.skillsGrid.map((s) => `${s.category}: ${s.skills}`)]
        : []),
      ...(doc.experience && doc.experience.length > 0
        ? ['Professional Experience', ...doc.experience.flatMap((e) => [e.title, e.company, e.dates, ...(e.bullets || [])])]
        : []),
      ...(doc.education && doc.education.length > 0
        ? ['Education & Certifications', ...doc.education.map((ed) => `${ed.qualification} ${ed.institution || ''} ${ed.year}`)]
        : []),
      ...(doc.references && doc.references.length > 0
        ? ['Professional References', ...doc.references.map((r) => `${r.name} ${r.title} ${r.company} ${r.phone} ${r.email}`)]
        : []),
      doc.additionalInfo?.references || '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  // 1. Evaluate All Experience Bullets
  const allBullets: string[] = [];
  if (doc.experience && Array.isArray(doc.experience)) {
    doc.experience.forEach((exp) => {
      if (Array.isArray(exp.bullets)) {
        allBullets.push(...exp.bullets);
      }
    });
  }

  const lineByLineFeedback: BulletEvaluation[] = allBullets.map((bullet, idx) =>
    evaluateBulletPoint(bullet, idx)
  );

  const totalBullets = lineByLineFeedback.length;
  const quantifiedBullets = lineByLineFeedback.filter((b) => b.hasQuantifiableMetric).length;
  const metricSaturation =
    totalBullets > 0 ? Number((quantifiedBullets / totalBullets).toFixed(2)) : 0;
  const isMetricSaturationCompliant = metricSaturation >= 0.40;

  // 2. Evaluate Contact Integrity
  const contactIntegrity = evaluateContactIntegrity(doc);

  // 3. Evaluate Section Architecture
  const sectionArchitecture = evaluateSectionArchitecture(rawTextForLayout, doc);

  // 4. Evaluate Formatting Guardrails
  const formattingGuardrails = evaluateFormattingGuardrails(rawTextForLayout, doc);

  // 5. Evaluate References Preservation
  const referencesPreservation = evaluateReferencesPreservation(doc, rawTextForLayout);

  // 6. Compute Comprehensive 0-100 Score and Diagnostics
  return computeDiagnosticScore({
    metricSaturation,
    isMetricSaturationCompliant,
    contactIntegrity,
    sectionArchitecture,
    formattingGuardrails,
    referencesPreservation,
    lineByLineFeedback,
  });
}
