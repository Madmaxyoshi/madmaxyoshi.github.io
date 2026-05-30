export interface ActionItem {
  id: string;
  task_name: string;
  assigned_to: string;
  deadline: string;
  created_by: string;
  created_at: string;
  status: 'pending' | 'completed' | 'overdue';
  slack_channel_id?: string;
}

export interface CompletionProof {
  id: string;
  action_item_id: string;
  source: 'slack' | 'teams' | 'zoom' | 'notion' | 'asana';
  completed_by: string;
  completed_at: string;
  proof_level: 'unverified' | 'verified' | 'flagged';
}

export interface CompletionMetric {
  user_id: string;
  total_tasks: number;
  completed_tasks: number;
  completion_rate: number;
  average_completion_time_hours: number;
}
