import { convertFileToPDF, downloadConvertedPDF } from "./api";

/**
 * Converts a Word document (.docx) to a high-fidelity PDF binary Blob via the rendering engine.
 * Preserves 100% of original visual layout, images, screenshots, tables, formatting, and page breaks.
 */
export async function convertDocxToPdfBlob(
  file: File,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  if (onProgress) onProgress(15);
  const response = await convertFileToPDF(file, (p) => {
    if (onProgress) onProgress(15 + Math.round(p * 0.7));
  });

  if (onProgress) onProgress(85);
  const pdfBlob = await downloadConvertedPDF(response.id);

  if (onProgress) onProgress(100);
  return pdfBlob;
}



