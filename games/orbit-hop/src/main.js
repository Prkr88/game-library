// Orbit Hop — rendering, input, audio, persistence (platform layer).
(function () {
  'use strict';
  if ('serviceWorker' in navigator && (location.protocol === 'http:' || location.protocol === 'https:')) {
    navigator.serviceWorker.register('./sw.js').catch(function () {});
  }
  var L = window.OrbitLogic;
  var cv = document.getElementById('game'), ctx = cv.getContext('2d');
  var $ = function (id) { return document.getElementById(id); };
  var SKINS = [
    { sprite: 'comet', id: 'comet', name: 'Comet', cost: 0, color: '#ffffff', trail: '#7fd7ff' },
    { sprite: 'comet-skin-1', id: 'ember', name: 'Ember', cost: 30, color: '#ffb347', trail: '#ff5e3a' },
    { sprite: 'comet-skin-2', id: 'mint', name: 'Mint', cost: 60, color: '#b6ffcf', trail: '#2ee59d' },
    { sprite: 'comet-skin-3', id: 'violet', name: 'Violet', cost: 100, color: '#e3c2ff', trail: '#a15cff' },
    { sprite: 'comet-skin-4', id: 'gold', name: 'Gold', cost: 200, color: '#fff2a8', trail: '#ffd000' }
  ];

  // ---------- sprites: owner PNG (assets/) first, generated fallback (assets/gen/) second ----------
  var IMGS = {};
  function loadImg(name) {
    var e = IMGS[name] = { img: null, ok: false };
    function tryUrl(urls) {
      if (!urls.length) return;
      var im = new Image();
      im.onload = function () { e.img = im; e.ok = true; };
      im.onerror = function () { tryUrl(urls.slice(1)); };
      im.src = urls[0];
    }
    tryUrl(['assets/' + name + '.png', 'assets/gen/' + name + '.png']);
  }
  function spr(name) { var e = IMGS[name]; return e && e.ok ? e.img : null; }
  ['planet-1', 'planet-2', 'planet-3', 'planet-4', 'planet-5', 'planet-6', 'planet-7', 'planet-8', 'planet-shrink',
    'asteroid-1', 'asteroid-2', 'asteroid-3', 'blackhole', 'star-pickup', 'comet', 'comet-skin-1', 'comet-skin-2',
    'comet-skin-3', 'comet-skin-4', 'bg-nebula-1', 'bg-nebula-2', 'bg-nebula-3', 'fx-explosion-1', 'fx-explosion-2',
    'fx-explosion-3', 'fx-explosion-4', 'bg-stars', 'orbit-ring', 'laser-gate'].forEach(loadImg);
  (function () { var pb = new Image(); pb.onload = function () { $('btnPlay').classList.add('art'); }; pb.src = 'assets/btn-play.png'; })();
  var boom = null, lastT = 0, heading = 0, lastPl = null;

  // ---------- save ----------
  var storedSave = {};
  try { storedSave = JSON.parse(localStorage.getItem('orbithop') || '{}'); } catch (e) {}
  var save = window.OrbitSave.normalize(storedSave);
  var M = window.OrbitMissions;
  var D = window.OrbitDaily;
  var A = window.OrbitAch;
  function persist() { try { localStorage.setItem('orbithop', JSON.stringify(save)); } catch (e) {} }
  if (!save.missions.done.length && Object.keys(save.missions.prog).length === 0) save.missions = M.fresh();
  if (!save.ach.done.length && Object.keys(save.ach.prog).length === 0) save.ach = A.fresh();
  if (!save.depthByMode || typeof save.depthByMode !== 'object') save.depthByMode = { normal: save.bestPlanet || 0, daily: 0, hard: 0 };
  ['normal', 'daily', 'hard'].forEach(function (k) { save.depthByMode[k] = Math.max(0, Number(save.depthByMode[k]) || 0); });
  function skin() { return SKINS.find(function (s) { return s.id === save.skin; }) || SKINS[0]; }

  // ---------- audio (src/audio.js) ----------
  var AU = window.OrbitAudio;
  AU.setMuted(save.muted);
  var sfx = {
    jump: function () { AU.sfx.jump(); },
    land: function (c) { AU.sfx.land(c); },
    star: function () { AU.sfx.star(); },
    die: function () { AU.sfx.die(); },
    shield: function () { AU.sfx.shield(); }
  };
  var settings = { music: true, sfx: true, haptics: true };
  try { var ss = JSON.parse(localStorage.getItem('orbithopSettings')); if (ss) Object.keys(settings).forEach(function (k) { if (typeof ss[k] === 'boolean') settings[k] = ss[k]; }); } catch (e) {}
  AU.setChannels({ sfxOff: !settings.sfx, musicOff: !settings.music });
  function startMusic() { AU.setMuted(save.muted); AU.startMusic(); }
  function stopMusic() { AU.stopMusic(); }
  function buzz(ms) { if (!save.muted && settings.haptics && window.OrbitHaptics) window.OrbitHaptics.buzz(ms); }

  // ---------- layout ----------
  var scale = 1, offX = 0, dpr = 1, VH = 700;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    scale = Math.min(innerWidth / L.W, innerHeight / 560);
    offX = (innerWidth - L.W * scale) / 2;
    VH = innerHeight / scale;
  }
  addEventListener('resize', resize); resize();

  // background stars
  var bg = [];
  for (var i = 0; i < 120; i++) bg.push({ x: Math.random(), y: Math.random(), z: 0.2 + Math.random() * 0.8 });

  // ---------- state ----------
  var run = { stars: 0, combo: 0, jumps: 0 }, g = null, state = 'menu', particles = [], trail = [], popups = [], shake = 0, newBest = false;

  var mode = 'normal';
  var announceKey = '', announceCombo = -1;
  var newDepth = false;
  function modeName(m) { return m === 'daily' ? 'DAILY' : m === 'hard' ? 'HARD' : 'ORBIT'; }
  function modeDepth(m) { return save.depthByMode[m] || 0; }
  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function start(m) {
    mode = m === 'daily' ? 'daily' : m === 'hard' ? 'hard' : 'normal';
    startMusic();
    D.normalize(save.daily, today());
    g = L.createGame(mode === 'daily' ? L.dailySeed(new Date()) : Date.now(), mode === 'hard'); particles = []; trail = []; popups = []; newBest = false; newDepth = false;
    run = { stars: 0, combo: 0, jumps: 0, near: 0 };
    announceKey = ''; announceCombo = -1;
    state = 'play'; show(null);
    $('tip').style.display = save.tutorial ? 'none' : 'block';
  }
  function show(id) {
    ['menu', 'over', 'shop', 'missions', 'ach', 'settings'].forEach(function (n) { $(n).classList.toggle('hidden', n !== id); });
    $('hud').classList.toggle('hidden', id !== null);
    $('btnSettings').classList.toggle('hidden', id !== 'menu');
    $('btnPause').classList.toggle('hidden', id !== null);
  }
  function nextGateHint() {
    if (!g || !g.player || !g.gates.length) return '';
    var target = g.player.planet.idx + 1, gate = null;
    for (var i = 0; i < g.gates.length; i++) {
      if (g.gates[i].idx === target) { gate = g.gates[i]; break; }
    }
    if (!gate) return '';
    if (g.player.mode === 'fly') return L.gateOn(g, gate) ? '  ·  LASER ACTIVE' : '  ·  GATE CLEAR';
    if (L.gateOn(g, gate)) return '  ·  LASER ON — WAIT';
    var inSec = L.gateIn(g, gate);
    return inSec < 0.55 ? '  ·  LASER IN ' + inSec.toFixed(1) + 's' : '  ·  LASER OFF — GO';
  }
  function nextHazardHint() {
    if (!g || !g.player || g.player.mode !== 'orbit') return '';
    var hazards = L.nextHazards(g);
    return hazards.length ? '  ·  AHEAD: ' + hazards.join(' + ') : '';
  }
  function aimHint() {
    if (!g || !g.player) return '';
    var target = L.nextPlanet(g), delta = L.aimDelta(g);
    if (!target) return '';
    if (L.phaseHint(g) === 'FLIGHT') return 'FLIGHT TO ' + target.idx + '  ·  HOLD COURSE';
    if (delta === null) return '';
    return 'NEXT ' + target.idx + '  ·  ' + (Math.abs(delta) < 0.16 ? 'AIM READY' : 'ALIGN ' + Math.round(Math.abs(delta) * 180 / Math.PI) + '°');
  }
  function updateAnnouncements(phase, gateHint, hazards, targetHint) {
    var gateState = gateHint.indexOf('LASER ON') >= 0 ? 'LASER ON' : gateHint.indexOf('LASER IN') >= 0 ? 'LASER IN' : gateHint.indexOf('LASER ACTIVE') >= 0 ? 'LASER ACTIVE' : gateHint.indexOf('GATE CLEAR') >= 0 ? 'GATE CLEAR' : gateHint.indexOf('LASER OFF') >= 0 ? 'LASER OFF' : '';
    var shieldState = g.shield ? 'SHIELD READY' : g.inv > 0 ? 'SHIELD ACTIVE' : 'NO SHIELD';
    var targetState = targetHint.indexOf('AIM READY') >= 0 ? 'AIM READY' : targetHint.indexOf('FLIGHT TO') >= 0 ? 'FLIGHT' : targetHint ? 'ALIGN' : 'NO TARGET';
    var key = modeName(mode) + '|' + g.player.planet.idx + '|' + phase + '|' + shieldState + '|' + gateState + '|' + hazards.join(',') + '|' + targetState;
    if (key !== announceKey) {
      announceKey = key;
      var words = modeName(mode) + ', planet ' + g.player.planet.idx + '. ' + (phase === 'FLIGHT' ? 'Flight.' : 'Orbit.') + ' ' + shieldState + '.';
      if (gateState) words += ' ' + gateState + '.';
      if (hazards.length) words += ' Ahead: ' + hazards.join(', ') + '.';
      if (targetState === 'AIM READY') words += ' Aim ready.';
      else if (targetState === 'ALIGN') words += ' Align with next planet.';
      else if (targetState === 'FLIGHT') words += ' Hold course.';
      $('hudAnnounce').textContent = words;
    }
    var combo = g.combo >= 2 ? g.combo : 0;
    if (combo !== announceCombo) {
      announceCombo = combo;
      if (combo >= 2) $('hudAnnounce').textContent = 'Combo ' + combo + '.';
    }
  }
  function gameOver() {
    state = 'over';
    pendingOver = setTimeout(finishOver, 700);
  }
  var pendingOver = null, snap = null;
  function finishOver() {
    pendingOver = null;
    snap = JSON.stringify(save);
    var reachedPlanet = g.player.planet ? g.player.planet.idx : 0;
    save.runs = (save.runs || 0) + 1;
    if (reachedPlanet > (save.bestPlanet || 0)) save.bestPlanet = reachedPlanet;
    if (reachedPlanet > modeDepth(mode)) { save.depthByMode[mode] = reachedPlanet; newDepth = true; }
    save.coins += g.coins;
    if (mode === 'daily') {
      var previousDailyBest = save.daily.date === today() ? save.daily.best : 0;
      D.record(save.daily, today(), g.score);
      if (g.score > previousDailyBest) newBest = true;
    } else if (mode === 'hard') {
      if (g.score > save.hardBest) { save.hardBest = g.score; newBest = true; }
    } else if (g.score > save.best) { save.best = g.score; newBest = true; }
    save.lastRun = { mode: mode, score: g.score, planet: reachedPlanet, stars: run.stars, combo: run.combo || 0, near: run.near || 0, shields: run.shields || 0 };
    var done = M.update(save.missions, { score: g.score, stars: run.stars, combo: run.combo, jumps: run.jumps });
    var ach = A.update(save.ach, { score: g.score, combo: run.combo, stars: run.stars, daily: mode === 'daily' ? 1 : 0, dailyScore: mode === 'daily' ? g.score : 0 });
    var bonus = done.concat(ach).reduce(function (a, x) { return a + x.reward; }, 0);
    save.coins += bonus;
    persist();
    (function () {
      var om = $('ovMissions'); om.innerHTML = '';
      done.forEach(function (x, i) {
        var d = document.createElement('div');
        d.className = 'claim';
        d.style.animationDelay = (0.3 + i * 0.35) + 's';
        d.textContent = '✔ ' + x.text + '  +' + x.reward + ' ★';
        om.appendChild(d);
      });
      var oa = $('ovAch'); oa.innerHTML = '';
      ach.forEach(function (x, i) {
        var d = document.createElement('div');
        d.className = 'claim'; d.style.animationDelay = (0.3 + (done.length + i) * 0.35) + 's';
        d.textContent = '🏆 ' + x.name + '  +' + x.reward + ' ★';
        oa.appendChild(d);
      });
      $('ovScore').textContent = g.score;
      $('ovRun').textContent = modeName(mode) + ' RUN · ' + run.stars + '★ · COMBO ×' + (run.combo || 0) + ' · ' + (run.near || 0) + ' CLOSE CALL' + ((run.near || 0) === 1 ? '' : 'S');
      $('ovBest').textContent = (mode === 'daily' ? 'Daily · ' : mode === 'hard' ? 'Hard · ' : '') + (newBest ? 'NEW BEST!' : 'Best ' + (mode === 'daily' ? save.daily.best : mode === 'hard' ? save.hardBest : save.best));
      $('ovDepth').textContent = modeName(mode) + ' DEPTH · PLANET ' + reachedPlanet + (newDepth ? '  ·  NEW RECORD!' : '  ·  Best ' + modeDepth(mode));
      $('ovHint').textContent = g.zapped ? 'TIP · Wait for LASER OFF before launching.' : g.smashed ? 'TIP · Watch the asteroid lane, then launch when clear.' : g.swallowed ? 'TIP · Curve around the black hole; do not cross its core.' : g.collapsed ? 'TIP · Leave collapsing planets before their ring empties.' : 'TIP · Drifted off course — aim at the next planet and launch when aligned.';
      $('ovStreak').textContent = mode === 'daily' ? '🔥 ' + save.daily.streak + '-day streak' : '';
      var next = M.next(save.missions);
      $('ovNext').textContent = next ? 'NEXT MISSION · ' + next.text + '  ' + (save.missions.prog[next.id] || 0) + '/' + next.target + '  +' + next.reward + ' ★' : 'ALL MISSIONS COMPLETE';
      $('ovTitle').textContent = g.collapsed ? 'PLANET COLLAPSED' : (g.zapped ? 'LASER ZAPPED' : g.smashed ? 'ASTEROID HIT' : g.swallowed ? 'SWALLOWED' : 'DRIFTED INTO THE VOID');
      $('ovCoins').textContent = '+' + g.coins + ' ★  (total ' + save.coins + ')';
      $('btnRevive').classList.toggle('hidden', !!g.revived || !adsReady());
      $('btnDouble').classList.toggle('hidden', !adsReady());
      $('btnDouble').disabled = !!g.doubled;
      show('over');
    })();
  }
  // Continue (rewarded): undo this death's banking, put comet back on a safe orbit, keep playing.
  $('btnRevive').onclick = function () {
    if (!g || !g.over || g.revived || !snap) return;
    showRewarded(function (ok) {
      if (!ok || !L.revive(g)) return;
      var keep = save.muted;
      Object.assign(save, JSON.parse(snap)); save.muted = keep; snap = null; persist();
      newBest = false; newDepth = false; trail = []; shake = 0;
      state = 'play'; show(null); last = performance.now();
    });
  };


  function burst(x, y, color, n, sp) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * 6.283, s = (0.3 + Math.random()) * (sp || 160);
      particles.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.6 + Math.random() * 0.4, c: color });
    }
  }

  // ---------- input ----------
  function onPress(e) {
    if (e.target.closest && e.target.closest('button')) return;
    e.preventDefault();
    if (state === 'play' && L.tap(g)) {
      if (!save.tutorial) { save.tutorial = true; persist(); $('tip').style.display = 'none'; }
    }
  }
  cv.addEventListener('pointerdown', onPress);
  addEventListener('keydown', function (e) {
    if (e.code === 'Space' || e.code === 'Enter') { if (state === 'play') { if (L.tap(g) && !save.tutorial) { save.tutorial = true; persist(); $('tip').style.display = 'none'; } } else if (state === 'menu') start(); }
    if (e.code === 'KeyD' && state === 'menu') start('daily');
  });
  $('btnPlay').onclick = function () { start(); };
  $('btnDaily').onclick = function () { start('daily'); };
  $('btnHard').onclick = function () { if (save.best >= 25) start('hard'); };
  $('btnRetry').onclick = function () {
    if (window.OrbitAds) { try { window.OrbitAds.maybeInterstitial(save.runs); } catch (e) {} }
    start(mode);
  };
  document.addEventListener('visibilitychange', function () { if (!document.hidden && !save.muted && state !== 'pause') AU.resume(); else if (document.hidden) AU.suspend(); });
  $('btnMenu').onclick = function () { state = 'menu'; refreshMenu(); show('menu'); };
  $('btnShop').onclick = function () { renderShop(); show('shop'); };
  $('btnMissions').onclick = function () { renderMissions(); show('missions'); };
  $('btnAch').onclick = function () { renderAch(); show('ach'); };
  $('btnAchBack').onclick = function () { refreshMenu(); show('menu'); };
  function renderAch() {
    var el = $('achList'); el.innerHTML = '';
    A.LIST.forEach(function (x) {
      var got = save.ach.done.indexOf(x.id) >= 0, d = document.createElement('div');
      d.className = 'mis ' + (got ? 'got' : 'lock');
      d.innerHTML = (got ? '🏆 ' : '🔒 ') + x.name + '<b>+' + x.reward + ' ★</b><br><small>' + x.text + (got ? '' : ' (' + (save.ach.prog[x.id] || 0) + '/' + x.target + ')') + '</small>';
      el.appendChild(d);
    });
  }
  $('btnMissionsBack').onclick = function () { refreshMenu(); show('menu'); };
  function renderMissions() {
    var el = $('missionList'); el.innerHTML = '';
    M.active(save.missions).forEach(function (x) {
      var p = save.missions.prog[x.id] || 0, d = document.createElement('div');
      d.className = 'mis';
      d.innerHTML = x.text + '<b>+' + x.reward + ' ★</b><i><span style="width:0"></span></i>';
      el.appendChild(d);
      var bar = d.querySelector('span'), w = Math.round(p / x.target * 100) + '%';
      setTimeout(function () { bar.style.width = w; }, 30);
    });
    if (!el.children.length) el.textContent = 'All missions complete!';
  }
  $('btnShopBack').onclick = function () { refreshMenu(); show('menu'); };
  function paintSettings() {
    [['setMusic', 'music', 'Music'], ['setSfx', 'sfx', 'Sound effects'], ['setHaptics', 'haptics', 'Vibration']].forEach(function (r) {
      var b = $(r[0]); b.textContent = r[2] + ': ' + (settings[r[1]] ? 'ON' : 'OFF'); b.setAttribute('aria-checked', settings[r[1]] ? 'true' : 'false');
    });
  }
  [['setMusic', 'music'], ['setSfx', 'sfx'], ['setHaptics', 'haptics']].forEach(function (r) {
    $(r[0]).onclick = function () {
      settings[r[1]] = !settings[r[1]];
      try { localStorage.setItem('orbithopSettings', JSON.stringify(settings)); } catch (e) {}
      AU.setChannels({ sfxOff: !settings.sfx, musicOff: !settings.music });
      if (r[1] === 'music' && settings.music && !save.muted) startMusic();
      if (r[1] === 'haptics' && settings.haptics) buzz(15);
      if (r[1] === 'sfx' && settings.sfx) AU.sfx.ui();
      paintSettings();
    };
  });
  $('btnSettings').onclick = function () { paintSettings(); show('settings'); };
  $('btnSettingsBack').onclick = function () { refreshMenu(); show('menu'); };
  $('btnMute').onclick = function () {
    save.muted = !save.muted; AU.setMuted(save.muted); persist(); refreshMenu();
    $('btnMute').setAttribute('aria-label', save.muted ? 'Unmute sound' : 'Mute sound');
    if (save.muted) stopMusic(); else startMusic();
  };
  // Monetization hook: rewarded ad placeholder (wire to AdMob via Capacitor plugin later)
  // window.OrbitAds = { showRewarded(cb), showInterstitial(cb) } is set by the native AdMob wrapper; web falls back to instant grant.
  // Rewards are granted only when a real native rewarded ad completes (src/ads.js); web builds hide the ad buttons.
  function adsReady() { return !!(window.OrbitAds && window.OrbitAds.rewardedReady()); }
  function showRewarded(cb) { if (adsReady()) window.OrbitAds.showRewarded(function () { cb(true); }); }
  $('btnDouble').onclick = function () {
    if (!g || g.doubled) return;
    showRewarded(function (ok) {
      if (!ok) return;
      g.doubled = true; save.coins += g.coins; persist();
      $('ovCoins').textContent = '+' + g.coins * 2 + ' ★  (total ' + save.coins + ')';
      $('btnDouble').disabled = true; $('btnRevive').classList.add('hidden');
    });
  };
  // pause
  function pause() {
    if (state !== 'play') return;
    state = 'pause';
    var target = L.nextPlanet(g), hazards = L.nextHazards(g), phase = L.phaseHint(g), gate = L.nextGateState(g);
    $('pauseSummary').textContent = modeName(mode) + ' RUN · SCORE ' + g.score + ' · PLANET ' + g.player.planet.idx +
      ' · ' + (phase === 'FLIGHT' ? 'FLIGHT — HOLD COURSE' : 'ORBIT — AIM') +
      ' · COMBO ×' + (g.combo || 0) + (g.shield ? ' · SHIELD READY' : g.inv > 0 ? ' · SHIELD ACTIVE' : '');
    var gateText = gate ? (gate.state === 'IN' ? ' · LASER IN ' + gate.seconds.toFixed(1) + 's' : ' · LASER ' + gate.state) : '';
    $('pauseTarget').textContent = target ? 'NEXT ' + target.idx + (hazards.length ? ' · AHEAD: ' + hazards.join(' + ') : ' · CLEAR') + gateText : 'NO NEXT TARGET';
    $('pause').classList.remove('hidden');
    AU.suspend();
  }
  function resume() { if (state !== 'pause') return; state = 'play'; $('pause').classList.add('hidden'); AU.resume(); last = performance.now(); }
  $('btnPause').onclick = function (e) { e.stopPropagation(); pause(); };
  $('btnResume').onclick = resume;
  $('btnQuit').onclick = function () { state = 'menu'; $('pause').classList.add('hidden'); refreshMenu(); show('menu'); stopMusic(); if (!save.muted) startMusic(); };
  addEventListener('keydown', function (e) { if (e.code === 'Escape' || e.code === 'KeyP') { if (state === 'play') pause(); else if (state === 'pause') resume(); } });
  document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); });

  function refreshMenu() {
    var lr = save.lastRun;
    $('menuBest').textContent = 'Best ' + save.best + '  ·  Deepest planet ' + Math.max(modeDepth('normal'), modeDepth('hard'), modeDepth('daily')) + '  ·  ★ ' + save.coins;
    var dd = D.normalize(save.daily, today());
    $('btnDaily').textContent = 'DAILY · best ' + dd.best + (dd.streak ? ' · 🔥' + dd.streak : '');
    $('btnHard').disabled = save.best < 25;
    $('btnHard').textContent = save.best < 25 ? '🔒 HARD (score 25)' : 'HARD · best ' + save.hardBest;
    $('btnMute').textContent = save.muted ? '🔇' : '🔊';
    $('btnMute').setAttribute('aria-label', save.muted ? 'Unmute sound' : 'Mute sound');
    $('btnDouble').disabled = false;
  }
  function renderShop() {
    var el = $('shopList'); el.innerHTML = '';
    $('shopCoins').textContent = '★ ' + save.coins;
    SKINS.forEach(function (s) {
      var b = document.createElement('button'), owned = save.owned.indexOf(s.id) >= 0;
      b.className = 'skin' + (save.skin === s.id ? ' sel' : '');
      b.innerHTML = '<span class="dot" style="background:' + s.color + ';box-shadow:0 0 12px ' + s.trail + '"></span>' +
        s.name + '<small>' + (owned ? (save.skin === s.id ? 'Equipped' : 'Owned') : '★ ' + s.cost) + '</small>';
      b.onclick = function () {
        if (!owned) { if (save.coins < s.cost) { tone(150, 0.15, 'square', 0.08); return; } save.coins -= s.cost; save.owned.push(s.id); }
        save.skin = s.id; persist(); renderShop(); tone(660, 0.1);
      };
      el.appendChild(b);
    });
  }
  refreshMenu(); show('menu');

  // ---------- loop ----------
  var last = performance.now();
  function frame(now) {
    var dt = Math.min(0.033, (now - last) / 1000); last = now;
    if (g && (state === 'play')) {
      L.step(g, dt);
      L.drain(g).forEach(function (ev) {
        if (ev.type === 'jump') { sfx.jump(); run.jumps++; }
        if (ev.type === 'land' && ev.gained) {
          run.combo = Math.max(run.combo, ev.combo); sfx.land(ev.combo); burst(ev.x, ev.y, skin().trail, 10, 120); buzz(10);
          popups.push({ x: ev.x, y: ev.y, t: 0, s: ev.combo >= 2 ? 'COMBO x' + ev.combo : (ev.perfect ? 'SKIP +' + ev.gained : '+1') });
        }
        if (ev.type === 'near') { run.near++; tone(1040, 0.1, 'triangle', 0.08); popups.push({ x: ev.x + 30, y: ev.y + 10, t: 0, s: 'CLOSE CALL +1' }); }
        if (ev.type === 'shieldGet') { run.shields = (run.shields || 0) + 1; tone(660, 0.15, 'sine', 0.08); setTimeout(function () { tone(990, 0.2, 'sine', 0.08); }, 80); popups.push({ x: ev.x, y: ev.y, t: 0, s: 'SHIELD' }); }
        if (ev.type === 'shieldPop') { sfx.shield(); burst(ev.x, ev.y, '#7fe8ff', 24, 220); shake = 8; buzz(40); popups.push({ x: ev.x, y: ev.y, t: 0, s: 'SHIELD BREAK' }); }
        if (ev.type === 'star') { run.stars++; sfx.star(); burst(ev.x, ev.y, '#ffe066', 8, 90); }
        if (ev.type === 'collapse') { g.collapsed = true; sfx.die(); burst(ev.x, ev.y, '#ff6b6b', 40, 220); shake = 16; buzz([40, 30, 80]); gameOver(); }
        if (ev.type === 'die' && ev.gate) { g.zapped = true; }
        if (ev.type === 'die' && ev.rock) { g.smashed = true; }
        if (ev.type === 'die' && ev.hole) { g.swallowed = true; tone(160, 0.8, 'sine', 0.15, 30); }
        if (ev.type === 'die') { boom = { x: ev.x, y: ev.y, t0: lastT }; sfx.die(); burst(ev.x, ev.y, skin().trail, 30, 260); shake = 12; buzz(80); gameOver(); }
      });
      $('hudMode').textContent = mode === 'daily' ? 'DAILY' : mode === 'hard' ? 'HARD' : 'ORBIT';
      $('hudScore').textContent = g.score;
      var gateHint = nextGateHint(), hazardHint = nextHazardHint();
      $('hudStatus').textContent = 'PLANET ' + g.player.planet.idx + (g.shield ? '  ·  SHIELD READY' : g.inv > 0 ? '  ·  SHIELD ACTIVE' : '') + gateHint + hazardHint;
      $('hudStatus').classList.toggle('hazard', gateHint.indexOf('WAIT') >= 0 || gateHint.indexOf('ACTIVE') >= 0 || !!hazardHint);
      var targetHint = aimHint();
      $('hudTarget').textContent = targetHint;
      $('hudTarget').classList.toggle('ready', targetHint.indexOf('AIM READY') >= 0);
      $('hudTarget').classList.toggle('flight', L.phaseHint(g) === 'FLIGHT');
      $('hudCombo').textContent = g.combo >= 2 ? 'COMBO ×' + g.combo : '';
      $('hudCoins').textContent = '★ ' + g.coins;
      updateAnnouncements(L.phaseHint(g), gateHint, L.nextHazards(g), targetHint);
    } else if (g && state === 'over') { L.step(g, 0); }
    particles.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.96; p.vy *= 0.96; p.life -= dt; });
    particles = particles.filter(function (p) { return p.life > 0; });
    popups.forEach(function (p) { p.t += dt; });
    popups = popups.filter(function (p) { return p.t < 0.9; });
    shake *= 0.88;
    draw(now / 1000);
    requestAnimationFrame(frame);
  }

  function draw(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var grd = ctx.createLinearGradient(0, 0, 0, innerHeight);
    var depth = g ? Math.min(1, g.score / 120) : 0;
    AU.setIntensity(state === 'play' ? depth : 0);
    grd.addColorStop(0, 'hsl(' + (240 + depth * 60) + ',55%,' + (10 + depth * 4) + '%)');
    grd.addColorStop(1, 'hsl(' + (260 + depth * 60) + ',60%,4%)');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, innerWidth, innerHeight);
    var camY = g ? g.cameraY : 0;
    var nb = spr('bg-nebula-' + (1 + Math.min(2, Math.floor(depth * 3))));
    if (nb) {
      var nsc = Math.max(innerWidth / nb.width, innerHeight / nb.height), nw = nb.width * nsc, nh = nb.height * nsc;
      var ny = ((camY * 0.04) % nh + nh) % nh - nh;
      ctx.globalAlpha = 0.85;
      for (var ty = ny; ty < innerHeight; ty += nh) ctx.drawImage(nb, (innerWidth - nw) / 2, ty, nw, nh + 1);
      ctx.globalAlpha = 1;
    }
    lastT = t;
    var st = spr('bg-stars');
    if (st) {
      var tsz = 512, sy0 = ((camY * 0.12) % tsz + tsz) % tsz - tsz;
      ctx.globalAlpha = 0.7 + 0.3 * Math.sin(t * 0.8);
      for (var tyy = sy0; tyy < innerHeight; tyy += tsz) for (var txx = 0; txx < innerWidth; txx += tsz) ctx.drawImage(st, txx, tyy, tsz, tsz);
      ctx.globalAlpha = 1;
    }
    bg.forEach(function (s) {
      var y = ((s.y * innerHeight - camY * s.z * 0.3) % innerHeight + innerHeight) % innerHeight;
      ctx.globalAlpha = 0.3 + s.z * 0.6 * (0.7 + 0.3 * Math.sin(t * 2 + s.x * 40));
      ctx.fillStyle = '#fff'; ctx.fillRect(s.x * innerWidth, y, s.z * 2, s.z * 2);
    });
    ctx.globalAlpha = 1;
    if (!g) { drawMenuPlanet(t); return; }

    var sx = (Math.random() - 0.5) * shake, sy = (Math.random() - 0.5) * shake;
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * (offX + sx), dpr * sy);
    ctx.translate(0, VH * 0.62 - camY);

    g.holes.forEach(function (h) {
      var hg = ctx.createRadialGradient(h.x, h.y, h.r * 0.5, h.x, h.y, h.r * 4);
      hg.addColorStop(0, 'rgba(0,0,0,1)'); hg.addColorStop(0.3, 'rgba(120,40,200,0.35)'); hg.addColorStop(1, 'rgba(120,40,200,0)');
      var bh = spr('blackhole');
      if (bh) {
        ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(t * 1.5); var bs = h.r * 6.2;
        ctx.drawImage(bh, -bs / 2, -bs / 2, bs, bs); ctx.restore(); return;
      }
      ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(h.x, h.y, h.r * 4, 0, 6.283); ctx.fill();
      ctx.strokeStyle = 'rgba(210,150,255,0.6)'; ctx.lineWidth = 2;
      for (var q = 0; q < 3; q++) { ctx.beginPath(); ctx.arc(h.x, h.y, h.r * (1.3 + q * 0.5), t * (2 - q * 0.5) + q, t * (2 - q * 0.5) + q + 2.4); ctx.stroke(); }
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, 6.283); ctx.fill();
    });
    g.gates.forEach(function (k) {
      var on = L.gateOn(g, k), wi = L.gateIn(g, k), warn = !on && wi < 0.45;
      ctx.save();
      var lg = spr('laser-gate');
      if (lg) {
        // owner art is a vertical beam (trim box 15,192 34x127): rotate so emitters sit at the screen edges
        var cs = 0.85, th = 34 * cs, cap = 32 * cs;
        ctx.translate(0, k.y); ctx.rotate(Math.PI / 2); ctx.scale(1, -1);
        // after rotate+flip: local x -> screen y, local y -> screen x
        ctx.drawImage(lg, 15, 192, 34, 32, -th / 2, 0, th, cap);
        ctx.drawImage(lg, 15, 289, 34, 30, -th / 2, L.W - 30 * cs, th, 30 * cs);
        if (on) {
          ctx.globalAlpha = 0.85 + 0.15 * Math.sin(t * 60); ctx.shadowColor = '#ff4d6d'; ctx.shadowBlur = 16;
          ctx.drawImage(lg, 15, 228, 34, 48, -th / 2, cap, th, L.W - cap - 30 * cs);
        } else {
          ctx.strokeStyle = warn ? 'rgba(255,77,109,' + (0.4 + 0.4 * Math.sin(t * 40)) + ')' : 'rgba(255,77,109,0.15)'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 8]);
          ctx.beginPath(); ctx.moveTo(0, cap); ctx.lineTo(0, L.W - 30 * cs); ctx.stroke();
        }
        ctx.restore(); return;
      }
      ctx.fillStyle = '#ff4d6d'; ctx.fillRect(0, k.y - 5, 8, 10); ctx.fillRect(L.W - 8, k.y - 5, 8, 10);
      if (on) { ctx.shadowColor = '#ff4d6d'; ctx.shadowBlur = 16; ctx.strokeStyle = '#ff4d6d'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(8, k.y); ctx.lineTo(L.W - 8, k.y); ctx.stroke(); }
      else { ctx.strokeStyle = warn ? 'rgba(255,77,109,' + (0.4 + 0.4 * Math.sin(t * 40)) + ')' : 'rgba(255,77,109,0.15)'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 8]); ctx.beginPath(); ctx.moveTo(8, k.y); ctx.lineTo(L.W - 8, k.y); ctx.stroke(); }
      ctx.restore();
    });
    g.rocks.forEach(function (k) {
      ctx.save(); ctx.translate(k.x, k.y); ctx.rotate(t * 2 + k.ph);
      var as = spr('asteroid-' + (1 + Math.floor(k.ph) % 3));
      if (as) { ctx.drawImage(as, -k.r * 1.6, -k.r * 1.6, k.r * 3.2, k.r * 3.2); ctx.restore(); return; }
      ctx.fillStyle = '#8a7f78'; ctx.strokeStyle = '#d9cfc7'; ctx.lineWidth = 1.5; ctx.beginPath();
      for (var q = 0; q < 7; q++) { var an = q / 7 * 6.283, rr = k.r * (0.75 + 0.25 * Math.sin(q * 2.3 + k.ph)); ctx[q ? 'lineTo' : 'moveTo'](Math.cos(an) * rr, Math.sin(an) * rr); }
      ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    });
    g.planets.forEach(function (p) {
      // orbit ring
      var ringSp = spr('orbit-ring');
      if (ringSp) {
        var rs = L.orbitR(p) * 2 * 512 / 480;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(t * 0.15 + p.idx); ctx.globalAlpha = 0.35;
        ctx.drawImage(ringSp, -rs / 2, -rs / 2, rs, rs); ctx.restore();
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.setLineDash([4, 6]); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(p.x, p.y, L.orbitR(p), 0, 6.283); ctx.stroke(); ctx.setLineDash([]);
      }
      // planet body
      var psp = spr(p.shrink ? 'planet-shrink' : 'planet-' + (1 + Math.floor(p.hue / 45) % 8));
      var pg = ctx.createRadialGradient(p.x - p.r * 0.4, p.y - p.r * 0.4, p.r * 0.1, p.x, p.y, p.r);
      pg.addColorStop(0, 'hsl(' + p.hue + ',80%,70%)'); pg.addColorStop(1, 'hsl(' + p.hue + ',70%,30%)');
      ctx.shadowColor = 'hsl(' + p.hue + ',90%,60%)'; ctx.shadowBlur = 20;
      if (psp) {
        ctx.shadowBlur = 0; var ps = p.r * 2 / 0.7;
        ctx.save(); ctx.translate(p.x, p.y); ctx.drawImage(psp, -ps / 2, -ps / 2, ps, ps); ctx.restore();
      } else {
        ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill(); ctx.shadowBlur = 0;
      }
      if (p.shrink) {
        var lf = Math.max(0, p.life / p.maxLife), active = g.player.planet === p && g.player.mode === 'orbit';
        ctx.strokeStyle = 'rgba(255,90,90,' + (active ? 0.6 + 0.4 * Math.sin(t * (20 - lf * 14)) : 0.5) + ')';
        ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 4, -Math.PI / 2, -Math.PI / 2 + lf * 6.283); ctx.stroke();
      }
      // craters
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      for (var k = 0; k < (psp ? 0 : 3); k++) {
        var ca = p.idx * 1.7 + k * 2.1 + t * p.spin * 0.2;
        ctx.beginPath(); ctx.arc(p.x + Math.cos(ca) * p.r * 0.5, p.y + Math.sin(ca) * p.r * 0.5, p.r * (0.12 + k * 0.04), 0, 6.283); ctx.fill();
      }
      if (p.flip) {
        var warn = p.ft < 0.4, fa = warn ? 0.5 + 0.5 * Math.sin(t * 30) : 0.25;
        ctx.strokeStyle = 'rgba(255,220,120,' + fa + ')'; ctx.lineWidth = 3; ctx.beginPath();
        var dir = p.spin > 0 ? 1 : -1; ctx.arc(p.x, p.y, L.orbitR(p) + 8, t * dir, t * dir + 1.2); ctx.stroke();
      }
      if (p.shield && !p.shield.got) {
        var shx = p.x + Math.cos(p.shield.a) * L.orbitR(p), shy = p.y + Math.sin(p.shield.a) * L.orbitR(p);
        ctx.strokeStyle = '#7fe8ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(shx, shy, 9 + Math.sin(t * 5) * 1.5, 0, 6.283); ctx.stroke();
        ctx.fillStyle = 'rgba(127,232,255,0.3)'; ctx.fill();
      }
      if (p.star && !p.star.got) {
        var sxp = p.x + Math.cos(p.star.a) * L.orbitR(p), syp = p.y + Math.sin(p.star.a) * L.orbitR(p);
        var ssp = spr('star-pickup'), sr = 7 + Math.sin(t * 6) * 1.2;
        if (ssp) ctx.drawImage(ssp, sxp - sr * 1.9, syp - sr * 1.9, sr * 3.8, sr * 3.8); else drawStar(sxp, syp, sr, '#ffe066');
      }
    });

    // trail + player
    if (g.shield || g.inv > 0) {
      var sq = g.shield || Math.sin(t * 40) > 0;
      if (sq) { ctx.strokeStyle = 'rgba(127,232,255,0.85)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(g.player.x, g.player.y, 15, 0, 6.283); ctx.stroke(); }
    }
    var pl = g.player, sk = skin();
    if (!g.over) {
      trail.push({ x: pl.x, y: pl.y }); if (trail.length > 18) trail.shift();
      for (var j = 0; j < trail.length; j++) {
        ctx.globalAlpha = j / trail.length * 0.6; ctx.fillStyle = sk.trail;
        ctx.beginPath(); ctx.arc(trail[j].x, trail[j].y, 2 + j / trail.length * 5, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
      // Launch guide: shows radial alignment with next planet, not only current heading.
      if (pl.mode === 'orbit') {
        var target = L.nextPlanet(g), delta = L.aimDelta(g);
        if (target && delta !== null) {
          var aligned = Math.abs(delta) < 0.16;
          ctx.strokeStyle = aligned ? 'rgba(127,232,255,0.8)' : 'rgba(255,255,255,0.28)';
          ctx.lineWidth = aligned ? 3 : 2; ctx.setLineDash(aligned ? [8, 5] : [3, 8]);
          ctx.beginPath(); ctx.moveTo(pl.x, pl.y); ctx.lineTo(target.x, target.y); ctx.stroke(); ctx.setLineDash([]);
          ctx.strokeStyle = aligned ? '#7fe8ff' : 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(target.x, target.y, target.r + 9 + (aligned ? Math.sin(t * 8) * 2 : 0), 0, 6.283); ctx.stroke();
        }
      }
      var csp = spr(sk.sprite);
      if (lastPl && (Math.abs(pl.x - lastPl.x) + Math.abs(pl.y - lastPl.y)) > 0.05) heading = Math.atan2(pl.y - lastPl.y, pl.x - lastPl.x);
      lastPl = { x: pl.x, y: pl.y };
      if (csp) {
        var cs = 56; ctx.save(); ctx.translate(pl.x, pl.y); ctx.rotate(heading);
        ctx.drawImage(csp, -cs / 2 - cs * 0.125, -cs / 2, cs, cs); ctx.restore();
      } else {
        ctx.shadowColor = sk.trail; ctx.shadowBlur = 18; ctx.fillStyle = sk.color;
        ctx.beginPath(); ctx.arc(pl.x, pl.y, 8, 0, 6.283); ctx.fill(); ctx.shadowBlur = 0;
      }
    }
    if (boom) {
      var bf = Math.floor((t - boom.t0) / 0.07);
      var bi = spr('fx-explosion-' + (bf + 1));
      if (bf >= 4) boom = null;
      else if (bi) ctx.drawImage(bi, boom.x - 60, boom.y - 60, 120, 120);
    }
    particles.forEach(function (p) {
      ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.c; ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    });
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center'; ctx.font = 'bold 18px system-ui, sans-serif';
    popups.forEach(function (p) {
      ctx.globalAlpha = 1 - p.t / 0.9; ctx.fillStyle = '#fff'; ctx.fillText(p.s, p.x, p.y - 20 - p.t * 40);
    });
    ctx.globalAlpha = 1;
  }

  function drawStar(x, y, r, c) {
    ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 10; ctx.beginPath();
    for (var i = 0; i < 10; i++) { var a = i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
  }
  function drawMenuPlanet(t) {
    var cx = innerWidth / 2, cy = innerHeight * 0.62, r = 50;
    var pg = ctx.createRadialGradient(cx - 20, cy - 20, 5, cx, cy, r);
    pg.addColorStop(0, '#9fd3ff'); pg.addColorStop(1, '#2a4a9a');
    var mp = spr('planet-2');
    if (mp) ctx.drawImage(mp, cx - r / 0.7, cy - r / 0.7, r * 2 / 0.7, r * 2 / 0.7); else { ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.283); ctx.fill(); }
    var a = t * 2, sk = skin();
    ctx.shadowColor = sk.trail; ctx.shadowBlur = 18; ctx.fillStyle = sk.color;
    ctx.beginPath(); ctx.arc(cx + Math.cos(a) * 70, cy + Math.sin(a) * 70, 8, 0, 6.283); ctx.fill(); ctx.shadowBlur = 0;
  }

  requestAnimationFrame(frame);
})();
