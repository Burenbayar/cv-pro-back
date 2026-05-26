require("dotenv").config();

function readNumber(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: readNumber("PORT", 3001),
  corsOrigin: process.env.CORS_ORIGIN || "*",
  jsonLimit: process.env.JSON_LIMIT || "2mb",
  cvTextMaxLength: readNumber("CV_TEXT_MAX_LENGTH", 40000),
  cacheTtlMs: readNumber("CACHE_TTL_MS", 300000),
  authSecret: process.env.AUTH_SECRET || "career-advisor-local-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  bcryptRounds: readNumber("BCRYPT_ROUNDS", 12),
  sessionTtlMs: readNumber("SESSION_TTL_MS", 1000 * 60 * 60 * 24 * 7),
  openAiTimeoutMs: readNumber("OPENAI_TIMEOUT_MS", 30000),
  openAiMaxOutputTokens: readNumber("OPENAI_MAX_OUTPUT_TOKENS", 4000),
  openAiApiKey: process.env.OPENAI_API_KEY || "",
  openAiModel: process.env.OPENAI_MODEL || "gpt-4.1-mini"
};

module.exports = { env };
