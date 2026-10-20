// Offline sanity: stub AudioContext, fire every SFX, run music scheduler. node tools/audio-test.js
const mk = () => new Proxy(function () {}, { get: (t, k) => (k === 'value' ? 0 : mk()), set: () => true, apply: () => mk() });
let ct = 0;
global.AudioContext = function () {
  return new Proxy({}, { get: (t, k) => k === 'currentTime' ? ct : k === 'sampleRate' ? 44100 : k === 'state' ? 'running' :
    k === 'createBuffer' ? () => ({ getChannelData: () => new Float32Array(22050) }) : () => mk() });
};
require('../src/audio.js');
GHAudio.init({}); GHAudio.setWorld(3);
Object.values(GHAudio.sfx).forEach(f => f());
GHAudio.music(); ct = 5;
setTimeout(() => { console.log('audio ok'); process.exit(0); }, 400);
