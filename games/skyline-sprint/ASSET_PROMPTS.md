# Skyline Sprint — Asset Prompts

Generate each image with any image model (Midjourney, GPT-Image, Flux, etc.), then save it as
`games/skyline-sprint/assets/<filename>` using the **exact filename** below. The game uses your file when it
exists and falls back to the generated placeholder otherwise.

**Style (prepend to every prompt):** Neon pixel-art, 16-bit era, 3-lane rooftop runner seen from behind/above, purple-pink dusk sky, teal and orange neon, crisp pixels.

`name-1..4.png` = one file per number (name-1.png … name-4.png); `a.png / b.png` = separate files.

General rules: PNG, transparent background unless marked *opaque*, subject centered, no text/watermark,
no drop shadow outside the subject, consistent light from top-left. Animation frames: generate one frame per
image with the same prompt + seed, changing only the pose.

| File | Size | Prompt |
|---|---|---|
| `runner-1..4.png` | 96×128 | Parkour runner seen from behind, hoodie with neon stripes, running cycle. |
| `runner-jump.png / runner-slide.png` | 96×128 | Same runner jumping / sliding low. |
| `barrier.png` | 128×96 | Rooftop barrier with hazard stripes, jump over. |
| `drone-1..2.png` | 128×96 | Hovering security drone with red eye and spinning rotors, slide under. |
| `lane-floor.png` | 512×512 | Rooftop floor with 3 lane markings, tileable vertically, *opaque*. |
| `coin.png` | 48×48 | Spinning neon coin. |
| `bg-stage-1..6.png` | 1242×2688 | Skyline backdrops: Rooftop, Skybridge, Monorail, Stormline (rain/lightning), Night Shift, Summit (above clouds), *opaque*. |
| `fx-clean.png` | 128×128 | Teal sparkle burst. |
| `btn-left.png / btn-right.png / btn-jump.png / btn-slide.png` | 160×160 | Translucent pixel-art touch buttons with arrow glyphs. |

## Store art (opaque)
| File | Size | Prompt |
|---|---|---|
| `icon-1024.png` | 1024×1024 | Pixel-art runner leaping between neon rooftops at dusk, drone behind. Bold, readable at 48px, no text, fills the square, *opaque*. |
| `splash.png` | 1242×2688 | Runner sprinting toward a towering neon skyline at dusk, three glowing lanes ahead. Vertical composition, empty top third for the title, *opaque*. |
| `store-feature.png` | 1024×500 | Behind-view of the runner dodging a drone on a neon rooftop, city skyline at dusk. Wide banner, *opaque*. |

Generated fallback files live in `assets/gen/` for every row above; runtime loads owner-supplied files first, then generated fallback. `art/generate_art.py` regenerates all fallback PNGs, including lane-floor, coin, fx-clean, touch buttons, and store-feature.

| `wall-gate.png` | 128×128 | Solid neon-red barrier gate with hazard-yellow striped caps and a crossed warning brace, glowing edge, transparent background, same pixel-art style as barrier.png. Front view. |

Generated-only (not owner-listed; `art/make_stage_bgs_7_8.py`, graded from stage 6): `assets/gen/bg-stage-7.png` (Neon Core, 1242×2688) and `bg-stage-8.png` (Zenith, 1242×2688). Prompts if you want owner art: "Pixel-art vertical skyline, deep blue-violet neon core, magenta lane lights, towers glowing" / "Pixel-art vertical skyline at golden dawn above clouds, gold-white light, tallest spire".
