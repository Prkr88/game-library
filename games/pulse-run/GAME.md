# Pulse Run

## Pitch
Short neon auto-runner stages. Player reads silhouette hazards, jumps gaps and low barriers, slides under high barriers, and collects pulse cores for three-star mastery.

## Story
Pulse Runner carries a failing reactor signal through six districts. Each district adds speed and tighter hazard cadence. Reach Core to restart the city grid.

## Controls
- Touch: `▲` jump, `▼` slide, `Ⅱ` pause.
- Touch buttons remain reachable during HUD overlay; slide releases on pointer cancel/leave so interrupted touches cannot leave runner stuck crouching.
- Keyboard: `Space`/`ArrowUp` jump, `ArrowDown` slide.
- Keyboard: `P`/`Escape` pause or resume. Reaching 50% unlocks checkpoint retry after death.
- Jump input has a 120 ms buffer and 100 ms coyote window, so touch timing stays forgiving while hazard spacing and jump velocity remain unchanged.
- Jump height is variable: hold ▲/Space for full height, release during ascent for a short hop. Pointer cancel/leave and keyboard release clear held state, preventing stuck full jumps.
- Auto-run removes steering friction; mastery is timing and route memory.
- Every run shows elapsed time. Stage clear stores fastest time locally, compares each clear against prior PB, shows a generated par target, and lists PB beside each stage.
- Stage select gates unreached content: cleared stages remain replayable, next stage stays available, later stages show locked state until progression reaches them.
- Cleared-stage progression persists in `pulseBest`, so reloads retain unlocked stages and Continue targets.
- Stage clear recap names next mastery goal: missing cores, exact time needed to hit par, PB gap, and next-stage par; final clear points back to 3-star mastery.
- Stage select highlights first unfinished mastery target: remaining cores plus PB/PAR target, keeping replay choice actionable.
- Live HUD announces next required action (`NEXT JUMP`, `NEXT SLIDE`, or `NEXT CORE`) with remaining distance, helping players plan without changing hazard timing.
- Live HUD adds urgency bands: `FAR`, `READY`, and `NOW` based on exact action distance, so players can shift from route planning to input timing without changing hazard timing.
- Live HUD adds thin visual stage-progress meter with accessible `progressbar` state, synchronized to exact player distance; it stays readable when numeric progress is hard to scan during fast play.
- Live HUD compares elapsed run time against saved stage PB, showing `AHEAD`, `BEHIND`, or `PB PACE`; no-PB runs show `PB --`.
- Screen-reader HUD announcements are change-only: exact hazard distance and PB pace remain visual updates, while polite audio announcements fire only when action/urgency or pace state changes.
- Successfully clearing gaps and barriers gives short `CLEAN JUMP` or `CLEAN SLIDE` feedback with a pink particle burst, local tone, and light haptic; failed clears never fire because collision resolves first.
- `NEXT CORE` targets nearest uncollected pulse core; exact player distance drives cue timing, avoiding rounded-progress drift.
- Pulse cores require airborne vertical contact near core height; grounded overlap and low short hops miss, making every star require a deliberate jump.
- Death recap gives cause-specific retry coaching: jump timing for gaps/low barriers, slide timing for high barriers, and a fallback cue reminder.
- Jump, core, death, and stage-clear events use shared local SFX plus native Capacitor haptics when available; browser fallback uses WebAudio and `navigator.vibrate`, both optional and failure-safe.
- Jump launches and core pickups emit short-lived local canvas particle bursts; no external assets or network load.
- First run shows a short control recipe for jump, slide, and held jump height; first jump/slide input dismisses it and local storage prevents repeat prompts.
- Pausing or leaving the browser saves an in-progress run locally. Menu offers stage, distance, timer, and one-tap resume; completed, failed, retried, or abandoned runs clear stale resume data.
- Pause overlay repeats exact stage, progress, elapsed time, collected cores, checkpoint readiness, and saved state, so mobile resume decisions need no guesswork.
- Pause only exposes `RETRY CHECKPOINT` after 50% checkpoint unlock; before that, pause offers resume or menu without a misleading reset action.
- Switching tabs or backgrounding the app auto-pauses active runs before saving, preventing mobile app-switch time from consuming a run; return uses the existing RESUME flow.
- Choosing MENU from pause explicitly abandons run and clears saved resume state; browser exit still preserves it.
- Local progression arrays parse defensively; malformed or non-array browser storage falls back to empty saves instead of blocking game boot or HUD updates.
- Stage-select mastery summary and PB pace HUD share one top-level `readArray` helper; this prevents out-of-scope save reads from throwing `ReferenceError` after boot.
- Resume saves parse defensively; invalid stage, position, timer, checkpoint, and collection fields are rejected or normalized, so corrupted browser state falls back to a fresh run instead of crashing menu/resume.
- Valid saved runs restore correctly on RESUME; normalized vertical position is preserved instead of being lost to a parser exception.
- Narrow portrait HUD reflows stage, progress, next-action, PB pace, and pause controls into two readable rows; touch controls show explicit JUMP/SLIDE labels while retaining accessible labels.
- Stage select, pause, and result panels use safe-area padding and touch scrolling, keeping stage buttons and retry/menu actions reachable on short portrait screens.
- HTTP(S) launches register a local cache-first service worker for offline relaunch; direct `file:` opening skips registration and remains supported.
- Local PNG art now drives runtime visuals: six district backdrops, runner poses, ground tile, gap edge, low/high barriers, and pulse cores load from owner paths first (`assets/<file>`) with generated PNG fallbacks in `assets/gen/`; missing images retain geometric fallback.
- `art/generate_assets.py` regenerates the complete fallback pack from compact SVG primitives, including runner poses, hazards, controls, checkpoint, reactor, icon, splash, and store feature art.
- Grounded movement cycles through six local runner PNG frames at 12.5 fps; jump, fall, and slide poses still override run cycle. `node test.js` covers shared save scope, malformed arrays, progression gates, resume wiring, and frame selection.

