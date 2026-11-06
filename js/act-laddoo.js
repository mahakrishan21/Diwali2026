/* E2M Diwali - Activity 04: Laddoo Catcher
   30-second catch game at the mithai stall. Canvas-drawn sweets, a woven basket,
   mouse / touch / keyboard (arrows, A-D) control, ramping difficulty, streak
   multiplier, funny miss reactions, best score via E2M.score. */
(function () {
  'use strict';

  var KEY = 'laddoo';
  var TAU = Math.PI * 2;
  var DURATION = 30;
  var SCRIPT_SRC = (document.currentScript && document.currentScript.src) || '';

  function E() { return window.E2M || {}; }
  function isReduced() { return !!E().reduced; }
  function isMobile() { return !!E().mobile; }
  function sfx(n, o) { try { var a = E().audio; if (a && a.play) a.play(n, o); } catch (e) { /* no-op */ } }
  /* Revision 2 — immersion + accessibility hooks (all guarded: core.js may be older) */
  function impact(p, o) { try { var A = E(); if (typeof A.impact === 'function') A.impact(p, o || {}); } catch (e) { /* decorative */ } }
  /* Revision 4 — haptics + translate-only shake (core gates both by prefs / Calm / pause / reduced motion) */
  function haptic(n, p) { try { var A = E(); if (typeof A.haptic === 'function') A.haptic(n, p); } catch (e) { /* decorative */ } }
  function shake(px, ms, o) { try { var A = E(); if (typeof A.shake === 'function') A.shake(px, ms, o); } catch (e) { /* decorative */ } }
  function sr(msg, assertive) { try { var A = E(); if (typeof A.announce === 'function') { A.announce(msg, { assertive: !!assertive }); return true; } } catch (e) { /* fall back */ } return false; }
  function isPausedPref() { try { var A = E(); return A.isPaused ? !!A.isPaused() : false; } catch (e) { return false; } }
  function shakeOn() { var A = E(); return !isReduced() && !(A.prefs && A.prefs.shake === false) && !isPausedPref(); }
  function fx(name) {
    var args = Array.prototype.slice.call(arguments, 1);
    try { var f = E().fx; if (f && typeof f[name] === 'function') f[name].apply(f, args); } catch (e) { /* no-op */ }
  }
  function getBest() { try { return +(E().score && E().score.get(KEY)) || 0; } catch (e) { return 0; } }
  function setBest(v) { try { return !!(E().score && E().score.setBest(KEY, v)); } catch (e) { return false; } }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[(Math.random() * a.length) | 0]; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function seeded(s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function ensureCss(name) {
    if (document.querySelector('link[href*="' + name + '.css"]')) return;
    var l = document.createElement('link'); l.rel = 'stylesheet';
    l.href = SCRIPT_SRC ? SCRIPT_SRC.replace(/js\/[^\/?#]+([?#].*)?$/, 'css/' + name + '.css') : 'css/' + name + '.css';
    document.head.appendChild(l);
  }

  /* ------------------------------------------------------------------ */
  /* R3.4 full-screen effects — B4 shared pattern, private to this file. */
  /* E2M.screenLayer(key,{z:'back'}): a fixed viewport canvas above the  */
  /* sky + scenery and BELOW zone text/controls; core fades it with the  */
  /* zone (layer.visible). One pooled particle list, cached sprites (no  */
  /* per-frame gradients or literals), rAF only while something lives;   */
  /* nothing is drawn while the layer is hidden, the tab is hidden or    */
  /* motion is paused. Calm/reduced = level .35 (few, slow, no swirl).   */
  /*   var sfx = makeScreenFx('<zoneKey>');                              */
  /*   sfx.level()  -> 0 paused | .35 calm | 1 standard | 1.3 max        */
  /*   sfx.spawn(kind,x,y,vx,vy,life,size,hex) -> pooled p | null        */
  /*      kinds: 'spark' additive streak, 'dot' additive glow,           */
  /*      'wash' additive soft light, 'petal'/'conf' tumbling solids,    */
  /*      'custom' -> p.draw(ctx,p,a)                                    */
  /*      extra fields you may set after spawn: g (gravity px/s2),      */
  /*      drag (per-60fps-frame factor), rot, vr, sway, w, h, fl         */
  /*      (flicker 0..1), bounce (restitution) + floor (viewport y),     */
  /*      draw, data                                                     */
  /*   sfx.hook(fn)  fn(ctx,dt,t,L,lvl) -> true while it wants frames;   */
  /*      drawn under the particles (washes, wheels, blooms)            */
  /*   sfx.glow(hex,power,x,y)  E2M.screenGlow (flash-safe, guarded)     */
  /*   sfx.sprite(hex) 64px glow sprite; sfx.soft(hex) 128px wash sprite */
  /*   sfx.paint(ctx,dpr,ox,oy,w,h,mode?,alpha?) mirror (mode true = light only, 2 = solids only) the live particles into an    */
  /*      opaque stage canvas whose viewport origin is (ox,oy), so the   */
  /*      effect reads as one continuous full-screen layer through it   */
  /*   sfx.kick() ensure the loop; sfx.clear() drop everything           */
  /* ------------------------------------------------------------------ */
  function makeScreenFx(key, zOpt) {
    var L = null, raf = 0, last = 0, parts = [], pool = [], hooks = [], spr = {}, cols = [], TAU2 = Math.PI * 2;
    function A() { return window.E2M || {}; }
    function layer() {
      if (L) return L;
      var a = A();
      if (typeof a.screenLayer !== 'function') return null;
      try { L = a.screenLayer(key, { z: zOpt || 'back' }) || null; } catch (e) { L = null; }
      return L;
    }
    function paused() { var a = A(); return document.hidden || !!(a.isPaused && a.isPaused()); }
    function level() {
      var a = A();
      if (paused()) return 0;
      if (a.isCalm ? a.isCalm() : a.reduced) return 0.35;
      var k = a.intensity ? Number(a.intensity()) : 1;
      return k > 0 ? k : 1;
    }
    function cap() { var a = A(); return Math.round(Math.min(720, (Number(a.maxParticles) || 600) * 0.8)); }
    function rgbOf(hex) { var n = parseInt(String(hex).slice(1), 16); return (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255); }
    function sprite(hex) {
      var s = spr[hex]; if (s) return s;
      s = document.createElement('canvas'); s.width = s.height = 64;
      var g = s.getContext('2d'), c = rgbOf(hex), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.12, 'rgba(' + c + ',1)');
      gr.addColorStop(0.38, 'rgba(' + c + ',.36)'); gr.addColorStop(1, 'rgba(' + c + ',0)');
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      return (spr[hex] = s);
    }
    function soft(hex) {
      var k = hex + '~', s = spr[k]; if (s) return s;
      s = document.createElement('canvas'); s.width = s.height = 128;
      var g = s.getContext('2d'), c = rgbOf(hex), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, 'rgba(' + c + ',.6)'); gr.addColorStop(0.35, 'rgba(' + c + ',.24)');
      gr.addColorStop(0.7, 'rgba(' + c + ',.06)'); gr.addColorStop(1, 'rgba(' + c + ',0)');
      g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
      return (spr[k] = s);
    }
    function spawn(kind, x, y, vx, vy, life, size, hex) {
      if (parts.length >= cap() || !layer()) return null;
      var p = pool.pop() || {};
      p.k = kind; p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.life = p.max = life; p.size = size; p.c = hex || '#FFD778';
      p.g = 0; p.drag = 1; p.rot = Math.random() * TAU2; p.vr = 0; p.sway = 0; p.ph = Math.random() * TAU2;
      p.w = size; p.h = size; p.fl = 0; p.a = 1; p.draw = null; p.data = null; p.bounce = 0; p.floor = 0;
      parts.push(p);
      if (!raf) kick();
      return p;
    }
    function recycleAll() { for (var i = 0; i < parts.length; i++) { parts[i].draw = null; parts[i].data = null; pool.push(parts[i]); } parts.length = 0; }
    function clear() { recycleAll(); hooks.length = 0; if (L) { try { L.clear(); } catch (e) { /* ok */ } } }
    function kick() { if (!raf && layer()) { last = 0; raf = requestAnimationFrame(frame); } }
    function hook(fn) { if (hooks.indexOf(fn) < 0) hooks.push(fn); kick(); }
    function glow(hex, power, x, y) { try { var a = A(); if (typeof a.screenGlow === 'function') a.screenGlow(hex, power, x, y); } catch (e) { /* decorative */ } }
    // one draw routine for the layer itself and for any stage canvas mirroring it (offset ox,oy, culled to w,h)
    function drawParts(c, dpr, ox, oy, cw, ch, lightOnly, mul) {
      var i, p, a, x, y; mul = mul == null ? 1 : mul;
      c.globalCompositeOperation = 'lighter';
      if (lightOnly !== 2) {
      // spark streaks: one batched path per colour (skipped while a spark fades out), so a full shower costs a
      // handful of strokes, not hundreds
      cols.length = 0;
      for (i = 0; i < parts.length; i++) if (parts[i].k === 'spark' && cols.indexOf(parts[i].c) < 0) cols.push(parts[i].c);
      c.lineWidth = 1.25; c.lineCap = 'round'; c.globalAlpha = 0.72 * mul;
      for (var ci = 0; ci < cols.length; ci++) {
        c.strokeStyle = cols[ci]; c.beginPath();
        for (i = 0; i < parts.length; i++) {
          p = parts[i];
          if (p.k !== 'spark' || p.c !== cols[ci] || p.life < p.max * 0.35) continue;
          x = p.x - ox; y = p.y - oy;
          if (x < -20 || y < -40 || x > cw + 20 || y > ch + 40) continue;
          c.moveTo(x - p.vx * 0.05, y - p.vy * 0.05); c.lineTo(x, y);
        }
        c.stroke();
      }
      for (i = 0; i < parts.length; i++) {
        p = parts[i];
        if (p.k !== 'spark' && p.k !== 'dot' && p.k !== 'wash') continue;
        x = p.x - ox; y = p.y - oy;
        var rad = p.k === 'wash' ? p.size : p.size * 2 + 8;
        if (x < -rad || y < -rad || x > cw + rad || y > ch + rad) continue;
        a = p.life / p.max; a = (a < 0.35 ? a / 0.35 : 1) * p.a * mul;
        if (p.fl && Math.random() < p.fl) a *= 0.25;
        if (p.k === 'spark') {
          c.globalAlpha = a; c.drawImage(sprite(p.c), x - p.size * 2, y - p.size * 2, p.size * 4, p.size * 4);
        } else if (p.k === 'dot') {
          c.globalAlpha = a; c.drawImage(sprite(p.c), x - p.size * 2, y - p.size * 2, p.size * 4, p.size * 4);
        } else {
          c.globalAlpha = a * a; c.drawImage(soft(p.c), x - p.size, y - p.size, p.size * 2, p.size * 2);
        }
      }
      }
      c.globalCompositeOperation = 'source-over';
      for (i = 0; lightOnly !== true && i < parts.length; i++) {
        p = parts[i];
        if (p.k === 'spark' || p.k === 'dot' || p.k === 'wash') continue;
        x = p.x - ox; y = p.y - oy;
        var rr = Math.max(p.w, p.h, p.size) * 1.5 + 6;
        if (x < -rr || y < -rr || x > cw + rr || y > ch + rr) continue;
        a = p.life / p.max; a = (a < 0.3 ? a / 0.3 : 1) * p.a * mul;
        var cr = Math.cos(p.rot), sn = Math.sin(p.rot), flip = p.k === 'custom' ? 1 : Math.cos(p.ph * 1.6);
        c.globalAlpha = a;
        c.setTransform(dpr * cr, dpr * sn, -dpr * sn * flip, dpr * cr * flip, dpr * x, dpr * y);
        if (p.k === 'custom' && p.draw) { try { p.draw(c, p, a); } catch (e) { p.life = 0; } }
        else if (p.k === 'conf') { c.fillStyle = p.c; c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); }
        else { // petal
          c.fillStyle = p.c; c.beginPath(); c.moveTo(0, -p.h / 2);
          c.quadraticCurveTo(p.w * 0.62, -p.h * 0.1, 0, p.h / 2); c.quadraticCurveTo(-p.w * 0.62, -p.h * 0.1, 0, -p.h / 2); c.fill();
        }
      }
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    }
    function paint(c, dpr, ox, oy, cw, ch, lightOnly, mul) { if (parts.length && L && L.visible) drawParts(c, dpr, ox, oy, cw, ch, lightOnly, mul); }
    function frame(t) {
      raf = 0;
      var l = layer(); if (!l) return;
      if (!l.visible || paused()) { recycleAll(); hooks.length = 0; if (paused()) l.clear(); return; }
      var dt = last ? Math.min(0.05, Math.max(0.001, (t - last) / 1000)) : 0.016; last = t;
      var c = l.ctx, lvl = level(), i, keep = 0, p;
      c.setTransform(l.dpr, 0, 0, l.dpr, 0, 0);
      c.clearRect(0, 0, l.w, l.h);
      for (i = hooks.length - 1; i >= 0; i--) {
        var more = false;
        try { more = !!hooks[i](c, dt, t, l, lvl); } catch (e) { more = false; }
        c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.setTransform(l.dpr, 0, 0, l.dpr, 0, 0);
        if (!more) hooks.splice(i, 1);
      }
      // physics: gravity, drag, sway, optional floor bounce
      for (i = 0; i < parts.length; i++) {
        p = parts[i]; p.life -= dt;
        if (p.life <= 0 || p.y > l.h + 120 || p.y < -l.h || p.x < -260 || p.x > l.w + 260) { p.draw = null; p.data = null; pool.push(p); continue; }
        var d = p.drag === 1 ? 1 : Math.pow(p.drag, dt * 60);
        p.vx *= d; p.vy = p.vy * d + p.g * dt; p.ph += dt * 2.2;
        p.x += (p.vx + (p.sway ? Math.sin(p.ph) * p.sway : 0)) * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
        if (p.bounce && p.y > p.floor) {
          p.y = p.floor; p.vy = -Math.abs(p.vy) * p.bounce; p.vx *= 0.7; p.vr *= 0.55;
          if (Math.abs(p.vy) < 60) { p.vy = 0; p.g = 0; p.bounce = 0; p.vx *= 0.4; p.vr = 0; p.life = Math.min(p.life, 0.7); }
        }
        parts[keep++] = p;
      }
      parts.length = keep;
      drawParts(c, l.dpr, 0, 0, l.w, l.h);
      if (parts.length || hooks.length) { if (!raf) raf = requestAnimationFrame(frame); } // a spawn inside this frame may already have scheduled one
      else { c.clearRect(0, 0, l.w, l.h); last = 0; }
    }
    return { layer: layer, level: level, spawn: spawn, hook: hook, glow: glow, sprite: sprite, soft: soft, kick: kick, clear: clear, paint: paint,
      count: function () { return parts.length; }, busy: function () { return !!raf; } };
  }

  var TYPES = {
    laddoo: { pts: 10, w: 40, label: 'Motichoor laddoo' },
    jalebi: { pts: 15, w: 18, label: 'Jalebi' },
    barfi: { pts: 20, w: 15, label: 'Kaju katli' },
    jamun: { pts: 15, w: 16, label: 'Gulab jamun' },
    golden: { pts: 50, w: 4, label: 'Golden laddoo' },
    chilli: { pts: -15, w: 0, label: 'Mirchi (do not)' }
  };
  var ORDER = ['laddoo', 'jalebi', 'barfi', 'jamun', 'golden', 'chilli'];
  var CRUMB = { laddoo: '#FFA12E', jalebi: '#F28A12', barfi: '#EADBC0', jamun: '#7A2C12', golden: '#FFD778', chilli: '#3FAF4A' };

  var MISS = [
    'Aunty saw that.', 'Five-second rule? Not on Diwali.', 'That laddoo had a family.', 'The floor says thank you.',
    'Butterfingers. Ghee fingers?', 'Gravity 1, you 0.', 'Even the stall cat caught one.', 'Splat. Very artistic though.',
    'Somewhere, a halwai weeps.', 'Calories avoided. Joy also avoided.', 'The cousins are laughing.', 'That one was for Dadi.'
  ];
  var CHILLI = ['Mirchi! The basket is crying.', 'Spicy! That was not a laddoo.', 'Who ordered the chilli?!', 'Eyes watering. Points leaving.'];
  var STREAK = { 6: 'Sugar rush! x2', 12: 'Ghee-powered! x3', 18: 'Mithai mode: MAX x4' };
  var GOLDEN = ['GOLDEN LADDOO! Grandma is proud.', 'Golden! The halwai bows.', 'A golden one. Frame it.'];
  var TIERS = [
    { min: 0, title: 'Sugar-Free Sadhu', line: 'The laddoos have formally unionised against you.' },
    { min: 60, title: 'Weekend Snacker', line: 'Respectable. Your dentist is cautiously optimistic.' },
    { min: 180, title: 'Mithai Minister', line: 'The halwai just saluted you. Slowly. Sticky hands.' },
    { min: 350, title: 'Laddoo Legend', line: 'Banned from three sweet shops for being too good.' }
  ];

  /* ---------------- sweet art (canvas, centred, radius r) ---------------- */
  function drawLaddoo(c, r, golden) {
    var pal = golden ? ['#FFF8DC', '#FFE08A', '#E3AE3E', '#94620F'] : ['#FFD28C', '#FFA12E', '#DF6D12', '#87390A'];
    var g = c.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.08, 0, 0, r * 1.02);
    g.addColorStop(0, pal[0]); g.addColorStop(0.35, pal[1]); g.addColorStop(0.78, pal[2]); g.addColorStop(1, pal[3]);
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    c.save(); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.clip();
    var R = seeded(golden ? 7 : 3);
    for (var i = 0; i < 90; i++) {
      var a = R() * TAU, d = Math.sqrt(R()) * r * 0.98, br = r * (0.085 + R() * 0.05);
      var x = Math.cos(a) * d, y = Math.sin(a) * d, sh = (x + y) / (r * 2);
      c.fillStyle = sh < -0.15 ? pal[0] : sh < 0.2 ? pal[1] : pal[2];
      c.beginPath(); c.arc(x, y, br, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,245,215,0.42)'; c.beginPath(); c.arc(x - br * 0.3, y - br * 0.35, br * 0.36, 0, TAU); c.fill();
    }
    var v = c.createRadialGradient(0, 0, r * 0.5, 0, 0, r);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, golden ? 'rgba(90,50,0,0.4)' : 'rgba(60,18,0,0.5)');
    c.fillStyle = v; c.fillRect(-r, -r, r * 2, r * 2);
    c.restore();
    c.fillStyle = 'rgba(255,250,230,0.34)'; c.beginPath(); c.ellipse(-r * 0.36, -r * 0.42, r * 0.28, r * 0.15, -0.6, 0, TAU); c.fill();
    if (golden) {
      c.fillStyle = 'rgba(255,255,245,0.85)';
      [[0.3, -0.2, 0.12], [-0.2, 0.3, 0.09], [0.1, 0.45, 0.07], [-0.45, -0.05, 0.08]].forEach(function (f) {
        c.save(); c.translate(f[0] * r, f[1] * r); c.rotate(f[0] * 4);
        c.fillRect(-f[2] * r, -f[2] * r * 0.5, f[2] * r * 2, f[2] * r); c.restore();
      });
    } else {
      c.save(); c.translate(r * 0.08, -r * 0.62); c.rotate(-0.5);
      c.fillStyle = '#7FB43C'; c.beginPath(); c.ellipse(0, 0, r * 0.22, r * 0.085, 0, 0, TAU); c.fill();
      c.fillStyle = '#C9E59A'; c.beginPath(); c.ellipse(-r * 0.04, -r * 0.025, r * 0.12, r * 0.03, 0, 0, TAU); c.fill();
      c.restore();
    }
  }
  function drawJalebi(c, r) {
    var p = new Path2D(), steps = 120, turns = 2.25;
    for (var k = 0; k <= steps; k++) {
      var t = k / steps, a = t * turns * TAU, rr = r * (0.1 + 0.74 * t);
      var x = Math.cos(a) * rr, y = Math.sin(a) * rr * 0.92;
      if (k === 0) p.moveTo(x, y); else p.lineTo(x, y);
    }
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = '#8F3F05'; c.lineWidth = r * 0.36; c.stroke(p);
    c.strokeStyle = '#EC8210'; c.lineWidth = r * 0.27; c.stroke(p);
    c.strokeStyle = '#FFB443'; c.lineWidth = r * 0.12; c.stroke(p);
    c.save(); c.translate(-r * 0.035, -r * 0.045);
    c.strokeStyle = 'rgba(255,242,205,0.78)'; c.lineWidth = r * 0.045; c.stroke(p);
    c.restore();
    c.fillStyle = 'rgba(255,250,230,0.8)';
    [[0.5, -0.3], [-0.42, 0.44], [0.12, 0.62]].forEach(function (d) { c.beginPath(); c.arc(d[0] * r, d[1] * r, r * 0.05, 0, TAU); c.fill(); });
  }
  function diamond(c, a, b, oy) { c.beginPath(); c.moveTo(0, -b + oy); c.lineTo(a, oy); c.lineTo(0, b + oy); c.lineTo(-a, oy); c.closePath(); }
  function drawBarfi(c, r) {
    var a = r * 1.02, b = r * 0.8;
    c.fillStyle = '#A9875A'; diamond(c, a, b, r * 0.16); c.fill();
    var g = c.createLinearGradient(-a, -b, a, b);
    g.addColorStop(0, '#FFF7E8'); g.addColorStop(0.5, '#F1E2C6'); g.addColorStop(1, '#DCC69E');
    c.fillStyle = g; diamond(c, a, b, 0); c.fill();
    c.save(); diamond(c, a, b, 0); c.clip();
    var R = seeded(11);
    for (var i = 0; i < 9; i++) {
      var x = (R() - 0.5) * a * 1.6, y = (R() - 0.5) * b * 1.6, s = r * (0.18 + R() * 0.2);
      c.fillStyle = 'rgba(255,255,255,' + (0.45 + R() * 0.35).toFixed(2) + ')';
      c.beginPath(); c.moveTo(x - s, y); c.lineTo(x - s * 0.2, y - s * 0.7); c.lineTo(x + s, y - s * 0.1); c.lineTo(x + s * 0.3, y + s * 0.6); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(150,150,165,0.55)'; c.lineWidth = 0.7; c.stroke();
    }
    c.restore();
    c.strokeStyle = 'rgba(130,95,50,0.6)'; c.lineWidth = 1; diamond(c, a, b, 0); c.stroke();
  }
  function drawJamun(c, r) {
    var g = c.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.05, 0, 0, r);
    g.addColorStop(0, '#CF7A44'); g.addColorStop(0.42, '#8E3A1A'); g.addColorStop(0.84, '#561B0A'); g.addColorStop(1, '#300D06');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,170,80,0.28)'; c.lineWidth = r * 0.08; c.beginPath(); c.arc(0, 0, r * 0.9, 0.3, Math.PI - 0.3); c.stroke();
    c.fillStyle = 'rgba(255,248,235,0.62)'; c.beginPath(); c.ellipse(-r * 0.34, -r * 0.4, r * 0.3, r * 0.15, -0.55, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,248,235,0.85)'; c.beginPath(); c.arc(r * 0.18, -r * 0.55, r * 0.07, 0, TAU); c.fill();
    c.fillStyle = '#86BF45';
    [[0.05, -0.2], [0.3, -0.05], [-0.15, 0.05]].forEach(function (d) { c.beginPath(); c.ellipse(d[0] * r, d[1] * r, r * 0.08, r * 0.04, d[0] * 5, 0, TAU); c.fill(); });
  }
  function drawChilli(c, r) {
    c.save(); c.rotate(-0.35); c.scale(r, r);
    var body = new Path2D('M-0.18 -0.62 C0.32 -0.66 0.5 -0.12 0.42 0.32 C0.36 0.7 0.14 0.94 0.02 1 C0.1 0.62 0.04 0.22 -0.16 -0.04 C-0.34 -0.28 -0.44 -0.52 -0.18 -0.62 Z');
    var g = c.createLinearGradient(-0.4, -0.6, 0.5, 0.8);
    g.addColorStop(0, '#5FCB55'); g.addColorStop(0.5, '#2E9B3E'); g.addColorStop(1, '#17672A');
    c.fillStyle = g; c.fill(body);
    c.strokeStyle = 'rgba(10,60,20,0.8)'; c.lineWidth = 0.05; c.stroke(body);
    c.strokeStyle = 'rgba(220,255,200,0.55)'; c.lineWidth = 0.06; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-0.12, -0.45); c.quadraticCurveTo(0.2, -0.3, 0.26, 0.2); c.stroke();
    c.fillStyle = '#4F7A23'; c.beginPath(); c.ellipse(-0.12, -0.64, 0.2, 0.09, 0.1, 0, TAU); c.fill();
    c.strokeStyle = '#6C8F2A'; c.lineWidth = 0.08;
    c.beginPath(); c.moveTo(-0.14, -0.68); c.quadraticCurveTo(-0.2, -0.92, -0.42, -0.95); c.stroke();
    // grumpy face
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(0.02, -0.3, 0.085, 0, TAU); c.arc(0.24, -0.26, 0.085, 0, TAU); c.fill();
    c.fillStyle = '#111';
    c.beginPath(); c.arc(0.04, -0.28, 0.04, 0, TAU); c.arc(0.26, -0.24, 0.04, 0, TAU); c.fill();
    c.strokeStyle = '#0d2b12'; c.lineWidth = 0.05;
    c.beginPath(); c.moveTo(-0.07, -0.44); c.lineTo(0.08, -0.38); c.moveTo(0.33, -0.4); c.lineTo(0.19, -0.36); c.stroke();
    c.beginPath(); c.arc(0.16, -0.04, 0.08, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
    c.restore();
  }
  var DRAW = {
    laddoo: function (c, r) { drawLaddoo(c, r, false); }, golden: function (c, r) { drawLaddoo(c, r, true); },
    jalebi: drawJalebi, barfi: drawBarfi, jamun: drawJamun, chilli: drawChilli
  };
  function makeSprite(type, r, dpr) {
    var size = Math.ceil(r * 2.7), cv = document.createElement('canvas');
    cv.width = cv.height = Math.ceil(size * dpr);
    var c = cv.getContext('2d'); c.scale(dpr, dpr); c.translate(size / 2, size / 2);
    DRAW[type](c, r);
    return { cv: cv, size: size };
  }

  /* ---------------- basket art ---------------- */
  function basketSprites(w, h, dpr) {
    var pad = Math.ceil(h * 0.5), cw = Math.ceil(w + pad * 2), ch = Math.ceil(h + pad * 2);
    function mk() { var cv = document.createElement('canvas'); cv.width = Math.ceil(cw * dpr); cv.height = Math.ceil(ch * dpr); var c = cv.getContext('2d'); c.scale(dpr, dpr); c.translate(cw / 2, pad); return { cv: cv, c: c }; }
    var back = mk(), front = mk();
    var tw = w / 2, bw = w * 0.37;
    // back: dark opening
    var b = back.c, ig = b.createLinearGradient(0, -h * 0.12, 0, h * 0.12);
    ig.addColorStop(0, '#1e0d05'); ig.addColorStop(1, '#4a2510');
    b.fillStyle = ig; b.beginPath(); b.ellipse(0, 0, tw * 0.98, h * 0.13, 0, 0, TAU); b.fill();
    // front body
    var c = front.c;
    function body() { c.beginPath(); c.moveTo(-tw, 0); c.lineTo(tw, 0); c.lineTo(bw, h * 0.9); c.quadraticCurveTo(bw * 0.97, h, bw * 0.8, h); c.lineTo(-bw * 0.8, h); c.quadraticCurveTo(-bw * 0.97, h, -bw, h * 0.9); c.closePath(); }
    var bg = c.createLinearGradient(-tw, 0, tw, 0);
    bg.addColorStop(0, '#6A3818'); bg.addColorStop(0.3, '#C08243'); bg.addColorStop(0.5, '#DDA563'); bg.addColorStop(0.72, '#B0702F'); bg.addColorStop(1, '#5E3014');
    body(); c.fillStyle = bg; c.fill();
    c.save(); body(); c.clip();
    var rows = 6, rh = h / rows;
    for (var i = 0; i < rows; i++) {
      var y = i * rh, cols = 9, cwid = w / cols, off = (i % 2) * cwid / 2;
      for (var j = -1; j <= cols; j++) {
        var x = -tw + j * cwid + off;
        c.fillStyle = 'rgba(255,230,180,0.22)'; c.fillRect(x + 1.5, y + 1.5, cwid - 3, rh * 0.35);
        c.fillStyle = 'rgba(60,25,5,0.35)'; c.fillRect(x + 1.5, y + rh * 0.62, cwid - 3, rh * 0.3);
        c.fillStyle = 'rgba(40,15,0,0.55)'; c.fillRect(x, y, 1.2, rh);
      }
      c.fillStyle = 'rgba(40,15,0,0.5)'; c.fillRect(-tw, y + rh - 1, w, 1.2);
    }
    var sh = c.createLinearGradient(0, 0, 0, h); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(30,10,0,0.45)');
    c.fillStyle = sh; c.fillRect(-tw, 0, w, h);
    c.restore();
    // rim band with braid
    var rimH = Math.max(6, h * 0.17);
    var rg = c.createLinearGradient(0, -rimH / 2, 0, rimH / 2);
    rg.addColorStop(0, '#F0C27E'); rg.addColorStop(0.5, '#C98B47'); rg.addColorStop(1, '#7E4A1E');
    c.fillStyle = rg; c.beginPath();
    c.moveTo(-tw - 4, -rimH / 2); c.lineTo(tw + 4, -rimH / 2); c.quadraticCurveTo(tw + 8, 0, tw + 4, rimH / 2); c.lineTo(-tw - 4, rimH / 2); c.quadraticCurveTo(-tw - 8, 0, -tw - 4, -rimH / 2); c.fill();
    c.strokeStyle = 'rgba(80,40,10,0.6)'; c.lineWidth = 1;
    for (var k = -tw; k < tw + 2; k += rimH * 0.7) { c.beginPath(); c.moveTo(k, -rimH / 2 + 1); c.lineTo(k + rimH * 0.45, rimH / 2 - 1); c.stroke(); }
    // marigold garland swag
    var beads = Math.max(9, Math.round(w / 9)), br = Math.max(2.6, h * 0.075);
    for (var m = 0; m <= beads; m++) {
      var t = m / beads, bx = -tw * 0.92 + t * tw * 1.84, by = rimH * 0.9 + Math.sin(t * Math.PI) * h * 0.16;
      c.fillStyle = m % 2 ? '#FFB01F' : '#FF7A12';
      c.beginPath(); c.arc(bx, by, br, 0, TAU); c.fill();
      c.fillStyle = 'rgba(140,40,0,0.55)'; c.beginPath(); c.arc(bx, by, br * 0.38, 0, TAU); c.fill();
      if (m % 4 === 2) { c.fillStyle = '#3E8E3A'; c.beginPath(); c.ellipse(bx, by + br * 1.5, br * 0.5, br * 1.1, 0.3, 0, TAU); c.fill(); }
    }
    // side loops
    c.strokeStyle = '#A8682C'; c.lineWidth = Math.max(2, h * 0.06);
    c.beginPath(); c.arc(-tw - 2, rimH * 0.4, h * 0.14, Math.PI * 0.5, Math.PI * 1.5); c.stroke();
    c.beginPath(); c.arc(tw + 2, rimH * 0.4, h * 0.14, -Math.PI * 0.5, Math.PI * 0.5); c.stroke();
    return { back: back.cv, front: front.cv, cw: cw, ch: ch, pad: pad };
  }

  /* ---------------- stall interior (static backdrop) ---------------- */
  function paintBackdrop(cv, W, H, dpr, floorY) {
    cv.width = Math.ceil(W * dpr); cv.height = Math.ceil(H * dpr);
    var c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Revision 4: no fill of its own — the continuous deep-space backdrop shows through (the arena's CSS scrim
    // keeps the sweets legible); everything below is hairline light that is feathered out at the end
    c.clearRect(0, 0, W, H);
    // one soft pool of lamp light from above
    var pg = c.createRadialGradient(W / 2, 0, 0, W / 2, 0, H * 0.8);
    pg.addColorStop(0, 'rgba(255,215,120,0.07)'); pg.addColorStop(1, 'rgba(255,215,120,0)');
    c.fillStyle = pg; c.fillRect(0, 0, W, H);
    // Revision 3: a haveli mandapa instead of arches — a carved beam (architrave) carried on fluted pillars with
    // kumbha capitals and stepped brackets, and a deepmala frieze of small lamp niches above the beam.
    // A whole number of bays, every pillar complete and inside the frame at any width.
    var arch = { lamps: [], hang: [] };
    var beamY = Math.round(H * 0.16), nb = Math.max(2, Math.round((W - 40) / 230)), bay = (W - 40) / nb, px0 = 20;
    var pw = clamp(bay * 0.07, 9, 16), hair = 'rgba(255,215,120,0.075)', hair2 = 'rgba(255,215,120,0.045)';
    c.lineWidth = 1;
    // beam: two hairlines with a dentil row between, and a fine cornice line above
    c.fillStyle = 'rgba(8,11,30,0.4)'; c.fillRect(0, beamY - 1, W, 12);
    c.strokeStyle = hair;
    c.beginPath(); c.moveTo(0, beamY + 0.5); c.lineTo(W, beamY + 0.5); c.moveTo(0, beamY + 10.5); c.lineTo(W, beamY + 10.5); c.stroke();
    c.strokeStyle = hair2;
    c.beginPath();
    for (var dx = 6; dx < W - 4; dx += 12) { c.moveTo(dx + 0.5, beamY + 3); c.lineTo(dx + 0.5, beamY + 8); }
    c.moveTo(0, beamY - 5.5); c.lineTo(W, beamY - 5.5); c.stroke();
    for (var pi = 0; pi <= nb; pi++) {
      var pxc = Math.round(px0 + pi * bay) + 0.5, top = beamY + 11, bot = floorY;
      c.strokeStyle = hair;
      c.beginPath();
      // stepped brackets (corbels) under the beam
      c.moveTo(pxc - pw * 1.9, top); c.lineTo(pxc - pw * 1.9, top + 4); c.lineTo(pxc - pw * 1.3, top + 4); c.lineTo(pxc - pw * 1.3, top + 9); c.lineTo(pxc - pw * 0.8, top + 9);
      c.moveTo(pxc + pw * 1.9, top); c.lineTo(pxc + pw * 1.9, top + 4); c.lineTo(pxc + pw * 1.3, top + 4); c.lineTo(pxc + pw * 1.3, top + 9); c.lineTo(pxc + pw * 0.8, top + 9);
      // abacus slab + kumbha (pot) capital
      c.rect(pxc - pw * 0.8, top + 9, pw * 1.6, 4);
      c.moveTo(pxc - pw * 0.5, top + 13); c.bezierCurveTo(pxc - pw * 0.95, top + 18, pxc - pw * 0.95, top + 27, pxc - pw * 0.5, top + 31);
      c.lineTo(pxc + pw * 0.5, top + 31); c.bezierCurveTo(pxc + pw * 0.95, top + 27, pxc + pw * 0.95, top + 18, pxc + pw * 0.5, top + 13);
      // fluted shaft with a carved band at mid height
      var sTop = top + 31, sBot = bot - 18, mid = (sTop + sBot) / 2;
      c.moveTo(pxc - pw * 0.5, sTop); c.lineTo(pxc - pw * 0.5, sBot); c.moveTo(pxc + pw * 0.5, sTop); c.lineTo(pxc + pw * 0.5, sBot);
      c.rect(pxc - pw * 0.62, mid - 5, pw * 1.24, 10);
      // stepped plinth
      c.rect(pxc - pw * 0.75, sBot, pw * 1.5, 8); c.rect(pxc - pw * 1.0, sBot + 8, pw * 2.0, bot - sBot - 8);
      c.stroke();
      c.strokeStyle = hair2;
      c.beginPath(); c.moveTo(pxc, sTop + 4); c.lineTo(pxc, mid - 7); c.moveTo(pxc, mid + 7); c.lineTo(pxc, sBot - 4); c.stroke();
      // a hanging brass lamp in the middle of each outer bay (it sways on its chain at run time)
      if (pi < nb && (pi === 0 || pi === nb - 1) && nb >= 2) arch.hang.push({ x: px0 + (pi + 0.5) * bay, y0: beamY + 11, len: clamp(H * 0.09, 34, 62), a: 0, v: 0, seed: pi * 1.7 + 0.3 });
    }
    // deepmala frieze: a row of small lamp niches above the beam (whole niches, centred in the width)
    var nn = Math.max(4, Math.floor((W - 30) / 54)), ns = (W - 30) / nn, ny = beamY - 9, nh = clamp(H * 0.05, 18, 28), nw = 11;
    for (var ni = 0; ni < nn; ni++) {
      var nx = 15 + (ni + 0.5) * ns;
      c.strokeStyle = hair2;
      // niche: a small recess with a stepped (shikhara-like) peak, no arch
      c.beginPath();
      c.moveTo(nx - nw / 2, ny); c.lineTo(nx - nw / 2, ny - nh * 0.62); c.lineTo(nx - nw * 0.3, ny - nh * 0.62); c.lineTo(nx - nw * 0.3, ny - nh * 0.8);
      c.lineTo(nx, ny - nh); c.lineTo(nx + nw * 0.3, ny - nh * 0.8); c.lineTo(nx + nw * 0.3, ny - nh * 0.62); c.lineTo(nx + nw / 2, ny - nh * 0.62); c.lineTo(nx + nw / 2, ny);
      c.stroke();
      // the clay diya in it (its flame is drawn live so it can flicker)
      c.fillStyle = 'rgba(150,80,30,0.32)';
      c.beginPath(); c.moveTo(nx - 4, ny - 3.5); c.quadraticCurveTo(nx, ny + 0.5, nx + 4, ny - 3.5); c.closePath(); c.fill();
      arch.lamps.push({ x: nx, y: ny - 5, seed: ni * 2.39 });
    }
    // shelves with jars and boxes
    [0.36, 0.62].forEach(function (f, si) {
      var y = H * f;
      c.fillStyle = 'rgba(255,215,120,0.09)'; c.fillRect(0, y, W, 1);
      var R = seeded(5 + si);
      // jars drawn as hairline outlines only
      c.strokeStyle = 'rgba(255,215,120,0.07)';
      for (var x = 14; x < W - 30; x += 40 + R() * 56) {
        var kind = R(), hgt = 22 + R() * 26, wd = 18 + R() * 16;
        if (kind < 0.6) {
          c.beginPath();
          c.moveTo(x, y); c.lineTo(x, y - hgt * 0.8); c.quadraticCurveTo(x, y - hgt, x + wd * 0.2, y - hgt); c.lineTo(x + wd * 0.8, y - hgt);
          c.quadraticCurveTo(x + wd, y - hgt, x + wd, y - hgt * 0.8); c.lineTo(x + wd, y); c.stroke();
        } else {
          c.strokeRect(x + 0.5, y - hgt * 0.5 + 0.5, wd * 1.3, hgt * 0.5);
        }
      }
    });
    // counter top: a translucent deep-space ledge with a single gold edge (R4: no plum/brown block)
    var cg = c.createLinearGradient(0, floorY, 0, H);
    cg.addColorStop(0, 'rgba(18,16,58,0.5)'); cg.addColorStop(1, 'rgba(8,11,30,0.15)');
    c.fillStyle = cg; c.fillRect(0, floorY, W, H - floorY);
    var eg = c.createLinearGradient(0, 0, W, 0);
    eg.addColorStop(0, 'rgba(255,215,120,0)'); eg.addColorStop(0.5, 'rgba(255,215,120,0.45)'); eg.addColorStop(1, 'rgba(255,215,120,0)');
    c.fillStyle = eg; c.fillRect(0, floorY, W, 1);
    // R4 feather: the whole mandapa dissolves into the space backdrop at the sides (and softly at the very top),
    // so the stall never ends in a hard vertical cut at any width
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = 'destination-in';
    var fw = Math.min(0.16, 150 / W), fg = c.createLinearGradient(0, 0, cv.width, 0);
    fg.addColorStop(0, 'rgba(0,0,0,0)'); fg.addColorStop(fw, 'rgba(0,0,0,1)'); fg.addColorStop(1 - fw, 'rgba(0,0,0,1)'); fg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = fg; c.fillRect(0, 0, cv.width, cv.height);
    var tg = c.createLinearGradient(0, 0, 0, cv.height);
    tg.addColorStop(0, 'rgba(0,0,0,0.55)'); tg.addColorStop(0.08, 'rgba(0,0,0,1)'); tg.addColorStop(1, 'rgba(0,0,0,1)');
    c.fillStyle = tg; c.fillRect(0, 0, cv.width, cv.height);
    c.globalCompositeOperation = 'source-over';
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    return arch;
  }

  /* ---------- Revision 3: bandhanwar (toran) of mango leaves and marigolds across the stall top ---------- */
  var LEAF = null;
  function leafPath() {
    if (LEAF) return LEAF;
    // a mango leaf hanging from its stem at (0,0), tip down
    LEAF = new Path2D('M0 0 C4.6 4 6 10 5.2 15 C4.4 19 2 22.5 0 25 C-2 22.5 -4.4 19 -5.2 15 C-6 10 -4.6 4 0 0 Z');
    return LEAF;
  }
  var VEIN = null;
  function veinPath() { if (!VEIN) VEIN = new Path2D('M0 1.5 L0 23'); return VEIN; }

  function plateSVG() {
    return '<svg class="act-plate" viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M3 57 V22 Q3 15 10 14 L78 11 Q91 10 96 4 L100 1.5 L104 4 Q109 10 122 11 L190 14 Q197 15 197 22 V57 Z"/></svg>';
  }

  /* ======================================================================= */
  var game = null;

  function mount(stage) {
    if (game) return;
    var root = document.createElement('div');
    root.className = 'act-laddoo';
    var rates = ORDER.map(function (t) {
      var p = TYPES[t].pts;
      return '<li class="' + (t === 'chilli' ? 'is-bad' : t === 'golden' ? 'is-gold' : '') + '"><canvas data-icon="' + t + '" width="72" height="72" aria-hidden="true"></canvas><span>' + TYPES[t].label + '</span><b>' + (p > 0 ? '+' + p : '−' + Math.abs(p)) + '</b></li>';
    }).join('');
    var uid = 'al' + Math.random().toString(36).slice(2, 7);
    root.innerHTML =
      '<p class="act-hint" data-hint>Move the basket with mouse, touch or <span aria-hidden="true">← →</span><span class="al-sr">the arrow keys</span> · catch sweets, dodge the mirchi · P pauses</p>' +
      '<div class="al-stall">' +
        '<div class="al-arena">' +
          '<canvas class="al-canvas" tabindex="0" role="application" aria-roledescription="game" aria-label="Laddoo Catcher" aria-describedby="' + uid + '-desc"></canvas>' +
          '<p class="al-sr" id="' + uid + '-desc">A thirty second catching game at a sweet stall. Sweets fall from the top; move the basket with the mouse, by touch, or with the left and right arrow keys or A and D to catch them. Avoid the green chilli. Press P or Escape to pause. Scores and the time left are announced.</p>' +
          '<div class="al-hud" aria-hidden="true">' +
            '<div class="al-score"><span>Score</span><b data-score>0</b></div>' +
            '<div class="al-mid"><div class="al-combo" data-combo>x1</div></div>' +
            '<div class="al-timer" data-timer><span>Time</span><b data-time>30</b><svg viewBox="0 0 56 56"><circle class="al-t-bg" cx="28" cy="28" r="23"/><circle class="al-t-fg" cx="28" cy="28" r="23" data-ring/></svg></div>' +
          '</div>' +
          '<button type="button" class="btn-tilak al-pausebtn" data-pause aria-label="Pause the game (P)"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 6.5v11M15 6.5v11"/></svg></button>' +
          '<div class="al-bubble" data-bubble aria-hidden="true"></div>' +
          '<div class="al-screen al-start" data-screen="start">' +
            '<div class="al-card">' +
              '<span class="al-stamp deva-stamp" lang="hi" aria-hidden="true">शुभ आरंभ</span>' +
              '<p class="al-kicker">Thirty seconds · one basket</p>' +
              '<h3 class="al-title">Catch the mithai.<br><em>Dodge the mirchi.</em></h3>' +
              '<ul class="al-rates" aria-label="Today’s rates">' + rates + '</ul>' +
              '<p class="al-controls">Mouse, touch or <kbd>←</kbd> <kbd>→</kbd>. Six in a row starts a sugar rush.</p>' +
              '<button type="button" class="btn-diya al-go" data-start><span>Open the stall</span></button>' +
              '<p class="al-best">Shop record <b data-best>0</b></p>' +
              '<span class="al-warli" aria-hidden="true"></span>' +
            '</div>' +
          '</div>' +
          '<div class="al-screen al-countdown" data-screen="count" hidden><span data-count>3</span></div>' +
          '<div class="al-screen al-pause" data-screen="pause" hidden>' +
            '<div class="al-card al-card--sm"><h3 class="al-title">Paused.</h3><p class="al-line">The laddoos are holding their breath.</p>' +
            '<button type="button" class="btn-diya al-go" data-resume><span>Resume</span></button>' +
            '<p class="al-pause-alt"><button type="button" class="btn-tilak btn-tilak--text" data-again><span>Start over</span></button></p></div>' +
          '</div>' +
          '<div class="al-screen al-over" data-screen="over" hidden>' +
            '<div class="al-card">' +
              '<span class="al-stamp deva-stamp" lang="hi" aria-hidden="true">शुभ लाभ</span>' +
              '<p class="al-kicker" data-newbest hidden>New shop record!</p>' +
              '<p class="al-final"><b data-final>0</b><span>points</span></p>' +
              '<h3 class="al-title"><em data-tier>Mithai Minister</em></h3>' +
              '<p class="al-line" data-tierline></p>' +
              '<dl class="al-stats"><div><dt>Caught</dt><dd data-s-caught>0</dd></div><div><dt>Dropped</dt><dd data-s-missed>0</dd></div><div><dt>Best streak</dt><dd data-s-streak>0</dd></div><div><dt>Golden</dt><dd data-s-gold>0</dd></div></dl>' +
              '<button type="button" class="btn-diya al-go" data-restart><span>One more round</span></button>' +
              '<p class="al-best">Shop record <b data-best>0</b></p>' +
              '<span class="al-warli" aria-hidden="true"></span>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<p class="al-sr" aria-live="polite" data-live></p>';
    stage.appendChild(root);

    var arena = root.querySelector('.al-arena');
    var canvas = root.querySelector('.al-canvas');
    var ctx = canvas.getContext('2d');
    var $ = function (s) { return root.querySelector(s); };
    var scr = { start: $('[data-screen=start]'), count: $('[data-screen=count]'), pause: $('[data-screen=pause]'), over: $('[data-screen=over]') };
    var ui = {
      score: $('[data-score]'), combo: $('[data-combo]'), time: $('[data-time]'), ring: $('[data-ring]'), timer: $('[data-timer]'),
      bubble: $('[data-bubble]'), live: $('[data-live]'), count: $('[data-count]'),
      final: $('[data-final]'), tier: $('[data-tier]'), tierline: $('[data-tierline]'), newbest: $('[data-newbest]'),
      sc: $('[data-s-caught]'), sm: $('[data-s-missed]'), ss: $('[data-s-streak]'), sg: $('[data-s-gold]')
    };
    var RING = 2 * Math.PI * 23;
    ui.ring.style.strokeDasharray = RING.toFixed(2);

    var W = 0, H = 0, dpr = 1, floorY = 0, r = 18;
    var bgCv = document.createElement('canvas');
    var sprites = {}, glowCv = null, bsk = null;
    // sq/sqv: squash spring (catch weight), tilt/tv: lean spring (inertia of the swing), glow: rim light spill
    var basket = { x: 0, tx: 0, w: 110, h: 54, wob: 0, flash: 0, px: 0, sq: 0, sqv: 0, tilt: 0, tv: 0, glow: 0, gc: '#FFD778' };
    var hintEl = root.querySelector('[data-hint]'), pauseBtn = root.querySelector('[data-pause]');
    function hideHint() { if (hintEl && !hintEl.classList.contains('is-gone')) hintEl.classList.add('is-gone'); }
    var said10 = false, said5 = false;
    var items = [], parts = [], pops = [], splats = [], pile = [];
    var S = { state: 'idle', elapsed: 0, spawn: 0, score: 0, streak: 0, best: 0, caught: 0, missed: 0, gold: 0, maxStreak: 0, shake: 0, lastBubble: 0, inView: false };
    var keys = { l: false, r: false }, kbVel = 0, usingKb = false;
    var raf = 0, last = 0, attractT = 0;
    // Revision 3: architecture anchors (live lamp flames, swaying hanging lamps), sweets that bounce when they
    // land, a warm light that floods the stall on big moments, and the breeze clock
    var arch = { lamps: [], hang: [] }, dead = [], clock = 0;
    S.warm = 0;
    function lifeOn() { return !isReduced() && !isPausedPref(); }
    function breeze(t) { return 0.55 * Math.sin(t * 0.37) + 0.3 * Math.sin(t * 0.91 + 1.7) + 0.15 * Math.sin(t * 1.63 + 0.4); }
    function flick(t, s) { return 0.78 + 0.1 * Math.sin(t * 6.3 + s) + 0.07 * Math.sin(t * 11.7 + s * 2.3) + 0.05 * Math.sin(t * 17.9 + s * 0.7); }
    function nudge(k) { if (!lifeOn()) return; for (var i = 0; i < arch.hang.length; i++) arch.hang[i].v += 0.22 * k * (i % 2 ? -1 : 1) * rnd(0.6, 1); }

    /* R3.4 — the warm golden shower: falling gold sparks across the WHOLE viewport, a few tumbling mini-sweets
       that bounce off the bottom of the screen, a screen light (E2M.screenGlow) and a warm wash in the stall.
       power 0..1 scales count and light; mode 'rain' = the gentle end-of-round gold rain. */
    var GOLDS = ['#FFD778', '#FFC24A', '#FFE7A3', '#FFB547', '#FFF4DC'];
    var MINI = ['laddoo', 'laddoo', 'golden', 'jalebi', 'barfi', 'jamun'];
    function drawMini(c, p) { var s = p.data; if (s) c.drawImage(s.cv, -s.size * 0.4, -s.size * 0.4, s.size * 0.8, s.size * 0.8); }
    function shower(power, ox, oy, mode) {
      var lvl = SFX.level(); if (!lvl) return;
      var l = SFX.layer(); if (!l) return;
      var VW = l.w, VH = l.h, calm = lvl < 0.5, rain = mode === 'rain', i, p;
      S.warm = Math.max(S.warm, (calm ? 0.22 : 0.4) + 0.5 * power);
      SFX.glow('#FFC46A', calm ? 0.3 : Math.min(1, 0.35 + 0.55 * power), ox, oy);
      var n = Math.round((calm ? 16 : (rain ? 110 : 60 + 150 * power)) * Math.min(lvl, 1.3));
      for (i = 0; i < n; i++) {
        p = SFX.spawn(Math.random() < 0.62 ? 'spark' : 'dot', rnd(0, VW), rain ? rnd(-VH * 0.9, -8) : rnd(-VH * 0.3, VH * 0.12),
          rnd(-30, 30), rain ? rnd(20, 70) : rnd(40, 170), rain ? rnd(4, 6.5) : rnd(1.8, 3.4), rnd(1.5, 3.1), pick(GOLDS));
        if (!p) break;
        p.g = calm ? 30 : (rain ? rnd(30, 70) : rnd(150, 320)); p.drag = 0.986; p.sway = rnd(6, 24); p.fl = Math.random() < 0.3 ? 0.22 : 0;
        if (calm) p.vy = rnd(18, 46);
      }
      // a warm light that spreads along the top of the screen and sinks with the shower
      var nw = calm ? 1 : 3;
      for (i = 0; i < nw; i++) {
        p = SFX.spawn('wash', VW * (nw === 1 ? 0.5 : 0.18 + 0.32 * i), rnd(-VH * 0.05, VH * 0.12), 0, rnd(20, 50), calm ? 1.4 : 1.9 + power, Math.max(VW, VH) * (0.32 + 0.12 * power), '#FFC46A');
        if (p) p.a = calm ? 0.35 : 0.5 + 0.4 * power;
      }
      var m = calm ? 0 : Math.round((rain ? 6 : 3 + 9 * power) * Math.min(lvl, 1.2));
      // the sweets fall from the top of the viewport, mostly beside the stall (they pass behind it)
      var rc = arena.getBoundingClientRect();
      for (i = 0; i < m; i++) {
        var side = rc.left > 90 && Math.random() < 0.75, x = side ? (Math.random() < 0.5 ? rnd(16, rc.left - 24) : rnd(rc.right + 24, VW - 16)) : rnd(VW * 0.05, VW * 0.95);
        var t = MINI[(Math.random() * MINI.length) | 0];
        p = SFX.spawn('custom', x, rnd(-VH * 0.35, -30), rnd(-50, 50), rnd(0, 120), rnd(3.4, 4.8), r, '#FFD778');
        if (!p) break;
        p.g = rnd(950, 1300); p.drag = 0.993; p.vr = rnd(-5, 5); p.bounce = 0.42; p.floor = VH - r * 0.9; p.data = sprites[t]; p.draw = drawMini;
      }
      nudge(0.6 + power);
      loop();
    }
    var SFX = makeScreenFx('laddoo');
    root._qa = { shower: shower }; // QA hook (DOM expando, no global): lets the preflight trigger the shower

    function paintIcons() {
      var d = Math.min(window.devicePixelRatio || 1, 2);
      root.querySelectorAll('[data-icon]').forEach(function (cv) {
        var t = cv.getAttribute('data-icon'), s = 36;
        cv.width = cv.height = s * d; cv.style.width = cv.style.height = s + 'px';
        var c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, s / 2, s / 2);
        DRAW[t](c, 12.5);
      });
    }
    paintIcons();

    function resize() {
      var rect = arena.getBoundingClientRect();
      var nw = Math.round(rect.width), nh = Math.round(rect.height);
      if (!nw || !nh || (nw === W && nh === H)) return;
      var oldW = W;
      W = nw; H = nh; dpr = Math.min(window.devicePixelRatio || 1, isMobile() ? 1.75 : 2);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      floorY = H - Math.max(16, Math.round(H * 0.04));
      r = clamp(Math.round(W * 0.025), 15, 24);
      basket.w = clamp(Math.round(W * 0.15), 88, 150); basket.h = Math.round(basket.w * 0.5);
      basket.x = oldW ? basket.x * (W / oldW) : W / 2; basket.tx = basket.x;
      ORDER.forEach(function (t) { sprites[t] = makeSprite(t, r, dpr); });
      glowCv = document.createElement('canvas'); var gs = Math.ceil(r * 5); glowCv.width = glowCv.height = Math.ceil(gs * dpr);
      var gc = glowCv.getContext('2d'); gc.scale(dpr, dpr);
      var gg = gc.createRadialGradient(gs / 2, gs / 2, 0, gs / 2, gs / 2, gs / 2);
      gg.addColorStop(0, 'rgba(255,215,120,0.75)'); gg.addColorStop(0.4, 'rgba(255,190,80,0.25)'); gg.addColorStop(1, 'rgba(255,190,80,0)');
      gc.fillStyle = gg; gc.fillRect(0, 0, gs, gs); glowCv._s = gs;
      bsk = basketSprites(basket.w, basket.h, dpr);
      arch = paintBackdrop(bgCv, W, H, dpr, floorY);
      draw();
    }
    var ro = ('ResizeObserver' in window) ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(arena); else window.addEventListener('resize', resize);

    /* ---------- screens ---------- */
    function show(name) {
      Object.keys(scr).forEach(function (k) { scr[k].hidden = k !== name; });
      root.classList.toggle('is-playing', S.state === 'playing' || S.state === 'count');
    }
    function refreshBest() {
      S.best = getBest();
      root.querySelectorAll('[data-best]').forEach(function (b) { b.textContent = S.best; });
    }
    refreshBest();
    function announce(m, assertive) { if (sr(m, assertive)) return; ui.live.textContent = ''; setTimeout(function () { ui.live.textContent = m; }, 30); }
    function clientPt(x, y) { var rc = canvas.getBoundingClientRect(); return { x: rc.left + x, y: rc.top + y }; }

    function bubble(text, x, kind) {
      var now = performance.now();
      if (kind !== 'force' && now - S.lastBubble < 650) return;
      S.lastBubble = now;
      var b = ui.bubble;
      b.textContent = text;
      b.className = 'al-bubble is-on' + (kind === 'bad' ? ' is-bad' : kind === 'gold' ? ' is-gold' : '');
      var px = clamp(x == null ? W / 2 : x, 90, W - 90);
      b.style.left = px + 'px';
      void b.offsetWidth; b.classList.add('is-pop');
      clearTimeout(b._t); b._t = setTimeout(function () { b.classList.remove('is-on', 'is-pop'); }, 1300);
    }

    /* ---------- game flow ---------- */
    function resetRound() {
      items.length = 0; parts.length = 0; pops.length = 0; splats.length = 0; pile.length = 0; dead.length = 0;
      S.elapsed = 0; S.spawn = 400; S.score = 0; S.streak = 0; S.caught = 0; S.missed = 0; S.gold = 0; S.maxStreak = 0; S.shake = 0;
      basket.x = basket.tx = basket.px = W / 2; basket.wob = 0; basket.flash = 0; basket.sq = basket.sqv = basket.tilt = basket.tv = basket.glow = 0; kbVel = 0;
      said10 = said5 = false;
      hud();
    }
    function start() {
      clearTimeout(S.cd);
      resize(); resetRound();
      hideHint();
      S.inView = true;
      S.state = 'count'; show('count');
      try { canvas.focus({ preventScroll: true }); } catch (e) { canvas.focus(); }
      var n = 3;
      ui.count.textContent = n;
      sfx('bell');
      if (isReduced()) { n = 1; }
      var tick = function () {
        n--;
        if (S.state !== 'count') return;
        if (n > 0) { ui.count.textContent = n; ui.count.classList.remove('is-tick'); void ui.count.offsetWidth; ui.count.classList.add('is-tick'); sfx('bell'); S.cd = setTimeout(tick, 650); }
        else if (n === 0) { ui.count.textContent = 'Go!'; ui.count.classList.remove('is-tick'); void ui.count.offsetWidth; ui.count.classList.add('is-tick'); sfx('whoosh'); S.cd = setTimeout(tick, 420); }
        else { S.state = 'playing'; show(null); haptic('light'); announce('Go! 30 seconds. Catch the sweets, avoid the chilli.'); loop(); }
      };
      ui.count.classList.add('is-tick');
      S.cd = setTimeout(tick, 650);
      loop();
    }
    function pause(focusCard) {
      if (S.state === 'count') { clearTimeout(S.cd); S.state = 'idle'; show('start'); return; }
      if (S.state !== 'playing') return;
      S.state = 'paused'; show('pause'); keys.l = keys.r = false;
      announce('Paused at ' + S.score + ' points, ' + Math.ceil(Math.max(0, DURATION - S.elapsed)) + ' seconds left. Press P or Resume to continue.');
      if (focusCard) { var rb = root.querySelector('[data-resume]'); setTimeout(function () { try { rb.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }, 30); }
    }
    function resume() {
      if (S.state !== 'paused') return;
      S.state = 'playing'; show(null);
      try { canvas.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
      announce('Resumed.');
      loop();
    }
    function end() {
      S.state = 'over';
      var isNew = S.score > 0 && setBest(S.score);
      refreshBest();
      var tier = TIERS[0];
      TIERS.forEach(function (t) { if (S.score >= t.min) tier = t; });
      ui.final.textContent = S.score; ui.tier.textContent = tier.title; ui.tierline.textContent = tier.line;
      ui.sc.textContent = S.caught; ui.sm.textContent = S.missed; ui.ss.textContent = S.maxStreak; ui.sg.textContent = S.gold;
      ui.newbest.hidden = !isNew;
      show('over');
      items.length = 0;
      sfx(S.score >= 180 ? 'win' : 'lose');
      if (isNew || S.score >= 180) {
        var rc = arena.getBoundingClientRect();
        fx('confetti', rc.left + rc.width / 2, rc.top + rc.height * 0.35, isMobile() ? 24 : 44);
        impact(0.3, { x: rc.left + rc.width / 2, y: rc.top + rc.height * 0.35, color: '#FFD778' });
        haptic('win');
        shower(isNew ? 0.6 : 0.45, rc.left + rc.width / 2, rc.top + rc.height * 0.3, 'rain');
      } else { shake(2, 260); haptic('medium'); }
      announce('Time! ' + S.score + ' points. ' + tier.title + '.' + (isNew ? ' New shop record.' : ''));
      var btn = root.querySelector('[data-restart]');
      setTimeout(function () { try { btn.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }, 60);
    }

    function hud() {
      ui.score.textContent = S.score;
      var mult = multiplier();
      ui.combo.textContent = 'x' + mult;
      ui.combo.classList.toggle('is-hot', mult > 1);
      var rem = Math.max(0, DURATION - S.elapsed);
      ui.time.textContent = Math.ceil(rem);
      ui.ring.style.strokeDashoffset = (RING * (1 - rem / DURATION)).toFixed(2);
      ui.timer.classList.toggle('is-hurry', rem <= 5 && S.state === 'playing');
      if (S.state === 'playing') {
        if (!said10 && rem <= 10) { said10 = true; announce('10 seconds left. Score ' + S.score + '.'); }
        else if (!said5 && rem <= 5) { said5 = true; announce('5 seconds.'); }
      }
    }
    function multiplier() { return 1 + Math.min(3, Math.floor(S.streak / 6)); }
    // weight of a catch: how hard the basket squashes
    var WEIGHT = { laddoo: 1, jalebi: 0.7, barfi: 0.8, jamun: 0.9, golden: 1.6, chilli: 0.6 };

    function spawn(t, attract) {
      var bag = [], total = 0;
      ORDER.forEach(function (k) {
        var w = TYPES[k].w;
        if (k === 'chilli') w = attract ? 0 : (t < 0.12 ? 0 : lerp(7, 17, t));
        if (k === 'golden' && items.some(function (i) { return i.type === 'golden'; })) w = 0;
        bag.push([k, w]); total += w;
      });
      var roll = Math.random() * total, type = 'laddoo';
      for (var i = 0; i < bag.length; i++) { roll -= bag[i][1]; if (roll <= 0) { type = bag[i][0]; break; } }
      var x, tries = 0;
      do { x = rnd(r * 1.4, W - r * 1.4); tries++; } while (tries < 5 && items.some(function (it) { return it.y < r * 3 && Math.abs(it.x - x) < r * 3; }));
      var sp = H * (attract ? 0.16 : 0.4) * (attract ? 1 : lerp(1, 1.95, t)) * rnd(0.9, 1.15);
      if (type === 'golden') sp *= 1.18;
      items.push({ type: type, x: x, y: -r * 1.4, vx: rnd(-12, 12), vy: sp, rot: rnd(0, TAU), vr: rnd(-2, 2) * (type === 'jalebi' ? 2 : 1), attract: !!attract });
    }

    function burst(x, y, color, n, kind) {
      if (isReduced()) n = Math.min(n, 4);
      var cap = Math.min(240, ((E().maxParticles || 600) / 3) | 0);
      for (var i = 0; i < n && parts.length < cap; i++) {
        var a = kind === 'crumb' ? rnd(Math.PI * 1.05, Math.PI * 1.95) : rnd(0, TAU), v = kind === 'crumb' ? rnd(60, 220) : rnd(40, 180);
        parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: kind === 'crumb' ? 640 : kind === 'steam' ? -40 : 120, life: 0, max: rnd(0.45, 0.9), c: color, s: kind === 'crumb' ? rnd(1.6, 3.4) : rnd(1.5, 3), k: kind });
      }
    }
    function popup(x, y, text, color) { pops.push({ x: x, y: y, text: text, c: color, life: 0, max: 0.9 }); }

    function catchIt(it) {
      var bx = it.x, by = basket.y(), cp = clientPt(bx, by);
      // the sweet lands: the basket squashes by the weight of what it caught, then springs back
      if (!isReduced()) basket.sqv += 5.5 * (WEIGHT[it.type] || 1) * (0.6 + 0.4 * Math.min(1, it.vy / (H * 0.6)));
      if (it.type === 'chilli') {
        S.score = Math.max(0, S.score + TYPES.chilli.pts); S.streak = 0;
        basket.flash = 1;
        // shake: core impact when present (gated by prefs), else the old local canvas jolt
        if (typeof E().impact === 'function') impact(0.24, { x: cp.x, y: cp.y, color: '#7CFF8A', kind: 'chilli' });
        else if (shakeOn()) S.shake = 0.35;
        haptic('error');
        burst(bx, by, '#7CFF8A', 10, 'steam'); popup(bx, by - 20, '−15', '#9BFF9B');
        bubble(pick(CHILLI), bx, 'bad'); sfx('thud');
        announce('Chilli! Minus 15. Score ' + S.score + '.');
      } else {
        S.streak++; S.maxStreak = Math.max(S.maxStreak, S.streak); S.caught++;
        var mult = multiplier(), gain = TYPES[it.type].pts * mult;
        S.score += gain;
        pile.push(it.type); if (pile.length > 7) pile.shift();
        basket.glow = it.type === 'golden' ? 1 : 0.45; basket.gc = it.type === 'golden' ? '#FFD778' : '#FFC46A';
        popup(bx, by - 18, '+' + gain, it.type === 'golden' ? '#FFD778' : '#FFF4DC');
        burst(bx, by, it.type === 'golden' ? '#FFD778' : '#FFE3A3', it.type === 'golden' ? 22 : 7, 'spark');
        if (it.type === 'golden') {
          S.gold++; sfx('chime'); sfx('thump', { power: 0.3 }); bubble(pick(GOLDEN), bx, 'gold');
          fx('sparkBurst', cp.x, cp.y, '#FFD778', 22);
          impact(0.32, { x: cp.x, y: cp.y, color: '#FFD778', kind: 'golden' });
          haptic('success');
          shower(0.7, cp.x, cp.y);
          announce('Golden laddoo! Plus ' + gain + '. Score ' + S.score + '.');
        } else { sfx('pop'); impact(0.06, { x: cp.x, y: cp.y, color: '#FFE3A3' }); haptic('light'); }
        if (STREAK[S.streak]) {
          bubble(STREAK[S.streak], bx, 'gold'); sfx('sparkle');
          impact(Math.min(0.36, 0.2 + 0.04 * (S.streak / 6)), { x: cp.x, y: cp.y, color: '#FFD778', kind: 'streak' });
          haptic('success');
          announce(STREAK[S.streak] + ' Score ' + S.score + '.');
          // the bigger the streak, the bigger the golden shower across the screen
          shower(Math.min(1, 0.1 + 0.25 * (S.streak / 6)), cp.x, cp.y);
        } else if (S.streak > 18 && S.streak % 6 === 0) shower(1, cp.x, cp.y);
      }
      hud();
    }
    function missIt(it) {
      if (it.type === 'chilli') { if (Math.random() < 0.25) bubble('Dodged the mirchi. Wise.', it.x); return; }
      S.missed++; S.streak = 0;
      land(it, 1);
      splats.push({ x: it.x, c: CRUMB[it.type], life: 0, max: 1.4, w: r * rnd(1.1, 1.5) });
      burst(it.x, floorY - 2, CRUMB[it.type], 9, 'crumb');
      if (!isReduced()) basket.wob = 1;
      bubble(pick(MISS), it.x, 'miss');
      sfx('thud');
      var cp = clientPt(it.x, floorY);
      impact(it.type === 'golden' ? 0.24 : 0.2, { x: cp.x, y: cp.y, color: CRUMB[it.type], kind: 'miss' });
      haptic('miss');
      if (it.type === 'golden') announce('The golden laddoo hit the floor.');
      hud();
    }
    basket.y = function () { return floorY - basket.h; };
    // a sweet that reaches the counter keeps its momentum: it squashes, bounces (restitution ~.32) and fades
    function land(it, alpha) {
      if (isReduced()) return;
      if (dead.length > 11) dead.shift();
      dead.push({ type: it.type, x: it.x, y: floorY - r * 0.62, vx: it.vx * 0.6 + rnd(-40, 40), vy: -Math.max(80, it.vy * 0.32), rot: it.rot, vr: it.vr * 0.6 + rnd(-3, 3), life: 0, max: 1.05, sq: 0.35, a: alpha, hops: 0 });
    }

    /* ---------- loop ---------- */
    function wantsLoop() {
      if (document.hidden) return false;
      if (S.state === 'playing' || S.state === 'count') return true;
      if (parts.length || pops.length || splats.length || dead.length || S.warm > 0.01 || SFX.count()) return true;
      if (Math.abs(basket.sq) + Math.abs(basket.sqv) + Math.abs(basket.tilt) + basket.glow > 0.004) return true;
      // the idle "attract" drizzle is ambient motion: it stops for calm mode and for Pause all motion
      return S.inView && !isReduced() && !isPausedPref() && (S.state === 'idle' || S.state === 'over');
    }
    function loop() { if (!raf && wantsLoop()) { last = 0; raf = requestAnimationFrame(frame); } }
    function frame(ts) {
      raf = 0;
      var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016; last = ts;
      update(dt); draw();
      if (wantsLoop()) raf = requestAnimationFrame(frame);
    }

    function update(dt) {
      var playing = S.state === 'playing';
      if (playing) {
        S.elapsed += dt;
        var t = Math.min(1, S.elapsed / DURATION);
        S.spawn -= dt * 1000;
        if (S.spawn <= 0) { spawn(t, false); S.spawn = lerp(820, 330, Math.pow(t, 0.9)) * rnd(0.8, 1.2); }
        if (keys.l || keys.r) {
          usingKb = true;
          kbVel += ((keys.r ? 1 : 0) - (keys.l ? 1 : 0)) * W * 7 * dt;
          kbVel = clamp(kbVel, -W * 1.2, W * 1.2);
        } else kbVel *= Math.pow(0.0005, dt);
        if (usingKb) basket.tx = basket.x + kbVel * dt * 3;
        if (S.elapsed >= DURATION) { hud(); end(); return; }
        if (((S.elapsed * 10) | 0) !== S._lastHud) { S._lastHud = (S.elapsed * 10) | 0; hud(); }
      } else if (S.state === 'idle' || S.state === 'over') {
        attractT -= dt * 1000;
        if (attractT <= 0 && S.inView && !isReduced() && !isPausedPref() && items.length < 3) { spawn(0, true); attractT = rnd(2200, 3600); }
      }
      var half = basket.w / 2;
      basket.tx = clamp(basket.tx, half, W - half);
      basket.x += (basket.tx - basket.x) * (1 - Math.exp(-dt * (usingKb ? 30 : 22)));
      basket.x = clamp(basket.x, half, W - half);
      // inertia: the basket leans against its own swing, then settles on a damped spring
      var vx = dt > 0 ? (basket.x - basket.px) / dt : 0; basket.px = basket.x;
      if (!isReduced()) {
        var lean = clamp(-vx / (W * 2.2), -0.16, 0.16);
        basket.tv += ((lean - basket.tilt) * 140 - basket.tv * 14) * dt;
        basket.tilt += basket.tv * dt;
        basket.sqv += (-basket.sq * 260 - basket.sqv * 13) * dt;
        basket.sq = clamp(basket.sq + basket.sqv * dt, -0.22, 0.28);
      } else { basket.tilt = basket.tv = basket.sq = basket.sqv = 0; }
      basket.glow = Math.max(0, basket.glow - dt * 1.8);
      basket.wob = Math.max(0, basket.wob - dt * 1.6);
      basket.flash = Math.max(0, basket.flash - dt * 2.2);
      S.shake = Math.max(0, S.shake - dt);

      var rim = basket.y();
      for (var i = items.length - 1; i >= 0; i--) {
        var it = items[i];
        var prevB = it.y + r * 0.4;
        it.y += it.vy * dt; it.x += it.vx * dt; it.rot += it.vr * dt;
        if (it.x < r || it.x > W - r) it.vx *= -1;
        if (it.attract) { if (it.y + r * 0.62 >= floorY) { items.splice(i, 1); land(it, 0.3); } continue; }
        if (!playing) continue;
        var nb = it.y + r * 0.4;
        if (prevB < rim + 4 && nb >= rim && Math.abs(it.x - basket.x) < half - r * 0.1) { items.splice(i, 1); catchIt(it); continue; }
        if (it.y - r * 0.6 > floorY) { items.splice(i, 1); missIt(it); }
      }
      for (var p = parts.length - 1; p >= 0; p--) {
        var q = parts[p]; q.life += dt;
        if (q.life >= q.max) { parts.splice(p, 1); continue; }
        q.vx *= 0.98; q.vy += q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt;
        if (q.k === 'crumb' && q.y > floorY) { q.y = floorY; q.vy *= -0.3; q.vx *= 0.6; }
      }
      for (var k = pops.length - 1; k >= 0; k--) { pops[k].life += dt; if (pops[k].life >= pops[k].max) pops.splice(k, 1); }
      for (var s = splats.length - 1; s >= 0; s--) { splats[s].life += dt; if (splats[s].life >= splats[s].max) splats.splice(s, 1); }
      clock += dt;
      S.warm = Math.max(0, S.warm - dt * 0.55);
      var ground = floorY - r * 0.62;
      for (var di = dead.length - 1; di >= 0; di--) {
        var dd = dead[di]; dd.life += dt;
        if (dd.life >= dd.max) { dead.splice(di, 1); continue; }
        dd.vy += 1500 * dt; dd.vx *= Math.pow(0.35, dt);
        dd.x += dd.vx * dt; dd.y += dd.vy * dt; dd.rot += dd.vr * dt;
        dd.sq = Math.max(0, dd.sq - dt * 3.2);
        if (dd.y > ground) {
          dd.y = ground;
          if (dd.vy > 90 && dd.hops < 2) { dd.vy = -dd.vy * 0.32; dd.hops++; dd.sq = 0.28; dd.vr *= 0.6; } else { dd.vy = 0; dd.vr *= 0.85; }
        }
      }
      if (lifeOn()) {
        // hanging lamps: damped pendulums pushed by a slow, irregular breeze
        var bz = breeze(clock);
        for (var hi = 0; hi < arch.hang.length; hi++) {
          var hg = arch.hang[hi], kk = 392 / hg.len;
          hg.v += (-kk * hg.a - 1.3 * hg.v + bz * 0.32 + Math.sin(clock * 0.7 + hg.seed) * 0.07) * dt;
          hg.a = clamp(hg.a + hg.v * dt, -0.32, 0.32);
        }
      }
    }

    // live architecture: deepmala flames, hanging brass lamps, the bandhanwar across the top (static in calm)
    // R4: lamps fade with the feathered mandapa towards the side edges
    function edgeK(x) { var fw = Math.min(0.16, 150 / W) * W; return fw > 0 ? clamp(Math.min(x, W - x) / fw, 0, 1) : 1; }
    function drawArch(t, live) {
      var i, L0, f;
      if (glowCv) {
        ctx.globalCompositeOperation = 'lighter';
        for (i = 0; i < arch.lamps.length; i++) {
          L0 = arch.lamps[i]; f = (live ? flick(t, L0.seed) : 0.8) * edgeK(L0.x);
          if (f <= 0.01) continue;
          ctx.globalAlpha = 0.3 * f; ctx.drawImage(glowCv, L0.x - 12, L0.y - 13, 24, 24);
          ctx.globalAlpha = 0.85 * f; ctx.fillStyle = '#FFD778';
          ctx.beginPath(); ctx.ellipse(L0.x, L0.y - 1.4 * f, 1.3, 2.5 + f, 0, 0, TAU); ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      }
      for (i = 0; i < arch.hang.length; i++) {
        var hg = arch.hang[i], ex = hg.x + Math.sin(hg.a) * hg.len, ey = hg.y0 + Math.cos(hg.a) * hg.len;
        f = live ? flick(t * 0.9, hg.seed + 4) : 0.8;
        ctx.strokeStyle = 'rgba(255,215,120,0.3)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(hg.x, hg.y0); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.save(); ctx.translate(ex, ey); ctx.rotate(-hg.a);
        // three suspension cords from a ring to a shallow brass bowl
        ctx.beginPath(); ctx.arc(0, 0, 2.2, 0, TAU); ctx.moveTo(-1, 1.5); ctx.lineTo(-8, 11); ctx.moveTo(1, 1.5); ctx.lineTo(8, 11); ctx.moveTo(0, 2); ctx.lineTo(0, 11); ctx.stroke();
        ctx.fillStyle = 'rgba(176,124,48,0.75)';
        ctx.beginPath(); ctx.moveTo(-10, 11); ctx.quadraticCurveTo(0, 21, 10, 11); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(255,215,120,0.55)'; ctx.beginPath(); ctx.moveTo(-10.5, 11); ctx.lineTo(10.5, 11); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 20); ctx.lineTo(0, 24); ctx.stroke();
        if (glowCv) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 0.42 * f; ctx.drawImage(glowCv, -18, -10, 36, 36);
          ctx.globalAlpha = 0.95 * f; ctx.fillStyle = '#FFE7A3';
          ctx.beginPath(); ctx.ellipse(0, 8 - f, 1.7, 3.2 + f, 0, 0, TAU); ctx.fill();
          ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
        }
        ctx.restore();
      }
      // bandhanwar: a cord with mango leaves and marigold strings; each drop swings on its own in the breeze
      var sp = clamp(W / 40, 18, 26), n = Math.max(6, Math.floor((W - 8) / sp)), x0 = (W - (n - 1) * sp) / 2, bz = live ? breeze(t) : 0;
      var cordG = ctx.createLinearGradient(0, 0, W, 0);
      cordG.addColorStop(0, 'rgba(255,215,120,0)'); cordG.addColorStop(0.1, 'rgba(255,215,120,0.42)'); cordG.addColorStop(0.9, 'rgba(255,215,120,0.42)'); cordG.addColorStop(1, 'rgba(255,215,120,0)');
      ctx.strokeStyle = cordG; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, 4.5); ctx.quadraticCurveTo(W / 2, 14.5, W, 4.5); ctx.stroke();
      var leaf = leafPath(), vein = veinPath();
      for (i = 0; i < n; i++) {
        var x = x0 + i * sp, u = x / W, y = 4.5 + 20 * u * (1 - u), ek = edgeK(x);
        if (ek <= 0.02) continue;
        var sw = live ? bz * 0.14 + Math.sin(t * 1.9 + i * 0.55) * 0.05 : 0;
        ctx.globalAlpha = ek;
        ctx.save(); ctx.translate(x, y); ctx.rotate(sw);
        if (i % 3 === 1) {
          ctx.strokeStyle = 'rgba(255,215,120,0.3)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 15); ctx.stroke();
          ctx.fillStyle = 'rgba(233,144,42,0.85)';
          ctx.beginPath(); ctx.arc(0, 5, 2.7, 0, TAU); ctx.moveTo(2.7, 11); ctx.arc(0, 11, 2.7, 0, TAU); ctx.moveTo(3, 17.5); ctx.arc(0, 17.5, 3, 0, TAU); ctx.fill();
          ctx.fillStyle = 'rgba(140,60,10,0.5)';
          ctx.beginPath(); ctx.arc(0, 5, 0.9, 0, TAU); ctx.moveTo(0.9, 11); ctx.arc(0, 11, 0.9, 0, TAU); ctx.moveTo(1, 17.5); ctx.arc(0, 17.5, 1, 0, TAU); ctx.fill();
        } else {
          ctx.scale(0.86, 0.86);
          ctx.fillStyle = 'rgba(58,104,46,0.6)'; ctx.fill(leaf);
          ctx.strokeStyle = 'rgba(255,215,120,0.38)'; ctx.stroke(leaf);
          ctx.strokeStyle = 'rgba(255,215,120,0.16)'; ctx.stroke(vein);
        }
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }

    function draw() {
      if (!W) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(bgCv, 0, 0, W, H);
      // R3.4: the screen-wide shower continues through the stall (light only: sweets pass behind it)
      if (SFX.count()) { var rcA = canvas.getBoundingClientRect(); SFX.paint(ctx, dpr, rcA.left, rcA.top, W, H, true, 0.8); }
      drawArch(performance.now() / 1000, lifeOn());
      if (S.warm > 0.01) {
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, S.warm) * 0.72;
        ctx.drawImage(SFX.soft('#FFC46A'), -W * 0.25, -H * 0.55, W * 1.5, H * 1.5);
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      }
      // legacy fallback only (older core without E2M.impact): a translate-only jolt of the sweets, <= 3.5px
      if (S.shake > 0) ctx.translate(rnd(-4, 4) * S.shake * 2.4, rnd(-3, 3) * S.shake * 2.4);
      for (var s = 0; s < splats.length; s++) {
        var sp = splats[s], a = 1 - sp.life / sp.max;
        ctx.globalAlpha = a * 0.85; ctx.fillStyle = sp.c;
        ctx.beginPath(); ctx.ellipse(sp.x, floorY + 2, sp.w * (1 + 0.15 * (1 - a)), sp.w * 0.24, 0, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
      var now = performance.now() / 1000;
      // light spill: a golden laddoo throws a warm pool onto the counter that grows as it falls
      for (var gi = 0; gi < items.length; gi++) {
        var gl = items[gi];
        if (gl.type !== 'golden' || gl.attract) continue;
        var near = clamp(gl.y / floorY, 0, 1), pr = r * (3 + 5 * near);
        var pg = ctx.createRadialGradient(gl.x, floorY, 0, gl.x, floorY, pr);
        pg.addColorStop(0, 'rgba(255,215,120,' + (0.08 + 0.22 * near * near).toFixed(3) + ')'); pg.addColorStop(1, 'rgba(255,215,120,0)');
        ctx.fillStyle = pg; ctx.beginPath(); ctx.ellipse(gl.x, floorY, pr, pr * 0.28, 0, 0, TAU); ctx.fill();
      }
      for (var i = 0; i < items.length; i++) {
        var it = items[i], spr = sprites[it.type];
        if (!spr) continue;
        ctx.globalAlpha = it.attract ? 0.3 : 1;
        if (it.type === 'golden' && glowCv) {
          var gs = glowCv._s * (0.9 + 0.12 * Math.sin(now * 8));
          ctx.globalCompositeOperation = 'lighter';
          ctx.drawImage(glowCv, it.x - gs / 2, it.y - gs / 2, gs, gs);
          ctx.globalCompositeOperation = 'source-over';
        }
        ctx.save(); ctx.translate(it.x, it.y); ctx.rotate(it.type === 'barfi' || it.type === 'chilli' ? Math.sin(it.rot) * 0.5 : it.rot);
        ctx.drawImage(spr.cv, -spr.size / 2, -spr.size / 2, spr.size, spr.size);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      for (var dI = 0; dI < dead.length; dI++) {
        var dd = dead[dI], ds = sprites[dd.type]; if (!ds) continue;
        var fa = dd.life > dd.max - 0.4 ? (dd.max - dd.life) / 0.4 : 1;
        ctx.globalAlpha = Math.max(0, fa) * dd.a;
        ctx.save(); ctx.translate(dd.x, dd.y + r * 0.62); ctx.scale(1 + dd.sq * 0.5, 1 - dd.sq * 0.45); ctx.translate(0, -r * 0.62); ctx.rotate(dd.rot);
        ctx.drawImage(ds.cv, -ds.size / 2, -ds.size / 2, ds.size, ds.size);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      if (bsk) {
        var by = basket.y(), wob = Math.sin(now * 28) * basket.wob * 0.12;
        ctx.save();
        // soft shadow on the counter (stays flat while the basket squashes above it)
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(basket.x, by + basket.h + 2, basket.w * (0.42 + basket.sq * 0.12), 5, 0, 0, TAU); ctx.fill();
        if (basket.glow > 0.01) {
          var bg2 = ctx.createRadialGradient(basket.x, by + 2, 0, basket.x, by + 2, basket.w * 0.9);
          bg2.addColorStop(0, basket.gc === '#FFD778' ? 'rgba(255,215,120,' + (0.32 * basket.glow).toFixed(3) + ')' : 'rgba(255,196,106,' + (0.22 * basket.glow).toFixed(3) + ')');
          bg2.addColorStop(1, 'rgba(255,196,106,0)');
          ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = bg2;
          ctx.beginPath(); ctx.ellipse(basket.x, by + 2, basket.w * 0.9, basket.w * 0.42, 0, 0, TAU); ctx.fill();
          ctx.globalCompositeOperation = 'source-over';
        }
        ctx.translate(basket.x, by + basket.h); ctx.rotate(wob + basket.tilt);
        ctx.scale(1 + basket.sq * 0.35, 1 - basket.sq * 0.5);
        ctx.translate(0, -basket.h);
        ctx.drawImage(bsk.back, -bsk.cw / 2, -bsk.pad, bsk.cw, bsk.ch);
        var slots = [[-0.26, 0.02], [0.26, 0.02], [0, -0.02], [-0.13, -0.3], [0.13, -0.3], [0.34, -0.22], [-0.34, -0.22]];
        for (var p = 0; p < pile.length; p++) {
          var ps = sprites[pile[p]], sl = slots[p % slots.length], k = 0.72;
          if (!ps) continue;
          ctx.drawImage(ps.cv, sl[0] * basket.w - ps.size * k / 2, sl[1] * basket.h * 1.4 - ps.size * k / 2 - r * 0.15, ps.size * k, ps.size * k);
        }
        ctx.drawImage(bsk.front, -bsk.cw / 2, -bsk.pad, bsk.cw, bsk.ch);
        if (basket.flash > 0) {
          ctx.globalCompositeOperation = 'source-atop';
          ctx.globalAlpha = basket.flash * 0.5; ctx.fillStyle = '#ff2a2a';
          ctx.fillRect(-bsk.cw / 2, -bsk.pad, bsk.cw, bsk.ch);
          ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        }
        ctx.restore();
      }
      if (parts.length) {
        for (var q = 0; q < parts.length; q++) {
          var pt = parts[q], la = 1 - pt.life / pt.max;
          ctx.globalAlpha = la; ctx.fillStyle = pt.c;
          if (pt.k === 'spark') { ctx.globalCompositeOperation = 'lighter'; ctx.fillRect(pt.x - pt.s / 2, pt.y - pt.s / 2, pt.s, pt.s); ctx.globalCompositeOperation = 'source-over'; }
          else { ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.k === 'steam' ? pt.s * (2 - la) * 2 : pt.s, 0, TAU); ctx.fill(); }
        }
        ctx.globalAlpha = 1;
      }
      if (pops.length) {
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (var j = 0; j < pops.length; j++) {
          var po = pops[j], pr = po.life / po.max;
          ctx.globalAlpha = 1 - pr * pr;
          ctx.font = '400 ' + Math.round(24 + 7 * (1 - pr)) + 'px "Yatra One", "Mukta", Georgia, serif';
          ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(8,11,30,0.75)';
          ctx.strokeText(po.text, po.x, po.y - pr * 40);
          ctx.fillStyle = po.c; ctx.fillText(po.text, po.x, po.y - pr * 40);
        }
        ctx.globalAlpha = 1;
      }
    }

    /* ---------- input ---------- */
    function pointerX(e) { var rc = canvas.getBoundingClientRect(); return e.clientX - rc.left; }
    canvas.addEventListener('pointermove', function (e) { if (S.state === 'playing') { usingKb = false; basket.tx = pointerX(e); } });
    canvas.addEventListener('pointerdown', function (e) {
      hideHint();
      if (S.state === 'playing') { usingKb = false; basket.tx = pointerX(e); if (e.pointerType !== 'mouse') { try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } } }
    });
    root.addEventListener('keydown', function (e) {
      var k = e.key;
      var left = k === 'ArrowLeft' || k === 'a' || k === 'A', right = k === 'ArrowRight' || k === 'd' || k === 'D';
      if (S.state === 'playing') {
        if (left || right) { e.preventDefault(); if (left) keys.l = true; if (right) keys.r = true; }
        else if (k === 'Escape' || k === 'p' || k === 'P') { e.preventDefault(); e.stopPropagation(); pause(true); }
      } else if (S.state === 'paused' && (k === 'p' || k === 'P')) { e.preventDefault(); resume(); }
    });
    pauseBtn.addEventListener('click', function () { pause(true); });
    // R4: every button press in the stall answers with a tiny tap (primary actions add their own, stronger one first)
    root.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('button'); if (b && root.contains(b)) haptic('tap'); });
    // keyboard users who Tab away mid-round get a paused game, not a running one behind their back
    root.addEventListener('focusout', function (e) {
      if (S.state === 'playing' && e.relatedTarget && !root.contains(e.relatedTarget)) pause(false);
    });
    var A0 = E();
    if (A0.on) {
      A0.on('motion:pause', function () { if (S.state === 'playing' || S.state === 'count') pause(false); items = items.filter(function (i) { return !i.attract; }); });
      A0.on('motion:resume', function () { loop(); });
      A0.on('prefs:change', function () { loop(); });
    }
    root.addEventListener('keyup', function (e) {
      var k = e.key;
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.l = false;
      if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.r = false;
    });
    canvas.addEventListener('blur', function () { keys.l = keys.r = false; });
    $('[data-start]').addEventListener('click', start);
    $('[data-restart]').addEventListener('click', start);
    $('[data-resume]').addEventListener('click', resume);
    $('[data-again]').addEventListener('click', function () { S.state = 'idle'; start(); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { pause(); if (raf) { cancelAnimationFrame(raf); raf = 0; } }
      else loop();
    });

    game = {
      enter: function () { S.inView = true; resize(); refreshBest(); loop(); },
      leave: function () {
        S.inView = false; pause();
        if (raf && S.state !== 'playing') { cancelAnimationFrame(raf); raf = 0; }
      }
    };
    resize();
    show('start');
  }

  var spec = {
    mount: function (el) { if (el) mount(el); },
    onEnter: function () { if (game) game.enter(); },
    onLeave: function () { if (game) game.leave(); }
  };
  function boot() {
    var api = window.E2M;
    if (!api || typeof api.register !== 'function') return false;
    ensureCss('act-laddoo');
    api.register(KEY, spec);
    return true;
  }
  if (!boot()) document.addEventListener('DOMContentLoaded', boot);
})();
