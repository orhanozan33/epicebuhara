-- Add base_name_fr and base_name_en columns to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS base_name_fr VARCHAR(255),
ADD COLUMN IF NOT EXISTS base_name_en VARCHAR(255);
