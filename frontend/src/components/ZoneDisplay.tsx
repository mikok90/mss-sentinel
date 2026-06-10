'use client';

import { MssCurrent, ZONE_COLORS, ZONE_BG } from '../types/mss';

interface Props {
  data: MssCurrent;
}

const ACTION_ICONS: Record<string, string> = {
  DEPLOY: '↑ ΑΓΟΡΑ',
  REVIEW: '⟳ ΕΛΕΓΧΟΣ',
  HOLD: '— ΚΡΑΤΑ',
};

export default function ZoneDisplay({ data }: Props) {
  const color = ZONE_COLORS[data.zone] || '#6b7280';
  const bg = ZONE_BG[data.zone] || 'transparent';
  const isExtreme = data.zone === 'EXTREME_PANIC';
  const actionIcon = ACTION_ICONS[data.action] || data.action;
  const isDeploy = data.action === 'DEPLOY';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Zone Badge */}
      <div
        style={{
          background: bg,
          border: `1px solid ${color}`,
          borderRadius: 8,
          padding: '10px 16px',
        }}
        className={isExtreme ? 'flash' : ''}
      >
        <div className="label" style={{ marginBottom: 4 }}>CURRENT ZONE</div>
        <div style={{
          color,
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: '0.02em',
        }}>
          {data.zoneLabel}
        </div>
        {!data.zoneConfirmed && (
          <div style={{ color: '#fbbf24', fontSize: 10, marginTop: 4 }}>
            ⚠ Unconfirmed — waiting for 2nd consecutive reading
          </div>
        )}
      </div>

      {/* Action Signal */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '10px 16px',
      }}>
        <div className="label" style={{ marginBottom: 6 }}>ACTION SIGNAL</div>
        <div style={{
          color: data.action === 'HOLD' ? '#94a3b8' : color,
          fontSize: 15,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ fontSize: 11 }}>{actionIcon}</span>
          {data.actionDetail}
        </div>
        {isDeploy && data.actionPercent && (
          <div style={{ color: '#475569', fontSize: 11, marginTop: 6 }}>
            Ανάπτυξε {data.actionPercent}% των ΔΙΑΘΕΣΙΜΩΝ ΜΕΤΡΗΤΩΝ στην αγορά
          </div>
        )}
        {isDeploy && data.spxDrawdown !== null && (
          <div style={{ color: '#60a5fa', fontSize: 11, marginTop: 4 }}>
            SPX Drawdown: {data.spxDrawdown.toFixed(1)}%
          </div>
        )}
      </div>

    </div>
  );
}
