/* Woodcraft Atelier — procedural wood engine
   Periodic (tileable) value-noise + fBm, growth rings, cathedrals, knots,
   pores, medullary rays, ribbon/curl figure, streaks, bamboo strips and
   end-grain cross-sections. Pure canvas, no images. */
(function () {
  'use strict';
  var WC = window.WC = window.WC || {};

  function hash(x, y, s) {
    var h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function noise(x, y, px, py, s) {
    var ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    var x0 = ((ix % px) + px) % px, y0 = ((iy % py) + py) % py;
    var x1 = (x0 + 1) % px, y1 = (y0 + 1) % py;
    var a = hash(x0, y0, s), b = hash(x1, y0, s), c = hash(x0, y1, s), d = hash(x1, y1, s);
    var ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  }
  function fbm(u, v, fx, fy, oct, s) {
    var sum = 0, amp = 0.5, norm = 0;
    for (var i = 0; i < oct; i++) {
      sum += amp * noise(u * fx, v * fy, fx, fy, s + i * 17);
      norm += amp; amp *= 0.5; fx *= 2; fy *= 2;
    }
    return sum / norm;
  }
  function smooth(a, b, x) { var t = (x - a) / (b - a); t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }
  function cl(v) { return v < 0 ? 0 : v > 255 ? 255 : v; }

  /* Visual recipes for each species */
  var P = {
    oak:      { light: [208, 170, 114], dark: [146, 104, 58], rings: 7, warp: 2.6, ringPow: 2.4, ringC: .55, fineC: .18, pores: .45, rays: .55, cath: 1.6, seed: 11 },
    walnut:   { light: [124, 86, 60], dark: [58, 36, 25], rings: 6, warp: 3, ringPow: 1.8, ringC: .55, fineC: .22, pores: .3, cath: 1.2, streak: .35, tint: [6, 0, 8], seed: 23, dk: true },
    cherry:   { light: [206, 142, 100], dark: [162, 94, 60], rings: 8, warp: 2.2, ringPow: 1.6, ringC: .38, fineC: .12, pores: .08, cath: 1.4, streak: .1, gum: .5, seed: 37 },
    maple:    { light: [238, 218, 180], dark: [208, 178, 132], rings: 9, warp: 1.8, ringPow: 1.6, ringC: .32, fineC: .08, pores: .04, cath: .8, rib: .45, ribAxis: 'u', seed: 41 },
    teak:     { light: [190, 140, 84], dark: [118, 78, 40], rings: 6, warp: 2.4, ringPow: 1.7, ringC: .42, fineC: .16, pores: .25, cath: 1, streak: .5, seed: 53 },
    sheesham: { light: [132, 80, 46], dark: [50, 27, 15], rings: 7, warp: 3.4, ringPow: 1.5, ringC: .7, fineC: .2, pores: .35, cath: .8, streak: .55, seed: 61, dk: true },
    mahogany: { light: [146, 66, 40], dark: [90, 34, 20], rings: 5, warp: 1.6, ringPow: 1.4, ringC: .32, fineC: .12, pores: .35, cath: .4, streak: .1, rib: .5, ribAxis: 'v', seed: 71, dk: true },
    pine:     { light: [236, 200, 144], dark: [188, 124, 60], rings: 10, warp: 2.4, ringPow: 3.2, ringC: .85, fineC: .06, pores: 0, knots: 3, knotSize: .07, cath: 2.2, seed: 83 },
    ebony:    { light: [58, 48, 44], dark: [16, 12, 11], rings: 5, warp: 2, ringPow: 1.3, ringC: .5, fineC: .25, pores: .2, cath: .4, streak: .5, seed: 97, dk: true },
    bamboo:   { light: [218, 186, 124], dark: [172, 132, 72], bamboo: true, seed: 101 },
    hinoki:   { light: [240, 220, 186], dark: [214, 184, 140], rings: 13, warp: 1.2, ringPow: 2.6, ringC: .45, fineC: .05, pores: 0, cath: .6, seed: 109 },
    rustic:   { light: [170, 114, 64], dark: [92, 54, 26], rings: 9, warp: 3.2, ringPow: 2.8, ringC: .75, fineC: .14, pores: .1, knots: 5, knotSize: .08, cath: 2.6, streak: .2, weather: .3, seed: 127, dk: true },
    burl:     { light: [182, 116, 64], dark: [74, 40, 20], burl: true, rings: 8, warp: 7, ringPow: 1.6, ringC: .6, fineC: .1, pores: .1, seed: 131, dk: true }
  };

  function bambooPixel(p, u, v, asp, seed, out) {
    var n = 5, sv = v * n, si = Math.floor(sv), sf = sv - si;
    var j = hash(si, 4, seed);
    var L = p.light, D = p.dark, t = 0.15 + j * 0.35;
    var r = L[0] + (D[0] - L[0]) * t, g = L[1] + (D[1] - L[1]) * t, b = L[2] + (D[2] - L[2]) * t;
    var f = noise(u * 4, v * 640, 4, 640, seed + 1), f2 = noise(u * 9, v * 1200, 9, 1200, seed + 2);
    var m = 1 + (f - 0.5) * 0.28 + (f2 - 0.5) * 0.16;
    var dots = noise(u * 160, v * 520, 160, 520, seed + 3);
    if (dots > 0.78) m -= (dots - 0.78) * 1.6;
    if (sf < 0.03 || sf > 0.97) m *= 0.68;
    for (var k = 0; k < 2; k++) {
      var nu = (hash(si, 7 + k, seed) * 0.5 + k * 0.5);
      var du = u - nu; du -= Math.round(du); du *= asp;
      var ad = Math.abs(du);
      if (ad < 0.022) { var e = 1 - ad / 0.022; m *= 1 - 0.32 * e; if (ad < 0.006) m *= 0.85; }
      else if (ad < 0.05) m *= 1 + 0.06 * (1 - (ad - 0.022) / 0.028);
    }
    out[0] = r * m; out[1] = g * m; out[2] = b * m;
  }

  function make(id, w, h, opt) {
    opt = opt || {};
    var p = P[id] || P.oak;
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var g = c.getContext('2d');
    var img = g.createImageData(w, h), d = img.data;
    var seed = p.seed + (opt.seed || 0);
    var asp = w / h, L = p.light, D = p.dark;
    var knots = [], kn = p.knots || 0;
    for (var k = 0; k < kn; k++) knots.push({ u: hash(k, 1, seed), v: hash(k, 2, seed), r: (p.knotSize || .07) * (0.6 + hash(k, 3, seed) * 0.8) });
    var out = [0, 0, 0];
    for (var y = 0; y < h; y++) {
      var v = y / h;
      for (var x = 0; x < w; x++) {
        var u = x / w, i = (y * w + x) * 4, r, gg, b;
        if (p.bamboo) { bambooPixel(p, u, v, asp, seed, out); r = out[0]; gg = out[1]; b = out[2]; }
        else {
          var wv = fbm(u, v, 2, 3, 4, seed) - 0.5;
          var pos = v * p.rings + wv * p.warp;
          if (p.burl) pos += (fbm(u, v, 6, 6, 3, seed + 21) - 0.5) * 9;
          if (p.cath) { var cw = 0.5 + 0.5 * Math.cos(6.2831853 * (u + wv * 0.3)); pos += p.cath * cw * cw * (0.6 + wv); }
          var kd = 9, kr = 0;
          for (var q = 0; q < knots.length; q++) {
            var K = knots[q];
            var du = u - K.u; du -= Math.round(du); du *= asp / 1.7;
            var dv = v - K.v; dv -= Math.round(dv);
            var dd = Math.sqrt(du * du + dv * dv);
            pos += 3.2 * Math.exp(-(dd * dd) / (K.r * K.r * 5));
            if (dd < kd) { kd = dd; kr = K.r; }
          }
          var rr = pos - Math.floor(pos);
          var t = Math.pow(rr, p.ringPow) * p.ringC;
          r = L[0] + (D[0] - L[0]) * t; gg = L[1] + (D[1] - L[1]) * t; b = L[2] + (D[2] - L[2]) * t;
          var f1 = noise(u * 3, v * 220, 3, 220, seed + 5), f2 = noise(u * 6, v * 520, 6, 520, seed + 6);
          var m = 1 + ((f1 - 0.5) * 0.7 + (f2 - 0.5) * 0.5) * p.fineC * 2;
          if (p.pores) { var pn = noise(u * 90, v * 300, 90, 300, seed + 7); if (pn > 0.68) m -= (pn - 0.68) * 1.9 * p.pores; }
          if (p.streak) { var sn = fbm(u, v, 1, 9, 3, seed + 8); m -= smooth(0.55, 0.75, sn) * p.streak * 0.45; }
          if (p.rib) {
            var rv = p.ribAxis === 'u' ? Math.sin(6.2831853 * (u * 46 + wv * 4)) : Math.sin(6.2831853 * (v * 14 + wv * 3 + u * 2));
            m += rv * p.rib * 0.08;
          }
          if (p.gum) { var gn = noise(u * 40, v * 160, 40, 160, seed + 12); if (gn > 0.86) m -= (gn - 0.86) * 3 * p.gum; }
          if (p.burl) { var en = noise(u * 70, v * 70, 70, 70, seed + 22); if (en > 0.8) m -= (en - 0.8) * 3.2; }
          if (p.rays) {
            var rn = noise(u * 26, v * 120, 26, 120, seed + 9);
            if (rn > 0.76) { var ra = Math.min(1, (rn - 0.76) * 5) * p.rays; r += (232 - r) * ra * 0.55; gg += (206 - gg) * ra * 0.55; b += (160 - b) * ra * 0.55; }
          }
          if (kd < kr) {
            var kq = kd / kr;
            var kring = (kq * 6 + noise(u * 40, v * 40, 40, 40, seed + 3) * 0.8) % 1;
            var kt = 0.5 + 0.3 * (1 - kq) + 0.15 * kring;
            r = r * (1 - kt) + D[0] * 0.55 * kt; gg = gg * (1 - kt) + D[1] * 0.5 * kt; b = b * (1 - kt) + D[2] * 0.45 * kt;
            if (kq > 0.85) m *= 0.72;
          }
          m *= 1 + (fbm(u, v, 1, 1, 2, seed + 13) - 0.5) * 0.18;
          r *= m; gg *= m; b *= m;
          if (p.weather) { var gy = (r + gg + b) / 3; r += (gy - r) * p.weather; gg += (gy - gg) * p.weather; b += (gy - b) * p.weather * 0.8; }
          if (p.tint) { r += p.tint[0]; gg += p.tint[1]; b += p.tint[2]; }
        }
        d[i] = cl(r); d[i + 1] = cl(gg); d[i + 2] = cl(b); d[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    return c;
  }

  function endGrain(id, size) {
    var p = P[id] || P.oak;
    var c = document.createElement('canvas'); c.width = size; c.height = size;
    var g = c.getContext('2d'), img = g.createImageData(size, size), d = img.data;
    var seed = p.seed, cx = size / 2, R = size / 2 - 1;
    var rings = (p.rings || 8) * 2.3, L = p.light, D = p.dark;
    var crackA = hash(1, 9, seed) * 6.2831853 - Math.PI;
    var ringPow = p.ringPow || 1.8, ringC = p.ringC || .5;
    for (var y = 0; y < size; y++) {
      for (var x = 0; x < size; x++) {
        var i = (y * size + x) * 4, dx = (x - cx) / R, dy = (y - cx) / R;
        var a = Math.atan2(dy, dx);
        var wob = 1 + 0.035 * Math.sin(3 * a + seed) + 0.025 * Math.sin(5 * a + 1.3);
        var r = Math.sqrt(dx * dx + dy * dy) / wob;
        if (r > 1) { d[i + 3] = 0; continue; }
        var cr, cg, cb, m = 1;
        if (p.bamboo) {
          if (r < 0.6) { d[i + 3] = 0; continue; }
          var bt = (r - 0.6) / 0.4;
          cr = L[0] - 20 * bt; cg = L[1] - 26 * bt; cb = L[2] - 30 * bt;
          var vd = noise(x * 0.45, y * 0.45, 4096, 4096, seed);
          if (vd > 0.72 - bt * 0.12) m -= 0.3;
          if (r > 0.95) m *= 0.6;
          if (r < 0.63) m *= 0.8;
        } else {
          var n = noise(x * 0.05, y * 0.05, 4096, 4096, seed) - 0.5;
          var n2 = noise(x * 0.18, y * 0.18, 4096, 4096, seed + 1) - 0.5;
          var pos = r * rings + n * 0.9 + n2 * 0.2;
          var rr = pos - Math.floor(pos);
          var t = Math.pow(rr, ringPow) * ringC;
          cr = L[0] + (D[0] - L[0]) * t; cg = L[1] + (D[1] - L[1]) * t; cb = L[2] + (D[2] - L[2]) * t;
          if (p.dk || id === 'cherry' || id === 'teak') {
            var sap = smooth(0.74, 0.84, r);
            cr += (226 - cr) * sap * 0.55; cg += (196 - cg) * sap * 0.55; cb += (150 - cb) * sap * 0.55;
          }
          var ray = Math.abs(((a / 6.2831853) * (p.rays ? 70 : 46) + n * 0.4 + 10) % 1 - 0.5);
          if (ray < (p.rays ? 0.05 : 0.02)) m += p.rays ? 0.16 : 0.05;
          var pn = noise(x * 0.7, y * 0.7, 4096, 4096, seed + 2);
          if (pn > 0.78) m -= (pn - 0.78) * (p.pores || 0.1) * 3;
          if (r < 0.03) m *= 0.7;
          var ad = Math.abs(Math.atan2(Math.sin(a - crackA), Math.cos(a - crackA)));
          if (r > 0.08 && r < 0.62 && ad < 0.03 * (1 - r)) m *= 0.35;
          if (r > 0.93) { var bn = noise(x * 0.3, y * 0.9, 4096, 4096, seed + 4); cr = 74 + bn * 30; cg = 52 + bn * 20; cb = 36 + bn * 14; m = 0.75 + bn * 0.35; }
        }
        m *= 1 - 0.14 * Math.pow(r, 4);
        d[i] = cl(cr * m); d[i + 1] = cl(cg * m); d[i + 2] = cl(cb * m); d[i + 3] = r > 0.985 ? Math.round(255 * (1 - r) / 0.015) : 255;
      }
    }
    g.putImageData(img, 0, 0);
    return c;
  }

  var cache = {};
  function toURL(canvas) {
    return new Promise(function (res) {
      if (canvas.toBlob) {
        canvas.toBlob(function (b) { res(b ? URL.createObjectURL(b) : canvas.toDataURL('image/jpeg', 0.9)); }, 'image/jpeg', 0.9);
      } else res(canvas.toDataURL('image/jpeg', 0.9));
    });
  }
  /* ---- real, natural wood photography (generated macro textures) ---- */
  var PHOTO = { oak: 'white-oak', walnut: 'walnut', cherry: 'black-cherry', maple: 'hard-maple', teak: 'teak', sheesham: 'sheesham',
    mahogany: 'mahogany', pine: 'white-pine', ebony: 'gaboon-ebony', bamboo: 'moso-bamboo', hinoki: 'hard-maple', rustic: 'white-pine', burl: 'walnut' };
  var TONE = { hinoki: 'saturate(.55) brightness(1.12) sepia(.15)', rustic: 'sepia(.35) saturate(.85) brightness(.82) contrast(1.08)', burl: 'contrast(1.15) saturate(1.15)' };
  var webp = (function () { try { var c = document.createElement('canvas'); return c.toDataURL('image/webp').indexOf('data:image/webp') === 0; } catch (e) { return false; } })();
  var imgCache = {};
  function loadPhoto(name) {
    if (!imgCache[name]) imgCache[name] = new Promise(function (res, rej) {
      var im = new Image(); im.decoding = 'async';
      im.onload = function () { res(im); }; im.onerror = rej;
      im.src = 'img/' + name + (webp ? '.webp' : '.jpg') + '?v=2';
    });
    return imgCache[name];
  }
  function photoCanvas(id, w, h, opt) {
    var name = PHOTO[id] || 'white-oak';
    return loadPhoto(name).then(function (im) {
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      var g = c.getContext('2d');
      var seed = (opt && opt.seed) || 0, iw = im.naturalWidth, ih = im.naturalHeight;
      /* choose a crop window: keep grain direction (horizontal), vary offset per surface so planks never repeat */
      var scale = Math.max(w / iw, h / ih) * (1.05 + hash(seed, 3, 7) * 0.5);
      var cw = w / scale, ch = h / scale;
      var sx = hash(seed, 1, 5) * Math.max(0, iw - cw), sy = hash(seed, 2, 9) * Math.max(0, ih - ch);
      if (TONE[id] && 'filter' in g) g.filter = TONE[id];
      var flip = hash(seed, 4, 11) > 0.5;
      if (flip) { g.translate(w, 0); g.scale(-1, 1); }
      g.drawImage(im, sx, sy, cw, ch, 0, 0, w, h);
      g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'none';
      /* subtle hand-rubbed finish: soft sheen + micro variance so it reads as a physical plank */
      var sh = g.createLinearGradient(0, 0, w, h);
      sh.addColorStop(0, 'rgba(255,240,215,.10)'); sh.addColorStop(.45, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(0,0,0,.10)');
      g.fillStyle = sh; g.fillRect(0, 0, w, h);
      return c;
    });
  }
  function url(id, w, h, opt) {
    var key = id + ':' + w + 'x' + h + ':' + ((opt && opt.seed) || 0);
    if (!cache[key]) cache[key] = photoCanvas(id, w, h, opt).then(toURL, function () { return toURL(make(id, w, h, opt)); });
    return cache[key];
  }
  function photoURL(id) { return 'img/' + (PHOTO[id] || 'white-oak') + (webp ? '.webp' : '.jpg') + '?v=2'; }
  function endURL(id, size) {
    var key = 'end:' + id + ':' + size;
    if (!cache[key]) {
      cache[key] = new Promise(function (res) {
        var c = endGrain(id, size);
        if (c.toBlob) c.toBlob(function (b) { res(b ? URL.createObjectURL(b) : c.toDataURL()); }, 'image/png');
        else res(c.toDataURL());
      });
    }
    return cache[key];
  }
  function avg(id) {
    var p = P[id] || P.oak, t = 0.3;
    return 'rgb(' + [0, 1, 2].map(function (k) { return Math.round(p.light[k] + (p.dark[k] - p.light[k]) * t); }).join(',') + ')';
  }

  WC.wood = { P: P, photo: photoURL, preload: function () { Object.keys(PHOTO).forEach(function (k) { loadPhoto(PHOTO[k]).catch(function () {}); }); }, make: make, endGrain: endGrain, url: url, endURL: endURL, avg: avg, isDark: function (id) { return !!(P[id] && P[id].dk); }, noise: noise, hash: hash };
})();
