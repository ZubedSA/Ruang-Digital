import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Akses khusus admin.' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'File produk digital wajib diunggah.' }, { status: 400 });
    }

    // Maksimal batas ukuran via GAS Web App (~50MB)
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        {
          error:
            'Ukuran file melebihi 50 MB. Untuk file berukuran sangat besar, silakan upload langsung ke Google Drive Anda lalu masukkan File ID-nya secara manual.',
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const originalName = file.name;
    const ext = path.extname(originalName).replace('.', '') || 'zip';
    const cleanFileName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');

    const gasUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
    const gasSecret = process.env.GOOGLE_APPS_SCRIPT_SECRET;

    let driveFileId: string | null = null;
    let storageType = 'local';
    let errorMessage: string | null = null;

    // Coba upload ke Google Drive melalui Google Apps Script Bridge
    if (
      gasUrl &&
      !gasUrl.includes('AKfycbxJo07nOcVp62jbrm5zKKip_CkrkL0oXnKv4T-1ueUWMWdp_sas84Z41C-i1fCixMqF') &&
      !gasUrl.includes('AKfycbx...')
    ) {
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
            fileName: cleanFileName,
            mimeType: file.type || 'application/octet-stream',
            base64Data,
            isPublic: false, // File digital bersifat PRIVAT
          }),
        });

        if (gasRes.ok) {
          const gasData = await gasRes.json();
          if (gasData.success && gasData.fileId) {
            driveFileId = gasData.fileId;
            storageType = 'google-drive';
          } else {
            errorMessage = gasData.error || 'Respon GAS tidak mengembalikan ID file.';
          }
        } else {
          errorMessage = `HTTP Error dari GAS: ${gasRes.statusText}`;
        }
      } catch (gasErr: any) {
        console.warn('Google Apps Script upload failed, falling back to local storage:', gasErr.message);
        errorMessage = gasErr.message;
      }
    } else {
      errorMessage = 'GOOGLE_APPS_SCRIPT_URL belum diatur.';
    }

    // Fallback: Jika GAS belum diatur atau gagal terhubung, simpan ke local secure storage jika memungkinkan
    const baseDir = process.cwd();
    const localDigitalDir = path.join(baseDir, 'storage', 'digital');
    try {
      if (!fs.existsSync(localDigitalDir)) {
        fs.mkdirSync(localDigitalDir, { recursive: true });
      }
      const randomHex = crypto.randomBytes(4).toString('hex');
      const localSavedFileName = `digital-${Date.now()}-${randomHex}-${cleanFileName}`;
      fs.writeFileSync(path.join(localDigitalDir, localSavedFileName), buffer);
    } catch {
      // Serverless env fallback
    }

    const finalFileId = driveFileId || `local_${cleanFileName}`;

    return NextResponse.json({
      success: true,
      driveFileId: finalFileId,
      fileName: cleanFileName,
      fileSize: file.size,
      fileType: ext,
      storage: storageType,
      message:
        storageType === 'google-drive'
          ? 'File berhasil diunggah langsung ke Google Drive!'
          : `File diproses (${errorMessage || 'Local fallback'}).`,
    });
  } catch (error: any) {
    console.error('Digital file upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memproses upload file digital.' },
      { status: 500 }
    );
  }
}
