# Glitch Hop

Neon precision platformer (landscape-first, works in portrait). 65 hand-designed levels, 3 stars each, plus **Glitch mode** (no checkpoints, saws 25% faster, tighter par).

## Story
You are a corrupted sprite escaping a crashing arcade cabinet. Each level is a broken sector; reach the portal.

## Controls
- Touch: ◀ ▶ bottom-left, ⤒ jump bottom-right, ↻ restart and ❚❚ pause top-right (multi-touch, hold for full jump, tap for hop).
- HUD: live level-progress bar tracks player position from start to portal; normal replay HUD shows live PB lead/deficit; next-star goal shows remaining coins, active par-time pace, or missed time star; remains visible in portrait and long finale levels. Pause recap repeats exact level, progress, elapsed time, coins, deaths, checkpoint, and next-star goal so mobile resume/restart choice stays informed.
- Accessibility: live status region announces level start, pause/resume, checkpoint, death coaching, and clear recap; pause and touch controls expose pressed state; menu, level-select, pause, achievements, and clear overlays move keyboard focus to an actionable control, then resume returns focus to pause.
- Death coaching: instant respawn shows cause-specific retry advice for spikes, ceiling hits, saws, pits, and phase crushes.
- Keyboard: arrows/WASD move, Space/Up/Z jump, R restart, Esc/P pause.
- Tech: coyote time 0.1s, jump buffer 0.12s, variable jump height, wall slide + wall jump, jump pads, instant respawn (0.45s). HTTP(S) launches register cache-first service worker for offline shell relaunch; file:// launches skip registration and remain supported.

## Hazards
Spikes, ceiling spikes, patrolling saws (horizontal/vertical, normal and wide), pits. Checkpoints (flags) on long levels.

## Stars
★ clear · ★ all coins · ★ under par time. "FLAWLESS" badge for zero deaths.

## Levels / difficulty
1 First Steps (gaps, hurdle, spikes) → 2 Spike Row → 3 Spring Break (pads) → 4 Buzzsaw Alley → 5 The Shaft (wall jump) → 6 Pendulum Run (vertical saws, checkpoints) → 7 Low Ceiling (pads vs ceiling spikes) → 8 Gauntlet (pillar bridge + saws) → 9 Needle Shaft (wall jump through saws) → 10 Glitch Core (finale, 120 tiles).

Verification (`node test.js`): beam-search bot with real physics proves every level is beatable. World 12 requires beam width 400 on every level; pars are 1.3-1.5× bot clears. Difficulty rises through dash gaps, narrower landings, moving platforms, mixed hazards, and longer finales. Not a human-tuned curve yet; playtest needed.

## World 2: Crumble (levels 11-15)
New block `x` (crumble): after you land on it, it shakes and vanishes 0.35s later, returns after 2.6s (respawn resets). Levels: 11 Crumble Intro → 12 Falling Stairs → 13 Saw Bridge (saws patrol over bridge, no time to wait) → 14 Spike Pit Hop (2-wide stones over spike pit) → 15 Core Collapse (all combined). `node tools/world2.js` regenerates `src/levels2.js`. Bot: min beam 25/400/400/400/400, clear times 9.4/11.5/12/16.3/15s; levels 12-15 need beam 400 (precise timing), harder than L1-4. Pars ≈1.5× bot.

## Structure
- `src/logic.js` pure physics/rules (also runs in node), `src/levels.js` generated from `tools/levels.py` (python, edit + `python3 tools/levels.py && python3 tools/emit.py`; paths inside assume /tmp/gh — adjust), `src/main.js` render/input/audio/UI, `bot.js`+`test.js` verification.
- Ad hooks: `window.GlitchAds.showRewarded(cb)` (skip level after 8 deaths), `showInterstitial()` (every 3rd clear).

## Roadmap
Playtest tuning, more levels (world 2-3), per-level ghost/leaderboards, store screenshots, native AdMob/haptics, skins unlocked with coins.

## Tutorial hints
One-time in-level tips (saved in `save.tips`, normal mode only) for jump, pads, wall jump, checkpoints and crumble blocks; see `HINTS` in `src/main.js`.

## Skins
5 skins unlocked by total best-coins (0/10/25/45/70); menu button cycles unlocked ones, toasts next lock.

