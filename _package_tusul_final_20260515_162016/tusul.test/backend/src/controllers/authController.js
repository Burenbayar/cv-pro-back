const asyncHandler = require("../utils/asyncHandler");
const authService = require("../services/authService");

const signup = asyncHandler(async (req, res) => {
  const result = await authService.signup({
    fullName: req.body.fullName,
    email: req.body.email,
    password: req.body.password,
    preferredLanguage: req.body.language
  });

  res.status(201).json(result);
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login({
    email: req.body.email,
    password: req.body.password
  });

  res.json(result);
});

const me = asyncHandler(async (req, res) => {
  res.json({ user: req.authUser });
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.authToken);
  res.json({ success: true });
});

module.exports = {
  signup,
  login,
  me,
  logout
};
