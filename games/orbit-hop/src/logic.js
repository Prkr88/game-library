// Orbit Hop — pure game logic (no DOM). Works in browser (window.OrbitLogic) and Node (module.exports).
(function (root) {
  'use strict';
  var W = 400; // virtual world width

  function rng(seed) {
    var s = seed >>> 0 || 1;
    return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; };
  }

  function makePlanet(g, y, idx) {
    var r = g.rand;
    var e = idx + (g.off || 0), d = Math.min(1, e / 60); // difficulty 0..1 (hard mode starts 30 planets in)
    var radius = 34 - d * 12 + r() * 14;
    var p = {
      x: 70 + r() * (W - 140), y: y, r: radius,
      spin: (r() < 0.5 ? -1 : 1) * (1.6 + d * 1.6 + r() * 0.6),
      vx: 0, hue: Math.floor(r() * 360), idx: idx, star: null
    };
    if (e > 8 && r() < 0.25 + d * 0.35) p.vx = (r() < 0.5 ? -1 : 1) * (30 + d * 50);
    if (e > 18 && !p.vx && r() < 0.15 + d * 0.2) { p.shrink = true; p.life = 2.6 - d * 0.8; p.maxLife = p.life; }
    if (idx > 0 && r() < 0.55) p.star = { a: r() * Math.PI * 2, got: false };
    // Flipper (from planet 36): spin direction reverses on a timer; the flash warning gives ~0.4s notice.
    if (e > 36 && !p.vx && !p.shrink && r() < 0.15 + d * 0.2) { p.flip = 2.2 - d * 0.6; p.ft = p.flip; }
    // Shield orb (deterministic, no RNG draw): every 9th planet from 14. Absorbs one hole/asteroid/laser hit.
    if (e >= 14 && e % 9 === 5 && !p.shrink) p.shield = { a: p.star ? p.star.a + Math.PI : r0(idx), got: false };
    return p;
  }
  function r0(i) { return (i * 2.399963) % (Math.PI * 2); }

  function createGame(seed, hard) {
    var g = { hard: !!hard, off: hard ? 30 : 0, rand: rng(seed || Date.now()), planets: [], holes: [], rocks: [], gates: [], t: 0, score: 0, coins: 0,
      combo: 0, over: false, events: [], cameraY: 0 };
    var y = 0;
    for (var i = 0; i < 6; i++) { g.planets.push(makePlanet(g, y, i)); y -= gap(g, i + 1); }
    g.planets[0].x = W / 2; g.planets[0].vx = 0;
    g.player = { mode: 'orbit', planet: g.planets[0], a: -Math.PI / 2, x: 0, y: 0, vx: 0, vy: 0, flight: 0 };
    place(g.player);
    g.cameraY = g.planets[0].y;
    return g;
  }

  function gap(g, idx) { var d = Math.min(1, (idx + (g.off || 0)) / 60); return 150 + d * 70 + g.rand() * 50; }

  // Black hole between planet a (below) and b (above); placed off the direct line.
  function maybeHole(g, a, b) {
    var e = b.idx + (g.off || 0), d = Math.min(1, e / 60), r = g.rand;
    if (e < 20 || r() > 0.12 + d * 0.18) return;
    var mx = (a.x + b.x) / 2, side = mx < W / 2 ? 1 : -1;
    var x = Math.max(40, Math.min(W - 40, mx + side * (110 + r() * 50)));
    g.holes.push({ x: x, y: (a.y + b.y) / 2, r: 14 + d * 6, pull: 7000 + d * 8000, idx: b.idx });
  }

  // Patrolling asteroid between planets (from planet 28): sweeps across the flight lane; touching it in flight = death.
  function maybeRock(g, a, b) {
    var e = b.idx + (g.off || 0), d = Math.min(1, e / 60), r = g.rand;
    if (e < 28 || r() > 0.2 + d * 0.3) return;
    var t = 0.35 + r() * 0.3;
    g.rocks.push({ x: 40 + r() * (W - 80), y: a.y + (b.y - a.y) * t, r: 11, vx: (r() < 0.5 ? -1 : 1) * (55 + d * 70 + r() * 30), idx: b.idx, ph: r() * 6 });
  }

  // Laser gate (from planet 45): full-width beam across the flight lane that cycles on/off. Crossing it while on = death.
  function maybeGate(g, a, b) {
    var e = b.idx + (g.off || 0), d = Math.min(1, e / 60), r = g.rand;
    if (e < 45 || r() > 0.2 + d * 0.2) return;
    var per = 2.4 - d * 0.6;
    g.gates.push({ y: a.y + (b.y - a.y) * (0.45 + r() * 0.2), per: per, onFrac: 0.5, ph: r() * per, idx: b.idx });
  }
  function gateOn(g, k) { return ((g.t + k.ph) % k.per) < k.per * k.onFrac; }
  // seconds until beam turns on (0 if on now)
  function gateIn(g, k) { var m = (g.t + k.ph) % k.per; return m < k.per * k.onFrac ? 0 : k.per - m; }

  // Pause/menu consumers can explain the immediate gate without duplicating timing rules.
  function nextGateState(g) {
    if (!g || !g.player || !g.player.planet) return null;
    var idx = g.player.planet.idx + 1, gate = null;
    for (var i = 0; i < g.gates.length; i++) {
      if (g.gates[i].idx === idx) { gate = g.gates[i]; break; }
    }
    if (!gate) return null;
    if (g.player.mode === 'fly') return { state: gateOn(g, gate) ? 'ACTIVE' : 'CLEAR', seconds: 0 };
    if (gateOn(g, gate)) return { state: 'ON', seconds: 0 };
    return { state: gateIn(g, gate) < 0.55 ? 'IN' : 'OFF', seconds: gateIn(g, gate) };
  }

  // Hazards on immediate next segment. Preview only; collision and timing stay unchanged.
  function nextHazards(g) {
    if (!g || !g.player || !g.player.planet) return [];
    var idx = g.player.planet.idx + 1, out = [];
    if (g.holes.some(function (h) { return h.idx === idx; })) out.push('BLACK HOLE');
    if (g.rocks.some(function (k) { return k.idx === idx; })) out.push('ASTEROID');
    if (g.gates.some(function (k) { return k.idx === idx; })) out.push('LASER');
    return out;
  }

  // Hazard hit: shield (if held) absorbs it and grants brief invulnerability. Returns true if absorbed.
  function guard(g, pl) {
    if (g.inv > 0) return true;
    if (!g.shield) return false;
    g.shield = false; g.inv = 1.2; g.shieldsUsed = (g.shieldsUsed || 0) + 1;
    g.events.push({ type: 'shieldPop', x: pl.x, y: pl.y });
    return true;
  }

  function orbitR(p) { return p.r + 14; }

  // Launch guidance: radial launch must point at next planet's center.
  function nextPlanet(g) {
    if (!g || !g.player || !g.player.planet) return null;
    for (var i = 0; i < g.planets.length; i++) {
      if (g.planets[i].idx === g.player.planet.idx + 1) return g.planets[i];
    }
    return null;
  }
  function aimDelta(g) {
    var target = nextPlanet(g), pl = g && g.player;
    if (!target || !pl || !pl.planet) return null;
    var wanted = Math.atan2(target.y - pl.planet.y, target.x - pl.planet.x);
    return Math.atan2(Math.sin(wanted - pl.a), Math.cos(wanted - pl.a));
  }

  // Input phase is exposed for platform HUDs; presentation must not infer it from velocity.
  function phaseHint(g) {
    if (!g || !g.player) return 'IDLE';
    if (g.over) return 'OVER';
    return g.player.mode === 'fly' ? 'FLIGHT' : 'ORBIT';
  }

  function place(pl) {
    var p = pl.planet;
    pl.x = p.x + Math.cos(pl.a) * orbitR(p);
    pl.y = p.y + Math.sin(pl.a) * orbitR(p);
  }

  function tap(g) {
    var pl = g.player;
    if (g.over || pl.mode !== 'orbit') return false;
    var speed = 520;
    pl.vx = Math.cos(pl.a) * speed + pl.planet.vx;
    pl.vy = Math.sin(pl.a) * speed;
    pl.from = pl.planet; pl.mode = 'fly'; pl.flight = 0; pl.near = false;
    g.events.push({ type: 'jump' });
    return true;
  }

  function step(g, dt) {
    if (g.over) return;
    g.t += dt;
    if (g.inv > 0) g.inv -= dt;
    var pl = g.player, i, p;
    for (i = 0; i < g.rocks.length; i++) {
      var rk = g.rocks[i]; rk.x += rk.vx * dt;
      if (rk.x < rk.r + 10 || rk.x > W - rk.r - 10) { rk.vx = -rk.vx; rk.x = Math.max(rk.r + 10, Math.min(W - rk.r - 10, rk.x)); }
    }
    for (i = 0; i < g.planets.length; i++) {
      p = g.planets[i];
      if (p.flip) { p.ft -= dt; if (p.ft <= 0) { p.spin = -p.spin; p.ft = p.flip; } }
      if (p.vx) { p.x += p.vx * dt; if (p.x < p.r + 10 || p.x > W - p.r - 10) { p.vx = -p.vx; p.x = Math.max(p.r + 10, Math.min(W - p.r - 10, p.x)); } }
    }
    if (pl.mode === 'orbit') {
      pl.a += pl.planet.spin * dt;
      place(pl);
      var s = pl.planet.star;
      if (pl.planet.shrink) {
        pl.planet.life -= dt;
        if (pl.planet.life <= 0) { g.over = true; g.events.push({ type: 'collapse', x: pl.planet.x, y: pl.planet.y }); return; }
      }
      var sh = pl.planet.shield;
      if (sh && !sh.got && !g.shield) {
        var ds = Math.atan2(Math.sin(pl.a - sh.a), Math.cos(pl.a - sh.a));
        if (Math.abs(ds) < 0.3) { sh.got = true; g.shield = true; g.events.push({ type: 'shieldGet', x: pl.x, y: pl.y }); }
      }
      if (s && !s.got) {
        var da = Math.atan2(Math.sin(pl.a - s.a), Math.cos(pl.a - s.a));
        if (Math.abs(da) < 0.25) { s.got = true; g.coins += 1; g.events.push({ type: 'star', x: pl.x, y: pl.y }); }
      }
    } else {
      for (i = 0; i < g.holes.length; i++) {
        var h = g.holes[i], hx = h.x - pl.x, hy = h.y - pl.y, hd2 = hx * hx + hy * hy, hd = Math.sqrt(hd2);
        if (hd < h.r + 20 && hd >= h.r) pl.near = true;
        if (hd < h.r && !guard(g, pl)) { g.over = true; g.events.push({ type: 'die', x: pl.x, y: pl.y, hole: true }); return; }
        if (hd < 110) { var f = h.pull / Math.max(hd2, 400); pl.vx += hx / hd * f * dt * 60; pl.vy += hy / hd * f * dt * 60; }
      }
      for (i = 0; i < g.rocks.length; i++) {
        var k = g.rocks[i];
        var kd = Math.hypot(k.x - pl.x, k.y - pl.y);
        if (kd < k.r + 18 && kd >= k.r + 4) pl.near = true;
        if (kd < k.r + 4 && !guard(g, pl)) { g.over = true; g.events.push({ type: 'die', x: pl.x, y: pl.y, rock: true }); return; }
      }
      var py0 = pl.y;
      pl.x += pl.vx * dt; pl.y += pl.vy * dt; pl.flight += dt;
      for (i = 0; i < g.gates.length; i++) {
        var gt = g.gates[i];
        if ((py0 - gt.y) * (pl.y - gt.y) <= 0 && gateOn(g, gt) && !guard(g, pl)) { g.over = true; g.events.push({ type: 'die', x: pl.x, y: gt.y, gate: true }); return; }
      }
      for (i = 0; i < g.planets.length; i++) {
        p = g.planets[i];
        if (p === pl.from) continue;
        var dx = pl.x - p.x, dy = pl.y - p.y, dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < orbitR(p) + 6) {
          var gained = p.idx > pl.from.idx ? p.idx - pl.from.idx : 0;
          pl.mode = 'orbit'; pl.planet = p; pl.a = Math.atan2(dy, dx); place(pl);
          if (gained > 0) {
            g.combo = pl.flight < 0.38 ? g.combo + 1 : 0;
            var close = pl.near; pl.near = false;
            g.score += gained + (g.combo >= 2 ? 1 : 0) + (close ? 1 : 0);
            if (close) { g.nearMisses = (g.nearMisses || 0) + 1; g.events.push({ type: 'near', x: pl.x, y: pl.y }); }
            g.events.push({ type: 'land', x: pl.x, y: pl.y, gained: gained, combo: g.combo, perfect: gained > 1 });
          } else g.events.push({ type: 'land', x: pl.x, y: pl.y, gained: 0, combo: 0 });
          ensurePlanets(g);
          break;
        }
      }
      if (pl.mode === 'fly' && (pl.x < -30 || pl.x > W + 30 || pl.y > g.cameraY + 500 || pl.flight > 1.6)) {
        g.over = true; g.events.push({ type: 'die', x: pl.x, y: pl.y });
      }
    }
    // camera eases toward current planet
    var target = pl.mode === 'orbit' ? pl.planet.y : g.cameraY;
    g.cameraY += (target - g.cameraY) * Math.min(1, dt * 4);
  }

  function ensurePlanets(g) {
    var top = g.planets[g.planets.length - 1];
    while (g.planets.length < g.player.planet.idx - g.planets[0].idx + 6) {
      var idx = top.idx + 1;
      var below = top;
      top = makePlanet(g, top.y - gap(g, idx), idx);
      g.planets.push(top);
      maybeHole(g, below, top);
      maybeRock(g, below, top);
      maybeGate(g, below, top);
    }
    while (g.planets.length > 9) g.planets.shift();
    var minIdx = g.planets[0].idx;
    g.holes = g.holes.filter(function (h) { return h.idx > minIdx; });
    g.rocks = g.rocks.filter(function (k) { return k.idx > minIdx; });
    g.gates = g.gates.filter(function (k) { return k.idx > minIdx; });
  }

  // One-shot continue after death: put the comet back on a safe orbit (rewarded ad).
  function revive(g) {
    if (!g.over || g.revived) return false;
    var pl = g.player, tgt = g.planets.indexOf(pl.from) >= 0 ? pl.from : pl.planet;
    if (tgt.shrink && tgt.life < tgt.maxLife) {
      // collapsed planet: hop to the next one up if present
      var up = g.planets.filter(function (p) { return p.idx === tgt.idx + 1; })[0];
      if (up) tgt = up; else tgt.life = tgt.maxLife;
    }
    if (tgt.shrink) tgt.life = tgt.maxLife;
    pl.planet = tgt; pl.mode = 'orbit'; pl.flight = 0; pl.vx = pl.vy = 0; pl.from = null;
    place(pl);
    g.over = false; g.revived = true; g.collapsed = g.swallowed = g.smashed = g.zapped = false; g.combo = 0;
    g.holes = g.holes.filter(function (h) { return Math.hypot(h.x - pl.x, h.y - pl.y) > h.r * 5; });
    g.rocks = g.rocks.filter(function (k) { return Math.hypot(k.x - pl.x, k.y - pl.y) > 90; });
    return true;
  }

  function drain(g) { var e = g.events; g.events = []; return e; }

  function dailySeed(date) {
    var s = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
    return (s * 2654435761) >>> 0;
  }

  var api = { dailySeed: dailySeed, W: W, createGame: createGame, step: step, tap: tap, revive: revive, drain: drain, orbitR: orbitR, nextPlanet: nextPlanet, aimDelta: aimDelta, phaseHint: phaseHint, gateOn: gateOn, gateIn: gateIn, nextGateState: nextGateState, nextHazards: nextHazards };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.OrbitLogic = api;
})(this);
