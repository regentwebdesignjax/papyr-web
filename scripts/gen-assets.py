#!/usr/bin/env python3
"""Generate derived brand assets: paper texture + favicon set.

- assets/paper-texture.png : a seamlessly tileable, very subtle paper fibre
  texture. Used at low opacity behind the cream "band" sections so the
  "feels like paper" promise is something you can actually see.
- assets/favicon-*.png, apple-touch-icon.png : resized from the app icon.

Requires Pillow and numpy.  Usage:  python3 scripts/gen-assets.py
"""
import os

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def wrapped_blur(a, radius):
    """Box blur that wraps at the edges, so the result stays tileable."""
    out = np.zeros_like(a)
    n = 0
    for dy in range(-radius, radius + 1):
        for dx in range(-radius, radius + 1):
            out += np.roll(np.roll(a, dy, axis=0), dx, axis=1)
            n += 1
    return out / n


def paper_texture(size=512, seed=11):
    """Seamless paper fibre: fine grain + faint long fibres, low contrast."""
    rng = np.random.default_rng(seed)

    grain = wrapped_blur(rng.normal(0, 1, (size, size)), 1)

    # Faint directional fibres — blur a noise field far more on one axis.
    fib = rng.normal(0, 1, (size, size))
    acc = np.zeros_like(fib)
    for dx in range(-12, 13):
        acc += np.roll(fib, dx, axis=1)
    fibres = acc / 25.0

    # Broad mottling, so it doesn't read as uniform TV static.
    mottle = wrapped_blur(rng.normal(0, 1, (size, size)), 6)

    field = 0.55 * grain + 0.30 * fibres + 1.6 * mottle
    field /= np.abs(field).max() or 1.0

    # Map to a tight band around mid-grey; it's applied at low opacity anyway.
    arr = np.clip(128 + field * 26, 0, 255).astype(np.uint8)
    return Image.fromarray(arr, mode="L")


def favicons(src_path):
    src = Image.open(src_path).convert("RGBA")
    made = []
    for size, name in [
        (16, "favicon-16.png"),
        (32, "favicon-32.png"),
        (180, "apple-touch-icon.png"),
        (192, "icon-192.png"),
        (512, "icon-512.png"),
    ]:
        out = os.path.join(ROOT, "assets", name)
        src.resize((size, size), Image.LANCZOS).save(out, "PNG", optimize=True)
        made.append((name, os.path.getsize(out)))
    return made


def main():
    # 256px tile in WebP: noise is high-entropy and compresses badly as PNG,
    # so lossy WebP at a small tile keeps this to a few KB.
    tex_path = os.path.join(ROOT, "assets", "paper-texture.webp")
    tex = paper_texture(size=256).filter(ImageFilter.SMOOTH)
    tex.save(tex_path, "WEBP", quality=72, method=6)
    print(f"paper-texture.webp  {tex.size[0]}x{tex.size[1]}  {os.path.getsize(tex_path)/1024:.1f} KB")

    for name, size in favicons(os.path.join(ROOT, "assets", "papyr-app-icon.png")):
        print(f"{name}  {size//1024} KB")


if __name__ == "__main__":
    main()
