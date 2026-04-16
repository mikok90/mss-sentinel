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
  EXTREME_PANIC: '#ef4444',
  TOTAL_PANIC: '#f97316',
  HIGH_FEAR: '#fbbf24',
  NEUTRAL: '#6b7280',
  HIGH_GREED: '#86efac',
  EUPHORIA: '#00ff41',
};

export const ZONE_BG: Record<Zone, string> = {
  EXTREME_PANIC: 'rgba(239,68,68,0.12)',
  TOTAL_PANIC: 'rgba(249,115,22,0.10)',
  HIGH_FEAR: 'rgba(251,191,36,0.08)',
  NEUTRAL: 'rgba(107,114,128,0.08)',
  HIGH_GREED: 'rgba(134,239,172,0.08)',
  EUPHORIA: 'rgba(0,255,65,0.12)',
};
