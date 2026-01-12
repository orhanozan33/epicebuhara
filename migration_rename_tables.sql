-- Tablo isimlerini camelCase'den snake_case'e çevir
-- Supabase Dashboard > SQL Editor'dan çalıştırın

BEGIN;

-- companySettings -> company_settings
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companySettings') THEN
        ALTER TABLE "companySettings" RENAME TO "company_settings";
        RAISE NOTICE 'Tablo companySettings -> company_settings olarak değiştirildi';
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'company_settings') THEN
        RAISE NOTICE 'Tablo company_settings zaten mevcut';
    END IF;
END $$;

-- dealerSales -> dealer_sales
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dealerSales') THEN
        ALTER TABLE "dealerSales" RENAME TO "dealer_sales";
        RAISE NOTICE 'Tablo dealerSales -> dealer_sales olarak değiştirildi';
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dealer_sales') THEN
        RAISE NOTICE 'Tablo dealer_sales zaten mevcut';
    END IF;
END $$;

-- dealerSaleItems -> dealer_sale_items
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dealerSaleItems') THEN
        ALTER TABLE "dealerSaleItems" RENAME TO "dealer_sale_items";
        RAISE NOTICE 'Tablo dealerSaleItems -> dealer_sale_items olarak değiştirildi';
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dealer_sale_items') THEN
        RAISE NOTICE 'Tablo dealer_sale_items zaten mevcut';
    END IF;
END $$;

COMMIT;

-- Sonuç kontrolü
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('company_settings', 'dealer_sales', 'dealer_sale_items', 'companySettings', 'dealerSales', 'dealerSaleItems')
ORDER BY table_name;
