/* ==========================================================================
   E2M Diwali Playground — Activity 06: Spin the Chakri
   A canvas ground-spinner seen at a three-quarter angle. Press and hold
   (pointer, touch, Space or Enter) to spin it; tapping in a quick rhythm
   builds extra torque. Top speed fires a burst through E2M.fx.
   Mounts into [data-mount="chakri"] through E2M.register.
   Revision 3: the spin owns the WHOLE screen — a vortex of sparks radiating
   across the viewport, a rotating screen-wide spark wheel, a warm light that
   pulses with the RPM, the chakri hiss tied to RPM, and a huge climax at max.
   All of it lives on E2M.screenLayer('chakri') ('back': under the text and
   controls), gated by Calm / Pause / reduced motion and the particle caps.
   ========================================================================== */
(function () {
  'use strict';

  var KEY = 'chakri';
  var TAU = Math.PI * 2;
  var MAXW = 42;           // angular speed (rad/s) that reads as 100 %
  var RPM_AT_MAX = 2400;   // what the gauge claims at 100 % (it exaggerates, lovingly)

  // [threshold, name, aside]
  var LABELS = [
    [0.00, 'Fast asleep', 'Like Mama ji after Diwali lunch.'],
    [0.03, 'Gently rotating', 'Very sanskari. Very calm.'],
    [0.15, 'Government-office ceiling fan', 'Technically, it is moving.'],
    [0.30, 'Mixer-grinder on chutney mode', 'Now we are cooking.'],
    [0.45, 'Auto-rickshaw that spotted a gap', 'Hold on to something.'],
    [0.60, 'Aunty who just heard gossip', 'Unstoppable. Unbothered.'],
    [0.74, 'Delivery rider at 11:58 PM', 'Holding alone tops out here. Tap in a fast rhythm!'],
    [0.88, 'Leaving orbit', 'Someone please inform ISRO.'],
    [0.975, 'MAXIMUM CHAKRI', 'You absolute legend.']
  ];

  var BURST_LINES = [
    'Chakri achieved escape velocity!',
    'That one was visible from Mars. Hi, Mars.',
    'Maximum chakri. The neighbours have been informed.',
    'The physics department would like a word.',
    'Peak spin. Your thumb has earned a laddoo.'
  ];

  // Paper wrap stripes on the coil
  var PAPER = ['#DB59C8', '#FFD778', '#E8641A', '#FFF4DC', '#FF9F32', '#9B3FB8'];
  var SPARK_WARM = ['#FFF4DC', '#FFD778', '#FFD778', '#FF9F32', '#FF9F32', '#E8641A'];

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }
  function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

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
  /*      'petal'/'conf' tumbling solids, 'custom' -> p.draw(ctx,p,a)    */
  /*      extra fields you may set after spawn: g (gravity px/s2),      */
  /*      drag (per-60fps-frame factor), rot, vr, sway, w, h, fl         */
  /*      (flicker 0..1), draw, data                                     */
  /*   sfx.hook(fn)  fn(ctx,dt,t,L,lvl) -> true while it wants frames;   */
  /*      drawn under the particles (washes, wheels, blooms)            */
  /*   sfx.glow(hex,power,x,y)  E2M.screenGlow (flash-safe, guarded)     */
  /*   sfx.sprite(hex) 64px glow sprite; sfx.soft(hex) 128px wash sprite */
  /*   sfx.kick() ensure the loop; sfx.clear() drop everything           */
  /* ------------------------------------------------------------------ */
  function makeScreenFx(key, zOpt) {
    var L = null, raf = 0, last = 0, inFrame = false, parts = [], pool = [], hooks = [], spr = {}, TAU2 = Math.PI * 2;
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
      p.w = size; p.h = size; p.fl = 0; p.a = 1; p.draw = null; p.data = null;
      parts.push(p);
      if (!raf) kick();
      return p;
    }
    function recycleAll() { for (var i = 0; i < parts.length; i++) { parts[i].draw = null; parts[i].data = null; pool.push(parts[i]); } parts.length = 0; }
    function clear() { recycleAll(); hooks.length = 0; if (L) { try { L.clear(); } catch (e) { /* ok */ } } }
    function kick() { if (!raf && !inFrame && layer()) { last = 0; raf = requestAnimationFrame(frame); } } // spawning inside a hook never double-schedules
    function hook(fn) { if (hooks.indexOf(fn) < 0) hooks.push(fn); kick(); }
    function glow(hex, power, x, y) { try { var a = A(); if (typeof a.screenGlow === 'function') a.screenGlow(hex, power, x, y); } catch (e) { /* decorative */ } }
    function frame(t) {
      raf = 0;
      inFrame = true;
      try { step(t); } finally { inFrame = false; }
      if (!raf && (parts.length || hooks.length) && L && L.visible && !paused()) raf = requestAnimationFrame(frame);
    }
    function step(t) {
      var l = layer(); if (!l) return;
      if (!l.visible || paused()) { recycleAll(); hooks.length = 0; if (paused()) l.clear(); return; }
      var dt = last ? Math.min(0.05, Math.max(0.001, (t - last) / 1000)) : 0.016; last = t;
      var c = l.ctx, lvl = level(), i, keep = 0, p, a;
      c.setTransform(l.dpr, 0, 0, l.dpr, 0, 0);
      c.clearRect(0, 0, l.w, l.h);
      for (i = hooks.length - 1; i >= 0; i--) {
        var more = false;
        try { more = !!hooks[i](c, dt, t, l, lvl); } catch (e) { more = false; }
        c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.setTransform(l.dpr, 0, 0, l.dpr, 0, 0);
        if (!more) hooks.splice(i, 1);
      }
      // physics (gravity, drag, sway) then additive pass
      c.globalCompositeOperation = 'lighter';
      for (i = 0; i < parts.length; i++) {
        p = parts[i]; p.life -= dt;
        if (p.life <= 0 || p.y > l.h + 120 || p.y < -l.h || p.x < -260 || p.x > l.w + 260) { p.draw = null; p.data = null; pool.push(p); continue; }
        var d = p.drag === 1 ? 1 : Math.pow(p.drag, dt * 60);
        p.vx *= d; p.vy = p.vy * d + p.g * dt; p.ph += dt * 2.2;
        p.x += (p.vx + (p.sway ? Math.sin(p.ph) * p.sway : 0)) * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
        parts[keep++] = p;
        a = p.life / p.max; a = (a < 0.35 ? a / 0.35 : 1) * p.a;
        if (p.fl && Math.random() < p.fl) a *= 0.25;
        if (p.k === 'spark') {
          c.globalAlpha = a * 0.85; c.strokeStyle = p.c; c.lineWidth = p.size * 0.6;
          c.beginPath(); c.moveTo(p.x - p.vx * 0.045, p.y - p.vy * 0.045); c.lineTo(p.x, p.y); c.stroke();
          c.globalAlpha = a; c.drawImage(sprite(p.c), p.x - p.size * 2, p.y - p.size * 2, p.size * 4, p.size * 4);
        } else if (p.k === 'dot') {
          c.globalAlpha = a; c.drawImage(sprite(p.c), p.x - p.size * 2, p.y - p.size * 2, p.size * 4, p.size * 4);
        } else if (p.k === 'wash') {
          c.globalAlpha = a * a; c.drawImage(soft(p.c), p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
        }
      }
      parts.length = keep;
      // solids pass (petals, confetti, custom sprites)
      c.globalCompositeOperation = 'source-over';
      for (i = 0; i < parts.length; i++) {
        p = parts[i];
        if (p.k === 'spark' || p.k === 'dot' || p.k === 'wash') continue;
        a = p.life / p.max; a = (a < 0.3 ? a / 0.3 : 1) * p.a;
        var cr = Math.cos(p.rot), sn = Math.sin(p.rot), flip = Math.cos(p.ph * 1.6);
        c.globalAlpha = a;
        c.setTransform(l.dpr * cr, l.dpr * sn, -l.dpr * sn * (p.k === 'custom' ? 1 : flip), l.dpr * cr * (p.k === 'custom' ? 1 : flip), l.dpr * p.x, l.dpr * p.y);
        if (p.k === 'custom' && p.draw) { try { p.draw(c, p, a); } catch (e) { p.life = 0; } }
        else if (p.k === 'conf') { c.fillStyle = p.c; c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); }
        else { // petal
          c.fillStyle = p.c; c.beginPath(); c.moveTo(0, -p.h / 2);
          c.quadraticCurveTo(p.w * 0.62, -p.h * 0.1, 0, p.h / 2); c.quadraticCurveTo(-p.w * 0.62, -p.h * 0.1, 0, -p.h / 2); c.fill();
        }
      }
      c.setTransform(l.dpr, 0, 0, l.dpr, 0, 0); c.globalAlpha = 1;
      if (!parts.length && !hooks.length) { c.clearRect(0, 0, l.w, l.h); last = 0; }
    }
    return { layer: layer, level: level, spawn: spawn, hook: hook, glow: glow, sprite: sprite, soft: soft, kick: kick, clear: clear,
      count: function () { return parts.length; }, busy: function () { return !!raf; } };
  }

  function boot() {
    var E = window.E2M;
    if (!E || typeof E.register !== 'function') return false;
    E.register(KEY, makeChakri(E));
    return true;
  }
  if (!boot()) document.addEventListener('DOMContentLoaded', boot, { once: true });

  function makeChakri(E) {
    function fx(name) {
      var args = Array.prototype.slice.call(arguments, 1);
      try { if (E.fx && typeof E.fx[name] === 'function') E.fx[name].apply(E.fx, args); } catch (e) { /* fx is decorative */ }
    }
    function sfx(name, o) { try { if (E.audio && E.audio.play) E.audio.play(name, o); } catch (e) { /* silent */ } }
    function toast(msg) { try { if (E.toast) E.toast(msg); } catch (e) { /* silent */ } }
    function reduced() { return !!E.reduced; }
    /* Revision 2 — immersion + accessibility hooks (guarded) */
    function impact(p, o) { try { if (typeof E.impact === 'function') E.impact(p, o || {}); } catch (e) { /* decorative */ } }
    /* Revision 4 — haptics + translate-only shake (core gates both by prefs / Calm / pause / reduced motion) */
    function haptic(n, p) { try { if (typeof E.haptic === 'function') E.haptic(n, p); } catch (e) { /* decorative */ } }
    function shake(px, ms, o) { try { if (typeof E.shake === 'function') E.shake(px, ms, o); } catch (e) { /* decorative */ } }
    function announce(msg, assertive) {
      try { if (typeof E.announce === 'function') { E.announce(msg, { assertive: !!assertive }); return; } } catch (e) { /* fall back */ }
      if (liveEl) liveEl.textContent = msg;
    }
    function centre() { var r = canvas.getBoundingClientRect(); return { x: r.left + cx, y: r.top + cy }; }

    var embers = null;
    var root, pit, canvas, ctx, bg, bgctx, btn, needle, fillArc, rpmEl, nameEl, asideEl, comboEl, bestEl, burstEl, cue, liveEl;
    var W = 0, H = 0, DPR = 1, cx = 0, cy = 0, K = 0.36, R = 60, ARC_LEN = Math.PI * 130;
    var theta = 0, omega = 0, combo = 1, lastPress = -1e4, holdStart = 0;
    var ptrHeld = false, keyHeld = false, holding = false;
    var raf = 0, last = 0, inView = false, mounted = false;
    var sparks = [], pool = [], emitAcc = 0;
    var cooldownUntil = 0, bursts = 0, shock = 0, flash = 0;
    var sessionPeak = 0, stored = 0, labelIdx = -1, labelIdxPrevMax = 0, lastText = 0, lastSpinSfx = 0, lastCrackle = 0;
    var touched = false, hintEl = null, peakTier = 0, lastKick = 0, saidTier = 0;
    var needleA = 0, needleV = 0; // the gauge needle rides a spring: it lags, overshoots and settles
    var spunUp = false;

    function sparkCap() {
      var m = Number(E.maxParticles) || 600;
      // R3: when the full-screen layer exists it carries ~65% of the particle budget; the close-up pit keeps the rest
      return reduced() ? Math.min(60, m) : Math.min(560, Math.round(m * (typeof E.screenLayer === 'function' ? 0.35 : 0.6)));
    }

    /* ======================================================================
       R3.4 — the full-screen spark wheel (E2M.screenLayer 'chakri', 'back')
       Sparks live in the ground plane around the chakri (u across, v into the
       screen, hgt above the ground) and are projected with a perspective that
       flattens like the chakri up close (K) and opens out to fill the whole
       viewport far away (Ky). Struct-of-arrays typed buffers: zero allocation
       per frame. Flash safety: the wheel's arms and rays rotate slowly enough
       that any point sees < 3 passes a second, and the light wash pulses at
       <= 2 Hz with a small amplitude; the climax flare is a single bloom with
       a 2.6 s cooldown, and screenGlow is rate-capped by core.
       ====================================================================== */
    var SFX = makeScreenFx(KEY, 'back');
    var SCOLS = ['#FFF4DC', '#FFD778', '#FF9F32', '#E8641A', '#DB59C8'];
    var sN = 0, sCap = 0, sU, sV, sH, sVU, sVV, sVH, sLife, sMax, sCol;
    var scrRot = 0, scrFlare = 0, scrEmit = 0, scrF = 0, scrDocX = 0, scrDocY = 0, scrPosAt = 0, scrSettle = 0;
    var lightBuf = null, lightCtx = null, LQ = 4; // the soft light is drawn at 1/4 resolution and composited once
    var scrRings = [0, 0, 0], scrRingOn = [false, false, false], scrRingMax = 1.6, fanA = null, fanB = null, hiss = null, hissRate = -1;

    function screenAlloc() {
      if (sU) return;
      sCap = E.mobile ? 420 : 900;
      sU = new Float32Array(sCap); sV = new Float32Array(sCap); sH = new Float32Array(sCap);
      sVU = new Float32Array(sCap); sVV = new Float32Array(sCap); sVH = new Float32Array(sCap);
      sLife = new Float32Array(sCap); sMax = new Float32Array(sCap); sCol = new Uint8Array(sCap);
    }
    function screenCap() {
      var m = Number(E.maxParticles) || 600;
      return Math.min(sCap, Math.round(m * 0.65));
    }
    // curved, soft-edged light wedges pre-rendered once: one drawImage per frame turns them into a vortex
    function makeFan(n, hexA, hexB, curl, seed) {
      var S = 512, cv = document.createElement('canvas'), g, rnd = seeded(seed), i, k;
      cv.width = cv.height = S; g = cv.getContext('2d');
      g.translate(S / 2, S / 2); g.globalCompositeOperation = 'lighter';
      function rgbaHex(h, a) { var v = parseInt(h.slice(1), 16); return 'rgba(' + (v >> 16 & 255) + ',' + (v >> 8 & 255) + ',' + (v & 255) + ',' + a + ')'; }
      for (i = 0; i < n; i++) {
        var a0 = i / n * TAU + rnd() * 0.25, wd = 0.05 + rnd() * 0.08, col = i % 2 ? hexB : hexA;
        var gr = g.createRadialGradient(0, 0, S * 0.03, 0, 0, S / 2);
        gr.addColorStop(0, rgbaHex(col, 0)); gr.addColorStop(0.1, rgbaHex(col, 0.5));
        gr.addColorStop(0.45, rgbaHex(col, 0.16)); gr.addColorStop(1, rgbaHex(col, 0));
        g.fillStyle = gr; g.beginPath();
        for (k = 0; k <= 16; k++) { var t = k / 16, r = S * 0.5 * t, a = a0 - wd * (0.3 + t) + curl * t; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
        for (k = 16; k >= 0; k--) { var t2 = k / 16, r2 = S * 0.5 * t2, b = a0 + wd * (0.3 + t2) + curl * t2; g.lineTo(Math.cos(b) * r2, Math.sin(b) * r2); }
        g.closePath(); g.fill();
      }
      return cv;
    }
    // the chakri's viewport position, from a cached document offset (no layout read per frame)
    function screenPos() {
      try {
        var r = canvas.getBoundingClientRect();
        scrDocX = r.left + (window.pageXOffset || 0) + cx;
        scrDocY = r.top + (window.pageYOffset || 0) + cy;
      } catch (e) { /* keep the last */ }
    }
    function emitScreen(f, burstMode, n) {
      var cap = screenCap(), i, a, sp, out, j;
      for (i = 0; i < n && sN < cap; i++) {
        j = sN++;
        if (burstMode) {
          a = rand(0, TAU); sp = rand(500, 2100) * (E.mobile ? 0.7 : 1);
          sU[j] = Math.cos(a) * R * 0.6; sV[j] = Math.sin(a) * R * 0.6; sH[j] = R * 0.15;
          sVU[j] = Math.cos(a) * sp; sVV[j] = Math.sin(a) * sp; sVH[j] = rand(150, 1150);
          sLife[j] = sMax[j] = rand(1.2, 2.6);
          var r0 = Math.random(); sCol[j] = r0 < 0.3 ? 0 : r0 < 0.62 ? 1 : r0 < 0.82 ? 2 : r0 < 0.9 ? 3 : 4;
        } else {
          // the two nozzles jet backwards along the tangent with an outward fling, exactly like the close-up sparks
          a = theta + (Math.random() < 0.5 ? 0 : Math.PI) + rand(-0.12, 0.12);
          sp = (260 + 1500 * f) * rand(0.45, 1.1) * (E.mobile ? 0.7 : 1); out = rand(0.15, 0.6);
          sU[j] = Math.cos(a) * R; sV[j] = Math.sin(a) * R; sH[j] = R * 0.1;
          sVU[j] = (Math.sin(a) + Math.cos(a) * out) * sp; sVV[j] = (-Math.cos(a) + Math.sin(a) * out) * sp;
          sVH[j] = rand(30, 520) * (0.3 + f);
          sLife[j] = sMax[j] = rand(0.7, 1.4 + 1.2 * f);
          var r1 = Math.random();
          sCol[j] = (f > 0.55 && r1 < 0.08) ? 4 : r1 < 0.22 ? 0 : r1 < 0.6 ? 1 : r1 < 0.88 ? 2 : 3;
        }
      }
      SFX.hook(screenHook);
    }
    function screenWanted() { return SFX.layer() && SFX.level() > 0; }

    function screenHook(c, dt, t, L, lvl) {
      if (!mounted || lvl <= 0) { sN = 0; return false; }
      var f = omega / MAXW, w = L.w, h = L.h, calm = lvl < 0.5, i, j, k;
      scrF = f;
      if (t - scrPosAt > 500) { scrPosAt = t; screenPos(); }
      var X = scrDocX - (window.pageXOffset || 0), Y = scrDocY - (window.pageYOffset || 0);
      var big = Math.sqrt(w * w + h * h), Ky = clamp(h / w * 0.78, 0.55, 1.25), Kn = K;
      var mul = Math.min(1.3, lvl);

      // emission rides the RPM (it also keeps flowing for a moment while the chakri spins down)
      if (f > 0.06) {
        scrEmit += (30 + 820 * Math.pow(f, 1.4)) * (calm ? 0.15 : mul) * (E.mobile ? 0.55 : 1) * dt;
        var nE = scrEmit | 0; scrEmit -= nE;
        if (nE) emitScreen(f, false, nE);
      } else scrEmit = 0;
      // the wheel turns slower than the chakri itself (a big wheel reads as depth) and never strobes
      scrRot += (0.2 + 2.3 * f) * (calm ? 0 : 1) * dt;
      if (scrFlare > 0) scrFlare = Math.max(0, scrFlare - dt * 1.15);

      // 1+2. the soft light — a warm wash that fills the screen and pulses with the speed, the sky lifting, and the
      // rotating screen-wide wheel of curled light rays — all drawn into a quarter-resolution buffer and composited once
      var bw = Math.max(1, Math.ceil(w / LQ)), bh = Math.max(1, Math.ceil(h / LQ));
      if (!lightBuf) { lightBuf = document.createElement('canvas'); lightCtx = lightBuf.getContext('2d'); }
      if (lightBuf.width !== bw || lightBuf.height !== bh) { lightBuf.width = bw; lightBuf.height = bh; }
      var g = lightCtx, q = 1 / LQ, lit = false;
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, bw, bh);
      g.setTransform(q, 0, 0, q, 0, 0); g.globalCompositeOperation = 'lighter';
      var pulse = calm ? 1 : 1 + 0.12 * Math.sin(t / 1000 * TAU * (0.5 + 1.4 * f));
      var wa = Math.min(0.62, ((0.03 + 0.3 * Math.pow(f, 1.2)) * pulse + scrFlare * 0.32) * (calm ? 0.6 : 1));
      if (wa > 0.004) {
        lit = true;
        var rad = big * 0.86; // R4: fixed reach; the light grows by intensity only, never by size
        g.globalAlpha = wa; g.drawImage(SFX.soft('#FFB547'), X - rad, Y - rad * 0.82, rad * 2, rad * 1.64);
        g.globalAlpha = wa * 0.35; g.drawImage(SFX.soft('#DB59C8'), X - rad * 0.7, Y - rad * 0.5, rad * 1.4, rad * 1.0);
        var sky = (Math.pow(f, 2) * 0.16 + scrFlare * 0.12) * (calm ? 0.5 : 1);
        if (sky > 0.004) { g.globalAlpha = sky; g.drawImage(SFX.soft('#FF9F32'), w * 0.5 - w * 0.8, -h * 0.55, w * 1.6, h * 1.3); }
      }
      if (!calm && (f > 0.12 || scrFlare > 0.02)) {
        if (!fanA) { fanA = makeFan(9, '#FFD778', '#FF9F32', 1.5, 7); fanB = makeFan(7, '#FFF4DC', '#DB59C8', -1.1, 11); }
        var fa = Math.min(0.5, (0.02 + 0.2 * Math.pow(Math.max(0, f - 0.1) / 0.9, 1.3) + scrFlare * 0.22) * mul);
        var Rs = Math.max(big, h / Ky) * 1.0, s = Rs / 256 * q, rot, cs, sn; // R4: fixed size, it only turns and brightens
        for (k = 0; k < 2; k++) {
          rot = k ? -scrRot * 0.45 + 1.3 : scrRot * 0.62;
          cs = Math.cos(rot) * s; sn = Math.sin(rot) * s;
          g.setTransform(cs, sn * Ky, -sn, cs * Ky, X * q, Y * q);
          g.globalAlpha = k ? fa * 0.55 : fa;
          g.drawImage(k ? fanB : fanA, -256, -256);
        }
        lit = true;
      }
      g.globalAlpha = 1;
      c.globalCompositeOperation = 'lighter';
      if (lit) { c.globalAlpha = 1; c.drawImage(lightBuf, 0, 0, bw * LQ, bh * LQ); }
      if (!calm && (f > 0.12 || scrFlare > 0.02)) {
        // spiral arms of spark-light: 2 arms at a crawl, up to 6 at full roar (<= 2.5 passes/sec anywhere)
        var arms = 2 + Math.round(4 * f), M = 22, armA = Math.min(0.42, 0.42 * Math.pow(f, 1.1) + scrFlare * 0.2) * mul;
        if (armA > 0.01) {
          var Rmax = big * 0.66, Rmin = R * 1.6, spr = SFX.sprite('#FFD778'), spr2 = SFX.sprite('#FF9F32');
          for (j = 0; j < arms; j++) {
            for (i = 0; i < M; i++) {
              var tt = i / (M - 1), rr = Rmin + (Rmax - Rmin) * tt * tt, an = scrRot + j * TAU / arms - tt * 2.4;
              var kk = Kn + (Ky - Kn) * Math.min(1, rr / (R * 6));
              var sz = (2.4 + 9 * tt) * (0.55 + 0.6 * f);
              c.globalAlpha = armA * (1 - tt * 0.72);
              c.drawImage(i % 3 ? spr : spr2, X + Math.cos(an) * rr - sz * 2, Y + Math.sin(an) * rr * kk - sz * 2, sz * 4, sz * 4);
            }
          }
        }
      }
      // 3. climax shock rings sweeping past the screen edges
      var ringsLive = false;
      for (k = 0; k < 3; k++) {
        if (!scrRingOn[k]) continue;
        scrRings[k] += dt;
        if (scrRings[k] >= scrRingMax) { scrRingOn[k] = false; continue; }
        ringsLive = true;
        if (scrRings[k] < 0) continue; // staggered start
        var life = scrRings[k] / scrRingMax;
        var rr2 = R * 1.4 + big * 1.05 * (1 - Math.pow(1 - life, 2.4));
        c.globalAlpha = Math.pow(1 - life, 1.6) * (k === 1 ? 0.32 : 0.55);
        c.strokeStyle = k === 1 ? '#DB59C8' : '#FFD778';
        c.lineWidth = (k === 2 ? 1.2 : 2.4) + 7 * (1 - life);
        c.beginPath(); c.ellipse(X, Y, rr2, rr2 * Ky, 0, 0, TAU); c.stroke();
      }
      // 4. the sparks: plane physics (vortex swirl, drag, gravity, ground bounce), batched streaks + glowing heads
      if (sN) {
        var drag = Math.exp(-0.75 * dt), swirl = (calm ? 0.25 : 1) * (520 + 980 * f), gH = 760;
        for (i = sN - 1; i >= 0; i--) {
          sLife[i] -= dt;
          var u = sU[i], v = sV[i], r = Math.sqrt(u * u + v * v) + 1;
          if (sLife[i] <= 0 || r > big * 1.5) { // swap-remove
            j = --sN;
            sU[i] = sU[j]; sV[i] = sV[j]; sH[i] = sH[j]; sVU[i] = sVU[j]; sVV[i] = sVV[j]; sVH[i] = sVH[j];
            sLife[i] = sLife[j]; sMax[i] = sMax[j]; sCol[i] = sCol[j];
            continue;
          }
          // tangential pull along the spin (inertia carries them into a spiral) + a little centrifugal push
          var sw = swirl / (1 + r / 520), cf = 90 * f / r;
          sVU[i] = (sVU[i] + (-v / r * sw + u * cf) * dt) * drag;
          sVV[i] = (sVV[i] + (u / r * sw + v * cf) * dt) * drag;
          sVH[i] -= gH * dt;
          sU[i] = u + sVU[i] * dt; sV[i] = v + sVV[i] * dt; sH[i] += sVH[i] * dt;
          if (sH[i] < 0) { sH[i] = 0; sVH[i] = -sVH[i] * 0.32; sVU[i] *= 0.72; sVV[i] *= 0.72; }
        }
        c.lineCap = 'round';
        for (var band = 0; band < 2; band++) {
          c.lineWidth = band ? 2.1 : 1.2;
          for (var col = 0; col < SCOLS.length; col++) {
            c.strokeStyle = SCOLS[col]; c.globalAlpha = (band ? 0.9 : 0.42) * (calm ? 0.7 : 1);
            c.beginPath();
            var any = false;
            for (i = 0; i < sN; i++) {
              if (sCol[i] !== col || ((sLife[i] / sMax[i]) > 0.45 ? 1 : 0) !== band) continue;
              var rq = Math.sqrt(sU[i] * sU[i] + sV[i] * sV[i]), kq = Kn + (Ky - Kn) * Math.min(1, rq / (R * 6));
              var px = X + sU[i], py = Y + sV[i] * kq - sH[i];
              c.moveTo(px - sVU[i] * 0.05, py - (sVV[i] * kq - sVH[i]) * 0.05); c.lineTo(px, py); any = true;
            }
            if (any) c.stroke();
          }
        }
        for (i = 0; i < sN; i++) {
          var lf = sLife[i] / sMax[i];
          if (lf < 0.5) continue;
          var rh = Math.sqrt(sU[i] * sU[i] + sV[i] * sV[i]), kh = Kn + (Ky - Kn) * Math.min(1, rh / (R * 6)), hs = 2.6 + 2.4 * lf;
          c.globalAlpha = lf; c.drawImage(SFX.sprite(SCOLS[sCol[i]]), X + sU[i] - hs * 2, Y + sV[i] * kh - sH[i] - hs * 2, hs * 4, hs * 4);
        }
      }
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      return f > 0.004 || sN > 0 || ringsLive || scrFlare > 0.01;
    }

    function screenClimax() {
      if (!screenWanted()) return;
      screenAlloc(); screenPos();
      var lvl = SFX.level(), calm = lvl < 0.5;
      scrFlare = 1;
      if (!calm) { scrRingMax = 1.6; scrRings[0] = 0; scrRings[1] = -0.14; scrRings[2] = -0.3; scrRingOn[0] = scrRingOn[1] = scrRingOn[2] = true; }
      emitScreen(1, true, Math.round((calm ? 40 : 300) * Math.min(1.3, lvl) * (E.mobile ? 0.6 : 1)));
      var X = scrDocX - (window.pageXOffset || 0), Y = scrDocY - (window.pageYOffset || 0);
      SFX.glow('#FFD778', calm ? 0.5 : 1, X, Y);
    }

    /* the chakri hiss: one continuous loop whose pitch rides the RPM (no-op while sound is off) */
    function hissSync(f) {
      var a = E.audio;
      if (f > 0.012 && inView && !document.hidden) {
        if (!hiss && a && typeof a.loop === 'function') { try { hiss = a.loop('chakri', { rate: f }); hissRate = f; } catch (e) { hiss = null; } }
        if (hiss && Math.abs(f - hissRate) > 0.004) { hissRate = f; try { hiss.set(f); } catch (e) { /* ok */ } }
      } else hissStop();
    }
    function hissStop() { if (hiss) { try { hiss.stop(); } catch (e) { /* ok */ } hiss = null; hissRate = -1; } }

    /* ---------- markup ---------- */
    function gaugeSVG() {
      var gx = 160, gy = 170, ticks = '', petals = '';
      for (var i = 0; i <= 24; i++) {
        var a = Math.PI + (i / 24) * Math.PI;
        var major = i % 6 === 0;
        var r1 = major ? 98 : 105, r2 = 113;
        ticks += '<line class="ck-tick' + (major ? ' ck-tick--major' : '') + '" x1="' + (gx + Math.cos(a) * r1).toFixed(1) +
          '" y1="' + (gy + Math.sin(a) * r1).toFixed(1) + '" x2="' + (gx + Math.cos(a) * r2).toFixed(1) +
          '" y2="' + (gy + Math.sin(a) * r2).toFixed(1) + '"/>';
        if (major) {
          var deg = (a * 180 / Math.PI) + 90;
          petals += '<path class="ck-petal" transform="translate(' + (gx + Math.cos(a) * 150).toFixed(1) + ' ' +
            (gy + Math.sin(a) * 150).toFixed(1) + ') rotate(' + deg.toFixed(1) + ')" d="M0 -7 C4 -3 4 3 0 7 C-4 3 -4 -3 0 -7Z"/>';
        }
      }
      return '' +
        '<svg class="ck-gauge-svg" viewBox="0 0 320 206" aria-hidden="true" focusable="false">' +
          '<defs>' +
            '<linearGradient id="ckGaugeGrad" gradientUnits="userSpaceOnUse" x1="30" y1="0" x2="290" y2="0">' +
              '<stop offset="0" stop-color="#9C7430"/><stop offset=".55" stop-color="#FFD778"/>' +
              '<stop offset="1" stop-color="#FFF4DC"/>' +
            '</linearGradient>' +
            '<radialGradient id="ckNeedleGlow" cx="50%" cy="60%" r="50%">' +
              '<stop offset="0" stop-color="#FFF4DC"/><stop offset=".5" stop-color="#FFD778"/><stop offset="1" stop-color="#FF9F32"/>' +
            '</radialGradient>' +
          '</defs>' +
          '<path class="ck-arc-outer" d="M10 170 A150 150 0 0 1 310 170"/>' +
          petals +
          '<path class="ck-arc-track" d="M30 170 A130 130 0 0 1 290 170"/>' +
          '<path class="ck-arc-fill" d="M30 170 A130 130 0 0 1 290 170" stroke-dasharray="' + ARC_LEN.toFixed(1) + '" stroke-dashoffset="' + ARC_LEN.toFixed(1) + '"/>' +
          ticks +
          '<text class="ck-end" x="30" y="198" text-anchor="middle">chill</text>' +
          '<text class="ck-end" x="290" y="198" text-anchor="middle">ISRO</text>' +
          '<g class="ck-needle" transform="rotate(-90 160 170)">' +
            '<path class="ck-needle-halo" d="M160 58 C169 88 178 118 168 148 C165 158 155 158 152 148 C142 118 151 88 160 58Z"/>' +
            '<path class="ck-needle-flame" d="M160 58 C169 88 178 118 168 148 C165 158 155 158 152 148 C142 118 151 88 160 58Z"/>' +
            '<path class="ck-needle-core" d="M160 104 C164 120 168 136 163 150 C161 155 159 155 157 150 C152 136 156 120 160 104Z"/>' +
          '</g>' +
          '<path class="ck-diya" d="M124 166 Q160 204 196 166 Q178 174 160 174 Q142 174 124 166Z"/>' +
          '<path class="ck-diya-rim" d="M124 166 Q160 174 196 166"/>' +
          '<circle class="ck-diya-dot" cx="146" cy="182" r="2"/><circle class="ck-diya-dot" cx="160" cy="186" r="2"/><circle class="ck-diya-dot" cx="174" cy="182" r="2"/>' +
        '</svg>';
    }

    function build(stage) {
      root = document.createElement('div');
      root.className = 'act-chakri';
      root.innerHTML = '' +
        '<p class="act-hint" data-hint>Press and hold to spin · tap in rhythm for torque · Space works too</p>' +
        '<div class="ck-pit">' +
          '<canvas class="ck-canvas" role="img" aria-label="A chakri ground-spinner firework lying in a spark pit. Press and hold it, or the Hold to spin button, to make it spin. Its speed and mood are shown beside it and announced."></canvas>' +
          '<div class="ck-cue" aria-hidden="true"><span class="ck-cue-ring"></span><span class="ck-cue-text">Press &amp; hold</span></div>' +
          '<span class="ck-embers" aria-hidden="true"><b></b><i></i><i></i><i></i><i></i></span>' +
        '</div>' +
        '<div class="ck-console">' +
          '<span class="ck-toran" aria-hidden="true"></span><span class="ck-stamp deva-stamp" lang="hi" aria-hidden="true">चकरी</span>' +
          '<div class="ck-gauge">' + gaugeSVG() +
            '<p class="ck-readout"><span class="ck-rpm">0</span><span class="ck-unit">RPM</span></p>' +
          '</div>' +
          '<p class="ck-name">' + LABELS[0][1] + '</p>' +
          '<p class="ck-aside">' + LABELS[0][2] + '</p>' +
          '<p class="ck-combo" aria-hidden="true"><span class="ck-combo-k">Rhythm</span> <b class="ck-combo-v">&times;1.0</b></p>' +
          '<button type="button" class="ck-hold btn-diya" aria-describedby="ck-help">' +
            '<span class="ck-hold-label">Hold to spin</span>' +
          '</button>' +
          '<p class="ck-help" id="ck-help">Hold, or tap in rhythm for extra torque. Space works too.</p>' +
          '<dl class="ck-stats">' +
            '<div><dt>Top speed</dt><dd class="ck-best">0 RPM</dd></div>' +
            '<div><dt>Maximum chakris</dt><dd class="ck-bursts">0</dd></div>' +
          '</dl>' +
          '<span class="ck-warli" aria-hidden="true"></span>' +
          '<p class="ck-live" aria-live="polite"></p>' +
        '</div>';
      stage.appendChild(root);

      pit = root.querySelector('.ck-pit');
      canvas = root.querySelector('.ck-canvas');
      ctx = canvas.getContext('2d');
      bg = document.createElement('canvas');
      bgctx = bg.getContext('2d');
      btn = root.querySelector('.ck-hold');
      needle = root.querySelector('.ck-needle');
      fillArc = root.querySelector('.ck-arc-fill');
      rpmEl = root.querySelector('.ck-rpm');
      nameEl = root.querySelector('.ck-name');
      asideEl = root.querySelector('.ck-aside');
      comboEl = root.querySelector('.ck-combo');
      bestEl = root.querySelector('.ck-best');
      burstEl = root.querySelector('.ck-bursts');
      cue = root.querySelector('.ck-cue');
      embers = root.querySelector('.ck-embers');
      liveEl = root.querySelector('.ck-live');
      hintEl = root.querySelector('[data-hint]');
      // ids must be unique even if mounted twice
      var hid = 'ck-help-' + Math.random().toString(36).slice(2, 7);
      root.querySelector('.ck-help').id = hid;
      btn.setAttribute('aria-describedby', hid);

      try { stored = Number(E.score && E.score.get ? E.score.get(KEY) : 0) || 0; } catch (e) { stored = 0; }
      bestEl.textContent = fmt(stored) + ' RPM';
    }

    /* ---------- input ---------- */
    function press(now) {
      inView = true; // the person is interacting, so it is on screen
      if (holding) return;
      holding = true;
      now = now || performance.now();
      var gap = now - lastPress;
      if (gap < 480) combo = Math.min(2.6, combo + 0.08 + 0.26 * (480 - gap) / 480);
      lastPress = now;
      holdStart = now;
      omega = Math.min(MAXW, omega + 1.4 + 1.3 * (combo - 1));
      if (!touched) { touched = true; root.classList.add('is-touched'); if (hintEl) hintEl.classList.add('is-gone'); }
      // every press is a tiny kick through the pit: a glint at low speed, a real knock when it is already roaring
      if (gap < 480 && omega / MAXW > 0.5 && now - lastKick > 450) { lastKick = now; impact(0.08 + 0.1 * (omega / MAXW), { x: centre().x, y: centre().y, color: '#FFB547' }); }
      // R4: the fuse catching is a firm press; a rhythm tap at speed is a light one
      if (omega / MAXW < 0.2) { haptic('medium'); var c1 = centre(); shake(1.5, 220, { x: c1.x, y: c1.y }); }
      else haptic(gap < 480 ? 'light' : 'tap');
      root.classList.add('is-holding'); if (btn) btn.classList.add('is-lit');
      if (omega / MAXW < 0.08 && now - lastSpinSfx > 400) { sfx('flick'); lastSpinSfx = now; } // the fuse catches
      else if (!(E.audio && typeof E.audio.loop === 'function') && now - lastSpinSfx > 140) { sfx('spin'); lastSpinSfx = now; }
      kick();
    }
    function release() {
      if (!holding) return;
      holding = false;
      root.classList.remove('is-holding'); if (btn) btn.classList.remove('is-lit');
      saveBest(false);
    }
    function syncHold() {
      var want = ptrHeld || keyHeld;
      if (want && !holding) press();
      else if (!want && holding) release();
    }

    function bindInput() {
      function down(e) {
        if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return;
        ptrHeld = true;
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
        if (e.currentTarget === btn) e.preventDefault(); // keep focus ring calm, no text selection
        syncHold();
      }
      function up() { ptrHeld = false; syncHold(); }
      [pit, btn].forEach(function (el) {
        el.addEventListener('pointerdown', down);
        el.addEventListener('pointerup', up);
        el.addEventListener('pointercancel', up);
        el.addEventListener('lostpointercapture', up);
        el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      });
      btn.addEventListener('keydown', function (e) {
        if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter') {
          e.preventDefault();
          if (!e.repeat) { keyHeld = true; syncHold(); }
        }
      });
      btn.addEventListener('keyup', function (e) {
        if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter') { e.preventDefault(); keyHeld = false; syncHold(); }
      });
      btn.addEventListener('blur', function () { keyHeld = false; syncHold(); });
      btn.addEventListener('click', function (e) { e.preventDefault(); });
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        btn.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        btn.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      });
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) { ptrHeld = keyHeld = false; syncHold(); stop(); hissStop(); }
        else if (inView) { kick(); render(); }
      });
    }

    /* ---------- sizing + static scenery ---------- */
    function seeded(seed) {
      var s = seed >>> 0;
      return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    }

    function resize() {
      var r = pit.getBoundingClientRect();
      var w = Math.max(200, Math.round(r.width)), h = Math.max(200, Math.round(r.height));
      if (w === W && h === H) return;
      W = w; H = h;
      DPR = Math.min(window.devicePixelRatio || 1, E.mobile ? 1.5 : 2);
      canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
      bg.width = canvas.width; bg.height = canvas.height;
      cx = W / 2; cy = H * 0.57;
      R = clamp(Math.min(W * 0.15, H * 0.22), 42, 108);
      cue.style.setProperty('--ck-cue-y', (cy / H * 100).toFixed(2) + '%');
      cue.style.setProperty('--ck-cue-size', (R * 2.6).toFixed(0) + 'px');
      placeEmbers();
      screenPos();
      drawBg();
      render();
    }

    function drawBg() {
      var g = bgctx, rnd = seeded(20261105), i, a;
      g.setTransform(DPR, 0, 0, DPR, 0, 0);
      g.clearRect(0, 0, W, H);

      g.save();
      g.translate(cx, cy);
      g.scale(1, K);
      // ground haze
      var big = Math.max(W * 0.62, H * 1.4);
      var gr = g.createRadialGradient(0, 0, 0, 0, 0, big);
      // R4: deep-space haze (space-2 -> space-1 -> transparent), feathered into the continuous backdrop
      gr.addColorStop(0, 'rgba(18,16,58,0.55)');
      gr.addColorStop(0.42, 'rgba(8,11,30,0.36)');
      gr.addColorStop(1, 'rgba(5,7,15,0)');
      g.fillStyle = gr;
      g.beginPath(); g.arc(0, 0, big, 0, TAU); g.fill();

      // two fine gold hairline rings on the dark floor
      g.lineWidth = 1;
      g.strokeStyle = 'rgba(255,215,120,0.22)';
      g.beginPath(); g.arc(0, 0, R * 3.05, 0, TAU); g.stroke();
      g.strokeStyle = 'rgba(255,215,120,0.1)';
      g.beginPath(); g.arc(0, 0, R * 4.05, 0, TAU); g.stroke();
      for (i = 0; i < 24; i++) {
        a = i / 24 * TAU;
        g.beginPath(); g.arc(Math.cos(a) * R * 3.55, Math.sin(a) * R * 3.55, 1.1, 0, TAU);
        g.fillStyle = 'rgba(255,215,120,0.28)'; g.fill();
      }

      // scorched pit
      var pr = R * 2.4;
      gr = g.createRadialGradient(0, 0, R * 0.3, 0, 0, pr);
      gr.addColorStop(0, 'rgba(5,7,15,0.94)');
      gr.addColorStop(0.68, 'rgba(10,11,32,0.78)');
      gr.addColorStop(1, 'rgba(10,11,32,0)');
      g.fillStyle = gr;
      g.beginPath(); g.arc(0, 0, pr, 0, TAU); g.fill();
      // soot rays
      g.lineCap = 'round';
      for (i = 0; i < 30; i++) {
        a = rnd() * TAU;
        var r0 = R * (1.15 + rnd() * 0.3), r1 = R * (1.7 + rnd() * 0.9);
        g.lineWidth = 2 + rnd() * 6;
        g.strokeStyle = 'rgba(0,0,0,' + (0.18 + rnd() * 0.25).toFixed(2) + ')';
        g.beginPath(); g.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); g.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); g.stroke();
      }
      // the pit's kerb: one hairline ring
      g.strokeStyle = 'rgba(255,215,120,0.3)'; g.lineWidth = 1;
      g.beginPath(); g.arc(0, 0, R * 2.5, 0, TAU); g.stroke();
      g.restore();

      // soft edge so the pit melts into whatever backdrop the zone paints
      g.globalCompositeOperation = 'destination-in';
      var mrx = W * 0.5, mry = Math.min(H * 0.54, H - cy);
      g.save(); g.translate(cx, cy); g.scale(1, mry / mrx);
      var m = g.createRadialGradient(0, 0, mrx * 0.3, 0, 0, mrx);
      m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(0.6, 'rgba(0,0,0,0.75)'); m.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = m; g.fillRect(-W * 2, -H * 4, W * 4, H * 8);
      g.restore();
      g.globalCompositeOperation = 'source-over';
    }

    // R3.7 idle life: the unlit fuse smoulders — a breathing ember and a few motes rising off it (CSS only, so an idle
    // chakri costs no frames); hidden while it spins, frozen in Calm / Pause (css)
    function placeEmbers() {
      if (!embers || !W) return;
      var nx = cx + Math.cos(theta) * R, ny = cy + Math.sin(theta) * R * K - R * 0.06;
      embers.style.left = nx.toFixed(1) + 'px'; embers.style.top = ny.toFixed(1) + 'px';
    }

    function roundRect(g, x, y, w, h, r) {
      g.beginPath();
      g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
      g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
      g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath();
    }

    /* ---------- simulation ---------- */
    function spawn(f, burstMode) {
      var s = pool.pop() || {};
      var j = Math.random() < 0.5 ? 0 : 1;
      var a = burstMode ? rand(0, TAU) : theta + j * Math.PI + rand(-0.07, 0.07);
      var rr = R * 0.98;
      s.x = Math.cos(a) * rr; s.z = Math.sin(a) * rr; s.y = R * 0.1;
      var sp, tx, tz, out;
      if (burstMode) {
        sp = rand(260, 720); tx = Math.cos(a); tz = Math.sin(a); out = 0;
        s.vy = rand(120, 420);
      } else {
        // the nozzle jets backwards along the tangent, with a little outward fling
        sp = (70 + 560 * f) * rand(0.5, 1.15);
        tx = Math.sin(a); tz = -Math.cos(a); out = rand(0.12, 0.5);
        s.vy = rand(18, 170) * (0.35 + f);
      }
      s.vx = (tx + Math.cos(a) * out) * sp;
      s.vz = (tz + Math.sin(a) * out) * sp;
      s.life = s.max = burstMode ? rand(0.6, 1.3) : rand(0.3, 0.75 + 0.6 * f);
      var r = Math.random();
      if (burstMode) s.c = r < 0.35 ? '#DB59C8' : r < 0.7 ? '#FFD778' : '#FFF4DC';
      else if (f > 0.55 && r < 0.16) s.c = j ? '#DB59C8' : '#FFF4DC';
      else if (f > 0.8 && r < 0.2) s.c = '#3FD0C9';
      else s.c = SPARK_WARM[(Math.random() * SPARK_WARM.length) | 0];
      s.w = rand(1, 2.3);
      sparks.push(s);
    }

    function update(dt, now) {
      if (holding) {
        var spool = clamp((now - holdStart) / 1800, 0, 1);
        var torque = (4 + 9 * spool) * combo;
        omega += (torque - 0.42 * omega) * dt;
      } else {
        omega -= (0.6 + 0.3 * omega) * dt;
      }
      if (now - lastPress > 700) combo = Math.max(1, combo - 0.9 * dt);
      omega = clamp(omega, 0, MAXW);
      theta = (theta + omega * dt) % TAU;
      var f = omega / MAXW;
      if (f > sessionPeak) sessionPeak = f;
      // R3.4: the whole screen joins in once it is really spinning; the hiss rides the RPM
      if (f > 0.06 && screenWanted()) { screenAlloc(); SFX.hook(screenHook); }
      hissSync(f);
      // R3.7: a real chakri does not just stop — it wobbles and settles on the ground
      if (f > 0.2) spunUp = true;
      else if (spunUp && f < 0.03 && !holding) { spunUp = false; if (!reduced()) scrSettle = 1; }
      if (scrSettle > 0) scrSettle = Math.max(0, scrSettle - dt * 0.75);
      root.classList.toggle('is-spinning', f > 0.03);

      // sparks
      var cap = sparkCap();
      if (f > 0.025) {
        emitAcc += (24 + 520 * f) * (reduced() ? 0.2 : 1) * dt;
        while (emitAcc >= 1) { emitAcc -= 1; if (sparks.length < cap) spawn(f, false); }
      } else emitAcc = 0;

      var drag = Math.exp(-1.5 * dt);
      for (var i = sparks.length - 1; i >= 0; i--) {
        var s = sparks[i];
        s.life -= dt;
        if (s.life <= 0) { sparks[i] = sparks[sparks.length - 1]; sparks.pop(); pool.push(s); continue; }
        s.vx *= drag; s.vz *= drag; s.vy -= 560 * dt;
        s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt;
        if (s.y < 0) { s.y = 0; s.vy = -s.vy * 0.34; s.vx *= 0.62; s.vz *= 0.62; }
      }

      if (shock > 0) shock = Math.max(0, shock - dt * 1.3);
      if (flash > 0) flash = Math.max(0, flash - dt * 2.4);

      if (f >= 0.985 && now > cooldownUntil) burst(now);

      // needle spring (critically under-damped: a little overshoot reads as mechanical)
      if (reduced()) { needleA = f; needleV = 0; }
      else { needleV += ((f - needleA) * 120 - needleV * 11) * dt; needleA += needleV * dt; }

      if (holding && f > 0.3 && now - lastCrackle > 650) { sfx('crackle', { size: 0.3 + 0.5 * f, distance: 0.08 }); lastCrackle = now; }
      updateUI(f, now);
    }

    function burst(now) {
      cooldownUntil = now + 2600;
      bursts++;
      shock = 1; flash = 1;
      omega = MAXW * 0.72;
      var n = reduced() ? 20 : 140, cap = sparkCap() + 140;
      for (var i = 0; i < n && sparks.length < cap; i++) spawn(1, true);
      var r = canvas.getBoundingClientRect();
      var x = r.left + cx, y = r.top + cy;
      fx('firework', x, Math.max(40, y - R * 2.6), { color: 'multi', size: 1.2, type: 'ring' });
      fx('sparkBurst', x, y, '#FFD778', reduced() ? 16 : 56);
      screenClimax();
      sfx('burst', { size: 1, distance: 0.04 }); sfx('thump', { power: 0.7 });
      setTimeout(function () { sfx('crackle', { size: 1, distance: 0.1 }); }, 260);
      impact(0.82, { x: x, y: y, color: '#FFD778', kind: 'chakri' });
      haptic('rumble', 0.6); // R4: maximum chakri — a short rumble
      needleV += 3.2; // the needle slams the stop
      var line = pick(BURST_LINES);
      toast(line);
      announce('Maximum chakri! ' + line + ' Maximum chakris: ' + (bursts) + '.');
      burstEl.textContent = String(bursts);
      root.classList.remove('is-burst'); void root.offsetWidth; root.classList.add('is-burst');
      saveBest(true);
    }

    function saveBest(quiet) {
      var rpm = Math.round(sessionPeak * RPM_AT_MAX);
      if (rpm <= stored) return;
      var prev = stored;
      stored = rpm;
      bestEl.textContent = fmt(rpm) + ' RPM';
      var isNew = false;
      try { isNew = !!(E.score && E.score.setBest && E.score.setBest(KEY, rpm)); } catch (e) { isNew = false; }
      if (isNew && !quiet && prev > 0 && rpm - prev >= 150) toast('New personal best: ' + fmt(rpm) + ' RPM. Your thumb is an athlete.');
    }

    function updateUI(f, now) {
      var nf = clamp(needleA, -0.02, 1.04);
      var deg = -90 + 180 * nf;
      root.style.setProperty('--ck-f', f.toFixed(3));
      needle.setAttribute('transform', 'rotate(' + deg.toFixed(2) + ' 160 170)');
      fillArc.setAttribute('stroke-dashoffset', (ARC_LEN * (1 - f)).toFixed(1));
      if (now - lastText > 90) {
        lastText = now;
        rpmEl.textContent = fmt(f * RPM_AT_MAX);
        comboEl.querySelector('.ck-combo-v').textContent = '×' + combo.toFixed(1);
        comboEl.classList.toggle('is-hot', combo > 1.55);
        var idx = 0;
        for (var i = LABELS.length - 1; i >= 0; i--) { if (f >= LABELS[i][0]) { idx = i; break; } }
        if (idx !== labelIdx) {
          labelIdx = idx;
          nameEl.textContent = LABELS[idx][1];
          asideEl.textContent = LABELS[idx][2];
          root.setAttribute('data-tier', String(idx));
          if (idx > labelIdxPrevMax) {
            // crossing a speed threshold: the floor knocks harder at every tier
            if (idx >= 3 && holding) {
              var c0 = centre(); impact(Math.min(0.38, 0.1 + 0.06 * (idx - 3)), { x: c0.x, y: c0.y, color: idx >= 6 ? '#DB59C8' : '#FF9F32', kind: 'tier' });
              haptic(idx >= 7 ? 'thump' : idx >= 5 ? 'medium' : 'light'); // R4: each speed tier knocks harder
            }
            labelIdxPrevMax = idx;
          }
          if (idx === 0) labelIdxPrevMax = 0;
          // announce only new heights on the way up, and the return to rest — not every tier on the spin-down
          if (idx >= 3 && idx > saidTier) { saidTier = idx; announce(LABELS[idx][1] + '. ' + fmt(f * RPM_AT_MAX) + ' RPM.'); }
          else if (idx === 0 && peakTier >= 3) announce('The chakri has stopped. Top speed ' + fmt(stored) + ' RPM.');
          peakTier = Math.max(peakTier, idx); if (idx <= 1) { saidTier = 0; } if (idx === 0) peakTier = 0;
        }
      }
    }

    /* ---------- render ---------- */
    function render() {
      if (!ctx || !W) return;
      var c = ctx, f = omega / MAXW;
      // physical detail: a real chakri chatters on the ground at speed — a small hop and a precessing tilt
      var cy0 = cy, K0 = K;
      if (!reduced() && f > 0.2) {
        var chatter = (f - 0.2) / 0.8;
        cy = cy0 - Math.abs(Math.sin(theta * 3)) * chatter * chatter * R * 0.05;
        K = K0 * (1 + 0.07 * chatter * Math.sin(theta * 0.5));
      }
      if (scrSettle > 0 && !reduced()) {
        var ph = (1 - scrSettle) * 26, amp = scrSettle * scrSettle;
        K = K * (1 + 0.16 * amp * Math.sin(ph));
        cy = cy - Math.abs(Math.sin(ph * 0.5)) * amp * R * 0.06;
      }
      try { renderAt(c, f); } finally { cy = cy0; K = K0; }
    }
    function renderAt(c, f) {
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, canvas.width, canvas.height);
      c.drawImage(bg, 0, 0);
      c.setTransform(DPR, 0, 0, DPR, 0, 0);

      // light pool on the floor
      c.save(); c.translate(cx, cy); c.scale(1, K);
      c.globalCompositeOperation = 'lighter';
      var pool_r = R * (1.6 + 4.6 * f + flash * 2);
      var gl = c.createRadialGradient(0, 0, 0, 0, 0, pool_r);
      gl.addColorStop(0, 'rgba(255,170,70,' + (0.12 + 0.46 * f + flash * 0.4).toFixed(3) + ')');
      gl.addColorStop(0.45, 'rgba(219,89,200,' + (0.03 + 0.14 * f).toFixed(3) + ')');
      gl.addColorStop(1, 'rgba(219,89,200,0)');
      c.fillStyle = gl; c.beginPath(); c.arc(0, 0, pool_r, 0, TAU); c.fill();
      c.restore();
      c.globalCompositeOperation = 'source-over';

      drawChakri(f);
      drawTrails(f);
      drawSparks();
      if (shock > 0 && !reduced()) {
        c.globalCompositeOperation = 'lighter';
        var sr = R * (1.2 + (1 - shock) * 5);
        c.strokeStyle = 'rgba(255,215,120,' + (shock * 0.7).toFixed(3) + ')';
        c.lineWidth = 2 + shock * 6;
        c.beginPath(); c.ellipse(cx, cy, sr, sr * K, 0, 0, TAU); c.stroke();
        c.strokeStyle = 'rgba(219,89,200,' + (shock * 0.45).toFixed(3) + ')';
        c.lineWidth = 1.5;
        c.beginPath(); c.ellipse(cx, cy, sr * 0.8, sr * 0.8 * K, 0, 0, TAU); c.stroke();
        c.globalCompositeOperation = 'source-over';
      }
    }

    function drawChakri(f) {
      var c = ctx, T = R * 0.27, Rr = R - T * 0.5, N = 12, seg = TAU / N, i;
      // contact shadow
      c.save(); c.translate(cx, cy + R * 0.07); c.scale(1, K);
      c.fillStyle = 'rgba(0,0,0,0.55)'; c.beginPath(); c.arc(0, 0, R * 1.1, 0, TAU); c.fill();
      c.restore();
      // tube side wall
      c.lineWidth = T;
      c.strokeStyle = '#3d1426';
      c.beginPath(); c.ellipse(cx, cy + T * 0.34, Rr, Rr * K, 0, 0, TAU); c.stroke();
      // paper-wrapped coil, stripes rotate with the spin
      for (i = 0; i < N; i++) {
        c.strokeStyle = PAPER[i % PAPER.length];
        c.beginPath(); c.ellipse(cx, cy, Rr, Rr * K, 0, theta + i * seg, theta + (i + 1) * seg + 0.02); c.stroke();
      }
      // motion blur wash once it really goes
      if (f > 0.28) {
        c.globalAlpha = Math.min(0.88, (f - 0.28) * 1.7);
        c.strokeStyle = '#F6A85A';
        c.beginPath(); c.ellipse(cx, cy, Rr, Rr * K, 0, 0, TAU); c.stroke();
        c.globalAlpha = 1;
      }
      // tube edges and highlight
      c.lineWidth = 1.2;
      c.strokeStyle = 'rgba(18,5,14,0.65)';
      c.beginPath(); c.ellipse(cx, cy, Rr + T / 2, (Rr + T / 2) * K, 0, 0, TAU); c.stroke();
      c.beginPath(); c.ellipse(cx, cy, Rr - T / 2, (Rr - T / 2) * K, 0, 0, TAU); c.stroke();
      c.strokeStyle = 'rgba(255,244,220,0.35)';
      c.beginPath(); c.ellipse(cx, cy - T * 0.18, Rr, Rr * K, 0, Math.PI * 1.1, Math.PI * 1.9); c.stroke();

      // inner coil spiral
      var inner = Rr - T * 0.5 - 2, start = R * 0.17;
      c.lineCap = 'round';
      for (var pass = 0; pass < 2; pass++) {
        c.lineWidth = pass ? Math.max(1, R * 0.025) : Math.max(2, R * 0.075);
        c.strokeStyle = pass ? 'rgba(255,215,120,' + (0.75 - f * 0.4).toFixed(2) + ')' : '#6e2238';
        c.beginPath();
        for (var s = 0; s <= 64; s++) {
          var t = s / 64, ang = theta + t * TAU * 2.25, rr = start + t * (inner - start);
          var x = cx + Math.cos(ang) * rr, y = cy + Math.sin(ang) * rr * K;
          if (s) c.lineTo(x, y); else c.moveTo(x, y);
        }
        c.stroke();
      }
      // hub with a brass pin
      c.fillStyle = '#25091a';
      c.beginPath(); c.ellipse(cx, cy, R * 0.19, R * 0.19 * K, 0, 0, TAU); c.fill();
      c.fillStyle = '#FFD778';
      c.beginPath(); c.ellipse(cx, cy - 1.5, R * 0.07, R * 0.07 * K, 0, 0, TAU); c.fill();

      // nozzles (two, opposite)
      c.globalCompositeOperation = 'lighter';
      for (var j = 0; j < 2; j++) {
        var a = theta + j * Math.PI, nx = cx + Math.cos(a) * R, ny = cy + Math.sin(a) * R * K - R * 0.06;
        var nr = f > 0.025 ? 6 + 26 * f : 5 + Math.sin(performance.now() / 260 + j) * 1.2;
        var ng = c.createRadialGradient(nx, ny, 0, nx, ny, nr);
        var a0 = f > 0.025 ? 0.9 : 0.55;
        ng.addColorStop(0, 'rgba(255,244,220,' + a0 + ')');
        ng.addColorStop(0.35, 'rgba(255,190,90,' + (a0 * 0.7).toFixed(2) + ')');
        ng.addColorStop(1, 'rgba(232,100,26,0)');
        c.fillStyle = ng; c.beginPath(); c.arc(nx, ny, nr, 0, TAU); c.fill();
        if (f <= 0.025) break; // unlit: only one smouldering fuse
      }
      c.globalCompositeOperation = 'source-over';
    }

    function drawTrails(f) {
      if (f < 0.02) return;
      var c = ctx, S = reduced() ? 6 : 16, len = Math.min(5.9, 0.2 + omega * 0.14), Rt = R * 1.03, j, i;
      c.globalCompositeOperation = 'lighter';
      c.lineCap = 'round';
      for (j = 0; j < 2; j++) {
        var head = theta + j * Math.PI, col = j ? '255,128,226' : '255,204,112';
        for (i = 0; i < S; i++) {
          var a0 = head - len + len * i / S, t = (i + 1) / S;
          c.strokeStyle = 'rgba(' + col + ',' + (t * t * (0.12 + 0.78 * f)).toFixed(3) + ')';
          c.lineWidth = 1.4 + 4.5 * f * t;
          c.beginPath(); c.ellipse(cx, cy - R * 0.05, Rt, Rt * K, 0, a0, a0 + len / S + 0.025); c.stroke();
        }
      }
      if (f > 0.38) {
        var h = (f - 0.38) / 0.62;
        var rings = [[1.55, '255,215,120', 0.22], [2.15, '219,89,200', 0.14], [2.8, '255,159,50', 0.08]];
        for (i = 0; i < rings.length; i++) {
          var rr = R * rings[i][0] * (1 + 0.04 * Math.sin(theta * 3 + i));
          c.strokeStyle = 'rgba(' + rings[i][1] + ',' + (h * rings[i][2]).toFixed(3) + ')';
          c.lineWidth = 6 + 10 * h;
          c.beginPath(); c.ellipse(cx, cy - R * 0.08, rr, rr * K, 0, 0, TAU); c.stroke();
        }
      }
      c.globalCompositeOperation = 'source-over';
    }

    function drawSparks() {
      if (!sparks.length) return;
      var c = ctx;
      c.globalCompositeOperation = 'lighter';
      c.lineCap = 'round';
      for (var i = 0; i < sparks.length; i++) {
        var s = sparks[i], t = s.life / s.max;
        var x = cx + s.x, y = cy + s.z * K - s.y;
        var tx = x - s.vx * 0.028, ty = y - (s.vz * K - s.vy) * 0.028;
        c.globalAlpha = Math.min(1, t * 1.3);
        c.strokeStyle = s.c;
        c.lineWidth = s.w * (0.5 + t);
        c.beginPath(); c.moveTo(tx, ty); c.lineTo(x, y); c.stroke();
      }
      c.globalAlpha = 1;
      c.globalCompositeOperation = 'source-over';
    }

    /* ---------- loop control ---------- */
    function shouldRun() {
      return inView && !document.hidden && (holding || omega > 0.04 || sparks.length > 0 || shock > 0 || flash > 0 || scrSettle > 0 ||
        Math.abs(needleA - omega / MAXW) > 0.002 || Math.abs(needleV) > 0.01);
    }
    function frame(now) {
      raf = 0;
      var dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;
      update(dt, now);
      if (!holding && omega <= 0.04 && !sparks.length) omega = 0;
      render();
      if (shouldRun()) raf = requestAnimationFrame(frame);
      else { needleA = omega / MAXW; needleV = 0; updateUI(omega / MAXW, now + 1000); hissSync(0); placeEmbers(); }
    }
    function kick() {
      if (raf || !mounted || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    return {
      mount: function (stage) {
        if (mounted || !stage) return;
        build(stage);
        mounted = true;
        bindInput();
        if (window.ResizeObserver) new ResizeObserver(resize).observe(pit);
        else window.addEventListener('resize', resize);
        resize();
      },
      onEnter: function () {
        if (!mounted) return;
        inView = true;
        root.classList.remove('is-paused');
        resize();
        screenPos();
        render();
        kick();
      },
      onLeave: function () {
        if (!mounted) return;
        inView = false;
        ptrHeld = keyHeld = false;
        syncHold();
        stop();
        hissStop();
        sN = 0; // core fades the screen layer out and clears it
        root.classList.add('is-paused');
      }
    };
  }
})();
