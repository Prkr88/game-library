# Orbit Hop - Store Listing

## Title / subtitle
Orbit Hop - One-Tap Space Arcade (subtitle: Tap to launch, orbit, survive)

## Short description (80)
Launch your comet from planet to planet. Dodge asteroids, lasers and black holes.

## Long description
Orbit a planet, tap to launch, land on the next. Time your shots past asteroids, laser gates and black holes, chain close calls for combos, and collect stars to unlock comet skins. Normal, Hard (unlocks at score 25) and a date-seeded Daily with streaks, plus missions, achievements and a shield power-up. Works offline, no account needed.

## Keywords
orbit, space, planets, arcade, one tap, comet, casual, offline

## Category / rating
Games > Arcade. Target age rating 4+ / Everyone.

## Art
Generated: `assets/gen/*` (planets, hazards, comet skins, nebula backgrounds, explosions). `assets/icon-1024.png` is a placeholder (not overwritten); shipped icons come from `art/make_icons.py` (`icons/`, `resources/`), cropped from owner `splash.png`. Screenshots: `assets/store/shot-*.png` (1290x2796) via `node scripts/shots.js`; 1080x1920 variant still needed.

## Privacy / data safety
- No personal data, no analytics, no network calls at runtime. Progress stored in local storage only.
- Ads: `window.OrbitAds` bridge (rewarded revive / 2x stars); none bundled. Add disclosure + consent (UMP/ATT) if an SDK is added.
- `privacy.html` ships in the build; host it at a public URL before submission.

## Build steps
1. `npm install`  2. `npm run cap:add` (once)  3. `npm run cap:sync`  4. `npx cap open ios|android`, set signing, archive.
