// Pure game logic (no DOM). Works in browser (global StackLogic) and node.
(function (root) {
  var PERFECT_TOL = 0.025; // fraction of base width
  var START_W = 1; // normalized width
  var HARD_W = 0.6; // hard mode: narrower tower, no regrow, faster, tighter perfect window
  // Daily challenge modifiers, deterministic from a day number: {n, sp (speed x), tl (perfect window x), w (start width)}
  var DAILY = [
    { n: 'Sprint', sp: 1.3, tl: 1, w: 1 },
    { n: 'Needle', sp: 1, tl: 0.6, w: 1 },
    { n: 'Slim Tower', sp: 1.1, tl: 1, w: 0.55 },
    { n: 'Blitz', sp: 1.45, tl: 0.8, w: 0.8 },
    { n: 'Razor', sp: 1.2, tl: 0.5, w: 0.7 }
  ];
  function dailyMods(day) { return DAILY[((day % DAILY.length) + DAILY.length) % DAILY.length]; }
  function nonNegativeInt(value, fallback) {
    value = Number(value);
    return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;
  }
  // Browser saves are user-editable storage. Normalize every field before UI or gameplay reads it.
  function normalizeSave(raw) {
    raw = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    var owned = Array.isArray(raw.owned) ? raw.owned.map(function (v) { return nonNegativeInt(v, -1); }).filter(function (v) { return v >= 0 && v < 5; }) : [0];
    if (owned.indexOf(0) < 0) owned.unshift(0);
    owned = owned.filter(function (v, i, a) { return a.indexOf(v) === i; });
    var ach = Array.isArray(raw.ach) ? raw.ach.filter(function (v) { return typeof v === 'string' && v.length <= 32; }) : [];
    return {
      best: nonNegativeInt(raw.best, 0), mute: raw.mute === true, coins: nonNegativeInt(raw.coins, 0),
      theme: Math.min(4, nonNegativeInt(raw.theme, 0)), owned: owned, seen: raw.seen === true,
      lastDaily: typeof raw.lastDaily === 'string' ? raw.lastDaily.slice(0, 32) : '', streak: nonNegativeInt(raw.streak, 0),
      daily: nonNegativeInt(raw.daily, 0), dbl: nonNegativeInt(raw.dbl, 0), ach: ach,
      hard: raw.hard === true, bestHard: nonNegativeInt(raw.bestHard, 0), dcDay: typeof raw.dcDay === 'string' ? raw.dcDay.slice(0, 32) : '',
      dcBest: nonNegativeInt(raw.dcBest, 0), dcDone: typeof raw.dcDone === 'string' ? raw.dcDone.slice(0, 32) : '',
      dcStreak: nonNegativeInt(raw.dcStreak, 0), dcLast: typeof raw.dcLast === 'string' ? raw.dcLast.slice(0, 32) : '',
      runs: nonNegativeInt(raw.runs, 0), drops: nonNegativeInt(raw.drops, 0), perfects: nonNegativeInt(raw.perfects, 0),
      bestCombo: nonNegativeInt(raw.bestCombo, 0), bestPerfectStreak: nonNegativeInt(raw.bestPerfectStreak, 0),
      lastScore: nonNegativeInt(raw.lastScore, 0), lastMode: typeof raw.lastMode === 'string' ? raw.lastMode.slice(0, 16) : '',
      lastPerfects: nonNegativeInt(raw.lastPerfects, 0), lastCombo: nonNegativeInt(raw.lastCombo, 0),
      lastPerfectStreak: nonNegativeInt(raw.lastPerfectStreak, 0),
      lastRecordState: typeof raw.lastRecordState === 'string' ? raw.lastRecordState.slice(0, 16) : '',
      lastRecordMargin: nonNegativeInt(raw.lastRecordMargin, 0), lastRecordGap: nonNegativeInt(raw.lastRecordGap, 0)
    };
  }
  function create(seed, hard, mods) {
    return { blocks: [{ x: 0, w: mods ? mods.w : hard ? HARD_W : START_W }], score: 0, combo: 0, over: false, rng: seed || 1, hard: !!hard, mods: mods || null };
  }
  // Moving block position in [-range, range] by time (triangle wave); speed grows with score.
  function speed(score, hard, mods) { var v = Math.min(4.2, 0.9 + score * 0.04 + Math.max(0, score - 40) * 0.025); v = hard ? Math.min(5.2, v * 1.25 + 0.3) : v; return mods ? v * mods.sp : v; }
  // Perfect window shrinks with score (0.025 -> 0.012 at score 60+).
  function tol(score, hard, mods) { var t = Math.max(0.012, PERFECT_TOL - score * 0.0002); t = hard ? t * 0.7 : t; return mods ? t * mods.tl : t; }
  // Normalized landing band centered on tower top. Renderer uses this to teach exact timing.
  function perfectZone(center, width, score, hard, mods) {
    var half = Math.min(width / 2, tol(score, hard, mods));
    return { left: center - half, right: center + half, width: half * 2 };
  }
  // Live timing cue: same band as renderer, plus safe overlap guidance for onboarding.
  function timingCue(x, center, width, score, hard, mods) {
    var zone = perfectZone(center, width, score, hard, mods), d = Math.abs(x - center);
    if (d <= zone.width / 2) return { state: 'perfect', label: 'TAP PERFECT' };
    if (d < width) return { state: 'trim', label: 'TAP TO LAND' };
    return { state: 'miss', label: x > center ? 'MOVE LEFT' : 'MOVE RIGHT' };
  }
  // Surge: from score 25 (15 in hard) the block speeds up/slows down within each sweep, so timing can't be rhythm-learned. Amp <= 0.25 keeps motion monotonic per half-sweep.
  function warp(score, hard) { return Math.min(0.25, Math.max(0, score - (hard ? 15 : 25)) * 0.01); }
  function posAt(t, score, hard, mods) {
    var range = 0.9, p = (t * speed(score, hard, mods)) % 4;
    p = (p + warp(score, hard) * Math.sin(Math.PI * p) + 4) % 4;
    var v = p < 2 ? p - 1 : 3 - p; // -1..1
    return v * range;
  }
  // Grade retained width after a non-perfect drop. Pure helper keeps feedback aligned with physics.
  function trimGrade(retained, previous) {
    var ratio = previous > 0 ? retained / previous : 0;
    return ratio >= 0.9 ? 'CLOSE' : ratio >= 0.7 ? 'CLEAN' : 'RISKY';
  }
  // Stable post-drop result for HUD and assistive output. Pure helper keeps wording aligned with physics.
  function dropFeedback(result, previous) {
    if (!result || result.type === 'none') return { state: '', label: '' };
    if (result.type === 'miss') return { state: 'miss', label: 'MISS · ALIGN NEXT DROP' };
    if (result.type === 'perfect') return { state: 'perfect', label: 'PERFECT · FULL WIDTH' };
    var grade = trimGrade(result.w, previous);
    return { state: 'trim', label: grade + ' CUT · ' + Math.round(result.w / previous * 100) + '% WIDTH' };
  }
  // Perfect-drop rate makes precision progress legible after each run.
  function precisionPercent(perfects, drops) {
    return drops > 0 ? Math.min(100, Math.round(Math.max(0, perfects) / drops * 100)) : 0;
  }
  // Longest uninterrupted perfect run makes precision mastery measurable.
  function longestPerfectStreak(flags) {
    var current = 0, best = 0;
    (flags || []).forEach(function (perfect) {
      current = perfect ? current + 1 : 0;
      if (current > best) best = current;
    });
    return best;
  }
  // Next mastery target keeps each run pointed at a concrete skill goal.
  function nextTarget(score, hard, daily) {
    var goals = daily ? [10, 25] : hard ? [15, 30, 50] : [25, 50, 100, 150];
    for (var i = 0; i < goals.length; i++) if (score < goals[i]) return goals[i];
    return goals[goals.length - 1];
  }
  // Progress across current mastery rung, normalized for a compact HUD meter.
  function goalProgress(score, hard, daily) {
    var target = nextTarget(score, hard, daily), goals = daily ? [10, 25] : hard ? [15, 30, 50] : [25, 50, 100, 150], previous = 0;
    for (var i = 0; i < goals.length; i++) { if (goals[i] >= target) break; previous = goals[i]; }
    var span = Math.max(1, target - previous), value = Math.max(0, Math.min(1, (score - previous) / span));
    return { previous: previous, target: target, ratio: value, percent: Math.round(value * 100) };
  }
  // Continue offer context: turn current score into actionable PB/mastery distances.
  function continueContext(score, best, target) {
    var pbGap = Math.max(0, (best || 0) - score), goalGap = Math.max(0, (target || 0) - score);
    return { pbGap: pbGap, goalGap: goalGap, hasPb: best > 0 && pbGap > 0, pbTied: best > 0 && pbGap === 0, goalReached: target > 0 && goalGap === 0 };
  }
  // Record result must be calculated before PB mutation, so menus can explain exact replay distance.
  function recordContext(score, best) {
    score = Math.max(0, score || 0); best = Math.max(0, best || 0);
    if (!best) return { state: score ? 'new' : 'first', margin: score, gap: 0 };
    if (score > best) return { state: 'new', margin: score - best, gap: 0 };
    if (score === best) return { state: 'tie', margin: 0, gap: 0 };
    return { state: 'chase', margin: 0, gap: best - score };
  }
  // Daily personal best belongs only to its saved calendar day.
  function scopedBest(best, savedDay, currentDay) {
    return savedDay && savedDay === currentDay ? Math.max(0, best || 0) : 0;
  }
  // Drop moving block centered at x with width w onto top. Returns result.
  function drop(s, x) {
    if (s.over) return { type: 'none' };
    var top = s.blocks[s.blocks.length - 1], w = top.w;
    var d = x - top.x, ov = w - Math.abs(d);
    if (ov <= 0) { s.over = true; return { type: 'miss', x: x, w: w }; }
    if (Math.abs(d) <= tol(s.score, s.hard, s.mods)) {
      s.combo++; s.score++;
      var nw = (s.hard || s.mods) ? w : Math.min(START_W, w + (s.combo >= 3 ? 0.04 : 0));
      s.blocks.push({ x: top.x, w: nw });
      return { type: 'perfect', combo: s.combo, x: top.x, w: nw };
    }
    s.combo = 0; s.score++;
    var left = Math.max(x - w / 2, top.x - w / 2), right = Math.min(x + w / 2, top.x + w / 2);
    var nb = { x: (left + right) / 2, w: right - left };
    var cut = { x: d > 0 ? right + (x + w / 2 - right) / 2 : left - (left - (x - w / 2)) / 2, w: Math.abs(d) };
    s.blocks.push(nb);
    return { type: 'trim', x: nb.x, w: nb.w, cut: cut };
  }
  // Undo a fatal miss so the player can continue (rewarded ad). Combo resets.
  function revive(s) { s.over = false; s.combo = 0; }
  // Daily login reward by streak day (1-based): 20,30,...capped at 100
  function dailyReward(n) { return Math.min(100, 10 + 10 * Math.max(1, n)); }
  // Achievements: id, label, coin reward, test on run stats {score, maxCombo, perfects, runs}
  var ACH = [
    { id: 'first', n: 'First Perfect', r: 10, t: function (x) { return x.perfects >= 1; } },
    { id: 'c5', n: 'Combo x5', r: 25, t: function (x) { return x.maxCombo >= 5; } },
    { id: 'c10', n: 'Combo x10', r: 60, t: function (x) { return x.maxCombo >= 10; } },
    { id: 's25', n: 'Score 25', r: 25, t: function (x) { return x.score >= 25; } },
    { id: 's50', n: 'Score 50', r: 60, t: function (x) { return x.score >= 50; } },
    { id: 's100', n: 'Score 100', r: 150, t: function (x) { return x.score >= 100; } },
    { id: 'c20', n: 'Combo x20', r: 120, t: function (x) { return x.maxCombo >= 20; } },
    { id: 's150', n: 'Score 150', r: 250, t: function (x) { return x.score >= 150; } },
    { id: 'h15', n: 'Hard 15', r: 60, t: function (x) { return x.hard && x.score >= 15; } },
    { id: 'h30', n: 'Hard 30', r: 150, t: function (x) { return x.hard && x.score >= 30; } },
    { id: 'h50', n: 'Hard 50', r: 400, t: function (x) { return x.hard && x.score >= 50; } },
    { id: 'd25', n: 'Daily 25', r: 80, t: function (x) { return x.daily && x.score >= 25; } }
  ];
  // Returns achievements newly earned given stats and list of owned ids.
  function newAchievements(stats, owned) {
    return ACH.filter(function (a) { return owned.indexOf(a.id) < 0 && a.t(stats); });
  }
  var api = { DAILY: DAILY, dailyMods: dailyMods, normalizeSave: normalizeSave, ACH: ACH, newAchievements: newAchievements, dailyReward: dailyReward, revive: revive, create: create, drop: drop, posAt: posAt, trimGrade: trimGrade, dropFeedback: dropFeedback, precisionPercent: precisionPercent, longestPerfectStreak: longestPerfectStreak, nextTarget: nextTarget, goalProgress: goalProgress, continueContext: continueContext, recordContext: recordContext, scopedBest: scopedBest, warp: warp, speed: speed, tol: tol, perfectZone: perfectZone, timingCue: timingCue, PERFECT_TOL: PERFECT_TOL };
  if (typeof module !== 'undefined') module.exports = api; else root.StackLogic = api;
})(this);
