import dotenv from 'dotenv';
import path from 'path';
import {fileURLToPath} from 'url';

const backendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({path: path.join(backendRoot, '.env')});

const cvText =
  'Bat Erdene. Junior developer. 2 years JavaScript, React. Built school management UI at ABC LLC.';

const input = [
  {
    role: 'system',
    content: 'Return JSON only: {"candidateName":"string","atsScore":number,"summary":"string"}',
  },
  {
    role: 'user',
    content: `Analyze this CV for Software Engineer role:\n${cvText}`,
  },
];

const t0 = Date.now();
const res = await fetch('https://api.openai.com/v1/responses', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  },
  body: JSON.stringify({
    model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    input,
    max_output_tokens: 400,
  }),
});

const body = await res.text();
let parsed: unknown = null;
try {
  parsed = JSON.parse(body);
} catch {
  parsed = body.slice(0, 300);
}

const data = parsed as {output_text?: string; error?: {message?: string}};
const outputText =
  typeof data.output_text === 'string'
    ? data.output_text
    : (data as {error?: {message?: string}}).error?.message || body.slice(0, 200);

console.log(
  JSON.stringify(
    {
      provider: process.env.AI_PROVIDER || 'auto',
      httpStatus: res.status,
      ok: res.ok,
      ms: Date.now() - t0,
      preview: String(outputText).slice(0, 200),
    },
    null,
    2,
  ),
);

process.exit(res.ok ? 0 : 1);
