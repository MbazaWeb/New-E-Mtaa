-- 02_office_registry.sql
CREATE TABLE IF NOT EXISTS office_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id VARCHAR(100) UNIQUE NOT NULL,
  office_code VARCHAR(20) UNIQUE NOT NULL,
  office_type VARCHAR(30) NOT NULL,
  region_id UUID REFERENCES regions(id),
  district_id UUID REFERENCES districts(id),
  ward_id UUID REFERENCES wards(id),
  mtaa_id UUID REFERENCES mtaas(id),
  department_category VARCHAR(50),
  department_scope VARCHAR(30),
  parent_office_id UUID REFERENCES office_registry(id),
  office_name VARCHAR(200) NOT NULL,
  office_name_sw VARCHAR(200) NOT NULL,
  physical_address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  status VARCHAR(20) DEFAULT 'ACTIVE',
  street_mappings TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_office_registry_type ON office_registry(office_type);
CREATE INDEX IF NOT EXISTS idx_office_registry_parent ON office_registry(parent_office_id);
CREATE INDEX IF NOT EXISTS idx_office_registry_location ON office_registry(region_id, district_id, ward_id, mtaa_id);
