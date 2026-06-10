'use client';

import { useEffect, useState, useCallback } from 'react';
import { MssCurrent, MssHistoryEntry, ZONE_COLORS } from '../types/mss';
import MssGauge from '../components/MssGauge';
import ZoneDisplay from '../components/ZoneDisplay';
import MssHistory from '../components/MssHistory';
import StrategyPanel from '../components/StrategyPanel';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchCurrent(): Promise<MssCurrent> {
  const res = await fetch(`${API}/api/mss/current`, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error('API error');
  return res.json();
}

async function fetchHistory(): Promise<MssHistoryEntry[]> {
  const res = await fetch(`${API}/api/mss/history?days=30`, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
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
        padding: '0 20px',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #60a5fa, #38bdf8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 700, color: '#0f172a',
          }}>
            M
          </div>
          <div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14 }}>
              MSS Sentinel v2
            </div>
            <div className="header-subtitle" style={{ color: 'var(--text-dim)', fontSize: 11 }}>
              Discipline Engine
            </div>
          </div>
        </div>
        <div className="header-meta">
          {current && !current.status && (
            <span style={{ fontSize: 11, color: 'var(--text-dim)', display: 'flex', alignItems: 'center' }}>
              {current.stale
                ? <><span className="dot-stale" />Stale</>
                : <><span className="dot-live" />Live</>
              }
              <span style={{ marginLeft: 4 }}>· {current.dataAgeMinutes}m ago</span>
            </span>
          )}
          <span style={{ color: 'var(--text-dim)', fontSize: 11 }} suppressHydrationWarning>
            {lastRefresh.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            onClick={refresh}
            style={{
              background: 'var(--bg-hover)',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: 17,
              width: 34,
              height: 34,
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s',
            }}
            title="Refresh"
          >
            ↻
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
        <div className="main-grid">
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

            {/* VIX & F&G Index */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'VIX', raw: current.vix, score: current.vixScore, source: current.dataSourceVix },
                { label: 'F&G', raw: current.fng, score: current.fngScore, source: current.dataSourceFng },
              ].map(({ label, raw, score, source }) => (
                <div key={label} style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-dim)',
                  borderRadius: 8,
                  padding: '8px 12px',
                }}>
                  <div className="label" style={{ marginBottom: 4 }}>{label} INDEX</div>
                  <div style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 600 }}>{raw}</div>
                  <div style={{ color: 'var(--text-dim)', fontSize: 10, marginTop: 2 }}>
                    Score: {score.toFixed(1)} · {source}
                  </div>
                </div>
              ))}
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

            {/* Strategy Panel */}
            <StrategyPanel />

            {/* History chart */}
            <div className="panel" style={{ padding: 16 }}>
              <MssHistory data={history} />
            </div>

            {/* Zone reference table */}
            <div className="panel" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div className="label">DECISION MATRIX</div>
                <a href="/katanomi" style={{ fontSize: 10, color: 'var(--accent-blue)', textDecoration: 'none' }}>
                  Κατανομή →
                </a>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['MSS', 'ΖΩΝΗ', 'ΕΝΕΡΓΕΙΑ', 'SPX DRAWDOWN'].map((h) => (
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
                    { range: '95–100', zone: 'TOTAL PANIC', action: 'Ανάπτυξε 80%', drawdown: '≥15%', color: '#f87171' },
                    { range: '85–94', zone: 'HIGH FEAR', action: 'Ανάπτυξε 50%', drawdown: '≥8%', color: '#fb923c' },
                    { range: '65–84', zone: 'FEAR', action: 'Ανάπτυξε 25%', drawdown: '≥3%', color: '#fcd34d' },
                    { range: '40–64', zone: 'NEUTRAL', action: 'Κράτα', drawdown: '—', color: '#94a3b8' },
                    { range: '20–39', zone: 'GREED', action: 'Έλεγξε δορυφόρους', drawdown: '—', color: '#86efac' },
                    { range: '0–19', zone: 'HIGH GREED', action: 'Έλεγξε δορυφόρους', drawdown: '—', color: '#4ade80' },
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
                        <td style={{ padding: '6px 8px', color: 'var(--text-dim)', fontSize: 10 }}>
                          {row.drawdown}
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
        <span>MSS Sentinel v2 — Discipline Engine</span>
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
