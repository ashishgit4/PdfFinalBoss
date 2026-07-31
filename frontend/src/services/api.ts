import type { UploadResponse } from "../types";

const API_URL = "https://pdffinalboss-1.onrender.com";

/**
 * Uploads a PDF file to the backend, tracking progress with a callback.
 */
export function uploadPDF(
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // ✅ Works for both localhost and Render
    xhr.open("POST", `${API_URL}/api/upload`);

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round(
            (event.loaded / event.total) * 100
          );
          onProgress(percentComplete);
        }
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText) as UploadResponse;
          resolve(response);
        } catch {
          reject(new Error("Failed to parse server response."));
        }
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText);
          reject(
            new Error(
              errorData.message || `Upload failed with status ${xhr.status}`
            )
          );
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error. Please check your internet connection."));
    };

    xhr.ontimeout = () => {
      reject(new Error("Request timed out. Please try again."));
    };

    const formData = new FormData();
    formData.append("file", file);

    xhr.send(formData);
  });
}

/**
 * Unlocks an uploaded PDF file using the provided password.
 * Returns the decrypted PDF as a Blob.
 */
export async function unlockPDF(
  id: string,
  password: string
): Promise<Blob> {
  const response = await fetch(`${API_URL}/api/unlock`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id, password }),
  });

  if (!response.ok) {
    let errorMessage = "Decryption failed. Please check the password.";

    try {
      const errorJson = await response.json();

      if (errorJson?.message) {
        errorMessage = errorJson.message;
      }
    } catch {
      if (response.status === 401 || response.status === 403) {
        errorMessage = "Wrong password. Please try again.";
      } else if (response.status >= 500) {
        errorMessage = "Internal server error. Please try again later.";
      } else {
        errorMessage = `Unlocking failed with status ${response.status}`;
      }
    }

    throw new Error(errorMessage);
  }

  return response.blob();
}

/**
 * Locks an uploaded PDF file using the provided password and optional hint.
 * Returns the encrypted PDF as a Blob, plus the hash and hint from headers for local vault storage.
 */
export async function lockPDF(
  id: string,
  password: string,
  hint?: string,
  saveToVault?: boolean
): Promise<{ blob: Blob; hash: string | null; hint: string | null }> {
  const response = await fetch(`${API_URL}/api/lock`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id, password, hint, saveToVault }),
  });

  if (!response.ok) {
    let errorMessage = "Encryption failed.";
    try {
      const errorJson = await response.json();
      if (errorJson?.message) {
        errorMessage = errorJson.message;
      }
    } catch {
      errorMessage = `Locking failed with status ${response.status}`;
    }
    throw new Error(errorMessage);
  }

  const blob = await response.blob();
  const hash = response.headers.get("X-PDF-Hash");
  const encodedHint = response.headers.get("X-PDF-Hint");
  const decodedHint = encodedHint ? decodeURIComponent(encodedHint) : null;

  return { blob, hash, hint: decodedHint };
}