import {
  calculateVixScore,
  calculateFngScore,
  calculateMss,
  getZoneInfo,
  computeMss,
} from '../src/mss/mss.calculator';

// ─── Unit Tests for MSS Calculator ───────────────────────────────────────────
// All 5 spec scenarios must produce EXACTLY the values in the spec document.

describe('calculateVixScore', () => {
  it('VIX=10 → clamped to 0', () => expect(calculateVixScore(10)).toBe(0));
  it('VIX=12 → 0.0', () => expect(calculateVixScore(12)).toBe(0));
  it('VIX=15 → 10.7', () => expect(calculateVixScore(15)).toBeCloseTo(10.7, 1));
  it('VIX=18 → 21.4', () => expect(calculateVixScore(18)).toBeCloseTo(21.4, 1));
  it('VIX=20 → 28.6', () => expect(calculateVixScore(20)).toBeCloseTo(28.6, 1));
  it('VIX=25 → 46.4', () => expect(calculateVixScore(25)).toBeCloseTo(46.4, 1));
  it('VIX=30 → 64.3', () => expect(calculateVixScore(30)).toBeCloseTo(64.3, 1));
  it('VIX=35 → 82.1', () => expect(calculateVixScore(35)).toBeCloseTo(82.1, 1));
  it('VIX=40 → 100.0', () => expect(calculateVixScore(40)).toBe(100));
  it('VIX=65 → clamped to 100', () => expect(calculateVixScore(65)).toBe(100));
});

describe('calculateFngScore', () => {
  it('F&G=0 → FG=100', () => expect(calculateFngScore(0)).toBe(100));
  it('F&G=25 → FG=75', () => expect(calculateFngScore(25)).toBe(75));
  it('F&G=50 → FG=50', () => expect(calculateFngScore(50)).toBe(50));
  it('F&G=75 → FG=25', () => expect(calculateFngScore(75)).toBe(25));
  it('F&G=100 → FG=0', () => expect(calculateFngScore(100)).toBe(0));
});

describe('5 spec scenarios (non-negotiable accuracy)', () => {
  it('Scenario 1: COVID Crash — VIX=65, F&G=5 → MSS=98.5, EXTREME_PANIC', () => {
    const result = computeMss(65, 5);
    expect(result.vixScore).toBe(100);
    expect(result.fngScore).toBe(95);
    expect(result.mss).toBe(98.5);
    expect(result.zone).toBe('EXTREME_PANIC');
    expect(result.action).toBe('DEPLOY');
    expect(result.actionPercent).toBe(80);
  });

  it('Scenario 2: Normal Calm — VIX=18, F&G=52 → MSS=29.4, HIGH_GREED', () => {
    const result = computeMss(18, 52);
    expect(result.vixScore).toBeCloseTo(21.43, 1);
    expect(result.fngScore).toBe(48);
    expect(result.mss).toBeCloseTo(29.4, 1);
    expect(result.zone).toBe('HIGH_GREED');
    expect(result.action).toBe('TRIM');
    expect(result.actionPercent).toBe(15);
  });

  it('Scenario 3: Pre-Correction Fear — VIX=28, F&G=25 → MSS=62.5, NEUTRAL', () => {
    const result = computeMss(28, 25);
    expect(result.vixScore).toBeCloseTo(57.14, 1);
    expect(result.fngScore).toBe(75);
    expect(result.mss).toBeCloseTo(62.5, 1);
    expect(result.zone).toBe('NEUTRAL');
    expect(result.action).toBe('HOLD');
  });

  it('Scenario 4: Euphoria Bubble — VIX=11, F&G=90 → MSS=3.0, EUPHORIA', () => {
    const result = computeMss(11, 90);
    expect(result.vixScore).toBe(0);
    expect(result.fngScore).toBe(10);
    expect(result.mss).toBe(3.0);
    expect(result.zone).toBe('EUPHORIA');
    expect(result.action).toBe('TRIM');
    expect(result.actionPercent).toBe(25);
  });

  it('Scenario 5: VIX Spike False Alarm — VIX=30, F&G=65 → MSS=55.5, NEUTRAL', () => {
    const result = computeMss(30, 65);
    expect(result.vixScore).toBeCloseTo(64.29, 1);
    expect(result.fngScore).toBe(35);
    expect(result.mss).toBeCloseTo(55.5, 1);
    expect(result.zone).toBe('NEUTRAL');
    expect(result.action).toBe('HOLD');
  });
});

describe('zone boundaries', () => {
  it('MSS=95 → EXTREME_PANIC', () => expect(getZoneInfo(95).zone).toBe('EXTREME_PANIC'));
  it('MSS=94.9 → TOTAL_PANIC', () => expect(getZoneInfo(94.9).zone).toBe('TOTAL_PANIC'));
  it('MSS=85 → TOTAL_PANIC', () => expect(getZoneInfo(85).zone).toBe('TOTAL_PANIC'));
  it('MSS=84.9 → HIGH_FEAR', () => expect(getZoneInfo(84.9).zone).toBe('HIGH_FEAR'));
  it('MSS=65 → HIGH_FEAR', () => expect(getZoneInfo(65).zone).toBe('HIGH_FEAR'));
  it('MSS=64.9 → NEUTRAL', () => expect(getZoneInfo(64.9).zone).toBe('NEUTRAL'));
  it('MSS=40 → NEUTRAL', () => expect(getZoneInfo(40).zone).toBe('NEUTRAL'));
  it('MSS=39.9 → HIGH_GREED', () => expect(getZoneInfo(39.9).zone).toBe('HIGH_GREED'));
  it('MSS=20 → HIGH_GREED', () => expect(getZoneInfo(20).zone).toBe('HIGH_GREED'));
  it('MSS=19.9 → EUPHORIA', () => expect(getZoneInfo(19.9).zone).toBe('EUPHORIA'));
  it('MSS=0 → EUPHORIA', () => expect(getZoneInfo(0).zone).toBe('EUPHORIA'));
});
