"""Runner sheet: 6 frames (run x4, jump, slide), 128px cells, back view. Output assets/runner-sheet.png."""
from pathlib import Path
import subprocess
ROOT = Path(__file__).resolve().parents[1]
DEFS = '''<defs>
<linearGradient id="hood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5a3bb8"/><stop offset="1" stop-color="#2a1a6e"/></linearGradient>
<linearGradient id="top" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7ab8"/><stop offset="1" stop-color="#c2307c"/></linearGradient>
<linearGradient id="pants" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#27326e"/><stop offset="1" stop-color="#151b46"/></linearGradient>
<radialGradient id="glow"><stop offset="0" stop-color="#66e8ff" stop-opacity=".55"/><stop offset="1" stop-color="#66e8ff" stop-opacity="0"/></radialGradient>
</defs>'''
O = 'stroke="#0b0d26" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"'

def limb(x1, y1, x2, y2, w, fill):
    return f'<path d="M{x1} {y1}L{x2} {y2}" stroke="#0b0d26" stroke-width="{w+6}" stroke-linecap="round"/><path d="M{x1} {y1}L{x2} {y2}" stroke="{fill}" stroke-width="{w}" stroke-linecap="round"/>'

def shoe(x, y):
    return f'<ellipse cx="{x}" cy="{y}" rx="10" ry="6" fill="#f4f4ff" {O}/><path d="M{x-8} {y+2}h16" stroke="#66e8ff" stroke-width="3"/>'

def run(phase):
    # phase: leg offsets (left foot forward/back), arm swing
    l, a = phase
    s = ['<ellipse cx="64" cy="118" rx="28" ry="7" fill="url(#glow)"/>']
    # back leg first
    s.append(limb(54, 76, 54 - l, 108 - abs(l) * .3, 12, '#1c2459') + shoe(54 - l, 112 - abs(l) * .3))
    s.append(limb(74, 76, 74 + l, 108 - abs(l) * .3 + (8 if l < 0 else 0), 12, '#27326e') + shoe(74 + l, 112 - abs(l) * .3 + (8 if l < 0 else 0)))
    s.append(limb(40, 52, 36 - a, 74, 9, '#7a4ad8'))
    s.append(f'<path d="M42 48h44l6 34q-28 12-56 0z" fill="url(#top)" {O}/>')
    s.append('<path d="M60 50h8v32h-8z" fill="#66e8ff" opacity=".9"/><path d="M46 62h36" stroke="#66e8ff" stroke-width="3" opacity=".7"/>')
    s.append(limb(88, 52, 92 + a, 74, 9, '#7a4ad8'))
    s.append(f'<circle cx="36" cy="{74}" r="0"/>')
    s.append(f'<circle cx="64" cy="30" r="19" fill="url(#hood)" {O}/><path d="M52 22q12-10 24 0" stroke="#a07cff" stroke-width="3" fill="none"/><path d="M58 26q6 4 12 0v14q-6 4-12 0z" fill="#ffda6b" opacity=".0"/>')
    return ''.join(s)

def jump():
    s = ['<ellipse cx="64" cy="120" rx="18" ry="4" fill="url(#glow)"/>']
    s.append(limb(54, 74, 44, 92, 12, '#1c2459') + limb(44, 92, 52, 104, 11, '#1c2459') + shoe(54, 106))
    s.append(limb(74, 74, 86, 90, 12, '#27326e') + limb(86, 90, 78, 104, 11, '#27326e') + shoe(76, 106))
    s.append(limb(40, 50, 30, 28, 9, '#7a4ad8') + limb(88, 50, 98, 28, 9, '#7a4ad8'))
    s.append(f'<path d="M42 46h44l6 32q-28 12-56 0z" fill="url(#top)" {O}/><path d="M60 48h8v30h-8z" fill="#66e8ff" opacity=".9"/>')
    s.append(f'<circle cx="64" cy="28" r="19" fill="url(#hood)" {O}/><path d="M52 20q12-10 24 0" stroke="#a07cff" stroke-width="3" fill="none"/>')
    return ''.join(s)

def slide():
    s = ['<ellipse cx="62" cy="118" rx="42" ry="6" fill="url(#glow)"/>']
    s.append(limb(70, 100, 108, 112, 13, '#27326e') + shoe(112, 112))
    s.append(limb(66, 94, 100, 104, 13, '#1c2459') + shoe(104, 104))
    s.append(f'<path d="M30 78q18-14 44 4l-4 26q-26 4-42-8z" fill="url(#top)" {O}/><path d="M42 84l24 14" stroke="#66e8ff" stroke-width="5" stroke-linecap="round"/>')
    s.append(limb(48, 98, 76, 112, 8, '#7a4ad8'))
    s.append(f'<circle cx="26" cy="84" r="17" fill="url(#hood)" {O}/><path d="M16 78q8-8 18-2" stroke="#a07cff" stroke-width="3" fill="none"/>')
    return ''.join(s)

frames = [run(p) for p in ((12, 14), (0, 0), (-12, -14), (0, 0))] + [jump(), slide()]
# frame 1/3 passing poses: slight bob
frames[1] = run((4, 6)).replace('cy="30"', 'cy="27"')
frames[3] = run((-4, -6)).replace('cy="30"', 'cy="27"')
body = DEFS + ''.join(f'<g transform="translate({i*128} 0)">{f}</g>' for i, f in enumerate(frames))
svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="768" height="128" viewBox="0 0 768 128">{body}</svg>'
(ROOT / 'art' / 'runner-sheet.svg').write_text(svg)
subprocess.run(['rsvg-convert', str(ROOT / 'art' / 'runner-sheet.svg'), '-o', str(ROOT / 'assets' / 'runner-sheet.png')], check=True)
