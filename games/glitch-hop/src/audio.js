/* Glitch Hop audio - WebAudio master bus (compressor + delay/reverb), SFX, scheduled chiptune-synthwave music. */
(function (root) {
  var ac = null, master = null, sfxBus = null, musicBus = null, fxSend = null;
  var cfg = { musicOff: function () { return false; }, muted: function () { return false; }, active: function () { return true; } };
  var timer = null, nextT = 0, step = 0, key = 0, noiseBuf = null;
  // i, VI, III, VII minor progression (semitones above root), one chord per bar
  var PROG = [[0, 3, 7], [8, 12, 15], [3, 7, 10], [10, 14, 17]];
  var BASS = [0, 8, 3, 10];
  var STEP_S = 60 / 128 / 4;

  function mtof(n) { return 55 * Math.pow(2, n / 12); }
  function ctx() {
    if (!ac) {
      try {
        ac = new (root.AudioContext || root.webkitAudioContext)();
        var comp = ac.createDynamicsCompressor();
        comp.threshold.value = -14; comp.ratio.value = 5;
        master = ac.createGain(); master.gain.value = 0.9;
        sfxBus = ac.createGain(); sfxBus.gain.value = 1;
        musicBus = ac.createGain(); musicBus.gain.value = 0.7;
        sfxBus.connect(master); musicBus.connect(master); master.connect(comp); comp.connect(ac.destination);
        // feedback delay as cheap space
        var dl = ac.createDelay(1), fb = ac.createGain(), lp = ac.createBiquadFilter();
        dl.delayTime.value = STEP_S * 3; fb.gain.value = 0.35; lp.type = 'lowpass'; lp.frequency.value = 2400;
        fxSend = ac.createGain(); fxSend.gain.value = 0.28;
        fxSend.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(master);
        var n = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate), d = n.getChannelData(0);
        for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        noiseBuf = n;
      } catch (e) { ac = null; }
    }
    if (ac && ac.state === 'suspended') ac.resume();
    return ac;
  }
  function osc(type, f, t, d, vol, slide, bus, send) {
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(25, f * slide), t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(bus || sfxBus); if (send) g.connect(fxSend);
    o.start(t); o.stop(t + d + 0.02);
  }
  function noise(t, d, vol, freq, type, bus) {
    var s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; f.type = type || 'highpass'; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(f); f.connect(g); g.connect(bus || sfxBus); s.start(t); s.stop(t + d + 0.02);
  }
  function play(fn) { if (cfg.muted()) return; if (!ctx()) return; fn(ac.currentTime); }
  function rnd() { return 0.96 + Math.random() * 0.08; }

  var coinN = 0;
  var SFX = {
    jump: function () { play(function (t) { var r = rnd(); osc('square', 300 * r, t, 0.14, 0.07, 2.2); osc('triangle', 150 * r, t, 0.1, 0.08, 2); }); },
    wall: function () { play(function (t) { var r = rnd(); osc('square', 440 * r, t, 0.1, 0.06, 1.6); noise(t, 0.05, 0.05, 3000); }); },
    land: function () { play(function (t) { osc('sine', 130, t, 0.1, 0.16, 0.45); noise(t, 0.04, 0.06, 1200, 'lowpass'); }); },
    pad: function () { play(function (t) { osc('sawtooth', 180, t, 0.3, 0.07, 5, null, true); osc('square', 360, t + 0.04, 0.22, 0.04, 3, null, true); }); },
    dash: function () { play(function (t) { noise(t, 0.2, 0.12, 900, 'bandpass'); osc('sawtooth', 500, t, 0.18, 0.05, 0.4); }); },
    coin: function () {
      play(function (t) {
        var base = [880, 988, 1109, 1319, 1480][coinN++ % 5];
        osc('square', base, t, 0.08, 0.05, 1, null, true); osc('square', base * 1.5, t + 0.06, 0.14, 0.05, 1, null, true);
      });
    },
    die: function () {
      play(function (t) {
        noise(t, 0.35, 0.18, 400, 'bandpass'); osc('sawtooth', 260, t, 0.4, 0.1, 0.12);
        osc('square', 90, t, 0.35, 0.1, 0.4); osc('sine', 60, t, 0.3, 0.2, 0.5);
      });
    },
    cp: function () { play(function (t) { [660, 880, 1320].forEach(function (f, i) { osc('triangle', f, t + i * 0.07, 0.2, 0.08, 1, null, true); }); }); },
    win: function () {
      play(function (t) {
        [523, 659, 784, 1047, 1319].forEach(function (f, i) { osc('square', f, t + i * 0.09, 0.3, 0.06, 1, null, true); osc('triangle', f / 2, t + i * 0.09, 0.3, 0.07); });
      });
    },
    ui: function () { play(function (t) { osc('square', 700, t, 0.05, 0.04, 1.4); }); }
  };

  // ---- music ----
  function kick(t) { osc('sine', 150, t, 0.16, 0.5, 0.2, musicBus); }
  function hat(t, open) { noise(t, open ? 0.12 : 0.04, open ? 0.05 : 0.035, 7000, 'highpass', musicBus); }
  function snare(t) { noise(t, 0.14, 0.09, 1800, 'bandpass', musicBus); osc('triangle', 190, t, 0.08, 0.1, 0.6, musicBus); }
  function schedule(t, n) {
    var bar = (n >> 4) & 3, s = n & 15, ch = PROG[bar], k = key, i;
    var energy = Math.min(1, 0.4 + Math.floor(n / 64) * 0.2);
    if (s % 4 === 0) kick(t);
    if (s === 4 || s === 12) snare(t);
    if (s % 2 === 0) hat(t + (s % 4 === 2 ? 0 : 0), s % 4 === 2 && energy > 0.5);
    // offbeat bass pulse
    if (s % 2 === 0) osc('sawtooth', mtof(BASS[bar] + k - 12), t, STEP_S * 1.8, 0.09, 0.98, musicBus);
    // arpeggio
    if (energy > 0.4 || s % 4 === 0) {
      i = [0, 1, 2, 1, 0, 2, 1, 2][s >> 1 & 7];
      if (s % 2 === 0) osc('square', mtof(ch[i % 3] + k + 12), t, STEP_S * 1.6, 0.03, 1, musicBus, true);
    }
    // pad on bar start
    if (s === 0) ch.forEach(function (c) { osc('triangle', mtof(c + k), t, STEP_S * 15, 0.03, 1, musicBus, true); });
    // lead hook in second half of each 4 bars
    if (n >= 128 && (s === 6 || s === 10 || s === 14) && (n >> 4) % 2 === 1) osc('square', mtof(ch[(s >> 2) % 3] + k + 24), t, STEP_S * 2, 0.035, 1, musicBus, true);
  }
  function tick() {
    if (!ac) return;
    while (nextT < ac.currentTime + 0.25) {
      if (!cfg.muted() && !cfg.musicOff() && cfg.active() && !(root.document && root.document.hidden)) schedule(nextT, step);
      nextT += STEP_S; step++;
    }
  }
  function music() {
    if (timer || !ctx()) return;
    nextT = ac.currentTime + 0.05; step = 0;
    timer = setInterval(tick, 80);
  }
  function setWorld(w) { key = [0, 2, 5, 7, 3, 9][((w | 0) % 6 + 6) % 6]; }
  function duck(v) { if (musicBus && ac) musicBus.gain.setTargetAtTime(v, ac.currentTime, 0.1); }

  root.GHAudio = { init: function (c) { cfg.muted = c.muted || cfg.muted; cfg.musicOff = c.musicOff || cfg.musicOff; cfg.active = c.active || cfg.active; }, ctx: ctx, sfx: SFX, music: music, setWorld: setWorld, duck: duck };
})(typeof window !== 'undefined' ? window : globalThis);
