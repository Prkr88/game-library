# Skyline Sprint

## Premise

Sprint across a neon city before sunrise. Three lanes carry a runner toward a rooftop finish. Read each gate, switch lanes, then jump pink barriers or slide under cyan drones. Clean gates and signal shards reward mastery.

## Controls

- Touch: `◀` / `▶` switch lanes; `JUMP` clears pink barriers; `SLIDE` clears cyan drones.
- Keyboard: Arrow keys or `A`/`D` switch lanes; `W`/`↑`/Space jump; `S`/`↓` slide; Escape pauses.
- Mobile: tap `PAUSE` in top HUD to pause without leaving touch controls.
- Backgrounding: switching apps or hiding the tab auto-pauses an active run; resume returns to exact current run state.
- HUD: current lane stays visible as LEFT/CENTER/RIGHT; pause recap preserves lane and upcoming gate action so mobile resume decisions stay informed.
- Daily: tap `DAILY RUN` to replay a date-seeded pattern rotation with a separate best score; daily clears do not unlock stages or change normal best.
- Stage replay: menu arrows select any unlocked stage, including earlier stages for medal, shard, and flawless-gate mastery; locked stages never become selectable.
- Stage preview: selected stage menu card shows exact target distance, gate spacing, route gate count, lane-change count, shard count, JUMP/SLIDE route, and remaining medal goals before starting; spacing pressure is compared with Rooftop.
- Onboarding: first normal-run launch opens a controls briefing covering lane choice, JUMP/SLIDE matching, HUD timing cues, shards, and medal goals. `HOW TO PLAY` remains available from menu; completion persists locally.
- Summit Overdrive: after all six normal stages clear, replay Summit with 12% higher movement speed, 0.06s tighter gate spacing, and a separate 12-gate authored route with repeated lane reversals. Overdrive has a separate best score and never writes normal medals, achievements, streaks, or unlocks.
- Player actions last 280ms. Gates require matching action while crossing the player line.

## Progression and difficulty

Six deterministic stages unlock in order. Each stage raises target distance and speed while shrinking gate spacing:

| Stage | Target | Speed | Gap | Intended pressure |
| --- | ---: | ---: | ---: | --- |
| Rooftop | 270m | 0.32 | 1.05s | learn lanes and two actions |
| Skybridge | 360m | 0.37 | 0.94s | faster read/reaction |
| Monorail | 470m | 0.42 | 0.84s | lane movement plus action |
| Stormline | 590m | 0.47 | 0.76s | sustained mixed gates |
| Night Shift | 730m | 0.52 | 0.68s | tight timing and lane changes |
| Summit | 970m | 0.58 | 0.59s | hardest reaction window |

Pattern design: each stage owns an eight-gate authored sequence instead of recycling one global loop. Rooftop teaches center-lane actions, Skybridge starts lane transitions, Monorail alternates outer lanes, Stormline mixes center/outer reversals, Night Shift chains offset lane changes, and Summit removes repeated safe-lane rhythms. Daily mode rotates each stage's authored sequence by its date seed. Overdrive replaces Summit's route with a 12-gate route that alternates lane reversals and action changes, so its tighter clock also demands route reading and movement planning.

Clean-gate feedback: successful jump/slide crossings show a short CLEAN JUMP or CLEAN SLIDE cue, emit a small local particle burst, announce the result once through the live region, and request a brief optional device vibration when supported. Feedback expires quickly and does not alter collision timing or scoring.

Upcoming-gate guidance: HUD scans nearest gate across all lanes and shows NEXT/NOW plus LEFT/CENTER/RIGHT, required action, and shard marker. Current lane stays visible after every lane move, and pause recap repeats lane plus upcoming action. Live region announces only cue identity, urgency, or lane changes, so players get guidance without per-frame screen-reader noise.

Stage mastery: each normal stage stores its best medal count (0–3). Clearing earns medal 1; collecting at least two signal shards in that run earns medal 2; clearing every encountered gate cleanly, with at least eight gates, earns medal 3. Daily runs never write medals. Menu and clear recap expose current medal progress, giving skilled players a repeat target after unlocking stages.

Achievement mastery: six local goals persist across runs: first normal clear, Summit clear, a two-shard normal clear, a flawless normal clear, eight clean gates in one run, and a Daily clear. Newly earned goals appear in the clear recap and menu. Daily clears never alter normal medals or stage unlocks.

Runner cosmetics: the default NEON runner is always available. Clearing 2, 4, and 6 normal stages unlocks AQUA, SUNSET, and GOLD; clearing Summit Overdrive unlocks VOID. The menu skin button cycles only owned skins, persists selection, and applies a local hue treatment to runner PNGs without changing hitboxes or difficulty. Corrupt or stale skin saves fall back to NEON.

