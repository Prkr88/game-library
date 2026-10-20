"""Generate Pulse Run's local PNG fallback pack from compact SVG sources."""
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'gen'
OUT.mkdir(parents=True, exist_ok=True)
CYAN, PINK, YELLOW, RED = '#72f6ff', '#ff5fb8', '#ffe66d', '#ff4f9a'

def render(name, width, height, body, opaque=False):
    bg = '<rect width="100%" height="100%" fill="#090b20"/>' if opaque else ''
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}"><defs><filter id="g"><feGaussianBlur stdDeviation="7"/></filter></defs>{bg}{body}</svg>'
    source = OUT / (name + '.svg'); source.write_text(svg)
    subprocess.run(['rsvg-convert', '-o', str(OUT / name), str(source)], check=True)
    source.unlink()

def runner(name, pose='run', width=96, height=96):
    if pose == 'slide': body = '<path d="M15 45L60 27 83 37 64 52 25 55Z" fill="#72f6ff"/><circle cx="77" cy="27" r="11" fill="#72f6ff"/><path d="M30 51L12 61M48 48L76 59" stroke="#72f6ff" stroke-width="8" stroke-linecap="round"/>'
    elif pose == 'jump': body = '<path d="M35 29L61 29 67 57 37 59Z" fill="#72f6ff"/><circle cx="37" cy="21" r="11" fill="#72f6ff"/><path d="M42 55L22 73M58 54L76 67" stroke="#72f6ff" stroke-width="8" stroke-linecap="round"/>'
    elif pose == 'fall': body = '<path d="M35 33L60 30 67 59 38 61Z" fill="#72f6ff"/><circle cx="38" cy="25" r="11" fill="#72f6ff"/><path d="M43 57L29 77M58 57L76 73" stroke="#72f6ff" stroke-width="8" stroke-linecap="round"/>'
    else: body = '<path d="M32 28L59 28 63 58 35 58Z" fill="#72f6ff"/><circle cx="36" cy="22" r="11" fill="#72f6ff"/><path d="M40 55L21 73M56 55L74 67" stroke="#72f6ff" stroke-width="8" stroke-linecap="round"/>'
    if pose == 'hit': body += '<path d="M12 28l10-6M76 20l8-7M15 66l10-4M76 61l10 4" stroke="#ff5fb8" stroke-width="4"/>'
    body += f'<path d="M30 30h20" stroke="{PINK}" stroke-width="5"/><circle cx="48" cy="47" r="6" fill="{YELLOW}" stroke="#fff" stroke-width="2"/>'
    render(name, width, height, f'<g filter="url(#g)" opacity=".8">{body}</g>{body}')

def hazard(name, kind):
    if kind == 'low': body = f'<rect x="8" y="28" width="80" height="24" rx="4" fill="{PINK}" stroke="{YELLOW}" stroke-width="3"/><path d="M15 30l14 20m4-20l14 20m4-20l14 20m4-20l10 15" stroke="#401f70" stroke-width="5"/>'; size=(96,64)
    elif kind == 'high': body = f'<rect x="8" y="28" width="80" height="15" fill="{CYAN}" stroke="{YELLOW}" stroke-width="3"/><path d="M15 43v117M81 43v117" stroke="{RED}" stroke-width="11"/>'; size=(96,160)
    else: body = f'<path d="M5 54L30 20h32L59 54Z" fill="{RED}" stroke="{YELLOW}" stroke-width="3"/><path d="M8 51L58 23" stroke="{PINK}" stroke-width="5"/>'; size=(64,64)
    render(name, *size, f'<g filter="url(#g)" opacity=".75">{body}</g>{body}')

