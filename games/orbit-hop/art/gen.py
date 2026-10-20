"""Orbit Hop fallback art generator. Output: assets/gen/*.png (same names as ASSET_PROMPTS.md).
Run: python art/gen.py"""
import os, colorsys
import numpy as np
from PIL import Image, ImageFilter

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'gen')
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)

def noise(h, w, scale, oct=4, seed=0):
    r = np.random.default_rng(seed)
    out = np.zeros((h, w)); amp = 1; tot = 0
    for o in range(oct):
        s = max(2, int(scale * 2 ** o))
        g = r.random((s + 1, s + 1))
        im = Image.fromarray((g * 255).astype('uint8')).resize((w, h), Image.BICUBIC)
        out += np.asarray(im) / 255 * amp; tot += amp; amp *= 0.5
    return out / tot

def hsv(h, s, v):
    return np.array(colorsys.hsv_to_rgb(h % 1, s, v))

def save(arr, name):
    Image.fromarray(np.clip(arr * 255, 0, 255).astype('uint8'), 'RGBA').save(os.path.join(OUT, name))

def disc_grid(n):
    y, x = np.mgrid[0:n, 0:n]
    u = (x + .5) / n * 2 - 1; v = (y + .5) / n * 2 - 1
    return u, v, np.sqrt(u * u + v * v)

def planet(n, base, accent, kind, seed, ring=False, cracks=False):
    u, v, d = disc_grid(n)
    R = 0.74 if not ring else 0.62
    inside = d < R
    z = np.sqrt(np.clip(1 - (d / R) ** 2, 0, 1))
    nz = noise(n, n, 3, 5, seed)
    if kind == 'bands':
        t = (np.sin((v / R) * 9 + nz * 5) + 1) / 2
    elif kind == 'ocean':
        t = np.clip((nz - .45) * 5, 0, 1)
    else:
        t = nz
    col = base[None, None, :] * (1 - t[..., None]) + accent[None, None, :] * t[..., None]
    if cracks:
        c = np.abs(noise(n, n, 5, 3, seed + 9) - .5) < 0.025
        col[c & inside] = np.array([1, .75, .25])
    lx, ly, lz = -.5, -.55, .67
    nx, ny = u / R, v / R
    lam = np.clip(nx * lx + ny * ly + z * lz, 0, 1)
    shade = 0.28 + 0.95 * lam ** 0.9
    col = col * shade[..., None]
    col += (np.clip(nx * lx + ny * ly + z * lz, 0, 1) ** 24)[..., None] * 0.18
    rgb = np.zeros((n, n, 4))
    rim = np.exp(-((d - R) / 0.045) ** 2) * 0.0
    aa = np.clip((R - d) * n / 2 + .5, 0, 1)
    rgb[..., :3] = col; rgb[..., 3] = aa
    # atmosphere glow
    glow = np.exp(-np.clip(d - R, 0, None) * 14) * (d >= R) * 0.5 * np.clip((1 - d) * 4, 0, 1)
    rim_in = (np.clip(1 - z, 0, 1) ** 3) * inside * 0.55
    ac = np.clip(accent * .6 + .45, 0, 1)
    rgb[..., :3] = np.where(inside[..., None], np.clip(rgb[..., :3] + rim_in[..., None] * ac, 0, 1), rgb[..., :3])
    a2 = np.maximum(rgb[..., 3], glow)
    rgb[..., :3] = np.where((d >= R)[..., None], ac[None, None, :], rgb[..., :3])
    rgb[..., 3] = a2
    img = rgb
    if ring:
        # tilted ring ellipse
        ang = -0.35
        xr = u * np.cos(ang) + v * np.sin(ang); yr = -u * np.sin(ang) + v * np.cos(ang)
        e = np.sqrt((xr / 0.96) ** 2 + (yr / 0.28) ** 2)
        band = ((e > .72) & (e < 1)).astype(float) * (0.55 + 0.45 * np.sin(e * 60))
        rc = np.clip(accent * .8 + .3, 0, 1)
        front = yr > 0
        ra = band * 0.9
        ring_rgba = np.zeros((n, n, 4)); ring_rgba[..., :3] = rc; ring_rgba[..., 3] = ra
        behind = ring_rgba.copy(); behind[front | inside] = 0
        fr = ring_rgba.copy(); fr[~front & ~inside] = 0; fr[~front & inside] = 0
        fr[front] = ring_rgba[front]
        def over(a, b):
            ao = a[..., 3:4] + b[..., 3:4] * (1 - a[..., 3:4])
            c = (a[..., :3] * a[..., 3:4] + b[..., :3] * b[..., 3:4] * (1 - a[..., 3:4])) / np.maximum(ao, 1e-6)
            return np.concatenate([c, ao], -1)
        img = over(fr, over(img, behind))
    return img