Monetization hook: after a failed run, native shells may expose `window.SkylineAds.showRewarded('skyline-revive')` returning a Promise<boolean>. A rewarded result grants one continue for that run, clears nearby gates, resets action timing, and resumes from current distance. The button remains hidden when bridge is absent; no web network dependency or progression isolation change.

Clean streak mastery: each run shows consecutive clean gate count in HUD and pause recap. Normal runs persist best streak; failed gate resets current streak. Clear and failure recaps expose run streak, giving skilled players precision target beyond distance and medals. Daily runs show streak but do not write normal best streak.

Audio: local WebAudio provides short action, clean-gate, failure, and clear cues. Sound is enabled by default, unlocks only after a user gesture, persists through the normalized local save, and can be toggled from the menu. No external audio assets or runtime network dependency.

Art: local generated PNG pack uses one neon pixel-art palette: four-frame runner sheet, jump barrier and drone hazard sheet, perspective lane floor, shard coin, clean-gate FX, four touch-button icons, 1024px app icon, splash screen, store feature banner, and six stage-specific skyline backdrops. Runtime prefers owner-supplied `assets/bg-stage-N.png`, `runner-1..4.png`, `runner-jump.png`, `runner-slide.png`, `barrier.png`, `drone-1..2.png`, `lane-floor.png`, `coin.png`, `fx-clean.png`, and `btn-*.png`; generated PNG files in `assets/gen/` remain 1:1 fallbacks. Owner sprites preserve source aspect ratio with bottom anchoring, so expected 96×128 runner and 128×96 hazard art does not stretch into square sprites. Runner, hazard, floor, shard, FX, and touch PNGs are primary visuals; geometric silhouettes render only while images are unavailable. Backdrops drift subtly behind lane geometry for motion depth. `art/generate_art.py` regenerates all local art.

Session safety: `visibilitychange` pauses active runs before mobile app switching can interrupt input. Resume resets frame timing, preventing hidden time from advancing physics or consuming a gate. Save writes are fail-safe: restricted, unavailable, or full `localStorage` cannot crash menu actions or progression; the current session remains playable without persistence. Keyboard controls normalize letter case and suppress browser scrolling/default actions for recognized game keys.

Difficulty verification: stage 1 gate spacing is 1.05s at speed 0.32; stage 6 is 0.59s at speed 0.58. Relative reaction budget falls from 1.00 to 0.56 while target distance rises 89%, so later stages require faster, more accurate decisions. Authored sequences add lane-transition pressure without changing collision timing; deterministic patterns make regression simulation straightforward. Medal 3 and FLAWLESS GATE require error-free execution across at least eight gates, while SUMMIT REACHED requires clearing the hardest 170m stage, so late-stage mastery remains skill-gated beyond basic clear.

Overdrive verification: Summit normal uses 0.58 speed and 0.59s gate spacing; Overdrive uses 0.6496 effective speed and 0.49s spacing. This raises travel pressure 12%, reduces the gate interval by about 17%, and expands the route from eight authored gates to 12 with 11 lane/action transitions. Separate scoring keeps challenge replay meaningful without inflating normal progression.

## Daily challenge

Daily runs use UTC date seed. Seed rotates hazard pattern order and lane offsets, then shrinks gate spacing by 0.07 seconds. Current stage remains selected, so challenge scales with unlocked progression. Daily best resets for each date; normal progression and best remain isolated.

Difficulty verification: at stage 1 daily spacing is 0.98s versus 1.05s normal; at stage 6 it is 0.52s versus 0.59s. Combined with stage 6 speed 0.58 and 170m target, daily Summit requires faster reaction and sustained error-free execution.

## Technical shape

Plain ES module and Canvas renderer. Core run state, stage data, deterministic pattern generation, progression, and input handling live in `game.js`; renderer and platform shell remain browser-facing. Selector helper accepts CSS selectors and bare DOM ids, keeping existing control bindings safe during startup. `test.js` checks every bound control id plus touch delegation. `localStorage` stores normalized best distance, cleared stage count, medals, sound setting, tutorial completion, and best clean streak. Direct `index.html` opening works; service worker registers only over HTTP(S).

## Roadmap

1. Human tune controls, gate readability, and short-screen layout.
2. Add more authored pattern families and tune generated audio on device.
3. Tune rewarded revive placement and wire native `SkylineAds.showRewarded` bridge.
4. Replace generated fallback art with owner-supplied sprites where available, then run device/store QA.

