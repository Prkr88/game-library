"""Merge Drop UI + FX PNGs. Run: python art/ui_fx.py -> assets/gen/{fx-merge,fx-combo,ui-panel,ui-button}.png"""
import math, os, random
from PIL import Image, ImageDraw, ImageFilter

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'gen')
os.makedirs(OUT, exist_ok=True)
SS = 3


def down(img, size):
    return img.resize(size, Image.LANCZOS)


def star(d, cx, cy, r, fill, pts=4, inner=.28, rot=0):
    p = []
    for i in range(pts * 2):
        a = rot + i * math.pi / pts
        rr = r if i % 2 == 0 else r * inner
        p.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr))
    d.polygon(p, fill=fill)


def fx_merge():
    N = 256; S = N * SS
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    glow = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    c = S / 2
    gd.ellipse([c - S * .32, c - S * .32, c + S * .32, c + S * .32], fill=(255, 224, 130, 150))
    glow = glow.filter(ImageFilter.GaussianBlur(S * .06))
    img = Image.alpha_composite(img, glow)
    d = ImageDraw.Draw(img)
    random.seed(7)
    for i in range(12):  # rays
        a = i * math.pi / 6
        L1, L2 = S * (.2 if i % 2 else .1), S * (.46 if i % 2 == 0 else .36)
        w = .09
        d.polygon([(c + math.cos(a) * L1, c + math.sin(a) * L1),
                   (c + math.cos(a - w) * L2 * .85, c + math.sin(a - w) * L2 * .85),
                   (c + math.cos(a) * L2, c + math.sin(a) * L2),
                   (c + math.cos(a + w) * L2 * .85, c + math.sin(a + w) * L2 * .85)],
                  fill=(255, 214, 102, 235) if i % 2 == 0 else (255, 255, 255, 235))
    for i in range(10):
        a = random.random() * 6.283; r = S * (.28 + random.random() * .16)
        star(d, c + math.cos(a) * r, c + math.sin(a) * r, S * (.025 + random.random() * .03), (255, 255, 255, 255), rot=a)
    star(d, c, c, S * .2, (255, 250, 220, 255), pts=4, inner=.35)
    star(d, c, c, S * .1, (255, 255, 255, 255), pts=4, inner=.5, rot=math.pi / 4)
    down(img, (N, N)).save(os.path.join(OUT, 'fx-merge.png'))


def fx_combo():
    W, H = 512, 256; w, h = W * SS, H * SS
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    glow = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse([w * .06, h * .15, w * .94, h * .9], fill=(255, 130, 60, 140))
    img = Image.alpha_composite(img, glow.filter(ImageFilter.GaussianBlur(h * .06)))
    d = ImageDraw.Draw(img)
    # spiky burst
    cx, cy = w / 2, h / 2
    pts = []
    n = 18
    for i in range(n * 2):
        a = i * math.pi / n
        r = 1.0 if i % 2 == 0 else .82
        pts.append((cx + math.cos(a) * w * .43 * r, cy + math.sin(a) * h * .4 * r))
    d.polygon(pts, fill=(120, 40, 20, 255))
    pts2 = [(cx + (x - cx) * .94, cy + (y - cy) * .92) for x, y in pts]
    # vertical gradient fill
    g = Image.new('RGBA', (w, h)); gd = ImageDraw.Draw(g)
    for y in range(h):
        t = y / h
        gd.line([(0, y), (w, y)], fill=(255, int(236 - 100 * t), int(120 - 80 * t), 255))
    m = Image.new('L', (w, h), 0); ImageDraw.Draw(m).polygon(pts2, fill=255)
    img.paste(g, (0, 0), m)
    d = ImageDraw.Draw(img)
    for sx, sy, r in [(.12, .22, .06), (.9, .3, .045), (.84, .8, .05), (.18, .78, .04)]:
        star(d, w * sx, h * sy, h * r, (255, 255, 255, 255))
    down(img, (W, H)).save(os.path.join(OUT, 'fx-combo.png'))


def rr_gradient(w, h, rad, top, bot, outline, ow):
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    m = Image.new('L', (w, h), 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, w - 1, h - 1], rad, fill=255)
    g = Image.new('RGBA', (w, h)); gd = ImageDraw.Draw(g)
    for y in range(h):
        t = y / h
        gd.line([(0, y), (w, y)], fill=tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3)) + (top[3] if len(top) > 3 else 255,))
    img.paste(g, (0, 0), m)
    ImageDraw.Draw(img).rounded_rectangle([0, 0, w - 1, h - 1], rad, outline=outline, width=ow)
    return img, m


def ui_button():
    W, H = 400, 140; w, h = W * SS, H * SS
    pad = 10 * SS
    sh = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle([pad, pad + 8 * SS, w - pad, h - pad + 4 * SS], 56 * SS, fill=(0, 0, 0, 90))
    sh = sh.filter(ImageFilter.GaussianBlur(5 * SS))
    body, m = rr_gradient(w - 2 * pad, h - 2 * pad - 6 * SS, 54 * SS, (120, 240, 215), (30, 170, 150), (16, 105, 95, 255), 5 * SS)
    img = sh.copy(); img.alpha_composite(body, (pad, pad))
    # gloss
    gl = Image.new('L', (w, h), 0)
    ImageDraw.Draw(gl).rounded_rectangle([pad + 20 * SS, pad + 8 * SS, w - pad - 20 * SS, pad + 46 * SS], 20 * SS, fill=120)
    gl = gl.filter(ImageFilter.GaussianBlur(2 * SS))
    img.paste(Image.new('RGBA', (w, h), (255, 255, 255, 255)), (0, 0), gl)
    down(img, (W, H)).save(os.path.join(OUT, 'ui-button.png'))


def ui_panel():
    N = 512; S = N * SS; pad = 24 * SS
    sh = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle([pad, pad + 10 * SS, S - pad, S - pad + 10 * SS], 56 * SS, fill=(30, 20, 80, 90))
    sh = sh.filter(ImageFilter.GaussianBlur(10 * SS))
    body, m = rr_gradient(S - 2 * pad, S - 2 * pad, 56 * SS, (255, 255, 255, 235), (225, 232, 255, 235), (255, 255, 255, 255), 4 * SS)
    sh.alpha_composite(body, (pad, pad))
    d = ImageDraw.Draw(sh)
    d.rounded_rectangle([pad + 14 * SS, pad + 14 * SS, S - pad - 14 * SS, S - pad - 14 * SS], 44 * SS, outline=(190, 205, 245, 140), width=2 * SS)
    down(sh, (N, N)).save(os.path.join(OUT, 'ui-panel.png'))


if __name__ == '__main__':
    fx_merge(); fx_combo(); ui_button(); ui_panel()
