# Pixel Degen – Winter Arc

Erzeugt automatisch **55 Kurzvideos (TikTok / Instagram Reels, 1080×1920)** zu Krypto, Memecoins und Trading.
Eine Figur im Stil einer PS2-Zwischensequenz spricht direkt in die Kamera – mal läuft sie auf die Kamera zu,
mal sitzt sie. Jedes Video spielt in einer anderen Umgebung; sein Penthouse und sein Trading-Raum kehren
regelmäßig wieder. Am Ende sagt er immer denselben Call-to-Action (App-Link in der Bio).

## Ablauf pro Video

1. **Stimme** – ElevenLabs liest das Skript (inkl. exakter Wort-Zeiten für die Untertitel)
2. **Startbild** – fal.ai erzeugt aus dem Charakterbild die Figur in der jeweiligen Umgebung (einmal pro Umgebung)
3. **Clips** – fal.ai animiert das Startbild passend zur Stimme (Lippen, Gesten, Laufen) in Abschnitten von max. 12 s
4. **Schnitt** – ffmpeg setzt alles zusammen, mit Jump-Cuts, Untertiteln, Serien-Label und Hook

## Einrichtung (einmalig)

1. **Charakterbild** als `assets/character.jpg` ablegen (das Porträt aus Canva).
2. **Konten anlegen:** [ElevenLabs](https://elevenlabs.io) und [fal.ai](https://fal.ai), jeweils API-Schlüssel erstellen.
3. **Stimme wählen:** In ElevenLabs eine Stimme aussuchen, die Voice-ID in `content/config.json` bei `ai.voice.voiceId` eintragen.
4. **Schlüssel als GitHub-Secrets** hinterlegen (Repo → Settings → Secrets and variables → Actions):
   `ELEVENLABS_API_KEY` und `FAL_KEY`.

## Benutzen

GitHub → *Actions* → *Videos erzeugen* → *Run workflow*

| Schritt | Tage | Modus | Zweck |
|---|---|---|---|
| 1 | `1,2,3` | `nur-startbilder` | Look prüfen (günstig) |
| 2 | `1` | `videos` | erstes komplettes Video prüfen |
| 3 | leer | `videos` | alle 55 |

Ergebnis unter dem Lauf als `ergebnis` herunterladen: `day-01.mp4` … plus `day-01.txt` (Beschreibung zum Kopieren)
und `scenes/` (Startbilder). Bereits erzeugte Teile werden zwischengespeichert und nicht doppelt bezahlt.

**Lokal:** `npm ci`, ffmpeg installieren, Schlüssel als Umgebungsvariablen setzen, dann `npm run videos -- --only 1`.
Testlauf ohne Kosten und ohne Internet: `npm run videos -- --dry-run --only 1`.

## Anpassen

| Was | Wo |
|---|---|
| Skripte, Hooks, Beschreibungen | `content/videos.js` |
| Umgebungen (neue Orte, laufen/sitzen) | `content/scenes.js` |
| Verteilung der Umgebungen | `scripts/lib/plan.js` (oder `scene`/`pose` direkt am Video setzen) |
| Call-to-Action, Hashtags, Stimme, KI-Modelle, Prompts | `content/config.json` |

Die KI-Modelle sind austauschbar: `ai.image` / `ai.video` in `content/config.json` enthalten Modellname,
Eingabefelder und das Feld mit dem Ergebnis-Link.

## Wichtig vor dem Posten

- **Kosten prüfen:** Video-KIs rechnen meist pro Sekunde ab. Vor „alle 55“ den Preis des Modells auf fal.ai ansehen
  und mit einem einzelnen Video testen.
- **Werbung kennzeichnen:** In jeder Beschreibung steht `#ad` + Risikohinweis; zusätzlich in der App die
  Kennzeichnung „Werbung / bezahlte Partnerschaft“ aktivieren. Link nur in die Bio.
- **Plattform-Regeln:** TikTok ist bei Werbung für Krypto und Finanzprodukte streng – aktuelle Richtlinien lesen.
- Die Inhalte sind allgemeine Aufklärung, keine Anlageberatung.
