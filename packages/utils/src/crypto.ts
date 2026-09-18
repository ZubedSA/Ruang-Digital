import * as crypto from 'crypto';

/**
 * Generate unique and sequential-looking order number
 * Format: RD-YYYYMMDD-XXXX
 */
export function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `RD-${year}${month}${day}-${randomSuffix}`;
}

/**
 * Generate standard license key
 * Format: RD-XXXX-XXXX-XXXX-XXXX
 */
export function generateLicenseKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segment = (len: number) => {
    let res = '';
    for (let i = 0; i < len; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };
  return `RD-${segment(4)}-${segment(4)}-${segment(4)}-${segment(4)}`;
}

export interface DownloadTokenPayload {
  userId: string;
  orderId: string;
  fileId: string;
  productId?: string;
  expiresAt: number; // Unix timestamp in ms
}

/**
 * Generate HMAC-signed time-limited download token
 */
export function createSignedDownloadToken(
  payload: DownloadTokenPayload,
  secretKey: string
): string {
  const data = JSON.stringify(payload);
  const base64Data = Buffer.from(data).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(base64Data)
    .digest('base64url');

  return `${base64Data}.${signature}`;
}

/**
 * Verify and decode an HMAC-signed download token
 */
export function verifySignedDownloadToken(
  token: string,
  secretKey: string
): DownloadTokenPayload | null {
  try {
    const [base64Data, signature] = token.split('.');
    if (!base64Data || !signature) return null;

    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(base64Data)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payloadString = Buffer.from(base64Data, 'base64url').toString('utf-8');
    const payload: DownloadTokenPayload = JSON.parse(payloadString);

    if (Date.now() > payload.expiresAt) {
      return null; // Expired
    }

    return payload;
  } catch (err) {
    return null;
  }
}
