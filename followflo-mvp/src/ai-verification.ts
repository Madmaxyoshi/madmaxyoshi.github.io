import { query } from './database';
import { VerificationResult } from './types';
import crypto from 'crypto';

export async function verifyCompletion(
  actionItemId: string,
  messageText: string,
  userId: string
): Promise<VerificationResult> {
  // Stage 1: Auto-detection (keyword matching)
  const completionKeywords = ['✅', '完了', 'done', 'finished', '終了', 'complete'];
  const stage1Match = completionKeywords.some(keyword =>
    messageText.toLowerCase().includes(keyword)
  );

  if (!stage1Match) {
    const hash = crypto.createHash('sha256').update(messageText).digest('hex');
    return {
      stage: 0,
      verified: false,
      confidence: 0,
      reason: 'No completion keywords detected',
      hash,
    };
  }

  // Stage 2: Context verification (check message context)
  const actionResult = await query(
    `SELECT task_name, assigned_to, deadline FROM action_items WHERE id = $1`,
    [actionItemId]
  );

  if (actionResult.rows.length === 0) {
    const hash = crypto.createHash('sha256').update(messageText).digest('hex');
    return {
      stage: 1,
      verified: false,
      confidence: 0.5,
      reason: 'Action item not found',
      hash,
    };
  }

  const actionItem = actionResult.rows[0];
  const taskNameInMessage = messageText.toLowerCase().includes(actionItem.task_name.toLowerCase());
  const userMatch = userId === actionItem.assigned_to;

  const contextScore = (taskNameInMessage ? 0.4 : 0) + (userMatch ? 0.6 : 0);

  if (contextScore < 0.5) {
    const hash = crypto.createHash('sha256').update(messageText).digest('hex');
    return {
      stage: 2,
      verified: false,
      confidence: contextScore,
      reason: 'Context mismatch: task name or user mismatch',
      hash,
    };
  }

  // Stage 3: Proof recording (create evidence chain)
  const hash = crypto.createHash('sha256').update(messageText + userId + Date.now()).digest('hex');

  await query(
    `INSERT INTO completion_proofs (action_item_id, source, completed_by, proof_text, proof_level, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      actionItemId,
      'slack',
      userId,
      messageText,
      'verified',
      JSON.stringify({
        verification_stage: 3,
        context_score: contextScore,
        hash,
        verified_at: new Date().toISOString(),
      }),
    ]
  );

  // Stage 4: Human confirmation (flag for review if confidence is low)
  const requiresHumanReview = contextScore < 0.8;

  return {
    stage: requiresHumanReview ? 3 : 4,
    verified: true,
    confidence: Math.min(contextScore, 0.95),
    reason: requiresHumanReview ? 'Flagged for human review' : 'Automatically verified',
    hash,
  };
}

export async function updateVerificationStage(
  actionItemId: string,
  stage: number
): Promise<void> {
  await query(
    `UPDATE action_items SET ai_verification_stage = $1 WHERE id = $2`,
    [stage, actionItemId]
  );
}
