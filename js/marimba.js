/* Woodcraft Atelier — playable rosewood marimba (synthesized) */
(function () {
  'use strict';
  var WC = window.WC, $ = WC.$;
  var wrap = $('#marimba');
  var NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  var LOWN = ['z', 'x', 'c', 'v', 'b', 'n', 'm'], LOWS = { 1: 's', 3: 'd', 6: 'g', 8: 'h', 10: 'j' };
  var UPN = ['q', 'w', 'e', 'r', 't', 'y', 'u'], UPS = { 1: '2', 3: '3', 6: '5', 8: '6', 10: '7' };
  var NAT = [0, 2, 4, 5, 7, 9, 11];
  var keys = [], keyMap = {}, demoT = [];
  function freq(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }

  var front = document.createElement('div'), back = document.createElement('div');
  front.className = 'mb-row naturals'; back.className = 'mb-row sharps';
  var total = 25, idx = 0;
  for (var oct = 0; oct < 3; oct++) {
    for (var s = 0; s < 12; s++) {
      var midi = 60 + oct * 12 + s;
      if (midi > 84) break;
      var nat = NAT.indexOf(s) >= 0, kb = null;
      if (oct === 0) kb = nat ? LOWN[NAT.indexOf(s)] : LOWS[s];
      else if (oct === 1) kb = nat ? UPN[NAT.indexOf(s)] : UPS[s];
      else kb = 'i';
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'mb-key'; b.dataset.quiet = '1'; b.dataset.midi = midi;
      var len = 100 - (midi - 60) * 1.9;
      b.style.setProperty('--len', len.toFixed(1) + '%');
      b.style.setProperty('--tube', (len * 0.72).toFixed(1) + '%');
      b.style.backgroundPosition = (idx * 53) + 'px ' + (idx * 29) + 'px';
      b.setAttribute('aria-label', NAMES[s] + (4 + oct) + (kb ? ' (key ' + kb.toUpperCase() + ')' : ''));
      b.innerHTML = '<span class="mb-bar"><i class="cord"></i><span class="mb-note carved">' + NAMES[s] + '<sub>' + (4 + oct) + '</sub></span>' + (kb ? '<kbd>' + kb.toUpperCase() + '</kbd>' : '') + '</span><span class="mb-tube" aria-hidden="true"></span>';
      (nat ? front : back).appendChild(b);
      if (!nat) { b.style.setProperty('--slot', NAT.indexOf(s - 1) + oct * 7); }
      keys.push(b); if (kb) keyMap[kb] = b; idx++;
    }
  }
  wrap.appendChild(back); wrap.appendChild(front);
  // position sharps between naturals
  var natCount = front.children.length;
  wrap.style.setProperty('--nat', natCount);
  Array.prototype.forEach.call(back.children, function (b) { b.style.left = 'calc(' + ((+b.style.getPropertyValue('--slot') + 1) / natCount * 100) + '% - (100% / ' + natCount + ') * .42)'; });

  WC.wood.url('sheesham', 640, 320).then(function (u) { keys.forEach(function (k) { k.querySelector('.mb-bar').style.backgroundImage = 'url("' + u + '")'; }); });

  function hit(b, vel) {
    if (!b) return;
    var midi = +b.dataset.midi;
    WC.sound.marimba(freq(midi), vel == null ? 0.85 : vel);
    b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit');
    var r = b.getBoundingClientRect();
    if (!WC.reduced && Math.random() < .5) WC.dust(r.left + r.width / 2, r.top + 6, 3, { color: '#7a4a2a' });
  }
  keys.forEach(function (k) {
    k.addEventListener('pointerdown', function (e) { e.preventDefault(); hit(k); });
    k.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hit(k); } });
    k.addEventListener('pointerenter', function (e) { if (e.buttons === 1) hit(k, 0.6); });
  });
  var held = {};
  document.addEventListener('keydown', function (e) {
    if ($('#view-marimba').hidden || e.ctrlKey || e.metaKey || e.altKey) return;
    if (/input|textarea|select/i.test(e.target.tagName || '')) return;
    var k = (e.key || '').toLowerCase();
    if (keyMap[k] && !held[k]) { held[k] = 1; e.preventDefault(); hit(keyMap[k]); }
  });
  document.addEventListener('keyup', function (e) { delete held[(e.key || '').toLowerCase()]; });

  // Ode to Joy (public domain, Beethoven) — midi, beats
  var TUNE = [[64, 1], [64, 1], [65, 1], [67, 1], [67, 1], [65, 1], [64, 1], [62, 1], [60, 1], [60, 1], [62, 1], [64, 1], [64, 1.5], [62, .5], [62, 2],
    [64, 1], [64, 1], [65, 1], [67, 1], [67, 1], [65, 1], [64, 1], [62, 1], [60, 1], [60, 1], [62, 1], [64, 1], [62, 1.5], [60, .5], [60, 2], [72, 1], [76, .5], [79, .5], [84, 2]];
  function stop() { demoT.forEach(clearTimeout); demoT = []; }
  $('#mbDemo').addEventListener('click', function () {
    stop(); var t = 0, beat = 330;
    var byMidi = {}; keys.forEach(function (k) { byMidi[k.dataset.midi] = k; });
    TUNE.forEach(function (n) { demoT.push(setTimeout(function () { hit(byMidi[n[0]], .8); }, t)); t += n[1] * beat; });
    demoT.push(setTimeout(function () { WC.toast('Bravo! Beethoven never had sheesham bars this nice.'); }, t + 200));
  });
  $('#mbDemo').dataset.quiet = '1';
  $('#mbStop').addEventListener('click', stop);
  document.addEventListener('wc:view', function (e) { if (e.detail !== 'marimba') stop(); });
})();
