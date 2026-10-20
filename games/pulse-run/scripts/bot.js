// Exhaustive-search bot: proves each stage is clearable with the real physics
// (gravity 1500, jump -610, short hop -250) and reports difficulty metrics.
const fs = require('node:fs');
const vm = require('node:vm');
const sb = { window: {} };
vm.runInNewContext(fs.readFileSync(`${__dirname}/../src/logic.js`, 'utf8'), sb);
const L = sb.window.PulseLogic;
const DT = 1 / 60;

function solve(stage) {
  const end = stage.items[stage.items.length - 1][1];
  const hazards = stage.items.filter(i => i[0] !== 'coin' && i[0] !== 'finish');
  const seen = new Set();
  function step(s, jumpCmd, slide, release) {
    const p = { ...s };
    p.x += stage.speed * DT;
    if (jumpCmd && !p.air) { p.vy = -610; p.air = true; p.sliding = false; }
    p.sliding = !p.air && slide;
    if (release && p.air && p.vy < 0) p.vy = Math.max(p.vy, -250);
    p.vy += 1500 * DT; p.y += p.vy * DT;
    if (p.y >= 250) { p.y = 250; p.vy = 0; p.air = false; }
    return p;
  }
  function dead(p) {
    const it = L.itemAt(stage, p.x);
    return !!(it && Math.abs(it[1] - p.x) < stage.speed * DT + 18 && L.hit(it[0], p));
  }
  function dfs(s, frame) {
    if (s.x >= end) return true;
    const key = `${frame}|${Math.round(s.y)}|${Math.round(s.vy / 20)}|${s.sliding ? 1 : 0}`;
    if (seen.has(key)) return false;
    seen.add(key);
    const opts = s.air
      ? [[false, false, false], [false, false, true]]
      : [[false, false, false], [false, true, false], [true, false, false], [true, false, true]];
    for (const [j, sl, rel] of opts) {
      const n = step(s, j, sl, rel);
      if (dead(n)) continue;
      if (dfs(n, frame + 1)) return true;
    }
    return false;
  }
  return dfs({ x: 0, y: 250, vy: 0, air: false, sliding: false }, 0);
}

function metrics(stage) {
  const hz = stage.items.filter(i => i[0] !== 'coin' && i[0] !== 'finish');
  const end = stage.items[stage.items.length - 1][1];
  let minGap = Infinity;
  for (let i = 1; i < hz.length; i++) minGap = Math.min(minGap, (hz[i][1] - hz[i - 1][1]) / stage.speed);
  const mixed = hz.slice(1).filter((h, i) => h[0] !== hz[i][0]).length;
  const dur = end / stage.speed;
  return { hazards: hz.length, perSec: hz.length / dur, minGap, mixed, dur };
}

if (require.main === module) {
  let ok = true, prev = 0;
  L.stages.forEach((s, i) => {
    const clear = solve(s), m = metrics(s);
    const score = m.perSec * 10 + (0.6 - Math.min(0.6, m.minGap)) * 20 + m.mixed * 0.3 + s.speed / 100;
    const harder = score >= prev;
    ok = ok && clear && harder; prev = score;
    console.log(`${i + 1} ${s.name.padEnd(12)} speed ${s.speed} haz ${m.hazards} ${m.perSec.toFixed(2)}/s minGap ${m.minGap.toFixed(2)}s mixed ${m.mixed} difficulty ${score.toFixed(1)} ${clear ? 'CLEARABLE' : 'IMPOSSIBLE'}${harder ? '' : ' (EASIER THAN PREV)'}`);
  });
  process.exit(ok ? 0 : 1);
}
module.exports = { solve, metrics };
