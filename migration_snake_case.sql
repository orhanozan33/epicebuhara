-- Migration Script: camelCase to snake_case column names
-- Supabase Dashboard > SQL Editor'dan çalıştırın

BEGIN;

-- Categories table
ALTER TABLE categories RENAME COLUMN "isActive" TO "is_active";
ALTER TABLE categories RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE categories RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE categories RENAME COLUMN "order" TO "sort_order";

-- Products table
ALTER TABLE products RENAME COLUMN "baseName" TO "base_name";
ALTER TABLE products RENAME COLUMN "shortDescription" TO "short_description";
ALTER TABLE products RENAME COLUMN "comparePrice" TO "compare_price";
ALTER TABLE products RENAME COLUMN "costPrice" TO "cost_price";
ALTER TABLE products RENAME COLUMN "trackStock" TO "track_stock";
ALTER TABLE products RENAME COLUMN "productGroup" TO "product_group";
ALTER TABLE products RENAME COLUMN "isActive" TO "is_active";
ALTER TABLE products RENAME COLUMN "isFeatured" TO "is_featured";
ALTER TABLE products RENAME COLUMN "categoryId" TO "category_id";
ALTER TABLE products RENAME COLUMN "metaTitle" TO "meta_title";
ALTER TABLE products RENAME COLUMN "metaDescription" TO "meta_description";
ALTER TABLE products RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE products RENAME COLUMN "updatedAt" TO "updated_at";

-- Dealers table
ALTER TABLE dealers RENAME COLUMN "companyName" TO "company_name";
ALTER TABLE dealers RENAME COLUMN "taxNumber" TO "tax_number";
ALTER TABLE dealers RENAME COLUMN "tpsNumber" TO "tps_number";
ALTER TABLE dealers RENAME COLUMN "tvqNumber" TO "tvq_number";
ALTER TABLE dealers RENAME COLUMN "isActive" TO "is_active";
ALTER TABLE dealers RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE dealers RENAME COLUMN "updatedAt" TO "updated_at";

-- DealerSales table
ALTER TABLE "dealerSales" RENAME COLUMN "dealerId" TO "dealer_id";
ALTER TABLE "dealerSales" RENAME COLUMN "saleNumber" TO "sale_number";
ALTER TABLE "dealerSales" RENAME COLUMN "paymentMethod" TO "payment_method";
ALTER TABLE "dealerSales" RENAME COLUMN "isPaid" TO "is_paid";
ALTER TABLE "dealerSales" RENAME COLUMN "paidAmount" TO "paid_amount";
ALTER TABLE "dealerSales" RENAME COLUMN "paidAt" TO "paid_at";
ALTER TABLE "dealerSales" RENAME COLUMN "isSaved" TO "is_saved";
ALTER TABLE "dealerSales" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "dealerSales" RENAME COLUMN "updatedAt" TO "updated_at";

-- DealerSaleItems table
ALTER TABLE "dealerSaleItems" RENAME COLUMN "saleId" TO "sale_id";
ALTER TABLE "dealerSaleItems" RENAME COLUMN "productId" TO "product_id";
ALTER TABLE "dealerSaleItems" RENAME COLUMN "createdAt" TO "created_at";

-- Cart table
ALTER TABLE cart RENAME COLUMN "sessionId" TO "session_id";
ALTER TABLE cart RENAME COLUMN "productId" TO "product_id";
ALTER TABLE cart RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE cart RENAME COLUMN "updatedAt" TO "updated_at";

-- CompanySettings table
ALTER TABLE "companySettings" RENAME COLUMN "companyName" TO "company_name";
ALTER TABLE "companySettings" RENAME COLUMN "postalCode" TO "postal_code";
ALTER TABLE "companySettings" RENAME COLUMN "taxNumber" TO "tax_number";
ALTER TABLE "companySettings" RENAME COLUMN "tpsNumber" TO "tps_number";
ALTER TABLE "companySettings" RENAME COLUMN "tvqNumber" TO "tvq_number";
ALTER TABLE "companySettings" RENAME COLUMN "instagramUrl" TO "instagram_url";
ALTER TABLE "companySettings" RENAME COLUMN "facebookUrl" TO "facebook_url";
ALTER TABLE "companySettings" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "companySettings" RENAME COLUMN "updatedAt" TO "updated_at";

-- Admins table
ALTER TABLE admins RENAME COLUMN "fullName" TO "full_name";
ALTER TABLE admins RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE admins RENAME COLUMN "updatedAt" TO "updated_at";

-- Notifications table
ALTER TABLE notifications RENAME COLUMN "orderId" TO "order_id";
ALTER TABLE notifications RENAME COLUMN "isRead" TO "is_read";
ALTER TABLE notifications RENAME COLUMN "createdAt" TO "created_at";

-- Orders table
ALTER TABLE orders RENAME COLUMN "orderNumber" TO "order_number";
ALTER TABLE orders RENAME COLUMN "userId" TO "user_id";
ALTER TABLE orders RENAME COLUMN "shippingName" TO "shipping_name";
ALTER TABLE orders RENAME COLUMN "shippingPhone" TO "shipping_phone";
ALTER TABLE orders RENAME COLUMN "shippingEmail" TO "shipping_email";
ALTER TABLE orders RENAME COLUMN "shippingAddress" TO "shipping_address";
ALTER TABLE orders RENAME COLUMN "shippingProvince" TO "shipping_province";
ALTER TABLE orders RENAME COLUMN "shippingCity" TO "shipping_city";
ALTER TABLE orders RENAME COLUMN "shippingPostalCode" TO "shipping_postal_code";
ALTER TABLE orders RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE orders RENAME COLUMN "updatedAt" TO "updated_at";

-- OrderItems table
ALTER TABLE order_items RENAME COLUMN "orderId" TO "order_id";
ALTER TABLE order_items RENAME COLUMN "productId" TO "product_id";
ALTER TABLE order_items RENAME COLUMN "createdAt" TO "created_at";

COMMIT;
