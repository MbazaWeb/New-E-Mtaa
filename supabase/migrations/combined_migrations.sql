-- Combined migrations 01-19 for Supabase SQL editor
-- Run everything below in order. Review first, then execute.

-- ===== 01_location_tables.sql =====
-- Placeholder for regions, districts, wards, mtaas tables
CREATE TABLE IF NOT EXISTS regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id UUID REFERENCES regions(id),
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID REFERENCES districts(id),
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mtaas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ward_id UUID REFERENCES wards(id),
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== 02_office_registry.sql =====
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

-- ===== 03_profiles.sql =====
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE,
  first_name VARCHAR(100),
  middle_name VARCHAR(100),
  last_name VARCHAR(100),
  date_of_birth DATE,
  phone_number VARCHAR(30),
  international_phone VARCHAR(30),
  email VARCHAR(255),
  passport_number VARCHAR(50),
  assigned_office_id UUID REFERENCES office_registry(id),
  identity_verified BOOLEAN DEFAULT false,
  passport_verified BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  user_type VARCHAR(20) DEFAULT 'local',
  diaspora BOOLEAN DEFAULT false,
  country_of_residence VARCHAR(100),
  city_of_residence VARCHAR(100),
  profile_completion_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_assigned_office ON profiles(assigned_office_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_diaspora ON profiles(diaspora);

-- ===== 04_citizen_verifications.sql =====
CREATE TABLE IF NOT EXISTS citizen_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id),
  method VARCHAR(50),
  metadata JSONB,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== 05_service_catalog.sql =====
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

-- ===== 06_service_workflow_stages.sql =====
CREATE TABLE IF NOT EXISTS service_workflow_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES service_catalog(id) ON DELETE CASCADE,
  stage_order INTEGER NOT NULL,
  stage_name VARCHAR(200) NOT NULL,
  stage_name_sw VARCHAR(200) NOT NULL,
  responsible_office_type VARCHAR(30) NOT NULL,
  department_category VARCHAR(50),
  mandatory_actions JSONB DEFAULT '[]',
  available_actions JSONB DEFAULT '[]',
  auto_advance BOOLEAN DEFAULT false,
  stage_sla_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(service_id, stage_order)
);

-- ===== 07_sla_configurations.sql =====
CREATE TABLE IF NOT EXISTS sla_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES service_catalog(id) ON DELETE CASCADE,
  target_value INTEGER NOT NULL,
  target_unit VARCHAR(20) NOT NULL,
  warning_threshold INTEGER DEFAULT 75,
  pause_on_citizen_request BOOLEAN DEFAULT true,
  pause_on_external_input BOOLEAN DEFAULT true,
  auto_escalate_on_breach BOOLEAN DEFAULT false,
  notify_supervisor_on_breach BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== 08_applications.sql =====
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number VARCHAR(50) UNIQUE NOT NULL,
  citizen_id UUID NOT NULL REFERENCES profiles(id),
  service_id UUID NOT NULL REFERENCES service_catalog(id),
  current_stage_id UUID REFERENCES service_workflow_stages(id),
  current_office_id UUID REFERENCES office_registry(id),
  status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  form_data JSONB NOT NULL DEFAULT '{}',
  uploaded_documents JSONB DEFAULT '[]',
  checklist_completed BOOLEAN DEFAULT false,
  sla_target TIMESTAMPTZ,
  sla_paused_until TIMESTAMPTZ,
  sla_status VARCHAR(20) DEFAULT 'PENDING',
  fee_amount DECIMAL(10,2) DEFAULT 0,
  fee_waived BOOLEAN DEFAULT false,
  fee_waiver_reason TEXT,
  citizen_type VARCHAR(20) DEFAULT 'local',
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_citizen ON applications(citizen_id);
CREATE INDEX IF NOT EXISTS idx_applications_service ON applications(service_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_office ON applications(current_office_id);
CREATE INDEX IF NOT EXISTS idx_applications_sla ON applications(sla_target, sla_status);
CREATE INDEX IF NOT EXISTS idx_applications_reference ON applications(reference_number);

-- ===== 09_application_stage_logs.sql =====
CREATE TABLE IF NOT EXISTS application_stage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id),
  from_stage_id UUID REFERENCES service_workflow_stages(id),
  to_stage_id UUID REFERENCES service_workflow_stages(id),
  changed_by UUID REFERENCES profiles(id),
  comment TEXT,
  action_taken JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== 10_application_escalations.sql =====
CREATE TABLE IF NOT EXISTS application_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id),
  from_office_id UUID REFERENCES office_registry(id),
  to_office_id UUID REFERENCES office_registry(id),
  reason TEXT,
  escalated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== 11_documents.sql =====
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_uuid UUID DEFAULT gen_random_uuid(),
  reference_number VARCHAR(50) UNIQUE NOT NULL,
  application_id UUID REFERENCES applications(id),
  citizen_id UUID NOT NULL REFERENCES profiles(id),
  document_type VARCHAR(50) NOT NULL,
  document_data JSONB,
  file_url TEXT NOT NULL,
  file_hash VARCHAR(64),
  qr_code_data TEXT,
  digital_signature TEXT,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  issue_date TIMESTAMPTZ DEFAULT NOW(),
  expiry_date TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES profiles(id),
  revocation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_qr_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id),
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  scanner_ip INET,
  scanner_user_agent TEXT,
  scan_result VARCHAR(20),
  scan_location JSONB
);

CREATE INDEX IF NOT EXISTS idx_documents_citizen ON documents(citizen_id);
CREATE INDEX IF NOT EXISTS idx_documents_reference ON documents(reference_number);
CREATE INDEX IF NOT EXISTS idx_documents_qr ON documents(qr_code_data);