## World 3: Phase (levels 16-20)
Blocks `a` (pink) and `b` (cyan) are solid on alternating 1.3s beats (a first; hard mode 1.1s). Outline = inactive, flickers 0.4s before switching off. Being inside a block when it turns solid = death. Levels: 16 Beat Intro → 17 Metronome (climbing/descending chain) → 18 Saw Switch (saws over chain) → 19 Crumble Sync (islands, crumble + phase) → 20 Phase Core (finale, wall-jump, saws not included; long chain). `node tools/world3.js` regenerates `src/levels3.js`.
Bot (`node test.js`): all 5 solved; min beam 50/50/50/200/50; clear 19.5/23.3/23.2/18.8/26.6s; pars ≈1.3x. Bot got a cell-diversity cap for phase levels (waiting states must survive beam pruning).

## Daily challenge
Menu button: level 6-20 picked by date hash, played in Glitch mode (no checkpoints, fast saws). Tracks `save.daily` {last,best,streak}; streak resets if a day is missed. Skip-ad disabled. Daily and Glitch clears never write normal level stars, coins, PBs, death records, or flawless totals. Glitch mode writes only separate fastest-time and lowest-death records.

## World 4: Remix (levels 21-25)
Mixed-mechanic hard levels (no new blocks): 21 Remix Intro (crumble→phase chain, saws) → 22 Pad Rhythm (pad islands launching to phase/crumble platforms, 3-wide hops) → 23 Saw Garden (wide saws over crumble/stone stepping) → 24 Vertigo (44-tall wall-jump shaft with phase/crumble ledges, endurance) → 25 Remix Core (24-platform finale, saws, 130 tiles). `node tools/world4.js` regenerates `src/levels4.js`.
Bot: all 5 solved; min beam 100/100/400/10/400; clear 17.9/16.5/14.7/49.7/28.3s. 23 and 25 need beam 400 (hardest in the game with L5/L9/L10); Vertigo is long but forgiving. Pars ≈1.3-1.4x bot (Vertigo 65s).

Update: Vertigo (24) now has two vertical saws (V) in the shaft; bot still solves at min beam 10 (clear 39.3s vs 49.7s before; saws add a timing constraint but the bot finds a faster line), par cut 65→50s. Human difficulty up, bot metric unchanged.

## World 5: Belts (levels 26-30)
Conveyor blocks `>` / `<` (green, animated arrows): solid, carry a grounded player at 55px/s (run is 95, so running against a belt nets 40px/s). Levels: 26 Belt Intro -> 27 Treadmill (alternating belts, varying heights) -> 28 Conveyor Saws -> 29 Belt Sync (belts + crumble + phase + saws) -> 30 Belt Core (23 platforms, saws, finale). `node tools/world5.js` regenerates `src/levels5.js`.
Bot: all 5 solved; min beam 200/200/200/100/50; clear 11.2/13/12.8/17/29.7s. Pars about 1.3x bot (Belt Core 40s). Difficulty rises via length and combined mechanics (L30 is longest, 5 coins, 6 saws). Full `node test.js` is slow (several minutes).

## World 6: Ice (levels 31-35)
Ice blocks `i` (pale blue): solid; on ice ground accel 260 (vs 1100) and friction 120 (vs 1300), so momentum carries and braking is slow. Levels: 31 Ice Intro -> 32 Slip Slide (short islands, hardest: bot needs beam 400, 28s) -> 33 Ice Saws -> 34 Frozen Sync (ice+belts+crumble+phase) -> 35 Ice Core (finale, 22 platforms, 6 saws). `node tools/world6.js` regenerates `src/levels6.js`.
Bot: all 5 solved; min beam 200/400/200/100/50; clear 13.2/28.2/15.1/19.4/26.7s. Pars 17/36/20/25/36.

## World 7: Wind (levels 36-40)
Non-solid wind zones: updraft `u` (green streaks) lifts the player (accel 3000, rise capped 150px/s, cancels variable-jump cut); downdraft `v` (pink) adds +450 downward accel. Levels: 36 Updraft -> 37 Thermals (ceiling spikes above columns) -> 38 Downdraft (alternating-height islands, gaps 2 tiles, downdraft above gaps) -> 39 Gale Mix (columns + ice/belts/saws/spikes) -> 40 Storm Core (10-stage chain, all hazards). `node tools/world7.js` regenerates `src/levels7.js`.
Bot (wind levels use an x-progress heuristic): all 5 solved; min beam 200/200/200/50/50; clear 13.4/13.9/14.8/12.8/21.7s. Pars 17/18/19/17/29. Honest note: wind worlds are bot-easier than Ice; human difficulty comes from timing columns, ceilings and saws.
Fixed: levels6.js previously registered as GH_LEVELS5 (overwrote world 5 in the browser); now GH_LEVELS6.

