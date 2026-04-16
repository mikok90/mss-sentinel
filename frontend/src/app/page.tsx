'use client';

import { useEffect, useState, useCallback } from 'react';
import { MssCurrent, MssHistoryEntry, ZONE_COLORS } from '../types/mss';
import MssGauge from '../components/MssGauge';
import ZoneDisplay from '../components/ZoneDisplay';
import MssHistory from '../components/MssHistory';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchCurrent(): Promise<MssCurrent> {
  const res = await fetch(`${API}/api/mss/current`, { cache: 'no-store' });
  if (!res.ok) throw new Error('API error');
  return res.json();
}

async function fetchHistory(): Promise<MssHistoryEntry[]> {
  const res = await fetch(`${API}/api/mss/history?days=30`, { cache: 'no-store' });
  if (!res.ok) throw new Error('API error');
  return res.json();
}

function formatTimestamp(ts: string): string {
  return new Date(ts).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export default function Dashboard() {
  const [current, setCurrent] = useState<MssCurrent | null>(null);
  const [history, setHistory] = useState<MssHistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const refresh = useCallback(async () => {
    try {
      const [cur, hist] = await Promise.all([fetchCurrent(), fetchHistory()]);
      setCurrent(cur);
      setHistory(hist);
      setError(null);
      setLastRefresh(new Date());
    } catch (e) {
      setError('Cannot reach backend API. Is it running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 60_000); // auto-refresh every minute
    return () => clearInterval(timer);
  }, [refresh]);

  const color = current?.zone ? ZONE_COLORS[current.zone] : '#6b7280';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '0 0 40px' }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-panel)',
        padding: '0 24px',
        height: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{
            color: 'var(--accent-cyan)',
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: '0.08em',
          }}>
            ■ MSS SENTINEL
          </span>
          <span style={{ color: 'var(--text-dim)', fontSize: 10 }}>
            MULTI-FACTOR SENTIMENT SCORE
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {current && !current.status && (
            <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>
              {current.stale
                ? <><span className="dot-stale" />STALE</>
                : <><span className="dot-live" />LIVE</>
              } · {current.dataAgeMinutes}min ago
            </span>
          )}
          <span style={{ color: 'var(--text-dim)', fontSize: 10 }} suppressHydrationWarning>
            {lastRefresh.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <button
            onClick={refresh}
            style={{
              background: 'none', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', fontSize: 10, padding: '3px 10px',
              borderRadius: 3, cursor: 'pointer', fontFamily: 'var(--font)',
              letterSpacing: '0.08em',
            }}
          >
            ↻ REFRESH
          </button>
        </div>
      </header>

      {/* ── Error ──────────────────────────────────────────────────────── */}
      {error && (
        <div style={{
          margin: '16px 24px 0',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid #ef4444',
          borderRadius: 4,
          padding: '10px 16px',
          color: '#ef4444',
          fontSize: 11,
        }}>
          ⚠ {error}
        </div>
      )}

      {/* ── Loading ────────────────────────────────────────────────────── */}
      {loading && !error && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: 300, color: 'var(--text-dim)', fontSize: 12,
        }}>
          Loading MSS data...
        </div>
      )}

      {/* ── Data Unavailable ───────────────────────────────────────────── */}
      {current?.status && (
        <div style={{
          margin: '16px 24px 0',
          background: 'rgba(251,191,36,0.08)',
          border: '1px solid #fbbf24',
          borderRadius: 4,
          padding: '10px 16px',
          color: '#fbbf24',
          fontSize: 11,
        }}>
          ⚠ {current.message}
        </div>
      )}

      {/* ── Main Content ───────────────────────────────────────────────── */}
      {current && !current.status && !loading && (
        <div style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '20px 24px',
          display: 'grid',
          gridTemplateColumns: '280px 1fr',
          gap: 20,
        }}>
          {/* LEFT: Gauge + meta */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Gauge */}
            <div className="panel" style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <MssGauge mss={current.mss} zone={current.zone} size={220} />

              {/* Market status */}
              <div style={{
                fontSize: 10,
                color: current.marketOpen ? 'var(--green)' : '#fbbf24',
                textAlign: 'center',
                letterSpacing: '0.08em',
              }}>
                {current.marketOpen ? '● MARKET OPEN' : '○ MARKET CLOSED'}
              </div>

              {/* Stale warning */}
              {current.stale && (
                <div style={{ color: '#fbbf24', fontSize: 10, textAlign: 'center' }}>
                  ⚠ Data is {current.dataAgeMinutes}min old
                </div>
              )}
            </div>

            {/* Timestamps */}
            <div className="panel" style={{ padding: '10px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span className="label">LAST UPDATE</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
                  {formatTimestamp(current.timestamp)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="label">NEXT UPDATE</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
                  {formatTimestamp(current.nextUpdate)}
                </span>
              </div>
            </div>

            {/* Formula breakdown */}
            <div className="panel" style={{ padding: '10px 14px' }}>
              <div className="label" style={{ marginBottom: 8 }}>MSS FORMULA</div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', lineHeight: 1.8 }}>
                <div>V = (VIX−12)/(40−12) × 100</div>
                <div>= ({current.vix}−12)/28 × 100</div>
                <div style={{ color: 'var(--text-secondary)' }}>= {current.vixScore.toFixed(1)}</div>
                <div style={{ marginTop: 6 }}>FG = 100 − F&G</div>
                <div>= 100 − {current.fng}</div>
                <div style={{ color: 'var(--text-secondary)' }}>= {current.fngScore.toFixed(1)}</div>
                <div style={{ marginTop: 6, borderTop: '1px solid var(--border-dim)', paddingTop: 6 }}>
                  MSS = 0.70×V + 0.30×FG
                </div>
                <div>= 0.70×{current.vixScore.toFixed(1)} + 0.30×{current.fngScore.toFixed(1)}</div>
                <div style={{ color, fontWeight: 600, fontSize: 12 }}>= {current.mss.toFixed(1)}</div>
              </div>
            </div>
          </div>

          {/* RIGHT: Zone + History */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Zone & Action */}
            <div className="panel" style={{ padding: 16 }}>
              <ZoneDisplay data={current} />
            </div>

            {/* History chart */}
            <div className="panel" style={{ padding: 16 }}>
              <MssHistory data={history} />
            </div>

            {/* Zone reference table */}
            <div className="panel" style={{ padding: 16 }}>
              <div className="label" style={{ marginBottom: 12 }}>DECISION MATRIX</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['MSS RANGE', 'ZONE', 'ACTION'].map((h) => (
                      <th key={h} style={{
                        textAlign: 'left', padding: '4px 8px',
                        color: 'var(--text-dim)', fontSize: 9,
                        letterSpacing: '0.1em', fontWeight: 500,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { range: '95–100', zone: 'TOTAL PANIC', action: 'Deploy 80% of cash', color: '#ef4444' },
                    { range: '85–94', zone: 'HIGH FEAR', action: 'Deploy 50% of cash', color: '#f97316' },
                    { range: '65–84', zone: 'FEAR', action: 'Deploy 25% of cash', color: '#fbbf24' },
                    { range: '40–64', zone: 'NEUTRAL', action: 'HOLD — do nothing', color: '#6b7280' },
                    { range: '20–39', zone: 'GREED', action: 'Trim 15% of portfolio', color: '#86efac' },
                    { range: '0–19', zone: 'HIGH GREED', action: 'Trim 25% of portfolio', color: '#00ff41' },
                  ].map((row) => {
                    const isActive = current?.zoneLabel?.toUpperCase() === row.zone.toUpperCase();
                    return (
                      <tr key={row.zone} style={{
                        borderBottom: '1px solid var(--border-dim)',
                        background: isActive ? `rgba(${hexToRgb(row.color)},0.08)` : 'transparent',
                      }}>
                        <td style={{ padding: '6px 8px', color: 'var(--text-dim)', fontSize: 10 }}>
                          {row.range}
                        </td>
                        <td style={{ padding: '6px 8px', color: row.color, fontSize: 10, fontWeight: isActive ? 700 : 400 }}>
                          {isActive ? '► ' : ''}{row.zone}
                        </td>
                        <td style={{ padding: '6px 8px', color: 'var(--text-secondary)', fontSize: 10 }}>
                          {row.action}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '12px 24px',
        color: 'var(--text-dim)',
        fontSize: 10,
        display: 'flex',
        justifyContent: 'space-between',
        maxWidth: 1100,
        margin: '20px auto 0',
      }}>
        <span>MSS Sentinel — Contrarian market sentiment monitor</span>
        <span>VIX (70%) + Fear & Greed (30%) · Updates every 30 min</span>
      </footer>
    </div>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
