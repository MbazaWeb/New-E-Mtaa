-- 18_triggers_functions.sql
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
