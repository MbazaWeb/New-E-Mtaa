-- 12_payments.sql
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
