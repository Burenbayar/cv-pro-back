import {GoogleGenerativeAI, SchemaType, type ResponseSchema} from '@google/generative-ai';

export type GeminiAnalyzeInput = {
  fullName: string;
  targetRole: string;
  experienceYears: number;
  careerGoals: string;
  language: 'mn' | 'en';
  cvText: string;
  cvFileName?: string;
};  

const geminiSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    candidateName: {type: SchemaType.STRING},
    targetRole: {type: SchemaType.STRING},
    skills: {type: SchemaType.ARRAY, items: {type: SchemaType.STRING}},
    experienceLevel: {type: SchemaType.STRING},
    atsScore: {type: SchemaType.INTEGER},
    weakPoints: {type: SchemaType.ARRAY, items: {type: SchemaType.STRING}},
    missingSkills: {type: SchemaType.ARRAY, items: {type: SchemaType.STRING}},
    careerRecommendations: {type: SchemaType.ARRAY, items: {type: SchemaType.STRING}},
    cvImprovementSuggestions: {type: SchemaType.ARRAY, items: {type: SchemaType.STRING}},
    rewrittenCv: {type: SchemaType.STRING},
    summary: {type: SchemaType.STRING},
    cvProfile: {
      type: SchemaType.OBJECT,
      properties: {
        fullName: {type: SchemaType.STRING},
        phone: {type: SchemaType.STRING},
        email: {type: SchemaType.STRING},
        address: {type: SchemaType.STRING},
        hobbies: {type: SchemaType.ARRAY, items: {type: SchemaType.STRING}},
        skills: {type: SchemaType.ARRAY, items: {type: SchemaType.STRING}},
        languages: {type: SchemaType.ARRAY, items: {type: SchemaType.STRING}},
        education: {type: SchemaType.ARRAY, items: {type: SchemaType.STRING}},
        experience: {type: SchemaType.ARRAY, items: {type: SchemaType.STRING}},
        summary: {type: SchemaType.STRING},
      },
      required: ['fullName', 'phone', 'email', 'address', 'hobbies', 'skills', 'languages', 'education', 'experience', 'summary'],
    },
    interview: {
      type: SchemaType.OBJECT,
      properties: {
        technical: {type: SchemaType.ARRAY, items: {type: SchemaType.STRING}},
        hr: {type: SchemaType.ARRAY, items: {type: SchemaType.STRING}},
        behavioral: {type: SchemaType.ARRAY, items: {type: SchemaType.STRING}},
        suggestedAnswers: {type: SchemaType.ARRAY, items: {type: SchemaType.STRING}},
      },
      required: ['technical', 'hr', 'behavioral', 'suggestedAnswers'],
    },
  },
  required: [
    'candidateName',
    'targetRole',
    'skills',
    'experienceLevel',
    'atsScore',
    'weakPoints',
    'missingSkills',
    'careerRecommendations',
    'cvImprovementSuggestions',
    'rewrittenCv',
    'summary',
    'cvProfile',
    'interview',
  ],
};

function buildPrompt(input: GeminiAnalyzeInput) {
  const system = [
    'You are a senior AI career advisor, ATS resume reviewer, and professional HR coach.',
    'Return only structured JSON that matches the provided schema.',
    input.language === 'mn'
      ? 'Write every human-readable value in Mongolian Cyrillic. If the CV contains Mongolian written with Latin/foreign letters, normalize it into Mongolian Cyrillic. Keep genuine English technology names, company names, emails, URLs, and certifications in English.'
      : 'Write every human-readable value in natural, professional English.',
    'Keep JSON keys in English.',
    'Be practical, specific, and concise. Do not invent employers, dates, degrees, or certifications.',
    'CRITICAL: Read the full CV text in the user message. Analyze ONLY that document. Do not use generic template text.',
    'The rewrittenCv field must be a complete NEW professional CV built from the uploaded CV facts — improved wording, structure, and Mongolian grammar.',
    'Fill cvProfile from the CV only. Profession must match the CV (accountant stays accountant, not software). Job requirements tailor summary/skills only.',
    'Use friendly advisory wording for roadmap/recommendations in Mongolian (e.g. "хийгээрэй", "бэлдээрэй"), avoid commanding tone.',
    'Format rewrittenCv with Mongolian headers when language is mn: ХОЛБОО БАРИХ, СОНИРХОЛ, УР ЧАДВАР, ХЭЛ, МИНИЙ ТУХАЙ, БОЛОВСРОЛ, АЖЛЫН ТУРШЛАГА.',
    'For МИНИЙ ТУХАЙ (professional summary / goal): write 3–5 sentences about career direction, interests, motivation, and goals from the CV. Do NOT list programming skills or technologies in this section — skills belong only in УР ЧАДВАР.',
    'Include every real job, project, school, skill, phone, and email found in the source CV. Improve bullets with action verbs; add metrics only if present in source.',
    'Score atsScore from 0-100 based on real ATS readiness for the target role.',
  ].join(' ');

  const user = [
    `Candidate name: ${input.fullName}`,
    `Target role / job requirements: ${input.targetRole}`,
    `Reported years of experience: ${input.experienceYears}`,
    `Career goals: ${input.careerGoals || 'Not provided'}`,
    `Uploaded file name: ${input.cvFileName || 'text input'}`,
    '',
    'Extract cvProfile, then produce rewrittenCv matching those sections.',
    'Analyze skills, experience level, weak points, missing skills, ATS score, recommendations, and CV improvements based on this exact CV.',
    'For roadmap/recommendations in Mongolian, use advisory wording such as "сайжруулаарай", "бэлдээрэй", "анхаараарай".',
    'Return 4 to 6 careerRecommendations and 4 to 6 cvImprovementSuggestions.',
    'Return interview prep: 4 technical Q&A items, 3 HR Q&A items, 3 behavioral Q&A items, and 4 suggested answer strategies.',
    '',
    'CV text:',
    input.cvText,
  ].join('\n');

  return {system, user};
}

