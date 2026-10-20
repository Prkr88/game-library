"""Shaded barrier + drone hazards. Output: 128x64 sheet (frame0 barrier, frame1 drone), 8x supersampled."""
from PIL import Image, ImageDraw, ImageFilter
import pathlib
S = 8
root = pathlib.Path(__file__).resolve().parent.parent

def rr(d, box, r, fill, outline=None, w=0):
    d.rounded_rectangle([int(v * S) for v in box], int(r * S), fill=fill, outline=outline, width=max(1, int(w * S)) if outline else 0)

def barrier():
    im = Image.new("RGBA", (64 * S, 64 * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.ellipse([6 * S, 54 * S, 58 * S, 62 * S], fill=(0, 0, 0, 90))
    for x in (11, 48):  # posts
        rr(d, (x, 26, x + 5, 56), 1.5, (60, 66, 120, 255), (20, 24, 60, 255), 1)
        rr(d, (x + 1, 27, x + 2.5, 55), 1, (110, 120, 190, 255))
    # striped beam
    beam = Image.new("RGBA", (64 * S, 64 * S), (0, 0, 0, 0)); bd = ImageDraw.Draw(beam)
    for i in range(-4, 14):
        c = (255, 214, 58, 255) if i % 2 == 0 else (30, 30, 50, 255)
        bd.polygon([((4 + i * 6) * S, 14 * S), ((10 + i * 6) * S, 14 * S), ((4 + i * 6) * S, 34 * S), ((-2 + i * 6) * S, 34 * S)][::1], fill=c)
    mask = Image.new("L", beam.size, 0); ImageDraw.Draw(mask).rounded_rectangle([3 * S, 18 * S, 61 * S, 32 * S], 3 * S, fill=255)
    im.paste(beam, (0, 0), mask)
    d = ImageDraw.Draw(im)
    rr(d, (3, 18, 61, 32), 3, None, (20, 20, 40, 255), 1.5)
    d.rounded_rectangle([5 * S, 19.5 * S, 59 * S, 22 * S], S, fill=(255, 255, 255, 90))  # highlight
    for x in (12, 32, 52):  # warning lamps
        d.ellipse([(x - 3.5) * S, 9 * S, (x + 3.5) * S, 16 * S], fill=(255, 79, 154, 70))
        d.ellipse([(x - 2) * S, 10.5 * S, (x + 2) * S, 14.5 * S], fill=(255, 79, 154, 255), outline=(255, 200, 225, 255), width=S // 2)
    return im

def drone():
    im = Image.new("RGBA", (64 * S, 64 * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    glow = Image.new("RGBA", im.size, (0, 0, 0, 0)); gd = ImageDraw.Draw(glow)
    gd.ellipse([20 * S, 30 * S, 44 * S, 54 * S], fill=(255, 40, 70, 150))
    im.alpha_composite(glow.filter(ImageFilter.GaussianBlur(5 * S)))
    d = ImageDraw.Draw(im)
    d.line([12 * S, 22 * S, 24 * S, 30 * S], fill=(70, 78, 140, 255), width=3 * S)
    d.line([52 * S, 22 * S, 40 * S, 30 * S], fill=(70, 78, 140, 255), width=3 * S)
    for cx in (11, 53):  # rotor discs
        d.ellipse([(cx - 10) * S, 16 * S, (cx + 10) * S, 24 * S], fill=(102, 232, 255, 70), outline=(102, 232, 255, 200), width=S // 2)
        d.ellipse([(cx - 2) * S, 18.5 * S, (cx + 2) * S, 22 * S], fill=(40, 46, 90, 255))
    rr(d, (18, 26, 46, 46), 9, (58, 64, 118, 255), (18, 20, 50, 255), 1.5)
    rr(d, (20, 28, 44, 34), 3, (120, 130, 205, 255))  # top sheen
    rr(d, (21, 34, 43, 43), 4, (24, 26, 60, 255))
    d.ellipse([27 * S, 34 * S, 37 * S, 43 * S], fill=(255, 40, 70, 255), outline=(255, 190, 200, 255), width=S // 2)
    d.ellipse([30 * S, 36 * S, 33 * S, 39 * S], fill=(255, 255, 255, 230))
    d.polygon([(26 * S, 46 * S), (38 * S, 46 * S), (35 * S, 51 * S), (29 * S, 51 * S)], fill=(40, 46, 90, 255))
    return im

sheet = Image.new("RGBA", (128 * S, 64 * S), (0, 0, 0, 0))
sheet.paste(barrier(), (0, 0)); sheet.paste(drone(), (64 * S, 0))
out = sheet.resize((128, 64), Image.LANCZOS)
for p in (root / "assets/gen/hazards-sheet.png", root / "assets/hazards-sheet.png"):
    out.save(p)
out.resize((512, 256), Image.NEAREST).save("/tmp/hz2.png")
