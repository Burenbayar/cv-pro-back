const {
  detectSkills,
  estimateAtsScore,
  findMissingSkills,
  findWeakPoints,
  inferExperienceLevel,
  rewriteCvText
} = require("../../utils/cvHeuristics");
const { normalizeAnalysisResponse, buildInterviewPrep } = require("../../utils/analysisSchema");

const providerName = "simulated";

function unique(items) {
  return [...new Set((items || []).filter(Boolean))];
}

function mapExperienceLevelLabel(experienceLevel, language) {
  if (language !== "mn") {
    return experienceLevel;
  }

  if (experienceLevel === "Senior") {
    return "Ахисан түвшин";
  }

  if (experienceLevel === "Mid-Level") {
    return "Дунд түвшин";
  }

  return "Анхан шат";
}

function localizeWeakPoint(item) {
  const dictionary = {
    "Few measurable achievements are visible in the CV.": "CV дээр хэмжигдэхүйц, тоон үр дүнтэй амжилтууд хангалттай тодорхой харагдахгүй байна.",
    "The CV does not clearly showcase a broad enough skills section.": "Ур чадварын хэсэг хангалттай өргөн, уншихад хялбар байдлаар бүтэцлэгдээгүй байна.",
    "Project or professional experience descriptions need more detail.": "Төсөл болон ажлын туршлагын тайлбарууд илүү дэлгэрэнгүй, үр дүнд төвлөрсөн байх хэрэгтэй.",
    "A targeted professional summary is missing.": "Зорилтот ажлын чиглэлд тохирсон мэргэжлийн товч танилцуулга дутуу байна.",
    "No major weak points detected from the simulated analysis.": "Симуляцийн шинжилгээгээр ноцтой сул тал илрээгүй."
  };

  return dictionary[item] || item;
}

function buildMongolianCv(payload, skills, experienceLevel) {
  const skillText = skills.join(" | ") || "Тухайн ажлын байранд тохирох үндсэн ур чадваруудаа нэмнэ үү";

  return [
    payload.fullName.toUpperCase(),
    `${payload.targetRole} чиглэлд нэр дэвшигч`,
    "",
    "МЭРГЭЖЛИЙН ТОВЧ ТАНИЛЦУУЛГА",
    `${mapExperienceLevelLabel(experienceLevel, "mn")} түвшний ${payload.targetRole} чиглэлд ажиллах зорилготой нэр дэвшигч. ${skillText} дээр суурилсан туршлагатай бөгөөд бодит үр дүн гаргах, хурдан суралцах, багийн зорилгод хувь нэмэр оруулахад төвлөрдөг.`,
    "",
    "ГОЛ УР ЧАДВАРУУД",
    skillText,
    "",
    "ТУРШЛАГЫН ОНЦЛОХ ХЭСЭГ",
    "- Ажлын болон төслийн bullet бүрийг хүчтэй үйл үгээр эхлүүлж, хүрсэн үр дүнгээ тодорхой бичнэ.",
    "- Хурд, чанар, хэрэглэгч, орлого, зардал зэрэг хэмжигдэхүйц үзүүлэлтээр амжилтаа баталгаажуулна.",
    `- Амжилтуудаа ${payload.targetRole} албан тушаалын шаардлага, түлхүүр үгстэй уялдуулна.`,
    "",
    "ТӨСЛҮҮД",
    "- Ашигласан технологи, хамрах хүрээ, таны үүрэг, гарсан үр дүн бүхий 2-3 холбоотой төслийг оруулна.",
    "",
    "БОЛОВСРОЛ",
    "- Холбогдох боловсрол, сертификат, сургалтаа товч бөгөөд шалгахад хялбар байдлаар бичнэ."
  ].join("\n");
}

