/* Woodcraft Atelier — cut-list optimizer (guillotine bin packing with kerf) */
(function () {
  'use strict';
  var WC = window.WC, $ = WC.$;
  var SAMPLE = {
    kerf: 3.2, grain: true,
    stock: [{ label: 'Oak 8/4 board', l: 2440, w: 300, q: 2 }, { label: 'Walnut offcut', l: 1200, w: 200, q: 1 }],
    parts: [
      { label: 'Table leg', l: 720, w: 70, q: 4 },
      { label: 'Long apron', l: 1100, w: 90, q: 2 },
      { label: 'Short apron', l: 500, w: 90, q: 2 },
      { label: 'Stretcher', l: 520, w: 50, q: 2 },
      { label: 'Drawer front', l: 420, w: 110, q: 1 },
      { label: 'Cleat', l: 300, w: 40, q: 4 }
    ]
  };
  var data;
  try { data = JSON.parse(localStorage.getItem('wc-cutlist') || 'null'); } catch (e) { data = null; }
  if (!data || !Array.isArray(data.stock) || !Array.isArray(data.parts)) data = JSON.parse(JSON.stringify(SAMPLE));
  var stockB = $('#clStock'), partB = $('#clParts'), kerfI = $('#clKerf'), grainS = $('#clGrain'), sum = $('#clSummary'), res = $('#clResult');
  var COLORS = ['#f6d48b', '#9fd0c4', '#f2a98d', '#c6b6f0', '#a9d08e', '#f0b8d2', '#8fc2ef', '#e8d17a'];
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function save() { try { localStorage.setItem('wc-cutlist', JSON.stringify(data)); } catch (e) {} }

  function row(kind, o, i) {
    return '<tr data-kind="' + kind + '" data-i="' + i + '">' +
      '<td><input type="text" data-f="label" value="' + esc(o.label) + '" aria-label="' + kind + ' ' + (i + 1) + ' label"></td>' +
      '<td><input type="number" min="1" step="any" data-f="l" value="' + o.l + '" aria-label="' + kind + ' ' + (i + 1) + ' length in mm"></td>' +
      '<td><input type="number" min="1" step="any" data-f="w" value="' + o.w + '" aria-label="' + kind + ' ' + (i + 1) + ' width in mm"></td>' +
      '<td><input type="number" min="1" step="1" data-f="q" value="' + o.q + '" aria-label="' + kind + ' ' + (i + 1) + ' quantity"></td>' +
      '<td><button type="button" class="x" aria-label="Remove ' + kind + ' ' + (i + 1) + '">✕</button></td></tr>';
  }
  function renderTables() {
    stockB.innerHTML = data.stock.map(function (o, i) { return row('stock', o, i); }).join('') || '<tr><td colspan="5" class="pencil">No boards. Wood you like to add one?</td></tr>';
    partB.innerHTML = data.parts.map(function (o, i) { return row('part', o, i); }).join('') || '<tr><td colspan="5" class="pencil">No parts — the easiest project ever built.</td></tr>';
    kerfI.value = data.kerf; grainS.setAttribute('aria-checked', data.grain ? 'true' : 'false');
  }
  function onEdit(e) {
    var inp = e.target.closest('input'); if (!inp) return;
    var tr = inp.closest('tr'), arr = tr.dataset.kind === 'stock' ? data.stock : data.parts, o = arr[+tr.dataset.i];
    if (!o) return;
    var f = inp.dataset.f;
    o[f] = f === 'label' ? inp.value.slice(0, 40) : Math.max(0, parseFloat(inp.value) || 0);
    if (f === 'q') o.q = Math.max(0, Math.round(o.q));
    save();
  }
  function onRemove(e) {
    var x = e.target.closest('.x'); if (!x) return;
    var tr = x.closest('tr'), arr = tr.dataset.kind === 'stock' ? data.stock : data.parts;
    arr.splice(+tr.dataset.i, 1); save(); renderTables();
  }
  [stockB, partB].forEach(function (b) { b.addEventListener('input', onEdit); b.addEventListener('click', onRemove); });
  $('#clAddStock').addEventListener('click', function () { data.stock.push({ label: 'Board ' + (data.stock.length + 1), l: 2000, w: 200, q: 1 }); save(); renderTables(); });
  $('#clAddPart').addEventListener('click', function () { data.parts.push({ label: 'Part ' + (data.parts.length + 1), l: 400, w: 60, q: 1 }); save(); renderTables(); });
  kerfI.addEventListener('input', function () { data.kerf = Math.max(0, parseFloat(kerfI.value) || 0); save(); });
  grainS.addEventListener('wc:toggle', function () { data.grain = WC.switchVal(grainS); save(); });
  $('#clReset').addEventListener('click', function () { data = JSON.parse(JSON.stringify(SAMPLE)); save(); renderTables(); run(); });

  /* --- packing --- */
  function pack() {
    var k = data.kerf, rot = !data.grain;
    var boards = [];
    data.stock.forEach(function (s) { for (var i = 0; i < s.q; i++) if (s.l > 0 && s.w > 0) boards.push({ label: s.label, L: s.l, W: s.w, free: [{ x: 0, y: 0, w: s.l + k, h: s.w + k }], placed: [] }); });
    var pieces = [];
    data.parts.forEach(function (p, pi) { for (var i = 0; i < p.q; i++) if (p.l > 0 && p.w > 0) pieces.push({ label: p.label, l: p.l, w: p.w, ci: pi % COLORS.length }); });
    pieces.sort(function (a, b) { return Math.max(b.l, b.w) - Math.max(a.l, a.w) || b.l * b.w - a.l * a.w; });
    var unplaced = [];
    // fill boards in order: prefer already-used boards, then smallest board that fits
    pieces.forEach(function (p) {
      var best = null;
      for (var bi = 0; bi < boards.length; bi++) {
        var B = boards[bi], used = B.placed.length > 0;
        for (var fi = 0; fi < B.free.length; fi++) {
          var F = B.free[fi];
          var opts = [[p.l, p.w, false]]; if (rot && p.l !== p.w) opts.push([p.w, p.l, true]);
          for (var oi = 0; oi < opts.length; oi++) {
            var pw = opts[oi][0] + k, ph = opts[oi][1] + k;
            if (pw <= F.w + 1e-6 && ph <= F.h + 1e-6) {
              var score = (used ? 0 : 1e12) + (F.w * F.h - pw * ph) + Math.min(F.w - pw, F.h - ph) * 10;
              if (!best || score < best.score) best = { score: score, bi: bi, fi: fi, w: pw, h: ph, r: opts[oi][2] };
            }
          }
        }
      }
      if (!best) { unplaced.push(p); return; }
      var B2 = boards[best.bi], F2 = B2.free.splice(best.fi, 1)[0];
      B2.placed.push({ x: F2.x, y: F2.y, l: best.w - k, w: best.h - k, label: p.label, ci: p.ci, r: best.r });
      // guillotine split: cut along the shorter leftover first (keeps a long strip, like rip-then-crosscut)
      var rw = F2.w - best.w, rh = F2.h - best.h;
      if (rw > rh) {
        if (rw > 0) B2.free.push({ x: F2.x + best.w, y: F2.y, w: rw, h: F2.h });
        if (rh > 0) B2.free.push({ x: F2.x, y: F2.y + best.h, w: best.w, h: rh });
      } else {
        if (rh > 0) B2.free.push({ x: F2.x, y: F2.y + best.h, w: F2.w, h: rh });
        if (rw > 0) B2.free.push({ x: F2.x + best.w, y: F2.y, w: rw, h: best.h });
      }
    });
    return { boards: boards, unplaced: unplaced };
  }

  function run() {
    var r = pack(), used = r.boards.filter(function (b) { return b.placed.length; });
    if (!data.parts.length || !data.stock.length) { sum.innerHTML = 'Add at least one board and one part. The saw is idling.'; res.innerHTML = ''; return; }
    var areaStock = 0, areaParts = 0;
    used.forEach(function (b) { areaStock += b.L * b.W; b.placed.forEach(function (p) { areaParts += p.l * p.w; }); });
    var util = areaStock ? areaParts / areaStock * 100 : 0;
    var cuts = used.reduce(function (n, b) { return n + b.placed.length; }, 0);
    sum.innerHTML = '<b>' + cuts + '</b> parts on <b>' + used.length + '</b> board' + (used.length === 1 ? '' : 's') + ' · yield <span class="big-num">' + util.toFixed(1) + '%</span> · kerf ' + data.kerf + ' mm' +
      (r.unplaced.length ? '<br><span class="warn">⚠ ' + r.unplaced.length + ' part(s) didn’t fit: ' + r.unplaced.map(function (p) { return esc(p.label) + ' ' + p.l + '×' + p.w; }).join(', ') + '. Add stock' + (data.grain ? ' or allow rotation' : '') + '.</span>' : '<br>' + (util > 80 ? 'Barely any offcuts. Your scrap bin will be lonely.' : util > 60 ? 'Decent yield — offcuts become coasters.' : 'Plenty of offcuts. Small boxes, anyone?'));
    res.innerHTML = used.map(function (b, i) {
      var ar = (b.W / b.L * 100).toFixed(3);
      return '<figure class="cl-board"><figcaption class="pencil">' + esc(b.label) + ' — ' + b.L + ' × ' + b.W + ' mm</figcaption>' +
        '<div class="cl-stock" data-bi="' + i + '" style="padding-top:' + ar + '%">' +
        b.placed.map(function (p, j) {
          var st = 'left:' + (p.x / b.L * 100) + '%;top:' + (p.y / b.W * 100) + '%;width:' + (p.l / b.L * 100) + '%;height:' + (p.w / b.W * 100) + '%;--c:' + COLORS[p.ci] + ';--d:' + (j * 70) + 'ms';
          return '<span class="cl-part" style="' + st + '" title="' + esc(p.label) + ' ' + p.l + '×' + p.w + (p.r ? ' (rotated)' : '') + '"><span>' + esc(p.label) + ' <i>' + (p.r ? p.w + '×' + p.l + ' ↻' : p.l + '×' + p.w) + '</i></span></span>';
        }).join('') + '</div></figure>';
    }).join('') || '<p class="pencil">Nothing fits. Either the parts are huge or the boards are shy.</p>';
    Array.prototype.forEach.call(res.querySelectorAll('.cl-stock'), function (s, i) {
      var id = /walnut/i.test(used[i].label) ? 'walnut' : /maple/i.test(used[i].label) ? 'maple' : /cherry/i.test(used[i].label) ? 'cherry' : /pine/i.test(used[i].label) ? 'pine' : /teak/i.test(used[i].label) ? 'teak' : /oak/i.test(used[i].label) ? 'oak' : WC.state.species;
      WC.wood.url(id, 640, 320).then(function (u) { s.style.backgroundImage = 'url("' + u + '")'; });
    });
    WC.sound.saw(Math.min(5, 1 + used.length * 2));
    var rr = res.getBoundingClientRect();
    WC.dust(rr.left + rr.width / 2, rr.top + 30, 30);
  }
  $('#clRun').addEventListener('click', run);
  $('#clExport').addEventListener('click', function () {
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'woodcraft-cutlist.json'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
    WC.toast('Cut list exported. Measure twice, download once.');
  });
  $('#clImportBtn').addEventListener('click', function () { $('#clImport').click(); });
  $('#clImport').addEventListener('change', function (e) {
    var f = e.target.files && e.target.files[0]; if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      try {
        var d = JSON.parse(rd.result);
        if (!Array.isArray(d.stock) || !Array.isArray(d.parts)) throw new Error('shape');
        var clean = function (a) { return a.slice(0, 200).map(function (o) { return { label: String(o.label || 'Item').slice(0, 40), l: Math.max(0, +o.l || 0), w: Math.max(0, +o.w || 0), q: Math.max(0, Math.min(500, Math.round(+o.q || 0))) }; }); };
        data = { kerf: Math.max(0, +d.kerf || 3.2), grain: d.grain !== false, stock: clean(d.stock), parts: clean(d.parts) };
        save(); renderTables(); run(); WC.toast('Cut list imported. Fresh lumber!');
      } catch (err) { WC.toast('That file is more knot than wood — couldn’t read it.'); }
      e.target.value = '';
    };
    rd.readAsText(f);
  });
  renderTables();
})();
