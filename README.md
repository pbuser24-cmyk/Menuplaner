# Menuplan

Eine kleine, selbst gehostete Seite für die Wochenmenüplanung mit Rezepten von Fooby, Migusto, little FOOBY, Betty Bossi & Co.

## Auf GitHub Pages veröffentlichen

1. Erstelle ein neues **GitHub-Repository** (z. B. `menuplan`).
2. Lade `index.html`, `style.css`, `app.js` und `recipes.json` in dieses Repository hoch (per Web-Upload oder `git push`).
3. Gehe im Repository auf **Settings → Pages**.
4. Bei **Source** wähle den Branch `main` und Ordner `/ (root)`, dann **Save**.
5. Nach ein bis zwei Minuten ist die Seite unter `https://<dein-github-name>.github.io/menuplan/` erreichbar.

## Rezepte ergänzen

Öffne `recipes.json` und füge ein neues Objekt nach dem gleichen Muster hinzu:

```json
{
  "id": "eindeutiger-slug",
  "title": "Titel des Rezepts",
  "url": "https://…",
  "source": "Fooby",
  "image": "https://… (Bild-URL, optional leer lassen)",
  "season": ["sommer"],
  "type": "vegetarisch",
  "balanced": false,
  "time": 30,
  "servings": 4,
  "ingredients": ["200 g …", "1 Zwiebel", "…"]
}
```

- `season`: `"sommer"`, `"herbst"` (später auch `"winter"`, `"fruehling"` möglich)
- `type`: `"vegetarisch"`, `"vegan"` oder `"fleisch"`
- `balanced`: `true`, wenn die Quelle das Rezept als "gesund & ausgewogen" kennzeichnet

Nach dem Speichern und Hochladen der Datei aktualisiert sich die Seite automatisch (auf GitHub Pages ggf. 1–2 Minuten Cache-Verzögerung).

Rezepte, die du direkt über das Formular auf der Seite hinzufügst, landen nur in deinem Browser (localStorage) – nicht in `recipes.json`. Über "Fortschritt exportieren" kannst du sie als Datei sichern und bei Bedarf manuell in `recipes.json` übernehmen, wenn sie dauerhaft für alle Geräte verfügbar sein sollen.

## Fortschritt geräteübergreifend nutzen

Gekochte Rezepte, eigene Rezepte und dein Wochenplan liegen nur lokal im Browser. Mit **"Fortschritt exportieren"** lädst du eine `menuplan-fortschritt.json` herunter, die du z. B. ins Repository committen oder auf einem anderen Gerät über **"Fortschritt importieren"** wieder einlesen kannst. Es gibt (bewusst, siehe Chat) keine automatische Synchronisation ohne eigenes Backend.

## Bring-Einkaufsliste

Es gibt keinen offiziell dokumentierten Weg, einzelne Zutaten per Link direkt und automatisch in Bring einzutragen (das können nur Partnerseiten mit Bring-Zugang). Die Seite bietet daher:

- **"Für Bring teilen"** – nutzt die Teilen-Funktion des Betriebssystems; dort kannst du Bring auswählen.
- **"Liste kopieren"** – kopiert die ganze Einkaufsliste als Text zum Einfügen in Bring.

## Weitere Rezepte

Aktuell sind 10 Rezepte hinterlegt (Startpunkt). Für die geplanten 40–80 einfachen Hauptgerichte kannst du entweder selbst weitere Einträge nach obigem Muster ergänzen, oder mir in einem neuen Chat einfach weitere Rezeptlinks schicken – ich hole dann die Zutaten von der jeweiligen Seite und ergänze `recipes.json`.