function buildLocalizedContent(payload, skills, experienceLevel, weakPoints, missingSkills) {
  if (payload.language === "mn") {
    const localizedLevel = mapExperienceLevelLabel(experienceLevel, "mn");

    return {
      experienceLevel: localizedLevel,
      weakPoints: weakPoints.map(localizeWeakPoint),
      careerRecommendations: unique([
        `${payload.targetRole} чиглэлийн одоогийн түвшинд тохирох ажлын байруудад төвлөрч, ажлын шаардлагатай CV түлхүүр үгээ нийцүүлээрэй.`,
        "Портфолио болон төслүүддээ хэмжигдэхүйц үр дүн, бизнесийн нөлөөг илүү тодорхой харуулаарай.",
        "Ярилцлага болон анкет илгээхдээ зорилтот албан тушаалд тохирсон кейс, жишээг онцлон ашиглаарай."
      ]),
      cvImprovementSuggestions: unique([
        "Сүүлийн ажлууд болон төслүүд дээрээ тоон үзүүлэлт, хэмжигдэхүйц амжилт нэмээрэй.",
        "Гол ур чадваруудаа богино, ангилалтай, уншихад хялбар хэсэг болгон бүтэцлээрэй.",
        "Мэргэжлийн товч танилцуулгаа зорилтот ажил, салбар, үнэ цэнийн саналтайгаа илүү нягт холбоорой."
      ]),
      summary: `${payload.fullName} нь ${payload.targetRole} чиглэлд ${localizedLevel.toLowerCase()} түвшний нэр дэвшигч бөгөөд CV дээрээс ${skills.length} гол ур чадвар илэрлээ.`,
      rewrittenCv: buildMongolianCv(payload, skills, experienceLevel),
      missingSkills
    };
  }

  return {
    experienceLevel,
    weakPoints,
    careerRecommendations: unique([
      `Target ${payload.targetRole} roles that match your current ${experienceLevel.toLowerCase()} profile.`,
      "Strengthen your portfolio with measurable outcomes and business impact.",
      "Use tailored project examples when applying to positions."
    ]),
    cvImprovementSuggestions: unique([
      "Add quantified achievements for each recent role or project.",
      "Group your core technical skills into a short, scannable section.",
      "Tailor the summary section toward the target role and domain."
    ]),
    summary: `${payload.fullName} appears to be a ${experienceLevel.toLowerCase()} candidate for ${payload.targetRole} with ${skills.length} identifiable skill areas in the CV.`,
    rewrittenCv: rewriteCvText(payload),
    missingSkills
  };
}

async function analyzeCareerProfile(payload) {
  const skills = detectSkills(payload.cvText);
  const experienceLevel = inferExperienceLevel(payload.cvText, payload.experienceYears);
  const weakPoints = findWeakPoints(payload.cvText, skills);
  const missingSkills = findMissingSkills(payload.cvText, payload.targetRole, skills).slice(0, 8);
  const atsScore = estimateAtsScore({
    cvText: payload.cvText,
    skills,
    weakPoints,
    targetRole: payload.targetRole,
    experienceYears: payload.experienceYears
  });
  const localized = buildLocalizedContent(payload, skills, experienceLevel, weakPoints, missingSkills);

  return normalizeAnalysisResponse({
    candidateName: payload.fullName,
    targetRole: payload.targetRole,
    skills,
    experienceLevel: localized.experienceLevel,
    weakPoints: localized.weakPoints,
    missingSkills: localized.missingSkills,
    careerRecommendations: localized.careerRecommendations,
    cvImprovementSuggestions: localized.cvImprovementSuggestions,
    rewrittenCv: localized.rewrittenCv,
    summary: localized.summary,
    interview: buildInterviewPrep({
      targetRole: payload.targetRole,
      skills,
      missingSkills,
      cvImprovementSuggestions: localized.cvImprovementSuggestions
    }, payload.language),
    language: payload.language,
    atsScore
  });
}

async function rewriteCv(payload) {
  const analysis = await analyzeCareerProfile(payload);
  return analysis.rewrittenCv;
}

function getStructuredJobLevel(experienceLevel, language) {
  if (language === "mn") {
    return mapExperienceLevelLabel(experienceLevel, language).toLowerCase();
  }

  const normalized = String(experienceLevel || "Junior").toLowerCase();
  if (normalized.includes("senior")) {
    return "senior";
  }
  if (normalized.includes("mid")) {
    return "mid";
  }
  return "junior";
}

module.exports = {
  providerName,
  analyzeCareerProfile,
  rewriteCv,
  getStructuredJobLevel
};
