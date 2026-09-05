#!/usr/bin/env python3
"""Grade and encode the small "specimen" photographs used on the landing page.

Sources live in assets/specimens-src/ (see assets/specimens-src/CREDITS.md for
where each one came from). They are graded with the same split-tone as the
large lifestyle photos so the whole page reads as one shoot, then written as
WebP at every width the source can honestly supply.

Drop a higher-resolution file over any source (same filename) and re-run:
the extra widths are written; add them to the <img> srcset in index.html.

Requires Pillow and numpy.  Usage:  python3 scripts/gen-specimens.py
"""
import os
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_photos_grade import grade  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT, "assets", "specimens-src")
OUT_DIR = os.path.join(ROOT, "assets", "photos")

WIDTHS = (400, 800, 1200)

JOBS = {
    "pressed-flowers": dict(strength=0.34, warmth=0.030, lift=0.0),
}


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for name, job in JOBS.items():
        src = os.path.join(SRC_DIR, name + ".jpg")
        if not os.path.exists(src):
            print("skip (missing):", src)
            continue
        im = grade(Image.open(src), **job)
        for w in WIDTHS:
            if w > im.width and w != WIDTHS[0]:
                continue  # never upscale
            out = im if w >= im.width else im.resize(
                (w, round(im.height * w / im.width)), Image.LANCZOS)
            path = os.path.join(OUT_DIR, f"specimen-{name}-{w}.webp")
            out.save(path, "WEBP", quality=80, method=6)
            print(f"{path}  {out.width}x{out.height}  {os.path.getsize(path)//1024} KB")


if __name__ == "__main__":
    main()
