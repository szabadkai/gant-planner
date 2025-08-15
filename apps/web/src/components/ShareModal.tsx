import { useEffect, useState } from 'react';
import { api } from '../api';

export default function ShareModal({ onClose }: { onClose: () => void }) {
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const generateShareLink = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await api.createShare();
      setShareToken(response.token);
    } catch (err) {
      setError('Failed to generate share link');
      console.error('Error generating share link:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!shareToken) return;
    
    const shareUrl = `${window.location.origin}/share/${shareToken}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 1500);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const shareUrl = shareToken ? `${window.location.origin}/share/${shareToken}` : null;

  return (
    <div 
      style={{ 
        position: 'fixed', 
        inset: 0, 
        background: 'rgba(0,0,0,0.35)', 
        display: 'grid', 
        placeItems: 'center', 
        zIndex: 50 
      }} 
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          background: 'white', 
          padding: 24, 
          borderRadius: 12, 
          minWidth: 400, 
          maxWidth: 500,
          display: 'grid', 
          gap: 16 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: '18px' }}>Share Project</h3>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
          Generate a read-only link to share your project with others. Anyone with this link can view your project but cannot make changes.
        </p>

        {!shareToken ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button 
              onClick={generateShareLink}
              disabled={isGenerating}
              style={{
                padding: '10px 16px',
                backgroundColor: '#007acc',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {isGenerating ? 'Generating...' : 'Generate Share Link'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                Share Link:
              </label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="text"
                  value={shareUrl || ''}
                  readOnly
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: '#f9f9f9'
                  }}
                />
                <button
                  onClick={copyToClipboard}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: copyFeedback ? '#28a745' : '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    minWidth: '70px'
                  }}
                >
                  {copyFeedback ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShareToken(null)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#f8f9fa',
                  color: '#6c757d',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Generate New Link
              </button>
              <button
                onClick={() => window.open(shareUrl || '', '_blank')}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#007acc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Preview Share ↗
              </button>
            </div>
          </div>
        )}

        {error && (
          <div style={{ 
            padding: '8px 12px',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '4px',
            color: '#721c24',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}