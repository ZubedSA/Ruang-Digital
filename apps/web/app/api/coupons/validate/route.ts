import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, subtotal } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ valid: false, error: 'Kode voucher tidak boleh kosong' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();
    const coupon = await prisma.coupon.findUnique({
      where: { code: cleanCode },
    });

    if (!coupon) {
      return NextResponse.json({ valid: false, error: 'Kode voucher tidak ditemukan' }, { status: 404 });
    }

    if (!coupon.isActive) {
      return NextResponse.json({ valid: false, error: 'Voucher ini sedang tidak aktif' }, { status: 400 });
    }

    const now = new Date();
    if (now < new Date(coupon.startDate)) {
      return NextResponse.json({ valid: false, error: 'Periode voucher promo belum dimulai' }, { status: 400 });
    }

    if (now > new Date(coupon.endDate)) {
      return NextResponse.json({ valid: false, error: 'Voucher promo telah berakhir / kadaluarsa' }, { status: 400 });
    }

    if (coupon.usedCount >= coupon.quota) {
      return NextResponse.json({ valid: false, error: 'Kuota pemakaian voucher promo sudah habis' }, { status: 400 });
    }

    const currentSubtotal = Number(subtotal || 0);
    if (currentSubtotal < coupon.minPurchase) {
      return NextResponse.json(
        {
          valid: false,
          error: `Minimal belanja untuk voucher ini adalah Rp ${coupon.minPurchase.toLocaleString('id-ID')}`,
        },
        { status: 400 }
      );
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = Math.round((currentSubtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    // Cannot exceed current subtotal
    if (discountAmount > currentSubtotal) {
      discountAmount = currentSubtotal;
    }

    return NextResponse.json({
      valid: true,
      data: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
      },
      message: `Voucher promo berhasil diterapkan! Hemat Rp ${discountAmount.toLocaleString('id-ID')}`,
    });
  } catch (error: any) {
    console.error('Coupon validation error:', error);
    return NextResponse.json({ valid: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
