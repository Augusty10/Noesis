import path from "path";

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
}

/**
 * Validates file size, extension, and mime-type for uploaded sources.
 */
export function validateUploadedFile(file: UploadedFile, type: "PDF" | "VTT"): { valid: boolean; error?: string } {
  const ext = path.extname(file.originalname).toLowerCase();

  if (type === "PDF") {
    if (ext !== ".pdf") {
      return { valid: false, error: "Only PDF files are allowed for PDF source type." };
    }
    // Note: sometimes browsers don't send correct mime-type for PDFs, but check if it's there
    if (file.mimetype && file.mimetype !== "application/pdf") {
      return { valid: false, error: "Invalid mime type. Expected PDF." };
    }
    if (file.size > 20 * 1024 * 1024) { // 20MB limit
      return { valid: false, error: "PDF file is too large (maximum size is 20MB)." };
    }
  } else if (type === "VTT") {
    if (ext !== ".vtt" && ext !== ".txt") {
      return { valid: false, error: "Only .vtt or .txt files are allowed for transcripts." };
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      return { valid: false, error: "Transcript file is too large (maximum size is 5MB)." };
    }
  } else {
    return { valid: false, error: "Unsupported file upload source type." };
  }

  return { valid: true };
}
