import ProjectSelector from './ProjectSelector';

export default function NoProject() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      flexDirection: 'column',
      gap: '24px',
      background: 'var(--bg)',
      color: 'var(--text)'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', margin: '0 0 16px 0', color: 'var(--text)' }}>
          Welcome to Gantt Queue Planner
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-dim)', margin: '0 0 32px 0', maxWidth: '400px' }}>
          Get started by creating a new project or selecting an existing one from the dropdown below.
        </p>
        <ProjectSelector />
      </div>
    </div>
  );
}