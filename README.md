# Papyr — Website

Marketing site for **Papyr**, a private, beautifully typeset journal for iPhone, iPad, and Mac
(by Regent Media Group). Implemented from the `Papyr Website` Claude Design component.

## Structure

- `index.html` — the entire site. A single page with client-side routing between four views:
  - **Landing** (hero, features, privacy band, cross-device showcase, pricing, FAQ)
  - **Support** (getting-started guide, contact, common questions)
  - **Terms of Service** (legal)
  - **Privacy Policy** (legal)
- `assets/` — fonts and imagery.

No build step, no dependencies. Open `index.html` or serve the folder statically
(e.g. `npx http-server`).

## Implementation notes

- Vanilla HTML/CSS/JS. Fonts: Newsreader, Alegreya Sans, IBM Plex Mono (Google Fonts) and
  **Biorka** (bundled in `assets/fonts/`) for the wordmark.
- Interactivity mirrors the source design: a scroll-aware translucent header, hash-free
  view routing, smooth anchor scrolling, an accessible FAQ accordion, scroll-reveal
  animations (IntersectionObserver), a grain overlay, and full `prefers-reduced-motion`
  support. Nav links collapse below 640px.

## ⚠️ App screenshots are placeholders

The app screenshots and app icon under `assets/ios`, `assets/ipad`, `assets/mac`, and
`assets/papyr-app-icon.png` are **branded placeholder mockups** generated in the app's
palette. The original high-resolution App Store screenshots exceeded the design import
tool's per-file read limit and could not be retrieved in full.

To ship the real imagery, drop the originals in at these exact paths (filenames are already
referenced by `index.html`):

| Path | Shown as |
| --- | --- |
| `assets/papyr-app-icon.png` | header / footer / favicon icon |
| `assets/ios/01_home.png` | hero + Journals feature |
| `assets/ios/02_entry_editor.png` | Writing feature |
| `assets/ios/03_locked_journal.png` | Privacy feature |
| `assets/ios/04_travel_journal.png` | showcase (iPhone) |
| `assets/ios/05_export.png` | Export feature |
| `assets/ios/07_date_selector.png` | Details feature |
| `assets/ipad/01.png` | showcase (iPad) |
| `assets/mac/01-homepage.png` | showcase (Mac) |

The bundled Biorka fonts are the real, complete font files.
