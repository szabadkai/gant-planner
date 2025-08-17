import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

function hueFromString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  h = h % 360;
  if (h < 0) h += 360;
  return h;
}

export default function ThemesPanel({
  selectedThemes,
  onToggle,
}: {
  selectedThemes?: string[];
  onToggle?: (theme: string) => void;
}) {
  const { data } = useQuery({
    queryKey: ['themes'],
    queryFn: api.themesSummary,
  });
  const items = (data ?? []).filter((x) => (x.theme || '').trim());
  const max = items.reduce((m, x) => Math.max(m, x.totalMandays), 0) || 1;
  return (
    <div>
      <h2>Themes</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((it) => {
          const pct = Math.round((it.totalMandays / max) * 100);
          const h = hueFromString(it.theme);
          const isSelected = selectedThemes?.includes(it.theme) || false;
          const hasSelections = (selectedThemes?.length || 0) > 0;
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
              onClick={() => onToggle?.(it.theme)}
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
              <div style={{ color: 'var(--text-dim)', fontWeight: 700 }}>
                {it.totalMandays}d
              </div>
            </div>
          );
        })}
        {items.length === 0 ? (
          <div style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>
            No themes yet
          </div>
        ) : null}
      </div>
    </div>
  );
}
