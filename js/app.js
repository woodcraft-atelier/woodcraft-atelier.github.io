/* Woodcraft Atelier — core: veneer engine wiring, modes, drawers, dust, lamp, jokes, easter eggs */
(function () {
  'use strict';
  var WC = window.WC;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  WC.$ = $; WC.$$ = $$;
  WC.reduced = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var root = document.documentElement;
  var state = { species: 'oak', mode: 'workshop', view: 'home', prevSpecies: 'oak', burl: false };
  try {
    var saved = JSON.parse(localStorage.getItem('wc-prefs') || '{}');
    ['species', 'mode', 'prevSpecies', 'burl'].forEach(function (k) { if (saved[k] != null) state[k] = saved[k]; });
  } catch (e) {}
  if (!WC.wood.P[state.species]) state.species = 'oak';
  WC.state = state;
  function save() { try { localStorage.setItem('wc-prefs', JSON.stringify(state)); } catch (e) {} }
  WC.density = function () { return WC.speciesById(state.species).density || 600; };
  WC.speciesOptions = function (sel, value, extra) {
    sel.innerHTML = '';
    WC.SPECIES.forEach(function (s) { var o = document.createElement('option'); o.value = s.id; o.textContent = s.name; sel.appendChild(o); });
    sel.value = value || 'oak';
  };

  /* ---------- toast ---------- */
  var toastT;
  WC.toast = function (msg, ms) {
    var t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, ms || 2800);
  };

  /* ---------- sawdust ---------- */
  var dustC = $('#dust'), dctx = dustC.getContext('2d'), parts = [], dRaf = 0;
  var dpr = Math.min(2, window.devicePixelRatio || 1);
  function sizeDust() { dustC.width = Math.round(innerWidth * dpr); dustC.height = Math.round(innerHeight * dpr); }
  sizeDust(); addEventListener('resize', sizeDust);
  function lighten(rgb, k) {
    var m = /rgb\((\d+),(\d+),(\d+)\)/.exec(rgb); if (!m) return rgb;
    return 'rgb(' + [1, 2, 3].map(function (i) { var v = +m[i]; return Math.round(v + (255 - v) * k); }).join(',') + ')';
  }
  WC.dust = function (x, y, n, o) {
    o = o || {};
    if (WC.reduced) n = Math.min(n, 3);
    var base = o.color || WC.wood.avg(state.species);
    for (var i = 0; i < n; i++) {
      parts.push({ x: x, y: y, vx: (Math.random() - 0.5) * (o.spread || 3.2), vy: -Math.random() * (o.up || 2.6), r: 0.8 + Math.random() * 2.3,
        life: 1, rot: Math.random() * 6, col: Math.random() < 0.5 ? base : lighten(base, 0.35), curl: o.curl && Math.random() < 0.45 });
    }
    if (parts.length > 700) parts.splice(0, parts.length - 700);
    if (!dRaf) dRaf = requestAnimationFrame(tickDust);
  };
  function tickDust() {
    dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dctx.clearRect(0, 0, innerWidth, innerHeight);
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.vy += 0.11; p.vx *= 0.985; p.vy *= 0.985; p.x += p.vx + Math.sin(p.rot) * 0.15; p.y += p.vy; p.life -= 0.011; p.rot += 0.08;
      if (p.life <= 0 || p.y > innerHeight + 10) { parts.splice(i, 1); continue; }
      dctx.globalAlpha = Math.min(1, p.life * 1.6);
      if (p.curl) {
        dctx.save(); dctx.translate(p.x, p.y); dctx.rotate(p.rot);
        dctx.strokeStyle = p.col; dctx.lineWidth = 1.6; dctx.beginPath(); dctx.arc(0, 0, p.r * 2.4, 0, 4.6); dctx.stroke(); dctx.restore();
      } else { dctx.fillStyle = p.col; dctx.fillRect(p.x, p.y, p.r, p.r * 0.7); }
    }
    dctx.globalAlpha = 1;
    dRaf = parts.length ? requestAnimationFrame(tickDust) : 0;
  }

  /* ---------- screws & joints on boards ---------- */
  WC.screw = function (el) {
    if (!el || el.dataset.screwed) return;
    el.dataset.screwed = '1';
    var small = el.offsetWidth && el.offsetWidth < 260;
    ['tl', 'tr', 'bl', 'br'].forEach(function (pos, k) {
      if (small && (k === 1 || k === 2)) return;
      var s = document.createElement('i');
      s.className = 'screw ' + pos; s.setAttribute('aria-hidden', 'true');
      s.style.setProperty('--rot', Math.round(Math.random() * 180) + 'deg');
      el.appendChild(s);
    });
  };

  /* ---------- veneer (species) ---------- */
  function applyTexture(id) {
    var alt = WC.wood.isDark(id) ? 'maple' : 'walnut';
    return Promise.all([WC.wood.url(id, 640, 320), WC.wood.endURL(id, 96), WC.wood.url(alt, 320, 160), WC.wood.endURL(id, 320)]).then(function (u) {
      root.style.setProperty('--wood', 'url("' + u[0] + '")');
      root.style.setProperty('--wood-alt', 'url("' + u[2] + '")');
      root.style.setProperty('--wood-c', WC.wood.avg(id));
      root.dataset.ink = WC.wood.isDark(id) ? 'light' : 'dark';
      root.dataset.species = id;
      var logo = $('#logoEnd'); if (logo) logo.src = u[1];
      var he = $('#heroEndImg'); if (he) he.src = u[3];
      var cap = $('#heroEndCap'); if (cap) cap.textContent = WC.speciesById(id).name + ' · end grain';
      var tc = $('meta[name="theme-color"]'); if (tc) tc.setAttribute('content', WC.wood.avg(id));
      document.dispatchEvent(new CustomEvent('wc:species', { detail: id }));
    });
  }
  var planing = false;
  WC.setSpecies = function (id, animate) {
    if (!WC.wood.P[id]) id = 'oak';
    var has = !!root.style.getPropertyValue('--wood');
    if (id === state.species && has) return;
    state.species = id; save(); updateSpeciesBar();
    if (!animate || WC.reduced || !has || planing) { applyTexture(id); return; }
    planing = true;
    WC.wood.url(id, 640, 320).then(function (u) {
      var pl = $('#planer'), tex = $('#planerTex');
      tex.style.backgroundImage = 'url("' + u + '")';
      pl.classList.remove('run'); void pl.offsetWidth; pl.classList.add('run');
      WC.sound.plane();
      var t0 = performance.now();
      var iv = setInterval(function () {
        var k = (performance.now() - t0) / 800;
        if (k > 1) { clearInterval(iv); return; }
        WC.dust(k * innerWidth, innerHeight * (0.2 + Math.random() * 0.6), 4, { curl: true, color: WC.wood.avg(id), up: 4, spread: 5 });
      }, 40);
      setTimeout(function () { applyTexture(id); }, 780);
      setTimeout(function () { pl.classList.remove('run'); planing = false; }, 1500);
    });
  };

  function setRadio(group, el) {
    $$('[role=radio]', group).forEach(function (b) { var on = b === el; b.setAttribute('aria-checked', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; });
  }
  WC.setRadio = setRadio;
  function radioKeys(group) {
    group.addEventListener('keydown', function (e) {
      var items = $$('[role=radio]', group), i = items.indexOf(document.activeElement), n = null;
      if (i < 0) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % items.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + items.length) % items.length;
      else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = items.length - 1;
      if (n !== null) { e.preventDefault(); items[n].focus(); items[n].click(); }
    });
  }
  WC.radioKeys = radioKeys;

  var bar = $('#speciesBar');
  function buildSpeciesBar() {
    bar.innerHTML = '';
    var list = WC.SWITCHER.slice();
    if (state.burl) list.push('burl');
    list.forEach(function (id) {
      var sp = WC.speciesById(id);
      var b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'radio'); b.dataset.sp = id; b.className = 'sp-chip'; b.dataset.quiet = '1';
      b.setAttribute('aria-label', sp.name); b.title = sp.name;
      var img = document.createElement('img'); img.alt = ''; img.width = 30; img.height = 30;
      WC.wood.endURL(id, 60).then(function (u) { img.src = u; });
      b.appendChild(img);
      b.addEventListener('click', function () {
        WC.sound.knock(sp.density);
        if (state.mode === 'japanese' || state.mode === 'rustic') { state.mode = 'workshop'; root.dataset.mode = 'workshop'; setRadio($('#modeBar'), $('#modeBar [data-mode="workshop"]')); }
        WC.setSpecies(id, true);
      });
      bar.appendChild(b);
    });
    updateSpeciesBar();
  }
  function updateSpeciesBar() {
    var el = $('[data-sp="' + state.species + '"]', bar);
    setRadio(bar, el);
    if (!el) { var f = $('[role=radio]', bar); if (f) f.tabIndex = 0; }
  }
  radioKeys(bar);

  /* ---------- modes ---------- */
  var lamp = $('#lamp');
  WC.setMode = function (m, user) {
    var prev = state.mode;
    state.mode = m; root.dataset.mode = m;
    setRadio($('#modeBar'), $('#modeBar [data-mode="' + m + '"]'));
    var special = function (x) { return x === 'japanese' || x === 'rustic'; };
    if (special(m) && !special(prev) && state.species !== 'hinoki' && state.species !== 'rustic') state.prevSpecies = state.species;
    if (m === 'japanese') WC.setSpecies('hinoki', user);
    else if (m === 'rustic') WC.setSpecies('rustic', user);
    else if (state.species === 'hinoki' || state.species === 'rustic') WC.setSpecies(state.prevSpecies || 'oak', user);
    lamp.classList.toggle('on', m === 'night');
    save();
    if (user) {
      var msg = { workshop: 'Shutters open. Daylight is the best finish inspector.', night: 'Lamp on. Mind the chisels — move your cursor to aim the light.', japanese: 'Hinoki & shoji. Pull-stroke saws only, please.', rustic: 'Cabin mode: knotty pine, cast-iron nails, faint smell of woodsmoke.' }[m];
      WC.toast(msg);
      if (m === 'night') WC.sound.creak(); else WC.sound.knock(WC.density());
    }
  };
  $$('#modeBar [role=radio]').forEach(function (b) { b.dataset.quiet = '1'; b.addEventListener('click', function () { if (b.dataset.mode !== state.mode) WC.setMode(b.dataset.mode, true); }); });
  radioKeys($('#modeBar'));
  var lampRaf = 0, lx = innerWidth / 2, ly = innerHeight / 3;
  function moveLamp(e) {
    var p = e.touches ? e.touches[0] : e; if (!p) return;
    lx = p.clientX; ly = p.clientY;
    if (!lampRaf) lampRaf = requestAnimationFrame(function () { lampRaf = 0; lamp.style.setProperty('--mx', lx + 'px'); lamp.style.setProperty('--my', ly + 'px'); });
  }
  addEventListener('pointermove', moveLamp, { passive: true });
  addEventListener('touchmove', moveLamp, { passive: true });

  /* ---------- sound toggle ---------- */
  var st = $('#soundToggle');
  st.dataset.quiet = '1';
  function syncSound() { st.setAttribute('aria-checked', WC.audio.isMuted() ? 'false' : 'true'); }
  st.addEventListener('click', function () { WC.audio.setMuted(!WC.audio.isMuted()); syncSound(); if (!WC.audio.isMuted()) WC.sound.knock(WC.density()); WC.toast(WC.audio.isMuted() ? 'Shhh. The workshop is silent now.' : 'Sound on. Every click is a knock on wood.'); });
  syncSound();

  /* ---------- generic wooden switches ---------- */
  WC.switchVal = function (el) { return el.getAttribute('aria-checked') === 'true'; };
  $$('.switch').forEach(function (s) {
    if (s.id === 'soundToggle') return;
    s.dataset.quiet = '1';
    s.addEventListener('click', function () { s.setAttribute('aria-checked', WC.switchVal(s) ? 'false' : 'true'); WC.sound.tap(WC.density()); s.dispatchEvent(new CustomEvent('wc:toggle', { bubbles: true })); });
  });

  /* ---------- navigation (drawers) ---------- */
  var VIEWS = ['home', 'species', 'calc', 'cutlist', 'joinery', 'finish', 'marimba', 'puzzles', 'carve', 'about'];
  var cab = $('#cabinet'), navT = $('#navToggle');
  function closeNav() { cab.classList.remove('open'); navT.setAttribute('aria-expanded', 'false'); }
  WC.go = function (v, o) {
    o = o || {};
    if (VIEWS.indexOf(v) < 0) v = 'home';
    var cur = state.view;
    $$('.drawer').forEach(function (d) {
      var on = d.dataset.view === v;
      d.classList.toggle('open', on);
      if (on) d.setAttribute('aria-current', 'page'); else d.removeAttribute('aria-current');
    });
    $$('.view').forEach(function (s) {
      var on = s.id === 'view-' + v;
      if (on) { s.hidden = false; s.classList.remove('enter'); void s.offsetWidth; s.classList.add('enter'); }
      else s.hidden = true;
    });
    state.view = v;
    if (location.hash.slice(1) !== v && !(v === 'home' && !location.hash)) {
      if (history.pushState) history.pushState(null, '', '#' + v); else location.hash = v;
    }
    if (!o.initial && cur !== v) WC.sound.drawer(true);
    closeNav();
    if (!o.initial) {
      var h = $('#view-' + v + ' h1, #view-' + v + ' h2');
      if (h) { h.setAttribute('tabindex', '-1'); try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); } }
      var main = $('#main'), top = main.getBoundingClientRect().top + scrollY - 12;
      if (scrollY > top) window.scrollTo({ top: Math.max(0, top), behavior: WC.reduced ? 'auto' : 'smooth' });
    }
    document.dispatchEvent(new CustomEvent('wc:view', { detail: v }));
  };
  $$('.drawer').forEach(function (d) { d.dataset.quiet = '1'; d.addEventListener('click', function () { WC.go(d.dataset.view); }); });
  document.addEventListener('click', function (e) {
    var g = e.target.closest('[data-go]');
    if (g) { g.dataset.quiet = '1'; WC.go(g.dataset.go); }
  });
  function fromHash() { var v = location.hash.slice(1) || 'home'; if (v !== state.view) WC.go(v, { fromHash: true }); }
  addEventListener('hashchange', fromHash);
  addEventListener('popstate', fromHash);
  navT.addEventListener('click', function () {
    var open = !cab.classList.contains('open');
    cab.classList.toggle('open', open); navT.setAttribute('aria-expanded', open ? 'true' : 'false');
    WC.sound.drawer(open);
    if (open) { var a = $('.drawer.open', cab) || $('.drawer', cab); if (a) a.focus(); }
  });
  navT.dataset.quiet = '1';
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && cab.classList.contains('open')) { closeNav(); navT.focus(); } });
  document.addEventListener('pointerdown', function (e) { if (cab.classList.contains('open') && !cab.contains(e.target) && !navT.contains(e.target)) closeNav(); });

  /* ---------- global knock on wooden buttons ---------- */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('button, .knock');
    if (!el || el.closest('[data-quiet]') || el.disabled) return;
    WC.sound.knock(WC.density());
    if (e.detail) WC.dust(e.clientX, e.clientY, 7);
  });

  /* ---------- jokes ---------- */
  var jIdx = 0;
  function nextJoke() { jIdx = (jIdx + 1 + Math.floor(Math.random() * (WC.JOKES.length - 1))) % WC.JOKES.length; return WC.JOKES[jIdx]; }
  WC.joke = nextJoke;
  var jl = $('#jokeLine');
  $('#jokeBtn').addEventListener('click', function () { jl.classList.remove('pop'); void jl.offsetWidth; jl.textContent = nextJoke(); jl.classList.add('pop'); });
  setInterval(function () { var f = $('#footJoke'); if (f && !document.hidden) f.textContent = nextJoke(); }, 14000);

  var kb = $('#knockBtn'); kb.dataset.quiet = '1';
  kb.addEventListener('click', function (e) {
    var d = WC.density(), r = kb.getBoundingClientRect();
    [0, 170, 340].forEach(function (t, k) { setTimeout(function () { WC.sound.knock(d, 1 - k * 0.15); WC.dust(r.left + r.width / 2, r.top + 6, 6); kb.classList.remove('thud'); void kb.offsetWidth; kb.classList.add('thud'); }, t); });
    setTimeout(function () { WC.toast('Knock knock. Who\u2019s there? ' + WC.speciesById(state.species).name.split(' ').pop() + '. (Density ' + d + ' kg/m\u00b3 — hear the pitch?)'); }, 520);
  });

  /* ---------- easter eggs ---------- */
  var knocks = [];
  $('#logo').dataset.quiet = '1';
  $('#logo').addEventListener('click', function (e) {
    var now = Date.now();
    knocks = knocks.filter(function (t) { return now - t < 1400; }); knocks.push(now);
    WC.sound.knock(WC.density());
    var r = this.getBoundingClientRect(); WC.dust(r.left + 30, r.top + 30, 8);
    if (knocks.length >= 3) {
      knocks = [];
      if (!state.burl) { state.burl = true; save(); buildSpeciesBar(); }
      WC.setSpecies('burl', true);
      WC.toast('Secret unlocked: Golden Walnut Burl! Burls are a tree\u2019s happy little accidents — like this easter egg.', 4200);
      setTimeout(WC.sound.win, 900);
    } else if (knocks.length === 1 && state.view !== 'home') WC.go('home');
  });
  var konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'], kpos = 0, typed = '';
  document.addEventListener('keydown', function (e) {
    var k = e.key && e.key.length === 1 ? e.key.toLowerCase() : e.key;
    kpos = k === konami[kpos] ? kpos + 1 : (k === konami[0] ? 1 : 0);
    if (kpos === konami.length) { kpos = 0; woodpecker(); }
    if (e.key && e.key.length === 1 && !/input|textarea|select/i.test((e.target.tagName || ''))) {
      typed = (typed + e.key.toLowerCase()).slice(-8);
      if (typed.slice(-7) === 'termite') { WC.toast('Termite detected! Don\u2019t worry — this site is made of bytes, not bites.'); typed = ''; }
    }
  });
  function woodpecker() {
    var w = $('#woodpecker');
    w.classList.remove('fly'); void w.offsetWidth; w.classList.add('fly');
    var n = 0, iv = setInterval(function () { WC.sound.knock(900 + Math.random() * 200, 0.6); if (++n > 14) clearInterval(iv); }, 90);
    WC.toast('Woodpecker mode: 20 pecks per second, zero headaches. (They have shock-absorbing skulls!)', 3800);
  }

  /* ---------- init ---------- */
  var y = $('#year'); if (y) y.textContent = new Date().getFullYear();
  buildSpeciesBar();
  root.dataset.mode = state.mode;
  setRadio($('#modeBar'), $('#modeBar [data-mode="' + state.mode + '"]'));
  lamp.classList.toggle('on', state.mode === 'night');
  applyTexture(state.species);
  $$('.board').forEach(WC.screw);
  WC.go(location.hash.slice(1) || 'home', { initial: true });
  if (WC.reduced) root.classList.add('reduced');
})();
