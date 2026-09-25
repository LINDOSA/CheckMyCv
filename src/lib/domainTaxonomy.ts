/**
 * Universal Industry Domain Taxonomy & Role Detection Engine
 * Accurately classifies candidate CVs across 13 major industries,
 * extracts authentic role titles from header or experience,
 * and detects domain compatibility against target job postings.
 */

export type JobDomain =
  | 'administration'
  | 'finance_accounting'
  | 'healthcare_nursing'
  | 'sales_retail_customer'
  | 'human_resources'
  | 'education_teaching'
  | 'legal_compliance'
  | 'logistics_supply_chain'
  | 'engineering_technical'
  | 'information_technology'
  | 'hospitality_culinary'
  | 'marketing_creative'
  | 'operations_management'
  | 'general_professional';

export interface DomainDefinition {
  id: JobDomain;
  name: string;
  defaultTitle: string;
  rolePattern: RegExp;
  keywords: string[];
}

export const DOMAIN_DEFINITIONS: Record<JobDomain, DomainDefinition> = {
  administration: {
    id: 'administration',
    name: 'Administration & Office Support',
    defaultTitle: 'Administrative Professional',
    rolePattern: /\b(executive\s+assistant|personal\s+assistant|office\s+administrator|office\s+manager|administrative\s+assistant|receptionist|secretary|data\s+entry\s+clerk|office\s+clerk|front\s+desk\s+coordinator|project\s+administrator|virtual\s+assistant|clerk|admin\s+officer|typist)\b/i,
    keywords: [
      'administration', 'administrative', 'office administration', 'executive support',
      'diary management', 'scheduling', 'calendar management', 'records management',
      'travel arrangements', 'travel coordination', 'filing', 'correspondence',
      'minutes of meetings', 'transcription', 'data entry', 'clerical', 'switchboard',
      'reception', 'office supplies', 'procurement', 'front desk', 'invoicing',
      'billing', 'customer liaison', 'office coordination', 'document management',
      'microsoft office', 'ms excel', 'ms word', 'outlook', 'powerpoint'
    ]
  },
  finance_accounting: {
    id: 'finance_accounting',
    name: 'Accounting, Finance & Banking',
    defaultTitle: 'Financial Professional',
    rolePattern: /\b(chartered\s+accountant|senior\s+accountant|accountant|financial\s+accountant|management\s+accountant|bookkeeper|financial\s+analyst|auditor|internal\s+auditor|external\s+auditor|tax\s+consultant|payroll\s+specialist|payroll\s+officer|credit\s+controller|finance\s+manager|financial\s+controller|accounts\s+payable|accounts\s+receivable|treasury\s+analyst|actuary|cfo)\b/i,
    keywords: [
      'accounting', 'finance', 'financial reporting', 'ifrs', 'gaap', 'general ledger',
      'balance sheet', 'trial balance', 'income statement', 'tax', 'sars', 'corporate tax',
      'vat', 'paye', 'payroll', 'internal audit', 'external audit', 'audit compliance',
      'accounts payable', 'accounts receivable', 'bank reconciliation', 'ledger',
      'cash flow', 'cash flow forecasting', 'variance analysis', 'budgeting',
      'financial modeling', 'caseware', 'pastel', 'sage', 'sap', 'quickbooks', 'xero'
    ]
  },
  healthcare_nursing: {
    id: 'healthcare_nursing',
    name: 'Healthcare & Medical Services',
    defaultTitle: 'Healthcare Professional',
    rolePattern: /\b(registered\s+nurse|staff\s+nurse|professional\s+nurse|enrolled\s+nurse|clinical\s+nurse|head\s+nurse|nursing\s+sister|midwife|caregiver|healthcare\s+assistant|medical\s+officer|doctor|general\s+practitioner|physician|pharmacist|pharmacy\s+assistant|physiotherapist|radiographer|paramedic|phlebotomist|clinical\s+coordinator)\b/i,
    keywords: [
      'patient care', 'nursing', 'clinical assessment', 'triage', 'vital signs',
      'medication administration', 'infection control', 'wound care', 'catheterization',
      'iv therapy', 'acute care', 'icu', 'trauma', 'pediatric', 'ward', 'hospital',
      'clinic', 'sanc', 'basic life support', 'bls', 'acls', 'patient records',
      'phlebotomy', 'medical terminology', 'hospice', 'palliative care', 'sterilization'
    ]
  },
  sales_retail_customer: {
    id: 'sales_retail_customer',
    name: 'Sales, Retail & Customer Service',
    defaultTitle: 'Sales & Customer Specialist',
    rolePattern: /\b(sales\s+representative|sales\s+executive|account\s+manager|business\s+development|retail\s+sales|sales\s+consultant|cashier|store\s+manager|assistant\s+store\s+manager|customer\s+service\s+representative|call\s+centre\s+agent|customer\s+care\s+consultant|client\s+relationship|teller|merchandiser|sales\s+associate)\b/i,
    keywords: [
      'sales', 'retail', 'customer service', 'client relationship', 'account management',
      'lead generation', 'cold calling', 'sales targets', 'merchandising', 'point of sale',
      'pos', 'cash handling', 'till operation', 'customer satisfaction', 'csat',
      'complaint resolution', 'query resolution', 'client retention', 'upselling',
      'cross-selling', 'call center', 'inbound calls', 'outbound calls', 'crm', 'salesforce'
    ]
  },
  human_resources: {
    id: 'human_resources',
    name: 'Human Resources & Recruitment',
    defaultTitle: 'Human Resources Professional',
    rolePattern: /\b(human\s+resources\s+officer|hr\s+manager|hr\s+generalist|hr\s+business\s+partner|talent\s+acquisition|recruiter|recruitment\s+consultant|training\s+and\s+development|hr\s+officer|hr\s+assistant|people\s+and\s+culture|labor\s+relations\s+officer)\b/i,
    keywords: [
      'human resources', 'recruitment', 'talent acquisition', 'onboarding',
      'employee relations', 'performance management', 'labor relations', 'ccma',
      'bcea', 'employment equity', 'disciplinary hearings', 'hr policies',
      'compensation and benefits', 'succession planning', 'workday', 'hris', 'training'
    ]
  },
  education_teaching: {
    id: 'education_teaching',
    name: 'Education, Teaching & Academics',
    defaultTitle: 'Educator & Academic Professional',
    rolePattern: /\b(teacher|primary\s+school\s+teacher|high\s+school\s+teacher|educator|lecturer|senior\s+lecturer|professor|assistant\s+professor|tutor|academic\s+instructor|school\s+principal|deputy\s+principal|education\s+specialist|curriculum\s+planner)\b/i,
    keywords: [
      'teaching', 'educator', 'classroom management', 'curriculum development',
      'lesson planning', 'student assessment', 'pedagogy', 'pedagogical', 'marking',
      'exams', 'learners', 'academic', 'sace', 'e-learning', 'instructional design',
      'tutoring', 'parent communication', 'special needs', 'inclusive education'
    ]
  },
  legal_compliance: {
    id: 'legal_compliance',
    name: 'Legal, Compliance & Regulatory',
    defaultTitle: 'Legal & Compliance Specialist',
    rolePattern: /\b(legal\s+advisor|legal\s+counsel|corporate\s+attorney|lawyer|advocate|attorney|paralegal|compliance\s+officer|legal\s+officer|contracts\s+specialist|legal\s+secretary)\b/i,
    keywords: [
      'legal', 'litigation', 'contracts', 'contract drafting', 'compliance',
      'regulatory compliance', 'due diligence', 'corporate governance', 'statutes',
      'legal research', 'risk assessment', 'dispute resolution', 'policy formulation'
    ]
  },
  logistics_supply_chain: {
    id: 'logistics_supply_chain',
    name: 'Supply Chain, Logistics & Transport',
    defaultTitle: 'Logistics & Supply Chain Specialist',
    rolePattern: /\b(logistics\s+coordinator|supply\s+chain\s+manager|warehouse\s+supervisor|warehouse\s+manager|inventory\s+controller|procurement\s+specialist|procurement\s+officer|dispatch\s+manager|fleet\s+coordinator|delivery\s+driver|forklift\s+operator|logistics\s+officer|stock\s+controller)\b/i,
    keywords: [
      'supply chain', 'logistics', 'warehouse', 'warehousing', 'inventory',
      'inventory management', 'procurement', 'stock control', 'freight', 'shipping',
      'dispatch', 'fleet management', 'distribution', 'route planning', '3pl',
      'erp', 'purchase orders', 'goods receiving', 'material handling'
    ]
  },
  engineering_technical: {
    id: 'engineering_technical',
    name: 'Engineering, Construction & Technical',
    defaultTitle: 'Engineering Professional',
    rolePattern: /\b(civil\s+engineer|mechanical\s+engineer|electrical\s+engineer|project\s+engineer|site\s+agent|construction\s+supervisor|safety\s+officer|hse\s+officer|sheq\s+coordinator|quantity\s+surveyor|draughtsman|instrumentation\s+technician|maintenance\s+technician|artisan)\b/i,
    keywords: [
      'engineering', 'civil engineering', 'mechanical', 'electrical', 'autocad',
      'construction', 'site supervision', 'quality assurance', 'qa/qc', 'safety',
      'sheq', 'hse', 'osh act', 'risk assessments', 'preventative maintenance',
      'fault finding', 'surveying', 'blueprints', 'structural analysis'
    ]
  },
  information_technology: {
    id: 'information_technology',
    name: 'Information Technology & Software',
    defaultTitle: 'IT Professional',
    rolePattern: /\b(software\s+engineer|software\s+developer|full\s+stack|systems\s+administrator|it\s+support|cloud\s+engineer|devops|network\s+engineer|database\s+administrator|data\s+analyst|cybersecurity|solutions\s+architect|it\s+technician|helpdesk|desktop\s+support)\b/i,
    keywords: [
      'software development', 'cloud', 'aws', 'azure', 'active directory', 'entra id',
      'windows server', 'linux', 'networking', 'cybersecurity', 'sql', 'python',
      'javascript', 'powershell', 'service desk', 'itil', 'troubleshooting',
      'hardware diagnostics', 'api', 'infrastructure', 'desktop support'
    ]
  },
  hospitality_culinary: {
    id: 'hospitality_culinary',
    name: 'Hospitality, Culinary & Tourism',
    defaultTitle: 'Hospitality Specialist',
    rolePattern: /\b(head\s+chef|sous\s+chef|pastry\s+chef|chef|cook|restaurant\s+manager|hospitality\s+manager|food\s+and\s+beverage|f&b\s+supervisor|hotel\s+receptionist|bartender|waiter|front\s+of\s+house)\b/i,
    keywords: [
      'hospitality', 'culinary', 'kitchen management', 'food preparation', 'food safety',
      'haccp', 'menu planning', 'guest service', 'hotel', 'restaurant', 'catering',
      'cost control', 'stock management', 'front of house', 'banquet'
    ]
  },
  marketing_creative: {
    id: 'marketing_creative',
    name: 'Marketing, Media & Communications',
    defaultTitle: 'Marketing & Creative Specialist',
    rolePattern: /\b(marketing\s+manager|digital\s+marketing|content\s+creator|social\s+media\s+manager|copywriter|graphic\s+designer|brand\s+manager|seo\s+specialist|pr\s+specialist|communications\s+officer)\b/i,
    keywords: [
      'marketing', 'digital marketing', 'social media', 'content creation', 'copywriting',
      'branding', 'graphic design', 'seo', 'sem', 'campaign management',
      'google analytics', 'email marketing', 'public relations', 'press releases'
    ]
  },
  operations_management: {
    id: 'operations_management',
    name: 'Operations & General Management',
    defaultTitle: 'Operations Professional',
    rolePattern: /\b(operations\s+manager|general\s+manager|branch\s+manager|managing\s+director|coo|operations\s+coordinator|business\s+manager|team\s+leader|production\s+supervisor)\b/i,
    keywords: [
      'operations management', 'operational excellence', 'process optimization',
      'workflow improvement', 'kpis', 'resource allocation', 'budget oversight',
      'team leadership', 'stakeholder management', 'change management', 'sop'
    ]
  },
  general_professional: {
    id: 'general_professional',
    name: 'General Professional',
    defaultTitle: 'Experienced Professional',
    rolePattern: /\b(manager|specialist|officer|coordinator|consultant|supervisor|lead|associate|representative|practitioner)\b/i,
    keywords: [
      'project management', 'communication', 'collaboration', 'stakeholder engagement',
      'problem solving', 'reporting', 'process improvement', 'teamwork'
    ]
  }
};

