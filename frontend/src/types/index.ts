export interface UploadResponse {
  id: string;
  encrypted: boolean;
}

export type UnlockFlowState =
  | "idle"
  | "uploading"
  | "password_required"
  | "unlocking"
  | "success";

export interface FileData {
  id: string;
  name: string;
  size: number;
}
