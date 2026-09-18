import {
  GasUploadRequest,
  GasUploadResponse,
  GasDownloadRequest,
  GasDownloadResponse,
  GasDeleteResponse,
} from '@ruang-digital/types';

const GAS_URL = process.env.GOOGLE_APPS_SCRIPT_URL || '';
const GAS_SECRET = process.env.GOOGLE_APPS_SCRIPT_SECRET || '';

export class GoogleAppsScriptBridge {
  private url: string;
  private secret: string;

  constructor() {
    this.url = GAS_URL;
    this.secret = GAS_SECRET;
  }

  /**
   * Request file stream/base64 data from Google Drive via Google Apps Script
   */
  async downloadFile(driveFileId: string): Promise<GasDownloadResponse> {
    // If not configured in development, return simulated response for mock testing
    if (!this.url || this.url.includes('AKfycbx...')) {
      const mockFileContent = Buffer.from(
        'Ruang Digital - Secure Digital File Payload (Development Simulation)'
      ).toString('base64');
      return {
        success: true,
        fileName: 'ruang-digital-deliverable.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
        base64Data: mockFileContent,
      };
    }

    const payload = {
      action: 'download',
      secret: this.secret,
      fileId: driveFileId,
    };

    const res = await fetch(this.url, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'application/json',
        'X-GAS-Secret': this.secret,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Google Apps Script download error: ${res.statusText}`);
    }

    return res.json();
  }

  /**
   * Upload file to Google Drive via Google Apps Script
   */
  async uploadFile(fileName: string, mimeType: string, base64Data: string): Promise<GasUploadResponse> {
    if (!this.url || this.url.includes('AKfycbx...')) {
      return {
        success: true,
        fileId: `mock_drive_file_${Date.now()}`,
        fileName,
        fileSize: base64Data.length,
      };
    }

    const payload = {
      action: 'upload',
      secret: this.secret,
      fileName,
      mimeType,
      base64Data,
    };

    const res = await fetch(this.url, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'application/json',
        'X-GAS-Secret': this.secret,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Google Apps Script upload error: ${res.statusText}`);
    }

    return res.json();
  }

  /**
   * Delete file from Google Drive via Google Apps Script
   */
  async deleteFile(fileId: string): Promise<GasDeleteResponse> {
    if (!this.url || this.url.includes('AKfycbx...')) {
      return { success: true };
    }

    const res = await fetch(this.url, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'application/json',
        'X-GAS-Secret': this.secret,
      },
      body: JSON.stringify({ action: 'delete', secret: this.secret, fileId }),
    });

    return res.json();
  }
}

export const gasBridge = new GoogleAppsScriptBridge();
