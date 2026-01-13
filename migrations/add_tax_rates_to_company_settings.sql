-- Migration: Add tps_rate and tvq_rate columns to company_settings table
-- Date: 2026-01-12
-- Description: Adds tax rate columns (TPS %5.00 and TVQ %9.975) to company_settings table

-- Add tps_rate column
ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS tps_rate NUMERIC(5,2) DEFAULT 5.00;

-- Add tvq_rate column
ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS tvq_rate NUMERIC(6,3) DEFAULT 9.975;

-- Update existing records with default values (if needed)
UPDATE company_settings 
SET 
  tps_rate = 5.00,
  tvq_rate = 9.975
WHERE tps_rate IS NULL OR tvq_rate IS NULL;
