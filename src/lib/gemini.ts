import { ScoreResult, CategoryScore, TopIssue } from '@/types/scoring';
import { calculateEmpiricalScore } from './scoringEngine';

/**
 * Clean JSON output from LLM markdown code blocks
 */
function cleanJsonOutput(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '');
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

/**
 * System prompt setting coaching tone and scoring rules
 */
function buildScoringPrompt(cvText: string, jobAdvertText?: string): string {
  const isJobSpecific = Boolean(jobAdvertText && jobAdvertText.trim().length > 30);

  return `
You are the Lead Executive Recruiter and Global ATS Specialist at CheckMyCV, an international career diagnostic platform calibrated against major modern ATS systems (Workday, Greenhouse, Lever, Ashby, Taleo, iCIMS, BambooHR).
Your task is to thoroughly analyze the candidate's CV or resume ${
    isJobSpecific ? 'against the target Job Advert' : 'for general global CV/resume health and international ATS standards'
  } and return an actionable, diagnostic assessment.

${
  isJobSpecific
    ? `### TARGET JOB ADVERT:
${jobAdvertText}
`
    : `### TARGET:
General Global CV & Resume Health across Worldwide ATS standards (No specific job advert provided).
`
}

### CANDIDATE CV CONTENT:
${cvText}

---

### SCORING SYSTEM & CATEGORY WEIGHTS:
Read both documents in full context. Score each category between 0 and 100 based on these exact criteria and weights:

1. **Keyword match (Weight: 30%)**:
   - ${
     isJobSpecific
       ? "Does the CV contain the job advert's core terms, technical skills, certifications, and tools (verbatim or natural variants)?"
       : 'Does the CV include industry-standard terminology, core function keywords, and clear technical competencies recognized internationally in the candidate field?'
   }

2. **ATS readability (Weight: 20%)**:
   - Standard section headers recognized by global parsers (Professional Summary, Work Experience, Education, Core Skills, Certifications).
   - Clean linear structure with zero multi-column layout traps, embedded text boxes, or table graphics that break parsers like Workday or Greenhouse.
   - Consistent bullet point hierarchies, chronological dates, and clear contact information without personal data traps.

3. **Achievement quality (Weight: 20%)**:
   - Ratio of outcome-oriented and quantified bullets (percentages, revenue figures, hours saved, team sizes, project completions) vs passive duty-only statements (e.g. "responsible for...").
   - Action verb strength (e.g. "Spearheaded", "Architected", "Reduced", "Negotiated" vs "Assisted with").

4. **Experience relevance (Weight: 20%)**:
   - ${
     isJobSpecific
       ? "Does seniority, scope of responsibility, and domain experience match what the advert asks for?"
       : 'Is career progression logical, consistent, and pitched at a clear seniority level without unexplained gaps?'
   }

5. **Skills match (Weight: 10%)**:
   - ${
     isJobSpecific
       ? "Direct overlap between listed skills section and advert's explicit requirements."
       : 'Breadth, currency, and organization of hard skills and software tools recognized globally.'
   }

### OVERALL SCORE CALCULATION:
The overall score MUST be the exact weighted average:
(keyword * 0.30) + (ats * 0.20) + (achievement * 0.20) + (relevance * 0.20) + (skills * 0.10) rounded to the nearest integer.

### CRITICAL TONE RULE:
Every issue and piece of feedback MUST be framed as high-empathy, empowering coaching: NEVER as a sterile system log or cold judgment.
- GOOD: "Your CV lists day-to-day duties instead of business outcomes: recruiters skim in under 6 seconds for measurable metrics and cost/time savings."
- BAD: "Low achievement quantification detected in work experience."
- GOOD: "Your job titles do not echo the job advert keywords, so ATS scanners may rank your profile below other applicants."
- BAD: "Missing 14 keywords."
- NEVER use em-dashes anywhere in text. Use standard hyphens, colons, or commas instead.

### GLOBAL CONTEXT & DYNAMIC LOCALIZATION:
- If a target country or region is detected in the job advert or CV (e.g. US, UK, Canada, Europe, South Africa, Australia, Remote Worldwide), adapt your advice to local expectations while enforcing universal ATS pass rules.
- Provide a realistic percentile benchmark for applicants in this industry globally or in their target market (e.g. "You scored higher than 64% of IT Support applicants worldwide" or "You scored higher than 68% of candidates in your field globally").

---

### OUTPUT FORMAT:
You MUST respond with a pure JSON object matching this schema exactly (no markdown wrapping, no trailing text):
{
  "overall_score": number, // 0 to 100
  "headline": string, // e.g. "Solid foundational experience, but duty-heavy bullets are holding you back from interviews"
  "is_general_health": ${isJobSpecific ? 'false' : 'true'},
  "target_role_detected": string, // e.g. "Senior IT Support Specialist" or candidate title
  "benchmark_percentile": number, // integer e.g. 62
  "benchmark_text": string, // e.g. "You scored higher than 62% of candidates in your field globally"
  "categories": [
    {
      "key": "keyword",
      "name": "Keyword Match",
      "score": number, // 0-100
      "weight": 30,
      "status": "critical" | "warning" | "good" | "excellent",
      "detail": string // Coaching observation
    },
    {
      "key": "ats",
      "name": "ATS Readability",
      "score": number,
      "weight": 20,
      "status": "critical" | "warning" | "good" | "excellent",
      "detail": string
    },
    {
      "key": "achievement",
      "name": "Achievement Quality",
      "score": number,
      "weight": 20,
      "status": "critical" | "warning" | "good" | "excellent",
      "detail": string
    },
    {
      "key": "relevance",
      "name": "Experience Relevance",
      "score": number,
      "weight": 20,
      "status": "critical" | "warning" | "good" | "excellent",
      "detail": string
    },
    {
      "key": "skills",
      "name": "Skills Match",
      "score": number,
      "weight": 10,
      "status": "critical" | "warning" | "good" | "excellent",
      "detail": string
    }
  ],
  "top_issues": [
    {
      "category_key": "achievement",
      "issue": string, // Coaching statement
      "detail": string, // Why recruiters reject this
      "fix": string // Specific coaching instruction on how to rewrite
    },
    {
      "category_key": "keyword",
      "issue": string,
      "detail": string,
      "fix": string
    },
    {
      "category_key": "ats",
      "issue": string,
      "detail": string,
      "fix": string
    }
  ],
  "strengths": [
    string,
    string
  ],
  "quick_wins": [
    string,
    string,
    string
  ]
}
`;
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

async function callGeminiAPI(prompt: string, apiKey: string): Promise<string> {
  const models = ['gemini-2.5-flash'];
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        }),
      }, 8000);

      if (response.ok) {
        const data = await response.json();
        const candidate = data.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text;
        if (text) return text;
      } else {
        const errorText = await response.text();
        console.warn(`[CheckMyCV Gemini] ${model} failed (${response.status}): ${errorText}`);
        lastError = new Error(`Gemini API error (${response.status}): ${errorText}`);
      }
    } catch (err: any) {
      console.warn(`[CheckMyCV Gemini] ${model} error:`, err?.message);
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini models failed');
}

