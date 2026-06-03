export interface DownloadRequest {
  url: string;
}

export interface DownloadResponse {
  success: boolean;
  filename?: string;
  downloadUrl?: string;
  thumbnail?: string;
  caption?: string;
  message?: string;
}

export interface BatchItem {
  url: string;
  success: boolean;
  downloadUrl?: string;
  thumbnail?: string;
  caption?: string;
  filename?: string;
  message?: string;
}

export interface BatchResponse {
  success: boolean;
  total: number;
  succeeded: number;
  failed: number;
  results: BatchItem[];
  message?: string;
}
