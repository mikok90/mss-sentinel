// Route Handler — returns pure static HTML, zero JavaScript.
// Works in any webview/widget browser that doesn't support JS.
// Auto-reloads every 5 minutes via <meta http-equiv="refresh">.

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://mss-sentinel-backend.onrender.com';

interface MssCurrent {
  mss: number;
  zoneLabel: string;
  actionDetail: string;
  color: string;
  vix: number;
  fng: number;
  dataAgeMinutes: number;
  stale: boolean;
  status?: string;
  message?: string;
}

async function getData(): Promise<MssCurrent | null> {
  try {
    const res = await fetch(`${API}/api/mss/current`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function GET() {
  const data = await getData();

  const color = data?.color ?? '#3b82f6';
  const hasData = data && !data.status;

  const mss = hasData ? data.mss.toFixed(0) : '--';
  const zone = hasData ? data.zoneLabel.toUpperCase() : 'NO DATA';
  const action = hasData ? data.actionDetail : 'Cannot reach API';
  const vix = hasData ? data.vix.toFixed(1) : '--';
  const fng = hasData ? String(data.fng) : '--';
  const age = hasData ? `${data.dataAgeMinutes}m` : '--';
  const ageColor = data?.stale ? '#fbbf24' : '#94a3b8';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="refresh" content="300" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      background: #0a0a0f;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px;
    }
    .card {
      background: #0f0f1a;
      border: 2px solid ${color};
      border-radius: 12px;
      padding: 20px 24px;
      text-align: center;
      width: 100%;
      max-width: 280px;
      box-shadow: 0 0 28px ${color}55;
    }
    .mss { color: ${color}; font-size: 72px; font-weight: 700; line-height: 1; }
    .mss-label { color: #475569; font-size: 9px; letter-spacing: 0.15em; margin-top: 2px; }
    .zone { color: ${color}; font-size: 15px; font-weight: 600; margin-top: 14px; letter-spacing: 0.06em; }
    .action { color: #94a3b8; font-size: 11px; margin-top: 8px; line-height: 1.5; }
    .divider { border-top: 1px solid #1e1e35; margin: 14px 0; }
    .stats { display: flex; justify-content: space-around; }
    .stat-label { color: #475569; font-size: 9px; letter-spacing: 0.1em; }
    .stat-value { color: #e2e8f0; font-size: 13px; font-weight: 600; margin-top: 3px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="mss">${mss}</div>
    <div class="mss-label">MSS SCORE</div>
    <div class="zone">${zone}</div>
    <div class="action">${action}</div>
    <div class="divider"></div>
    <div class="stats">
      <div>
        <div class="stat-label">VIX</div>
        <div class="stat-value">${vix}</div>
      </div>
      <div>
        <div class="stat-label">F&amp;G</div>
        <div class="stat-value">${fng}</div>
      </div>
      <div>
        <div class="stat-label">AGE</div>
        <div class="stat-value" style="color:${ageColor}">${age}</div>
      </div>
    </div>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
