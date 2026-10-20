// Orbit Hop — missions (pure logic, no DOM). Browser: window.OrbitMissions, Node: module.exports.
(function (root) {
  'use strict';
  // scope 'run': best value within a single run; 'total': accumulates across runs.
  var POOL = [
    { id: 'score10', text: 'Score 10 in one run', stat: 'score', scope: 'run', target: 10, reward: 10 },
    { id: 'stars5', text: 'Collect 5 stars total', stat: 'stars', scope: 'total', target: 5, reward: 10 },
    { id: 'runs5', text: 'Play 5 runs', stat: 'runs', scope: 'total', target: 5, reward: 10 },
    { id: 'combo3', text: 'Reach combo x3', stat: 'combo', scope: 'run', target: 3, reward: 15 },
    { id: 'score25', text: 'Score 25 in one run', stat: 'score', scope: 'run', target: 25, reward: 20 },
    { id: 'stars25', text: 'Collect 25 stars total', stat: 'stars', scope: 'total', target: 25, reward: 25 },
    { id: 'jumps100', text: 'Launch 100 times', stat: 'jumps', scope: 'total', target: 100, reward: 25 },
    { id: 'score50', text: 'Score 50 in one run', stat: 'score', scope: 'run', target: 50, reward: 40 },
    { id: 'combo6', text: 'Reach combo x6', stat: 'combo', scope: 'run', target: 6, reward: 40 },
    { id: 'runs30', text: 'Play 30 runs', stat: 'runs', scope: 'total', target: 30, reward: 50 },
    { id: 'score100', text: 'Score 100 in one run', stat: 'score', scope: 'run', target: 100, reward: 100 },
    { id: 'stars150', text: 'Collect 150 stars total', stat: 'stars', scope: 'total', target: 150, reward: 100 }
  ];

  function fresh() { return { done: [], prog: {} }; }
  // Endless missions after the fixed pool: tier n cycles stat kinds with growing targets.
  var GEN = [
    { stat: 'score', scope: 'run', text: 'Score {t} in one run', base: 100, step: 25, rw: 5 },
    { stat: 'stars', scope: 'total', text: 'Collect {t} stars total', base: 150, step: 100, rw: 3 },
    { stat: 'combo', scope: 'run', text: 'Reach combo x{t}', base: 6, step: 2, rw: 8 },
    { stat: 'runs', scope: 'total', text: 'Play {t} runs', base: 30, step: 25, rw: 3 },
    { stat: 'jumps', scope: 'total', text: 'Launch {t} times', base: 100, step: 150, rw: 2 }
  ];
  function gen(n) {
    var g = GEN[n % GEN.length], tier = Math.floor(n / GEN.length) + 1, t = g.base + g.step * tier;
    var reward = Math.min(500, Math.round(g.rw * t / 5) * 5 + 50);
    return { id: 'g' + n, text: g.text.replace('{t}', t), stat: g.stat, scope: g.scope, target: t, reward: reward };
  }
  function active(m) {
    var out = POOL.filter(function (x) { return m.done.indexOf(x.id) < 0; });
    for (var n = 0; out.length < 3 && n < 10000; n++) if (m.done.indexOf('g' + n) < 0) out.push(gen(n));
    return out.slice(0, 3);
  }

  // Return closest active goal, preserving active-list order on ties.
  function next(m) {
    var best = null, bestRatio = -1;
    active(m).forEach(function (x) {
      var ratio = (m.prog[x.id] || 0) / x.target;
      if (ratio > bestRatio) { best = x; bestRatio = ratio; }
    });
    return best;
  }

  // run = {score, stars, combo, jumps}; returns missions completed this call (reward in .reward)
  function update(m, run) {
    var finished = [];
    active(m).forEach(function (x) {
      var v = x.stat === 'runs' ? 1 : (run[x.stat] || 0), p = m.prog[x.id] || 0;
      p = x.scope === 'run' ? Math.max(p, v) : p + v;
      m.prog[x.id] = Math.min(p, x.target);
      if (p >= x.target) { m.done.push(x.id); finished.push(x); }
    });
    return finished;
  }

  var api = { POOL: POOL, fresh: fresh, active: active, next: next, update: update };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.OrbitMissions = api;
})(typeof window !== 'undefined' ? window : globalThis);