-- ===== 12_payments.sql =====
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number VARCHAR(50) UNIQUE NOT NULL,
  application_id UUID REFERENCES applications(id),
  citizen_id UUID REFERENCES profiles(id),
  amount DECIMAL(10,2) NOT NULL,
  provider VARCHAR(50),
  provider_reference VARCHAR(200),
  status VARCHAR(30) DEFAULT 'PENDING',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== 13_complaints.sql =====
CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number VARCHAR(50) UNIQUE NOT NULL,
  citizen_id UUID REFERENCES profiles(id),
  subject VARCHAR(255),
  body TEXT,
  status VARCHAR(30) DEFAULT 'OPEN',
  assigned_office_id UUID REFERENCES office_registry(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== 14_staff_roles.sql =====
CREATE TABLE IF NOT EXISTS staff_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== 15_staff_accounts.sql =====
CREATE TABLE IF NOT EXISTS staff_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE,
  office_id UUID REFERENCES office_registry(id),
  role_id UUID REFERENCES staff_roles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== 16_system_tables.sql =====
CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(200) PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  actor_role VARCHAR(50),
  action VARCHAR(200),
  target_table VARCHAR(200),
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== 17_rls_policies.sql =====
-- Enable RLS and add example policies (adjust to actual auth implementation)
-- Note: Run AFTER tables exist and when using Supabase/Postgres with auth.uid()

ALTER TABLE IF EXISTS office_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS documents ENABLE ROW LEVEL SECURITY;

-- Citizen: View own profile only
-- CREATE POLICY profiles_citizen_select ON profiles
--   FOR SELECT USING (auth.uid() = user_id);

-- Citizen: View own applications
-- CREATE POLICY applications_citizen_select ON applications
--   FOR SELECT USING (auth.uid() = citizen_id);

-- Admin policy placeholder
-- CREATE POLICY applications_admin_all ON applications
--   FOR ALL USING (auth.role() = 'admin');

-- ===== 18_triggers_functions.sql =====
-- Functions and triggers for automations
CREATE OR REPLACE FUNCTION generate_application_reference()
RETURNS TRIGGER AS $$
DECLARE
  service_code_val VARCHAR(10);
  seq_num INTEGER;
BEGIN
  SELECT service_code INTO service_code_val FROM service_catalog WHERE id = NEW.service_id;
  SELECT COALESCE(MAX(CAST(SPLIT_PART(reference_number, '-', 4) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM applications
  WHERE reference_number LIKE 'APP-' || service_code_val || '-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-%';
  NEW.reference_number := 'APP-' || service_code_val || '-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(seq_num::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if present (Postgres does not support IF NOT EXISTS on CREATE TRIGGER)
DROP TRIGGER IF EXISTS trigger_generate_application_reference ON applications;

CREATE TRIGGER trigger_generate_application_reference
  BEFORE INSERT ON applications
  FOR EACH ROW
  WHEN (NEW.reference_number IS NULL)
  EXECUTE FUNCTION generate_application_reference();

CREATE OR REPLACE FUNCTION calculate_profile_completion(profile_id UUID)
RETURNS INTEGER AS $$
DECLARE
  completion INTEGER := 0;
  profile_record RECORD;
BEGIN
  SELECT * INTO profile_record FROM profiles WHERE user_id = profile_id;
  IF profile_record.phone_number IS NOT NULL OR profile_record.email IS NOT NULL THEN completion := completion + 30; END IF;
  IF profile_record.date_of_birth IS NOT NULL AND profile_record.gender IS NOT NULL THEN completion := completion + 30; END IF;
  IF profile_record.ward_id IS NOT NULL AND profile_record.street IS NOT NULL THEN completion := completion + 25; END IF;
  IF profile_record.identity_verified THEN completion := completion + 15; END IF;
  RETURN completion;
END;
$$ LANGUAGE plpgsql;

-- ===== 19_seed_data.sql =====
-- Default seed data: 9 core services
INSERT INTO service_catalog (service_code, service_name, service_name_sw, category, form_fields, fee_amount)
VALUES
('RES-LETTER', 'Certificate of Residency', 'Cheti cha Makazi', 'CITIZEN_DOCUMENTS', '[]', 0),
('BURIAL-PERMIT', 'Burial Permit', 'Ruhusa ya Kuzika', 'CITIZEN_DOCUMENTS', '[]', 5000),
('EVENT-PERMIT', 'Event Permit', 'Ruhusa ya Tukio', 'CITIZEN_DOCUMENTS', '[]', 10000),
('CONST-PERMIT', 'Minor Construction Permit', 'Ruhusa ya Ujenzi Mdogo', 'PROPERTY_SERVICES', '[]', 25000),
('INTRO-LETTER', 'Introduction Letter', 'Barua ya Utangulizi', 'CITIZEN_DOCUMENTS', '[]', 0),
('SALES-AGREE', 'Sales Agreement', 'Mkataba wa Mauzo', 'BUSINESS_SERVICES', '[]', 15000),
('RENTAL-AGREE', 'Rental Agreement', 'Mkataba wa Kukodisha', 'BUSINESS_SERVICES', '[]', 10000),
('DISPUTE-RES', 'Dispute Resolution', 'Utatuzi wa Migogoro', 'COMPLAINTS', '[]', 0),
('PAYMENT-REC', 'Payments & Contributions', 'Malipo na Michango', 'COMMUNITY_SERVICES', '[]', 0)
ON CONFLICT (service_code) DO NOTHING;
