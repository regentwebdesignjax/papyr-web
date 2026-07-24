# Papyr — Website

Marketing site for **Papyr**, a private, beautifully typeset journal for iPhone, iPad, and Mac
(by Regent Media Group).

Static site — **no build step, no dependencies, no third-party requests.**
Serve the repo root (`python3 -m http.server`, `npx http-server`, Netlify, …).

## Structure

| File | Purpose |
| --- | --- |
| `index.html` | Markup for all four views + head/SEO/JSON-LD |
| `styles.css` | Design system — tokens, components, dark mode |
| `main.js` | Routing, header state, mobile nav, accordions, reveals |
| `netlify.toml` | Route rewrites, cache headers, security headers |
| `site.webmanifest` | PWA/homescreen metadata |
| `assets/` | Fonts, screenshots, icons, texture |
| `scripts/` | Asset generation (see below) |

### Views

One document, four client-side views with **real URLs** (`/`, `/support`, `/terms`,
`/privacy`) via the History API. Deep links, reload, and the back button all work
because `netlify.toml` rewrites those paths to `index.html` with a `200`.

If you host somewhere other than Netlify, replicate that rewrite or the routes 404.

## Design system

All tokens live in `:root` at the top of `styles.css` — colour, a type scale, a 4px
spacing scale, radii, a four-step warm elevation scale, and easing curves. Change a
token, not a component.

- **Type**: Newsreader (headings), Alegreya Sans (body), IBM Plex Mono (eyebrows),
  Biorka (wordmark).
- **Dark mode**: a warm dark theme via `prefers-color-scheme`, suited to a bedside app.
- **Motion**: staggered directional scroll reveals, gated behind a `.js` class so content
  is never left invisible if scripting doesn't run, and fully disabled under
  `prefers-reduced-motion`.
- **Depth**: device frames are drawn hardware (gradient body, bezel highlight, inset
  screen well, layered ambient + contact shadow) rather than flat rectangles.

### Two non-obvious CSS rules — don't "clean these up"

1. `img { height: auto; }` — the `width`/`height` attributes on screenshots are
   presentational hints. Setting only a CSS `width` does **not** override the hinted
   height, and every screenshot renders at full intrinsic height (the page doubles in
   length).
2. The grain-stacking rule deliberately excludes `header`. `body > header` is more
   specific than `header`, so including it silently overrides `position: fixed`.

## Privacy

The site makes **zero third-party requests**. Fonts are self-hosted rather than pulled
from `fonts.gstatic.com`, so the site holds to the same promise the app makes. There is
no analytics, and nothing to consent to. Please keep it that way — adding an embed or a
hosted font re-introduces third-party tracking on a privacy-first product.

## Assets

| Path | Shown as |
| --- | --- |
| `assets/papyr-app-icon.png` | header / footer logo |
| `assets/favicon-*.png`, `apple-touch-icon.png`, `icon-*.png` | favicons / homescreen |
| `assets/app-store-badge.svg` | official Apple badge (hero, pricing, footer) |
| `assets/og-image.png` | 1200×630 social share card |
| `assets/ios/01_home.*` | hero + Journals feature |
| `assets/ios/02_entry_editor.*` | Writing feature |
| `assets/ios/03_locked_journal.*` | Privacy feature |
| `assets/ios/04_travel_journal.*` | showcase (iPhone) |
| `assets/ios/05_export.*` | Export feature |
| `assets/ios/07_date_selector.*` | Details feature |
| `assets/ios/06_new_journal.png` | spare, not currently referenced |
| `assets/ipad/01.*` | showcase (iPad) |
| `assets/mac/01-homepage.*` | showcase (Mac) |
| `assets/paper-texture.webp` | tileable texture behind the cream bands |
| `assets/fonts/` | Biorka + self-hosted webfonts |

Screenshots ship as an optimized **`.webp`** (~2× display width) alongside the
full-resolution **`.png`**, served via `<picture>`. Modern browsers fetch ~370 KB of
WebP instead of ~24 MB of PNG; the PNGs remain the source of truth.

### Regenerating assets

```bash
python3 scripts/gen-webp.py     # WebP copies of screenshots (needs Pillow)
python3 scripts/gen-assets.py   # paper texture + favicon set (needs Pillow, numpy)
python3 scripts/fetch-fonts.py  # re-download self-hosted webfonts

# social card — renders scripts/og-template.html in a real browser
python3 -m http.server 8899 &
node scripts/gen-og.cjs http://127.0.0.1:8899
```

## Known gaps / next steps

- **The App Store links are placeholders.** All three badges and the header
  "Download" button point at `#`. Nothing else matters until these point at the real
  App Store URL.
- **No lifestyle photography.** Every image is a flat UI screenshot; there's no human
  presence. Commissioned or art-directed photography is the single biggest remaining
  upgrade to how premium the site feels.
- **No social proof.** No ratings, reviews, or founder story. Deliberately left empty
  rather than filled with placeholder claims — add only real ones.
- The canonical/OG URLs assume `https://papyr.regentmediagroup.com`. Update them if the
  domain differs.
