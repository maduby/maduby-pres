# Storyline-Docs

Arbeitsordner fuer die morgige 30-Minuten-Praesentation ueber Marc Duby
(frueher Marc Fehr vor der Heirat).

Ziel dieses Ordners:

- die Geschichte zuerst in Markdown schaerfen
- bestehende Slide-Komponenten weiterverwenden
- Inhalte iterativ ueben, kuerzen und umstellen
- spaeter Bilder in `docs/storyline/assets/` legen und danach ins Deck uebernehmen

## Dateien in diesem ersten Durchlauf

- `01-roter-faden-v1.md`
  - Story-Bogen, Kapitel, Timing, Tonalitaet
- `02-slide-stack-v1.md`
  - erster konkreter Slide-Plan mit empfohlenem Komponenten-Typ
- `03-umfragen-v1.md`
  - drei Live-Polls in deutscher Fassung
- `04-bildplan-v1.md`
  - welche Bilder/Screenshots spaeter sinnvoll waeren
- `05-offene-fragen-v1.md`
  - Punkte, die wir vor der finalen Umsetzung noch pruefen sollten

## Zweiter Durchlauf: poetischer, knapper, bildstarker

- `06-erzaehlhaltung-v2.md`
  - wie der Talk als Geschichte funktionieren soll
- `07-slide-stack-poetisch-v2.md`
  - kuerzerer, foto-lastiger Slide-Plan mit knappen On-Slide-Texten
- `08-bildsprache-und-hobbys-v2.md`
  - wie Fotografie, Berge, Klettern, Trailrunning und Cycling organisch reinpassen
- `09-ai-kapitel-v1.md`
  - AI-Abschnitt, Analogie mit den Hunden und moegliche Slide-Position im Talk

## Arbeitsprinzip fuer die naechsten Iterationen

1. Roter Faden und Reihenfolge pruefen.
2. Slides kuerzen, zusammenlegen oder erweitern.
3. Bilder/Screenshots in `docs/storyline/assets/` legen.
4. `npm run optimize:storyline-images` ausfuehren.
5. Optimierte `.webp`-Dateien direkt aus `docs/storyline/assets/` importieren.
6. Danach Inhalte in `src/content/slides.de-ch.ts` uebernehmen.
7. Zum Schluss Feinschliff fuer Timing, Bildsprache und Moderationsnotizen.

## Empfehlung fuer morgen

V1 ist die sachliche Grundlage.

V2 ist die Richtung, die naeher an deiner Stimme klingt:

- poetischer
- kuerzer auf den Slides
- mehr Raum fuer Erzaehlung
- mehr Fotos und Atmosphaere

## Hinweis zu den Komponenten

Der aktuelle Code kann bereits gut mit diesen Slide-Typen arbeiten:

- `title`
- `section`
- `text`
- `timeline`
- `quote`
- `twoColumn`
- `media`
- `livePoll`

Der Slide-Stack in diesem Ordner ist bewusst so geschrieben, dass er sich spaeter
moeglichst direkt auf diese bestehenden Komponenten abbilden laesst.
