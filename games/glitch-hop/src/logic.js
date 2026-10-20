/* Glitch Hop - pure game logic (no DOM). Fixed 60Hz step, tile = 16px. */
(function (root) {
  var T = 16, DT = 1 / 60;
  var P = {
    w: 10, h: 14, run: 95, accG: 1100, accA: 800, fric: 1300, fricA: 500,
    grav: 1300, jump: -335, cut: -110, maxFall: 420, coyote: 0.1, buf: 0.12,
    wallSlide: 55, wallJx: 130, wallJy: -300, lock: 0.14, pad: -520, accI: 260, fricI: 120
  };
  var DASH_T = 0.2, DASH_V = 300, WIND_UP = 3000, WIND_CAP = 150, WIND_DOWN = 450, BELT = 55, CR_GONE = 0.35, CR_BACK = 2.6, PHASE = 1.3, cur = null;
  var SAW = { W: [24, 2.4, 0], w: [40, 3.2, 0], V: [24, 2.4, 1], Z: [40, 3.2, 1] };

  function parse(def, hard) {
    var rows = def.rows.slice(), H = rows.length, W = 0, i, r, c;
    for (i = 0; i < H; i++) W = Math.max(W, rows[i].length);
    var lv = { name: def.name, par: def.par, dash: !!def.dash, W: W, H: H, tiles: [], saws: [], coins: [], pads: [], movers: [], cps: [], start: null, exit: null };
    for (r = 0; r < H; r++) {
      var row = [];
      for (c = 0; c < W; c++) {
        var ch = rows[r][c] || '.';
        var kind = 0; // 0 empty 1 solid 2 spikeUp 3 spikeDown
        if (ch === '#') kind = 1;
        else if (ch === 'x') kind = 4;
        else if (ch === '>') kind = 7;
        else if (ch === '<') kind = 8;
        else if (ch === 'i') kind = 9;
        else if (ch === 'u') { kind = 10; lv.hasWind = true; }
        else if (ch === 'v') { kind = 11; lv.hasWind = true; }
        else if (ch === 'a') { kind = 5; lv.hasPhase = true; }
        else if (ch === 'b') { kind = 6; lv.hasPhase = true; }
        else if (ch === '^') kind = 2;
        else if (ch === '~') kind = 3;
        else if (ch === 'S') lv.start = { x: c * T + (T - P.w) / 2, y: (r + 1) * T - P.h };
        else if (ch === 'E') lv.exit = { c: c, r: r };
        else if (ch === 'o') lv.coins.push({ c: c, r: r });
        else if (ch === 'J') lv.pads.push({ c: c, r: r });
        else if (ch === 'C') lv.cps.push({ c: c, r: r, x: c * T + (T - P.w) / 2, y: (r + 1) * T - P.h });
        else if (ch === 'M' || ch === 'N') lv.movers.push({ cx: c * T + 8, cy: r * T, amp: ch === 'M' ? 40 : 32, per: 4, vert: ch === 'N' ? 1 : 0, ph: (c * 0.53) % 6.28, w: 36 });
        else if (SAW[ch]) lv.saws.push({ cx: c * T + 8, cy: r * T + 8, amp: SAW[ch][0], per: SAW[ch][1], vert: SAW[ch][2], ph: (c * 0.37) % 6.28 });
        row.push(kind);
      }
      lv.tiles.push(row);
    }
    if (hard) { lv.cps = []; lv.hard = true; lv.par = Math.round(lv.par * 0.9); lv.saws.forEach(function (w) { w.per *= 0.8; }); lv.movers.forEach(function (m) { m.per *= 0.8; }); lv.phase = PHASE * 0.85; }
    if (!lv.phase) lv.phase = PHASE;
    return lv;
  }

  function kindAt(lv, c, r) {
    if (c < 0 || c >= lv.W) return 1;
    if (r < 0) return 0;
    if (r >= lv.H) return 0;
    return lv.tiles[r][c];
  }
  function crGone(c, r) { var t = cur && cur.cr[r * 1000 + c]; return t >= CR_GONE; }
  function phaseOn(lv, t, k) { return (Math.floor(t / lv.phase) % 2 === 0) === (k === 5); }
  function solidAt(lv, c, r) {
    var k = kindAt(lv, c, r);
    return k === 1 || (k >= 7 && k <= 9) || (k === 4 && !crGone(c, r)) || ((k === 5 || k === 6) && cur && phaseOn(lv, cur.t, k));
  }
  function boxSolid(lv, x, y) {
    var c0 = Math.floor(x / T), c1 = Math.floor((x + P.w - 0.001) / T);
    var r0 = Math.floor(y / T), r1 = Math.floor((y + P.h - 0.001) / T);
    for (var r = r0; r <= r1; r++) for (var c = c0; c <= c1; c++) if (solidAt(lv, c, r)) return true;
    return false;
  }
  function onIce(lv, s) {
    var br = Math.floor((s.y + P.h + 1) / T), a = Math.floor(s.x / T), b = Math.floor((s.x + P.w - 0.001) / T);
    for (var c = a; c <= b; c++) if (kindAt(lv, c, br) === 9) return true;
    return false;
  }
  function sawPos(sw, t) {
    var o = sw.amp * Math.sin(6.2832 * t / sw.per + sw.ph);
    return sw.vert ? { x: sw.cx, y: sw.cy + o } : { x: sw.cx + o, y: sw.cy };
  }

  function movPos(m, t) {
    var o = m.amp * Math.sin(6.2832 * t / m.per + m.ph);
    return m.vert ? { x: m.cx, y: m.cy + o } : { x: m.cx + o, y: m.cy };
  }

  function create(lv) {
    return {
      lv: lv, x: lv.start.x, y: lv.start.y, vx: 0, vy: 0, ground: false, wall: 0, coyote: 0, buf: 0,
      prevJump: false, canCut: false, lock: 0, dead: false, won: false, t: 0, time: 0, deaths: 0,
      got: {}, cr: {}, ride: -1, ncoins: 0, cp: { x: lv.start.x, y: lv.start.y }, face: 1, ev: [], dashT: 0, dashUsed: false, ddir: 1, prevDash: false
    };
  }
  function respawn(s) {
    s.x = s.cp.x; s.y = s.cp.y; s.vx = s.vy = 0; s.dead = false; s.won = false; s.t = 0; s.buf = s.coyote = s.lock = 0;
    s.ground = false; s.wall = 0; s.canCut = false; s.prevJump = true; s.deaths++; s.cr = {}; s.ride = -1; s.dashT = 0; s.dashUsed = false; s.prevDash = true;
  }
  function die(s, cause) { if (!s.dead && !s.won) { s.dead = true; s.ev.push('die:' + (cause || 'hazard')); } }

  function step(s, inp) {
    var lv = s.lv, dir = inp.dir || 0, jump = !!inp.jump;
    if (s.dead || s.won) return;
    cur = s;
    s.t += DT; s.time += DT;
    if (lv.hasPhase && boxSolid(lv, s.x, s.y)) { die(s, 'phase'); return; }
    // moving platforms: carry rider
    if (s.ride >= 0) {
      var rm = lv.movers[s.ride], pa = movPos(rm, s.t - DT), pb = movPos(rm, s.t), ox0 = s.x;
      s.x += pb.x - pa.x; s.y += pb.y - pa.y;
      if (boxSolid(lv, s.x, s.y)) { s.x = ox0; }
    }
    // air dash: once per airtime, short horizontal burst with no gravity
    var dashIn = !!inp.dash;
    if (lv.dash && dashIn && !s.prevDash && !s.dashUsed && !s.ground && s.dashT <= 0) {
      s.dashT = DASH_T; s.dashUsed = true; s.ddir = dir || s.face; s.face = s.ddir; s.vy = 0; s.canCut = false; s.lock = 0; s.buf = 0; s.ev.push('dash');
    }
    s.prevDash = dashIn;
    var dashing = s.dashT > 0;
    if (dashing) { s.dashT -= DT; s.vx = s.ddir * DASH_V; if (s.dashT <= 0) { s.dashT = 0; s.vx = s.ddir * P.run; } }
    // horizontal control
    if (dashing) { /* velocity fixed during dash */ }
    else if (s.lock > 0) s.lock -= DT;
    else {
      var ice = s.ground && onIce(lv, s);
      var acc = ice ? P.accI : s.ground ? P.accG : P.accA;
      if (dir !== 0) {
        if (dir !== Math.sign(s.vx) && s.vx !== 0) acc *= 1.6;
        s.vx += dir * acc * DT;
        if (Math.abs(s.vx) > P.run) s.vx = dir * P.run;
        s.face = dir;
      } else {
        var f = (ice ? P.fricI : s.ground ? P.fric : P.fricA) * DT;
        s.vx = Math.abs(s.vx) <= f ? 0 : s.vx - Math.sign(s.vx) * f;
      }
    }
    // jump buffering / coyote
    if (jump && !s.prevJump) s.buf = P.buf; else s.buf -= DT;
    s.prevJump = jump;
    s.coyote = s.ground ? P.coyote : s.coyote - DT;
    if (s.buf > 0 && !dashing) {
      if (s.coyote > 0) {
        s.vy = P.jump; s.buf = 0; s.coyote = 0; s.ground = false; s.canCut = true; s.ev.push('jump');
      } else if (s.wall !== 0) {
        s.vy = P.wallJy; s.vx = -s.wall * P.wallJx; s.face = -s.wall; s.lock = P.lock; s.buf = 0; s.canCut = true; s.wall = 0; s.ev.push('wall');
      }
    }
    if (!dashing && !jump && s.canCut && s.vy < P.cut) { s.vy = P.cut; s.canCut = false; }
    // gravity
    if (dashing) s.vy = 0; else s.vy += P.grav * DT;
    if (s.vy > P.maxFall) s.vy = P.maxFall;
    if (s.wall !== 0 && !s.ground && s.vy > P.wallSlide && dir === s.wall) s.vy = P.wallSlide;
    // move X
    s.x += s.vx * DT;
    if (boxSolid(lv, s.x, s.y)) {
      if (s.vx > 0) s.x = Math.floor((s.x + P.w) / T) * T - P.w - 0.001;
      else if (s.vx < 0) s.x = (Math.floor(s.x / T) + 1) * T + 0.001;
      s.vx = 0;
    }
    // move Y
    var oldBot = s.y + P.h;
    s.y += s.vy * DT;
    var wasGround = s.ground;
    s.ground = false;
    if (boxSolid(lv, s.x, s.y)) {
      if (s.vy > 0) { s.y = Math.floor((s.y + P.h) / T) * T - P.h - 0.001; s.ground = true; if (!wasGround) s.ev.push('land'); s.canCut = false; }
      else if (s.vy < 0) s.y = (Math.floor(s.y / T) + 1) * T + 0.001;
      s.vy = 0;
    } else if (s.vy >= 0 && boxSolid(lv, s.x, s.y + 1)) s.ground = true;
    // one-way moving platforms
    s.ride = -1;
    if (lv.movers.length && s.vy >= 0) {
      for (var mi = 0; mi < lv.movers.length; mi++) {
        var mm = lv.movers[mi], mp = movPos(mm, s.t), nb = s.y + P.h;
        if (s.x + P.w > mp.x - mm.w / 2 + 1 && s.x < mp.x + mm.w / 2 - 1 && oldBot <= mp.y + 3 && nb >= mp.y) {
          s.y = mp.y - P.h; s.vy = 0; if (!s.ground) { s.ground = true; if (!wasGround) s.ev.push('land'); } s.canCut = false; s.ride = mi; break;
        }
      }
    }
    // conveyor belts: carry player while standing on them
    if (s.ground) {
      var br = Math.floor((s.y + P.h + 1) / T), ba = Math.floor(s.x / T), bb = Math.floor((s.x + P.w - 0.001) / T), bv = 0;
      for (var bc = ba; bc <= bb; bc++) { var bk = kindAt(lv, bc, br); if (bk === 7) bv += BELT; else if (bk === 8) bv -= BELT; }
      if (bv !== 0) { var ox = s.x; s.x += Math.sign(bv) * BELT * DT; if (boxSolid(lv, s.x, s.y)) s.x = ox; }
    }
    if (s.ground) s.dashUsed = false;
    if (dashing && s.vx === 0) s.dashT = 0;
    // walls
    s.wall = 0;
    if (!s.ground) {
      if (boxSolid(lv, s.x + 1, s.y)) s.wall = 1;
      else if (boxSolid(lv, s.x - 1, s.y)) s.wall = -1;
    }
    // crumble blocks: start timer when stood on, vanish, return later
    var k2, key2;
    for (key2 in s.cr) { s.cr[key2] += DT; if (s.cr[key2] > CR_BACK) delete s.cr[key2]; }
    if (s.ground) {
      var fr = Math.floor((s.y + P.h + 1) / T), fa = Math.floor(s.x / T), fb = Math.floor((s.x + P.w - 0.001) / T);
      for (var fc = fa; fc <= fb; fc++) if (kindAt(lv, fc, fr) === 4 && s.cr[fr * 1000 + fc] === undefined) { s.cr[fr * 1000 + fc] = 0; s.ev.push('crumble'); }
    }
    // wind zones: updraft (u) lifts, downdraft (v) pushes down
    if (lv.hasWind) {
      var wa = Math.floor((s.x + 1) / T), wb = Math.floor((s.x + P.w - 2) / T), wr0 = Math.floor((s.y + 2) / T), wr1 = Math.floor((s.y + P.h - 2) / T), wf = 0;
      for (var wr = wr0; wr <= wr1; wr++) for (var wc = wa; wc <= wb; wc++) { var wk = kindAt(lv, wc, wr); if (wk === 10) wf = -1; else if (wk === 11 && wf === 0) wf = 1; }
      if (wf < 0) { s.vy -= WIND_UP * DT; if (s.vy < -WIND_CAP) s.vy = -WIND_CAP; s.canCut = false; }
      else if (wf > 0) s.vy += WIND_DOWN * DT;
    }
    // pads
    for (var i = 0; i < lv.pads.length; i++) {
      var pd = lv.pads[i], px = pd.c * T, py = pd.r * T + 8;
      if (s.vy >= 0 && s.x + P.w > px + 1 && s.x < px + T - 1 && s.y + P.h > py && s.y + P.h < py + 12) {
        s.vy = P.pad; s.ground = false; s.canCut = false; s.ev.push('pad');
      }
    }
    // hazards: spikes
    var c0 = Math.floor((s.x + 1) / T), c1 = Math.floor((s.x + P.w - 1) / T);
    var r0 = Math.floor((s.y + 1) / T), r1 = Math.floor((s.y + P.h - 1) / T);
    for (var r = r0; r <= r1; r++) for (var c = c0; c <= c1; c++) {
      var k = kindAt(lv, c, r), sx = c * T, sy = r * T;
      if (k === 2 && rect(s, sx + 3, sy + 8, sx + T - 3, sy + T)) die(s, 'spike');
      if (k === 3 && rect(s, sx + 3, sy, sx + T - 3, sy + 8)) die(s, 'ceiling');
    }
    // saws
    for (i = 0; i < lv.saws.length; i++) {
      var sp = sawPos(lv.saws[i], s.t);
      var nx = Math.max(s.x + 1, Math.min(sp.x, s.x + P.w - 1)), ny = Math.max(s.y + 1, Math.min(sp.y, s.y + P.h - 1));
      if ((nx - sp.x) * (nx - sp.x) + (ny - sp.y) * (ny - sp.y) < 36) die(s, 'saw');
    }
    if (s.y > lv.H * T + 24) die(s, 'pit');
    // coins, checkpoints, exit
    var mx = s.x + P.w / 2, my = s.y + P.h / 2;
    for (i = 0; i < lv.coins.length; i++) {
      var co = lv.coins[i], key = co.c + ',' + co.r;
      if (!s.got[key] && Math.abs(co.c * T + 8 - mx) < 10 && Math.abs(co.r * T + 8 - my) < 11) { s.got[key] = 1; s.ncoins++; s.ev.push('coin'); }
    }
    for (i = 0; i < lv.cps.length; i++) {
      var cp = lv.cps[i];
      if (Math.abs(cp.c * T + 8 - mx) < 10 && Math.abs(cp.r * T + 8 - my) < 14 && s.cp.x !== cp.x) { s.cp = { x: cp.x, y: cp.y }; s.ev.push('cp'); }
    }
    if (!s.dead && !s.won && lv.exit && Math.abs(lv.exit.c * T + 8 - mx) < 9 && Math.abs(lv.exit.r * T + 8 - my) < 12) { s.won = true; s.ev.push('win'); }
  }
  function rect(s, x0, y0, x1, y1) {
    return s.x + 1 < x1 && s.x + P.w - 1 > x0 && s.y + 1 < y1 && s.y + P.h - 1 > y0;
  }

  function stars(lv, s) {
    var n = 1;
    if (s.ncoins >= lv.coins.length) n++;
    if (s.time <= lv.par) n++;
    return n;
  }

  // Player-facing next-star guidance. Pure so UI and tests share exact rules.
  function nextGoal(lv, s) {
    var left = Math.max(0, lv.coins.length - s.ncoins);
    var remaining = Math.max(0, lv.par - s.time);
    if (left > 0) {
      var coinText = '★ ' + left + ' coin' + (left === 1 ? '' : 's') + ' for star';
      return { kind: 'coins', text: s.time <= lv.par ? coinText + ' · ' + remaining.toFixed(1) + 's to par' : coinText + ' · time star missed' };
    }
    if (s.time <= lv.par) return { kind: 'pace', text: '★ 3-star pace · ' + remaining.toFixed(1) + 's to par' };
    return { kind: 'missed', text: '★ time star missed' };
  }

  // Post-clear replay target. Keeps optional-star progression actionable after a win.
  function clearGoal(lv, s) {
    var st = stars(lv, s), left = Math.max(0, lv.coins.length - s.ncoins);
    if (st >= 3) return { kind: 'mastered', text: '✦ MASTERED · all 3 stars' };
    if (left > 0) return { kind: 'coins', text: 'NEXT: collect ' + left + ' coin' + (left === 1 ? '' : 's') + ' for ★2' };
    return { kind: 'pace', text: 'NEXT: beat ' + lv.par + 's for ★3' };
  }

  // Live normal-mode speedrun feedback. Pure so HUD and tests share rounding/sign rules.
  function bestPace(time, best) {
    if (!Number.isFinite(best) || best <= 0) return { kind: 'fresh', delta: 0, text: 'PB —' };
    var delta = best - time;
    if (Math.abs(delta) < 0.05) return { kind: 'even', delta: delta, text: 'PB pace' };
    return delta > 0
      ? { kind: 'ahead', delta: delta, text: 'PB in ' + delta.toFixed(1) + 's' }
      : { kind: 'behind', delta: delta, text: 'PB missed +' + (-delta).toFixed(1) + 's' };
  }

  // Checkpoint mastery feedback. Start counts as 0; reached checkpoint index stays stable after respawn.
  function checkpointProgress(lv, s) {
    var total = lv.cps ? lv.cps.length : 0, reached = 0;
    for (var i = 0; i < total; i++) if (s.cp && s.cp.x === lv.cps[i].x) reached = i + 1;
    return { reached: reached, total: total, active: total > 0, text: total ? '⚑ CP ' + reached + '/' + total : '' };
  }

  // Actionable retry coaching. Pure so every death cause keeps stable wording.
  function deathTip(cause) {
    var tips = {
      spike: 'TIP: jump earlier and land past spikes',
      ceiling: 'TIP: tap JUMP for a shorter hop under ceilings',
      saw: 'TIP: wait for saw timing, then commit',
      pit: 'TIP: hold toward next platform; DASH across wide gaps',
      phase: 'TIP: cross before block phase changes',
      hazard: 'TIP: keep moving and watch your landing'
    };
    return tips[cause] || tips.hazard;
  }

  var api = { T: T, DT: DT, P: P, parse: parse, create: create, step: step, respawn: respawn, stars: stars, nextGoal: nextGoal, clearGoal: clearGoal, bestPace: bestPace, checkpointProgress: checkpointProgress, deathTip: deathTip, sawPos: sawPos, movPos: movPos, kindAt: kindAt, CR_GONE: CR_GONE, CR_BACK: CR_BACK, phaseOn: phaseOn };
  if (typeof module !== 'undefined') module.exports = api; else root.GH = api;
})(this);
