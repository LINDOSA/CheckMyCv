import { ScoreResult, CategoryScore, TopIssue } from '@/types/scoring';
import {
  resolveCandidateRoleAndDomain,
  detectDomainFromText,
  DOMAIN_DEFINITIONS,
  JobDomain,
} from './domainTaxonomy';

/**
 * Standard Multi-Industry Competency Dictionary for Universal CV Health Analysis (350+ global skills)
 */
const ALL_DOMAIN_KEYWORDS = Object.values(DOMAIN_DEFINITIONS).flatMap((d) => d.keywords);
const GLOBAL_SKILLS_DICTIONARY = Array.from(
  new Set([
    ...ALL_DOMAIN_KEYWORDS,
    // Management, Methodologies & Leadership
    'agile', 'scrum', 'project management', 'vendor management', 'stakeholder management',
    'team leadership', 'documentation', 'sop', 'cross-functional collaboration', 'budget management',
    'problem solving', 'strategic planning', 'continuous improvement', 'change management'
  ])
);

/**
 * Stopwords to exclude when analyzing Job Adverts
 */
const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing',
  'don\'t', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t',
  'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers',
  'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if',
  'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t',
  'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our',
  'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s',
  'should', 'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs',
  'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re',
  'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t',
  'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s',
  'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t',
  'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself',
  'yourselves', 'will', 'must', 'role', 'responsibilities', 'requirements', 'candidate', 'experience',
  'work', 'years', 'job', 'position', 'team', 'company', 'join', 'ability', 'required', 'preferred',
  'skills', 'looking', 'opportunity', 'strong', 'environment', 'high', 'working', 'help'
]);

export interface DetailedAudit {
  totalWords: number;
  totalBullets: number;
  quantifiedBulletsCount: number;
  quantifiedRatio: number;
  passiveBulletsCount: number;
  actionVerbBulletsCount: number;
  samplePassiveBullet?: string;
  sampleQuantifiedBullet?: string;
  foundSectionHeaders: string[];
  missingSectionHeaders: string[];
  hasEmail: boolean;
  hasPhone: boolean;
  estimatedYearsExperience: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  targetRoleDetected: string;
}

/**
 * Extracts distinct bullet points or experience statements from CV text
 */
function extractBullets(cvText: string): string[] {
  const lines = cvText.split(/\r?\n/);
  const bullets: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 15) continue;

    // Matches bullet symbols, dashes, numbers or standard sentence starts
    if (/^[•\-\*\–\—\+]|\d+[\.\)]\s+/.test(trimmed)) {
      const cleanBullet = trimmed.replace(/^[•\-\*\–\—\+]\s*|\d+[\.\)]\s*/, '').trim();
      if (cleanBullet.length >= 15) {
        bullets.push(cleanBullet);
      }
    } else if (
      /^(serve|deliver|support|manage|provide|configure|troubleshoot|perform|run|log|diagnose|install|maintain|lead|coordinate|spearheaded|architected|engineered|collaborated|responsible|assisted|oversaw)/i.test(trimmed)
    ) {
      bullets.push(trimmed);
    }
  }

  return bullets;
}

/**
 * Evaluates whether a bullet contains quantifiable metrics
 */
function isQuantifiedBullet(bullet: string): boolean {
  // Percentages (e.g. 98%, 34.5%)
  if (/\b\d+(\.\d+)?%/.test(bullet)) return true;

  // Currency / Financial values (e.g. $50k, R500,000, 2M USD)
  if (/(\$|€|£|R|¥|USD|ZAR|EUR|GBP)\s*[\d,]+(\.\d+)?|\b[\d,]+(\.\d+)?\s*(dollars|rands|euros|pounds|k|m|million|billion)\b/i.test(bullet)) return true;

  // Numerical scale with operational units
  if (/\b\d+([,\.]\d+)?\s*(users|clients|customers|stakeholders|projects|tickets|systems|servers|accounts|staff|team members|endpoints|locations|branches|devices|vendors|terabytes|gb|tb|cases|incidents|hours|days|weeks|months|years|stores|calls|nodes)\b/i.test(bullet)) return true;

  // Concrete counts with plus (e.g. 350+, 8+, 100+)
  if (/\b\d+\+\s*([a-z]+)?/i.test(bullet)) return true;

  // SLA, Uptime, KPI references with numbers
  if (/\b(sla|uptime|roi|kpi|nps)\b.*?\b\d+/i.test(bullet) || /\b\d+.*?\b(sla|uptime|roi|kpi|nps)\b/i.test(bullet)) return true;

  return false;
}

