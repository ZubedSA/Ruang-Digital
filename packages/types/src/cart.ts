import { ProductType } from './models';

export interface CartItemData {
  id: string;
  productId: string;
  variantId?: string | null;
  productName: string;
  productSlug: string;
  productType: ProductType;
  price: number;
  featuredImage: string;
  quantity: number;
  stock: number;
  weightInGrams?: number;
  sku?: string | null;
}

export interface CartCalculation {
  items: CartItemData[];
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  total: number;
  totalWeightInGrams: number;
  hasPhysicalItems: boolean;
  couponCode?: string | null;
}

export interface CheckoutPayload {
  items: {
    productId: string;
    variantId?: string | null;
    quantity: number;
  }[];
  shippingAddressId?: string | null;
  couponCode?: string | null;
  customerNotes?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
}

export interface CheckoutResult {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  snapToken?: string;
  redirectUrl?: string;
  paymentStatus: string;
}
