import { prisma } from './db';
import { CartCalculation, CheckoutPayload, CheckoutResult, CartItemData } from '@ruang-digital/types';
import { generateOrderNumber } from '@ruang-digital/utils';
import { paymentService } from './payment';
import { OrderStatus } from '@prisma/client';

const DEFAULT_SHIPPING_FLAT_FEE = 15000; // Rp 15.000 default flat shipping

/**
 * Recalculate cart totals strictly from the database (Zero Frontend Trust)
 */
export async function calculateCartTotals(
  rawItems: { productId: string; variantId?: string | null; quantity: number }[],
  couponCode?: string | null
): Promise<CartCalculation> {
  if (!rawItems || rawItems.length === 0) {
    return {
      items: [],
      subtotal: 0,
      discountAmount: 0,
      shippingFee: 0,
      total: 0,
      totalWeightInGrams: 0,
      hasPhysicalItems: false,
      couponCode: null,
    };
  }

  const items: CartItemData[] = [];
  let subtotal = 0;
  let totalWeight = 0;
  let hasPhysical = false;

  for (const raw of rawItems) {
    const product = await prisma.product.findUnique({
      where: { id: raw.productId },
      include: {
        variants: true,
      },
    });

    if (!product || product.status !== 'ACTIVE') continue;

    let price = product.discountPrice ?? product.basePrice;
    let stock = product.stock;
    let sku = product.sku;

    // Check variant override if selected
    if (raw.variantId) {
      const variant = product.variants.find((v) => v.id === raw.variantId);
      if (variant) {
        price = variant.price;
        stock = variant.stock;
        sku = variant.sku;
      }
    }

    const qty = Math.max(1, Math.min(raw.quantity, stock > 0 ? stock : 999));
    const isPhysical = product.type === 'PHYSICAL';

    if (isPhysical) {
      hasPhysical = true;
      totalWeight += (product.weightInGrams || 200) * qty;
    }

    subtotal += price * qty;

    items.push({
      id: `${product.id}-${raw.variantId || 'base'}`,
      productId: product.id,
      variantId: raw.variantId,
      productName: product.name,
      productSlug: product.slug,
      productType: product.type,
      price,
      featuredImage: product.featuredImage,
      quantity: qty,
      stock,
      weightInGrams: product.weightInGrams ?? 0,
      sku,
    });
  }

  // Calculate Coupon Discount
  let discountAmount = 0;
  let verifiedCouponCode: string | null = null;

  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode.trim().toUpperCase() },
    });

    const now = new Date();
    if (
      coupon &&
      coupon.isActive &&
      now >= coupon.startDate &&
      now <= coupon.endDate &&
      coupon.usedCount < coupon.quota &&
      subtotal >= coupon.minPurchase
    ) {
      verifiedCouponCode = coupon.code;
      if (coupon.discountType === 'PERCENTAGE') {
        const rawDiscount = (subtotal * coupon.discountValue) / 100;
        discountAmount = coupon.maxDiscount ? Math.min(rawDiscount, coupon.maxDiscount) : rawDiscount;
      } else {
        discountAmount = Math.min(coupon.discountValue, subtotal);
      }
    }
  }

  const shippingFee = hasPhysical ? DEFAULT_SHIPPING_FLAT_FEE : 0;
  const total = Math.max(0, subtotal - discountAmount + shippingFee);

  return {
    items,
    subtotal,
    discountAmount: Math.round(discountAmount),
    shippingFee,
    total: Math.round(total),
    totalWeightInGrams: totalWeight,
    hasPhysicalItems: hasPhysical,
    couponCode: verifiedCouponCode,
  };
}

/**
 * Atomically create order from checkout and request payment token
 */
export async function createOrderFromCheckout(
  userId: string,
  payload: CheckoutPayload
): Promise<CheckoutResult> {
  const calculation = await calculateCartTotals(payload.items, payload.couponCode);

  if (calculation.items.length === 0) {
    throw new Error('Keranjang belanja kosong atau produk tidak valid.');
  }

  if (calculation.hasPhysicalItems && !payload.shippingAddressId) {
    throw new Error('Alamat pengiriman wajib diisi untuk produk fisik.');
  }

  const orderNumber = generateOrderNumber();

  const newOrder = await prisma.$transaction(async (tx) => {
    let validAddressId: string | null = null;
    if (calculation.hasPhysicalItems) {
      if (payload.shippingAddressId) {
        const found = await tx.address.findUnique({ where: { id: payload.shippingAddressId } });
        if (found) validAddressId = found.id;
      }
      if (!validAddressId) {
        const userAddr = await tx.address.findFirst({ where: { userId }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] });
        if (userAddr) validAddressId = userAddr.id;
      }
      if (!validAddressId) {
        throw new Error('Alamat pengiriman valid wajib tersedia untuk produk fisik.');
      }
    }

    // 1. Create Order
    const order = await tx.order.create({
      data: {
        orderNumber,
        userId,
        status: OrderStatus.PENDING,
        subtotalAmount: calculation.subtotal,
        discountAmount: calculation.discountAmount,
        shippingFee: calculation.shippingFee,
        totalAmount: calculation.total,
        customerNotes: payload.customerNotes,
        shippingAddressId: validAddressId,
      },
    });

    // 2. Create OrderItems (Snapshots)
    for (const item of calculation.items) {
      await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          productType: item.productType,
          sku: item.sku,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity,
        },
      });
    }

    // 3. Create Shipment if physical products are present
    if (calculation.hasPhysicalItems) {
      await tx.shipment.create({
        data: {
          orderId: order.id,
          courier: 'JNE',
          service: 'REG',
          status: 'PENDING',
          shippingFee: calculation.shippingFee,
        },
      });
    }

    // 4. Record Coupon Usage if coupon applied
    if (calculation.couponCode) {
      const coupon = await tx.coupon.findUnique({ where: { code: calculation.couponCode } });
      if (coupon) {
        await tx.couponUsage.create({
          data: {
            couponId: coupon.id,
            orderId: order.id,
            userId,
            discountApplied: calculation.discountAmount,
          },
        });
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    return order;
  });

  // 5. Create Midtrans Payment Snap Transaction
  const snapPayment = await paymentService.createTransaction({
    orderId: newOrder.id,
    orderNumber: newOrder.orderNumber,
    amount: newOrder.totalAmount,
    customerName: payload.customerName,
    customerEmail: payload.customerEmail,
    customerPhone: payload.customerPhone,
    items: calculation.items.map((it) => ({
      id: it.productId,
      name: it.productName,
      price: it.price,
      quantity: it.quantity,
    })),
  });

  return {
    orderId: newOrder.id,
    orderNumber: newOrder.orderNumber,
    totalAmount: newOrder.totalAmount,
    snapToken: snapPayment.token,
    redirectUrl: snapPayment.redirectUrl,
    paymentStatus: 'PENDING',
  };
}
