# 🔎 AMP CubeCoders App Catalog

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://blutmonsterr.de/github/demo/amp-cubecoders-app-catalog/)

> **Note:** This project is a standalone web interface to browse applications available for [CubeCoders AMP](https://cubecoders.com/AMP).

> 🇬🇧 **English Version:** Scroll down for the English documentation.

---

## 🇩🇪 Deutsche Dokumentation

Dieses Projekt bietet eine saubere, schnelle und durchsuchbare Weboberfläche, um die verfügbaren Applikationen für den [AMP (Application Management Panel)](https://cubecoders.com/AMP) zu durchsuchen. Es ist darauf ausgelegt, leicht konfigurierbar und erweiterbar zu sein.

### ✨ Features

- **⚡️ Schnelle Suche:** Filtere Applikationen sofort nach Name, Beschreibung oder Alias. Nutze `f:new`, `f:beta` oder `f:crossplay` für spezielle Filter.
- **🌐 Mehrsprachig:** Unterstützt standardmäßig Deutsch, Englisch, Französisch und Niederländisch.
- **🔧 Konfigurierbar:** Ändere einfach den Titel, die Standardsprache und Features über eine zentrale `config.js`-Datei.
- **🧩 Erweiterbar:** Füge ganz einfach eigene Applikationslisten hinzu.
- **🖼️ Lazy-Loading für Bilder:** Für eine flüssigere Benutzererfahrung und bessere Performance.
- **🔍 Interaktive Detailansicht:** Klicke auf eine App für eine vergrößerte Ansicht mit Details. Direkte Links zu Apps und Suchanfragen sind über die URL möglich.

### 🚀 Live-Demo

Eine Live-Version dieses Projekts findest du hier: [![Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://blutmonsterr.de/github/demo/amp-cubecoders-app-catalog/)

### 🛠️ Installation

Dieses Projekt ist eine reine **statische Webseite** (HTML/JS/CSS). Es wird kein Backend (PHP, Node.js, etc.) benötigt.

1. Lade die Dateien aus diesem Repository herunter.
2. Lade sie auf deinen Webserver hoch (z.B. Apache, Nginx, IIS).
3. Rufe die URL in deinem Browser auf.

### ⚙️ Konfiguration

Die Hauptkonfiguration erfolgt in der Datei `config.js`.

```javascript
window.config = {
    title: "CubeCoders App Catalog", // Titel im Browser-Tab
    placeholder: "Minecraft, Valve, ...",
    language: {
        enabled: true,  // Sprachwahl aktivieren
        default: 'de',  // Standardsprache
        disabled: []    // Deaktivierte Sprachen z.B. ['fr']
    },
    features: {
        customApps: true,    // Custom-Apps Bereich anzeigen
        themeSwitcher: true, // Theme-Switcher anzeigen
        defaultTheme: 'dark', // 'dark' oder 'light'
        backButton: {
            enabled: true,
            url: "ADRESS",
            text: "" // Leer lassen für Übersetzung
        },
        extraLink: {
            enabled: true,
            url: "https://amp.domain.com/",
            text: "AMP - Login"
        },
        searchHelp: {
            enabled: true,
            items: ["f:new", "f:beta", "f:crossplay"]
        }
    }
};
```

## 📦 Applikationen hinzufügen

Du kannst neue Applikationen hinzufügen, indem du die entsprechenden JSON-Dateien im Ordner `js/apps/` bearbeitest:

- `apps.json`: Die Hauptliste der Applikationen.
- `apps-g.json`: Eine optionale, zweite Liste (z.B. für "Greelan Apps").
- `apps-c.json`: Die Liste für benutzerdefinierte Applikationen ("Custom Apps").

Jede Applikation wird als JSON-Objekt mit der folgenden Struktur definiert:

```json
{
    "name": "Name der App",
    "desc": "Kurze Beschreibung oder Entwickler",
    "image": "bildname.webp",
    "alias": "such-alias optional",
    "isNew": "2025-12-31", // true oder Datum (YYYY-MM-DD), bis wann der "Neu"-Badge angezeigt wird
    "isBeta": "2025-12-31",// true oder Datum (YYYY-MM-DD), bis wann der "Beta"-Badge angezeigt wird
    "isCrossplay": true    // true, wenn die App Crossplay unterstützt
}
```

- `name`: Der Anzeigename der Applikation.
- `desc`: Eine kurze Beschreibung.
- `image`: Der Dateiname des Bildes im Ordner `images/games/`.
- `alias`: (Optional) Zusätzliche Suchbegriffe, getrennt durch Leerzeichen.

## 🌐 Neue Sprachen hinzufügen

1.  **Datei erstellen:** Erstelle eine neue Datei im Ordner `js/lang/`, z.B. `es.js` für Spanisch.
2.  **Übersetzungen einfügen:** Kopiere den Inhalt aus einer bestehenden Sprachdatei (z.B. `en.js`) und übersetze die Werte.

    ```javascript
    // js/lang/es.js
    window.translations = window.translations || {};
    window.translations['es'] = {
        heading: "Buscar",
        placeholder: "Minecraft, Valve, ...",
        // ... alle anderen Schlüssel
    };
    ```
3.  **Skript einbinden:** Binde die neue Sprachdatei in der `index.html` ein. Das Dropdown-Menü wird automatisch aktualisiert.

    ```html
    <!-- index.html -->
    ...
    <script src="js/lang/fr.js"></script>
    <script src="js/lang/es.js"></script> <!-- Neue Sprache hier einfügen -->
    ...
    ```
4.  **(Optional) `config.js` aktualisieren:** Füge die neue Sprache im Kommentar der `config.js` hinzu, um die verfügbaren Optionen zu dokumentieren.

## 📜 Lizenz

Dieses Projekt steht unter der MIT-Lizenz.

---

# CubeCoders App Catalog (English)

This project provides a clean, fast, and searchable web interface to browse available applications for the [AMP (Application Management Panel)](https://cubecoders.com/AMP). It is designed to be easily configurable and extensible.

## ✨ Features

- **⚡️ Fast Search:** Filter applications instantly by name, description, or alias. Use `f:new`, `f:beta` or `f:crossplay` for special filters.
- **🌐 Multilingual:** Supports German, English, French, and Dutch by default.
- **🔧 Configurable:** Easily change the title, default language, and features via a central `config.js` file.
- **🧩 Extensible:** Easily add your own application lists.
- **🖼️ Lazy-Loading for Images:** For a smoother user experience and better performance.
- **🔍 Interactive Detail View:** Click on an app for an enlarged view with details. Direct links to apps and search queries are possible via the URL.

## 🚀 Live Demo

You can find a live version of this project here: [![Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://blutmonsterr.de/github/demo/amp-cubecoders-app-catalog/)

## 🛠️ Installation

This project is a purely **static website** (HTML/JS/CSS). No backend (PHP, Node.js, etc.) is required.

1. Download the files from this repository.
2. Upload them to your web server (e.g., Apache, Nginx, IIS).
3. Open the URL in your browser.

## ⚙️ Configuration

The main configuration is done in the `config.js` file.

```javascript
window.config = {
    title: "CubeCoders App Catalog", // Title in browser tab
    placeholder: "Minecraft, Valve, ...",
    language: {
        enabled: true,  // Enable language selection
        default: 'de',  // Default language
        disabled: []    // Disabled languages e.g. ['fr']
    },
    features: {
        customApps: true,    // Show Custom Apps section
        themeSwitcher: true, // Show Theme Switcher
        defaultTheme: 'dark', // 'dark' or 'light'
        backButton: {
            enabled: true,
            url: "ADDRESS",
            text: "" // Leave empty for translation
        },
        extraLink: {
            enabled: true,
            url: "https://amp.domain.com/",
            text: "AMP - Login"
        },
        searchHelp: {
            enabled: true,
            items: ["f:new", "f:beta", "f:crossplay"]
        }
    }
};
```

## 📦 Adding Applications

You can add new applications by editing the corresponding JSON files in the `js/apps/` folder:

- `apps.json`: The main list of applications.
- `apps-g.json`: An optional second list (e.g., for "Greelan Apps").
- `apps-c.json`: The list for custom applications ("Custom Apps").

Each application is defined as a JSON object with the following structure:

```json
{
    "name": "App Name",
    "desc": "Short description or developer",
    "image": "imagename.webp",
    "alias": "search-alias optional",
    "isNew": "2025-12-31", // true or a date (YYYY-MM-DD) until which the "New" badge is displayed
    "isBeta": "2025-12-31",// true or a date (YYYY-MM-DD) until which the "Beta" badge is displayed
    "isCrossplay": true    // true if the app supports crossplay
}
```

- `name`: The display name of the application.
- `desc`: A short description.
- `image`: The filename of the image in the `images/games/` folder.
- `alias`: (Optional) Additional search terms, separated by spaces.

## 🌐 Adding New Languages

1.  **Create File:** Create a new file in the `js/lang/` folder, e.g., `es.js` for Spanish.
2.  **Insert Translations:** Copy the content from an existing language file (e.g., `en.js`) and translate the values.

    ```javascript
    // js/lang/es.js
    window.translations = window.translations || {};
    window.translations['es'] = {
        heading: "Buscar",
        placeholder: "Minecraft, Valve, ...",
        // ... all other keys
    };
    ```
3.  **Include Script:** Include the new language file in `index.html`. The dropdown menu will update automatically.

    ```html
    <!-- index.html -->
    ...
    <script src="js/lang/fr.js"></script>
    <script src="js/lang/es.js"></script> <!-- Add new language here -->
    ...
    ```
4.  **(Optional) Update `config.js`:** Add the new language in the comment of `config.js` to document available options.

## 📜 License

This project is licensed under the MIT License.
 
