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
  EXTREME_PANIC: '#00ff41',
  TOTAL_PANIC: '#22c55e',
  HIGH_FEAR: '#86efac',
  NEUTRAL: '#6b7280',
  HIGH_GREED: '#f97316',
  EUPHORIA: '#ef4444',
};

export const ZONE_BG: Record<Zone, string> = {
  EXTREME_PANIC: 'rgba(0,255,65,0.12)',
  TOTAL_PANIC: 'rgba(34,197,94,0.10)',
  HIGH_FEAR: 'rgba(134,239,172,0.08)',
  NEUTRAL: 'rgba(107,114,128,0.08)',
  HIGH_GREED: 'rgba(249,115,22,0.10)',
  EUPHORIA: 'rgba(239,68,68,0.12)',
};
