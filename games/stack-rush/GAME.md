# Stack Rush
One-tap stacker. A block slides over the tower; tap to drop. Overhang is cut off; a drop within tolerance is PERFECT (no cut, 3+ combo regrows width). Miss entirely = game over.
Controls: tap / click / Space. Logic in `src/logic.js` (pure, tested via `node test.js`), rendering/audio in `src/main.js`.
Browser progression saves pass through pure field normalization before menu, theme, achievement, daily, and run-record reads. Malformed roots, arrays, numeric counters, booleans, strings, and theme indexes recover to safe defaults without blocking boot.
Mobile panels use safe-area padding and touch scrolling, keeping menu, continue, pause, and game-over actions reachable on short portrait screens.
Canvas exposes a concise board description for screen readers, all buttons show visible keyboard focus, and short portrait HUD media rules compress status rows without changing gameplay timing.
Keyboard focus follows active surface: menu actions, gameplay canvas, pause resume, continue offer, and game-over retry. Hidden overlay controls do not retain focus.
Live timing cue announcements are change-only: the `aria-live` cue does not rewrite every animation frame, preventing repeated screen-reader spam while preserving every perfect/trim/miss transition.
Pause recap shows exact mode, drops, PB chase, next mastery goal, perfect rate, current streak, and combo before resume or menu choice.
Web-served builds register a local cache-first service worker for offline relaunch; direct `file://` opening remains supported because browser service workers require HTTP(S).
Roadmap: icon, tutorial, themes, coins, rewarded continue, ads, daily challenge.

## Difficulty
Speed 0.9+0.04*score, extra +0.025/pt after 40, cap 4.2. Perfect window 0.025 shrinks to 0.012 at score 60+. `node sim.js` bot (timing noise 10/20/40ms): avg score 80/49/27 — late game demands precision.

## Hard mode
Menu toggle. Start width 0.6, no combo regrow, speed x1.25+0.3 (cap 5.2), perfect window x0.7, separate best. Sim (`node sim.js`) HARD avg 42/23/12 vs classic 80/49/27.

## Daily Challenge
Menu button "⚡ Daily: <name>". Day-number rotates 5 modifier sets (Sprint, Needle, Slim Tower, Blitz, Razor: speed x, perfect window x, start width; no regrow). Reach 10 once per day for coins (40+10*streak, cap 150) and streak. Separate daily best. Sim (`node sim.js`, sigma 10/20/40ms) avg: Sprint 62/38/21, Needle 68/43/25, Slim 54/30/16, Blitz 50/29/16, Razor 49/29/16 vs classic 80/49/27.

## Surge (late-game)
`warp(score,hard)` = min(0.25,(score-25)*0.01) (hard: from 15). Phase warped by sin so block speed varies ~0.2x–1.8x inside a sweep; positions stay in range (tested). Sim classic avg 62/44/27 (was 80/49/27), hard 35/22/12 (was 42/23/12): skilled players hit the wall earlier.

## Surge (late-game)
`warp(score,hard)` = min(0.25,(score-25)*0.01) (hard: from 15). Phase warped by sin so block speed varies inside a sweep; positions stay in range (tested). Sim classic avg 62/44/27 (was 80/49/27), hard 35/22/12 (was 42/23/12).

## Achievements
12 total (toast + coins). Mastery goals: Combo x20, Score 150, Hard 15/30/50 (hard mode only), Daily 25 (daily challenge only).

## Mastery stats
Menu stores lifetime runs, successful drops, perfect drops, and best combo. Game-over summary shows current mode, perfects, and run-best combo, reinforcing precision practice across Classic, Hard, and Daily.

## Run HUD
Live mode label and combo counter stay above playfield. Combo clears immediately after a non-perfect trim, making precision state readable without changing timing or physics.

Moving block shows a gold landing band centered on tower top. Band uses same perfect tolerance as logic and narrows with score, Hard mode, and Daily modifiers; players can learn timing visually without changing challenge.

Live timing cue mirrors band state: `TAP PERFECT` inside exact tolerance, `TAP TO LAND` when drop still overlaps, and directional `MOVE LEFT`/`MOVE RIGHT` before a miss. Pure `timingCue` helper is covered by `node test.js`; cue changes guidance only, not physics.

Post-drop feedback persists exact outcome in the HUD and assistive announcement: `PERFECT · FULL WIDTH`, retained-width grade plus percentage (`CLOSE`, `CLEAN`, or `RISKY`), or `MISS · ALIGN NEXT DROP`. Pure `dropFeedback` keeps wording tied to drop results and is covered by `node test.js`.

Personal-best chase label shows current mode record and drops-to-beat during runs; turns gold on a new record. Daily and Hard use separate records.

## Trim feedback
Non-perfect drops show pure width-retention grades: CLOSE (90%+ retained), CLEAN (70-89%), or RISKY (<70%). Feedback teaches precision without changing score, combo, speed, or difficulty.

## Mastery goal chase

Gameplay HUD shows next score target: Classic 25/50/100/150, Hard 15/30/50, Daily 10/25. Game-over repeats remaining drops, or confirms mastery ladder complete. `nextTarget` is pure and covered by `node test.js`.

HUD also shows a compact progress bar for current mastery rung. `goalProgress` keeps bar math aligned with mode-specific targets and exposes accessible percent text; covered by `node test.js`.

## Return-loop feedback

Last completed run persists locally with mode, drops, perfect count, and best combo. Menu shows this result plus remaining drops to beat that mode's record, or confirms an active personal-best chase. This gives immediate retry context after Classic, Hard, and Daily runs without changing scoring.

## Precision feedback

Live HUD shows perfect-drop rate during each run. Game-over and menu last-run summaries repeat rate beside perfect count, giving players clear precision progress across modes. `precisionPercent` is pure and covered by `node test.js`.

## Perfect streak mastery

Live HUD shows current uninterrupted perfect streak. Game-over and menu summaries show run-best streak; lifetime stats keep all-time best. `longestPerfectStreak` is pure and covered by `node test.js`, giving precision players a second mastery target beyond score and combo.

## Continue decision feedback

Rewarded continue panel shows exact distance to current mode PB and next mastery goal before ad opt-in. `continueContext` keeps distance math pure and tested; revive behavior, scoring, and reward amounts stay unchanged.

## Record feedback

Game-over and menu last-run recap preserve pre-update PB context: NEW BEST +margin, PB TIED, or exact drops to beat. `recordContext` is pure and tested, preventing a newly written PB from being misreported as an active chase.

Daily PB feedback resets before first run of each calendar day. `scopedBest` prevents yesterday's Daily score from appearing as today's chase target while preserving same-day retries.
- Stack Rush uses owner PNGs (block-N, base, shard, fx-perfect, bg-theme-N, ui-*) via runtime loader; shapes remain fallback.
