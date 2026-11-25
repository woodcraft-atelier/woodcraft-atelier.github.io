/* Woodcraft Atelier — puzzle corner: sliding blocks + tangram */
(function () {
  'use strict';
  var WC = window.WC, $ = WC.$;

  /* ================= Sliding block ================= */
  var board = $('#spBoard'), sizeSel = $('#spSize'), movesEl = $('#spMoves'), timeEl = $('#spTime'), bestEl = $('#spBest');
  board.setAttribute('role', 'group'); board.tabIndex = 0;
  var N = 4, cells = [], tiles = [], moves = 0, t0 = 0, timer = 0, playing = false;
  function best() { try { return JSON.parse(localStorage.getItem('wc-slide-best') || '{}'); } catch (e) { return {}; } }
  function fmtT(s) { return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function showBest() { var b = best()[N]; bestEl.textContent = b ? b.m + ' moves / ' + fmtT(b.t) : '—'; }
  function build() {
    N = +sizeSel.value; board.innerHTML = ''; tiles = [];
    board.style.setProperty('--n', N);
    for (var i = 0; i < N * N - 1; i++) {
      var t = document.createElement('button');
      t.type = 'button'; t.className = 'sp-tile'; t.dataset.quiet = '1'; t.dataset.v = i;
      t.innerHTML = '<span class="carved">' + (i + 1) + '</span>';
      t.style.backgroundSize = (N * 100) + '% ' + (N * 100) + '%';
      t.style.backgroundPosition = ((i % N) / (N - 1) * 100) + '% ' + (Math.floor(i / N) / (N - 1) * 100) + '%';
      t.tabIndex = -1;
      t.addEventListener('click', (function (v) { return function () { tryMove(cells.indexOf(v)); }; })(i));
      board.appendChild(t); tiles.push(t);
    }
    WC.wood.url(WC.state.species === 'burl' ? 'walnut' : WC.state.species, 640, 640, { seed: 7 }).then(function (u) { tiles.forEach(function (t) { t.style.backgroundImage = 'url("' + u + '")'; }); });
    cells = []; for (var k = 0; k < N * N - 1; k++) cells.push(k); cells.push(-1);
    layout(); showBest(); shuffle();
  }
  function layout() {
    cells.forEach(function (v, pos) {
      if (v < 0) return;
      var t = tiles[v];
      t.style.transform = 'translate(' + (pos % N) * 100 + '%,' + Math.floor(pos / N) * 100 + '%)';
      t.classList.toggle('home', v === pos);
      t.setAttribute('aria-label', 'Tile ' + (v + 1) + ', row ' + (Math.floor(pos / N) + 1) + ', column ' + (pos % N + 1));
    });
  }
  function gap() { return cells.indexOf(-1); }
  function adj(a, b) { var ax = a % N, ay = Math.floor(a / N), bx = b % N, by = Math.floor(b / N); return Math.abs(ax - bx) + Math.abs(ay - by) === 1; }
  function swap(pos) { var g = gap(); cells[g] = cells[pos]; cells[pos] = -1; }
  function shuffle() {
    var last = -1;
    for (var i = 0; i < N * N * 30; i++) {
      var g = gap(), opts = [];
      for (var p = 0; p < N * N; p++) if (adj(p, g) && p !== last) opts.push(p);
      var pick = opts[Math.floor(Math.random() * opts.length)]; last = g; swap(pick);
    }
    if (solved()) return shuffle();
    moves = 0; movesEl.textContent = '0'; timeEl.textContent = '0:00'; playing = false; clearInterval(timer);
    layout();
  }
  function solved() { for (var i = 0; i < N * N - 1; i++) if (cells[i] !== i) return false; return true; }
  function tryMove(pos) {
    if (pos < 0 || !adj(pos, gap())) { WC.sound.tap(300); return; }
    if (!playing) { playing = true; t0 = Date.now(); clearInterval(timer); timer = setInterval(function () { timeEl.textContent = fmtT(Math.floor((Date.now() - t0) / 1000)); }, 500); }
    swap(pos); moves++; movesEl.textContent = moves; layout();
    WC.sound.knock(WC.density(), 0.7);
    if (solved()) {
      clearInterval(timer); playing = false;
      var secs = Math.floor((Date.now() - t0) / 1000), b = best();
      if (!b[N] || moves < b[N].m) { b[N] = { m: moves, t: secs }; try { localStorage.setItem('wc-slide-best', JSON.stringify(b)); } catch (e) {} }
      showBest(); WC.sound.win();
      board.classList.add('won'); setTimeout(function () { board.classList.remove('won'); }, 1600);
      var r = board.getBoundingClientRect(); for (var i = 0; i < 6; i++) WC.dust(r.left + Math.random() * r.width, r.top + Math.random() * r.height, 10, { curl: true });
      WC.toast('Solved in ' + moves + ' moves! You\u2019re a cut above the rest.');
    }
  }
  board.addEventListener('keydown', function (e) {
    var g = gap(), gx = g % N, gy = Math.floor(g / N), t = -1;
    if (e.key === 'ArrowUp' && gy < N - 1) t = g + N;
    else if (e.key === 'ArrowDown' && gy > 0) t = g - N;
    else if (e.key === 'ArrowLeft' && gx < N - 1) t = g + 1;
    else if (e.key === 'ArrowRight' && gx > 0) t = g - 1;
    else return;
    e.preventDefault(); tryMove(t);
  });
  sizeSel.addEventListener('change', build);
  $('#spShuffle').addEventListener('click', function () { shuffle(); WC.sound.saw(1); });

  /* ================= Tangram ================= */
  var svg = $('#tgSvg'), sel = $('#tgTarget'), status = $('#tgStatus'), NS = 'http://www.w3.org/2000/svg';
  var BASE = {
    L1: [[0, 0], [4, 0], [2, 2]], L2: [[0, 0], [2, 2], [0, 4]], M: [[2, 4], [4, 4], [4, 2]], S1: [[4, 0], [4, 2], [3, 1]],
    Sq: [[2, 2], [3, 1], [4, 2], [3, 3]], S2: [[2, 2], [3, 3], [1, 3]], P: [[0, 4], [1, 3], [3, 3], [2, 4]]
  };
  var ORDER = ['L1', 'L2', 'M', 'S1', 'Sq', 'S2', 'P'];
  var WOODS = { L1: 'maple', L2: 'walnut', M: 'cherry', S1: 'teak', Sq: 'sheesham', S2: 'oak', P: 'mahogany' };
  var TARGETS = {
    'Square (the classic)': BASE,
    'Cottage with chimneys': { L1: [[4, 3], [0, 3], [2, 1]], L2: [[0, 3], [4, 3], [2, 5]], M: [[0, 3], [0, 5], [2, 5]], S1: [[4, 3], [4, 5], [3, 4]], S2: [[4, 5], [2, 5], [3, 4]], P: [[3, 2], [3, 0], [4, 1], [4, 3]], Sq: [[1, 2], [2, 1], [1, 0], [0, 1]] },
    'Arrow': { L1: [[6, 0], [6, 4], [8, 2]], M: [[4, 1], [6, 1], [6, 3]], S1: [[4, 1], [4, 3], [5, 2]], S2: [[4, 3], [6, 3], [5, 2]], P: [[4, 1], [4, 3], [3, 2], [3, 0]], Sq: [[3, 2], [4, 3], [3, 4], [2, 3]], L2: [[0, 1], [2, 3], [0, 5]] },
    'Fish': { L1: [[0, 2], [4, 2], [2, 0]], L2: [[0, 2], [4, 2], [2, 4]], S1: [[0, 2], [-1, 1], [-1, 3]], M: [[-1, 1], [-3, 1], [-1, 3]], Sq: [[2, 0], [3, -1], [4, 0], [3, 1]], P: [[1, 3], [2, 4], [2, 6], [1, 5]], S2: [[0, 2], [-1, 1], [0, 0]] }
  };
  var SCATTER = { L1: [0.5, 0.5, 0], L2: [3, 3, 2], M: [0.5, 7, 0], S1: [5.5, 8, 0], Sq: [5, 5.5, 0], S2: [3, 8.5, 0], P: [4, 10, 0] };
  Object.keys(TARGETS).forEach(function (k) { var o = document.createElement('option'); o.value = k; o.textContent = k; sel.appendChild(o); });
  var pcs = {}, tgtPolys = [], active = null, solvedT = false;

  function local(n) { var v = BASE[n], x0 = v[0][0], y0 = v[0][1]; return v.map(function (p) { return [p[0] - x0, p[1] - y0]; }); }
  function world(pc) {
    var a = pc.rot * Math.PI / 4, c = Math.cos(a), s = Math.sin(a);
    return pc.loc.map(function (p) { var x = pc.flip ? -p[0] : p[0], y = p[1]; return [x * c - y * s + pc.x, x * s + y * c + pc.y]; });
  }
  function centroid(pts) { var x = 0, y = 0; pts.forEach(function (p) { x += p[0]; y += p[1]; }); return [x / pts.length, y / pts.length]; }
  function inside(pt, poly) {
    var c = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  function el(tag, attrs) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }

  function setupTangram() {
    svg.innerHTML = '';
    var defs = el('defs', {});
    ORDER.forEach(function (n) {
      var p = el('pattern', { id: 'tgp-' + n, patternUnits: 'userSpaceOnUse', width: 8, height: 4 });
      var img = el('image', { width: 8, height: 4, preserveAspectRatio: 'none' });
      p.appendChild(el('rect', { width: 8, height: 4, fill: WC.wood.avg(WOODS[n]) })); p.appendChild(img); defs.appendChild(p);
      WC.wood.url(WOODS[n], 320, 160).then(function (u) { img.setAttribute('href', u); img.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', u); });
    });
    svg.appendChild(defs);
    svg.appendChild(el('rect', { x: 0, y: 0, width: 16, height: 12, rx: .3, fill: 'rgba(20,10,4,.25)' }));
    svg.appendChild(el('g', { id: 'tgTargetG' }));
    var g = el('g', { id: 'tgPieces' }); svg.appendChild(g);
    ORDER.forEach(function (n) {
      var poly = el('polygon', { points: local(n).map(function (p) { return p.join(','); }).join(' '), fill: 'url(#tgp-' + n + ')', class: 'tg-piece', tabindex: 0, role: 'button', 'aria-label': ({ L1: 'Large triangle', L2: 'Large triangle 2', M: 'Medium triangle', S1: 'Small triangle', Sq: 'Square', S2: 'Small triangle 2', P: 'Parallelogram' })[n] });
      g.appendChild(poly);
      pcs[n] = { n: n, loc: local(n), x: 0, y: 0, rot: 0, flip: 0, el: poly };
      bindPiece(pcs[n]);
    });
    scatter(); drawTarget();
  }
  function place(pc) { pc.el.setAttribute('transform', 'translate(' + pc.x + ' ' + pc.y + ') rotate(' + pc.rot * 45 + ') scale(' + (pc.flip ? -1 : 1) + ' 1)'); }
  function scatter() {
    ORDER.forEach(function (n) { var s = SCATTER[n], pc = pcs[n]; pc.rot = s[2]; pc.flip = 0; pc.x = 0; pc.y = 0; var c = world(pc), b = bounds(c); pc.x = s[0] - b[0]; pc.y = s[1] - b[1]; snap(pc); place(pc); });
    solvedT = false; svg.classList.remove('won');
  }
  function bounds(pts) { var a = [1e9, 1e9, -1e9, -1e9]; pts.forEach(function (p) { a[0] = Math.min(a[0], p[0]); a[1] = Math.min(a[1], p[1]); a[2] = Math.max(a[2], p[0]); a[3] = Math.max(a[3], p[1]); }); return a; }
  function snap(pc) { pc.x = Math.round(pc.x * 2) / 2; pc.y = Math.round(pc.y * 2) / 2; }
  function drawTarget() {
    var T = TARGETS[sel.value], all = [];
    ORDER.forEach(function (n) { all = all.concat(T[n]); });
    var b = bounds(all), w = b[2] - b[0], h = b[3] - b[1];
    var ox = Math.floor(15.5 - w) - b[0], oy = Math.round((12 - h) / 2) - b[1];
    tgtPolys = ORDER.map(function (n) { return T[n].map(function (p) { return [p[0] + ox, p[1] + oy]; }); });
    var tg = $('#tgTargetG'); tg.innerHTML = '';
    tgtPolys.forEach(function (poly) { tg.appendChild(el('polygon', { points: poly.map(function (p) { return p.join(','); }).join(' '), class: 'tg-shadow' })); });
    status.textContent = 'Recreate the “' + sel.value + '” silhouette. Drag pieces; double-click or R to rotate, F to flip.';
    solvedT = false;
  }
  function check() {
    var polys = ORDER.map(function (n) { return world(pcs[n]); }), mis = 0, area = 0;
    for (var x = 0.05; x < 16; x += 0.1) for (var y = 0.05; y < 12; y += 0.1) {
      var inT = false, inP = false, i;
      for (i = 0; i < tgtPolys.length && !inT; i++) inT = inside([x, y], tgtPolys[i]);
      for (i = 0; i < polys.length && !inP; i++) inP = inside([x, y], polys[i]);
      if (inT) area++; if (inT !== inP) mis++;
    }
    var ok = mis / area < 0.04;
    if (ok && !solvedT) {
      solvedT = true; svg.classList.add('won'); WC.sound.win();
      status.textContent = 'Perfect fit! Not a single gap. A true tangram-ist.';
      WC.toast('Tangram solved — seven pieces, zero glue.');
    } else if (!ok) { solvedT = false; svg.classList.remove('won'); }
    return ok;
  }
  function svgPt(e) { var p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; var m = svg.getScreenCTM(); return m ? p.matrixTransform(m.inverse()) : { x: 0, y: 0 }; }
  function turn(pc, d, flip) {
    var c0 = centroid(world(pc));
    if (flip) pc.flip = pc.flip ? 0 : 1; else pc.rot = (pc.rot + d + 8) % 8;
    var c1 = centroid(world(pc)); pc.x += c0[0] - c1[0]; pc.y += c0[1] - c1[1]; snap(pc); place(pc);
    WC.sound.tap(WC.speciesById(WOODS[pc.n]).density); check();
  }
  function activate(pc) {
    if (active) active.el.classList.remove('active');
    active = pc; if (pc) { pc.el.classList.add('active'); $('#tgPieces').appendChild(pc.el); }
  }
  function bindPiece(pc) {
    var drag = null;
    pc.el.addEventListener('pointerdown', function (e) {
      e.preventDefault(); activate(pc); var p = svgPt(e); drag = { dx: p.x - pc.x, dy: p.y - pc.y };
      try { pc.el.setPointerCapture(e.pointerId); } catch (x) {}
      WC.sound.tap(WC.speciesById(WOODS[pc.n]).density);
    });
    pc.el.addEventListener('pointermove', function (e) { if (!drag) return; var p = svgPt(e); pc.x = Math.max(-2, Math.min(17, p.x - drag.dx)); pc.y = Math.max(-2, Math.min(13, p.y - drag.dy)); place(pc); });
    function end() { if (!drag) return; drag = null; snap(pc); place(pc); WC.sound.knock(WC.speciesById(WOODS[pc.n]).density, .5); check(); }
    pc.el.addEventListener('pointerup', end); pc.el.addEventListener('pointercancel', end);
    pc.el.addEventListener('dblclick', function () { turn(pc, 1); });
    pc.el.addEventListener('focus', function () { activate(pc); });
    pc.el.addEventListener('keydown', function (e) {
      var k = e.key, step = .5;
      if (k === 'r' || k === 'R') turn(pc, e.shiftKey ? -1 : 1);
      else if (k === 'f' || k === 'F') turn(pc, 0, true);
      else if (k.indexOf('Arrow') === 0) {
        if (k === 'ArrowLeft') pc.x -= step; if (k === 'ArrowRight') pc.x += step; if (k === 'ArrowUp') pc.y -= step; if (k === 'ArrowDown') pc.y += step;
        place(pc); check();
      } else return;
      e.preventDefault();
    });
  }
  $('#tgRotate').addEventListener('click', function () { this.dataset.quiet = '1'; if (active) turn(active, 1); else status.textContent = 'Pick a piece first — they\u2019re shy.'; });
  $('#tgFlip').addEventListener('click', function () { this.dataset.quiet = '1'; if (active) turn(active, 0, true); else status.textContent = 'Pick a piece first, then flip it like a pancake.'; });
  $('#tgReset').addEventListener('click', function () { scatter(); drawTarget(); });
  sel.addEventListener('change', function () { drawTarget(); check(); });

  var started = false;
  function start() { if (started) return; started = true; build(); setupTangram(); }
  document.addEventListener('wc:view', function (e) { if (e.detail === 'puzzles') start(); });
  document.addEventListener('wc:species', function () { if (started) WC.wood.url(WC.state.species === 'burl' ? 'walnut' : WC.state.species, 640, 640, { seed: 7 }).then(function (u) { tiles.forEach(function (t) { t.style.backgroundImage = 'url("' + u + '")'; }); }); });
  if (WC.state.view === 'puzzles') start();
})();
