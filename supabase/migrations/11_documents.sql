-- 11_documents.sql
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
