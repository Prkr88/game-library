# Merge Drop - Store Listing

## Title / subtitle
Merge Drop - Number Puzzle (subtitle: Drop, match, chain, merge to 2048)

## Short description (80)
Drop numbered tiles, merge equal neighbours and chain cascades for huge scores.

## Long description
Tap a column to drop a tile. Connected equal numbers merge - three 4s become a 16 - and cascades multiply your score. Modes: Classic (resumable), a date-seeded Daily, brutal Rise (junk rows climb from below), 60-second Blitz, no-undo Hardcore, and 30 hand-checked Puzzle levels with star ratings plus a Daily Puzzle. Bomb, swap and undo power-ups. Stone tiles appear as pressure builds, so planning matters. 23 achievements, three colour themes, adaptive music. Works offline, no account needed.

## Keywords
merge, 2048, puzzle, numbers, drop, chain, casual, offline

## Category / rating
Games > Puzzle. Target age rating 4+ / Everyone.

## Art
Icon: assets/gen/icon-1024.png. Feature graphic: assets/gen/store-feature.png (1024x500). Splash: assets/gen/splash.png. Screenshots still needed (on-device, 1290x2796 and 1080x1920): board mid-chain, Rise mode, Blitz timer, achievements, theme picker.

## Privacy / data safety
- No personal data, no analytics, no network calls at runtime.
- Progress (scores, achievements, settings) stored in local storage on device only.
- Ads go through `src/ads.js` (`window.MergeAdsNative` bridge, consent-gated); no ad SDK is bundled yet. If one is added, update disclosure (ad ID, iOS ATT, UMP consent).
- Privacy policy text: "This app stores data locally on your device only and shares nothing with third parties." Page shipped as `privacy.html` (host it at a public URL before submission).

## Build steps
1. `npm install`  2. `npm run cap:add` (once)  3. `npm run cap:sync`  4. `npx cap open ios|android`, set signing, archive.
Device QA: safe-area HUD on notch devices, audio unlock on first tap, power-up buttons on 320px screens.

## Icons (2026-10-18)
- `art/make_icons.sh` derives icon-192/512/180, favicon-32, maskable 512 and Capacitor `resources/icon.png` + `resources/splash.png` from `assets/gen/`. Run `npx capacitor-assets generate` on those after `cap add`.
- Owner-named `assets/icon-1024.png` / `assets/splash.png` untouched (still placeholders); replace with generated-style owner art when available.

## Screenshots
`assets/store/shot-menu.png`, `shot-run.png` (1290x2797, headless Chrome 500x1084 @2.58x). Also `shot-rise.png`, `shot-blitz.png`, `shot-puzzle.png`; regenerate all via `scripts/shots.sh` (headless Chrome, staged boards via `__merge.setBoard`). Also shot-achievements.png. Still needed: theme picker.
