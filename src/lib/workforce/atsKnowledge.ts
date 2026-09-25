/**
 * CheckMyCV ATS Knowledge & Parsing Rules Engine
 * Encapsulates concrete parsing mechanics, heuristics, and formatting rules
 * for the world's most widely deployed enterprise ATS platforms.
 */

import { AtsEngineName } from './types';

export interface AtsRulesProfile {
  name: AtsEngineName;
  marketShareTier: 'Enterprise Fortune 500' | 'High-Growth Tech' | 'Mid-Market & Global';
  parserType: 'Strict Linear OCR' | 'Token Tree Semantic' | 'Hybrid Semantic Keyword' | 'Relational Tagging';
  standardHeadings: string[];
  dateRequirements: string;
  tablePolicy: string;
  columnsPolicy: string;
  keywordMatchingStrategy: string;
  scoringPitfalls: string[];
  promptInstructions: string;
}

export const ATS_PROFILES: Record<AtsEngineName, AtsRulesProfile> = {
  Workday: {
    name: 'Workday',
    marketShareTier: 'Enterprise Fortune 500',
    parserType: 'Strict Linear OCR',
    standardHeadings: [
      'WORK EXPERIENCE',
      'EDUCATION',
      'SKILLS',
      'CERTIFICATIONS',
      'SUMMARY',
    ],
    dateRequirements: 'Requires MM/YYYY - MM/YYYY or MM/YYYY - Present. Fails on seasonal dates like "Summer 2021".',
    tablePolicy: 'STRICT ZERO-TOLERANCE: Workday OCR flattens tables horizontally, interweaving text across columns and corrupting experience order.',
    columnsPolicy: 'Strict Single Column Only. Multi-column CVs scramble job titles into company names.',
    keywordMatchingStrategy: 'Verbatim keyword presence + semantic variant support. Weights exact job title matching heavily in candidate ranking.',
    scoringPitfalls: [
      'Using text boxes or header/footer ribbons (Workday strips header/footer zones)',
      'Creative section titles like "What I Do" instead of "WORK EXPERIENCE"',
      'Images, logos, or icon fonts (rendered as unreadable Unicode garbage)',
    ],
    promptInstructions: `
Evaluate against Workday enterprise parsing criteria:
- Workday relies on linear optical parsing. Penalize any tables, columns, or non-standard symbols.
- Verify section headers match exact enterprise conventions: SUMMARY, WORK EXPERIENCE, EDUCATION, SKILLS, CERTIFICATIONS.
- Validate employment dates follow MM/YYYY or YYYY format.
- Ensure job titles echo the target role for maximum Workday recruiter match scoring.`,
  },

  Greenhouse: {
    name: 'Greenhouse',
    marketShareTier: 'High-Growth Tech',
    parserType: 'Token Tree Semantic',
    standardHeadings: [
      'EXPERIENCE',
      'EDUCATION',
      'SKILLS',
      'SUMMARY',
      'PROJECTS',
    ],
    dateRequirements: 'Flexible YYYY - YYYY or Month YYYY.',
    tablePolicy: 'Tables are converted into plain text strings. Complex nested tables lose cell boundaries.',
    columnsPolicy: 'Single column preferred; dual column parses reasonably well if clean tab stops exist.',
    keywordMatchingStrategy: 'Weighted skill token frequency and proximity to recent work experience entries.',
    scoringPitfalls: [
      'Keyword stuffing in white text (Greenhouse flags hidden text as high-risk spam)',
      'Skills listed without demonstrable usage inside experience bullets',
      'Missing LinkedIn or GitHub hyperlinks in contact section',
    ],
    promptInstructions: `
Evaluate against Greenhouse modern tech parsing criteria:
- Greenhouse parses candidate skills and checks their context in recent job history.
- Emphasize technical tool proficiency, modern frameworks, and measurable outcomes.
- Reward strong GitHub/LinkedIn presence and clean project highlights.`,
  },

  Lever: {
    name: 'Lever',
    marketShareTier: 'High-Growth Tech',
    parserType: 'Relational Tagging',
    standardHeadings: [
      'EXPERIENCE',
      'EDUCATION',
      'SKILLS',
      'PROFILE',
    ],
    dateRequirements: 'Month Year or Year.',
    tablePolicy: 'Low tolerance for decorative tables; parses rows sequentially.',
    columnsPolicy: 'Single column recommended to preserve chronological company sequence.',
    keywordMatchingStrategy: 'Direct competency tagging. Generates candidate tags based on hard skills and titles.',
    scoringPitfalls: [
      'Missing core role tags (e.g. "React", "TypeScript", "AWS")',
      'Unstructured lists without clear categorical delineation',
    ],
    promptInstructions: `
Evaluate against Lever modern ATS rules:
- Lever automatically extracts tags for recruiters to search candidates by taxonomy.
- Ensure hard skills, programming languages, and industry methodologies are organized into prominent tags.`,
  },

  Taleo: {
    name: 'Taleo',
    marketShareTier: 'Enterprise Fortune 500',
    parserType: 'Strict Linear OCR',
    standardHeadings: [
      'PROFESSIONAL EXPERIENCE',
      'EDUCATION',
      'CORE COMPETENCIES',
      'SUMMARY',
    ],
    dateRequirements: 'Strict MM/YYYY - MM/YYYY. Chronological order must be unbroken.',
    tablePolicy: 'CRITICAL FAILURE: Taleo breaks down completely on tables or graphical callouts.',
    columnsPolicy: 'Single column strictly mandated. Two columns results in immediate parsing truncation.',
    keywordMatchingStrategy: 'Strict verbatim density percentage matching against job posting requisition.',
    scoringPitfalls: [
      'Any non-standard font (stick to Arial, Calibri, Times New Roman, Helvetica)',
      'Missing exact keyword phrasing from job advert',
      'Symbols other than standard hyphens or circular bullet dots',
    ],
    promptInstructions: `
Evaluate against Oracle Taleo legacy enterprise criteria:
- Taleo requires exact keyword match density and strict single-column typography.
- Standard headings are strictly mandatory: PROFESSIONAL EXPERIENCE, EDUCATION, CORE COMPETENCIES.
- Heavily penalize any unusual characters, symbols, or modern layout tricks.`,
  },

  Ashby: {
    name: 'Ashby',
    marketShareTier: 'High-Growth Tech',
    parserType: 'Hybrid Semantic Keyword',
    standardHeadings: [
      'EXPERIENCE',
      'EDUCATION',
      'SKILLS',
      'SUMMARY',
    ],
    dateRequirements: 'Modern date parsing with intelligent span recognition.',
    tablePolicy: 'Modern parser handles basic tables, but linear bullets produce higher recruiter score.',
    columnsPolicy: 'Modern multi-column tolerated, single-column yields highest readability index.',
    keywordMatchingStrategy: 'Semantic embeddings combined with seniority level and tenure matching.',
    scoringPitfalls: [
      'Passive duty statements without quantified business metrics',
      'Unclear company size or scope indicators',
    ],
    promptInstructions: `
Evaluate against Ashby modern recruiter-first parsing:
- Ashby prioritizes candidate achievements, velocity, and metric-backed impact.
- Look for Google XYZ formula compliance, speed of promotion, and concrete project scope.`,
  },

  BambooHR: {
    name: 'BambooHR',
    marketShareTier: 'Mid-Market & Global',
    parserType: 'Hybrid Semantic Keyword',
    standardHeadings: [
      'WORK EXPERIENCE',
      'EDUCATION',
      'SKILLS',
      'SUMMARY',
    ],
    dateRequirements: 'Standard month and year.',
    tablePolicy: 'Tables flattened into sequential paragraphs.',
    columnsPolicy: 'Single column recommended.',
    keywordMatchingStrategy: 'Keyword filter screening and recruiter review scorecard.',
    scoringPitfalls: [
      'Missing direct contact information in plain text',
      'Oversized PDF file or scanned image PDF (must be text-selectable)',
    ],
    promptInstructions: `
Evaluate against BambooHR mid-market ATS standards:
- Focus on clean contact integrity, linear work experience, and core credential verification.`,
  },

  Generic: {
    name: 'Generic',
    marketShareTier: 'Mid-Market & Global',
    parserType: 'Strict Linear OCR',
    standardHeadings: [
      'PROFESSIONAL SUMMARY',
      'WORK EXPERIENCE',
      'EDUCATION',
      'CORE SKILLS',
      'CERTIFICATIONS',
    ],
    dateRequirements: 'MM/YYYY - Present or YYYY - YYYY.',
    tablePolicy: 'Zero tables to maintain universal compatibility across all 50+ known ATS engines.',
    columnsPolicy: 'Single column only for universal parser pass-rate.',
    keywordMatchingStrategy: 'Balanced keyword matching across core competency dictionary and job advert.',
    scoringPitfalls: [
      'Multi-column formats, non-standard section headers, unquantified bullets.',
    ],
    promptInstructions: `
Evaluate against universal worldwide ATS baseline standards:
- Single-column linear layout, standard enterprise headers, 100% text selectability.
- Balance ATS keyword pass-rates with human executive recruiter engagement.`,
  },
};

/**
 * Returns ATS-specific parsing knowledge guidelines for prompt injection
 */
export function getAtsRulesKnowledge(atsName: AtsEngineName): AtsRulesProfile {
  return ATS_PROFILES[atsName] || ATS_PROFILES.Generic;
}
