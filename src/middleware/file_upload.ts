import type { Request, Response, NextFunction } from "express";
import { FileFilterCallback } from "multer";

// Allowed MIME types for recipe imports
const ALLOWED_MIME_TYPES = new Set([
  "text/plain",
  "text/csv",
  "text/tab-separated-values",
  "application/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
]);

// Allowed file extensions
const ALLOWED_EXTENSIONS = new Set([
  ".txt",
  ".csv",
  ".tsv"
]);

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Validate file type and extension
 */
export function validateFileType(file: Express.Multer.File): { valid: boolean; error?: string } {
  // Check MIME type
  if (file.mimetype && !ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return {
      valid: false,
      error: `File type ${file.mimetype} is not allowed. Allowed types: text/plain, text/csv`
    };
  }
  
  // Check file extension
  const originalName = file.originalname.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => originalName.endsWith(ext));
  
  if (!hasValidExtension) {
    return {
      valid: false,
      error: `File extension is not allowed. Allowed extensions: .txt, .csv, .tsv`
    };
  }
  
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File is too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    };
  }
  
  return { valid: true };
}

/**
 * Multer file filter for recipe imports
 */
export const recipeFileFilter: FileFilterCallback = (req, file, cb) => {
  const result = validateFileType(file);
  
  if (result.valid) {
    cb(null, true);
  } else {
    cb(new Error(result.error), false);
  }
};

/**
 * Multer file size limit
 */
export const fileSizeLimit = {
  fileSize: MAX_FILE_SIZE
};

/**
 * Middleware to handle file upload validation errors
 */
export function handleFileUploadError(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err.message.includes("File type") || err.message.includes("File extension") || err.message.includes("File is too large")) {
    const wantsJson = req.headers["x-requested-with"] === "fetch" || req.headers.accept?.includes("application/json");
    
    if (wantsJson) {
      return res.status(400).json({ 
        ok: false, 
        message: err.message 
      });
    }
    
    return res.redirect(`/recipes?error=${encodeURIComponent(err.message)}`);
  }
  
  next(err);
}
