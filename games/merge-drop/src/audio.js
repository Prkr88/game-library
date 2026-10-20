// WebAudio synth: master compressor + generated reverb, enveloped voices, SFX, chord-based music.
var MergeAudio = (function () {
  var ac = null, master = null, sfxBus = null, musBus = null, vols = { sfx: 1, music: 1 }, verb = null, wet = null, muted = function () { return false; };
  var PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
  function noteHz(i) { return 261.63 * Math.pow(2, PENTA[Math.max(0, Math.min(i, PENTA.length - 1))] / 12); }
  function ctx() {
    if (ac) return ac;
    var C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    ac = new C();
    var comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 5;
    master = ac.createGain(); master.gain.value = 0.9; master.connect(comp); comp.connect(ac.destination);
    sfxBus = ac.createGain(); musBus = ac.createGain(); sfxBus.gain.value = vols.sfx; musBus.gain.value = vols.music; sfxBus.connect(master); musBus.connect(master);
    verb = ac.createConvolver();
    var n = Math.floor(ac.sampleRate * 1.4), buf = ac.createBuffer(2, n, ac.sampleRate);
    for (var c = 0; c < 2; c++) { var d = buf.getChannelData(c); for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6); }
    verb.buffer = buf; wet = ac.createGain(); wet.gain.value = 0.28; verb.connect(wet); wet.connect(master);
    return ac;
  }
  // voice: attack/decay envelope, optional pitch glide, optional reverb send
  function voice(f, d, type, vol, o) {
    if (muted()) return; o = o || {};
    try {
      var a = ctx(); if (!a) return; if (a.state === 'suspended') a.resume();
      var t = a.currentTime + (o.at || 0), osc = a.createOscillator(), g = a.createGain(), at = o.attack || 0.006;
      osc.type = type || 'sine'; osc.frequency.setValueAtTime(f, t);
      if (o.glide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.glide), t + d);
      if (o.detune) osc.detune.value = o.detune;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol || 0.15, t + at);
      g.gain.exponentialRampToValueAtTime(0.0008, t + d);
      osc.connect(g); g.connect(o.music ? musBus : sfxBus); if (o.verb) g.connect(verb);
      osc.start(t); osc.stop(t + d + 0.02);
    } catch (e) {}
  }
  function noise(d, vol, hp, o) {
    if (muted()) return; o = o || {};
    try {
      var a = ctx(); if (!a) return; var t = a.currentTime + (o.at || 0);
      var n = Math.floor(a.sampleRate * d), b = a.createBuffer(1, n, a.sampleRate), x = b.getChannelData(0);
      for (var i = 0; i < n; i++) x[i] = Math.random() * 2 - 1;
      var s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
      s.buffer = b; f.type = o.lp ? 'lowpass' : 'highpass'; f.frequency.setValueAtTime(hp, t);
      if (o.sweep) f.frequency.exponentialRampToValueAtTime(o.sweep, t + d);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + d);
      s.connect(f); f.connect(g); g.connect(o.music ? musBus : sfxBus); if (o.verb) g.connect(verb); s.start(t);
    } catch (e) {}
  }
  var api = {
    noteHz: noteHz, tone: voice, noise: noise,
    setVolume: function (kind, v) { v = Math.max(0, Math.min(1, +v || 0)); vols[kind] = v; var b = kind === 'music' ? musBus : sfxBus; if (b) b.gain.value = v; },
    setMuted: function (fn) { muted = fn; },
    unlock: function () { try { var a = ctx(); if (a && a.state === 'suspended') a.resume(); } catch (e) {} },
    drop: function (col) { voice(180 + col * 18, 0.09, 'triangle', 0.14, { glide: 110 }); noise(0.04, 0.05, 2500); },
    land: function () { voice(120, 0.08, 'sine', 0.12, { glide: 70 }); noise(0.03, 0.04, 800, { lp: 1 }); },
    // pitch climbs with tile value and chain; chain adds a fifth + sparkle
    merge: function (value, chain) {
      var step = chain - 1 + Math.min(5, Math.log2(value) - 1), f = noteHz(step);
      voice(f, 0.32, 'sine', 0.2, { verb: 1 });
      voice(f * 2, 0.2, 'triangle', 0.07, { at: 0.01 });
      if (chain > 1) { voice(f * 1.5, 0.3, 'sine', 0.1, { at: 0.04, verb: 1 }); voice(f * 4, 0.12, 'sine', 0.05, { at: 0.07 }); }
      if (value >= 128) voice(f / 2, 0.5, 'sawtooth', 0.05, { verb: 1 });
    },
    bomb: function () { noise(0.5, 0.3, 3000, { lp: 1, sweep: 150 }); voice(110, 0.45, 'sawtooth', 0.2, { glide: 38 }); },
    swap: function () { voice(400, 0.07, 'square', 0.06); voice(600, 0.09, 'square', 0.06, { at: 0.06 }); },
    undo: function () { voice(520, 0.18, 'triangle', 0.12, { glide: 260 }); },
    rise: function () { voice(90, 0.28, 'square', 0.09, { glide: 60 }); noise(0.18, 0.07, 300, { lp: 1 }); },
    level: function () { [0, 2, 4].forEach(function (n, i) { voice(noteHz(n + 2), 0.22, 'triangle', 0.13, { at: i * 0.07, verb: 1 }); }); },
    clear: function () { [0, 2, 4, 5, 7, 9].forEach(function (n, i) { voice(noteHz(n), 0.45, 'sine', 0.17, { at: i * 0.07, verb: 1 }); voice(noteHz(n) * 2, 0.3, 'triangle', 0.05, { at: i * 0.07 + 0.02 }); }); },
    over: function () { [7, 4, 2, 0].forEach(function (n, i) { voice(noteHz(n) / 2, 0.5, 'sawtooth', 0.09, { at: i * 0.16, verb: 1, glide: noteHz(n) / 2.2 }); }); },
    warn: function () { voice(72, 0.14, 'sine', 0.2); voice(72, 0.14, 'sine', 0.14, { at: 0.18 }); },
    // music: 4-chord loop, pad + bass + arpeggio; tempo/density rise with intensity (0..1)
    musicStep: function (step, intensity) {
      var CH = [[0, 2, 4], [1, 3, 5], [2, 4, 6], [1, 3, 5]], ch = CH[Math.floor(step / 8) % 4], i = step % 8;
      if (i === 0) ch.forEach(function (n) { voice(noteHz(n) / 2, 2.2, 'sine', 0.03, { attack: 0.35, verb: 1, music: 1 }); });
      if (i % 4 === 0) voice(noteHz(ch[0]) / 4, 0.5, 'triangle', 0.07, { music: 1 });
      if (i % 2 === 1 || intensity > 0.5) voice(noteHz(ch[(i >> 1) % 3] + (i % 4 === 3 ? 3 : 0)), 0.35, 'sine', 0.035 + 0.02 * intensity, { verb: 1, music: 1 });
      if (intensity > 0.3 && i % 2 === 0) noise(0.03, 0.012 + 0.01 * intensity, 6000, { music: 1 });
    }
  };
  return api;
})();
if (typeof module !== 'undefined') module.exports = MergeAudio;
