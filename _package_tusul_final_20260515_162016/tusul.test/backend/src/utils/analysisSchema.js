const AppError = require("./appError");

function ensureString(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function ensureStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => ensureString(item))
    .filter(Boolean);
}

function ensureScore(value) {
  const score = Number(value);
  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function buildInterviewPrep(payload = {}, lang = "en") {
  const role = payload.targetRole || (lang === "mn" ? "зорилтот ажлын байр" : "the target role");
  const skills = Array.isArray(payload.skills) ? payload.skills.slice(0, 4).join(", ") : "";
  const topSkills = skills || (lang === "mn" ? "CV дээрх гол ур чадварууд" : "the strongest skills from the CV");
  const skillGap = Array.isArray(payload.missingSkills) && payload.missingSkills[0]
    ? payload.missingSkills[0]
    : (lang === "mn" ? "шинээр хөгжүүлэх шаардлагатай ур чадвар" : "a skill gap for the role");

  if (lang === "mn") {
    return {
      technical: [
        `Асуулт: ${role} чиглэлд ${topSkills} ур чадвараа ашигласан нэг төслөө тайлбарлана уу.\nХариултын санаа: Төслийн зорилго, таны үүрэг, ашигласан хэрэгсэл, гарсан үр дүнг STAR бүтэцтэй хэл.`,
        `Асуулт: ${skillGap}-ийг богино хугацаанд нөхөхийн тулд ямар төлөвлөгөө гаргах вэ?\nХариултын санаа: Сурах эх сурвалж, хэрэгжүүлэх жижиг төсөл, хэмжих үзүүлэлтээ тодорхой хэл.`,
        `Асуулт: CV дээрх хамгийн хүчтэй туршлагаа ${role}-ийн шаардлагатай яаж холбох вэ?\nХариултын санаа: Ажил олгогчийн хэрэгцээ, өөрийн хийсэн үйлдэл, бизнест өгсөн үнэ цэнийг холбо.`,
        `Асуулт: ${topSkills} ашиглах үед гарсан хүндрэл, trade-off-оо тайлбарлана уу.\nХариултын санаа: Сонгосон шийдэл, шалтгаан, дараа нь юу сайжруулах байснаа хэл.`
      ],
      hr: [
        `Асуулт: Яагаад ${role} чиглэлд ажиллахыг хүсэж байна вэ?\nХариултын санаа: Карьерын зорилго, одоогийн ур чадвар, байгууллагад өгөх үнэ цэнээ холбо.`,
        "Асуулт: Таны хамгийн хүчтэй давуу тал юу вэ?\nХариултын санаа: Нэг бодит жишээ, хийсэн үйлдэл, үр дүнгээр батал.",
        "Асуулт: Сул талаа хэрхэн сайжруулж байгаа вэ?\nХариултын санаа: Тодорхой алхам, сурах төлөвлөгөө, ахиц хэмжих аргаа хэл."
      ],
      behavioral: [
        "Асуулт: Deadline шахуу үед ажлаа хэрхэн эрэмбэлж байсан бэ?\nХариултын санаа: Priority, харилцаа, хэрэгжилт, эцсийн үр дүнг STAR-аар хэл.",
        "Асуулт: Санал зөрөлдсөн багийн нөхцөл байдлыг яаж шийдсэн бэ?\nХариултын санаа: Сонссон байдал, баримтаар ярьсан арга, тохиролцсон шийдлээ дурд.",
        "Асуулт: Шинэ зүйл хурдан сурах шаардлагатай үед ямар арга хэрэглэдэг вэ?\nХариултын санаа: Сурах эх сурвалж, дадлага хийх арга, ажил дээр ашигласан жишээ хэл."
      ],
      suggestedAnswers: [
        "STAR бүтэц ашигла: Situation, Task, Action, Result.",
        "Технологи, шийдвэрийн шалтгаан, хэмжигдэхүйц үр дүнг боломжтой үед заавал оруул.",
        "Монгол хэл сонгосон бол Latin-р бичсэн монголыг Кириллээр цэгцэлж хэрэглэ.",
        "CV дээр байхгүй ажил, компани, огноо, сертификат зохиож хэлэхгүй."
      ]
    };
  }

  return {
    technical: [
      `Question: Walk me through one project where you used ${topSkills} for ${role}.\nSuggested answer: Cover the goal, your role, tools used, tradeoffs, and measurable outcome using STAR.`,
      `Question: How would you close the gap around ${skillGap}?\nSuggested answer: Name the learning plan, a small project, and how you would measure progress.`,
      `Question: Which experience from your CV best matches ${role}, and why?\nSuggested answer: Tie the employer need to your action and the business value you created.`,
      `Question: Describe a technical tradeoff you made while using ${topSkills}.\nSuggested answer: Explain options, decision criteria, final choice, and what you would improve next.`
    ],
    hr: [
      `Question: Why are you interested in ${role}?\nSuggested answer: Connect your career goal, strengths, and value for the team.`,
      "Question: What is your strongest professional strength?\nSuggested answer: Use one real example with your action and result.",
      "Question: How are you improving your main development area?\nSuggested answer: Acknowledge the gap and describe concrete steps already in progress."
    ],
    behavioral: [
      "Question: Tell me about a time you worked under a tight deadline.\nSuggested answer: Explain prioritization, communication, execution, and result.",
      "Question: Tell me about a disagreement with a teammate.\nSuggested answer: Show how you listened, used evidence, and aligned on a decision.",
      "Question: How do you learn something new quickly?\nSuggested answer: Describe sources, practice method, and a real example of applying the skill."
    ],
    suggestedAnswers: [
      "Use STAR: Situation, Task, Action, Result.",
      "Include tools, decision rationale, and measurable results when possible.",
      "Do not invent employers, dates, certifications, or achievements that are not in the CV.",
      "Close each answer by connecting the example back to the target role."
    ]
  };
}

function ensureInterview(value, fallback) {
  const technical = ensureStringArray(value && value.technical);
  const hr = ensureStringArray(value && value.hr);
  const behavioral = ensureStringArray(value && value.behavioral);
  const suggestedAnswers = ensureStringArray(value && value.suggestedAnswers);

  return {
    technical: technical.length ? technical : fallback.technical,
    hr: hr.length ? hr : fallback.hr,
    behavioral: behavioral.length ? behavioral : fallback.behavioral,
    suggestedAnswers: suggestedAnswers.length ? suggestedAnswers : fallback.suggestedAnswers
  };
}

function normalizeAnalysisResponse(payload = {}) {
  const normalized = {
    candidateName: ensureString(payload.candidateName, "Candidate"),
    targetRole: ensureString(payload.targetRole, "Generalist"),
    skills: ensureStringArray(payload.skills),
    experienceLevel: ensureString(payload.experienceLevel, "Junior"),
    weakPoints: ensureStringArray(payload.weakPoints),
    missingSkills: ensureStringArray(payload.missingSkills || payload.missing_skills),
    careerRecommendations: ensureStringArray(payload.careerRecommendations),
    cvImprovementSuggestions: ensureStringArray(payload.cvImprovementSuggestions),
    rewrittenCv: ensureString(payload.rewrittenCv),
    summary: ensureString(payload.summary),
    atsScore: ensureScore(payload.atsScore || payload.ats_score)
  };
  normalized.interview = ensureInterview(
    payload.interview,
    buildInterviewPrep(normalized, payload.language === "mn" ? "mn" : "en")
  );

  if (!normalized.rewrittenCv) {
    throw new AppError("AI response is missing rewrittenCv.", 502, "AI_RESPONSE_INVALID");
  }

  return normalized;
}

module.exports = {
  normalizeAnalysisResponse,
  buildInterviewPrep
};
