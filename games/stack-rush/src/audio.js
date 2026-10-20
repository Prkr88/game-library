// Stack Rush audio engine: master bus (compressor + reverb), designed SFX, scheduled adaptive music.
var StackAudio = (function () {
  var ac = null, master, sfxBus, musicBus, verb, muted = false;
  var PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
  var CHORDS = [[0, 4, 7], [-3, 0, 4], [-7, -3, 0], [-5, -1, 2]]; // C Am F G (semitones from C)
  function hz(semi, base) { return (base || 261.63) * Math.pow(2, semi / 12); }

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return ac; }
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      var comp = ac.createDynamicsCompressor();
      comp.threshold.value = -16; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
      master = ac.createGain(); master.gain.value = muted ? 0 : 0.9;
      sfxBus = ac.createGain(); sfxBus.gain.value = 1;
      musicBus = ac.createGain(); musicBus.gain.value = 0.7;
      verb = ac.createConvolver(); verb.buffer = impulse(1.4, 2.6);
      var wet = ac.createGain(); wet.gain.value = 0.22;
      sfxBus.connect(comp); musicBus.connect(comp);
      sfxBus.connect(verb); musicBus.connect(verb); verb.connect(wet); wet.connect(comp);
      comp.connect(master); master.connect(ac.destination);
    } catch (e) { ac = null; }
    return ac;
  }
  function impulse(sec, decay) {
    var n = Math.floor(ac.sampleRate * sec), b = ac.createBuffer(2, n, ac.sampleRate);
    for (var c = 0; c < 2; c++) { var d = b.getChannelData(c); for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay); }
    return b;
  }
  function note(bus, f, t, dur, type, vol, opts) {
    opts = opts || {};
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (opts.slide) o.frequency.exponentialRampToValueAtTime(opts.slide, t + dur);
    if (opts.detune) o.detune.value = opts.detune;
    var a = opts.attack || 0.008;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    var out = g;
    if (opts.lp) { var lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = opts.lp; g.connect(lp); out = lp; }
    o.connect(g); out.connect(bus); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(bus, t, dur, vol, freq) {
    var n = Math.floor(ac.sampleRate * dur), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    var s = ac.createBufferSource(); s.buffer = b;
    var f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.8;
    var g = ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(bus); s.start(t);
  }
  function ready() { return !muted && init(); }

  var sfx = {
    // Combo climbs the pentatonic scale; bell-like with octave sparkle.
    perfect: function (combo) {
      if (!ready()) return; var t = ac.currentTime, f = hz(PENTA[Math.min(combo, PENTA.length - 1)]);
      note(sfxBus, f, t, 0.45, 'triangle', 0.22);
      note(sfxBus, f * 2, t, 0.3, 'sine', 0.1);
      note(sfxBus, f * 3.01, t + 0.02, 0.18, 'sine', 0.05);
      if (combo >= 3) note(sfxBus, f * 1.5, t + 0.07, 0.3, 'triangle', 0.1);
    },
    good: function () {
      if (!ready()) return; var t = ac.currentTime;
      note(sfxBus, 190, t, 0.12, 'sine', 0.22, { slide: 90 });
      noise(sfxBus, t, 0.07, 0.08, 1800);
    },
    miss: function () {
      if (!ready()) return; var t = ac.currentTime;
      note(sfxBus, 220, t, 0.7, 'sawtooth', 0.16, { slide: 48, lp: 900 });
      note(sfxBus, 70, t, 0.5, 'sine', 0.3, { slide: 35 });
      noise(sfxBus, t, 0.35, 0.18, 600);
    },
    ach: function () {
      if (!ready()) return; var t = ac.currentTime;
      [0, 4, 7, 12].forEach(function (s, i) { note(sfxBus, hz(s, 523.25), t + i * 0.07, 0.35, 'triangle', 0.14); });
    },
    coin: function () {
      if (!ready()) return; var t = ac.currentTime;
      note(sfxBus, 988, t, 0.1, 'square', 0.07, { lp: 3000 }); note(sfxBus, 1319, t + 0.07, 0.3, 'square', 0.07, { lp: 3000 });
    },
    ui: function () {
      if (!ready()) return; note(sfxBus, 660, ac.currentTime, 0.12, 'triangle', 0.12);
    }
  };

  // Music: 4-bar chord loop (pad + bass + arp), scheduled ahead on the audio clock. Intensity raises tempo and adds layers.
  var nextT = 0, step = 0;
  function music(active, score) {
    if (!active || muted || !ac) { nextT = 0; return; }
    var now = ac.currentTime;
    if (!nextT || nextT < now - 0.5) { nextT = now + 0.05; step = 0; }
    var inten = Math.min(1, score / 40), stepDur = 0.24 - 0.07 * inten;
    while (nextT < now + 0.3) {
      var bar = Math.floor(step / 8) % 4, chord = CHORDS[bar], s = step % 8, t = nextT;
      if (s === 0) chord.forEach(function (c, i) { note(musicBus, hz(c, 130.81), t, stepDur * 8, 'sine', 0.05, { attack: 0.25, detune: i * 4 }); });
      if (s % 4 === 0) note(musicBus, hz(chord[0], 65.41), t, stepDur * 3.5, 'triangle', 0.13);
      var arp = chord[(s * 2 + (s >> 2)) % 3] + (s % 2 ? 12 : 0);
      note(musicBus, hz(arp, 261.63), t, stepDur * 1.6, 'triangle', 0.045 + 0.03 * inten, { lp: 2400 });
      if (inten > 0.35 && s % 2 === 1) noise(musicBus, t, 0.04, 0.03 * inten, 7000);
      if (inten > 0.6 && s === 4) note(musicBus, hz(chord[2], 523.25), t, stepDur * 3, 'sine', 0.04);
      nextT += stepDur; step++;
    }
  }
  function setMuted(m) { muted = !!m; if (master) master.gain.value = muted ? 0 : 0.9; if (muted) nextT = 0; }
  return { init: init, sfx: sfx, music: music, setMuted: setMuted };
})();
if (typeof module !== 'undefined') module.exports = StackAudio;
