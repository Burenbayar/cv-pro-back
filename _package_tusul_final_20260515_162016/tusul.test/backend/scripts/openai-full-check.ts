import dotenv from 'dotenv';
import path from 'path';
import {fileURLToPath} from 'url';
import {extractOpenAiResponseText} from '../src/lib/openaiResponse.js';

const backendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({path: path.join(backendRoot, '.env')});

const schema = {
  type: 'object',
  additionalProperties: false,
  required: ['candidateName', 'targetRole', 'skills', 'experienceLevel', 'atsScore', 'weakPoints', 'missingSkills', 'careerRecommendations', 'cvImprovementSuggestions', 'rewrittenCv', 'summary', 'interview'],
  properties: {
    candidateName: {type: 'string'},
    targetRole: {type: 'string'},
    skills: {type: 'array', items: {type: 'string'}},
    experienceLevel: {type: 'string'},
    atsScore: {type: 'integer'},
    weakPoints: {type: 'array', items: {type: 'string'}},
    missingSkills: {type: 'array', items: {type: 'string'}},
    careerRecommendations: {type: 'array', items: {type: 'string'}},
    cvImprovementSuggestions: {type: 'array', items: {type: 'string'}},
    rewrittenCv: {type: 'string'},
    summary: {type: 'string'},
    interview: {
      type: 'object',
      additionalProperties: false,
      required: ['technical', 'hr', 'behavioral', 'suggestedAnswers'],
      properties: {
        technical: {type: 'array', items: {type: 'string'}},
        hr: {type: 'array', items: {type: 'string'}},
        behavioral: {type: 'array', items: {type: 'string'}},
        suggestedAnswers: {type: 'array', items: {type: 'string'}},
      },
    },
  },
};

const cvText = 'Bat Erdene. Software Engineer. 3 years React, Node.js at Tech LLC. Built admin dashboard.';

const t0 = Date.now();
const res = await fetch('https://api.openai.com/v1/responses', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  },
  body: JSON.stringify({
    model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    input: [{role: 'user', content: `Analyze CV for Software Engineer:\n${cvText}`}],
    max_output_tokens: Number(process.env.OPENAI_MAX_OUTPUT_TOKENS || 8192),
    text: {format: {type: 'json_schema', name: 'career_analysis', strict: true, schema}},
  }),
});

const data = await res.json();
const text = extractOpenAiResponseText(data);
let parsed: Record<string, unknown> | null = null;
try {
  parsed = text ? (JSON.parse(text) as Record<string, unknown>) : null;
} catch {
  parsed = null;
}

console.log(
  JSON.stringify(
    {
      httpStatus: res.status,
      responseStatus: data.status,
      extractedChars: text.length,
      ok: Boolean(parsed?.candidateName),
      atsScore: parsed?.atsScore,
      ms: Date.now() - t0,
    },
    null,
    2,
  ),
);

process.exit(parsed ? 0 : 1);
