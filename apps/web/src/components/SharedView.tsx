import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { useSharedStaff, useSharedBacklog, useSharedThemes } from '../sharedHooks';
import { api } from '../api';
import TaskCard from './TaskCard';
import Gantt from './Gantt';
import ThemesPanel from './ThemesPanel';

export default function SharedView() {
  const { token } = useParams<{ token: string }>();
  const [themeFilter, setThemeFilter] = useState<string | null>(null);
  const [startDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [skipWeekends] = useState(true);
  const [zoom] = useState(28);

  const { data: staff, isLoading: staffLoading, error: staffError } = useSharedStaff(token || '');
  const { data: backlog, isLoading: backlogLoading } = useSharedBacklog(token || '');
  const { data: themes } = useSharedThemes(token || '');

  const staffList = staff ?? [];
  const tasksQueries = useQueries({
    queries: staffList.map((s) => ({
      queryKey: ['shared', 'tasks', 'staff', token, s.id],
      queryFn: () => api.getSharedTasks(token || '', { staff_id: s.id }),
      enabled: !!token && !!s.id,
    })),
  });

  const loading = staffLoading || backlogLoading;
  const error = staffError ? 'Failed to load shared project' : null;

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif'
      }}>
        Loading shared project...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        fontFamily: 'system-ui, sans-serif',
        gap: '16px'
      }}>
        <h2 style={{ color: '#dc3545', margin: 0 }}>Error</h2>
        <p style={{ margin: 0, color: '#666' }}>{error}</p>
      </div>
    );
  }

  // Combine all tasks for the Gantt component
  const allTasks = [
    ...(backlog || []),
    ...tasksQueries.flatMap((q) => q.data ?? [])
  ];

  return (
    <div style={{ padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>Shared Gantt Project (Read Only)</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="row no-wrap" style={{ marginBottom: 0 }}>
            <label style={{ color: 'var(--text-dim)', flex: '0 0 auto' }}>
              Start <input type="date" value={startDate} disabled style={{ background: '#f5f5f5' }} />
            </label>
            <label style={{ color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: 6, flex: '0 0 auto' }}>
              <input type="checkbox" checked={skipWeekends} disabled /> Skip weekends
            </label>
            <label style={{ color: 'var(--text-dim)', flex: '0 0 auto' }}>
              Zoom <input type="range" min={20} max={60} value={zoom} disabled style={{ opacity: 0.5 }} />
            </label>
          </div>
          <div style={{ 
            padding: '4px 8px', 
            background: '#e3f2fd', 
            borderRadius: '4px', 
            fontSize: '12px', 
            color: '#1976d2',
            border: '1px solid #bbdefb'
          }}>
            📤 Shared View
          </div>
        </div>
      </div>
      
      <div className="layout">
        <aside className="sidebar">
          <div className="panel">
            <h2>Backlog</h2>
            <p style={{ fontSize: '12px', color: '#666', margin: '8px 0' }}>
              Read-only view of unassigned tasks
            </p>
            <div className="list">
              {(backlog || []).map((task) => (
                <div key={task.id} style={{ marginBottom: '4px' }}>
                  <TaskCard 
                    task={task} 
                    onEdit={() => {}} 
                    dim={!!(themeFilter && (task.theme || '').trim() && task.theme !== themeFilter)} 
                  />
                </div>
              ))}
              {(backlog || []).length === 0 && (
                <p style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>
                  No unassigned tasks
                </p>
              )}
            </div>
          </div>
          
          <div className="panel">
            <h2>Staff</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {staffList.map((s, i) => (
                <div key={s.id} style={{ 
                  padding: '8px', 
                  background: '#f8f9fa', 
                  borderRadius: '4px',
                  fontSize: '14px'
                }}>
                  <strong>{s.name}</strong>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                    {(tasksQueries[i]?.data || []).length} task(s)
                  </div>
                </div>
              ))}
              {staffList.length === 0 && (
                <p style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>
                  No staff members
                </p>
              )}
            </div>
          </div>
          
          <div className="panel">
            <ThemesPanel 
              selected={themeFilter} 
              onSelect={(t) => setThemeFilter(t || null)} 
            />
          </div>
        </aside>
        
        <main className="main">
          <div className="panel" style={{ padding: 0 }}>
            <Gantt 
              onSelectTask={() => {}} // No-op for shared view
              themeFilter={themeFilter} 
              startDate={startDate} 
              skipWeekends={skipWeekends} 
              zoom={zoom} 
            />
          </div>
        </main>
      </div>
    </div>
  );
}