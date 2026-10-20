# Stack Rush — Asset Prompts

Generate each image with any image model (Midjourney, GPT-Image, Flux, etc.), then save it as
`games/stack-rush/assets/<filename>` using the **exact filename** below. The game uses your file when it
exists and falls back to the generated placeholder otherwise.

**Style (prepend to every prompt):** Minimal isometric 3D low-poly style, soft pastel gradients, smooth ambient-occlusion shading, satisfying clean shapes like top hyper-casual hits.

`name-1..4.png` = one file per number (name-1.png … name-4.png); `a.png / b.png` = separate files.

General rules: PNG, transparent background unless marked *opaque*, subject centered, no text/watermark,
no drop shadow outside the subject, consistent light from top-left. Animation frames: generate one frame per
image with the same prompt + seed, changing only the pose.

| File | Size | Prompt |
|---|---|---|
| `block-1..8.png` | 256×128 | Isometric slab block, glossy, gradient colors cycling: teal, sky, violet, pink, coral, amber, lime, mint. |
| `block-perfect.png` | 256×128 | Same slab glowing white-gold, perfect drop highlight. |
| `block-shard.png` | 128×128 | Falling cut-off slab fragment, isometric. |
| `base.png` | 512×256 | Wide isometric pedestal base for the tower. |
| `bg-theme-1..5.png` | 1242×2688 | Soft gradient skies per theme: dawn pastel, ocean, sunset, night stars, candy, subtle clouds, *opaque*. |
| `fx-perfect.png` | 256×256 | Ring shockwave of white light, isometric ellipse. |
| `ui-coin.png` | 64×64 | Shiny gold coin. |
| `ui-crown.png` | 96×96 | Gold crown for best score. |
| `ui-button.png` | 400×140 | Rounded pastel pill button, no text. |

## Store art (opaque)
| File | Size | Prompt |
|---|---|---|
| `icon-1024.png` | 1024×1024 | Tall isometric tower of pastel glossy slabs with a glowing perfect block on top. Bold, readable at 48px, no text, fills the square, *opaque*. |
| `splash.png` | 1242×2688 | Pastel isometric tower rising into soft clouds, a slab sliding in to land perfectly. Vertical composition, empty top third for the title, *opaque*. |
| `store-feature.png` | 1024×500 | Isometric pastel stack tower with a perfect-drop shockwave ring. Wide banner, *opaque*. |
