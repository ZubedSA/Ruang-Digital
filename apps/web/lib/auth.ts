import { cache } from 'react';
import { cookies } from 'next/headers';
import { verifySessionToken, isAdmin, SESSION_COOKIE_OPTIONS, createSessionToken } from '@ruang-digital/auth';
import { UserSession } from '@ruang-digital/types';

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'rd_session';

/**
 * Get current logged in user from cookie in server context
 */
export const getCurrentUser = cache(async (): Promise<UserSession | null> => {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  return verifySessionToken(token);
});

/**
 * Set user session cookie
 */
export async function setUserSession(user: UserSession): Promise<void> {
  const token = createSessionToken(user);
  cookies().set(COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
}

/**
 * Clear session cookie on logout
 */
export async function clearUserSession(): Promise<void> {
  cookies().delete(COOKIE_NAME);
}

/**
 * Admin session helpers
 */
export const getAdminSession = cache(async (): Promise<UserSession | null> => {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) {
    return null;
  }
  return user;
});

export async function requireAdmin(): Promise<UserSession> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error('UNAUTHORIZED: Akses hanya untuk Administrator.');
  }
  return session;
}

export const setAdminSession = setUserSession;
export const clearAdminSession = clearUserSession;