const DEFAULT_GEMINI_MODELS = [
  'gemini-2.0-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
];

/** gemini-1.5-flash is deprecated on v1beta — map to a supported alias. */
function normalizeModelName(name: string) {
  const n = name.trim();
  if (n === 'gemini-1.5-flash' || n === 'gemini-1.5-flash-latest') {
    return 'gemini-2.0-flash-lite';
  }
  return n;
}

function parseModelList(modelSetting?: string) {
  const models = String(modelSetting || DEFAULT_GEMINI_MODELS.join(','))
    .split(',')
    .map(normalizeModelName)
    .filter(Boolean);
  const unique = [...new Set(models)];
  return unique.length ? unique : [...DEFAULT_GEMINI_MODELS];
}

function formatGeminiError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('429') || message.toLowerCase().includes('quota')) {
    return 'GEMINI_QUOTA_EXCEEDED — Google API free quota дууссан. AI Studio дээр billing/quota шалгана уу.';
  }
  if (message.includes('404') || message.toLowerCase().includes('not found')) {
    return 'GEMINI_MODEL_NOT_FOUND — model нэр буруу эсвэл идэвхгүй.';
  }
  if (message.includes('GEMINI_TIMEOUT')) return 'GEMINI_TIMEOUT';
  return message.slice(0, 240);
}

function parseJsonText(text: string) {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) return null;
    return JSON.parse(text.slice(firstBrace, lastBrace + 1)) as Record<string, unknown>;
  }
}

export async function analyzeCvWithGemini(input: GeminiAnalyzeInput): Promise<{
  data: Record<string, unknown> | null;
  modelUsed: string | null;
  error: string | null;
}> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return {data: null, modelUsed: null, error: 'GEMINI_KEY_MISSING'};

  const {system, user} = buildPrompt(input);
  const models = parseModelList(process.env.GEMINI_MODEL);
  const timeoutMs = Number(process.env.GEMINI_TIMEOUT_MS || 60000);
  const maxOutputTokens = Number(process.env.GEMINI_MAX_OUTPUT_TOKENS || 8192);
  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError = 'GEMINI_FAILED';

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({model: modelName, systemInstruction: system});
      const request = model.generateContent({
        contents: [{role: 'user', parts: [{text: user}]}],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: geminiSchema,
          maxOutputTokens,
          temperature: 0.35,
        },
      });
      const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('GEMINI_TIMEOUT')), timeoutMs);
      });
      const result = await Promise.race([request, timeout]);
      const parsed = parseJsonText(result.response.text());
      if (parsed) return {data: parsed, modelUsed: modelName, error: null};
      lastError = 'GEMINI_EMPTY_RESPONSE';
    } catch (error) {
      lastError = formatGeminiError(error);
      if (process.env.NODE_ENV !== 'production') {
        console.error(`[Gemini:${modelName}] ${lastError}`);
      }
      if (lastError.startsWith('GEMINI_QUOTA_EXCEEDED')) break;
    }
  }

  return {data: null, modelUsed: null, error: lastError};
}
