-- 08_applications.sql
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number VARCHAR(50) UNIQUE NOT NULL,
  citizen_id UUID NOT NULL REFERENCES profiles(id),
  service_id UUID NOT NULL REFERENCES service_catalog(id),
  current_stage_id UUID REFERENCES service_workflow_stages(id),
  current_office_id UUID REFERENCES office_registry(id),
  status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  form_data JSONB NOT NULL DEFAULT '{}',
  uploaded_documents JSONB DEFAULT '[]',
  checklist_completed BOOLEAN DEFAULT false,
  sla_target TIMESTAMPTZ,
  sla_paused_until TIMESTAMPTZ,
  sla_status VARCHAR(20) DEFAULT 'PENDING',
  fee_amount DECIMAL(10,2) DEFAULT 0,
  fee_waived BOOLEAN DEFAULT false,
  fee_waiver_reason TEXT,
  citizen_type VARCHAR(20) DEFAULT 'local',
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_citizen ON applications(citizen_id);
CREATE INDEX IF NOT EXISTS idx_applications_service ON applications(service_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_office ON applications(current_office_id);
CREATE INDEX IF NOT EXISTS idx_applications_sla ON applications(sla_target, sla_status);
CREATE INDEX IF NOT EXISTS idx_applications_reference ON applications(reference_number);
