import { useEffect, useState } from 'react';
import type { Task } from '../types';
import { useUpdateTask, useDeleteTask } from '../hooks';
import { normalizeUrl } from '../lib/url';

export default function EditTaskModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const [name, setName] = useState(task.name);
  const [mandays, setMandays] = useState<number>(task.mandays);
  const [theme, setTheme] = useState<string>(task.theme || '');
  const [jiraUrl, setJiraUrl] = useState<string>(task.jiraUrl || '');
  const { mutate: updateTask, isPending } = useUpdateTask();
  const { mutate: deleteTask, isPending: isDeleting } = useDeleteTask();

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    updateTask({ id: task.id, patch: { name: name.trim(), mandays: Math.max(1, Number(mandays)), theme: theme.trim() || undefined, jiraUrl: jiraUrl.trim() || undefined } }, { onSuccess: onClose });
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
