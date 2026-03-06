-- Migration 005: Add individual address columns to clients
-- Previously only business_address (composite text). Now split into street, city, state, zip.

ALTER TABLE clients ADD COLUMN IF NOT EXISTS street VARCHAR(255) DEFAULT NULL;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT NULL;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS state VARCHAR(50) DEFAULT NULL;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS zip VARCHAR(20) DEFAULT NULL;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS date_of_birth DATE DEFAULT NULL;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT FALSE;

-- Backfill: try to split existing business_address into parts
-- Format assumed: "street, city, state zip" or "street, city, state, zip"
UPDATE clients
SET street = TRIM(SUBSTRING_INDEX(business_address, ',', 1)),
    city = TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(business_address, ',', 2), ',', -1)),
    state = TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(business_address, ',', 3), ',', -1)),
    zip = TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(business_address, ',', 4), ',', -1))
WHERE business_address IS NOT NULL AND business_address != '';
