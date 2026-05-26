const AppError = require("../utils/appError");
const authService = require("../services/authService");

function getBearerToken(req) {
  const header = req.headers.authorization || "";

  if (header.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }

  return req.headers["x-auth-token"] || "";
}

async function attachAuth(req, res, next) {
  try {
    const token = getBearerToken(req);
    req.authToken = token || null;
    req.authUser = token ? await authService.getUserByToken(token) : null;
    next();
  } catch (error) {
    next(error);
  }
}

function requireAuth(req, res, next) {
  if (!req.authUser) {
    next(new AppError("You must be signed in to access this resource.", 401, "AUTH_REQUIRED"));
    return;
  }

  next();
}

module.exports = {
  attachAuth,
  requireAuth
};
