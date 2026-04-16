'use client';

import { MssCurrent, ZONE_COLORS, ZONE_BG } from '../types/mss';

interface Props {
  data: MssCurrent;
}

const ACTION_ICONS: Record<string, string> = {
  DEPLOY: '▲ DEPLOY',
  TRIM: '▼ TRIM',
  HOLD: '■ HOLD',
};

export default function ZoneDisplay({ data }: Props) {
  const color = ZONE_COLORS[data.zone] || '#6b7280';
  const bg = ZONE_BG[data.zone] || 'transparent';
  const isExtreme = data.zone === 'EXTREME_PANIC';
  const actionIcon = ACTION_ICONS[data.action] || data.action;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Zone Badge */}
      <div
        style={{
          background: bg,
          border: `1px solid ${color}`,
          borderRadius: 4,
          padding: '10px 16px',
        }}
        className={isExtreme ? 'flash' : ''}
      >
        <div className="label" style={{ marginBottom: 4 }}>CURRENT ZONE</div>
        <div style={{
          color,
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: '0.05em',
          fontFamily: 'JetBrains Mono, monospace',
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
        borderRadius: 4,
        padding: '10px 16px',
      }}>
        <div className="label" style={{ marginBottom: 6 }}>ACTION SIGNAL</div>
        <div style={{
          color: data.action === 'HOLD' ? '#6b7280' : color,
          fontSize: 15,
          fontWeight: 600,
          fontFamily: 'JetBrains Mono, monospace',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ fontSize: 11 }}>{actionIcon}</span>
          {data.actionDetail}
        </div>
        {data.actionPercent && (
          <div style={{ color: '#475569', fontSize: 11, marginTop: 6 }}>
            {data.action === 'DEPLOY'
              ? `Deploy ${data.actionPercent}% of your AVAILABLE CASH into the market`
              : `Trim ${data.actionPercent}% of your CURRENT INVESTED AMOUNT`}
          </div>
        )}
      </div>

      {/* Factor breakdown */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
      }}>
        <FactorCard label="VIX" raw={data.vix} score={data.vixScore} source={data.dataSourceVix} />
        <FactorCard label="F&G" raw={data.fng} score={data.fngScore} source={data.dataSourceFng} />
      </div>
    </div>
  );
}

function FactorCard({ label, raw, score, source }: {
  label: string; raw: number; score: number; source: string;
}) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-dim)',
      borderRadius: 4,
      padding: '8px 12px',
    }}>
      <div className="label" style={{ marginBottom: 4 }}>{label} INDEX</div>
      <div style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 600 }}>
        {raw}
      </div>
      <div style={{ color: 'var(--text-dim)', fontSize: 10, marginTop: 2 }}>
        Score: {score.toFixed(1)} · {source}
      </div>
    </div>
  );
}
