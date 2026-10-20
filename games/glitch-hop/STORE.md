# Glitch Hop - Store Listing

## Title / subtitle
Glitch Hop - Neon Precision Platformer (subtitle: Dash. Wall-jump. Don't die.)

## Short description (80)
Tight neon platformer: 65 hand-built levels, wall-jumps, dashes, speedrun stars.

## Long description
Hop through 12 worlds of glitching neon circuitry. Coyote time, jump buffering and variable jump height keep controls honest; ice, belts, crumbling and phasing blocks, saws, springs and a dash ability keep levels hard. Earn time stars, hunt coins, beat your personal-best ghost times, try Glitch mode and a date-seeded Daily level. Works offline. No accounts, no required purchases.

## Keywords
platformer, precision, neon, speedrun, retro, pixel, skill, offline

## Category / rating
Games > Platformer. Target rating 4+ / Everyone (cartoon pixel hazards only, no UGC, no purchases).

## Screenshots
Landscape 1920x1080 in assets/store/ (shot-menu, shot-levels, shot-run) via `scripts/shots.sh`. Feature graphic: assets/store-feature.png. Icon: assets/icon-1024.png. Replace with on-device captures before submission.

## Privacy / data safety
- No personal data, analytics, or runtime network calls. Saves locally only.
- Policy text: privacy.html (publish at a URL before submission). Update if an ad SDK is added.

## Build steps
1. `npm install`  2. `npm run cap:add` (once)  3. `npm run cap:sync`  4. `npx cap open ios|android`, lock to landscape, set signing, archive.
Device QA: safe-area HUD on notch devices, auto-pause on app switch, audio unlock on first tap, touch buttons on small landscape screens.
