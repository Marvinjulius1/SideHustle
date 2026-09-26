# Pixel Degen – Winter Arc

Rendert automatisch **55 Kurzvideos (TikTok / Instagram Reels, 1080×1920)** zum Thema Krypto, Memecoins und Trading.
Eine 3D-Figur im PS2-Low-Poly-Stil läuft durch ein Penthouse auf die Kamera zu, bleibt stehen und erklärt
das Thema mit Gesten, Mundbewegung, Stimme und Untertiteln. Am Ende sagt sie in jedem Video denselben
Call-to-Action (App-Link in der Bio).

## So funktioniert es

| Schritt | Werkzeug | Datei |
|---|---|---|
| 55 Skripte (Englisch) | – | `content/videos.js` |
| Account, Call-to-Action, Hashtags | – | `content/config.json` |
| Stimme | Piper TTS, Stimme „Joe“ (CC0) | `scripts/tts.py` |
| 3D-Figur + Gesten | three.js | `render/character.js`, `render/gestures.js` |
| Szene, Animation, PS2-Effekt | three.js im Browser | `render/scene.js` |
| Untertitel, Schnitt, MP4 | ffmpeg | `scripts/render.js`, `scripts/lib/timeline.js` |

## Videos erzeugen

**Ohne eigenen Rechner:** GitHub → *Actions* → *Videos rendern* → *Run workflow* (leer lassen = alle 55).
Nach ca. 1 Stunde unter dem Lauf `videos` herunterladen.

**Lokal:**

```bash
sudo apt-get install ffmpeg
pip install -r requirements.txt
npm ci
npx playwright install chromium
npm run render                 # alle 55
npm run render -- --only 1,2   # nur bestimmte Tage
npm test
```

Ergebnis in `output/`: `day-01.mp4` … `day-55.mp4` plus `day-01.txt` … (Beschreibungstext zum Kopieren).

## Anpassen

- **Eigener Link / Text am Ende:** `content/config.json` → `cta`
- **Neue Videos:** in `content/videos.js` ergänzen (Tests prüfen Länge, Verbote, Aussprache)
- **Aussehen der Figur:** Farben oben in `render/character.js`
- **Aussprache:** `toSpeech()` in `scripts/lib/timeline.js`

## Wichtig vor dem Posten

- Werbung kennzeichnen: In jeder Beschreibung steht `#ad` + Risikohinweis. Zusätzlich in TikTok/Instagram
  den Schalter für „bezahlte Partnerschaft / Werbung“ aktivieren.
- TikTok hat strenge Regeln für Werbung zu Finanzprodukten und Krypto – vor dem Start die aktuellen
  Richtlinien lesen. Den Link nur in die Bio setzen.
- Die Inhalte sind allgemeine Aufklärung, keine Anlageberatung.
