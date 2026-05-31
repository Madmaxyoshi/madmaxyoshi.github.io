import React, { useState } from 'react';
import './Navigation.css';

interface Props {
  userId: string | null;
  setUserId: (id: string | null) => void;
}

export default function Navigation({ userId, setUserId }: Props) {
  const [inputValue, setInputValue] = useState(userId || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setUserId(inputValue);
    }
  };

  return (
    <nav className="navigation">
      <div className="nav-header">
        <h1 className="logo">FLOWFLLOW</h1>
        <p className="tagline">会議アクションアイテム完了保証エンジン</p>
      </div>

      <div className="nav-items">
        <a href="/">ダッシュボード</a>
        <a href="/evidence">証拠ファイル</a>
        <a href="/tasks">タスク</a>
        <a href="/proofs">完了証拠</a>
      </div>

      <div className="user-selector">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="ユーザーIDを入力（例: U123456）"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button type="submit">フィルター</button>
          {userId && (
            <button
              type="button"
              className="clear"
              onClick={() => {
                setUserId(null);
                setInputValue('');
              }}
            >
              ✕
            </button>
          )}
        </form>
        {userId && <span className="user-badge">フィルタ: {userId}</span>}
      </div>
    </nav>
  );
}
