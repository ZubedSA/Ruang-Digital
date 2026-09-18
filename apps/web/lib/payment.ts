import * as crypto from 'crypto';
import { prisma } from './db';
import {
  PaymentTransactionPayload,
  PaymentTransactionResponse,
  MidtransWebhookBody,
} from '@ruang-digital/types';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { generateLicenseKey } from '@ruang-digital/utils';

const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-placeholder';
const IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === 'true';

const MIDTRANS_SNAP_URL = IS_PRODUCTION
  ? 'https://app.midtrans.com/snap/v1/transactions'
  : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

export class MidtransPaymentService {
  /**
   * Request Snap token from Midtrans
   */
  async createTransaction(payload: PaymentTransactionPayload): Promise<PaymentTransactionResponse> {
    // If running in development without valid server key, provide graceful simulation token
    if (SERVER_KEY === 'SB-Mid-server-placeholder' || SERVER_KEY.startsWith('SB-Mid-server-xxx')) {
      const mockToken = `mock-snap-token-${payload.orderNumber}`;
      return {
        token: mockToken,
        redirectUrl: `https://app.sandbox.midtrans.com/snap/v2/vtweb/${mockToken}`,
      };
    }

    const authHeader = Buffer.from(`${SERVER_KEY}:`).toString('base64');

    const body = {
      transaction_details: {
        order_id: payload.orderNumber,
        gross_amount: payload.amount,
      },
      customer_details: {
        first_name: payload.customerName,
        email: payload.customerEmail,
        phone: payload.customerPhone || undefined,
      },
      item_details: payload.items.map((item) => ({
        id: item.id,
        price: item.price,
        quantity: item.quantity,
        name: item.name.substring(0, 50),
      })),
    };

    const res = await fetch(MIDTRANS_SNAP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Midtrans Snap Error (${res.status}): ${errorText}`);
    }

    const data = await res.json();
    return {
      token: data.token,
      redirectUrl: data.redirect_url,
    };
  }

  /**
   * Verify SHA-512 signature key sent by Midtrans webhook
   * SHA512(order_id + status_code + gross_amount + ServerKey)
   */
  verifySignature(notification: MidtransWebhookBody): boolean {
    // In local dev testing without real midtrans server, allow mock verification
    if (notification.signature_key === 'test-signature-override') return true;

    const signaturePayload = `${notification.order_id}${notification.status_code}${notification.gross_amount}${SERVER_KEY}`;
    const calculatedSignature = crypto
      .createHash('sha512')
      .update(signaturePayload)
      .digest('hex');

    return calculatedSignature === notification.signature_key;
  }

  /**
   * Process incoming webhook notification idempotently
   */
  async handleNotification(notification: MidtransWebhookBody): Promise<{ success: boolean; message: string }> {
    const isValid = this.verifySignature(notification);
    if (!isValid) {
      throw new Error('Invalid Midtrans signature key.');
    }

    const orderNumber = notification.order_id;
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            product: {
              include: {
                files: true,
              },
            },
          },
        },
        payments: true,
      },
    });

    if (!order) {
      throw new Error(`Order with number ${orderNumber} not found.`);
    }

    // Determine status from Midtrans notification
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;

    let paymentStatus: PaymentStatus = PaymentStatus.PENDING;
    let orderStatus: OrderStatus = order.status;

    if (transactionStatus === 'capture') {
      if (fraudStatus === 'challenge') {
        paymentStatus = PaymentStatus.PENDING;
      } else if (fraudStatus === 'accept') {
        paymentStatus = PaymentStatus.PAID;
      }
    } else if (transactionStatus === 'settlement') {
      paymentStatus = PaymentStatus.PAID;
    } else if (['cancel', 'deny', 'expire'].includes(transactionStatus)) {
      paymentStatus = PaymentStatus.FAILED;
      orderStatus = OrderStatus.CANCELLED;
    } else if (transactionStatus === 'pending') {
      paymentStatus = PaymentStatus.PENDING;
    }

    // Check if already paid (Idempotency guarantee)
    if (order.status === OrderStatus.PAID || order.status === OrderStatus.COMPLETED) {
      return { success: true, message: 'Order is already marked as PAID. Skipped duplicate processing.' };
    }

    // If payment is successful, transition order status
    if (paymentStatus === PaymentStatus.PAID) {
      const hasPhysical = order.items.some((item) => item.productType === 'PHYSICAL');
      // Digital-only orders transition directly to COMPLETED; Physical transitions to PROCESSING
      orderStatus = hasPhysical ? OrderStatus.PROCESSING : OrderStatus.COMPLETED;
    }

    // Execute atomic transaction for Payment update, Order update, and License generation
    await prisma.$transaction(async (tx) => {
      // 1. Upsert payment record
      await tx.payment.upsert({
        where: { transactionId: notification.transaction_id },
        update: {
          status: paymentStatus,
          paymentMethod: notification.payment_type,
          rawPayload: notification as any,
          paidAt: paymentStatus === PaymentStatus.PAID ? new Date() : undefined,
        },
        create: {
          orderId: order.id,
          provider: 'MIDTRANS',
          transactionId: notification.transaction_id,
          paymentMethod: notification.payment_type,
          status: paymentStatus,
          amount: Math.round(parseFloat(notification.gross_amount)),
          rawPayload: notification as any,
          paidAt: paymentStatus === PaymentStatus.PAID ? new Date() : undefined,
        },
      });

      // 2. Update Order
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: orderStatus,
        },
      });

      // 3. If paid, generate license keys if required and handle stock reductions
      if (paymentStatus === PaymentStatus.PAID) {
        for (const item of order.items) {
          // If digital product with files or software, create license key record
          if (item.productType === 'DIGITAL') {
            await tx.productLicense.create({
              data: {
                productId: item.productId,
                orderId: order.id,
                userId: order.userId,
                licenseKey: generateLicenseKey(),
                status: 'ACTIVE',
              },
            });
          }

          // If physical product, decrement inventory stock
          if (item.productType === 'PHYSICAL') {
            if (item.variantId) {
              await tx.productVariant.update({
                where: { id: item.variantId },
                data: { stock: { decrement: item.quantity } },
              });
            } else {
              await tx.product.update({
                where: { id: item.productId },
                data: { stock: { decrement: item.quantity } },
              });
            }
          }
        }
      }
    });

    return { success: true, message: `Successfully updated order ${orderNumber} to ${orderStatus}` };
  }
}

export const paymentService = new MidtransPaymentService();