## World 8: Gauntlet (levels 41-45)
No new mechanic: tight island chains (gaps of 2 tiles, rise <=1, crumble islands never rise) mixing ice, belts, crumble, saws, ceiling spikes and wind columns. 41 Gauntlet Gate -> 42 Razor Rain (ceiling spikes) -> 43 Sky Climb (8 wind columns) -> 44 Time Knot (dense crumble/ice/belt/saws) -> 45 Final Glitch (17 islands, 5 coins). `node tools/world8.js` regenerates `src/levels8.js`.
Bot (now with `cap:1` per-cell diversity option, needed because plain greedy beam dead-ends on island chains): all 5 solved; min beam 100/25/100/400/400; clear 10.4/9.9/15.9/12.5/15.1s. Pars 14/14/21/17/21 (~1.4x bot). Honest note: levels are short; human difficulty comes from crumble timing and saw gaps.

## World 9: Elevators (levels 46-50)
Moving platforms, one-way (land from above, jump up through): `M` slides horizontally (amp 40px, period 4s), `N` moves vertically (amp 32px); hard mode period x0.8. Rider is carried; momentum is not inherited on jump. Levels: 46 Ferry -> 47 Lift Shaft (6 stacked lifts, saws) -> 48 Saw Ferry -> 49 Rail Mix (phase/crumble/belt islands) -> 50 Skyway (finale, 10 stages). `node tools/world9.js` regenerates `src/levels9.js`.
Bot: all 5 solved; min beam 50/25/100/200/200; clear 13.9/11.4/22.4/23.4/31.3s. Pars 19/16/30/32/42. Note: crumble islands between two movers can be unsolvable (mover phases are fixed per column), so finale uses solid/ice/phase islands there.

## World 10: Overdrive (levels 51-55)
No new mechanic: moving platforms (M/N) landing on ice, belts, crumble, phase and stone islands, with saws. 51 Overdrive Gate (ice landings) -> 52 Lift Relay (lifts+ferries, mixed islands) -> 53 Belt Ferry (belts against ferry direction) -> 54 Crumble Ferry -> 55 Overdrive Core (12-stage finale, 3 coins). `node tools/world10.js` regenerates `src/levels10.js`.
Bot: all 5 solved; min beam 200/200/200/100/200; clear 26.4/15.8/30.3/24.8/39.2s. Pars 34/21/40/32/51. Wind columns tried in 2 levels made them unsolvable and were dropped.

## Achievements
12 goals in `src/achievements.js` (pure, `GHAch.check(save,total)`): clears 1/10/25/all, 3-star 10/30, flawless 5/25, 50 coins, Glitch clear 1/10, 3-day daily streak. Checked on level win; toast on unlock; menu 🏆 panel. Late ones (30 three-stars, 25 flawless, 10 Glitch clears) reward mastery.

## World 11: Dash (levels 56-60)
New mechanic (levels flagged `dash:true`): air dash. Button » on touch, X / C / Shift on keyboard. Once per airtime (recharges on landing), 0.2s horizontal burst at 300px/s with gravity off, direction = held dir or facing; ends at run speed. Wide pit gaps (6-8 tiles, impossible with a jump alone; probe: gap 4 unreachable without dash) with saws mid-gap, ice/crumble/belt landings and ceiling spikes. 56 Dash Intro -> 57 Dash Sawmill -> 58 Dash Ice -> 59 Dash Climb -> 60 Dash Core (finale, 12 islands). `node tools/world11.js` regenerates `src/levels11.js`.
Bot (now with dash actions): all 5 solved; min beam 400/400/400/100/400; clear 8.3/9.3/10.2/8.7/29.3s. Pars 11/13/14/12/38. Note: phase islands between dash gaps were unsolvable for the bot and were dropped from the finale.

## World 12: Dash Remix (levels 61-65)
No new mechanic: harder dash levels (gaps 7-8 tiles, narrower landings). 61 Dash Gaps -> 62 Dash Rain (ceiling spikes, ice/crumble) -> 63 Dash Belts (belts both ways) -> 64 Dash Stairs (tall steps) -> 65 Dash Finale (14 islands, 3 coins). `node tools/world12.js` regenerates `src/levels12.js`.
Bot: all 5 solved, all need beam 400 (beam 100 fails on the finale); clear 31.6/23/21.6/8.1/36.4s. Pars 41/30/28/14/48. Beam 400 for every level makes this the hardest world by bot metric.

