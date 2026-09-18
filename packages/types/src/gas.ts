export interface GasUploadRequest {
  action: 'upload';
  fileName: string;
  mimeType: string;
  base64Data: string;
  folderId?: string;
}

export interface GasUploadResponse {
  success: boolean;
  fileId?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
}

export interface GasDownloadRequest {
  action: 'download';
  fileId: string;
}

export interface GasDownloadResponse {
  success: boolean;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  base64Data?: string;
  error?: string;
}

export interface GasDeleteRequest {
  action: 'delete';
  fileId: string;
}

export interface GasDeleteResponse {
  success: boolean;
  error?: string;
}
