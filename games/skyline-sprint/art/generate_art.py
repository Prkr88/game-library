from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets"
OUT.mkdir(exist_ok=True)

def render(name, width, height, body):
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">{body}</svg>'
    source = ROOT / "art" / f"{name}.svg"
    source.write_text(svg)
    if name == "wall-gate":  # gradients/filters need librsvg
        subprocess.run(["rsvg-convert", str(source), "-o", str(OUT / f"{name}.png")], check=True)
        return
    subprocess.run(["rsvg-convert", str(source), "-o", str(OUT / f"{name}.png")], check=True)

render("skyline-bg", 1024, 1024, '''<defs><linearGradient id="g" y2="1"><stop stop-color="#111440"/><stop offset="1" stop-color="#080a1c"/></linearGradient></defs><rect width="1024" height="1024" fill="url(#g)"/><g fill="#20275f" stroke="#4d5aa5" stroke-width="3"><path d="M30 700V330h120v370M190 700V150h180v550M410 700V390h120v310M555 700V80h210v620M800 700V260h150v440"/></g><g fill="#66e8ff"><path d="M55 370h12v6H55m160-120h12v6h-12m35 90h12v6h-12m350-90h12v6h-12m40-80h12v6h-12m110 220h12v6h-12m130-120h12v6h-12"/></g><path d="M0 700h1024v324H0z" fill="#0c0f2c"/><g stroke="#4d5aa5" opacity=".55" stroke-width="3"><path d="M512 650L0 1024M512 650l512 374"/><path d="M0 780h1024M0 880h1024M0 980h1024"/></g>''')

# Stage-specific fallback backdrops. Runtime prefers owner files in assets/.
OUT = ROOT / "assets" / "gen"
OUT.mkdir(parents=True, exist_ok=True)
stage_backdrops = [
    ("#111440", "#080a1c", "#20275f", "#66e8ff", ""),
    ("#182050", "#090d27", "#263b73", "#7df6df", ""),
    ("#241447", "#0b0821", "#4d2d78", "#ff6bbd", ""),
    ("#101b3d", "#050a18", "#1f4771", "#66e8ff", "rain"),
    ("#281238", "#080718", "#54234f", "#ff4f9a", "night"),
    ("#273a64", "#0c1630", "#5a7198", "#d7f6ff", "clouds"),
]
for index, (top, bottom, buildings, neon, weather) in enumerate(stage_backdrops, 1):
    windows = ''.join(f'<rect x="{x}" y="{y}" width="10" height="5" fill="{neon}" opacity=".8"/>' for x, y in [(70,330),(210,250),(340,410),(510,180),(650,300),(820,220),(930,390),(440,520)])
    extras = ''
    if weather == 'rain':
        extras = '<g stroke="#8fc9e8" opacity=".3" stroke-width="3">' + ''.join(f'<path d="M{x} 120l-24 84"/>' for x in range(40, 1020, 58)) + '</g>'
    elif weather == 'night':
        extras = '<circle cx="820" cy="170" r="72" fill="#ffda6b" opacity=".25"/><circle cx="820" cy="170" r="54" fill="#ffda6b" opacity=".16"/>'
    elif weather == 'clouds':
        extras = '<path d="M0 690 Q180 610 360 700 T720 680 T1024 710V1024H0Z" fill="#ffda6b" opacity=".16"/><path d="M0 760 Q210 700 430 770 T1024 750V1024H0Z" fill="#f4f4ff" opacity=".12"/>'
    body = f'''<defs><linearGradient id="g" y2="1"><stop stop-color="{top}"/><stop offset="1" stop-color="{bottom}"/></linearGradient></defs><rect width="1024" height="1024" fill="url(#g)"/><g fill="{buildings}" stroke="{neon}" stroke-width="3" opacity=".95"><path d="M28 700V360h120v340M190 700V170h180v530M410 700V400h120v300M555 700V90h210v610M800 700V275h150v425"/></g><g>{windows}</g>{extras}<path d="M0 700h1024v324H0z" fill="#0c0f2c"/><g stroke="{neon}" opacity=".55" stroke-width="3"><path d="M512 650L0 1024M512 650l512 374"/><path d="M0 780h1024M0 880h1024M0 980h1024"/></g>'''
    render(f"bg-stage-{index}", 1024, 1024, body)

