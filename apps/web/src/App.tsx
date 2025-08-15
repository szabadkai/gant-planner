import Board from './components/Board';
import Login from './components/Login';
import { useState, useEffect } from 'react';
import { api } from './api';

type User = { id: string; email: string; name: string | null };

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [skipWeekends, setSkipWeekends] = useState(true);
  const [zoom, setZoom] = useState(28);

  // Check for existing auth on app load
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      api.me()
        .then(response => setUser(response.user))
        .catch(() => {
          // Auth failed, clear stored userId
          localStorage.removeItem('userId');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (user: User) => {
    setUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif'
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div style={{ padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>Levi's Gantt Queue Planner</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="row no-wrap" style={{ marginBottom: 0 }}>
            <label style={{ color: 'var(--text-dim)', flex: '0 0 auto' }}>Start <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></label>
            <label style={{ color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: 6, flex: '0 0 auto' }}><input type="checkbox" checked={skipWeekends} onChange={(e) => setSkipWeekends(e.target.checked)} /> Skip weekends</label>
            <label style={{ color: 'var(--text-dim)', flex: '0 0 auto' }}>Zoom <input type="range" min={20} max={60} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} /></label>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>
              {user.name || user.email}
            </span>
            <button 
              onClick={handleLogout}
              style={{ 
                padding: '4px 8px', 
                fontSize: '0.75rem',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                color: 'var(--text-dim)',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      <Board startDate={startDate} skipWeekends={skipWeekends} zoom={zoom} />
    </div>
  );
}
