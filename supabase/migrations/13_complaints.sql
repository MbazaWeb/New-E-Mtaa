-- 13_complaints.sql
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
