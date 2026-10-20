# Orbit Hop — Asset Prompts

Generate each image with any image model (Midjourney, GPT-Image, Flux, etc.), then save it as
`games/orbit-hop/assets/<filename>` using the **exact filename** below. The game uses your file when it
exists and falls back to the generated placeholder otherwise.

**Style (prepend to every prompt):** Vibrant stylized space art, smooth vector-painted look, rich nebula gradients (deep indigo, magenta, teal), glowing rim lights, soft bloom.

`name-1..4.png` = one file per number (name-1.png … name-4.png); `a.png / b.png` = separate files.

General rules: PNG, transparent background unless marked *opaque*, subject centered, no text/watermark,
no drop shadow outside the subject, consistent light from top-left. Animation frames: generate one frame per
image with the same prompt + seed, changing only the pose.

| File | Size | Prompt |
|---|---|---|
| `comet.png` | 96×96 | Cute glowing comet hero, round icy core with a face-like sparkle, fiery tail trailing left. |
| `comet-skin-1..5.png` | 96×96 | Same comet in 5 skins: ruby fire, emerald aurora, golden sun, violet plasma, rainbow prism. |
| `trail.png` | 256×64 | Soft glowing particle tail strip fading to transparent on the right. |
| `planet-1..8.png` | 256×256 | Stylized round planet, each different: rocky red, ocean blue, ringed gas giant, ice world, jungle green, lava cracked, candy pink, crystal purple; glowing atmosphere rim. |
| `planet-shrink.png` | 256×256 | Unstable crumbling planet with glowing cracks. |
| `orbit-ring.png` | 512×512 | Thin dotted glowing orbit circle. |
| `star-pickup.png` | 48×48 | Small sparkling gold star collectible. |
| `blackhole.png` | 256×256 | Black hole with swirling purple accretion disk, gravitational lensing glow. |
| `asteroid-1..3.png` | 128×128 | Rough gray-brown asteroid rocks, three shapes. |
| `laser-gate.png` | 64×512 | Vertical red energy laser beam between two metallic emitters. |
| `shield.png` | 128×128 | Translucent cyan bubble shield with hex pattern. |
| `bg-nebula-1..3.png` | 1242×2688 | Deep space nebula backdrops getting more intense: calm blue / magenta / red-violet, faint stars, *opaque*. |
| `bg-stars.png` | 1024×1024 | Tileable sparse twinkling star field layer. |
| `fx-explosion-1..4.png` | 192×192 | Comet burst explosion frames, sparks and smoke. |
| `btn-play.png` | 240×240 | Round glowing play button with triangle glyph. |

## Store art (opaque)
| File | Size | Prompt |
|---|---|---|
| `icon-1024.png` | 1024×1024 | The cute glowing comet launching from a ringed planet toward another, vivid nebula behind. Bold, readable at 48px, no text, fills the square, *opaque*. |
| `splash.png` | 1242×2688 | Comet arcing between colorful planets through a magenta nebula, black hole in the distance. Vertical composition, empty top third for the title, *opaque*. |
| `store-feature.png` | 1024×500 | Chain of stylized planets with the comet hopping between them, nebula background. Wide banner, *opaque*. |
