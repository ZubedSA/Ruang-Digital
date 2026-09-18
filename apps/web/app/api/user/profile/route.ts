import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, setUserSession } from '@/lib/auth';
import { verifyPassword, hashPassword } from '@ruang-digital/auth';

// =========================================================================
// Neon HTTP SQL API — bypasses TCP port 5432, uses HTTPS port 443
// =========================================================================

const NEON_HOST = 'ep-noisy-firefly-b39a5fem-pooler.c-4.ap-southeast-1.aws.neon.tech';
const NEON_USER = 'neondb_owner';
const NEON_PASSWORD = 'npg_oABCY3lfFVu6';
const NEON_DB = 'neondb';

async function neonQuery(query: string, params: any[] = []): Promise<any[]> {
  const url = `https://${NEON_HOST}/sql`;
  const connectionString = `postgresql://${NEON_USER}:${NEON_PASSWORD}@${NEON_HOST}/${NEON_DB}?sslmode=require`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Neon-Connection-String': connectionString,
    },
    body: JSON.stringify({ query, params }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Neon HTTP SQL Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  if (data.rows) return data.rows;
  if (Array.isArray(data) && data.length > 0 && data[0].rows) return data[0].rows;
  return [];
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await neonQuery(
      'SELECT id, name, email, phone, role, "createdAt" FROM "User" WHERE id = $1 LIMIT 1',
      [user.id]
    );

    const dbUser = rows.length > 0 ? rows[0] : null;

    if (!dbUser) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: dbUser });
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// Update profile info (name, phone)
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Nama harus memiliki minimal 2 karakter' }, { status: 400 });
    }

    const updatedRows = await neonQuery(
      'UPDATE "User" SET name = $1, phone = $2 WHERE id = $3 RETURNING id, name, email, phone, role',
      [name.trim(), phone ? phone.trim() : null, user.id]
    );

    const updatedUser = updatedRows[0];

    // Refresh user session cookie with updated name
    await setUserSession({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
    });

    return NextResponse.json({ success: true, data: updatedUser, message: 'Profil berhasil diperbarui' });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// Change password
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Password saat ini dan password baru wajib diisi' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password baru minimal harus 8 karakter' }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'Konfirmasi password baru tidak cocok' }, { status: 400 });
    }

    const rows = await neonQuery(
      'SELECT id, "passwordHash" FROM "User" WHERE id = $1 LIMIT 1',
      [user.id]
    );

    const dbUser = rows.length > 0 ? rows[0] : null;

    if (!dbUser) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    const isMatch = verifyPassword(currentPassword, dbUser.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Password saat ini tidak sesuai' }, { status: 400 });
    }

    const newHash = hashPassword(newPassword);
    await neonQuery(
      'UPDATE "User" SET "passwordHash" = $1 WHERE id = $2',
      [newHash, user.id]
    );

    return NextResponse.json({ success: true, message: 'Password berhasil diubah. Silakan gunakan password baru pada login berikutnya.' });
  } catch (error: any) {
    console.error('Password change error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
