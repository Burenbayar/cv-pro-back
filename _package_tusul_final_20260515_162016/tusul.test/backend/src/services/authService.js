const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { env } = require("../config/env");
const AppError = require("../utils/appError");
const prisma = require("../lib/prisma");

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function sanitizeUser(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    preferredLanguage: user.preferredLanguage || "mn",
    createdAt: user.createdAt
  };
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateSignup({ fullName, email, password }) {
  if (!String(fullName || "").trim()) {
    throw new AppError("Full name is required.", 400, "FULL_NAME_REQUIRED");
  }
  if (!validateEmail(normalizeEmail(email))) {
    throw new AppError("A valid email is required.", 400, "EMAIL_REQUIRED");
  }
  if (String(password || "").length < 6) {
    throw new AppError("Password must be at least 6 characters.", 400, "PASSWORD_TOO_SHORT");
  }
}

function getExpiryFromJwt(token) {
  const decoded = jwt.decode(token);
  if (decoded && decoded.exp) {
    return new Date(decoded.exp * 1000);
  }
  return new Date(Date.now() + env.sessionTtlMs);
}

function createJwtForUser(user) {
  const tokenId = crypto.randomUUID();
  const token = jwt.sign(
    { sub: user.id, email: user.email, jti: tokenId },
    env.authSecret,
    { expiresIn: env.jwtExpiresIn, issuer: "ai-career-advisor", audience: "ai-career-advisor-users" }
  );
  return { token, tokenId, expiresAt: getExpiryFromJwt(token) };
}

function verifyLegacyPassword(password, storedHash) {
  const [salt, hash] = String(storedHash || "").split(":");
  if (!salt || !hash) return false;
  const incoming = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(incoming, "hex"));
  } catch {
    return false;
  }
}

async function verifyPassword(password, storedHash) {
  if (String(storedHash || "").startsWith("$2")) {
    return bcrypt.compare(password, storedHash);
  }
  return verifyLegacyPassword(password, storedHash);
}

async function hashPassword(password) {
  return bcrypt.hash(password, env.bcryptRounds);
}

async function createSession(user) {
  const { token, tokenId, expiresAt } = createJwtForUser(user);
  await prisma.session.deleteMany({
    where: { userId: user.id, expiresAt: { lte: new Date() } }
  });
  await prisma.session.create({
    data: { tokenId, userId: user.id, expiresAt }
  });
  return token;
}

async function signup({ fullName, email, password, preferredLanguage = "mn" }) {
  validateSignup({ fullName, email, password });
  const normalizedEmail = normalizeEmail(email);

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    throw new AppError("An account with this email already exists.", 409, "EMAIL_IN_USE");
  }

  const user = await prisma.user.create({
    data: {
      fullName: String(fullName).trim(),
      email: normalizedEmail,
      passwordHash: await hashPassword(password),
      preferredLanguage: preferredLanguage === "mn" ? "mn" : "en"
    }
  });

  const token = await createSession(user);
  return { token, user: sanitizeUser(user) };
}

async function login({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  if (!validateEmail(normalizedEmail) || !String(password || "").trim()) {
    throw new AppError("Email and password are required.", 400, "LOGIN_REQUIRED");
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new AppError("Invalid email or password.", 401, "INVALID_CREDENTIALS");
  }

  if (!user.passwordHash.startsWith("$2")) {
    const nextHash = await hashPassword(password);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: nextHash } });
    user.passwordHash = nextHash;
  }

  const token = await createSession(user);
  return { token, user: sanitizeUser(user) };
}

function verifyJwt(token) {
  try {
    return jwt.verify(token, env.authSecret, {
      issuer: "ai-career-advisor",
      audience: "ai-career-advisor-users"
    });
  } catch {
    return null;
  }
}

async function getUserByToken(token) {
  if (!token) return null;

  const payload = verifyJwt(token);
  if (!payload || !payload.sub || !payload.jti) return null;

  const session = await prisma.session.findUnique({ where: { tokenId: payload.jti } });
  if (!session || session.userId !== payload.sub || session.expiresAt <= new Date()) {
    if (session) {
      await prisma.session.delete({ where: { tokenId: payload.jti } });
    }
    return null;
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  return user ? sanitizeUser(user) : null;
}

async function logout(token) {
  const payload = verifyJwt(token);
  if (!payload || !payload.jti) return;
  await prisma.session.deleteMany({ where: { tokenId: payload.jti } });
}

module.exports = { signup, login, logout, getUserByToken };
