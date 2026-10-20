// Ads adapter: consent-gated, frequency-capped, no-op unless a native bridge exists.
// Bridge = window.MergeAdsNative { requestConsent():Promise<bool>, showInterstitial():Promise, showRewarded():Promise<bool> }
// (wire to @capacitor-community/admob + UMP/ATT in the native shell). Web builds never define window.MergeAds.
(function (root) {
  var KEY = 'mergedrop_ads';
  var INTERSTITIAL_EVERY = 3, MIN_GAP_MS = 120000;

  function load(store) {
    var d = { consent: null, removeAds: false, lastInter: 0 };
    try {
      var r = JSON.parse(store.getItem(KEY) || '{}');
      if (r && typeof r === 'object') {
        if (r.consent === true || r.consent === false) d.consent = r.consent;
        d.removeAds = r.removeAds === true;
        if (isFinite(r.lastInter) && r.lastInter > 0) d.lastInter = r.lastInter;
      }
    } catch (e) {}
    return d;
  }

  function create(native, store, now) {
    var st = load(store);
    now = now || Date.now;
    function save() { try { store.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
    var api = {
      state: st,
      canShow: function () { return !!native && st.consent === true; },
      ensureConsent: function () {
        if (!native || st.consent !== null) return Promise.resolve(st.consent === true);
        return Promise.resolve(native.requestConsent()).then(function (ok) { st.consent = !!ok; save(); return st.consent; }, function () { return false; });
      },
      setRemoveAds: function (v) { st.removeAds = !!v; save(); },
      // runs = completed runs count; returns true if an interstitial was requested
      maybeInterstitial: function (runs) {
        if (!api.canShow() || st.removeAds || !native.showInterstitial) return false;
        if (runs % INTERSTITIAL_EVERY !== 0) return false;
        var t = now();
        if (t - st.lastInter < MIN_GAP_MS) return false;
        st.lastInter = t; save();
        try { Promise.resolve(native.showInterstitial()).catch(function () {}); } catch (e) {}
        return true;
      },
      rewardedReady: function () { return api.canShow() && !!native.showRewarded; },
      // done() runs only when the reward was earned
      showRewarded: function (done) {
        if (!api.rewardedReady()) return;
        Promise.resolve(native.showRewarded()).then(function (ok) { if (ok) done(); }, function () {});
      }
    };
    return api;
  }

  var out = { create: create, KEY: KEY, INTERSTITIAL_EVERY: INTERSTITIAL_EVERY, MIN_GAP_MS: MIN_GAP_MS };
  if (typeof module !== 'undefined' && module.exports) module.exports = out;
  if (root && root.MergeAdsNative) {
    var ads = create(root.MergeAdsNative, root.localStorage);
    root.MergeAds = ads;
    ads.ensureConsent();
  }
})(typeof window !== 'undefined' ? window : null);
