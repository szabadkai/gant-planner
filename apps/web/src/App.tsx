import Board from './components/Board';
import Login from './components/Login';
import ShareModal from './components/ShareModal';
import ProjectSelector from './components/ProjectSelector';
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type { User } from './types';

export default function App() {
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [skipWeekends, setSkipWeekends] = useState(true);
  const [zoom, setZoom] = useState(28);
  const [showShareModal, setShowShareModal] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  const queryClient = useQueryClient();

  // Query user data if we have a userId
  const hasUserId = localStorage.getItem('userId');
  const { data: userResponse, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ['user'],
    queryFn: api.me,
    enabled: !!hasUserId && initialCheckDone,
    retry: false,
  });

  const user = userResponse?.user || null;

  // Initial auth check
  useEffect(() => {
    setInitialCheckDone(true);
  }, []);

  // Handle auth failure
  useEffect(() => {
    if (userError && hasUserId) {
      localStorage.removeItem('userId');
      queryClient.clear();
    }
  }, [userError, hasUserId, queryClient]);

  const handleLogin = (user: { id: string; email: string; name: string | null; projectTitle: string | null }) => {
    localStorage.setItem('userId', user.id);
    queryClient.setQueryData(['user'], { user });
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    queryClient.clear();
  };

  const handleTitleEdit = () => {
    setTitleValue(user?.projectTitle || '');
    setEditingTitle(true);
  };

  const handleTitleSave = async () => {
    if (!user) return;
    try {
      const response = await api.updateProjectTitle(titleValue.trim() || null);
      queryClient.setQueryData(['user'], { user: response.user });
      setEditingTitle(false);
    } catch (error) {
      console.error('Failed to update project title:', error);
    }
  };

  const handleTitleCancel = () => {
    setEditingTitle(false);
    setTitleValue('');
  };

  // Update titleValue when user changes
  useEffect(() => {
    if (user) {
      setTitleValue(user.projectTitle || '');
    }
  }, [user]);

  if (userLoading) {
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
        {editingTitle ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSave();
                if (e.key === 'Escape') handleTitleCancel();
              }}
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                background: 'transparent',
                border: '2px dashed var(--border)',
                color: 'var(--text)',
                padding: '4px 8px',
                borderRadius: '4px',
                minWidth: '250px'
              }}
              placeholder="Enter project title..."
              autoFocus
            />
            <button onClick={handleTitleSave} style={{ padding: '6px 12px', fontSize: '0.875rem' }}>
              Save
            </button>
            <button onClick={handleTitleCancel} style={{ padding: '6px 12px', fontSize: '0.875rem', background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--border)' }}>
              Cancel
            </button>
          </div>
        ) : (
          <h1 
            style={{ 
              margin: 0, 
              fontSize: '1.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
            onClick={handleTitleEdit}
            title="Click to edit project title"
          >
            {user?.projectTitle || "Levi's Gantt Queue Planner"}
            <span style={{ 
              fontSize: '0.75rem', 
              color: 'var(--text-dim)', 
              opacity: 0.5,
              fontWeight: 'normal'
            }}>
              [edit]
            </span>
          </h1>
        )}
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
              onClick={() => setShowShareModal(true)}
              style={{ 
                padding: '6px 8px', 
                fontSize: '0.875rem',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Share project"
            >
              📤 Share
            </button>
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
      {showShareModal && <ShareModal onClose={() => setShowShareModal(false)} />}
    </div>
  );
}
