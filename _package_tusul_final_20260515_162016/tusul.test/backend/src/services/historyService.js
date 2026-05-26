const prisma = require("../lib/prisma");

function buildScores(raw, lang) {
  const ats = Number(raw.atsScore || 75);
  const skillCount = Array.isArray(raw.skills) ? raw.skills.length : 0;
  const skillsScore = Math.min(100, 50 + skillCount * 4);
  const weakCount = Array.isArray(raw.weakPoints) ? raw.weakPoints.length : 0;
  const experienceScore = weakCount < 2 ? 88 : 76;

  return [
    {
      key: "atsScore",
      label: lang === "mn" ? "ATS оноо" : "ATS Score",
      value: Math.min(100, ats),
      explanation: lang === "mn" ? "Keyword болон бүтэц ATS-д уншигдах байдал." : "Keyword and structure ATS readability.",
      confidence: 0.85
    },
    {
      key: "readability",
      label: lang === "mn" ? "Уншигдах байдал" : "Readability",
      value: 80,
      explanation: lang === "mn" ? "Ерөнхий flow болон бүтэц." : "Overall flow and structure.",
      confidence: 0.82
    },
    {
      key: "skillsMatch",
      label: lang === "mn" ? "Skill match" : "Skills Match",
      value: Math.min(100, skillsScore),
      explanation: lang === "mn" ? "Skill болон keyword тохирол." : "Skills and keyword alignment.",
      confidence: 0.80
    },
    {
      key: "experience",
      label: lang === "mn" ? "Туршлага" : "Experience",
      value: experienceScore,
      explanation: lang === "mn" ? "Туршлагын тайлбарын хүч." : "Strength of experience descriptions.",
      confidence: 0.78
    },
    {
      key: "grammar",
      label: "Grammar",
      value: 90,
      explanation: lang === "mn" ? "Бичвэрийн чанар болон professional tone." : "Writing quality and professional tone.",
      confidence: 0.88
    }
  ];
}

function buildFeedback(raw, lang) {
  const suggestions = Array.isArray(raw.cvImprovementSuggestions) ? raw.cvImprovementSuggestions : [];
  const weakPoints = Array.isArray(raw.weakPoints) ? raw.weakPoints : [];
  const severities = ["high", "medium", "low", "low"];

  return suggestions.slice(0, 4).map((suggestion, i) => ({
    type: "cv_improvement",
    severity: severities[i] || "low",
    original: weakPoints[i] || (lang === "mn" ? "CV хэсэг сайжруулах шаардлагатай" : "CV section needs improvement"),
    suggestion,
    explanation: lang === "mn"
      ? "ATS болон recruiter уншигдах байдлыг сайжруулна."
      : "Improves ATS alignment and recruiter readability."
  }));
}

function buildInterview(raw, lang) {
  if (raw.interview) {
    const technical = Array.isArray(raw.interview.technical) ? raw.interview.technical.filter(Boolean) : [];
    const hr = Array.isArray(raw.interview.hr) ? raw.interview.hr.filter(Boolean) : [];
    const behavioral = Array.isArray(raw.interview.behavioral) ? raw.interview.behavioral.filter(Boolean) : [];
    const suggestedAnswers = Array.isArray(raw.interview.suggestedAnswers) ? raw.interview.suggestedAnswers.filter(Boolean) : [];

    if (technical.length || hr.length || behavioral.length || suggestedAnswers.length) {
      return { technical, hr, behavioral, suggestedAnswers };
    }
  }

  const role = raw.targetRole || (lang === "mn" ? "ажлын байр" : "the role");
  if (lang === "mn") {
    return {
      technical: [
        `${role} чиглэлд гол ур чадваруудаа жишээгээр тайлбарлана уу.`,
        "Хамгийн хэцүү техникийн асуудлыг хэрхэн шийдсэнээ тайлбарлана уу.",
        "Ашиглаж буй хөгжүүлэлтийн арга зүйгээ тайлбарлана уу."
      ],
      hr: [
        "Өөрийн хамгийн хүчтэй давуу талаа нэг төслийн жишээгээр тайлбарлана уу.",
        "Шинэ технологи хурдан сурахдаа ямар арга барил ашигладаг вэ?"
      ],
      behavioral: [
        "Deadline шахуу үед багийн priority-г яаж тогтоож байсан бэ?",
        "Хамт олны санал зөрсөн тохиолдлыг хэрхэн шийдсэн бэ?"
      ],
      suggestedAnswers: [
        "STAR аргачлал ашигла: Situation, Task, Action, Result.",
        "Хариулт бүрт technology, decision, measurable result оруулахыг зорь."
      ]
    };
  }
  return {
    technical: [
      `Describe your core skills for ${role} with specific examples.`,
      "Explain how you solved the most difficult technical problem you faced.",
      "Describe your development methodology and workflow."
    ],
    hr: [
      "Describe your greatest strength with a real project example.",
      "How do you approach learning new technologies quickly?"
    ],
    behavioral: [
      "How did you prioritize work when facing a tight deadline?",
      "Tell me about a time you disagreed with a teammate and how you resolved it."
    ],
    suggestedAnswers: [
      "Use STAR method: Situation, Task, Action, Result.",
      "Include technology, decision rationale, and measurable results in each answer."
    ]
  };
}

