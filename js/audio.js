/* Woodcraft Atelier — synthesized workshop sounds (Web Audio, no files).
   Silent until the first user interaction; mute is remembered. */
(function () {
  'use strict';
  var WC = window.WC = window.WC || {};
  var ctx = null, master = null, noiseBuf = null, armed = false;
  var muted = false;
  try { muted = localStorage.getItem('wc-muted') === '1'; } catch (e) {}

  function ensure() {
    if (!armed) return null;
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { return null; }
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.75;
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    master.connect(comp); comp.connect(ctx.destination);
    var len = Math.floor(ctx.sampleRate * 2);
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    var ch = noiseBuf.getChannelData(0);
    for (var i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
    return ctx;
  }
  function arm() { if (armed) return; armed = true; ensure(); }
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { window.addEventListener(ev, arm, { capture: true, passive: true }); });

  function ok() { return !muted && ensure(); }
  function env(param, t0, a, peak, dec) {
    param.cancelScheduledValues(t0);
    param.setValueAtTime(0.0001, t0);
    param.linearRampToValueAtTime(peak, t0 + a);
    param.exponentialRampToValueAtTime(0.0001, t0 + a + dec);
  }
  function osc(type, f, t0, dur, peak, a, dest, fEnd) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0);
    if (fEnd) o.frequency.exponentialRampToValueAtTime(fEnd, t0 + dur);
    env(g.gain, t0, a || 0.002, peak, dur);
    o.connect(g); g.connect(dest || master);
    o.start(t0); o.stop(t0 + dur + 0.05);
    return o;
  }
  function noiseSrc(t0, dur) {
    var s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    s.start(t0, Math.random() * 1.5); s.stop(t0 + dur + 0.05);
    return s;
  }
  function filt(type, f, q) { var b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q != null) b.Q.value = q; return b; }
  function noiseHit(t0, type, f, q, peak, dur, a) {
    var s = noiseSrc(t0, dur + 0.02), b = filt(type, f, q), g = ctx.createGain();
    env(g.gain, t0, a || 0.001, peak, dur);
    s.connect(b); b.connect(g); g.connect(master);
    return { src: s, filter: b, gain: g };
  }

  var S = {};
  /* Knock on wood: denser species ring higher and shorter */
  S.knock = function (density, vol) {
    if (!ok()) return;
    var t = ctx.currentTime, dn = density || 600, v = vol == null ? 1 : vol;
    var f = 110 + dn * 0.36 + (Math.random() - 0.5) * 12;
    osc('sine', f * 1.3, t, 0.11 + 300 / dn * 0.05, 0.55 * v, 0.001, null, f);
    osc('triangle', f * 2.76, t, 0.05, 0.18 * v);
    osc('sine', f * 5.4, t, 0.025, 0.06 * v);
    noiseHit(t, 'bandpass', f * 3.2, 1.6, 0.35 * v, 0.03);
  };
  S.tap = function (density) { S.knock((density || 600) + 220, 0.55); };

  /* Drawer slide: stick-slip friction then a soft thunk */
  S.drawer = function (open) {
    if (!ok()) return;
    var t = ctx.currentTime, dur = 0.42;
    var n = noiseHit(t, 'bandpass', open ? 520 : 380, 0.9, 0.5, dur, 0.06);
    n.filter.frequency.setValueAtTime(open ? 620 : 420, t);
    n.filter.frequency.linearRampToValueAtTime(open ? 260 : 300, t + dur);
    var lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.type = 'square'; lfo.frequency.value = 24 + Math.random() * 10; lg.gain.value = 0.18;
    lfo.connect(lg); lg.connect(n.gain.gain); lfo.start(t); lfo.stop(t + dur + 0.05);
    var t2 = t + dur - 0.03;
    osc('sine', 150, t2, 0.12, 0.45, 0.002, null, 90);
    noiseHit(t2, 'lowpass', 900, 0.7, 0.25, 0.05);
  };

  /* Hinge creak: jittery sawtooth through narrow formants */
  S.creak = function () {
    if (!ok()) return;
    var t = ctx.currentTime, dur = 0.8;
    var o = ctx.createOscillator(); o.type = 'sawtooth';
    var f = 170;
    o.frequency.setValueAtTime(f, t);
    for (var k = 1; k < 18; k++) { f = Math.max(110, Math.min(360, f + (Math.random() - 0.4) * 60)); o.frequency.linearRampToValueAtTime(f, t + k * dur / 18); }
    var b1 = filt('bandpass', 1100, 7), b2 = filt('bandpass', 2300, 9), g = ctx.createGain();
    env(g.gain, t, 0.08, 0.32, dur);
    var am = ctx.createOscillator(), ag = ctx.createGain();
    am.type = 'square'; am.frequency.value = 38; ag.gain.value = 0.12;
    am.connect(ag); ag.connect(g.gain);
    o.connect(b1); o.connect(b2); b1.connect(g); b2.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.1); am.start(t); am.stop(t + dur + 0.1);
  };

  /* Hand saw: rasping strokes */
  S.saw = function (strokes) {
    if (!ok()) return;
    var t = ctx.currentTime, n = strokes || 3;
    for (var k = 0; k < n; k++) {
      var t0 = t + k * 0.3, push = k % 2 === 0;
      var h = noiseHit(t0, 'bandpass', push ? 2600 : 2000, 1.4, push ? 0.55 : 0.3, 0.26, 0.09);
      h.filter.frequency.linearRampToValueAtTime(push ? 3600 : 2400, t0 + 0.26);
      var am = ctx.createOscillator(), ag = ctx.createGain();
      am.frequency.value = push ? 95 : 70; ag.gain.value = 0.25;
      am.connect(ag); ag.connect(h.gain.gain); am.start(t0); am.stop(t0 + 0.32);
    }
  };

  /* Sanding: continuous hiss with start/stop */
  S.sandStart = function () {
    if (!ok() || S._sand) return;
    var t = ctx.currentTime;
    var s = noiseSrc(t, 60), hp = filt('highpass', 2400, 0.5), lp = filt('lowpass', 7500, 0.5), g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.16, t + 0.08);
    var lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.frequency.value = 5; lg.gain.value = 0.07; lfo.connect(lg); lg.connect(g.gain); lfo.start(t);
    s.connect(hp); hp.connect(lp); lp.connect(g); g.connect(master);
    S._sand = { s: s, g: g, lfo: lfo };
  };
  S.sandStop = function () {
    if (!S._sand || !ctx) return;
    var t = ctx.currentTime, z = S._sand; S._sand = null;
    z.g.gain.cancelScheduledValues(t); z.g.gain.setValueAtTime(z.g.gain.value, t);
    z.g.gain.linearRampToValueAtTime(0.0001, t + 0.12);
    try { z.s.stop(t + 0.15); z.lfo.stop(t + 0.15); } catch (e) {}
  };
  S.sand = function (dur) { if (!ok()) return; var t = ctx.currentTime; var h = noiseHit(t, 'highpass', 2600, 0.6, 0.18, dur || 0.6, 0.1); };

  /* Hammer: low thump, click and a tiny metallic ring */
  S.hammer = function () {
    if (!ok()) return;
    var t = ctx.currentTime;
    osc('sine', 120, t, 0.25, 0.8, 0.001, null, 48);
    noiseHit(t, 'lowpass', 1800, 0.8, 0.55, 0.06);
    osc('sine', 2150, t, 0.16, 0.05);
    osc('sine', 3320, t, 0.1, 0.03);
  };
  /* Chisel: mallet tap + bright bite */
  S.chisel = function () {
    if (!ok()) return;
    var t = ctx.currentTime;
    osc('sine', 230 + Math.random() * 40, t, 0.08, 0.4, 0.001, null, 140);
    noiseHit(t + 0.004, 'highpass', 2200, 0.7, 0.35, 0.05);
    osc('triangle', 1250 + Math.random() * 300, t + 0.004, 0.04, 0.08);
  };
  /* Hand plane: a long "shhhk" */
  S.plane = function () {
    if (!ok()) return;
    var t = ctx.currentTime, dur = 0.85;
    var h = noiseHit(t, 'bandpass', 900, 0.8, 0.45, dur, 0.25);
    h.filter.frequency.linearRampToValueAtTime(2400, t + dur);
    osc('sine', 90, t + dur - 0.05, 0.12, 0.2);
  };
  /* Marimba bar: fundamental + 4x and ~10x partials */
  S.marimba = function (freq, vel) {
    if (!ok()) return;
    var t = ctx.currentTime, v = vel == null ? 0.8 : vel;
    var dec = Math.max(0.35, Math.min(1.8, 300 / freq));
    osc('sine', freq, t, dec, 0.5 * v, 0.003);
    osc('sine', freq * 3.93, t, dec * 0.22, 0.12 * v, 0.002);
    osc('sine', freq * 9.9, t, 0.05, 0.035 * v, 0.001);
    noiseHit(t, 'lowpass', 1400, 0.7, 0.12 * v, 0.02);
  };
  S.pop = function () { if (!ok()) return; var t = ctx.currentTime; osc('sine', 660, t, 0.08, 0.25, 0.002, null, 880); };
  S.win = function () {
    if (!ok()) return;
    [523.25, 659.25, 783.99, 1046.5].forEach(function (f, k) { setTimeout(function () { S.marimba(f, 0.7); }, k * 110); });
  };

  WC.sound = S;
  WC.audio = {
    isMuted: function () { return muted; },
    setMuted: function (m) {
      muted = !!m;
      try { localStorage.setItem('wc-muted', muted ? '1' : '0'); } catch (e) {}
      if (master && ctx) master.gain.setTargetAtTime(muted ? 0 : 0.75, ctx.currentTime, 0.02);
      if (muted) S.sandStop();
    }
  };
})();
