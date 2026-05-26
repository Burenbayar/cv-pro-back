const { env } = require("../../config/env");
const AppError = require("../../utils/appError");
const { normalizeAnalysisResponse } = require("../../utils/analysisSchema");

const providerName = "openai";

const careerAnalysisSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "candidateName",
    "targetRole",
    "skills",
    "experienceLevel",
    "atsScore",
    "weakPoints",
    "missingSkills",
    "careerRecommendations",
    "cvImprovementSuggestions",
    "rewrittenCv",
    "summary",
    "interview"
  ],
  properties: {
    candidateName: { type: "string" },
    targetRole: { type: "string" },
    skills: {
      type: "array",
      items: { type: "string" }
    },
    experienceLevel: {
      type: "string",
      description: "Junior, Mid-Level, Senior, or a localized equivalent when requested."
    },
    atsScore: { type: "integer" },
    weakPoints: {
      type: "array",
      items: { type: "string" }
    },
    missingSkills: {
      type: "array",
      items: { type: "string" }
    },
    careerRecommendations: {
      type: "array",
      items: { type: "string" }
    },
    cvImprovementSuggestions: {
      type: "array",
      items: { type: "string" }
    },
    rewrittenCv: { type: "string" },
    summary: { type: "string" },
    interview: {
      type: "object",
      additionalProperties: false,
      required: ["technical", "hr", "behavioral", "suggestedAnswers"],
      properties: {
        technical: {
          type: "array",
          items: { type: "string" }
        },
        hr: {
          type: "array",
          items: { type: "string" }
        },
        behavioral: {
          type: "array",
          items: { type: "string" }
        },
        suggestedAnswers: {
          type: "array",
          items: { type: "string" }
        }
      }
    }
  }
};

function buildInput(payload) {
  const responseLanguage = payload.language === "mn" ? "Mongolian" : "English";

  return [
    {
      role: "system",
      content: [
        "You are a senior AI career advisor, ATS resume reviewer, and professional HR coach.",
        "Return only structured JSON that matches the provided schema.",
        payload.language === "mn"
          ? "Write every human-readable value in Mongolian Cyrillic. If the CV contains Mongolian written with Latin/foreign letters, normalize it into Mongolian Cyrillic. Keep genuine English technology names, company names, emails, URLs, and certifications in English."
          : `Write every human-readable text value in ${responseLanguage}.`,
        "Keep JSON keys in English.",
        "Be practical, specific, and concise. Do not invent employers, dates, degrees, or certifications.",
        "The rewrittenCv field must be an export-ready improved CV, not advice about how to improve the CV.",
        "The rewritten CV must preserve truthful facts from the input while improving clarity, structure, ATS keywords, and measurable impact."
      ].join(" ")
    },
    {
      role: "user",
      content: [
        `Candidate name: ${payload.fullName}`,
        `Target role: ${payload.targetRole}`,
        `Reported years of experience: ${payload.experienceYears}`,
        `Career goals: ${payload.careerGoals || "Not provided"}`,
        `Uploaded file name: ${payload.cvFileName || "text input"}`,
        "",
        "Analyze this CV for skills, experience level, weaknesses, missing skills, ATS readiness, career recommendations, CV improvements, and a better rewritten CV.",
        "Use 0-100 for atsScore, where 100 means highly ATS-ready for the target role.",
        "For rewrittenCv: produce a complete polished CV draft using only facts from the uploaded CV. Improve structure, professional summary, skills grouping, experience bullets, project descriptions, ATS keywords, grammar, and recruiter readability. Start bullets with strong action verbs. Add measurable impact only when evidence exists; otherwise improve clarity without fabricating numbers. Preserve names, contacts, employers, dates, degrees, and certifications exactly when present.",
        "Return 4 to 6 careerRecommendations and 4 to 6 cvImprovementSuggestions.",
        "Return interview prep immediately: 4 technical Q&A items, 3 HR Q&A items, 3 behavioral Q&A items, and 4 suggested answer strategies. Each question item should include both the interview question and a concise suggested answer tailored to this CV and target role.",
        "",
        "CV text:",
        payload.cvText
      ].join("\n")
    }
  ];
}

async function requestOpenAi(payload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.openAiTimeoutMs);
  let response;

  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.openAiApiKey}`
      },
      body: JSON.stringify({
        model: env.openAiModel,
        input: buildInput(payload),
        max_output_tokens: env.openAiMaxOutputTokens,
        text: {
          format: {
            type: "json_schema",
            name: "career_analysis",
            strict: true,
            schema: careerAnalysisSchema
          }
        }
      }),
      signal: controller.signal
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new AppError("OpenAI request timed out.", 504, "OPENAI_TIMEOUT");
    }

    throw new AppError("OpenAI request failed before completion.", 502, "OPENAI_NETWORK_ERROR");
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new AppError(`OpenAI request failed: ${errorText.slice(0, 500)}`, 502, "OPENAI_BAD_RESPONSE");
  }

  return response.json();
}

function extractOutputText(data) {
  if (data.output_text) {
    return data.output_text;
  }

  return (data.output || [])
    .flatMap((item) => item.content || [])
    .filter((item) => item.type === "output_text" && item.text)
    .map((item) => item.text)
    .join("\n");
}

function parseJsonOutput(data) {
  const text = extractOutputText(data);

  if (!text) {
    throw new AppError("OpenAI response did not include text output.", 502, "OPENAI_EMPTY_RESPONSE");
  }

  try {
    return JSON.parse(text);
  } catch {
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1) {
      throw new AppError("OpenAI response did not contain JSON.", 502, "OPENAI_JSON_MISSING");
    }

    return JSON.parse(text.slice(firstBrace, lastBrace + 1));
  }
}

async function analyzeCareerProfile(payload) {
  const data = await requestOpenAi(payload);
  return normalizeAnalysisResponse(parseJsonOutput(data));
}

async function rewriteCv(payload) {
  const analysis = await analyzeCareerProfile(payload);
  return analysis.rewrittenCv;
}

module.exports = {
  providerName,
  analyzeCareerProfile,
  rewriteCv
};
