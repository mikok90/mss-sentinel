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
  { value: 95, label: 'T.PANIC', color: '#f87171' },
  { value: 85, label: 'H.FEAR', color: '#fb923c' },
  { value: 65, label: 'FEAR', color: '#fcd34d' },
  { value: 40, label: 'NEUTRAL', color: '#94a3b8' },
  { value: 20, label: 'GREED', color: '#86efac' },
  { value: 19, label: 'H.GREED', color: '#4ade80' },
];

function getMssColor(mss: number): string {
  if (mss >= 95) return '#4ade80';
  if (mss >= 85) return '#86efac';
  if (mss >= 65) return '#fcd34d';
  if (mss >= 40) return '#94a3b8';
  if (mss >= 20) return '#fb923c';
  return '#f87171';
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as MssHistoryEntry;
  return (
    <div style={{
      background: '#1e293b',
      border: '1px solid #334155',
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: 12,
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
          <CartesianGrid stroke="#334155" strokeDasharray="3 3" strokeOpacity={0.5} vertical={false} />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatDate}
            ticks={ticks}
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={{ stroke: '#334155' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#64748b', fontSize: 10 }}
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
              label={{ value: ref.label, fill: ref.color, fontSize: 9 }}
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
          { label: 'TOTAL PANIC', color: '#f87171' },
          { label: 'HIGH FEAR', color: '#fb923c' },
          { label: 'FEAR', color: '#fcd34d' },
          { label: 'NEUTRAL', color: '#94a3b8' },
          { label: 'GREED', color: '#86efac' },
          { label: 'HIGH GREED', color: '#4ade80' },
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
