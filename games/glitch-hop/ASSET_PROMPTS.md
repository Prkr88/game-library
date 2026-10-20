# Glitch Hop — Asset Prompts

Generate each image with any image model (Midjourney, GPT-Image, Flux, etc.), then save it as
`games/glitch-hop/assets/<filename>` using the **exact filename** below. The game uses your file when it
exists and falls back to the generated placeholder otherwise.

**Style (prepend to every prompt):** Neon cyberpunk pixel-art, 32×32 base tile grid, dark navy/violet background palette with electric cyan, hot pink and lime accents, crisp pixels, subtle glow, glitch/chromatic-aberration details.

`name-1..4.png` = one file per number (name-1.png … name-4.png); `a.png / b.png` = separate files.

General rules: PNG, transparent background unless marked *opaque*, subject centered, no text/watermark,
no drop shadow outside the subject, consistent light from top-left. Animation frames: generate one frame per
image with the same prompt + seed, changing only the pose.

| File | Size | Prompt |
|---|---|---|
| `player-idle-1.png / player-idle-2.png` | 64×64 | Small cute glitch-sprite hero, a cube-shaped digital creature with big glowing cyan eyes and a pink antenna, idle breathing pose. |
| `player-run-1..4.png` | 64×64 | Same hero mid-run cycle, legs and pixel trail streaking behind, 4 frames. |
| `player-jump.png / player-fall.png` | 64×64 | Same hero jumping upward, arms up / falling, stretched pose. |
| `player-wall.png` | 64×64 | Same hero clinging to a wall on its left side, sparks at contact. |
| `player-death-1..3.png` | 64×64 | Same hero shattering into glowing pixel shards, 3 frames. |
| `tile-stone.png` | 32×32 | Dark metallic circuit-board block, cyan trace lines, beveled edges, tileable, *opaque*. |
| `tile-crumble.png` | 32×32 | Cracked orange data block, unstable, fractures glowing. |
| `tile-phase-a.png / tile-phase-b.png` | 32×32 | Translucent holographic block, pink (a) / cyan (b), scanlines. |
| `tile-ice.png` | 32×32 | Pale blue frozen data crystal block, glossy highlight. |
| `tile-belt-right.png` | 32×32 | Green conveyor block with glowing arrow chevrons pointing right. |
| `spike.png` | 32×32 | Row of three sharp neon-red crystal spikes pointing up. |
| `saw.png` | 64×64 | Spinning neon buzzsaw blade, magenta glowing teeth, motion-blur ready. |
| `spring.png` | 32×32 | Yellow coiled launch pad, compressed spring. |
| `coin.png` | 24×24 | Small glowing gold data-chip coin with a pixel star. |
| `portal.png` | 64×96 | Swirling cyan-pink exit portal, vertical oval, glitch distortions. |
| `checkpoint.png` | 32×64 | Short antenna beacon with green blinking light. |
| `wind-up.png / wind-down.png` | 32×32 | Translucent green upward / pink downward wind streaks, tileable vertically. |
| `bg-far.png` | 1920×1080 | Distant neon city skyline silhouette under a violet grid sky, *opaque*, tileable horizontally. |
| `bg-mid.png` | 1920×1080 | Mid-ground server towers and cables with glowing windows, transparent sky, tileable horizontally. |
| `btn-left.png / btn-right.png / btn-jump.png` | 160×160 | Round translucent touch button with neon outline and ◀ / ▶ / up-arrow glyph. |
| `ui-star.png / ui-star-empty.png` | 64×64 | Glowing gold star / dim outlined star rating icon. |

## Store art (opaque)
| File | Size | Prompt |
|---|---|---|
| `icon-1024.png` | 1024×1024 | The glitch-sprite hero mid-jump over a magenta buzzsaw against a violet neon grid. Bold, readable at 48px, no text, fills the square, *opaque*. |
| `splash.png` | 1242×2688 | The hero leaping between neon circuit platforms toward a glowing portal, saws and spikes below. Vertical composition, empty top third for the title, *opaque*. |
| `store-feature.png` | 1024×500 | Side view of a neon pixel-art level with the hero wall-jumping, saws and portal, cyberpunk city behind. Wide banner, *opaque*. |
