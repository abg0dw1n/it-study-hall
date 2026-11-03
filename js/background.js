// Animated page background: a fixed canvas behind the page, drawn in the current
// theme's colors. The choice is per device ('itsh:bg'): galaxy (default), grid,
// circuit, rain, net or off. Pauses when the tab is hidden; static for visitors
// who prefer reduced motion. Content panels stay opaque so text is unaffected.
(function () {
  var KEY = 'itsh:bg', DEFAULT = 'galaxy';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function rgba(hex, a) { var n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  // Light themes need stronger marks than dark ones to read against a pale page.
  var LIGHT_BOOST = 2.4;
  function rg(hex, a) { return rgba(hex, Math.min(1, a * (cols && !cols.dark ? LIGHT_BOOST : 1))); }

  var STYLES = {
    galaxy: {
      name: 'Galaxy', blurb: 'Twinkling stars over a soft nebula',
      init: function (w, h, p) {
        var dpr = Math.min(1.5, window.devicePixelRatio || 1), neb = document.createElement('canvas');
        neb.width = Math.ceil(w * dpr); neb.height = Math.ceil(h * dpr);
        var c = neb.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
        var d = p.dark, m = Math.max(w, h);
        c.fillStyle = p.bg; c.fillRect(0, 0, w, h);
        function blob(x, y, r, col, a) { var g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rg(col, a)); g.addColorStop(1, rg(col, 0)); c.fillStyle = g; c.fillRect(0, 0, w, h); }
        blob(w * .2, h * .25, m * .55, p.a1, d ? .16 : .12); blob(w * .85, h * .7, m * .5, p.a2, d ? .14 : .10); blob(w * .6, h * .1, m * .3, p.a1, d ? .07 : .05);
        c.save(); c.translate(w / 2, h / 2); c.rotate(-.45); c.scale(1, .2);
        var g = c.createRadialGradient(0, 0, 0, 0, 0, m * .7); g.addColorStop(0, rg(p.text, d ? .08 : .05)); g.addColorStop(1, rg(p.text, 0));
        c.fillStyle = g; c.beginPath(); c.arc(0, 0, m * .7, 0, 6.283); c.fill(); c.restore();
        var stars = [], n = Math.min(260, Math.round(w * h / 4200));
        for (var i = 0; i < n; i++) stars.push({ x: Math.random(), y: Math.random(), r: .5 + Math.random() * 1.4, ph: Math.random() * 6.28, sp: .0006 + Math.random() * .0016 });
        return { neb: neb, stars: stars };
      },
      draw: function (c, t, w, h, p, S) {
        c.drawImage(S.neb, 0, 0, w, h);
        for (var i = 0; i < S.stars.length; i++) {
          var s = S.stars[i], a = .3 + .7 * (.5 + .5 * Math.sin(t * s.sp + s.ph));
          c.fillStyle = rg(s.r > 1.1 ? p.a1 : p.text, a * (p.dark ? .95 : .6));
          c.beginPath(); c.arc(s.x * w, s.y * h, s.r, 0, 6.283); c.fill();
        }
      },
    },
    grid: {
      name: 'Neon grid', blurb: 'A perspective floor scrolling to a glowing horizon',
      init: function () { return {}; },
      draw: function (c, t, w, h, p) {
        var hz = h * .55, vx = w / 2, a = p.dark ? 1 : .8;
        var g = c.createRadialGradient(vx, hz, 0, vx, hz, w * .55);
        g.addColorStop(0, rg(p.a1, p.dark ? .3 : .24)); g.addColorStop(.4, rg(p.a2, p.dark ? .08 : .06)); g.addColorStop(1, rg(p.a1, 0));
        c.fillStyle = g; c.fillRect(0, 0, w, h);
        c.strokeStyle = rg(p.a1, .26 * a); c.lineWidth = 1;
        for (var i = -24; i <= 24; i++) { c.beginPath(); c.moveTo(vx, hz); c.lineTo(vx + i * w * .14, h); c.stroke(); }
        var off = (t * .00018) % 1;
        for (var k = 0; k < 14; k++) { var f = (k + off) / 14, y = hz + (h - hz) * f * f; c.strokeStyle = rg(p.a1, (.08 + .24 * f) * a); c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
        c.strokeStyle = rg(p.a2, .45 * a); c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, hz); c.lineTo(w, hz); c.stroke();
      },
    },
    circuit: {
      name: 'Circuit board', blurb: 'Traces with data pulses travelling along them',
      init: function (w, h) {
        var gs = 28, cols = Math.ceil(w / gs), rows = Math.ceil(h / gs), tr = [], n = Math.min(120, Math.round(w * h / 11000));
        for (var i = 0; i < n; i++) {
          var x = Math.floor(rnd(0, cols)), y = Math.floor(rnd(0, rows)), dx = [1, -1, 0, 0][i % 4], dy = dx ? 0 : (i % 2 ? 1 : -1), pts = [[x * gs, y * gs]], segs = Math.floor(rnd(3, 7));
          for (var s = 0; s < segs; s++) {
            var L = Math.floor(rnd(2, 7)); x += dx * L; y += dy * L; pts.push([x * gs, y * gs]);
            if (dx) { dx = 0; dy = Math.random() < .5 ? 1 : -1; } else { dy = 0; dx = Math.random() < .5 ? 1 : -1; }
          }
          var seg = [], tot = 0;
          for (var j = 1; j < pts.length; j++) { var l = Math.abs(pts[j][0] - pts[j - 1][0]) + Math.abs(pts[j][1] - pts[j - 1][1]); seg.push(l); tot += l; }
          tr.push({ pts: pts, seg: seg, tot: tot, off: Math.random(), sp: rnd(.00004, .00011) });
        }
        return { tr: tr };
      },
      draw: function (c, t, w, h, p, S) {
        var d = p.dark; c.lineWidth = 1.2; c.lineJoin = 'round';
        S.tr.forEach(function (tr, i) {
          c.strokeStyle = rg(i % 3 ? p.a1 : p.a2, d ? .17 : .2); c.beginPath();
          tr.pts.forEach(function (q, j) { j ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }); c.stroke();
          c.fillStyle = rg(p.a1, d ? .4 : .35);
          [tr.pts[0], tr.pts[tr.pts.length - 1]].forEach(function (q) { c.beginPath(); c.arc(q[0], q[1], 2.6, 0, 6.283); c.fill(); });
          var pos = ((t * tr.sp + tr.off) % 1) * tr.tot, j = 0;
          while (j < tr.seg.length - 1 && pos > tr.seg[j]) { pos -= tr.seg[j]; j++; }
          var A = tr.pts[j], B = tr.pts[j + 1], f = pos / tr.seg[j], px = A[0] + (B[0] - A[0]) * f, py = A[1] + (B[1] - A[1]) * f;
          var g = c.createRadialGradient(px, py, 0, px, py, 10); g.addColorStop(0, rg(p.a1, d ? .9 : .75)); g.addColorStop(1, rg(p.a1, 0));
          c.fillStyle = g; c.beginPath(); c.arc(px, py, 10, 0, 6.283); c.fill();
        });
      },
    },
    rain: {
      name: 'Code rain', blurb: 'Faint columns of characters falling and fading',
      init: function (w, h) {
        var a = [], n = Math.ceil(w / 16);
        for (var i = 0; i < n; i++) a.push({ y: rnd(-h * .2, h * 1.1), sp: rnd(.5, 1.6), len: rnd(10, 24) });
        return { cols: a, fresh: true, noClear: true };
      },
      draw: function (c, t, w, h, p, S) {
        var ch = '01{}[]<>/\\=+;$#abcdefxyz';
        if (S.fresh) { c.fillStyle = p.bg; c.fillRect(0, 0, w, h); S.fresh = false; }
        c.fillStyle = rgba(p.bg, .16); c.fillRect(0, 0, w, h);
        c.font = '13px "JetBrains Mono",monospace';
        S.cols.forEach(function (k, i) {
          k.y += k.sp * 1.1; if (k.y - k.len * 16 > h) { k.y = rnd(-120, 0); k.sp = rnd(.5, 1.6); }
          var x = i * 16 + 2;
          c.fillStyle = rg(p.a1, p.dark ? .6 : .5); c.fillText(ch[Math.floor(Math.random() * ch.length)], x, k.y);
          c.fillStyle = rg(p.text, p.dark ? .45 : .35); c.fillText(ch[Math.floor(Math.random() * ch.length)], x, k.y - 16);
        });
      },
    },
    net: {
      name: 'Constellation network', blurb: 'Drifting nodes that link up as they pass close',
      init: function (w, h) {
        var n = Math.min(110, Math.round(w * h / 12000)), a = [];
        for (var i = 0; i < n; i++) a.push({ x: rnd(0, w), y: rnd(0, h), vx: rnd(-.15, .15), vy: rnd(-.15, .15), r: rnd(1.2, 2.6), k: Math.random() < .2 });
        return { n: a };
      },
      draw: function (c, t, w, h, p, S) {
        var N = S.n, d = p.dark, R = Math.max(110, w * .13);
        N.forEach(function (a) { a.x += a.vx; a.y += a.vy; if (a.x < 0 || a.x > w) a.vx *= -1; if (a.y < 0 || a.y > h) a.vy *= -1; });
        c.lineWidth = 1;
        for (var i = 0; i < N.length; i++) for (var j = i + 1; j < N.length; j++) {
          var dx = N[i].x - N[j].x, dy = N[i].y - N[j].y, D = Math.sqrt(dx * dx + dy * dy);
          if (D < R) { c.strokeStyle = rg(N[i].k || N[j].k ? p.a2 : p.a1, (1 - D / R) * (d ? .42 : .38)); c.beginPath(); c.moveTo(N[i].x, N[i].y); c.lineTo(N[j].x, N[j].y); c.stroke(); }
        }
        N.forEach(function (a) { c.fillStyle = rg(a.k ? p.a2 : p.a1, d ? .85 : .7); c.beginPath(); c.arc(a.x, a.y, a.r, 0, 6.283); c.fill(); });
      },
    },
  };
  var ORDER = ['galaxy', 'grid', 'circuit', 'rain', 'net'];
  var LIST = [{ id: 'off', name: 'None', blurb: 'Plain background' }].concat(ORDER.map(function (id) { return { id: id, name: STYLES[id].name, blurb: STYLES[id].blurb }; }));

  var cv = document.createElement('canvas');
  cv.className = 'bg-canvas'; cv.setAttribute('aria-hidden', 'true');
  // Inline so the canvas stays behind the page even if the stylesheet is stale or slow to load.
  cv.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none;display:block';
  var ctx = cv.getContext('2d'), w = 0, h = 0, raf = 0, cols = null, S = null, cur = null;

  function pref() { try { var v = localStorage.getItem(KEY); return v === 'off' || STYLES[v] ? v : DEFAULT; } catch (e) { return DEFAULT; } }
  function readColors() {
    var s = getComputedStyle(document.documentElement);
    function v(n, d) { var x = s.getPropertyValue(n).trim(); return /^#[0-9a-f]{6}$/i.test(x) ? x : d; }
    var dark = document.documentElement.dataset.theme !== 'light';
    cols = { dark: dark, bg: v('--bg', '#221f22'), a1: dark ? v('--azure', '#ffd866') : v('--azure-text', '#9a5500'), a2: v('--accent-2', '#ff6188'), text: v('--text', '#fcfcfa') };
  }
  function frame(t) {
    if (!cur) return;
    if (!S.noClear) { ctx.fillStyle = cols.bg; ctx.fillRect(0, 0, w, h); }
    STYLES[cur].draw(ctx, t, w, h, cols, S);
  }
  function setup() {
    var dpr = Math.min(1.5, window.devicePixelRatio || 1);
    w = window.innerWidth; h = window.innerHeight;
    cv.width = Math.ceil(w * dpr); cv.height = Math.ceil(h * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    readColors(); S = STYLES[cur].init(w, h, cols);
    if (S.noClear) { frame(0); }
    if (reduce) { for (var i = 0; i < (S.noClear ? 90 : 1); i++) frame(i * 40 + 1000); } else frame(performance.now());
  }
  function loop(t) { frame(t); raf = requestAnimationFrame(loop); }
  function start() { if (!raf && !reduce && cur && !document.hidden) raf = requestAnimationFrame(loop); }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }

  function apply() {
    var p = pref(); stop();
    document.documentElement.dataset.bg = p;
    if (p === 'off') { cur = null; if (cv.parentNode) cv.parentNode.removeChild(cv); }
    else { cur = p; if (!cv.parentNode) document.body.insertBefore(cv, document.body.firstChild); setup(); start(); }
    document.dispatchEvent(new CustomEvent('bgchange', { detail: { bg: p } }));
  }

  window.Background = {
    list: LIST, pref: pref,
    set: function (id) {
      try { if (id === DEFAULT || !(id === 'off' || STYLES[id])) localStorage.removeItem(KEY); else localStorage.setItem(KEY, id); } catch (e) { /* ignore */ }
      apply();
    },
  };

  function init() {
    apply();
    var tm; window.addEventListener('resize', function () { clearTimeout(tm); tm = setTimeout(function () { if (cur) { stop(); setup(); start(); } }, 150); });
    document.addEventListener('themechange', function () { if (cur) { stop(); setup(); start(); } });
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  }
  if (document.body) init(); else document.addEventListener('DOMContentLoaded', init);
})();
