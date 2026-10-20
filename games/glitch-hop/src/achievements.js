/* Glitch Hop achievements. Pure: GHAch.check(save, total) returns newly unlocked defs. */
(function (root) {
  function cleared(s) { return Object.keys(s.best || {}).length; }
  function starsTotal(s) { var n = 0; for (var k in s.best) n += s.best[k].stars || 0; return n; }
  function threeStars(s) { var n = 0; for (var k in s.best) if (s.best[k].stars >= 3) n++; return n; }
  function coins(s) { var n = 0; for (var k in s.best) n += s.best[k].coins || 0; return n; }
  function hardCount(s) { return Object.keys(s.hard || {}).length; }
  var DEFS = [
    { id: 'first', n: 'First Hop', d: 'Clear any level', f: function (s) { return cleared(s) >= 1; } },
    { id: 'ten', n: 'Warmed Up', d: 'Clear 10 levels', f: function (s) { return cleared(s) >= 10; } },
    { id: 'half', n: 'Halfway Glitch', d: 'Clear 25 levels', f: function (s) { return cleared(s) >= 25; } },
    { id: 'all', n: 'System Cleared', d: 'Clear every level', f: function (s, t) { return cleared(s) >= t; } },
    { id: 'star10', n: 'Star Chaser', d: 'Earn 3 stars on 10 levels', f: function (s) { return threeStars(s) >= 10; } },
    { id: 'star30', n: 'Perfectionist', d: 'Earn 3 stars on 30 levels', f: function (s) { return threeStars(s) >= 30; } },
    { id: 'flaw5', n: 'Clean Runner', d: '5 flawless clears (no deaths)', f: function (s) { return (s.nodeaths || 0) >= 5; } },
    { id: 'flaw25', n: 'Untouchable', d: '25 flawless clears', f: function (s) { return (s.nodeaths || 0) >= 25; } },
    { id: 'coin50', n: 'Coin Hoarder', d: 'Collect 50 coins', f: function (s) { return coins(s) >= 50; } },
    { id: 'glitch1', n: 'Glitched', d: 'Clear a level in Glitch mode', f: function (s) { return hardCount(s) >= 1; } },
    { id: 'glitch10', n: 'Bug Hunter', d: 'Clear 10 levels in Glitch mode', f: function (s) { return hardCount(s) >= 10; } },
    { id: 'daily3', n: 'Daily Habit', d: '3-day daily streak', f: function (s) { return ((s.daily || {}).streak || 0) >= 3; } }
  ];
  function check(save, total) {
    save.ach = save.ach || {}; var out = [];
    DEFS.forEach(function (a) { if (!save.ach[a.id] && a.f(save, total)) { save.ach[a.id] = 1; out.push(a); } });
    return out;
  }
  root.GHAch = { DEFS: DEFS, check: check };
  if (typeof module !== 'undefined') module.exports = root.GHAch;
})(typeof window !== 'undefined' ? window : globalThis);
