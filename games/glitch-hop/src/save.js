/* Glitch Hop save normalization. Pure, browser- and Node-testable. */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.GHSave = factory();
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function finite(n, fallback) { return Number.isFinite(n) ? n : fallback; }
  function whole(n, fallback) { n = finite(Number(n), fallback); return Math.max(0, Math.floor(n)); }
  function map(value) { return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
  function record(value, hard) {
    if (value === true) return hard ? { time: 999, deaths: 0 } : { stars: 1, time: 999, coins: 0, skipped: true };
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    if (hard) return { time: finite(Number(value.time), 999), deaths: whole(value.deaths, 0) };
    return { stars: Math.min(3, whole(value.stars, 0)), time: finite(Number(value.time), 999), coins: whole(value.coins, 0), deaths: whole(value.deaths, 0), skipped: !!value.skipped };
  }
  function records(value, hard) {
    var src = map(value), out = {};
    Object.keys(src).forEach(function (key) { var n = Number(key), r = record(src[key], hard); if (Number.isInteger(n) && n >= 0 && r) out[n] = r; });
    return out;
  }
  function flags(value) {
    var src = map(value), out = {};
    Object.keys(src).forEach(function (key) { if (src[key]) out[key] = 1; });
    return out;
  }
  function normalize(raw) {
    var src = map(raw), daily = map(src.daily), out = {
      best: records(src.best, false), hard: records(src.hard, true), mute: !!src.mute, nomusic: !!src.nomusic, novib: !!src.novib,
      nodeaths: whole(src.nodeaths, 0), skin: Math.min(4, whole(src.skin, 0)), tips: flags(src.tips), ach: flags(src.ach)
    };
    if (typeof daily.last === 'string' && daily.last.length <= 20) out.daily = { last: daily.last, best: finite(Number(daily.best), 999), streak: whole(daily.streak, 0) };
    return out;
  }
  return { normalize: normalize };
});
