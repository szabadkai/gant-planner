import { useState } from 'react';
import { api } from '../api';

export default function Login({ onLogin }: { onLogin: (user: { id: string; email: string; name: string | null }) => void }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await api.login(email.trim());
      localStorage.setItem('userId', response.user.id);
      onLogin(response.user);
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'var(--background)'
    }}>
      <div style={{
        background: 'var(--surface)',
        padding: '2rem',
        borderRadius: '8px',
        border: '1px solid var(--border)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Login to Gantt</h1>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem' }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                background: 'var(--background)',
                color: 'var(--text)'
              }}
            />
          </div>
          {error && (
            <div style={{ 
              color: 'var(--danger)', 
              marginBottom: '1rem', 
              fontSize: '0.875rem' 
            }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !email.trim()}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: loading ? 'var(--surface)' : 'var(--accent-2)',
              border: '1px solid var(--accent-2)',
              borderRadius: '4px',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p style={{ 
          marginTop: '1rem', 
          fontSize: '0.875rem', 
          color: 'var(--text-dim)',
          textAlign: 'center'
        }}>
          No account needed - just enter your email to get started
        </p>
      </div>
    </div>
  );
}