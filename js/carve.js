/* Woodcraft Atelier — "carve your name": V-groove engraving on a procedural plank, inlays, PNG download.
   Also wires the creaky About-cabinet door. */
(function () {
  'use strict';
  var WC = window.WC, $ = WC.$;
  var cv = $('#cvCanvas'), g = cv.getContext('2d'), W = cv.width, H = cv.height;
  var tx = $('#cvText'), spSel = $('#cvSpecies'), fontSel = $('#cvFont'), inlaySel = $('#cvInlay'), depth = $('#cvDepth'), depthV = $('#cvDepthV');
  function mk() { var c = document.createElement('canvas'); c.width = W; c.height = H; return c; }
  var base = mk(), done = mk(), maskC = mk(), work = mk(), inv = mk();
  var bg = base.getContext('2d'), dg = done.getContext('2d'), mg = maskC.getContext('2d'), wg = work.getContext('2d'), ig = inv.getContext('2d');
  var ready = false, token = 0, anim = 0, started = false, bounds = { x0: 0, x1: W, size: 100 }, ebonyPat = null;
  var FONTS = {
    serif: { f: '700 {s}px "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, "Times New Roman", serif', ls: 1 },
    script: { f: 'italic 700 {s}px "Segoe Script", "Brush Script MT", "Snell Roundhand", "URW Chancery L", "Apple Chancery", cursive', ls: 0 },
    block: { f: '900 {s}px Impact, "Haettenschweiler", "Arial Black", "Franklin Gothic Heavy", sans-serif', ls: 3 },
    mono: { f: '700 {s}px "Courier New", ui-monospace, Consolas, Menlo, monospace', ls: 6 }
  };

  /* ---------- persistence ---------- */
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem('wc-carve') || '{}') || {}; } catch (e) { saved = {}; }
  WC.speciesOptions(spSel, saved.sp && WC.wood.P[saved.sp] ? saved.sp : 'walnut');
  if (typeof saved.text === 'string') tx.value = saved.text.slice(0, 28);
  if (saved.font && FONTS[saved.font]) fontSel.value = saved.font;
  if (saved.inlay && /^(none|brass|ebony|turquoise|gold)$/.test(saved.inlay)) inlaySel.value = saved.inlay;
  if (saved.depth) depth.value = saved.depth;
  depthV.textContent = depth.value;
  function persist() {
    try { localStorage.setItem('wc-carve', JSON.stringify({ text: tx.value, sp: spSel.value, font: fontSel.value, inlay: inlaySel.value, depth: depth.value })); } catch (e) {}
  }

  /* ---------- plank ---------- */
  function screw(c, x, y, rot) {
    var r = 11, gr = c.createRadialGradient(x - 3, y - 4, 1, x, y, r);
    gr.addColorStop(0, '#fffbe6'); gr.addColorStop(.25, '#fbe7a8'); gr.addColorStop(.6, '#c9973a'); gr.addColorStop(1, '#5d3c0c');
    c.save();
    c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 3; c.shadowOffsetY = 2;
    c.fillStyle = gr; c.beginPath(); c.arc(x, y, r, 0, 6.2832); c.fill();
    c.restore();
    c.save(); c.translate(x, y); c.rotate(rot);
    c.fillStyle = 'rgba(58,34,4,.9)'; c.fillRect(-8, -1.4, 16, 2.8);
    c.fillStyle = 'rgba(255,240,200,.45)'; c.fillRect(-8, 1.4, 16, 1);
    c.restore();
  }
  function drawPlank(img) {
    bg.clearRect(0, 0, W, H);
    bg.drawImage(img, 0, 0, W, H);
    // chamfered edges
    var e = bg.createLinearGradient(0, 0, 0, H);
    e.addColorStop(0, 'rgba(255,240,210,.38)'); e.addColorStop(.03, 'rgba(255,240,210,.06)'); e.addColorStop(.06, 'rgba(0,0,0,0)');
    e.addColorStop(.93, 'rgba(0,0,0,0)'); e.addColorStop(.97, 'rgba(0,0,0,.22)'); e.addColorStop(1, 'rgba(0,0,0,.5)');
    bg.fillStyle = e; bg.fillRect(0, 0, W, H);
    var s = bg.createLinearGradient(0, 0, W, 0);
    s.addColorStop(0, 'rgba(0,0,0,.42)'); s.addColorStop(.02, 'rgba(0,0,0,.06)'); s.addColorStop(.04, 'rgba(0,0,0,0)');
    s.addColorStop(.96, 'rgba(0,0,0,0)'); s.addColorStop(.98, 'rgba(0,0,0,.06)'); s.addColorStop(1, 'rgba(0,0,0,.42)');
    bg.fillStyle = s; bg.fillRect(0, 0, W, H);
    // soft varnish sheen
    var v = bg.createLinearGradient(0, 0, W, H);
    v.addColorStop(0, 'rgba(255,252,240,0)'); v.addColorStop(.42, 'rgba(255,252,240,0)'); v.addColorStop(.5, 'rgba(255,252,240,.12)');
    v.addColorStop(.56, 'rgba(255,252,240,0)'); v.addColorStop(1, 'rgba(255,252,240,0)');
    bg.fillStyle = v; bg.fillRect(0, 0, W, H);
    // vignette
    var vg = bg.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, W * .62);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.28)');
    bg.fillStyle = vg; bg.fillRect(0, 0, W, H);
    screw(bg, 34, 34, .5); screw(bg, W - 34, 34, 1.9); screw(bg, 34, H - 34, 2.6); screw(bg, W - 34, H - 34, .2);
  }
  function pencilGuides(c, size) {
    c.save();
    c.strokeStyle = 'rgba(48,46,52,.32)'; c.lineWidth = 1.2; c.setLineDash([14, 7, 2, 7]);
    var y1 = H / 2 - size * .42, y2 = H / 2 + size * .36;
    [y1, y2].forEach(function (y) { c.beginPath(); c.moveTo(70, y + Math.random()); c.lineTo(W - 70, y - Math.random()); c.stroke(); });
    c.setLineDash([]);
    c.font = '20px "Segoe Print", "Bradley Hand", "Chalkboard SE", cursive';
    c.fillStyle = 'rgba(48,46,52,.5)';
    c.fillText('\u270e depth ' + depth.value + ' mm \u00b7 ' + WC.speciesById(spSel.value).name.split(' (')[0], 72, H - 26);
    c.restore();
  }

  /* ---------- text mask ---------- */
  function fontFor(size) { return FONTS[fontSel.value].f.replace('{s}', Math.round(size)); }
  function buildMask(text) {
    mg.clearRect(0, 0, W, H);
    var F = FONTS[fontSel.value], size = 200;
    mg.font = fontFor(size);
    if ('letterSpacing' in mg) mg.letterSpacing = F.ls + 'px';
    var w = mg.measureText(text).width || 1;
    size = Math.max(40, Math.min(200, size * (W - 170) / w));
    mg.font = fontFor(size);
    if ('letterSpacing' in mg) mg.letterSpacing = (F.ls * size / 100) + 'px';
    var mw = mg.measureText(text).width;
    mg.textAlign = 'center'; mg.textBaseline = 'middle'; mg.fillStyle = '#fff';
    mg.fillText(text, W / 2, H / 2 + size * .04);
    if (fontSel.value === 'mono') { // stencil bridges
      mg.globalCompositeOperation = 'destination-out';
      mg.fillRect(0, H / 2 + size * .04 - size * .035, W, size * .07);
      mg.globalCompositeOperation = 'source-over';
    }
    bounds = { x0: Math.max(0, W / 2 - mw / 2 - 20), x1: Math.min(W, W / 2 + mw / 2 + 20), size: size };
    // inverse mask (opaque everywhere except the letters) for inner shadows
    ig.globalCompositeOperation = 'source-over';
    ig.clearRect(0, 0, W, H); ig.fillStyle = '#000'; ig.fillRect(0, 0, W, H);
    ig.globalCompositeOperation = 'destination-out'; ig.drawImage(maskC, 0, 0);
    ig.globalCompositeOperation = 'source-over';
    return size;
  }
  function tinted(color, offX, offY) {
    wg.globalCompositeOperation = 'source-over';
    wg.clearRect(0, 0, W, H); wg.drawImage(maskC, offX || 0, offY || 0);
    wg.globalCompositeOperation = 'source-in'; wg.fillStyle = color; wg.fillRect(0, 0, W, H);
    wg.globalCompositeOperation = 'source-over';
    return work;
  }
  function innerShadow(target, color, dx, dy, blur) {
    wg.globalCompositeOperation = 'source-over';
    wg.clearRect(0, 0, W, H);
    wg.save(); wg.shadowColor = color; wg.shadowBlur = blur; wg.shadowOffsetX = dx; wg.shadowOffsetY = dy;
    wg.drawImage(inv, 0, 0); wg.restore();
    wg.globalCompositeOperation = 'destination-in'; wg.drawImage(maskC, 0, 0);
    wg.globalCompositeOperation = 'source-over';
    target.drawImage(work, 0, 0);
  }

  /* ---------- inlay materials ---------- */
  function inlayFill(c, kind, size) {
    var top = H / 2 - size * .5, bot = H / 2 + size * .5, gr, i;
    c.save();
    if (kind === 'brass' || kind === 'gold') {
      gr = c.createLinearGradient(0, top, 0, bot);
      if (kind === 'brass') { gr.addColorStop(0, '#fff1b8'); gr.addColorStop(.35, '#d9ad4c'); gr.addColorStop(.55, '#8a5c14'); gr.addColorStop(.8, '#e9c46a'); gr.addColorStop(1, '#a87a26'); }
      else { gr.addColorStop(0, '#fff8d2'); gr.addColorStop(.3, '#f6d25a'); gr.addColorStop(.52, '#b8860b'); gr.addColorStop(.75, '#ffe58a'); gr.addColorStop(1, '#c99a20'); }
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      if (kind === 'brass') { // brushed lines
        for (i = 0; i < 260; i++) { c.fillStyle = 'rgba(' + (Math.random() < .5 ? '255,250,220' : '90,60,10') + ',' + (Math.random() * .16).toFixed(3) + ')'; c.fillRect(0, top + Math.random() * size, W, 1); }
      } else { // gold-leaf squares & sparkle
        c.strokeStyle = 'rgba(120,80,10,.22)'; c.lineWidth = 1;
        for (i = 0; i < 70; i++) { c.strokeRect(Math.random() * W, top + Math.random() * size, 40 + Math.random() * 30, 40 + Math.random() * 30); }
        for (i = 0; i < 120; i++) { c.fillStyle = 'rgba(255,255,240,' + (Math.random() * .5).toFixed(2) + ')'; c.fillRect(Math.random() * W, top + Math.random() * size, 2, 2); }
      }
    } else if (kind === 'ebony') {
      if (!ebonyPat) { try { ebonyPat = c.createPattern(WC.wood.make('ebony', 420, 210, { seed: 2 }), 'repeat'); } catch (e) { ebonyPat = '#1a1311'; } }
      c.fillStyle = ebonyPat || '#1a1311'; c.fillRect(0, 0, W, H);
      gr = c.createLinearGradient(0, top, 0, bot); gr.addColorStop(0, 'rgba(255,255,255,.14)'); gr.addColorStop(.4, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,.2)');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
    } else if (kind === 'turquoise') {
      gr = c.createLinearGradient(0, top, W, bot); gr.addColorStop(0, '#36d1c0'); gr.addColorStop(.5, '#119a9a'); gr.addColorStop(1, '#2fc4b2');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      c.lineCap = 'round';
      for (i = 0; i < 46; i++) { // matrix veins
        c.strokeStyle = 'rgba(' + (Math.random() < .6 ? '40,30,20' : '230,255,250') + ',' + (.18 + Math.random() * .3).toFixed(2) + ')';
        c.lineWidth = .6 + Math.random() * 2;
        var x = Math.random() * W, y = top + Math.random() * size;
        c.beginPath(); c.moveTo(x, y);
        c.bezierCurveTo(x + 30 - Math.random() * 60, y + 30 - Math.random() * 60, x + 60 - Math.random() * 120, y + 40 - Math.random() * 80, x + 80 - Math.random() * 160, y + 50 - Math.random() * 100);
        c.stroke();
      }
      for (i = 0; i < 300; i++) { c.fillStyle = 'rgba(255,255,255,' + (Math.random() * .35).toFixed(2) + ')'; c.fillRect(Math.random() * W, top + Math.random() * size, 1.5, 1.5); }
    }
    c.restore();
  }

  /* ---------- compose the finished carving into `done` ---------- */
  function compose() {
    var text = (tx.value || '').trim(), d = +depth.value, inlay = inlaySel.value;
    dg.globalCompositeOperation = 'source-over';
    dg.clearRect(0, 0, W, H); dg.drawImage(base, 0, 0);
    if (!text) {
      dg.save(); dg.font = '44px "Segoe Print", "Bradley Hand", "Chalkboard SE", cursive'; dg.fillStyle = 'rgba(40,38,44,.62)';
      dg.textAlign = 'center'; dg.textBaseline = 'middle';
      dg.fillText('\u270e type something \u2014 the chisel is getting bored', W / 2, H / 2); dg.restore();
      bounds = { x0: 0, x1: W, size: 100 };
      return false;
    }
    var size = buildMask(text);
    pencilGuides(dg, size);
    // faint lifted lip where the gouge rolled the fibres
    dg.save(); dg.globalAlpha = .55; dg.drawImage(tinted('rgba(255,240,212,.5)', 1, 2), 0, 0); dg.restore();
    dg.save(); dg.globalAlpha = .6; dg.drawImage(tinted('rgba(20,8,2,.45)', -1, -1), 0, 0); dg.restore();
    // groove floor: the same wood, cut deeper (darker, rougher)
    wg.globalCompositeOperation = 'source-over';
    wg.clearRect(0, 0, W, H); wg.drawImage(base, 0, 0);
    wg.globalCompositeOperation = 'multiply'; wg.fillStyle = 'rgb(' + (120 - d * 6) + ',' + (84 - d * 5) + ',' + (60 - d * 4) + ')'; wg.fillRect(0, 0, W, H);
    wg.globalCompositeOperation = 'source-over';
    for (var i = 0; i < 900; i++) { wg.fillStyle = 'rgba(' + (Math.random() < .5 ? '255,230,190' : '0,0,0') + ',' + (Math.random() * .12).toFixed(3) + ')'; wg.fillRect(Math.random() * W, Math.random() * H, 1 + Math.random() * 3, 1); }
    wg.globalCompositeOperation = 'destination-in'; wg.drawImage(maskC, 0, 0);
    wg.globalCompositeOperation = 'source-over';
    dg.drawImage(work, 0, 0);
    if (inlay !== 'none') {
      wg.clearRect(0, 0, W, H); inlayFill(wg, inlay, size);
      wg.globalCompositeOperation = 'destination-in'; wg.drawImage(maskC, 0, 0); wg.globalCompositeOperation = 'source-over';
      dg.drawImage(work, 0, 0);
      innerShadow(dg, 'rgba(0,0,0,.75)', 1.5, 2, 2 + d * .4);
      innerShadow(dg, 'rgba(255,255,255,.35)', -1, -1, 1.5);
    } else {
      innerShadow(dg, 'rgba(10,4,0,.92)', d * .9, d * 1.1, d * 1.8);
      innerShadow(dg, 'rgba(255,236,200,.42)', -d * .55, -d * .65, d * .9);
    }
    return true;
  }

  /* ---------- chisel overlay & animation ---------- */
  function chiselAt(x, y) {
    g.save(); g.translate(x, y); g.rotate(-.75);
    g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 10; g.shadowOffsetY = 6;
    var st = g.createLinearGradient(0, -7, 0, 7); st.addColorStop(0, '#f4f6f8'); st.addColorStop(.5, '#9aa1a8'); st.addColorStop(1, '#5d646b');
    g.fillStyle = st; g.beginPath(); g.moveTo(0, -6); g.lineTo(70, -7); g.lineTo(70, 7); g.lineTo(0, 6); g.lineTo(-10, 0); g.closePath(); g.fill();
    g.fillStyle = '#c9973a'; g.fillRect(70, -10, 12, 20);
    var hd = g.createLinearGradient(0, -12, 0, 12); hd.addColorStop(0, '#d79a5c'); hd.addColorStop(.5, '#8a4f24'); hd.addColorStop(1, '#4b2810');
    g.fillStyle = hd; g.beginPath(); g.moveTo(82, -12); g.lineTo(190, -14); g.quadraticCurveTo(204, 0, 190, 14); g.lineTo(82, 12); g.closePath(); g.fill();
    g.restore();
  }
  function showStatic() { cancelAnimationFrame(anim); anim = 0; if (!ready) return; compose(); g.clearRect(0, 0, W, H); g.drawImage(done, 0, 0); }
  function carve() {
    if (!ready) { WC.toast('Still planing the plank\u2026 one moment.'); return; }
    cancelAnimationFrame(anim); anim = 0;
    var has = compose();
    g.clearRect(0, 0, W, H);
    if (!has) { g.drawImage(done, 0, 0); WC.toast('Nothing to carve. Even a chisel needs a little inspiration.'); return; }
    if (WC.reduced) { g.drawImage(done, 0, 0); WC.sound.chisel(); return; }
    var t0 = performance.now(), n = (tx.value || '').trim().length, dur = Math.min(3200, 1100 + n * 90), lastHit = 0;
    var x0 = bounds.x0, x1 = bounds.x1, rect = cv.getBoundingClientRect(), sx = rect.width / W, sy = rect.height / H;
    function step(t) {
      var k = Math.min(1, Math.max(0, (t - t0) / dur)), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2, x = x0 + (x1 - x0) * e;
      g.clearRect(0, 0, W, H); g.drawImage(base, 0, 0);
      g.save(); g.beginPath(); g.rect(0, 0, x, H); g.clip(); g.drawImage(done, 0, 0); g.restore();
      // the un-carved remainder still shows the pencil layout
      g.save(); g.beginPath(); g.rect(x, 0, W - x, H); g.clip(); g.globalAlpha = .35; g.drawImage(tinted('rgba(40,38,44,.7)', 0, 0), 0, 0); g.restore();
      var cy = H / 2 - bounds.size * .2 + Math.sin(t / 45) * 6;
      if (k < 1) {
        chiselAt(x, cy);
        if (t - lastHit > 95) {
          lastHit = t; WC.sound.chisel();
          WC.dust(rect.left + x * sx, rect.top + cy * sy, 4, { color: WC.wood.avg(spSel.value), curl: Math.random() < .5, up: 3.4, spread: 4 });
        }
        anim = requestAnimationFrame(step);
      } else {
        anim = 0; g.clearRect(0, 0, W, H); g.drawImage(done, 0, 0); WC.sound.hammer();
        WC.toast(['Carved! Your name now has grain.', 'Beautiful. The tree would be proud.', 'Chiselled to perfection \u2014 like your jawline.'][Math.floor(Math.random() * 3)]);
      }
    }
    anim = requestAnimationFrame(step);
  }
  function loadPlank(thenCarve) {
    var my = ++token; ready = false;
    WC.wood.url(spSel.value, W, H, { seed: 4 }).then(function (u) {
      var im = new Image();
      im.onload = function () { if (my !== token) return; drawPlank(im); ready = true; if (thenCarve) carve(); else showStatic(); };
      im.onerror = function () { if (my !== token) return; bg.fillStyle = WC.wood.avg(spSel.value); bg.fillRect(0, 0, W, H); ready = true; showStatic(); };
      im.src = u;
    });
  }

  /* ---------- download ---------- */
  function slug(s) { return (s || 'plank').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'plank'; }
  $('#cvDownload').addEventListener('click', function () {
    this.dataset.quiet = '1';
    if (!ready) { WC.toast('The plank is still drying. Try again in a second.'); return; }
    if (!anim) showStatic();
    var name = 'woodcraft-' + slug(tx.value) + '.png';
    function go(href, revoke) { var a = document.createElement('a'); a.href = href; a.download = name; document.body.appendChild(a); a.click(); a.remove(); if (revoke) setTimeout(function () { URL.revokeObjectURL(href); }, 2000); }
    try {
      if (done.toBlob) done.toBlob(function (b) { if (b) go(URL.createObjectURL(b), true); else go(done.toDataURL('image/png')); }, 'image/png');
      else go(done.toDataURL('image/png'));
      WC.sound.saw(2);
      WC.toast('PNG downloaded \u2014 hang it on the workshop door.');
    } catch (e) { WC.toast('Your browser refused the download. Right-click the plank and save it instead.'); }
  });

  /* ---------- wiring ---------- */
  var deb = 0;
  tx.addEventListener('input', function () { persist(); clearTimeout(deb); deb = setTimeout(showStatic, 160); if (Math.random() < .35) WC.sound.tap(WC.speciesById(spSel.value).density); });
  tx.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); carve(); } });
  spSel.addEventListener('change', function () { persist(); WC.sound.knock(WC.speciesById(spSel.value).density); loadPlank(false); });
  fontSel.addEventListener('change', function () { persist(); showStatic(); });
  inlaySel.addEventListener('change', function () { persist(); showStatic(); if (inlaySel.value !== 'none') WC.sound.hammer(); });
  depth.addEventListener('input', function () { depthV.textContent = depth.value; persist(); clearTimeout(deb); deb = setTimeout(showStatic, 60); });
  $('#cvCarve').addEventListener('click', function () { this.dataset.quiet = '1'; carve(); });

  function start() { if (started) return; started = true; loadPlank(true); }
  document.addEventListener('wc:view', function (e) { if (e.detail === 'carve') start(); });
  if (WC.state && WC.state.view === 'carve') start();
})();

/* ---------- About: the creaky cabinet door ---------- */
(function () {
  'use strict';
  var WC = window.WC, $ = WC.$;
  var door = $('#aboutDoor'), inside = $('.about-inside');
  if (!door) return;
  door.dataset.quiet = '1';
  var lbl = door.querySelector('.door-label'), greeted = false;
  function isOpen() { return door.getAttribute('aria-expanded') === 'true'; }
  function set(open) {
    door.setAttribute('aria-expanded', open ? 'true' : 'false');
    door.setAttribute('aria-label', open ? 'Close the cabinet door' : 'Open the cabinet door');
    if (lbl) lbl.textContent = open ? 'Close me' : 'Open me';
    WC.sound.creak();
    if (open) {
      var r = door.getBoundingClientRect();
      WC.dust(r.left + 24, r.top + r.height * .2, 8); WC.dust(r.left + 24, r.top + r.height * .8, 8);
      if (!greeted) { greeted = true; setTimeout(function () { WC.toast('Creeeak! Hello there \u2014 thanks for visiting the workshop.'); }, 700); }
    }
  }
  door.addEventListener('click', function () { set(!isOpen()); });
  if (inside) inside.addEventListener('focusin', function () { if (!isOpen()) set(true); });
})();
