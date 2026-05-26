const fs = require("fs");
const path = require("path");

const dataDir = path.resolve(__dirname, "../../data");
const dbFilePath = path.join(dataDir, "app-db.json");
const defaultDb = {
  users: [],
  sessions: [],
  histories: []
};

let writeChain = Promise.resolve();

function ensureDbFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dbFilePath)) {
    fs.writeFileSync(dbFilePath, JSON.stringify(defaultDb, null, 2), "utf8");
  }
}

async function readDb() {
  ensureDbFile();
  const raw = await fs.promises.readFile(dbFilePath, "utf8");

  try {
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      histories: Array.isArray(parsed.histories) ? parsed.histories : []
    };
  } catch (error) {
    await fs.promises.writeFile(dbFilePath, JSON.stringify(defaultDb, null, 2), "utf8");
    return { ...defaultDb };
  }
}

async function writeDb(nextDb) {
  ensureDbFile();
  writeChain = writeChain.then(() => fs.promises.writeFile(dbFilePath, JSON.stringify(nextDb, null, 2), "utf8"));
  return writeChain;
}

async function updateDb(updater) {
  const currentDb = await readDb();
  const nextDb = await updater(currentDb);
  await writeDb(nextDb);
  return nextDb;
}

module.exports = {
  dbFilePath,
  readDb,
  writeDb,
  updateDb
};
