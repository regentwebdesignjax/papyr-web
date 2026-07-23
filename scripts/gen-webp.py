#!/usr/bin/env python3
"""Generate optimized WebP copies of the App Store screenshots.

Each screenshot is downscaled to ~2x its on-screen display width and saved as a
.webp next to the .png original. index.html serves them via <picture> with the
PNG as fallback. Requires Pillow with WebP support (`pip install Pillow`).

Usage:  python3 scripts/gen-webp.py
"""
import os
from PIL import Image

# (source png, target max width) — widths are ~2x the largest on-screen size
JOBS = [
    ("assets/ios/01_home.png",            720),
    ("assets/ios/02_entry_editor.png",    600),
    ("assets/ios/03_locked_journal.png",  600),
    ("assets/ios/04_travel_journal.png",  600),
    ("assets/ios/05_export.png",          600),
    ("assets/ios/07_date_selector.png",   600),
    ("assets/ipad/01.png",                900),
    ("assets/mac/01-homepage.png",       1600),
]

def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    for rel, width in JOBS:
        src = os.path.join(root, rel)
        im = Image.open(src).convert("RGB")
        if im.width > width:
            im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
        out = os.path.splitext(src)[0] + ".webp"
        im.save(out, "WEBP", quality=82, method=6)
        print(f"{os.path.relpath(out, root)}  {im.width}x{im.height}  {os.path.getsize(out)//1024}KB")

if __name__ == "__main__":
    main()
