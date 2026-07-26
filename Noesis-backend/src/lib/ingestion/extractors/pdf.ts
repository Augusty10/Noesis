import fs from "fs";
import { PDFParse } from "pdf-parse";

export interface PdfPageContent {
  text: string;
  page: number;
}

/**
 * Extracts text page-by-page from a PDF file using pdf-parse (v2.x).
 */
export async function extractPdf(filePath: string): Promise<PdfPageContent[]> {
  const dataBuffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: dataBuffer });
  try {
    const result = await parser.getText();
    const pages = result.pages.map((p) => ({
      text: p.text.trim(),
      page: p.num,
    }));
    return pages.sort((a, b) => a.page - b.page);
  } finally {
    await parser.destroy();
  }
}
