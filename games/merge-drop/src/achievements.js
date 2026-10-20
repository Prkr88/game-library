(function (root) {
  var DEFS = [
    { id: 't128', icon: '🔹', name: 'Warm-up', desc: 'Make a 128 tile', ok: function (s) { return s.bestTile >= 128; } },
    { id: 't512', icon: '🔷', name: 'Getting Big', desc: 'Make a 512 tile', ok: function (s) { return s.bestTile >= 512; } },
    { id: 't2048', icon: '👑', name: 'Royalty', desc: 'Make a 2048 tile', ok: function (s) { return s.bestTile >= 2048; } },
    { id: 'chain4', icon: '⛓️', name: 'Chain Reaction', desc: 'Reach a x4 chain', ok: function (s) { return (s.maxChain || 0) >= 4; } },
    { id: 'clear', icon: '✨', name: 'Spotless', desc: 'Clear the whole board', ok: function (s) { return (s.clears || 0) >= 1; } },
    { id: 'score5k', icon: '💯', name: 'High Roller', desc: 'Score 5,000 in a run', ok: function (s) { return s.best >= 5000; } },
    { id: 'runs10', icon: '🎮', name: 'Regular', desc: 'Play 10 runs', ok: function (s) { return s.runs >= 10; } },
    { id: 'streak3', icon: '🔥', name: 'On Fire', desc: '3-day daily streak', ok: function (s) { return s.daily && s.daily.streak >= 3; } },
    { id: 'chain6', icon: '🌋', name: 'Chain Master', desc: 'Reach a x6 chain', ok: function (s) { return (s.maxChain || 0) >= 6; } },
    { id: 'blitz1k', icon: '⚡', name: 'Speed Demon', desc: 'Score 1,500 in Blitz', ok: function (s) { return (s.blitzBest || 0) >= 1500; } },
    { id: 'rise1k', icon: '⬆️', name: 'Riser', desc: 'Score 1,000 in Rise mode', ok: function (s) { return (s.riseBest || 0) >= 1000; } },
    { id: 'lvl8', icon: '🪨', name: 'Stone Cold', desc: 'Survive to level 8', ok: function (s) { return (s.maxLevel || 0) >= 8; } },
    { id: 'bomber', icon: '💣', name: 'Demolition', desc: 'Use 10 bombs', ok: function (s) { return (s.bombsUsed || 0) >= 10; } },
    { id: 'daily1', icon: '📅', name: 'Daily Driver', desc: 'Finish a daily challenge', ok: function (s) { return !!(s.daily && s.daily.last); } },
    { id: 't1024', icon: '💎', name: 'Diamond Cut', desc: 'Make a 1024 tile', ok: function (s) { return s.bestTile >= 1024; } },
    { id: 'score20k', icon: '🏆', name: 'Whale', desc: 'Score 20,000 in a run', ok: function (s) { return s.best >= 20000; } },
    { id: 'chain8', icon: '☄️', name: 'Cascade God', desc: 'Reach a x8 chain', ok: function (s) { return (s.maxChain || 0) >= 8; } },
    { id: 'hard2k', icon: '💀', name: 'Hardcore', desc: 'Score 2,000 in Hardcore', ok: function (s) { return (s.hardBest || 0) >= 2000; } },
    { id: 'pz10', icon: '🧩', name: 'Puzzler', desc: 'Solve 10 puzzles', ok: function (s) { return (s.puzzle || []).filter(function (v) { return v > 0; }).length >= 10; } },
    { id: 'pz3star', icon: '🌟', name: 'Perfectionist', desc: '3-star 12 puzzles', ok: function (s) { return (s.puzzle || []).filter(function (v) { return v === 3; }).length >= 12; } },
    { id: 'pz30', icon: '🧠', name: 'Puzzle Master', desc: 'Solve all 30 puzzles', ok: function (s) { return (s.puzzle || []).filter(function (v) { return v > 0; }).length >= 30; } },
    { id: 'pz3star30', icon: '🪐', name: 'Grandmaster', desc: '3-star 25 puzzles', ok: function (s) { return (s.puzzle || []).filter(function (v) { return v === 3; }).length >= 25; } },
    { id: 'blitz4k', icon: '🚀', name: 'Overclocked', desc: 'Score 4,000 in Blitz', ok: function (s) { return (s.blitzBest || 0) >= 4000; } },
    { id: 'rise3k', icon: '🧗', name: 'Skyscraper', desc: 'Score 3,000 in Rise mode', ok: function (s) { return (s.riseBest || 0) >= 3000; } },
    { id: 'streak7', icon: '🗓️', name: 'Creature of Habit', desc: '7-day daily streak', ok: function (s) { return s.daily && s.daily.streak >= 7; } },
    { id: 'runs50', icon: '🏅', name: 'Veteran', desc: 'Play 50 runs', ok: function (s) { return s.runs >= 50; } }
  ];
  // returns defs newly unlocked; mutates save.ach
  function check(save) {
    save.ach = save.ach || {};
    var out = [];
    DEFS.forEach(function (d) { if (!save.ach[d.id] && d.ok(save)) { save.ach[d.id] = 1; out.push(d); } });
    return out;
  }
  var api = { DEFS: DEFS, check: check };
  if (typeof module !== 'undefined') module.exports = api; else root.MergeAch = api;
})(this);
