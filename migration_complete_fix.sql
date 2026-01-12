-- TÜM TABLOLAR İÇİN EKSİKSİZ MİGRATION SCRIPT
-- Supabase Dashboard > SQL Editor'dan çalıştırın
-- Bu script TÜM tablolardaki TÜM camelCase kolonları snake_case'e çevirir

BEGIN;

-- ============================================
-- CATEGORIES TABLE
-- ============================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'isActive') THEN
        ALTER TABLE categories RENAME COLUMN "isActive" TO "is_active";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'createdAt') THEN
        ALTER TABLE categories RENAME COLUMN "createdAt" TO "created_at";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'updatedAt') THEN
        ALTER TABLE categories RENAME COLUMN "updatedAt" TO "updated_at";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'order') THEN
        ALTER TABLE categories RENAME COLUMN "order" TO "sort_order";
    END IF;
END $$;

-- ============================================
-- PRODUCTS TABLE (KRİTİK!)
-- ============================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'baseName') THEN
        ALTER TABLE products RENAME COLUMN "baseName" TO "base_name";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'shortDescription') THEN
        ALTER TABLE products RENAME COLUMN "shortDescription" TO "short_description";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'comparePrice') THEN
        ALTER TABLE products RENAME COLUMN "comparePrice" TO "compare_price";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'costPrice') THEN
        ALTER TABLE products RENAME COLUMN "costPrice" TO "cost_price";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'trackStock') THEN
        ALTER TABLE products RENAME COLUMN "trackStock" TO "track_stock";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'productGroup') THEN
        ALTER TABLE products RENAME COLUMN "productGroup" TO "product_group";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'isActive') THEN
        ALTER TABLE products RENAME COLUMN "isActive" TO "is_active";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'isFeatured') THEN
        ALTER TABLE products RENAME COLUMN "isFeatured" TO "is_featured";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'categoryId') THEN
        ALTER TABLE products RENAME COLUMN "categoryId" TO "category_id";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'metaTitle') THEN
        ALTER TABLE products RENAME COLUMN "metaTitle" TO "meta_title";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'metaDescription') THEN
        ALTER TABLE products RENAME COLUMN "metaDescription" TO "meta_description";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'createdAt') THEN
        ALTER TABLE products RENAME COLUMN "createdAt" TO "created_at";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'updatedAt') THEN
        ALTER TABLE products RENAME COLUMN "updatedAt" TO "updated_at";
    END IF;
END $$;

-- ============================================
-- CART TABLE (KRİTİK!)
-- ============================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cart' AND column_name = 'sessionId') THEN
        ALTER TABLE cart RENAME COLUMN "sessionId" TO "session_id";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cart' AND column_name = 'productId') THEN
        ALTER TABLE cart RENAME COLUMN "productId" TO "product_id";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cart' AND column_name = 'createdAt') THEN
        ALTER TABLE cart RENAME COLUMN "createdAt" TO "created_at";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cart' AND column_name = 'updatedAt') THEN
        ALTER TABLE cart RENAME COLUMN "updatedAt" TO "updated_at";
    END IF;
END $$;

-- ============================================
-- DEALERS TABLE
-- ============================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealers' AND column_name = 'companyName') THEN
        ALTER TABLE dealers RENAME COLUMN "companyName" TO "company_name";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealers' AND column_name = 'taxNumber') THEN
        ALTER TABLE dealers RENAME COLUMN "taxNumber" TO "tax_number";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealers' AND column_name = 'tpsNumber') THEN
        ALTER TABLE dealers RENAME COLUMN "tpsNumber" TO "tps_number";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealers' AND column_name = 'tvqNumber') THEN
        ALTER TABLE dealers RENAME COLUMN "tvqNumber" TO "tvq_number";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealers' AND column_name = 'isActive') THEN
        ALTER TABLE dealers RENAME COLUMN "isActive" TO "is_active";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealers' AND column_name = 'createdAt') THEN
        ALTER TABLE dealers RENAME COLUMN "createdAt" TO "created_at";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealers' AND column_name = 'updatedAt') THEN
        ALTER TABLE dealers RENAME COLUMN "updatedAt" TO "updated_at";
    END IF;
END $$;