function buildCareer(raw, lang) {
  const recs = Array.isArray(raw.careerRecommendations) ? raw.careerRecommendations : [];
  const missing = Array.isArray(raw.missingSkills) ? raw.missingSkills : [];
  return {
    currentLevel: raw.experienceLevel || (lang === "mn" ? "Анхан шат" : "Junior"),
    recommendedRoles: recs.slice(0, 4),
    missingSkills: missing,
    roadmap: recs.length
      ? recs.slice(0, 4).map((rec, i) => `${i + 1}. ${rec}`)
      : [lang === "mn" ? "Карьерын зорилгоо тодорхойлно уу." : "Define your career goals."],
    estimatedDuration: lang === "mn" ? "3-6 сар" : "3-6 months"
  };
}

async function saveAnalysis({ userId, fileName, fileType, rawText, jobDescription, rawResult, lang = "mn" }) {
  const scores = buildScores(rawResult, lang);
  const overall = Math.round(scores.reduce((sum, s) => sum + s.value, 0) / scores.length);
  const feedbackItems = buildFeedback(rawResult, lang);

  const cv = await prisma.cvSubmission.create({
    data: {
      userId,
      fileName: fileName || "cv.txt",
      fileType: fileType || "txt",
      status: "completed",
      rawText: rawText ? rawText.slice(0, 20000) : null,
      jobDescription: jobDescription ? jobDescription.slice(0, 2000) : null,
      overall
    }
  });

  const analysis = await prisma.analysisResult.create({
    data: {
      cvId: cv.id,
      scores,
      summary: rawResult.summary || "",
      strengths: Array.isArray(rawResult.skills) ? rawResult.skills.slice(0, 5) : [],
      weaknesses: Array.isArray(rawResult.weakPoints) ? rawResult.weakPoints : [],
      keywordsMissing: Array.isArray(rawResult.missingSkills) ? rawResult.missingSkills : [],
      keywordsRecommended: Array.isArray(rawResult.skills) ? rawResult.skills : [],
      interview: buildInterview(rawResult, lang),
      career: buildCareer(rawResult, lang)
    }
  });

  const suggestions = await Promise.all(
    feedbackItems.map((item) =>
      prisma.rewriteSuggestion.create({
        data: {
          analysisId: analysis.id,
          type: item.type,
          severity: item.severity,
          original: item.original,
          suggestion: item.suggestion,
          explanation: item.explanation,
          status: "pending"
        }
      })
    )
  );

  return { cv, analysis, suggestions, overall };
}

async function listHistoryByUser(userId) {
  return prisma.cvSubmission.findMany({
    where: { userId },
    orderBy: { uploadedAt: "desc" },
    take: 50,
    include: {
      analysis: {
        select: { id: true, summary: true, scores: true, createdAt: true }
      }
    }
  });
}

async function getAnalysisWithSuggestions(cvId, userId) {
  const cv = await prisma.cvSubmission.findFirst({
    where: { id: cvId, userId },
    include: {
      analysis: {
        include: { suggestions: { orderBy: { createdAt: "asc" } } }
      }
    }
  });
  return cv;
}

async function approveSuggestion(suggestionId, userId) {
  const suggestion = await prisma.rewriteSuggestion.findUnique({
    where: { id: suggestionId },
    include: { analysis: { include: { cv: true } } }
  });
  if (!suggestion || suggestion.analysis.cv.userId !== userId) {
    return null;
  }
  return prisma.rewriteSuggestion.update({
    where: { id: suggestionId },
    data: { status: "accepted" }
  });
}

async function rejectSuggestion(suggestionId, userId) {
  const suggestion = await prisma.rewriteSuggestion.findUnique({
    where: { id: suggestionId },
    include: { analysis: { include: { cv: true } } }
  });
  if (!suggestion || suggestion.analysis.cv.userId !== userId) {
    return null;
  }
  return prisma.rewriteSuggestion.update({
    where: { id: suggestionId },
    data: { status: "rejected" }
  });
}

async function regenerateSuggestion(suggestionId, userId) {
  const suggestion = await prisma.rewriteSuggestion.findUnique({
    where: { id: suggestionId },
    include: { analysis: { include: { cv: true } } }
  });
  if (!suggestion || suggestion.analysis.cv.userId !== userId) {
    return null;
  }
  const extra = " Мөн үр дүнг тоон үзүүлэлтээр тодруулж, target role-ийн keyword-үүдтэй уялдуулах боломжтой.";
  return prisma.rewriteSuggestion.update({
    where: { id: suggestionId },
    data: { suggestion: suggestion.suggestion + extra, status: "pending" }
  });
}

module.exports = {
  saveAnalysis,
  listHistoryByUser,
  getAnalysisWithSuggestions,
  approveSuggestion,
  rejectSuggestion,
  regenerateSuggestion
};
