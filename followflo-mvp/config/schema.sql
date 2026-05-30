-- FollowFlo MVP Database Schema

-- ===== テーブル1: アクションアイテム =====
CREATE TABLE IF NOT EXISTS action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_name VARCHAR(255) NOT NULL,
  assigned_to VARCHAR(100) NOT NULL,
  deadline TIMESTAMP NOT NULL,
  created_by VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  slack_thread_id VARCHAR(255),
  slack_channel_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, overdue
  priority VARCHAR(20) DEFAULT 'normal' -- low, normal, high
);

-- ===== テーブル2: 完了証拠 =====
CREATE TABLE IF NOT EXISTS completion_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_item_id UUID NOT NULL REFERENCES action_items(id) ON DELETE CASCADE,
  source VARCHAR(50) NOT NULL, -- 'slack', 'teams', 'zoom', 'notion', 'asana'
  source_message_id VARCHAR(255),
  completed_by VARCHAR(100) NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  proof_text TEXT,
  proof_level VARCHAR(20) DEFAULT 'verified', -- unverified, verified, flagged
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== テーブル3: 完了率レコード =====
CREATE TABLE IF NOT EXISTS completion_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL,
  period_date DATE NOT NULL,
  total_tasks INT DEFAULT 0,
  completed_tasks INT DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0,
  average_completion_time_hours DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, period_date)
);

-- ===== インデックス =====
CREATE INDEX idx_action_items_assigned_to ON action_items(assigned_to);
CREATE INDEX idx_action_items_deadline ON action_items(deadline);
CREATE INDEX idx_action_items_status ON action_items(status);
CREATE INDEX idx_completion_proofs_action_item_id ON completion_proofs(action_item_id);
CREATE INDEX idx_completion_proofs_completed_by ON completion_proofs(completed_by);
CREATE INDEX idx_completion_metrics_user_id ON completion_metrics(user_id);
CREATE INDEX idx_completion_metrics_period ON completion_metrics(period_date);
