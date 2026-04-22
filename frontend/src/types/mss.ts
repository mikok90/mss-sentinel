export type Zone =
  | 'EXTREME_PANIC'
  | 'TOTAL_PANIC'
  | 'HIGH_FEAR'
  | 'NEUTRAL'
  | 'HIGH_GREED'
  | 'EUPHORIA';

export type ActionType = 'DEPLOY' | 'TRIM' | 'HOLD';

export interface MssCurrent {
  mss: number;
  zone: Zone;
  zoneLabel: string;
  zoneConfirmed: boolean;
  action: ActionType;
  actionDetail: string;
  actionPercent: number | null;
  actionType: 'buy' | 'sell' | null;
  color: string;
  vix: number;
  fng: number;
  vixScore: number;
  fngScore: number;
  timestamp: string;
  nextUpdate: string;
  marketOpen: boolean;
  dataSourceVix: string;
  dataSourceFng: string;
  dataAgeMinutes: number;
  stale: boolean;
  status?: string;
  message?: string;
}

export interface MssHistoryEntry {
  timestamp: string;
  mss: number;
  vix: number;
  fng: number;
  zone: Zone;
  zoneChanged: boolean;
  action: ActionType;
}

export const ZONE_COLORS: Record<Zone, string> = {
  EXTREME_PANIC: '#f87171',
  TOTAL_PANIC: '#fb923c',
  HIGH_FEAR: '#fcd34d',
  NEUTRAL: '#94a3b8',
  HIGH_GREED: '#86efac',
  EUPHORIA: '#4ade80',
};

export const ZONE_BG: Record<Zone, string> = {
  EXTREME_PANIC: 'rgba(248,113,113,0.10)',
  TOTAL_PANIC: 'rgba(251,146,60,0.10)',
  HIGH_FEAR: 'rgba(252,211,77,0.08)',
  NEUTRAL: 'rgba(148,163,184,0.08)',
  HIGH_GREED: 'rgba(134,239,172,0.08)',
  EUPHORIA: 'rgba(74,222,128,0.10)',
};
