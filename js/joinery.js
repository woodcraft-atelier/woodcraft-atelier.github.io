/* Woodcraft Atelier — joinery encyclopedia with animated SVG assembly */
(function () {
  'use strict';
  var WC = window.WC, $ = WC.$;
  var NS = 'http://www.w3.org/2000/svg';

  function dovetailEdge(x0, t, y0, y1, n, a, b) {
    var pts = [[x0 + t, y0]], step = (y1 - y0) / n;
    for (var i = 0; i < n; i++) {
      var c = y0 + step * (i + 0.5);
      pts.push([x0 + t, c - b], [x0, c - a], [x0, c + a], [x0 + t, c + b]);
    }
    pts.push([x0 + t, y1]);
    return pts;
  }
  function poly(pts) { return 'M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L') + ' Z'; }
  function dovetail(rect) {
    var e = dovetailEdge(170, 50, 40, 220, 3, rect ? 15 : 22, 15);
    var A = poly([[60, 40]].concat(e).concat([[60, 220]]));
    var B = poly(e.concat([[340, 220], [340, 40]]));
    return { A: A, B: B };
  }
  var DT = dovetail(false), BX = dovetail(true);

  /* part: { d, f: 'a'|'b'|'dark'|'light'|'metal', dx, dy, z, delay } */
  var J = [
    { id: 'mt', name: 'Mortise & tenon', strength: 5, diff: 3, tools: 'Mortise chisel, tenon saw, marking gauge, mallet', uses: 'Table legs & aprons, chairs, doors, timber frames',
      desc: 'A tongue (tenon) on one rail glued into a matching hole (mortise) in the post. Thousands of years old and still the backbone of furniture. A drawbore peg pulls it tight forever.',
      joke: 'Their relationship works because one of them always makes room.',
      parts: [
        { d: 'M220 20 H290 V240 H220 Z', f: 'a' }, { d: 'M220 108 H290 V152 H220 Z', f: 'dark' },
        { d: 'M40 100 H220 V110 H290 V150 H220 V160 H40 Z', f: 'b', dx: -150, delay: 0 },
        { d: 'M255 124 m-7 0 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0', f: 'light', dy: -150, delay: 500 }
      ] },
    { id: 'dt', name: 'Through dovetail', strength: 5, diff: 5, tools: 'Dovetail saw, chisels, marking knife, 1:6 / 1:8 gauge', uses: 'Drawers, chests, boxes, carcase corners',
      desc: 'Flared tails interlock with pins so the joint cannot be pulled apart in one direction — the mark of hand-cut craftsmanship. Hardwoods usually 1:8, softwoods 1:6 slope.',
      joke: 'Tails you win, pins you also win.',
      parts: [{ d: DT.A, f: 'a' }, { d: DT.B, f: 'b', z: true, dy: -40 }] },
    { id: 'box', name: 'Box (finger) joint', strength: 4, diff: 2, tools: 'Table saw + finger-joint jig, or router table', uses: 'Boxes, crates, drawers, toy chests',
      desc: 'Square interlocking fingers with lots of long-grain glue surface. Easy with a jig and wonderfully graphic in contrasting woods.',
      joke: 'Five fingers, zero thumbs, all glue.',
      parts: [{ d: BX.A, f: 'a' }, { d: BX.B, f: 'b', dx: 120 }] },
    { id: 'lap', name: 'Half-lap', strength: 3, diff: 2, tools: 'Backsaw, router plane or dado stack', uses: 'Frames, workbench stretchers, face frames, cross-braces',
      desc: 'Half the thickness is removed from each piece so they overlap flush. Big glue area, very forgiving.',
      joke: 'Each of them gave 50%. Healthy.',
      parts: [{ d: 'M40 120 H200 V140 H240 V160 H40 Z', f: 'a' }, { d: 'M200 120 H360 V160 H240 V140 H200 Z', f: 'b', dy: -100 }] },
    { id: 'bridle', name: 'Bridle joint', strength: 4, diff: 3, tools: 'Tenon saw, coping saw, chisel', uses: 'Frame corners, trestle legs, garden furniture',
      desc: 'An open mortise (slot) straddles a tenon — like a mortise & tenon that shows its workings. Strong, quick to cut, easy to clamp.',
      joke: 'Like a mortise & tenon that forgot to close the door.',
      parts: [{ d: 'M60 64 H340 V116 H60 Z', f: 'b', dy: -120 }, { d: 'M170 40 H190 V140 H210 V40 H230 V240 H170 Z', f: 'a', after: true }] },
    { id: 'dado', name: 'Dado (housing)', strength: 3, diff: 2, tools: 'Router + straightedge, dado blade, or plough plane', uses: 'Bookcase shelves, cabinet dividers, stair stringers',
      desc: 'A flat-bottomed groove across the grain that a shelf drops into. Supports weight mechanically even before the glue sets.',
      joke: 'The shelf finally found its groove.',
      parts: [{ d: 'M40 140 H180 V160 H220 V140 H360 V200 H40 Z', f: 'a' }, { d: 'M180 20 H220 V160 H180 Z', f: 'b', dy: -110 }] },
    { id: 'rabbet', name: 'Rabbet (rebate)', strength: 2, diff: 1, tools: 'Rabbet plane, router, table saw', uses: 'Cabinet backs, box bottoms, picture frames, drawer sides',
      desc: 'An L-shaped step along an edge or end. Locates parts and hides end grain; usually reinforced with glue and nails or screws.',
      joke: 'Britain calls it a rebate. America says rabbet. The wood just calls it home.',
      parts: [{ d: 'M40 140 H300 V160 H340 V200 H40 Z', f: 'a' }, { d: 'M300 20 H340 V160 H300 Z', f: 'b', dx: 70, dy: -70 }] },
    { id: 'tg', name: 'Tongue & groove', strength: 3, diff: 2, tools: 'Matched router bits, combination plane', uses: 'Flooring, panelling, wide panels, cabin walls',
      desc: 'A tongue on one edge slides into a groove on the next. Aligns boards and lets them move with the seasons when left unglued.',
      joke: 'A long-term relationship with room for seasonal mood swings.',
      parts: [{ d: 'M40 100 H200 V120 H180 V140 H200 V160 H40 Z', f: 'a' }, { d: 'M200 100 H360 V160 H200 V140 H180 V120 H200 Z', f: 'b', dx: 110 }] },
    { id: 'dowel', name: 'Dowel joint', strength: 3, diff: 2, tools: 'Doweling jig, brad-point drill bits, dowel centres', uses: 'Face frames, edge joints, knock-down furniture',
      desc: 'Round wooden pins glued into aligned holes in both parts. Precise drilling is everything — that is what the jig is for.',
      joke: 'Two holes walk into a bar. The dowel holds them together.',
      parts: [{ d: 'M40 90 H200 V170 H40 Z', f: 'a' }, { d: 'M168 108 H232 V118 H168 Z M168 142 H232 V152 H168 Z', f: 'light', dy: -110, delay: 0 }, { d: 'M200 90 H360 V170 H200 Z', f: 'b', dx: 120, delay: 450 }] },
    { id: 'biscuit', name: 'Biscuit joint', strength: 2, diff: 1, tools: 'Biscuit (plate) joiner', uses: 'Panel glue-ups, carcase alignment, mitred frames',
      desc: 'A compressed beech oval swells with glue in matching crescent slots. Mostly for alignment — the plate joiner does the hard part.',
      joke: 'Contains no chocolate. We checked. Twice.',
      parts: [{ d: 'M40 90 H200 V170 H40 Z', f: 'a' }, { d: 'M200 130 m-30 0 a30 11 0 1 0 60 0 a30 11 0 1 0 -60 0', f: 'light', dy: -110, delay: 0 }, { d: 'M200 90 H360 V170 H200 Z', f: 'b', dx: 120, delay: 450 }] },
    { id: 'miter', name: 'Splined miter', strength: 3, diff: 3, tools: 'Miter saw / shooting board, spline jig', uses: 'Picture frames, boxes, mitred casework',
      desc: 'Two 45° ends meet so no end grain shows. End grain glues poorly, so a contrasting spline (key) adds strength and a little drama.',
      joke: 'Two angles that met halfway — 45° each.',
      parts: [{ d: 'M60 60 H340 L280 120 H60 Z', f: 'a' }, { d: 'M340 60 V240 H280 V120 Z', f: 'b', dx: 70, dy: 70, delay: 0 }, { d: 'M296 86 L322 112 L314 120 L288 94 Z', f: 'dark2', dx: -80, dy: -80, delay: 500 }] },
    { id: 'scarf', name: 'Scarf joint', strength: 3, diff: 3, tools: 'Rip saw, block plane, scarf jig', uses: 'Lengthening beams, boat planking, oars, timber framing',
      desc: 'Long tapered faces (often 1:8) join boards end-to-end to make a longer one, turning weak end grain into strong long-grain glue surface.',
      joke: 'When your board is too short and your wallet too thin.',
      parts: [{ d: 'M20 110 H250 L130 150 H20 Z', f: 'a' }, { d: 'M250 110 H380 V150 H130 Z', f: 'b', dx: 90, dy: -40 }] },
    { id: 'butt', name: 'Butt joint (+ screws)', strength: 1, diff: 1, tools: 'Saw, drill, screws — or pocket-hole jig', uses: 'Shop furniture, quick boxes, construction',
      desc: 'Two square ends simply meet. Weak on its own (end grain hates glue) so add screws, nails, pocket screws or corner blocks.',
      joke: 'The joint equivalent of "it\u2019s fine, it\u2019ll hold".',
      parts: [{ d: 'M40 120 H220 V180 H40 Z', f: 'a' }, { d: 'M220 40 H280 V240 H220 Z', f: 'b', dx: 90, delay: 0 }, { d: 'M290 140 H210 V146 H290 Z M290 160 H210 V166 H290 Z', f: 'metal', dx: 120, delay: 500 }] },
    { id: 'kanawa', name: 'Kanawa tsugi (Japanese)', strength: 5, diff: 5, tools: 'Nokogiri pull saw, nomi chisels, sumitsubo ink line', uses: 'Temple beams, splicing posts, master-class showing off',
      desc: 'A traditional Japanese splice locked with a wedge (sen) driven through the middle — no glue, no nails, centuries of service.',
      joke: 'No glue, no nails, no problem. Just several decades of practice.',
      parts: [{ d: 'M20 100 H200 V120 H230 V160 H20 Z', f: 'a' }, { d: 'M380 100 H170 V140 H200 V160 H380 Z', f: 'b', dx: 110, delay: 0 }, { d: 'M193 92 H207 V168 H193 Z', f: 'dark2', dy: -120, delay: 600 }] }
  ];

  var list = $('#jointList'), stage = $('#jointStage'), info = $('#jointInfo'), title = $('#jointTitle'), loopS = $('#jointLoop');
  var cur = 0, svg, exploded = true, loopT = 0, timers = [];
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function stars(n) { var s = ''; for (var i = 0; i < 5; i++) s += i < n ? '●' : '○'; return s; }

  J.forEach(function (j, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.setAttribute('role', 'option'); b.className = 'jl-item'; b.id = 'jl-' + j.id; b.dataset.quiet = '1';
    b.innerHTML = '<span class="carved">' + esc(j.name) + '</span><span class="tiny">strength ' + stars(j.strength) + '</span>';
    b.addEventListener('click', function () { WC.sound.tap(WC.density()); select(i, true); });
    list.appendChild(b);
  });
  list.addEventListener('keydown', function (e) {
    var n = null;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = (cur + 1) % J.length;
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = (cur - 1 + J.length) % J.length;
    if (e.key === 'Home') n = 0; if (e.key === 'End') n = J.length - 1;
    if (n !== null) { e.preventDefault(); select(n, true); list.children[n].focus(); }
  });

  function patterns() {
    var defs = '<defs>' + ['a', 'b'].map(function (k) {
      return '<pattern id="jp-' + k + '" patternUnits="userSpaceOnUse" width="400" height="200"><rect width="400" height="200" fill="' + (k === 'a' ? '#c89a62' : '#6a4630') + '"/><image class="jimg-' + k + '" width="400" height="200" preserveAspectRatio="none"/></pattern>';
    }).join('') + '<pattern id="jp-pencil" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="rgba(40,40,46,.35)" stroke-width="1.2"/></pattern>' +
      '<filter id="jshadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#000" flood-opacity=".45"/></filter></defs>';
    return defs;
  }
  var FILL = { a: 'url(#jp-a)', b: 'url(#jp-b)', dark: '#1c0f07', dark2: '#2a1a12', light: '#ecd2a0', metal: '#b9b9bd' };
  function render() {
    var j = J[cur];
    var html = '<svg class="joint-svg exploded" viewBox="0 0 400 260" role="img" aria-label="Animated drawing of the ' + esc(j.name) + '">' + patterns();
    html += '<g class="pencil-marks" aria-hidden="true"><path d="M30 250 H370" stroke="rgba(50,50,56,.4)" stroke-dasharray="3 5"/><text x="34" y="245" class="pm">✎ A — ' + esc(WC.speciesById(sA()).name.split(' (')[0]) + '</text><text x="366" y="245" text-anchor="end" class="pm">B — ' + esc(WC.speciesById(sB()).name.split(' (')[0]) + '</text></g>';
    j.parts.forEach(function (p) {
      var mv = p.dx || p.dy || p.z;
      html += '<g class="jp' + (mv ? ' mv' : '') + (p.z ? ' z' : '') + '" style="--dx:' + (p.dx || 0) + 'px;--dy:' + (p.dy || 0) + 'px;--delay:' + (p.delay || 0) + 'ms">' +
        '<path d="' + p.d + '" fill="' + FILL[p.f] + '" fill-rule="evenodd" stroke="rgba(20,10,4,.8)" stroke-width="1.4" stroke-linejoin="round" filter="url(#jshadow)"/>' +
        (p.f === 'a' || p.f === 'b' ? '<path d="' + p.d + '" fill="none" stroke="rgba(255,240,210,.35)" stroke-width=".8" transform="translate(.8 .8)"/>' : '') + '</g>';
    });
    html += '</svg>';
    stage.innerHTML = html;
    svg = stage.firstChild;
    Promise.all([WC.wood.url(sA(), 640, 320), WC.wood.url(sB(), 640, 320)]).then(function (u) {
      var ia = svg.querySelector('.jimg-a'), ib = svg.querySelector('.jimg-b');
      if (ia) { ia.setAttribute('href', u[0]); ia.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', u[0]); }
      if (ib) { ib.setAttribute('href', u[1]); ib.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', u[1]); }
    });
    title.textContent = j.name;
    info.innerHTML = '<p>' + esc(j.desc) + '</p><dl class="spec compact"><dt>Strength</dt><dd><span class="meter" style="--v:' + j.strength * 20 + '%"></span> ' + j.strength + '/5</dd><dt>Difficulty</dt><dd><span class="meter warm" style="--v:' + j.diff * 20 + '%"></span> ' + j.diff + '/5</dd><dt>Tools</dt><dd>' + esc(j.tools) + '</dd><dt>Best for</dt><dd>' + esc(j.uses) + '</dd></dl><p class="pencil joke-small">“' + esc(j.joke) + '”</p>';
    exploded = true;
  }
  function sA() { var s = WC.state.species; return s === 'burl' ? 'walnut' : s; }
  function sB() { return WC.wood.isDark(sA()) ? 'maple' : 'walnut'; }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function assemble() {
    if (!svg) return; clearTimers();
    svg.classList.remove('exploded'); exploded = false;
    var parts = J[cur].parts.filter(function (p) { return p.dx || p.dy || p.z; });
    parts.forEach(function (p) {
      timers.push(setTimeout(function () {
        if (p.f === 'metal') WC.sound.hammer(); else if (p.f === 'light' || p.f === 'dark2') { WC.sound.chisel(); timers.push(setTimeout(WC.sound.chisel, 140)); } else WC.sound.knock(WC.speciesById(sA()).density);
        var r = svg.getBoundingClientRect(); WC.dust(r.left + r.width / 2, r.top + r.height / 2, 10);
      }, (p.delay || 0) + (WC.reduced ? 0 : 650)));
    });
  }
  function explode() { if (!svg) return; clearTimers(); svg.classList.add('exploded'); exploded = true; WC.sound.drawer(false); }
  function select(i, user) {
    cur = i; clearTimers();
    Array.prototype.forEach.call(list.children, function (b, k) { b.setAttribute('aria-selected', k === i ? 'true' : 'false'); b.tabIndex = k === i ? 0 : -1; });
    list.setAttribute('aria-activedescendant', 'jl-' + J[i].id);
    render();
    if (user) setTimeout(assemble, 260);
  }
  $('#jointAssemble').addEventListener('click', function () { this.dataset.quiet = '1'; if (!exploded) { svg.classList.add('exploded'); setTimeout(assemble, 700); } else assemble(); });
  $('#jointExplode').addEventListener('click', function () { this.dataset.quiet = '1'; explode(); });
  loopS.addEventListener('wc:toggle', function () {
    clearInterval(loopT);
    if (WC.switchVal(loopS)) { loopT = setInterval(function () { if ($('#view-joinery').hidden) return; if (exploded) assemble(); else explode(); }, 2600); }
  });
  document.addEventListener('wc:species', function () { if (svg) { var was = exploded; render(); if (!was) svg.classList.remove('exploded'); } });
  select(0, false);
  document.addEventListener('wc:view', function (e) { if (e.detail === 'joinery' && exploded) setTimeout(assemble, 500); });
})();
