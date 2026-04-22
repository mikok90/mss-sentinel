# KWGT Widget — MSS Sentinel (Soft Dark Redesign)

## Αποτέλεσμα
Navy φόντο χωρίς glow borders, λευκό/γκρι κείμενο, integrated refresh button επάνω δεξιά.

---

## ΒΗΜΑ 1 — Φόντο (Background Shape)

- **Type:** Shape → Rectangle
- **Corner Radius:** `20dp`
- **Color:** `#0F172A` (deep navy)
- **Opacity:** `95%`
- **Border:** `OFF` (ή αν θέλεις πολύ λεπτό: color `#1E293B`, width `1dp`)
- **Shadow:** `OFF`

> ❌ Αφαίρεσε το glowing blue border/stroke που είχες πριν.

---

## ΒΗΜΑ 2 — Integrated Refresh Button (top-right)

Αντί για το γκρι "C" που φαίνεται ξεκάρφωτο:

1. Πρόσθεσε ένα **Text** element επάνω δεξιά
2. **Text:** `↻`
3. **Font size:** `14sp`
4. **Color:** `#475569` (slate-500, διακριτικό)
5. **Position:** X = 90% του πλάτους, Y = 8% του ύψους
6. **Touch Action → Refresh Widget**

> Έτσι το refresh button είναι μέρος του widget και δεν εμφανίζεται το γκρι OS button.

---

## ΒΗΜΑ 3 — MSS Score (κεντρικός αριθμός)

- **Element:** Text
- **Formula:** `$json(http("https://mss-sentinel-backend.onrender.com/api/mss/current"), "mss")$`
- **Font size:** `48sp`
- **Font:** Roboto Bold (ή Inter αν έχεις)
- **Color:** `#F8FAFC` (σχεδόν λευκό)
- **Alignment:** Center

---

## ΒΗΜΑ 4 — "MSS SCORE" Label

- **Text:** `MSS SCORE`
- **Font size:** `9sp`
- **Color:** `#64748B`
- **Letter spacing:** `0.12em`

---

## ΒΗΜΑ 5 — Zone Label (dynamic color)

- **Formula text:**
```
$json(http("https://mss-sentinel-backend.onrender.com/api/mss/current"), "zoneLabel")$
```

- **Font size:** `16sp`
- **Font:** Roboto Medium
- **Color formula (dynamic):**
```
$if(json(http("https://mss-sentinel-backend.onrender.com/api/mss/current"), "zone") = "EXTREME_PANIC", "#4ADE80",
  if(json(http("https://mss-sentinel-backend.onrender.com/api/mss/current"), "zone") = "TOTAL_PANIC", "#F87171",
    if(json(http("https://mss-sentinel-backend.onrender.com/api/mss/current"), "zone") = "HIGH_FEAR", "#FB923C",
      if(json(http("https://mss-sentinel-backend.onrender.com/api/mss/current"), "zone") = "NEUTRAL", "#94A3B8",
        if(json(http("https://mss-sentinel-backend.onrender.com/api/mss/current"), "zone") = "GREED", "#86EFAC", "#4ADE80")))))$
```

---

## ΒΗΜΑ 6 — Action Text

- **Formula:**
```
$json(http("https://mss-sentinel-backend.onrender.com/api/mss/current"), "actionDetail")$
```
- **Font size:** `11sp`
- **Color:** `#94A3B8` (slate-400)
- **Alignment:** Center

---

## ΒΗΜΑ 7 — Metrics Row (VIX · F&G · AGE)

Χρησιμοποίησε 3 ξεχωριστά Text elements σε οριζόντια σειρά:

| Element | Formula | Size | Color |
|---------|---------|------|-------|
| VIX label | `VIX` | 8sp | `#475569` |
| VIX value | `$json(http("..."), "vix")$` | 13sp | `#CBD5E1` |
| F&G label | `F&G` | 8sp | `#475569` |
| F&G value | `$json(http("..."), "fng")$` | 13sp | `#CBD5E1` |
| AGE label | `AGE` | 8sp | `#475569` |
| AGE value | `$tc(json(http("..."), "dataAgeMinutes"), 0, 0)$m` | 13sp | `#CBD5E1` |

Προαιρετικά, βάλε ένα λεπτό `│` διαχωριστικό μεταξύ τους, color `#1E293B`.

---

## ΒΗΜΑ 8 — Διαχωριστική Γραμμή (optional)

Πάνω από τα metrics, ένα λεπτό horizontal line:
- **Shape:** Rectangle, height `1dp`, width `80%`
- **Color:** `#1E293B`

---

## Palette Summary

| Χρήση | Hex |
|-------|-----|
| Background | `#0F172A` |
| Border (optional) | `#1E293B` |
| Κύριο κείμενο | `#F8FAFC` |
| Secondary κείμενο | `#CBD5E1` |
| Dim / labels | `#64748B` |
| Refresh button | `#475569` |
| TOTAL PANIC (red) | `#F87171` |
| HIGH FEAR (orange) | `#FB923C` |
| FEAR (yellow) | `#FCD34D` |
| NEUTRAL (gray) | `#94A3B8` |
| GREED (green) | `#86EFAC` |
| EXTREME PANIC (bright green) | `#4ADE80` |

---

## Τι ΝΑ ΑΦΑΙΡΕΣΕΙΣ από το παλιό design

- ❌ Blue glowing border / stroke
- ❌ Το ξεχωριστό γκρι "C" refresh button (αντικαταστάθηκε με το `↻` στο βήμα 2)
- ❌ `#0a0a0f` pure black background
- ❌ JetBrains Mono font (πολύ futuristic — χρησιμοποίησε Roboto ή Inter)

---

## Refresh Interval
**30 λεπτά** (ταιριάζει με τον backend cron)
