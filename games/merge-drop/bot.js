// Difficulty bot: plays N seeded runs per policy/mode, reports survival (drops) and score.
// random = naive, greedy = best immediate gain via preview (+ avoids fatal drops), planner = greedy w/ height penalty.
const L = require('./src/logic.js');
function pick(s, policy) {
  let best = -1, bs = -1e9;
  for (let c = 0; c < L.COLS; c++) {
    const p = L.preview(s, c); if (p.full) continue;
    let sc;
    if (policy === 'random') sc = Math.random();
    else {
      sc = p.gain - (p.endsRun ? 1e6 : 0);
      if (policy === 'planner') {
        let h = 0; for (let r = 0; r < L.ROWS; r++) if (s.grid[r][c]) { h = L.ROWS - r; break; }
        sc -= h * h * 6; // prefer low columns
        sc += p.chain * 40;
      }
    }
    if (sc > bs) { bs = sc; best = c; }
  }
  return best;
}
function run(seed, policy, rise, cap, hard) {
  const s = L.create(seed, rise, hard); let n = 0;
  while (!s.over && n < cap) { const c = pick(s, policy); if (c < 0) break; L.drop(s, c); n++; }
  return { drops: s.drops, score: s.score, max: s.max, over: s.over };
}
const N = +process.argv[2] || 40, CAP = 3000;
for (const m of ['Classic', 'Rise', 'Hardcore']) for (const pol of ['random', 'greedy', 'planner']) {
  const rise = m === 'Rise', hard = m === 'Hardcore';
  const rs = []; for (let i = 1; i <= N; i++) rs.push(run(i * 7919, pol, rise, CAP, hard));
  const med = a => a.slice().sort((x, y) => x - y)[a.length >> 1];
  console.log(m.padEnd(8) + ' ' + pol.padEnd(8) + ' medDrops=' + med(rs.map(r => r.drops)) + ' medLevel=' + Math.floor(med(rs.map(r => r.drops)) / 15) + ' medScore=' + med(rs.map(r => r.score)) + ' survivedCap=' + rs.filter(r => !r.over).length + '/' + N);
}
// stone spawn rate per level
for (const lv of [0, 1, 2, 3, 4, 6, 10]) {
  const s = L.create(5); s.drops = lv * 15; let st = 0, T = 4000; for (let i = 0; i < T; i++) if (L.swapNext(s) === L.STONE) st++;
  console.log('level ' + lv + ' stone~' + (st / T * 100).toFixed(1) + '%');
}
