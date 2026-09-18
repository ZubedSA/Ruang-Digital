import { NextRequest, NextResponse } from 'next/server';
import { verifySignedDownloadToken } from '@ruang-digital/utils';
import { prisma } from '@/lib/db';
import { gasBridge } from '@/lib/gas';
import { getCurrentUser } from '@/lib/auth';

const AUTH_SECRET = process.env.AUTH_SECRET || 'ruang-digital-super-secret-auth-key-change-in-prod';

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    if (!token) {
      return NextResponse.json({ error: 'Token download tidak ditemukan.' }, { status: 400 });
    }

    // 1. Verify signed token
    const tokenData = verifySignedDownloadToken(token, AUTH_SECRET);
    if (!tokenData) {
      return NextResponse.json(
        { error: 'Tautan download tidak valid atau sudah kedaluwarsa. Silakan muat ulang halaman produk Anda.' },
        { status: 403 }
      );
    }

    // 2. Verify logged-in session user matches token owner
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.id !== tokenData.userId) {
      return NextResponse.json(
        { error: 'Akses ditolak: Anda harus masuk ke akun yang memiliki pesanan ini.' },
        { status: 401 }
      );
    }

    // 3. Verify Order & Payment Status in Database
    const order = await prisma.order.findUnique({
      where: { id: tokenData.orderId },
      include: {
        items: true,
      },
    });

    if (!order || order.userId !== currentUser.id) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan atau bukan milik Anda.' }, { status: 404 });
    }

    if (order.status !== 'PAID' && order.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Pesanan belum dibayar lunas. Akses file digital belum diizinkan.' },
        { status: 403 }
      );
    }

    // 4. Verify File is Active
    const file = await prisma.productFile.findUnique({
      where: { id: tokenData.fileId },
    });

    if (!file || !file.isActive) {
      return NextResponse.json({ error: 'File tidak ditemukan atau sedang dinonaktifkan.' }, { status: 404 });
    }

    // 5. Fetch file payload securely from Google Apps Script bridge
    const fileResponse = await gasBridge.downloadFile(file.driveFileId);
    if (!fileResponse.success || !fileResponse.base64Data) {
      return NextResponse.json(
        { error: 'Gagal mengambil file dari Google Drive. Silakan hubungi dukungan Ruang Digital.' },
        { status: 502 }
      );
    }

    // 6. Record Download Audit Log in Database
    const ip = req.headers.get('x-forwarded-for') || req.ip || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    await prisma.download.create({
      data: {
        userId: currentUser.id,
        productId: tokenData.productId,
        orderId: tokenData.orderId,
        fileId: tokenData.fileId,
        ipAddress: ip,
        userAgent,
      },
    });

    // 7. Stream file binary as downloadable attachment
    const buffer = Buffer.from(fileResponse.base64Data, 'base64');
    const safeFileName = file.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': fileResponse.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${safeFileName}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Download route error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan pada server saat memproses unduhan.' },
      { status: 500 }
    );
  }
}
