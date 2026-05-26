const fs = require("fs");
const PDFDocument = require("pdfkit");
const { normalizeAnalysisResponse } = require("../utils/analysisSchema");

const SIDEBAR_WIDTH = 185;
const SIDEBAR_BG = "#1a2744";
const SIDEBAR_DARK2 = "#243354";
const ACCENT = "#f59e0b";
const WHITE = "#ffffff";
const SIDEBAR_MUTED = "#94a3b8";
const CONTENT_DARK = "#0f172a";
const CONTENT_MED = "#475569";
const DIVIDER = "#e2e8f0";

const fontCandidates = [
  "C:\\Windows\\Fonts\\arial.ttf",
  "C:\\Windows\\Fonts\\segoeui.ttf",
  "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
  "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
];

function getFontPath() {
  return fontCandidates.find((f) => fs.existsSync(f));
}

function normalizeResult(payload = {}) {
  const r = payload.result || payload.analysis || payload;
  return normalizeAnalysisResponse({
    candidateName: r.candidateName,
    targetRole: r.targetRole,
    skills: r.skills,
    experienceLevel: r.experienceLevel || r.experience_level || r.jobLevel,
    atsScore: r.atsScore || r.ats_score,
    weakPoints: r.weakPoints || r.weaknesses,
    missingSkills: r.missingSkills || r.missing_skills,
    careerRecommendations:
      r.careerRecommendations || r.job_recommendations || r.careerSuggestions,
    cvImprovementSuggestions: r.cvImprovementSuggestions,
    rewrittenCv: r.rewrittenCv || r.improved_cv || r.improvedCv,
    summary: r.summary,
    interview: r.interview,
    language: payload.language || r.language,
  });
}

function sanitizeFilename(value) {
  return (
    String(value || "improved-cv")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "improved-cv"
  );
}

function getInitials(name) {
  return (name || "CV")
    .split(" ")
    .slice(0, 2)
    .map((n) => n.charAt(0).toUpperCase())
    .join("");
}

function getProfileImageBuffer(payload) {
  const b64 =
    payload.profileImage ||
    (payload.result && payload.result.profileImage) ||
    "";
  if (!b64) return null;
  try {
    const data = b64.includes(",") ? b64.split(",")[1] : b64;
    return Buffer.from(data, "base64");
  } catch {
    return null;
  }
}

function drawInitialsCircle(doc, cx, py, pr, name) {
  doc.circle(cx, py, pr).fill("#2d4a8a");
  doc
    .fillColor(WHITE)
    .fontSize(22)
    .text(getInitials(name), 0, py - 14, {
      width: SIDEBAR_WIDTH,
      align: "center",
    });
}

function drawSidebarPage(doc, result, profileImageBuffer, isFirstPage) {
  const SB = SIDEBAR_WIDTH;
  const pageH = doc.page.height;
  const cx = SB / 2;

  doc.rect(0, 0, SB, pageH).fill(SIDEBAR_BG);

  if (isFirstPage) {
    const PR = 48;
    const PY = 82;

    if (profileImageBuffer) {
      try {
        doc.save();
        doc.circle(cx, PY, PR).clip();
        doc.image(profileImageBuffer, cx - PR, PY - PR, {
          width: PR * 2,
          height: PR * 2,
        });
        doc.restore();
        doc
          .circle(cx, PY, PR + 2)
          .lineWidth(2)
          .strokeColor(SIDEBAR_DARK2)
          .stroke();
      } catch {
        drawInitialsCircle(doc, cx, PY, PR, result.candidateName);
      }
    } else {
      drawInitialsCircle(doc, cx, PY, PR, result.candidateName);
    }

    let sy = PY + PR + 20;

    doc
      .fillColor(WHITE)
      .fontSize(13)
      .text(result.candidateName || "Candidate", 10, sy, {
        width: SB - 20,
        align: "center",
        lineGap: 1,
      });
    sy = doc.y + 6;

    doc
      .fillColor(SIDEBAR_MUTED)
      .fontSize(9)
      .text(result.targetRole || "", 10, sy, {
        width: SB - 20,
        align: "center",
      });
    sy = doc.y + 18;

    doc
      .moveTo(20, sy)
      .lineTo(SB - 20, sy)
      .strokeColor(ACCENT)
      .lineWidth(1.5)
      .stroke();
    sy += 18;

    const skills = (
      result.keywords?.recommended ||
      result.skills ||
      []
    ).slice(0, 13);

    if (skills.length) {
      doc
        .fillColor(ACCENT)
        .fontSize(7.5)
        .text("SKILLS", 16, sy, { characterSpacing: 1.2 });
      sy = doc.y + 10;
      for (const s of skills) {
        if (sy > pageH - 100) break;
        doc
          .fillColor(WHITE)
          .fontSize(8.5)
          .text(`• ${s}`, 16, sy, { width: SB - 32 });
        sy = doc.y + 3;
      }
      sy += 12;
    }

    const career = result.career || {};

    if (career.currentLevel && sy < pageH - 100) {
      doc
        .moveTo(20, sy)
        .lineTo(SB - 20, sy)
        .strokeColor(SIDEBAR_DARK2)
        .lineWidth(1)
        .stroke();
      sy += 16;
      doc
        .fillColor(ACCENT)
        .fontSize(7.5)
        .text("EXPERIENCE LEVEL", 16, sy, { characterSpacing: 1.2 });
      sy = doc.y + 8;
      doc
        .fillColor(WHITE)
        .fontSize(8.5)
        .text(career.currentLevel, 16, sy, { width: SB - 32 });
      sy = doc.y + 14;
    }

    const roles = career.recommendedRoles || [];
    if (roles.length && sy < pageH - 120) {
      doc
        .moveTo(20, sy)
        .lineTo(SB - 20, sy)
        .strokeColor(SIDEBAR_DARK2)
        .lineWidth(1)
        .stroke();
      sy += 16;
      doc
        .fillColor(ACCENT)
        .fontSize(7.5)
        .text("TARGET ROLES", 16, sy, { characterSpacing: 1.2 });
      sy = doc.y + 8;
      for (const role of roles.slice(0, 3)) {
        if (sy > pageH - 80) break;
        doc
          .fillColor(SIDEBAR_MUTED)
          .fontSize(8)
          .text(`• ${role}`, 16, sy, { width: SB - 32 });
        sy = doc.y + 3;
      }
    }
  } else {
    let sy = 44;
    doc
      .fillColor(ACCENT)
      .fontSize(7.5)
      .text("AI CAREER ADVISOR", 16, sy, {
        width: SB - 32,
        align: "center",
        characterSpacing: 0.5,
      });
    sy = doc.y + 10;
    doc
      .fillColor(WHITE)
      .fontSize(11)
      .text(result.candidateName || "Candidate", 10, sy, {
        width: SB - 20,
        align: "center",
      });
    sy = doc.y + 8;
    doc
      .fillColor(SIDEBAR_MUTED)
      .fontSize(8.5)
      .text(result.targetRole || "", 10, sy, {
        width: SB - 20,
        align: "center",
      });
  }
}

