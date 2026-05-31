import { query } from './database';
import { VerificationResult, FinalVerificationResult, EvidenceFile, QualityEvaluation } from './types';
import crypto from 'crypto';
import { Anthropic } from '@anthropic-ai/sdk';

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

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function evaluateEvidenceFile(
  fileContent: string,
  fileName: string,
  taskName: string
): Promise<QualityEvaluation> {
  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `
Evaluate if this evidence file supports completion of the task: "${taskName}"

File Name: ${fileName}
File Content:
${fileContent}

Provide evaluation in JSON format:
{
  "isRelevant": boolean (is this file relevant to the task?),
  "isComplete": boolean (does it show completion?),
  "quality": number (0.0-1.0, how complete/detailed is the evidence?),
  "issues": [list of any concerns],
  "feedback": "brief summary"
}
`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const evaluation = JSON.parse(responseText);

    return {
      score: evaluation.quality,
      feedback: evaluation.feedback,
      issues: evaluation.issues || [],
      isApproved: evaluation.isRelevant && evaluation.isComplete && evaluation.quality >= 0.7,
    };
  } catch (error) {
    console.error('Claude API evaluation error:', error);
    return {
      score: 0.5,
      feedback: 'AI evaluation failed, manual review needed',
      issues: ['API error'],
      isApproved: false,
    };
  }
}

export async function finalVerifyCompletion(
  actionItemId: string,
  messageText: string,
  userId: string,
  evidenceFiles?: EvidenceFile[]
): Promise<FinalVerificationResult> {
  // Step 1: Message verification (existing logic)
  const messageVerification = await verifyCompletion(actionItemId, messageText, userId);

  // Step 2: Evidence file evaluation
  const evaluations: QualityEvaluation[] = [];
  let maxFileConfidence = 0;

  if (evidenceFiles && evidenceFiles.length > 0) {
    const actionResult = await query(
      `SELECT task_name FROM action_items WHERE id = $1`,
      [actionItemId]
    );
    const taskName = actionResult.rows[0]?.task_name || 'Unknown Task';

    for (const file of evidenceFiles) {
      if (file.file_content) {
        const evaluation = await evaluateEvidenceFile(file.file_content, file.file_name, taskName);
        evaluations.push(evaluation);

        if (evaluation.isApproved) {
          maxFileConfidence = Math.max(maxFileConfidence, evaluation.score);
        }

        // Update file with evaluation
        await query(
          `UPDATE evidence_files SET quality_score = $1, quality_feedback = $2, ai_review_status = $3 WHERE id = $4`,
          [evaluation.score, evaluation.feedback, evaluation.isApproved ? 'approved' : 'needs_review', file.id]
        );
      }
    }
  }

  // Step 3: Combine message + file verification
  const qualityEvaluation = evaluations[0] || {
    score: 0,
    feedback: 'No evidence files provided',
    issues: [],
    isApproved: false,
  };

  const combinedConfidence = (messageVerification.confidence + maxFileConfidence) / 2;

  let finalStage = messageVerification.stage;
  if (evidenceFiles && evidenceFiles.length > 0 && qualityEvaluation.isApproved) {
    finalStage = 4; // Quality approved
  } else if (evidenceFiles && evidenceFiles.length > 0) {
    finalStage = 3; // File verified but needs review
  }

  return {
    ...messageVerification,
    message_confidence: messageVerification.confidence,
    evidence_files: evidenceFiles || [],
    quality_evaluation: qualityEvaluation,
    final_confidence: Math.min(combinedConfidence, 0.99),
    final_stage: finalStage,
    stage: finalStage,
    confidence: Math.min(combinedConfidence, 0.99),
  };
}