## Difficulty update (claude, 2026-10-18)
Each gate now spawns hazards across lanes (stage 1: 2 lanes, one free; stages 2-6, daily, overdrive: all 3 lanes, adjacent lanes demand the opposite action). Idle lane-dodging bot (never jumps/slides) now fails at the first gate from stage 2; reading lane + action is mandatory. Shard stays in the chosen route lane.

## Wall gates (claude, 2026-10-18)
From stage 3 (plus Daily and Overdrive) every third gate replaces one lane's hazard with a solid WALL that no jump/slide can pass. Exactly one wall per gate, so two lanes stay open but the player must switch lanes early, adding lane-planning to timing. Stages 1-2 teach jump/slide only. Wall in own lane shows `WALL - SWITCH` in the HUD cue. Verified: a bot that never changes lanes now dies at the first wall gate in its lane; a lane+action-aware bot survives (always one wall-free lane, 1.2 dist notice ≈ 1.8-3.7s).

## Music (claude, 2026-10-18)
Procedural look-ahead WebAudio loop driven from the frame loop: sine bass, saw arp on a 16-step minor figure, square/triangle layers add at stage 2+/4+. Tempo 104 + 8*stage BPM (Overdrive 152). Plays only while state=play and SOUND is on.

## Store packaging (claude, 2026-10-18)
`package.json` declares Capacitor 6 deps; `npm run build` copies only shippable files into `www/` (capacitor `webDir`), so tests, art sources and docs are not bundled. `STORE.md` holds listing copy, rating, privacy/data-safety text, screenshot plan and device QA checklist. `test.js` verifies the build output. Native projects still need `npm run cap:add` on a machine with Xcode/Android Studio.

## Runtime smoke (claude, 2026-10-18)
`node smoke.js` loads game.js on a stub DOM and plays normal, Daily and Overdrive runs with scripted input until failure; any thrown error fails the test. A non-reacting bot dies in ~2-5s in every mode, confirming gates cannot be passed idle.

## Stage length (2026-10-18)
Stages were ~10s each; now ~30/35/40/45/50/60s (target / (speed*28)), total ~4.3 min. From stage 2 on, daily and overdrive, lanes rotate by +1 each route cycle so the 8/12-gate authored loop does not repeat identically. Difficulty curve unchanged per-second; endurance and consistency now matter (medal 3 needs a flawless longer run).

## Runner art
Fallback runner sheet generated by art/runner.py (6x128px: run x4, jump, slide).

## Bot-verified difficulty (claude, 2026-10-18)
`node bot.js` (in `npm test`) plays every stage with a latency bot that respects the lane lock (a lane holding an unresolved gate cannot be entered until it passes the hit window). Perfect play clears all stages and Overdrive; an idle bot fails all. Max reaction slack (time the player may wait after the previous gate leaves its hit window before switching lane/acting): stage 1 0.45s, 2 0.40s, 3 0.35s, 4 0.30s, 5 0.25s, 6 0.20s, Overdrive 0.10s. Monotone decrease is asserted. Overdrive spacing eased from -0.10s to -0.06s because 0.05s slack was beyond human reaction.

## SFX juice (claude, 2026-10-18)
Clean-gate cue pitch climbs one semitone per streak step (cap 8); shard pickups add a high two-note chime.

## Perfect timing (claude, 2026-10-18)
Action pressed <=0.10s before gate crossing (actionTime>0.18 of 0.28) counts PERFECT: label + recap count. Cosmetic mastery signal; physics and bot slack unchanged.

## Stage intro banner (claude, 2026-10-18)
Canvas banner for first 2.6s of each run names the stage's new mechanic (stage 3: SOLID WALLS). Cosmetic; no physics change.

## Alpha fix (claude, 2026-10-18)
`magick` SVG render dropped alpha (opaque white corners) for btn-*, coin, fx-clean. art/generate_art.py now uses rsvg-convert for all SVG->PNG. Touch buttons: icon `auto 62%` background, label at bottom, 4.4rem tall.

## Stages 7-8: Neon Core, Zenith (claude, 2026-10-18)
Campaign now 8 stages (medals /24, clear save cap 8; old saves load fine, Overdrive still unlocks at 6 cleared). Neon Core (1150m, speed .60, gap .60, 10-gate route) and Zenith (1350m, speed .62, gap .57, 12-gate route) reuse the Summit background. `bot.js` now covers 8 stages: max reaction slack 0.45/0.40/0.35/0.30/0.25/0.20/0.15/0.10s, strictly decreasing; perfect play clears all, idle fails all.
