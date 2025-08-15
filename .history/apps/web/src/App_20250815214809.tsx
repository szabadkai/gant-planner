import Board from './components/Board';
import { useState } from 'react';

export default function App() {
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [skipWeekends, setSkipWeekends] = useState(true);
  const [zoom, setZoom] = useState(28);
  return (
    <div style={{ padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>Levi's Gantt Queue Planner</h1>
        <div className="row no-wrap" style={{ marginBottom: 0 }}>
          <label style={{ color: 'var(--text-dim)', flex: '0 0 auto' }}>Start <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></label>
          <label style={{ color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: 6, flex: '0 0 auto' }}><input type="checkbox" checked={skipWeekends} onChange={(e) => setSkipWeekends(e.target.checked)} /> Skip weekends</label>
          <label style={{ color: 'var(--text-dim)', flex: '0 0 auto' }}>Zoom <input type="range" min={20} max={60} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} /></label>
        </div>
      </div>
      <Board startDate={startDate} skipWeekends={skipWeekends} zoom={zoom} />
    </div>
  );
}
