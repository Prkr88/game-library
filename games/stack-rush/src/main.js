(function () {
  var L = StackLogic, cv = document.getElementById('game'), ctx = cv.getContext('2d');
  var $ = function (id) { return document.getElementById(id); };
  function focus(id) { var el = $(id); if (el && !el.classList.contains('hidden')) el.focus({ preventScroll: true }); }
  var W, H, dpr;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener('resize', resize); resize();

  var save = StackLogic.normalizeSave({});
  try { save = StackLogic.normalizeSave(JSON.parse(localStorage.getItem('stackrush') || '{}')); } catch (e) {}
  function persist() { try { localStorage.setItem('stackrush', JSON.stringify(save)); } catch (e) {} }

  // Audio: src/audio.js (StackAudio)
  StackAudio.setMuted(save.mute);
  function musicTick() { StackAudio.music(!save.mute && (mode === 'play' || mode === 'dying') && !!state, state ? state.score : 0); }
  function buzz(ms) {
    try {
      var hp = window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Haptics;
      if (hp) hp.vibrate({ duration: ms }); else navigator.vibrate && navigator.vibrate(ms);
    } catch (e) {}
  }
  // Achievement toasts
  var toastQ = [], toasting = false, runPerfects = 0, runMaxCombo = 0, runPerfectStreak = 0, runBestPerfectStreak = 0;
  function toast(txt) { toastQ.push(txt); if (!toasting) nextToast(); }
  function nextToast() {
    var t = toastQ.shift(); if (!t) { toasting = false; return; }
    toasting = true; var el = $('toast'); el.textContent = t; el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); setTimeout(nextToast, 300); }, 1800);
  }
  function checkAch() {
    var got = L.newAchievements({ score: state.score, maxCombo: runMaxCombo, hard: state.hard, daily: challenge, perfects: runPerfects }, save.ach);
    got.forEach(function (a) { save.ach.push(a.id); save.coins += a.r; toast('🏆 ' + a.n + ' +' + a.r + ' 🪙'); StackAudio.sfx.ach(); });
    if (got.length) { persist(); themeBtn(); }
  }

  var pausedAt = 0, state = null, mode = 'menu', t0 = 0, camY = 0, camTarget = 0, falling = [], parts = [], rings = [], flashT = 0, msgT = 0, shake = 0, lastCueLabel = null;
  var BH = 28; // block height px
  function unit() { return Math.min(W * 0.7, 320); }
  var THEMES = [
    { n: 'Neon', c: 0, h: 200, s: 70, l: 58, bg: ['#14213d', '#3a0ca3'] },
    { n: 'Sunset', c: 150, h: 340, s: 80, l: 60, bg: ['#2b0a3d', '#ff6b35'] },
    { n: 'Forest', c: 300, h: 100, s: 60, l: 50, bg: ['#0b2b1a', '#1b6b4a'] },
    { n: 'Candy', c: 500, h: 290, s: 85, l: 72, bg: ['#ffafcc', '#a2d2ff'] },
    { n: 'Ocean', c: 700, h: 180, s: 75, l: 60, bg: ['#0a5a9c', '#35c4ee'] }
  ];
  // Owner PNG art (bg-theme-N / block-N / base / fx / shard). Each asset is optional: missing file -> shape fallback.
  var THEME_BG = [4, 3, 1, 5, 2], IMG = {}, BGIMG = {};
  function trimmed(im) {
    var c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    var x = c.getContext('2d'); x.drawImage(im, 0, 0);
    try {
      var d = x.getImageData(0, 0, c.width, c.height).data, x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
      for (var y = 0; y < c.height; y++) for (var xx = 0; xx < c.width; xx++) if (d[(y * c.width + xx) * 4 + 3] > 24) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 < 0) return { c: c, w: c.width, h: c.height };
      var o = document.createElement('canvas'); o.width = x1 - x0 + 1; o.height = y1 - y0 + 1;
      o.getContext('2d').drawImage(c, x0, y0, o.width, o.height, 0, 0, o.width, o.height);
      return { c: o, w: o.width, h: o.height };
    } catch (e) { return { c: c, w: c.width, h: c.height }; }
  }
  function loadArt(name) { var im = new Image(); im.onload = function () { IMG[name] = trimmed(im); }; im.src = 'assets/' + name + '.png'; }
  ['block-1', 'block-2', 'block-3', 'block-4', 'block-5', 'block-6', 'block-7', 'block-8', 'block-perfect', 'block-shard', 'base', 'fx-perfect'].forEach(loadArt);
  (function () { var im = new Image(); im.onload = function () { document.documentElement.classList.add('art-ui'); }; im.src = 'assets/ui-button.png'; })();
  function bgFor(theme) {
    var n = THEME_BG[theme] || 1;
    if (!(n in BGIMG)) { BGIMG[n] = null; var im = new Image(); im.onload = function () { BGIMG[n] = im; }; im.src = 'assets/bg-theme-' + n + '.png'; }
    return BGIMG[n];
  }
  // Slab sprite: top face scales with width (iso depth), side keeps fixed thickness BH so levels stack flush.
  function slab(im, cx, bottom, wpx) {
    var sy = Math.round(im.h * 0.77), topH = Math.max(8, wpx * 0.44);
    ctx.drawImage(im.c, 0, 0, im.w, sy, cx - wpx / 2, bottom - BH - topH, wpx, topH + 1);
    ctx.drawImage(im.c, 0, sy, im.w, im.h - sy, cx - wpx / 2, bottom - BH, wpx, BH);
  }
  function color(i) { var t = THEMES[save.theme] || THEMES[0]; return 'hsl(' + ((i * 12 + t.h) % 360) + ',' + t.s + '%,' + t.l + '%)'; }
  var stars = []; for (var si = 0; si < 40; si++) stars.push({ x: Math.random(), y: Math.random(), z: 0.2 + Math.random() * 0.8 });
  var runCoins = 0, shards = [];

  var challenge = false;
  function dayNum() { return Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / 864e5); }
  function bestKey() { return challenge ? 'dcBest' : state && state.hard ? 'bestHard' : 'best'; }
  function updateRecord() {
    var best = save[bestKey()] || 0, el = $('record');
    el.classList.toggle('hot', state && state.score >= best && state.score > 0);
    if (!best) { el.textContent = 'FIRST RUN'; return; }
    if (state && state.score > best) { el.textContent = 'NEW PERSONAL BEST'; return; }
    el.textContent = 'PB ' + best + (state ? ' · ' + Math.max(0, best - state.score) + ' TO BEAT' : '');
  }
  function updateGoal() {
    if (!state) return;
    var progress = L.goalProgress(state.score, state.hard, challenge), target = progress.target, bar = $('goalbar');
    $('goal').textContent = state.score >= target ? 'MASTERY COMPLETE' : 'NEXT GOAL ' + target + ' · ' + (target - state.score) + ' TO GO';
    bar.firstElementChild.style.width = progress.percent + '%';
    bar.setAttribute('aria-valuenow', progress.percent);
    bar.setAttribute('aria-valuetext', progress.percent + '% toward goal ' + target);
    bar.classList.toggle('complete', state.score >= target);
  }
  function updatePrecision() {
    if (!state || (mode !== 'play' && mode !== 'paused')) { $('precision').textContent = ''; return; }
    $('precision').textContent = 'PERFECT RATE ' + L.precisionPercent(runPerfects, state.score) + '% · STREAK x' + runPerfectStreak;
  }
  function updateCue() {
    if (!state || (mode !== 'play' && mode !== 'paused')) {
      if (lastCueLabel !== '') { $('cue').textContent = ''; $('cue').className = ''; lastCueLabel = ''; }
      return;
    }
    var top = state.blocks[state.blocks.length - 1], cue = L.timingCue(curX(), top.x, top.w, state.score, state.hard, state.mods);
    if (cue.label === lastCueLabel) return;
    $('cue').textContent = cue.label; $('cue').className = cue.state; lastCueLabel = cue.label;
  }
  function showFeedback(result, previousWidth) {
    var feedback = L.dropFeedback(result, previousWidth), el = $('feedback');
    el.textContent = feedback.label; el.className = feedback.state;
  }
  function start(ch) {
    challenge = ch === true; var mods = challenge ? L.dailyMods(dayNum()) : null;
    state = L.create(1, challenge ? false : save.hard, mods); t0 = performance.now() / 1000; camY = 0; camTarget = 0; falling = []; parts = []; rings = []; shards = [];
    revived = false; lastCueLabel = null; mode = 'play'; $('menu').classList.add('hidden'); $('over').classList.add('hidden');
    $('pause').classList.add('hidden'); $('score').textContent = '0'; $('combo').textContent = ''; $('feedback').textContent = ''; $('feedback').className = ''; $('mode').textContent = challenge ? 'DAILY · ' + mods.n.toUpperCase() : save.hard ? 'HARD MODE' : 'CLASSIC'; $('msg').textContent = ''; runCoins = 0; runPerfects = 0; runMaxCombo = 0; runPerfectStreak = 0; runBestPerfectStreak = 0;
    updateRecord(); updateGoal(); updatePrecision(); updateCue();
    focus('game');
    if (!save.seen) { say('TAP to drop the block!'); msgT = 3; }
  }
  // Restart sweep from alternating edge after each drop (fairer, classic stacker feel)
  function entryT() { t0 = performance.now() / 1000 - (state.score % 2 ? 2 : 0) / L.speed(state.score, state.hard, state.mods); }
  function curX() { return L.posAt((mode === 'paused' ? pausedAt : performance.now() / 1000) - t0, state.score, state.hard, state.mods); }
  function say(s) { $('msg').textContent = s; msgT = 0.8; }

  function pauseInfo() {
    if (!state) return '';
    var label = challenge ? 'Daily' : state.hard ? 'Hard' : 'Classic';
    var best = save[bestKey()] || 0, target = L.nextTarget(state.score, state.hard, challenge);
    var record = best ? (state.score >= best ? 'PB pace' : (best - state.score) + ' to beat PB') : 'first PB in reach';
    var goal = state.score >= target ? 'mastery complete' : target + ' goal · ' + (target - state.score) + ' to go';
    return label + '  ·  ' + state.score + ' drops  ·  ' + record + '  ·  ' + goal +
      '  ·  ' + L.precisionPercent(runPerfects, state.score) + '% perfect  ·  streak x' + runPerfectStreak + '  ·  combo x' + state.combo;
  }

    function pause() {
    if (mode !== 'play') return;
    mode = 'paused'; pausedAt = performance.now() / 1000; $('pinfo').textContent = pauseInfo(); $('pause').classList.remove('hidden'); focus('resume');
  }
  function resume() {
    if (mode !== 'paused') return;
    t0 += performance.now() / 1000 - pausedAt; mode = 'play'; $('pause').classList.add('hidden'); focus('game');
  }
  $('pausebtn').onclick = pause; $('resume').onclick = resume;
  $('quit').onclick = function () { $('pause').classList.add('hidden'); mode = 'menu'; $('menu').classList.remove('hidden'); bestTxt(); focus('play'); };
  addEventListener('keydown', function (e) { if (e.code === 'Escape' || e.code === 'KeyP') { mode === 'paused' ? resume() : pause(); } });
  function tap() {
    StackAudio.init();
    if (mode !== 'play') return;
    var x = curX(), top = state.blocks[state.blocks.length - 1], previousWidth = top.w, r = L.drop(state, x), u = unit();
    showFeedback(r, previousWidth);
    if (r.type === 'miss') {
      falling.push({ x: x, w: top.w, y: state.blocks.length, vy: 0, i: state.blocks.length });
      for (var q2 = 0; q2 < 6; q2++) shards.push({ x: x + (Math.random() - .5) * top.w, y: state.blocks.length - 0.5, vx: (Math.random() - .5) * 2, vy: 1 + Math.random() * 2, rot: Math.random() * 6, vr: (Math.random() - .5) * 8, s: 0.7 + Math.random() * 0.6, l: 1 });
      StackAudio.sfx.miss(); buzz(80); shake = 10; $('combo').textContent = ''; mode = 'dying';
      setTimeout(function () { if (mode === 'dying') offerContinue(); }, 700); return;
    }
    if (r.type === 'perfect') {
      StackAudio.sfx.perfect(state.combo); buzz(15);
      runPerfects++; runPerfectStreak++; runBestPerfectStreak = Math.max(runBestPerfectStreak, runPerfectStreak); runMaxCombo = Math.max(runMaxCombo, state.combo); runCoins += Math.min(state.combo, 5); say(state.combo > 1 ? 'PERFECT x' + state.combo : 'PERFECT');
      rings.push({ x: r.x, w: r.w, y: state.blocks.length - 1, l: 1 }); flashT = 0.12; state.blocks[state.blocks.length - 1].pf = performance.now();
      for (var k = 0; k < 14; k++) parts.push({ x: r.x, y: state.blocks.length, vx: (Math.random() - .5) * 3, vy: Math.random() * 2, l: 1 });
    } else {
      runPerfectStreak = 0;
      StackAudio.sfx.good();
      falling.push({ x: r.cut.x, w: r.cut.w, y: state.blocks.length, vy: 0, i: state.blocks.length });
      for (var q = 0; q < 4; q++) shards.push({ x: r.cut.x + (Math.random() - .5) * r.cut.w, y: state.blocks.length - 0.5, vx: (r.cut.x < top.x ? -1 : 1) * (0.4 + Math.random()), vy: 1 + Math.random() * 2, rot: Math.random() * 6, vr: (Math.random() - .5) * 8, s: 0.6 + Math.random() * 0.5, l: 1 });
      var grade = L.trimGrade(r.w, top.w);
      say(grade === 'CLOSE' ? 'CLOSE!' : grade === 'CLEAN' ? 'CLEAN CUT' : 'RISKY CUT');
    }
    $('combo').textContent = state.combo > 1 ? 'COMBO x' + state.combo : '';
    if (!save.seen) { save.seen = true; persist(); }
    entryT();
    $('score').textContent = state.score; updateRecord(); updateGoal(); updatePrecision(); checkAch();
    if (state.score % 10 === 0) { say(['NICE!', 'GREAT!', 'AMAZING!', 'INCREDIBLE!'][Math.min(3, state.score / 10 - 1)]); StackAudio.sfx.coin(); }
    camTarget = Math.max(0, state.blocks.length - 6) * BH;
  }
  var revived = false;
  // Monetization hook: wire to AdMob rewarded via Capacitor later. Resolves true when reward granted.
  function rewardedReady() { var h = window.StackAds; return !!(h && h.rewardedReady()); }
  function showRewardedAd(cb) { var h = window.StackAds; if (h && h.rewardedReady()) h.showRewarded(function () { cb(true); }); else cb(false); }
  function offerContinue() {
    if (revived || state.score < 5 || !rewardedReady()) { finish(); return; }
    mode = 'offer'; $('cscore').textContent = state.score;
    var best = save[bestKey()] || 0, target = L.nextTarget(state.score, state.hard, challenge), ctx = L.continueContext(state.score, best, target), notes = [];
    if (ctx.hasPb) notes.push(ctx.pbGap + ' to beat PB'); else if (ctx.pbTied) notes.push('PB matched'); else notes.push('first PB in reach');
    if (ctx.goalReached) notes.push('mastery goal reached'); else notes.push(ctx.goalGap + ' to next goal');
    $('cinfo').textContent = notes.join('  ·  '); $('cont').classList.remove('hidden'); focus('revive');
  }
  $('revive').onclick = function () {
    showRewardedAd(function (ok) {
      $('cont').classList.add('hidden');
      if (!ok) { finish(); return; }
      revived = true; L.revive(state); t0 = performance.now() / 1000; mode = 'play'; say('CONTINUE!'); focus('game');
    });
  };
  $('skip').onclick = function () { $('cont').classList.add('hidden'); finish(); };
  var runs = 0;
  // Monetization hook: interstitial every 3rd run (window.StackAds.showInterstitial)
  function maybeInterstitial() { runs++; var h = window.StackAds; if (h) { try { h.maybeInterstitial(runs); } catch (e) {} } }
  function finish() {
    mode = 'over'; maybeInterstitial();
    var bk = bestKey();
    if (challenge) { var stamp = today(); save.dcBest = L.scopedBest(save.dcBest, save.dcDay, stamp); save.dcDay = stamp; }
    var record = L.recordContext(state.score, save[bk]);
    var nb = state.score > save[bk];
    save.runs++; save.drops += state.score; save.perfects += runPerfects; save.bestCombo = Math.max(save.bestCombo, runMaxCombo); save.bestPerfectStreak = Math.max(save.bestPerfectStreak, runBestPerfectStreak);
    save.lastScore = state.score; save.lastMode = challenge ? 'Daily' : state.hard ? 'Hard' : 'Classic'; save.lastPerfects = runPerfects; save.lastCombo = runMaxCombo; save.lastPerfectStreak = runBestPerfectStreak;
    save.lastRecordState = record.state; save.lastRecordMargin = record.margin; save.lastRecordGap = record.gap;
    if (nb) save[bk] = state.score;
    runCoins += Math.floor(state.score / 2);
    if (challenge && save.dcDone !== today() && state.score >= 10) {
      save.dcStreak = save.dcLast === yesterday() ? save.dcStreak + 1 : 1; save.dcLast = today(); save.dcDone = today();
      var bonus = Math.min(150, 40 + 10 * save.dcStreak); runCoins += bonus; toast('⚡ Challenge done +' + bonus + ' 🪙 (streak ' + save.dcStreak + ')');
    } save.coins += runCoins; persist();
    $('fscore').textContent = state.score; $('fcoins').textContent = '+' + runCoins + ' 🪙 (total ' + save.coins + ')';
    $('fbest').textContent = record.state === 'new' ? 'NEW BEST +' + record.margin : record.state === 'tie' ? 'PB TIED' : record.state === 'chase' ? 'PB ' + save[bk] + ' · ' + record.gap + ' TO BEAT' : 'FIRST SCORE';
    $('fstats').textContent = (challenge ? 'Daily' : state.hard ? 'Hard' : 'Classic') + '  ·  ' + runPerfects + ' perfects (' + L.precisionPercent(runPerfects, state.score) + '%)  ·  streak x' + runBestPerfectStreak + '  ·  best combo x' + runMaxCombo;
    var next = L.nextTarget(state.score, state.hard, challenge);
    $('fgoal').textContent = state.score >= next ? 'Mastery ladder complete' : 'Next goal: ' + next + ' (' + (next - state.score) + ' drops)';
    dblCoins = runCoins; $('double').classList.toggle('hidden', runCoins < 2 || !rewardedReady());
    $('double').textContent = '▶ DOUBLE COINS +' + runCoins + ' 🪙 (ad)';
    $('over').classList.remove('hidden'); focus('retry');
  }
  var dblCoins = 0;
  $('double').onclick = function () {
    if (!dblCoins) return;
    showRewardedAd(function (ok) {
      if (!ok || !dblCoins) return;
      save.coins += dblCoins; dblCoins = 0; persist(); $('double').classList.add('hidden'); themeBtn();
      $('fcoins').textContent = 'Coins doubled! (total ' + save.coins + ')'; StackAudio.sfx.coin();
    });
  };
  // Daily reward: streak-based coins, claimed from menu
  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function yesterday() { var d = new Date(Date.now() - 864e5); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function dailyBtn() {
    var can = save.lastDaily !== today(), n = (save.lastDaily === yesterday() ? save.streak : 0) + 1;
    $('daily').classList.toggle('hidden', !can);
    $('daily').textContent = '🎁 Daily reward +' + L.dailyReward(n) + ' 🪙 (day ' + n + ')';
  }
  $('daily').onclick = function () {
    if (save.lastDaily === today()) return;
    var n = (save.lastDaily === yesterday() ? save.streak : 0) + 1;
    save.coins += L.dailyReward(n); save.streak = n; save.lastDaily = today(); persist();
    StackAudio.sfx.ui(); dailyBtn(); themeBtn();
  };

  function draw(dt) {
    $('hud').style.visibility = mode === 'menu' ? 'hidden' : '';
    ctx.clearRect(0, 0, W, H);
    var th = THEMES[save.theme] || THEMES[0], g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, th.bg[0]); g.addColorStop(1, th.bg[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    var bgi = bgFor(save.theme);
    if (bgi) {
      // cover-fit, anchored to the bottom; climbing the tower slowly reveals the sky
      var sc = Math.max(W / bgi.width, H * 1.35 / bgi.height), dw = bgi.width * sc, dh = bgi.height * sc;
      var off = Math.min(dh - H, camY * 0.12);
      ctx.drawImage(bgi, (W - dw) / 2, H - dh + off, dw, dh);
      var sg = ctx.createLinearGradient(0, 0, 0, H * 0.4); sg.addColorStop(0, 'rgba(10,15,40,.45)'); sg.addColorStop(1, 'rgba(10,15,40,0)');
      ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H * 0.4);
    }
    ctx.fillStyle = '#fff';
    if (!bgi) stars.forEach(function (s) { ctx.globalAlpha = 0.25 + s.z * 0.4; var y = ((s.y * H + camY * s.z * 0.3) % H + H) % H; ctx.fillRect(s.x * W, H - y, 2 * s.z, 2 * s.z); });
    ctx.globalAlpha = 1;
    if (!state) return;
    var u = unit(), base = H - 90 + camY, sx = shake ? (Math.random() - .5) * shake : 0;
    shake = Math.max(0, shake - dt * 40);
    function rect(x, w, lvl, i, a, pf) {
      var sp = IMG[pf && IMG['block-perfect'] ? 'block-perfect' : 'block-' + (i % 8 + 1)];
      if (sp) { ctx.globalAlpha = a == null ? 1 : a; slab(sp, W / 2 + sx + x * u, base - lvl * BH, w * u); return; }
      ctx.globalAlpha = a == null ? 1 : a; ctx.fillStyle = color(i);
      var rx = W / 2 + sx + (x - w / 2) * u, ry = base - lvl * BH - BH;
      ctx.fillRect(rx, ry, w * u, BH - 2);
      ctx.fillStyle = '#fff'; ctx.globalAlpha = (a == null ? 1 : a) * 0.22; ctx.fillRect(rx, ry, w * u, 4);
      ctx.fillStyle = '#000'; ctx.globalAlpha = (a == null ? 1 : a) * 0.18; ctx.fillRect(rx, ry + BH - 6, w * u, 4);
    }
    if (IMG.base) { var bw = u * 1.3, bh = bw * IMG.base.h / IMG.base.w; ctx.globalAlpha = 1; ctx.drawImage(IMG.base.c, W / 2 + sx - bw / 2, base - bh * 0.5 + BH * 0.5, bw, bh); }
    var nowMs = performance.now();
    state.blocks.forEach(function (b, i) { rect(b.x, b.w, i, i, null, b.pf && nowMs - b.pf < 450); });
    if (mode === 'play' || mode === 'paused') {
      var n = state.blocks.length, movingX = curX(), movingW = state.blocks[n - 1].w;
      updateCue();
      rect(movingX, movingW, n, n);
      // Gold band marks exact center tolerance; band narrows as difficulty rises.
      var zone = L.perfectZone(state.blocks[n - 1].x, movingW, state.score, state.hard, state.mods);
      var zry = base - n * BH - BH, zrx = W / 2 + sx + zone.left * u;
      ctx.globalAlpha = 0.48; ctx.fillStyle = '#ffd166'; ctx.fillRect(zrx, zry, zone.width * u, 4);
      ctx.globalAlpha = 0.95; ctx.fillRect(zrx, zry + BH - 6, zone.width * u, 2);
      ctx.globalAlpha = 1;
    }
    falling.forEach(function (f) { rect(f.x, f.w, f.y, f.i, Math.max(0, 1 - f.vy / 900)); });
    parts.forEach(function (p) {
      ctx.globalAlpha = p.l; ctx.fillStyle = '#ffd166';
      ctx.fillRect(W / 2 + p.x * u, base - p.y * BH, 4, 4);
    });
    shards.forEach(function (p) {
      var sp = IMG['block-shard']; if (!sp) return;
      var z = u * 0.14 * p.s; ctx.save(); ctx.globalAlpha = Math.max(0, p.l); ctx.translate(W / 2 + sx + p.x * u, base - p.y * BH); ctx.rotate(p.rot); ctx.drawImage(sp.c, -z / 2, -z / 2, z, z * sp.h / sp.w); ctx.restore();
    });
    rings.forEach(function (r) {
      var e = 1 - r.l;
      if (IMG['fx-perfect']) { var fw = (r.w + e * 0.8) * u * 1.25, fh = fw * IMG['fx-perfect'].h / IMG['fx-perfect'].w; ctx.globalAlpha = r.l; ctx.drawImage(IMG['fx-perfect'].c, W / 2 + sx + r.x * u - fw / 2, base - r.y * BH - BH - fh * 0.5, fw, fh); return; }
      ctx.globalAlpha = r.l * 0.8; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
      var w = (r.w + e * 0.5) * u, h = BH + e * 18;
      ctx.strokeRect(W / 2 + sx + r.x * u - w / 2, base - r.y * BH - BH - (h - BH) / 2, w, h);
    });
    if (flashT > 0) { ctx.globalAlpha = flashT * 2; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); }
    ctx.globalAlpha = 1;
  }

  var last = performance.now();
  function loop(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    camY += (camTarget - camY) * Math.min(1, dt * 6);
    falling.forEach(function (f) { f.vy += 1400 * dt; f.y -= f.vy * dt / BH; });
    falling = falling.filter(function (f) { return f.vy < 900; });
    parts.forEach(function (p) { p.x += p.vx * dt * 0.1; p.y += p.vy * dt * 3; p.l -= dt * 1.5; });
    parts = parts.filter(function (p) { return p.l > 0; });
    rings.forEach(function (r) { r.l -= dt * 3; }); rings = rings.filter(function (r) { return r.l > 0; });
    flashT = Math.max(0, flashT - dt);
    shards.forEach(function (p) { p.vy -= 9 * dt; p.x += p.vx * dt * 0.5; p.y += p.vy * dt; p.rot += p.vr * dt; p.l -= dt * 0.9; });
    shards = shards.filter(function (p) { return p.l > 0; });
    musicTick(dt);
    if (msgT > 0 && (msgT -= dt) <= 0) $('msg').textContent = '';
    draw(dt); requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // Mobile: ignore long background gaps so block doesn't teleport; mute music handled by tick gating
  document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); else last = performance.now(); });
  cv.addEventListener('pointerdown', function (e) { e.preventDefault(); tap(); });
  addEventListener('keydown', function (e) { if (e.code === 'Space') tap(); });
  $('play').onclick = function () { start(false); }; $('retry').onclick = function () { start(challenge); };
  $('chal').onclick = function () { start(true); };
  function chalBtn() {
    var m = L.dailyMods(dayNum()), best = save.dcDay === today() ? save.dcBest : 0;
    $('chal').textContent = '⚡ Daily: ' + m.n + (save.dcDone === today() ? ' ✓ best ' + best : ' (reach 10)');
  }
  $('home').onclick = function () { $('over').classList.add('hidden'); $('menu').classList.remove('hidden'); mode = 'menu'; bestTxt(); focus('play'); };
  function bestTxt() {
    $('best').textContent = 'Best ' + save.best + (save.bestHard ? '  ·  Hard ' + save.bestHard : '');
    $('stats').textContent = save.runs + ' runs  ·  ' + save.drops + ' drops  ·  ' + save.perfects + ' perfects  ·  streak x' + save.bestPerfectStreak + '  ·  combo x' + save.bestCombo;
    if (!save.runs) { $('last').textContent = 'First run: line up block, then tap to drop.'; return; }
    var delta = save.lastRecordState === 'new' ? 'NEW PB +' + save.lastRecordMargin : save.lastRecordState === 'tie' ? 'PB tied · replay to beat' : save.lastRecordState === 'chase' ? save.lastRecordGap + ' drops to beat' : '';
    $('last').textContent = 'Last ' + save.lastMode + ': ' + save.lastScore + ' drops  ·  ' + save.lastPerfects + ' perfects (' + L.precisionPercent(save.lastPerfects, save.lastScore) + '%)  ·  streak x' + save.lastPerfectStreak + '  ·  combo x' + save.lastCombo + '  ·  ' + delta;
  }
  function hardBtn() { $('hard').textContent = 'Mode: ' + (save.hard ? '🔥 HARD' : 'Classic'); }
  $('hard').onclick = function () { save.hard = !save.hard; persist(); hardBtn(); };
  function muteIcon() { $('mute').textContent = save.mute ? '🔇' : '🔊'; }
  $('mute').onclick = function () { save.mute = !save.mute; StackAudio.setMuted(save.mute); StackAudio.init(); persist(); muteIcon(); };
  function themeBtn() {
    var t = THEMES[save.theme], nx = THEMES[(save.theme + 1) % THEMES.length];
    $('theme').textContent = 'Theme: ' + t.n + ' ▸ ' + nx.n + (save.owned.indexOf((save.theme + 1) % THEMES.length) < 0 ? ' (' + nx.c + ' 🪙)' : '');
    $('coins').textContent = save.coins;
  }
  $('theme').onclick = function () {
    var i = (save.theme + 1) % THEMES.length;
    if (save.owned.indexOf(i) < 0) { if (save.coins < THEMES[i].c) { $('theme').textContent = 'Need ' + THEMES[i].c + ' 🪙'; return; } save.coins -= THEMES[i].c; save.owned.push(i); }
    save.theme = i; persist(); themeBtn();
  };
  $('home').addEventListener('click', themeBtn);
  $('home').addEventListener('click', dailyBtn); $('quit').addEventListener('click', dailyBtn);
  $('home').addEventListener('click', chalBtn); $('quit').addEventListener('click', chalBtn);
  chalBtn(); dailyBtn(); themeBtn(); muteIcon(); hardBtn(); bestTxt();
})();

// Keep installed/web-served builds playable offline; file:// remains directly runnable without SW support.
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./sw.js').catch(function () {});
