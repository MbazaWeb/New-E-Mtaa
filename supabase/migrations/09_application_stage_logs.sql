-- 09_application_stage_logs.sql
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
