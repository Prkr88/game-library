/* Run: node test.js  -> physics sanity + every level solvable by bot + difficulty = min beam width needed (higher = harder) */
const G = require('./src/logic.js'), B = require('./bot.js'), LV = require('./src/levels.js').concat(require('./src/levels2.js'), require('./src/levels3.js'), require('./src/levels4.js'), require('./src/levels5.js'), require('./src/levels6.js'), require('./src/levels7.js'), require('./src/levels8.js'), require('./src/levels9.js'), require('./src/levels10.js'), require('./src/levels11.js'), require('./src/levels12.js'));
const Save = require('./src/save.js');
const MAIN = require('fs').readFileSync(require('path').join(__dirname, 'src/main.js'), 'utf8');
const HTML = require('fs').readFileSync(require('path').join(__dirname, 'index.html'), 'utf8');
const SW = require('fs').readFileSync(require('path').join(__dirname, 'sw.js'), 'utf8');
const SW_REG = require('fs').readFileSync(require('path').join(__dirname, 'src/register-sw.js'), 'utf8');
const assert = (c, m) => { if (!c) { console.error('FAIL', m); process.exit(1); } };
assert(HTML.includes('src/register-sw.js'), 'service-worker registration script is loaded');
assert(SW_REG.includes("/^https?:$/") && SW_REG.includes("navigator.serviceWorker.register('./sw.js')"), 'service worker registration keeps direct file opening supported');
assert(SW.includes("event.request.method !== 'GET'") && SW.includes("event.request.url).origin !== self.location.origin"), 'service worker limits cache to same-origin GET requests');
['./index.html', './src/main.js', './src/levels12.js', './assets/icon.svg'].forEach(asset => assert(SW.includes("'" + asset + "'"), 'service worker precaches ' + asset));
// Daily runs use hard physics but must never write normal-mode records.
assert(MAIN.includes("else if (!isDailyRun) save.best[key]"), 'Daily clear must skip normal record writes');
assert(MAIN.includes("if (flawless && !isDailyRun) save.nodeaths++"), 'Daily clear must skip normal flawless totals');
assert(!MAIN.includes("if (!prev) save.best[key]"), 'Glitch clear must skip normal records');
assert(HTML.includes('id="announcer"') && HTML.includes('aria-live="polite"'), 'screen-reader announcer exists');
assert(HTML.includes('id="game" tabindex="-1"') && MAIN.includes('function focusPanel'), 'game canvas and overlay focus handoff exist');
assert(MAIN.includes('target.focus()') && MAIN.includes("$('pausebtn').focus()"), 'overlay focus returns to actionable controls');
assert(MAIN.includes("setAttribute('aria-pressed', String(inp.j))"), 'touch controls expose pressed state');
assert(MAIN.includes("announce('You died. ' + GH.deathTip"), 'death coaching announces to screen readers');
const recovered = Save.normalize({ best: [], hard: null, skin: 99, nodeaths: 'bad', daily: { last: 4, best: 'bad', streak: -2 }, tips: 'bad', ach: [] });
assert(Object.keys(recovered.best).length === 0 && Object.keys(recovered.hard).length === 0, 'malformed save maps recover');
assert(recovered.skin === 4 && recovered.nodeaths === 0 && !recovered.daily, 'malformed save scalars recover');
const kept = Save.normalize({ best: { 2: { stars: 2, time: 8.5, coins: 3, deaths: 1 } }, skin: 1, daily: { last: '2026-10-18', best: 7.2, streak: 3 } });
assert(kept.best[2].stars === 2 && kept.best[2].time === 8.5 && kept.daily.streak === 3, 'valid save progress preserved');
// physics
let lv = G.parse({ name: 't', par: 1, rows: ['.......', '.......', '.S....E', '#######'] });
let s = G.create(lv);
for (let i = 0; i < 30; i++) G.step(s, {});
assert(s.ground, 'lands on floor');
let y0 = s.y, minY = y0;
for (let i = 0; i < 60; i++) { G.step(s, { jump: true }); minY = Math.min(minY, s.y); }
assert(y0 - minY > 38 && y0 - minY < 46, 'full jump ~42px, got ' + (y0 - minY));
s = G.create(lv); for (let i = 0; i < 20; i++) G.step(s, {}); y0 = s.y; minY = y0;
for (let i = 0; i < 60; i++) { G.step(s, { jump: i < 4 }); minY = Math.min(minY, s.y); }
assert(y0 - minY < 30, 'short hop is shorter, got ' + (y0 - minY));
// mastery guidance: coin star first, then par pace, then explicit miss
const goalLv = { par: 2, coins: [{}, {}] };
assert(G.nextGoal(goalLv, { ncoins: 0, time: 1 }).kind === 'coins', 'next goal prioritizes coins');
assert(G.nextGoal(goalLv, { ncoins: 0, time: 1 }).text === '★ 2 coins for star · 1.0s to par', 'coin goal shows par budget');
assert(G.nextGoal(goalLv, { ncoins: 2, time: 1 }).kind === 'pace', 'next goal shows par pace');
assert(G.nextGoal(goalLv, { ncoins: 2, time: 1 }).text === '★ 3-star pace · 1.0s to par', 'pace goal shows exact budget');
assert(G.nextGoal(goalLv, { ncoins: 2, time: 2.01 }).kind === 'missed', 'next goal marks missed par');
assert(G.nextGoal(goalLv, { ncoins: 0, time: 2.01 }).text.indexOf('time star missed') >= 0, 'coin goal flags missed time star');
assert(G.clearGoal(goalLv, { ncoins: 0, time: 1 }).text === 'NEXT: collect 2 coins for ★2', 'clear goal targets missing coins');
assert(G.clearGoal(goalLv, { ncoins: 2, time: 2.1 }).text === 'NEXT: beat 2s for ★3', 'clear goal targets par');
assert(G.clearGoal(goalLv, { ncoins: 2, time: 1 }).kind === 'mastered', 'clear goal marks full mastery');
assert(G.bestPace(9.4, 10).kind === 'ahead' && G.bestPace(9.4, 10).text === 'PB in 0.6s', 'pace shows time left to beat PB');
assert(G.bestPace(10.6, 10).kind === 'behind' && G.bestPace(10.6, 10).text === 'PB missed +0.6s', 'pace shows overrun');
assert(G.bestPace(2, NaN).kind === 'fresh', 'pace handles missing record');
const cpLv = { cps: [{ x: 10 }, { x: 20 }] };
assert(G.checkpointProgress(cpLv, { cp: { x: 10 } }).text === '⚑ CP 1/2', 'checkpoint HUD shows first reached');
assert(G.checkpointProgress({ cps: [] }, { cp: { x: 10 } }).active === false, 'checkpoint HUD hides when absent');
assert(G.deathTip('spike').indexOf('jump earlier') >= 0, 'spike death coaching is actionable');
assert(G.deathTip('pit').indexOf('DASH') >= 0, 'pit death coaching mentions dash');
assert(G.deathTip('unknown').indexOf('keep moving') >= 0, 'unknown death cause has fallback coaching');
// coyote: walk off ledge then jump 4 frames later still works
lv = G.parse({ name: 't', par: 1, rows: ['..........', '.S........', '####......'] });
s = G.create(lv); for (let i = 0; i < 10; i++) G.step(s, {});
for (let i = 0; i < 40 && s.ground; i++) G.step(s, { dir: 1 });
assert(!s.ground, 'left ledge'); for (let i = 0; i < 3; i++) G.step(s, { dir: 1 });
G.step(s, { dir: 1, jump: true }); assert(s.vy < -200, 'coyote jump');
// levels (solved in parallel worker threads: serial run took >10 min)
const widths = [10, 25, 50, 100, 200, 400];
const WT = require('worker_threads');
function solveLevel(i) {
  let need = null, res;
  for (const w of widths) { res = B.solve(LV[i], { width: w, frames: 2, cap: i >= 40 }); if (res.ok) { need = w; break; } }
  return { i, need, res };
}
if (!WT.isMainThread) { WT.parentPort.postMessage(solveLevel(WT.workerData)); process.exit(0); }
const results = new Array(LV.length);
const nWorkers = Math.max(1, Math.min(require('os').cpus().length - 1, 8));
let nextIdx = 0, done = 0;
function report() {
  results.forEach(r => {
    const d = LV[r.i];
    console.log(String(r.i + 1).padStart(2), d.name.padEnd(16), r.need ? 'min beam ' + String(r.need).padStart(3) : 'UNSOLVED', JSON.stringify(r.res));
    assert(r.need, d.name + ' must be solvable');
  });
  console.log('ok');
}
function launch() {
  if (nextIdx >= LV.length) return;
  const w = new WT.Worker(__filename, { workerData: nextIdx++ });
  w.on('message', r => { results[r.i] = r; });
  w.on('error', e => { console.error('FAIL worker', e); process.exit(1); });
  w.on('exit', () => { done++; if (done === LV.length) report(); else launch(); });
}
for (let k = 0; k < nWorkers; k++) launch();

