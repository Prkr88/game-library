#!/usr/bin/env python3
"""Lists owner PNGs in games/<slug>/assets/ that the game's code never references.
Usage: check_assets.py [slug ...]  (default: all games). Exit 1 if any are unused."""
import pathlib, re, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
bad = 0
for d in [ROOT / "games" / s for s in sys.argv[1:]] or sorted((ROOT / "games").iterdir()):
    if not (d / "assets").is_dir(): continue
    code = "".join(p.read_text(errors="ignore") for p in d.rglob("*")
                   if p.suffix in (".js", ".html", ".css", ".json") and "node_modules" not in p.parts
                   and "www" not in p.parts and p.name != "sw.js")
    unused = [p.name for p in sorted((d / "assets").glob("*.png"))
              if not p.stem.startswith(("store-", "icon", "splash")) and p.stem not in code and not re.search(re.escape(re.sub(r"-\d+$", "-", p.stem)), code)]
    if unused: bad = 1
    print(f"{d.name}: {'all assets used' if not unused else 'UNUSED: ' + ', '.join(unused)}")
sys.exit(bad)
