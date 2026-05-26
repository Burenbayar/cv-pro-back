const express = require("express");

const authController = require("../controllers/authController");
const { attachAuth, requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/register", authController.signup);
router.post("/login", authController.login);
router.get("/me", attachAuth, requireAuth, authController.me);
router.post("/logout", attachAuth, requireAuth, authController.logout);

module.exports = router;