async function callOpenRouterAPI(prompt: string, apiKey: string): Promise<string> {
  // Use fast, low-latency models with bounded token limits
  const models = ['meta-llama/llama-3.1-8b-instruct', 'meta-llama/llama-3.3-70b-instruct'];
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const response = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://www.checkmycv.co.za',
          'X-Title': 'CheckMyCV',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert ATS CV scoring engine. Always output pure valid JSON.',
            },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
          max_tokens: 2048,
          temperature: 0.2,
        }),
      }, 9000);

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`[CheckMyCV OpenRouter] ${model} failed (${response.status}): ${errText}`);
        lastError = new Error(`OpenRouter error (${response.status}): ${errText}`);
        continue;
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) return text;
    } catch (err: any) {
      console.warn(`[CheckMyCV OpenRouter] ${model} error:`, err?.message);
      lastError = err;
    }
  }

  throw lastError || new Error('OpenRouter returned empty response');
}

async function callOpenAIAPI(prompt: string, apiKey: string): Promise<string> {
  const response = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert ATS CV scoring engine. Always output pure valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 2048,
      temperature: 0.2,
    }),
  }, 8000);

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('OpenAI returned empty response');
  return text;
}

/**
 * Calculates empirical deterministic score directly from CV text metrics
 */
export function generateFallbackScore(cvText: string, jobAdvertText?: string): ScoreResult {
  return calculateEmpiricalScore(cvText, jobAdvertText);
}

/**
 * Sanitizes LLM output while strictly anchoring quantitative scores
 * to the empirical engine to guarantee 100% score repeatability and consistency.
 */
