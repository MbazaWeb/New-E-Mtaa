-- 06_service_workflow_stages.sql
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