def comet(n, core, trail, seed=0):
    u, v, d = disc_grid(n)
    img = np.zeros((n, n, 4))
    # tail trailing left
    tx = np.clip(-(u + 0.1), 0, None)
    w = 0.16 * np.exp(-tx * 1.2) + 1e-3
    tail = np.exp(-(v / w) ** 2) * np.exp(-tx * 2.2) * (u < 0.1)
    tn = noise(n, n, 6, 3, seed) * 0.6 + 0.4
    tail = tail * tn
    tc = np.array(trail)
    img[..., :3] = tc; img[..., 3] = np.clip(tail * .85, 0, 1)
    # glow
    g = np.exp(-(np.sqrt((u - 0.25) ** 2 + v ** 2) / 0.22) ** 2) * .8
    gc = np.clip(tc * .5 + .5, 0, 1)
    a = np.maximum(img[..., 3], g)
    img[..., :3] = np.where((g > img[..., 3])[..., None], gc, img[..., :3]); img[..., 3] = a
    # core
    cd = np.sqrt((u - 0.25) ** 2 + v ** 2)
    ca = np.clip((0.19 - cd) * n / 2 + .5, 0, 1)
    sh = np.clip(1 - cd / 0.19, 0, 1)
    cc = np.array(core)[None, None, :] * (0.65 + 0.5 * sh[..., None]) 
    hl = np.exp(-(np.sqrt((u - 0.19) ** 2 + (v + 0.06) ** 2) / 0.05) ** 2)
    cc = np.clip(cc + hl[..., None] * .6, 0, 1)
    m = ca > 0
    img[..., :3] = np.where(m[..., None], cc * ca[..., None] + img[..., :3] * (1 - ca[..., None]), img[..., :3])
    img[..., 3] = np.maximum(img[..., 3], ca)
    return img

def asteroid(n, seed):
    r = np.random.default_rng(seed)
    u, v, d = disc_grid(n)
    th = np.arctan2(v, u)
    rad = 0.62 + sum(r.random() * 0.1 * np.cos(k * th + r.random() * 6) / (k ** .6) for k in range(2, 8))
    inside = d < rad
    nz = noise(n, n, 6, 5, seed)
    z = np.sqrt(np.clip(1 - (d / rad) ** 2, 0, 1))
    lam = np.clip((-u * .5 - v * .55) / rad + z * .67, 0, 1)
    base = np.array([.55, .48, .42]) * (.6 + .8 * nz[..., None])
    craters = np.zeros((n, n))
    for _ in range(7):
        cx, cy = r.uniform(-.4, .4, 2); cr = r.uniform(.07, .15)
        dd = np.sqrt((u - cx) ** 2 + (v - cy) ** 2)
        craters += np.exp(-((dd - cr) / .02) ** 2) * 0.5 - (dd < cr) * 0.12
    col = base * (0.25 + 0.9 * lam[..., None]) * (1 + craters[..., None])
    img = np.zeros((n, n, 4)); img[..., :3] = np.clip(col, 0, 1)
    img[..., 3] = np.clip((rad - d) * n / 2 + .5, 0, 1)
    return img

