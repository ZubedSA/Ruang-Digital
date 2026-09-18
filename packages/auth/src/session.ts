import * as crypto from 'crypto';
import { UserSession } from '@ruang-digital/types';

const DEFAULT_SECRET = process.env.AUTH_SECRET || 'ruang-digital-super-secret-auth-key-change-in-prod';
const SESSION_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface SessionTokenPayload {
  user: UserSession;
  expiresAt: number;
}

/**
 * Sign session user data into a tamper-proof session token
 */
export function createSessionToken(
  user: UserSession,
  secret: string = DEFAULT_SECRET
): string {
  const payload: SessionTokenPayload = {
    user,
    expiresAt: Date.now() + SESSION_EXPIRATION_MS,
  };

  const dataString = JSON.stringify(payload);
  const base64Data = Buffer.from(dataString).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(base64Data)
    .digest('base64url');

  return `${base64Data}.${signature}`;
}

/**
 * Verify and extract session token
 */
export function verifySessionToken(
  token?: string | null,
  secret: string = DEFAULT_SECRET
): UserSession | null {
  if (!token) return null;

  try {
    const [base64Data, signature] = token.split('.');
    if (!base64Data || !signature) return null;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(base64Data)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payloadString = Buffer.from(base64Data, 'base64url').toString('utf-8');
    const payload: SessionTokenPayload = JSON.parse(payloadString);

    if (Date.now() > payload.expiresAt) {
      return null; // Session expired
    }

    return payload.user;
  } catch (e) {
    return null;
  }
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
};
