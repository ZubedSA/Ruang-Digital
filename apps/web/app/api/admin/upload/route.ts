import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

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

    // Determine extension
    const originalExt = path.extname(file.name) || '.webp';
    const cleanExt = originalExt.toLowerCase() === '.jpeg' ? '.jpg' : originalExt.toLowerCase();
    const randomHex = crypto.randomBytes(6).toString('hex');
    const filename = `product-${Date.now()}-${randomHex}${cleanExt}`;

    // In Cloudflare Workers serverless environment, local filesystem is not persistent and cannot serve static files dynamically.
    // We convert to an optimized base64 Data URL for 100% cloud reliability.
    const base64Data = buffer.toString('base64');
    let finalUrl = `data:${file.type};base64,${base64Data}`;
    let storageType = 'base64';
    let driveFileId: string | null = null;

    try {
      const baseDir = process.cwd();
      const publicUploads = path.join(baseDir, 'public', 'uploads');
      if (!fs.existsSync(publicUploads)) {
        fs.mkdirSync(publicUploads, { recursive: true });
      }
      fs.writeFileSync(path.join(publicUploads, filename), buffer);
    } catch {
      // Ignored in read-only serverless environment
    }

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
