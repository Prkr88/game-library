"""Merge Drop generated fallback art. Run: python art/generate_art.py  -> assets/gen/
Filenames match ASSET_PROMPTS.md (theme variants add -t1/-t2 suffix)."""
import colorsys, math, os, random
from PIL import Image, ImageDraw, ImageFilter, ImageChops

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'gen')
os.makedirs(OUT, exist_ok=True)
SS = 4
THEME_HUES = [170, 330, 40]
VALUES = [2 ** k for k in range(1, 12)]


def hsl(h, s, l):
    r, g, b = colorsys.hls_to_rgb((h % 360) / 360, l, s)
    return (int(r * 255), int(g * 255), int(b * 255))


def shade(c, f):
    return tuple(max(0, min(255, int(v * f))) for v in c)


def mix(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def rmask(size, inset, radius):
    m = Image.new('L', (size, size), 0)
    ImageDraw.Draw(m).rounded_rectangle([inset, inset, size - inset - 1, size - inset - 1], radius, fill=255)
    return m


def vgrad(size, top, bot):
    g = Image.new('RGB', (size, size))
    px = ImageDraw.Draw(g)
    for y in range(size):
        px.line([(0, y), (size, y)], fill=mix(top, bot, y / (size - 1)))
    return g


def jelly(base, size=256, sparkle=False):
    S = size * SS
    inset, rad = int(S * .045), int(S * .2)
    m = rmask(S, inset, rad)
    img = vgrad(S, mix(base, (255, 255, 255), .28), shade(base, .72)).convert('RGBA')
    d = ImageDraw.Draw(img)
    # inner rim darker border
    rim = Image.new('L', (S, S), 0)
    ImageDraw.Draw(rim).rounded_rectangle([inset, inset, S - inset - 1, S - inset - 1], rad, outline=255, width=int(S * .028))
    img.paste(Image.new('RGBA', (S, S), shade(base, .55) + (255,)), (0, 0), rim)
    # soft inner glow bottom
    glow = Image.new('L', (S, S), 0)
    ImageDraw.Draw(glow).ellipse([S * .15, S * .55, S * .85, S * 1.05], fill=110)
    glow = glow.filter(ImageFilter.GaussianBlur(S * .06))
    img.paste(Image.new('RGBA', (S, S), mix(base, (255, 255, 255), .35) + (255,)), (0, 0), ImageChops.multiply(glow, m))
    # gloss highlight top-left
    gl = Image.new('L', (S, S), 0)
    ImageDraw.Draw(gl).rounded_rectangle([S * .14, S * .11, S * .86, S * .42], int(S * .13), fill=120)
    gl = gl.filter(ImageFilter.GaussianBlur(S * .008))
    img.paste(Image.new('RGBA', (S, S), (255, 255, 255, 255)), (0, 0), ImageChops.multiply(gl, m))
    dot = Image.new('L', (S, S), 0)
    ImageDraw.Draw(dot).ellipse([S * .17, S * .15, S * .27, S * .22], fill=220)
    img.paste(Image.new('RGBA', (S, S), (255, 255, 255, 255)), (0, 0), dot.filter(ImageFilter.GaussianBlur(S * .004)))
    if sparkle:
        rnd = random.Random(7)
        for _ in range(9):
            x, y, r = rnd.uniform(.2, .8) * S, rnd.uniform(.2, .8) * S, rnd.uniform(.02, .045) * S
            d.polygon([(x, y - r * 2), (x + r * .5, y - r * .5), (x + r * 2, y), (x + r * .5, y + r * .5), (x, y + r * 2), (x - r * .5, y + r * .5), (x - r * 2, y), (x - r * .5, y - r * .5)], fill=(255, 255, 255, 230))
    out = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    out.paste(img, (0, 0), m)
    return out.resize((size, size), Image.LANCZOS)


def rainbow(tile):
    """Iridescent 2048 tile: diagonal hue sweep blended into the jelly, keeping its gloss/alpha."""
    import numpy as np
    a = np.asarray(tile).astype(float)
    n = a.shape[0]
    yy, xx = np.mgrid[0:n, 0:n]
    hue = ((xx + yy) / (2.0 * n) * 360 + 10).astype(int) % 360
    lut = np.array([hsl(h, .85, .62) for h in range(360)], float)
    lum = a[..., :3].mean(axis=2, keepdims=True) / 255.0
    tinted = lut[hue] * (0.55 + 0.75 * lum)
    out = a.copy()
    out[..., :3] = np.clip(a[..., :3] * 0.25 + tinted * 0.75, 0, 255)
    return Image.fromarray(out.astype('uint8'), 'RGBA')


def stone(size=256):
    S = size * SS
    base = (110, 112, 128)
    t = jelly(base, S // SS * 1)  # reuse shape
    t = t.resize((S, S), Image.LANCZOS)
    d = ImageDraw.Draw(t)
    rnd = random.Random(3)
    for _ in range(3):
        x, y = S * rnd.uniform(.3, .5), S * rnd.uniform(.2, .35)
        pts = [(x, y)]
        for _ in range(6):
            x += S * rnd.uniform(-.05, .1); y += S * .09
            pts.append((x, y))
        d.line(pts, fill=(50, 50, 66, 255), width=int(S * .014))
    for _ in range(14):
        x, y = S * rnd.uniform(.12, .88), S * rnd.uniform(.12, .88)
        r = S * rnd.uniform(.01, .03)
        d.ellipse([x - r, y - r, x + r, y + r], fill=(78, 84, 100, 200))
    for x0 in (.1, .75):  # moss
        d.ellipse([S * x0, S * .8, S * (x0 + .15), S * .92], fill=(96, 150, 84, 230))
    return t.resize((size, size), Image.LANCZOS)


def bubbles_bg(w, h, top, bot, seed, n=26):
    img = Image.new('RGB', (1, h))
    for y in range(h):
        img.putpixel((0, y), mix(top, bot, y / (h - 1)))
    img = img.resize((w, h)).convert('RGBA')
    rnd = random.Random(seed)
    layer = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for _ in range(n):
        r = rnd.uniform(.03, .12) * w
        x, y = rnd.uniform(0, w), rnd.uniform(0, h)
        c = rnd.choice([(255, 255, 255), (255, 214, 140), (160, 230, 255), (255, 170, 220)])
        d.ellipse([x - r, y - r, x + r, y + r], fill=c + (rnd.randint(25, 60),))
    layer = layer.filter(ImageFilter.GaussianBlur(w * .012))
    return Image.alpha_composite(img, layer).convert('RGB')


def board_bg(w=1080, h=1512):
    S = 1
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, w - 1, h - 1], 70, fill=(30, 28, 70, 235), outline=(255, 255, 255, 90), width=5)
    pad = 28
    cw, ch = (w - 2 * pad) / 5, (h - 2 * pad) / 7
    for c in range(5):
        for r in range(7):
            x, y = pad + c * cw, pad + r * ch
            d.rounded_rectangle([x + 8, y + 8, x + cw - 8, y + ch - 8], 34, fill=(255, 255, 255, 18), outline=(255, 255, 255, 34), width=2)
    return img


