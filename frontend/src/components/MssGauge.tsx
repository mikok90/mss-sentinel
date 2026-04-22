'use client';

import { Zone, ZONE_COLORS } from '../types/mss';

interface Props {
  mss: number;
  zone: Zone;
  size?: number;
}

export default function MssGauge({ mss, zone, size = 220 }: Props) {
  const color = ZONE_COLORS[zone] || '#6b7280';
  const cx = size / 2;
  const cy = size / 2;
  const r = (size / 2) - 20;
  const strokeW = 14;

  // Arc from 135° to 405° (270° sweep) — bottom center is start
  const startAngle = 135;
  const totalSweep = 270;
  const angle = startAngle + (mss / 100) * totalSweep;

  function polarToXY(deg: number, radius: number) {
    const rad = (deg - 90) * (Math.PI / 180);
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  }

  function arcPath(from: number, to: number, rad: number) {
    const s = polarToXY(from, rad);
    const e = polarToXY(to, rad);
    const largeArc = to - from > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${rad} ${rad} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  }

  const trackPath = arcPath(startAngle, startAngle + totalSweep, r);
  const fillPath = mss > 0 ? arcPath(startAngle, angle, r) : '';

  // Needle tip
  const needleTip = polarToXY(angle, r - strokeW / 2 - 4);

  const isExtrème = zone === 'EXTREME_PANIC';

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={isExtrème ? 'glow' : ''}
      style={{ color }}
    >
      {/* Gradient defs */}
      <defs>
        <linearGradient id="gauge-fill" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="40%" stopColor="#fb923c" />
          <stop offset="60%" stopColor="#94a3b8" />
          <stop offset="80%" stopColor="#86efac" />
          <stop offset="100%" stopColor="#4ade80" />
        </linearGradient>
      </defs>

      {/* Track */}
      <path
        d={trackPath}
        fill="none"
        stroke="#334155"
        strokeWidth={strokeW}
        strokeLinecap="round"
      />

      {/* Filled arc */}
      {fillPath && (
        <path
          d={fillPath}
          fill="none"
          stroke={color}
          strokeWidth={strokeW}
          strokeLinecap="round"
          opacity={0.85}
        />
      )}

      {/* Zone tick marks */}
      {[20, 40, 65, 85, 95].map((thresh) => {
        const tickAngle = startAngle + (thresh / 100) * totalSweep;
        const inner = polarToXY(tickAngle, r - strokeW - 4);
        const outer = polarToXY(tickAngle, r + 6);
        return (
          <line
            key={thresh}
            x1={inner.x} y1={inner.y}
            x2={outer.x} y2={outer.y}
            stroke="#475569"
            strokeWidth={1.5}
          />
        );
      })}

      {/* Needle dot */}
      <circle
        cx={needleTip.x}
        cy={needleTip.y}
        r={5}
        fill={color}
      />

      {/* Center: MSS value */}
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        fill={color}
        fontSize={size * 0.18}
        fontWeight="700"
        fontFamily="Inter, sans-serif"
      >
        {mss.toFixed(1)}
      </text>

      {/* Label */}
      <text
        x={cx}
        y={cy + 16}
        textAnchor="middle"
        fill="#64748b"
        fontSize={10}
        fontWeight="600"
        fontFamily="Inter, sans-serif"
        letterSpacing="0.08em"
      >
        MSS SCORE
      </text>

      {/* Min / Max labels */}
      <text x={18} y={size - 8} fill="#475569" fontSize={9} fontFamily="Inter, sans-serif">0</text>
      <text x={size - 26} y={size - 8} fill="#475569" fontSize={9} fontFamily="Inter, sans-serif">100</text>
    </svg>
  );
}
