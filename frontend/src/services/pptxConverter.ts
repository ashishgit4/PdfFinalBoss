import JSZip from "jszip";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

/**
 * Converts a PowerPoint presentation (.pptx) directly to a formatted PDF Blob in browser
 * with instant slide-by-slide vector rendering.
 */
export async function convertPptxToPdfBlob(
  file: File,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  if (onProgress) onProgress(15);

  const arrayBuffer = await file.arrayBuffer();
  if (onProgress) onProgress(35);

  const zip = await JSZip.loadAsync(arrayBuffer);
  
  // Locate slide XML files (e.g. ppt/slides/slide1.xml, slide2.xml...)
  const slideFiles: { name: string; num: number }[] = [];
  zip.forEach((relativePath) => {
    const match = relativePath.match(/^ppt\/slides\/slide(\d+)\.xml$/i);
    if (match) {
      slideFiles.push({ name: relativePath, num: parseInt(match[1], 10) });
    }
  });

  // Sort slides numerically
  slideFiles.sort((a, b) => a.num - b.num);

  if (slideFiles.length === 0) {
    throw new Error("No slides found in PPTX presentation.");
  }

  if (onProgress) onProgress(50);

  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 841.89; // A4 Landscape width
  const pageHeight = 595.28; // A4 Landscape height
  const pageMargin = 40;

  const totalSlides = slideFiles.length;

  for (let idx = 0; idx < totalSlides; idx++) {
    const slideInfo = slideFiles[idx];
    const slideXmlText = await zip.file(slideInfo.name)?.async("string");

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Draw Slide Outer Frame
    page.drawRectangle({
      x: pageMargin,
      y: pageMargin,
      width: pageWidth - pageMargin * 2,
      height: pageHeight - pageMargin * 2,
      color: rgb(0.98, 0.99, 1),
      borderColor: rgb(0.85, 0.88, 0.92),
      borderWidth: 1.5
    });

    // Parse slide text paragraphs using DOMParser
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(slideXmlText || "", "application/xml");

    const pNodes = Array.from(xmlDoc.getElementsByTagName("a:p"));
    const slideParagraphs: string[] = [];

    for (let pNode of pNodes) {
      const tNodes = Array.from(pNode.getElementsByTagName("a:t"));
      const pText = tNodes.map(t => t.textContent || "").join("").trim();
      if (pText) {
        slideParagraphs.push(pText);
      }
    }

    const slideTitle = slideParagraphs.length > 0 ? slideParagraphs[0] : `Slide ${idx + 1}`;
    const bodyParagraphs = slideParagraphs.length > 0 ? slideParagraphs.slice(1) : [];

    // Render Slide Title Header Card
    const headerHeight = 56;
    const headerY = pageHeight - pageMargin - headerHeight;

    page.drawRectangle({
      x: pageMargin,
      y: headerY,
      width: pageWidth - pageMargin * 2,
      height: headerHeight,
      color: rgb(0.06, 0.09, 0.16)
    });

    // Title Text
    page.drawText(cleanText(slideTitle).substring(0, 65), {
      x: pageMargin + 20,
      y: headerY + 18,
      size: 18,
      font: fontBold,
      color: rgb(1, 1, 1)
    });

    // Slide Number Badge
    const badgeText = `Slide ${idx + 1} of ${totalSlides}`;
    page.drawText(badgeText, {
      x: pageWidth - pageMargin - 110,
      y: headerY + 20,
      size: 11,
      font: fontBold,
      color: rgb(0.56, 0.74, 0.98)
    });

    // Render Slide Body Paragraphs
    let currentY = headerY - 32;
    const printableWidth = pageWidth - pageMargin * 2 - 40;

    for (let textLine of bodyParagraphs) {
      if (currentY < pageMargin + 40) break;

      const bulletText = `•  ${cleanText(textLine)}`;
      const maxChars = Math.floor(printableWidth / 6.2);
      const chunks = wrapText(bulletText, maxChars);

      for (let chunk of chunks) {
        if (currentY < pageMargin + 30) break;

        page.drawText(chunk, {
          x: pageMargin + 24,
          y: currentY,
          size: 12,
          font: fontRegular,
          color: rgb(0.12, 0.15, 0.22)
        });
        currentY -= 20;
      }
      currentY -= 6;
    }

    if (onProgress) {
      onProgress(50 + Math.round(((idx + 1) / totalSlides) * 45));
    }
  }

  if (onProgress) onProgress(98);

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
}

function cleanText(str: string): string {
  return str
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^\x20-\x7E]/g, " ");
}

function wrapText(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (let word of words) {
    if ((currentLine + " " + word).trim().length <= maxChars) {
      currentLine = (currentLine + " " + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}