def background(name, idx):
    colors = [('#090b20','#23195b'),('#100b2b','#49205d'),('#141044','#2e2b70'),('#220d38','#641f5e'),('#300e31','#751f51'),('#3b1025','#8a273a')]
    top, bottom = colors[idx]
    buildings = ''.join(f'<rect x="{(i*83+idx*41)%1920}" y="{350+(i*31)%230}" width="{42+(i*17)%90}" height="{650-(i*31)%230}" fill="#0d1237" stroke="#40438a" stroke-width="2"/>' for i in range(28))
    windows = ''.join(f'<rect x="{(i*83+idx*41)%1920+8}" y="{380+(i*31)%180}" width="10" height="5" fill="{YELLOW if i%3 else CYAN}"/>' for i in range(28))
    body = f'<defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="{top}"/><stop offset="1" stop-color="{bottom}"/></linearGradient></defs><rect width="1920" height="1080" fill="url(#sky)"/>{buildings}{windows}<path d="M0 620H1920" stroke="{PINK}" stroke-width="5"/><path d="M960 620L0 1080M960 620L1920 1080" stroke="#46327d" stroke-width="3"/>'
    render(name, 1920, 1080, body, True)

def main():
    for i in range(1, 7): background(f'bg-district-{i}.png', i-1)
    for i in range(1, 7): runner(f'runner-run-{i}.png')
    runner('runner-jump.png','jump'); runner('runner-fall.png','fall'); runner('runner-slide.png','slide',96,64); runner('runner-hit.png','hit')
    hazard('barrier-low.png','low'); hazard('barrier-high.png','high'); hazard('gap-edge.png','gap')
    render('ground-tile.png',128,64,f'<rect width="128" height="64" fill="#0d1237"/><path d="M0 6H128M0 10H128" stroke="{CYAN}" stroke-width="3"/><path d="M0 64L38 10M24 64L62 10M48 64L86 10M72 64L110 10M96 64L134 10" stroke="#254170" stroke-width="2"/>',True)
    render('pulse-core.png',64,64,f'<circle cx="32" cy="32" r="25" fill="none" stroke="{CYAN}" stroke-width="4"/><circle cx="32" cy="32" r="15" fill="{YELLOW}" stroke="#fff" stroke-width="3"/><path d="M32 19L42 32 32 45 22 32Z" fill="{CYAN}"/>')
    render('checkpoint.png',64,160,'<path d="M8 160V32Q8 8 32 8T56 32V160" fill="none" stroke="#67ffb1" stroke-width="8"/><path d="M18 38H46" stroke="#72f6ff" stroke-width="5"/>')
    render('reactor.png',512,512,f'<circle cx="256" cy="256" r="190" fill="none" stroke="{PINK}" stroke-width="18"/><circle cx="256" cy="256" r="120" fill="{CYAN}" stroke="#fff" stroke-width="8"/><path d="M256 120L350 256 256 392 162 256Z" fill="{YELLOW}"/>')
    render('fx-burst.png',128,128,f'<path d="M64 6V42M64 86V122M6 64H42M86 64H122M23 23L48 48M80 80L105 105M105 23L80 48M48 80L23 105" stroke="{PINK}" stroke-width="7" stroke-linecap="round"/>')
    render('btn-jump.png',180,180,'<circle cx="90" cy="90" r="70" fill="#17245d" fill-opacity=".8" stroke="#72f6ff" stroke-width="5"/><path d="M55 105L90 58 125 105" fill="none" stroke="#72f6ff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>')
    render('btn-slide.png',180,180,'<circle cx="90" cy="90" r="70" fill="#17245d" fill-opacity=".8" stroke="#ff5fb8" stroke-width="5"/><path d="M55 75L90 122 125 75" fill="none" stroke="#ff5fb8" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>')
    render('icon-1024.png',1024,1024,'<rect width="1024" height="1024" fill="#090b20"/><circle cx="500" cy="480" r="250" fill="none" stroke="#ff5fb8" stroke-width="24"/><path d="M300 700L520 300 740 700" fill="none" stroke="#72f6ff" stroke-width="34"/><circle cx="520" cy="420" r="70" fill="#ffe66d"/>',True)
    render('splash.png',1242,2688,'<rect width="1242" height="2688" fill="#090b20"/><path d="M100 2200L621 1100 1140 2200" fill="none" stroke="#72f6ff" stroke-width="38"/><circle cx="621" cy="1100" r="180" fill="#ff5fb8"/>',True)
    render('store-feature.png',1024,500,'<rect width="1024" height="500" fill="#090b20"/><path d="M100 420L520 110 920 420" fill="none" stroke="#72f6ff" stroke-width="26"/><circle cx="540" cy="180" r="80" fill="#ffe66d"/>',True)

if __name__ == '__main__': main()
