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
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:4px}
    .c{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:10px 14px;width:100%;max-width:340px}
    .r1{display:flex;align-items:baseline;justify-content:center;gap:8px}
    .s{font-size:40px;font-weight:700;line-height:1;color:${color}}
    .z{color:${color};font-size:14px;font-weight:700}
    .m{display:flex;justify-content:space-around;margin-top:8px}
    .ml{color:#64748b;font-size:8px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;text-align:center}
    .mv{color:#e2e8f0;font-size:14px;font-weight:700;text-align:center;margin-top:1px}
  </style>
</head>
<body>
  <div class="c">
    <div class="r1"><div class="s">${mss}</div><div class="z">${zone}</div></div>
    <div class="m">
      <div><div class="ml">VIX</div><div class="mv">${vix}</div></div>
      <div><div class="ml">F&amp;G</div><div class="mv">${fng}</div></div>
      <div><div class="ml">Age</div><div class="mv" style="color:${ageColor}">${age}</div></div>
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
