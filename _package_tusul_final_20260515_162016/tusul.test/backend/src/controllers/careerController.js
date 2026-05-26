const careerAdvisorService = require("../services/careerAdvisorService");
const historyService = require("../services/historyService");
const pdfExportService = require("../services/pdfExportService");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");

const analyzeCareerProfile = asyncHandler(async (req, res) => {
  const result = await careerAdvisorService.analyzeCareerProfile({
    body: req.body,
    file: req.file
  });

  let cvId = null;
  let suggestions = [];

  if (req.authUser) {
    const lang = String(req.body.language || "mn") === "mn" ? "mn" : "en";
    const saved = await historyService.saveAnalysis({
      userId: req.authUser.id,
      fileName: req.file ? req.file.originalname : (req.body.cvText ? "cv-text.txt" : "cv.txt"),
      fileType: req.file
        ? (req.file.mimetype === "application/pdf" ? "pdf" : "docx")
        : "txt",
      rawText: req.body.cvText || req.body.cvContent || "",
      jobDescription: req.body.targetRole || req.body.jobGoal || "",
      rawResult: result,
      lang
    });
    cvId = saved.cv.id;
    suggestions = saved.suggestions.map((s) => ({
      id: s.id,
      type: s.type,
      severity: s.severity,
      original: s.original,
      suggestion: s.suggestion,
      explanation: s.explanation,
      status: s.status
    }));
  }

  res.json({ ...result, cvId, suggestions });
});

const rewriteCvOnly = asyncHandler(async (req, res) => {
  const result = await careerAdvisorService.rewriteCvOnly({
    body: req.body,
    file: req.file
  });
  res.json(result);
});

const analyzeCvTextOnly = asyncHandler(async (req, res) => {
  const result = await careerAdvisorService.analyzeCvTextOnly(req.body);
  res.json(result);
});

const getHistory = asyncHandler(async (req, res) => {
  const history = await historyService.listHistoryByUser(req.authUser.id);
  res.json({ history });
});

const getAnalysis = asyncHandler(async (req, res) => {
  const { cvId } = req.params;
  const record = await historyService.getAnalysisWithSuggestions(cvId, req.authUser.id);
  if (!record) {
    throw new AppError("Analysis not found.", 404, "NOT_FOUND");
  }
  res.json({ record });
});

const exportAnalysisPdf = asyncHandler(async (req, res) => {
  const pdf = await pdfExportService.createAnalysisPdf(req.body);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${pdf.filename}"`);
  res.setHeader("Content-Length", pdf.buffer.length);
  res.send(pdf.buffer);
});

const approveSuggestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updated = await historyService.approveSuggestion(id, req.authUser.id);
  if (!updated) throw new AppError("Suggestion not found.", 404, "NOT_FOUND");
  res.json({ success: true, suggestion: updated });
});

const rejectSuggestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updated = await historyService.rejectSuggestion(id, req.authUser.id);
  if (!updated) throw new AppError("Suggestion not found.", 404, "NOT_FOUND");
  res.json({ success: true, suggestion: updated });
});

const regenerateSuggestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updated = await historyService.regenerateSuggestion(id, req.authUser.id);
  if (!updated) throw new AppError("Suggestion not found.", 404, "NOT_FOUND");
  res.json({ success: true, suggestion: updated });
});

module.exports = {
  analyzeCareerProfile,
  rewriteCvOnly,
  analyzeCvTextOnly,
  getHistory,
  getAnalysis,
  exportAnalysisPdf,
  approveSuggestion,
  rejectSuggestion,
  regenerateSuggestion
};
