"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  fileUrl: string;
  pageNumber?: number;
}

export default function PdfViewer({ fileUrl, pageNumber = 1 }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);

  return (
    <div className="flex flex-col items-center gap-2 overflow-auto h-full py-3">
      <Document
        file={fileUrl}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        loading={<p className="text-xs text-textMuted">Loading PDF...</p>}
        error={<p className="text-xs text-danger">Couldn't load this PDF.</p>}
      >
        <Page pageNumber={pageNumber} width={280} />
      </Document>
      {numPages && (
        <p className="text-[11px] text-textMuted">
          Page {pageNumber} of {numPages}
        </p>
      )}
    </div>
  );
}