-- ============================================
-- DEALER_SALES TABLE
-- ============================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealer_sales' AND column_name = 'dealerId') THEN
        ALTER TABLE dealer_sales RENAME COLUMN "dealerId" TO "dealer_id";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealer_sales' AND column_name = 'saleNumber') THEN
        ALTER TABLE dealer_sales RENAME COLUMN "saleNumber" TO "sale_number";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealer_sales' AND column_name = 'paymentMethod') THEN
        ALTER TABLE dealer_sales RENAME COLUMN "paymentMethod" TO "payment_method";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealer_sales' AND column_name = 'isPaid') THEN
        ALTER TABLE dealer_sales RENAME COLUMN "isPaid" TO "is_paid";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealer_sales' AND column_name = 'paidAmount') THEN
        ALTER TABLE dealer_sales RENAME COLUMN "paidAmount" TO "paid_amount";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealer_sales' AND column_name = 'paidAt') THEN
        ALTER TABLE dealer_sales RENAME COLUMN "paidAt" TO "paid_at";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealer_sales' AND column_name = 'isSaved') THEN
        ALTER TABLE dealer_sales RENAME COLUMN "isSaved" TO "is_saved";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealer_sales' AND column_name = 'createdAt') THEN
        ALTER TABLE dealer_sales RENAME COLUMN "createdAt" TO "created_at";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealer_sales' AND column_name = 'updatedAt') THEN
        ALTER TABLE dealer_sales RENAME COLUMN "updatedAt" TO "updated_at";
    END IF;
END $$;

-- Eğer hala eski tablo adı varsa (dealerSales)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dealerSales') THEN
        -- Önce kolonları değiştir
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealerSales' AND column_name = 'dealerId') THEN
            ALTER TABLE "dealerSales" RENAME COLUMN "dealerId" TO "dealer_id";
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealerSales' AND column_name = 'saleNumber') THEN
            ALTER TABLE "dealerSales" RENAME COLUMN "saleNumber" TO "sale_number";
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealerSales' AND column_name = 'paymentMethod') THEN
            ALTER TABLE "dealerSales" RENAME COLUMN "paymentMethod" TO "payment_method";
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealerSales' AND column_name = 'isPaid') THEN
            ALTER TABLE "dealerSales" RENAME COLUMN "isPaid" TO "is_paid";
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealerSales' AND column_name = 'paidAmount') THEN
            ALTER TABLE "dealerSales" RENAME COLUMN "paidAmount" TO "paid_amount";
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealerSales' AND column_name = 'paidAt') THEN
            ALTER TABLE "dealerSales" RENAME COLUMN "paidAt" TO "paid_at";
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealerSales' AND column_name = 'isSaved') THEN
            ALTER TABLE "dealerSales" RENAME COLUMN "isSaved" TO "is_saved";
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealerSales' AND column_name = 'createdAt') THEN
            ALTER TABLE "dealerSales" RENAME COLUMN "createdAt" TO "created_at";
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealerSales' AND column_name = 'updatedAt') THEN
            ALTER TABLE "dealerSales" RENAME COLUMN "updatedAt" TO "updated_at";
        END IF;
    END IF;
END $$;

-- ============================================
-- DEALER_SALE_ITEMS TABLE
-- ============================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealer_sale_items' AND column_name = 'saleId') THEN
        ALTER TABLE dealer_sale_items RENAME COLUMN "saleId" TO "sale_id";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealer_sale_items' AND column_name = 'productId') THEN
        ALTER TABLE dealer_sale_items RENAME COLUMN "productId" TO "product_id";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealer_sale_items' AND column_name = 'createdAt') THEN
        ALTER TABLE dealer_sale_items RENAME COLUMN "createdAt" TO "created_at";
    END IF;
END $$;

-- Eğer hala eski tablo adı varsa (dealerSaleItems)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dealerSaleItems') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealerSaleItems' AND column_name = 'saleId') THEN
            ALTER TABLE "dealerSaleItems" RENAME COLUMN "saleId" TO "sale_id";
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealerSaleItems' AND column_name = 'productId') THEN
            ALTER TABLE "dealerSaleItems" RENAME COLUMN "productId" TO "product_id";
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealerSaleItems' AND column_name = 'createdAt') THEN
            ALTER TABLE "dealerSaleItems" RENAME COLUMN "createdAt" TO "created_at";
        END IF;
    END IF;
END $$;

-- ============================================
-- COMPANY_SETTINGS TABLE
-- ============================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'companyName') THEN
        ALTER TABLE company_settings RENAME COLUMN "companyName" TO "company_name";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'postalCode') THEN
        ALTER TABLE company_settings RENAME COLUMN "postalCode" TO "postal_code";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'taxNumber') THEN
        ALTER TABLE company_settings RENAME COLUMN "taxNumber" TO "tax_number";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'tpsNumber') THEN
        ALTER TABLE company_settings RENAME COLUMN "tpsNumber" TO "tps_number";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'tvqNumber') THEN
        ALTER TABLE company_settings RENAME COLUMN "tvqNumber" TO "tvq_number";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'instagramUrl') THEN
        ALTER TABLE company_settings RENAME COLUMN "instagramUrl" TO "instagram_url";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'facebookUrl') THEN
        ALTER TABLE company_settings RENAME COLUMN "facebookUrl" TO "facebook_url";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'createdAt') THEN
        ALTER TABLE company_settings RENAME COLUMN "createdAt" TO "created_at";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'updatedAt') THEN
        ALTER TABLE company_settings RENAME COLUMN "updatedAt" TO "updated_at";
    END IF;
