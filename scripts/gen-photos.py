#!/usr/bin/env python3
"""Grade and responsively encode the lifestyle photography.

The source photos in assets/papyr-redesign/ come from different shoots — two are
warm, three are cool grey. Shipped as-is they read as unrelated stock. This
applies a warm split-tone toward the Papyr palette (cream highlights, brown
shadows) so they look like one shoot, then writes responsive WebP.

Sources are 3-7 MB each (up to 6720px); output is ~50 KB at 1280px.

Requires Pillow and numpy.  Usage:  python3 scripts/gen-photos.py
"""
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT, "assets", "papyr-redesign")
OUT_DIR = os.path.join(ROOT, "assets", "photos")

# Papyr palette anchors
SHADOW = np.array([0.173, 0.149, 0.125], dtype=np.float32)  # #2c2620
HIGHLIGHT = np.array([0.980, 0.965, 0.937], dtype=np.float32)  # #faf6ef

# Per-photo grade. The sources come from different shoots:
#   strength — how far to pull toward the palette duotone
#   warmth   — white-balance shift (R up, B down); the grey sources need this
#   lift     — raise the black point; laptop-002 is a much darker scene
JOBS = {
    "laptop-001":   dict(strength=0.36, warmth=0.010, lift=0.010, widths=(960, 1440, 2000)),
    "laptop-002":   dict(strength=0.44, warmth=0.028, lift=0.085, widths=(960, 1440, 2000)),
    "notebook-001": dict(strength=0.40, warmth=0.014, lift=0.015, widths=(960, 1440, 2000)),
    "notebook-002": dict(strength=0.46, warmth=0.040, lift=0.020, widths=(960, 1440, 2000)),
    "notebook-003": dict(strength=0.46, warmth=0.038, lift=0.030, widths=(960, 1440)),
    # Field-journal plates (src names the source file when it differs)
    "ridge-dawn":   dict(src="mountain-ridge-fog-sunrise", strength=0.34, warmth=0.030, lift=0.030, widths=(960, 1440, 2000)),
    "topo-map":     dict(src="vintage-topographic-map", strength=0.40, warmth=0.020, lift=0.0, widths=(640, 960)),
    "fountain-pen": dict(src="fountain-pen-handwriting-journal", strength=0.38, warmth=0.024, lift=0.015, widths=(960, 1440, 2000)),
}


def grade(im, strength, warmth=0.0, lift=0.0):
    """Blend the photo toward a duotone ramp between the palette anchors.

    Keeps luminance detail (so it still reads as a photograph) while pulling
    hue and black point onto the brand palette. `warmth` corrects the cool-grey
    sources; `lift` opens up shadows on the darker ones.
    """
    a = np.asarray(im.convert("RGB")).astype(np.float32) / 255.0
    lum = (a @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32))[..., None]
    duo = SHADOW + (HIGHLIGHT - SHADOW) * lum
    out = a * (1.0 - strength) + duo * strength

    if warmth:
        out = out * np.array([1.0 + warmth, 1.0, 1.0 - warmth * 1.4], dtype=np.float32)
    if lift:
        out = out * (1.0 - lift) + lift  # raise blacks without clipping whites

    # Gentle contrast pull keeps it soft rather than muddy.
    out = np.clip((out - 0.5) * 0.96 + 0.5 + 0.012, 0.0, 1.0)
    return Image.fromarray((out * 255.0).astype(np.uint8))


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    total = 0
    for name, cfg in JOBS.items():
        src = os.path.join(SRC_DIR, f"{cfg.get('src', name)}.jpg")
        if not os.path.exists(src):
            print(f"  !! missing {src}")
            continue
        im = Image.open(src)
        graded = grade(im, cfg["strength"], cfg.get("warmth", 0.0), cfg.get("lift", 0.0))
        for w in cfg["widths"]:
            r = graded.copy()
            r.thumbnail((w, w * 4), Image.LANCZOS)
            out = os.path.join(OUT_DIR, f"{name}-{w}.webp")
            r.save(out, "WEBP", quality=80, method=6)
            size = os.path.getsize(out)
            total += size
            print(f"  {name}-{w}.webp  {r.size[0]}x{r.size[1]}  {size/1024:.0f} KB")
    print(f"\ntotal {total/1024:.0f} KB in {OUT_DIR}")


if __name__ == "__main__":
    main()
