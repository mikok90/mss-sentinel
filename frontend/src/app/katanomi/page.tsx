'use client';

import { useEffect, useState, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Position {
  id: number;
  name: string;
  value: number;
  category: string;
}

const CATEGORIES = ['ΔΕΙΚΤΗΣ', 'ΚΟΛΟΣΣΟΣ', 'RISKY'] as const;
const TARGET_PCT: Record<string, number> = { 'ΔΕΙΚΤΗΣ': 70, 'ΚΟΛΟΣΣΟΣ': 20, 'RISKY': 10 };
const CAT_COLORS: Record<string, string> = { 'ΔΕΙΚΤΗΣ': '#60a5fa', 'ΚΟΛΟΣΣΟΣ': '#fbbf24', 'RISKY': '#f87171' };

export default function KatanomiPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/positions`, { signal: AbortSignal.timeout(10000) });
      if (res.ok) setPositions(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const total = positions.reduce((s, p) => s + Number(p.value), 0);

  const catTotals: Record<string, number> = {};
  for (const cat of CATEGORIES) catTotals[cat] = 0;
  for (const p of positions) catTotals[p.category] = (catTotals[p.category] || 0) + Number(p.value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numVal = parseFloat(value);
    if (!name.trim() || isNaN(numVal) || numVal <= 0) return;

    if (editId !== null) {
      await fetch(`${API}/api/positions/${editId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), value: numVal, category }),
      });
      setEditId(null);
    } else {
      await fetch(`${API}/api/positions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), value: numVal, category }),
      });
    }
    setName(''); setValue(''); setCategory(CATEGORIES[0]);
    load();
  };

  const handleEdit = (p: Position) => {
    setEditId(p.id);
    setName(p.name);
    setValue(String(p.value));
    setCategory(p.category);
  };

  const handleDelete = async (id: number) => {
    await fetch(`${API}/api/positions/${id}`, { method: 'DELETE' });
    load();
  };

  const warnings: string[] = [];
  for (const cat of CATEGORIES) {
    const pct = total > 0 ? (catTotals[cat] / total) * 100 : 0;
    const diff = Math.abs(pct - TARGET_PCT[cat]);
    if (diff > 5 && total > 0) {
      warnings.push(`${cat}: ${pct.toFixed(0)}% (στόχος ${TARGET_PCT[cat]}%) — απόκλιση ${diff.toFixed(0)}%`);
    }
  }
  for (const p of positions) {
    if (total > 0 && (Number(p.value) / total) * 100 > 10) {
      warnings.push(`${p.name}: ${((Number(p.value) / total) * 100).toFixed(0)}% — ξεπερνά το 10% του συνόλου`);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '0 0 40px' }}>
      <header style={{
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-panel)',
        padding: '0 20px',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <a href="/" style={{ color: 'var(--text-dim)', textDecoration: 'none', fontSize: 14 }}>←</a>
        <div>
          <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14 }}>Κατανομή</div>
          <div style={{ color: 'var(--text-dim)', fontSize: 11 }}>Allocation Tracker</div>
        </div>
      </header>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 16px' }}>
        {/* Allocation bars */}
        <div className="panel" style={{ padding: 16, marginBottom: 16 }}>
          <div className="label" style={{ marginBottom: 12 }}>ΚΑΤΑΝΟΜΗ vs ΣΤΟΧΟΣ</div>
          {CATEGORIES.map((cat) => {
            const pct = total > 0 ? (catTotals[cat] / total) * 100 : 0;
            const target = TARGET_PCT[cat];
            const clr = CAT_COLORS[cat];
            return (
              <div key={cat} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  <span>{cat}</span>
                  <span>{pct.toFixed(0)}% / {target}%</span>
                </div>
                <div style={{ height: 8, background: 'var(--bg-hover)', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: clr, borderRadius: 4, transition: 'width 0.3s' }} />
                  <div style={{ position: 'absolute', top: 0, left: `${target}%`, width: 2, height: '100%', background: 'var(--text-dim)', opacity: 0.5 }} />
                </div>
              </div>
            );
          })}
          <div style={{ fontSize: 12, color: 'var(--text-primary)', marginTop: 8, textAlign: 'right' }}>
            Σύνολο: €{total.toLocaleString('el-GR', { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid #fbbf24', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
            {warnings.map((w, i) => (
              <div key={i} style={{ fontSize: 11, color: '#fbbf24', padding: '2px 0' }}>⚠ {w}</div>
            ))}
          </div>
        )}

        {/* Add/Edit form */}
        <div className="panel" style={{ padding: 16, marginBottom: 16 }}>
          <div className="label" style={{ marginBottom: 10 }}>{editId ? 'ΕΠΕΞΕΡΓΑΣΙΑ' : 'ΠΡΟΣΘΗΚΗ ΘΕΣΗΣ'}</div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Όνομα"
              style={{ flex: '1 1 120px', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', color: 'var(--text-primary)', fontSize: 12 }}
            />
            <input
              value={value} onChange={(e) => setValue(e.target.value)}
              placeholder="Αξία €" type="number" step="0.01" min="0"
              style={{ flex: '0 0 100px', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', color: 'var(--text-primary)', fontSize: 12 }}
            />
            <select
              value={category} onChange={(e) => setCategory(e.target.value)}
              style={{ flex: '0 0 130px', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', color: 'var(--text-primary)', fontSize: 12 }}
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button type="submit" style={{
              background: 'var(--accent-blue)', border: 'none', borderRadius: 6,
              padding: '6px 14px', color: '#0f172a', fontWeight: 600, fontSize: 12, cursor: 'pointer',
            }}>
              {editId ? 'Αποθήκευση' : 'Προσθήκη'}
            </button>
            {editId && (
              <button type="button" onClick={() => { setEditId(null); setName(''); setValue(''); setCategory(CATEGORIES[0]); }}
                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 14px', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>
                Ακύρωση
              </button>
            )}
          </form>
        </div>

        {/* Positions list */}
        <div className="panel" style={{ padding: 16 }}>
          <div className="label" style={{ marginBottom: 10 }}>ΘΕΣΕΙΣ</div>
          {loading && <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Loading...</div>}
          {!loading && positions.length === 0 && (
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Δεν υπάρχουν θέσεις.</div>
          )}
          {positions.map((p) => {
            const pct = total > 0 ? ((Number(p.value) / total) * 100).toFixed(1) : '0.0';
            const clr = CAT_COLORS[p.category] || 'var(--text-dim)';
            return (
              <div key={p.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 0', borderBottom: '1px solid var(--border-dim)',
              }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: clr }}>{p.category} · {pct}%</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    €{Number(p.value).toLocaleString('el-GR', { minimumFractionDigits: 2 })}
                  </span>
                  <button onClick={() => handleEdit(p)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 12 }}>✎</button>
                  <button onClick={() => handleDelete(p.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 12 }}>✕</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
