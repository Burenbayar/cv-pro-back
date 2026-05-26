const skillKeywords = [
  "javascript",
  "typescript",
  "node.js",
  "express",
  "react",
  "html",
  "css",
  "python",
  "sql",
  "mongodb",
  "postgresql",
  "aws",
  "docker",
  "git",
  "rest api",
  "figma",
  "machine learning",
  "data analysis",
  "communication",
  "leadership"
];

const roleSkillMap = [
  {
    match: ["frontend", "front-end", "react", "ui"],
    skills: ["React", "TypeScript", "REST API", "Testing", "Accessibility"]
  },
  {
    match: ["backend", "back-end", "node", "api"],
    skills: ["Node.js", "Express", "SQL", "REST API", "Docker"]
  },
  {
    match: ["data", "analyst", "analytics"],
    skills: ["Python", "SQL", "Data Analysis", "Statistics", "Dashboarding"]
  },
  {
    match: ["product", "manager"],
    skills: ["Roadmapping", "Stakeholder Communication", "Analytics", "User Research"]
  }
];

function detectSkills(cvText) {
  const text = String(cvText || "").toLowerCase();

  return skillKeywords
    .filter((skill) => text.includes(skill))
    .map((skill) => skill.replace(/\b\w/g, (char) => char.toUpperCase()));
}

function findMissingSkills(cvText, targetRole, detectedSkills = []) {
  const text = `${targetRole || ""} ${cvText || ""}`.toLowerCase();
  const detected = new Set(detectedSkills.map((skill) => skill.toLowerCase()));
  const role = roleSkillMap.find((entry) => entry.match.some((keyword) => text.includes(keyword)));
  const expected = role ? role.skills : ["Communication", "Project Experience", "Measurable Achievements"];

  return expected.filter((skill) => !detected.has(skill.toLowerCase()) && !text.includes(skill.toLowerCase()));
}

function estimateAtsScore({ cvText, skills, weakPoints, targetRole, experienceYears }) {
  const text = String(cvText || "").toLowerCase();
  let score = 45;

  score += Math.min((skills || []).length, 10) * 4;
  score += String(targetRole || "").trim() ? 8 : 0;
  score += Number(experienceYears || 0) > 0 ? 6 : 0;
  score += /\d+%|\$\d+|\d+\+/.test(text) ? 10 : 0;
  score += text.includes("summary") || text.includes("profile") ? 6 : 0;
  score -= Math.min((weakPoints || []).length, 5) * 5;

  return Math.max(20, Math.min(98, Math.round(score)));
}

function inferExperienceLevel(cvText, experienceYears) {
  const normalizedYears = Number(experienceYears || 0);
  const text = String(cvText || "").toLowerCase();

  if (normalizedYears >= 8 || text.includes("senior") || text.includes("lead")) {
    return "Senior";
  }

  if (normalizedYears >= 3 || text.includes("mid-level") || text.includes("specialist")) {
    return "Mid-Level";
  }

  return "Junior";
}

function findWeakPoints(cvText, skills) {
  const text = String(cvText || "").toLowerCase();
  const weakPoints = [];

  if (!/\d+%|\$\d+|\d+\+/.test(text)) {
    weakPoints.push("Few measurable achievements are visible in the CV.");
  }

  if (skills.length < 5) {
    weakPoints.push("The CV does not clearly showcase a broad enough skills section.");
  }

  if (!text.includes("project") && !text.includes("experience")) {
    weakPoints.push("Project or professional experience descriptions need more detail.");
  }

  if (!text.includes("summary") && !text.includes("profile")) {
    weakPoints.push("A targeted professional summary is missing.");
  }

  return weakPoints.length ? weakPoints : ["No major weak points detected from the simulated analysis."];
}

function rewriteCvText(payload) {
  const skills = detectSkills(payload.cvText);
  const experienceLevel = inferExperienceLevel(payload.cvText, payload.experienceYears);
  const titleSuffix = payload.titleSuffix || "Candidate";
  const summaryLabel = payload.summaryLabel || "PROFESSIONAL SUMMARY";
  const skillsLabel = payload.skillsLabel || "CORE SKILLS";
  const highlightsLabel = payload.highlightsLabel || "EXPERIENCE HIGHLIGHTS";
  const projectsLabel = payload.projectsLabel || "PROJECTS";
  const educationLabel = payload.educationLabel || "EDUCATION";
  const summaryText = payload.summaryText || `${experienceLevel} candidate targeting ${payload.targetRole} opportunities with experience across ${skills.slice(0, 6).join(", ") || "relevant technical and professional skills"}. Focused on delivering practical results, learning quickly, and contributing to high-impact teams.`;
  const highlights = payload.highlights || [
    "- Rework each role bullet to begin with a strong action verb.",
    "- Add quantified impact such as revenue, speed, quality, or user growth improvements.",
    `- Tailor accomplishments to ${payload.targetRole} expectations and hiring keywords.`
  ];
  const projects = payload.projects || [
    "- Include 2 to 3 relevant projects with tools used, scope, and outcomes."
  ];
  const education = payload.education || [
    "- Add your education, certifications, and recent coursework if relevant."
  ];

  return [
    `${payload.fullName.toUpperCase()}`,
    `${payload.targetRole} ${titleSuffix}`,
    "",
    summaryLabel,
    summaryText,
    "",
    skillsLabel,
    skills.join(" | ") || "Add role-specific technical and soft skills here",
    "",
    highlightsLabel,
    ...highlights,
    "",
    projectsLabel,
    ...projects,
    "",
    educationLabel,
    ...education
  ].join("\n");
}

module.exports = {
  detectSkills,
  findMissingSkills,
  estimateAtsScore,
  inferExperienceLevel,
  findWeakPoints,
  rewriteCvText
};
