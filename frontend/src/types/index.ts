export interface UploadResponse {
  id: string;
  encrypted: boolean;
  pdfHash?: string;
  autoDecrypted?: boolean;
}

export interface ConvertResponse {
  id: string;
  originalname: string;
  pdfHash?: string;
}

export type UnlockFlowState =
  | "idle"
  | "uploading"
  | "converting"
  | "password_required"
  | "unlocking"
  | "success"
  | "lock_config"
  | "vault_prompt";

export interface FileData {
  id: string;
  name: string;
  size: number;
}


