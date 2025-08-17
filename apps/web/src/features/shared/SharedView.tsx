import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { DndContext } from '@dnd-kit/core';
import {
  useSharedStaff,
  useSharedBacklog,
  useSharedThemes,
  useSharedProject,
} from '../../shared/hooks/sharedHooks';
import { api } from '../../api';
import TaskCard from '../tasks/TaskCard';
import SharedGantt from './SharedGantt';

export default function SharedView() {
  const { token } = useParams<{ token: string }>();
  const [themeFilters, setThemeFilters] = useState<string[]>([]);
  const [startDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [skipWeekends] = useState(true);
  const [zoom] = useState(28);

  const {
    data: staff,
    isLoading: staffLoading,
    error: staffError,
  } = useSharedStaff(token || '');
  const { data: backlog, isLoading: backlogLoading } = useSharedBacklog(
    token || ''
  );
  const { data: themes } = useSharedThemes(token || '');
  const { data: project } = useSharedProject(token || '');

  const toggleThemeFilter = (theme: string) => {
    setThemeFilters((prev) =>
      prev.includes(theme) ? prev.filter((t) => t !== theme) : [...prev, theme]
    );
  };

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
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        Loading shared project...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          fontFamily: 'system-ui, sans-serif',
          gap: '16px',
        }}
      >
        <h2 style={{ color: '#dc3545', margin: 0 }}>Error</h2>
        <p style={{ margin: 0, color: '#666' }}>{error}</p>
      </div>
    );
  }

  // Create staff tasks mapping for SharedGantt
  const staffTasksMap = staffList.reduce(
    (acc, staff, index) => {
      acc[staff.id] = tasksQueries[index]?.data ?? [];
      return acc;
    },
    {} as { [staffId: string]: any[] }
  );

  return (
    <DndContext onDragStart={() => {}} onDragEnd={() => {}}>
      <div style={{ padding: 16, fontFamily: 'system-ui, sans-serif' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>
            {project?.projectTitle || 'Shared Gantt Project'} (Read Only)
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className='row no-wrap' style={{ marginBottom: 0 }}>
              <label style={{ color: 'var(--text-dim)', flex: '0 0 auto' }}>
                Start{' '}
                <input
                  type='date'
                  value={startDate}
                  disabled
                  style={{
                    background: 'var(--disabled-bg)',
                    color: 'var(--disabled-text)',
                  }}
                />
              </label>
              <label
                style={{
                  color: 'var(--text-dim)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  flex: '0 0 auto',
                }}
              >
                <input type='checkbox' checked={skipWeekends} disabled /> Skip
                weekends
              </label>
              <label style={{ color: 'var(--text-dim)', flex: '0 0 auto' }}>
                Zoom{' '}
                <input
                  type='range'
                  min={20}
                  max={60}
                  value={zoom}
                  disabled
                  style={{ opacity: 0.5 }}
                />
              </label>
            </div>
            <div
              style={{
                padding: '4px 8px',
                background: 'rgba(91, 140, 255, 0.15)',
                borderRadius: '4px',
                fontSize: '12px',
                color: 'var(--accent)',
                border: '1px solid var(--accent)',
              }}
            >
              📤 Shared View
            </div>
          </div>
        </div>

        <div className='layout'>
          <aside className='sidebar'>
            <div className='panel'>
              <h2>Backlog</h2>
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--text-dim)',
                  margin: '8px 0',
                }}
              >
                Read-only view of unassigned tasks
              </p>
              <div className='list'>
                {(backlog || []).map((task) => (
                  <div key={task.id} style={{ marginBottom: '4px' }}>
                    <TaskCard
                      task={task}
                      onEdit={() => {}}
                      dim={
                        !!(
                          themeFilters.length > 0 &&
                          !themeFilters.includes(task.theme || '')
                        )
                      }
                    />
                  </div>
                ))}
                {(backlog || []).length === 0 && (
                  <p
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      fontStyle: 'italic',
                    }}
                  >
                    No unassigned tasks
                  </p>
                )}
              </div>
            </div>

            <div className='panel'>
              <h2>Staff</h2>
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                {staffList.map((s, i) => (
                  <div key={s.id} className='staff-item'>
                    <div className='staff-name'>
                      <strong>{s.name}</strong>
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-dim)',
                          marginTop: '2px',
                        }}
                      >
                        {(tasksQueries[i]?.data || []).length} task(s)
                      </div>
                    </div>
                  </div>
                ))}
                {staffList.length === 0 && (
                  <p
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-dim)',
                      fontStyle: 'italic',
                    }}
                  >
                    No staff members
                  </p>
                )}
              </div>
            </div>

            <div className='panel'>
              <div>
                <h2>Themes</h2>
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  {(themes || [])
                    .filter((x) => (x.theme || '').trim())
                    .map((it) => {
                      const max = Math.max(
                        ...(themes || []).map((x) => x.totalMandays),
                        1
                      );
                      const pct = Math.round((it.totalMandays / max) * 100);
                      const hueFromString = (s: string) => {
                        let h = 0;
                        for (let i = 0; i < s.length; i++) {
                          h = (h << 5) - h + s.charCodeAt(i);
                          h |= 0;
                        }
                        h = h % 360;
                        if (h < 0) h += 360;
                        return h;
                      };
                      const h = hueFromString(it.theme);
                      const isSelected = themeFilters.includes(it.theme);
                      const hasSelections = themeFilters.length > 0;
                      return (
                        <div
                          key={it.theme}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'auto 1fr auto',
                            gap: 8,
                            alignItems: 'center',
                            cursor: 'pointer',
                            opacity: hasSelections && !isSelected ? 0.5 : 1,
                            filter: isSelected ? 'brightness(1.2)' : 'none',
                            borderRadius: '4px',
                            padding: '4px',
                            background: isSelected
                              ? 'rgba(91, 140, 255, 0.1)'
                              : 'transparent',
                            border: isSelected
                              ? '1px solid var(--accent)'
                              : '1px solid transparent',
                          }}
                          onClick={() => toggleThemeFilter(it.theme)}
                        >
                          <div
                            style={{
                              color: 'var(--text-dim)',
                              fontWeight: 600,
                              maxWidth: 120,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {it.theme}
                          </div>
                          <div
                            style={{
                              height: 10,
                              border: '1px solid var(--border)',
                              borderRadius: 999,
                              overflow: 'hidden',
                              background: 'var(--gantt-bg)',
                            }}
                          >
                            <div
                              style={{
                                width: `${pct}%`,
                                height: '100%',
                                background: `linear-gradient(90deg, hsla(${h},70%,60%,0.9), hsla(${(h + 20) % 360},70%,50%,0.9))`,
                              }}
                            />
                          </div>
                          <div
                            style={{
                              color: 'var(--text-dim)',
                              fontWeight: 700,
                            }}
                          >
                            {it.totalMandays}d
                          </div>
                        </div>
                      );
                    })}
                  {(themes || []).length === 0 ? (
                    <div
                      style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}
                    >
                      No themes yet
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </aside>

          <main className='main'>
            <div className='panel' style={{ padding: 0 }}>
              <SharedGantt
                staff={staffList}
                staffTasks={staffTasksMap}
                themeFilters={themeFilters}
                startDate={startDate}
                skipWeekends={skipWeekends}
                zoom={zoom}
              />
            </div>
          </main>
        </div>
      </div>
    </DndContext>
  );
}
