import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ruang-digital/db';
import { getAdminSession } from '@/lib/auth';

export async function GET() {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const coupons = await prisma.coupon.findMany({
      include: {
        _count: {
          select: { usages: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

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

    const existing = await prisma.coupon.findUnique({ where: { code: cleanCode } });
    if (existing) {
      return NextResponse.json({ error: 'Kode kupon tersebut sudah digunakan' }, { status: 400 });
    }

    const newCoupon = await prisma.coupon.create({
      data: {
        code: cleanCode,
        discountType: discountType === 'PERCENTAGE' ? 'PERCENTAGE' : 'FIXED',
        discountValue: Number(discountValue),
        minPurchase: Number(minPurchase || 0),
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        quota: Number(quota || 100),
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: isActive !== undefined ? !!isActive : true,
      },
    });

    return NextResponse.json({ success: true, data: newCoupon }, { status: 201 });
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

    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Kupon tidak ditemukan' }, { status: 404 });
    }

    let finalCode = existing.code;
    if (code && code.trim().toUpperCase() !== existing.code) {
      finalCode = code.trim().toUpperCase();
      const duplicate = await prisma.coupon.findFirst({
        where: { code: finalCode, NOT: { id } },
      });
      if (duplicate) {
        return NextResponse.json({ error: 'Kode kupon sudah digunakan oleh kupon lain' }, { status: 400 });
      }
    }

    const updated = await prisma.coupon.update({
      where: { id },
      data: {
        code: finalCode,
        discountType: discountType ? (discountType === 'PERCENTAGE' ? 'PERCENTAGE' : 'FIXED') : existing.discountType,
        discountValue: discountValue !== undefined ? Number(discountValue) : existing.discountValue,
        minPurchase: minPurchase !== undefined ? Number(minPurchase) : existing.minPurchase,
        maxDiscount: maxDiscount !== undefined ? (maxDiscount ? Number(maxDiscount) : null) : existing.maxDiscount,
        quota: quota !== undefined ? Number(quota) : existing.quota,
        startDate: startDate ? new Date(startDate) : existing.startDate,
        endDate: endDate ? new Date(endDate) : existing.endDate,
        isActive: isActive !== undefined ? !!isActive : existing.isActive,
      },
    });

    return NextResponse.json({ success: true, data: updated });
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

    await prisma.coupon.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Kupon berhasil dihapus' });
  } catch (error: any) {
    console.error('Admin coupons DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
