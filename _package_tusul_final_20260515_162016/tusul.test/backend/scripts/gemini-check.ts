import dotenv from 'dotenv';
import path from 'path';
import {fileURLToPath} from 'url';
import {analyzeCvWithGemini} from '../src/lib/geminiAnalysis.js';

const backendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({path: path.join(backendRoot, '.env')});

const sample =
  'John Doe. Software Engineer. 3 years React, Node.js. Built e-commerce platform with 10k users.';

const t0 = Date.now();
const result = await analyzeCvWithGemini({
  fullName: 'Test User',
  targetRole: 'Software Engineer',
  experienceYears: 3,
  careerGoals: 'Full-stack growth',
  language: 'en',
  cvText: sample,
});

console.log(
  JSON.stringify(
    {
      keyConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
      models: process.env.GEMINI_MODEL || '(default)',
      ok: Boolean(result.data),
      modelUsed: result.modelUsed,
      error: result.error,
      ms: Date.now() - t0,
      atsScore: result.data?.atsScore,
      summaryPreview: String(result.data?.summary || '').slice(0, 80),
    },
    null,
    2,
  ),
);

process.exit(result.data ? 0 : 1);
