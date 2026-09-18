import { UserRole, UserSession } from '@ruang-digital/types';

/**
 * Check if the user session has the ADMIN role
 */
export function isAdmin(user?: UserSession | null): boolean {
  return user?.role === 'ADMIN';
}

/**
 * Check if the user session has the CUSTOMER role
 */
export function isCustomer(user?: UserSession | null): boolean {
  return user?.role === 'CUSTOMER';
}

/**
 * Validate that the current session has one of the allowed roles
 */
export function hasAllowedRole(user: UserSession | null | undefined, allowedRoles: UserRole[]): boolean {
  if (!user) return false;
  return allowedRoles.includes(user.role);
}

/**
 * Guard for server actions and API routes requiring Admin access
 */
export function requireAdminGuard(user?: UserSession | null): UserSession {
  if (!user || user.role !== 'ADMIN') {
    throw new Error('UNAUTHORIZED: Akses hanya untuk Administrator.');
  }
  return user;
}

/**
 * Guard for server actions and API routes requiring Customer or logged-in access
 */
export function requireAuthGuard(user?: UserSession | null): UserSession {
  if (!user) {
    throw new Error('UNAUTHORIZED: Silakan masuk ke akun Anda terlebih dahulu.');
  }
  return user;
}
