/* Glitch Hop - rendering, input, audio, UI. Logic lives in logic.js (GH). */
(function () {
  var T = GH.T, DEFS = GH_LEVELS.concat(window.GH_LEVELS2 || [], window.GH_LEVELS3 || [], window.GH_LEVELS4 || [], window.GH_LEVELS5 || [], window.GH_LEVELS6 || [], window.GH_LEVELS7 || [], window.GH_LEVELS8 || [], window.GH_LEVELS9 || [], window.GH_LEVELS10 || [], window.GH_LEVELS11 || [], window.GH_LEVELS12 || []);
  var $ = function (id) { return document.getElementById(id); };
  var cv = $('game'), cx = cv.getContext('2d');
  var save = { best: {}, hard: {}, mute: false, nodeaths: 0, skin: 0 };
  try { save = GHSave.normalize(JSON.parse(localStorage.getItem('glitchhop') || '{}')); } catch (e) { save = GHSave.normalize({}); }
  function persist() { try { localStorage.setItem('glitchhop', JSON.stringify(save)); } catch (e) {} }

  // ---------- skins (unlocked by total coins collected) ----------
  var SKINS = [
    { n: 'Cyan', c: '#7df9ff', t: '#7df9ff', need: 0 },
    { n: 'Magenta', c: '#ff3d9a', t: '#ff8ac4', need: 10 },
    { n: 'Lime', c: '#b6ff4a', t: '#d9ff94', need: 25 },
    { n: 'Gold', c: '#ffd166', t: '#fff0b8', need: 45 },
    { n: 'Ghost', c: '#e8ecff', t: '#9aa6ff', need: 70 }
  ];
  var SKIN_FILTER = ['none', 'hue-rotate(125deg)', 'hue-rotate(-75deg)', 'hue-rotate(-140deg) brightness(1.15)', 'saturate(0.15) brightness(1.35)'];
  function totalCoins() { var n = 0; for (var k in save.best) n += save.best[k].coins || 0; return n; }
  function skinOk(i) { return totalCoins() >= SKINS[i].need; }
  function skinLabel() {
    var i = save.skin || 0, nx = SKINS[(i + 1) % SKINS.length];
    return '🎨 Skin: ' + SKINS[i].n;
  }

  // ---------- audio ---------- (engine in audio.js)
  GHAudio.init({ muted: function () { return save.mute; }, musicOff: function () { return save.nomusic; }, active: function () { return state !== 'menu'; } });
  function actx() { return GHAudio.ctx(); }
  function music() { GHAudio.music(); }
  var SFX = GHAudio.sfx;
  function buzz(ms) {
    if (save.novib) return;
    try { var hp = window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Haptics; if (hp) hp.vibrate({ duration: ms }); else navigator.vibrate && navigator.vibrate(ms); } catch (e) {}
  }

  // ---------- monetization hooks ----------
  // Native ad bridge present -> rewarded ad required; web build -> skip is earned by 8 deaths on the level (no ad exists).
  function showRewarded(cb) { var h = window.GlitchAds; if (h && h.rewardedReady()) h.showRewarded(function () { cb(true); }); else if (!h) cb(true); }
  var deathsSinceAd = 0;
  function maybeInterstitial() { var h = window.GlitchAds; if (h) { try { h.maybeInterstitial(adRuns); } catch (e) {} } }
  var adRuns = 0;

  // ---------- state ----------
  var state = 'menu', hard = false, cur = 0, lv = null, s = null, acc = 0, last = 0;
  var REDUCED = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var cam = { x: 0, y: 0 }, shake = 0, parts = [], clock = 0, respawnT = 0, winT = 0, flash = 0;
  var inp = { l: false, r: false, j: false, d: false };
  var squash = { x: 1, y: 1 }, trail = [];

  function stars(i) { var b = save.best[i]; return b ? b.stars : 0; }
  function hardRecord(i) {
    var b = save.hard && save.hard[i];
    return b && typeof b === 'object' ? b : null;
  }
  function unlocked(i) { return i === 0 || stars(i - 1) > 0 || save.best[i]; }
  function toast(t) { var e = $('toast'); e.textContent = t; e.classList.add('show'); setTimeout(function () { e.classList.remove('show'); }, 1800); }
  function announce(t) { $('announcer').textContent = ''; setTimeout(function () { $('announcer').textContent = t; }, 20); }

  function focusPanel(id) {
    if (!id) return;
    setTimeout(function () {
      var panel = $(id); if (!panel || panel.classList.contains('hidden')) return;
      var target = panel.querySelector('button:not(.hidden)');
      if (target) target.focus();
      else { panel.setAttribute('tabindex', '-1'); panel.focus(); }
    }, 0);
  }
  function show(id) {
    ['menu', 'select', 'pause', 'win', 'achp'].forEach(function (p) { $(p).classList.toggle('hidden', p !== id); });
    focusPanel(id);
  }
  function setPlaying(on) {
    ['hud', 'hprogress', 'restartbtn', 'pausebtn', 'controls'].forEach(function (id) { $(id).classList.toggle('hidden', !on); });
  }
  // ---------- daily challenge: date-seeded level (6+) in Glitch mode, streak + best time ----------
  var dailyMode = false, prevHard = false;
  function todayStr() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function dailyIdx() {
    var str = todayStr(), h = 7; for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return 5 + h % (DEFS.length - 5);
  }
  function endDaily() { if (dailyMode) { dailyMode = false; hard = prevHard; } }
  function dailyLabel() {
    var d = save.daily || {}, done = d.last === todayStr();
    return '📅 Daily: L' + (dailyIdx() + 1) + (done ? ' ✓ ' + d.best.toFixed(1) + 's' : '') + (d.streak ? ' · 🔥' + d.streak : '');
  }
  function nextLevel() {
    for (var i = 0; i < DEFS.length; i++) if (!save.best[i]) return i;
    return 0;
  }
  function continueLabel() {
    var i = nextLevel();
    return Object.keys(save.best).length >= DEFS.length ? 'REPLAY L1' : 'CONTINUE L' + (i + 1);
  }
  function startDaily() { prevHard = hard; dailyMode = true; hard = true; startLevel(dailyIdx()); }
  function toMenu() {
    endDaily(); $('daily').textContent = dailyLabel();
    $('continue').textContent = continueLabel();
    state = 'menu'; setPlaying(false); show('menu');
    var tot = 0, n = 0; for (var k in save.best) { tot += save.best[k].stars; n++; }
    $('skin').textContent = skinLabel();
    $('total').textContent = '● ' + totalCoins() + '  ·  ★ ' + tot + ' / ' + DEFS.length * 3 + '   ·   ' + n + '/' + DEFS.length + ' cleared';
  }
  function toSelect() {
    endDaily(); state = 'select'; setPlaying(false); show('select'); buildGrid();
    $('hardtog').textContent = '☠ Glitch mode: ' + (hard ? 'ON (no checkpoints, faster saws)' : 'off');
  }
  var WORLDS = [['Glitch Basics', 0, 10], ['Crumble', 10, 15], ['Phase', 15, 20], ['Remix', 20, 25], ['Belts', 25, 30], ['Ice', 30, 35], ['Wind', 35, 40], ['Gauntlet', 40, 45], ['Elevators', 45, 50], ['Overdrive', 50, 55], ['Dash', 55, 60], ['Dash Remix', 60, 65]];
  function buildGrid() {
    var g = $('grid'), focus = null; g.innerHTML = '';
    WORLDS.forEach(function (w, wi) {
      if (w[1] >= DEFS.length) return;
      var got = 0, max = 0, cleared = 0, total = Math.min(w[2], DEFS.length) - w[1], h = document.createElement('div');
      for (var i = w[1]; i < Math.min(w[2], DEFS.length); i++) {
        max += 3;
        if (hard ? save.hard[i] : save.best[i]) cleared++;
        got += hard ? (save.hard[i] ? 3 : 0) : stars(i);
      }
      h.className = 'wh' + (unlocked(w[1]) ? '' : ' locked');
      h.innerHTML = '<b>' + (wi + 1) + '. ' + w[0] + '</b><span>' + (unlocked(w[1]) ? (hard ? '☠ ' : '★ ') + got + '/' + max + ' · ' + cleared + '/' + total : '🔒') + '</span>';
      g.appendChild(h);
      for (var j = w[1]; j < Math.min(w[2], DEFS.length); j++) (function (i) {
        var b = document.createElement('button'), st = hard ? (save.hard[i] ? 3 : 0) : stars(i), ok = unlocked(i);
        var best = '';
        if (!hard && save.best[i]) {
          if (Number.isFinite(save.best[i].time)) best = '⏱ ' + save.best[i].time.toFixed(1) + 's';
          if (Number.isFinite(save.best[i].deaths)) best += (best ? ' · ' : '') + '☠ ' + save.best[i].deaths;
        } else if (hard && hardRecord(i)) {
          if (Number.isFinite(hardRecord(i).time)) best = '⏱ ' + hardRecord(i).time.toFixed(1) + 's';
          if (Number.isFinite(hardRecord(i).deaths)) best += (best ? ' · ' : '') + '☠ ' + hardRecord(i).deaths;
        }
        b.innerHTML = (i + 1) + '<small>' + (hard ? (save.hard[i] ? '☠ DONE' : '') : '★'.repeat(st) + '☆'.repeat(st ? 3 - st : 0)) + '</small><em>' + best + '</em>';
        var status = ok ? (hard ? (save.hard[i] ? ', Glitch clear' : ', Glitch mode available') : (save.best[i] ? ', ' + st + ' of 3 stars' + (Number.isFinite(save.best[i].deaths) ? ', best ' + save.best[i].deaths + ' deaths' : '') : ', not cleared')) : ', locked';
        b.setAttribute('aria-label', 'Level ' + (i + 1) + status);
        if (!ok) b.classList.add('locked');
        if (hard) b.classList.add('hard');
        if (ok && !focus && !(hard ? save.hard[i] : save.best[i])) focus = b;
        b.onclick = function () { if (!ok) { toast('Clear level ' + i + ' first'); return; } startLevel(i); };
        g.appendChild(b);
      })(j);
    });
    if (focus) setTimeout(function () { try { focus.scrollIntoView({ block: 'center' }); } catch (e) {} }, 0);
  }

  function startLevel(i) {
    actx(); music(); GHAudio.setWorld(Math.max(0, WORLDS.findIndex(function (w) { return i >= w[1] && i < w[2]; }))); cur = i; lv = GH.parse(DEFS[i], hard); s = GH.create(lv);
    state = 'play'; setPlaying(true); show(null); parts = []; trail = []; acc = 0; respawnT = 0; flash = 0.4;
    cam.x = s.x - 100; cam.y = s.y - 60; $('hlevel').textContent = (dailyMode ? '📅 ' : hard ? '☠ ' : '') + (i + 1) + '. ' + DEFS[i].name;
    $('pausebtn').setAttribute('aria-pressed', 'false'); $('pausebtn').setAttribute('aria-label', 'Pause level'); announce((dailyMode ? 'Daily challenge. ' : hard ? 'Glitch mode. ' : '') + 'Level ' + (i + 1) + ', ' + DEFS[i].name + ' started.');
    inp.l = inp.r = inp.j = inp.d = false; $('bd').classList.toggle('hidden', !lv.dash); syncBtns(); hud(); $('hint').classList.remove('show'); hintT = 0;
  }
  // ---------- tutorial hints (shown once per tip, in-level) ----------
  var HINTS = {
    0: [{ x: 0, t: 'Hold JUMP for a high jump, tap for a hop' }, { x: 17, t: 'Spikes and pits reset you instantly' }],
    2: [{ x: 0, t: 'Yellow pads launch you high' }],
    4: [{ x: 0, t: 'Press JUMP against a wall to wall-jump' }],
    5: [{ x: 0, t: 'Flags are checkpoints' }],
    10: [{ x: 0, t: 'Crumble blocks vanish after you land. Keep moving!' }],
    25: [{ x: 0, t: 'Green belts carry you. Run against them!' }],
    55: [{ x: 0, t: 'Press DASH (X / » button) in the air to cross wide gaps. Recharges on landing' }],
    15: [{ x: 0, t: 'Pink and cyan blocks swap every beat. Don\'t get crushed!' }]
  };
  var hintT = 0;
  function showHint(t) { var e = $('hint'); e.textContent = t; e.classList.add('show'); hintT = 3.2; }
  function checkHints() {
    var list = !hard && HINTS[cur]; if (!list) return;
    save.tips = save.tips || {};
    for (var i = 0; i < list.length; i++) {
      var key = cur + '_' + i;
      if (!save.tips[key] && s.x / T >= list[i].x) { save.tips[key] = 1; persist(); showHint(list[i].t); break; }
    }
  }
  function hud() {
    $('htime').textContent = s.time.toFixed(1) + 's'; $('hdeaths').textContent = '☠ ' + s.deaths;
    $('hcoins').textContent = '● ' + s.ncoins + '/' + lv.coins.length;
    var cp = GH.checkpointProgress(lv, s);
    $('hcheckpoint').textContent = cp.text;
    $('hcheckpoint').classList.toggle('hidden', !cp.active);
    var record = hard && !dailyMode ? hardRecord(cur) : save.best[cur];
    var pb = record ? record.time : NaN, pace = GH.bestPace(s.time, pb);
    $('hbest').textContent = pace.text; $('hbest').className = pace.kind === 'behind' ? 'behind' : pace.kind === 'fresh' ? 'fresh' : '';
    var goal = GH.nextGoal(lv, s); $('hgoal').textContent = goal.text; $('hgoal').className = goal.kind === 'missed' ? 'missed' : '';
    var sx = lv.start ? lv.start.x : 0, gx = lv.exit ? lv.exit.c * T + T / 2 : lv.W * T;
    var pct = Math.max(0, Math.min(100, (s.x - sx) / Math.max(1, gx - sx) * 100));
    $('hfill').style.width = pct.toFixed(1) + '%'; $('hprogress').setAttribute('aria-valuenow', Math.round(pct));
  }
  function pauseSummary() {
    var sx = lv.start ? lv.start.x : 0, gx = lv.exit ? lv.exit.c * T + T / 2 : lv.W * T;
    var pct = Math.round(Math.max(0, Math.min(100, (s.x - sx) / Math.max(1, gx - sx) * 100)));
    var cp = GH.checkpointProgress(lv, s), goal = GH.nextGoal(lv, s);
    $('pstats').textContent = (dailyMode ? 'DAILY · ' : hard ? 'GLITCH · ' : '') + 'L' + (cur + 1) + ' · ' + pct + '% · ' + s.time.toFixed(1) + 's · ● ' + s.ncoins + '/' + lv.coins.length + ' · ☠ ' + s.deaths + (cp.active ? ' · ' + cp.text : '') + ' · ' + goal.text;
  }

  // ---------- input ----------
  var keys = {};
  function kmap(e, v) {
    var k = e.key, used = true;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') inp.l = v;
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') inp.r = v;
    else if (k === ' ' || k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'z' || k === 'Z') inp.j = v;
    else if (k === 'x' || k === 'X' || k === 'Shift' || k === 'c' || k === 'C') inp.d = v;
    else if (v && (k === 'Escape' || k === 'p')) togglePause();
    else if (v && k === 'r' && state === 'play') startLevel(cur);
    else used = false;
    if (used) { e.preventDefault(); syncBtns(); }
  }
  window.addEventListener('keydown', function (e) { kmap(e, true); });
  window.addEventListener('keyup', function (e) { kmap(e, false); });
  function releaseInput() { inp.l = inp.r = inp.j = inp.d = false; syncBtns(); }
  window.addEventListener('blur', releaseInput);
  function syncBtns() { $('bl').classList.toggle('on', inp.l); $('br').classList.toggle('on', inp.r); $('bj').classList.toggle('on', inp.j); $('bd').classList.toggle('on', inp.d); $('bl').setAttribute('aria-pressed', String(inp.l)); $('br').setAttribute('aria-pressed', String(inp.r)); $('bj').setAttribute('aria-pressed', String(inp.j)); $('bd').setAttribute('aria-pressed', String(inp.d)); }
  function bindBtn(id, key) {
    var b = $(id);
    function dn(e) { e.preventDefault(); inp[key] = true; try { b.setPointerCapture(e.pointerId); } catch (x) {} syncBtns(); }
    function up(e) { e.preventDefault(); inp[key] = false; syncBtns(); }
    b.addEventListener('pointerdown', dn); b.addEventListener('pointerup', up);
    b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
    b.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }
  bindBtn('bl', 'l'); bindBtn('br', 'r'); bindBtn('bj', 'j'); bindBtn('bd', 'd');

  function togglePause() {
    if (state === 'play') {
      hud(); pauseSummary(); releaseInput();
      state = 'pause'; show('pause'); $('pausebtn').setAttribute('aria-pressed', 'true'); $('pausebtn').setAttribute('aria-label', 'Resume level'); $('skip').classList.toggle('hidden', dailyMode || hard || !(s.deaths >= 8 && !save.best[cur])); announce('Paused. ' + $('pstats').textContent);
    } else if (state === 'pause') { state = 'play'; show(null); last = 0; releaseInput(); $('pausebtn').setAttribute('aria-pressed', 'false'); $('pausebtn').setAttribute('aria-label', 'Pause level'); $('pausebtn').focus(); announce('Resumed level ' + (cur + 1) + '.'); }
  }
  $('pausebtn').onclick = togglePause; $('resume').onclick = togglePause;
  $('restartbtn').onclick = function () { if (state === 'play' || state === 'pause') startLevel(cur); };
  $('restart').onclick = function () { startLevel(cur); };
  $('quit').onclick = toSelect; $('wquit').onclick = toSelect; $('back').onclick = toMenu;
  $('play').onclick = function () { actx(); music(); toSelect(); };
  $('continue').onclick = function () { actx(); music(); startLevel(nextLevel()); };
  $('again').onclick = function () { startLevel(cur); };
  $('next').onclick = function () { if (dailyMode) { toMenu(); return; } if (cur + 1 < DEFS.length) startLevel(cur + 1); else toSelect(); };
  $('daily').onclick = function () { startDaily(); };
  $('hardtog').onclick = function () { hard = !hard; toSelect(); };
  $('skip').onclick = function () {
    showRewarded(function (ok) {
      if (!ok || hard || dailyMode) return;
      if (!save.best[cur]) save.best[cur] = { stars: 1, time: 999, coins: 0, skipped: true };
      persist(); if (cur + 1 < DEFS.length) startLevel(cur + 1); else toSelect();
    });
  };
  $('skin').onclick = function () {
    var i = save.skin || 0;
    for (var k = 1; k <= SKINS.length; k++) {
      var j = (i + k) % SKINS.length;
      if (skinOk(j)) { save.skin = j; persist(); $('skin').textContent = skinLabel(); return; }
    }
  };
  $('skin').oncontextmenu = function (e) { e.preventDefault(); };
  $('skin').addEventListener('click', function () {
    var i = save.skin || 0, nx = SKINS[(i + 1) % SKINS.length];
    var lock = SKINS.filter(function (s, j) { return !skinOk(j); })[0];
    if (lock) toast('Next skin ' + lock.n + ': ' + lock.need + ' coins');
  });
  $('achbtn').onclick = function () {
    var done = save.ach || {}, h = '';
    GHAch.DEFS.forEach(function (a) { h += '<div class="ach' + (done[a.id] ? ' got' : '') + '"><b>' + (done[a.id] ? '🏆 ' : '🔒 ') + a.n + '</b><span>' + a.d + '</span></div>'; });
    $('alist').innerHTML = h; show('achp');
  };
  $('achback').onclick = function () { show('menu'); };
  $('mute').onclick = function () { save.mute = !save.mute; persist(); $('mute').textContent = save.mute ? '🔇 Sound off' : '🔊 Sound on'; };
  $('mute').textContent = save.mute ? '🔇 Sound off' : '🔊 Sound on';
  function setToggles() { $('musicbtn').textContent = save.nomusic ? '🎵 Music off' : '🎵 Music on'; $('vibbtn').textContent = save.novib ? '📳 Vibration off' : '📳 Vibration on'; }
  $('musicbtn').onclick = function () { save.nomusic = !save.nomusic; persist(); setToggles(); };
  $('vibbtn').onclick = function () { save.novib = !save.novib; persist(); setToggles(); if (!save.novib) buzz(20); };
  setToggles();
  document.addEventListener('visibilitychange', function () { if (document.hidden && state === 'play') togglePause(); });

  // ---------- effects ----------
  function burst(x, y, n, col, spd, life) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * 6.283, v = (0.3 + Math.random()) * (spd || 80);
      parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, life: (life || 0.5) * (0.5 + Math.random()), max: life || 0.5, c: col });
    }
  }
  function handleEvents() {
    var px = s.x + 5, py = s.y + 7;
    for (var i = 0; i < s.ev.length; i++) {
      var e = s.ev[i];
      if (e === 'jump') { SFX.jump(); burst(px, s.y + 14, 5, '#7df9ff', 40, 0.3); squash.x = 0.75; squash.y = 1.3; }
      else if (e === 'dash') { SFX.dash(); buzz(10); burst(px - s.ddir * 6, py, 12, '#ff3d9a', 90, 0.35); squash.x = 1.35; squash.y = 0.75; }
      else if (e === 'wall') { SFX.wall(); burst(px - s.face * -5, py, 5, '#ffffff', 40, 0.3); squash.x = 0.8; squash.y = 1.25; }
      else if (e === 'land') { SFX.land(); burst(px, s.y + 14, 4, '#9aa3d6', 30, 0.25); squash.x = 1.3; squash.y = 0.7; }
      else if (e === 'pad') { SFX.pad(); buzz(15); burst(px, s.y + 14, 10, '#ffd166', 70, 0.4); squash.x = 0.7; squash.y = 1.4; }
      else if (e === 'crumble') { SFX.land(); burst(px, s.y + 14, 5, '#c89b5a', 35, 0.3); }
      else if (e === 'coin') { SFX.coin(); burst(px, py, 8, '#ffd166', 60, 0.4); hud(); }
      else if (e === 'cp') { SFX.cp(); toast('Checkpoint'); announce('Checkpoint reached.'); burst(px, py, 14, '#7dff9a', 70, 0.5); }
      else if (e.indexOf('die:') === 0) { SFX.die(); buzz(60); shake = 0.35; flash = 0.25; burst(px, py, 26, '#ff3d9a', 130, 0.7); burst(px, py, 12, '#ffffff', 90, 0.5); showHint(GH.deathTip(e.slice(4))); announce('You died. ' + GH.deathTip(e.slice(4))); respawnT = 0.45; }
      else if (e === 'win') { SFX.win(); buzz(30); burst(px, py, 40, '#7df9ff', 140, 0.9); winT = 0.9; }
    }
    s.ev.length = 0;
  }
  function onWin() {
    state = 'win'; var st = GH.stars(lv, s), key = cur, prev = save.best[key];
    var flawless = s.deaths === 0, tag = hard ? 'hard' : 'normal', isDailyRun = dailyMode, isHardRun = hard && !isDailyRun, hardPrev = isHardRun ? hardRecord(key) : null;
    var newBestTime = !hard && (!prev || !Number.isFinite(prev.time) || s.time < prev.time);
    var newBestDeaths = !hard && (!prev || !Number.isFinite(prev.deaths) || s.deaths < prev.deaths);
    var newHardBestTime = isHardRun && (!hardPrev || !Number.isFinite(hardPrev.time) || s.time < hardPrev.time);
    var newHardBestDeaths = isHardRun && (!hardPrev || !Number.isFinite(hardPrev.deaths) || s.deaths < hardPrev.deaths);
    if (isHardRun) save.hard[key] = { time: Math.min(hardPrev && Number.isFinite(hardPrev.time) ? hardPrev.time : s.time, s.time), deaths: Math.min(hardPrev && Number.isFinite(hardPrev.deaths) ? hardPrev.deaths : s.deaths, s.deaths) };
    else if (!isDailyRun) save.best[key] = { stars: Math.max(st, prev ? prev.stars : 0), time: Math.min(prev && Number.isFinite(prev.time) ? prev.time : s.time, s.time), coins: Math.max(s.ncoins, prev ? prev.coins || 0 : 0), deaths: Math.min(prev && Number.isFinite(prev.deaths) ? prev.deaths : s.deaths, s.deaths) };
    if (flawless && !isDailyRun) save.nodeaths++;
    var dtxt = '';
    if (dailyMode) {
      var d = save.daily = save.daily || {}, td = todayStr(), y = new Date(Date.now() - 864e5);
      var ys = y.getFullYear() + '-' + (y.getMonth() + 1) + '-' + y.getDate();
      if (d.last !== td) { d.streak = d.last === ys ? (d.streak || 0) + 1 : 1; d.last = td; d.best = s.time; dtxt = '  ·  🔥 streak ' + d.streak; }
      else if (s.time < d.best) { d.best = s.time; dtxt = '  ·  NEW DAILY BEST'; }
    }
    var replayGoal = (!hard && !dailyMode) ? GH.clearGoal(lv, s) : null;
    var newAch = GHAch.check(save, DEFS.length);
    newAch.forEach(function (a, i) { setTimeout(function () { toast('🏆 ' + a.n); }, 600 + i * 2000); });
    persist(); maybeInterstitialIfNeeded();
    $('wtitle').textContent = dailyMode ? 'DAILY DONE! 📅' : hard ? 'GLITCHED! ☠' : 'CLEAR!';
    $('wstars').innerHTML = [0, 1, 2].map(function (i) { return '<img class="star" alt="" src="assets/' + (i < st ? 'ui-star' : 'ui-star-empty') + '.png">'; }).join('');
    $('wstats').textContent = s.time.toFixed(1) + 's (par ' + lv.par + 's)  ·  ● ' + s.ncoins + '/' + lv.coins.length + '  ·  ☠ ' + s.deaths + (isHardRun ? '  ·  best ' + hardRecord(key).time.toFixed(1) + 's / ☠ ' + hardRecord(key).deaths : hard ? '' : '  ·  best ☠ ' + save.best[key].deaths) + dtxt;
    $('wbadge').textContent = (newBestTime || newHardBestTime ? '⚡ NEW BEST · ' : '') + (newBestDeaths || newHardBestDeaths ? '☠ LOWEST DEATHS · ' : '') + (flawless ? '✦ FLAWLESS ✦' : '');
    $('wgoal').textContent = replayGoal ? replayGoal.text : '';
    $('wgoal').className = replayGoal && replayGoal.kind === 'mastered' ? 'mastered' : '';
    $('next').textContent = dailyMode ? 'MENU' : cur + 1 < DEFS.length ? 'NEXT' : 'LEVELS';
    announce((dailyMode ? 'Daily challenge complete. ' : hard ? 'Glitch clear. ' : 'Level clear. ') + s.time.toFixed(1) + ' seconds, ' + s.ncoins + ' of ' + lv.coins.length + ' coins, ' + s.deaths + ' deaths.');
    setPlaying(false); show('win');
  }
  function maybeInterstitialIfNeeded() { adRuns++; maybeInterstitial(); }

  // ---------- update ----------
  function update(dt) {
    clock += dt; shake = Math.max(0, shake - dt); flash = Math.max(0, flash - dt);
    squash.x += (1 - squash.x) * Math.min(1, dt * 14); squash.y += (1 - squash.y) * Math.min(1, dt * 14);
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i]; p.life -= dt; if (p.life <= 0) { parts.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt;
    }
    if (state !== 'play' && state !== 'win') return;
    if (state === 'play') {
      acc += dt; var n = 0;
      while (acc >= GH.DT && n < 6) {
        GH.step(s, { dir: (inp.r ? 1 : 0) - (inp.l ? 1 : 0), jump: inp.j, dash: inp.d }); acc -= GH.DT; n++;
        if (s.ev.length) handleEvents();
        if (!s.dead && !s.won && n % 3 === 0 && (Math.abs(s.vx) > 40 || Math.abs(s.vy) > 150)) trail.push({ x: s.x, y: s.y, a: 0.5 });
      }
      if (acc > 0.1) acc = 0;
      if (s.dead) { respawnT -= dt; if (respawnT <= 0) { GH.respawn(s); flash = 0.2; } }
      if (s.won) { winT -= dt; if (winT <= 0) onWin(); }
      hud(); checkHints();
      if (hintT > 0 && (hintT -= dt) <= 0) $('hint').classList.remove('show');
    }
    for (i = trail.length - 1; i >= 0; i--) { trail[i].a -= dt * 2; if (trail[i].a <= 0) trail.splice(i, 1); }
    // camera
    var tx = s.x + 5 - viewW / 2 + s.face * 18, ty = s.y - viewH * 0.55;
    var maxX = lv.W * T - viewW, maxY = lv.H * T - viewH;
    tx = maxX < 0 ? maxX / 2 : Math.max(0, Math.min(maxX, tx));
    ty = maxY < 0 ? maxY / 2 : Math.max(0, Math.min(maxY, ty));
    cam.x += (tx - cam.x) * Math.min(1, dt * 8); cam.y += (ty - cam.y) * Math.min(1, dt * 6);
  }

  // ---------- render ----------
  var W = 0, H = 0, sc = 1, viewW = 0, viewH = 0;
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    W = cv.width = Math.floor(innerWidth * dpr); H = cv.height = Math.floor(innerHeight * dpr);
    sc = Math.min(W / 224, H / 160); if (innerWidth > innerHeight) sc = Math.max(sc, H / 190);
    viewW = W / sc; viewH = H / sc;
  }
  window.addEventListener('resize', resize); resize();

  var IM = (window.GH_ART || { img: {} }).img;
  function pic(n, x, y, w, h) { var i = IM[n]; if (!i) return false; cx.drawImage(i, x, y, w, h); return true; }
  function picFlip(n, x, y, w, h, fx, fy) {
    var i = IM[n]; if (!i) return false;
    cx.save(); cx.translate(x + (fx ? w : 0), y + (fy ? h : 0)); cx.scale(fx ? -1 : 1, fy ? -1 : 1); cx.drawImage(i, 0, 0, w, h); cx.restore(); return true;
  }
  function parallax(n, f, a, yo) {
    var i = IM[n]; if (!i) return;
    var h = H * 1.08, w = h * i.width / i.height, ox = -((cam.x * f * sc) % w); if (ox > 0) ox -= w;
    var oy = -(cam.y * f * 0.3 * sc) % (H * 0.08) - (yo || 0);
    cx.globalAlpha = a;
    for (var x = ox; x < W; x += w) cx.drawImage(i, x, oy, w + 1, h);
    cx.globalAlpha = 1;
  }
  var WORLD_HUE = [200, 25, 300, 165, 130, 190, 140, 0, 55, 345, 270, 320];
  function worldTint() {
    var wi = Math.max(0, WORLDS.findIndex(function (w) { return cur >= w[1] && cur < w[2]; }));
    if (wi === 0) return;
    cx.globalCompositeOperation = 'color'; cx.globalAlpha = 0.28;
    cx.fillStyle = 'hsl(' + WORLD_HUE[wi] + ',80%,50%)'; cx.fillRect(0, 0, W, H);
    cx.globalCompositeOperation = 'source-over'; cx.globalAlpha = 1;
  }
  function drawBG() {
    var g = cx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0b0f24'); g.addColorStop(1, '#2a0f45');
    cx.fillStyle = g; cx.fillRect(0, 0, W, H);
    if (!lv) return;
    if (IM['bg-far']) { parallax('bg-far', 0.08, 0.55); parallax('bg-mid', 0.22, 0.8); worldTint(); cx.fillStyle = 'rgba(8,10,28,0.58)'; cx.fillRect(0, 0, W, H); return; }
    cx.strokeStyle = '#7df9ff'; cx.globalAlpha = 0.06; cx.lineWidth = 1;
    var gs = 32 * sc, ox = -((cam.x * 0.4 * sc) % gs), oy = -((cam.y * 0.4 * sc) % gs);
    cx.beginPath();
    for (var x = ox; x < W; x += gs) { cx.moveTo(x, 0); cx.lineTo(x, H); }
    for (var y = oy; y < H; y += gs) { cx.moveTo(0, y); cx.lineTo(W, y); }
    cx.stroke(); cx.globalAlpha = 1;
  }
  function spike(x, y, down) {
    cx.beginPath();
    for (var i = 0; i < 2; i++) {
      var bx = x + i * 8;
      if (down) { cx.moveTo(bx, y); cx.lineTo(bx + 8, y); cx.lineTo(bx + 4, y + 9); }
      else { cx.moveTo(bx, y + T); cx.lineTo(bx + 8, y + T); cx.lineTo(bx + 4, y + T - 9); }
    }
    cx.closePath(); cx.fill();
  }
  function drawWorld() {
    var c0 = Math.max(0, Math.floor(cam.x / T)), c1 = Math.min(lv.W - 1, Math.ceil((cam.x + viewW) / T));
    var r0 = Math.max(0, Math.floor(cam.y / T)), r1 = Math.min(lv.H - 1, Math.ceil((cam.y + viewH) / T));
    var r, c, k;
    for (r = r0; r <= r1; r++) for (c = c0; c <= c1; c++) {
      k = lv.tiles[r][c];
      if (k === 1) {
        var top = r === 0 || lv.tiles[r - 1][c] !== 1;
        if (pic('tile-stone', c * T, r * T, T, T)) { cx.fillStyle = 'rgba(11,15,36,0.78)'; cx.fillRect(c * T, r * T, T, T); if (c > 0 && lv.tiles[r][c - 1] !== 1) { cx.fillStyle = 'rgba(125,249,255,0.45)'; cx.fillRect(c * T, r * T, 1, T); } if (c < lv.W - 1 && lv.tiles[r][c + 1] !== 1) { cx.fillStyle = 'rgba(125,249,255,0.45)'; cx.fillRect(c * T + T - 1, r * T, 1, T); } if (top) { cx.fillStyle = '#7df9ff'; cx.fillRect(c * T, r * T, T, 2); cx.fillStyle = 'rgba(125,249,255,0.25)'; cx.fillRect(c * T, r * T + 2, T, 2); } continue; }
        cx.fillStyle = '#1c2350'; cx.fillRect(c * T, r * T, T, T);
        cx.fillStyle = '#262f6b'; cx.fillRect(c * T + 1, r * T + 1, T - 2, T - 2);
        if (top) { cx.fillStyle = '#7df9ff'; cx.fillRect(c * T, r * T, T, 2); }
        if (c > 0 && lv.tiles[r][c - 1] !== 1) { cx.fillStyle = '#4fb8d8'; cx.fillRect(c * T, r * T, 1, T); }
        if (c < lv.W - 1 && lv.tiles[r][c + 1] !== 1) { cx.fillStyle = '#4fb8d8'; cx.fillRect(c * T + T - 1, r * T, 1, T); }
      } else if (k === 4) {
        var ct = s.cr[r * 1000 + c], shk = ct === undefined ? 0 : Math.sin(clock * 80) * 1.2;
        if (ct === undefined || ct < GH.CR_GONE) {
          if (pic('tile-crumble', c * T + shk, r * T, T, T)) continue;
          cx.fillStyle = '#5a3d1e'; cx.fillRect(c * T + shk, r * T, T, T);
          cx.fillStyle = '#8a6030'; cx.fillRect(c * T + 1 + shk, r * T + 1, T - 2, T - 2);
          cx.fillStyle = '#ffb454'; cx.fillRect(c * T + shk, r * T, T, 2);
          cx.fillStyle = '#5a3d1e'; cx.fillRect(c * T + 4 + shk, r * T + 5, 8, 1); cx.fillRect(c * T + 7 + shk, r * T + 9, 1, 5);
        }
      } else if (k === 5 || k === 6) {
        var on = GH.phaseOn(lv, s.t, k), left = lv.phase - (s.t % lv.phase), warn = on && left < 0.4 && Math.floor(clock * 20) % 2;
        var col = k === 5 ? '#ff3d9a' : '#7df9ff';
        if (on && !warn && pic(k === 5 ? 'tile-phase-a' : 'tile-phase-b', c * T, r * T, T, T)) continue;
        if (on && !warn) { cx.fillStyle = col; cx.fillRect(c * T, r * T, T, T); cx.fillStyle = '#10142e'; cx.fillRect(c * T + 3, r * T + 3, T - 6, T - 6); cx.fillStyle = col; cx.fillRect(c * T + 5, r * T + 5, T - 10, T - 10); }
        else { cx.strokeStyle = col; cx.globalAlpha = 0.45; cx.strokeRect(c * T + 2.5, r * T + 2.5, T - 5, T - 5); cx.globalAlpha = 1; }
      } else if ((k === 7 || k === 8) && picFlip('tile-belt-right', c * T, r * T, T, T, k === 8, false)) {
      } else if (k === 7 || k === 8) {
        cx.fillStyle = '#1c2350'; cx.fillRect(c * T, r * T, T, T);
        cx.fillStyle = '#3a2f6b'; cx.fillRect(c * T + 1, r * T + 1, T - 2, T - 2);
        cx.fillStyle = '#b6ff3d'; cx.fillRect(c * T, r * T, T, 2);
        var dr = k === 7 ? 1 : -1, off = ((clock * 30 * dr) % 8 + 8) % 8;
        cx.fillStyle = '#b6ff3d';
        for (var ax = -8; ax < T; ax += 8) { var axx = ax + off; if (axx < 0 || axx > T - 4) continue; cx.fillRect(c * T + axx, r * T + 7, 2, 3); cx.fillRect(c * T + axx + (dr > 0 ? 2 : -1), r * T + 6, 1, 5); }
      } else if (k === 9 && pic('tile-ice', c * T, r * T, T, T)) {
      } else if (k === 9) {
        cx.fillStyle = '#2a5a8a'; cx.fillRect(c * T, r * T, T, T);
        cx.fillStyle = '#8fe3ff'; cx.fillRect(c * T + 1, r * T + 1, T - 2, T - 2);
        cx.fillStyle = '#e8fbff'; cx.fillRect(c * T, r * T, T, 2); cx.fillRect(c * T + 3, r * T + 5, 5, 1); cx.fillRect(c * T + 9, r * T + 10, 4, 1);
      } else if (k === 10 || k === 11) {
        var wd = k === 10 ? -1 : 1;
        cx.globalAlpha = 0.85; var wimg = pic(k === 10 ? 'wind-up' : 'wind-down', c * T, r * T, T, T); cx.globalAlpha = 1; if (wimg) continue;
        cx.fillStyle = k === 10 ? 'rgba(125,255,200,0.12)' : 'rgba(255,120,160,0.12)'; cx.fillRect(c * T, r * T, T, T);
        cx.fillStyle = k === 10 ? '#7dffc8' : '#ff7ba0';
        for (var wi = 0; wi < 2; wi++) { var wy = (((clock * 40 * wd + wi * 8 + c * 5) % T) + T) % T; cx.fillRect(c * T + 3 + wi * 7, r * T + wy, 1, 4); cx.fillRect(c * T + 2 + wi * 7, r * T + wy + (wd < 0 ? 1 : 2), 3, 1); }
      } else if (k === 2 || k === 3) { if (!picFlip('spike', c * T, r * T, T, T, false, k === 3)) { cx.fillStyle = '#ff3d9a'; spike(c * T, r * T, k === 3); } }
    }
    // pads
    lv.pads.forEach(function (p) {
      var bob = Math.sin(clock * 10) * 1; if (pic('spring', p.c * T, p.r * T + bob, T, T)) return; cx.fillStyle = '#ffd166'; cx.fillRect(p.c * T + 1, p.r * T + 10 + bob, T - 2, 6 - bob);
      cx.fillStyle = '#fff'; cx.fillRect(p.c * T + 3, p.r * T + 9 + bob, T - 6, 2);
    });
    // checkpoints
    lv.cps.forEach(function (p) {
      var on = s.cp.x === p.x; cx.globalAlpha = on ? 1 : 0.5; var cpok = pic('checkpoint', p.c * T + 4, p.r * T, 8, 16); cx.globalAlpha = 1; if (cpok) return; cx.fillStyle = '#aaa'; cx.fillRect(p.c * T + 7, p.r * T + 2, 2, 14);
      cx.fillStyle = on ? '#7dff9a' : '#556'; cx.beginPath(); cx.moveTo(p.c * T + 9, p.r * T + 2); cx.lineTo(p.c * T + 16, p.r * T + 5); cx.lineTo(p.c * T + 9, p.r * T + 8); cx.fill();
    });
    // coins
    lv.coins.forEach(function (p) {
      if (s.got[p.c + ',' + p.r]) return;
      var w = Math.abs(Math.cos(clock * 4 + p.c)) * 5 + 1;
      if (IM.coin) { var cw = 12 * (0.35 + 0.65 * Math.abs(Math.cos(clock * 4 + p.c))); cx.drawImage(IM.coin, p.c * T + 8 - cw / 2, p.r * T + 2 + Math.sin(clock * 3 + p.c) * 1.5, cw, 12); return; }
      cx.fillStyle = '#ffd166'; cx.beginPath(); cx.ellipse(p.c * T + 8, p.r * T + 8 + Math.sin(clock * 3 + p.c) * 1.5, w, 5.5, 0, 0, 6.283); cx.fill();
    });
    // exit
    if (lv.exit) {
      var ex = lv.exit.c * T + 8, ey = lv.exit.r * T + 8;
      if (IM.portal) { var pu = 1 + Math.sin(clock * 5) * 0.05; cx.drawImage(IM.portal, ex - 8 * pu, ey - 12 * pu, 16 * pu, 24 * pu); } else
      for (var i = 0; i < 3; i++) { cx.strokeStyle = i % 2 ? '#ff3d9a' : '#7df9ff'; cx.lineWidth = 2; cx.beginPath(); cx.ellipse(ex, ey, 5 + i * 2, 8 + i * 1.5, clock * (1 + i * 0.5), 0, 6.283); cx.stroke(); }
    }
    // moving platforms
    lv.movers.forEach(function (m) {
      var p = GH.movPos(m, s.t);
      cx.fillStyle = '#ffd166'; cx.fillRect(p.x - m.w / 2, p.y, m.w, 5);
      cx.fillStyle = '#ff8a3d'; cx.fillRect(p.x - m.w / 2, p.y + 5, m.w, 2);
      cx.fillStyle = '#fff3c4'; cx.fillRect(p.x - m.w / 2, p.y, m.w, 1);
    });
    // saws
    lv.saws.forEach(function (w) {
      var p = GH.sawPos(w, s.t); cx.save(); cx.translate(p.x, p.y); cx.rotate(clock * 12);
      if (IM.saw) { cx.drawImage(IM.saw, -9, -9, 18, 18); cx.restore(); return; }
      cx.fillStyle = '#d7dbff'; cx.beginPath();
      for (var j = 0; j < 12; j++) { var a = j / 12 * 6.283, rr = j % 2 ? 6 : 8.5; cx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      cx.closePath(); cx.fill(); cx.fillStyle = '#ff3d9a'; cx.beginPath(); cx.arc(0, 0, 2.5, 0, 6.283); cx.fill(); cx.restore();
    });
    // trail
    trail.forEach(function (t) { cx.globalAlpha = t.a * 0.5; cx.fillStyle = SKINS[save.skin || 0].t; cx.fillRect(t.x, t.y, 10, 14); });
    cx.globalAlpha = 1;
    // player
    if (!s.dead) {
      var px = s.x + 5, py = s.y + 14;
      cx.save(); cx.translate(px, py); cx.scale(squash.x, squash.y);
      var fr = IM[GH_ART.playerFrame(s, clock)];
      if (fr) {
        cx.filter = SKIN_FILTER[save.skin || 0] || 'none';
        cx.scale(s.face >= 0 && !(s.wall === 1 && !s.ground) ? 1 : -1, 1);
        cx.drawImage(fr, -12, -23, 24, 24); cx.filter = 'none'; cx.restore();
      } else {
      cx.fillStyle = SKINS[save.skin || 0].c; cx.fillRect(-5, -14, 10, 14);
      if (Math.random() < 0.04) { cx.fillStyle = '#ff3d9a'; cx.fillRect(-5, -14 + Math.random() * 10, 10, 2); }
      cx.fillStyle = '#0b0f24'; cx.fillRect(s.face > 0 ? 0 : -4, -11, 4, 4);
      cx.fillStyle = '#fff'; cx.fillRect(s.face > 0 ? 2 : -4, -10, 2, 2);
      cx.restore();
      }
    } else if (IM['player-death-1'] && respawnT > 0) {
      var dfr = IM[GH_ART.deathFrame(0.45 - respawnT)];
      if (dfr) { cx.globalAlpha = Math.min(1, respawnT / 0.2); cx.drawImage(dfr, s.x + 5 - 14, s.y + 14 - 25, 28, 28); cx.globalAlpha = 1; }
    }
    parts.forEach(function (p) { cx.globalAlpha = Math.max(0, p.life / p.max); cx.fillStyle = p.c; cx.fillRect(p.x - 1, p.y - 1, 2.5, 2.5); });
    cx.globalAlpha = 1;
  }
  function frame(now) {
    requestAnimationFrame(frame);
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
    if (state === 'pause') { last = 0; }
    update(dt);
    cx.setTransform(1, 0, 0, 1, 0, 0);
    drawBG();
    if (lv && state !== 'menu' && state !== 'select') {
      var sx = shake > 0 && !REDUCED ? (Math.random() - 0.5) * shake * 16 : 0, sy = shake > 0 && !REDUCED ? (Math.random() - 0.5) * shake * 16 : 0;
      cx.setTransform(sc, 0, 0, sc, (-cam.x + sx) * sc, (-cam.y + sy) * sc);
      drawWorld();
      cx.setTransform(1, 0, 0, 1, 0, 0);
      if (flash > 0 && !REDUCED) { cx.fillStyle = 'rgba(255,255,255,' + Math.min(0.35, flash) + ')'; cx.fillRect(0, 0, W, H); }
    }
  }
  toMenu();
  requestAnimationFrame(frame);
  window.__gh = { startLevel: startLevel, get s() { return s; }, inp: inp };
})();
