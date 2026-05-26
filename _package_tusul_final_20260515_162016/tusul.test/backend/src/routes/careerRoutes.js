const express = require("express");

const careerController = require("../controllers/careerController");
const { attachAuth, requireAuth } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// CV analysis — accepts file upload or raw JSON body
router.post("/analyze", attachAuth, upload.single("cvFile"), careerController.analyzeCareerProfile);
router.post("/rewrite", attachAuth, upload.single("cvFile"), careerController.rewriteCvOnly);
router.post("/analyze-text", careerController.analyzeCvTextOnly);

// History & per-analysis details (auth required)
router.get("/history", attachAuth, requireAuth, careerController.getHistory);
router.get("/analysis/:cvId", attachAuth, requireAuth, careerController.getAnalysis);

// PDF export
router.post("/export-pdf", attachAuth, careerController.exportAnalysisPdf);

// Rewrite suggestion actions (auth required)
router.post("/suggestions/:id/approve", attachAuth, requireAuth, careerController.approveSuggestion);
router.post("/suggestions/:id/reject", attachAuth, requireAuth, careerController.rejectSuggestion);
router.post("/suggestions/:id/regenerate", attachAuth, requireAuth, careerController.regenerateSuggestion);

module.exports = router;
