import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navigation from '../components/Navigation';
import '../styles/evidence.css';

interface EvidenceFile {
  id: string;
  action_item_id: string;
  file_name: string;
  file_type: string;
  quality_score: number;
  quality_feedback: string;
  ai_review_status: string;
  uploaded_by: string;
  created_at: string;
}

export default function EvidencePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [files, setFiles] = useState<EvidenceFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all');

  useEffect(() => {
    const id = localStorage.getItem('userId');
    if (id) setUserId(id);
  }, []);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const url =
          filter === 'all'
            ? '/api/evidence-files'
            : `/api/evidence-files?approved=${filter === 'approved'}`;
        const response = await axios.get(url);
        setFiles(response.data);
      } catch (error) {
        console.error('Error fetching evidence files:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [filter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'status-approved';
      case 'needs_review':
        return 'status-review';
      case 'pending':
        return 'status-pending';
      default:
        return '';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      approved: '✅ 承認済み',
      needs_review: '⚠️ 確認が必要',
      pending: '⏳ 保留中',
    };
    return labels[status] || status;
  };

  return (
    <div className="container">
      <Navigation userId={userId} setUserId={setUserId} />

      <div className="content">
        <h1>📎 証拠ファイル</h1>

        <div className="filter-buttons">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            すべて
          </button>
          <button
            className={filter === 'approved' ? 'active' : ''}
            onClick={() => setFilter('approved')}
          >
            承認済み
          </button>
          <button
            className={filter === 'pending' ? 'active' : ''}
            onClick={() => setFilter('pending')}
          >
            確認が必要
          </button>
        </div>

        {loading ? (
          <div className="loading">読込中...</div>
        ) : files.length === 0 ? (
          <div className="empty">証拠ファイルがありません</div>
        ) : (
          <div className="files-grid">
            {files.map((file) => (
              <div key={file.id} className="file-card">
                <div className="file-header">
                  <h3>{file.file_name}</h3>
                  <span className={`status-badge ${getStatusColor(file.ai_review_status)}`}>
                    {getStatusLabel(file.ai_review_status)}
                  </span>
                </div>

                <div className="file-meta">
                  <div className="meta-item">
                    <span className="label">タイプ:</span>
                    <span className="value">{file.file_type}</span>
                  </div>
                  <div className="meta-item">
                    <span className="label">アップロード者:</span>
                    <span className="value">{file.uploaded_by}</span>
                  </div>
                  <div className="meta-item">
                    <span className="label">アップロード日:</span>
                    <span className="value">
                      {new Date(file.created_at).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                </div>

                <div className="quality-section">
                  <h4>品質評価</h4>
                  <div className="score-bar">
                    <div
                      className="score-fill"
                      style={{ width: `${file.quality_score * 100}%` }}
                    ></div>
                  </div>
                  <span className="score-text">
                    {(file.quality_score * 100).toFixed(0)}%
                  </span>
                  {file.quality_feedback && (
                    <p className="feedback">{file.quality_feedback}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
