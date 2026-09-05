import multer from "multer";
import httpStatus from "http-status";
import { AppError } from "../errors/app_error";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// Buffer in memory, not disk — this is what lets storage.service write to
// local disk today and to S3/R2 later without changing this middleware.
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(
        new AppError(
          httpStatus.BAD_REQUEST,
          "Only JPG, PNG, WEBP, or PDF files are allowed"
        )
      );
    }
    cb(null, true);
  },
});
