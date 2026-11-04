// Animated page background: a fixed canvas behind the page, drawn in the current
// theme's colors. The choice is per device ('itsh:bg'): galaxy (default), grid, circuit,
// rain, net, aurora, globe, terrain, tunnel, streaks or off. Pauses when the tab is hidden; static for visitors
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
    aurora: {
      name: 'Aurora', blurb: 'Slow ribbons of light drifting across the page',
      init: function () {
        var r = [];
        for (var i = 0; i < 4; i++) r.push({ y: .22 + i * .17, f1: rnd(.0014, .0028), f2: rnd(.004, .008), a1: rnd(.07, .12), a2: rnd(.02, .05), sp: rnd(.00012, .00028) * (i % 2 ? -1 : 1), th: rnd(.07, .12), k: i % 2 });
        return { r: r };
      },
      draw: function (c, t, w, h, p, S) {
        var d = p.dark;
        S.r.forEach(function (q, i) {
          var col = q.k ? p.a2 : p.a1, top = [], bot = [], x;
          for (x = 0; x <= w + 24; x += 24) {
            var cy = q.y * h + Math.sin(x * q.f1 + t * q.sp + i * 2) * h * q.a1 + Math.sin(x * q.f2 - t * q.sp * 1.7) * h * q.a2;
            var th = h * q.th * (.65 + .35 * Math.sin(x * .003 + t * q.sp * .8 + i));
            top.push([x, cy - th]); bot.push([x, cy + th]);
          }
          [1, .62, .32].forEach(function (sc, n) {
            var g = c.createLinearGradient(0, (q.y - q.a1 - q.a2 - q.th) * h, 0, (q.y + q.a1 + q.a2 + q.th) * h);
            g.addColorStop(0, rg(col, 0)); g.addColorStop(.5, rg(col, (d ? .12 : .055) * (n ? .8 : 1))); g.addColorStop(1, rg(col, 0));
            c.fillStyle = g; c.beginPath();
            top.forEach(function (pt, j) { var m = (pt[1] + bot[j][1]) / 2, y = m + (pt[1] - m) * sc; j ? c.lineTo(pt[0], y) : c.moveTo(pt[0], y); });
            for (var j = bot.length - 1; j >= 0; j--) { var m2 = (top[j][1] + bot[j][1]) / 2; c.lineTo(bot[j][0], m2 + (bot[j][1] - m2) * sc); }
            c.closePath(); c.fill();
          });
        });
      },
    },
    globe: {
      name: 'Network globe', blurb: 'A rotating wireframe globe with data links between sites',
      init: function () {
        var pts = [], arcs = [], i;
        for (i = 0; i < 46; i++) pts.push({ lat: Math.asin(rnd(-.9, .9)), lon: rnd(-Math.PI, Math.PI) });
        while (arcs.length < 11) { var A = pts[Math.floor(rnd(0, pts.length))], B = pts[Math.floor(rnd(0, pts.length))], dd = Math.acos(Math.sin(A.lat) * Math.sin(B.lat) + Math.cos(A.lat) * Math.cos(B.lat) * Math.cos(A.lon - B.lon)); if (dd > .6 && dd < 1.7) arcs.push({ a: A, b: B, off: Math.random(), sp: rnd(.00006, .00014), k: arcs.length % 4 === 0 }); }
        return { pts: pts, arcs: arcs };
      },
      draw: function (c, t, w, h, p, S) {
        var d = p.dark, cx = w * .7, cy = h * .52, R = Math.min(h * .44, w * .34), rot = t * .00012, tilt = .42, ct = Math.cos(tilt), st = Math.sin(tilt);
        function vec(lat, lon) { return [Math.cos(lat) * Math.sin(lon + rot), Math.sin(lat), Math.cos(lat) * Math.cos(lon + rot)]; }
        function scr(v, s) { var y = v[1] * ct - v[2] * st, z = v[1] * st + v[2] * ct; return [cx + v[0] * R * s, cy - y * R * s, z]; }
        var g = c.createRadialGradient(cx, cy, R * .6, cx, cy, R * 1.35); g.addColorStop(0, rg(p.a1, d ? .07 : .06)); g.addColorStop(1, rg(p.a1, 0));
        c.fillStyle = g; c.fillRect(0, 0, w, h);
        c.lineWidth = 1; c.strokeStyle = rg(p.a1, d ? .3 : .3); c.beginPath(); c.arc(cx, cy, R, 0, 6.283); c.stroke();
        function line(fn, n) {
          var prev = null;
          for (var i = 0; i <= n; i++) {
            var q = scr(fn(i / n), 1);
            if (prev) { var z = (q[2] + prev[2]) / 2; c.strokeStyle = rg(p.a1, z > 0 ? (d ? .2 : .26) : (d ? .06 : .08)); c.beginPath(); c.moveTo(prev[0], prev[1]); c.lineTo(q[0], q[1]); c.stroke(); }
            prev = q;
          }
        }
        for (var m = 0; m < 12; m++) line(function (u) { return vec(-1.5708 + u * 3.1416, m * .5236 - rot); }, 28);
        for (var l = -3; l <= 3; l++) line(function (u) { return vec(l * .39, u * 6.283 - rot); }, 48);
        S.arcs.forEach(function (ar) {
          var A = vec(ar.a.lat, ar.a.lon), B = vec(ar.b.lat, ar.b.lon), om = Math.acos(Math.max(-1, Math.min(1, A[0] * B[0] + A[1] * B[1] + A[2] * B[2])));
          
          function at(f) { var s1 = Math.sin((1 - f) * om) / Math.sin(om), s2 = Math.sin(f * om) / Math.sin(om), lift = 1 + .14 * Math.sin(f * 3.1416); return scr([(A[0] * s1 + B[0] * s2), (A[1] * s1 + B[1] * s2), (A[2] * s1 + B[2] * s2)], lift); }
          var col = ar.k ? p.a2 : p.a1, prev = at(0);
          for (var i = 1; i <= 24; i++) { var q = at(i / 24); if (q[2] > 0 && prev[2] > 0) { c.strokeStyle = rg(col, d ? .4 : .42); c.beginPath(); c.moveTo(prev[0], prev[1]); c.lineTo(q[0], q[1]); c.stroke(); } prev = q; }
          var f = (t * ar.sp + ar.off) % 1, hd = at(f);
          if (hd[2] > 0) { var gr = c.createRadialGradient(hd[0], hd[1], 0, hd[0], hd[1], 9); gr.addColorStop(0, rg(col, .95)); gr.addColorStop(1, rg(col, 0)); c.fillStyle = gr; c.beginPath(); c.arc(hd[0], hd[1], 9, 0, 6.283); c.fill(); }
        });
        S.pts.forEach(function (q) { var s = scr(vec(q.lat, q.lon), 1); if (s[2] > 0) { c.fillStyle = rg(p.a1, d ? .85 : .75); c.beginPath(); c.arc(s[0], s[1], 2.2, 0, 6.283); c.fill(); } });
      },
    },
    terrain: {
      name: 'Wireframe terrain', blurb: 'A mesh landscape rolling toward a glowing horizon',
      init: function () { return {}; },
      draw: function (c, t, w, h, p) {
        var d = p.dark, hz = h * .5, N = 34, M = 80, s = t * .0006, fl = Math.floor(s), fr = s - fl;
        var g = c.createRadialGradient(w / 2, hz, 0, w / 2, hz, w * .5); g.addColorStop(0, rg(p.a2, d ? .22 : .2)); g.addColorStop(.5, rg(p.a1, d ? .06 : .05)); g.addColorStop(1, rg(p.a1, 0));
        c.fillStyle = g; c.fillRect(0, 0, w, h);
        for (var k = 0; k < N; k++) {
          var f = (k + fr) / N, id = k - fl, y0 = hz + (h - hz) * Math.pow(f, 2.1), sc = .1 + f * 1.1, pts = [];
          for (var i = 0; i <= M; i++) {
            var X = (i / M - .5) * 2, hgt = (Math.sin(X * 3.1 + id * .37) * Math.cos(id * .23 - X * 1.7) + .5 * Math.sin(X * 7 + id * .9)) * (.25 + Math.abs(X) * 1.1);
            pts.push([w / 2 + X * w * (.85 + f * .5), y0 - hgt * h * .26 * sc]);
          }
          c.beginPath(); pts.forEach(function (q, j) { j ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); });
          c.lineTo(pts[M][0], h + 5); c.lineTo(pts[0][0], h + 5); c.closePath();
          c.fillStyle = p.bg; c.fill();
          c.strokeStyle = rg(k % 5 === 0 ? p.a2 : p.a1, (.1 + .4 * f) * (d ? 1 : .9)); c.lineWidth = 1; c.beginPath();
          pts.forEach(function (q, j) { j ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }); c.stroke();
        }
      },
    },
    tunnel: {
      name: 'Data tunnel', blurb: 'Flying down a corridor of glowing frames with packets on the rails',
      init: function () {
        var pk = [];
        for (var i = 0; i < 26; i++) pk.push({ rail: Math.floor(rnd(0, 8)), off: Math.random(), sp: rnd(.00006, .00014), k: Math.random() < .25 });
        return { pk: pk };
      },
      draw: function (c, t, w, h, p, S) {
        var d = p.dark, cx = w / 2, cy = h * .5, W = w * .78, H = h * .78, N = 14, ph = (t * .00018) % 1, g = c.createRadialGradient(cx, cy, 0, cx, cy, w * .4);
        g.addColorStop(0, rg(p.a1, d ? .16 : .12)); g.addColorStop(1, rg(p.a1, 0)); c.fillStyle = g; c.fillRect(0, 0, w, h);
        var rails = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];
        c.lineWidth = 1; c.strokeStyle = rg(p.a1, d ? .12 : .16); c.beginPath();
        rails.forEach(function (r) { c.moveTo(cx, cy); c.lineTo(cx + r[0] * W, cy + r[1] * H); }); c.stroke();
        for (var k = 0; k < N; k++) {
          var f = (k + ph) / N, s = Math.pow(f, 2.4);
          c.strokeStyle = rg(k % 4 === 0 ? p.a2 : p.a1, (.05 + .34 * f) * (d ? 1 : .95)); c.lineWidth = .8 + f * 1.2;
          c.strokeRect(cx - W * s, cy - H * s, W * s * 2, H * s * 2);
        }
        S.pk.forEach(function (q) {
          var f = (t * q.sp + q.off) % 1, s = Math.pow(f, 2.4), r = rails[q.rail], x = cx + r[0] * W * s, y = cy + r[1] * H * s, z = 1 + 6 * f, col = q.k ? p.a2 : p.a1;
          c.fillStyle = rg(col, (.2 + .75 * f) * (d ? 1 : .9)); c.fillRect(x - z / 2, y - z / 2, z, z);
        });
      },
    },
    streaks: {
      name: 'Fiber streaks', blurb: 'Pulses of light racing along diagonal fiber lines',
      init: function (w, h) {
        var a = [], n = Math.min(60, Math.round(w / 26));
        for (var i = 0; i < n; i++) a.push({ pos: rnd(-.3, 1.3), off: Math.random(), sp: rnd(.00012, .0004), len: rnd(.1, .3), k: Math.random() < .2, wd: Math.random() < .2 ? 2 : 1 });
        return { a: a };
      },
      draw: function (c, t, w, h, p, S) {
        var d = p.dark, ang = -.42, dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx, D = Math.sqrt(w * w + h * h), mx = w / 2, my = h / 2;
        S.a.forEach(function (q) {
          var ox = mx + nx * (q.pos - .5) * D * 1.15, oy = my + ny * (q.pos - .5) * D * 1.15, x0 = ox - dx * D, y0 = oy - dy * D, x1 = ox + dx * D, y1 = oy + dy * D, col = q.k ? p.a2 : p.a1;
          c.lineWidth = 1; c.strokeStyle = rg(p.a1, d ? .06 : .09); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
          [0, .5].forEach(function (o2) { var f = (t * q.sp + q.off + o2) % 1.3 - .15, hx = x0 + (x1 - x0) * f, hy = y0 + (y1 - y0) * f, tx = hx - dx * D * q.len, ty = hy - dy * D * q.len;
          var g = c.createLinearGradient(tx, ty, hx, hy); g.addColorStop(0, rg(col, 0)); g.addColorStop(1, rg(col, d ? .7 : .75));
          c.strokeStyle = g; c.lineWidth = q.wd + .6; c.beginPath(); c.moveTo(tx, ty); c.lineTo(hx, hy); c.stroke();
          c.fillStyle = rg(col, d ? .9 : .85); c.beginPath(); c.arc(hx, hy, q.wd + 1, 0, 6.283); c.fill(); });
        });
      },
    },
  };
  var ORDER = ['galaxy', 'grid', 'circuit', 'rain', 'net', 'aurora', 'globe', 'terrain', 'tunnel', 'streaks'];
  var LIST = [{ id: 'off', name: 'None', blurb: 'Plain background' }].concat(ORDER.map(function (id) { return { id: id, name: STYLES[id].name, blurb: STYLES[id].blurb }; }));

  var cv = document.createElement('canvas');
  cv.className = 'bg-canvas'; cv.setAttribute('aria-hidden', 'true');
  // Inline so the canvas stays behind the page even if the stylesheet is stale or slow to load.
  cv.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none;display:block';
  var ctx = cv.getContext('2d', { alpha: false }), w = 0, h = 0, raf = 0, cols = null, S = null, cur = null;

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
  var last = 0;
  // ~40fps cap: the full-screen redraw competes with page repaints (e.g. when an answer is revealed) and Chrome can flash black tiles when it falls behind
  function loop(t) { raf = requestAnimationFrame(loop); if (t - last < 24) return; last = t; frame(t); }
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
