"""Merge Drop power-up + coin icons. Run: python art/powerups.py -> assets/gen/powerup-*.png, ui-coin.png"""
import math, os
from PIL import Image, ImageDraw, ImageFilter

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'gen')
os.makedirs(OUT, exist_ok=True)
SS, N = 4, 128
S = N * SS


def canvas():
    return Image.new('RGBA', (S, S), (0, 0, 0, 0))


def glossy_disc(img, c, box, base, hi):
    d = ImageDraw.Draw(img)
    x0, y0, x1, y1 = box
    d.ellipse([x0 + 6, y0 + 10, x1 + 6, y1 + 10], fill=(0, 0, 0, 0))
    # vertical gradient clipped to ellipse
    g = Image.new('RGBA', (S, S))
    gd = ImageDraw.Draw(g)
    for y in range(int(y0), int(y1)):
        t = (y - y0) / (y1 - y0)
        col = tuple(int(hi[i] + (base[i] - hi[i]) * t) for i in range(3)) + (255,)
        gd.line([(x0, y), (x1, y)], fill=col)
    m = Image.new('L', (S, S), 0)
    ImageDraw.Draw(m).ellipse(box, fill=255)
    img.paste(g, (0, 0), m)
    ImageDraw.Draw(img).ellipse(box, outline=tuple(int(v * .55) for v in base) + (255,), width=int(S * .03))
    gl = Image.new('L', (S, S), 0)
    ImageDraw.Draw(gl).ellipse([x0 + S * .12, y0 + S * .07, x1 - S * .2, y0 + (y1 - y0) * .45], fill=130)
    gl = gl.filter(ImageFilter.GaussianBlur(S * .01))
    img.paste(Image.new('RGBA', (S, S), (255, 255, 255, 255)), (0, 0), Image.composite(gl, Image.new('L', (S, S), 0), m))


def shadow(img):
    sh = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse([S * .15, S * .86, S * .85, S * .97], fill=(0, 0, 0, 70))
    return Image.alpha_composite(sh.filter(ImageFilter.GaussianBlur(S * .02)), img)


def arrow(d, cx, cy, r, a0, a1, w, col, head=1):
    pts = [(cx + r * math.cos(math.radians(a)), cy + r * math.sin(math.radians(a))) for a in range(int(a0), int(a1) + 1, 3)]
    d.line(pts, fill=col, width=w, joint='curve')
    for p in (pts[0], pts[-1]):
        d.ellipse([p[0] - w / 2, p[1] - w / 2, p[0] + w / 2, p[1] + w / 2], fill=col)
    if head:
        a = math.radians(a1)
        tx, ty = cx + r * math.cos(a), cy + r * math.sin(a)
        dx, dy = -math.sin(a), math.cos(a)
        nx, ny = math.cos(a), math.sin(a)
        L = w * 1.9
        d.polygon([(tx + dx * L, ty + dy * L), (tx + nx * L * .9, ty + ny * L * .9), (tx - nx * L * .9, ty - ny * L * .9)], fill=col)


def bomb():
    img = canvas()
    glossy_disc(img, None, (S * .16, S * .28, S * .84, S * .94), (40, 42, 70), (110, 115, 170))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([S * .42, S * .2, S * .6, S * .34], int(S * .03), fill=(80, 84, 120, 255), outline=(30, 30, 55, 255), width=int(S * .02))
    d.line([(S * .52, S * .22), (S * .62, S * .12), (S * .74, S * .13)], fill=(214, 170, 90, 255), width=int(S * .035), joint='curve')
    fx, fy = S * .76, S * .13
    for r, col in ((S * .09, (255, 120, 40, 255)), (S * .06, (255, 210, 70, 255)), (S * .03, (255, 255, 230, 255))):
        d.ellipse([fx - r, fy - r, fx + r, fy + r], fill=col)
    return shadow(img)


def swap():
    img = canvas()
    glossy_disc(img, None, (S * .08, S * .08, S * .92, S * .92), (40, 110, 220), (130, 200, 255))
    d = ImageDraw.Draw(img)
    w = int(S * .075)
    arrow(d, S / 2, S / 2, S * .27, 200, 340, w, (255, 255, 255, 255))
    arrow(d, S / 2, S / 2, S * .27, 20, 160, w, (255, 255, 255, 255))
    return shadow(img)


def undo():
    img = canvas()
    glossy_disc(img, None, (S * .08, S * .08, S * .92, S * .92), (235, 120, 40), (255, 205, 110))
    d = ImageDraw.Draw(img)
    arrow(d, S / 2, S * .52, S * .27, 300, 560, int(S * .08), (255, 255, 255, 255))
    return shadow(img)


def coin():
    img = canvas()
    glossy_disc(img, None, (S * .06, S * .06, S * .94, S * .94), (220, 150, 20), (255, 235, 130))
    d = ImageDraw.Draw(img)
    d.ellipse([S * .2, S * .2, S * .8, S * .8], outline=(190, 120, 10, 255), width=int(S * .03))
    pts = []
    for i in range(10):
        r = S * (.26 if i % 2 == 0 else .11)
        a = math.radians(-90 + i * 36)
        pts.append((S / 2 + r * math.cos(a), S / 2 + r * math.sin(a)))
    d.polygon(pts, fill=(255, 245, 190, 255), outline=(190, 120, 10, 255))
    return img


for name, fn, size in (('powerup-bomb', bomb, 128), ('powerup-swap', swap, 128), ('powerup-undo', undo, 128), ('ui-coin', coin, 64)):
    fn().resize((size, size), Image.LANCZOS).save(os.path.join(OUT, name + '.png'))
    if size == 128:
        fn().resize((256, 256), Image.LANCZOS).save(os.path.join(OUT, name + '@2x.png'))
print('ok')
