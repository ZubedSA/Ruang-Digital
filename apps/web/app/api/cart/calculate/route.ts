import { NextRequest, NextResponse } from 'next/server';
import { calculateCartTotals } from '@/lib/cart';

export async function POST(req: NextRequest) {
  try {
    const { items, couponCode } = await req.json();
    const calculation = await calculateCartTotals(items || [], couponCode);
    return NextResponse.json(calculation);
  } catch (error: any) {
    console.error('Cart calculation error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menghitung kalkulasi keranjang.' },
      { status: 500 }
    );
  }
}