END $$;

-- Eğer hala eski tablo adı varsa (companySettings)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companySettings') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companySettings' AND column_name = 'companyName') THEN
            ALTER TABLE "companySettings" RENAME COLUMN "companyName" TO "company_name";
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companySettings' AND column_name = 'postalCode') THEN
            ALTER TABLE "companySettings" RENAME COLUMN "postalCode" TO "postal_code";
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companySettings' AND column_name = 'taxNumber') THEN
            ALTER TABLE "companySettings" RENAME COLUMN "taxNumber" TO "tax_number";
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companySettings' AND column_name = 'tpsNumber') THEN
            ALTER TABLE "companySettings" RENAME COLUMN "tpsNumber" TO "tps_number";
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companySettings' AND column_name = 'tvqNumber') THEN
            ALTER TABLE "companySettings" RENAME COLUMN "tvqNumber" TO "tvq_number";
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companySettings' AND column_name = 'instagramUrl') THEN
            ALTER TABLE "companySettings" RENAME COLUMN "instagramUrl" TO "instagram_url";
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companySettings' AND column_name = 'facebookUrl') THEN
            ALTER TABLE "companySettings" RENAME COLUMN "facebookUrl" TO "facebook_url";
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companySettings' AND column_name = 'createdAt') THEN
            ALTER TABLE "companySettings" RENAME COLUMN "createdAt" TO "created_at";
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companySettings' AND column_name = 'updatedAt') THEN
            ALTER TABLE "companySettings" RENAME COLUMN "updatedAt" TO "updated_at";
        END IF;
    END IF;
END $$;

-- ============================================
-- ADMINS TABLE
-- ============================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admins' AND column_name = 'fullName') THEN
        ALTER TABLE admins RENAME COLUMN "fullName" TO "full_name";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admins' AND column_name = 'createdAt') THEN
        ALTER TABLE admins RENAME COLUMN "createdAt" TO "created_at";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admins' AND column_name = 'updatedAt') THEN
        ALTER TABLE admins RENAME COLUMN "updatedAt" TO "updated_at";
    END IF;
END $$;

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'orderId') THEN
        ALTER TABLE notifications RENAME COLUMN "orderId" TO "order_id";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'isRead') THEN
        ALTER TABLE notifications RENAME COLUMN "isRead" TO "is_read";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'createdAt') THEN
        ALTER TABLE notifications RENAME COLUMN "createdAt" TO "created_at";
    END IF;
END $$;

-- ============================================
-- ORDERS TABLE
-- ============================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'orderNumber') THEN
        ALTER TABLE orders RENAME COLUMN "orderNumber" TO "order_number";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'userId') THEN
        ALTER TABLE orders RENAME COLUMN "userId" TO "user_id";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shippingName') THEN
        ALTER TABLE orders RENAME COLUMN "shippingName" TO "shipping_name";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shippingPhone') THEN
        ALTER TABLE orders RENAME COLUMN "shippingPhone" TO "shipping_phone";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shippingEmail') THEN
        ALTER TABLE orders RENAME COLUMN "shippingEmail" TO "shipping_email";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shippingAddress') THEN
        ALTER TABLE orders RENAME COLUMN "shippingAddress" TO "shipping_address";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shippingProvince') THEN
        ALTER TABLE orders RENAME COLUMN "shippingProvince" TO "shipping_province";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shippingCity') THEN
        ALTER TABLE orders RENAME COLUMN "shippingCity" TO "shipping_city";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shippingPostalCode') THEN
        ALTER TABLE orders RENAME COLUMN "shippingPostalCode" TO "shipping_postal_code";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'createdAt') THEN
        ALTER TABLE orders RENAME COLUMN "createdAt" TO "created_at";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'updatedAt') THEN
        ALTER TABLE orders RENAME COLUMN "updatedAt" TO "updated_at";
    END IF;
END $$;

-- ============================================
-- ORDER_ITEMS TABLE
-- ============================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'orderId') THEN
        ALTER TABLE order_items RENAME COLUMN "orderId" TO "order_id";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'productId') THEN
        ALTER TABLE order_items RENAME COLUMN "productId" TO "product_id";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'createdAt') THEN
        ALTER TABLE order_items RENAME COLUMN "createdAt" TO "created_at";
    END IF;
END $$;

COMMIT;

-- ============================================
-- SONUÇ KONTROLÜ
-- ============================================
-- Tüm tablolardaki kolon isimlerini kontrol edin
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND (
        column_name LIKE '%Id' OR 
        column_name LIKE '%At' OR 
        column_name IN ('isActive', 'is_active', 'isFeatured', 'is_featured', 'isPaid', 'is_paid', 'isSaved', 'is_saved', 'isRead', 'is_read', 'order', 'sort_order')
    )
ORDER BY table_name, column_name;
