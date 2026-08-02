#!/usr/bin/env python3
"""Generate PNG app icons (no external deps) for the Body Recomp Tracker PWA.

Draws a rounded-square gradient background with a white dumbbell glyph.
Outputs several sizes plus a maskable variant (extra padding).
"""
import struct, zlib, math, os

OUT = os.path.join(os.path.dirname(__file__), "icons")

# Palette — glowing "aura" orb: blue core → cyan → periwinkle edge
CENTER = (47, 98, 255)    # #2F62FF
MID    = (69, 182, 234)   # #45B6EA
EDGE   = (138, 123, 255)  # #8A7BFF


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def radial_bg(x, y, size):
    cx = cy = size / 2
    d = math.hypot(x - cx, y - cy) / (size * 0.72)
    if d < 0.5:
        return lerp(CENTER, MID, d / 0.5)
    return lerp(MID, EDGE, min(1.0, (d - 0.5) / 0.5))


def rounded_alpha(x, y, w, h, radius):
    """Return 0..1 coverage for a rounded rectangle covering the full canvas."""
    rx = min(x, w - 1 - x)
    ry = min(y, h - 1 - y)
    if rx >= radius or ry >= radius:
        return 1.0
    dx = radius - rx
    dy = radius - ry
    d = math.hypot(dx, dy)
    # 1px antialias band
    return max(0.0, min(1.0, radius - d + 0.5))


def in_rect(px, py, x0, y0, x1, y1, r=0):
    if px < x0 or px > x1 or py < y0 or py > y1:
        return 0.0
    if r <= 0:
        return 1.0
    cx = min(max(px, x0 + r), x1 - r)
    cy = min(max(py, y0 + r), y1 - r)
    d = math.hypot(px - cx, py - cy)
    return max(0.0, min(1.0, r - d + 0.5))


def dumbbell_coverage(px, py, size, pad_scale=1.0):
    """White dumbbell glyph coverage at pixel (px,py). Centered, scales with size."""
    s = size
    cx, cy = s / 2, s / 2
    # geometry as fractions of size, scaled for maskable padding
    unit = 0.11 * pad_scale
    bar_h = s * unit                      # bar thickness
    bar_w = s * 0.40 * pad_scale          # half-length of central bar
    plate_w = s * 0.075 * pad_scale       # plate thickness
    inner_h = s * 0.30 * pad_scale        # inner (tall) plate half-height
    outer_h = s * 0.21 * pad_scale        # outer (short) plate half-height
    gap = s * 0.015

    cov = 0.0
    # central bar
    cov = max(cov, in_rect(px, py, cx - bar_w, cy - bar_h / 2, cx + bar_w, cy + bar_h / 2, bar_h * 0.35))
    # plates (both sides)
    for sign in (-1, 1):
        inner_x = cx + sign * bar_w
        # inner tall plate
        x0 = inner_x - plate_w if sign > 0 else inner_x
        x1 = inner_x if sign > 0 else inner_x + plate_w
        cov = max(cov, in_rect(px, py, min(x0, x1), cy - inner_h, max(x0, x1), cy + inner_h, plate_w * 0.4))
        # outer short plate
        ox = inner_x + sign * (plate_w + gap)
        ox0 = ox - plate_w if sign > 0 else ox
        ox1 = ox if sign > 0 else ox + plate_w
        cov = max(cov, in_rect(px, py, min(ox0, ox1), cy - outer_h, max(ox0, ox1), cy + outer_h, plate_w * 0.4))
    return cov


def make_png(size, maskable=False):
    pad_scale = 0.78 if maskable else 1.0
    radius = 0 if maskable else int(size * 0.235)  # iOS masks its own corners anyway
    raw = bytearray()
    for y in range(size):
        raw.append(0)  # filter type 0
        for x in range(size):
            r, g, b = radial_bg(x, y, size)
            a = 255
            if not maskable:
                cov = rounded_alpha(x, y, size, size, radius)
                a = round(255 * cov)
            # glyph
            gcov = dumbbell_coverage(x, y, size, pad_scale)
            if gcov > 0:
                r = round(r + (255 - r) * gcov)
                g = round(g + (255 - g) * gcov)
                b = round(b + (255 - b) * gcov)
            raw.extend((r, g, b, a))

    def chunk(typ, data):
        c = struct.pack(">I", len(data)) + typ + data
        return c + struct.pack(">I", zlib.crc32(typ + data) & 0xffffffff)

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)  # 8-bit RGBA
    idat = zlib.compress(bytes(raw), 9)
    return sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")


targets = [
    ("icon-192.png", 192, False),
    ("icon-512.png", 512, False),
    ("apple-touch-icon.png", 180, False),
    ("icon-maskable-192.png", 192, True),
    ("icon-maskable-512.png", 512, True),
    ("favicon-64.png", 64, False),
]

os.makedirs(OUT, exist_ok=True)
for name, size, mask in targets:
    data = make_png(size, mask)
    with open(os.path.join(OUT, name), "wb") as f:
        f.write(data)
    print(f"wrote {name} ({size}px, {len(data)} bytes)")
print("done")