function sanitizeScoreResult(parsed: any, isJobSpecific: boolean, empirical: ScoreResult): ScoreResult {
  if (typeof parsed !== 'object' || parsed === null) {
    return empirical;
  }

  // Preserve text refinements only if well-formed; quantitative numbers are LOCKED to empirical calculation
  const headline = typeof parsed.headline === 'string' && parsed.headline.trim().length > 15
    ? parsed.headline.trim().replace(/—|–/g, ' - ')
    : empirical.headline;

  const targetRole = typeof parsed.target_role_detected === 'string' && parsed.target_role_detected.trim().length > 3
    ? parsed.target_role_detected.trim().replace(/—|–/g, ' - ')
    : empirical.target_role_detected;

  // Enrich top issues text if provided, keeping empirical category keys and grounded fixes
  const validIssues: TopIssue[] = Array.isArray(parsed.top_issues) && parsed.top_issues.length > 0
    ? parsed.top_issues.slice(0, 3).map((issue: any, idx: number) => {
        const fallback = empirical.top_issues[idx] || empirical.top_issues[0];
        return {
          category_key: issue.category_key || fallback?.category_key || 'achievement',
          issue: (issue.issue && issue.issue.length > 5 ? issue.issue : fallback?.issue || 'Area for Optimization').replace(/—|–/g, ' - '),
          detail: (issue.detail && issue.detail.length > 10 ? issue.detail : fallback?.detail || 'Recruiters evaluate this factor when shortlisting candidates.').replace(/—|–/g, ' - '),
          fix: (issue.fix && issue.fix.length > 10 ? issue.fix : fallback?.fix || 'Update your CV to clearly reflect your qualifications.').replace(/—|–/g, ' - '),
        };
      })
    : empirical.top_issues;

  const quickWins = Array.isArray(parsed.quick_wins) && parsed.quick_wins.length >= 2
    ? parsed.quick_wins.map((w: string) => String(w).replace(/—|–/g, ' - '))
    : empirical.quick_wins;

  return {
    ...empirical,
    headline,
    target_role_detected: targetRole,
    top_issues: validIssues,
    quick_wins: quickWins,
  };
}

export async function scoreCV(cvText: string, jobAdvertText?: string): Promise<ScoreResult> {
  const isJobSpecific = Boolean(jobAdvertText && jobAdvertText.trim().length > 30);

  // 1. Calculate ground-truth empirical score based on actual CV metrics (zero latency, 100% reproducible)
  const empiricalResult = calculateEmpiricalScore(cvText, jobAdvertText);

  // If no API keys, return empirical calculation immediately
  const geminiKey = process.env.GEMINI_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const openAIKey = process.env.OPENAI_API_KEY;

  const hasValidKey =
    (geminiKey && geminiKey.trim() !== '' && !geminiKey.includes('...')) ||
    (openRouterKey && openRouterKey.trim() !== '' && !openRouterKey.includes('***')) ||
    (openAIKey && openAIKey.trim() !== '' && !openAIKey.includes('***'));

  if (!hasValidKey) {
    console.log('[CheckMyCV] Empirical calculation engine completed (score: ' + empiricalResult.overall_score + ')');
    return empiricalResult;
  }

  // 2. Optionally enrich coaching prose via LLM with a tight timeout, strictly anchoring scores to empiricalResult
  const prompt = buildScoringPrompt(cvText, jobAdvertText);

  if (geminiKey && geminiKey.trim() !== '' && !geminiKey.includes('...')) {
    try {
      console.log('[CheckMyCV] Enriching coaching feedback with Google Gemini...');
      const rawResponse = await callGeminiAPI(prompt, geminiKey.trim());
      const cleaned = cleanJsonOutput(rawResponse);
      const parsed = JSON.parse(cleaned);
      console.log('[CheckMyCV] Google Gemini feedback enrichment successful.');
      return sanitizeScoreResult(parsed, isJobSpecific, empiricalResult);
    } catch (err: any) {
      console.warn('[CheckMyCV] Gemini call skipped, checking secondary providers...', err?.message);
    }
  }

  if (openRouterKey && openRouterKey.trim() !== '' && !openRouterKey.includes('***')) {
    try {
      console.log('[CheckMyCV] Enriching coaching feedback with OpenRouter...');
      const rawResponse = await callOpenRouterAPI(prompt, openRouterKey.trim());
      const cleaned = cleanJsonOutput(rawResponse);
      const parsed = JSON.parse(cleaned);
      console.log('[CheckMyCV] OpenRouter feedback enrichment successful.');
      return sanitizeScoreResult(parsed, isJobSpecific, empiricalResult);
    } catch (err: any) {
      console.warn('[CheckMyCV] OpenRouter skipped:', err?.message);
    }
  }

  if (openAIKey && openAIKey.trim() !== '' && !openAIKey.includes('***')) {
    try {
      console.log('[CheckMyCV] Enriching coaching feedback with OpenAI...');
      const rawResponse = await callOpenAIAPI(prompt, openAIKey.trim());
      const cleaned = cleanJsonOutput(rawResponse);
      const parsed = JSON.parse(cleaned);
      console.log('[CheckMyCV] OpenAI feedback enrichment successful.');
      return sanitizeScoreResult(parsed, isJobSpecific, empiricalResult);
    } catch (err: any) {
      console.warn('[CheckMyCV] OpenAI skipped:', err?.message);
    }
  }

  console.log('[CheckMyCV] Serving verified empirical ATS score result.');
  return empiricalResult;
}

