import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

interface DashboardData {
  user: any;
  team: any[];
  overdue: any[];
  globalStats: any;
}

interface Props {
  userId: string | null;
}

export default function Dashboard({ userId }: Props) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = userId
          ? `/api/dashboard/summary?userId=${userId}`
          : '/api/dashboard/summary';
        const response = await axios.get(url);
        setData(response.data);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (loading) return <div className="loading">読込中...</div>;
  if (!data) return <div className="error">データを読み込めませんでした</div>;

  return (
    <div className="dashboard">
      <h1>📊 FLOWFLLOW ダッシュボード</h1>

      <div className="grid-2">
        <div className="card">
          <h2>全体統計</h2>
          <div className="stat">
            <span>総タスク数:</span>
            <strong>{data.globalStats.totalTasks}</strong>
          </div>
          <div className="stat">
            <span>完了済み:</span>
            <strong>{data.globalStats.completedTasks}</strong>
          </div>
          <div className="stat">
            <span>完了率:</span>
            <strong>
              {data.globalStats.totalTasks > 0
                ? ((data.globalStats.completedTasks / data.globalStats.totalTasks) * 100).toFixed(1)
                : 0}%
            </strong>
          </div>
        </div>

        {data.user && (
          <div className="card">
            <h2>あなたの成績</h2>
            <div className="stat">
              <span>完了率:</span>
              <strong>{data.user.completion_rate.toFixed(1)}%</strong>
            </div>
            <div className="stat">
              <span>完了タスク:</span>
              <strong>{data.user.completed_tasks}/{data.user.total_tasks}</strong>
            </div>
            <div className="stat">
              <span>平均完了時間:</span>
              <strong>{data.user.average_completion_time_hours.toFixed(1)}時間</strong>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h2>チーム成績</h2>
        <div className="team-table">
          <table>
            <thead>
              <tr>
                <th>ユーザー</th>
                <th>完了率</th>
                <th>完了タスク</th>
              </tr>
            </thead>
            <tbody>
              {data.team.map((member: any) => (
                <tr key={member.user_id}>
                  <td>{member.user_id}</td>
                  <td>{member.completion_rate.toFixed(1)}%</td>
                  <td>{member.completed_tasks}/{member.total_tasks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data.overdue.length > 0 && (
        <div className="card warning">
          <h2>⚠️ 期限超過タスク ({data.overdue.length}件)</h2>
          <div className="overdue-list">
            {data.overdue.map((item: any) => (
              <div key={item.id} className="overdue-item">
                <div className="task-name">{item.task_name}</div>
                <div className="task-meta">
                  <span>担当: {item.assigned_to}</span>
                  <span>期限: {new Date(item.deadline).toLocaleDateString('ja-JP')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
