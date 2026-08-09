# Vendored libraries

These are checked in rather than loaded from a CDN **on purpose**. The site's privacy
promise is that it makes zero third-party requests (see the Privacy section of the root
README) — pulling GSAP or Three.js from unpkg/jsdelivr at runtime would break that on
every page view.

Do not replace these with CDN `<script>` tags.

| File | Package | Version | License |
| --- | --- | --- | --- |
| `gsap.min.js` | [gsap](https://www.npmjs.com/package/gsap) | 3.15.0 | GSAP standard "no charge" license |
| `ScrollTrigger.min.js` | gsap | 3.15.0 | ditto |
| `SplitText.min.js` | gsap | 3.15.0 | ditto |
| `three.module.min.js` | [three](https://www.npmjs.com/package/three) | 0.169.0 | MIT |

GSAP's plugins (including ScrollTrigger and SplitText) are free to use under the standard
license: https://gsap.com/standard-license

## Transfer cost (gzipped)

| File | gzip |
| --- | --- |
| `gsap.min.js` | ~28 KB |
| `ScrollTrigger.min.js` | ~18 KB |
| `SplitText.min.js` | ~4 KB |
| `three.module.min.js` | ~170 KB |

Three.js is **not** part of the critical path. `main.js` dynamically imports it only when
the hero shader is actually going to run — desktop width, WebGL2 available, and
`prefers-reduced-motion` unset. Mobile and reduced-motion visitors never download it.

## Updating

```bash
cd /tmp
npm pack gsap@3
npm pack three@0
tar xzf gsap-*.tgz && tar xzf three-*.tgz
cp package/dist/{gsap,ScrollTrigger,SplitText}.min.js  <repo>/vendor/
cp package/build/three.module.min.js                   <repo>/vendor/
```

Then update the version numbers in the table above.
