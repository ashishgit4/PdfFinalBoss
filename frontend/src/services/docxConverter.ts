import mammoth from "mammoth";
import html2pdf from "html2pdf.js";
import { convertFileToPDF, downloadConvertedPDF } from "./api";

/**
 * Converts a Word document (.docx) directly to PDF in browser using Mammoth.js + html2pdf.js,
 * with zero server dependencies required.
 * Falls back to server API if client conversion encounters issues, or vice-versa.
 */
export async function convertDocxToPdfBlob(
  file: File,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  if (onProgress) onProgress(10);

  try {
    const arrayBuffer = await file.arrayBuffer();
    if (onProgress) onProgress(30);

    // Convert DOCX binary to styled HTML string using mammoth
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const htmlBody = result.value;
    if (onProgress) onProgress(60);

    const titleText = file.name.replace(/\.docx?$/i, "");

    // Create an off-screen container for high-fidelity HTML-to-PDF rendering
    const wrapper = document.createElement("div");
    wrapper.style.position = "absolute";
    wrapper.style.left = "-9999px";
    wrapper.style.top = "0";
    wrapper.style.width = "794px"; // A4 width at 96 DPI
    wrapper.style.opacity = "0.001";
    wrapper.style.pointerEvents = "none";
    wrapper.style.zIndex = "-9999";

    wrapper.innerHTML = `
      <style>
        .docx-pdf-container {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          padding: 48px 56px;
          background: #ffffff;
          width: 794px;
          box-sizing: border-box;
          line-height: 1.6;
          font-size: 13.5px;
          color: #0f172a;
          word-wrap: break-word;
        }
        .docx-pdf-container h1, .docx-pdf-container h2, .docx-pdf-container h3, 
        .docx-pdf-container h4, .docx-pdf-container h5, .docx-pdf-container h6 {
          color: #0284c7;
          margin-top: 1.4em;
          margin-bottom: 0.5em;
          font-weight: 700;
          line-height: 1.25;
        }
        .docx-pdf-container h1 { font-size: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }
        .docx-pdf-container h2 { font-size: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; }
        .docx-pdf-container h3 { font-size: 16px; }
        .docx-pdf-container p { margin: 0 0 1em 0; }
        .docx-pdf-container ul, .docx-pdf-container ol { padding-left: 24px; margin-bottom: 1em; }
        .docx-pdf-container li { margin-bottom: 0.4em; }
        .docx-pdf-container img { max-width: 100%; height: auto; border-radius: 4px; margin: 1em 0; display: block; }
        .docx-pdf-container table { width: 100%; border-collapse: collapse; margin: 1.2em 0; font-size: 12.5px; }
        .docx-pdf-container th, .docx-pdf-container td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
        .docx-pdf-container th { background: #f8fafc; font-weight: 600; color: #334155; }
        .docx-pdf-container blockquote { border-left: 4px solid #0284c7; margin: 1em 0; padding: 8px 16px; background: #f0f9ff; color: #334155; }
        .docx-pdf-container code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 12px; }
        .docx-pdf-container pre { background: #0f172a; color: #f8fafc; padding: 14px; border-radius: 6px; overflow-x: auto; }
      </style>
      <div class="docx-pdf-container">
        ${htmlBody || `<p style="color:#64748b;">${file.name}</p>`}
      </div>
    `;

    document.body.appendChild(wrapper);
    if (onProgress) onProgress(80);

    try {
      const element = wrapper.querySelector(".docx-pdf-container") as HTMLElement;
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
  } catch (clientErr) {
    console.warn("Client-side DOCX conversion warning, attempting server API fallback:", clientErr);
    
    // Fallback: server API conversion
    if (onProgress) onProgress(40);
    const response = await convertFileToPDF(file, (p) => {
      if (onProgress) onProgress(40 + Math.round(p * 0.4));
    });

    if (onProgress) onProgress(85);
    const pdfBlob = await downloadConvertedPDF(response.id);
    if (onProgress) onProgress(100);
    return pdfBlob;
  }
}
