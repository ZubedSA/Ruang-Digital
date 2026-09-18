import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ruang-digital/db';

export async function PATCH(req: NextRequest) {
  try {
    const { orderId, status, courier, trackingNumber } = await req.json();

    if (!orderId || !status) {
      return NextResponse.json({ error: 'orderId dan status wajib diisi.' }, { status: 400 });
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: { status },
      });

      // If updating shipment info
      if (trackingNumber || courier) {
        const shipment = await tx.shipment.findFirst({ where: { orderId } });
        if (shipment) {
          await tx.shipment.update({
            where: { id: shipment.id },
            data: {
              courier: courier || shipment.courier,
              trackingNumber: trackingNumber || shipment.trackingNumber,
              status: status === 'SHIPPED' ? 'SHIPPED' : status === 'DELIVERED' ? 'DELIVERED' : shipment.status,
              shippedAt: status === 'SHIPPED' ? new Date() : undefined,
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          action: 'UPDATE_ORDER_STATUS',
          entity: 'Order',
          entityId: orderId,
          details: { status, trackingNumber },
        },
      });

      return order;
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error('Order status update error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memperbarui status order.' },
      { status: 500 }
    );
  }
}