runner = []
for i, leg in enumerate((0, 3, -2, 2)):
    x = i * 64
    runner.append(f'<g transform="translate({x} 0)"><ellipse cx="32" cy="54" rx="16" ry="5" fill="#66e8ff" opacity=".35"/><circle cx="32" cy="17" r="10" fill="#ffda6b" stroke="#fff4b4" stroke-width="2"/><path d="M24 16h18l-3-7H27z" fill="#131942"/><rect x="19" y="25" width="26" height="21" rx="5" fill="#ff4f9a" stroke="#ffadd3" stroke-width="2"/><path d="M26 45l{22+leg} 11M38 45l{43-leg} 11M20 30l{10+leg} 8M44 30l{53-leg} 5" stroke="#66e8ff" stroke-width="5" stroke-linecap="round"/></g>')
render("runner-sheet", 256, 64, "".join(runner))
render("hazards-sheet", 128, 64, '''<path d="M8 52h48l-6-30-9 13-8-18-8 18-9-15z" fill="#ff4f9a" stroke="#ffb8dc" stroke-width="2"/><path d="M72 19h48v8H72zm5 8v18m38-18v18" stroke="#66e8ff" stroke-width="4"/><circle cx="87" cy="12" r="4" fill="#ffda6b"/>''')
render("icon", 1024, 1024, '''<rect x="56" y="56" width="912" height="912" rx="180" fill="#111535" stroke="#66e8ff" stroke-width="24"/><path d="M170 760h680" stroke="#4d5aa5" stroke-width="16"/><path d="M285 760l125-410 104 410z" fill="#ff4f9a"/><path d="M514 760l116-490 150 490z" fill="#66e8ff"/><circle cx="512" cy="280" r="60" fill="#ffda6b" stroke="#fff4b4" stroke-width="8"/>''')
render("splash", 1600, 900, '''<rect width="1600" height="900" fill="#080a1c"/><path d="M0 570h1600v330H0z" fill="#0c0f2c"/><g stroke="#4d5aa5" opacity=".55" stroke-width="4"><path d="M800 510L0 900M800 510L1600 900M0 700h1600M0 810h1600"/></g><text x="800" y="330" text-anchor="middle" fill="#f4f4ff" font-family="sans-serif" font-size="110" font-weight="900">SKYLINE</text><text x="800" y="450" text-anchor="middle" fill="#66e8ff" font-family="sans-serif" font-size="110" font-weight="900">SPRINT</text>''')

