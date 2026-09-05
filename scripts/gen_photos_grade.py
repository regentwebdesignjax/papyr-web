"""The Papyr photo grade, shared by gen-photos.py and gen-specimens.py.

Pulls hue and black point toward the brand palette (cream highlights, brown
shadows) while keeping luminance detail, so photos from different shoots read
as one.
"""
import numpy as np
from PIL import Image

SHADOW = np.array([0.173, 0.149, 0.125], dtype=np.float32)     # #2c2620
HIGHLIGHT = np.array([0.980, 0.965, 0.937], dtype=np.float32)  # #faf6ef


def grade(im, strength, warmth=0.0, lift=0.0):
    a = np.asarray(im.convert("RGB")).astype(np.float32) / 255.0
    lum = (a @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32))[..., None]
    duo = SHADOW + (HIGHLIGHT - SHADOW) * lum
    out = a * (1.0 - strength) + duo * strength
    if warmth:
        out = out * np.array([1.0 + warmth, 1.0, 1.0 - warmth * 1.4], dtype=np.float32)
    if lift:
        out = out * (1.0 - lift) + lift
    out = np.clip((out - 0.5) * 0.96 + 0.5 + 0.012, 0.0, 1.0)
    return Image.fromarray((out * 255.0).astype(np.uint8))
