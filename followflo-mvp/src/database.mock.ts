// Mock database for testing UI without PostgreSQL
const mockData = {
  action_items: [
    { id: 1, task_name: 'Q1営業戦略策定', assigned_to: 'user1', status: 'pending', deadline: new Date(Date.now() + 7*24*60*60*1000), ai_verification_stage: 2, created_at: new Date() },
    { id: 2, task_name: 'マーケティング資料作成', assigned_to: 'user2', status: 'completed', deadline: new Date(Date.now() - 2*24*60*60*1000), ai_verification_stage: 4, created_at: new Date(Date.now() - 5*24*60*60*1000) },
    { id: 3, task_name: 'チーム研修実施', assigned_to: 'user3', status: 'pending', deadline: new Date(Date.now() + 14*24*60*60*1000), ai_verification_stage: 1, created_at: new Date(Date.now() - 1*24*60*60*1000) },
  ],
  evidence_files: [
    { id: 1, file_name: '実装完了スクリーンショット.png', file_type: 'image', uploaded_by: 'user1', ai_review_status: 'approved', quality_score: 0.95, quality_feedback: '高品質な証拠ファイル', action_item_id: 1, created_at: new Date() },
    { id: 2, file_name: '会議議事録.pdf', file_type: 'document', uploaded_by: 'user2', ai_review_status: 'needs_review', quality_score: 0.72, quality_feedback: '確認が必要', action_item_id: 2, created_at: new Date(Date.now() - 1*24*60*60*1000) },
  ],
  completion_proofs: [
    { id: 1, action_item_id: 1, proof_type: 'slack_status', source_url: 'https://slack.com/...', ai_confidence: 0.98, created_at: new Date() },
    { id: 2, action_item_id: 2, proof_type: 'document_hash', source_url: 'https://notion.so/...', ai_confidence: 0.85, created_at: new Date(Date.now() - 1*24*60*60*1000) },
  ],
};

export async function initDatabase() {
  console.log('✅ Mock database initialized');
}

export async function query(text: string, params?: any[]) {
  // Parse the query and return mock data
  const upperText = text.toUpperCase();
  const p = params || [];

  if (upperText.includes('SELECT * FROM action_items')) {
    const filtered = mockData.action_items.filter(item => {
      if (p.length > 0 && upperText.includes('WHERE')) {
        if (upperText.includes('status = $')) return item.status === p[0];
        if (upperText.includes('assigned_to = $')) return item.assigned_to === p[0];
      }
      return true;
    });
    return { rows: filtered };
  }

  if (upperText.includes('SELECT * FROM evidence_files')) {
    const filtered = mockData.evidence_files.filter(file => {
      if (p.length > 0) {
        if (upperText.includes('action_item_id = $')) return file.action_item_id === parseInt(p[0]);
        if (upperText.includes('ai_review_status = $')) return file.ai_review_status === p[0];
      }
      return true;
    });
    return { rows: filtered };
  }

  if (upperText.includes('SELECT * FROM completion_proofs')) {
    const filtered = mockData.completion_proofs.filter(proof => {
      if (p.length > 0 && upperText.includes('action_item_id = $')) {
        return proof.action_item_id === parseInt(p[0]);
      }
      return true;
    });
    return { rows: filtered };
  }

  if (upperText.includes('COUNT(*)')) {
    if (upperText.includes('status = $') && p.length > 0) {
      const count = mockData.action_items.filter(item => item.status === p[0]).length;
      return { rows: [{ total: count.toString() }] };
    }
    return { rows: [{ total: mockData.action_items.length.toString() }] };
  }

  return { rows: [] };
}
