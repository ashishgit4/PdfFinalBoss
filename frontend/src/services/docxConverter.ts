import mammoth from "mammoth";
import html2pdf from "html2pdf.js";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

/**
 * Converts a Word document (.docx) to a PDF binary Blob directly in the browser,
 * preserving full text formatting, headings, styles, bold/italic properties, tables,
 * lists, colors, alignment, and images.
 */
export async function convertDocxToPdfBlob(
  file: File,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  if (onProgress) onProgress(10);

  const arrayBuffer = await file.arrayBuffer();
  if (onProgress) onProgress(30);

  // Extract rich HTML structure from Word document using Mammoth
  const result = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Heading 4'] => h4:fresh",
        "p[style-name='Title'] => h1.doc-title:fresh",
        "p[style-name='Subtitle'] => p.doc-subtitle:fresh",
        "r[style-name='Strong'] => strong",
        "r[style-name='Emphasis'] => em"
      ]
    }
  );

  const htmlContent = result.value || "";

  if (onProgress) onProgress(50);

  // If HTML content is completely empty, fallback
  if (!htmlContent.trim()) {
    return createSimpleFallbackPdf(file.name);
  }

  // Create temporary container off-screen to render formatted HTML document
  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.left = "-9999px";
  wrapper.style.top = "-9999px";
  wrapper.style.width = "794px"; // Standard A4 width at 96 DPI
  wrapper.style.zIndex = "-9999";

  wrapper.innerHTML = `
    <style>
      .docx-pdf-document {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        color: #111827;
        background-color: #ffffff;
        width: 794px;
        padding: 48px 56px;
        box-sizing: border-box;
        line-height: 1.6;
        font-size: 14px;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }
      .docx-pdf-document h1 {
        font-size: 24px;
        font-weight: 700;
        color: #0f172a;
        margin-top: 20px;
        margin-bottom: 12px;
        line-height: 1.3;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 6px;
      }
      .docx-pdf-document h1.doc-title {
        font-size: 28px;
        text-align: center;
        border-bottom: none;
        margin-bottom: 4px;
      }
      .docx-pdf-document p.doc-subtitle {
        font-size: 16px;
        color: #64748b;
        text-align: center;
        margin-bottom: 24px;
      }
      .docx-pdf-document h2 {
        font-size: 19px;
        font-weight: 600;
        color: #1e293b;
        margin-top: 18px;
        margin-bottom: 10px;
        line-height: 1.35;
      }
      .docx-pdf-document h3 {
        font-size: 16px;
        font-weight: 600;
        color: #334155;
        margin-top: 16px;
        margin-bottom: 8px;
      }
      .docx-pdf-document h4, .docx-pdf-document h5, .docx-pdf-document h6 {
        font-size: 14px;
        font-weight: 600;
        color: #475569;
        margin-top: 14px;
        margin-bottom: 6px;
      }
      .docx-pdf-document p {
        margin-top: 0;
        margin-bottom: 10px;
        line-height: 1.6;
      }
      .docx-pdf-document strong, .docx-pdf-document b {
        font-weight: 700;
        color: #0f172a;
      }
      .docx-pdf-document em, .docx-pdf-document i {
        font-style: italic;
      }
      .docx-pdf-document u {
        text-decoration: underline;
      }
      .docx-pdf-document s, .docx-pdf-document strike, .docx-pdf-document del {
        text-decoration: line-through;
      }
      .docx-pdf-document ul, .docx-pdf-document ol {
        margin-top: 0;
        margin-bottom: 12px;
        padding-left: 24px;
      }
      .docx-pdf-document li {
        margin-bottom: 4px;
        line-height: 1.5;
      }
      .docx-pdf-document table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 14px;
        margin-bottom: 16px;
        font-size: 13px;
      }
      .docx-pdf-document th, .docx-pdf-document td {
        border: 1px solid #cbd5e1;
        padding: 8px 12px;
        text-align: left;
        vertical-align: top;
      }
      .docx-pdf-document th {
        background-color: #f8fafc;
        font-weight: 600;
        color: #1e293b;
      }
      .docx-pdf-document tr:nth-child(even) td {
        background-color: #f8fafc;
      }
      .docx-pdf-document img {
        max-width: 100%;
        height: auto;
        display: block;
        margin: 12px auto;
        border-radius: 4px;
      }
      .docx-pdf-document blockquote {
        border-left: 4px solid #3b82f6;
        margin: 14px 0;
        padding: 8px 16px;
        background-color: #f8fafc;
        color: #475569;
        font-style: italic;
      }
      .docx-pdf-document code, .docx-pdf-document pre {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        background-color: #f1f5f9;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 13px;
      }
      .docx-pdf-document a {
        color: #2563eb;
        text-decoration: underline;
      }
    </style>
    <div class="docx-pdf-document">
      ${htmlContent}
    </div>
  `;

  document.body.appendChild(wrapper);

  if (onProgress) onProgress(70);

  try {
    const targetElement = wrapper.querySelector(".docx-pdf-document") as HTMLElement;

    const titleText = file.name.replace(/\.docx?$/i, "");
    const opt = {
      margin: [10, 10, 10, 10] as [number, number, number, number],
      filename: `${titleText}.pdf`,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] }
    };

    if (onProgress) onProgress(85);

    const pdfBlob: Blob = await html2pdf().from(targetElement).set(opt).outputPdf("blob");

    if (onProgress) onProgress(100);

    return pdfBlob;
  } catch (err) {
    console.warn("html2pdf conversion warning, using vector fallback:", err);
    return createSimpleFallbackPdf(file.name, htmlContent);
  } finally {
    if (document.body.contains(wrapper)) {
      document.body.removeChild(wrapper);
    }
  }
}