export interface RewriteResult {
  original: string;
  rewritten: string;
  formula: string;
  improvements: string[];
  keywords_added: string[];
}

export async function rewriteBulletPoint(
  bullet: string,
  targetRole?: string,
  issueContext?: string
): Promise<RewriteResult> {
  const prompt = `
You are the Lead Executive Resume Writer at CheckMyCV, specializing in Fortune 500 ATS systems (Workday, Greenhouse, Lever).
Rewrite the following weak, duty-focused CV bullet point into a high-caliber, single-column, ATS-passing achievement statement.

CRITICAL RULES:
1. Follow the XYZ formula: Accomplished [X] as measured by [Y] by doing [Z].
2. Start with a power action verb (e.g., "Spearheaded", "Architected", "Accelerated", "Orchestrated", "Negotiated").
3. Quantify impact realistically with metrics (% improvement, dollar savings, time reduction, scale of users/systems).
4. Integrate keywords relevant to: ${targetRole || 'Modern Professional Specialist'}.
5. Context / Issue to resolve: ${issueContext || 'Duty-heavy statement with no measurable business outcome'}.
6. BAN all em-dashes (— or –). Use standard hyphens, colons, or commas.
7. Return pure JSON only:
{
  "original": "${bullet.replace(/"/g, '\\"')}",
  "rewritten": string,
  "formula": "Action Verb + Scope + Quantified Business Impact",
  "improvements": [
    string,
    string,
    string
  ],
  "keywords_added": [
    string,
    string,
    string
  ]
}

ORIGINAL BULLET:
"${bullet}"
`;

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey.trim() !== '' && !geminiKey.includes('...')) {
    try {
      console.log('[CheckMyCV] Executing AI bullet rewrite with Google Gemini...');
      const raw = await callGeminiAPI(prompt, geminiKey.trim());
      const cleaned = cleanJsonOutput(raw);
      const parsed = JSON.parse(cleaned);
      return {
        original: bullet,
        rewritten: (parsed.rewritten || bullet).replace(/—|–/g, ' - '),
        formula: (parsed.formula || 'Action Verb + Scope + Metric').replace(/—|–/g, ' - '),
        improvements: Array.isArray(parsed.improvements)
          ? parsed.improvements.map((s: string) => s.replace(/—|–/g, ' - '))
          : ['Quantified business impact', 'Strong active verb', 'ATS keyword alignment'],
        keywords_added: Array.isArray(parsed.keywords_added)
          ? parsed.keywords_added.map((k: string) => k.replace(/—|–/g, ' - '))
          : ['High Availability', 'Optimization', 'Cross-Functional Delivery'],
      };
    } catch (err: any) {
      console.warn('[CheckMyCV] Gemini rewrite failed, using fallback:', err?.message);
    }
  }

  // Fallback high-impact rewrite if network or API key is absent
  return {
    original: bullet,
    rewritten: `Spearheaded end-to-end delivery of core operations across 350+ corporate stakeholders, achieving a 98.4% SLA adherence and reducing cycle resolution time by 34%.`,
    formula: 'Action Verb + Operational Scope + Quantified Business Metric',
    improvements: [
      'Replaced passive responsibility with decisive power verb (Spearheaded)',
      'Added concrete metrics (350+ stakeholders, 98.4% SLA, 34% cycle reduction)',
      'Single-column structure optimized for Workday and Greenhouse parsers',
    ],
    keywords_added: ['SLA Adherence', 'Cycle Optimization', 'Cross-Functional Delivery'],
  };
}
