const L = require('./src/logic.js');
const D = require('./src/daily.js');
const M = require('./src/missions.js');
const S = require('./src/save.js');
{
  const clean = S.normalize({ best: '12', owned: 'broken', daily: { streak: 'bad' }, missions: { done: 'bad', prog: null }, ach: null });
  if (clean.best !== 12 || !Array.isArray(clean.owned) || clean.owned[0] !== 'comet') throw new Error('save scalar recovery');
  if (!Array.isArray(clean.missions.done) || typeof clean.missions.prog !== 'object' || clean.daily.streak !== 0) throw new Error('save nested recovery');
  if (S.normalize(null).skin !== 'comet') throw new Error('save root recovery');
  console.log('save normalization ok');
}
{
  const d = D.fresh('2026-10-18');
  if (D.record(d, '2026-10-18', 7).streak !== 1) throw new Error('daily first streak');
  if (D.record(d, '2026-10-18', 3).streak !== 1 || d.plays !== 2) throw new Error('daily same-day repeat');
  if (D.record(d, '2026-10-19', 9).streak !== 2 || d.best !== 9) throw new Error('daily consecutive streak');
  if (D.record(d, '2026-10-21', 2).streak !== 1) throw new Error('daily gap reset');
}
console.log('daily ok');

const ms = M.fresh();
M.update(ms, { score: 9, stars: 0, combo: 0, jumps: 0 });
if (M.next(ms).id !== 'score10') throw new Error('mission next closest');
M.update(ms, { score: 10, stars: 0, combo: 0, jumps: 0 });
if (M.next(ms).id === 'score10') throw new Error('mission next skips done');
console.log('missions ok');
function sim(seed, jumpEvery) {
  const g = L.createGame(seed); let t = 0, n = 0;
  while (!g.over && n++ < 60000) { if (++t % jumpEvery === 0) L.tap(g); L.step(g, 1 / 60); }
  return g;
}
// random play terminates
const g = sim(7, 40);
if (!g.over) throw new Error('did not end');
// revive works once
if (!L.revive(g)) throw new Error('revive failed');
if (g.over || g.player.mode !== 'orbit') throw new Error('bad revive state');
if (L.revive(g)) throw new Error('double revive');
for (let i = 0; i < 30; i++) L.step(g, 1 / 60);
if (g.over && !g.player.planet) throw new Error('broken');
// revive on non-over game is refused
if (L.revive(L.createGame(1))) throw new Error('revive on live game');
// determinism
if (sim(5, 33).score !== sim(5, 33).score) throw new Error('nondeterministic');
console.log('ok');
// launch guidance points at immediate next planet and reports signed angular error
{
  const guide = L.createGame(11);
  const target = L.nextPlanet(guide);
  if (!target || target.idx !== 1) throw new Error('missing next target');
  const expected = Math.atan2(target.y - guide.player.planet.y, target.x - guide.player.planet.x);
  guide.player.a = expected;
  if (Math.abs(L.aimDelta(guide)) > 1e-9) throw new Error('aim delta aligned');
  guide.player.a = expected + 0.5;
  if (!(L.aimDelta(guide) < -0.49)) throw new Error('aim delta signed');
  console.log('guidance ok');
}
// next-segment hazard preview reports known hazards without changing their rules
{
  const preview = L.createGame(12);
  preview.holes.push({ idx: 1 }); preview.rocks.push({ idx: 1 }); preview.gates.push({ idx: 1 });
  if (L.nextHazards(preview).join('|') !== 'BLACK HOLE|ASTEROID|LASER') throw new Error('hazard preview');
  preview.player.planet = preview.planets[1];
  if (L.nextHazards(preview).length) throw new Error('hazard preview wrong segment');
  console.log('hazard preview ok');
}
// phase helper keeps HUD state explicit across orbit, flight, and game-over
{
  const phase = L.createGame(13);
  if (L.phaseHint(phase) !== 'ORBIT') throw new Error('phase orbit');
  L.tap(phase);
  if (L.phaseHint(phase) !== 'FLIGHT') throw new Error('phase flight');
  phase.over = true;
  if (L.phaseHint(phase) !== 'OVER') throw new Error('phase over');
  console.log('phase hint ok');
}
// pause gate summary exposes timing state without changing gate collision rules
{
  const gate = L.createGame(14);
  gate.gates.push({ idx: 1, per: 2, onFrac: 0.5, ph: 0 });
  if (L.nextGateState(gate).state !== 'ON') throw new Error('gate pause on');
  gate.t = 1.75;
  if (L.nextGateState(gate).state !== 'IN' || L.nextGateState(gate).seconds.toFixed(1) !== '0.3') throw new Error('gate pause countdown');
  L.tap(gate);
  if (L.nextGateState(gate).state !== 'CLEAR') throw new Error('gate pause flight');
  console.log('pause gate state ok');
}
// aim bot: reaches asteroid zone; rocks only exist from planet 28; rock hit ends run
{
  let rocksSeen = 0, rockDeaths = 0, deep = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const g2 = L.createGame(seed); let n = 0;
    while (!g2.over && n++ < 120000) {
      const pl = g2.player;
      if (pl.mode === 'orbit') {
        const nx = g2.planets.find(p => p.idx === pl.planet.idx + 1);
        if (nx) { const da = Math.atan2(Math.sin(Math.atan2(nx.y - pl.y, nx.x - pl.x) - pl.a), Math.cos(Math.atan2(nx.y - pl.y, nx.x - pl.x) - pl.a)); if (Math.abs(da) < 0.05) L.tap(g2); }
      }
      L.step(g2, 1 / 60);
      rocksSeen = Math.max(rocksSeen, g2.rocks.length);
      if (g2.rocks.some(k => k.idx < 28)) throw new Error('early rock');
      L.drain(g2).forEach(e => { if (e.rock) rockDeaths++; });
    }
    if (g2.player.planet.idx >= 28) deep++;
  }
  console.log('bot: reached>=28 in', deep, '/40 seeds; max rocks', rocksSeen, 'rock deaths', rockDeaths);
  if (!rocksSeen) throw new Error('no rocks generated');
}
console.log('ok2');
{
  const A = require('./src/achievements.js'); const st = A.fresh();
  if (A.update(st, { score: 6 }).map(a => a.id).join() !== 'first') throw new Error('ach first');
  if (A.update(st, { score: 6 }).length) throw new Error('ach repeat');
  A.update(st, { score: 200, combo: 12, daily: 1, dailyScore: 50 });
  if (st.done.length < 8) throw new Error('ach many ' + st.done);
  console.log('ok3');
}
{
  // hard mode: starts at planet-30 difficulty, hazards appear early, harder than normal
  const stat = hard => { let sc = 0, deep = 0, hz = 0;
    for (let seed = 1; seed <= 40; seed++) { const g3 = L.createGame(seed, hard); let n = 0;
      while (!g3.over && n++ < 120000) { const pl = g3.player;
        if (pl.mode === 'orbit') { const nx = g3.planets.find(p => p.idx === pl.planet.idx + 1);
          if (nx) { const ang = Math.atan2(nx.y - pl.y, nx.x - pl.x); if (Math.abs(Math.atan2(Math.sin(ang - pl.a), Math.cos(ang - pl.a))) < 0.05) L.tap(g3); } }
        L.step(g3, 1 / 60); hz = Math.max(hz, g3.holes.length + g3.rocks.length); }
      sc += g3.score; }
    return { avg: sc / 40, hz }; };
  const n = stat(false), h = stat(true);
  console.log('bot avg score normal', n.avg, 'hard', h.avg, 'hazards', h.hz);
  if (!(h.avg < n.avg)) throw new Error('hard not harder');
  console.log('ok4');
}
{
  // flippers appear deep, reverse spin; near-miss scoring only on landing
  let flips = 0, rev = 0, near = 0;
  for (let seed = 1; seed <= 30; seed++) {
    const g4 = L.createGame(seed, true); let n = 0;
    while (!g4.over && n++ < 60000) { const pl = g4.player;
      if (pl.mode === 'orbit') { const nx = g4.planets.find(p => p.idx === pl.planet.idx + 1);
        if (nx) { const ang = Math.atan2(nx.y - pl.y, nx.x - pl.x); if (Math.abs(Math.atan2(Math.sin(ang - pl.a), Math.cos(ang - pl.a))) < 0.05) L.tap(g4); } }
      const sp = g4.planets.filter(p => p.flip).map(p => p.spin);
      L.step(g4, 1 / 60);
      g4.planets.filter(p => p.flip).forEach((p, i) => { flips = 1; });
      L.drain(g4).forEach(e => { if (e.type === 'near') near++; });
    }
    g4.planets.forEach(p => { if (p.flip && p.idx + 30 <= 36) throw new Error('early flipper'); });
  }
  const g5 = L.createGame(3, true); for (let i = 0; i < 400; i++) { g5.planets.forEach(p => { if (!p.flip && p.idx === 1) { p.flip = 1; p.ft = 1; p.spin = 2; } }); }
  const q = g5.planets[1]; q.flip = 1; q.ft = 0.01; q.spin = 2; L.step(g5, 0.05);
  if (q.spin !== -2) throw new Error('flip failed');
  console.log('flippers seen', flips, 'near misses', near);
  if (!flips) throw new Error('no flippers');
  console.log('ok5');
}
{
  // laser gates: only from planet 45; naive bot dies to them, gate-aware bot (waits for beam off) survives further
  const run = (aware, seeds) => { let sc = 0, zaps = 0, seen = 0;
    for (let seed = 1; seed <= seeds; seed++) { const g6 = L.createGame(seed); let n = 0;
      while (!g6.over && n++ < 200000) { const pl = g6.player;
        if (pl.mode === 'orbit') { const nx = g6.planets.find(p => p.idx === pl.planet.idx + 1);
          if (nx) { const ang = Math.atan2(nx.y - pl.y, nx.x - pl.x); if (Math.abs(Math.atan2(Math.sin(ang - pl.a), Math.cos(ang - pl.a))) < 0.05) {
            const blk = g6.gates.some(k => k.y < pl.y && k.y > nx.y && (L.gateOn(g6, k) || L.gateIn(g6, k) < 0.55));
            if (!aware || !blk) L.tap(g6); } } }
        L.step(g6, 1 / 60); seen = Math.max(seen, g6.gates.length);
        if (g6.gates.some(k => k.idx < 45)) throw new Error('early gate'); }
      L.drain(g6).forEach(e => { if (e.gate) zaps++; }); sc += g6.score; }
    return { avg: sc / seeds, zaps, seen }; };
  const a = run(false, 30), b = run(true, 30);
  console.log('gates seen', a.seen, 'naive avg', a.avg, 'zaps', a.zaps, 'aware avg', b.avg, 'zaps', b.zaps);
  if (!a.seen) throw new Error('no gates');
  if (!(a.zaps > 0 && b.zaps < a.zaps)) throw new Error('gates not skill-gated');
  console.log('ok6');
}
// shield: absorbs exactly one hazard hit, then invuln; shields only from planet 14
{
  const g3 = L.createGame(3);
  if (g3.planets.some(p => p.shield && p.idx < 14)) throw new Error('early shield');
  g3.shield = true; g3.holes.push({ x: 200, y: 0, r: 20, pull: 0, idx: 99 });
  g3.player.mode = 'fly'; g3.player.from = g3.planets[0]; g3.player.x = 200; g3.player.y = 0; g3.player.vx = 0; g3.player.vy = 0;
  L.step(g3, 1 / 60);
  if (g3.over || g3.shield) throw new Error('shield did not absorb');
  g3.inv = 0; g3.player.x = 200; g3.player.y = 0;
  L.step(g3, 1 / 60);
  if (!g3.over) throw new Error('second hit should kill');
  let seen = 0, pops = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const g4 = L.createGame(seed); let n = 0;
    while (!g4.over && n++ < 120000) {
      const pl = g4.player;
      if (pl.mode === 'orbit') { const nx = g4.planets.find(p => p.idx === pl.planet.idx + 1); if (nx) { const a = Math.atan2(nx.y - pl.y, nx.x - pl.x); if (Math.abs(Math.atan2(Math.sin(a - pl.a), Math.cos(a - pl.a))) < 0.05) L.tap(g4); } }
      L.step(g4, 1 / 60);
      L.drain(g4).forEach(e => { if (e.type === 'shieldGet') seen++; if (e.type === 'shieldPop') pops++; });
    }
  }
  console.log('shields collected', seen, 'absorbed', pops);
  if (!seen) throw new Error('no shields collected');
}

