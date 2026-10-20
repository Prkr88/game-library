# Pulse Run — Asset Prompts

Generate each image with any image model (Midjourney, GPT-Image, Flux, etc.), then save it as
`games/pulse-run/assets/<filename>` using the **exact filename** below. The game uses your file when it
exists and falls back to the generated placeholder otherwise.

**Style (prepend to every prompt):** Synthwave neon vector art, dark city night, magenta and cyan glowing outlines, strong silhouettes for readability, subtle bloom and scanlines.

`name-1..4.png` = one file per number (name-1.png … name-4.png); `a.png / b.png` = separate files.

General rules: PNG, transparent background unless marked *opaque*, subject centered, no text/watermark,
no drop shadow outside the subject, consistent light from top-left. Animation frames: generate one frame per
image with the same prompt + seed, changing only the pose.

| File | Size | Prompt |
|---|---|---|
| `runner-run-1..6.png` | 96×96 | Sleek neon courier runner silhouette carrying a glowing pulse orb, running cycle. |
| `runner-jump.png / runner-fall.png` | 96×96 | Same runner jumping, knees tucked / descending. |
| `runner-slide.png` | 96×64 | Same runner sliding low, sparks under feet. |
| `runner-hit.png` | 96×96 | Same runner glitching apart on impact. |
| `ground-tile.png` | 128×64 | Neon-edged rooftop/road segment, tileable horizontally, *opaque*. |
| `gap-edge.png` | 64×64 | Broken ground edge with glowing hazard stripes. |
| `barrier-low.png` | 96×64 | Low energy barrier fence, jump over, orange glow. |
| `barrier-high.png` | 96×160 | Overhead laser bar on two posts, slide under, red glow. |
| `pulse-core.png` | 64×64 | Glowing collectible energy core, cyan with pulsing rings. |
| `checkpoint.png` | 64×160 | Neon checkpoint arch, green. |
| `reactor.png` | 512×512 | Huge glowing reactor core goal structure. |
| `bg-district-1..6.png` | 1920×1080 | Six synthwave city backdrops escalating: Spark (calm blue), Neon Market, Rail Yard, Storm, Overdrive, Core (red/white hot), *opaque*, tileable horizontally. |
| `bg-mid-buildings.png` | 1920×540 | Mid-ground building silhouettes with lit windows, tileable horizontally. |
| `fx-burst.png` | 128×128 | Pink particle burst. |
| `btn-jump.png / btn-slide.png` | 180×180 | Translucent round touch button with up / down chevron. |

## Store art (opaque)
| File | Size | Prompt |
|---|---|---|
| `icon-1024.png` | 1024×1024 | Neon runner leaping over a laser barrier, carrying a glowing orb, magenta-cyan synthwave city. Bold, readable at 48px, no text, fills the square, *opaque*. |
| `splash.png` | 1242×2688 | Runner sprinting along neon rooftops toward a giant glowing reactor on the horizon. Vertical composition, empty top third for the title, *opaque*. |
| `store-feature.png` | 1024×500 | Side view of the neon runner sliding under a laser while a synthwave city glows behind. Wide banner, *opaque*. |
