#!/usr/bin/env python3
"""
EP01 S01/S14 SCHEMATIC PLACEHOLDER scene refs (procedural, offline, deterministic) per SCENE_REF_SPEC_S01_S14.
NOT final art. No people, no readable text (spec); labelled via filename + PNG tEXt metadata + REF_INDEX note.
Usage: python3 gen_ep01_scene_schematics.py OUT_DIR
"""
import math, random, sys, os
from PIL import Image, ImageDraw, ImageFilter
from PIL.PngImagePlugin import PngInfo

W, H = 1344, 768

def meta(scene):
    m = PngInfo()
    m.add_text("Label", "SCHEMATIC PLACEHOLDER - not final art, not HUMAN_LOCK")
    m.add_text("Scene", scene)
    m.add_text("Spec", "wave14/ep01/refs/SCENE_REF_SPEC_S01_S14.md")
    m.add_text("Generator", "gen_ep01_scene_schematics.py v1 (procedural, offline)")
    return m

def s01(path):
    rnd = random.Random(101)
    img = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(img)
    for y in range(H):  # cold night gradient
        t = y / H
        d.line([(0, y), (W, y)], fill=(int(8 + 10 * t), int(14 + 22 * t), int(38 + 40 * t)))
    for _ in range(220):  # stars upper half
        x, y = rnd.randrange(W), rnd.randrange(int(H * 0.45))
        b = rnd.randrange(120, 220); d.point((x, y), fill=(b, b, min(255, b + 20)))
    mx, my, mr = int(W * 0.18), int(H * 0.18), 46  # full moon upper-left
    glow = Image.new("RGB", (W, H)); gd = ImageDraw.Draw(glow)
    gd.ellipse([mx - mr * 3, my - mr * 3, mx + mr * 3, my + mr * 3], fill=(40, 50, 80))
    img = Image.blend(img, glow.filter(ImageFilter.GaussianBlur(40)), 0.35); d = ImageDraw.Draw(img)
    d.ellipse([mx - mr, my - mr, mx + mr, my + mr], fill=(222, 230, 245))
    # city skyline foreground with lights
    x = 0
    while x < W:
        bw, bh = rnd.randrange(30, 90), rnd.randrange(60, 200)
        d.rectangle([x, H - bh, x + bw, H], fill=(10, 14, 26))
        for _ in range(bw * bh // 900):
            lx, ly = rnd.randrange(x + 3, x + bw - 3), rnd.randrange(H - bh + 4, H - 4)
            d.rectangle([lx, ly, lx + 2, ly + 3], fill=(230, 200, 120) if rnd.random() < .8 else (200, 60, 70))
        x += bw + rnd.randrange(2, 10)
    # academy main building centre-right on a rise
    ax, ay = int(W * 0.60), int(H * 0.52)
    d.polygon([(ax - 260, H * 0.70), (ax + 300, H * 0.70), (ax + 340, H), (ax - 300, H)], fill=(14, 18, 32))
    d.rectangle([ax - 180, ay, ax + 180, H * 0.72], fill=(20, 26, 44))
    d.rectangle([ax - 40, ay - 120, ax + 40, ay], fill=(22, 28, 48))
    d.polygon([(ax - 50, ay - 120), (ax + 50, ay - 120), (ax, ay - 190)], fill=(26, 32, 54))
    for i in range(-160, 170, 30):
        for j in range(int(ay) + 15, int(H * 0.70), 28):
            d.rectangle([ax + i, j, ax + i + 10, j + 14], fill=(60, 70, 110))
    # crimson barrier dome (semi-transparent lattice)
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0)); od = ImageDraw.Draw(ov)
    cx, cy, rx, ry = ax, int(H * 0.72), 430, 420
    od.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], outline=(200, 40, 70, 120), width=3)
    for k in range(1, 7):
        a = k * math.pi / 7
        hw = abs(rx * math.cos(a)) + 1
        od.arc([cx - hw, cy - ry, cx + hw, cy + ry], 180, 360, fill=(200, 40, 70, 60), width=1)
    for k in range(1, 5):
        yy = cy - ry * k / 5; hw = rx * math.sqrt(max(0, 1 - (k / 5) ** 2))
        od.line([(cx - hw, yy), (cx + hw, yy)], fill=(200, 40, 70, 50), width=1)
    od.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=(160, 20, 50, 18))
    img = Image.alpha_composite(img.convert("RGBA"), ov.filter(ImageFilter.GaussianBlur(1))).convert("RGB")
    # bottom third kept darker for subtitle safe area
    shade = Image.new("RGBA", (W, H), (0, 0, 0, 0)); sd = ImageDraw.Draw(shade)
    for y in range(int(H * 0.67), H):
        sd.line([(0, y), (W, y)], fill=(0, 0, 0, int(90 * (y - H * 0.67) / (H * 0.33))))
    img = Image.alpha_composite(img.convert("RGBA"), shade).convert("RGB")
    img.save(path, pnginfo=meta("scene-ep01-s01"))

def s14(path):
    rnd = random.Random(1414)
    img = Image.new("RGB", (W, H), (5, 6, 10))
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0)); od = ImageDraw.Draw(ov)
    cx, cy = W // 2, H // 2
    for r, a in [(250, 22), (180, 18), (120, 14)]:  # faint crimson sigil rings
        od.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(150, 20, 40, a), width=2)
    for k in range(8):
        t = k * math.pi / 4
        od.line([(cx + 120 * math.cos(t), cy + 120 * math.sin(t)), (cx + 250 * math.cos(t), cy + 250 * math.sin(t))], fill=(150, 20, 40, 14), width=2)
    for _ in range(26):  # dark feather silhouettes
        x, y = rnd.randrange(W), rnd.randrange(H); L = rnd.randrange(30, 70); t = rnd.random() * math.pi
        dx, dy = L * math.cos(t), L * math.sin(t)
        od.polygon([(x, y), (x + dx * .5 - dy * .12, y + dy * .5 + dx * .12), (x + dx, y + dy), (x + dx * .5 + dy * .12, y + dy * .5 - dx * .12)], fill=(60, 10, 20, 26))
    od.rectangle([cx - 300, cy - 60, cx + 300, cy + 60], fill=(5, 6, 10, 200))  # title-safe blank (no text)
    img = Image.alpha_composite(img.convert("RGBA"), ov.filter(ImageFilter.GaussianBlur(2))).convert("RGB")
    img.save(path, pnginfo=meta("scene-ep01-s14"))

if __name__ == "__main__":
    out = sys.argv[1]
    for sid, fn in [("scene-ep01-s01", s01), ("scene-ep01-s14", s14)]:
        d = os.path.join(out, sid); os.makedirs(d, exist_ok=True)
        p = os.path.join(d, "SCHEMATIC_PLACEHOLDER_v1.png"); fn(p); print(p)
