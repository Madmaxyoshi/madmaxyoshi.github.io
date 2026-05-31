import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Dashboard from '../components/Dashboard';
import Navigation from '../components/Navigation';
import '../styles/index.css';

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('userId') || localStorage.getItem('userId');
    if (id) {
      setUserId(id);
      localStorage.setItem('userId', id);
    }
  }, []);

  return (
    <div className="container">
      <Navigation userId={userId} setUserId={setUserId} />
      <Dashboard userId={userId} />
    </div>
  );
}
