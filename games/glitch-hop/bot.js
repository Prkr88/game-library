/* Beam-search bot: proves levels are beatable and measures difficulty (death rate of expansions). */
const G = require('./src/logic.js');
const ACTS = []; for (const d of [-1, 0, 1]) for (const j of [0, 1]) ACTS.push({ dir: d, jump: !!j });
function distMap(lv) {
  const d = lv.tiles.map(r => r.map(() => 1e9)); const q = [[lv.exit.r, lv.exit.c]]; d[lv.exit.r][lv.exit.c] = 0;
  while (q.length) { const [r, c] = q.shift(); for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) { const nr = r+dr, nc = c+dc; if (nr<0||nc<0||nr>=lv.H||nc>=lv.W) continue; if ((lv.tiles[nr][nc]===1)||d[nr][nc]<1e9) continue; d[nr][nc]=d[r][c]+1; q.push([nr,nc]); } }
  return d;
}
function clone(s) { const n = Object.assign({}, s); n.got = Object.assign({}, s.got); n.cr = Object.assign({}, s.cr); n.ev = []; return n; }
function solve(def, opts) {
  opts = opts || {}; const lv = G.parse(def), acts = lv.dash ? ACTS.concat([-1, 0, 1].map(d => ({ dir: d, jump: false, dash: true })), [-1, 0, 1].map(d => ({ dir: d, jump: true, dash: true }))) : ACTS, dm = distMap(lv), W = opts.width || 400, F = opts.frames || 2;
  let beam = [{ s: G.create(lv) }], exp = 0, dead = 0;
  for (let it = 0; it < 1500; it++) {
    const next = new Map(); global.__last = beam;
    for (const b of beam) for (let ai = 0; ai < acts.length; ai++) {
      const s = clone(b.s); exp++;
      for (let f = 0; f < F && !s.dead && !s.won; f++) G.step(s, acts[ai]);
      if (s.dead) { dead++; if (s.x > (global.__mx||0)) global.__mx = s.x; continue; }
      if (s.won) return { ok: true, time: +s.time.toFixed(1), coins: s.ncoins + '/' + lv.coins.length, deathRate: +(dead / exp).toFixed(3) };
      const c = Math.max(0, Math.min(lv.W-1, Math.floor((s.x+5)/16))), r = Math.max(0, Math.min(lv.H-1, Math.floor((s.y+7)/16)));
      const h = lv.hasWind ? Math.abs(lv.exit.c*16 - s.x) + 0.1 * Math.abs(lv.exit.r*16 - s.y) : dm[r][c] * 16 + Math.abs(lv.exit.c*16 - s.x) * 0.01;
      const key = [Math.round(s.x/3), Math.round(s.y/3), Math.round(s.vx/30), Math.round(s.vy/60), s.ground?1:0, s.wall, s.dashUsed?1:0, s.dashT>0?1:0, Math.floor(s.t/lv.phase*4), s.ride, lv.movers.length ? Math.floor(s.t/lv.movers[0].per*8)%8 : 0, Object.keys(s.cr).length ? Math.round(Math.min(...Object.values(s.cr))*5) : -1].join();
      const o = next.get(key); if (!o || o.h > h) next.set(key, { s, h, ph: lv.hasPhase ? Math.floor(s.t / lv.phase * 4) % 8 : 0 });
    }
    let all = [...next.values()].sort((a, b) => a.h - b.h);
    if (lv.hasPhase || opts.cap) { const cap = Math.max(4, Math.ceil(W / 40)), cnt = {}; all = all.filter(x => { const k = Math.floor(x.s.x / 16) * 100 + Math.floor(x.s.y / 16); return (cnt[k] = (cnt[k] || 0) + 1) <= cap; }); }
    beam = all.slice(0, W).map(x => ({ s: x.s }));
    if (!beam.length) return { ok: false, why: 'beam empty', deathRate: +(dead / exp).toFixed(3) };
  }
  return { ok: false, why: 'timeout', best: beam[0] && [beam[0].s.x|0, beam[0].s.y|0, beam[0].s.vx|0, beam[0].s.vy|0, beam[0].s.ground, beam[0].s.wall] };
}
module.exports = { solve };
