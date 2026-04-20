'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface MssCurrent {
  mss: number;
  zone: string;
  zoneLabel: string;
  action: string;
  actionDetail: string;
  color: string;
  vix: number;
  fng: number;
  dataAgeMinutes: number;
  stale: boolean;
  status?: string;
  message?: string;
}

export default function Widget() {
  const [data, setData] = useState<MssCurrent | null>(null);
  const [error, setError] = useState(false);

  const load = async () => {
    try {
      const res = await fetch(`${API}/api/mss/current`, { cache: 'no-store' });
      if (!res.ok) throw new Error();
      setData(await res.json());
      setError(false);
    } catch {
      setError(true);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(t);
  }, []);

  const bg = data?.color ?? '#1a1a2e';
  const textColor = isLight(bg) ? '#0a0a0f' : '#e2e8f0';

  return (
    <div style={{
      minHeight: '100vh',
      background: bg + '18',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'JetBrains Mono', monospace",
      padding: 16,
    }}>
      {error && (
        <div style={{ color: '#ef4444', fontSize: 12, textAlign: 'center' }}>
          ⚠ Cannot reach API
        </div>
      )}

      {data && !data.status && (
        <div style={{
          background: '#0f0f1a',
          border: `2px solid ${data.color}`,
          borderRadius: 12,
          padding: '20px 28px',
          textAlign: 'center',
          width: '100%',
          maxWidth: 300,
          boxShadow: `0 0 24px ${data.color}44`,
        }}>
          {/* MSS number */}
          <div style={{ color: data.color, fontSize: 64, fontWeight: 700, lineHeight: 1 }}>
            {data.mss.toFixed(0)}
          </div>
          <div style={{ color: '#475569', fontSize: 10, letterSpacing: '0.15em', marginTop: 2 }}>
            MSS SCORE
          </div>

          {/* Zone */}
          <div style={{
            color: data.color,
            fontSize: 16,
            fontWeight: 600,
            marginTop: 14,
            letterSpacing: '0.08em',
          }}>
            {data.zoneLabel.toUpperCase()}
          </div>

          {/* Action */}
          <div style={{
            color: '#94a3b8',
            fontSize: 11,
            marginTop: 8,
            lineHeight: 1.5,
          }}>
            {data.actionDetail}
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid #1e1e35', margin: '14px 0' }} />

          {/* VIX + F&G */}
          <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: 11 }}>
            <div>
              <div style={{ color: '#475569', fontSize: 9, letterSpacing: '0.1em' }}>VIX</div>
              <div style={{ color: '#e2e8f0', fontWeight: 600 }}>{data.vix.toFixed(1)}</div>
            </div>
            <div>
              <div style={{ color: '#475569', fontSize: 9, letterSpacing: '0.1em' }}>F&amp;G</div>
              <div style={{ color: '#e2e8f0', fontWeight: 600 }}>{data.fng}</div>
            </div>
            <div>
              <div style={{ color: '#475569', fontSize: 9, letterSpacing: '0.1em' }}>AGE</div>
              <div style={{ color: data.stale ? '#fbbf24' : '#94a3b8', fontWeight: 600 }}>
                {data.dataAgeMinutes}m
              </div>
            </div>
          </div>
        </div>
      )}

      {data?.status && (
        <div style={{ color: '#fbbf24', fontSize: 11, textAlign: 'center' }}>
          ⚠ {data.message}
        </div>
      )}
    </div>
  );
}

function isLight(hex: string): boolean {
  if (!hex.startsWith('#') || hex.length < 7) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}
