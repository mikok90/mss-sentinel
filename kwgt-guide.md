# KWGT Android Widget — MSS Sentinel Setup

## What you need
- KWGT Pro (Play Store, ~5€)
- Your backend URL from Render (e.g. `https://mss-backend-xxxx.onrender.com`)

## Widget Layout (3 rows)

```
MSS  62.5  ■ NEUTRAL
► HOLD
VIX: 28.0  |  F&G: 25
Updated: 14:30
```

## KWGT Formulas

### Row 1 — MSS Value + Zone
```
$tc(json(http("https://YOUR_URL/api/mss/current"), "mss"), ".", 1)$ ■ $tc(json(http("https://YOUR_URL/api/mss/current"), "zoneLabel"), "TRIM", "—")$
```

Simpler (separate text elements):
- Text 1: `$json(http("https://YOUR_URL/api/mss/current"), "mss")$`
- Text 2: `$json(http("https://YOUR_URL/api/mss/current"), "zoneLabel")$`

### Row 2 — Action
```
► $json(http("https://YOUR_URL/api/mss/current"), "actionDetail")$
```

### Row 3 — VIX & F&G
```
VIX: $json(http("https://YOUR_URL/api/mss/current"), "vix")$  |  F&G: $json(http("https://YOUR_URL/api/mss/current"), "fng")$
```

### Row 4 — Last update
```
Updated: $df(si(http_date), "HH:mm")$
```

## Zone Colors (use KWGT color formula)

```
$if(json(http("..."), "zone") = "EXTREME_PANIC", "#00ff41",
  if(json(http("..."), "zone") = "TOTAL_PANIC", "#22c55e",
    if(json(http("..."), "zone") = "HIGH_FEAR", "#86efac",
      if(json(http("..."), "zone") = "NEUTRAL", "#6b7280",
        if(json(http("..."), "zone") = "HIGH_GREED", "#f97316", "#ef4444")))))$
```

## Refresh Interval
Set widget refresh to: **30 minutes** (matches backend cron)

## Tips
- Use a dark background shape (#0a0a0f) behind the widget
- Place above Google Search bar
- Use JetBrains Mono or Courier font for Bloomberg feel
- For EXTREME_PANIC zone: add a green blinking indicator
