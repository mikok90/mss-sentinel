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
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 16px;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 20px;
      width: 100%;
      max-width: 340px;
      position: relative;
    }
    .refresh-btn {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 32px;
      height: 32px;
      background: #334155;
      border: none;
      border-radius: 8px;
      color: #94a3b8;
      font-size: 17px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      line-height: 1;
    }
    .score {
      font-size: 52px;
      font-weight: 700;
      line-height: 1;
      color: ${color};
      text-align: center;
      margin-top: 8px;
    }
    .score-label {
      text-align: center;
      color: #64748b;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-top: 4px;
    }
    .zone {
      text-align: center;
      color: ${color};
      font-size: 17px;
      font-weight: 700;
      margin-top: 14px;
      letter-spacing: 0.02em;
    }
    .action {
      text-align: center;
      color: #94a3b8;
      font-size: 12px;
      margin-top: 6px;
      line-height: 1.4;
    }
    .divider {
      border: none;
      border-top: 1px solid #334155;
      margin: 14px 0;
    }
    .metrics {
      display: flex;
      justify-content: space-around;
    }
    .metric-label {
      color: #64748b;
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      text-align: center;
    }
    .metric-value {
      color: #cbd5e1;
      font-size: 15px;
      font-weight: 600;
      text-align: center;
      margin-top: 2px;
    }
  </style>
</head>
<body>
  <div class="card">
    <a class="refresh-btn" href="/widget" title="Refresh">↻</a>
    <div class="score">${mss}</div>
    <div class="score-label">MSS Score</div>
    <div class="zone">${zone}</div>
    <div class="action">${action}</div>
    <hr class="divider" />
    <div class="metrics">
      <div>
        <div class="metric-label">VIX</div>
        <div class="metric-value">${vix}</div>
      </div>
      <div>
        <div class="metric-label">F&amp;G</div>
        <div class="metric-value">${fng}</div>
      </div>
      <div>
        <div class="metric-label">Age</div>
        <div class="metric-value" style="color:${ageColor}">${age}</div>
      </div>
    </div>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
