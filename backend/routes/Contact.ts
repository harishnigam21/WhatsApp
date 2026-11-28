import express, { NextFunction, Request, Response } from "express";
import {
  abortContactSyncSession,
  createContact,
  generateContactSyncSession,
  importContact,
  uploadSyncContact,
  validateContactSyncSession,
} from "../controllers/Contact";
import jwtVerifier from "../middlewares/jwt/jwtVerifier";
import multer from "multer";
import path from "node:path";
const storage = multer.memoryStorage();
const ALLOWED_MIME_TYPES = new Set([
  "text/vcard",
  "text/x-vcard",
  "text/directory",
  "application/vcard",
  "application/octet-stream", // Common fallback on mobile/Windows
]);
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isValidExt = ext === ".vcf";
    const isValidMime = ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase());
    if (isValidExt && isValidMime) {
      cb(null, true); // Accept file
    } else {
      cb(new Error("Invalid file type. Only .vcf (vCard) files are allowed."));
    }
  },
});
const handleVcfUpload = (req: Request, res: Response, next: NextFunction) => {
  upload.single("vcf")(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ message: "File size cannot exceed 5MB." });
      }
      return res.status(400).json({ message: err.message });
    }
    if (err) {
      // Handles our custom fileFilter error ("Invalid file type...")
      return res.status(400).json({ message: err.message });
    }
    // Optional: Check if the user forgot to attach a file at all
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a .vcf file." });
    }

    next(); // File is valid -> proceed to importContact controller
  });
};
const router = express.Router();
router.route("/new").post(jwtVerifier, createContact);
router.route("/import").post(jwtVerifier, handleVcfUpload, importContact);
router.post("/sync-session", jwtVerifier, generateContactSyncSession);
router.post("/sync-session/:token", validateContactSyncSession);
router.post("/abort-sync-session/:token", abortContactSyncSession);
router
  .route("/import-sync-session/:token")
  .post(handleVcfUpload, uploadSyncContact);
export default router;
