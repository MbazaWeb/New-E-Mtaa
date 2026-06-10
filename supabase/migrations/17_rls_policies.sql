-- 17_rls_policies.sql
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
