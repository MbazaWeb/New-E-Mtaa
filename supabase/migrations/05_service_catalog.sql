-- 05_service_catalog.sql
CREATE TABLE IF NOT EXISTS service_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_code VARCHAR(50) UNIQUE NOT NULL,
  service_name VARCHAR(200) NOT NULL,
  service_name_sw VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL,
  form_fields JSONB DEFAULT '[]',
  required_documents JSONB DEFAULT '[]',
  prerequisite_services JSONB DEFAULT '[]',
  min_profile_completion INTEGER DEFAULT 30,
  identity_verification_required BOOLEAN DEFAULT false,
  is_free BOOLEAN DEFAULT true,
  fee_amount DECIMAL(10,2) DEFAULT 0,
  allow_appeal BOOLEAN DEFAULT true,
  cooling_off_hours INTEGER DEFAULT 24,
  available_to_diaspora BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
