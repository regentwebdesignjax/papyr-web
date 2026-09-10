# Papyr — Website

Marketing site for **Papyr**, a private, beautifully typeset journal for iPhone, iPad, and Mac
(by Regent Media Group).

Static site — **no build step, no dependencies, no third-party requests.**
Serve the repo root (`python3 -m http.server`, `npx http-server`, Netlify, …).

## Structure

| File | Purpose |
| --- | --- |
| `index.html` | Markup for all four views + head/SEO/JSON-LD |
| `styles.css` | Design system — tokens, flat components, the trail |
| `main.js` | Routing, header state, mobile nav, accordions, reveals, trail progress |
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
- **Flat**: no drop shadows, no gradients. Depth comes from surface tone (canvas →
  card → manilla → oat) and hairline borders. The footer is the only dark surface, and
  the filled terracotta button is the only loud element.
- **The trail**: the landing page is structured as a route with numbered waypoints. On
  wide screens a fixed marker down the left edge fills as you scroll and counts
  elevation up to 4,990 ft (the $4.99); on narrow screens it becomes a hairline under
  the header. The sticky number column beside each chapter is plain CSS `position:
  sticky` — there is no scroll library.
- **Motion**: arrival reveals only, gated behind a `.js` class so content is never left
  invisible if scripting doesn't run, and fully disabled under `prefers-reduced-motion`.

### Three non-obvious CSS rules — don't "clean these up"

1. `img { height: auto; }` — the `width`/`height` attributes on screenshots are
   presentational hints. Setting only a CSS `width` does **not** override the hinted
   height, and every screenshot renders at full intrinsic height (the page doubles in
   length).
2. The fixed site header is styled by the bare `header` selector. Chapter plates inside
   the page are therefore `<div class="wp-plate">`, not `<header>` — using `<header>`
   there pins every chapter title to the top of the viewport.
3. `min-width: 0` on grid and flex items (`.wp-body`, `.split-copy`, `.mac`, `.pair`,
   …), and `minmax(0, 1fr)` rather than a bare `1fr` for every track. The spec default
   is `min-width: auto`, which refuses to shrink an item below its content — one
   fixed-width figure then stretches its whole section past the viewport. Because the
   page clips overflow (below), that goes unnoticed: nothing scrolls sideways, the
   section is just cropped off-screen on phones.

### Why overflow is clipped, and how to catch what it hides

`body { overflow-x: hidden }` and `main { overflow-x: clip }` exist so the reveal
animations' horizontal offset can't widen the page. The cost is that real layout
overflow is silent. `node scripts/check-responsive.cjs` measures every element against
the viewport at eight widths across all four routes and exits non-zero if anything
hangs over the edge — run it after touching layout CSS.

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
| `assets/photos/*.webp` | graded lifestyle photography (generated) |
| `assets/papyr-redesign/*.jpg` | photo sources for `gen-photos.py` |
| `assets/specimens-src/` | small Unsplash inserts + `CREDITS.md` |
| `assets/fonts/` | Biorka + self-hosted webfonts |

Screenshots ship as an optimized **`.webp`** (~2× display width) alongside the
full-resolution **`.png`**, served via `<picture>`. Modern browsers fetch ~370 KB of
WebP instead of ~24 MB of PNG; the PNGs remain the source of truth.

### Regenerating assets

```bash
python3 scripts/gen-webp.py     # WebP copies of screenshots (needs Pillow)
python3 scripts/gen-assets.py   # favicon set (needs Pillow, numpy)
python3 scripts/gen-photos.py   # grade + encode the photography (needs Pillow, numpy)
python3 scripts/gen-specimens.py
python3 scripts/fetch-fonts.py  # re-download self-hosted webfonts

# layout check — fails if anything overflows the viewport on mobile
python3 -m http.server 8899 &
node scripts/check-responsive.cjs

# social card — renders scripts/og-template.html in a real browser
python3 -m http.server 8899 &
node scripts/gen-og.cjs http://127.0.0.1:8899
```

## Known gaps / next steps

- **Photo credits.** Three of the plates (`fountain-pen`, `ridge-dawn`, `topo-map`)
  came from Unsplash without a recorded photographer — see
  `assets/specimens-src/CREDITS.md` to fill them in.
- **No social proof.** No ratings, reviews, or founder story. Deliberately left empty
  rather than filled with placeholder claims — add only real ones.
- The canonical/OG URLs assume `https://papyr.regentmediagroup.com`. Update them if the
  domain differs.
