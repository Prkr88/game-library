#!/usr/bin/env python3
"""Builds the GitHub Pages landing page (index.html at repo root) from games/*/game.json."""
import json, html, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
cards = []
for f in sorted(ROOT.glob("games/*/game.json")):
    d, g = f.parent, json.loads(f.read_text())
    a = json.loads((d / "assessment.json").read_text()) if (d / "assessment.json").exists() else {}
    icon = next((f"games/{d.name}/assets/{n}" for n in ("icon-512.png", "icon-1024.png", "icon-192.png") if (d / "assets" / n).exists()), "")
    e = html.escape
    cards.append(f"""<a class="card" href="games/{d.name}/{e(g.get('entry', 'index.html'))}">
 {f'<img src="{icon}" alt="" loading="lazy">' if icon else '<div class="ph">🎮</div>'}
 <div><h2>{e(g.get('name', d.name))}</h2><div class="genre">{e(g.get('genre', ''))}</div>
 <p>{e(g.get('description', ''))}</p>
 {f'<div class="r">Readiness {a["readiness"]}/100</div>' if a else ''}</div></a>""")
(ROOT / "index.html").write_text(f"""<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Game Library</title>
<style>
*{{box-sizing:border-box}}body{{margin:0;padding:24px 16px;font:15px system-ui,sans-serif;background:#0d1117;color:#e6edf3}}
main{{max-width:1100px;margin:auto}}h1{{margin:0 0 4px}}.sub{{color:#8b949e;margin:0 0 24px}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(320px,100%),1fr));gap:14px}}
.card{{display:flex;gap:14px;padding:14px;background:#161b22;border:1px solid #30363d;border-radius:12px;color:inherit;text-decoration:none;transition:border-color .15s,transform .15s}}
.card:hover{{border-color:#58a6ff;transform:translateY(-2px)}}
.card img,.ph{{width:88px;height:88px;border-radius:18px;flex:none;object-fit:cover;background:#21262d;display:grid;place-items:center;font-size:36px}}
h2{{margin:0;font-size:18px}}.genre{{color:#58a6ff;font-size:12px;margin:2px 0 6px}}p{{margin:0;color:#8b949e;font-size:13px}}
.r{{margin-top:8px;font-size:12px;color:#d6a020}}
</style></head><body><main>
<h1>🎮 Game Library</h1><p class="sub">Mobile-first web games built by autonomous AI agents. Tap a game to play — works on phone and desktop.</p>
<div class="grid">{''.join(cards)}</div></main></body></html>
""")
print("index.html:", len(cards), "games")