function createAnalysisPdf(payload) {
  const result = normalizeResult(payload);
  const profileImageBuffer = getProfileImageBuffer(payload);

  const SB = SIDEBAR_WIDTH;
  const CX = SB + 24;

  const doc = new PDFDocument({
    size: "A4",
    bufferPages: true,
    margins: {
      top: 48,
      bottom: 48,
      left: CX,
      right: 24,
    },
    info: {
      Title: `${result.candidateName || "Candidate"} — AI Improved CV`,
      Author: "AI Career Advisor",
    },
  });

  const chunks = [];
  doc.on("data", (c) => chunks.push(c));

  const fontPath = getFontPath();
  if (fontPath) {
    doc.registerFont("Regular", fontPath);
    doc.font("Regular");
  }

  const CW = doc.page.width - CX - 24;

  doc
    .fillColor(ACCENT)
    .fontSize(8)
    .text("AI CAREER ADVISOR — OPTIMIZED CV", { characterSpacing: 0.5 });
  doc.moveDown(0.4);

  doc
    .fillColor(CONTENT_DARK)
    .fontSize(22)
    .text(result.candidateName || "Candidate");
  doc.moveDown(0.2);

  doc.fillColor(CONTENT_MED).fontSize(11).text(result.targetRole || "");
  doc.moveDown(0.5);

  const divY1 = doc.y;
  doc
    .moveTo(CX, divY1)
    .lineTo(doc.page.width - 24, divY1)
    .strokeColor(DIVIDER)
    .lineWidth(0.8)
    .stroke();
  doc.moveDown(0.8);

  if (result.summary) {
    doc
      .fillColor(CONTENT_DARK)
      .fontSize(8.5)
      .text("PROFESSIONAL SUMMARY", { characterSpacing: 0.5 });
    doc.moveDown(0.3);
    doc
      .fillColor(CONTENT_MED)
      .fontSize(9.5)
      .text(result.summary, { lineGap: 2.5 });
    doc.moveDown(0.7);
    const divY2 = doc.y;
    doc
      .moveTo(CX, divY2)
      .lineTo(doc.page.width - 24, divY2)
      .strokeColor("#f1f5f9")
      .lineWidth(0.5)
      .stroke();
    doc.moveDown(0.6);
  }

  if (result.rewrittenCv) {
    doc
      .fillColor(CONTENT_DARK)
      .fontSize(8.5)
      .text("IMPROVED CV", { characterSpacing: 0.5 });
    doc.moveDown(0.3);
    doc
      .fillColor(CONTENT_MED)
      .fontSize(9)
      .text(result.rewrittenCv, { lineGap: 2, paragraphGap: 5 });
    doc.moveDown(0.8);
  }

  const recommended = (result.keywords || {}).recommended || [];
  if (recommended.length) {
    const divY3 = doc.y;
    doc
      .moveTo(CX, divY3)
      .lineTo(doc.page.width - 24, divY3)
      .strokeColor("#f1f5f9")
      .lineWidth(0.5)
      .stroke();
    doc.moveDown(0.6);
    doc
      .fillColor(CONTENT_DARK)
      .fontSize(8.5)
      .text("CORE KEYWORDS & SKILLS", { characterSpacing: 0.5 });
    doc.moveDown(0.3);
    doc
      .fillColor(CONTENT_MED)
      .fontSize(9)
      .text(recommended.slice(0, 15).join(" • "), { lineGap: 2 });
  }

  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    drawSidebarPage(doc, result, profileImageBuffer, i === range.start);
    doc
      .fillColor(SIDEBAR_MUTED)
      .fontSize(7)
      .text(
        `AI Career Advisor  —  Page ${i - range.start + 1} of ${range.count}`,
        CX,
        doc.page.height - 30,
        { width: CW, align: "center" }
      );
  }

  return new Promise((resolve) => {
    doc.on("end", () => {
      resolve({
        buffer: Buffer.concat(chunks),
        filename: `${sanitizeFilename(
          result.candidateName || result.targetRole
        )}-improved-cv.pdf`,
      });
    });
    doc.end();
  });
}

module.exports = { createAnalysisPdf };
