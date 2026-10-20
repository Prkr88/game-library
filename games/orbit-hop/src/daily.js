// Orbit Hop — daily challenge streak state (pure, Node-testable).
(function (root) {
  'use strict';
  function dayNumber(key) {
    var p = String(key || '').split('-').map(Number);
    if (p.length !== 3 || p.some(function (x) { return !isFinite(x); })) return NaN;
    return Math.floor(Date.UTC(p[0], p[1] - 1, p[2]) / 86400000);
  }
  function fresh(date) { return { date: date, best: 0, plays: 0, streak: 0, lastPlayed: '' }; }
  function normalize(d, date) {
    d = d || fresh(date);
    if (d.date !== date) { d.date = date; d.best = 0; d.plays = 0; }
    d.streak = Number.isFinite(d.streak) ? d.streak : 0;
    d.lastPlayed = typeof d.lastPlayed === 'string' ? d.lastPlayed : '';
    return d;
  }
  function record(d, date, score) {
    d = normalize(d, date);
    var prior = d.lastPlayed;
    if (prior !== date) {
      d.streak = dayNumber(date) - dayNumber(prior) === 1 ? d.streak + 1 : 1;
      d.lastPlayed = date;
    }
    d.plays++;
    if (score > d.best) d.best = score;
    return { streak: d.streak, newDay: prior !== date, best: d.best };
  }
  var api = { fresh: fresh, normalize: normalize, record: record };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.OrbitDaily = api;
})(this);
