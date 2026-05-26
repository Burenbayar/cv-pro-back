const multer = require("multer");
const AppError = require("../utils/appError");

// In-memory storage avoids local file cleanup and keeps uploaded CVs out of disk.
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const name = file.originalname.toLowerCase();
    const isPdf = file.mimetype === "application/pdf" || name.endsWith(".pdf");
    const isDocx =
      file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      name.endsWith(".docx");
    const isText = file.mimetype === "text/plain" || name.endsWith(".txt");

    if (isPdf || isDocx || isText) {
      cb(null, true);
      return;
    }

    cb(new AppError("Only PDF, DOCX, and TXT CV files are supported.", 400, "UNSUPPORTED_FILE_TYPE"));
  }
});

module.exports = upload;
