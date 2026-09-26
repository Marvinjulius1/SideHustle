# Azubi Geldwissen – automatischer Content-Kanal

Erzeugt jeden Tag einen fertigen Instagram-/TikTok-Post (Bild 1080×1350 + Caption mit Hashtags)
für die Nische **Geldwissen für Azubis & junge Leute**.

- 35 handgeschriebene Posts (Fakten, Tipps, Mythen) + 20 automatisch berechnete Rechen-Posts
- Jeder Kalendertag bekommt immer denselben Post, danach beginnt die Liste von vorn
- Alle Zahlen werden berechnet und von Tests geprüft

## Dein Aufwand (ca. 30 Minuten im Monat)

1. **Einmalig:** Instagram-Account anlegen (Name/Handle in `config.json` anpassen, falls vergeben).
2. **Monatlich:** Auf GitHub → *Actions* → *Posts erzeugen* → neuesten Lauf öffnen → `posts` herunterladen.
   (Läuft automatisch am 25. jedes Monats, sobald der Code auf `main` ist. Manuell: *Run workflow*.)
3. Den Ordner in ein Planungstool laden (z. B. Meta Business Suite – kostenlos) und die Posts
   mit Datum/Uhrzeit aus `plan.csv` einplanen. Caption steht in `caption.txt` jedes Tages.

## Selbst ausführen (optional)

```bash
npm ci
npx playwright install chromium
npm run generate -- --days 30            # ab heute (bzw. ab startDate)
npm run generate -- --from 2026-11-01 --days 7
npm test
```

Ergebnis: `output/JJJJ-MM-TT/post.png`, `output/JJJJ-MM-TT/caption.txt`, `output/plan.csv`.

## Anpassen

| Was | Wo |
|---|---|
| Name, Handle, Farben, Hashtags, Startdatum, Uhrzeit | `config.json` |
| Texte (Fakten, Tipps, Mythen) | `src/posts.js` |
| Rechen-Posts (Beträge, Jahre, Rendite) | `src/math.js` → `generateMathPosts()` |
| Bild-Design | `src/template.js` |

`*Text*` in einem Post wird im Bild farbig hervorgehoben.

## Geld verdienen

- Ab ca. 1.000 Followern: Affiliate-Links (Broker, Tagesgeld, Girokonto) in die Bio – Werbung immer als „Anzeige“ kennzeichnen.
- Später: eigenes digitales Produkt (z. B. Budget-Vorlage für Azubis) in der Bio verkaufen.

Hinweis: Inhalte sind allgemeine Finanzbildung, keine Anlageberatung.
