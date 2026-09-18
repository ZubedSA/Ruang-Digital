import { NextRequest, NextResponse } from 'next/server';
import { neonQuery } from '@/lib/neon';
import { getAdminSession } from '@/lib/auth';

export async function GET() {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const coupons = await neonQuery<any>(`
      SELECT c.*, 
        json_build_object('usages', COALESCE((SELECT count(*)::int FROM "CouponUsage" cu WHERE cu."couponId" = c.id), 0)) as _count
      FROM "Coupon" c
      ORDER BY c."createdAt" DESC
    `);

    return NextResponse.json({ success: true, data: coupons });
  } catch (error: any) {
    console.error('Admin coupons GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      code,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      quota,
      startDate,
      endDate,
      isActive,
    } = body;

    if (!code || !discountType || discountValue === undefined) {
      return NextResponse.json(
        { error: 'Kode kupon, tipe diskon, dan nilai diskon wajib diisi' },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();

    const existing = await neonQuery<any>('SELECT id FROM "Coupon" WHERE code = $1 LIMIT 1', [cleanCode]);
    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'Kode kupon tersebut sudah digunakan' }, { status: 400 });
    }

    const newId = `cpn-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const parsedDiscountType = discountType === 'PERCENTAGE' ? 'PERCENTAGE' : 'FIXED';
    const parsedDiscountVal = Number(discountValue);
    const parsedMinPurchase = Number(minPurchase || 0);
    const parsedMaxDiscount = maxDiscount ? Number(maxDiscount) : null;
    const parsedQuota = Number(quota || 100);
    const parsedStartDate = startDate ? new Date(startDate).toISOString() : new Date().toISOString();
    const parsedEndDate = endDate ? new Date(endDate).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const parsedIsActive = isActive !== undefined ? Boolean(isActive) : true;

    const rows = await neonQuery<any>(
      `INSERT INTO "Coupon" (
        id, code, "discountType", "discountValue", "minPurchase", "maxDiscount", quota, "startDate", "endDate", "isActive", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *`,
      [
        newId,
        cleanCode,
        parsedDiscountType,
        parsedDiscountVal,
        parsedMinPurchase,
        parsedMaxDiscount,
        parsedQuota,
        parsedStartDate,
        parsedEndDate,
        parsedIsActive,
      ]
    );

    return NextResponse.json({ success: true, data: rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error('Admin coupons POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      code,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      quota,
      startDate,
      endDate,
      isActive,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID diperlukan' }, { status: 400 });
    }

    const existingRows = await neonQuery<any>('SELECT * FROM "Coupon" WHERE id = $1 LIMIT 1', [id]);
    if (!existingRows || existingRows.length === 0) {
      return NextResponse.json({ error: 'Kupon tidak ditemukan' }, { status: 404 });
    }
    const existing = existingRows[0];

    let finalCode = existing.code;
    if (code && code.trim().toUpperCase() !== existing.code) {
      finalCode = code.trim().toUpperCase();
      const duplicate = await neonQuery<any>(
        'SELECT id FROM "Coupon" WHERE code = $1 AND id != $2 LIMIT 1',
        [finalCode, id]
      );
      if (duplicate && duplicate.length > 0) {
        return NextResponse.json({ error: 'Kode kupon sudah digunakan oleh kupon lain' }, { status: 400 });
      }
    }

    const updatedRows = await neonQuery<any>(
      `UPDATE "Coupon" SET
        code = $1,
        "discountType" = $2,
        "discountValue" = $3,
        "minPurchase" = $4,
        "maxDiscount" = $5,
        quota = $6,
        "startDate" = $7,
        "endDate" = $8,
        "isActive" = $9,
        "updatedAt" = NOW()
      WHERE id = $10
      RETURNING *`,
      [
        finalCode,
        discountType ? (discountType === 'PERCENTAGE' ? 'PERCENTAGE' : 'FIXED') : existing.discountType,
        discountValue !== undefined ? Number(discountValue) : existing.discountValue,
        minPurchase !== undefined ? Number(minPurchase) : existing.minPurchase,
        maxDiscount !== undefined ? (maxDiscount ? Number(maxDiscount) : null) : existing.maxDiscount,
        quota !== undefined ? Number(quota) : existing.quota,
        startDate ? new Date(startDate).toISOString() : existing.startDate,
        endDate ? new Date(endDate).toISOString() : existing.endDate,
        isActive !== undefined ? Boolean(isActive) : existing.isActive,
        id,
      ]
    );

    return NextResponse.json({ success: true, data: updatedRows[0] });
  } catch (error: any) {
    console.error('Admin coupons PUT error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID diperlukan' }, { status: 400 });
    }

    await neonQuery('DELETE FROM "Coupon" WHERE id = $1', [id]);
    return NextResponse.json({ success: true, message: 'Kupon berhasil dihapus' });
  } catch (error: any) {
    console.error('Admin coupons DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

