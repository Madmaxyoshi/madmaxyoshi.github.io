import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navigation from '../components/Navigation';
import '../styles/tasks.css';

interface ActionItem {
  id: string;
  task_name: string;
  assigned_to: string;
  status: string;
  created_at: string;
  deadline: string;
  ai_verification_stage: number;
}

export default function TasksPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    const id = localStorage.getItem('userId');
    if (id) setUserId(id);
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        let url = '/api/action-items';
        const params = new URLSearchParams();

        if (filter !== 'all') {
          params.append('status', filter);
        }
        if (userId) {
          params.append('userId', userId);
        }

        if (params.toString()) {
          url += '?' + params.toString();
        }

        const response = await axios.get(url);
        setTasks(response.data);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [filter, userId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'status-completed';
      case 'pending':
        return 'status-pending';
      default:
        return '';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      completed: '✅ 完了',
      pending: '⏳ 保留中',
    };
    return labels[status] || status;
  };

  const getStageLabel = (stage: number) => {
    const stages = [
      '段階0: キーワード検出',
      '段階1: コンテキスト検証',
      '段階2: コンテキスト不一致',
      '段階3: 人間確認待ち',
      '段階4: 完全検証',
    ];
    return stages[stage] || `不明な段階 ${stage}`;
  };

  return (
    <div className="container">
      <Navigation userId={userId} setUserId={setUserId} />

      <div className="content">
        <h1>📋 アクションアイテム</h1>

        <div className="filter-buttons">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            すべて
          </button>
          <button
            className={filter === 'pending' ? 'active' : ''}
            onClick={() => setFilter('pending')}
          >
            保留中
          </button>
          <button
            className={filter === 'completed' ? 'active' : ''}
            onClick={() => setFilter('completed')}
          >
            完了
          </button>
        </div>

        {loading ? (
          <div className="loading">読込中...</div>
        ) : tasks.length === 0 ? (
          <div className="empty">タスクがありません</div>
        ) : (
          <div className="tasks-list">
            {tasks.map((task) => (
              <div key={task.id} className="task-item">
                <div className="task-header">
                  <h3>{task.task_name}</h3>
                  <span className={`status-badge ${getStatusColor(task.status)}`}>
                    {getStatusLabel(task.status)}
                  </span>
                </div>

                <div className="task-info">
                  <div className="info-row">
                    <span className="label">担当:</span>
                    <span className="value">{task.assigned_to}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">期限:</span>
                    <span className="value">
                      {new Date(task.deadline).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">作成日:</span>
                    <span className="value">
                      {new Date(task.created_at).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">検証段階:</span>
                    <span className="value">{getStageLabel(task.ai_verification_stage)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
