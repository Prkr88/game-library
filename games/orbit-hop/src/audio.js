// Orbit Hop audio engine: master bus + generated reverb, combo-pitched SFX, lookahead-scheduled ambient music.
(function (root) {
  'use strict';
  var PENT = [0, 2, 4, 7, 9]; // major pentatonic semitones
  function hz(root0, semi) { return root0 * Math.pow(2, semi / 12); }
  function degree(n) { return PENT[((n % 5) + 5) % 5] + 12 * Math.floor(n / 5); }

  var A = { ctx: null, master: null, sfxBus: null, musBus: null, wet: null, vol: { music: 0.7, sfx: 0.8 },
            music: { on: false, timer: null, next: 0, step: 0, intensity: 0 }, noiseBuf: null };

  function ensure() {
    if (A.ctx) return A.ctx;
    var C = root.AudioContext || root.webkitAudioContext;
    if (!C) return null;
    var c = A.ctx = new C();
    A.master = c.createGain(); A.master.gain.value = 0.9;
    var comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    A.master.connect(comp); comp.connect(c.destination);
    A.sfxBus = c.createGain(); A.sfxBus.gain.value = A.vol.sfx;
    A.musBus = c.createGain(); A.musBus.gain.value = A.vol.music * 0.5;
    // generated reverb: decaying noise impulse
    var len = Math.floor(c.sampleRate * 1.8), ir = c.createBuffer(2, len, c.sampleRate);
    for (var ch = 0; ch < 2; ch++) { var d = ir.getChannelData(ch); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    var conv = c.createConvolver(); conv.buffer = ir;
    A.wet = c.createGain(); A.wet.gain.value = 0.35;
    conv.connect(A.wet); A.wet.connect(A.master);
    [A.sfxBus, A.musBus].forEach(function (b) { b.connect(A.master); b.connect(conv); });
    var nl = c.sampleRate * 0.6; A.noiseBuf = c.createBuffer(1, nl, c.sampleRate);
    var nd = A.noiseBuf.getChannelData(0); for (var k = 0; k < nl; k++) nd[k] = Math.random() * 2 - 1;
    return c;
  }

  function note(bus, t, f, dur, type, vol, opt) {
    var c = A.ctx, o = c.createOscillator(), g = c.createGain();
    opt = opt || {};
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (opt.slide) o.frequency.exponentialRampToValueAtTime(opt.slide, t + dur);
    if (opt.detune) o.detune.value = opt.detune;
    var atk = opt.atk || 0.006;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(bus, t, dur, vol, f0, f1) {
    var c = A.ctx, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = A.noiseBuf; fl.type = 'bandpass'; fl.Q.value = 1.2;
    fl.frequency.setValueAtTime(f0, t); fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(bus); s.start(t); s.stop(t + dur + 0.05);
  }
  function go(fn) { var c = ensure(); if (!c || A.muted || A.sfxOff) return; if (c.state === 'suspended') c.resume(); try { fn(c, c.currentTime); } catch (e) {} }

  var sfx = {
    jump: function () { go(function (c, t) { note(A.sfxBus, t, 280, 0.16, 'triangle', 0.16, { slide: 640 }); noise(A.sfxBus, t, 0.14, 0.05, 1800, 5000); }); },
    land: function (combo) {
      go(function (c, t) {
        var d = degree(Math.min(combo || 0, 9)), f = hz(392, d);
        note(A.sfxBus, t, f, 0.32, 'sine', 0.2);
        note(A.sfxBus, t, f * 2, 0.22, 'triangle', 0.08);
        if (combo >= 3) note(A.sfxBus, t + 0.05, f * 3, 0.25, 'sine', 0.06 + Math.min(combo, 8) * 0.01);
      });
    },
    star: function () { go(function (c, t) { note(A.sfxBus, t, 1318, 0.14, 'square', 0.05); note(A.sfxBus, t + 0.07, 1976, 0.28, 'square', 0.05); note(A.sfxBus, t + 0.07, 3951, 0.2, 'sine', 0.05); }); },
    shield: function () { go(function (c, t) { noise(A.sfxBus, t, 0.35, 0.18, 4000, 400); note(A.sfxBus, t, 880, 0.3, 'triangle', 0.14, { slide: 330 }); }); },
    die: function () { go(function (c, t) { note(A.sfxBus, t, 180, 0.7, 'sawtooth', 0.16, { slide: 35 }); note(A.sfxBus, t, 90, 0.7, 'sine', 0.3, { slide: 30 }); noise(A.sfxBus, t, 0.55, 0.28, 2400, 120); }); },
    ui: function () { go(function (c, t) { note(A.sfxBus, t, 660, 0.07, 'triangle', 0.1); }); }
  };

  // music: Am pentatonic arp over drifting pad; intensity (0..1) adds pulse + bass + faster tempo
  var PROG = [0, -4, -2, -7]; // root offsets in semitones per bar
  var ARP = [0, 2, 4, 2, 3, 1, 4, 2];
  function bar(t, b, inten, spb) {
    var c = A.ctx, root0 = hz(220, PROG[b % 4]);
    note(A.musBus, t, root0 / 2, spb * 4, 'sine', 0.22, { atk: 0.6 });
    note(A.musBus, t, root0 * 1.5, spb * 4, 'triangle', 0.07, { atk: 0.9, detune: 6 });
    note(A.musBus, t, root0 * 2, spb * 4, 'triangle', 0.05, { atk: 0.9, detune: -6 });
    for (var i = 0; i < 8; i++) {
      var tt = t + i * spb / 2, d = ARP[(i + b) % 8];
      if (i % 2 === 0 || inten > 0.3) note(A.musBus, tt, hz(root0 * 2, degree(d)), spb * 0.9, 'sine', i % 2 ? 0.05 : 0.09);
    }
    if (inten > 0.15) for (var j = 0; j < 4; j++) note(A.musBus, t + j * spb, root0 / 2, spb * 0.5, 'triangle', 0.12 * inten + 0.05, { slide: root0 / 2.2 });
    if (inten > 0.5) for (var h = 0; h < 8; h++) noise(A.musBus, t + h * spb / 2, 0.05, 0.03 + inten * 0.03, 6000, 9000);
  }
  function schedule() {
    var m = A.music, c = A.ctx;
    if (!c || !m.on || A.muted || A.musicOff) return;
    var spb = 0.62 - 0.17 * m.intensity;
    if (m.next < c.currentTime) m.next = c.currentTime + 0.05;
    while (m.next < c.currentTime + 1.2) { bar(m.next, m.step++, m.intensity, spb); m.next += spb * 4; }
  }

  A.sfx = sfx;
  A.setMuted = function (m) { A.muted = !!m; if (m) A.stopMusic(); };
  A.setVolumes = function (v) { if (v.music != null) A.vol.music = v.music; if (v.sfx != null) A.vol.sfx = v.sfx; if (A.ctx) { A.musBus.gain.value = A.vol.music * 0.5; A.sfxBus.gain.value = A.vol.sfx; } };
  A.setChannels = function (ch) { A.sfxOff = !!ch.sfxOff; A.musicOff = !!ch.musicOff; if (A.musicOff) A.stopMusic(); };
  A.setIntensity = function (x) { A.music.intensity = Math.max(0, Math.min(1, x)); };
  A.startMusic = function () {
    if (A.muted || A.musicOff) return; var c = ensure(); if (!c) return; if (c.state === 'suspended') c.resume();
    A.music.on = true; if (!A.music.timer) { schedule(); A.music.timer = setInterval(schedule, 300); }
  };
  A.stopMusic = function () { A.music.on = false; clearInterval(A.music.timer); A.music.timer = null; A.music.next = 0; };
  A.suspend = function () { if (A.ctx) A.ctx.suspend(); };
  A.resume = function () { if (A.ctx && !A.muted) A.ctx.resume(); };
  root.OrbitAudio = A;
})(typeof window !== 'undefined' ? window : globalThis);
