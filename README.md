# SiYuan Flashcard Tracker 🚀

Ein elegantes, modulares und hochperformantes Firefox-Add-on zur automatischen Erfassung und Analyse deiner gelernten Karteikarten in **SiYuan Notes**. Das Plugin wurde nach den aktuellsten Web-Extension-Standards (**Manifest V3**) und modernen JavaScript-Paradigmen (**ES2026**) entwickelt.

---

## ✨ Features

- **Universelle URL-Kompatibilität (`<all_urls>`)**: Egal ob du SiYuan lokal über Docker, Desktop-Server oder auf einer entfernten Domain ausführst, das Plugin trackt zuverlässig mit.
- **Smart Context Interception (Capturing-Phase)**: Fängt Klicks auf Bewertungsknöpfe ab, bevor Framework-interne Methoden (`stopPropagation()`) Events blockieren können.
- **Umfangreiches Hotkey-Tracking**: Erkennt alle nativen Tastatur-Shortcuts von SiYuan (`1, 2, 3, 4` sowie `A, S, D, F`, `J, K, L, ;` und `Space / Enter`).
- **Modern Data Aggregation**: Nutzt das native Feature `Object.groupBy` für blitzschnelle Datenauswertungen im Popup.
- **Clean UI**: Minimalistisches Dark-Mode-Interface (Catppuccin-inspiriert) zur Filterung nach Datum oder Antworttyp.

---

## 📂 Projektstruktur

```text
siyuan-flashcard-tracker/
├── manifest.json   # Extension Configuration (Manifest V3)
├── content.js      # Isolated Execution Context Client Core (Capturing)
├── popup.html      # Analytisches Dashboard Interface Layout
└── popup.js        # ES2026 Aggregation- & Render-Pipeline#
```