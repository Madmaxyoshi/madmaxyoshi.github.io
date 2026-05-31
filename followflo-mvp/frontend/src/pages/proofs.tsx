import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navigation from '../components/Navigation';
import '../styles/proofs.css';

interface CompletionProof {
  id: string;
  action_item_id: string;
  source: string;
  completed_by: string;
  proof_text: string;
  proof_level: string;
  created_at: string;
  metadata: any;
}

export default function ProofsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [proofs, setProofs] = useState<CompletionProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProof, setSelectedProof] = useState<CompletionProof | null>(null);

  useEffect(() => {
    const id = localStorage.getItem('userId');
    if (id) setUserId(id);
  }, []);

  useEffect(() => {
    const fetchProofs = async () => {
      try {
        const response = await axios.get('/api/completion-proofs/' + (userId || 'all'));
        setProofs(response.data);
      } catch (error) {
        console.error('Error fetching proofs:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProofs();
    }
  }, [userId]);

  const getSourceIcon = (source: string) => {
    const icons: Record<string, string> = {
      slack: '💬',
      file: '📎',
      api: '🔌',
      default: '✓',
    };
    return icons[source] || icons.default;
  };

  const getProofLevelColor = (level: string) => {
    switch (level) {
      case 'verified':
        return 'level-verified';
      case 'high':
        return 'level-high';
      case 'medium':
        return 'level-medium';
      case 'low':
        return 'level-low';
      default:
        return '';
    }
  };

  return (
    <div className="container">
      <Navigation userId={userId} setUserId={setUserId} />

      <div className="content">
        <h1>✅ 完了証拠</h1>

        {!userId && (
          <div className="info-box">
            ユーザーIDを選択して完了証拠を表示してください
          </div>
        )}

        {loading ? (
          <div className="loading">読込中...</div>
        ) : proofs.length === 0 ? (
          <div className="empty">完了証拠がありません</div>
        ) : (
          <div className="proofs-container">
            <div className="proofs-list">
              {proofs.map((proof) => (
                <div
                  key={proof.id}
                  className={`proof-item ${selectedProof?.id === proof.id ? 'selected' : ''}`}
                  onClick={() => setSelectedProof(proof)}
                >
                  <div className="proof-header">
                    <span className="source-icon">
                      {getSourceIcon(proof.source)}
                    </span>
                    <div className="proof-info">
                      <span className="source">{proof.source.toUpperCase()}</span>
                      <span className="date">
                        {new Date(proof.created_at).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                    <span className={`level-badge ${getProofLevelColor(proof.proof_level)}`}>
                      {proof.proof_level}
                    </span>
                  </div>
                  <p className="preview">{proof.proof_text.substring(0, 60)}...</p>
                </div>
              ))}
            </div>

            {selectedProof && (
              <div className="proof-detail">
                <div className="detail-header">
                  <h3>証拠詳細</h3>
                  <button className="close" onClick={() => setSelectedProof(null)}>
                    ✕
                  </button>
                </div>

                <div className="detail-content">
                  <div className="detail-item">
                    <span className="label">ソース:</span>
                    <span className="value">{selectedProof.source}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">完了者:</span>
                    <span className="value">{selectedProof.completed_by}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">レベル:</span>
                    <span className={`value ${getProofLevelColor(selectedProof.proof_level)}`}>
                      {selectedProof.proof_level}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">日時:</span>
                    <span className="value">
                      {new Date(selectedProof.created_at).toLocaleString('ja-JP')}
                    </span>
                  </div>

                  <div className="proof-text-section">
                    <h4>証拠テキスト</h4>
                    <div className="proof-text">{selectedProof.proof_text}</div>
                  </div>

                  {selectedProof.metadata && (
                    <div className="metadata-section">
                      <h4>メタデータ</h4>
                      <pre className="metadata-json">
                        {JSON.stringify(selectedProof.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
