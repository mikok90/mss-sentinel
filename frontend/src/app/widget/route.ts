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
</head>
<body style="margin:0;padding:12px;background:#0a0a0f;font-family:monospace;">
  <div style="background:#0f0f1a;border:2px solid ${color};border-radius:10px;padding:18px 20px;text-align:center;box-shadow:0 0 20px ${color}44;">
    <div style="color:${color};font-size:64px;font-weight:bold;line-height:1;">${mss}</div>
    <div style="color:#555;font-size:10px;letter-spacing:2px;margin-top:2px;">MSS SCORE</div>
    <div style="color:${color};font-size:14px;font-weight:bold;margin-top:12px;letter-spacing:1px;">${zone}</div>
    <div style="color:#888;font-size:11px;margin-top:8px;line-height:1.5;">${action}</div>
    <hr style="border:none;border-top:1px solid #222;margin:12px 0;" />
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="text-align:center;padding:2px;">
          <div style="color:#555;font-size:9px;letter-spacing:1px;">VIX</div>
          <div style="color:#ddd;font-size:13px;font-weight:bold;">${vix}</div>
        </td>
        <td style="text-align:center;padding:2px;">
          <div style="color:#555;font-size:9px;letter-spacing:1px;">F&amp;G</div>
          <div style="color:#ddd;font-size:13px;font-weight:bold;">${fng}</div>
        </td>
        <td style="text-align:center;padding:2px;">
          <div style="color:#555;font-size:9px;letter-spacing:1px;">AGE</div>
          <div style="color:${ageColor};font-size:13px;font-weight:bold;">${age}</div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
