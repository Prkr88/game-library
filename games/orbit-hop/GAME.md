# Orbit Hop

## Pitch
A comet orbits a planet. Tap to fly off radially. Hit the next planet's orbit to be captured. Miss → lost in space.

## Story
You are a lost comet trying to get home across an endless galaxy. Each planet is a stepping stone; the sky shifts color the deeper you go.

## Controls
- Tap / click / Space: launch from the orbit outward along current direction.
- Skins menu: spend ★ collected from orbit stars.
- Icon-only controls expose screen-reader labels; keyboard focus stays visibly outlined for menu navigation.

## Mechanics
- Planets spin at varying speeds/directions; later ones slide horizontally.
- Skipping a planet gives bonus points; fast consecutive landings build combo (+1 each).
- Stars on orbits = soft currency (skins). Rewarded ad doubles a run's stars (stub).

## Architecture
- `src/logic.js` — pure deterministic logic (seeded RNG), Node-testable.
- `src/main.js` — canvas renderer, input, WebAudio SFX, localStorage save, UI.
- Plain scripts (no build) so `index.html` works from file:// and in Capacitor (`webDir: "."`).

## Roadmap
1. Tuning pass + icons/splash.
2. AdMob integration, interstitial every N runs.
3. Hazards (black holes, asteroids), shrinking planets, music.
4. Daily seed, missions, leaderboards (Game Center / Play Games).

## Hazards (session 2)
- Black holes (from planet 20): gravity bends flight within 110px; touching core = swallowed.
- Collapsing planets (from 18): red ring timer; leave before it empties.
- Daily mode: same seed for everyone per date, separate daily best.
- Ambient generated music; muted with sound toggle.

## Missions
`src/missions.js` (pure logic): 3 active missions from an ordered pool; progress per run or cumulative; coin reward paid at game over; Missions panel in menu.

After each run, game-over screen names closest active mission with current progress and reward. This gives immediate next-run target without changing scoring.

## Assets
`assets/`: icon.svg + PNGs (192/512/1024), splash.svg/png (2732). Use with @capacitor/assets.

## Continue (revive)
Game-over shows "CONTINUE (ad)" once per run. `OrbitLogic.revive` re-seats comet on safe orbit (next planet if collapsed, clears nearby black holes); banked rewards are rolled back from a snapshot. Test: `node test.js`.

## Asteroids
From planet 28, patrolling asteroids sweep the flight lane between planets; touching one mid-flight = death ("ASTEROID HIT"). Spawn chance 20%→50% by planet 60. `node test.js` aim-bot: 15 rock deaths across 40 seeds, rocks never before planet 28.

## Achievements
`src/achievements.js` (pure, tested in `node test.js`): 11 achievements (score, combo, stars, runs, daily). Checked at game over; star rewards paid with missions; unlock animation on game-over screen; 🏆 panel in menu. Revive rollback covers them (snapshot taken before update).

## Hard mode
Unlocks at best score 25. `createGame(seed, true)` offsets difficulty +30 planets (holes from planet ~0, rocks ~0, fast spins, big gaps). Separate `hardBest`. Aim-bot over 40 seeds: normal avg 68.5, hard avg 25.6 (`node test.js`).

## Flippers & close calls (2026-10-18)
- Flipper planets (planet 36+, ~15-35%): spin direction reverses every ~1.6-2.2s; gold arc flashes for the last 0.4s. Rewards timing over rote rhythm.
- Close call: grazing a black hole (<20px of edge) or asteroid (<14px) during a flight that lands = +1 score, 'CLOSE CALL' popup. Risk/reward for skilled players.
- Verified via test.js bot (flip reversal unit test, bot still bounded in hard mode).

## Laser gates
From planet 45 (Hard: 15) a beam crosses the flight lane, cycling on 50%/off (period 2.4s→1.8s). Flashes 0.45s before turning on. Crossing while on = death; orbiting is safe, so timing the launch is the skill. Sim: naive bot 5 gate deaths/30 seeds, gate-aware bot 1.

## Shield orb (2026-10-18)
Cyan ring pickup on every 9th planet from 14 (deterministic, no RNG draw). Grab by orbiting through it; holds one. Absorbs one black-hole/asteroid/laser hit (+1.2s invulnerability, flashing ring). Does not save from collapse or missing planets, so skill still gates the run. Bot over 40 seeds: 47 collected, 40 absorbed hits (`node test.js`).

## Daily streaks (2026-10-18)
Daily mode records one streak credit per calendar day. Consecutive completed daily runs increase the streak; missed days reset it. Same-day retries keep the streak unchanged. Menu and game-over HUD show current streak. Pure state tests cover first day, repeat, consecutive day, and gap reset.

## Run HUD (2026-10-18)
During play, HUD keeps mode context visible (`ORBIT`, `DAILY`, or `HARD`) and shows current planet plus shield state. This prevents mode confusion after retry and makes shield pickup/consumption readable without relying on comet effects alone.

## Combo HUD (2026-10-18)
Active landing chains now show `COMBO ×N` beside planet/shield status. Counter stays hidden below x2, keeping early runs quiet while making fast-hop mastery readable during play.

## Laser timing HUD (2026-10-18)
When the next landing has a laser gate, live status shows `LASER OFF — GO`, a sub-second `LASER IN` countdown, `LASER ON — WAIT`, or in-flight `GATE CLEAR`/`LASER ACTIVE`. This exposes timing state without changing gate behavior, helping players learn timing-based late-game skill.

## Launch guidance (2026-10-18)
While orbiting, HUD names immediate next planet and reports `AIM READY` when radial launch is within 0.16 radians of target direction; otherwise it reports angular alignment needed. Canvas adds dashed launch line and target ring, cyan when ready. Guidance is visual-only and does not widen timing or collision rules.

