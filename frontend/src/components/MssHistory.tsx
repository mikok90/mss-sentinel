'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { MssHistoryEntry } from '../types/mss';

interface Props {
  data: MssHistoryEntry[];
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const ZONE_REFS = [
  { value: 95, label: 'T.PANIC', color: '#ef4444' },
  { value: 85, label: 'H.FEAR', color: '#f97316' },
  { value: 65, label: 'FEAR', color: '#fbbf24' },
  { value: 40, label: 'NEUTRAL', color: '#6b7280' },
  { value: 20, label: 'GREED', color: '#86efac' },
];

function getMssColor(mss: number): string {
  if (mss >= 95) return '#00ff41';
  if (mss >= 85) return '#22c55e';
  if (mss >= 65) return '#86efac';
  if (mss >= 40) return '#6b7280';
  if (mss >= 20) return '#f97316';
  return '#ef4444';
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as MssHistoryEntry;
  return (
    <div style={{
      background: '#0f0f1a',
      border: '1px solid #1e1e35',
      borderRadius: 4,
      padding: '8px 12px',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 11,
    }}>
      <div style={{ color: '#94a3b8', marginBottom: 4 }}>
        {new Date(d.timestamp).toLocaleString()}
      </div>
      <div style={{ color: getMssColor(d.mss), fontSize: 15, fontWeight: 700 }}>
        MSS {d.mss.toFixed(1)}
      </div>
      <div style={{ color: '#475569', marginTop: 4 }}>
        VIX: {d.vix} · F&G: {d.fng}
      </div>
      {d.zoneChanged && (
        <div style={{ color: '#fbbf24', marginTop: 4 }}>⚡ Zone change</div>
      )}
    </div>
  );
};

export default function MssHistory({ data }: Props) {
  if (!data.length) {
    return (
      <div style={{ color: '#475569', fontSize: 11, padding: '32px 0', textAlign: 'center' }}>
        No history data yet. Readings accumulate every 30 minutes.
      </div>
    );
  }

  // Deduplicate by date for X-axis ticks
  const ticks = data
    .filter((_, i) => i % Math.ceil(data.length / 8) === 0)
    .map((d) => d.timestamp);

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
      }}>
        <span className="label">30-DAY MSS HISTORY</span>
        <span style={{ color: '#475569', fontSize: 10 }}>
          {data.length} readings
        </span>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="mss-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1e1e35" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatDate}
            ticks={ticks}
            tick={{ fill: '#475569', fontSize: 9, fontFamily: 'JetBrains Mono' }}
            axisLine={{ stroke: '#1e1e35' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#475569', fontSize: 9, fontFamily: 'JetBrains Mono' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          {ZONE_REFS.map((ref) => (
            <ReferenceLine
              key={ref.value}
              y={ref.value}
              stroke={ref.color}
              strokeDasharray="4 4"
              strokeOpacity={0.3}
              label={{ value: ref.label, fill: ref.color, fontSize: 8, fontFamily: 'JetBrains Mono' }}
            />
          ))}
          <Area
            type="monotone"
            dataKey="mss"
            stroke="#3b82f6"
            strokeWidth={1.5}
            fill="url(#mss-gradient)"
            dot={false}
            activeDot={{ r: 3, fill: '#3b82f6' }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Zone legend */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 10 }}>
        {[
          { label: 'TOTAL PANIC', color: '#ef4444' },
          { label: 'HIGH FEAR', color: '#f97316' },
          { label: 'FEAR', color: '#fbbf24' },
          { label: 'NEUTRAL', color: '#6b7280' },
          { label: 'GREED', color: '#86efac' },
          { label: 'HIGH GREED', color: '#00ff41' },
        ].map((z) => (
          <div key={z.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: z.color }} />
            <span style={{ color: '#475569', fontSize: 9 }}>{z.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
