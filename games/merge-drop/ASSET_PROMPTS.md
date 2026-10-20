# Merge Drop — Asset Prompts

Generate each image with any image model (Midjourney, GPT-Image, Flux, etc.), then save it as
`games/merge-drop/assets/<filename>` using the **exact filename** below. The game uses your file when it
exists and falls back to the generated placeholder otherwise.

**Style (prepend to every prompt):** Clean modern casual-puzzle style, soft 3D glossy candy tiles, rounded corners, pastel gradient backgrounds, gentle shadows, bright and friendly like top App Store puzzle games.

`name-1..4.png` = one file per number (name-1.png … name-4.png); `a.png / b.png` = separate files.

General rules: PNG, transparent background unless marked *opaque*, subject centered, no text/watermark,
no drop shadow outside the subject, consistent light from top-left. Animation frames: generate one frame per
image with the same prompt + seed, changing only the pose.

| File | Size | Prompt |
|---|---|---|
| `tile-2.png … tile-2048.png (one per value: 2,4,8,16,32,64,128,256,512,1024,2048)` | 256×256 | Glossy rounded-square jelly tile, empty center for a number, color by value: 2 mint, 4 sky blue, 8 lavender, 16 pink, 32 coral, 64 orange, 128 gold, 256 lime, 512 teal, 1024 royal purple, 2048 rainbow iridescent with sparkles. |
| `tile-stone.png` | 256×256 | Gray cracked stone block, unmergeable, mossy edges. |
| `board-bg.png` | 1080×1512 | Soft rounded board panel with 5×7 subtle slot grid, frosted glass look, *opaque*. |
| `bg.png` | 1242×2688 | Dreamy pastel gradient sky with floating blurred bubbles, *opaque*. |
| `powerup-bomb.png` | 128×128 | Cute round cartoon bomb with lit fuse, glossy. |
| `powerup-swap.png` | 128×128 | Two curved arrows circling, glossy blue icon. |
| `powerup-undo.png` | 128×128 | Glossy circular back-arrow icon. |
| `fx-merge.png` | 256×256 | Burst of white and gold sparkles radiating from center. |
| `fx-combo.png` | 512×256 | Bubbly explosion banner shape behind a combo counter, no text. |
| `ui-panel.png` | 512×512 | Rounded white frosted UI card with soft shadow, 9-slice friendly. |
| `ui-button.png` | 400×140 | Glossy rounded pill button, mint gradient, no text. |
| `ui-coin.png` | 64×64 | Shiny gold coin with a star emboss. |

## Store art (opaque)
| File | Size | Prompt |
|---|---|---|
| `icon-1024.png` | 1024×1024 | A glossy gold 2048-style jelly tile mid-merge with two smaller tiles, sparkle burst, pastel background. Bold, readable at 48px, no text, fills the square, *opaque*. |
| `splash.png` | 1242×2688 | Tower of colorful glossy jelly tiles falling and merging into a glowing gold tile, sparkles. Vertical composition, empty top third for the title, *opaque*. |
| `store-feature.png` | 1024×500 | Colorful glossy number tiles merging on a pastel board with a combo sparkle burst. Wide banner, *opaque*. |

Generated fallbacks live in `assets/gen/` (source: `art/generate_art.py`). Themes Sunset/Ocean use `assets/gen/tile-<v>-t1/-t2.png`; owner `tile-<v>.png` applies to the default Neon theme. Numbers are drawn at runtime over the tile.
