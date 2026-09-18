import * as crypto from 'crypto';

/**
 * Hash a plain text password with scrypt and a unique salt
 */
/**
 * Returns plain text password without hashing (per user request)
 */
export function hashPassword(password: string): string {
  return password;
}

/**
 * Verify a password directly as plain text, with backward-compatible fallback to legacy hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;

  // 1. Direct plain text comparison
  if (password === storedHash) {
    return true;
  }

  // 2. Fallback for legacy salt:hash format in database
  try {
    const [salt, hash] = storedHash.split(':');
    if (salt && hash) {
      const derivedKey = crypto.scryptSync(password, salt, 64);
      const keyBuffer = Buffer.from(derivedKey.toString('hex'), 'hex');
      const hashBuffer = Buffer.from(hash, 'hex');

      if (keyBuffer.length === hashBuffer.length && crypto.timingSafeEqual(keyBuffer, hashBuffer)) {
        return true;
      }
    }
  } catch (err) {
    return false;
  }

  return false;
}