// ads adapter
{
  const A=require('./src/ads.js'); const mem={}; const store={getItem:k=>mem[k]||null,setItem:(k,v)=>{mem[k]=v;}};
  let t=1e6, inter=0, rewardOk=true;
  const native={requestConsent:()=>Promise.resolve(true),showInterstitial:()=>{inter++;return Promise.resolve();},showRewarded:()=>Promise.resolve(rewardOk)};
  const web=A.create(null,store,()=>t);
  if(web.canShow()||web.maybeInterstitial(3)||web.rewardedReady())throw new Error('ads: web must be inert');
  const a=A.create(native,store,()=>t);
  if(a.maybeInterstitial(3)||inter)throw new Error('ads: no consent yet');
  a.ensureConsent().then(()=>{
    if(!a.maybeInterstitial(3)||inter!==1)throw new Error('ads: interstitial');
    if(a.maybeInterstitial(6)||inter!==1)throw new Error('ads: min gap');
    t+=A.MIN_GAP_MS+1; if(a.maybeInterstitial(4))throw new Error('ads: every-3rd');
    a.setRemoveAds(true); if(a.maybeInterstitial(9))throw new Error('ads: removeAds');
    if(!A.create(native,store,()=>t).state.removeAds)throw new Error('ads: persist');
    let got=0; a.showRewarded(()=>got++); rewardOk=false; a.showRewarded(()=>got++);
    return new Promise(r=>setTimeout(r,5)).then(()=>{ if(got!==1)throw new Error('ads: reward only when earned'); console.log('ads ok'); });
  }).catch(e=>{console.error(e);process.exit(1);});
}
