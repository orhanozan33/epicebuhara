-- Firma adı alt satırı (faturada görünsün)
ALTER TABLE company_settings
ADD COLUMN IF NOT EXISTS company_name_line2 VARCHAR(255);

COMMENT ON COLUMN company_settings.company_name_line2 IS 'Firma adının altında faturada görünen satır (örn. 9542-2838 QC. inc)';
