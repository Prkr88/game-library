// Orbit Hop — browser-save normalization (pure, Node-testable).
(function (root) {
  'use strict';
  function nonNegative(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  }
  function mapObject(value) { return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
  function progress(value) {
    var out = {};
    Object.keys(mapObject(value)).forEach(function (key) { out[key] = nonNegative(value[key], 0); });
    return out;
  }
  function tracker(value) {
    value = mapObject(value);
    return {
      done: Array.isArray(value.done) ? value.done.filter(function (id) { return typeof id === 'string'; }) : [],
      prog: progress(value.prog)
    };
  }
  function daily(value) {
    value = mapObject(value);
    return {
      date: typeof value.date === 'string' ? value.date : '',
      best: nonNegative(value.best, 0),
      plays: nonNegative(value.plays, 0),
      streak: nonNegative(value.streak, 0),
      lastPlayed: typeof value.lastPlayed === 'string' ? value.lastPlayed : ''
    };
  }
  function lastRun(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    return {
      mode: typeof value.mode === 'string' ? value.mode : 'normal',
      score: nonNegative(value.score, 0),
      planet: nonNegative(value.planet, 0),
      stars: nonNegative(value.stars, 0),
      combo: nonNegative(value.combo, 0),
      near: nonNegative(value.near, 0),
      shields: nonNegative(value.shields, 0)
    };
  }
  function normalize(raw) {
    raw = mapObject(raw);
    var owned = Array.isArray(raw.owned) ? raw.owned.filter(function (id) { return typeof id === 'string'; }) : ['comet'];
    if (owned.indexOf('comet') < 0) owned.unshift('comet');
    return {
      hardBest: nonNegative(raw.hardBest, 0), best: nonNegative(raw.best, 0),
      bestPlanet: nonNegative(raw.bestPlanet, 0), depthByMode: mapObject(raw.depthByMode),
      runs: nonNegative(raw.runs, 0), coins: nonNegative(raw.coins, 0),
      skin: typeof raw.skin === 'string' ? raw.skin : 'comet', owned: owned,
      muted: raw.muted === true, tutorial: raw.tutorial === true,
      daily: daily(raw.daily), lastRun: lastRun(raw.lastRun),
      missions: tracker(raw.missions), ach: tracker(raw.ach)
    };
  }
  var api = { normalize: normalize };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.OrbitSave = api;
})(typeof window !== 'undefined' ? window : globalThis);
