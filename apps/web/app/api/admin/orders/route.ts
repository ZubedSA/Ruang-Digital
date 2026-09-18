import { NextRequest, NextResponse } from 'next/server';
import { neonQuery } from '@/lib/neon';

export async function PATCH(req: NextRequest) {
  try {
    const { orderId, status, courier, trackingNumber } = await req.json();

    if (!orderId || !status) {
      return NextResponse.json({ error: 'orderId dan status wajib diisi.' }, { status: 400 });
    }

    // Update order status
    const orderRows = await neonQuery<any>(
      `UPDATE "Order" SET status = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING *`,
      [status, orderId]
    );

    if (!orderRows || orderRows.length === 0) {
      return NextResponse.json({ error: 'Order tidak ditemukan.' }, { status: 404 });
    }

    // Update shipment if provided
    if (trackingNumber || courier) {
      const shipmentRows = await neonQuery<any>(
        'SELECT id, courier, "trackingNumber", status FROM "Shipment" WHERE "orderId" = $1 LIMIT 1',
        [orderId]
      );

      if (shipmentRows && shipmentRows.length > 0) {
        const shp = shipmentRows[0];
        const newCourier = courier || shp.courier;
        const newTracking = trackingNumber || shp.trackingNumber;
        const newShipmentStatus = status === 'SHIPPED' ? 'SHIPPED' : status === 'DELIVERED' ? 'DELIVERED' : shp.status;
        const isShipped = status === 'SHIPPED';

        await neonQuery(
          `UPDATE "Shipment" SET 
            courier = $1,
            "trackingNumber" = $2,
            status = $3,
            "shippedAt" = CASE WHEN $4::boolean THEN NOW() ELSE "shippedAt" END,
            "updatedAt" = NOW()
          WHERE id = $5`,
          [newCourier, newTracking, newShipmentStatus, isShipped, shp.id]
        );
      }
    }

    // Create Audit Log
    const auditId = `aud-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    await neonQuery(
      `INSERT INTO "AuditLog" (id, action, entity, "entityId", details, "createdAt")
       VALUES ($1, 'UPDATE_ORDER_STATUS', 'Order', $2, $3, NOW())`,
      [auditId, orderId, JSON.stringify({ status, trackingNumber })]
    );

    return NextResponse.json({ success: true, order: orderRows[0] });
  } catch (error: any) {
    console.error('Order status update error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memperbarui status order.' },
      { status: 500 }
    );
  }
}

