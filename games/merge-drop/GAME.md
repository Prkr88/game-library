# Merge Drop
Drop-and-merge number puzzle. 5x7 grid; tap a column to drop the next tile. Connected equal tiles merge (n tiles → value × 2^(n-1)); merges cascade with chain multipliers. Game over when top row fills.

## Controls
 Tap/click column. Keyboard: focus board, use Left/Right or Home/End to select a column, Enter/Space to drop, Escape to pause/resume; keys 1-5 select and drop directly. Touch-first, portrait.

## Architecture
`src/logic.js` pure logic (tested by `node test.js`), `src/main.js` canvas render/audio/UI. Hooks: `window.MergeAds.showRewarded(cb)` for revive (clears all ≤4 tiles).

## Roadmap
Daily challenge, themes, (done: bomb/swap power-ups, first-run hint), leaderboards (done: achievements), AdMob, store art.

## Difficulty
Level = floor(drops/15). L1: more 8s. L2+: stone tiles (unmergeable, bomb/revive clears) spawn at 5%×(level-1), cap 20%. L3: 16s join pool. Random-play sim (300 seeds): avg run 139 drops before ramp → 82 after, so late game pressure is real; skilled play must plan around stones.

Bot proof (`node bot.js [seeds]`, 40 seeds, median drops/score): Classic random 80/1276, greedy 100/2364, height-aware planner 123/3792; Rise random 28/360, greedy 24/584, planner 49/1752. No policy survives 3000 drops; skill (planning) roughly triples score over random, Rise halves survival vs Classic. Stone rate by level: L0-1 0%, L2 ~8%, L3 ~12%, L4 ~17%, L6+ 21% cap.

## Rise mode (hard)
Every 8 drops (shrinking to 4 by drop 100) a junk row of 2-16 tiles rises from below, no equal horizontal/vertical neighbours; top-row overflow = game over. Random-play sim (100 seeds): avg run 82 drops normal → 33 drops Rise. Separate `riseBest` score.

## Achievements
14 total; includes Rise/daily/level/bomb goals to give mastery targets beyond tile milestones.

## Undo
One undo per run (disabled in Daily for fairness). Snapshot before each drop incl. RNG state, so replay is deterministic; bomb/swap clear the snapshot.

## Blitz (timed)
60s countdown, chains add 2s×(chain-1) (cap 99s), no revive/undo penalty change. Separate `blitzBest`. Skill expressed as chain-planning for time; achievement at 1,500.

Run HUD labels active mode, exposes Blitz seconds in text outside canvas, warns below 10 seconds, and announces top-row danger for screen-reader users. Planning HUD announces next tile, selected column, full-column state, exact merge result, cascade count, board-clear bonus, and red GAME OVER warning when selected legal drop ends run; touch hover and keyboard column selection stay synchronized. Ghost target uses same pure preview, including fatal-drop simulation. Live mastery HUD chases next tile milestones (128, 512, 2048+), with near-goal emphasis and post-run remaining count; Undo restores mastery goal text to restored board state. Daily record chase is date-scoped, so a new calendar day starts from zero instead of comparing against yesterday.

Pause overlay shows mode, score, drop count, top tile, best chain, next tile, mastery progress, exact Blitz seconds remaining, and true top-row occupancy before resume.

Mobile panels use safe-area padding and touch scrolling. Long achievement and game-over recaps keep every row and action reachable on short portrait screens.

Keyboard/accessibility: canvas has a visible focus ring and screen-reader instructions. Starting a run or touching board moves focus to canvas. Arrow/Home/End selection updates same planning HUD used by touch; Enter/Space activates selected column; Escape toggles pause during play.

Game-over summary reports run drops, best chain, and reached difficulty level. Menu now keeps mode records plus last-run score, drops, top tile, and chain, giving immediate replay targets after every mode. Game-over also shows exact points needed to beat prior mode record, or new-record margin. Best-chain state is part of pure logic and undo snapshots, so retry feedback matches actual run history.

## Save recovery
`normalizeSave` validates localStorage data before menu or gameplay reads it. Malformed root saves, nested Daily data, counters, theme indexes, achievements, and last-run summaries fall back to safe defaults; valid progress remains intact. This keeps browser edits, interrupted writes, and version-skewed saves from blocking boot.

## Audio
`src/audio.js`: master compressor + generated reverb; merge chime pitch follows tile value and chain (fifth + sparkle on chains); distinct drop/land/bomb/swap/undo/rise/level/clear/game-over SFX; 4-chord pad/bass/arp music whose tempo (480→350ms) and density rise with level/drops; heartbeat warning while top-row DANGER shown. `node audio-test.js` smoke-tests against a stub AudioContext.

