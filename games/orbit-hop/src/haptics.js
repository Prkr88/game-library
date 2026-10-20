// Haptics bridge: Capacitor Haptics plugin when native, navigator.vibrate on web.
(function (root) {
  'use strict';
  function plugin() {
    var C = root.Capacitor;
    return C && C.Plugins && C.Plugins.Haptics ? C.Plugins.Haptics : null;
  }
  function total(p) { return Array.isArray(p) ? p.reduce(function (a, b) { return a + b; }, 0) : p; }
  function buzz(pattern) {
    var h = plugin();
    if (h) {
      try {
        // long pattern = crash/heavy, short = light tap
        if (total(pattern) >= 60) h.notification && h.notification({ type: 'ERROR' });
        else h.impact && h.impact({ style: 'LIGHT' });
      } catch (e) {}
      return;
    }
    if (root.navigator && root.navigator.vibrate) root.navigator.vibrate(pattern);
  }
  root.OrbitHaptics = { buzz: buzz };
})(typeof window !== 'undefined' ? window : globalThis);
