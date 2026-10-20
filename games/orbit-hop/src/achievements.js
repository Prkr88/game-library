// Orbit Hop — achievements (pure logic). Browser: window.OrbitAch, Node: module.exports.
(function (root) {
  'use strict';
  // stat: run-best value (scope 'run') or lifetime total (scope 'total'); reward in stars.
  var LIST = [
    { id: 'first', name: 'Liftoff', text: 'Score 5 in one run', stat: 'score', scope: 'run', target: 5, reward: 5 },
    { id: 'score30', name: 'Wanderer', text: 'Score 30 in one run', stat: 'score', scope: 'run', target: 30, reward: 20 },
    { id: 'score75', name: 'Navigator', text: 'Score 75 in one run', stat: 'score', scope: 'run', target: 75, reward: 50 },
    { id: 'rocks', name: 'Rock Dodger', text: 'Reach planet 30 (asteroid belt)', stat: 'score', scope: 'run', target: 30, reward: 40 },
    { id: 'score150', name: 'Cosmic Ace', text: 'Score 150 in one run', stat: 'score', scope: 'run', target: 150, reward: 150 },
    { id: 'combo5', name: 'Chain Hopper', text: 'Reach combo x5', stat: 'combo', scope: 'run', target: 5, reward: 30 },
    { id: 'combo10', name: 'Unstoppable', text: 'Reach combo x10', stat: 'combo', scope: 'run', target: 10, reward: 100 },
    { id: 'stars100', name: 'Stardust', text: 'Collect 100 stars total', stat: 'stars', scope: 'total', target: 100, reward: 50 },
    { id: 'runs50', name: 'Frequent Flyer', text: 'Play 50 runs', stat: 'runs', scope: 'total', target: 50, reward: 60 },
    { id: 'daily', name: 'Daily Orbit', text: 'Play a Daily run', stat: 'daily', scope: 'total', target: 1, reward: 15 },
    { id: 'daily40', name: 'Daily Pilot', text: 'Score 40 in a Daily run', stat: 'dailyScore', scope: 'run', target: 40, reward: 60 }
  ];

  function fresh() { return { done: [], prog: {} }; }
  // run = {score, combo, stars, daily:0|1, dailyScore}; returns newly unlocked achievements
  function update(st, run) {
    var out = [];
    LIST.forEach(function (a) {
      if (st.done.indexOf(a.id) >= 0) return;
      var v = a.stat === 'runs' ? 1 : (run[a.stat] || 0), p = st.prog[a.id] || 0;
      p = a.scope === 'run' ? Math.max(p, v) : p + v;
      st.prog[a.id] = Math.min(p, a.target);
      if (p >= a.target) { st.done.push(a.id); out.push(a); }
    });
    return out;
  }
  var api = { LIST: LIST, fresh: fresh, update: update };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.OrbitAch = api;
})(typeof window !== 'undefined' ? window : globalThis);