## Death recovery coaching (2026-10-18)
Game-over screen now pairs each known death cause with one actionable retry tip: wait for laser-off, watch asteroid timing, curve around black-hole cores, leave collapsing planets, or align with the next planet. This teaches hazard responses without changing difficulty or giving post-death safety advantages.

## Depth records (2026-10-18)
Save tracks lifetime runs and deepest landed planet. Menu shows exploration record; game-over shows current depth, record status, and retry target. Record uses landed planet index, so deaths during flight never overstate progress. Revive rollback also removes uncommitted records.

## Last-run recap (2026-10-18)
Save keeps latest run mode, score, reached planet, collected stars, best combo, close calls, and shields collected. Game-over exposes the run breakdown; menu keeps a compact `Last MODE score / planet` reminder. Recap is feedback-only and does not alter physics, scoring, or revive rollback.

## Mobile game-over panel (2026-10-18)
Long recaps stay inside a safe viewport-height scroll area, including safe-area padding and touch scrolling. Retry, Continue, and Menu remain reachable on short portrait screens even when missions and achievements add rows.

## Pause recap (2026-10-18)
Pause overlay reports exact mode, score, current planet, combo, shield state, next planet, and immediate generated hazards. Players can decide whether to resume or quit without losing run context, including on short portrait screens.

## Pause timing context (2026-10-18)
Pause recap now names current phase (`ORBIT — AIM` or `FLIGHT — HOLD COURSE`) and exposes immediate laser timing (`LASER ON`, `LASER OFF`, `LASER IN`, or `LASER CLEAR`). Gate status comes from pure logic shared with collision timing, so resume decisions stay informed without changing difficulty.

## Offline shell (2026-10-18)
HTTP(S) launches register a cache-first service worker for local HTML, CSS, JavaScript, manifest, and icon assets. Later launches can load without network after one successful online visit. `file://` opening remains supported because registration skips non-HTTP(S) protocols.

## Mode-scoped depth records (2026-10-18)
Exploration depth saves separately for Orbit, Hard, and Daily. Hard or Daily runs cannot overwrite normal-mode depth feedback. Existing saves migrate legacy deepest-planet value into Orbit depth; menu shows compact `Depth O/H/D` values and game-over names active mode record.

## Hazard preview HUD (2026-10-18)
While orbiting, status line previews hazards on immediate next segment: `BLACK HOLE`, `ASTEROID`, and/or `LASER`. Preview reads already-generated deterministic hazards; it does not change spawn, collision, shield, or timing rules. This keeps late-game threat recognition legible on small screens while preserving skill-gated launches.

## Flight phase HUD (2026-10-18)
The target HUD now switches from orbit alignment guidance to `FLIGHT TO N · HOLD COURSE` immediately after launch. Pure `phaseHint` logic exposes `ORBIT`, `FLIGHT`, and `OVER` states, keeping touch players informed during the short no-input flight window without inferring state from velocity or changing physics.

## Accessible HUD announcements (2026-10-18)
Visual HUD values remain frame-accurate, but screen readers now receive one separate polite announcement channel. It announces only semantic changes: planet, orbit/flight phase, shield state, laser state, immediate hazards, aim readiness, and combo changes. Continuous countdown decimals and rotating aim angles no longer spam assistive technology.

## Save recovery (2026-10-18)
`src/save.js` normalizes browser storage before menu or gameplay reads. Malformed root data, numeric counters, owned skins, daily streak fields, mission/achievement trackers, depth records, and last-run recap fields fall back to safe values; valid progress remains preserved. This prevents corrupted localStorage from breaking menu panels, reward updates, or run recap rendering.

## Difficulty verification
`node test.js` runs deterministic aim-bot checks across 40 seeds. Normal average score 80.9; Hard average score 24.35. Hard mode starts at +30 planet difficulty, so hazards and fast spins arrive immediately. Laser-aware bot records zero gate deaths across 30 seeds; naive bot records 8, preserving timing skill depth.

Mission-target UI verified with pure helper tests: completed goals excluded; closest active goal selected with stable tie order.
Phase HUD verified by pure tests for orbit, flight, and game-over transitions. Difficulty regression remains unchanged: normal average score 80.9; Hard average score 24.35 across 40 seeds.
Save recovery verified with malformed root and nested localStorage fixtures; `node test.js` also passes full hazard, laser, shield, and hard-mode difficulty checks.
Pause gate-state verification covers orbit-on, countdown, and in-flight-clear states; full bot regression remains green.
Offline shell verification covers registration guard, precache asset paths, same-origin GET handling, and direct-file fallback.

## Art pipeline
`art/gen.py` renders fallback PNGs to `assets/gen/`; `main.js` loads `assets/<name>.png` (owner) first, then `assets/gen/`, then falls back to drawn shapes.

## Audio
`src/audio.js`: master compressor + generated reverb; combo landings climb a pentatonic scale; music is a lookahead-scheduled arp/pad/bass/hat loop with intensity driven by score (tempo 97->69 ms/beat-ish scaling, extra layers above 0.15/0.3/0.5).

## Ads adapter (2026-10-18)
`src/ads.js` mirrors Merge Drop: bridge `window.OrbitAdsNative` (consent, interstitial, rewarded). Interstitial every 3rd run with 2-min gap, removable via flag. Rewarded Continue / 2x buttons shown only when native rewarded ad is ready; web grants nothing for free.

## Settings (2026-10-18)
Menu gear opens Music / Sound effects / Vibration toggles, stored in `orbithopSettings` localStorage; independent of the global mute button. `OrbitAudio.setChannels` gates SFX and music scheduling.
