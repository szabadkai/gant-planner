import { useState, useEffect } from 'react';
import { api } from '../api';

export default function Login({ onLogin }: { onLogin: (user: { id: string; email: string; name: string | null }) => void }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Check for token in URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      setVerifying(true);
      api.verifyToken(token)
        .then(response => {
          localStorage.setItem('userId', response.user.id);
          onLogin(response.user);
          // Clear the token from URL
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch(err => {
          setError('Invalid or expired login link. Please request a new one.');
          console.error('Token verification error:', err);
        })
        .finally(() => setVerifying(false));
    }
  }, [onLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      await api.requestLogin(email.trim());
      setEmailSent(true);
    } catch (err) {
      setError('Failed to send login email. Please try again.');
      console.error('Login request error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--background)',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{
          background: 'var(--surface)',
          padding: '2rem',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          textAlign: 'center'
        }}>
          <h2>Verifying login...</h2>
          <p style={{ color: 'var(--text-dim)' }}>Please wait while we log you in.</p>
        </div>
      </div>
    );
  }

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
        <h1 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          {emailSent ? 'Check Your Email' : 'Login to Gantt'}
        </h1>
        
        {emailSent ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: '1rem', color: 'var(--text)' }}>
              We've sent a magic login link to <strong>{email}</strong>
            </p>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-dim)', fontSize: '0.875rem' }}>
              Click the link in the email to log in. The link will expire in 15 minutes.
            </p>
            <p style={{ marginBottom: '1rem', color: 'var(--text-dim)', fontSize: '0.875rem' }}>
              For development, check the console logs for the magic link.
            </p>
            <button
              onClick={() => {
                setEmailSent(false);
                setEmail('');
                setError('');
              }}
              style={{
                padding: '0.5rem 1rem',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                color: 'var(--text-dim)',
                cursor: 'pointer'
              }}
            >
              Try different email
            </button>
          </div>
        ) : (
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
              {loading ? 'Sending...' : 'Send Magic Link'}
            </button>
          </form>
        )}
        
        {!emailSent && (
          <p style={{ 
            marginTop: '1rem', 
            fontSize: '0.875rem', 
            color: 'var(--text-dim)',
            textAlign: 'center'
          }}>
            We'll send you a secure login link via email
          </p>
        )}
      </div>
    </div>
  );
}