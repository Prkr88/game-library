"""Derive app icons from the owner splash (comet crop). Never writes to assets/."""
import os
from PIL import Image
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sp = Image.open(os.path.join(root, 'assets', 'splash.png')).convert('RGB')
cx, cy, half = 760, 1470, 430
im = sp.crop((cx - half, cy - half, cx + half, cy + half)).resize((1024, 1024), Image.LANCZOS)
os.makedirs(os.path.join(root, 'icons'), exist_ok=True)
os.makedirs(os.path.join(root, 'resources'), exist_ok=True)
def save(img, name): img.save(os.path.join(root, name), optimize=True)
for s in (192, 512): save(im.resize((s, s), Image.LANCZOS), f'icons/icon-{s}.png')
save(im.resize((180, 180), Image.LANCZOS), 'icons/apple-touch-icon.png')
save(im.resize((32, 32), Image.LANCZOS), 'icons/favicon-32.png')
bg = im.resize((1, 1), Image.BOX).getpixel((0, 0))
m = Image.new('RGB', (512, 512), bg); m.paste(im.resize((410, 410), Image.LANCZOS), (51, 51))
save(m, 'icons/icon-maskable-512.png')
save(im, 'resources/icon.png'); save(sp, 'resources/splash.png')
