import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/payment';
import { MidtransWebhookBody } from '@ruang-digital/types';

export async function POST(req: NextRequest) {
  try {
    const body: MidtransWebhookBody = await req.json();

    if (!body || !body.order_id || !body.transaction_status) {
      return NextResponse.json({ error: 'Payload tidak valid.' }, { status: 400 });
    }

    const result = await paymentService.handleNotification(body);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Midtrans Webhook Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Gagal memproses webhook pembayaran.' },
      { status: 500 }
    );
  }
}
