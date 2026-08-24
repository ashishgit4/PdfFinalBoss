import mammoth from "mammoth";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

/**
 * Converts a Word document (.docx) to a PDF binary Blob directly in the browser.
 * Utilizes mammoth.js to extract document content and pdf-lib to build a clean native vector PDF.
 */
export async function convertDocxToPdfBlob(
  file: File,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  if (onProgress) onProgress(15);

  const arrayBuffer = await file.arrayBuffer();
  if (onProgress) onProgress(35);

  // Extract HTML structure from Word document
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const htmlContent = result.value || "";

  if (onProgress) onProgress(55);

  // Convert HTML content into structured text lines
  let plainText = htmlContent
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<p[^>]*>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<h[1-6][^>]*>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<tr[^>]*>/gi, "\n")
    .replace(/<td[^>]*>/gi, "  |  ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2022\u2023\u2043\u2044]/g, "*")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/\n\s*\n/g, "\n\n")
    .trim();

  if (!plainText) {
    plainText = "Document successfully converted.";
  }

  if (onProgress) onProgress(75);

  // Construct PDF Document with native text vectors
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageMargin = 45;
  const fontSize = 10.5;
  const lineHeight = 15;
  const pageWidth = 595.28; // A4 width
  const pageHeight = 841.89; // A4 height
  const printableWidth = pageWidth - pageMargin * 2;

  const lines = plainText.split(/\r?\n/);
  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let currentY = pageHeight - pageMargin;

  // Render document title header
  const titleText = file.name.replace(/\.docx?$/i, "");
  currentPage.drawText(titleText.substring(0, 60), {
    x: pageMargin,
    y: currentY - 14,
    size: 15,
    font: boldFont,
    color: rgb(0.07, 0.09, 0.15)
  });
  currentY -= 32;

  for (let line of lines) {
    if (!line.trim()) {
      currentY -= lineHeight / 1.8;
      continue;
    }

    const maxCharsPerLine = Math.floor(printableWidth / 5.8);
    const subLines = line.match(new RegExp(`.{1,${maxCharsPerLine}}`, "g")) || [line];

    for (let subLine of subLines) {
      if (currentY - lineHeight < pageMargin) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        currentY = pageHeight - pageMargin;
      }

      const cleanLine = subLine.replace(/[^\x20-\x7E]/g, "");

      try {
        currentPage.drawText(cleanLine, {
          x: pageMargin,
          y: currentY - fontSize,
          size: fontSize,
          font: font,
          color: rgb(0.1, 0.1, 0.1)
        });
      } catch (e) {
        currentPage.drawText(cleanLine.replace(/[^\x20-\x7E]/g, "?"), {
          x: pageMargin,
          y: currentY - fontSize,
          size: fontSize,
          font: font,
          color: rgb(0.1, 0.1, 0.1)
        });
      }
      currentY -= lineHeight;
    }
  }

  if (onProgress) onProgress(95);

  const pdfBytes = await pdfDoc.save();
  const pdfBlob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });

  if (onProgress) onProgress(100);

  return pdfBlob;
}