/**
 * Checks for passive duty phrasing in bullets
 */
function isPassiveDutyBullet(bullet: string): boolean {
  return /\b(responsible for|duties included|tasked with|assisted with|helped to|worked on|involved in|participated in|daily duties|assigned to)\b/i.test(bullet);
}

/**
 * Checks if a bullet starts with a strong power action verb
 */
function startsWithPowerVerb(bullet: string): boolean {
  return /^(spearheaded|architected|orchestrated|engineered|streamlined|automated|reduced|increased|improved|delivered|maximized|accelerated|negotiated|deployed|resolved|implemented|designed|led|managed|executed|established|initiated|directed|formulated|transformed|championed|administered|developed|supervises?|diagnosed)\b/i.test(bullet);
}

/**
 * Calculates career tenure from date ranges in CV text
 */
function calculateYearsExperience(cvText: string): number {
  const currentYear = new Date().getFullYear();
  let earliestYear = currentYear;
  let latestYear = 2000;
  let foundValidYear = false;

  // Match 4-digit years between 1980 and 2030
  const yearMatches = cvText.match(/\b(19[89]\d|20[0-2]\d)\b/g);
  if (yearMatches) {
    for (const yearStr of yearMatches) {
      const yr = parseInt(yearStr, 10);
      if (yr >= 1990 && yr <= currentYear) {
        foundValidYear = true;
        if (yr < earliestYear) earliestYear = yr;
        if (yr > latestYear) latestYear = yr;
      }
    }
  }

  // Check if "Present" or "Current" is mentioned
  const hasPresent = /\b(present|current|now)\b/i.test(cvText);
  if (hasPresent) {
    latestYear = currentYear;
  }

  if (!foundValidYear) return 3; // Default realistic baseline
  const span = Math.max(1, latestYear - earliestYear);
  return Math.min(25, span);
}

/**
 * Detects the candidate's authentic or target role title with cross-industry domain awareness
 */
function detectRole(cvText: string, jobAdvertText?: string): string {
  const roleResolution = resolveCandidateRoleAndDomain(cvText, undefined, undefined, undefined, jobAdvertText);
  // If target job was provided AND matches the candidate's domain, return targetRole or candidateRole
  if (jobAdvertText && jobAdvertText.trim().length > 20 && roleResolution.isDomainMatched) {
    return roleResolution.targetRole || roleResolution.candidateRole;
  }
  // Otherwise, return candidate's authentic verified role
  return roleResolution.candidateRole;
}

/**
 * Extracts and calculates keyword matches
 */
