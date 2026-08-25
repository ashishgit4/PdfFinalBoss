import html2pdf from "html2pdf.js";
import { PDFDocument } from "pdf-lib";
export { convertDocxToPdfBlob } from "./docxConverter";
export { convertPptxToPdfBlob } from "./pptxConverter";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = "";
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some(cell => cell.length > 0)) {
        lines.push(currentRow);
      }
      currentRow = [];
      currentCell = "";
    } else {
      currentCell += char;
    }
  }

  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(cell => cell.length > 0)) {
      lines.push(currentRow);
    }
  }

  return lines;
}

/**
 * Converts a CSV file directly to a formatted PDF Blob in the browser (0 network requests).
 */
export async function convertCsvToPdfBlob(
  file: File,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  if (onProgress) onProgress(20);
  const text = await file.text();
  if (onProgress) onProgress(50);

  const rows = parseCSV(text);
  if (rows.length === 0) {
    throw new Error("CSV file is empty.");
  }

  const headerRow = rows[0];
  const dataRows = rows.slice(1);
  const titleText = file.name.replace(/\.csv$/i, "");

  const wrapper = document.createElement("div");
  wrapper.style.position = "absolute";
  wrapper.style.left = "0";
  wrapper.style.top = "0";
  wrapper.style.width = "794px";
  wrapper.style.opacity = "0.001";
  wrapper.style.pointerEvents = "none";
  wrapper.style.zIndex = "-9999";

  const isLandscape = headerRow.length > 5;

  wrapper.innerHTML = `
    <style>
      .csv-container {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        padding: 40px;
        background: #ffffff;
        width: 794px;
        box-sizing: border-box;
      }
      .csv-title {
        font-size: 20px;
        font-weight: 700;
        color: #0f172a;
        margin-top: 0;
        margin-bottom: 16px;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 8px;
      }
      .csv-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px;
        color: #1e293b;
      }
      .csv-table th {
        border: 1px solid #cbd5e1;
        background-color: #f1f5f9;
        padding: 8px 10px;
        text-align: left;
        font-weight: 600;
        color: #0f172a;
      }
      .csv-table td {
        border: 1px solid #e2e8f0;
        padding: 6px 10px;
        vertical-align: top;
        word-break: break-word;
      }
      .csv-table tr:nth-child(even) td {
        background-color: #f8fafc;
      }
    </style>
    <div class="csv-container">
      <h1 class="csv-title">${escapeHtml(titleText)}</h1>
      <table class="csv-table">
        <thead>
          <tr>
            ${headerRow.map(col => `<th>${escapeHtml(col)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${dataRows.map(row => `
            <tr>
              ${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  document.body.appendChild(wrapper);
  if (onProgress) onProgress(75);

  try {
    const element = wrapper.querySelector(".csv-container") as HTMLElement;
    const opt = {
      margin: [10, 10, 10, 10] as [number, number, number, number],
      filename: `${titleText}.pdf`,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { scale: 1.5, logging: false, useCORS: false, allowTaint: true },
      jsPDF: { unit: "mm", format: "a4", orientation: isLandscape ? ("landscape" as const) : ("portrait" as const) },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] }
    };

    const pdfBlob: Blob = await html2pdf().from(element).set(opt).outputPdf("blob");
    if (onProgress) onProgress(100);
    return pdfBlob;
  } finally {
    if (document.body.contains(wrapper)) {
      document.body.removeChild(wrapper);
    }
  }
}

/**
 * Converts a plain text file (.txt, .log) directly to PDF in browser.
 */
export async function convertTxtToPdfBlob(
  file: File,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  if (onProgress) onProgress(20);
  const text = await file.text();
  if (onProgress) onProgress(50);

  const titleText = file.name.replace(/\.(txt|text|log)$/i, "");

  const wrapper = document.createElement("div");
  wrapper.style.position = "absolute";
  wrapper.style.left = "0";
  wrapper.style.top = "0";
  wrapper.style.width = "794px";
  wrapper.style.opacity = "0.001";
  wrapper.style.pointerEvents = "none";
  wrapper.style.zIndex = "-9999";

  wrapper.innerHTML = `
    <style>
      .txt-container {
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        padding: 40px 48px;
        background: #ffffff;
        width: 794px;
        box-sizing: border-box;
        line-height: 1.6;
        font-size: 13px;
        color: #0f172a;
      }
      .txt-title {
        font-size: 20px;
        font-weight: 700;
        margin-top: 0;
        margin-bottom: 16px;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 8px;
      }
      .txt-content {
        white-space: pre-wrap;
        word-wrap: break-word;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 12px;
        line-height: 1.6;
      }
    </style>
    <div class="txt-container">
      <h1 class="txt-title">${escapeHtml(titleText)}</h1>
      <div class="txt-content">${escapeHtml(text)}</div>
    </div>
  `;

  document.body.appendChild(wrapper);
  if (onProgress) onProgress(75);

  try {
    const element = wrapper.querySelector(".txt-container") as HTMLElement;
    const opt = {
      margin: [10, 10, 10, 10] as [number, number, number, number],
      filename: `${titleText}.pdf`,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { scale: 1.5, logging: false, useCORS: false, allowTaint: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] }
    };

    const pdfBlob: Blob = await html2pdf().from(element).set(opt).outputPdf("blob");
    if (onProgress) onProgress(100);
    return pdfBlob;
  } finally {
    if (document.body.contains(wrapper)) {
      document.body.removeChild(wrapper);
    }
  }
}

/**
 * Converts HTML / Markdown files directly to PDF in browser.
 */
export async function convertHtmlToPdfBlob(
  file: File,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  if (onProgress) onProgress(20);
  const htmlContent = await file.text();
  if (onProgress) onProgress(50);

  const titleText = file.name.replace(/\.(html|htm|md)$/i, "");

  const wrapper = document.createElement("div");
  wrapper.style.position = "absolute";
  wrapper.style.left = "0";
  wrapper.style.top = "0";
  wrapper.style.width = "794px";
  wrapper.style.opacity = "0.001";
  wrapper.style.pointerEvents = "none";
  wrapper.style.zIndex = "-9999";

  wrapper.innerHTML = `
    <style>
      .html-container {
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        padding: 40px 48px;
        background: #ffffff;
        width: 794px;
        box-sizing: border-box;
        line-height: 1.6;
        font-size: 13px;
        color: #0f172a;
      }
      .html-container img { max-width: 100%; height: auto; }
      .html-container table { width: 100%; border-collapse: collapse; }
      .html-container th, .html-container td { border: 1px solid #cbd5e1; padding: 6px 10px; }
    </style>
    <div class="html-container">
      ${htmlContent}
    </div>
  `;

  document.body.appendChild(wrapper);
  if (onProgress) onProgress(75);

  try {
    const element = wrapper.querySelector(".html-container") as HTMLElement;
    const opt = {
      margin: [10, 10, 10, 10] as [number, number, number, number],
      filename: `${titleText}.pdf`,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { scale: 1.5, logging: false, useCORS: false, allowTaint: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] }
    };

    const pdfBlob: Blob = await html2pdf().from(element).set(opt).outputPdf("blob");
    if (onProgress) onProgress(100);
    return pdfBlob;
  } finally {
    if (document.body.contains(wrapper)) {
      document.body.removeChild(wrapper);
    }
  }
}

/**
 * Converts JPG / JPEG / PNG image files directly to vector PDF in browser.
 */
export async function convertImageToPdfBlob(
  file: File,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  if (onProgress) onProgress(20);
  const arrayBuffer = await file.arrayBuffer();
  if (onProgress) onProgress(50);

  const pdfDoc = await PDFDocument.create();
  const ext = file.name.toLowerCase();

  let image;
  if (ext.endsWith(".png")) {
    image = await pdfDoc.embedPng(arrayBuffer);
  } else {
    image = await pdfDoc.embedJpg(arrayBuffer);
  }

  if (onProgress) onProgress(70);

  const imgWidth = image.width;
  const imgHeight = image.height;

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 36;

  const maxWidth = pageWidth - margin * 2;
  const maxHeight = pageHeight - margin * 2;

  let finalWidth = imgWidth;
  let finalHeight = imgHeight;

  if (finalWidth > maxWidth || finalHeight > maxHeight) {
    const widthRatio = maxWidth / finalWidth;
    const heightRatio = maxHeight / finalHeight;
    const ratio = Math.min(widthRatio, heightRatio);

    finalWidth = finalWidth * ratio;
    finalHeight = finalHeight * ratio;
  }

  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  const x = (pageWidth - finalWidth) / 2;
  const y = (pageHeight - finalHeight) / 2;

  page.drawImage(image, {
    x,
    y,
    width: finalWidth,
    height: finalHeight
  });

  if (onProgress) onProgress(90);

  const pdfBytes = await pdfDoc.save();
  if (onProgress) onProgress(100);

  return new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
}
