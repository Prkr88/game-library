"""Capacitor splash (2732x2732): blurred full-bleed fill of the portrait splash art + sharp art centered."""
from PIL import Image, ImageFilter
import os
d = os.path.dirname(os.path.abspath(__file__))
src = Image.open(os.path.join(d, '..', 'assets', 'gen', 'splash.png')).convert('RGB')
S = 2732
bg = src.resize((S, S), Image.LANCZOS).filter(ImageFilter.GaussianBlur(40))
h = S
w = round(src.width * h / src.height)
fg = src.resize((w, h), Image.LANCZOS)
bg.paste(fg, ((S - w) // 2, 0))
bg.save(os.path.join(d, '..', 'resources', 'splash.png'), optimize=True)
