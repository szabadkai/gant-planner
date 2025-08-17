import Board from './components/Board';
import Login from './components/Login';
import ShareModal from './components/ShareModal';
import ProjectSelector from './components/ProjectSelector';
import NoProject from './components/NoProject';
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type { User } from './types';
import { Share2, LogOut, Search, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export default function App() {
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [skipWeekends, setSkipWeekends] = useState(true);
  const [zoom, setZoom] = useState(28);
  const [showShareModal, setShowShareModal] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <LogOut size={12} />
            Logout
          </button>
        </div>
        <NoProject />
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation Bar */}
      <header style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        margin: '16px 16px 0 16px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
        minHeight: '60px'
      }}>
        {/* Logo/Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: '1.25rem', 
            fontWeight: 600,
            color: 'var(--text)'
          }}>
            Gantt Queue Planner
          </h1>
        </div>

        {/* Project Selector */}
        <div style={{ flex: '1', minWidth: 200, maxWidth: 300 }}>
          <ProjectSelector />
        </div>

        {/* Search Bar */}
        <div style={{ flex: '1', minWidth: 200, maxWidth: 400, position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <Search 
              size={16} 
              style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: 'var(--text-dim)',
                pointerEvents: 'none'
              }} 
            />
            <input 
              type="text" 
              placeholder="Search tasks..."
              aria-label="Search tasks"
              role="searchbox"
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                background: 'var(--input-bg)',
                color: 'var(--text)',
                fontSize: '0.875rem'
              }}
            />
          </div>
        </div>

        {/* User Profile & Actions */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 12,
          flexShrink: 0
        }}>
          <span style={{ 
            color: 'var(--text-dim)', 
            fontSize: '0.875rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '120px'
          }}>
            {user?.name || user?.email}
          </span>
          <button 
            onClick={() => setShowShareModal(true)}
            style={{ 
              padding: '8px 12px', 
              fontSize: '0.875rem',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
            title="Share project"
          >
            <Share2 size={16} />
            Share
          </button>
          <button 
            onClick={handleLogout}
            style={{ 
              padding: '6px 10px', 
              fontSize: '0.75rem',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </header>

      {/* Controls Bar */}
      <div style={{ 
        margin: '16px 16px 0 16px',
        display: 'flex', 
        alignItems: 'center', 
        gap: 16, 
        flexWrap: 'wrap',
        padding: '8px 16px',
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '6px'
      }}>
        {/* Sidebar Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '6px',
            color: 'var(--text-dim)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            flexShrink: 0
          }}
          title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
          aria-label={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
        >
          {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>

        <label style={{ 
          color: 'var(--text-dim)', 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: 6,
          whiteSpace: 'nowrap',
          fontSize: '0.875rem'
        }}>
          Start <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)}
            aria-label="Project start date"
          />
        </label>
        <label style={{ 
          color: 'var(--text-dim)', 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: 6,
          whiteSpace: 'nowrap',
          fontSize: '0.875rem'
        }}>
          <input 
            type="checkbox" 
            checked={skipWeekends} 
            onChange={(e) => setSkipWeekends(e.target.checked)}
            aria-label="Skip weekends in timeline"
          /> 
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
          Zoom <input 
            type="range" 
            min={20} 
            max={60} 
            value={zoom} 
            onChange={(e) => setZoom(Number(e.target.value))}
            aria-label="Timeline zoom level"
            aria-valuemin={20}
            aria-valuemax={60}
            aria-valuenow={zoom}
          />
        </label>
        
        {/* Keyboard shortcuts help */}
        <div style={{
          marginLeft: 'auto',
          fontSize: '0.75rem',
          color: 'var(--text-dim)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap'
        }}>
          <span>Shortcuts:</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <code style={{ background: 'var(--input-bg)', padding: '2px 4px', borderRadius: '3px', fontSize: '0.7rem' }}>N</code>
            <span>new</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <code style={{ background: 'var(--input-bg)', padding: '2px 4px', borderRadius: '3px', fontSize: '0.7rem' }}>Del</code>
            <span>delete</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <code style={{ background: 'var(--input-bg)', padding: '2px 4px', borderRadius: '3px', fontSize: '0.7rem' }}>↕</code>
            <span>navigate</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <code style={{ background: 'var(--input-bg)', padding: '2px 4px', borderRadius: '3px', fontSize: '0.7rem' }}>Enter</code>
            <span>edit</span>
          </span>
        </div>
      </div>
      
      {/* Main Content */}
      <div style={{ flex: 1, margin: '16px', marginTop: '12px', minHeight: 0 }}>
        <Board 
          startDate={startDate} 
          skipWeekends={skipWeekends} 
          zoom={zoom} 
          sidebarCollapsed={sidebarCollapsed}
        />
      </div>
      
      {showShareModal && <ShareModal onClose={() => setShowShareModal(false)} />}
    </div>
  );
}
