import dotenv from 'dotenv';
import path from 'path';
import {fileURLToPath} from 'url';
import {analyzeCvWithGemini} from '../src/lib/geminiAnalysis.js';

const backendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({path: path.join(backendRoot, '.env')});

const sample =
  'Jane Doe, React developer, 2 years experience at Tech LLC. Built dashboard with TypeScript.';

async function checkOpenAi() {
  if (!process.env.OPENAI_API_KEY?.trim()) return {ok: false, error: 'OPENAI_KEY_MISSING'};
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        input: [{role: 'user', content: 'Reply with JSON: {"ok":true}'}],
        max_output_tokens: 32,
      }),
      signal: controller.signal,
    });
    if (!res.ok) return {ok: false, error: `HTTP_${res.status}`};
    return {ok: true, error: null};
  } catch (e) {
    return {ok: false, error: e instanceof Error ? e.message : 'OPENAI_FAILED'};
  } finally {
    clearTimeout(timeout);
  }
}

const gemini = await analyzeCvWithGemini({
  fullName: 'Test',
  targetRole: 'Developer',
  experienceYears: 2,
  careerGoals: 'Grow',
  language: 'en',
  cvText: sample,
});
const openai = await checkOpenAi();

console.log(
  JSON.stringify(
    {
      gemini: {ok: Boolean(gemini.data), error: gemini.error},
      openai,
      recommendation:
        gemini.data ? 'Use Gemini' : openai.ok ? 'Use OpenAI fallback (now automatic)' : 'Fix API keys / billing',
    },
    null,
    2,
  ),
);

process.exit(gemini.data || openai.ok ? 0 : 1);
