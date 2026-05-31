export interface ActionItem {
  id: string;
  task_name: string;
  assigned_to: string;
  deadline: string;
  created_by: string;
  created_at: string;
  status: 'pending' | 'completed' | 'overdue';
  slack_channel_id?: string;
  escalation_level?: number;
  ai_verification_stage?: number;
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

export interface VerificationResult {
  stage: number;
  verified: boolean;
  confidence: number;
  reason: string;
  hash: string;
}

export interface EvidenceFile {
  id: string;
  action_item_id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  uploaded_by: string;
  uploaded_at: string;
  file_content?: string;
  quality_score: number;
  quality_feedback: string;
  ai_review_status: 'pending' | 'approved' | 'rejected' | 'needs_review';
}

export interface QualityEvaluation {
  score: number; // 0.0-1.0
  feedback: string;
  issues: string[];
  isApproved: boolean;
}

export interface FinalVerificationResult extends VerificationResult {
  message_confidence: number;
  evidence_files: EvidenceFile[];
  quality_evaluation: QualityEvaluation;
  final_confidence: number;
  final_stage: number; // 0=unverified, 1=auto-detected, 2=context-verified, 3=file-verified, 4=quality-approved
}
