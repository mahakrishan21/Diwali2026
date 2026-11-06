/* E2M Diwali - Activity 03: Rangoli Creator
   Canvas studio with N-fold radial (optionally mirrored) symmetry, a 10-pattern
   powder library, undo / clear / randomize / save, and the MAGIC RANGOLI build.
   Registers with window.E2M and exposes E2M.rangoliAnimate(opts?) for the finale. */
(function () {
  'use strict';

  var KEY = 'rangoli';
  var TAU = Math.PI * 2;
  var SCRIPT_SRC = (document.currentScript && document.currentScript.src) || '';

  /* ---------- safe access to the shared engine ---------- */
  function E() { return window.E2M || {}; }
  function isReduced() { return !!E().reduced; }
  function isMobile() { return !!E().mobile; }
  function maxParticles() { return E().maxParticles || 600; }
  function sfx(name) { try { var a = E().audio; if (a && a.play) a.play(name); } catch (e) { /* no-op */ } }
  function fx(name) {
    var args = Array.prototype.slice.call(arguments, 1);
    try { var f = E().fx; if (f && typeof f[name] === 'function') f[name].apply(f, args); } catch (e) { /* no-op */ }
  }
  function toast(msg) { try { if (E().toast) E().toast(msg); } catch (e) { /* no-op */ } }
  /* Revision 2 — immersion + accessibility hooks (all guarded: core.js may be older) */
  function impact(p, o) { try { var A = E(); if (typeof A.impact === 'function') A.impact(p, o || {}); } catch (e) { /* decorative */ } }
  /* Revision 4 — haptics + translate-only shake (core gates both by prefs / Calm / pause / reduced motion) */
  function haptic(n, p) { try { var A = E(); if (typeof A.haptic === 'function') A.haptic(n, p); } catch (e) { /* decorative */ } }
  function shake(px, ms, o) { try { var A = E(); if (typeof A.shake === 'function') A.shake(px, ms, o); } catch (e) { /* decorative */ } }
  function sr(msg, assertive) { try { var A = E(); if (typeof A.announce === 'function') { A.announce(msg, { assertive: !!assertive }); return true; } } catch (e) { /* fall back */ } return false; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function easeOutBack(t) { var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function ensureCss(name) {
    if (document.querySelector('link[href*="' + name + '.css"]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = SCRIPT_SRC ? SCRIPT_SRC.replace(/js\/[^\/?#]+([?#].*)?$/, 'css/' + name + '.css') : 'css/' + name + '.css';
    document.head.appendChild(l);
  }

  /* Revision 5 (b): no full-screen layer for this zone. The finished rangoli stays ONLY inside its own
     frame (the floor canvas): no E2M.screenLayer('rangoli'), no giant-light bloom or blurred copy of the
     pattern behind the stage, no fixed overlay. Celebration = in-frame floor pulses + the shared small
     spark burst / petals + translate-only shake, haptics and the caption. */

  /* ---------- colour ---------- */
  var IVORY = '#FFF4DC', NAVY = '#080B1E', GOLD = '#FFD778';
  var POWDERS = [
    { name: 'Saffron', hex: '#FF9F32' },
    { name: 'Marigold', hex: '#FFC93C' },
    { name: 'Gold', hex: '#FFD778' },
    { name: 'Kumkum red', hex: '#E0352B' },
    { name: 'Magenta', hex: '#DB59C8' },
    { name: 'Rose', hex: '#FF7BAC' },
    { name: 'Peacock', hex: '#1FB5A8' },
    { name: 'Indigo', hex: '#6271FF' },
    { name: 'Leaf', hex: '#5DBB4A' },
    { name: 'Rice white', hex: '#FFF4DC' }
  ];
  function hexRgb(h) { h = h.replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
  function mix(a, b, t) {
    var x = hexRgb(a), y = hexRgb(b);
    return 'rgb(' + Math.round(x[0] + (y[0] - x[0]) * t) + ',' + Math.round(x[1] + (y[1] - x[1]) * t) + ',' + Math.round(x[2] + (y[2] - x[2]) * t) + ')';
  }
  var colCache = {};
  function colors(hex) {
    if (colCache[hex]) return colCache[hex];
    var white = hex.toUpperCase() === IVORY;
    var gold = hex.toUpperCase() === GOLD;
    var set = {
      c: hex,
      l: white ? mix(IVORY, GOLD, 0.35) : mix(hex, IVORY, 0.45),
      d: white ? mix(IVORY, '#B9A27A', 0.55) : mix(hex, NAVY, 0.38),
      iv: white ? 'rgba(255,215,120,0.95)' : 'rgba(255,244,220,0.92)',
      g: gold ? '#FFF4DC' : GOLD
    };
    colCache[hex] = set;
    return set;
  }

  /* ---------- pattern library (unit space, pointing "outward" = -y) ---------- */
  function tp(d, s, tx, ty) {
    var i = 0;
    return d.replace(/-?\d*\.?\d+/g, function (n) {
      var v = parseFloat(n) * s + ((i++ % 2 === 0) ? tx : ty);
      return (Math.round(v * 1000) / 1000).toString();
    });
  }
  function circ(p, x, y, r) { p.moveTo(x + r, y); p.arc(x, y, r, 0, TAU); }

  var PATTERNS = [
    {
      id: 'petal', label: 'Petal', build: function () {
        var outer = 'M0 -1 C0.62 -0.45 0.5 0.62 0 1 C-0.5 0.62 -0.62 -0.45 0 -1 Z';
        var o = new Path2D(outer);
        var i = new Path2D(tp(outer, 0.6, 0, 0.02));
        var v = new Path2D('M0 -0.76 L0 0.7');
        var d = new Path2D(); circ(d, 0, 0.8, 0.1);
        return [{ p: o, f: 'c' }, { p: i, f: 'l' }, { p: o, s: 'iv', w: 0.07 }, { p: v, s: 'iv', w: 0.045 }, { p: d, f: 'g' }];
      }
    },
    {
      id: 'lotus', label: 'Lotus', build: function () {
        var C = new Path2D('M0 -1 C0.34 -0.62 0.3 0.05 0 0.42 C-0.3 0.05 -0.34 -0.62 0 -1 Z');
        var S = new Path2D('M0.04 0.44 C0.3 0.12 0.62 -0.38 0.86 -0.56 C0.88 -0.12 0.6 0.32 0.06 0.5 Z M-0.04 0.44 C-0.3 0.12 -0.62 -0.38 -0.86 -0.56 C-0.88 -0.12 -0.6 0.32 -0.06 0.5 Z');
        var O = new Path2D('M0.06 0.52 C0.45 0.42 0.84 0.2 1 0.02 C0.96 0.42 0.6 0.66 0.08 0.6 Z M-0.06 0.52 C-0.45 0.42 -0.84 0.2 -1 0.02 C-0.96 0.42 -0.6 0.66 -0.08 0.6 Z');
        var B = new Path2D(); B.ellipse(0, 0.6, 0.42, 0.14, 0, 0, TAU);
        var dot = new Path2D(); circ(dot, 0, -0.22, 0.075);
        return [{ p: O, f: 'd' }, { p: O, s: 'iv', w: 0.05 }, { p: S, f: 'c' }, { p: S, s: 'iv', w: 0.05 }, { p: C, f: 'l' }, { p: C, s: 'iv', w: 0.05 }, { p: B, f: 'g' }, { p: dot, f: 'iv' }];
      }
    },
    {
      id: 'bindu', label: 'Bindu dots', build: function () {
        var big = new Path2D(); circ(big, 0, 0, 0.42);
        var core = new Path2D(); circ(core, 0, 0, 0.17);
        var ring = new Path2D(), tiny = new Path2D();
        for (var k = 0; k < 6; k++) {
          var a = k * TAU / 6 - Math.PI / 2;
          circ(ring, Math.cos(a) * 0.76, Math.sin(a) * 0.76, 0.17);
          circ(tiny, Math.cos(a + Math.PI / 6) * 0.72, Math.sin(a + Math.PI / 6) * 0.72, 0.075);
        }
        return [{ p: big, f: 'c' }, { p: big, s: 'iv', w: 0.05 }, { p: core, f: 'iv' }, { p: ring, f: 'l' }, { p: tiny, f: 'g' }];
      }
    },
    {
      id: 'diamond', label: 'Diamond', build: function () {
        var o = new Path2D('M0 -1 L0.52 0 L0 1 L-0.52 0 Z');
        var i = new Path2D('M0 -0.56 L0.29 0 L0 0.56 L-0.29 0 Z');
        var dots = new Path2D(); circ(dots, 0.74, 0, 0.1); circ(dots, -0.74, 0, 0.1);
        var c = new Path2D(); circ(c, 0, 0, 0.09);
        return [{ p: o, f: 'c' }, { p: i, f: 'l' }, { p: o, s: 'iv', w: 0.06 }, { p: i, s: 'iv', w: 0.04 }, { p: c, f: 'iv' }, { p: dots, f: 'g' }];
      }
    },
    {
      id: 'star', label: 'Tara star', build: function () {
        function starPath(ro, ri) {
          var p = new Path2D();
          for (var k = 0; k < 16; k++) {
            var r = k % 2 === 0 ? ro : ri, a = k * Math.PI / 8 - Math.PI / 2;
            if (k === 0) p.moveTo(Math.cos(a) * r, Math.sin(a) * r); else p.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          }
          p.closePath();
          return p;
        }
        var o = starPath(1, 0.46), i = starPath(0.62, 0.3);
        var c = new Path2D(); circ(c, 0, 0, 0.17);
        return [{ p: o, f: 'c' }, { p: o, s: 'iv', w: 0.05 }, { p: i, f: 'l' }, { p: c, f: 'g' }, { p: c, s: 'iv', w: 0.04 }];
      }
    },
    {
      id: 'paisley', label: 'Paisley', build: function () {
        var d = 'M0.35 -0.95 C-0.25 -0.85 -0.62 -0.3 -0.56 0.3 C-0.5 0.86 0.46 0.96 0.56 0.34 C0.62 -0.05 0.2 -0.2 0.1 -0.45 C0.05 -0.65 0.22 -0.8 0.35 -0.95 Z';
        var o = new Path2D(d);
        var i = new Path2D(tp(d, 0.56, 0.0, 0.16));
        var e = new Path2D(); circ(e, 0.0, 0.34, 0.12);
        var dots = new Path2D(); circ(dots, -0.42, 0.62, 0.06); circ(dots, -0.12, 0.84, 0.06); circ(dots, 0.24, 0.82, 0.06); circ(dots, 0.5, 0.6, 0.06);
        return [{ p: o, f: 'c' }, { p: o, s: 'iv', w: 0.06 }, { p: i, f: 'l' }, { p: i, s: 'iv', w: 0.035 }, { p: e, f: 'g' }, { p: dots, f: 'iv' }];
      }
    },
    {
      id: 'spiral', label: 'Spiral', build: function () {
        var p = new Path2D(), steps = 90, turns = 2.4;
        for (var k = 0; k <= steps; k++) {
          var t = k / steps, a = t * turns * TAU - Math.PI / 2, r = 0.06 + 0.86 * t;
          if (k === 0) p.moveTo(Math.cos(a) * r, Math.sin(a) * r); else p.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        var end = new Path2D(); var ea = turns * TAU - Math.PI / 2; circ(end, Math.cos(ea) * 0.92, Math.sin(ea) * 0.92, 0.13);
        var c = new Path2D(); circ(c, 0, 0, 0.1);
        return [{ p: p, s: 'd', w: 0.26 }, { p: p, s: 'c', w: 0.18 }, { p: p, s: 'l', w: 0.05 }, { p: end, f: 'g' }, { p: c, f: 'iv' }];
      }
    },
    {
      id: 'kolam', label: 'Kolam loop', build: function () {
        var p = new Path2D(), steps = 160;
        for (var k = 0; k <= steps; k++) {
          var t = k / steps * TAU, r = 0.96 * Math.cos(2 * t);
          var x = Math.cos(t) * r, y = Math.sin(t) * r;
          if (k === 0) p.moveTo(x, y); else p.lineTo(x, y);
        }
        p.closePath();
        var dots = new Path2D();
        for (var j = 0; j < 4; j++) { var a = j * Math.PI / 2; circ(dots, Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0.085); }
        var c = new Path2D(); circ(c, 0, 0, 0.07);
        return [{ p: p, s: 'c', w: 0.15 }, { p: p, s: 'iv', w: 0.035 }, { p: dots, f: 'iv' }, { p: c, f: 'g' }];
      }
    },
    {
      id: 'diya', label: 'Diya', build: function () {
        var bowl = new Path2D('M-0.92 0.12 C-0.78 0.88 0.78 0.88 0.92 0.12 Q0 0.36 -0.92 0.12 Z');
        var rim = new Path2D('M-0.92 0.12 Q0 0.36 0.92 0.12 Q0 0.54 -0.92 0.12 Z');
        var flame = new Path2D('M0 -1 C0.34 -0.56 0.3 -0.06 0 0.14 C-0.3 -0.06 -0.34 -0.56 0 -1 Z');
        var inner = new Path2D('M0 -0.5 C0.16 -0.28 0.15 -0.02 0 0.1 C-0.15 -0.02 -0.16 -0.28 0 -0.5 Z');
        var dots = new Path2D(); circ(dots, -0.42, 0.46, 0.07); circ(dots, 0, 0.56, 0.07); circ(dots, 0.42, 0.46, 0.07);
        return [{ p: bowl, f: 'c' }, { p: rim, f: 'd' }, { p: bowl, s: 'iv', w: 0.05 }, { p: dots, f: 'iv' }, { p: flame, f: 'g' }, { p: inner, f: 'iv' }];
      }
    },
    {
      id: 'marigold', label: 'Marigold', build: function () {
        var outer = new Path2D(), inner = new Path2D();
        for (var k = 0; k < 16; k++) { var a = k * TAU / 16; circ(outer, Math.cos(a) * 0.66, Math.sin(a) * 0.66, 0.31); }
        for (var j = 0; j < 11; j++) { var b = j * TAU / 11 + 0.2; circ(inner, Math.cos(b) * 0.38, Math.sin(b) * 0.38, 0.25); }
        var c = new Path2D(); circ(c, 0, 0, 0.2);
        var seeds = new Path2D(); for (var s = 0; s < 6; s++) { var d = s * TAU / 6; circ(seeds, Math.cos(d) * 0.1, Math.sin(d) * 0.1, 0.035); }
        return [{ p: outer, f: 'c' }, { p: outer, s: 'd', w: 0.04 }, { p: inner, f: 'l' }, { p: inner, s: 'c', w: 0.03 }, { p: c, f: 'd' }, { p: seeds, f: 'g' }];
      }
    }
  ];
  var PAT = {};
  PATTERNS.forEach(function (p) { p.parts = p.build(); PAT[p.id] = p; });

  // parts may name a second / third powder (t: 2|3, R3.6 multi-colour motifs) and a part alpha (al)
  function drawParts(ctx, parts, cols, px, cols2, cols3) {
    for (var i = 0; i < parts.length; i++) {
      var pt = parts[i], cs = (pt.t === 2 && cols2) || (pt.t === 3 && (cols3 || cols2)) || cols, ga = 0;
      if (pt.al) { ga = ctx.globalAlpha; ctx.globalAlpha = ga * pt.al; }
      if (pt.f) { ctx.fillStyle = cs[pt.f]; ctx.fill(pt.p); }
      else { ctx.strokeStyle = cs[pt.s]; ctx.lineWidth = Math.max(pt.w, 0.85 / px); ctx.stroke(pt.p); }
      if (pt.al) ctx.globalAlpha = ga;
    }
  }

  /* stamp: {p, c, s (size, R units), x, y (R units), n (fold), m (mirror), r0 (frame rotation)} */
  function drawStamp(ctx, st, R, mul) {
    var size = st.s * R * (mul == null ? 1 : mul);
    if (size < 0.4) return;
    var pat = PAT[st.p]; if (!pat) return;
    var cols = colors(st.c), cols2 = st.c2 ? colors(st.c2) : null, cols3 = st.c3 ? colors(st.c3) : null;
    var x = st.x * R, y = st.y * R;
    var ang = (st.a != null ? st.a : Math.atan2(st.y, st.x)) + Math.PI / 2;
    var n = st.n || 1, reps = st.m ? 2 : 1;
    for (var m = 0; m < reps; m++) {
      for (var k = 0; k < n; k++) {
        ctx.save();
        ctx.rotate((st.r0 || 0) + TAU * k / n);
        if (m) ctx.scale(1, -1);
        ctx.translate(x, y);
        ctx.rotate(ang);
        ctx.scale(size, size);
        drawParts(ctx, pat.parts, cols, size, cols2, cols3);
        ctx.restore();
      }
    }
  }

  function sparklePath(ctx, s) {
    ctx.beginPath();
    ctx.moveTo(0, -s); ctx.quadraticCurveTo(0, 0, s, 0); ctx.quadraticCurveTo(0, 0, 0, s);
    ctx.quadraticCurveTo(0, 0, -s, 0); ctx.quadraticCurveTo(0, 0, 0, -s); ctx.closePath();
  }

  var grainSrc = null;
  function grainCanvas() {
    if (grainSrc) return grainSrc;
    var c = document.createElement('canvas'); c.width = c.height = 160;
    var g = c.getContext('2d');
    for (var i = 0; i < 2600; i++) {
      var x = Math.random() * 160, y = Math.random() * 160, s = Math.random() < 0.7 ? 1 : 2;
      if (Math.random() < 0.62) g.fillStyle = 'rgba(16,8,30,' + (0.12 + Math.random() * 0.3).toFixed(2) + ')';
      else g.fillStyle = 'rgba(255,250,235,' + (0.1 + Math.random() * 0.28).toFixed(2) + ')';
      g.fillRect(x, y, s, s);
    }
    grainSrc = c;
    return c;
  }

  /* =====================================================================
     Floor renderer: one per canvas (studio, or the inline finale floor)
     ===================================================================== */
  function createFloor(canvas, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var baked = document.createElement('canvas'), bctx = baked.getContext('2d');
    var work = document.createElement('canvas'), wctx = work.getContext('2d');
    var glow = document.createElement('canvas'), gctx = glow.getContext('2d');
    var slab = document.createElement('canvas'), sctx = slab.getContext('2d');
    var grainPat = null;
    var S = 0, dpr = 1, css = 0, R = 0;
    var strokes = [];       // array of arrays of stamps
    var anim = [];          // {st, t0, dur, spark}
    var sparks = [], pulses = [], ripples = [];
    var clock = 0;
    var api = {
      strokes: strokes, clock: function () { return clock; },
      guides: opts.guides !== false, sym: 8, mirror: true,
      ghost: null, reticle: null, onIdle: null
    };

    function resize(cssSize) {
      cssSize = Math.max(120, Math.round(cssSize));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      css = cssSize; S = Math.round(cssSize * dpr);
      [canvas, baked, work, slab].forEach(function (c) { c.width = S; c.height = S; });
      canvas.style.width = cssSize + 'px'; canvas.style.height = cssSize + 'px';
      glow.width = glow.height = Math.max(32, Math.round(S / 7));
      R = (cssSize / 2) / 1.1;
      grainPat = wctx.createPattern(grainCanvas(), 'repeat');
      if (opts.slab !== false) drawSlab();
      rebake();
    }

    function centered(c) { c.setTransform(dpr, 0, 0, dpr, S / 2, S / 2); }

    function drawSlab() {
      var c = sctx; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, S, S); centered(c);
      var halo = c.createRadialGradient(0, 0, R * 0.9, 0, 0, R * 1.12);
      halo.addColorStop(0, 'rgba(255,215,120,0.05)'); halo.addColorStop(1, 'rgba(255,215,120,0)');
      c.fillStyle = halo; c.beginPath(); c.arc(0, 0, R * 1.12, 0, TAU); c.fill();
      var g = c.createRadialGradient(-R * 0.2, -R * 0.25, R * 0.05, 0, 0, R * 1.05);
      g.addColorStop(0, '#16153F'); g.addColorStop(0.55, '#0E1030'); g.addColorStop(1, '#080B1E'); // R4: space-2 -> space-1 stone
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, R * 1.04, 0, TAU); c.fill();
      // stone speckle
      for (var i = 0; i < 900; i++) {
        var a = Math.random() * TAU, r = Math.sqrt(Math.random()) * R * 1.02;
        c.fillStyle = Math.random() < 0.5 ? 'rgba(255,244,220,0.035)' : 'rgba(0,0,0,0.18)';
        c.fillRect(Math.cos(a) * r, Math.sin(a) * r, 1.2, 1.2);
      }
      // etched rings
      c.lineWidth = 1;
      [0.33, 0.66].forEach(function (f) { c.strokeStyle = 'rgba(255,244,220,0.045)'; c.beginPath(); c.arc(0, 0, R * f, 0, TAU); c.stroke(); });
      c.strokeStyle = 'rgba(255,244,220,0.12)'; c.beginPath(); c.arc(0, 0, R * 1.0, 0, TAU); c.stroke();
      c.strokeStyle = 'rgba(255,215,120,0.42)'; c.beginPath(); c.arc(0, 0, R * 1.04, 0, TAU); c.stroke();
      // protractor ticks
      for (var k = 0; k < 120; k++) {
        var ang = k * TAU / 120, major = k % 10 === 0, mid = k % 5 === 0;
        var r0 = R * 1.045, r1 = R * (major ? 1.085 : mid ? 1.07 : 1.06);
        c.strokeStyle = major ? 'rgba(255,215,120,0.45)' : 'rgba(255,244,220,' + (mid ? 0.14 : 0.06) + ')';
        c.beginPath(); c.moveTo(Math.cos(ang) * r0, Math.sin(ang) * r0); c.lineTo(Math.cos(ang) * r1, Math.sin(ang) * r1); c.stroke();
      }
      // cardinal lotus-bud diamonds
      for (var q = 0; q < 4; q++) {
        var qa = q * Math.PI / 2 - Math.PI / 2, qx = Math.cos(qa) * R * 1.075, qy = Math.sin(qa) * R * 1.075;
        c.save(); c.translate(qx, qy); c.rotate(qa + Math.PI / 2);
        c.fillStyle = 'rgba(255,215,120,0.7)'; c.beginPath(); c.moveTo(0, -4); c.lineTo(2.2, 0); c.lineTo(0, 4); c.lineTo(-2.2, 0); c.closePath(); c.fill();
        c.restore();
      }
    }

    function clipSlab(c) { c.beginPath(); c.arc(0, 0, R * 1.0, 0, TAU); c.clip(); }

    function rebake() {
      bctx.setTransform(1, 0, 0, 1, 0, 0); bctx.clearRect(0, 0, S, S);
      centered(bctx); bctx.save(); clipSlab(bctx);
      bctx.lineCap = 'round'; bctx.lineJoin = 'round';
      for (var i = 0; i < strokes.length; i++) for (var j = 0; j < strokes[i].length; j++) {
        var st = strokes[i][j]; if (!st._pending) drawStamp(bctx, st, R, 1);
      }
      bctx.restore();
      request();
    }

    function bake(list) {
      centered(bctx); bctx.save(); clipSlab(bctx); bctx.lineCap = 'round'; bctx.lineJoin = 'round';
      for (var i = 0; i < list.length; i++) drawStamp(bctx, list[i], R, 1);
      bctx.restore();
    }

    function drawGuides(c) {
      centered(c);
      c.save();
      c.lineWidth = 1;
      var n = api.sym;
      c.strokeStyle = 'rgba(255,244,220,0.09)';
      c.setLineDash([2, 6]);
      [0.25, 0.5, 0.75].forEach(function (f) { c.beginPath(); c.arc(0, 0, R * f, 0, TAU); c.stroke(); });
      c.setLineDash([]);
      for (var k = 0; k < n; k++) {
        var a = k * TAU / n;
        c.strokeStyle = 'rgba(255,215,120,0.13)';
        c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * R, Math.sin(a) * R); c.stroke();
        if (api.mirror) {
          var b = a + Math.PI / n;
          c.strokeStyle = 'rgba(255,244,220,0.06)'; c.setLineDash([3, 5]);
          c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(b) * R, Math.sin(b) * R); c.stroke(); c.setLineDash([]);
        }
      }
      c.fillStyle = 'rgba(255,215,120,0.5)'; c.beginPath(); c.arc(0, 0, 2.2, 0, TAU); c.fill();
      c.restore();
    }

    function render() {
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, S, S);
      if (opts.slab !== false) ctx.drawImage(slab, 0, 0);
      if (api.guides && opts.slab !== false) drawGuides(ctx);

      // composite stamps (baked + animating) into the work layer
      wctx.setTransform(1, 0, 0, 1, 0, 0); wctx.clearRect(0, 0, S, S);
      wctx.drawImage(baked, 0, 0);
      var done = [];
      if (anim.length) {
        centered(wctx); wctx.save(); clipSlab(wctx); wctx.lineCap = 'round'; wctx.lineJoin = 'round';
        for (var i = anim.length - 1; i >= 0; i--) {
          var a = anim[i], p = (clock - a.t0) / a.dur;
          if (p < 0) continue;
          if (p >= 1) { done.push(a.st); a.st._pending = false; anim.splice(i, 1); continue; }
          if (!a.fired) { a.fired = true; if (a.spark) spawnSpark(a.st); if (a.onStart) a.onStart(); }
          wctx.globalAlpha = clamp(p * 2.2, 0, 1);
          drawStamp(wctx, a.st, R, a.soft ? easeOutCubic(p) : easeOutBack(p));
        }
        wctx.globalAlpha = 1;
        // stamps that just finished: draw on work this frame too, bake below
        for (var d = 0; d < done.length; d++) drawStamp(wctx, done[d], R, 1);
        wctx.restore();
      }
      wctx.setTransform(1, 0, 0, 1, 0, 0);
      wctx.globalCompositeOperation = 'source-atop';
      wctx.fillStyle = grainPat; wctx.fillRect(0, 0, S, S);
      wctx.globalCompositeOperation = 'source-over';
      if (done.length) bake(done);

      // in-canvas glow: a downscaled copy added back softly (clipped to this canvas, never outside the frame)
      gctx.setTransform(1, 0, 0, 1, 0, 0); gctx.clearRect(0, 0, glow.width, glow.height);
      gctx.drawImage(work, 0, 0, glow.width, glow.height);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = opts.glow || 0.42;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(glow, 0, 0, S, S);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(work, 0, 0);

      drawOverlay();
    }

    function spawnSpark(st) {
      if (isReduced()) return;
      var cap = Math.min(160, Math.round(maxParticles() / 5));
      if (sparks.length > cap) return;
      var n = st.n || 1, reps = st.m ? 2 : 1, step = Math.max(1, Math.round(n * reps / 6));
      for (var m = 0; m < reps; m++) for (var k = 0; k < n; k += step) {
        var rot = (st.r0 || 0) + TAU * k / n;
        var y = m ? -st.y : st.y;
        var x = st.x * Math.cos(rot) - y * Math.sin(rot);
        var yy = st.x * Math.sin(rot) + y * Math.cos(rot);
        sparks.push({ x: x, y: yy, t0: clock, life: rnd(420, 760), s: rnd(4, 9), c: Math.random() < 0.6 ? IVORY : GOLD, rot: Math.random() });
      }
    }

    function drawOverlay() {
      centered(ctx);
      if (ripples.length) {
        for (var ri = ripples.length - 1; ri >= 0; ri--) {
          var rp = ripples[ri], q0 = (clock - rp.t0) / rp.life;
          if (q0 >= 1) { ripples.splice(ri, 1); continue; }
          var e0 = easeOutCubic(Math.max(0, q0)), rad = 4 + 30 * e0, al = (1 - q0) * 0.6;
          ctx.save(); ctx.lineWidth = 1.2; ctx.strokeStyle = rp.c;
          var reps = rp.m ? 2 : 1;
          for (var mm = 0; mm < reps; mm++) for (var kk = 0; kk < rp.n; kk++) {
            var rot = TAU * kk / rp.n, yy = mm ? -rp.y : rp.y;
            var px = (rp.x * Math.cos(rot) - yy * Math.sin(rot)) * R, py = (rp.x * Math.sin(rot) + yy * Math.cos(rot)) * R;
            ctx.globalAlpha = al * (kk === 0 && mm === 0 ? 1 : 0.35);
            ctx.beginPath(); ctx.arc(px, py, rad, 0, TAU); ctx.stroke();
          }
          ctx.restore();
        }
        ctx.globalAlpha = 1;
      }
      if (pulses.length) {
        for (var i = pulses.length - 1; i >= 0; i--) {
          var pu = pulses[i], p = (clock - pu.t0) / pu.life;
          if (p >= 1) { pulses.splice(i, 1); continue; }
          ctx.strokeStyle = 'rgba(255,230,170,' + (0.55 * (1 - p)).toFixed(3) + ')';
          ctx.lineWidth = 1.5 + 3 * (1 - p);
          ctx.beginPath(); ctx.arc(0, 0, R * pu.r * (0.96 + 0.08 * easeOutCubic(p)), 0, TAU); ctx.stroke();
        }
      }
      if (sparks.length) {
        ctx.globalCompositeOperation = 'lighter';
        for (var j = sparks.length - 1; j >= 0; j--) {
          var s = sparks[j], q = (clock - s.t0) / s.life;
          if (q >= 1) { sparks.splice(j, 1); continue; }
          var k = Math.sin(q * Math.PI);
          ctx.save(); ctx.translate(s.x * R, s.y * R); ctx.rotate(s.rot + q);
          ctx.globalAlpha = k; ctx.fillStyle = s.c;
          sparklePath(ctx, s.s * (0.4 + k)); ctx.fill();
          ctx.globalAlpha = k * 0.35; ctx.beginPath(); ctx.arc(0, 0, s.s * 1.3, 0, TAU); ctx.fill();
          ctx.restore();
        }
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      }
      if (api.ghost) {
        ctx.save(); ctx.globalAlpha = 0.32; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        drawStamp(ctx, api.ghost, R, 1); ctx.restore();
      }
      if (api.reticle) {
        var rx = api.reticle.x * R, ry = api.reticle.y * R;
        ctx.save(); ctx.strokeStyle = GOLD; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(rx, ry, 11, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(rx - 17, ry); ctx.lineTo(rx - 6, ry); ctx.moveTo(rx + 6, ry); ctx.lineTo(rx + 17, ry);
        ctx.moveTo(rx, ry - 17); ctx.lineTo(rx, ry - 6); ctx.moveTo(rx, ry + 6); ctx.lineTo(rx, ry + 17); ctx.stroke();
        ctx.restore();
      }
    }

    /* ---- loop: on-demand; runs continuously only while something animates ---- */
    // Single on-demand frames are always allowed (cheap, user-driven); the
    // continuous loop only runs while something animates and we are not paused.
    var raf = 0, last = 0;
    function busy() { return anim.length > 0 || sparks.length > 0 || pulses.length > 0 || ripples.length > 0; }
    function loopOk() { return !document.hidden && !api.paused; }
    function request() { if (!raf && !document.hidden) raf = requestAnimationFrame(frame); }
    function frame(ts) {
      raf = 0;
      if (!S) return;
      var looping = busy() && loopOk();
      var dt = last ? Math.min(50, ts - last) : 16;
      last = looping ? ts : 0;
      if (busy() && loopOk()) clock += dt;
      render();
      if (busy() && loopOk()) raf = requestAnimationFrame(frame);
      else { last = 0; if (!busy() && api.onIdle) api.onIdle(); }
    }
    function pause() { api.paused = true; if (raf) { cancelAnimationFrame(raf); raf = 0; } last = 0; }
    function resume() { api.paused = false; request(); }

    function addAnimated(list, opts2) {
      // list of {st, delay, dur?, spark?, soft?, onStart?}
      opts2 = opts2 || {};
      for (var i = 0; i < list.length; i++) {
        var it = list[i];
        it.st._pending = true;
        anim.push({ st: it.st, t0: clock + (it.delay || 0), dur: it.dur || opts2.dur || 420, spark: it.spark, soft: it.soft || opts2.soft, onStart: it.onStart });
      }
      request();
    }
    function finishAll() {
      for (var i = 0; i < anim.length; i++) anim[i].st._pending = false;
      anim.length = 0; sparks.length = 0; pulses.length = 0;
      rebake();
    }
    function pulse(r, life) { if (!isReduced()) { pulses.push({ r: r, t0: clock, life: life || 900 }); request(); } }
    // placement ripple: a ring spreads from where the powder landed; on a stroke's first pinch it echoes
    // faintly through every symmetric copy, so you feel the fold
    function ripple(x, y, n, mirror, c) {
      if (isReduced()) return;
      if (ripples.length > 28) ripples.splice(0, ripples.length - 28);
      ripples.push({ x: x, y: y, n: n || 1, m: !!mirror, c: c || GOLD, t0: clock, life: 720 });
      request();
    }
    function bakeNow(list) { if (S) bake(list); request(); }

    api.bakeNow = bakeNow;
    api.resize = resize; api.render = request; api.rebake = rebake; api.pause = pause; api.resume = resume;
    api.addAnimated = addAnimated; api.finishAll = finishAll; api.pulse = pulse; api.busy = busy; api.ripple = ripple;
    api.isAnimating = function () { return anim.length > 0; };
    api.R = function () { return R; };
    api.cssSize = function () { return css; };
    api.exportPNG = function () {
      var out = document.createElement('canvas'); out.width = S; out.height = S;
      var o = out.getContext('2d');
      o.fillStyle = '#080B1E'; o.fillRect(0, 0, S, S);
      o.drawImage(slab, 0, 0);
      o.globalCompositeOperation = 'lighter'; o.globalAlpha = 0.42; o.drawImage(glow, 0, 0, S, S);
      o.globalAlpha = 1; o.globalCompositeOperation = 'source-over'; o.drawImage(work, 0, 0);
      return out;
    };
    return api;
  }

  /* =====================================================================
     Design generators
     ===================================================================== */
  /* ---------- R3.6: magic-only motifs (registered in PAT, never shown in the tray) ---------- */
  function defPrim(id, build) { if (!PAT[id]) PAT[id] = { id: id, label: id, parts: build() }; return id; }
  function polyPath(pts, close) {
    var p = new Path2D();
    for (var i = 0; i < pts.length; i++) { if (i) p.lineTo(pts[i][0], pts[i][1]); else p.moveTo(pts[i][0], pts[i][1]); }
    if (close) p.closePath();
    return p;
  }
  defPrim('dot', function () { var d = new Path2D(); circ(d, 0, 0, 1); var h = new Path2D(); circ(h, -0.28, -0.3, 0.34); return [{ p: d, f: 'c' }, { p: h, f: 'l', al: 0.7 }]; });
  defPrim('ring', function () { var p = new Path2D(); circ(p, 0, 0, 1); return [{ p: p, s: 'c', w: 0.014 }]; });
  defPrim('ring2', function () { var a = new Path2D(), b = new Path2D(); circ(a, 0, 0, 1); circ(b, 0, 0, 0.955); return [{ p: a, s: 'c', w: 0.012 }, { p: b, s: 'g', w: 0.007 }]; });
  defPrim('tri', function () { var p = new Path2D('M0 -1 L0.866 0.5 L-0.866 0.5 Z'); return [{ p: p, f: 'c', al: 0.14 }, { p: p, s: 'c', w: 0.04 }, { p: p, s: 'iv', w: 0.012 }]; });
  function starPrim(n, k) {
    return defPrim('star' + n + '-' + k, function () {
      var pts = [], d = new Path2D(), i, a;
      for (i = 0; i < n; i++) { a = (i * k % n) * TAU / n - Math.PI / 2; pts.push([Math.cos(a), Math.sin(a)]); }
      for (i = 0; i < n; i++) { a = i * TAU / n - Math.PI / 2; circ(d, Math.cos(a), Math.sin(a), 0.045); }
      var p = polyPath(pts, true);
      return [{ p: p, f: 'c', al: 0.1 }, { p: p, s: 'c', w: 0.03 }, { p: p, s: 'iv', w: 0.01 }, { p: d, f: 'g' }];
    });
  }
  // bhupura: the square enclosure with four stepped T-gates (Sri Yantra outer wall)
  defPrim('bhupura', function () {
    function outline(h, g) {
      var side = [[-h, -h], [-g, -h], [-g, -h - 0.12], [-g - 0.12, -h - 0.12], [-g - 0.12, -h - 0.24], [g + 0.12, -h - 0.24], [g + 0.12, -h - 0.12], [g, -h - 0.12], [g, -h]], pts = [];
      for (var q = 0; q < 4; q++) {
        var ca = Math.cos(q * Math.PI / 2), sa = Math.sin(q * Math.PI / 2);
        for (var i = 0; i < side.length; i++) pts.push([(side[i][0] * ca - side[i][1] * sa) * 0.8, (side[i][0] * sa + side[i][1] * ca) * 0.8]);
      }
      return polyPath(pts, true);
    }
    return [{ p: outline(1, 0.2), s: 'c', w: 0.03 }, { p: outline(0.9, 0.17), s: 'g', w: 0.014 }];
  });
  defPrim('padma', function () {
    var d = 'M0 -1 C0.38 -0.66 0.52 0.12 0.07 0.95 Q0 1 -0.07 0.95 C-0.52 0.12 -0.38 -0.66 0 -1 Z';
    var o = new Path2D(d), i = new Path2D(tp(d, 0.6, 0, 0.18)), v = new Path2D('M0 0.86 L0 -0.62');
    return [{ p: o, f: 'c' }, { p: i, f: 'l' }, { p: o, s: 'iv', w: 0.045 }, { p: v, s: 'd', w: 0.035 }];
  });
  defPrim('spoke', function () { var p = new Path2D('M-0.07 1 L0.07 1 L0.025 -0.8 L-0.025 -0.8 Z'), k = new Path2D(); circ(k, 0, -0.88, 0.1); return [{ p: p, f: 'c' }, { p: k, f: 'c' }]; });
  // mor pankh: vane (powder 1), eye (powder 2), eye core (powder 3)
  defPrim('feather', function () {
    var vane = new Path2D('M0 -1 C0.52 -0.96 0.64 -0.36 0.2 0.22 L0.03 0.98 L-0.03 0.98 L-0.2 0.22 C-0.64 -0.36 -0.52 -0.96 0 -1 Z');
    var barbs = new Path2D();
    for (var i = 0; i < 7; i++) { var y = -0.2 + i * 0.16, w = 0.34 - i * 0.04; barbs.moveTo(0, y + 0.04); barbs.lineTo(w, y - 0.12); barbs.moveTo(0, y + 0.04); barbs.lineTo(-w, y - 0.12); }
    var stem = new Path2D('M0 1 L0 -0.3'), eye = new Path2D(), core = new Path2D(), hi = new Path2D();
    eye.ellipse(0, -0.56, 0.3, 0.34, 0, 0, TAU); core.ellipse(0, -0.6, 0.14, 0.17, 0, 0, TAU); circ(hi, -0.04, -0.66, 0.045);
    return [{ p: vane, f: 'c' }, { p: barbs, s: 'l', w: 0.025 }, { p: stem, s: 'iv', w: 0.03 }, { p: eye, f: 'c', t: 2 }, { p: eye, s: 'g', w: 0.04 }, { p: core, f: 'c', t: 3 }, { p: hi, f: 'iv' }];
  });
  defPrim('leaf', function () {
    var d = 'M0 -1 C0.52 -0.56 0.5 0.38 0 1 C-0.5 0.38 -0.52 -0.56 0 -1 Z';
    var o = new Path2D(d), v = new Path2D('M0 0.95 L0 -0.78 M0 0.2 L0.26 -0.16 M0 -0.2 L-0.24 -0.52 M0 0.5 L-0.24 0.18');
    return [{ p: o, f: 'c' }, { p: o, s: 'd', w: 0.05 }, { p: v, s: 'l', w: 0.04 }];
  });
  defPrim('chikku', function () {
    var p = new Path2D('M0 0.95 C0.62 0.62 0.72 -0.05 0.3 -0.42 C-0.04 -0.72 0.1 -1 0.42 -0.93 C0.62 -0.88 0.64 -0.62 0.46 -0.56');
    var d = new Path2D(); circ(d, 0.46, -0.56, 0.06); circ(d, 0, 0.95, 0.06);
    return [{ p: p, s: 'c', w: 0.08 }, { p: p, s: 'iv', w: 0.022 }, { p: d, f: 'g' }];
  });
  defPrim('loop', function () {
    var d = 'M0 0.92 C0.72 0.2 0.5 -0.92 0 -0.92 C-0.5 -0.92 -0.72 0.2 0 0.92 Z';
    var p = new Path2D(d), i = new Path2D(tp(d, 0.55, 0, -0.06)), c = new Path2D(); circ(c, 0, -0.22, 0.12);
    return [{ p: p, s: 'c', w: 0.11 }, { p: p, s: 'iv', w: 0.028 }, { p: i, s: 'l', w: 0.05 }, { p: c, f: 'g' }];
  });
  defPrim('wave', function () {
    var p = new Path2D('M-1 0 C-0.66 -0.62 -0.34 -0.62 0 0 C0.34 0.62 0.66 0.62 1 0'), d = new Path2D();
    circ(d, -0.5, 0.42, 0.075); circ(d, 0.5, -0.42, 0.075);
    return [{ p: p, s: 'c', w: 0.13 }, { p: p, s: 'iv', w: 0.03 }, { p: d, f: 'g' }];
  });
  defPrim('sq', function () {
    var o = new Path2D('M-1 -1 L1 -1 L1 1 L-1 1 Z'), i = new Path2D('M-0.8 -0.8 L0.8 -0.8 L0.8 0.8 L-0.8 0.8 Z');
    return [{ p: o, f: 'c' }, { p: i, f: 'd' }, { p: o, s: 'iv', w: 0.016 }, { p: i, s: 'g', w: 0.012 }];
  });
  // sikku kolam: an upright m x m pulli (dot) grid, two families of diagonals that pass between the dots,
  // and tangent arcs that loop round every edge dot. Three motifs (a/b lines, c loops) so it can draw in stages.
  function kolamPrims(m) {
    var id = 'kolam' + m, c0 = (m - 1) / 2, k = 0.94 / (c0 * Math.SQRT2 + 0.354 + 0.06), lo = -0.5, hi = m - 0.5, pts = [], i, j;
    function T(x, y) { return [(x - c0) * k, (y - c0) * k]; }
    for (i = 0; i < m; i++) for (j = 0; j < m; j++) pts.push(T(i, j));
    if (!PAT[id + 'a']) {
      var A = new Path2D(), B = new Path2D(), C = new Path2D();
      var seg = function (p, x1, y1, x2, y2, dy) {
        if (x2 - x1 <= 0.5 + 1e-6) return;
        var a = T(x1 + 0.25, y1 + dy * 0.25), b = T(x2 - 0.25, y2 - dy * 0.25);
        p.moveTo(a[0], a[1]); p.lineTo(b[0], b[1]);
      };
      for (j = -m; j <= m - 1; j++) { var c = j + 0.5, x1 = Math.max(lo, c + lo), x2 = Math.min(hi, c + hi); seg(A, x1, x1 - c, x2, x2 - c, 1); }
      for (j = -1; j <= 2 * m - 2; j++) { var cb = j + 0.5, xb1 = Math.max(lo, cb - hi), xb2 = Math.min(hi, cb - lo); seg(B, xb1, cb - xb1, xb2, cb - xb2, -1); }
      var arc = function (cx, cy, th) {
        for (var s = 0; s <= 10; s++) {
          var a = th - Math.PI / 4 + s / 10 * Math.PI / 2, pt = T(cx + Math.cos(a) * 0.3536, cy + Math.sin(a) * 0.3536);
          if (s) C.lineTo(pt[0], pt[1]); else C.moveTo(pt[0], pt[1]);
        }
      };
      for (i = 0; i < m; i++) { arc(0, i, Math.PI); arc(m - 1, i, 0); arc(i, 0, -Math.PI / 2); arc(i, m - 1, Math.PI / 2); }
      PAT[id + 'a'] = { id: id + 'a', parts: [{ p: A, s: 'c', w: 0.011 }] };
      PAT[id + 'b'] = { id: id + 'b', parts: [{ p: B, s: 'c', w: 0.011 }] };
      PAT[id + 'c'] = { id: id + 'c', parts: [{ p: C, s: 'c', w: 0.011 }] };
    }
    return { id: id, pts: pts };
  }

  /* ---------- R3.6: curated palettes (5 roles each) and ten magic recipes ---------- */
  var LEAF = '#4FAE4A', CLAY = '#C65A2E'; // leaf green, terracotta (earthen diya bowls)
  var PALETTES = {
    marigold: { name: 'Marigold', c: ['#FF9F32', '#FFC93C', '#E0352B', '#FFF4DC', '#5DBB4A'] },
    mogra: { name: 'Marigold & mogra', c: ['#FF9F32', '#FFF4DC', '#E0352B', '#FFD778', '#5DBB4A'] },
    kumkum: { name: 'Kumkum & haldi', c: ['#E0352B', '#FFC93C', '#FF9F32', '#FFF4DC', '#DB59C8'] },
    jewel: { name: 'Jewel', c: ['#6271FF', '#DB59C8', '#1FB5A8', '#FFD778', '#FFF4DC'] },
    pastel: { name: 'Pastel', c: ['#FFB3C7', '#B9C3FF', '#9FE3D6', '#FFE6A8', '#FFF4DC'] },
    rice: { name: 'Rice & gold', c: ['#FFF4DC', '#FFD778', '#E9B95C', '#FFFFFF', '#FF9F32'] },
    ricered: { name: 'Rice & kumkum', c: ['#FFF4DC', '#E0352B', '#FF9F32', '#FFFFFF', '#FFD778'] },
    tricolour: { name: 'Tricolour', c: ['#FF9933', '#FFF4DC', '#2FA84F', '#5B6CFF', '#FFD778'] },
    peacock: { name: 'Peacock', c: ['#1FB5A8', '#6271FF', '#5DBB4A', '#FFD778', '#DB59C8'] },
    rani: { name: 'Rani pink', c: ['#DB59C8', '#FF7BAC', '#FFD778', '#FFF4DC', '#9B5BFF'] }
  };
  // size that lets n copies of a motif (half-width `half` in motif units) sit edge to edge on a ring of radius r
  function fitS(r, n, half, cap) { return Math.min(cap, Math.PI * r / n / half * 0.9); }
  function ring(p, r, n, s, c, x) { var o = { p: p, r: r, n: n, s: s, c: c }; if (x) for (var k in x) o[k] = x[k]; return o; }
  function centre(p, s, c, x) { return ring(p, 0, 1, s, c, x); }

  /* recipe: { id, name, sym[], pal[], order[], rot: true|false|'quarter', build(n, P, meta) -> ring specs }
     ring spec: { p motif, r radius, n copies, s size, c powder role, c2/c3 extra roles, hex fixed colour,
       alt [roles cycling per copy], off (fraction of a step), pair (mirrored pair half-angle), tilt, y + m (mirror),
       a (centre orientation), pts ([x,y] list instead of a ring), same (rides with the previous ring), soft, dur }
     orders: outward (as listed), petal (one copy at a time), pulse (whole rings on a beat), spiral, sweep */
  var RECIPES = [
    { id: 'lotus', name: 'Lotus Mandala', sym: [8, 12], pal: ['marigold', 'kumkum', 'rani', 'pastel'], order: ['outward', 'petal'],
      build: function (n) {
        var mid = pick(['diamond', 'dot']);
        return [
          centre('marigold', 0.1, 1), centre('dot', 0.034, 3, { same: true }),
          ring('lotus', 0.2, n, fitS(0.2, n, 1, 0.085), 0),
          ring('dot', 0.3, n, 0.017, 3, { off: 0.5, same: true }),
          ring('petal', 0.37, 2 * n, fitS(0.37, 2 * n, 0.55, 0.075), 1),
          ring('lotus', 0.57, n, fitS(0.57, n, 1, 0.135), 0, { off: 0.5 }),
          ring(mid, 0.57, n, mid === 'dot' ? 0.024 : 0.045, 2, { same: true }),
          ring(pick(['bindu', 'star']), 0.75, 2 * n, 0.036, 3),
          ring('petal', 0.87, 3 * n, fitS(0.87, 3 * n, 0.55, 0.05), pick([1, 4]), { off: 0.5 }),
          ring('dot', 0.965, 4 * n, 0.013, 2, { same: true })
        ];
      } },
    { id: 'kolam', name: 'Kolam Lattice', sym: [4], pal: ['rice', 'ricered'], order: ['outward'], rot: false, scale: false,
      build: function () {
        var m = pick([5, 6, 7]), K = kolamPrims(m), S = 0.9;
        var pts = K.pts.map(function (p) { return [p[0] * S, p[1] * S]; }).sort(function (a, b) { return (a[0] * a[0] + a[1] * a[1]) - (b[0] * b[0] + b[1] * b[1]); });
        return [
          ring('dot', 0, 0, 0.021, 1, { pts: pts, dur: 320 }),
          centre(K.id + 'a', S, 0, { soft: true, dur: 1100 }),
          centre(K.id + 'b', S, 0, { soft: true, dur: 1100 }),
          centre(K.id + 'c', S, 0, { soft: true, dur: 900 }),
          ring('loop', 0.83, 4, 0.11, 2),
          ring('dot', 0.83, 4, 0.02, 1, { same: true }),
          ring('dot', 0.95, 16, 0.013, 0, { off: 0.5 })
        ];
      } },
    { id: 'yantra', name: 'Tara Yantra', sym: [8, 12], pal: ['jewel', 'kumkum', 'rice'], order: ['pulse'], rot: false,
      build: function (n, P, meta) {
        var o = [centre('dot', 0.022, 3)], i;
        if (Math.random() < 0.45) {
          meta.name = 'Nakshatra Yantra';
          var sp = n === 8 ? starPrim(8, 3) : starPrim(12, 5);
          o.push(centre(sp, 0.3, 0, { soft: true, dur: 700 }));
          o.push(centre(sp, 0.18, 1, { a: -Math.PI / 2 + Math.PI / n, soft: true, dur: 700 }));
        } else {
          var k = pick([2, 3]);
          for (i = 0; i < k; i++) {
            var s = 0.12 + i * (0.18 / (k - 1));
            o.push(centre('tri', s, i % 2 ? 1 : 0, { soft: true, dur: 620 }));
            o.push(centre('tri', s * 0.94, i % 2 ? 0 : 1, { a: Math.PI / 2, soft: true, dur: 620, same: true }));
          }
        }
        o.push(centre('ring2', 0.34, 3, { soft: true }));
        o.push(ring('lotus', 0.4, n, 0.06, 0));
        o.push(centre('ring2', 0.47, 3, { soft: true }));
        o.push(ring('padma', 0.512, 2 * n, 0.042, 1, { off: 0.5 }));
        o.push(centre('ring', 0.565, 3, { soft: true }));
        o.push(centre('bhupura', 0.75, 2, { soft: true, dur: 900 }));
        o.push(ring('lotus', 0.92, 4, 0.05, 0, { off: 0.5 }));
        o.push(ring('dot', 0.965, 32, 0.012, 3));
        return o;
      } },
    { id: 'peacock', name: 'Mor Pankh', sym: [6, 8, 12], pal: ['peacock', 'jewel'], order: ['sweep'],
      build: function (n) {
        var tilt = pick([0, 0.2, -0.2]);
        return [
          centre('lotus', 0.1, 1), centre('dot', 0.03, 3, { same: true }),
          ring('padma', 0.2, 2 * n, fitS(0.2, 2 * n, 0.5, 0.07), 0, { off: 0.5 }),
          ring('feather', 0.47, n, 0.21, 2, { off: 0.5, c2: 1, c3: 3, tilt: tilt }),
          ring('feather', 0.55, n, 0.3, 0, { c2: 1, c3: 3, tilt: tilt }),
          ring('dot', 0.87, 2 * n, 0.02, 3, { off: 0.5 }),
          ring('petal', 0.935, 4 * n, fitS(0.935, 4 * n, 0.55, 0.045), 4)
        ];
      } },
    { id: 'paisley', name: 'Paisley Frieze', sym: [8, 12], pal: ['rani', 'kumkum', 'jewel'], order: ['sweep', 'spiral'],
      build: function (n) {
        return [
          centre('star', 0.11, 2), centre('dot', 0.034, 3, { same: true }),
          ring('petal', 0.21, n, fitS(0.21, n, 0.55, 0.075), 1),
          ring('dot', 0.31, 2 * n, 0.016, 3),
          ring('paisley', 0.46, n, 0.085, 0, { pair: Math.PI / n * 0.42 }),
          ring('diamond', 0.46, n, 0.05, 2, { off: 0.5, same: true }),
          ring('bindu', 0.62, 2 * n, 0.03, 3),
          ring('paisley', 0.79, Math.round(n * 1.5), 0.09, 1, { tilt: pick([0.95, -0.95]) }),
          ring('dot', 0.935, 3 * n, 0.015, 2, { off: 0.5 })
        ];
      } },
    { id: 'diya', name: 'Deepa Mandala', sym: [8, 12], pal: ['marigold', 'kumkum', 'rice'], order: ['petal'],
      build: function (n) {
        return [
          centre('marigold', 0.12, 0), centre('marigold', 0.066, 1, { same: true }), centre('dot', 0.024, 3, { same: true }),
          ring('lotus', 0.25, n, fitS(0.25, n, 1, 0.095), 1),
          ring('petal', 0.37, 2 * n, fitS(0.37, 2 * n, 0.55, 0.05), 0, { off: 0.5 }),
          centre('ring2', 0.5, 3, { soft: true }),
          ring('diya', 0.565, n, fitS(0.565, n, 0.92, 0.108), 2, { dur: 520, hex: CLAY }),
          ring('marigold', 0.555, n, 0.058, 0, { off: 0.5 }),
          ring('leaf', 0.72, n, 0.052, 4, { pair: Math.PI / n * 0.35, hex: LEAF }),
          ring('marigold', 0.86, 2 * n, fitS(0.86, 2 * n, 0.97, 0.056), 0, { alt: [0, 1] }),
          ring('dot', 0.965, 4 * n, 0.012, 3, { off: 0.5 })
        ];
      } },
    { id: 'chikku', name: 'Sankranti Chikku', sym: [6, 8], pal: ['rice', 'pastel', 'rani'], order: ['spiral'],
      build: function (n) {
        return [
          centre('kolam', 0.15, 0), centre('dot', 0.03, 1, { same: true }),
          ring('dot', 0.235, n, 0.019, 1, { off: 0.5 }),
          ring('chikku', 0.47, n, 0.24, 0, { m: true, y: 0.07 }),
          ring('dot', 0.47, n, 0.02, 1, { off: 0.5, same: true }),
          ring('dot', 0.61, 2 * n, 0.014, 3),
          ring('loop', 0.72, 2 * n, fitS(0.72, 2 * n, 0.55, 0.1), 2),
          ring('wave', 0.9, 3 * n, Math.PI * 0.9 / (3 * n), 0, { off: 0.25 }),
          ring('dot', 0.97, 3 * n, 0.011, 1, { off: 0.75 })
        ];
      } },
    { id: 'garland', name: 'Marigold Wreath', sym: [8, 12], pal: ['marigold', 'mogra'], order: ['outward'],
      build: function (n, P, meta) {
        if (Math.random() < 0.5) {
          meta.name = 'Floral Carpet'; meta.order = 'pulse'; meta.sym = 4;
          var o = [centre('marigold', 0.11, 0), centre('dot', 0.03, 3, { same: true })];
          [0.27, 0.47, 0.67, 0.86].forEach(function (r, i) {
            var cnt = Math.max(8, Math.round(TAU * r / 0.15 / 4) * 4);
            o.push(ring('marigold', r, cnt, fitS(r, cnt, 0.97, 0.07), 0, { alt: i % 2 ? [1, 0] : [0, 1] }));
            o.push(ring(i % 2 ? 'leaf' : 'petal', r + 0.1, cnt, 0.03, 2, { off: 0.5, same: true, hex: i % 2 ? LEAF : null }));
          });
          return o;
        }
        return [
          centre('marigold', 0.14, 0), centre('marigold', 0.08, 1, { same: true }), centre('dot', 0.028, 2, { same: true }),
          ring('leaf', 0.27, n, 0.07, 4, { hex: LEAF }),
          ring('petal', 0.36, 2 * n, 0.05, 2, { off: 0.5 }),
          ring('marigold', 0.5, n, fitS(0.5, n, 0.97, 0.085), 1),
          ring('marigold', 0.5, n, 0.055, 0, { off: 0.5, same: true }),
          ring('leaf', 0.66, 2 * n, 0.055, 4, { pair: Math.PI / (2 * n) * 0.4, hex: LEAF }),
          ring('marigold', 0.82, 3 * n, fitS(0.82, 3 * n, 0.97, 0.06), 0, { alt: [0, 1] }),
          ring('dot', 0.955, 3 * n, 0.015, 3, { off: 0.5 })
        ];
      } },
    { id: 'padma', name: 'Padma Chakra', sym: [8, 12], pal: ['rani', 'marigold', 'jewel', 'tricolour'], order: ['outward'],
      // listed outside-in, so each inner layer of petals is laid over the one behind it (a lotus opening inwards)
      build: function (n) {
        return [
          ring('dot', 0.968, 4 * n, 0.011, 4),
          ring('padma', 0.885, 4 * n, fitS(0.885, 4 * n, 0.52, 0.075), 2, { off: 0.5 }),
          ring('padma', 0.77, 3 * n, fitS(0.77, 3 * n, 0.52, 0.085), 0),
          ring('padma', 0.645, 2 * n, fitS(0.645, 2 * n, 0.52, 0.09), 1, { off: 0.5 }),
          ring('padma', 0.52, 2 * n, fitS(0.52, 2 * n, 0.52, 0.088), 2),
          ring('padma', 0.4, n, fitS(0.4, n, 0.52, 0.09), 0, { off: 0.5 }),
          centre('ring2', 0.27, 3, { soft: true }),
          ring('spoke', 0.165, 24, 0.095, 3),
          centre('ring', 0.062, 3, { soft: true }),
          centre('dot', 0.034, 4)
        ];
      } },
    { id: 'chowk', name: 'Chowk Squares', sym: [4, 8], pal: ['tricolour', 'kumkum', 'jewel', 'marigold'], order: ['outward'], rot: 'quarter',
      // outer wall first, every smaller square laid on top, turned 45deg so its corners touch the walls of the last
      build: function (n) {
        var lv = pick([4, 5]), h = 0.665, roles = [0, 1, 2, 4], o = [ring('lotus', 0.83, 4, 0.1, 0), ring('dot', 0.955, 8, 0.014, 3, { off: 0.5 })];
        for (var i = 0; i < lv; i++) {
          var turned = i % 2 === 1, a = -Math.PI / 2 + (turned ? Math.PI / 4 : 0);
          o.push(centre('sq', h, roles[i % 4], { a: a, soft: true, dur: 640 }));
          if (n === 8) o.push(centre('sq', h, roles[(i + 1) % 4], { a: a + Math.PI / 4, soft: true, dur: 640, same: true }));
          o.push(ring('dot', h * Math.SQRT2 - 0.05, n === 8 ? 8 : 4, 0.016, 3, { off: n === 8 ? 0 : (turned ? 0 : 0.5), same: true }));
          h /= Math.SQRT2;
        }
        o.push(centre(pick(['marigold', 'star', 'lotus']), h * 1.15, roles[lv % 4]));
        o.push(centre('dot', h * 0.35, 3, { same: true }));
        return o;
      } }
  ];

  var lastRecipe = '';
  function pickRecipe(id) {
    var forced = id ? RECIPES.filter(function (r) { return r.id === id; })[0] : null;
    var r = forced || pick(RECIPES.filter(function (x) { return x.id !== lastRecipe; }));
    lastRecipe = r.id;
    return r;
  }

  // Returns { rings:[{items:[{st, delay, dur, spark, soft}], r, start, end}], total, name, sym, palette, order, id }.
  // Individual stamps per copy so they sweep in; stamp order = paint order.
  function magicPlan(speed, recipe) {
    var K = speed || 1, red = isReduced();
    recipe = recipe || pickRecipe();
    var n = pick(recipe.sym), palKey = pick(recipe.pal), P = PALETTES[palKey].c;
    var meta = { name: recipe.name, order: pick(recipe.order), sym: n };
    var spec = recipe.build(n, P, meta), order = meta.order;
    var rot0 = recipe.rot === false ? 0 : recipe.rot === 'quarter' ? pick([0, Math.PI / 4]) : Math.random() * TAU / n;
    var sc = recipe.scale === false ? 1 : rnd(0.94, 1), cr = Math.cos(rot0), sr0 = Math.sin(rot0);
    var GAP = (order === 'pulse' ? 330 : order === 'petal' ? 190 : 250) * K;
    var SWEEP = (order === 'spiral' ? 3400 : 2600) * K;
    var rings = [], t = 0, start = 0, maxEnd = 0;
    spec.forEach(function (sp) {
      var cnt = sp.pts ? sp.pts.length : (sp.n || 1), items = [], ri = rings.length;
      var sweep = red || cnt === 1 ? 0 : sp.pts ? (420 + cnt * 9) * K : order === 'pulse' ? 70 * K : order === 'petal' ? Math.min(1400, cnt * 72) * K : (380 + cnt * 14) * K;
      if (!sp.same) { if (ri) t += GAP; start = t; t += sweep; }
      for (var k = 0; k < cnt; k++) {
        var col = sp.hex || P[sp.alt ? sp.alt[k % sp.alt.length] : sp.c], st, ang = 0;
        if (sp.pts) {
          var px = sp.pts[k][0] * sc, py = sp.pts[k][1] * sc;
          st = { p: sp.p, c: col, s: sp.s * sc, x: px * cr - py * sr0, y: px * sr0 + py * cr, n: 1, m: false, r0: 0, a: 0 };
          ang = Math.atan2(st.y, st.x);
        } else if (!sp.r) {
          st = { p: sp.p, c: col, s: sp.s * sc, x: 0, y: 0, n: 1, m: false, r0: 0, a: (sp.a != null ? sp.a : -Math.PI / 2) + rot0 };
        } else {
          var base = (k + (sp.off || 0)) * TAU / cnt + rot0, r = sp.r * sc;
          if (sp.pair) st = { p: sp.p, c: col, s: sp.s * sc, x: r * Math.cos(sp.pair), y: r * Math.sin(sp.pair), n: 1, m: true, r0: base, a: sp.pair + 0.35 };
          else { st = { p: sp.p, c: col, s: sp.s * sc, x: r, y: (sp.y || 0) * sc, n: 1, m: !!sp.m, r0: base }; if (sp.tilt) st.a = sp.tilt; }
          ang = base;
        }
        if (sp.c2 != null) st.c2 = P[sp.c2];
        if (sp.c3 != null) st.c3 = P[sp.c3];
        var d;
        if (red) d = start;
        else if ((order === 'spiral' || order === 'sweep') && cnt > 1) {
          var frac = ((((ang - rot0 + (order === 'spiral' ? (sp.r || 0) * 5.5 : 0)) % TAU) + TAU) % TAU) / TAU;
          d = ri * (order === 'spiral' ? 150 : 90) * K + frac * SWEEP;
        } else if (order === 'spiral' || order === 'sweep') d = ri * (order === 'spiral' ? 150 : 90) * K;
        else d = start + (cnt > 1 ? sweep * k / cnt : 0);
        var dur = red ? 260 : (sp.dur || 460);
        items.push({ st: st, delay: d, dur: dur, spark: !red && !sp.soft && (cnt === 1 || k % 2 === 0), soft: red || !!sp.soft });
        if (d + dur > maxEnd) maxEnd = d + dur;
      }
      rings.push({ items: items, r: sp.r || 0, start: start, end: start + sweep + 460 });
    });
    return { rings: rings, total: maxEnd + 700, id: recipe.id, name: meta.name, sym: meta.sym, palette: PALETTES[palKey].name, order: order };
  }
  function planStamps(plan) { var out = []; plan.rings.forEach(function (rg) { rg.items.forEach(function (it) { out.push(it.st); }); }); return out; }

  function randomPlan() {
    var cols = POWDERS.map(function (p) { return p.hex; });
    var stamps = [];
    var center = pick(['marigold', 'star', 'bindu']);
    stamps.push({ p: center, c: pick(cols), s: rnd(0.1, 0.14), x: 0, y: 0, n: 1, m: false, a: -Math.PI / 2, ring: 0 });
    var r = 0.2, ring = 1;
    while (r < 0.93) {
      var n = pick([8, 8, 12, 12, 16, 24]);
      var s = clamp(TAU * r / n * 0.42, 0.03, 0.095);
      if (r + s > 1) s = Math.max(0.02, 1 - r);
      var pid = pick(PATTERNS).id;
      var asym = pid === 'paisley' || pid === 'spiral';
      stamps.push({ p: pid, c: pick(cols), s: s, x: r, y: asym ? r * 0.06 : 0, n: n, m: asym, r0: Math.random() < 0.5 ? 0 : Math.PI / n, ring: ring });
      if (Math.random() < 0.45 && r + s * 1.8 < 0.98) {
        stamps.push({ p: 'bindu', c: pick(cols), s: s * 0.32, x: r + s * 1.25, y: 0, n: n * 2, m: false, r0: 0, ring: ring });
      }
      r += s * 2.15 + 0.025; ring++;
    }
    return stamps;
  }

  /* =====================================================================
     Studio UI
     ===================================================================== */
  var studio = null;

  function plateSVG() {
    return '<svg class="act-plate" viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M3 57 V22 Q3 15 10 14 L78 11 Q91 10 96 4 L100 1.5 L104 4 Q109 10 122 11 L190 14 Q197 15 197 22 V57 Z"/></svg>';
  }
  var ICONS = {
    undo: '<path d="M9 7 L4 12 L9 17"/><path d="M4 12 H14 a6 6 0 0 1 0 12 H11" transform="translate(0,-4)"/>',
    clear: '<path d="M14 3 L10 13"/><path d="M5 14 H15 L17 21 H3 Z"/><path d="M7 17 L6.5 21 M10 17 V21 M13 17 L13.5 21"/>',
    dice: '<rect x="4" y="4" width="16" height="16" rx="1"/><circle cx="8.5" cy="8.5" r="1.3"/><circle cx="15.5" cy="15.5" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="15.5" cy="8.5" r="1.3"/><circle cx="8.5" cy="15.5" r="1.3"/>',
    guides: '<circle cx="12" cy="12" r="8"/><path d="M12 2 V22 M2 12 H22 M5 5 L19 19 M19 5 L5 19" opacity=".6"/>',
    save: '<path d="M12 4 V15"/><path d="M7 10 L12 15 L17 10"/><path d="M4 19 H20"/>',
    mirror: '<path d="M12 3 V21" stroke-dasharray="2 2"/><path d="M9 7 L4 12 L9 17 Z"/><path d="M15 7 L20 12 L15 17 Z"/>',
    spark: '<path d="M12 2 Q12 12 22 12 Q12 12 12 22 Q12 12 2 12 Q12 12 12 2 Z"/>'
  };
  function icon(name, cls) {
    return '<svg class="' + (cls || 'ar-ico') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + ICONS[name] + '</svg>';
  }

  var COUNT_LINES = [
    [0, 'The floor is spotless. Suspiciously spotless.'],
    [1, 'First pinch of powder. The ancestors nod.'],
    [12, 'Nice. The neighbours are slowing down to look.'],
    [40, 'Okay, this is getting serious.'],
    [90, 'Aunties are taking photos for the family group.'],
    [180, 'Museum curators have been notified.'],
    [320, 'At this point the floor is mostly art.']
  ];
  var CLEAR_LINES = ['Swept clean. The broom thanks you.', 'Fresh floor. Zero judgement.', 'Gone. Like the last kaju katli.'];
  var RANDOM_LINES = ['Fresh design, straight from the universe.', 'The dice have taste.', 'Randomly brilliant. Take the credit.', 'Generated. Say you planned it.'];
  var MAGIC_LINES = ['Your mom just posted this on WhatsApp.', 'Aunty-approved. Certified. Laminated.', 'That took you zero hours. Tell them it took nine.'];

  function buildStudio(stage) {
    var root = document.createElement('div');
    root.className = 'act-rangoli';
    var uid = 'ar' + Math.random().toString(36).slice(2, 7);
    var patBtns = PATTERNS.map(function (p, i) {
      return '<button type="button" role="radio" class="ar-pat act-glow" data-pat="' + p.id + '" aria-checked="' + (i === 1 ? 'true' : 'false') + '" tabindex="' + (i === 1 ? '0' : '-1') + '" title="' + p.label + '"><canvas width="88" height="88" aria-hidden="true"></canvas><span class="ar-pat-name">' + p.label + '</span></button>';
    }).join('');
    var swatches = POWDERS.map(function (c, i) {
      var cs = colors(c.hex);
      return '<button type="button" role="radio" class="ar-swatch" data-col="' + c.hex + '" aria-checked="' + (i === 0 ? 'true' : 'false') + '" tabindex="' + (i === 0 ? '0' : '-1') + '" aria-label="' + c.name + ' powder" title="' + c.name + '" style="--sw:' + c.hex + ';--sw-l:' + cs.l + ';--sw-d:' + cs.d + '"><span class="ar-mound" aria-hidden="true"></span></button>';
    }).join('');
    root.innerHTML =
      '<p class="act-hint" data-hint>Tap or drag on the floor. Every mark repeats around the centre. Arrow keys and Enter work too.</p>' +
      '<div class="ar-layout">' +
        '<div class="ar-floor">' +
          '<div class="ar-board">' +
            '<div class="ar-canvas-wrap">' +
              '<canvas class="ar-canvas" tabindex="0" role="application" aria-roledescription="drawing floor" aria-label="Rangoli floor. Click or drag to place powder patterns; they repeat around the centre. Keyboard: arrow keys move the cursor, Enter or Space places a pattern, Z undoes." aria-describedby="' + uid + '-help"></canvas>' +
              '<span class="ar-breath" aria-hidden="true"></span>' +
              '<span class="ar-glints" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>' +
              '<p class="ar-coach" aria-hidden="true"><span>Tap or drag on the floor</span></p>' +
            '</div>' +
          '</div>' +
          '<p class="ar-style" data-style><span class="ar-style-k" data-style-k>Magic Rangoli</span><span class="ar-style-n" data-style-n>A new style every time</span></p>' +
          '<div class="ar-meta">' +
            '<p class="ar-count"><b data-count>0</b> <span data-count-label>stamps</span> <span class="ar-dot" aria-hidden="true"></span> <b data-pinch>0</b> pinches</p>' +
            '<p class="ar-quip" data-quip>' + COUNT_LINES[0][1] + '</p>' +
          '</div>' +
          '<p class="ar-sr" id="' + uid + '-help">Choose a pattern, a powder colour, a symmetry and a size in the tray, then draw on the floor. Every mark repeats around the centre.</p>' +
        '</div>' +
        '<aside class="ar-tray" aria-label="Rangoli tools">' +
          '<p class="ar-tray-head" aria-hidden="true"><span class="ar-tray-hi" lang="hi">रंग भरो</span><span class="ar-tray-en">Fill in the colours</span></p>' +
          '<div class="ar-group"><p class="ar-label" id="' + uid + '-pl">Pattern <span data-patname>Lotus</span></p><div class="ar-patterns" role="radiogroup" data-cols="5" aria-labelledby="' + uid + '-pl">' + patBtns + '</div></div>' +
          '<div class="ar-group"><p class="ar-label" id="' + uid + '-cl">Powder <span data-colname>Saffron</span></p><div class="ar-swatches" role="radiogroup" data-cols="5" aria-labelledby="' + uid + '-cl">' + swatches + '</div></div>' +
          '<div class="ar-group"><p class="ar-label" id="' + uid + '-sl">Symmetry <span data-symval>8-fold</span></p><div class="ar-sym seg" role="radiogroup" data-cols="1" aria-labelledby="' + uid + '-sl">' +
            [4, 6, 8, 12].map(function (n) { return '<button type="button" role="radio" class="ar-symbtn" data-sym="' + n + '" aria-checked="' + (n === 8 ? 'true' : 'false') + '" tabindex="' + (n === 8 ? '0' : '-1') + '" aria-label="' + n + '-fold symmetry"><span>' + n + '</span></button>'; }).join('') +
          '</div></div>' +
          '<div class="ar-group"><label class="ar-label" for="' + uid + '-size">Size <span data-sizeval>M</span></label>' +
            '<div class="ar-size"><span class="ar-size-dot ar-size-dot--s" aria-hidden="true"></span><input type="range" id="' + uid + '-size" min="0.5" max="2.2" step="0.05" value="1" aria-valuetext="Medium"><span class="ar-size-dot ar-size-dot--l" aria-hidden="true"></span></div></div>' +
          '<button type="button" class="btn-diya ar-magic" data-act="magic"><span data-magic-label>Magic Rangoli</span></button>' +
          '<div class="ar-tools">' +
            '<button type="button" class="ar-tool" data-act="undo">' + icon('undo') + '<span>Undo</span></button>' +
            '<button type="button" class="ar-tool" data-act="clear">' + icon('clear') + '<span>Clear</span></button>' +
            '<button type="button" class="ar-tool" data-act="save">' + icon('save') + '<span>Save</span></button>' +
            '<button type="button" class="ar-tool ar-more-btn" data-act="more" aria-expanded="false" aria-controls="' + uid + '-more"><svg class="ar-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="6" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="18" cy="12" r="1"/></svg><span>More</span></button>' +
          '</div>' +
          '<div class="ar-more" id="' + uid + '-more" hidden>' +
            '<button type="button" class="ar-tool" data-act="random">' + icon('dice') + '<span>Surprise</span></button>' +
            '<button type="button" class="ar-tool" data-mirror aria-pressed="true" title="Mirror each stamp across its spoke">' + icon('mirror') + '<span>Mirror</span></button>' +
            '<button type="button" class="ar-tool" data-act="guides" aria-pressed="true">' + icon('guides') + '<span>Guides</span></button>' +
          '</div>' +
        '</aside>' +
      '</div>' +
      '<p class="ar-sr" aria-live="polite" data-live></p>';
    stage.appendChild(root);
    return root;
  }

  function symGlyph(n) {
    var s = '';
    for (var k = 0; k < n; k++) {
      var a = k * TAU / n - Math.PI / 2;
      s += '<line x1="12" y1="12" x2="' + (12 + Math.cos(a) * 9).toFixed(2) + '" y2="' + (12 + Math.sin(a) * 9).toFixed(2) + '"/>';
    }
    return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9.5" opacity=".35"/>' + s + '<circle cx="12" cy="12" r="1.6" class="f"/></svg>';
  }

  function mountStudio(stage) {
    if (studio) return;
    var root = buildStudio(stage);
    var canvas = root.querySelector('.ar-canvas');
    var wrap = root.querySelector('.ar-canvas-wrap');
    var floor = createFloor(canvas, { slab: true, guides: true });
    var st = {
      pattern: 'lotus', color: POWDERS[0].hex, size: 1, sym: 8, mirror: true,
      history: [], drawing: null, last: null, kb: { x: 0.3, y: -0.3 }, magicRunning: false, inView: false,
      magicTimer: 0
    };
    floor.sym = st.sym; floor.mirror = st.mirror;
    var live = root.querySelector('[data-live]');
    var countEl = root.querySelector('[data-count]'), pinchEl = root.querySelector('[data-pinch]'), quipEl = root.querySelector('[data-quip]');
    var countLabel = root.querySelector('[data-count-label]');
    var magicBtn = root.querySelector('.ar-magic'), magicLabel = root.querySelector('[data-magic-label]');
    var coach = root.querySelector('.ar-coach');
    var styleEl = root.querySelector('[data-style]'), styleK = root.querySelector('[data-style-k]'), styleN = root.querySelector('[data-style-n]');

    /* --- R3.6: the style caption under the floor (tracked caps kicker + light serif name) --- */
    function showStyle(plan) {
      styleEl.classList.remove('is-on'); void styleEl.offsetWidth;
      styleK.textContent = 'Magic rangoli · ' + plan.sym + '-fold · ' + plan.palette;
      styleN.textContent = plan.name;
      styleEl.classList.add('is-on');
    }
    function hideStyle() { styleEl.classList.remove('is-on'); }

    /* --- R3.7: idle life. Seven mica glints catch the light on the powder, re-seated on every cycle
       where a stamp actually lies (CSS animations: compositor only; Calm hides them, pause/offscreen freeze them) --- */
    var glints = root.querySelectorAll('.ar-glints i');
    function seatGlint(g) {
      var x, y, list = floor.strokes, tries = 0;
      if (list.length) {
        while (tries++ < 4) {
          var s = list[(Math.random() * list.length) | 0]; if (!s || !s.length) continue;
          var t = s[(Math.random() * s.length) | 0]; if (!t) continue;
          var n = t.n || 1, rot = (t.r0 || 0) + TAU * ((Math.random() * n) | 0) / n, yy = t.m && Math.random() < 0.5 ? -t.y : t.y;
          x = t.x * Math.cos(rot) - yy * Math.sin(rot); y = t.x * Math.sin(rot) + yy * Math.cos(rot);
          break;
        }
      }
      if (x == null) { var a = Math.random() * TAU, r = Math.sqrt(Math.random()) * 0.92; x = Math.cos(a) * r; y = Math.sin(a) * r; }
      // floor radius R = css / 2.2, so a unit coordinate maps to 1/2.2 of the canvas width
      g.style.left = (50 + x / 2.2 * 100).toFixed(2) + '%';
      g.style.top = (50 + y / 2.2 * 100).toFixed(2) + '%';
    }
    Array.prototype.forEach.call(glints, function (g) { seatGlint(g); g.addEventListener('animationiteration', function () { seatGlint(g); }); });

    /* --- pattern tile previews --- */
    function paintPreviews() {
      var tiles = root.querySelectorAll('.ar-pat canvas');
      var d = Math.min(window.devicePixelRatio || 1, 3);
      for (var i = 0; i < tiles.length; i++) {
        var c = tiles[i], g = c.getContext('2d');
        // DPR-correct thumbnails: back the canvas with device pixels for its displayed size
        var px = Math.max(88, Math.round((c.clientWidth || 44) * d));
        if (c.width !== px) { c.width = px; c.height = px; }
        var k = px / 88;
        g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, px, px);
        g.setTransform(k, 0, 0, k, 44 * k, 44 * k); g.lineCap = 'round'; g.lineJoin = 'round';
        g.scale(30, 30);
        drawParts(g, PATTERNS[i].parts, colors(st.color), 30 * k);
      }
    }
    paintPreviews();

    /* --- sizing --- */
    function fit() {
      var w = wrap.clientWidth;
      if (!w) return;
      floor.resize(w);
      paintPreviews();
    }
    var ro = ('ResizeObserver' in window) ? new ResizeObserver(function () { fit(); }) : null;
    if (ro) ro.observe(wrap); else window.addEventListener('resize', fit);
    fit();

    /* --- model helpers --- */
    function stampAt(nx, ny) {
      return { p: st.pattern, c: st.color, s: 0.055 * st.size, x: nx, y: ny, n: st.sym, m: st.mirror, r0: 0 };
    }
    function totals() {
      var c = 0, pinch = 0;
      floor.strokes.forEach(function (s) { s.forEach(function (t) { c++; pinch += (t.n || 1) * (t.m ? 2 : 1); }); });
      return { c: c, pinch: pinch };
    }
    function updateCounts() {
      var t = totals();
      countEl.textContent = t.c; pinchEl.textContent = t.pinch;
      countLabel.textContent = t.c === 1 ? 'stamp' : 'stamps';
      var line = COUNT_LINES[0][1];
      for (var i = 0; i < COUNT_LINES.length; i++) if (t.c >= COUNT_LINES[i][0]) line = COUNT_LINES[i][1];
      if (quipEl.textContent !== line) quipEl.textContent = line;
      root.classList.toggle('is-empty', t.c === 0);
    }
    function announce(msg) { if (sr(msg)) return; live.textContent = ''; setTimeout(function () { live.textContent = msg; }, 30); }
    var hintEl = root.querySelector('[data-hint]');
    function hideHint() { if (hintEl) hintEl.classList.add('is-gone'); }
    function clientOf(nx, ny) { var r = canvas.getBoundingClientRect(), R0 = floor.R(); return { x: r.left + r.width / 2 + nx * R0, y: r.top + r.height / 2 + ny * R0 }; }

    function pointToNorm(e) {
      var r = canvas.getBoundingClientRect();
      var R = floor.R();
      return { x: (e.clientX - r.left - r.width / 2) / R, y: (e.clientY - r.top - r.height / 2) / R };
    }
    function inside(p) { return Math.sqrt(p.x * p.x + p.y * p.y) <= 1.0; }

    function placeAt(p, animate) {
      if (st.magicRunning) finishMagic(true);
      var stamp = stampAt(p.x, p.y);
      if (!st.drawing) st.drawing = [];
      st.drawing.push(stamp);
      if (st.drawing.length === 1) floor.strokes.push(st.drawing);
      if (animate && !isReduced()) floor.addAnimated([{ st: stamp, delay: 0, dur: 200 }]);
      else floor.bakeNow([stamp]);
      var first = st.drawing.length === 1;
      floor.ripple(p.x, p.y, first ? st.sym : 1, first && st.mirror, colors(st.color).l);
      if (first) { var cp = clientOf(p.x, p.y); impact(0.1, { x: cp.x, y: cp.y, color: st.color, kind: 'rangoli' }); haptic('tap'); st.lastBuzz = Date.now(); }
      else if (Date.now() - (st.lastBuzz || 0) > 140) { st.lastBuzz = Date.now(); haptic('select'); } // R4: a faint grain under a dragged stroke
      root.classList.remove('is-empty');
      coach.classList.add('is-gone');
      hideHint();
    }
    function endStroke() {
      if (st.drawing && st.drawing.length) {
        st.history.push({ type: 'add', stroke: st.drawing });
        updateCounts();
        if (st.history.length === 1 || Math.random() < 0.18) sfx('sparkle');
      }
      st.drawing = null; st.last = null;
    }

    /* --- pointer drawing --- */
    var lastPointerDown = 0;
    canvas.addEventListener('pointerdown', function (e) {
      lastPointerDown = Date.now();
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      st.inView = true; floor.resume();
      var p = pointToNorm(e);
      if (!inside(p)) return;
      e.preventDefault();
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      floor.ghost = null;
      st.drawing = null;
      placeAt(p, true);
      st.last = p;
    });
    canvas.addEventListener('pointermove', function (e) {
      var p = pointToNorm(e);
      if (st.drawing && st.last) {
        var spacing = Math.max(0.035, 0.055 * st.size * 1.55);
        var dx = p.x - st.last.x, dy = p.y - st.last.y, d = Math.sqrt(dx * dx + dy * dy);
        if (d >= spacing) {
          var steps = Math.min(12, Math.floor(d / spacing));
          for (var i = 1; i <= steps; i++) {
            var q = { x: st.last.x + dx * (i / steps), y: st.last.y + dy * (i / steps) };
            if (inside(q)) placeAt(q, true);
          }
          st.last = p;
        }
      } else if (e.pointerType === 'mouse') {
        floor.ghost = inside(p) && !st.magicRunning ? stampAt(p.x, p.y) : null;
        floor.render();
      }
    });
    function up() { endStroke(); }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('lostpointercapture', up);
    canvas.addEventListener('pointerleave', function () { if (floor.ghost) { floor.ghost = null; floor.render(); } });

    /* --- keyboard drawing --- */
    canvas.addEventListener('focus', function () {
      // keyboard focus only (a click also focuses the canvas; no reticle then)
      if (Date.now() - lastPointerDown > 350) { floor.reticle = st.kb; floor.render(); }
    });
    canvas.addEventListener('blur', function () { floor.reticle = null; floor.ghost = null; floor.render(); });
    canvas.addEventListener('keydown', function (e) {
      var step = e.shiftKey ? 0.08 : 0.025, k = e.key, moved = false;
      if (k === 'ArrowLeft') { st.kb.x -= step; moved = true; }
      else if (k === 'ArrowRight') { st.kb.x += step; moved = true; }
      else if (k === 'ArrowUp') { st.kb.y -= step; moved = true; }
      else if (k === 'ArrowDown') { st.kb.y += step; moved = true; }
      else if (k === 'Enter' || k === ' ') {
        e.preventDefault();
        st.drawing = null; placeAt({ x: st.kb.x, y: st.kb.y }, true); endStroke();
        announce(PAT[st.pattern].label + ' placed, ' + st.sym + '-fold.');
        return;
      } else if (k === 'z' || k === 'Z' || (k === 'Backspace')) { e.preventDefault(); undo(); return; }
      if (moved) {
        e.preventDefault();
        var d = Math.sqrt(st.kb.x * st.kb.x + st.kb.y * st.kb.y);
        if (d > 0.98) { st.kb.x *= 0.98 / d; st.kb.y *= 0.98 / d; }
        floor.reticle = st.kb;
        floor.ghost = stampAt(st.kb.x, st.kb.y);
        floor.render();
      }
    });

    /* --- tray controls --- */
    // radiogroups: one tab stop per group (roving tabindex); arrows move and select, Home/End jump
    function setPressed(sel, el) {
      root.querySelectorAll(sel).forEach(function (b) {
        var on = b === el;
        b.setAttribute('aria-checked', on ? 'true' : 'false');
        b.setAttribute('tabindex', on ? '0' : '-1');
      });
    }
    root.querySelectorAll('[role="radiogroup"]').forEach(function (g) {
      g.addEventListener('keydown', function (e) {
        var items = Array.prototype.slice.call(g.querySelectorAll('[role="radio"]'));
        var i = items.indexOf(document.activeElement); if (i < 0) return;
        var cols = +g.getAttribute('data-cols') || 1, n = items.length, j = -1, k = e.key;
        if (k === 'ArrowRight') j = (i + 1) % n;
        else if (k === 'ArrowLeft') j = (i - 1 + n) % n;
        else if (k === 'ArrowDown') j = cols > 1 ? (i + cols) % n : (i + 1) % n;
        else if (k === 'ArrowUp') j = cols > 1 ? (i - cols + n) % n : (i - 1 + n) % n;
        else if (k === 'Home') j = 0;
        else if (k === 'End') j = n - 1;
        if (j < 0) return;
        e.preventDefault();
        items[j].focus();
        items[j].click();
      });
    });
    root.querySelector('.ar-patterns').addEventListener('click', function (e) {
      var b = e.target.closest('.ar-pat'); if (!b) return;
      st.pattern = b.getAttribute('data-pat'); setPressed('.ar-pat', b);
      root.querySelector('[data-patname]').textContent = PAT[st.pattern].label;
      announce(PAT[st.pattern].label + ' selected');
    });
    root.querySelector('.ar-swatches').addEventListener('click', function (e) {
      var b = e.target.closest('.ar-swatch'); if (!b) return;
      st.color = b.getAttribute('data-col'); setPressed('.ar-swatch', b);
      var name = (POWDERS.filter(function (p) { return p.hex === st.color; })[0] || {}).name || '';
      root.querySelector('[data-colname]').textContent = name;
      paintPreviews();
      announce(name + ' powder selected');
    });
    root.querySelector('.ar-sym').addEventListener('click', function (e) {
      var b = e.target.closest('.ar-symbtn'); if (!b) return;
      st.sym = +b.getAttribute('data-sym'); setPressed('.ar-symbtn', b);
      root.querySelector('[data-symval]').textContent = st.sym + '-fold';
      floor.sym = st.sym; floor.render();
      announce(st.sym + '-fold symmetry');
    });
    var mirrorBtn = root.querySelector('[data-mirror]');
    mirrorBtn.addEventListener('click', function () {
      st.mirror = !st.mirror; mirrorBtn.setAttribute('aria-pressed', st.mirror ? 'true' : 'false');
      floor.mirror = st.mirror; floor.render();
    });
    var sizeIn = root.querySelector('input[type=range]'), sizeVal = root.querySelector('[data-sizeval]');
    function sizeName(v) { return v < 0.75 ? 'XS' : v < 1.05 ? 'M' : v < 1.5 ? 'L' : 'XL'; }
    sizeIn.addEventListener('input', function () {
      st.size = +sizeIn.value; sizeVal.textContent = sizeName(st.size);
      sizeIn.setAttribute('aria-valuetext', { XS: 'Small', M: 'Medium', L: 'Large', XL: 'Extra large' }[sizeName(st.size)]);
      sizeIn.style.setProperty('--fill', ((st.size - 0.5) / 1.7 * 100).toFixed(1) + '%');
    });
    sizeIn.style.setProperty('--fill', ((1 - 0.5) / 1.7 * 100).toFixed(1) + '%');

    function undo() {
      if (st.magicRunning) finishMagic(true);
      var h = st.history.pop();
      if (!h) { toast('Nothing to undo. Your conscience is clean.'); return; }
      floor.finishAll();
      if (h.type === 'magic') hideStyle();
      if (h.type === 'add') {
        var i = floor.strokes.indexOf(h.stroke); if (i >= 0) floor.strokes.splice(i, 1);
      } else {
        floor.strokes.length = 0; Array.prototype.push.apply(floor.strokes, h.prev);
      }
      floor.rebake(); updateCounts(); announce('Undone');
    }
    function replaceWith(newStrokes, type, animated) {
      st.history.push({ type: type || 'replace', prev: floor.strokes.slice() });
      floor.finishAll();
      // stamps about to animate in must not be baked yet
      if (animated) newStrokes.forEach(function (s) { s.forEach(function (t) { t._pending = true; }); });
      floor.strokes.length = 0;
      Array.prototype.push.apply(floor.strokes, newStrokes);
      floor.rebake();
    }
    function clearAll() {
      if (st.magicRunning) finishMagic(true);
      if (!floor.strokes.length) { toast('Already spotless. Mom would be proud.'); return; }
      replaceWith([], 'clear'); hideStyle();
      floor.rebake(); updateCounts(); sfx('whoosh'); toast(pick(CLEAR_LINES)); announce('Floor cleared');
      shake(1.5, 220); haptic('light');
    }
    function randomize() {
      if (st.magicRunning) finishMagic(true);
      var stamps = randomPlan();
      replaceWith([stamps], 'random', true); hideStyle();
      var red = isReduced();
      floor.addAnimated(stamps.map(function (s) { return { st: s, delay: red ? 0 : s.ring * 110, dur: red ? 200 : 520, spark: !red && s.ring % 2 === 1, soft: red }; }));
      updateCounts(); sfx('spin'); toast(pick(RANDOM_LINES)); announce('Random rangoli created');
      coach.classList.add('is-gone'); hideHint();
      var cc = canvasClientPoint(0, 0); impact(0.22, { x: cc.x, y: cc.y, color: GOLD, kind: 'rangoli' });
      haptic('light');
    }
    function save() {
      try {
        var out = floor.exportPNG();
        var a = document.createElement('a');
        a.download = 'e2m-diwali-rangoli.png';
        a.href = out.toDataURL('image/png');
        document.body.appendChild(a); a.click(); a.remove();
        toast('Saved. Frame it, or set it as the team DP.');
      } catch (err) { toast('Could not save here. Try a screenshot, Picasso.'); }
    }
    var guidesBtn = root.querySelector('[data-act="guides"]');
    var moreBtn = root.querySelector('.ar-more-btn'), morePanel = root.querySelector('.ar-more');
    function setMore(open) {
      moreBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) morePanel.removeAttribute('hidden'); else morePanel.setAttribute('hidden', '');
    }
    root.querySelector('.ar-tray').addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var a = b.getAttribute('data-act');
      if (a === 'more') setMore(moreBtn.getAttribute('aria-expanded') !== 'true');
      else if (a === 'undo') undo();
      else if (a === 'clear') clearAll();
      else if (a === 'random') randomize();
      else if (a === 'save') save();
      else if (a === 'guides') { floor.guides = !floor.guides; guidesBtn.setAttribute('aria-pressed', floor.guides ? 'true' : 'false'); floor.render(); }
    });

    /* --- MAGIC --- */
    function canvasClientPoint(nx, ny) {
      var r = canvas.getBoundingClientRect(), R = floor.R();
      return { x: r.left + r.width / 2 + nx * R, y: r.top + r.height / 2 + ny * R };
    }
    function runMagic(styleId) {
      if (st.magicRunning) { finishMagic(false); return; }
      var plan = magicPlan(1, typeof styleId === 'string' ? pickRecipe(styleId) : null);
      var stamps = planStamps(plan);
      st.magicStamps = stamps;
      replaceWith([stamps], 'magic', true);
      showStyle(plan);
      var all = [];
      var red = isReduced();
      plan.rings.forEach(function (rg, ri) {
        rg.items.forEach(function (it, k) {
          if (k === 0) {
            it.onStart = function () {
              if (!red) {
                floor.pulse(Math.max(0.06, rg.r), 900);
                if (ri % 3 === 0) { sfx('sparkle'); }
                if (ri % 4 === 1 && st.inView) {
                  var ang = Math.random() * TAU, pt = canvasClientPoint(Math.cos(ang) * rg.r, Math.sin(ang) * rg.r);
                  fx('sparkBurst', pt.x, pt.y, GOLD, 12);
                }
              }
            };
          }
          all.push(it);
        });
      });
      floor.addAnimated(all);
      st.magicRunning = true; root.classList.add('is-magic'); magicBtn.classList.add('is-lit');
      magicLabel.textContent = 'Finish now';
      coach.classList.add('is-gone'); hideHint();
      announce(plan.name + ', ' + plan.sym + '-fold, in ' + plan.palette + '. The magic rangoli is drawing itself; press Finish now to complete it.');
      updateCounts();
      sfx('chime'); haptic('light'); shake(1.2, 200);
      clearTimeout(st.magicTimer);
      floor.onIdle = function () { if (st.magicRunning) finishMagic(false, true); };
    }
    function finishMagic(silent, natural) {
      if (!st.magicRunning) return;
      st.magicRunning = false; root.classList.remove('is-magic'); magicBtn.classList.remove('is-lit');
      magicLabel.textContent = 'Magic Rangoli';
      floor.onIdle = null;
      if (!natural) floor.finishAll();
      if (!silent) {
        sfx('win');
        if (!isReduced()) {
          fx('petals', isMobile() ? 12 : 22);
          var c = canvasClientPoint(0, 0);
          fx('sparkBurst', c.x, c.y, GOLD, 26);
        }
        var c2 = canvasClientPoint(0, 0);
        impact(0.36, { x: c2.x, y: c2.y, color: GOLD, kind: 'rangoli' });
        haptic('success'); // R4: the magic rangoli is finished
        sfx('thump');
        floor.pulse(1.0, 1400); floor.pulse(0.66, 1100);
        toast(pick(MAGIC_LINES));
        announce((styleN.textContent || 'Magic rangoli') + ' complete. ' + totals().c + ' stamps.');
      }
    }
    // on narrow screens the tray sits under the floor: a Magic press brings the floor into view so the
    // drawing is actually seen
    function revealFloor() {
      var r = wrap.getBoundingClientRect(), vh = window.innerHeight || 0;
      if (r.top >= 0 && r.bottom <= vh) return;
      if (r.top < vh * 0.35 && r.bottom > vh * 0.65) return;
      try { wrap.scrollIntoView({ behavior: isReduced() ? 'auto' : 'smooth', block: 'center' }); } catch (e) { wrap.scrollIntoView(); }
    }
    magicBtn.addEventListener('click', function () { var was = st.magicRunning; runMagic(); if (!was) revealFloor(); });

    // R4: every press in the studio answers: radio swatches/patterns a faint select, buttons a tap
    // (primary actions fire their own, stronger haptic first; core rate-limits the follow-up)
    root.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button, [role="radio"]');
      if (b && root.contains(b)) haptic(b.getAttribute('role') === 'radio' ? 'select' : 'tap');
    });

    /* --- hover warm glow on tray tiles --- */
    root.addEventListener('pointermove', function (e) {
      var t = e.target.closest && e.target.closest('.act-glow');
      if (!t) return;
      var r = t.getBoundingClientRect();
      t.style.setProperty('--gx', (e.clientX - r.left) + 'px');
      t.style.setProperty('--gy', (e.clientY - r.top) + 'px');
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) floor.pause(); else if (st.inView) floor.resume();
    });

    updateCounts();
    root.classList.add('is-empty');

    studio = {
      root: root, floor: floor, state: st,
      enter: function () { st.inView = true; root.classList.remove('is-off'); floor.resume(); fit(); },
      leave: function () { st.inView = false; root.classList.add('is-off'); floor.pause(); floor.ghost = null; },
      magic: function (styleId) { if (!st.magicRunning) runMagic(styleId); return new Promise(function (res) { var t0 = Date.now(); (function wait() { if (!st.magicRunning || Date.now() - t0 > 15000) res(); else setTimeout(wait, 200); })(); }); },
      isEmpty: function () { return floor.strokes.length === 0 || totals().c === 0; },
      fillInstant: function () {
        var plan = magicPlan(), stamps = planStamps(plan);
        st.magicStamps = stamps;
        replaceWith([stamps], 'magic'); updateCounts(); coach.classList.add('is-gone'); showStyle(plan);
      }
    };
  }

  /* =====================================================================
     E2M.rangoliAnimate(opts?) - used by the finale.
       opts: Element | { target: Element, size: px, hold: ms, style: recipe id (R3.6, optional) }
       Every call draws a random magic style (never the same one twice in a row) unless style names one.
       - with a target element: blooms a rangoli INSIDE it (absolutely positioned, clipped to the target)
       - without one, while the studio is on screen: plays MAGIC in the studio frame
       - otherwise: no overlay at all (Revision 5 b). An empty studio is quietly filled with a finished
         style so it is waiting there when the visitor scrolls back; nothing is drawn on the page.
     Returns a Promise that resolves when the drawing has finished.
     ===================================================================== */
  function rangoliAnimate(opts) {
    if (opts && opts.nodeType === 1) opts = { target: opts };
    opts = opts || {};
    if (!opts.target && studio && studio.state.inView) return studio.magic(opts.style);
    if (studio && studio.isEmpty()) { try { studio.fillInstant(); } catch (e) { /* ignore */ } }
    // R5 (b): never a fixed, full-viewport overlay — without a target there is nothing to draw on the page
    if (!opts.target || opts.target.nodeType !== 1) return Promise.resolve();

    var host = opts.target;
    var layer = document.createElement('div');
    layer.className = 'act-rangoli-bloom is-inline';
    layer.setAttribute('aria-hidden', 'true');
    var cv = document.createElement('canvas');
    layer.appendChild(cv);
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    host.appendChild(layer);
    var box = host.getBoundingClientRect();
    var size = opts.size || Math.max(200, Math.min(box.width, box.height) * 0.92);
    var floor = createFloor(cv, { slab: false, guides: false, glow: 0.6 });
    floor.resize(size);
    var plan = magicPlan(1, opts.style ? pickRecipe(opts.style) : null), all = [];
    plan.rings.forEach(function (rg, ri) {
      rg.items.forEach(function (it, k) {
        if (k === 0) it.onStart = function () { floor.pulse(Math.max(0.06, rg.r), 900); if (ri % 4 === 0) sfx('sparkle'); };
        all.push(it);
      });
    });
    floor.strokes.push(all.map(function (i) { return i.st; }));
    requestAnimationFrame(function () { layer.classList.add('is-on'); });
    floor.addAnimated(all);
    function onVis() { if (document.hidden) floor.pause(); else floor.resume(); }
    document.addEventListener('visibilitychange', onVis);
    return new Promise(function (resolve) {
      var hold = opts.hold == null ? 2600 : opts.hold;
      var fading = false, holdT = 0, capT = 0;
      function fadeOut() {
        if (fading) return; fading = true;
        floor.onIdle = null; clearTimeout(holdT); clearTimeout(capT);
        layer.classList.add('is-out');
        setTimeout(function () {
          document.removeEventListener('visibilitychange', onVis);
          floor.pause();
          if (opts.keep) { resolve(layer); return; }
          layer.remove(); resolve();
        }, 1400);
      }
      // hard cap: the inline layer never lingers, even if a frame stalls (or the tab sleeps mid-draw)
      if (!opts.keep) capT = setTimeout(fadeOut, (plan.total || 9000) + hold + 6000);
      floor.onIdle = function () {
        floor.onIdle = null;
        holdT = setTimeout(fadeOut, opts.keep ? 0 : hold);
      };
    });
  }

  /* ---------- registration ---------- */
  var spec = {
    mount: function (stageEl) { if (stageEl && !studio) mountStudio(stageEl); },
    onEnter: function () { if (studio) studio.enter(); },
    onLeave: function () { if (studio) studio.leave(); }
  };

  function boot() {
    var api = window.E2M;
    if (!api || typeof api.register !== 'function') return false;
    ensureCss('act-rangoli');
    api.rangoliAnimate = rangoliAnimate;
    api.register(KEY, spec);
    return true;
  }
  if (!boot()) document.addEventListener('DOMContentLoaded', boot);
})();
