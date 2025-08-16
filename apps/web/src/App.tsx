import Board from './components/Board';
import Login from './components/Login';
import ShareModal from './components/ShareModal';
import ProjectSelector from './components/ProjectSelector';
import NoProject from './components/NoProject';
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type { User } from './types';

export default function App() {
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [skipWeekends, setSkipWeekends] = useState(true);
  const [zoom, setZoom] = useState(28);
  const [showShareModal, setShowShareModal] = useState(false);
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

  const handleLogin = (user: User) => {
    localStorage.setItem('userId', user.id);
    queryClient.setQueryData(['user'], { user });
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    queryClient.clear();
  };


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

  if (!user.currentProject) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ 
          position: 'absolute', 
          top: 16, 
          right: 16, 
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <ProjectSelector />
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
        <NoProject />
      </div>
    );
  }

  return (
    <div style={{ padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 12 
      }}>
        <div style={{ flex: '1', minWidth: 0 }}>
          <ProjectSelector />
        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 16, 
          flexWrap: 'wrap',
          justifyContent: 'flex-end'
        }}>
          <label style={{ 
            color: 'var(--text-dim)', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 6,
            whiteSpace: 'nowrap',
            fontSize: '0.875rem'
          }}>
            Start <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
          <label style={{ 
            color: 'var(--text-dim)', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 6,
            whiteSpace: 'nowrap',
            fontSize: '0.875rem'
          }}>
            <input type="checkbox" checked={skipWeekends} onChange={(e) => setSkipWeekends(e.target.checked)} /> 
            Skip weekends
          </label>
          <label style={{ 
            color: 'var(--text-dim)', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 6,
            whiteSpace: 'nowrap',
            fontSize: '0.875rem'
          }}>
            Zoom <input type="range" min={20} max={60} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
          </label>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ 
              color: 'var(--text-dim)', 
              fontSize: '0.875rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '120px'
            }}>
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
                gap: '4px',
                whiteSpace: 'nowrap'
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
                cursor: 'pointer',
                whiteSpace: 'nowrap'
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