## Level select
Menu Continue button launches first uncleared normal level (or replays L1 after full clear), reducing repeat taps for progression. Grid grouped into 12 named worlds. Headers show stars earned/possible plus cleared/total counts; Glitch mode shows hard clears. Locked worlds dim. Grid scrolls (62vh) and auto-centers on first uncleared unlocked level. Each level button exposes clear, star, time, death, and lock status to screen readers. Normal runs with checkpoints show `⚑ CP reached/total` in live HUD; Glitch mode hides it because checkpoints are disabled.

## Mastery timing
Normal clears persist fastest completion time and lowest death count independently from stars, coins, and flawless status. Level select shows each normal best time plus best deaths; clear screen shows current and record deaths and marks new time/death records. This supports speed and deathless replay mastery even when a run collects fewer stars. Challenge curve remains bot-verified: World 12 requires beam width 400 on every level, with pars 1.3-1.5x bot clears.

Live mastery guidance: during each run, HUD prioritizes next missing star—coin collection first, then under-par pace. While the goal remains active, HUD shows exact seconds remaining to par; after elapsed time exceeds par, it explicitly marks the time star missed even if coins remain. This keeps optional mastery goals actionable without changing physics or level difficulty.

Post-clear replay guidance: normal clear screen shows the next concrete mastery target—remaining coins for star 2, par time for star 3, or MASTERED when all three stars are earned. Glitch and Daily clears omit this normal-star prompt because those modes keep separate records.

Live speedrun guidance: normal replays compare elapsed time against saved fastest clear. `PB in 0.6s` = 0.6 seconds left before elapsed time reaches saved best; `PB missed +0.6s` = already past it. First clears show `PB —`; Glitch and Daily modes keep separate scoring context.

Death coaching: physics emits stable hazard causes; UI maps each to short actionable advice through pure `GH.deathTip`. Coaching appears over existing in-level hint surface for 3.2 seconds after each death, without changing respawn timing or difficulty.

Glitch mode mastery: hard clears persist fastest time and lowest death count separately from normal records. HUD compares each run against Glitch PB; level select and clear screen show hard time/death records. Legacy boolean hard-clear saves remain readable and upgrade on next clear.

## Save recovery
`src/save.js` normalizes browser storage before renderer reads. Malformed root data, level maps, legacy boolean hard clears, daily streak/best values, skin indexes, counters, achievement flags, and tutorial flags fall back safely while valid records remain. This prevents corrupted localStorage from crashing menu, level select, daily labels, or player rendering.

Verification: `node test.js` covers malformed and valid-save fixtures, then all 65 levels. World 12 remains hardest by bot metric: beam 400 required for every level, with pars 1.3-1.5x bot clears.

## Art wiring & packaging
`src/art.js` loads the PNGs in `assets/` (tiles, hazards, spring, coin, checkpoint, portal, saw, 10 player frames, parallax bg-far/bg-mid). `main.js` draws them when decoded and falls back to the original shape visuals otherwise; player frame picked from sim state (idle/run/jump/fall/wall/death), skins applied via CSS canvas filters. Touch buttons use btn-*.png. `npm run build` -> `www/` (Capacitor webDir); listing in STORE.md, policy in privacy.html, `scripts/shots.sh` regenerates assets/store screenshots.

## Audio engine
`src/audio.js` (global `GHAudio`): master bus with compressor, feedback-delay send, noise-based SFX (jump/wall/land/pad/dash/coin run/die/checkpoint/win), pitch-jittered. Music is a look-ahead scheduled 128 BPM synthwave loop (kick/snare/hat, saw bass, square arp, pad, lead hook) that builds energy over 4 phrases and transposes per world. Silent in menu/hidden/muted. Offline check: `node tools/audio-test.js`.

## Ads adapter
`src/ads.js` (`GlitchAds`) only exists when native bridge `GlitchAdsNative` is defined: consent-gated, interstitial every 3rd clear with 2min gap, remove-ads flag. With bridge, Skip needs a rewarded ad; web build has no ads and skip stays earned (8 deaths on level). `node tools/ads-test.js`.

## Settings
Menu has three persisted toggles: Sound (all audio), Music (music only), Vibration (haptics). Save keys `mute`, `nomusic`, `novib`.
