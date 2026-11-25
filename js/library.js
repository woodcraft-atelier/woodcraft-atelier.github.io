/* Woodcraft Atelier — species library */
(function () {
  'use strict';
  var WC = window.WC, $ = WC.$;
  var grid = $('#speciesGrid'), detail = $('#spDetail'), search = $('#spSearch'), sort = $('#spSort'), empty = $('#spEmpty');
  var built = false, cards = {};

  function dots(n, max, label) {
    var s = '<span class="dots" role="img" aria-label="' + label + ': ' + n + ' of ' + max + '">';
    for (var i = 1; i <= max; i++) s += '<i class="' + (i <= n ? 'on' : '') + '"></i>';
    return s + '</span>';
  }
  var SUS = ['', 'Threatened — use certified/reclaimed', 'Use with care', 'Readily available', 'Fast-renewing'];
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function build() {
    if (built) return; built = true;
    WC.SPECIES.forEach(function (s) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'sp-card'; b.dataset.id = s.id; b.dataset.quiet = '1';
      b.setAttribute('aria-label', s.name + ', Janka ' + s.janka + ' lbf. Open details.');
      b.innerHTML =
        '<span class="sp-swatch"><img alt="" width="320" height="140"><span class="sp-end"><img alt="" width="70" height="70"></span></span>' +
        '<span class="sp-label"><span class="sp-name">' + esc(s.name) + '</span><span class="sp-latin">' + esc(s.latin) + '</span>' +
        '<span class="sp-stats"><span><b>' + s.janka + '</b> lbf</span><span><b>' + s.density + '</b> kg/m³</span></span>' +
        '<span class="sp-row"><span class="tiny">Workability</span>' + dots(s.work, 5, 'Workability') + '</span>' +
        '<span class="sp-row"><span class="tiny">Sustainability</span>' + dots(s.sustain, 4, 'Sustainability') + '</span></span>';
      var imgs = b.querySelectorAll('img');
      WC.wood.url(s.id, 320, 140, { seed: 3 }).then(function (u) { imgs[0].src = u; });
      WC.wood.endURL(s.id, 70).then(function (u) { imgs[1].src = u; });
      b.addEventListener('click', function () { WC.sound.knock(s.density); open(s.id); });
      cards[s.id] = b; grid.appendChild(b);
    });
    chart();
    render();
  }

  function render() {
    var q = (search.value || '').trim().toLowerCase(), key = sort.value;
    var list = WC.SPECIES.filter(function (s) {
      if (!q) return true;
      var hay = [s.name, s.latin, s.origin, s.uses.join(' '), s.workNote, s.fact].join(' ').toLowerCase();
      if (q === 'hard') return s.janka >= 1300;
      if (q === 'soft') return s.janka < 700;
      return q.split(/\s+/).every(function (w) { return hay.indexOf(w) >= 0; });
    });
    list.sort(function (a, b) { return key === 'name' ? a.name.localeCompare(b.name) : b[key] - a[key]; });
    WC.SPECIES.forEach(function (s) { cards[s.id].hidden = true; });
    list.forEach(function (s) { cards[s.id].hidden = false; grid.appendChild(cards[s.id]); });
    empty.hidden = list.length > 0;
  }

  function open(id) {
    var s = WC.speciesById(id);
    detail.hidden = false;
    detail.innerHTML =
      '<button type="button" class="btn small ghost sp-close" aria-label="Close details">✕</button>' +
      '<div class="sp-d-grid"><div class="sp-d-art"><img class="sp-d-face" alt="Face grain of ' + esc(s.name) + '" width="480" height="220"><img class="sp-d-end" alt="End grain of ' + esc(s.name) + '" width="160" height="160"></div>' +
      '<div><h3 class="carved">' + esc(s.name) + '</h3><p class="pencil">' + esc(s.latin) + ' · ' + esc(s.origin) + '</p>' +
      '<dl class="spec">' +
      '<dt>Janka hardness</dt><dd>' + s.janka + ' lbf (' + Math.round(s.janka * 4.448) + ' N)</dd>' +
      '<dt>Density (dried)</dt><dd>' + s.density + ' kg/m³ · ' + (s.density * 0.06243).toFixed(1) + ' lb/ft³</dd>' +
      '<dt>Shrinkage green→oven-dry</dt><dd>Tangential ' + s.shrinkT + '% · Radial ' + s.shrinkR + '% · T/R ' + (s.shrinkT / s.shrinkR).toFixed(1) + '</dd>' +
      '<dt>Workability</dt><dd>' + dots(s.work, 5, 'Workability') + ' ' + esc(s.workNote) + '</dd>' +
      '<dt>Common uses</dt><dd>' + s.uses.map(esc).join(' · ') + '</dd>' +
      '<dt>Sustainability</dt><dd>' + dots(s.sustain, 4, 'Sustainability') + ' <b>' + SUS[s.sustain] + '.</b> ' + esc(s.sustainNote) + '</dd>' +
      '<dt>Indicative price</dt><dd>~$' + s.price + ' per board foot (fictional shop list)</dd>' +
      '</dl><p class="fact">🪵 ' + esc(s.fact) + '</p>' +
      '<div class="btn-row"><button type="button" class="btn small" data-veneer="' + s.id + '">Re-veneer the workshop in ' + esc(s.name.split(' (')[0]) + '</button>' +
      '<button type="button" class="btn small ghost" data-knock="' + s.id + '">Knock on it</button></div></div></div>';
    WC.wood.url(s.id, 480, 220, { seed: 9 }).then(function (u) { var i = detail.querySelector('.sp-d-face'); if (i) i.src = u; });
    WC.wood.endURL(s.id, 160).then(function (u) { var i = detail.querySelector('.sp-d-end'); if (i) i.src = u; });
    WC.screw(detail);
    detail.scrollIntoView({ behavior: WC.reduced ? 'auto' : 'smooth', block: 'nearest' });
    var h = detail.querySelector('h3'); h.tabIndex = -1; try { h.focus({ preventScroll: true }); } catch (e) {}
  }
  detail.addEventListener('click', function (e) {
    var v = e.target.closest('[data-veneer]'), k = e.target.closest('[data-knock]'), c = e.target.closest('.sp-close');
    if (v) { v.dataset.quiet = '1'; if (WC.state.mode === 'japanese' || WC.state.mode === 'rustic') WC.setMode('workshop'); WC.setSpecies(v.dataset.veneer, true); }
    if (k) { k.dataset.quiet = '1'; var s = WC.speciesById(k.dataset.knock); WC.sound.knock(s.density); setTimeout(function () { WC.sound.knock(s.density, .8); }, 160); }
    if (c) { detail.hidden = true; var card = cards[(detail.querySelector('[data-veneer]') || {}).dataset ? detail.querySelector('[data-veneer]').dataset.veneer : '']; if (card) card.focus(); }
  });

  function chart() {
    var el = $('#jankaChart'), max = 3100;
    var list = WC.SPECIES.slice().sort(function (a, b) { return b.janka - a.janka; });
    el.innerHTML = list.map(function (s) {
      return '<div class="jk-row"><span class="jk-name">' + esc(s.name.split(' (')[0]) + '</span><span class="jk-track"><span class="jk-bar" data-sp="' + s.id + '" style="--w:' + (s.janka / max * 100).toFixed(1) + '%"></span></span><span class="jk-val">' + s.janka + '</span></div>';
    }).join('');
    Array.prototype.forEach.call(el.querySelectorAll('.jk-bar'), function (b) {
      WC.wood.url(b.dataset.sp, 320, 140, { seed: 3 }).then(function (u) { b.style.backgroundImage = 'url("' + u + '")'; });
    });
  }

  search.addEventListener('input', render);
  sort.addEventListener('change', render);
  document.addEventListener('wc:view', function (e) { if (e.detail === 'species') build(); });
  if (WC.state.view === 'species') build();
})();
