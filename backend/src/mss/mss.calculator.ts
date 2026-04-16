// ─── MSS Calculator ──────────────────────────────────────────────────────────
// Pure functions — no side effects, fully testable.
// Formula accuracy is non-negotiable. All 5 spec scenarios verified in tests.

export const VIX_FLOOR = parseFloat(process.env.VIX_FLOOR || '12');
export const VIX_CEILING = parseFloat(process.env.VIX_CEILING || '40');
export const VIX_WEIGHT = parseFloat(process.env.VIX_WEIGHT || '0.70');
export const FNG_WEIGHT = parseFloat(process.env.FNG_WEIGHT || '0.30');

export const ZONE_EXTREME_PANIC = parseInt(process.env.ZONE_EXTREME_PANIC || '95');
export const ZONE_TOTAL_PANIC = parseInt(process.env.ZONE_TOTAL_PANIC || '85');
export const ZONE_HIGH_FEAR = parseInt(process.env.ZONE_HIGH_FEAR || '65');
export const ZONE_NEUTRAL = parseInt(process.env.ZONE_NEUTRAL || '40');
export const ZONE_HIGH_GREED = parseInt(process.env.ZONE_HIGH_GREED || '20');

export const ACTION_EXTREME_PANIC_BUY_PCT = parseInt(process.env.ACTION_EXTREME_PANIC_BUY_PCT || '80');
export const ACTION_TOTAL_PANIC_BUY_PCT = parseInt(process.env.ACTION_TOTAL_PANIC_BUY_PCT || '50');
export const ACTION_HIGH_FEAR_BUY_PCT = parseInt(process.env.ACTION_HIGH_FEAR_BUY_PCT || '25');
export const ACTION_HIGH_GREED_TRIM_PCT = parseInt(process.env.ACTION_HIGH_GREED_TRIM_PCT || '15');
export const ACTION_EUPHORIA_TRIM_PCT = parseInt(process.env.ACTION_EUPHORIA_TRIM_PCT || '25');

export type Zone =
  | 'EXTREME_PANIC'
  | 'TOTAL_PANIC'
  | 'HIGH_FEAR'
  | 'NEUTRAL'
  | 'HIGH_GREED'
  | 'EUPHORIA';

export type ActionType = 'DEPLOY' | 'TRIM' | 'HOLD';

export interface ZoneInfo {
  zone: Zone;
  zoneLabel: string;
  action: ActionType;
  actionPercent: number | null;
  actionDetail: string;
  color: string;
}

/**
 * Step 1: Map VIX to 0-100 fear scale.
 * V = clamp(0, 100, (vix - floor) / (ceiling - floor) × 100)
 *
 * VIX=12 → 0.0 | VIX=20 → 28.6 | VIX=30 → 64.3 | VIX=40 → 100.0
 */
export function calculateVixScore(vix: number): number {
  return Math.max(0, Math.min(100, ((vix - VIX_FLOOR) / (VIX_CEILING - VIX_FLOOR)) * 100));
}

/**
 * Step 2: Invert CNN F&G (0=fear, 100=greed) to fear scale.
 * FG = 100 - fng
 *
 * F&G=0 → FG=100 | F&G=50 → FG=50 | F&G=100 → FG=0
 */
export function calculateFngScore(fng: number): number {
  return 100 - fng;
}

/**
 * Step 3: Weighted composite.
 * MSS = (0.70 × V) + (0.30 × FG), rounded to 1 decimal.
 */
export function calculateMss(vixScore: number, fngScore: number): number {
  const raw = VIX_WEIGHT * vixScore + FNG_WEIGHT * fngScore;
  return Math.round(raw * 10) / 10;
}

/**
 * Step 4: Map MSS to zone + action.
 */
export function getZoneInfo(mss: number): ZoneInfo {
  if (mss >= ZONE_EXTREME_PANIC) {
    return {
      zone: 'EXTREME_PANIC',
      zoneLabel: 'EXTREME PANIC',
      action: 'DEPLOY',
      actionPercent: ACTION_EXTREME_PANIC_BUY_PCT,
      actionDetail: `Deploy ${ACTION_EXTREME_PANIC_BUY_PCT}% of your available cash`,
      color: '#00ff41',
    };
  }
  if (mss >= ZONE_TOTAL_PANIC) {
    return {
      zone: 'TOTAL_PANIC',
      zoneLabel: 'TOTAL PANIC',
      action: 'DEPLOY',
      actionPercent: ACTION_TOTAL_PANIC_BUY_PCT,
      actionDetail: `Deploy ${ACTION_TOTAL_PANIC_BUY_PCT}% of your available cash`,
      color: '#22c55e',
    };
  }
  if (mss >= ZONE_HIGH_FEAR) {
    return {
      zone: 'HIGH_FEAR',
      zoneLabel: 'HIGH FEAR',
      action: 'DEPLOY',
      actionPercent: ACTION_HIGH_FEAR_BUY_PCT,
      actionDetail: `Deploy ${ACTION_HIGH_FEAR_BUY_PCT}% of your available cash`,
      color: '#86efac',
    };
  }
  if (mss >= ZONE_NEUTRAL) {
    return {
      zone: 'NEUTRAL',
      zoneLabel: 'NEUTRAL',
      action: 'HOLD',
      actionPercent: null,
      actionDetail: 'HOLD — do nothing',
      color: '#6b7280',
    };
  }
  if (mss >= ZONE_HIGH_GREED) {
    return {
      zone: 'HIGH_GREED',
      zoneLabel: 'HIGH GREED',
      action: 'TRIM',
      actionPercent: ACTION_HIGH_GREED_TRIM_PCT,
      actionDetail: `Trim ${ACTION_HIGH_GREED_TRIM_PCT}% of your invested portfolio`,
      color: '#f97316',
    };
  }
  return {
    zone: 'EUPHORIA',
    zoneLabel: 'EUPHORIA',
    action: 'TRIM',
    actionPercent: ACTION_EUPHORIA_TRIM_PCT,
    actionDetail: `Trim ${ACTION_EUPHORIA_TRIM_PCT}% of your invested portfolio`,
    color: '#ef4444',
  };
}

/** Full pipeline: raw inputs → MSS result */
export function computeMss(vix: number, fng: number) {
  const vixScore = calculateVixScore(vix);
  const fngScore = calculateFngScore(fng);
  const mss = calculateMss(vixScore, fngScore);
  const zoneInfo = getZoneInfo(mss);
  return { vixScore, fngScore, mss, ...zoneInfo };
}
