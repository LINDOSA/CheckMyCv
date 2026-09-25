/**
 * CheckMyCV Workforce Engine: LLM Client & Cost Tracker
 * Provides resilient, multi-provider AI model execution (Gemini, OpenRouter, OpenAI)
 * with token usage accounting and dollar cost tracking.
 */

import { JobContext } from './types';

// Pricing per million tokens (conservative estimates)
const PRICING: Record<string, { in: number; out: number }> = {
  'gemini-2.5-flash': { in: 0.075 / 1e6, out: 0.30 / 1e6 },
  'gpt-4o-mini': { in: 0.15 / 1e6, out: 0.60 / 1e6 },
  'llama-3.3-70b': { in: 0.40 / 1e6, out: 0.80 / 1e6 },
};

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error(`LLM call timed out after ${timeoutMs}ms`)), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export async function executeAgentPrompt(
  ctx: JobContext,
  systemPrompt: string,
  userPrompt: string,
  temperature = 0.2
): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const openAIKey = process.env.OPENAI_API_KEY;

  // 1. Try Google Gemini (Fast & highly economical)
  if (geminiKey && geminiKey.trim() !== '' && !geminiKey.includes('...')) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey.trim()}`;
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n---\n\n${userPrompt}` }],
          },
        ],
        generationConfig: {
          temperature,
          maxOutputTokens: 3072,
        },
      };

      const res = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }, 14000);

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const usage = data.usageMetadata;
          const promptTokens = usage?.promptTokenCount || 800;
          const candidateTokens = usage?.candidatesTokenCount || 600;
          const totalTokens = promptTokens + candidateTokens;
          const cost = promptTokens * PRICING['gemini-2.5-flash'].in + candidateTokens * PRICING['gemini-2.5-flash'].out;

          ctx.tokens_used += totalTokens;
          ctx.cost_usd += cost;
          return text;
        }
      }
    } catch (err: any) {
      console.warn('[Workforce LLM] Gemini call failed, falling back...', err?.message);
    }
  }

  // 2. Try OpenRouter
  if (openRouterKey && openRouterKey.trim() !== '' && !openRouterKey.includes('***')) {
    try {
      const res = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openRouterKey.trim()}`,
          'HTTP-Referer': 'https://www.checkmycv.co.za',
          'X-Title': 'CheckMyCV Workforce',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.3-70b-instruct',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature,
          max_tokens: 3072,
        }),
      }, 14000);

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) {
          const usage = data.usage;
          const totalTokens = usage?.total_tokens || 1400;
          ctx.tokens_used += totalTokens;
          ctx.cost_usd += (totalTokens * PRICING['llama-3.3-70b'].out);
          return text;
        }
      }
    } catch (err: any) {
      console.warn('[Workforce LLM] OpenRouter call failed, falling back...', err?.message);
    }
  }

  // 3. Try OpenAI Direct
  if (openAIKey && openAIKey.trim() !== '' && !openAIKey.includes('***')) {
    try {
      const res = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openAIKey.trim()}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature,
          max_tokens: 3072,
        }),
      }, 14000);

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) {
          const usage = data.usage;
          const totalTokens = usage?.total_tokens || 1400;
          ctx.tokens_used += totalTokens;
          ctx.cost_usd += (usage?.prompt_tokens || 800) * PRICING['gpt-4o-mini'].in + (usage?.completion_tokens || 600) * PRICING['gpt-4o-mini'].out;
          return text;
        }
      }
    } catch (err: any) {
      console.warn('[Workforce LLM] OpenAI call failed...', err?.message);
    }
  }

  // Deterministic fallback if all external network calls fail or no keys
  return '';
}
