# Our Constellation — Love for Mena

Every memory becomes a star, and the stars join up in the order they happened,
until the sky looks exactly like us. Part of the **Love for Mena** collection.

**Live:** https://menaammarpro.github.io/love-constellation/

## What it does

- Add a memory (a title, and as much detail as you like)
- Each one lights up as a **star**, placed on a slow spiral
- Stars are **joined in date order**, so the shape of us grows over time
- Tap a star (on the canvas or in the list) to read it back
- Remove a star, or clear the whole sky
- Everything stays on the device — no tracking, no network calls
- Installable PWA with offline support

## How it works

Positions are stored as normalised coordinates (0..1) under `mena-constellation`,
so the layout never shifts when the page is reopened or resized.

## Files

- `index.html` — the page
- `css/theme.css` — shared love-theme (copied from `_love-theme/`)
- `css/app.css` — page-specific styles
- `js/theme-main.js`, `js/effects.js` — shared behaviour/effects
- `js/app.js` — constellation logic
- `manifest.webmanifest`, `sw.js` — PWA
- `assets/` — favicon and icons

## Run locally

```powershell
py -m http.server 8000
```

Then visit http://localhost:8000.

## Deploy

Static site, deployed with GitHub Pages from `main`.

## License

Creative Commons BY-NC-ND 4.0 — see [`LICENSE`](LICENSE).
© 2026 Ammar (MenaAmmarPro). Made with care for Mena.
