import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
const geminiSchema = {
    type: SchemaType.OBJECT,
    properties: {
        candidateName: { type: SchemaType.STRING },
        targetRole: { type: SchemaType.STRING },
        skills: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        experienceLevel: { type: SchemaType.STRING },
        atsScore: { type: SchemaType.INTEGER },
        weakPoints: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        missingSkills: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        careerRecommendations: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        cvImprovementSuggestions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        rewrittenCv: { type: SchemaType.STRING },
        summary: { type: SchemaType.STRING },
        interview: {
            type: SchemaType.OBJECT,
            properties: {
                technical: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                hr: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                behavioral: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                suggestedAnswers: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
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
        'interview',
    ],
};
function buildPrompt(input) {
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
        'Format rewrittenCv with these Mongolian section headers when language is mn: ХОЛБОО БАРИХ, БОЛОВСРОЛ, УР ЧАДВАР, ХЭЛ, МИНИЙ ТУХАЙ, АЖЛЫН ТУРШЛАГА. Use professional formal Mongolian. Do not invent employers, dates, schools, or contacts.',
        'For МИНИЙ ТУХАЙ (professional summary / goal): write 3–5 sentences about career direction, interests, motivation, and goals from the CV. Do NOT list programming skills or technologies in this section — skills belong only in УР ЧАДВАР.',
        'Include every real job, project, school, skill, phone, and email found in the source CV. Improve bullets with action verbs; add metrics only if present in source.',
        'Score atsScore from 0-100 based on real ATS readiness for the target role.',
    ].join(' ');
    const user = [
        `Candidate name: ${input.fullName}`,
        `Target role: ${input.targetRole}`,
        `Reported years of experience: ${input.experienceYears}`,
        `Career goals: ${input.careerGoals || 'Not provided'}`,
        `Uploaded file name: ${input.cvFileName || 'text input'}`,
        '',
        'First analyze the CV text below, then produce rewrittenCv as the improved full CV document.',
        'Analyze skills, experience level, weak points, missing skills, ATS score, recommendations, and CV improvements based on this exact CV.',
        'Return 4 to 6 careerRecommendations and 4 to 6 cvImprovementSuggestions.',
        'Return interview prep: 4 technical Q&A items, 3 HR Q&A items, 3 behavioral Q&A items, and 4 suggested answer strategies.',
        '',
        'CV text:',
        input.cvText,
    ].join('\n');
    return { system, user };
}
function parseModelList(modelSetting) {
    const models = String(modelSetting || 'gemini-2.0-flash,gemini-1.5-flash')
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean);
    return models.length ? models : ['gemini-2.0-flash'];
}
function parseJsonText(text) {
    try {
        return JSON.parse(text);
    }
    catch {
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace === -1 || lastBrace === -1)
            return null;
        return JSON.parse(text.slice(firstBrace, lastBrace + 1));
    }
}
export async function analyzeCvWithGemini(input) {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey)
        return { data: null, modelUsed: null, error: 'GEMINI_KEY_MISSING' };
    const { system, user } = buildPrompt(input);
    const models = parseModelList(process.env.GEMINI_MODEL);
    const timeoutMs = Number(process.env.GEMINI_TIMEOUT_MS || 60000);
    const maxOutputTokens = Number(process.env.GEMINI_MAX_OUTPUT_TOKENS || 8192);
    const genAI = new GoogleGenerativeAI(apiKey);
    let lastError = 'GEMINI_FAILED';
    for (const modelName of models) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName, systemInstruction: system });
            const request = model.generateContent({
                contents: [{ role: 'user', parts: [{ text: user }] }],
                generationConfig: {
                    responseMimeType: 'application/json',
                    responseSchema: geminiSchema,
                    maxOutputTokens,
                    temperature: 0.35,
                },
            });
            const timeout = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('GEMINI_TIMEOUT')), timeoutMs);
            });
            const result = await Promise.race([request, timeout]);
            const parsed = parseJsonText(result.response.text());
            if (parsed)
                return { data: parsed, modelUsed: modelName, error: null };
            lastError = 'GEMINI_EMPTY_RESPONSE';
        }
        catch (error) {
            lastError = error instanceof Error ? error.message : 'GEMINI_FAILED';
            if (process.env.NODE_ENV !== 'production') {
                console.error(`[Gemini:${modelName}] ${lastError}`);
            }
        }
    }
    return { data: null, modelUsed: null, error: lastError };
}