## Packaging
`npm run build` copies index.html, manifest, src/, assets/ into `www/` (Capacitor webDir) — excludes tests/art sources. Listing + privacy text in STORE.md. Power-up icons: `art/powerups.py` -> assets/gen/powerup-*.png (+@2x), owner files assets/powerup-*.png take priority.

## Onboarding
First run shows a 3-step coach card (`#coach`): drop -> merge -> chain, advancing on real drop results. HUD: best score folded into the mode line; `#best` hidden.

## UI/FX art
`art/ui_fx.py` -> assets/gen/{fx-merge,fx-combo,ui-panel,ui-button}.png. fx-merge drawn as rotating fading burst per merge (bigger on chains); ui-button is the menu/panel button skin via layered CSS backgrounds (owner file on top). fx-combo drawn as pop-in CHAIN xN banner over board on chains (owner file first); ui-panel wired as 9-slice border-image card on all overlay panels (owner file via --panel CSS var, generated fallback).
- Settings panel (⚙): music/SFX volume sliders, sound & haptics toggles.

## Puzzle mode (hand-checked challenge levels)
20 fixed-board levels (12 core + 8 expert pack 2 via `node scripts/puzzle-gen.js pack2`) (`src/puzzles.js`, generated + solver-verified by `scripts/puzzle-gen.js`): preset board, fixed tile queue, goal tile, drop limit. Stars by drops used: <= par 3★, par+1 2★, else 1★; next level unlocks on any clear. No power-ups/undo. Difficulty ramp (exhaustive solver): par 2 -> 7 drops, number of optimal solutions 3-18 early -> 1-3 late, stones from level 5; levels 8+ limit is par+1 so only near-optimal play clears. `node test.js` re-proves each puzzle is solvable at par and not faster.

Pack 2 (levels 13-20): par 7-8 (up to 5^8 drop sequences searched), 1-3 optimal solutions, 1-3 stones, limit = par+1 for 13-15 and exactly par for 16-20 (zero slack: any mistake fails, 3★ only). Exhaustive solver in `test.js` proves each solvable at par and not faster.

## Monetization
`src/ads.js`: adapter active only if native shell defines `window.MergeAdsNative {requestConsent, showInterstitial, showRewarded}`. Requires consent; interstitial every 3rd run with 120s min gap; skipped when `removeAds` set; rewarded revive grants only when reward earned. Web builds stay ad-free. Tested in `test.js`.

## Daily Puzzle
Menu button 🧩 DAILY PUZZLE: `L.dailyPuzzleIndex(date, n)` picks one of the harder upper-half puzzles (same for all players that day). Win extends streak (consecutive days) and stores best stars in `save.dpz` (normalized, tested).

## Hardcore mode
💀 HARDCORE (menu): Classic board with 9-drop levels (vs 15), wider tile pool from drop 1, stones from level 1 up to 30% of spawns, no undo. Separate `hardBest`. `node bot.js`: planner median 79 drops vs 123 Classic (greedy 66 vs 100, random 56 vs 81) -> clearly harder. Tested in `test.js`.

Pack 3 (levels 21-24): `node scripts/puzzle-gen.js pack3`; par 9 (5^9 drop sequences searched per candidate), 1-2 optimal solutions, 2-3 stones, limit = par (zero slack), goals 128-256. `test.js` re-proves each solvable at par and not faster (~30s total).

## Landscape
When H<560 and landscape: compact HUD, power-up buttons in a right column, coach card left of board (`layout()` in main.js + media query in style.css).
- Achievements: 24 total (+Blitz 4k, Rise 3k, 7-day streak) incl. late-game mastery (Hardcore, puzzle stars, x8 chain).
- Owner board-bg.png: full-scene art, slot grid mapped onto cells + panel clip in draw (src/main.js); generated fallback unchanged.

Puzzle pack 4: puzzles 25-28 (par 9, 1-2 solutions, 2-4 stones), generated via `node scripts/puzzle-gen.js pack4` (~10 min); total 28.

Puzzle hints: each puzzle has `sol` (optimal column string) added by `node scripts/puzzle-solutions.js` (~30s; rerun after puzzle-gen). 💡 HINT highlights next column if moves so far match `sol`; hint use caps stars at 2. test.js proves every sol reaches goal.
- Puzzle lookahead: plan line shows 'THEN a b c' of queued tiles.
- Run resume: Classic run saved on pause/hide/quit (localStorage mergedrop-run), PLAY becomes RESUME RUN; cleared on game over.

- UI test: `node scripts/ui-test.js` drives real Chrome (menu -> PLAY -> drop via key -> Escape pause toggle); part of `npm test`.

Puzzle pack 5: puzzles 29-30 (par 9, 2-3 solutions, 3-4 stones) via `node scripts/puzzle-gen.js pack5` then `node scripts/puzzle-solutions.js` (par-10 search too slow, dropped).
