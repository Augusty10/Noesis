import fs from "fs";
import pdfParse = require("pdf-parse");

export interface PdfPageContent {
  text: string;
  page: number;
}

/**
 * Extracts text page-by-page from a PDF file using pdf-parse.
 */
export async function extractPdf(filePath: string): Promise<PdfPageContent[]> {
  const dataBuffer = fs.readFileSync(filePath);
  const pages: PdfPageContent[] = [];
  let currentPage = 1;

  // Define page rendering hook to separate text by page
  const pagerender = async (pageData: any) => {
    const textContent = await pageData.getTextContent();
    let text = "";
    let lastY = -1;

    for (const item of textContent.items) {
      if (lastY !== -1 && item.transform[5] !== lastY) {
        text += "\n";
      }
      text += item.str;
      lastY = item.transform[5];
    }

    const pageNum = currentPage++;
    pages.push({
      text: text.trim(),
      page: pageNum,
    });

    return text;
  };

  try {
    await (pdfParse as any)(dataBuffer, { pagerender });
  } catch (error) {
    // If the hook fails or standard parser encounters issues, try basic parsing as fallback
    const result = await (pdfParse as any)(dataBuffer);
    const rawText = result.text || "";
    
    // Split by form-feed character which pdf-parse uses to separate pages
    const parts = rawText.split(/\f/);
    if (parts.length > 1) {
      return parts.map((part: string, idx: number) => ({
        text: part.trim(),
        page: idx + 1,
      }));
    }
    
    return [{
      text: rawText.trim(),
      page: 1,
    }];
  }

  // Ensure pages are sorted by page number
  return pages.sort((a, b) => a.page - b.page);
}