def icon(size=1024):
    bg = bubbles_bg(size, size, (255, 190, 160), (120, 90, 230), 5, 14).convert('RGBA')
    big = jelly(hsl(45, .95, .56), int(size * .6), sparkle=True)
    a = jelly(hsl(170, .7, .55), int(size * .3))
    b = jelly(hsl(330, .7, .6), int(size * .3))
    bg.alpha_composite(a, (int(size * .06), int(size * .08)))
    bg.alpha_composite(b, (int(size * .62), int(size * .1)))
    bg.alpha_composite(big, (int(size * .2), int(size * .33)))
    d = ImageDraw.Draw(bg)
    for cx, cy, r in [(.2, .3, 26), (.82, .66, 34), (.12, .74, 18), (.5, .2, 22)]:
        x, y = cx * size, cy * size
        d.polygon([(x, y - r * 2), (x + r * .5, y - r * .5), (x + r * 2, y), (x + r * .5, y + r * .5), (x, y + r * 2), (x - r * .5, y + r * .5), (x - r * 2, y), (x - r * .5, y - r * .5)], fill=(255, 255, 255, 235))
    return bg.convert('RGB')


def splash(w=1242, h=2688):
    img = bubbles_bg(w, h, (38, 28, 92), (120, 60, 160), 11, 34).convert('RGBA')
    rnd = random.Random(2)
    ts = int(w * .2)
    cols = [hsl(k * 37 + 170, .7, .55) for k in range(1, 12)]
    for i in range(24):
        c, r = i % 5, i // 5
        x = c * ts + rnd.randint(-8, 8)
        y = int(h * .98 - (r + 1) * ts * .98) - rnd.randint(0, 10)
        if r >= 3 and c in (0, 4): continue
        img.alpha_composite(jelly(cols[(c + r * 2) % 11], ts), (x, y))
    big = jelly(hsl(45, .95, .56), int(w * .42), sparkle=True)
    g = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(g).ellipse([w * .15, h * .2, w * .85, h * .2 + w * .7], fill=(255, 210, 100, 110))
    img.alpha_composite(g.filter(ImageFilter.GaussianBlur(70)))
    img.alpha_composite(big, (int(w * .29), int(h * .24)))
    return img.convert('RGB')


def feature(w=1024, h=500):
    img = bubbles_bg(w, h, (255, 190, 160), (110, 90, 230), 9, 12).convert('RGBA')
    vals = [(0, 2), (1, 4), (2, 8), (3, 16)]
    for i, (k, v) in enumerate(vals):
        img.alpha_composite(jelly(hsl((k + 1) * 37 + 170, .7, .55), 150), (60 + i * 130, 270 - (i % 2) * 40))
    img.alpha_composite(jelly(hsl(45, .95, .56), 300, sparkle=True), (640, 100))
    return img.convert('RGB')


def main():
    for ti, hue in enumerate(THEME_HUES):
        sfx = '' if ti == 0 else '-t%d' % ti
        for v in VALUES:
            k = math.log2(v)
            col = hsl(k * 37 + hue, .70, (52 + min(k, 10) * 1.2) / 100)
            t = jelly(col, 256, sparkle=(v == 2048))
            if v == 2048:
                t = rainbow(t)
            t.save(os.path.join(OUT, 'tile-%d%s.png' % (v, sfx)))
    stone().save(os.path.join(OUT, 'tile-stone.png'))
    bubbles_bg(1242, 2688, (40, 30, 100), (125, 70, 170), 1).save(os.path.join(OUT, 'bg.png'))
    board_bg().save(os.path.join(OUT, 'board-bg.png'))
    icon().save(os.path.join(OUT, 'icon-1024.png'))
    splash().save(os.path.join(OUT, 'splash.png'))
    feature().save(os.path.join(OUT, 'store-feature.png'))


if __name__ == '__main__':
    main()