def blackhole(n):
    u, v, d = disc_grid(n)
    img = np.zeros((n, n, 4))
    ang = np.arctan2(v, u)
    # accretion disk: swirl
    sw = (np.sin(ang * 3 + d * 18) + 1) / 2
    ring = np.exp(-((d - .5) / .17) ** 2)
    c1 = np.array([.55, .2, 1.0]); c2 = np.array([1.0, .45, .9])
    col = c1 * (1 - sw[..., None]) + c2 * sw[..., None]
    hot = np.exp(-((d - .36) / .06) ** 2)
    col = np.clip(col * (.5 + ring[..., None]) + hot[..., None] * .8, 0, 1)
    a = np.clip(ring * (.5 + .5 * sw) + hot * .8, 0, 1) * (d < .95)
    glow = np.exp(-(d / .55) ** 2) * .5
    img[..., :3] = col; img[..., 3] = np.maximum(a, glow * (d > .3))
    core = np.clip((.3 - d) * n / 2 + .5, 0, 1)
    img[..., :3] *= (1 - core[..., None]); img[..., 3] = np.maximum(img[..., 3], core)
    return img

def star(n):
    from PIL import ImageDraw
    S = 4; m_ = n * S
    pts = []
    for i in range(10):
        an = i * np.pi / 5 - np.pi / 2; rr = (.62 if i % 2 == 0 else .27) * m_ / 2
        pts.append((m_ / 2 + np.cos(an) * rr, m_ / 2 + np.sin(an) * rr))
    mk = Image.new('L', (m_, m_), 0); ImageDraw.Draw(mk).polygon(pts, fill=255)
    m = np.asarray(mk.resize((n, n), Image.LANCZOS)) / 255.0
    u, v, d = disc_grid(n)
    lam = np.clip(1 - np.sqrt((u + .15) ** 2 + (v + .2) ** 2) / .8, 0, 1)
    img = np.zeros((n, n, 4))
    img[..., :3] = np.clip(np.array([1, .8, .2]) * (.8 + .4 * lam[..., None]) + (lam ** 3)[..., None] * .25, 0, 1)
    g = np.exp(-(d / .6) ** 2) * .45
    img[..., :3] = np.where((m < .02)[..., None], [1, .9, .4], img[..., :3])
    img[..., 3] = np.maximum(m, g)
    return img

def bg_nebula(w, h, hues, seed):
    n1 = noise(h, w, 3, 5, seed); n2 = noise(h, w, 2, 5, seed + 1); n3 = noise(h, w, 5, 4, seed + 2)
    yy = np.linspace(0, 1, h)[:, None]
    base = np.zeros((h, w, 3)) + (hsv(hues[0], .7, .06) * (1 - yy[..., None]) + hsv(hues[1], .7, .03) * yy[..., None])
    for nz, hh, k in ((n1, hues[0], .9), (n2, hues[1], .8), (n3, hues[2], .5)):
        m = np.clip((nz - .5) * 3, 0, 1) ** 1.5
        base += m[..., None] * hsv(hh, .75, .55) * k * .6
    return np.concatenate([np.clip(base, 0, 1), np.ones((h, w, 1))], -1)

def stars_tile(n):
    img = np.zeros((n, n, 4))
    for _ in range(140):
        x, y = rng.integers(0, n, 2); b = rng.random() ** 2
        img[y, x] = [1, 1, 1, .3 + .7 * b]
        if b > .6:
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                img[(y + dy) % n, (x + dx) % n] = [.8, .9, 1, .35 * b]
    pil = Image.fromarray((img * 255).astype('uint8'))
    glow = pil.filter(ImageFilter.GaussianBlur(1.5))
    return np.asarray(Image.alpha_composite(glow, pil)) / 255

