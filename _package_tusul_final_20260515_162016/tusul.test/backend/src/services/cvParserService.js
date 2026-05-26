const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");
const AppError = require("../utils/appError");

function normalizeText(text) {
  return String(text || "")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function parsePdf(file) {
  const parsed = await pdfParse(file.buffer).catch(() => {
    throw new AppError(
      "Could not read this PDF. It may be password-protected, scanned as an image, or corrupted.",
      400,
      "PDF_PARSE_FAILED"
    );
  });

  return normalizeText(parsed.text);
}

async function parseDocx(file) {
  const parsed = await mammoth.extractRawText({ buffer: file.buffer }).catch(() => {
    throw new AppError("Could not read this DOCX file.", 400, "DOCX_PARSE_FAILED");
  });

  return normalizeText(parsed.value);
}

async function extractCvText({ cvText, file }) {
  if (cvText && String(cvText).trim()) {
    return normalizeText(cvText);
  }

  if (!file) {
    throw new AppError("Please provide CV text or upload a supported PDF, DOCX, or TXT file.", 400, "CV_REQUIRED");
  }

  const name = file.originalname.toLowerCase();
  const isTextFile = file.mimetype === "text/plain" || name.endsWith(".txt");
  const isDocx =
    file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx");

  const extracted = isTextFile
    ? normalizeText(file.buffer.toString("utf8"))
    : isDocx
      ? await parseDocx(file)
      : await parsePdf(file);

  if (!extracted) {
    throw new AppError("No readable text was found in this CV file.", 400, "EMPTY_CV");
  }

  return extracted;
}

module.exports = {
  extractCvText
};