## Difficulty verification
Stage speeds rise 260, 285, 310, 335, 360, 390 px/s. Hazard spacing tightens from 280–320 px in Spark to 160–190 px in Core. Early stages teach one hazard at a time; late stages interleave gaps, low barriers, and high barriers. Three pulse cores create optional risk/reward. A 50% checkpoint cuts late-stage retry cost without changing hazard timing. Generated par targets fall from 11.8s in Spark to 7.6s in Core while hazards accelerate, so speedrun mastery demands cleaner timing in late content. Variable jump height adds execution depth: full jumps reach about 124 px, short hops about 21 px, letting skilled players reduce airtime on tighter routes. Core routes now add vertical timing pressure: grounded runs earn zero cores, short hops stay below core height, and full jumps must overlap each target. `src/logic.js` contains pure collision, core-contact, progress, checkpoint, par-time, and PB-feedback helpers used by runtime.

## Roadmap
1. Human tune jump arc, slide hitbox, checkpoint placement, hazard spacing, next-hazard cue, death-tip readability, onboarding prompt, and locked-stage wording.
2. Add richer audiovisual feedback and native ad hooks.
3. Human test offline relaunch after first online load, plus resume and stage-clear recap wording on browser refresh and small portrait screens.

## Difficulty (stages 1-10)
Stages 7-10 (Ghost Wire, Static Storm, Zero Hour, Singularity) raise speed to 420-530 and cut min hazard gap to 0.25-0.30s with dense jump/slide alternation. `node scripts/bot.js` runs an exhaustive search over real physics (gravity 1500, jump -610, short hop -250): every stage CLEARABLE, difficulty index rises monotonically 10.1 -> 48.5 (hazards/sec 0.60 -> 2.93, min gap 1.08s -> 0.25s). Backdrops cycle districts 1-6.

## Cores / stars
Every stage 1-6 has exactly 3 cores (3 stars). Most sit at a low/gap hazard's x, so only an apex-timed jump collects them: mastery requires precise jump timing, not just survival.

## Difficulty (stages 11-14)
Overclock, Meltdown, Event Horizon, Pulse Zero: speed 565-690, min hazard gap 0.24-0.21s, 3.1-3.6 hazards/s. `scripts/gen_stages.js` seeds layouts and keeps only bot-clearable ones; `node scripts/bot.js` shows difficulty 49.4 -> 59.6, monotonic after stage 10 (48.5). Backdrops keep cycling districts 1-6.
- App icons/Capacitor resources: icons/, resources/ (art/make_icons.py)

## Endless mode
Unlocks after clearing stage 3. Hazards generated lazily (logic.js `endlessExtend`); speed 300→620 over 40k px, gap 0.62s→0.30s (+0–0.1s jitter), core every 6 hazards (+25 pts), 1 pt/10px. Difficulty check: `node scripts/endless_check.js` bot-solves 72 sampled slices (6 difficulty points × 12 seeds), all clearable; final tightness (620 speed, 0.3s gap) is harder than stage 10 (530, ~0.25s mixed) in speed.
