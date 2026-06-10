// ─── MSS Calculator ──────────────────────────────────────────────────────────
// Pure functions — no side effects, fully testable.
// v2 "Discipline Engine" — TRIM → REVIEW, Greek action texts, SPX drawdown gate.

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

// SPX drawdown thresholds — deploy zones require SPX confirmation
export const SPX_DRAWDOWN_HIGH_FEAR_PCT = parseFloat(process.env.SPX_DRAWDOWN_HIGH_FEAR_PCT || '3');
export const SPX_DRAWDOWN_TOTAL_PANIC_PCT = parseFloat(process.env.SPX_DRAWDOWN_TOTAL_PANIC_PCT || '8');
export const SPX_DRAWDOWN_EXTREME_PANIC_PCT = parseFloat(process.env.SPX_DRAWDOWN_EXTREME_PANIC_PCT || '15');

export type Zone =
  | 'EXTREME_PANIC'
  | 'TOTAL_PANIC'
  | 'HIGH_FEAR'
  | 'NEUTRAL'
  | 'HIGH_GREED'
  | 'EUPHORIA';

export type ActionType = 'DEPLOY' | 'REVIEW' | 'HOLD';

export interface ZoneInfo {
  zone: Zone;
  zoneLabel: string;
  action: ActionType;
  actionPercent: number | null;
  actionDetail: string;
  color: string;
}

export function calculateVixScore(vix: number): number {
  return Math.max(0, Math.min(100, ((vix - VIX_FLOOR) / (VIX_CEILING - VIX_FLOOR)) * 100));
}

export function calculateFngScore(fng: number): number {
  return 100 - fng;
}

export function calculateMss(vixScore: number, fngScore: number): number {
  const raw = VIX_WEIGHT * vixScore + FNG_WEIGHT * fngScore;
  return Math.round(raw * 10) / 10;
}

export function getZoneInfo(mss: number): ZoneInfo {
  if (mss >= ZONE_EXTREME_PANIC) {
    return { zone: 'EXTREME_PANIC', zoneLabel: 'TOTAL PANIC', action: 'DEPLOY', actionPercent: ACTION_EXTREME_PANIC_BUY_PCT, actionDetail: `Ανάπτυξε ${ACTION_EXTREME_PANIC_BUY_PCT}% των μετρητών σου — ακραίος πανικός`, color: '#ef4444' };
  }
  if (mss >= ZONE_TOTAL_PANIC) {
    return { zone: 'TOTAL_PANIC', zoneLabel: 'HIGH FEAR', action: 'DEPLOY', actionPercent: ACTION_TOTAL_PANIC_BUY_PCT, actionDetail: `Ανάπτυξε ${ACTION_TOTAL_PANIC_BUY_PCT}% των μετρητών σου — υψηλός φόβος`, color: '#f97316' };
  }
  if (mss >= ZONE_HIGH_FEAR) {
    return { zone: 'HIGH_FEAR', zoneLabel: 'FEAR', action: 'DEPLOY', actionPercent: ACTION_HIGH_FEAR_BUY_PCT, actionDetail: `Ανάπτυξε ${ACTION_HIGH_FEAR_BUY_PCT}% των μετρητών σου — φόβος`, color: '#fbbf24' };
  }
  if (mss >= ZONE_NEUTRAL) {
    return { zone: 'NEUTRAL', zoneLabel: 'NEUTRAL', action: 'HOLD', actionPercent: null, actionDetail: 'Κράτα θέσεις — μη κάνεις τίποτα', color: '#6b7280' };
  }
  if (mss >= ZONE_HIGH_GREED) {
    return { zone: 'HIGH_GREED', zoneLabel: 'GREED', action: 'REVIEW', actionPercent: null, actionDetail: 'Έλεγξε δορυφόρους — καμία πώληση δείκτη', color: '#86efac' };
  }
  return { zone: 'EUPHORIA', zoneLabel: 'HIGH GREED', action: 'REVIEW', actionPercent: null, actionDetail: 'Έλεγξε δορυφόρους — καμία πώληση δείκτη. Πειθαρχία.', color: '#00ff41' };
}

/**
 * Returns an override message when SPX drawdown is insufficient for deploy zones.
 * Returns null if drawdown is sufficient (action should proceed).
 */
export function getDrawdownOverride(zone: Zone, drawdownPct: number | null): string | null {
  if (drawdownPct === null) {
    if (zone === 'EXTREME_PANIC' || zone === 'TOTAL_PANIC' || zone === 'HIGH_FEAR') {
      return 'Δεδομένα SPX μη διαθέσιμα — περίμενε επιβεβαίωση πτώσης πριν αγοράσεις';
    }
    return null;
  }

  if (zone === 'EXTREME_PANIC' && drawdownPct < SPX_DRAWDOWN_EXTREME_PANIC_PCT) {
    return `SPX πτώση ${drawdownPct.toFixed(1)}% — χρειάζεται ≥${SPX_DRAWDOWN_EXTREME_PANIC_PCT}% για deploy. Περίμενε.`;
  }
  if (zone === 'TOTAL_PANIC' && drawdownPct < SPX_DRAWDOWN_TOTAL_PANIC_PCT) {
    return `SPX πτώση ${drawdownPct.toFixed(1)}% — χρειάζεται ≥${SPX_DRAWDOWN_TOTAL_PANIC_PCT}% για deploy. Περίμενε.`;
  }
  if (zone === 'HIGH_FEAR' && drawdownPct < SPX_DRAWDOWN_HIGH_FEAR_PCT) {
    return `SPX πτώση ${drawdownPct.toFixed(1)}% — χρειάζεται ≥${SPX_DRAWDOWN_HIGH_FEAR_PCT}% για deploy. Περίμενε.`;
  }

  return null;
}

export function computeMss(vix: number, fng: number) {
  const vixScore = calculateVixScore(vix);
  const fngScore = calculateFngScore(fng);
  const mss = calculateMss(vixScore, fngScore);
  const zoneInfo = getZoneInfo(mss);
  return { vixScore, fngScore, mss, ...zoneInfo };
}