/**
 * Detect the candidate's primary industry domain by analyzing CV content.
 */
export function detectDomainFromText(text: string): {
  domain: JobDomain;
  domainName: string;
  confidence: number;
  matchedKeywords: string[];
} {
  if (!text || text.trim().length === 0) {
    return {
      domain: 'general_professional',
      domainName: DOMAIN_DEFINITIONS.general_professional.name,
      confidence: 0,
      matchedKeywords: [],
    };
  }

  const lower = text.toLowerCase();
  const scores: Record<JobDomain, { score: number; matches: string[] }> = {
    administration: { score: 0, matches: [] },
    finance_accounting: { score: 0, matches: [] },
    healthcare_nursing: { score: 0, matches: [] },
    sales_retail_customer: { score: 0, matches: [] },
    human_resources: { score: 0, matches: [] },
    education_teaching: { score: 0, matches: [] },
    legal_compliance: { score: 0, matches: [] },
    logistics_supply_chain: { score: 0, matches: [] },
    engineering_technical: { score: 0, matches: [] },
    information_technology: { score: 0, matches: [] },
    hospitality_culinary: { score: 0, matches: [] },
    marketing_creative: { score: 0, matches: [] },
    operations_management: { score: 0, matches: [] },
    general_professional: { score: 0, matches: [] },
  };

  for (const [key, def] of Object.entries(DOMAIN_DEFINITIONS) as [JobDomain, DomainDefinition][]) {
    if (def.rolePattern.test(text)) {
      scores[key].score += 15;
    }

    for (const kw of def.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        scores[key].score += 3;
        scores[key].matches.push(kw);
      }
    }
  }

  let bestDomain: JobDomain = 'general_professional';
  let maxScore = -1;

  for (const [key, val] of Object.entries(scores) as [JobDomain, { score: number; matches: string[] }][]) {
    if (key === 'general_professional') continue;
    if (val.score > maxScore) {
      maxScore = val.score;
      bestDomain = key;
    }
  }

  if (maxScore < 4) {
    bestDomain = 'general_professional';
  }

  return {
    domain: bestDomain,
    domainName: DOMAIN_DEFINITIONS[bestDomain].name,
    confidence: maxScore,
    matchedKeywords: scores[bestDomain].matches,
  };
}

