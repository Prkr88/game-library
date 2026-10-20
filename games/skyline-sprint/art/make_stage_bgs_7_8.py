"""Stage 7-8 backdrops (Neon Core, Zenith): colour-graded from the stage-6 art.
Output assets/gen/bg-stage-7.png / -8.png (not owner-listed names)."""
from pathlib import Path
import numpy as np
from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parents[1]
src = ROOT / "assets" / "bg-stage-6.png"
if not src.exists():
    src = ROOT / "assets" / "gen" / "bg-stage-6.png"
base = Image.open(src).convert("RGB")
OUT = ROOT / "assets" / "gen"

def grade(hue_shift, sat, bright, tint, tint_amt, name):
    hsv = np.array(base.convert("HSV")).astype(np.int32)
    hsv[..., 0] = (hsv[..., 0] + hue_shift) % 256
    img = Image.fromarray(hsv.astype(np.uint8), "HSV").convert("RGB")
    img = ImageEnhance.Color(img).enhance(sat)
    img = ImageEnhance.Brightness(img).enhance(bright)
    arr = np.array(img).astype(np.float32)
    h = arr.shape[0]
    grad = np.linspace(1, 0, h)[:, None, None]  # tint strongest at the sky
    arr = arr * (1 - tint_amt * grad) + np.array(tint, np.float32) * tint_amt * grad
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).save(OUT / name, optimize=True)

grade(-28, 1.2, 0.75, (10, 40, 90), 0.35, "bg-stage-7.png")   # Neon Core: deep blue-violet, magenta lanes, darker
grade(30, 0.9, 1.15, (255, 235, 190), 0.30, "bg-stage-8.png")  # Zenith: golden dawn, brighter