def explosion(n, k):
    u, v, d = disc_grid(n)
    r = 0.18 + k * 0.17
    sh = np.exp(-((d - r) / (0.1 + .03 * k)) ** 2) * (1 - k * .22)
    nz = noise(n, n, 5, 3, 40 + k)
    cl = np.clip(sh * (.5 + nz), 0, 1)
    img = np.zeros((n, n, 4))
    t = np.clip(cl, 0, 1)[..., None]
    img[..., :3] = np.array([1, .45, .15]) * (1 - t) * .7 + np.array([1, .95, .6]) * t
    img[..., 3] = np.clip(cl * 1.1, 0, 1)
    ang = np.arctan2(v, u)
    sp = (np.cos(ang * 12 + k) > .93) * np.exp(-((d - r * 1.5) / .06) ** 2) * (1 - k * .2)
    img[..., :3] = np.where(sp[..., None] > 0, [1, 1, .8], img[..., :3]); img[..., 3] = np.maximum(img[..., 3], sp)
    return img

# ---- planets
P = [
 ('bands', hsv(.02, .6, .85), hsv(.05, .8, .55), False, False),   # rocky red
 ('ocean', hsv(.58, .8, .7), hsv(.3, .6, .75), False, False),     # ocean
 ('bands', hsv(.1, .5, .95), hsv(.06, .7, .7), True, False),      # ringed gas giant
 ('blob', hsv(.54, .25, .98), hsv(.6, .5, .85), False, False),    # ice
 ('ocean', hsv(.35, .7, .6), hsv(.28, .8, .85), False, False),    # jungle
 ('blob', hsv(.02, .85, .35), hsv(.05, 1, .75), False, True),     # lava
 ('bands', hsv(.92, .45, 1), hsv(.88, .6, .8), False, False),     # candy
 ('blob', hsv(.76, .6, .55), hsv(.8, .45, 1), False, False),      # crystal
]
for i, (k, b, a, ring, cr) in enumerate(P):
    save(planet(256, b, a, k, 10 + i, ring, cr), 'planet-%d.png' % (i + 1))
im = planet(256, hsv(.0, .1, .35), hsv(.03, .5, .5), 'blob', 99, False, True)
save(im, 'planet-shrink.png')
for i in range(3): save(asteroid(128, 5 + i), 'asteroid-%d.png' % (i + 1))
save(blackhole(256), 'blackhole.png')
save(star(48 * 2), 'star-pickup.png')
skins = [((1, 1, 1), (.5, .84, 1)), ((1, .7, .28), (1, .37, .23)), ((.71, 1, .81), (.18, .9, .62)),
         ((.89, .76, 1), (.63, .36, 1)), ((1, .95, .66), (1, .82, 0))]
save(comet(192, *skins[0], seed=1), 'comet.png')
for i, (c, t) in enumerate(skins[1:] + [((1, .6, .9), (.3, .9, 1))]):
    save(comet(192, c, t, seed=2 + i), 'comet-skin-%d.png' % (i + 1))
for k in range(4): save(explosion(192, k), 'fx-explosion-%d.png' % (k + 1))
save(stars_tile(512), 'bg-stars.png')
def orbit_ring(n=512):
    yy, xx = np.mgrid[0:n, 0:n]; r = np.hypot(xx - n / 2 + .5, yy - n / 2 + .5); R = n * 0.469
    ang = np.arctan2(yy - n / 2, xx - n / 2)
    dash = (np.sin(ang * 48) > -0.2).astype(float)
    a = np.exp(-((r - R) / 2.2) ** 2) * (0.5 + 0.5 * dash) + np.exp(-((r - R) / 9) ** 2) * 0.25
    out = np.zeros((n, n, 4)); out[..., 0] = .6; out[..., 1] = .85; out[..., 2] = 1; out[..., 3] = np.clip(a, 0, 1)
    return out
save(orbit_ring(), 'orbit-ring.png')
for i, hs in enumerate([(.62, .72, .5), (.85, .75, .6), (.97, .8, .72)]):
    arr = bg_nebula(414, 896, hs, 70 + i)
    Image.fromarray((arr * 255).astype('uint8'), 'RGBA').convert('RGB').save(os.path.join(OUT, 'bg-nebula-%d.png' % (i + 1)))
print('ok')