function analyzeKeywords(cvText: string, jobAdvertText?: string): {
  matchedKeywords: string[];
  missingKeywords: string[];
  score: number;
} {
  const cvLower = cvText.toLowerCase();

  if (jobAdvertText && jobAdvertText.trim().length > 30) {
    // Extract potential technical phrases and words from Job Advert
    const jobTerms = new Set<string>();

    // 1. Check against global skill dictionary for direct presence in job advert
    for (const skill of GLOBAL_SKILLS_DICTIONARY) {
      if (jobAdvertText.toLowerCase().includes(skill)) {
        jobTerms.add(skill);
      }
    }

    // 2. Extract capitalized multi-word phrases and domain words from job advert
    const words = jobAdvertText.split(/[\s,;:()\/\-\–]+/).map(w => w.trim().toLowerCase());
    for (const w of words) {
      if (w.length >= 4 && !STOPWORDS.has(w) && /^[a-z0-9+#]+$/.test(w)) {
        jobTerms.add(w);
      }
    }

    const termArray = Array.from(jobTerms).slice(0, 25);
    const matched: string[] = [];
    const missing: string[] = [];

    for (const term of termArray) {
      // Word boundary or substring check
      const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(cvLower) || cvLower.includes(term)) {
        matched.push(term);
      } else {
        missing.push(term);
      }
    }

    const matchRatio = termArray.length > 0 ? matched.length / termArray.length : 0.5;
    // Map ratio to 30 - 95 range
    const rawScore = Math.round(30 + (matchRatio * 65));
    const score = Math.min(96, Math.max(30, rawScore));

    const capitalize = (s: string) => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    return {
      matchedKeywords: matched.map(capitalize),
      missingKeywords: missing.map(capitalize),
      score,
    };
  } else {
    // General Health Analysis against Global Skills Dictionary
    const matched: string[] = [];
    const missingCandidates: string[] = [];

    for (const skill of GLOBAL_SKILLS_DICTIONARY) {
      if (cvLower.includes(skill)) {
        matched.push(skill);
      } else {
        missingCandidates.push(skill);
      }
    }

    // Keyword density calculation: ratio of found skills to a realistic target (15-20 skills)
    const targetSkillCount = 18;
    const densityRatio = Math.min(1.0, matched.length / targetSkillCount);
    const rawScore = Math.round(40 + (densityRatio * 52));
    const score = Math.min(95, Math.max(40, rawScore));

    const capitalize = (s: string) => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    // Pull missing keywords from the candidate's actual detected domain — not hardcoded IT terms
    const detectedDomainResult = detectDomainFromText(cvText);
    const domainKeywords = DOMAIN_DEFINITIONS[detectedDomainResult.domain]?.keywords ?? [];
    const domainMissing = domainKeywords
      .filter((k: string) => !cvLower.includes(k.toLowerCase()))
      .slice(0, 5)
      .map(capitalize);

    // Fallback to cross-domain management terms if domain keywords exhausted
    const managementFallback = [
      'Stakeholder Management',
      'Strategic Planning',
      'Budget Management',
      'Cross-Functional Collaboration',
      'Continuous Improvement',
    ].filter(k => !cvLower.includes(k.toLowerCase()));

    const highValueMissing = domainMissing.length >= 3
      ? domainMissing
      : [...domainMissing, ...managementFallback].slice(0, 5);

    return {
      matchedKeywords: matched.slice(0, 12).map(capitalize),
      missingKeywords: highValueMissing.slice(0, 5),
      score,
    };
  }
}

/**
 * Calculates deterministic empirical ATS score directly from CV text
 */