/**
 * Extracts candidate's explicit professional headline from their CV header lines.
 */
export function extractHeadlineFromHeader(
  headerLines: string[],
  candidateName: string
): string | null {
  if (!headerLines || headerLines.length === 0) return null;

  for (let i = 0; i < Math.min(8, headerLines.length); i++) {
    const raw = headerLines[i].replace(/^[#*\-•\s]+/, '').trim();
    if (!raw) continue;

    if (candidateName && raw.toLowerCase() === candidateName.toLowerCase()) continue;
    if (raw.includes('@') || /https?:\/\/|www\./i.test(raw)) continue;
    if (/(?:tel:|phone:|mobile:|cell:|\+?\d{8,})/i.test(raw)) continue;
    if (/(?:curriculum vitae|resume|cv|contact details|personal profile|address|street|avenue|road|p\.?o\.?\s*box)/i.test(raw)) continue;
    if (/(?:date of birth|dob|id number|nationality|citizenship|driver's licence|gender)/i.test(raw)) continue;
    if (/\b(19\d\d|20\d\d)\b/.test(raw) && raw.length < 20) continue;

    if (raw.length >= 4 && raw.length <= 65) {
      const hasRoleMarker = /(assistant|administrator|manager|coordinator|officer|specialist|analyst|engineer|developer|technician|consultant|nurse|doctor|accountant|auditor|bookkeeper|teacher|lecturer|supervisor|representative|advisor|counsel|director|lead|clerk|cashier|artisan|executive)/i.test(raw);
      if (hasRoleMarker) {
        return raw;
      }
    }
  }

  return null;
}

/**
 * Extracts candidate's most recent position title from their experience lines.
 */
export function extractRoleFromExperienceLines(expLines: string[]): string | null {
  if (!expLines || expLines.length === 0) return null;

  const DATE_REGEX = /\b((?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[a-z]*\.?\s+\d{4}|\d{1,2}\/\d{4}|\d{4})\s*(?:-|–|—|to)\s*((?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[a-z]*\.?\s+\d{4}|\d{1,2}\/\d{4}|\d{4}|present|current)\b/i;

  for (let i = 0; i < Math.min(12, expLines.length); i++) {
    const line = expLines[i].replace(/^[#*\-•\s]+/, '').trim();
    if (!line || line.length < 4 || line.length > 80) continue;

    if (/^[-•*–—\d.]+\s*/.test(line) && !DATE_REGEX.test(line)) continue;

    const hasRoleMarker = /(assistant|administrator|manager|coordinator|officer|specialist|analyst|engineer|developer|technician|consultant|nurse|doctor|accountant|auditor|bookkeeper|teacher|lecturer|supervisor|representative|advisor|counsel|director|lead|clerk|cashier|artisan|executive|driver|operator)/i.test(line);

    if (hasRoleMarker) {
      let roleTitle = line.replace(DATE_REGEX, '').replace(/[|–—]/g, ' ').trim();
      if (/\sat\s/i.test(roleTitle)) {
        roleTitle = roleTitle.split(/\sat\s/i)[0].trim();
      } else if (roleTitle.includes(' - ')) {
        roleTitle = roleTitle.split(' - ')[0].trim();
      } else if (roleTitle.includes(',')) {
        roleTitle = roleTitle.split(',')[0].trim();
      }
      if (roleTitle.length >= 4 && roleTitle.length <= 60) {
        return roleTitle;
      }
    }
  }

  return null;
}

/**
 * Universal Role & Domain Resolution Engine:
 * Reads through the candidate's CV, identifies their authentic professional title and domain,
 * evaluates target job alignment, and flags irrelevant/mismatched job postings.
 */
export function resolveCandidateRoleAndDomain(
  cvText: string,
  headerLines: string[] = [],
  candidateName: string = '',
  experienceLines: string[] = [],
  targetJobAdvert?: string
): {
  candidateRole: string;
  candidateDomain: JobDomain;
  candidateDomainName: string;
  targetRole?: string;
  targetDomain?: JobDomain;
  isDomainMatched: boolean;
  domainFeedback?: string;
} {
  const cvDomainResult = detectDomainFromText(cvText);
  const candidateDomain = cvDomainResult.domain;
  const candidateDomainName = cvDomainResult.domainName;

  let candidateRole = extractHeadlineFromHeader(headerLines, candidateName);

  if (!candidateRole) {
    candidateRole = extractRoleFromExperienceLines(experienceLines);
  }

  if (!candidateRole || candidateRole.length < 3) {
    candidateRole = DOMAIN_DEFINITIONS[candidateDomain].defaultTitle;
  }

  if (!targetJobAdvert || targetJobAdvert.trim().length < 20) {
    return {
      candidateRole,
      candidateDomain,
      candidateDomainName,
      isDomainMatched: true,
    };
  }

  const jobDomainResult = detectDomainFromText(targetJobAdvert);
  const targetDomain = jobDomainResult.domain;

  let targetRole: string | undefined = undefined;
  const jobLines = targetJobAdvert.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  for (const line of jobLines.slice(0, 4)) {
    if (line.length > 4 && line.length < 60 && !/(about|company|description|location|requirements|overview)/i.test(line)) {
      targetRole = line.replace(/^(?:job\s+title|position|role|target\s+role)[:\-]\s*/i, '').trim();
      break;
    }
  }

  const isCompatible =
    candidateDomain === targetDomain ||
    candidateDomain === 'general_professional' ||
    targetDomain === 'general_professional' ||
    (candidateDomain === 'administration' && targetDomain === 'operations_management') ||
    (candidateDomain === 'operations_management' && targetDomain === 'administration') ||
    (candidateDomain === 'sales_retail_customer' && targetDomain === 'marketing_creative') ||
    (candidateDomain === 'finance_accounting' && targetDomain === 'operations_management') ||
    (candidateDomain === 'engineering_technical' && targetDomain === 'information_technology') ||
    (candidateDomain === 'information_technology' && targetDomain === 'engineering_technical');

  let domainFeedback: string | undefined = undefined;
  if (!isCompatible) {
    domainFeedback = `Domain Discrepancy: Your verified career background is in ${candidateDomainName}, whereas the target job advert is for ${DOMAIN_DEFINITIONS[targetDomain].name} (${targetRole || 'Target Role'}). Automated ATS filters will penalize cross-industry keyword gaps.`;
  }

  return {
    candidateRole,
    candidateDomain,
    candidateDomainName,
    targetRole,
    targetDomain,
    isDomainMatched: isCompatible,
    domainFeedback,
  };
}