# Gameplay support art. Runtime prefers owner files in assets/ and falls back to assets/gen/.
render("lane-floor", 512, 512, '''<rect width="512" height="512" fill="#10163a"/><path d="M0 0L170 512M170 0L256 512M342 0L256 512M512 0L342 512" stroke="#33447e" stroke-width="8"/><path d="M0 80h512M0 190h512M0 320h512M0 470h512" stroke="#5967b0" stroke-width="4" opacity=".55"/><path d="M82 0L210 512M430 0L302 512" stroke="#66e8ff" stroke-width="5" opacity=".7"/>''')
render("coin", 48, 48, '''<circle cx="24" cy="24" r="17" fill="#ffda6b" stroke="#fff4b4" stroke-width="3"/><path d="M24 10v28M17 17h14M17 31h14" stroke="#ff9b38" stroke-width="3"/><circle cx="18" cy="16" r="3" fill="#fff8c7"/>''')
render("wall-gate", 128, 128, '''<defs><linearGradient id="w" y2="1"><stop stop-color="#5a1230"/><stop offset="1" stop-color="#22071a"/></linearGradient><filter id="b"><feGaussianBlur stdDeviation="3"/></filter></defs><rect x="6" y="6" width="116" height="116" rx="10" fill="#ff2d55" opacity=".35" filter="url(#b)"/><rect x="10" y="10" width="108" height="108" rx="8" fill="url(#w)" stroke="#ff5f7e" stroke-width="4"/><g stroke="#ffd0dc" stroke-width="6" stroke-linecap="round" opacity=".9"><path d="M24 24L104 104M104 24L24 104"/></g><g fill="#ffdb4d"><path d="M10 10h108v14H10z" opacity=".9"/><path d="M10 104h108v14H10z" opacity=".9"/></g><g fill="#22071a"><path d="M20 10l12 14H18zM44 10l12 14H42zM68 10l12 14H66zM92 10l12 14H90zM20 104l12 14H18zM44 104l12 14H42zM68 104l12 14H66zM92 104l12 14H90z"/></g><rect x="14" y="14" width="40" height="5" rx="2" fill="#fff" opacity=".35"/>''')
render("fx-clean", 128, 128, '''<g stroke="#66e8ff" stroke-linecap="round"><path d="M64 8v28M64 92v28M8 64h28M92 64h28M24 24l20 20M84 84l20 20M104 24L84 44M44 84L24 104" stroke-width="7"/><path d="M64 34l8 22 22 8-22 8-8 22-8-22-22-8 22-8z" fill="#66e8ff" stroke="#d7f6ff" stroke-width="3"/></g>''')
for name, body in {
    "btn-left": '<rect x="8" y="8" width="144" height="144" rx="28" fill="#151b46" fill-opacity=".9" stroke="#66e8ff" stroke-width="6"/><path d="M98 40L48 80l50 40z" fill="#66e8ff"/>',
    "btn-right": '<rect x="8" y="8" width="144" height="144" rx="28" fill="#151b46" fill-opacity=".9" stroke="#66e8ff" stroke-width="6"/><path d="M54 40l50 40-50 40z" fill="#66e8ff"/>',
    "btn-jump": '<rect x="8" y="8" width="144" height="144" rx="28" fill="#151b46" fill-opacity=".9" stroke="#ff4f9a" stroke-width="6"/><polygon points="80,28 42,72 66,62 66,120 94,120 94,62 118,72" fill="#ffda6b"/>',
    "btn-slide": '<rect x="8" y="8" width="144" height="144" rx="28" fill="#151b46" fill-opacity=".9" stroke="#66e8ff" stroke-width="6"/><polygon points="32,106 128,106 128,118 32,118" fill="#66e8ff"/><polygon points="40,102 80,58 120,102 104,102 80,76 56,102" fill="#66e8ff"/><rect x="74" y="28" width="12" height="40" fill="#66e8ff"/>'
}.items():
    render(name, 160, 160, body)
render("store-feature", 1024, 500, '''<defs><linearGradient id="g" y2="1"><stop stop-color="#241447"/><stop offset="1" stop-color="#080a1c"/></linearGradient></defs><rect width="1024" height="500" fill="url(#g)"/><g fill="#263b73" stroke="#66e8ff" stroke-width="4"><path d="M24 370V180h130v190M180 370V100h180v270M410 370V210h120v160M560 370V60h210v310M810 370V150h170v220"/></g><path d="M512 300L0 500h1024z" fill="#10163a"/><g stroke="#5967b0" stroke-width="5" opacity=".7"><path d="M512 300L160 500M512 300L864 500M0 410h1024"/></g><circle cx="480" cy="190" r="30" fill="#ffda6b"/><path d="M440 220l36 80 42-52 48 12-54-68z" fill="#ff4f9a" stroke="#ffadd3" stroke-width="5"/><path d="M690 190h95M700 205v50M775 205v50" stroke="#66e8ff" stroke-width="8"/><circle cx="725" cy="175" r="12" fill="#ff4f9a"/>''')
