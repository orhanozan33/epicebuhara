-- MİGRATION SONRASI KONTROL SCRIPT'İ
-- Supabase Dashboard > SQL Editor'dan çalıştırın
-- Bu script migration'ın başarılı olup olmadığını kontrol eder

-- Tüm tablolardaki kritik kolonları kontrol et
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('categories', 'products', 'cart', 'company_settings', 'dealers', 'dealer_sales', 'dealer_sale_items', 'admins', 'notifications', 'orders', 'order_items')
    AND (
        -- camelCase kolonlar (HALA VARSA SORUN VAR!)
        column_name LIKE '%Id' OR 
        column_name LIKE '%At' OR 
        column_name IN ('isActive', 'isFeatured', 'isPaid', 'isSaved', 'isRead', 'order', 'companyName', 'postalCode', 'taxNumber', 'tpsNumber', 'tvqNumber', 'instagramUrl', 'facebookUrl', 'fullName', 'orderNumber', 'userId', 'shippingName', 'shippingPhone', 'shippingEmail', 'shippingAddress', 'shippingProvince', 'shippingCity', 'shippingPostalCode', 'baseName', 'shortDescription', 'comparePrice', 'costPrice', 'trackStock', 'productGroup', 'categoryId', 'metaTitle', 'metaDescription', 'sessionId', 'productId', 'saleId', 'dealerId', 'saleNumber', 'paymentMethod', 'paidAmount', 'paidAt')
    )
ORDER BY table_name, column_name;

-- Eğer yukarıdaki sorgu sonuç döndürürse, migration tamamlanmamış demektir!
-- Eğer sonuç döndürmezse, migration başarılı demektir!

-- Şimdi snake_case kolonları kontrol et (BUNLAR OLMALI)
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('categories', 'products', 'cart', 'company_settings', 'dealers', 'dealer_sales', 'dealer_sale_items', 'admins', 'notifications', 'orders', 'order_items')
    AND (
        -- snake_case kolonlar (BUNLAR OLMALI)
        column_name LIKE '%_id' OR 
        column_name LIKE '%_at' OR 
        column_name IN ('is_active', 'is_featured', 'is_paid', 'is_saved', 'is_read', 'sort_order', 'company_name', 'postal_code', 'tax_number', 'tps_number', 'tvq_number', 'instagram_url', 'facebook_url', 'full_name', 'order_number', 'user_id', 'shipping_name', 'shipping_phone', 'shipping_email', 'shipping_address', 'shipping_province', 'shipping_city', 'shipping_postal_code', 'base_name', 'short_description', 'compare_price', 'cost_price', 'track_stock', 'product_group', 'category_id', 'meta_title', 'meta_description', 'session_id', 'product_id', 'sale_id', 'dealer_id', 'sale_number', 'payment_method', 'paid_amount', 'paid_at')
    )
ORDER BY table_name, column_name;

-- company_settings tablosu özel kontrol
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'company_settings'
ORDER BY ordinal_position;
