/* Woodcraft Atelier — finish & stain previewer: rub a finish onto a live plank */
(function () {
  'use strict';
  var WC = window.WC, $ = WC.$;
  var cv = $('#fiCanvas'), g = cv.getContext('2d'), W = cv.width, H = cv.height;
  var spSel = $('#fiSpecies'), stSel = $('#fiStain'), fnSel = $('#fiFinish'), coats = $('#fiCoats'), sheen = $('#fiSheen'), info = $('#fiInfo'), split = $('#fiSplit');
  var raw = document.createElement('canvas'); raw.width = W; raw.height = H;
  var fin = document.createElement('canvas'); fin.width = W; fin.height = H;
  var mask = document.createElement('canvas'); mask.width = W; mask.height = H;
  var tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H;
  var rg = raw.getContext('2d'), fg = fin.getContext('2d'), mg = mask.getContext('2d'), tg = tmp.getContext('2d');
  var sheenAuto = true, ready = false, raf = 0, token = 0;
  var TANNIN = { oak: 1, walnut: .8, cherry: .6, mahogany: .6, sheesham: .55, teak: .4, ebony: .5, maple: .15, pine: .15, bamboo: .2, hinoki: .15 };

  WC.speciesOptions(spSel, 'oak');
  WC.STAINS.forEach(function (s) { var o = document.createElement('option'); o.value = s.id; o.textContent = s.name; stSel.appendChild(o); });
  WC.FINISHES.forEach(function (f) { var o = document.createElement('option'); o.value = f.id; o.textContent = f.name; fnSel.appendChild(o); });
  fnSel.value = 'danish';
  function F() { for (var i = 0; i < WC.FINISHES.length; i++) if (WC.FINISHES[i].id === fnSel.value) return WC.FINISHES[i]; return WC.FINISHES[0]; }
  function S() { for (var i = 0; i < WC.STAINS.length; i++) if (WC.STAINS[i].id === stSel.value) return WC.STAINS[i]; return WC.STAINS[0]; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function loadWood() {
    var my = ++token; ready = false;
    WC.wood.url(spSel.value, 900, 300, { seed: 5 }).then(function (u) {
      var im = new Image();
      im.onload = function () {
        if (my !== token) return;
        rg.drawImage(im, 0, 0, W, H);
        // board edges: chamfer shading + a pencil mark
        var e = rg.createLinearGradient(0, 0, 0, H);
        e.addColorStop(0, 'rgba(255,240,210,.25)'); e.addColorStop(.04, 'rgba(0,0,0,0)'); e.addColorStop(.95, 'rgba(0,0,0,0)'); e.addColorStop(1, 'rgba(0,0,0,.35)');
        rg.fillStyle = e; rg.fillRect(0, 0, W, H);
        ready = true; bake();
      };
      im.src = u;
    });
  }
  function bake() {
    if (!ready) return;
    var f = F(), st = S(), n = +coats.value, sp = spSel.value;
    var src = rg.getImageData(0, 0, W, H), d = src.data;
    var str = f.str * (0.55 + n * 0.22), tint = f.tint, pop = 1 + (f.pop - 1) * (0.7 + n * 0.15);
    if (f.id === 'ebon') str *= (TANNIN[sp] || .3) * 1.05 + .05;
    var sc = st.c, i, r, gg, b, lum, k;
    for (i = 0; i < d.length; i += 4) {
      r = d[i] / 255; gg = d[i + 1] / 255; b = d[i + 2] / 255;
      lum = (r + gg + b) / 3;
      if (sc) {
        k = Math.min(1, 0.5 + (1 - lum) * 0.7);
        r *= 1 - k * 0.85 * (1 - sc[0] / 255 * 1.15); gg *= 1 - k * 0.85 * (1 - sc[1] / 255 * 1.15); b *= 1 - k * 0.85 * (1 - sc[2] / 255 * 1.15);
      }
      if (f.opaque) {
        var a = Math.min(.95, str), gr = (lum - .5) * .22;
        r = r * (1 - a) + (tint[0] / 255 + gr) * a; gg = gg * (1 - a) + (tint[1] / 255 + gr) * a; b = b * (1 - a) + (tint[2] / 255 + gr) * a;
      } else {
        var ex = 1 + (pop - 1) * 1.6;
        r = Math.pow(Math.max(0, r), ex); gg = Math.pow(Math.max(0, gg), ex); b = Math.pow(Math.max(0, b), ex);
        var a2 = Math.min(1, str);
        r *= 1 - a2 * (1 - tint[0] / 255); gg *= 1 - a2 * (1 - tint[1] / 255); b *= 1 - a2 * (1 - tint[2] / 255);
        var m = (r + gg + b) / 3, sat = 1 + (pop - 1) * 1.2;
        r = m + (r - m) * sat; gg = m + (gg - m) * sat; b = m + (b - m) * sat;
      }
      d[i] = r * 255; d[i + 1] = gg * 255; d[i + 2] = b * 255;
    }
    fg.putImageData(src, 0, 0);
    var gl = sheenAuto ? f.gloss : +sheen.value / 100;
    gl = Math.min(1, gl * (0.75 + n * 0.1));
    if (gl > 0.02) {
      var gr2 = fg.createLinearGradient(0, 0, W, H * 0.6);
      gr2.addColorStop(0, 'rgba(255,255,255,0)'); gr2.addColorStop(.38, 'rgba(255,255,255,0)');
      gr2.addColorStop(.47, 'rgba(255,252,240,' + (gl * .42).toFixed(3) + ')'); gr2.addColorStop(.52, 'rgba(255,252,240,' + (gl * .12).toFixed(3) + ')');
      gr2.addColorStop(.6, 'rgba(255,255,255,0)'); gr2.addColorStop(1, 'rgba(255,255,255,0)');
      fg.fillStyle = gr2; fg.fillRect(0, 0, W, H);
      var top = fg.createLinearGradient(0, 0, 0, H);
      top.addColorStop(0, 'rgba(255,250,235,' + (gl * .16).toFixed(3) + ')'); top.addColorStop(.3, 'rgba(255,250,235,0)');
      fg.fillStyle = top; fg.fillRect(0, 0, W, H);
    }
    if (f.id === 'milk') { // worn edges show bare wood
      fg.save(); fg.globalCompositeOperation = 'destination-out';
      for (var q = 0; q < 140; q++) { var x = Math.random() * W, y = Math.random() < .5 ? Math.random() * 10 : H - Math.random() * 10; fg.globalAlpha = .5; fg.beginPath(); fg.ellipse(x, y, 6 + Math.random() * 30, 2 + Math.random() * 4, 0, 0, 6.3); fg.fill(); }
      fg.restore();
    }
    sheen.value = Math.round(gl * 100); $('#fiSheenV').textContent = sheenAuto ? 'auto (' + Math.round(gl * 100) + ')' : sheen.value;
    $('#fiCoatsV').textContent = coats.value;
    paint(); describe();
  }
  function paint() {
    if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = 0;
      g.clearRect(0, 0, W, H);
      g.drawImage(raw, 0, 0);
      tg.clearRect(0, 0, W, H);
      tg.globalCompositeOperation = 'source-over';
      tg.drawImage(fin, 0, 0);
      tg.globalCompositeOperation = 'destination-in';
      tg.drawImage(mask, 0, 0);
      tg.globalCompositeOperation = 'source-over';
      g.drawImage(tmp, 0, 0);
      if (WC.switchVal(split)) {
        g.strokeStyle = 'rgba(40,40,46,.8)'; g.setLineDash([6, 6]); g.lineWidth = 2;
        g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, H); g.stroke(); g.setLineDash([]);
        g.font = '22px "Segoe Print", "Bradley Hand", cursive'; g.fillStyle = 'rgba(30,30,36,.85)';
        g.fillText('before', 20, 34); g.fillText('after', W - 90, 34);
      }
    });
  }
  function describe() {
    var f = F(), st = S(), sp = WC.speciesById(spSel.value);
    var dur = ['', '★☆☆☆', '★★☆☆', '★★★☆', '★★★★'][f.dur] || 'none';
    var extra = '';
    if (f.id === 'ebon') extra = (TANNIN[sp.id] || .3) > .5 ? '<p><b>' + esc(sp.name) + '</b> is tannin-rich: expect a deep, even black.</p>' : '<p><b>' + esc(sp.name) + '</b> has little tannin, so it barely darkens. Pre-treat with strong black tea for more drama.</p>';
    if (st.c && (sp.id === 'pine' || sp.id === 'cherry' || sp.id === 'maple')) extra += '<p>⚠ ' + esc(sp.name) + ' can blotch with pigment stain — use a wash coat or gel stain.</p>';
    info.innerHTML = '<h4 class="pen">' + esc(f.name) + (st.c ? ' over ' + esc(st.name) : '') + '</h4>' +
      '<dl class="spec compact"><dt>Dry time</dt><dd>' + esc(f.dry) + '</dd><dt>Durability</dt><dd>' + dur + '</dd><dt>Food-safe</dt><dd>' + esc(f.food) + '</dd><dt>Coverage</dt><dd id="fiCov">' + coverage() + '%</dd></dl><p>' + esc(f.note) + '</p>' + extra;
  }
  function coverage() {
    var s = mg.getImageData(0, 0, W, H).data, c = 0, n = 0;
    for (var i = 3; i < s.length; i += 4 * 37) { n++; if (s[i] > 128) c++; }
    return Math.round(c / n * 100);
  }
  function updCov() { var c = $('#fiCov'); if (c) c.textContent = coverage() + '%'; }

  // rag strokes
  var down = false, last = null;
  function pos(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H, cx: e.clientX, cy: e.clientY }; }
  function dab(p) {
    var R = 46, gr = mg.createRadialGradient(p.x, p.y, 0, p.x, p.y, R);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.6, 'rgba(255,255,255,.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    mg.fillStyle = gr; mg.beginPath(); mg.arc(p.x, p.y, R, 0, 6.3); mg.fill();
  }
  cv.addEventListener('pointerdown', function (e) {
    down = true; last = pos(e); try { cv.setPointerCapture(e.pointerId); } catch (x) {}
    dab(last); paint(); WC.sound.sandStart(); e.preventDefault();
  });
  cv.addEventListener('pointermove', function (e) {
    if (!down) return;
    var p = pos(e), dx = p.x - last.x, dy = p.y - last.y, dist = Math.sqrt(dx * dx + dy * dy), steps = Math.max(1, Math.ceil(dist / 12));
    for (var s = 1; s <= steps; s++) dab({ x: last.x + dx * s / steps, y: last.y + dy * s / steps });
    last = p; paint();
    if (Math.random() < .3) WC.dust(p.cx, p.cy, 2, { color: WC.wood.avg(spSel.value) });
  });
  function up() { if (!down) return; down = false; WC.sound.sandStop(); updCov(); }
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); cv.addEventListener('lostpointercapture', up);
  // keyboard: Enter / Space wipes all
  cv.tabIndex = 0;
  cv.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); wipe(); } });

  function wipe() {
    WC.sound.sand(0.9);
    if (WC.reduced) { mg.fillStyle = '#fff'; mg.fillRect(0, 0, W, H); paint(); updCov(); return; }
    var t0 = performance.now();
    (function step(t) {
      var k = Math.min(1, (t - t0) / 900), x = k * (W + 80);
      mg.fillStyle = '#fff'; mg.fillRect(0, 0, x, H); paint();
      if (k < 1) requestAnimationFrame(step); else updCov();
    })(t0);
  }
  $('#fiWipe').addEventListener('click', function () { this.dataset.quiet = '1'; if (WC.switchVal(split)) { mg.clearRect(0, 0, W, H); mg.fillStyle = '#fff'; mg.fillRect(W / 2, 0, W / 2, H); paint(); updCov(); WC.sound.sand(.6); } else wipe(); });
  $('#fiStrip').addEventListener('click', function () {
    this.dataset.quiet = '1';
    mg.clearRect(0, 0, W, H); paint(); updCov(); WC.sound.sand(1);
    var r = cv.getBoundingClientRect(); for (var i = 0; i < 5; i++) WC.dust(r.left + Math.random() * r.width, r.top + r.height * .7, 8);
    WC.toast('Sanded back to bare wood. 120… 150… 180… done. Your arm is now stronger.');
  });
  split.addEventListener('wc:toggle', function () {
    mg.clearRect(0, 0, W, H);
    if (WC.switchVal(split)) { mg.fillStyle = '#fff'; mg.fillRect(W / 2, 0, W / 2, H); }
    paint(); updCov();
  });
  spSel.addEventListener('change', function () { WC.sound.knock(WC.speciesById(spSel.value).density); loadWood(); });
  stSel.addEventListener('change', bake);
  fnSel.addEventListener('change', function () { sheenAuto = true; bake(); });
  coats.addEventListener('input', bake);
  sheen.addEventListener('input', function () { sheenAuto = false; bake(); });

  var started = false;
  function start() { if (started) return; started = true; mg.fillStyle = '#fff'; mg.fillRect(0, 0, W * .45, H); loadWood(); }
  document.addEventListener('wc:view', function (e) { if (e.detail === 'finish') start(); });
  if (WC.state.view === 'finish') start();
})();
