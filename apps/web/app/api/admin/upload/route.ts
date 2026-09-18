import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Akses khusus admin' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'File gambar wajib diunggah' }, { status: 400 });
    }

    // Validate mime type
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!validMimes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Format file tidak didukung. Harap gunakan format JPG, PNG, WEBP, atau GIF.' },
        { status: 400 }
      );
    }

    // Max 5MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Ukuran file terlalu besar. Maksimal 5 MB.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const filename = `product-${Date.now()}-${randomSuffix}.webp`;

    // Convert to base64 Data URL for 100% cloud reliability without filesystem dependencies
    const base64Data = buffer.toString('base64');
    let finalUrl = `data:${file.type};base64,${base64Data}`;
    let storageType = 'base64';
    let driveFileId: string | null = null;


    // Google Drive Upload via Google Apps Script Bridge
    const gasUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
    const gasSecret = process.env.GOOGLE_APPS_SCRIPT_SECRET;

    if (gasUrl && !gasUrl.includes('AKfycbx...')) {
      try {
        const base64Data = buffer.toString('base64');
        const gasRes = await fetch(gasUrl, {
          method: 'POST',
          redirect: 'follow',
          headers: {
            'Content-Type': 'application/json',
            'X-GAS-Secret': gasSecret || '',
          },
          body: JSON.stringify({
            action: 'upload',
            secret: gasSecret || '',
            fileName: filename,
            mimeType: file.type,
            base64Data,
            isPublic: true,
          }),
        });

        if (gasRes.ok) {
          const gasData = await gasRes.json();
          if (gasData.success && gasData.fileId) {
            driveFileId = gasData.fileId;
            finalUrl = `https://lh3.googleusercontent.com/d/${gasData.fileId}`;
            storageType = 'google-drive';
          }
        }
      } catch (gasErr) {
        console.warn('Google Apps Script upload failed, using local storage fallback:', gasErr);
      }
    }

    return NextResponse.json({
      success: true,
      url: finalUrl,
      relativeUrl: `/uploads/${filename}`,
      storage: storageType,
      driveFileId,
      filename,
      message: storageType === 'google-drive'
        ? 'Foto produk berhasil diunggah ke Google Drive!'
        : 'Foto produk berhasil diunggah ke server!',
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan saat mengunggah foto' },
      { status: 500 }
    );
  }
}