async function createSimpleFallbackPdf(fileName: string, htmlContent?: string): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageMargin = 45;
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const printableWidth = pageWidth - pageMargin * 2;

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let currentY = pageHeight - pageMargin;

  const titleText = fileName.replace(/\.docx?$/i, "");
  currentPage.drawText(titleText.substring(0, 60), {
    x: pageMargin,
    y: currentY - 14,
    size: 16,
    font: boldFont,
    color: rgb(0.07, 0.09, 0.15)
  });
  currentY -= 36;

  const cleanBlocks = (htmlContent || "")
    .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, "\n### $1\n")
    .replace(/<li[^>]*>(.*?)<\/li>/gi, "\n- $1\n")
    .replace(/<p[^>]*>(.*?)<\/p>/gi, "\n$1\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .split(/\n+/);

  for (let block of cleanBlocks) {
    const trimmed = block.trim();
    if (!trimmed) {
      currentY -= 8;
      continue;
    }

    const isHeading = trimmed.startsWith("### ");
    const isBullet = trimmed.startsWith("- ");
    const textToDraw = isHeading ? trimmed.replace(/^###\s*/, "") : (isBullet ? `• ${trimmed.replace(/^- \s*/, "")}` : trimmed);

    const useFont = isHeading ? boldFont : font;
    const fontSize = isHeading ? 13 : 10.5;
    const lineHeight = isHeading ? 18 : 14;

    const maxCharsPerLine = Math.floor(printableWidth / (isHeading ? 7.2 : 5.8));
    const subLines = textToDraw.match(new RegExp(`.{1,${maxCharsPerLine}}`, "g")) || [textToDraw];

    for (let subLine of subLines) {
      if (currentY - lineHeight < pageMargin) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        currentY = pageHeight - pageMargin;
      }

      const cleanLine = subLine.replace(/[^\x20-\x7E]/g, "");
      try {
        currentPage.drawText(cleanLine, {
          x: pageMargin + (isBullet ? 12 : 0),
          y: currentY - fontSize,
          size: fontSize,
          font: useFont,
          color: rgb(0.1, 0.1, 0.1)
        });
      } catch (e) {
        // Safe fallback for unencodable characters
      }
      currentY -= lineHeight;
    }
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
}

