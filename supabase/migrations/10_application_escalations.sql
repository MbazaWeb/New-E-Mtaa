-- 10_application_escalations.sql
CREATE TABLE IF NOT EXISTS application_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id),
  from_office_id UUID REFERENCES office_registry(id),
  to_office_id UUID REFERENCES office_registry(id),
  reason TEXT,
  escalated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
