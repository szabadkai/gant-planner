import { useEffect, useState } from 'react';
import type { Task } from '../types';
import { useUpdateTask, useDeleteTask, useAllTasks } from '../hooks';
import { normalizeUrl } from '../lib/url';
import { X, Save, Trash2 } from 'lucide-react';

export default function TaskDetailDrawer({
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
  const [notes, setNotes] = useState<string>(''); // New field for notes
  const [isOpen, setIsOpen] = useState(false);

  const { mutate: updateTask, isPending } = useUpdateTask();
  const { mutate: deleteTask, isPending: isDeleting } = useDeleteTask();
  const { data: allTasks } = useAllTasks();

  // Slide-in animation
  useEffect(() => {
    const timer = setTimeout(() => setIsOpen(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Handle escape key and backdrop click
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 300); // Wait for slide-out animation
  };

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
      { onSuccess: handleClose }
    );
  };

  const onDelete = () => {
    if (!confirm('Delete this task?')) return;
    deleteTask(task.id, { onSuccess: handleClose });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--modal-backdrop)',
          zIndex: 40,
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
        onClick={handleClose}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '480px',
          maxWidth: '90vw',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRight: 'none',
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
          borderTopLeftRadius: '8px',
          borderBottomLeftRadius: '8px',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow:
            '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'var(--text)',
                marginBottom: '4px',
              }}
            >
              Task Details
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: '0.875rem',
                color: 'var(--text-dim)',
              }}
            >
              Edit task information and settings
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '8px',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
            }}
            title='Close (Esc)'
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <form
          onSubmit={onSave}
          style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              {/* Task Name - Editable inline */}
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'var(--text)',
                  }}
                >
                  Task Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder='Enter task name'
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    background: 'var(--input-bg)',
                    color: 'var(--text)',
                    fontSize: '1rem',
                    fontWeight: 500,
                  }}
                  required
                />
              </div>

              {/* Duration and Priority */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: 'var(--text)',
                    }}
                  >
                    Duration (Days)
                  </label>
                  <input
                    value={mandays}
                    onChange={(e) => setMandays(Number(e.target.value))}
                    type='number'
                    min={1}
                    max={365}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      background: 'var(--input-bg)',
                      color: 'var(--text)',
                    }}
                    required
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: 'var(--text)',
                    }}
                  >
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      background: 'var(--input-bg)',
                      color: 'var(--text)',
                      cursor: 'pointer',
                    }}
                  >
                    <option value='HIGH'>🔴 High Priority</option>
                    <option value='MEDIUM'>🟡 Medium Priority</option>
                    <option value='LOW'>🟢 Low Priority</option>
                  </select>
                </div>
              </div>

              {/* Theme and Due Date */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: 'var(--text)',
                    }}
                  >
                    Theme
                  </label>
                  <input
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    placeholder='e.g., Frontend, Backend'
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      background: 'var(--input-bg)',
                      color: 'var(--text)',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: 'var(--text)',
                    }}
                  >
                    Due Date
                  </label>
                  <input
                    type='date'
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      background: 'var(--input-bg)',
                      color: 'var(--text)',
                    }}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              {/* Jira URL */}
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'var(--text)',
                  }}
                >
                  Jira URL
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    value={jiraUrl}
                    onChange={(e) => setJiraUrl(e.target.value)}
                    placeholder='https://company.atlassian.net/browse/...'
                    style={{
                      width: '100%',
                      padding: '12px',
                      paddingRight: jiraUrl ? '48px' : '12px',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      background: 'var(--input-bg)',
                      color: 'var(--text)',
                    }}
                  />
                  {jiraUrl && (
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
                        color: 'var(--accent)',
                        textDecoration: 'none',
                        fontSize: '16px',
                        background: 'var(--panel)',
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid var(--border)',
                      }}
                    >
                      ↗
                    </a>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'var(--text)',
                  }}
                >
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder='Add any additional notes or comments...'
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    background: 'var(--input-bg)',
                    color: 'var(--text)',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Dependencies */}
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'var(--text)',
                  }}
                >
                  Dependencies
                </label>
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
                    width: '100%',
                    minHeight: '120px',
                    padding: '12px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    background: 'var(--input-bg)',
                    color: 'var(--text)',
                  }}
                >
                  {allTasks
                    ?.filter((t) => t.id !== task.id)
                    .map((t) => (
                      <option
                        key={t.id}
                        value={t.id}
                        style={{ padding: '4px' }}
                      >
                        {t.name} ({t.mandays}d)
                      </option>
                    ))}
                </select>
                <p
                  style={{
                    margin: '8px 0 0 0',
                    fontSize: '0.75rem',
                    color: 'var(--text-dim)',
                  }}
                >
                  Hold Ctrl/Cmd to select multiple tasks that must be completed
                  before this task
                </p>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              padding: '24px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <button
              type='button'
              onClick={onDelete}
              disabled={isDeleting}
              style={{
                background: 'var(--danger)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 16px',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                opacity: isDeleting ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Trash2 size={16} />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type='button'
                onClick={handleClose}
                style={{
                  background: 'transparent',
                  color: 'var(--text-dim)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '10px 20px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={isPending || !name.trim()}
                style={{
                  background: isPending
                    ? 'var(--disabled-bg)'
                    : 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 24px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: isPending || !name.trim() ? 'not-allowed' : 'pointer',
                  opacity: isPending || !name.trim() ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Save size={16} />
                {isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
