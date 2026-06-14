-- FLOWFLLOW MVP Database Schema

-- ===== テーブル0: ワークスペース（マルチテナント） =====
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform VARCHAR(20) NOT NULL, -- 'slack', 'teams', 'google_chat'
  workspace_id VARCHAR(255) NOT NULL, -- Slack team_id / Teams tenant_id
  workspace_name VARCHAR(255),
  bot_token TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(platform, workspace_id)
);

-- ===== テーブル1: アクションアイテム =====
CREATE TABLE IF NOT EXISTS action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  task_name VARCHAR(255) NOT NULL,
  assigned_to VARCHAR(100) NOT NULL,
  deadline TIMESTAMP NOT NULL,
  created_by VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  slack_thread_id VARCHAR(255),
  slack_channel_id VARCHAR(100),
  teams_thread_id VARCHAR(255),
  teams_channel_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'normal',
  escalation_level INT DEFAULT 0,
  escalation_sent_at TIMESTAMP,
  ai_verification_stage INT DEFAULT 0
);

-- ===== テーブル2: 完了証拠 =====
CREATE TABLE IF NOT EXISTS completion_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_item_id UUID NOT NULL REFERENCES action_items(id) ON DELETE CASCADE,
  source VARCHAR(50) NOT NULL,
  source_message_id VARCHAR(255),
  completed_by VARCHAR(100) NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  proof_text TEXT,
  proof_level VARCHAR(20) DEFAULT 'verified',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== テーブル3: 完了率レコード =====
CREATE TABLE IF NOT EXISTS completion_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id VARCHAR(100) NOT NULL,
  period_date DATE NOT NULL,
  total_tasks INT DEFAULT 0,
  completed_tasks INT DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0,
  average_completion_time_hours DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(workspace_id, user_id, period_date)
);

-- ===== テーブル4: 証拠ファイル管理 =====
CREATE TABLE IF NOT EXISTS evidence_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_item_id UUID NOT NULL REFERENCES action_items(id) ON DELETE CASCADE,
  file_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  uploaded_by VARCHAR(100) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  file_content TEXT,
  quality_score DECIMAL(3,2) DEFAULT 0,
  quality_feedback TEXT,
  ai_review_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== インデックス =====
CREATE INDEX IF NOT EXISTS idx_workspaces_platform ON workspaces(platform, workspace_id);
CREATE INDEX IF NOT EXISTS idx_action_items_workspace ON action_items(workspace_id);
CREATE INDEX IF NOT EXISTS idx_action_items_assigned_to ON action_items(assigned_to);
CREATE INDEX IF NOT EXISTS idx_action_items_deadline ON action_items(deadline);
CREATE INDEX IF NOT EXISTS idx_action_items_status ON action_items(status);
CREATE INDEX IF NOT EXISTS idx_completion_proofs_action_item_id ON completion_proofs(action_item_id);
CREATE INDEX IF NOT EXISTS idx_completion_proofs_completed_by ON completion_proofs(completed_by);
CREATE INDEX IF NOT EXISTS idx_completion_metrics_workspace ON completion_metrics(workspace_id);
CREATE INDEX IF NOT EXISTS idx_completion_metrics_user_id ON completion_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_completion_metrics_period ON completion_metrics(period_date);
CREATE INDEX IF NOT EXISTS idx_evidence_files_action_item_id ON evidence_files(action_item_id);
CREATE INDEX IF NOT EXISTS idx_evidence_files_ai_review_status ON evidence_files(ai_review_status);
