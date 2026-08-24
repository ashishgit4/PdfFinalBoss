import mammoth from "mammoth";

/**
 * Converts a Word document (.docx) to a PDF binary Blob directly in the browser.
 * Utilizes mammoth.js for DOCX HTML parsing and html2pdf.js for PDF rendering.
 */
export async function convertDocxToPdfBlob(
  file: File,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  if (onProgress) onProgress(15);

  const arrayBuffer = await file.arrayBuffer();
  if (onProgress) onProgress(35);

  // Convert DOCX ArrayBuffer to styled HTML
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const rawHtml = result.value || "<p>Empty document</p>";

  if (onProgress) onProgress(55);

  // Create DOM element positioned within bounds at z-index -99999 so html2canvas renders it accurately
  const container = document.createElement("div");
  container.className = "docx-pdf-render-root";
  container.style.position = "absolute";
  container.style.left = "0px";
  container.style.top = "0px";
  container.style.zIndex = "-99999";
  container.style.width = "794px"; // Standard A4 width at 96 DPI
  container.style.padding = "48px 56px";
  container.style.boxSizing = "border-box";
  container.style.backgroundColor = "#ffffff";
  container.style.color = "#111827";
  container.style.fontFamily = "Arial, Helvetica, sans-serif";
  container.style.fontSize = "14px";
  container.style.lineHeight = "1.6";
  container.style.visibility = "visible";
  container.style.opacity = "1";

  // CSS rules for extracted DOCX HTML elements
  const styledHtml = `
    <style>
      .docx-pdf-render-root h1 { font-size: 24px; font-weight: 700; margin-top: 18px; margin-bottom: 12px; color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; }
      .docx-pdf-render-root h2 { font-size: 20px; font-weight: 600; margin-top: 16px; margin-bottom: 10px; color: #1f2937; }
      .docx-pdf-render-root h3 { font-size: 16px; font-weight: 600; margin-top: 14px; margin-bottom: 8px; color: #374151; }
      .docx-pdf-render-root p { margin-top: 0; margin-bottom: 12px; word-wrap: break-word; color: #111827; }
      .docx-pdf-render-root table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
      .docx-pdf-render-root th, .docx-pdf-render-root td { border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; }
      .docx-pdf-render-root th { background-color: #f3f4f6; font-weight: 600; }
      .docx-pdf-render-root img { max-width: 100%; height: auto; display: block; margin: 12px auto; }
      .docx-pdf-render-root ul, .docx-pdf-render-root ol { padding-left: 24px; margin-top: 0; margin-bottom: 12px; }
      .docx-pdf-render-root li { margin-bottom: 4px; }
      .docx-pdf-render-root blockquote { border-left: 4px solid #3b82f6; padding-left: 14px; margin: 12px 0; color: #4b5563; font-style: italic; }
      .docx-pdf-render-root code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px; }
    </style>
    <div>${rawHtml}</div>
  `;

  container.innerHTML = styledHtml;
  document.body.appendChild(container);

  if (onProgress) onProgress(75);

  try {
    // @ts-ignore
    const html2pdfModule = await import("html2pdf.js");
    const html2pdf = html2pdfModule.default || html2pdfModule;

    const opt = {
      margin: [10, 10, 10, 10] as [number, number, number, number],
      filename: file.name.replace(/\.docx?$/i, "") + ".pdf",
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: 794,
        scrollY: 0,
        scrollX: 0
      },
      jsPDF: { unit: "mm" as const, format: "a4", orientation: "portrait" as const }
    };

    if (onProgress) onProgress(90);

    const pdfBlob: Blob = await html2pdf().set(opt).from(container).output("blob");

    if (onProgress) onProgress(100);

    return pdfBlob;
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
