export type UserRole = 'CUSTOMER' | 'ADMIN';

export type ProductType = 'DIGITAL' | 'PHYSICAL';

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'EXPIRED'
  | 'REFUNDED';

export type ShipmentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'RETURNED';

export type LicenseStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export type DiscountType = 'PERCENTAGE' | 'FIXED';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string | null;
}

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string | null;
  type: ProductType;
  status: ProductStatus;
  basePrice: number;
  discountPrice?: number | null;
  categoryId: string;
  categoryName?: string;
  featuredImage: string;
  isFeatured: boolean;
  weightInGrams?: number | null;
  stock: number;
  sku?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ProductDetail extends ProductSummary {
  images: { id: string; url: string; altText?: string | null; sortOrder: number }[];
  variants: { id: string; name: string; sku: string; price: number; stock: number; attributes?: any }[];
  files?: { id: string; fileName: string; fileType: string; version: string; platform?: string | null; fileSize?: number | null; isActive: boolean }[];
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  totalAmount: number;
  subtotalAmount: number;
  discountAmount: number;
  shippingFee: number;
  customerNotes?: string | null;
  createdAt: Date | string;
  itemCount?: number;
  hasPhysicalItems?: boolean;
}
