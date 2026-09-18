/**
 * Neon PostgreSQL Direct HTTP SQL Client
 * 
 * Provides fail-safe, edge-native database connectivity for Cloudflare Workers.
 * Communicates via Neon's HTTPS port 443 /sql API using standard fetch().
 * Bypasses TCP port 5432 socket limitations in Cloudflare V8 isolates.
 */

const NEON_HOST = 'ep-noisy-firefly-b39a5fem-pooler.c-4.ap-southeast-1.aws.neon.tech';
const NEON_USER = 'neondb_owner';
const NEON_PASSWORD = 'npg_oABCY3lfFVu6';
const NEON_DB = 'neondb';

export const NEON_CONNECTION_STRING =
  `postgresql://${NEON_USER}:${NEON_PASSWORD}@${NEON_HOST}/${NEON_DB}?sslmode=require`;

export async function neonQuery<T = any>(query: string, params: any[] = []): Promise<T[]> {
  const url = `https://${NEON_HOST}/sql`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Neon-Connection-String': NEON_CONNECTION_STRING,
      },
      body: JSON.stringify({ query, params }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Neon HTTP SQL error (${response.status}):`, errorText);
      return [];
    }

    const data = await response.json();
    if (data.rows && Array.isArray(data.rows)) return data.rows;
    if (Array.isArray(data) && data.length > 0 && data[0].rows) return data[0].rows;
    return [];
  } catch (err) {
    console.error('Neon HTTP SQL fetch error:', err);
    return [];
  }
}

// ==========================================
// STOREFRONT QUERIES
// ==========================================

export async function getStoreCategories(limit = 10) {
  const sql = `
    SELECT id, name, slug, description, icon, "parentId", "isActive", "createdAt", "updatedAt"
    FROM "Category"
    WHERE "isActive" = true
    ORDER BY "createdAt" ASC
    LIMIT $1
  `;
  return neonQuery(sql, [limit]);
}

export async function getStoreFeaturedProducts(limit = 4) {
  // First try to get products marked as isFeatured
  let sql = `
    SELECT 
      p.id, p.name, p.slug, p.description, p."shortDescription", p.type, p.status,
      p."basePrice", p."discountPrice", p."categoryId", p."featuredImage", p."isFeatured",
      p.stock, p."weightInGrams", p.sku, p."createdAt", p."updatedAt",
      json_build_object('id', c.id, 'name', c.name, 'slug', c.slug) as category
    FROM "Product" p
    LEFT JOIN "Category" c ON p."categoryId" = c.id
    WHERE p.status = 'ACTIVE' AND p."isFeatured" = true
    ORDER BY p."createdAt" DESC
    LIMIT $1
  `;
  let rows = await neonQuery(sql, [limit]);

  // If no featured products found, return the latest active products as fallback
  if (!rows || rows.length === 0) {
    sql = `
      SELECT 
        p.id, p.name, p.slug, p.description, p."shortDescription", p.type, p.status,
        p."basePrice", p."discountPrice", p."categoryId", p."featuredImage", p."isFeatured",
        p.stock, p."weightInGrams", p.sku, p."createdAt", p."updatedAt",
        json_build_object('id', c.id, 'name', c.name, 'slug', c.slug) as category
      FROM "Product" p
      LEFT JOIN "Category" c ON p."categoryId" = c.id
      WHERE p.status = 'ACTIVE'
      ORDER BY p."createdAt" DESC
      LIMIT $1
    `;
    rows = await neonQuery(sql, [limit]);
  }
  return rows;
}

export async function getStoreDigitalProducts(limit = 4) {
  const sql = `
    SELECT 
      p.id, p.name, p.slug, p.description, p."shortDescription", p.type, p.status,
      p."basePrice", p."discountPrice", p."categoryId", p."featuredImage", p."isFeatured",
      p.stock, p."weightInGrams", p.sku, p."createdAt", p."updatedAt",
      json_build_object('id', c.id, 'name', c.name, 'slug', c.slug) as category
    FROM "Product" p
    LEFT JOIN "Category" c ON p."categoryId" = c.id
    WHERE p.status = 'ACTIVE' AND p.type = 'DIGITAL'
    ORDER BY p."createdAt" DESC
    LIMIT $1
  `;
  return neonQuery(sql, [limit]);
}

export async function getStorePhysicalProducts(limit = 4) {
  const sql = `
    SELECT 
      p.id, p.name, p.slug, p.description, p."shortDescription", p.type, p.status,
      p."basePrice", p."discountPrice", p."categoryId", p."featuredImage", p."isFeatured",
      p.stock, p."weightInGrams", p.sku, p."createdAt", p."updatedAt",
      json_build_object('id', c.id, 'name', c.name, 'slug', c.slug) as category
    FROM "Product" p
    LEFT JOIN "Category" c ON p."categoryId" = c.id
    WHERE p.status = 'ACTIVE' AND p.type = 'PHYSICAL'
    ORDER BY p."createdAt" DESC
    LIMIT $1
  `;
  return neonQuery(sql, [limit]);
}

export async function getStoreCatalogProducts(filters: {
  q?: string;
  cat?: string;
  type?: string;
  sort?: string;
}) {
  const conditions: string[] = ["p.status = 'ACTIVE'"];
  const params: any[] = [];

  if (filters.q && filters.q.trim()) {
    params.push(`%${filters.q.trim()}%`);
    conditions.push(`(p.name ILIKE $${params.length} OR p.description ILIKE $${params.length})`);
  }

  if (filters.cat && filters.cat.trim()) {
    params.push(filters.cat.trim());
    conditions.push(`c.slug = $${params.length}`);
  }

  if (filters.type === 'DIGITAL' || filters.type === 'PHYSICAL') {
    params.push(filters.type);
    conditions.push(`p.type = $${params.length}`);
  }

  let orderBy = 'ORDER BY p."createdAt" DESC';
  if (filters.sort === 'price_asc') {
    orderBy = 'ORDER BY p."basePrice" ASC';
  } else if (filters.sort === 'price_desc') {
    orderBy = 'ORDER BY p."basePrice" DESC';
  }

  const sql = `
    SELECT 
      p.id, p.name, p.slug, p.description, p."shortDescription", p.type, p.status,
      p."basePrice", p."discountPrice", p."categoryId", p."featuredImage", p."isFeatured",
      p.stock, p."weightInGrams", p.sku, p."createdAt", p."updatedAt",
      json_build_object('id', c.id, 'name', c.name, 'slug', c.slug) as category
    FROM "Product" p
    LEFT JOIN "Category" c ON p."categoryId" = c.id
    WHERE ${conditions.join(' AND ')}
    ${orderBy}
  `;

  return neonQuery(sql, params);
}

export async function getStoreProductBySlug(slug: string) {
  const sql = `
    SELECT 
      p.id, p.name, p.slug, p.description, p."shortDescription", p.type, p.status,
      p."basePrice", p."discountPrice", p."categoryId", p."featuredImage", p."isFeatured",
      p.stock, p."weightInGrams", p.sku, p."createdAt", p."updatedAt",
      json_build_object('id', c.id, 'name', c.name, 'slug', c.slug) as category,
      COALESCE((
        SELECT json_agg(json_build_object('id', pi.id, 'url', pi.url, 'altText', pi."altText", 'sortOrder', pi."sortOrder") ORDER BY pi."sortOrder" ASC)
        FROM "ProductImage" pi WHERE pi."productId" = p.id
      ), '[]'::json) as images,
      COALESCE((
        SELECT json_agg(json_build_object('id', pv.id, 'name', pv.name, 'sku', pv.sku, 'price', pv.price, 'stock', pv.stock, 'attributes', pv.attributes))
        FROM "ProductVariant" pv WHERE pv."productId" = p.id
      ), '[]'::json) as variants,
      COALESCE((
        SELECT json_agg(json_build_object('id', pf.id, 'fileName', pf."fileName", 'fileType', pf."fileType", 'version', pf.version, 'platform', pf.platform, 'fileSize', pf."fileSize", 'isActive', pf."isActive"))
        FROM "ProductFile" pf WHERE pf."productId" = p.id AND pf."isActive" = true
      ), '[]'::json) as files
    FROM "Product" p
    LEFT JOIN "Category" c ON p."categoryId" = c.id
    WHERE p.slug = $1
    LIMIT 1
  `;
  const rows = await neonQuery(sql, [slug]);
  return rows.length > 0 ? rows[0] : null;
}

// ==========================================
// ADMIN QUERIES
// ==========================================

export async function getAdminProductsList() {
  const sql = `
    SELECT 
      p.id, p.name, p.slug, p.description, p."shortDescription", p.type, p.status,
      p."basePrice", p."discountPrice", p."categoryId", p."featuredImage", p."isFeatured",
      p.stock, p."weightInGrams", p.sku, p."createdAt", p."updatedAt",
      json_build_object('id', c.id, 'name', c.name, 'slug', c.slug) as category,
      COALESCE((SELECT json_agg(row_to_json(pf)) FROM "ProductFile" pf WHERE pf."productId" = p.id), '[]'::json) as files,
      COALESCE((SELECT json_agg(row_to_json(pv)) FROM "ProductVariant" pv WHERE pv."productId" = p.id), '[]'::json) as variants
    FROM "Product" p
    LEFT JOIN "Category" c ON p."categoryId" = c.id
    ORDER BY p."createdAt" DESC
  `;
  return neonQuery(sql);
}

export async function getAdminProductById(id: string) {
  const sql = `
    SELECT 
      p.id, p.name, p.slug, p.description, p."shortDescription", p.type, p.status,
      p."basePrice", p."discountPrice", p."categoryId", p."featuredImage", p."isFeatured",
      p.stock, p."weightInGrams", p.sku, p."createdAt", p."updatedAt",
      json_build_object('id', c.id, 'name', c.name, 'slug', c.slug) as category,
      COALESCE((
        SELECT json_agg(json_build_object('id', pi.id, 'url', pi.url, 'altText', pi."altText", 'sortOrder', pi."sortOrder") ORDER BY pi."sortOrder" ASC)
        FROM "ProductImage" pi WHERE pi."productId" = p.id
      ), '[]'::json) as images,
      COALESCE((SELECT json_agg(row_to_json(pf)) FROM "ProductFile" pf WHERE pf."productId" = p.id), '[]'::json) as files,
      COALESCE((SELECT json_agg(row_to_json(pv)) FROM "ProductVariant" pv WHERE pv."productId" = p.id), '[]'::json) as variants
    FROM "Product" p
    LEFT JOIN "Category" c ON p."categoryId" = c.id
    WHERE p.id = $1
    LIMIT 1
  `;
  const rows = await neonQuery(sql, [id]);
  return rows.length > 0 ? rows[0] : null;
}

export async function getAdminCategoriesList() {
  const sql = `
    SELECT 
      c.id, c.name, c.slug, c.description, c.icon, c."parentId", c."isActive", c."createdAt", c."updatedAt",
      json_build_object('products', COALESCE((SELECT count(*)::int FROM "Product" p WHERE p."categoryId" = c.id), 0)) as _count
    FROM "Category" c
    ORDER BY c."createdAt" DESC
  `;
  return neonQuery(sql);
}

export async function getAdminOrdersList() {
  const sql = `
    SELECT 
      o.*,
      json_build_object('id', u.id, 'name', u.name, 'email', u.email) as user,
      COALESCE((SELECT json_agg(row_to_json(oi)) FROM "OrderItem" oi WHERE oi."orderId" = o.id), '[]'::json) as items,
      COALESCE((SELECT json_agg(row_to_json(s)) FROM "Shipment" s WHERE s."orderId" = o.id), '[]'::json) as shipments,
      COALESCE((SELECT json_agg(row_to_json(pm)) FROM "Payment" pm WHERE pm."orderId" = o.id), '[]'::json) as payments
    FROM "Order" o
    LEFT JOIN "User" u ON o."userId" = u.id
    ORDER BY o."createdAt" DESC
  `;
  return neonQuery(sql);
}

export async function getAdminCustomersList() {
  const sql = `
    SELECT 
      u.id, u.name, u.email, u.phone, u.role, u."createdAt",
      COALESCE((
        SELECT json_agg(json_build_object('id', o.id, 'totalAmount', o."totalAmount"))
        FROM "Order" o
        WHERE o."userId" = u.id AND o.status IN ('PAID', 'COMPLETED', 'PROCESSING', 'SHIPPED')
      ), '[]'::json) as orders,
      COALESCE((
        SELECT json_agg(json_build_object('id', pl.id))
        FROM "ProductLicense" pl
        WHERE pl."userId" = u.id AND pl.status = 'ACTIVE'
      ), '[]'::json) as licenses,
      json_build_object(
        'orders', (SELECT count(*)::int FROM "Order" o WHERE o."userId" = u.id),
        'downloads', (SELECT count(*)::int FROM "Download" d WHERE d."userId" = u.id)
      ) as _count
    FROM "User" u
    WHERE u.role = 'CUSTOMER'
    ORDER BY u."createdAt" DESC
  `;
  return neonQuery(sql);
}

export async function getAdminCouponsList() {
  const sql = `
    SELECT 
      c.*,
      json_build_object('usages', COALESCE((SELECT count(*)::int FROM "CouponUsage" cu WHERE cu."couponId" = c.id), 0)) as _count
    FROM "Coupon" c
    ORDER BY c."createdAt" DESC
  `;
  return neonQuery(sql);
}

export async function getAdminDashboardStats() {
  try {
    const revenueRow = await neonQuery<{ total: number }>(`
      SELECT COALESCE(SUM("totalAmount"), 0)::int as total
      FROM "Order"
      WHERE status IN ('PAID', 'COMPLETED', 'PROCESSING', 'SHIPPED')
    `);
    const orderCountRow = await neonQuery<{ count: number }>(`SELECT count(*)::int as count FROM "Order"`);
    const customerCountRow = await neonQuery<{ count: number }>(`SELECT count(*)::int as count FROM "User" WHERE role = 'CUSTOMER'`);
    const digitalCountRow = await neonQuery<{ count: number }>(`SELECT count(*)::int as count FROM "Product" WHERE type = 'DIGITAL'`);
    const physicalCountRow = await neonQuery<{ count: number }>(`SELECT count(*)::int as count FROM "Product" WHERE type = 'PHYSICAL'`);
    const lowStock = await neonQuery(`SELECT * FROM "Product" WHERE type = 'PHYSICAL' AND stock <= 10 LIMIT 5`);
    const recentOrders = await neonQuery(`
      SELECT o.*, json_build_object('id', u.id, 'name', u.name, 'email', u.email) as user,
      COALESCE((SELECT json_agg(row_to_json(oi)) FROM "OrderItem" oi WHERE oi."orderId" = o.id), '[]'::json) as items
      FROM "Order" o
      LEFT JOIN "User" u ON o."userId" = u.id
      ORDER BY o."createdAt" DESC
      LIMIT 5
    `);

    return {
      totalRevenue: revenueRow[0]?.total || 0,
      totalOrders: orderCountRow[0]?.count || 0,
      totalCustomers: customerCountRow[0]?.count || 0,
      digitalProductsCount: digitalCountRow[0]?.count || 0,
      physicalProductsCount: physicalCountRow[0]?.count || 0,
      lowStockProducts: lowStock || [],
      recentOrders: recentOrders || [],
    };
  } catch (err) {
    console.error('Neon admin dashboard stats error:', err);
    return {
      totalRevenue: 0,
      totalOrders: 0,
      totalCustomers: 0,
      digitalProductsCount: 0,
      physicalProductsCount: 0,
      lowStockProducts: [],
      recentOrders: [],
    };
  }
}

export async function getAdminShipmentsList() {
  const sql = `
    SELECT 
      s.*,
      json_build_object(
        'id', o.id,
        'orderNumber', o."orderNumber",
        'user', json_build_object('id', u.id, 'name', u.name, 'email', u.email, 'phone', u.phone),
        'shippingAddress', row_to_json(a),
        'items', COALESCE((SELECT json_agg(row_to_json(oi)) FROM "OrderItem" oi WHERE oi."orderId" = o.id AND oi."productType" = 'PHYSICAL'), '[]'::json)
      ) as order
    FROM "Shipment" s
    LEFT JOIN "Order" o ON s."orderId" = o.id
    LEFT JOIN "User" u ON o."userId" = u.id
    LEFT JOIN "Address" a ON o."shippingAddressId" = a.id
    ORDER BY s."createdAt" DESC
  `;
  return neonQuery(sql);
}

export async function getAdminPaymentsList() {
  const sql = `
    SELECT 
      p.*,
      json_build_object(
        'id', o.id,
        'orderNumber', o."orderNumber",
        'user', json_build_object('id', u.id, 'name', u.name, 'email', u.email)
      ) as order
    FROM "Payment" p
    LEFT JOIN "Order" o ON p."orderId" = o.id
    LEFT JOIN "User" u ON o."userId" = u.id
    ORDER BY p."createdAt" DESC
  `;
  return neonQuery(sql);
}

export async function getAdminReviewsList() {
  const sql = `
    SELECT 
      r.*,
      json_build_object('id', u.id, 'name', u.name, 'avatar', u.avatar) as user,
      json_build_object('id', pr.id, 'name', pr.name, 'slug', pr.slug, 'featuredImage', pr."featuredImage") as product
    FROM "Review" r
    LEFT JOIN "User" u ON r."userId" = u.id
    LEFT JOIN "Product" pr ON r."productId" = pr.id
    ORDER BY r."createdAt" DESC
  `;
  return neonQuery(sql);
}

export async function getAdminAuditLogsList(limit = 100) {
  const sql = `
    SELECT 
      a.*,
      json_build_object('id', u.id, 'name', u.name, 'email', u.email, 'role', u.role) as user
    FROM "AuditLog" a
    LEFT JOIN "User" u ON a."userId" = u.id
    ORDER BY a."createdAt" DESC
    LIMIT $1
  `;
  return neonQuery(sql, [limit]);
}

export async function getAdminDownloadLogsList(limit = 50) {
  const sql = `
    SELECT 
      d.*,
      json_build_object('name', u.name, 'email', u.email) as user,
      json_build_object('name', p.name, 'type', p.type) as product,
      json_build_object('fileName', pf."fileName", 'version', pf.version) as file,
      json_build_object('orderNumber', o."orderNumber") as order
    FROM "Download" d
    LEFT JOIN "User" u ON d."userId" = u.id
    LEFT JOIN "Product" p ON d."productId" = p.id
    LEFT JOIN "ProductFile" pf ON d."productFileId" = pf.id
    LEFT JOIN "Order" o ON d."orderId" = o.id
    ORDER BY d."downloadedAt" DESC
    LIMIT $1
  `;
  return neonQuery(sql, [limit]);
}

