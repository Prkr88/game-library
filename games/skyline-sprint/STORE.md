# Skyline Sprint - Store Listing

## Title / subtitle
Skyline Sprint - Neon Precision Runner (subtitle: Switch lanes. Jump. Slide. Survive.)

## Short description (80)
Neon auto-runner: read each gate, pick the lane, jump or slide on time.

## Long description
Race across a neon skyline where every gate demands the right lane and the right move. Six escalating stages, solid wall gates that force lane changes, a date-seeded Daily Run, and the brutal Summit Overdrive unlocked after six clears. Earn 0-3 medals per stage, chase flawless gates, collect shards, and unlock runner skins. Works offline. No accounts, no required purchases.

## Keywords
runner, neon, reflex, precision, arcade, skill, offline, one-thumb

## Category / rating
Games > Arcade. Target age rating 4+ / Everyone (no violence, no UGC, no purchases).

## Screenshots
Draft 1080x1920 captures in assets/store/ (shot-menu, shot-briefing, shot-howto, shot-run); replace with on-device shots of gate/recap/Overdrive before submission.
Shots wanted:
1. Menu with stage preview  2. Mid-run lane cue  3. Wall gate WALL-SWITCH cue
4. Clear recap with medals  5. Summit Overdrive. Feature graphic: assets/gen/store-feature.png. Icon: assets/gen/icon.png (1024).

## Privacy / data safety
- Collects no personal data; no analytics, no network calls at runtime.
- Saves progress (scores, medals, skins, sound setting) in local storage on device only.
- Rewarded revive is an optional native bridge (`SkylineAds.showRewarded`); hidden unless an ad SDK is wired. If one is added, update the disclosure (ad ID, ATT prompt on iOS).
- Privacy policy: this app stores data locally only and shares nothing with third parties. Publish this text at a URL before submission.

## Build steps
1. `npm install`  2. `npm run cap:add` (once)  3. `npm run cap:sync`  4. `npx cap open ios|android`, set signing, archive.
Device QA checklist: safe-area HUD on notch devices, auto-pause on app switch, audio unlock on first tap, touch buttons on 320px-wide screens.
