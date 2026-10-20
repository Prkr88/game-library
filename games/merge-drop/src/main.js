(function () {
  var L = MergeLogic, cv = document.getElementById('game'), ctx = cv.getContext('2d');
  var $ = function (id) { return document.getElementById(id); };
  var W, H, dpr;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener('resize', resize); resize();

  var save = { best: 0, mute: false, bombs: 2, swaps: 2, seen: false, bestTile: 0, runs: 0, theme: 0, daily: { date: '', best: 0, streak: 0, last: '' } };
  try { save = L.normalizeSave(JSON.parse(localStorage.getItem('mergedrop') || '{}')); } catch (e) { save = L.normalizeSave(save); }
  function persist() { try { localStorage.setItem('mergedrop', JSON.stringify(save)); } catch (e) {} }

  MergeAudio.setMuted(function () { return save.mute; });
  function tone(f, d, type, vol) { MergeAudio.tone(f, d, type, vol); }
  addEventListener('pointerdown', MergeAudio.unlock);
  var PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
  function noteHz(i) { return 261.63 * Math.pow(2, PENTA[Math.min(i, PENTA.length - 1)] / 12); }
  function buzz(ms) { if (save.nohaptic || !window.MergeHaptics) return; window.MergeHaptics.buzz(ms); }

  var bursts = [], tileMark = 0, lastLv = 0, state = null, mode = 'menu', view = null, queue = [], stepT = 0, hover = 2, parts = [], pops = {}, falls = {}, dropAnim = null, revived = false, msgT = 0, lastCol = -1, bombMode = false, floats = [], snap = null, undos = 0;
  function layout() {
    if (H < 560 && W > H) { // short landscape: compact HUD on top, power-ups moved beside the board (see style.css)
      var sc = Math.min((W - 200) / L.COLS, (H - 138) / (L.ROWS + 1), 90);
      return { cell: sc, bx: (W - sc * L.COLS) / 2, by: 126 + sc };
    }
    var cell = Math.min((W - 24) / L.COLS, (H - 260) / (L.ROWS + 1), 90);
    var bw = cell * L.COLS, bx = (W - bw) / 2, by = Math.max(150, (H - cell * L.ROWS) / 2 + 40);
    return { cell: cell, bx: bx, by: by };
  }
  var THEMES = [
    { name: 'Neon', hue: 170, bg: ['#1b1b3a', '#3d1e6d'], need: 0 },
    { name: 'Sunset', hue: 330, bg: ['#3a1b2a', '#7a2e1e'], need: 128 },
    { name: 'Ocean', hue: 40, bg: ['#0b2a3a', '#0e5a6d'], need: 512 }
  ];
  function theme() { var t = THEMES[save.theme] || THEMES[0]; return save.bestTile >= t.need ? t : THEMES[0]; }
  function color(v) { if (v < 0) return '#4a4a5e'; var k = Math.log2(v); return 'hsl(' + ((k * 37 + theme().hue) % 360) + ',70%,' + (52 + Math.min(k, 10) * 1.2) + '%)'; }

  // PNG art: owner file assets/<name>.png first, generated fallback assets/gen/<name>.png, else canvas drawing
  var IMGS = {};
  function loadImg(key, urls) {
    var im = new Image(); IMGS[key] = { img: im, ok: false };
    var i = 0; im.onload = function () { IMGS[key].ok = true; };
    im.onerror = function () { if (++i < urls.length) im.src = urls[i]; };
    im.src = urls[0];
  }
  // Power-up icons: owner assets/<name>.png first, generated assets/gen/<name>.png fallback
  Array.prototype.forEach.call(document.querySelectorAll('img[data-ic]'), function (el) {
    var urls = ['assets/' + el.dataset.ic + '.png', 'assets/gen/' + el.dataset.ic + '@2x.png'], i = 0;
    el.onerror = function () { if (++i < urls.length) el.src = urls[i]; else el.style.display = 'none'; };
    el.src = urls[0];
  });
  (function () {
    var vals = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];
    vals.forEach(function (v) {
      loadImg('t0-' + v, ['assets/tile-' + v + '.png', 'assets/gen/tile-' + v + '.png']);
      loadImg('t1-' + v, ['assets/gen/tile-' + v + '-t1.png']);
      loadImg('t2-' + v, ['assets/gen/tile-' + v + '-t2.png']);
    });
    loadImg('stone', ['assets/tile-stone.png', 'assets/gen/tile-stone.png']);
    loadImg('board', ['assets/board-bg.png', 'assets/gen/board-bg.png']);
    loadImg('bg', ['assets/bg.png', 'assets/gen/bg.png']);
    loadImg('fxm', ['assets/fx-merge.png', 'assets/gen/fx-merge.png']);
    loadImg('fxc', ['assets/fx-combo.png', 'assets/gen/fx-combo.png']);
    loadImg('coin', ['assets/ui-coin.png', 'assets/gen/ui-coin.png']);
  })();
  function themeIdx() { var t = theme(); return THEMES.indexOf(t); }
  function tileImg(v) { var e = IMGS[v < 0 ? 'stone' : 't' + themeIdx() + '-' + v]; return e && e.ok ? e.img : null; }
  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function daySeed() { var t = today(), h = 7; for (var i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0; return (h & 0xffff) + 1; }
  var banner = null;
  var pzPath = '', hintCol = -1, hinted = false;
  var isDaily = false, isRise = false, isBlitz = false, isHard = false, blitzT = 0, isPuzzle = false, isDailyPz = false, puzzleIdx = 0, PZ = window.MergePuzzles || [];
  function startBlitz() { isHard = false; isDailyPz = false; isDaily = false; isRise = false; isBlitz = true; isPuzzle = false; begin((Date.now() & 0xffff) + 1); }
  function startHard() { isHard = true; isDailyPz = false; isDaily = false; isRise = false; isBlitz = false; isPuzzle = false; begin((Date.now() & 0xffff) + 1); }
  function startRise() { isHard = false; isDailyPz = false; isDaily = false; isRise = true; isBlitz = false; isPuzzle = false; begin((Date.now() & 0xffff) + 1); }
  function startDaily() { isHard = false; isDailyPz = false; isDaily = true; isRise = false; isBlitz = false; isPuzzle = false; begin(daySeed()); }
  function start() { isHard = false; isDailyPz = false; isDaily = false; isRise = false; isBlitz = false; isPuzzle = false; begin((Date.now() & 0xffff) + 1); }
  function startPuzzle(i, dpz) { isHard = false; isDailyPz = !!dpz; isDaily = false; isRise = false; isBlitz = false; isPuzzle = true; puzzleIdx = i; begin(1); }
  function activeMode() { return isPuzzle ? 'Puzzle' : isBlitz ? 'Blitz' : isHard ? 'Hardcore' : isRise ? 'Rise' : isDaily ? 'Daily' : 'Classic'; }
  function modeBest() { return isBlitz ? (save.blitzBest || 0) : isHard ? (save.hardBest || 0) : isRise ? (save.riseBest || 0) : isDaily ? L.dailyRecord(save.daily.best, save.daily.date, today()) : save.best; }
  function begin(seed) {
    state = isPuzzle ? L.createPuzzle(PZ[puzzleIdx]) : L.create(seed, isRise, isHard); view = state.grid.map(function (r) { return r.slice(); });
    pzPath = ''; hintCol = -1; hinted = false; lastLv = 0; tileMark = 0; queue = []; parts = []; bursts = []; floats = []; pops = {}; falls = {}; revived = false; mode = 'play'; bombMode = false; snap = null; undos = isDaily || isPuzzle || isHard ? 0 : 1; blitzT = isBlitz ? 60 : 0;
    ['menu', 'over', 'cont', 'pause-panel'].forEach(function (i) { $(i).classList.add('hidden'); });
    $('score').textContent = '0'; $('best').textContent = isBlitz ? 'Blitz best ' + (save.blitzBest || 0) : isHard ? 'Hardcore best ' + (save.hardBest || 0) : isRise ? 'Rise best ' + (save.riseBest || 0) : isDaily ? 'Daily ' + (save.daily.date === today() ? save.daily.best : 0) : 'Best ' + save.best; $('msg').textContent = '';
    $('mode-label').textContent = isBlitz ? '⚡ Blitz' : isHard ? '💀 Hardcore' : isRise ? '⬆ Rise' : isDaily ? '📅 Daily' : 'Classic';
    if (isPuzzle) { $('best').textContent = ''; $('mode-label').textContent = isDailyPz ? '🧩 Daily Puzzle · streak ' + L.liveStreak(save.dpz.streak, save.dpz.last, today()) : '🧩 Puzzle ' + (puzzleIdx + 1) + '/' + PZ.length; }
    else $('mode-label').textContent += ' · ' + $('best').textContent;
    $('timer').textContent = isBlitz ? '60s' : ''; $('timer').classList.remove('warn'); $('danger').textContent = '';
    goalUi();
    cv.focus();
    coachStep = save.seen || isPuzzle ? -1 : 0; coachUi(); if (!save.seen && !isPuzzle) { save.seen = true; persist(); }
    pwUi();
    planUi();
  }
  var coachStep = -1;
  var COACH = ['👆 Tap a column to drop the NEXT tile', '🧩 Equal numbers touching merge and double!', '🔥 Chain merges for combo bonus. Keep the top row clear!'];
  function coachUi() {
    var el = $('coach'); if (!el) return;
    if (coachStep < 0 || coachStep >= COACH.length || mode !== 'play') { el.classList.add('hidden'); return; }
    el.textContent = COACH[coachStep]; el.classList.remove('hidden');
  }
  function coachAdvance(res) {
    if (coachStep < 0) return;
    if (coachStep === 0) coachStep = 1;
    else if (coachStep === 1 && res.chain > 0) coachStep = 2;
    else if (coachStep === 2 && (res.chain > 1 || state.drops >= 12)) coachStep = -1;
    else if (coachStep === 1 && state.drops >= 10) coachStep = 2;
    coachUi();
  }
  function pwUi() {
    $('nb').textContent = save.bombs; $('ns').textContent = save.swaps;
    $('bomb').disabled = !save.bombs || mode !== 'play' || isPuzzle; $('swap').disabled = !save.swaps || mode !== 'play' || isPuzzle;
    $('bomb').classList.toggle('on', bombMode);
    $('hint').classList.toggle('hidden', !isPuzzle); $('hint').disabled = mode !== 'play' || !isPuzzle;
    $('nu').textContent = undos; $('undo').disabled = !undos || !snap || mode !== 'play';
  }
  function planUi() {
    var el = $('plan');
    if (!state || mode !== 'play') { el.textContent = ''; el.classList.remove('warn'); return; }
    if (bombMode) { el.textContent = 'BLAST MODE · TAP TILE'; return; }
    var c = Math.max(0, Math.min(L.COLS - 1, hover)), row = -1;
    for (var r = L.ROWS - 1; r >= 0; r--) if (!state.grid[r][c]) { row = r; break; }
    if (row < 0) { el.textContent = 'NEXT ' + state.next + ' · COLUMN FULL'; el.classList.remove('warn'); return; }
    var p = L.preview(state, c), hint = p.mergeValue ? ' · MERGE → ' + p.mergeValue : '';
    if (p.chain > 1) hint += ' · CHAIN x' + p.chain;
    if (p.cleared) hint += ' · CLEAR +' + p.gain;
    if (p.endsRun) hint += ' · GAME OVER';
    if (state.puzzle && state.queue && state.queue.length) hint += ' · THEN ' + state.queue.slice(0, 3).join(' ');
    el.textContent = 'NEXT ' + state.next + hint;
    el.classList.toggle('warn', !!p.endsRun);
  }
  function goalUi() {
    var el = $('goal');
    if (!state || mode !== 'play') { el.textContent = ''; return; }
    if (isPuzzle) { var pz = PZ[puzzleIdx]; el.textContent = 'MAKE ' + pz.goal + ' · drops ' + state.drops + '/' + pz.limit + ' · ★★★ ≤ ' + pz.par; el.classList.toggle('hot', state.drops >= pz.limit - 1); return; }
    var g = L.nextGoal(state.max);
    el.textContent = 'GOAL ' + g.target + ' · ' + g.current + '/' + g.target;
    el.classList.toggle('hot', g.remaining <= Math.max(16, Math.floor(g.target * .12)));
  }
  function pauseUi() {
    var el = $('pause-stats');
    if (!el || !state) { if (el) el.textContent = ''; return; }
    var g = L.nextGoal(state.max), top = 0;
    for (var c = 0; c < L.COLS; c++) if (state.grid[0][c]) top++;
    el.textContent = activeMode() + ' · score ' + state.score + ' · ' + state.drops + ' drops · top tile ' + state.max +
      ' · best chain x' + (state.maxChain || 0) + ' | Next ' + state.next + ' · goal ' + g.current + '/' + g.target +
      (isBlitz ? ' · time left ' + Math.ceil(blitzT) + 's' : '') + ' · top row ' + top + '/' + L.COLS;
  }
  function earn(res) {
    if (isPuzzle) return;
    if (res.chain > (save.maxChain || 0)) save.maxChain = res.chain;
    achCheck();
    if (res.chain >= 3 && save.bombs < 5) { save.bombs++; say('+1 💣 CHAIN x' + res.chain + '!'); }
    if (state.drops % 20 === 0 && save.swaps < 5) { save.swaps++; }
    persist();
  }
  function achCheck() {
    MergeAch.check(save).forEach(function (d) { say(d.icon + ' ' + d.name + '!'); msgT = 2.5; persist(); });
  }
  function achUi() {
    var done = MergeAch.DEFS.filter(function (d) { return save.ach && save.ach[d.id]; }).length;
    var stats = [['Runs', save.runs || 0], ['Best score', save.best || 0], ['Top tile', save.bestTile || 0], ['Best chain', 'x' + (save.maxChain || 0)],
      ['Rise best', save.riseBest || 0], ['Blitz best', save.blitzBest || 0], ['Hardcore best', save.hardBest || 0], ['Achievements', done + '/' + MergeAch.DEFS.length]];
    $('alist').innerHTML = '<div class="stats">' + stats.map(function (r) { return '<div><b>' + r[1] + '</b><i>' + r[0] + '</i></div>'; }).join('') + '</div>' + MergeAch.DEFS.map(function (d) {
      var on = save.ach && save.ach[d.id];
      return '<div class="ach' + (on ? ' on' : '') + '"><span>' + (on ? d.icon : '🔒') + '</span><b>' + d.name + '</b><i>' + d.desc + '</i></div>';
    }).join('');
  }
  $('achbtn').onclick = function () { achUi(); $('ach-panel').classList.remove('hidden'); };
  $('achback').onclick = function () { $('ach-panel').classList.add('hidden'); };
  function say(t) { $('msg').textContent = t; msgT = 1.2; }
  function bonusClear() { // revive: remove all 2 and 4 tiles
    for (var r = 0; r < L.ROWS; r++) for (var c = 0; c < L.COLS; c++) if (state.grid[r][c] <= 4) state.grid[r][c] = 0;
    L.gravity(state.grid); state.over = false; view = state.grid.map(function (r) { return r.slice(); });
  }
  function runKey() { return 'mergedrop-run'; }
  function isClassic() { return !isPuzzle && !isBlitz && !isHard && !isRise && !isDaily; }
  function saveRun() {
    try {
      if (mode === 'play' || mode === 'paused') { if (isClassic() && state && !state.over && !queue.length && state.drops > 0) localStorage.setItem(runKey(), JSON.stringify({ s: L.snapshot(state), u: undos })); }
    } catch (e) {}
  }
  function clearRun() { try { localStorage.removeItem(runKey()); } catch (e) {} }
  function loadRun() {
    try { var r = JSON.parse(localStorage.getItem(runKey()) || 'null'); return r && r.s && r.s.grid && r.s.grid.length === L.ROWS ? r : null; } catch (e) { return null; }
  }
  function playOrResume() {
    var r = loadRun(); start();
    if (!r) return;
    L.restore(state, r.s); view = state.grid.map(function (x) { return x.slice(); }); undos = r.u | 0; snap = null;
    $('score').textContent = state.score; coachStep = -1; coachUi(); pwUi(); planUi(); say('Run resumed');
  }
  function finish() {
    clearRun();
    $('otitle').textContent = 'GAME OVER'; $('pznext').classList.add('hidden'); $('share').classList.remove('hidden');
    mode = 'over'; pwUi(); planUi();
    var beforeRecord = modeBest();
    if (isDaily) {
      var dl = save.daily, t = today();
      if (dl.date !== t) { dl.date = t; dl.best = 0; }
      if (dl.last !== t) { var y = new Date(); y.setDate(y.getDate() - 1); dl.streak = dl.last === (y.getFullYear() + '-' + (y.getMonth() + 1) + '-' + y.getDate()) ? dl.streak + 1 : 1; dl.last = t; }
      if (state.score > dl.best) dl.best = state.score;
      persist();
    } else if (isBlitz) { if (state.score > (save.blitzBest || 0)) save.blitzBest = state.score; }
    else if (isHard) { if (state.score > (save.hardBest || 0)) save.hardBest = state.score; }
    else if (isRise) { if (state.score > (save.riseBest || 0)) save.riseBest = state.score; }
    else if (state.score > save.best) save.best = state.score;
    persist();
    var before = nextLock();
    if (state.max > save.bestTile) save.bestTile = state.max;
    save.lastRun = { mode: activeMode(), score: state.score, drops: state.drops, max: state.max, chain: state.maxChain || 0, record: beforeRecord };
    save.runs++; persist(); achCheck();
    if (nextLock() !== before) say('🎨 New theme unlocked!');
    $('tlock').textContent = nextLock();
    var goal = L.nextGoal(state.max);
    $('ftile').textContent = 'Top tile ' + state.max + ' (best ' + save.bestTile + ')' + (goal.complete ? ' · Mastery goal reached!' : ' · Next goal ' + goal.target + ' (' + goal.remaining + ' to go)');
    $('fstats').textContent = state.drops + ' drops · best chain x' + (state.maxChain || 0) + ' · level ' + (L.level(state) + 1);
    var chase = L.recordChase(state.score, beforeRecord);
    $('fchase').classList.remove('record'); void $('fchase').offsetWidth; if (chase.newRecord) $('fchase').classList.add('record');
    $('fchase').textContent = chase.newRecord ? '🏆 NEW ' + activeMode().toUpperCase() + ' RECORD · beat old score by ' + (chase.score - chase.record) : 'Need ' + chase.needed + ' more point' + (chase.needed === 1 ? '' : 's') + ' to beat ' + activeMode() + ' record';
    if (chase.newRecord && !reduceMotion) { var rc = layout(); for (var k = 0; k < 60; k++) parts.push({ x: W / 2, y: rc.by + rc.cell * 2, vx: (Math.random() - .5) * 900, vy: -Math.random() * 800 - 200, life: .6, c: color(Math.pow(2, 1 + k % 10)), coin: k % 5 === 0 }); }
    if (window.MergeAds) { try { window.MergeAds.maybeInterstitial(save.runs); } catch (e) {} }
    $('fscore').textContent = state.score; $('fbest').textContent = isBlitz ? '⚡ Blitz best ' + (save.blitzBest || 0) : isHard ? '💀 Hardcore best ' + (save.hardBest || 0) : isRise ? '⬆ Rise best ' + save.riseBest : isDaily ? 'Daily best ' + save.daily.best + ' · 🔥 streak ' + save.daily.streak : 'Best ' + save.best;
    $('over').classList.remove('hidden'); buzz(200); MergeAudio.over();
  }
  function puzzleStars(pz, drops) { return hinted ? Math.min(2, puzzleStars0(pz, drops)) : puzzleStars0(pz, drops); }
  function puzzleStars0(pz, drops) { return drops <= pz.par ? 3 : drops <= pz.par + 1 ? 2 : 1; }
  function puzzleCheck() {
    var pz = PZ[puzzleIdx];
    if (state.max >= pz.goal) puzzleDone(true, puzzleStars(pz, state.drops));
    else if (state.over || state.drops >= pz.limit) puzzleDone(false, 0);
  }
  function puzzleDone(win, stars) {
    mode = 'over'; pwUi(); planUi(); goalUi();
    var pz = PZ[puzzleIdx], star = function (n) { return n ? '★★★'.slice(0, n) + '☆☆☆'.slice(0, 3 - n) : '☆☆☆'; };
    if (win && stars > (save.puzzle[puzzleIdx] || 0)) { save.puzzle[puzzleIdx] = stars; for (var i = 0; i < save.puzzle.length; i++) if (!save.puzzle[i]) save.puzzle[i] = 0; persist();achCheck(); }
    if (isDailyPz && win) {
      var dp = save.dpz, t = today();
      if (dp.date !== t) { var y = new Date(); y.setDate(y.getDate() - 1); var ys = y.getFullYear() + '-' + (y.getMonth() + 1) + '-' + y.getDate(); dp.streak = dp.last === ys ? dp.streak + 1 : 1; dp.date = t; dp.last = t; dp.stars = stars; persist(); }
      else if (stars > dp.stars) { dp.stars = stars; persist(); }
    }
    $('otitle').textContent = win ? 'SOLVED!' : state.over ? 'BOARD FULL' : 'OUT OF MOVES';
    $('fscore').textContent = star(win ? stars : 0);
    $('fbest').textContent = (isDailyPz ? 'Daily Puzzle · streak ' + save.dpz.streak + ' · best today ' + star(save.dpz.stars) : 'Puzzle ' + (puzzleIdx + 1) + ' · best ') + (isDailyPz ? '' : '' + star(save.puzzle[puzzleIdx] || 0));
    $('fchase').textContent = win ? (stars === 3 ? 'Perfect — par ' + pz.par + ' drops!' : 'Solved in ' + state.drops + ' drops · par ' + pz.par + ' for ★★★') : 'Make a ' + pz.goal + ' tile within ' + pz.limit + ' drops.';
    $('ftile').textContent = 'Top tile ' + state.max; $('fstats').textContent = state.drops + ' drops';
    $('share').classList.add('hidden'); $('pznext').classList.toggle('hidden', isDailyPz || !(win && puzzleIdx + 1 < PZ.length));
    $('over').classList.remove('hidden'); buzz(win ? 60 : 200); if (win) MergeAudio.clear(); else MergeAudio.over();
  }
  function puzzleUi() {
    var total = 0, got = 0, open = true;
    $('pz-list').innerHTML = PZ.map(function (p, i) {
      var st = save.puzzle[i] || 0, locked = i > 0 && !(save.puzzle[i - 1] > 0);
      total += 3; got += st;
      return '<button data-i="' + i + '"' + (locked ? ' disabled' : '') + '>' + (i + 1) + '<br>' + (locked ? '🔒' : '★★★'.slice(0, st) + '☆☆☆'.slice(0, 3 - st)) + '</button>';
    }).join('');
    $('pz-sum').textContent = 'Reach the goal tile in few drops. Fixed tile order — plan ahead. ' + got + '/' + total + ' ★';
    Array.prototype.forEach.call($('pz-list').children, function (b) { b.onclick = function () { $('pz-panel').classList.add('hidden'); $('menu').classList.remove('behind'); $('menu').classList.add('hidden'); startPuzzle(+b.getAttribute('data-i')); }; });
  }
  $('puzzle').onclick = function () { puzzleUi(); $('menu').classList.add('behind'); $('pz-panel').classList.remove('hidden'); };
  $('dpuzzle').onclick = function () { $('menu').classList.add('hidden'); startPuzzle(L.dailyPuzzleIndex(today(), PZ.length), true); };
  $('pzback').onclick = function () { $('pz-panel').classList.add('hidden'); $('menu').classList.remove('behind'); };
  $('pznext').onclick = function () { startPuzzle(puzzleIdx + 1); };
  function endGame() {
    if (isBlitz) { finish(); return; }
    if (!revived && window.MergeAds && window.MergeAds.rewardedReady()) { $('cscore').textContent = state.score; $('cont').classList.remove('hidden'); mode = 'cont'; }
    else if (!revived && state.score > 200) { $('cscore').textContent = state.score; $('cont').classList.remove('hidden'); mode = 'cont'; }
    else finish();
  }
  function colAt(x) {
    var l = layout(), c = Math.floor((x - l.bx) / l.cell);
    return c >= 0 && c < L.COLS ? c : -1;
  }
  function bombAt(x, y) {
    var l = layout(), c = colAt(x), r = Math.floor((y - l.by) / l.cell);
    var res = r >= 0 && r < L.ROWS ? L.bomb(state, r, c) : null;
    if (!res) { say('Tap a tile'); return; }
    bombMode = false; snap = null; save.bombs--; save.bombsUsed = (save.bombsUsed || 0) + 1; achCheck(); persist();
    queue = res.frames.slice(); queue.res = res; stepT = 0; MergeAudio.bomb(); buzz(40);
    for (var i = 0; i < 14; i++) parts.push({ x: l.bx + (c + .5) * l.cell, y: l.by + (r + .5) * l.cell, vx: (Math.random() - .5) * 400, vy: (Math.random() - .8) * 400, life: .6, c: '#ff9f1c' });
  }
  function tap(x, y) {
    if (mode !== 'play' || queue.length) return;
    var c = colAt(x); if (c < 0) return;
    if (bombMode) { return bombAt(x, y); }
    var pre = L.snapshot(state);
    var res = L.drop(state, c); if (!res) { say('Column full'); buzz(30); return; }
    snap = pre; coachAdvance(res); pzPath += c; hintCol = -1;
    queue = res.frames.slice(); queue.res = res; stepT = 0; MergeAudio.drop(c);
    
  }
  var view_next = 2;
  function playFrame(f) {
    view = f.grid;
    if (f.boom) return;
    if (f.rise) { MergeAudio.rise(); buzz(25); say('⬆ RISING!'); msgT = 1; return; }
    if (f.clear) {
      var lc = layout(); say('BOARD CLEAR +' + f.gain + '!'); msgT = 2; buzz(80);
      floats.push({ x: W / 2, y: lc.by + lc.cell * L.ROWS / 2, t: 0, txt: 'BOARD CLEAR!', big: true });
      for (var j = 0; j < 40; j++) parts.push({ x: W / 2, y: lc.by + lc.cell * L.ROWS / 2, vx: (Math.random() - .5) * 700, vy: (Math.random() - .8) * 700, life: .6, c: color(Math.pow(2, 1 + j % 8)), coin: j % 4 === 0 });
      MergeAudio.clear();
      if (save.bombs < 5) { save.bombs++; persist(); }
      save.clears = (save.clears || 0) + 1; achCheck();
      return;
    }
    if (f.land) { pops[f.land[0] + ',' + f.land[1]] = 1.25; squash[f.land[0] + ',' + f.land[1]] = 1; falls[f.land[0] + ',' + f.land[1]] = f.land[0] + 1.2; MergeAudio.land(); return; }
    var l = layout(), m = f.merge;
    pops[m.to[0] + ',' + m.to[1]] = 1.4;
    bursts.push({ x: l.bx + (m.to[1] + .5) * l.cell, y: l.by + (m.to[0] + .5) * l.cell, t: 0, s: l.cell * (f.chain > 1 ? 2.6 : 1.9), rot: Math.random() * 6 });
    for (var i = 0; i < 10; i++) parts.push({ x: l.bx + (m.to[1] + .5) * l.cell, y: l.by + (m.to[0] + .5) * l.cell, vx: (Math.random() - .5) * 300, vy: (Math.random() - .8) * 300, life: .6, c: color(m.value), coin: f.chain > 1 && i % 3 === 0 });
    floats.push({ x: l.bx + (m.to[1] + .5) * l.cell, y: l.by + (m.to[0] + .5) * l.cell, t: 0, txt: '+' + f.gain, big: f.chain > 1 });
    MergeAudio.merge(m.value, f.chain); buzz(f.chain > 1 ? [12, 20, 12 + 8 * Math.min(f.chain, 5)] : 10);
    if (!reduceMotion && (f.chain > 1 || m.value >= 256)) shake = Math.min(14, 4 + f.chain * 2 + (m.value >= 1024 ? 4 : 0));
    if (f.chain > 1) { say('CHAIN x' + f.chain + '!'); banner = { t: 0, chain: f.chain, txt: 'CHAIN x' + f.chain }; }
    else if (m.value >= 64 && m.value > tileMark) banner = { t: 0, chain: 1, txt: 'NEW ' + m.value + '!' };
    if (m.value > tileMark) tileMark = m.value;
  }
  function after() {
    var res = queue.res; queue = []; earn(res); pwUi(); planUi();
    $('score').textContent = state.score;
    goalUi();
    if (L.level(state) > lastLv) { lastLv = L.level(state); if (lastLv + 1 > (save.maxLevel || 0)) { save.maxLevel = lastLv + 1; achCheck(); } MergeAudio.level(); say('⚠ LEVEL ' + (lastLv + 1) + (lastLv >= 2 ? ' — stones!' : '')); msgT = 2; }
    if (isBlitz) { if (state.score > (save.blitzBest || 0)) $('best').textContent = 'Blitz best ' + state.score; if (res && res.chain > 1) { blitzT = Math.min(99, blitzT + 2 * (res.chain - 1)); say('+' + 2 * (res.chain - 1) + 's'); msgT = 1; } } else if (isRise) { if (state.score > (save.riseBest || 0)) $('best').textContent = 'Rise best ' + state.score; } else if (!isDaily && state.score > save.best) $('best').textContent = 'Best ' + state.score;
    if (isPuzzle) { puzzleCheck(); return; }
    if (state.over) endGame();
  }

  var pointerX = -1;
  function ptr(e) { var p = e.touches ? e.touches[0] : e; pointerX = p.clientX; var c = colAt(pointerX); if (c >= 0) { hover = c; planUi(); } }
  cv.addEventListener('pointermove', ptr);
  cv.addEventListener('pointerdown', function (e) { cv.focus(); ptr(e); tap(e.clientX, e.clientY); });
  $('play').onclick = playOrResume; $('daily').onclick = startDaily; $('retry').onclick = function () { if (isPuzzle) return startPuzzle(puzzleIdx, isDailyPz); isBlitz ? startBlitz() : isRise ? startRise() : isDaily ? startDaily() : start(); };
  $('rise').onclick = startRise; $('hard').onclick = startHard; $('blitz').onclick = startBlitz;
  $('home').onclick = function () { mode = 'menu'; $('over').classList.add('hidden'); $('menu').classList.remove('hidden'); dailyUi(); };
  $('revive').onclick = function () {
    var done = function () { revived = true; bonusClear(); $('cont').classList.add('hidden'); mode = 'play'; pwUi(); };
    if (window.MergeAds && window.MergeAds.rewardedReady()) window.MergeAds.showRewarded(done); else done();
  };
  $('bomb').onclick = function () { if (mode === 'play' && !queue.length && save.bombs) { bombMode = !bombMode; pwUi(); planUi(); say(bombMode ? 'Tap a tile to blast' : ''); } };
  $('hint').onclick = function () {
    if (!isPuzzle || mode !== 'play' || queue.length) return;
    var sol = PZ[puzzleIdx].sol; if (!sol) return;
    if (pzPath !== sol.slice(0, pzPath.length)) { say('Off the best line — restart for a hint'); return; }
    hintCol = +sol[pzPath.length]; hover = hintCol; hinted = true; say('Hint: column ' + (hintCol + 1) + ' (max ★★)'); planUi();
  };
  $('undo').onclick = function () {
    if (mode !== 'play' || queue.length || !undos || !snap) return;
    L.restore(state, snap); snap = null; undos--; view = state.grid.map(function (r) { return r.slice(); });
    $('score').textContent = state.score; falls = {}; pops = {}; MergeAudio.undo(); say('↩ Undone'); msgT = 1; pwUi(); goalUi(); planUi();
  };
  $('swap').onclick = function () { if (mode === 'play' && !queue.length && save.swaps) { L.swapNext(state); snap = null; save.swaps--; persist(); pwUi(); planUi(); MergeAudio.swap(); } };
  $('skip').onclick = function () { $('cont').classList.add('hidden'); finish(); };
  function setPaused(p) {
    if (p && (mode !== 'play' || queue.length)) return;
    if (!p && mode !== 'paused') return;
    if (p) { pauseUi(); saveRun(); }
    mode = p ? 'paused' : 'play'; $('pause-panel').classList.toggle('hidden', !p); bombMode = false; pwUi(); planUi();
  }
  $('pause').onclick = function () { setPaused(true); };
  $('resume').onclick = function () { setPaused(false); };
  $('quit').onclick = function () { saveRun(); $('pause-panel').classList.add('hidden'); mode = 'menu'; $('menu').classList.remove('hidden'); dailyUi(); pwUi(); };
  document.addEventListener('visibilitychange', function () { if (document.hidden) setPaused(true); });
  window.addEventListener('pagehide', saveRun);
  function themeUi() {
    var t = theme();
    $('theme').textContent = '🎨 ' + t.name;
  }
  $('theme').onclick = function () {
    for (var i = 1; i <= THEMES.length; i++) {
      var k = (save.theme + i) % THEMES.length;
      if (save.bestTile >= THEMES[k].need) { save.theme = k; break; }
    }
    persist(); themeUi();
    $('tlock').textContent = nextLock();
  };
  function nextLock() {
    for (var i = 0; i < THEMES.length; i++) if (save.bestTile < THEMES[i].need) return 'Reach tile ' + THEMES[i].need + ' to unlock ' + THEMES[i].name;
    return '';
  }
  // ambient pentatonic loop while playing
  var mStep = 0, dangerT = 0;
  function musicTick() {
    if (mode === 'play' && !save.mute && !document.hidden) {
      var inten = state ? Math.min(1, L.level(state) / 5 + (state.drops || 0) / 400) : 0;
      MergeAudio.musicStep(mStep++, inten);
      setTimeout(musicTick, 480 - 130 * inten);
    } else setTimeout(musicTick, 300);
  }
  musicTick();
  setInterval(function () { if (mode === 'play' && !save.mute && $('danger').textContent) MergeAudio.warn(); }, 1400);
  function hapLabel() { $('hap').textContent = save.nohaptic ? '📴' : '📳'; $('set-hap').textContent = save.nohaptic ? '📴 Haptics OFF' : '📳 Haptics ON'; }
  $('hap').onclick = function () { save.nohaptic = !save.nohaptic; persist(); hapLabel(); buzz(30); };
  function muteLabel() { $('mute').textContent = save.mute ? '🔇' : '🔊'; $('set-mute').textContent = save.mute ? '🔇 Sound OFF' : '🔊 Sound ON'; }
  $('mute').onclick = function () { save.mute = !save.mute; persist(); muteLabel(); };
  function applyVol() { MergeAudio.setVolume('music', save.musicVol); MergeAudio.setVolume('sfx', save.sfxVol); }
  applyVol();
  $('setbtn').onclick = function () { $('vol-music').value = Math.round(save.musicVol * 100); $('vol-sfx').value = Math.round(save.sfxVol * 100); $('set-panel').classList.remove('hidden'); };
  $('setback').onclick = function () { $('set-panel').classList.add('hidden'); };
  $('vol-music').oninput = function () { save.musicVol = this.value / 100; applyVol(); persist(); };
  $('vol-sfx').oninput = function () { save.sfxVol = this.value / 100; applyVol(); persist(); };
  $('vol-sfx').onchange = function () { MergeAudio.merge(8, 1); };
  $('set-mute').onclick = $('mute').onclick; $('set-hap').onclick = $('hap').onclick;
  $('share').onclick = function () {
    var txt = L.shareText(save.lastRun, today());
    if (!txt) return;
    var done = function () { say('📋 Result copied!'); };
    if (navigator.share) { navigator.share({ text: txt }).catch(function () {}); }
    else if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(txt).then(done, function () { say(txt); }); }
    else say(txt);
  };
  function dailyUi() {
    $('play').textContent = loadRun() ? 'RESUME RUN' : 'PLAY';
    $('mbest').textContent = 'Classic ' + save.best + ' · Rise ' + (save.riseBest || 0) + ' · Blitz ' + (save.blitzBest || 0) + ' · Hardcore ' + (save.hardBest || 0) + ' · Daily ' + L.dailyRecord(save.daily.best, save.daily.date, today());
    var r = save.lastRun;
    $('mrecords').textContent = r ? 'Last run: ' + r.mode + ' ' + r.score + ' · ' + r.drops + ' drops · tile ' + r.max + ' · chain x' + r.chain + (r.score > r.record ? ' · RECORD!' : ' · record ' + r.record) : 'No runs yet — build first record.';
    $('daily').textContent = '📅 DAILY' + (L.liveStreak(save.daily.streak, save.daily.last, today()) ? ' 🔥' + L.liveStreak(save.daily.streak, save.daily.last, today()) : '');
  }
  pwUi(); muteLabel(); hapLabel(); dailyUi(); themeUi(); $('tlock').textContent = nextLock();
  addEventListener('keydown', function (e) {
    if (e.key >= '1' && e.key <= '5') {
      var c = +e.key - 1; hover = c; var l = layout(); tap(l.bx + (c + .5) * l.cell, l.by + l.cell * L.ROWS); return;
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Home' || e.key === 'End') {
      if (mode !== 'play' || queue.length) return;
      e.preventDefault();
      hover = e.key === 'Home' ? 0 : e.key === 'End' ? L.COLS - 1 : Math.max(0, Math.min(L.COLS - 1, hover + (e.key === 'ArrowLeft' ? -1 : 1)));
      planUi();
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      if (document.activeElement !== cv || mode !== 'play' || queue.length) return;
      e.preventDefault();
      var k = layout(); tap(k.bx + (hover + .5) * k.cell, k.by + k.cell * L.ROWS); return;
    }
    if (e.key === 'Escape') {
      if (mode === 'play') setPaused(true); else if (mode === 'paused') setPaused(false);
    }
  });
  view = L.create(1).grid;

  function rrect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function tile(x, y, s, v, sc, sq) {
    var cx = x + s / 2, cy = y + s / 2, z = (s - 6) * sc;
    if (sq) { ctx.save(); ctx.translate(cx, y + s); ctx.scale(1 + .14 * sq, 1 - .16 * sq); ctx.translate(-cx, -(y + s)); sc = 1; z = s - 6; }
    var ti = tileImg(v);
    // PNG tiles carry ~10% transparent padding: draw them a cell wide so the jelly fills the board slot
    if (ti) { var zi = (s + 4) * sc; ctx.drawImage(ti, cx - zi / 2, cy - zi / 2, zi, zi); }
    else { ctx.fillStyle = color(v); rrect(cx - z / 2, cy - z / 2, z, z, 10); ctx.fill();
    ctx.fillStyle = '#ffffff30'; rrect(cx - z / 2 + 3, cy - z / 2 + 3, z - 6, z * .35, 7); ctx.fill(); }
    if (v < 0 && ti) { if (sq) ctx.restore(); return; }
    if (v < 0) { ctx.strokeStyle = '#8a8aa0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - z * .22, cy - z * .22); ctx.lineTo(cx + z * .22, cy + z * .22); ctx.moveTo(cx + z * .22, cy - z * .22); ctx.lineTo(cx - z * .22, cy + z * .22); ctx.stroke(); return; }
    ctx.fillStyle = '#10102a'; ctx.font = '800 ' + (s * (v >= 1000 ? .3 : v >= 100 ? .38 : .46) * sc) + 'px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(v, cx, cy + 2);
    if (sq) ctx.restore();
  }
  var squash = {};
  var shake = 0, reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var last = performance.now();
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (queue.length) { stepT -= dt; if (stepT <= 0) { playFrame(queue.shift()); stepT = 0.26; if (!queue.length) after(); } }
    if (isBlitz && mode === 'play') { blitzT -= dt; if (blitzT <= 0 && !queue.length) { blitzT = 0; state.over = true; finish(); } }
    if (isBlitz && (mode === 'play' || mode === 'paused')) { $('timer').textContent = Math.ceil(blitzT) + 's'; $('timer').classList.toggle('warn', blitzT < 10); }
    if (msgT > 0) { msgT -= dt; if (msgT <= 0) $('msg').textContent = ''; }
    var l = layout(), cell = l.cell;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (shake > 0) { shake = Math.max(0, shake - dt * 30); ctx.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake); }
    var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, theme().bg[0]); g.addColorStop(1, theme().bg[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    var bgE = IMGS.bg; if (bgE && bgE.ok) { var bi = bgE.img, bs = Math.max(W / bi.width, H / bi.height); ctx.globalAlpha = .55; ctx.drawImage(bi, (W - bi.width * bs) / 2, (H - bi.height * bs) / 2, bi.width * bs, bi.height * bs); ctx.globalAlpha = 1; }
    if (isBlitz && (mode === 'play' || mode === 'paused')) { ctx.fillStyle = blitzT < 10 ? '#ff4d4d' : '#fff'; ctx.font = '700 ' + Math.round(cell * 0.6) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('⚡ ' + Math.ceil(blitzT) + 's', W / 2, l.by - 14); }
    // board
    var bdE = IMGS.board;
    if (bdE && bdE.ok && bdE.img.src.indexOf('/gen/') < 0) {
      // owner board-bg is a full scene (1080x1512): map its slot grid onto the cells and clip to the glass panel
      var ks = bdE.img.width / 1080, gx = 176 * ks, gy = 152 * ks, gw = 734 * ks, gh = 1163 * ks;
      var fx = cell * L.COLS / gw, fy = cell * L.ROWS / gh, ox = l.bx - gx * fx, oy = l.by - gy * fy;
      ctx.save(); rrect(ox + 152 * ks * fx, oy + 127 * ks * fy, 781 * ks * fx, 1216 * ks * fy, 28 * fx); ctx.clip();
      ctx.drawImage(bdE.img, ox, oy, bdE.img.width * fx, bdE.img.height * fy); ctx.restore();
    } else if (bdE && bdE.ok) ctx.drawImage(bdE.img, l.bx - 6, l.by - 6, cell * L.COLS + 12, cell * L.ROWS + 12);
    else { ctx.fillStyle = '#ffffff12'; rrect(l.bx - 6, l.by - 6, cell * L.COLS + 12, cell * L.ROWS + 12, 14); ctx.fill(); }
    var coachCol = -1;
    if (state && mode === 'play' && (coachStep === 0 || coachStep === 1)) {
      for (var cc = 0; cc < L.COLS && coachCol < 0; cc++) { var pv = L.preview(state, cc); if (pv.mergeValue && !pv.endsRun) coachCol = cc; }
    }
    for (var c = 0; c < L.COLS; c++) {
      ctx.fillStyle = (c === hintCol || c === coachCol) && mode === 'play' ? 'rgba(255,214,10,' + (.18 + .12 * Math.sin(Date.now() / 180)) + ')' : c === hover && mode === 'play' ? '#ffffff18' : '#ffffff08';
      ctx.fillRect(l.bx + c * cell + 2, l.by, cell - 4, cell * L.ROWS);
    }
    if (state && mode === 'play') {
      var hi = 0; for (c = 0; c < L.COLS; c++) if (state.grid[1][c]) hi++;
      if (hi >= 2) { ctx.fillStyle = 'rgba(255,60,60,' + (0.16 + (reduceMotion ? 0 : 0.1 * Math.sin(now / 150))) + ')'; ctx.fillRect(l.bx, l.by, cell * L.COLS, cell * 2); }
      $('danger').textContent = hi >= 2 ? 'DANGER · TOP ROW' : '';
    }
    for (var fk in falls) { falls[fk] -= dt * (6 + (falls[fk] < 1.5 ? 0 : 14)); if (falls[fk] <= 0) delete falls[fk]; }
    for (var k in pops) { pops[k] -= dt * 4; if (pops[k] <= 1) { delete pops[k]; delete squash[k]; } }
    for (var r = 0; r < L.ROWS; r++) for (c = 0; c < L.COLS; c++) {
      var v = view[r][c]; if (!v) continue;
      tile(l.bx + c * cell + 3, l.by + (r - (falls[r + ',' + c] || 0)) * cell + 3, cell - 6, v, pops[r + ',' + c] || 1, squash[r + ',' + c] && !reduceMotion ? (pops[r + ',' + c] - 1) / .25 : 0);
    }
    // next tile preview above hovered column
    if (state && mode === 'play' && !queue.length) {
      var hx = l.bx + hover * cell;
      view_next = state.next;
      ctx.globalAlpha = .9; tile(hx + 3, l.by - cell - 14, cell - 6, state.next, 1); ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffffff55'; ctx.fillRect(hx + cell / 2 - 1, l.by - 10, 2, 8);
      // ghost landing preview; gold if it will merge
      var gr = -1; for (var rr = L.ROWS - 1; rr >= 0; rr--) if (!state.grid[rr][hover]) { gr = rr; break; }
      if (gr >= 0) {
        var pp = L.preview(state, hover), mg = pp.mergeValue > 0;
        ctx.strokeStyle = mg ? '#ffd166' : '#ffffff66'; ctx.lineWidth = mg ? 3 : 2; ctx.setLineDash(mg ? [] : [6, 5]);
        rrect(hx + 5, l.by + gr * cell + 5, cell - 10, cell - 10, 10); ctx.stroke(); ctx.setLineDash([]);
        // faint value (merge result if merging) so the outcome is readable on the board
        ctx.save(); ctx.globalAlpha = .55; ctx.fillStyle = mg ? '#ffd166' : '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = '800 ' + Math.round(cell * .34) + 'px system-ui,sans-serif';
        ctx.fillText(String(mg ? pp.mergeValue : state.next), hx + cell / 2, l.by + gr * cell + cell / 2); ctx.restore();
      }
    }
    var fxi = IMGS.fxm && IMGS.fxm.ok ? IMGS.fxm.img : null;
    for (var bi = bursts.length - 1; bi >= 0; bi--) {
      var bu = bursts[bi]; bu.t += dt; if (bu.t > .4) { bursts.splice(bi, 1); continue; }
      if (!fxi) continue;
      var k = bu.t / .4, sz = bu.s * (.5 + .7 * Math.sqrt(k));
      ctx.save(); ctx.globalAlpha = 1 - k; ctx.translate(bu.x, bu.y); ctx.rotate(bu.rot + k * .6);
      ctx.drawImage(fxi, -sz / 2, -sz / 2, sz, sz); ctx.restore();
    }
    ctx.globalAlpha = 1;
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i]; p.life -= dt; if (p.life <= 0) { parts.splice(i, 1); continue; }
      p.vy += 700 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      ctx.globalAlpha = p.life / .6;
      if (p.coin && IMGS.coin && IMGS.coin.ok) ctx.drawImage(IMGS.coin.img, p.x - 9, p.y - 9, 18, 18);
      else { ctx.fillStyle = p.c; ctx.fillRect(p.x - 3, p.y - 3, 6, 6); }
    }
    ctx.globalAlpha = 1;
    for (i = floats.length - 1; i >= 0; i--) {
      var f = floats[i]; f.t += dt; if (f.t > .9) { floats.splice(i, 1); continue; }
      ctx.globalAlpha = 1 - f.t / .9; ctx.fillStyle = f.big ? '#ffd166' : '#fff';
      ctx.font = '800 ' + (f.big ? 26 : 20) + 'px system-ui'; ctx.textAlign = 'center';
      ctx.fillText(f.txt, f.x, f.y - 20 - f.t * 50);
    }
    ctx.globalAlpha = 1;
    if (banner) {
      banner.t += dt;
      if (banner.t > 1) banner = null;
      else {
        var bl = layout(), bk = banner.t, pop = bk < .15 ? .6 + 2.7 * bk : 1 + .04 * Math.sin(bk * 14), bw = Math.min(bl.cell * 4.2, 340) * pop, bh = bw / 2;
        var cimg = IMGS.fxc && IMGS.fxc.ok ? IMGS.fxc.img : null;
        ctx.save(); ctx.globalAlpha = bk > .7 ? (1 - bk) / .3 : 1; ctx.translate(bl.bx + 2.5 * bl.cell, bl.by + 1.2 * bl.cell);
        if (cimg) ctx.drawImage(cimg, -bw / 2, -bh / 2, bw, bh);
        ctx.font = '800 ' + Math.round(bh * .3) + 'px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 5; ctx.strokeStyle = '#5a2d82'; ctx.strokeText(banner.txt, 0, 0);
        ctx.fillStyle = '#fff'; ctx.fillText(banner.txt, 0, 0); ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
    $('pause').classList.toggle('hide', mode === 'menu' || mode === 'over' || mode === 'cont');
    $('hud').style.visibility = mode === 'menu' ? 'hidden' : '';
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  window.__merge = { get state() { return state; }, setBoard: function (g, score) { if (!state) return; state.grid = g.map(function (r) { return r.slice(); }); view = state.grid.map(function (r) { return r.slice(); }); if (score != null) state.score = score; } };
})();

// Owner-supplied ui-panel.png takes priority over generated fallback (border-image has no multi-source fallback).
(function () {
  var im = new Image();
  im.onload = function () { document.documentElement.style.setProperty('--panel', 'url(assets/ui-panel.png)'); };
  im.src = 'assets/ui-panel.png';
})();
