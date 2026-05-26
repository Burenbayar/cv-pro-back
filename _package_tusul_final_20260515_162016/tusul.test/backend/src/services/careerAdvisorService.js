const cvParserService = require("./cvParserService");
const { env } = require("../config/env");
const { getAiProvider } = require("./aiProviderFactory");
const AppError = require("../utils/appError");
const ResponseCache = require("../utils/responseCache");
const buildCacheKey = require("../utils/cacheKey");
const simulatedCareerAdvisor = require("./ai/simulatedCareerAdvisor");

const analysisCache = new ResponseCache(env.cacheTtlMs);

function getSourceLabel(file) {
  if (!file) {
    return "text-input";
  }

  return file.mimetype === "application/pdf" ? "pdf-upload" : "text-file-upload";
}

function normalizeRequest(body = {}) {
  const parsedExperienceYears = Number(body.experienceYears || 0);

  return {
    fullName: String(body.fullName || "Candidate").trim(),
    targetRole: String(body.targetRole || "Generalist").trim(),
    careerGoals: String(body.careerGoals || "").trim(),
    experienceYears: Number.isFinite(parsedExperienceYears) && parsedExperienceYears >= 0 ? parsedExperienceYears : 0,
    language: String(body.language || "en").trim().toLowerCase() === "mn" ? "mn" : "en"
  };
}

function validateRequest(request, cvText) {
  if (!cvText) {
    throw new AppError("Provide either CV text or a supported file upload.", 400, "CV_REQUIRED");
  }

  if (cvText.length > env.cvTextMaxLength) {
    throw new AppError(`CV text exceeds the ${env.cvTextMaxLength} character limit.`, 413, "CV_TOO_LARGE");
  }

  if (!request.targetRole) {
    throw new AppError("targetRole is required.", 400, "TARGET_ROLE_REQUIRED");
  }
}

function buildMetadata(aiProvider, file, cvText) {
  return {
    provider: aiProvider.providerName,
    source: getSourceLabel(file),
    cvLength: cvText.length
  };
}

async function getAnalysisResult({ request, cvText, file }) {
  validateRequest(request, cvText);

  const aiProvider = getAiProvider();
  const cacheKey = buildCacheKey(`analysis:${aiProvider.providerName}`, {
    ...request,
    cvText
  });
  const cached = analysisCache.get(cacheKey);

  if (cached) {
    return {
      analysis: cached,
      aiProvider
    };
  }

  let analysis;
  let providerUsed = aiProvider;
  let fallbackReason = "";

  try {
    analysis = await aiProvider.analyzeCareerProfile({
      ...request,
      cvText,
      cvFileName: file ? file.originalname : ""
    });
  } catch (error) {
    if (aiProvider.providerName !== "openai") {
      throw error;
    }

    fallbackReason = error.code || "OPENAI_FALLBACK";
    providerUsed = simulatedCareerAdvisor;
    analysis = await simulatedCareerAdvisor.analyzeCareerProfile({
      ...request,
      cvText,
      cvFileName: file ? file.originalname : ""
    });
  }

  analysisCache.set(cacheKey, analysis);

  return {
    analysis,
    aiProvider: providerUsed,
    fallbackReason
  };
}

async function analyzeCareerProfile({ body, file }) {
  const request = normalizeRequest(body);
  const cvText = await cvParserService.extractCvText({
    cvText: body.cvText,
    file
  });
  const { analysis, aiProvider, fallbackReason } = await getAnalysisResult({ request, cvText, file });

  return {
    ...analysis,
    metadata: {
      ...buildMetadata(aiProvider, file, cvText),
      fallbackReason: fallbackReason || undefined
    }
  };
}

async function rewriteCvOnly({ body, file }) {
  const request = normalizeRequest(body);
  const cvText = await cvParserService.extractCvText({
    cvText: body.cvText,
    file
  });
  const { analysis, aiProvider, fallbackReason } = await getAnalysisResult({ request, cvText, file });

  return {
    fullName: request.fullName,
    targetRole: request.targetRole,
    rewrittenCv: analysis.rewrittenCv || "",
    metadata: {
      ...buildMetadata(aiProvider, file, cvText),
      fallbackReason: fallbackReason || undefined
    }
  };
}

async function analyzeCvTextOnly(body = {}) {
  const cvText = String(body.cvText || "").trim();

  if (!cvText) {
    throw new AppError("cvText is required.", 400, "CV_TEXT_REQUIRED");
  }

  const request = normalizeRequest(body);
  const { analysis, aiProvider } = await getAnalysisResult({
    request,
    cvText,
    file: null
  });

  return {
    skills: analysis.skills || [],
    jobLevel: simulatedCareerAdvisor.getStructuredJobLevel(analysis.experienceLevel || "Junior", request.language),
    careerSuggestions: (analysis.careerRecommendations || []).slice(0, 3),
    missingSkills: analysis.missingSkills || [],
    atsScore: analysis.atsScore || 0,
    improvedCv: analysis.rewrittenCv || "",
    metadata: {
      provider: aiProvider.providerName,
      format: "structured-json",
      language: request.language
    }
  };
}

module.exports = {
  analyzeCareerProfile,
  rewriteCvOnly,
  analyzeCvTextOnly
};
