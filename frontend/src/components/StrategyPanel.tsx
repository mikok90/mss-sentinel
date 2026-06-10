'use client';

import { useState } from 'react';

const PRINCIPLES = [
  'ΔΕΝ πουλάμε δείκτες. Ποτέ. Μόνο αγοράζουμε σε πτώσεις.',
  'DCA συνεχίζεται κάθε μήνα ανεξαρτήτως ζώνης.',
  'Deploy μόνο όταν SPX drawdown επιβεβαιώνει την πτώση.',
  'Κατανομή-στόχος: ΔΕΙΚΤΗΣ 70% | ΚΟΛΟΣΣΟΣ 20% | RISKY 10%.',
  'Καμία θέση δεν ξεπερνά το 10% του συνολικού χαρτοφυλακίου.',
];

export default function StrategyPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      background: 'var(--bg-panel)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          color: 'var(--text-primary)',
        }}
      >
        <span style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-dim)' }}>
          ΑΡΧΕΣ ΠΕΙΘΑΡΧΙΑΣ
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ padding: '0 16px 14px' }}>
          {PRINCIPLES.map((p, i) => (
            <div key={i} style={{
              fontSize: 11,
              color: 'var(--text-secondary)',
              padding: '5px 0',
              borderTop: i > 0 ? '1px solid var(--border-dim)' : 'none',
              display: 'flex',
              gap: 8,
            }}>
              <span style={{ color: 'var(--text-dim)', fontWeight: 600, minWidth: 16 }}>{i + 1}.</span>
              {p}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
