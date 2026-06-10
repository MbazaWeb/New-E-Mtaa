-- 04_citizen_verifications.sql
CREATE TABLE IF NOT EXISTS citizen_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id),
  method VARCHAR(50),
  metadata JSONB,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
