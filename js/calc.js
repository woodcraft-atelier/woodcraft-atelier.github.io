/* Woodcraft Atelier — board-foot / volume calculator + moisture & movement */
(function () {
  'use strict';
  var WC = window.WC, $ = WC.$;
  var units = 'imp', order = [];
  try { order = JSON.parse(localStorage.getItem('wc-order') || '[]'); if (!Array.isArray(order)) order = []; } catch (e) { order = []; }
  var el = {
    t: $('#bfThick'), w: $('#bfWidth'), l: $('#bfLength'), q: $('#bfQty'), sp: $('#bfSpecies'), pr: $('#bfPrice'), waste: $('#bfWaste'), cur: $('#bfCur'),
    out: $('#bfOut'), viz: $('#bfViz'), list: $('#bfList'), total: $('#bfTotal')
  };
  WC.speciesOptions(el.sp, 'oak');
  function num(i) { var v = parseFloat(i.value); return isFinite(v) && v > 0 ? v : 0; }
  function fmt(n, d) { return n.toLocaleString(undefined, { minimumFractionDigits: d == null ? 2 : d, maximumFractionDigits: d == null ? 2 : d }); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var M3_PER_BF = 0.00235973722;

  function compute() {
    var T = num(el.t), W = num(el.w), L = num(el.l), Q = Math.max(1, Math.round(num(el.q)) || 1);
    var bf, m3;
    if (units === 'imp') { bf = T * W * L / 12 * Q; m3 = bf * M3_PER_BF; }
    else { m3 = (T / 1000) * (W / 1000) * L * Q; bf = m3 / M3_PER_BF; }
    var sp = WC.speciesById(el.sp.value), waste = Math.min(100, num(el.waste)) / 100;
    var price = num(el.pr), cost = (units === 'imp' ? bf : m3) * price, costW = cost * (1 + waste);
    var kg = m3 * sp.density;
    return { T: T, W: W, L: L, Q: Q, bf: bf, m3: m3, ft3: m3 * 35.3147, cost: cost, costW: costW, kg: kg, sp: sp, waste: waste };
  }
  function update() {
    var r = compute(), c = el.cur.value || '$';
    if (!r.T || !r.W || !r.L) {
      el.out.innerHTML = 'Enter a thickness, width and length. A board with zero dimensions is just a rumour.';
      el.viz.innerHTML = ''; return;
    }
    el.out.innerHTML =
      '<span class="big-num">' + fmt(r.bf) + '</span> board feet · <b>' + fmt(r.m3, 4) + '</b> m³ · <b>' + fmt(r.ft3, 3) + '</b> ft³<br>' +
      'Cost: <b>' + esc(c) + fmt(r.cost) + '</b> · with ' + Math.round(r.waste * 100) + '% waste: <b>' + esc(c) + fmt(r.costW) + '</b><br>' +
      'Approx. weight in ' + esc(r.sp.name) + ': <b>' + fmt(r.kg, 1) + ' kg</b> (' + fmt(r.kg * 2.20462, 1) + ' lb)' +
      (r.kg > 50 ? ' — bring a friend. Or two.' : r.kg < 2 ? ' — pocket-sized lumber.' : '');
    // visual: stacked boards
    var n = Math.min(r.Q, 8), html = '';
    var thick = units === 'imp' ? r.T * 25.4 : r.T;
    var h = Math.max(6, Math.min(26, thick * .5));
    for (var i = 0; i < n; i++) html += '<span class="bf-board" style="height:' + h + 'px;--o:' + (i * 7) + 'px"></span>';
    if (r.Q > n) html += '<span class="bf-more pencil">+' + (r.Q - n) + ' more</span>';
    el.viz.innerHTML = html;
    WC.wood.url(el.sp.value, 640, 320).then(function (u) { Array.prototype.forEach.call(el.viz.querySelectorAll('.bf-board'), function (b, k) { b.style.backgroundImage = 'url("' + u + '")'; b.style.backgroundPosition = (k * 97) + 'px ' + (k * 41) + 'px'; }); });
  }
  function setUnits(u, convert) {
    if (u === units) return;
    if (convert) {
      var T = num(el.t), W = num(el.w), L = num(el.l), p = num(el.pr);
      if (u === 'met') { el.t.value = +(T * 25.4).toFixed(1); el.w.value = +(W * 25.4).toFixed(1); el.l.value = +(L * 0.3048).toFixed(3); el.pr.value = +(p / M3_PER_BF).toFixed(0); }
      else { el.t.value = +(T / 25.4).toFixed(3); el.w.value = +(W / 25.4).toFixed(2); el.l.value = +(L / 0.3048).toFixed(2); el.pr.value = +(p * M3_PER_BF).toFixed(2); }
    }
    units = u;
    $('#bfThickU').textContent = u === 'imp' ? 'in' : 'mm';
    $('#bfWidthU').textContent = u === 'imp' ? 'in' : 'mm';
    $('#bfLengthU').textContent = u === 'imp' ? 'ft' : 'm';
    $('#bfPriceU').textContent = u === 'imp' ? 'per board foot' : 'per m³';
    Array.prototype.forEach.call($('#bfUnits').querySelectorAll('[role=radio]'), function (b) { var on = b.dataset.u === u; b.setAttribute('aria-checked', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; });
    update();
  }
  Array.prototype.forEach.call($('#bfUnits').querySelectorAll('[role=radio]'), function (b) { b.addEventListener('click', function () { setUnits(b.dataset.u, true); }); });
  WC.radioKeys($('#bfUnits'));
  $('#bfUnits [data-u="met"]').tabIndex = -1;
  el.sp.addEventListener('change', function () {
    var s = WC.speciesById(el.sp.value);
    el.pr.value = units === 'imp' ? s.price : Math.round(s.price / M3_PER_BF);
    WC.sound.knock(s.density); update();
  });
  ['t', 'w', 'l', 'q', 'pr', 'waste', 'cur'].forEach(function (k) { el[k].addEventListener('input', update); });

  function saveOrder() { try { localStorage.setItem('wc-order', JSON.stringify(order)); } catch (e) {} }
  function renderOrder() {
    var c = el.cur.value || '$';
    if (!order.length) { el.list.innerHTML = '<li class="empty-li pencil">Nothing on the cart yet. The lumber yard misses you.</li>'; el.total.textContent = ''; return; }
    var tbf = 0, tm3 = 0, tc = 0;
    el.list.innerHTML = order.map(function (o, i) {
      tbf += o.bf; tm3 += o.m3; tc += o.costW;
      return '<li><span>' + o.q + ' × ' + esc(o.dims) + ' ' + esc(o.name) + ' — ' + fmt(o.bf) + ' bf · ' + esc(o.cur) + fmt(o.costW) + '</span> <button type="button" class="x" data-i="' + i + '" aria-label="Remove line ' + (i + 1) + '">✕</button></li>';
    }).join('');
    el.total.innerHTML = 'Total: <b>' + fmt(tbf) + ' bf</b> · <b>' + fmt(tm3, 4) + ' m³</b> · <b>' + esc(c) + fmt(tc) + '</b> (incl. waste)';
  }
  $('#bfAdd').addEventListener('click', function () {
    var r = compute(); if (!r.bf) { WC.toast('That board has no size. Even sawdust has dimensions.'); return; }
    var dims = units === 'imp' ? r.T + '″ × ' + r.W + '″ × ' + r.L + '′' : r.T + ' × ' + r.W + ' mm × ' + r.L + ' m';
    order.push({ q: r.Q, dims: dims, name: r.sp.name, bf: r.bf, m3: r.m3, costW: r.costW, cur: el.cur.value || '$' });
    saveOrder(); renderOrder(); WC.sound.hammer();
  });
  el.list.addEventListener('click', function (e) { var x = e.target.closest('.x'); if (!x) return; order.splice(+x.dataset.i, 1); saveOrder(); renderOrder(); });
  $('#bfClear').addEventListener('click', function () { order = []; saveOrder(); renderOrder(); WC.sound.saw(2); });

  /* ---------- moisture ---------- */
  var m = { sp: $('#mcSpecies'), w: $('#mcWidth'), u: $('#mcUnit'), cut: $('#mcCut'), t: $('#mcTemp'), r1: $('#mcRH1'), r2: $('#mcRH2'), out: $('#mcOut'), panel: $('#mcPanel') };
  WC.speciesOptions(m.sp, 'oak');
  /* USDA Wood Handbook Hailwood–Joseph EMC, T in °F, h 0..1 */
  function emc(tc, rh) {
    var T = tc * 9 / 5 + 32, h = Math.max(0.01, Math.min(0.98, rh / 100));
    var W = 330 + 0.452 * T + 0.00415 * T * T;
    var K = 0.791 + 0.000463 * T - 0.000000844 * T * T;
    var K1 = 6.34 + 0.000775 * T - 0.0000935 * T * T;
    var K2 = 1.09 + 0.0284 * T - 0.0000904 * T * T;
    var Kh = K * h;
    return 1800 / W * (Kh / (1 - Kh) + (K1 * Kh + 2 * K1 * K2 * Kh * Kh) / (1 + K1 * Kh + K1 * K2 * Kh * Kh));
  }
  WC.emc = emc;
  function moist() {
    var s = WC.speciesById(m.sp.value), W = parseFloat(m.w.value) || 0, t = parseFloat(m.t.value);
    if (!isFinite(t)) t = 24;
    var a = +m.r1.value, b = +m.r2.value;
    $('#mcRH1v').textContent = a + '%'; $('#mcRH2v').textContent = b + '%';
    var e1 = emc(t, a), e2 = emc(t, b), S = m.cut.value === 'flat' ? s.shrinkT : s.shrinkR, FSP = 28;
    var dmc = Math.min(FSP, e2) - Math.min(FSP, e1);
    var dW = W * (S / 100) * dmc / FSP;
    var u = m.u.value, pct = W ? dW / W * 100 : 0;
    var verdict = Math.abs(pct) < 0.5 ? 'Barely breathing — glue it up with confidence.' : Math.abs(pct) < 1.5 ? 'Noticeable. Use buttons, figure-8s or slotted screws for tabletops.' : 'Big movement! Float that panel in a groove with room to grow, or it will crack the frame.';
    m.out.innerHTML = 'Equilibrium moisture: <b>' + emc(t, a).toFixed(1) + '%</b> (dry) → <b>' + e2.toFixed(1) + '%</b> (humid)<br>' +
      'A ' + W + ' ' + u + ' ' + (m.cut.value === 'flat' ? 'flat-sawn' : 'quarter-sawn') + ' ' + esc(s.name) + ' board will ' + (dW >= 0 ? 'swell' : 'shrink') + ' about <span class="big-num">' + Math.abs(dW).toFixed(u === 'mm' ? 2 : 3) + ' ' + u + '</span> (' + Math.abs(pct).toFixed(2) + '%).<br>' +
      '<em>' + verdict + '</em><br><span class="tiny">Tip: quarter-sawn moves ~' + Math.round((1 - s.shrinkR / s.shrinkT) * 100) + '% less across the width than flat-sawn in this species.</span>';
    var scale = Math.max(-1, Math.min(1, pct / 2.5));
    m.panel.style.setProperty('--grow', (1 + scale * 0.12).toFixed(3));
    m.panel.classList.toggle('tight', scale > 0.55);
    WC.wood.url(m.sp.value, 640, 320).then(function (u2) { m.panel.style.backgroundImage = 'url("' + u2 + '")'; });
  }
  ['sp', 'w', 'u', 'cut', 't', 'r1', 'r2'].forEach(function (k) { m[k].addEventListener('input', moist); m[k].addEventListener('change', moist); });

  update(); renderOrder(); moist();
})();