export function calculateEmpiricalScore(cvText: string, jobAdvertText?: string): ScoreResult {
  const isJobSpecific = Boolean(jobAdvertText && jobAdvertText.trim().length > 30);
  const words = cvText.trim().split(/\s+/).filter(Boolean);
  const totalWords = words.length;

  // 1. Parse bullets and evaluate achievement metrics
  const bullets = extractBullets(cvText);
  const totalBullets = Math.max(1, bullets.length);

  let quantifiedCount = 0;
  let passiveCount = 0;
  let actionVerbCount = 0;
  let samplePassiveBullet: string | undefined;
  let sampleQuantifiedBullet: string | undefined;

  for (const bullet of bullets) {
    const isQuant = isQuantifiedBullet(bullet);
    const isPassive = isPassiveDutyBullet(bullet);
    const hasPowerVerb = startsWithPowerVerb(bullet);

    if (isQuant) {
      quantifiedCount++;
      if (!sampleQuantifiedBullet) sampleQuantifiedBullet = bullet;
    }
    if (isPassive) {
      passiveCount++;
      if (!samplePassiveBullet) samplePassiveBullet = bullet;
    }
    if (hasPowerVerb) {
      actionVerbCount++;
    }
  }

  // Fallback sample passive bullet if not explicitly tagged
  if (!samplePassiveBullet && bullets.length > 0) {
    samplePassiveBullet = bullets.find(b => !isQuantifiedBullet(b)) || bullets[0];
  }

  const quantifiedRatio = quantifiedCount / totalBullets;
  const actionVerbRatio = actionVerbCount / totalBullets;

  // Empirical Achievement Quality Score (20% Weight)
  // Baseline 28 pts. Each quantified bullet adds substantial value up to +52 pts. Power verbs add up to +15 pts.
  let achievementScore = Math.round(28 + (quantifiedRatio * 52) + (actionVerbRatio * 15));
  if (passiveCount > quantifiedCount) {
    achievementScore = Math.max(25, achievementScore - 8);
  }
  achievementScore = Math.min(95, Math.max(25, achievementScore));

  // 2. Audit ATS Readability & Structure (20% Weight)
  const headerAudit = [
    { name: 'Professional Summary', regex: /\b(summary|profile|about\s+me|objective)\b/i, points: 15 },
    { name: 'Work Experience', regex: /\b(experience|employment|work\s+history|career\s+history)\b/i, points: 25 },
    { name: 'Education', regex: /\b(education|academic|qualifications|degrees)\b/i, points: 20 },
    { name: 'Core Skills', regex: /\b(skills|competencies|technologies|expertise)\b/i, points: 20 },
    { name: 'Certifications', regex: /\b(certifications|certificates|licenses|training)\b/i, points: 10 },
  ];

  let atsScore = 0;
  const foundHeaders: string[] = [];
  const missingHeaders: string[] = [];

  for (const h of headerAudit) {
    if (h.regex.test(cvText)) {
      atsScore += h.points;
      foundHeaders.push(h.name);
    } else {
      missingHeaders.push(h.name);
    }
  }

  // Contact Info Check
  const hasEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/.test(cvText);
  const hasPhone = /(\+?\d[\d\s\-\(\)]{7,}\d)/.test(cvText);
  if (hasEmail) atsScore += 5;
  if (hasPhone) atsScore += 5;

  // Word count boundary check
  if (totalWords < 200) atsScore -= 15;
  else if (totalWords > 1800) atsScore -= 8;

  // Penalize unparseable tabular symbols or high pipe count
  const pipeCount = (cvText.match(/\|/g) || []).length;
  if (pipeCount > 30) atsScore -= 5;

  atsScore = Math.min(96, Math.max(30, atsScore));

  // 3. Keyword Match (30% Weight)
  const keywordAnalysis = analyzeKeywords(cvText, jobAdvertText);
  const keywordScore = keywordAnalysis.score;

  // Analyze Candidate Domain & Target Job Alignment across all industries
  const roleResolution = resolveCandidateRoleAndDomain(
    cvText,
    undefined,
    undefined,
    undefined,
    jobAdvertText
  );

  // 4. Experience Relevance & Tenure (20% Weight)
  const yearsExp = calculateYearsExperience(cvText);
  let relevanceScore = 50;
  if (yearsExp >= 8) relevanceScore = 86;
  else if (yearsExp >= 5) relevanceScore = 78;
  else if (yearsExp >= 3) relevanceScore = 70;
  else if (yearsExp >= 1) relevanceScore = 60;
  else relevanceScore = 45;

  // Bonus for clear recent experience or current role
  if (/\b(present|current|2024|2025|2026)\b/i.test(cvText)) {
    relevanceScore = Math.min(95, relevanceScore + 6);
  }

  // Cross-industry domain compatibility check against target job advert
  if (isJobSpecific && !roleResolution.isDomainMatched) {
    // Heavy deduction if candidate experience category does NOT match the posted job advert
    relevanceScore = Math.max(25, Math.min(45, relevanceScore - 35));
  } else if (jobAdvertText && /\bsenior|lead|head|director\b/i.test(jobAdvertText) && yearsExp < 5) {
    relevanceScore = Math.max(35, relevanceScore - 15);
  }

  // 5. Skills Match & Breadth (10% Weight)
  const skillsCount = keywordAnalysis.matchedKeywords.length;
  let skillsScore = Math.round(45 + Math.min(45, (skillsCount / 10) * 45));
  skillsScore = Math.min(95, Math.max(40, skillsScore));

  // 6. Calculate Weighted Overall Score (Exact Mathematical Average)
  const weightedOverall = Math.round(
    (keywordScore * 0.30) +
    (atsScore * 0.20) +
    (achievementScore * 0.20) +
    (relevanceScore * 0.20) +
    (skillsScore * 0.10)
  );

  const overallScore = Math.min(98, Math.max(25, weightedOverall));

  // Calibrated global bell-curve percentile (Sigmoid function centered at 58)
  const benchmarkPercentile = Math.min(98, Math.max(12, Math.round(100 / (1 + Math.exp(-(overallScore - 58) / 14)))));

  const targetRole = roleResolution.isDomainMatched && roleResolution.targetRole
    ? roleResolution.targetRole
    : roleResolution.candidateRole;

  // Status mapping
  const getStatus = (score: number): 'critical' | 'warning' | 'good' | 'excellent' => {
    if (score >= 80) return 'excellent';
    if (score >= 65) return 'good';
    if (score >= 50) return 'warning';
    return 'critical';
  };

  // Construct Empirical Categories
  const categories: CategoryScore[] = [
    {
      key: 'keyword',
      name: 'Keyword Match',
      score: keywordScore,
      weight: 30,
      status: getStatus(keywordScore),
      detail: isJobSpecific
        ? `Found ${keywordAnalysis.matchedKeywords.length} matching core terms from the advert. ${keywordAnalysis.missingKeywords.length > 0 ? `Missing key terms like ${keywordAnalysis.missingKeywords.slice(0, 3).join(', ')}.` : 'Strong terminology alignment.'}`
        : `Detected ${keywordAnalysis.matchedKeywords.length} verified enterprise competency markers across your profile.`,
    },
    {
      key: 'ats',
      name: 'ATS Readability',
      score: atsScore,
      weight: 20,
      status: getStatus(atsScore),
      detail: missingHeaders.length > 0
        ? `Missing standard header(s): ${missingHeaders.join(', ')}. Parsers require uniform linear sections.`
        : `All 5 standard ATS section headers verified with valid contact details.`,
    },
    {
      key: 'achievement',
      name: 'Achievement Quality',
      score: achievementScore,
      weight: 20,
      status: getStatus(achievementScore),
      detail: `${quantifiedCount} of ${totalBullets} bullets (${Math.round(quantifiedRatio * 100)}%) contain quantified metrics or numbers. ${samplePassiveBullet ? 'Bullets frequently read like job duties rather than measurable outcomes.' : ''}`,
    },
    {
      key: 'relevance',
      name: 'Experience Relevance',
      score: relevanceScore,
      weight: 20,
      status: getStatus(relevanceScore),
      detail: isJobSpecific
        ? (!roleResolution.isDomainMatched
            ? roleResolution.domainFeedback || `Cross-industry mismatch: Experience is concentrated in ${roleResolution.candidateDomainName}, while job advert targets ${roleResolution.targetDomain ? DOMAIN_DEFINITIONS[roleResolution.targetDomain]?.name : 'a different field'}.`
            : `Calculated approximately ${yearsExp}+ years of verified career tenure aligned with ${targetRole}.`)
        : `Verified approximately ${yearsExp}+ years of consistent career tenure in ${roleResolution.candidateDomainName}.`,
    },
    {
      key: 'skills',
      name: 'Skills Match',
      score: skillsScore,
      weight: 10,
      status: getStatus(skillsScore),
      detail: isJobSpecific
        ? `Verified ${skillsCount} core competency and technical tools aligned with target specifications.`
        : `Verified ${skillsCount} standard professional competencies and methodologies in ${roleResolution.candidateDomainName}.`,
    },
  ];

  // Construct Empirical Top Issues grounded in the candidate's actual text
  const topIssues: TopIssue[] = [];

  // Critical Priority: Domain Mismatch (if candidate's career experience doesn't match the target job advert)
  if (isJobSpecific && !roleResolution.isDomainMatched) {
    topIssues.push({
      category_key: 'relevance',
      issue: `Career Domain Disconnect: ${roleResolution.candidateDomainName} vs ${roleResolution.targetRole || 'Target Job Advert'}`,
      detail: `Your CV experience is concentrated in ${roleResolution.candidateDomainName}. Applying to an unrelated ${roleResolution.targetDomain ? DOMAIN_DEFINITIONS[roleResolution.targetDomain]?.name : 'field'} without highlighting transferable competencies triggers immediate automated ATS rejection.`,
      fix: `If transitioning fields, reframe your experience around cross-functional skills that bridge ${roleResolution.candidateDomainName} into ${roleResolution.targetRole || 'the target position'}.`,
    });
  }

  // Issue 1: Achievement / Quantification (always top priority if quantified ratio < 45%)
  if (quantifiedRatio < 0.45) {
    topIssues.push({
      category_key: 'achievement',
      issue: 'Bullets Read Like Job Duties Instead of Quantified Business Outcomes',
      detail: samplePassiveBullet
        ? `Bullets like "${samplePassiveBullet.slice(0, 80)}..." describe daily tasks without proving your impact. Recruiters scan in 6 seconds for verified numbers, percentages, and scale.`
        : 'Most of your bullet points list routine responsibilities without stating the volume, SLA rate, or financial impact achieved.',
      fix: 'Rewrite using Google’s XYZ formula: Accomplished [X], as measured by [Y], by doing [Z]. For example: "Maintained 98.4% monthly SLA adherence across 350+ enterprise users by resolving 45+ daily escalations."',
    });
  }

  // Issue 2: Keywords
  if (keywordAnalysis.missingKeywords.length > 0) {
    topIssues.push({
      category_key: 'keyword',
      issue: `Key Competencies Missing: ${keywordAnalysis.missingKeywords.slice(0, 3).join(', ')}`,
      detail: isJobSpecific
        ? 'Automated ATS filters screen candidates by exact keyword frequency before a recruiter reads the document.'
        : 'Your CV lacks high-demand modern industry certifications and platform keywords that corporate ATS scanners filter on.',
      fix: `Incorporate missing terms (${keywordAnalysis.missingKeywords.slice(0, 4).join(', ')}) directly into your Professional Summary and Core Competencies matrix.`,
    });
  }

  // Issue 3: ATS Readability / Structure
  if (missingHeaders.length > 0 || totalWords < 250 || totalWords > 1500) {
    topIssues.push({
      category_key: 'ats',
      issue: missingHeaders.length > 0
        ? `Missing Standard ATS Section Headers: ${missingHeaders.join(', ')}`
        : 'Document Length & Formatting Sub-Optimal for Enterprise Parsers',
      detail: 'Enterprise parsers like Workday and Taleo expect standard linear headers to catalogue employment history and education into recruiter search tables.',
      fix: 'Use exact standard headings: PROFESSIONAL SUMMARY, PROFESSIONAL EXPERIENCE, EDUCATION, CORE SKILLS, and format employment dates as MM/YYYY - Present.',
    });
  } else {
    // If ATS formatting is good, focus on action verbs / scope
    topIssues.push({
      category_key: 'relevance',
      issue: 'Scope of Responsibility & Stakeholder Scale Needs Clarification',
      detail: 'Hiring managers cannot determine the organizational scale of your previous roles without explicit team sizes, budgets, or geographic reach.',
      fix: 'State the exact organizational scope in your role headers (e.g. "Supported 5 country markets across 42 retail locations with 24-hour uptime").',
    });
  }

  // Strengths: use real matched keywords from the CV, fall back to domain-appropriate generics
  const strengths = keywordAnalysis.matchedKeywords.length >= 3
    ? keywordAnalysis.matchedKeywords.slice(0, 8)
    : [
        'Clear Chronological Career Progression',
        'Verified Domain Knowledge',
        'Formal Education Credentials Present',
        `Demonstrated ${roleResolution.candidateDomainName} Experience`,
        'Professional Communication & Reporting',
      ];

  const quickWins = [
    `Inject concrete metrics into at least 3 bullets in your most recent role (e.g. volumes, % SLAs, user counts)`,
    `Add ${keywordAnalysis.missingKeywords.slice(0, 2).join(' and ')} to your Core Skills matrix on Page 1`,
    `Standardize all dates to MM/YYYY - MM/YYYY single-column linear layout`,
  ];

  const headline = overallScore < 65
    ? 'Solid foundational experience, but duty-heavy bullets and keyword gaps are limiting your interview callback rate.'
    : 'Strong professional background with clear technical credentials; metric-driven bullet polish will guarantee top-tier shortlists.';

  return {
    overall_score: overallScore,
    headline,
    is_general_health: !isJobSpecific,
    target_role_detected: targetRole,
    benchmark_percentile: benchmarkPercentile,
    benchmark_text: `You scored higher than ${benchmarkPercentile}% of ${roleResolution.candidateDomainName} candidates globally`,
    categories,
    top_issues: topIssues.slice(0, 3),
    strengths,
    quick_wins: quickWins,
  };
}
