import { useEffect, useState } from 'react';
import type { Task } from '../types';
import { useUpdateTask, useDeleteTask, useAllTasks } from '../hooks';
import { normalizeUrl } from '../lib/url';

export default function EditTaskModal({
  task,
  onClose,
}: {
  task: Task;
  onClose: () => void;
}) {
  const [name, setName] = useState(task.name);
  const [mandays, setMandays] = useState<number>(task.mandays);
  const [theme, setTheme] = useState<string>(task.theme || '');
  const [jiraUrl, setJiraUrl] = useState<string>(task.jiraUrl || '');
  const [dependencies, setDependencies] = useState<string[]>(
    task.dependencies ? JSON.parse(task.dependencies) : []
  );
  const [dueDate, setDueDate] = useState<string>(
    task.dueDate ? task.dueDate.split('T')[0] : ''
  );
  const [priority, setPriority] = useState<string>(task.priority || 'MEDIUM');
  const { mutate: updateTask, isPending } = useUpdateTask();
  const { mutate: deleteTask, isPending: isDeleting } = useDeleteTask();
  const { data: allTasks } = useAllTasks();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    updateTask(
      {
        id: task.id,
        patch: {
          name: name.trim(),
          mandays: Math.max(1, Number(mandays)),
          theme: theme.trim() || undefined,
          jiraUrl: jiraUrl.trim() || undefined,
          dependencies:
            dependencies.length > 0 ? JSON.stringify(dependencies) : undefined,
          dueDate: dueDate || undefined,
          priority: priority,
        },
      },
      { onSuccess: onClose }
    );
  };

  const onDelete = () => {
    if (!confirm('Delete this task?')) return;
    deleteTask(task.id, { onSuccess: onClose });
  };

  const inputStyle = {
    padding: '12px 16px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    background: '#ffffff',
    color: '#1f2937',
    fontSize: '14px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    transition: 'all 0.2s ease',
    outline: 'none',
    ':focus': {
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
    },
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage:
      "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e\")",
    backgroundPosition: 'right 12px center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '16px',
    paddingRight: '40px',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  };

  const isMobile = window.innerWidth < 768;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 50,
        backdropFilter: 'blur(4px)',
        padding: isMobile ? '16px' : '0',
      }}
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSave}
        style={{
          background: 'white',
          padding: isMobile ? '20px' : '32px',
          borderRadius: isMobile ? '12px' : '16px',
          minWidth: isMobile ? 'auto' : '480px',
          maxWidth: isMobile ? '100%' : '560px',
          width: isMobile ? '100%' : '90vw',
          maxHeight: isMobile ? '100%' : '90vh',
          height: isMobile ? '100%' : 'auto',
          overflow: 'auto',
          display: 'grid',
          gap: isMobile ? '20px' : '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            paddingBottom: '20px',
            borderBottom: '1px solid #f3f4f6',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '18px',
              fontWeight: '600',
            }}
          >
            ✏️
          </div>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: '700',
                color: '#1f2937',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              Edit Task
            </h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
              Update task details and dependencies
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gap: isMobile ? '16px' : '20px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
              gap: '16px',
            }}
          >
            <div>
              <label style={labelStyle}>Task Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  isMobile ? 'Task name' : 'Enter a descriptive task name'
                }
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Duration (Days) *</label>
              <input
                value={mandays}
                onChange={(e) => setMandays(Number(e.target.value))}
                type='number'
                min={1}
                max={365}
                style={inputStyle}
                required
              />
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: '16px',
            }}
          >
            <div>
              <label style={labelStyle}>Theme</label>
              <input
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder={
                  isMobile ? 'Theme' : 'e.g., Frontend, Backend, Design'
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={selectStyle}
              >
                <option value='HIGH'>🔴 High Priority</option>
                <option value='MEDIUM'>🟡 Medium Priority</option>
                <option value='LOW'>🟢 Low Priority</option>
              </select>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: '16px',
            }}
          >
            <div>
              <label style={labelStyle}>Jira URL</label>
              <div style={{ position: 'relative' }}>
                <input
                  value={jiraUrl}
                  onChange={(e) => setJiraUrl(e.target.value)}
                  placeholder={
                    isMobile
                      ? 'Jira link'
                      : 'https://company.atlassian.net/browse/...'
                  }
                  style={{
                    ...inputStyle,
                    paddingRight: jiraUrl ? '40px' : '16px',
                  }}
                />
                {jiraUrl ? (
                  <a
                    href={normalizeUrl(jiraUrl)}
                    target='_blank'
                    rel='noopener noreferrer'
                    title='Open in Jira'
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#3b82f6',
                      textDecoration: 'none',
                      fontSize: '16px',
                      background: '#eff6ff',
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    ↗
                  </a>
                ) : null}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Due Date</label>
              <input
                type='date'
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={inputStyle}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Task Dependencies</label>
            <div
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                background: '#fafafa',
                padding: isMobile ? '8px' : '12px',
              }}
            >
              <select
                multiple
                value={dependencies}
                onChange={(e) =>
                  setDependencies(
                    Array.from(
                      e.target.selectedOptions,
                      (option) => option.value
                    )
                  )
                }
                style={{
                  ...selectStyle,
                  minHeight: isMobile ? '100px' : '120px',
                  resize: 'vertical',
                  border: '1px solid #d1d5db',
                  background: '#ffffff',
                  width: '100%',
                  fontSize: isMobile ? '16px' : '14px', // Prevents zoom on iOS
                }}
              >
                {allTasks
                  ?.filter((t) => t.id !== task.id)
                  .map((t) => (
                    <option
                      key={t.id}
                      value={t.id}
                      style={{ padding: isMobile ? '6px' : '8px' }}
                    >
                      {t.name} ({t.mandays}d)
                    </option>
                  ))}
              </select>
              <div
                style={{
                  marginTop: '8px',
                  padding: isMobile ? '6px' : '8px',
                  background: '#f0f9ff',
                  borderRadius: '4px',
                  border: '1px solid #bae6fd',
                }}
              >
                <small
                  style={{
                    color: '#0369a1',
                    fontSize: isMobile ? '11px' : '12px',
                    fontWeight: '500',
                  }}
                >
                  💡{' '}
                  {isMobile
                    ? 'Tap to select dependencies'
                    : 'Hold Ctrl/Cmd to select multiple tasks that must be completed before this task can start'}
                </small>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: isMobile ? 'stretch' : 'space-between',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: isMobile ? '12px' : '0',
            marginTop: '8px',
            paddingTop: isMobile ? '16px' : '24px',
            borderTop: '1px solid #f3f4f6',
          }}
        >
          {/* Mobile: Delete button at bottom, full width */}
          {isMobile ? (
            <>
              <div style={{ display: 'flex', gap: '12px', order: 1 }}>
                <button
                  type='button'
                  onClick={onClose}
                  style={{
                    background: '#ffffff',
                    color: '#6b7280',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '14px 24px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    flex: '1',
                  }}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={isPending || !name.trim()}
                  style={{
                    background: isPending
                      ? '#9ca3af'
                      : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '14px 32px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor:
                      isPending || !name.trim() ? 'not-allowed' : 'pointer',
                    opacity: isPending || !name.trim() ? 0.6 : 1,
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    boxShadow:
                      isPending || !name.trim()
                        ? 'none'
                        : '0 4px 6px -1px rgba(59, 130, 246, 0.1), 0 2px 4px -1px rgba(59, 130, 246, 0.06)',
                    flex: '2',
                  }}
                >
                  {isPending ? '⏳ Saving...' : '💾 Save'}
                </button>
              </div>
              <button
                type='button'
                onClick={onDelete}
                disabled={isDeleting}
                style={{
                  background:
                    'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '14px 20px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  boxShadow: isDeleting
                    ? 'none'
                    : '0 4px 6px -1px rgba(239, 68, 68, 0.1), 0 2px 4px -1px rgba(239, 68, 68, 0.06)',
                  order: 2,
                }}
              >
                🗑️ Delete Task
              </button>
            </>
          ) : (
            /* Desktop: Original layout */
            <>
              <button
                type='button'
                onClick={onDelete}
                disabled={isDeleting}
                style={{
                  background:
                    'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  boxShadow: isDeleting
                    ? 'none'
                    : '0 4px 6px -1px rgba(239, 68, 68, 0.1), 0 2px 4px -1px rgba(239, 68, 68, 0.06)',
                }}
              >
                🗑️ Delete Task
              </button>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type='button'
                  onClick={onClose}
                  style={{
                    background: '#ffffff',
                    color: '#6b7280',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                  }}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={isPending || !name.trim()}
                  style={{
                    background: isPending
                      ? '#9ca3af'
                      : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 32px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor:
                      isPending || !name.trim() ? 'not-allowed' : 'pointer',
                    opacity: isPending || !name.trim() ? 0.6 : 1,
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    boxShadow:
                      isPending || !name.trim()
                        ? 'none'
                        : '0 4px 6px -1px rgba(59, 130, 246, 0.1), 0 2px 4px -1px rgba(59, 130, 246, 0.06)',
                  }}
                >
                  {isPending ? '⏳ Saving...' : '💾 Save Changes'}
                </button>
              </div>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
