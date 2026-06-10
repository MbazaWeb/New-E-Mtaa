-- 16_system_tables.sql
CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(200) PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  actor_role VARCHAR(50),
  action VARCHAR(200),
  target_table VARCHAR(200),
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
