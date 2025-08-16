import { useEffect, useState } from 'react';
import type { Task } from '../types';
import { useUpdateTask, useDeleteTask, useAllTasks } from '../hooks';
import { normalizeUrl } from '../lib/url';

export default function EditTaskModal({ task, onClose }: { task: Task; onClose: () => void }) {
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
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    updateTask({ 
      id: task.id, 
      patch: { 
        name: name.trim(), 
        mandays: Math.max(1, Number(mandays)), 
        theme: theme.trim() || undefined, 
        jiraUrl: jiraUrl.trim() || undefined,
        dependencies: dependencies.length > 0 ? JSON.stringify(dependencies) : undefined,
        dueDate: dueDate || undefined,
        priority: priority
      } 
    }, { onSuccess: onClose });
  };

  const onDelete = () => {
    if (!confirm('Delete this task?')) return;
    deleteTask(task.id, { onSuccess: onClose });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'grid', placeItems: 'center', zIndex: 50 }} onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={onSave} style={{ background: 'white', padding: 16, borderRadius: 12, minWidth: 360, display: 'grid', gap: 8 }}>
        <h3 style={{ margin: 0 }}>Edit Task</h3>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Task name" />
        <input value={mandays} onChange={(e) => setMandays(Number(e.target.value))} type="number" min={1} />
        <input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="Theme" />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input value={jiraUrl} onChange={(e) => setJiraUrl(e.target.value)} placeholder="Jira URL" style={{ flex: 1 }} />
          {jiraUrl ? (
            <a href={normalizeUrl(jiraUrl)} target="_blank" rel="noopener noreferrer" title="Open link">↗︎</a>
          ) : null}
        </div>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="HIGH">High Priority</option>
          <option value="MEDIUM">Medium Priority</option>
          <option value="LOW">Low Priority</option>
        </select>
        <input 
          type="date" 
          value={dueDate} 
          onChange={(e) => setDueDate(e.target.value)} 
          placeholder="Due Date" 
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Dependencies:</label>
          <select 
            multiple 
            value={dependencies} 
            onChange={(e) => setDependencies(Array.from(e.target.selectedOptions, option => option.value))}
            style={{ minHeight: '100px' }}
          >
            {allTasks?.filter(t => t.id !== task.id).map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <small style={{ color: '#666' }}>Hold Ctrl/Cmd to select multiple tasks</small>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <button type="button" onClick={onDelete} disabled={isDeleting} style={{ background: '#991b1b', borderColor: '#991b1b' }}>Delete</button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={isPending}>Save</button>
          </div>
        </div>
      </form>
    </div>
  );
}
