// Merge Drop pure logic: 5x7 grid, drop numbered tiles, equal neighbours merge.
(function (root) {
  var COLS = 5, ROWS = 7, STONE = -1, CLEAR_BONUS = 500; // board reduced to <=1 tile by a chain
  function nonNegative(v, fallback) { return typeof v === 'number' && isFinite(v) && v >= 0 ? v : fallback; }
  // Browser saves are user-editable state; normalize malformed fields before UI reads them.
  function normalizeSave(raw) {
    raw = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    var out = Object.assign({ best: 0, mute: false, bombs: 2, swaps: 2, seen: false, bestTile: 0, runs: 0, theme: 0, daily: { date: '', best: 0, streak: 0, last: '' } }, raw);
    ['best', 'bombs', 'swaps', 'bestTile', 'runs', 'maxChain', 'bombsUsed', 'maxLevel', 'clears', 'riseBest', 'blitzBest', 'hardBest'].forEach(function (k) {
      if (k in raw) out[k] = nonNegative(raw[k], 0);
    });
    out.mute = typeof raw.mute === 'boolean' ? raw.mute : false;
    ['sfxVol', 'musicVol'].forEach(function (k) { out[k] = typeof raw[k] === 'number' && isFinite(raw[k]) ? Math.max(0, Math.min(1, raw[k])) : 1; });
    out.puzzle = Array.isArray(raw.puzzle) ? raw.puzzle.slice(0, 64).map(function (v) { return Number.isInteger(v) && v >= 0 && v <= 3 ? v : 0; }) : [];
    out.seen = typeof raw.seen === 'boolean' ? raw.seen : false;
    out.theme = Number.isInteger(raw.theme) && raw.theme >= 0 && raw.theme < 3 ? raw.theme : 0;
    var d = raw.daily && typeof raw.daily === 'object' && !Array.isArray(raw.daily) ? raw.daily : {};
    out.daily = {
      date: typeof d.date === 'string' ? d.date : '',
      best: nonNegative(d.best, 0),
      streak: nonNegative(d.streak, 0),
      last: typeof d.last === 'string' ? d.last : ''
    };
    var dp = raw.dpz && typeof raw.dpz === 'object' && !Array.isArray(raw.dpz) ? raw.dpz : {};
    out.dpz = { date: typeof dp.date === 'string' ? dp.date : '', stars: Number.isInteger(dp.stars) && dp.stars >= 0 && dp.stars <= 3 ? dp.stars : 0, streak: nonNegative(dp.streak, 0), last: typeof dp.last === 'string' ? dp.last : '' };
    if (!raw.lastRun || typeof raw.lastRun !== 'object' || Array.isArray(raw.lastRun)) delete out.lastRun;
    if (!raw.ach || typeof raw.ach !== 'object' || Array.isArray(raw.ach)) out.ach = {};
    return out;
  }
  function rng(seed) { var s = seed >>> 0 || 1; var f = function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; f.get = function () { return s; }; f.set = function (v) { s = v; }; return f; }
  function create(seed, rise, hard) {
    var s = { grid: [], score: 0, over: false, rand: rng(seed || 1), max: 2, maxChain: 0, next: 0, drops: 0, rise: !!rise, hard: !!hard };
    for (var r = 0; r < ROWS; r++) s.grid.push(new Array(COLS).fill(0));
    s.next = spawn(s); return s;
  }
  // Daily puzzle: date string -> puzzle index among the harder half (stable per day, no save needed).
  function dailyPuzzleIndex(dateStr, count) {
    var h = 11; dateStr = String(dateStr);
    for (var i = 0; i < dateStr.length; i++) h = (h * 33 + dateStr.charCodeAt(i)) >>> 0;
    var lo = Math.min(count - 1, Math.floor(count / 2)), span = count - lo;
    return lo + (h % span);
  }
  function level(s) { return Math.floor(s.drops / (s.hard ? 9 : 15)); }
  // Next mastery milestone. Pure so HUD and tests share exact goal math.
  function nextGoal(max) {
    var marks = [128, 512, 2048, 4096, 8192, 16384], current = Math.max(0, max || 0), target = marks[marks.length - 1];
    for (var i = 0; i < marks.length; i++) if (current < marks[i]) { target = marks[i]; break; }
    return { current: current, target: target, remaining: Math.max(0, target - current), complete: current >= target };
  }
  // Pure record chase math keeps retry feedback consistent across modes.
  function recordChase(score, record) {
    var current = Math.max(0, score || 0), best = Math.max(0, record || 0);
    return { score: current, record: best, newRecord: current > best, needed: Math.max(1, best - current + 1) };
  }
  // Daily record is scoped to current calendar date; stale saved scores cannot taint today's chase.
  function dailyRecord(record, recordDate, currentDate) {
    return recordDate === currentDate ? Math.max(0, record || 0) : 0;
  }
  // Streak shown to player: broken (0) if last play was neither today nor yesterday. Dates are 'Y-M-D' (unpadded).
  function liveStreak(streak, last, today) {
    if (!streak || !last) return 0;
    if (last === today) return streak;
    var p = today.split('-'), y = new Date(+p[0], +p[1] - 1, +p[2] - 1);
    return last === y.getFullYear() + '-' + (y.getMonth() + 1) + '-' + y.getDate() ? streak : 0;
  }
  function spawn(s) {
    // puzzle mode: fixed tile queue (no randomness, no stones)
    if (s.queue) return s.queue.length ? s.queue.shift() : 2;
    // values scale mildly with the best tile on board
    var lv = level(s), top = Math.max(2, Math.min(s.max, 64)), pool = [2, 2, 2, 4, 4];
    if (top >= 16) pool.push(8); if (top >= 64) pool.push(16);
    // difficulty ramp: more varied values, then unmergeable stones (-1) that only bombs remove
    if (lv >= 1) pool.push(8); if (lv >= 3) pool.push(16, 8);
    // Hardcore: wider value pool from drop 1, stones from level 1 and up to 30% of spawns
    if (s.hard) { pool.push(8, 16); if (lv >= 2) pool.push(32); if (s.rand() < Math.min(0.3, 0.06 * lv)) return STONE; }
    else if (lv >= 2 && s.rand() < Math.min(0.2, 0.05 * (lv - 1))) return STONE;
    return pool[Math.floor(s.rand() * pool.length)];
  }
  function copy(g) { return g.map(function (r) { return r.slice(); }); }
  function gravity(g) {
    for (var c = 0; c < COLS; c++) {
      var col = []; for (var r = ROWS - 1; r >= 0; r--) if (g[r][c]) col.push(g[r][c]);
      for (var r2 = ROWS - 1, i = 0; r2 >= 0; r2--, i++) g[r2][c] = col[i] || 0;
    }
  }
  function landRow(g, c) { for (var r = ROWS - 1; r >= 0; r--) if (!g[r][c]) return r; return -1; }
  // find one connected group of equal tiles (>=2); prefer the lowest-then-leftmost anchor
  function findGroup(g) {
    var seen = {};
    for (var r = ROWS - 1; r >= 0; r--) for (var c = 0; c < COLS; c++) {
      var v = g[r][c]; if (v <= 0 || seen[r * 10 + c]) continue;
      var stack = [[r, c]], cells = []; seen[r * 10 + c] = 1;
      while (stack.length) {
        var p = stack.pop(); cells.push(p);
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
          var nr = p[0] + d[0], nc = p[1] + d[1];
          if (nr < 0 || nc < 0 || nr >= ROWS || nc >= COLS || seen[nr * 10 + nc] || g[nr][nc] !== v) return;
          seen[nr * 10 + nc] = 1; stack.push([nr, nc]);
        });
      }
      if (cells.length > 1) return { v: v, cells: cells, anchor: [r, c] };
    }
    return null;
  }
  // Returns null if column full, else {frames:[{grid,merge?,gain}], gain, chain}
  function drop(s, col) {
    if (s.over || col < 0 || col >= COLS) return null;
    var r = landRow(s.grid, col);
    if (r < 0) return null;
    s.grid[r][col] = s.next; s.drops++;
    var frames = [{ grid: copy(s.grid), land: [r, col] }];
    var out = settle(s, frames);
    s.next = spawn(s);
    checkOver(s);
    if (s.rise && !s.over && s.drops % riseEvery(s) === 0) riseRow(s, out);
    return out;
  }
  function settle(s, frames) {
    var chain = 0, total = 0, g;
    for (;;) {
      g = findGroup(s.grid); if (!g) break;
      chain++;
      var nv = g.v * Math.pow(2, g.cells.length - 1), gain = nv * chain;
      g.cells.forEach(function (p) { s.grid[p[0]][p[1]] = 0; });
      s.grid[g.anchor[0]][g.anchor[1]] = nv;
      gravity(s.grid);
      total += gain; if (nv > s.max) s.max = nv;
      frames.push({ grid: copy(s.grid), merge: { cells: g.cells, to: g.anchor, value: nv }, gain: gain, chain: chain });
    }
    if (chain > s.maxChain) s.maxChain = chain;
    if (chain > 0 && s.drops >= 8 && s.grid.reduce(function (n, row) { return n + row.filter(Boolean).length; }, 0) <= 1) {
      total += CLEAR_BONUS; frames.push({ grid: copy(s.grid), clear: true, gain: CLEAR_BONUS });
    }
    s.score += total;
    return { frames: frames, gain: total, chain: chain, cleared: frames[frames.length - 1].clear === true };
  }
  // Rise mode: every few drops a junk row pushes the stack up; interval shrinks with level (8 -> 4)
  function riseEvery(s) { return Math.max(4, 8 - Math.floor(s.drops / 25)); }
  function riseRow(s, out) {
    var g = s.grid, c, r;
    for (c = 0; c < COLS; c++) if (g[0][c]) { s.over = true; out.frames.push({ grid: copy(g), rise: true }); return; }
    for (r = 0; r < ROWS - 1; r++) g[r] = g[r + 1];
    var row = [], pool = [2, 4, 8, 16];
    for (c = 0; c < COLS; c++) {
      var v, t = 0;
      do { v = pool[Math.floor(s.rand() * pool.length)]; } while (t++ < 20 && ((c && row[c - 1] === v) || g[ROWS - 2][c] === v));
      row.push(v);
    }
    g[ROWS - 1] = row;
    var frames = [{ grid: copy(g), rise: true }];
    var o2 = settle(s, frames);
    out.frames = out.frames.concat(frames); out.gain += o2.gain; out.chain = Math.max(out.chain, o2.chain);
    out.cleared = out.cleared || o2.cleared;
    checkOver(s);
  }
  function checkOver(s) {
    var full = true; for (var c = 0; c < COLS; c++) if (!s.grid[0][c]) full = false;
    if (full) s.over = true;
  }
  // power-up: remove tile at (r,c), tiles fall, cascades may follow. null if empty cell.
  function bomb(s, r, c) {
    if (s.over || r < 0 || c < 0 || r >= ROWS || c >= COLS || !s.grid[r][c]) return null;
    s.grid[r][c] = 0; gravity(s.grid);
    return settle(s, [{ grid: copy(s.grid), boom: [r, c] }]);
  }
  // power-up: re-roll the next tile to a different value
  function swapNext(s) {
    if (s.over) return s.next;
    var n = s.next, t = 0;
    while (n === s.next && t++ < 20) n = spawn(s);
    s.next = n; return n;
  }
  // Preview one drop without changing live state. Used by planning HUD.
  function preview(s, col) {
    var p = {
      grid: copy(s.grid), score: s.score, over: s.over, rand: rng(s.rand.get()),
      max: s.max, next: s.next, drops: s.drops, rise: s.rise, hard: s.hard, queue: s.queue ? s.queue.slice() : undefined
    };
    var out = drop(p, col), mergeValue = 0;
    if (!out) return { full: true, endsRun: false, chain: 0, gain: 0, mergeValue: 0, cleared: false };
    for (var i = out.frames.length - 1; i >= 0; i--) {
      if (out.frames[i].merge) { mergeValue = out.frames[i].merge.value; break; }
    }
    return { full: false, endsRun: !!p.over, chain: out.chain, gain: out.gain, mergeValue: mergeValue, cleared: !!out.cleared };
  }
  // Puzzle: preset board (7 strings of 5 chars, '.'=empty, 'S'=stone, else value digit code via vals) + fixed queue.
  function createPuzzle(pz) {
    var s = create(1, false);
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
      var ch = pz.board[r][c], v = ch === '.' ? 0 : ch === 'S' ? STONE : Math.pow(2, parseInt(ch, 36));
      s.grid[r][c] = v; if (v > s.max) s.max = v;
    }
    s.queue = pz.queue.slice(); s.next = s.queue.shift(); s.puzzle = true;
    return s;
  }
  // undo support: snapshot taken before a drop/power-up, restore puts the state (incl. RNG) back
  function snapshot(s) { return { grid: copy(s.grid), score: s.score, max: s.max, maxChain: s.maxChain, next: s.next, drops: s.drops, rng: s.rand.get(), queue: s.queue ? s.queue.slice() : undefined }; }
  function restore(s, p) { s.grid = copy(p.grid); s.score = p.score; s.max = p.max; s.maxChain = p.maxChain || 0; s.next = p.next; s.drops = p.drops; s.rand.set(p.rng); if (p.queue) s.queue = p.queue.slice(); s.over = false; }
  function shareText(r, date) {
    if (!r) return '';
    var mode = String(r.mode || 'classic'); mode = mode.charAt(0).toUpperCase() + mode.slice(1);
    var bar = ''; for (var v = 2, n = 0; v <= r.max && n < 11; v *= 2, n++) bar += n % 2 ? '\uD83D\uDFE6' : '\uD83D\uDFE8';
    return 'Merge Drop ' + mode + (mode === 'Daily' && date ? ' ' + date : '') + '\n\u2B50 ' + r.score + ' pts \u00B7 tile ' + r.max + ' \u00B7 chain x' + (r.chain || 0) + '\n' + bar + '\nCan you beat me?';
  }
  var api = { shareText: shareText, dailyPuzzleIndex: dailyPuzzleIndex, createPuzzle: createPuzzle, snapshot: snapshot, restore: restore, preview: preview, nextGoal: nextGoal, recordChase: recordChase, dailyRecord: dailyRecord, liveStreak: liveStreak, normalizeSave: normalizeSave, STONE: STONE, level: level, COLS: COLS, ROWS: ROWS, create: create, drop: drop, findGroup: findGroup, bomb: bomb, riseEvery: riseEvery, swapNext: swapNext, gravity: gravity };
  if (typeof module !== 'undefined') module.exports = api; else root.MergeLogic = api;
})(this);
