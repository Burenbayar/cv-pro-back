const crypto = require("crypto");

function buildCacheKey(namespace, payload) {
  const serialized = JSON.stringify(payload);
  return `${namespace}:${crypto.createHash("sha256").update(serialized).digest("hex")}`;
}

module.exports = buildCacheKey;
