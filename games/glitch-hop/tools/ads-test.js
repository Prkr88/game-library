const A = require('../src/ads.js'); const assert = require('assert');
const mem = () => { const m = {}; return { getItem: k => m[k] || null, setItem: (k, v) => { m[k] = v; } }; };
let t = 1e6, calls = 0;
const nat = { requestConsent: async () => true, showInterstitial: async () => { calls++; }, showRewarded: async () => true };
const a = A.create(nat, mem(), () => t);
assert(!a.maybeInterstitial(3), 'no consent -> no ad');
assert(!a.rewardedReady());
a.ensureConsent().then(() => {
  assert(a.rewardedReady());
  assert(!a.maybeInterstitial(2));
  assert(a.maybeInterstitial(3)); assert(!a.maybeInterstitial(6), 'gap cap');
  t += A.MIN_GAP_MS; assert(a.maybeInterstitial(6)); assert.equal(calls, 2);
  a.setRemoveAds(true); t += A.MIN_GAP_MS; assert(!a.maybeInterstitial(9));
  console.log('ads-test OK');
});
