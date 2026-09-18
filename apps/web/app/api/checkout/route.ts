import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createOrderFromCheckout } from '@/lib/cart';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Silakan masuk ke akun Anda untuk menyelesaikan checkout.' },
        { status: 401 }
      );
    }

    const payload = await req.json();
    const result = await createOrderFromCheckout(user.id, payload);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memproses pesanan checkout.' },
      { status: 500 }
    );
  }
}
