// Galaxy background: a fixed canvas behind the page (stars + nebula) drawn in the
// current theme's colors. Can be switched off under Account → Appearance
// (stored as 'itsh:bg' = 'off'). Pauses when the tab is hidden; static for
// visitors who prefer reduced motion.
(function () {
  var KEY = 'itsh:bg';
  var cv = document.createElement('canvas');
  cv.className = 'galaxy-bg';
  cv.setAttribute('aria-hidden', 'true');
  var ctx = cv.getContext('2d');
  var neb = document.createElement('canvas'); // pre-drawn nebula layer
  var w = 0, h = 0, stars = [], raf = 0, cols = null;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function enabled() { try { return localStorage.getItem(KEY) !== 'off'; } catch (e) { return true; } }
  function rgba(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  function readColors() {
    var s = getComputedStyle(document.documentElement);
    function v(n, d) { var x = s.getPropertyValue(n).trim(); return /^#[0-9a-f]{6}$/i.test(x) ? x : d; }
    cols = {
      dark: document.documentElement.dataset.theme !== 'light',
      bg: v('--bg', '#221f22'), a1: v('--azure', '#ffd866'), a2: v('--accent-2', '#ff6188'), text: v('--text', '#fcfcfa'),
    };
  }
  function buildNebula() {
    if (!w) return;
    var dpr = Math.min(1.5, window.devicePixelRatio || 1);
    neb.width = Math.ceil(w * dpr); neb.height = Math.ceil(h * dpr);
    var c = neb.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    var d = cols.dark;
    c.fillStyle = cols.bg; c.fillRect(0, 0, w, h);
    function blob(x, y, r, col, a) {
      var g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
      c.fillStyle = g; c.fillRect(0, 0, w, h);
    }
    var m = Math.max(w, h);
    blob(w * .2, h * .25, m * .55, cols.a1, d ? .16 : .12);
    blob(w * .85, h * .7, m * .5, cols.a2, d ? .14 : .10);
    blob(w * .6, h * .1, m * .3, cols.a1, d ? .07 : .05);
    c.save(); c.translate(w / 2, h / 2); c.rotate(-.45); c.scale(1, .2);
    var g = c.createRadialGradient(0, 0, 0, 0, 0, m * .7);
    g.addColorStop(0, rgba(cols.text, d ? .08 : .05)); g.addColorStop(1, rgba(cols.text, 0));
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, m * .7, 0, 6.283); c.fill(); c.restore();
  }
  function resize() {
    var dpr = Math.min(1.5, window.devicePixelRatio || 1);
    w = window.innerWidth; h = window.innerHeight;
    cv.width = Math.ceil(w * dpr); cv.height = Math.ceil(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = [];
    var n = Math.min(260, Math.round(w * h / 4200));
    for (var i = 0; i < n; i++) stars.push({ x: Math.random(), y: Math.random(), r: .5 + Math.random() * 1.4, ph: Math.random() * 6.28, sp: .0006 + Math.random() * .0016 });
    readColors(); buildNebula(); draw(performance.now());
  }
  function draw(t) {
    if (!w) return;
    ctx.drawImage(neb, 0, 0, w, h);
    var d = cols.dark;
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i], a = .3 + .7 * (.5 + .5 * Math.sin(t * s.sp + s.ph));
      ctx.fillStyle = rgba(s.r > 1.1 ? cols.a1 : cols.text, a * (d ? .95 : .6));
      ctx.beginPath(); ctx.arc(s.x * w, s.y * h, s.r, 0, 6.283); ctx.fill();
    }
  }
  function loop(t) { draw(t); raf = requestAnimationFrame(loop); }
  function start() { if (!raf && !reduce && !document.hidden) raf = requestAnimationFrame(loop); }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }

  function apply() {
    var on = enabled();
    document.documentElement.classList.toggle('has-galaxy', on);
    if (on) {
      if (!cv.parentNode) document.body.insertBefore(cv, document.body.firstChild);
      resize(); start();
    } else { stop(); if (cv.parentNode) cv.parentNode.removeChild(cv); }
  }

  window.Galaxy = {
    enabled: enabled,
    set: function (on) {
      try { if (on) localStorage.removeItem(KEY); else localStorage.setItem(KEY, 'off'); } catch (e) { /* ignore */ }
      apply();
    },
  };

  function init() {
    apply();
    var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(function () { if (enabled()) resize(); }, 150); });
    document.addEventListener('themechange', function () { if (enabled()) { readColors(); buildNebula(); draw(performance.now()); } });
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : (enabled() && start()); });
  }
  if (document.body) init(); else document.addEventListener('DOMContentLoaded', init);
})();
