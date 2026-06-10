-- 03_profiles.sql
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
