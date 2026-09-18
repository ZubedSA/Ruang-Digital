import { cache } from 'react';
import { cookies } from 'next/headers';
import { verifySessionToken, isAdmin, createSessionToken, SESSION_COOKIE_OPTIONS } from '@ruang-digital/auth';
import { UserSession } from '@ruang-digital/types';

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'rd_session';

export const getAdminSession = cache(async (): Promise<UserSession | null> => {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = verifySessionToken(token);
  if (!session || !isAdmin(session)) {
    return null;
  }

  return session;
});

export async function requireAdmin(): Promise<UserSession> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error('UNAUTHORIZED: Akses hanya untuk Administrator.');
  }
  return session;
}

export async function setAdminSession(user: UserSession): Promise<void> {
  const token = createSessionToken(user);
  cookies().set(COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
}

export async function clearAdminSession(): Promise<void> {
  cookies().delete(COOKIE_NAME);
}
