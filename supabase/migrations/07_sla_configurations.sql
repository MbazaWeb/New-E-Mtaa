-- 07_sla_configurations.sql
CREATE TABLE IF NOT EXISTS sla_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES service_catalog(id) ON DELETE CASCADE,
  target_value INTEGER NOT NULL,
  target_unit VARCHAR(20) NOT NULL,
  warning_threshold INTEGER DEFAULT 75,
  pause_on_citizen_request BOOLEAN DEFAULT true,
  pause_on_external_input BOOLEAN DEFAULT true,
  auto_escalate_on_breach BOOLEAN DEFAULT false,
  notify_supervisor_on_breach BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
