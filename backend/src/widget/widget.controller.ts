import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { MssService } from '../mss/mss.service';

@Controller('widget')
export class WidgetController {
  constructor(private readonly mssService: MssService) {}

  @Get()
  async getWidget(@Res() res: Response) {
    let data: any = null;
    try {
      data = await this.mssService.getCurrent();
      if (data?.status) data = null;
    } catch {
      data = null;
    }

    const color = data?.color ?? '#60a5fa';
    const mss = data ? data.mss.toFixed(0) : '--';
    const zone = data ? data.zoneLabel.toUpperCase() : 'NO DATA';
    const action = data ? data.actionDetail : 'Cannot reach API';
    const vix = data ? data.vix.toFixed(1) : '--';
    const fng = data ? String(data.fng) : '--';
    const age = data ? `${data.dataAgeMinutes}m` : '--';
    const ageColor = data?.stale ? '#fcd34d' : '#94a3b8';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="refresh" content="300" />
  <meta http-equiv="cache-control" content="no-cache, no-store, must-revalidate" />
  <meta http-equiv="pragma" content="no-cache" />
  <meta http-equiv="expires" content="0" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 12px;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 16px;
      width: 100%;
      max-width: 340px;
    }
    .header {
      display: flex;
      align-items: baseline;
      justify-content: center;
      gap: 10px;
    }
    .score {
      font-size: 48px;
      font-weight: 700;
      line-height: 1;
      color: ${color};
    }
    .zone {
      color: ${color};
      font-size: 16px;
      font-weight: 700;
    }
    .action {
      text-align: center;
      color: #94a3b8;
      font-size: 11px;
      margin-top: 6px;
      line-height: 1.3;
    }
    .divider {
      border: none;
      border-top: 1px solid #334155;
      margin: 10px 0;
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
      color: #e2e8f0;
      font-size: 16px;
      font-weight: 700;
      text-align: center;
      margin-top: 2px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="score">${mss}</div>
      <div class="zone">${zone}</div>
    </div>
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
  <script>setTimeout(function(){location.reload();},300000);</script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(html);
  }
}
