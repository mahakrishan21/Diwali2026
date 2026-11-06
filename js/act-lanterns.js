/* E2M Diwali - Activity 05: Lantern Pop Challenge
   30-second round in the sky corridor. Seven hand-drawn SVG lantern designs
   (rasterised once to canvas sprites), per-type pop effects, golden bonus,
   mystery surprises, a soot dud to avoid, chain multiplier, best score.
   Also exposes E2M.releaseLanterns(n?) for the finale. */
(function () {
  'use strict';

  var KEY = 'lanterns';
  var TAU = Math.PI * 2;
  var DURATION = 30;
  var SCRIPT_SRC = (document.currentScript && document.currentScript.src) || '';

  function E() { return window.E2M || {}; }
  function isReduced() { return !!E().reduced; }
  function isMobile() { return !!E().mobile; }
  function maxP() { return E().maxParticles || 600; }
  function sfx(n, o) { try { var a = E().audio; if (a && a.play) a.play(n, o); } catch (e) { /* no-op */ } }
  /* Revision 2 — immersion + accessibility hooks (all guarded: core.js may be older) */
  function impact(p, o) { try { var A = E(); if (typeof A.impact === 'function') A.impact(p, o || {}); } catch (e) { /* decorative */ } }
  /* Revision 4 — haptics + translate-only shake (core gates both by prefs / Calm / pause / reduced motion) */
  function haptic(n, p) { try { var A = E(); if (typeof A.haptic === 'function') A.haptic(n, p); } catch (e) { /* decorative */ } }
  function shake(px, ms, o) { try { var A = E(); if (typeof A.shake === 'function') A.shake(px, ms, o); } catch (e) { /* decorative */ } }
  function sr(msg, assertive) { try { var A = E(); if (typeof A.announce === 'function') { A.announce(msg, { assertive: !!assertive }); return true; } } catch (e) { /* fall back */ } return false; }
  function isPausedPref() { try { var A = E(); return A.isPaused ? !!A.isPaused() : false; } catch (e) { return false; } }
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

  /* ---------------- lantern designs (SVG, viewBox 0 0 100 160) ---------------- */
  var G = '#FFD778';
  var SVGS = {
    kandil:
      '<defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFC46B"/><stop offset="1" stop-color="#E8641A"/></linearGradient>' +
      '<linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F48BDF"/><stop offset="1" stop-color="#A3329A"/></linearGradient></defs>' +
      '<path d="M50 0V18" stroke="' + G + '" stroke-width="1.5"/>' +
      '<g stroke="' + G + '" stroke-width="1.3" stroke-linejoin="round"><path d="M50 18L70 52H30Z" fill="url(#b)"/><path d="M30 52L5 70L30 88Z" fill="url(#b)"/><path d="M70 52L95 70L70 88Z" fill="url(#b)"/><path d="M30 52H70V88H30Z" fill="url(#a)"/><path d="M30 88H70L50 118Z" fill="url(#b)"/></g>' +
      '<path d="M50 57C57 64 57 76 50 83C43 76 43 64 50 57Z" fill="#FFF4DC" opacity=".9"/><circle cx="50" cy="70" r="3" fill="#E8641A"/>' +
      '<path d="M50 30L56 44H44Z M17 70L28 64V76Z M83 70L72 64V76Z" fill="#FFF4DC" opacity=".5"/>' +
      '<g stroke-linecap="round" fill="none"><path d="M50 118V157" stroke="#DB59C8" stroke-width="3"/><path d="M45 112L39 152" stroke="#FF9F32" stroke-width="2.4"/><path d="M55 112L61 152" stroke="#FF9F32" stroke-width="2.4"/><path d="M39 103L28 140" stroke="' + G + '" stroke-width="2"/><path d="M61 103L72 140" stroke="' + G + '" stroke-width="2"/><path d="M5 70V98M95 70V98" stroke="' + G + '" stroke-width="1.5"/></g>',
    jaali:
      '<defs><linearGradient id="br" x1="0" x2="1"><stop offset="0" stop-color="#6E4A12"/><stop offset=".45" stop-color="#E8B24A"/><stop offset=".6" stop-color="#FFE19A"/><stop offset="1" stop-color="#7A5214"/></linearGradient>' +
      '<radialGradient id="lt" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#FFF8DA"/><stop offset="1" stop-color="#FFAA30"/></radialGradient></defs>' +
      '<path d="M50 0V12" stroke="' + G + '" stroke-width="1.5"/><circle cx="50" cy="14" r="3.2" fill="url(#br)"/>' +
      '<path d="M50 17C58 24 75 30 75 45H25C25 30 42 24 50 17Z" fill="url(#br)"/><rect x="21" y="45" width="58" height="5" fill="url(#br)"/>' +
      '<path d="M26 50H74L70 104H30Z" fill="url(#lt)"/>' +
      '<path fill="#5A3A0E" fill-rule="evenodd" d="M26 50H74L70 104H30Z M33 57Q33 53 38 53Q43 53 43 57V98H33Z M45 57Q45 53 50 53Q55 53 55 57V98H45Z M57 57Q57 53 62 53Q67 53 67 57V98H57Z"/>' +
      '<g fill="#5A3A0E"><path d="M38 62l3 5-3 5-3-5z M38 76l3 5-3 5-3-5z M38 90l3 4-3 4-3-4z M50 62l3 5-3 5-3-5z M50 76l3 5-3 5-3-5z M50 90l3 4-3 4-3-4z M62 62l3 5-3 5-3-5z M62 76l3 5-3 5-3-5z M62 90l3 4-3 4-3-4z"/></g>' +
      '<rect x="27" y="104" width="46" height="5" fill="url(#br)"/><path d="M30 109H70L60 122H40Z" fill="url(#br)"/>' +
      '<path d="M50 122V140" stroke="#E8B24A" stroke-width="2"/><path d="M50 140l5 6-5 8-5-8z" fill="url(#br)"/>',
    globe:
      '<defs><radialGradient id="g" cx=".42" cy=".4" r=".66"><stop offset="0" stop-color="#FFC9F2"/><stop offset=".45" stop-color="#E067C9"/><stop offset="1" stop-color="#7E1F78"/></radialGradient></defs>' +
      '<path d="M50 0V22" stroke="' + G + '" stroke-width="1.5"/><rect x="38" y="22" width="24" height="8" fill="' + G + '"/>' +
      '<ellipse cx="50" cy="72" rx="38" ry="44" fill="url(#g)"/>' +
      '<g fill="none" stroke="#8E2486" stroke-opacity=".55" stroke-width="1.3"><path d="M50 28C31 40 31 104 50 116"/><path d="M50 28C69 40 69 104 50 116"/><path d="M50 28C15 44 15 100 50 116"/><path d="M50 28C85 44 85 100 50 116"/><path d="M50 28V116"/><path d="M15 58Q50 66 85 58"/><path d="M12 74Q50 82 88 74"/><path d="M15 91Q50 98 85 91"/></g>' +
      '<ellipse cx="38" cy="54" rx="9" ry="14" fill="#fff" opacity=".22" transform="rotate(-20 38 54)"/>' +
      '<rect x="40" y="112" width="20" height="7" fill="' + G + '"/><path d="M50 119V146" stroke="#FF9F32" stroke-width="3"/><path d="M44 156L50 140L56 156Z" fill="#FF9F32"/>',
    drum:
      '<defs><linearGradient id="d" x1="0" x2="1"><stop offset="0" stop-color="#2E1260"/><stop offset=".5" stop-color="#8E4BD8"/><stop offset="1" stop-color="#2E1260"/></linearGradient></defs>' +
      '<path d="M50 0V24" stroke="' + G + '" stroke-width="1.5"/><path d="M28 32Q50 20 72 32V37H28Z" fill="' + G + '"/>' +
      '<rect x="28" y="37" width="44" height="63" fill="url(#d)"/><rect x="28" y="41" width="44" height="3" fill="' + G + '"/><rect x="28" y="93" width="44" height="3" fill="' + G + '"/>' +
      '<path d="M50 52C56 60 56 71 50 80C44 71 44 60 50 52Z" fill="#FF9F32"/><path d="M50 80C41 78 35 71 33 62C41 64 46 70 50 80Z" fill="#DB59C8"/><path d="M50 80C59 78 65 71 67 62C59 64 54 70 50 80Z" fill="#DB59C8"/>' +
      '<g fill="' + G + '"><circle cx="34" cy="86" r="1.8"/><circle cx="42" cy="86" r="1.8"/><circle cx="50" cy="86" r="1.8"/><circle cx="58" cy="86" r="1.8"/><circle cx="66" cy="86" r="1.8"/></g>' +
      '<path d="M28 100H72Q50 109 28 100Z" fill="' + G + '"/>' +
      '<g stroke-width="2" stroke-linecap="round"><path d="M32 103V128M40 105V134M48 106V138M56 105V134M64 103V128" stroke="#FF9F32"/><path d="M36 104V131M44 106V136M52 106V137M60 104V131M68 102V124" stroke="#DB59C8"/></g>',
    golden:
      '<defs><linearGradient id="gl" x1="0" x2="1"><stop offset="0" stop-color="#B8862E"/><stop offset=".5" stop-color="#FFF1C4"/><stop offset="1" stop-color="#C9932F"/></linearGradient>' +
      '<radialGradient id="gc" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#FFE7A3"/><stop offset="1" stop-color="#FFC94A"/></radialGradient></defs>' +
      '<path d="M50 0V16" stroke="' + G + '" stroke-width="1.5"/><path d="M50 12l4 6-4 4-4-4z" fill="url(#gl)"/>' +
      '<path d="M50 22L78 50L72 100L50 124L28 100L22 50Z" fill="url(#gl)" stroke="#FFF4DC" stroke-width="1"/>' +
      '<path d="M50 22V124M22 50H78M28 100H72M50 22L36 50L50 124L64 50Z" stroke="#9C6A16" stroke-opacity=".45" fill="none"/>' +
      '<path d="M50 46C60 58 60 82 50 96C40 82 40 58 50 46Z" fill="url(#gc)"/>' +
      '<g fill="#FFF8DC"><path d="M84 30Q84 36 90 36Q84 36 84 42Q84 36 78 36Q84 36 84 30Z"/><path d="M14 80Q14 85 19 85Q14 85 14 90Q14 85 9 85Q14 85 14 80Z"/><path d="M86 104Q86 108 90 108Q86 108 86 112Q86 108 82 108Q86 108 86 104Z"/></g>' +
      '<path d="M50 124V146" stroke="' + G + '" stroke-width="2.5"/><path d="M45 156L50 142L55 156Z" fill="' + G + '"/>',
    mystery:
      '<defs><linearGradient id="m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6FE8E0"/><stop offset="1" stop-color="#127F86"/></linearGradient></defs>' +
      '<path d="M50 0V18" stroke="' + G + '" stroke-width="1.5"/>' +
      '<path d="M24 38Q24 30 32 30H68Q76 30 76 38V104Q76 112 68 112H32Q24 112 24 104Z" fill="url(#m)"/>' +
      '<g stroke="#FFF4DC" stroke-opacity=".18" stroke-width="5"><path d="M24 50L46 30M24 74L68 30M30 112L76 66M54 112L76 90"/></g>' +
      '<rect x="45" y="30" width="10" height="82" fill="' + G + '"/><rect x="24" y="66" width="52" height="10" fill="' + G + '"/>' +
      '<path d="M50 30C40 15 28 21 36 31Z M50 30C60 15 72 21 64 31Z" fill="#FF9F32" stroke="' + G + '" stroke-width="1.5"/>' +
      '<circle cx="50" cy="71" r="14" fill="#241044" stroke="' + G + '" stroke-width="2"/>' +
      '<text x="50" y="78.5" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="21" fill="' + G + '">?</text>' +
      '<path d="M50 112V146" stroke="#FF9F32" stroke-width="3"/><path d="M44 156L50 140L56 156Z" fill="#DB59C8"/>',
    soot:
      '<defs><radialGradient id="s" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#6E655B"/><stop offset="1" stop-color="#26221F"/></radialGradient></defs>' +
      '<path d="M53 13C45 8 59 4 52 -2" stroke="#9a9a9a" stroke-opacity=".55" fill="none" stroke-width="2.5"/>' +
      '<path d="M50 36Q57 28 53 20" stroke="#3a2a20" stroke-width="2.5" fill="none"/><circle cx="53" cy="19" r="3.6" fill="#FF4A2A"/><circle cx="53" cy="19" r="1.6" fill="#FFD778"/>' +
      '<ellipse cx="50" cy="74" rx="33" ry="39" fill="url(#s)"/>' +
      '<g fill="#141110" opacity=".55"><circle cx="34" cy="60" r="7"/><circle cx="66" cy="92" r="9"/><circle cx="60" cy="52" r="4"/></g>' +
      '<path d="M38 44L44 56L38 64L46 76" stroke="#141110" stroke-width="2" fill="none"/>' +
      '<g stroke="#FFF4DC" stroke-opacity=".7" stroke-width="2.2" fill="none" stroke-linecap="round"><path d="M38 76Q42 79 46 76"/><path d="M54 76Q58 79 62 76"/><path d="M42 92Q46 88 50 92Q54 96 58 92"/></g>' +
      '<text x="70" y="44" font-family="Georgia, serif" font-style="italic" font-size="11" fill="#FFF4DC" fill-opacity=".55">z</text><text x="77" y="36" font-family="Georgia, serif" font-style="italic" font-size="8" fill="#FFF4DC" fill-opacity=".45">z</text>' +
      '<rect x="42" y="111" width="16" height="5" fill="#3a332e"/>'
  };
  var TYPES = {
    kandil: { pts: 10, w: 26, body: 0.44, col: ['#FF9F32', '#DB59C8', '#FFD778'], label: 'Star kandil' },
    jaali: { pts: 15, w: 18, body: 0.48, col: ['#FFD778', '#E8B24A', '#FFF1C4'], label: 'Brass jaali' },
    globe: { pts: 10, w: 22, body: 0.45, col: ['#E067C9', '#FFC9F2', '#FFD778'], label: 'Paper globe' },
    drum: { pts: 10, w: 18, body: 0.43, col: ['#8E4BD8', '#FF9F32', '#DB59C8'], label: 'Fringe drum' },
    golden: { pts: 50, w: 4, body: 0.46, col: ['#FFD778', '#FFF1C4', '#FFFFFF'], label: 'Golden lantern' },
    mystery: { pts: 25, w: 6, body: 0.44, col: ['#6FE8E0', '#FFD778', '#FF9F32'], label: 'Mystery box' },
    soot: { pts: -15, w: 0, body: 0.46, col: ['#6E655B', '#3a332e', '#9a9a9a'], label: 'Soot dud' }
  };
  var ORDER = ['kandil', 'jaali', 'globe', 'drum', 'golden', 'mystery', 'soot'];

  var JOKES = [
    'A single sock. Happy Diwali?', 'Your manager’s approval for leave. Rare drop!',
    '47 WhatsApp forwards. Good morning to you too.', 'A note: “Clean your room, guests at 7.” — Mom',
    'One (1) kaju katli. Already half eaten.', 'The Wi-Fi password. Finally.'
  ];
  var TIERS = [
    { min: 0, title: 'Lantern Lightweight', line: 'The lanterns filed a complaint: “unbothered.”' },
    { min: 120, title: 'Sky Sweeper', line: 'Solid. The sky is noticeably tidier.' },
    { min: 260, title: 'Kandil Commander', line: 'Lanterns now salute you on the way up.' },
    { min: 450, title: 'Lord of the Lanterns', line: 'NASA called. They want their sky back.' }
  ];

  /* ---------------- sprites (shared by the game and the finale) ---------------- */
  var SPR = {}, sprPromise = null, glowSprite = null;
  var SPR_W = 200, SPR_H = 320;
  function loadSprites() {
    if (sprPromise) return sprPromise;
    sprPromise = Promise.all(ORDER.map(function (k) {
      return new Promise(function (res) {
        var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -4 100 164" width="' + SPR_W + '" height="' + SPR_H + '">' + SVGS[k] + '</svg>';
        var img = new Image();
        img.onload = function () {
          var cv = document.createElement('canvas'); cv.width = SPR_W; cv.height = SPR_H;
          try { cv.getContext('2d').drawImage(img, 0, 0, SPR_W, SPR_H); } catch (e) { /* ignore */ }
          SPR[k] = cv; res();
        };
        img.onerror = function () { res(); };
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      });
    })).then(function () {
      var g = document.createElement('canvas'); g.width = g.height = 128;
      var c = g.getContext('2d'), rg = c.createRadialGradient(64, 64, 0, 64, 64, 64);
      rg.addColorStop(0, 'rgba(255,214,140,0.85)'); rg.addColorStop(0.35, 'rgba(255,170,70,0.32)'); rg.addColorStop(1, 'rgba(255,150,50,0)');
      c.fillStyle = rg; c.fillRect(0, 0, 128, 128);
      glowSprite = g;
    });
    return sprPromise;
  }

  function drawLantern(c, L, now, alpha) {
    var spr = SPR[L.type]; if (!spr) return;
    var w = L.w, h = L.w * 1.64;
    var bodyY = L.y + h * (TYPES[L.type].body - 0.5);
    if (glowSprite && L.type !== 'soot') {
      var fl = isReduced() ? 0.5 : 0.42 + 0.14 * Math.sin(now * 9 + L.ph * 3) + 0.06 * Math.sin(now * 23 + L.ph);
      var gs = w * (L.type === 'golden' ? 3.2 : 2.3);
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = fl * (alpha == null ? 1 : alpha) * (L.type === 'golden' ? 1.2 : 1);
      c.drawImage(glowSprite, L.x - gs / 2, bodyY - gs / 2, gs, gs);
      c.globalCompositeOperation = 'source-over';
    }
    c.globalAlpha = alpha == null ? 1 : alpha;
    c.save(); c.translate(L.x, L.y); c.rotate(L.rot || 0);
    c.drawImage(spr, -w / 2, -h / 2, w, h);
    c.restore();
    c.globalAlpha = 1;
  }

  function plateSVG() {
    return '<svg class="act-plate" viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M3 57 V22 Q3 15 10 14 L78 11 Q91 10 96 4 L100 1.5 L104 4 Q109 10 122 11 L190 14 Q197 15 197 22 V57 Z"/></svg>';
  }

  function paintSky(cv, W, H, dpr) {
    cv.width = Math.ceil(W * dpr); cv.height = Math.ceil(H * dpr);
    var c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Revision 4: no sky fill — the continuous deep-space backdrop (stars + nebula) shows through the window;
    // only a warm horizon glow, a few near stars and the temple town are painted here, then feathered out
    c.clearRect(0, 0, W, H);
    var hz = c.createRadialGradient(W / 2, H * 1.05, 0, W / 2, H * 1.05, H * 0.8);
    hz.addColorStop(0, 'rgba(255,215,120,0.07)'); hz.addColorStop(1, 'rgba(255,215,120,0)');
    c.fillStyle = hz; c.fillRect(0, 0, W, H);
    var n = Math.round(W * H / 16000);
    for (var i = 0; i < n; i++) {
      c.fillStyle = 'rgba(255,244,220,' + (0.08 + Math.random() * 0.3).toFixed(2) + ')';
      var s = Math.random() < 0.9 ? 1 : 1.8;
      c.fillRect(Math.random() * W, Math.random() * H * 0.85, s, s);
    }
    // Revision 3: a distant Hindu temple town — nagara shikharas (curvilinear tower, amalaka, kalasha, dhvaja),
    // stepped Dravidian gopurams with a kalasha row, flat-roofed mandapas and lit deepmala lamp towers.
    // Whole buildings only: the widths are stretched to land exactly on the right edge, so nothing is sliced.
    var lamps = paintTempleTown(c, W, H);
    // R4 feather: the town dissolves into the space backdrop at both sides and at the floor line, so the window
    // never ends in a hard silhouette cut at any width (the lamps are faded to match in draw())
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = 'destination-in';
    var fw = Math.min(0.18, 170 / W), fg = c.createLinearGradient(0, 0, cv.width, 0);
    fg.addColorStop(0, 'rgba(0,0,0,0)'); fg.addColorStop(fw, 'rgba(0,0,0,1)'); fg.addColorStop(1 - fw, 'rgba(0,0,0,1)'); fg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = fg; c.fillRect(0, 0, cv.width, cv.height);
    var vg = c.createLinearGradient(0, 0, 0, cv.height);
    vg.addColorStop(0, 'rgba(0,0,0,1)'); vg.addColorStop(0.86, 'rgba(0,0,0,1)'); vg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = vg; c.fillRect(0, 0, cv.width, cv.height);
    c.globalCompositeOperation = 'source-over';
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (var li = 0; li < lamps.length; li++) { var lx = lamps[li].x; lamps[li].k = Math.max(0, Math.min(1, Math.min(lx, W - lx) / (fw * W))); }
    return lamps;
  }

  /* ---------- temple-town silhouette (fill + faint gold rim), returns the deepmala lamp points ---------- */
  function lcg(s) { return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function paintTempleTown(c, W, H) {
    var R = lcg(20261105), lamps = [], widths = [], kinds = [], tw = 0, seq = ['mandapa', 'shikhara', 'mandapa', 'deepmala', 'gopuram', 'mandapa', 'shikhara', 'deepmala'];
    var i = 0;
    while (tw < W) {
      var kind = seq[(i + ((R() * 3) | 0)) % seq.length];
      if (kinds.length && kinds[kinds.length - 1] === kind) kind = kind === 'mandapa' ? 'shikhara' : 'mandapa';
      var bw0 = kind === 'deepmala' ? 26 + R() * 12 : kind === 'mandapa' ? 50 + R() * 40 : 56 + R() * 40;
      widths.push(bw0); kinds.push(kind); tw += bw0; i++;
    }
    var k = W / tw, x = 0, base = H - Math.max(10, H * 0.035);
    c.fillStyle = '#070918';
    c.fillRect(0, base, W, H - base);
    for (i = 0; i < widths.length; i++) {
      var bw = widths[i] * k, cx = x + bw / 2, y0 = base;
      c.beginPath();
      if (kinds[i] === 'shikhara') {
        var bodyW = bw * 0.62, bodyH = bw * 0.2, th = bw * (0.95 + R() * 0.45), neck = bw * 0.1, yb = y0 - 4 - bodyH, yt = yb - th;
        c.rect(x + bw * 0.06, y0 - 4, bw * 0.88, 4);                      // jagati (platform)
        c.rect(cx - bodyW / 2, yb, bodyW, bodyH);                          // garbhagriha wall
        // curvilinear tower: swells, then curves in to the neck under the amalaka
        c.moveTo(cx - bodyW * 0.46, yb);
        c.bezierCurveTo(cx - bodyW * 0.5, yb - th * 0.5, cx - neck * 1.6, yt + th * 0.16, cx - neck, yt);
        c.lineTo(cx + neck, yt);
        c.bezierCurveTo(cx + neck * 1.6, yt + th * 0.16, cx + bodyW * 0.5, yb - th * 0.5, cx + bodyW * 0.46, yb);
        c.closePath();
        // two smaller attached spires (urushringas) at the shoulders
        for (var sd = -1; sd <= 1; sd += 2) {
          var sx = cx + sd * bodyW * 0.36, sh = th * 0.42, sw = bodyW * 0.2;
          c.moveTo(sx - sw, yb); c.quadraticCurveTo(sx - sw, yb - sh * 0.7, sx, yb - sh); c.quadraticCurveTo(sx + sw, yb - sh * 0.7, sx + sw, yb); c.closePath();
        }
        c.moveTo(cx + neck * 2.1, yt - neck * 0.35); c.ellipse(cx, yt - neck * 0.35, neck * 2.1, neck * 0.6, 0, 0, TAU);   // amalaka
        c.moveTo(cx + neck * 0.7, yt - neck * 1.5); c.arc(cx, yt - neck * 1.5, neck * 0.7, 0, TAU);                         // kalasha
        c.rect(cx - 0.6, yt - neck * 1.5 - th * 0.3, 1.2, th * 0.3);                                                       // dhvaja pole
        c.moveTo(cx + 0.6, yt - neck * 1.5 - th * 0.3); c.lineTo(cx + 0.6 + bw * 0.16, yt - neck * 1.5 - th * 0.25); c.lineTo(cx + 0.6, yt - neck * 1.5 - th * 0.2); c.closePath();
      } else if (kinds[i] === 'gopuram') {
        var tiers = 4 + ((R() * 3) | 0), gw = bw * 0.86, gh = bw * 0.24, ty = y0 - gh, tH = bw * 0.1;
        c.rect(cx - gw / 2, ty, gw, gh);                                     // gateway block
        for (var t = 0; t < tiers; t++) {
          var tw2 = gw * (0.9 - 0.52 * (t + 1) / tiers);
          c.rect(cx - tw2 / 2, ty - tH, tw2, tH);
          c.rect(cx - tw2 / 2 - 1.5, ty - 2, tw2 + 3, 2);                   // tier cornice
          ty -= tH;
        }
        var sw2 = gw * 0.38, sh2 = bw * 0.09;                               // shala (barrel-vault) crown
        c.moveTo(cx - sw2 / 2, ty); c.lineTo(cx - sw2 / 2, ty - sh2 * 0.5); c.quadraticCurveTo(cx, ty - sh2 * 1.6, cx + sw2 / 2, ty - sh2 * 0.5); c.lineTo(cx + sw2 / 2, ty); c.closePath();
        for (var kc = 0; kc < 5; kc++) {                                    // kalasha row
          var kx = cx - sw2 * 0.4 + kc * sw2 * 0.2, ky = ty - sh2 * (kc === 2 ? 1.25 : 1.05);
          c.moveTo(kx + 1.8, ky); c.arc(kx, ky, 1.8, 0, TAU); c.rect(kx - 0.5, ky - 5, 1, 4);
        }
      } else if (kinds[i] === 'deepmala') {
        var cw = Math.max(4, bw * 0.16), ch = bw * (2.1 + R() * 0.8), top = y0 - ch, ledge = bw * 0.5;
        c.rect(x + bw * 0.1, y0 - 5, bw * 0.8, 5);                          // plinth
        c.rect(cx - cw / 2, top, cw, ch);                                    // stambha
        for (var ly = y0 - 12; ly > top + 6; ly -= 9) {
          var lw = ledge * (0.6 + 0.4 * (ly - top) / ch);
          c.rect(cx - lw / 2, ly, lw, 2);
          lamps.push({ x: cx - lw / 2 + 1, y: ly - 1.5, s: R() * 6 }); lamps.push({ x: cx + lw / 2 - 1, y: ly - 1.5, s: R() * 6 });
        }
        c.moveTo(cx + cw * 0.7, top - 2); c.arc(cx, top - 2, cw * 0.7, 0, TAU); c.rect(cx - 0.5, top - 2 - cw * 1.6, 1, cw);   // kalasha
      } else { // mandapa: pillared hall with a flat roof slab, a stepped (phamsana) roof and a parapet of finials
        var mh = bw * (0.22 + R() * 0.1), mw = bw * 0.84, roofY = y0 - mh;
        c.rect(cx - mw / 2, roofY, mw, mh);
        c.rect(x + bw * 0.04, roofY - 3, bw * 0.92, 3);                     // roof slab (chhajja)
        if (R() < 0.5) {
          var sy = roofY - 3;
          for (var st = 0; st < 3; st++) { var swd = mw * (0.62 - st * 0.17); c.rect(cx - swd / 2, sy - 5, swd, 5); sy -= 5; }
          c.moveTo(cx + 2.2, sy - 2); c.arc(cx, sy - 2, 2.2, 0, TAU);
        } else for (var fp = 0; fp < 4; fp++) { var fx2 = x + bw * (0.14 + fp * 0.24); c.moveTo(fx2 + 1.6, roofY - 5); c.arc(fx2, roofY - 5, 1.6, 0, TAU); }
      }
      c.fill();
      c.strokeStyle = 'rgba(255,215,120,0.07)'; c.lineWidth = 0.8; c.stroke();
      // mandapa pillars read as dark gaps of the night sky between the columns
      if (kinds[i] === 'mandapa') {
        c.fillStyle = 'rgba(18,16,58,0.7)';
        var gaps = 3, mw2 = bw * 0.84, gy = y0 - bw * 0.2;
        for (var g = 0; g < gaps; g++) c.fillRect(cx - mw2 / 2 + mw2 * (0.12 + g * 0.29), gy + 3, mw2 * 0.16, y0 - gy - 6);
        c.fillStyle = '#070918';
      }
      x += bw;
    }
    return lamps;
  }
  function paintFront(cv, W, H, dpr) {
    cv.width = Math.ceil(W * dpr); cv.height = Math.ceil(H * dpr);
    var c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, W, H);
    // corridor walls: dark piers with a single gold edge and hairline jharokha outlines
    var ww = clamp(W * 0.06, 18, 70);
    [0, 1].forEach(function (side) {
      c.save(); if (side) { c.translate(W, 0); c.scale(-1, 1); }
      // R4: the piers are translucent deep-space columns that fade in from the outer edge and out at the floor,
      // with one gold hairline that dissolves at both ends (no opaque wall, no hard edge)
      var wg = c.createLinearGradient(0, 0, ww, 0);
      wg.addColorStop(0, 'rgba(5,7,15,0)'); wg.addColorStop(1, 'rgba(8,11,30,0.5)');
      c.fillStyle = wg; c.fillRect(0, 0, ww, H);
      var eg = c.createLinearGradient(0, 0, 0, H);
      eg.addColorStop(0, 'rgba(255,215,120,0.08)'); eg.addColorStop(0.3, 'rgba(255,215,120,0.24)'); eg.addColorStop(0.75, 'rgba(255,215,120,0.18)'); eg.addColorStop(1, 'rgba(255,215,120,0)');
      c.fillStyle = eg; c.fillRect(ww - 1, 0, 1, H);
      if (ww > 30) {
        // Revision 3: haveli jharokhas (projecting balconies) — a stepped pediment, a flat sloping chhajja,
        // a rectangular opening and a ledge on two brackets. No arches, no cusps.
        c.strokeStyle = 'rgba(255,215,120,0.14)'; c.lineWidth = 1;
        var l = ww * 0.2, r = ww * 0.88, m = (l + r) / 2;
        for (var y = H * 0.22; y < H - 60; y += 190) {
          c.beginPath();
          c.moveTo(m - ww * 0.12, y - 8); c.lineTo(m - ww * 0.12, y - 12); c.lineTo(m - ww * 0.05, y - 12); c.lineTo(m - ww * 0.05, y - 16);
          c.lineTo(m + ww * 0.05, y - 16); c.lineTo(m + ww * 0.05, y - 12); c.lineTo(m + ww * 0.12, y - 12); c.lineTo(m + ww * 0.12, y - 8);
          c.moveTo(l - 2, y - 2); c.lineTo(l + 3, y - 8); c.lineTo(r - 3, y - 8); c.lineTo(r + 2, y - 2); c.lineTo(l - 2, y - 2);
          c.rect(l + 3, y + 2, r - l - 6, 36);
          c.moveTo(l + ww * 0.17, y + 2); c.lineTo(l + ww * 0.17, y + 38); c.moveTo(r - ww * 0.17, y + 2); c.lineTo(r - ww * 0.17, y + 38);
          c.rect(l - 1, y + 38, r - l + 2, 4);
          c.moveTo(l + 4, y + 42); c.lineTo(l + 9, y + 50); c.lineTo(l + 9, y + 42); c.moveTo(r - 4, y + 42); c.lineTo(r - 9, y + 50); c.lineTo(r - 9, y + 42);
          c.stroke();
        }
      }
      c.restore();
    });
    // (the garland across the top is drawn live so it can sway in the corridor breeze)
  }

  /* ======================================================================= */
  var game = null;

  function mount(stage) {
    if (game) return;
    var root = document.createElement('div');
    root.className = 'act-lanterns';
    var legend = ORDER.map(function (k) {
      var p = TYPES[k].pts;
      return '<li class="' + (k === 'soot' ? 'is-bad' : k === 'golden' ? 'is-gold' : '') + '"><span class="an-thumb" data-thumb="' + k + '" aria-hidden="true"></span><span>' + TYPES[k].label + '</span><b>' + (k === 'mystery' ? '?' : (p > 0 ? '+' + p : '−' + Math.abs(p))) + '</b></li>';
    }).join('');
    var uid = 'an' + Math.random().toString(36).slice(2, 7);
    root.innerHTML =
      '<p class="act-hint" data-hint>Tap lanterns to pop them · <span aria-hidden="true">← →</span><span class="an-sr">arrow keys</span> to aim, Space to pop · P pauses</p>' +
      '<div class="an-frame">' +
        '<div class="an-arena">' +
          '<canvas class="an-canvas" tabindex="0" role="application" aria-roledescription="game" aria-label="Lantern Pop" aria-describedby="' + uid + '-desc"></canvas>' +
          '<p class="an-sr" id="' + uid + '-desc">A thirty second game in a night sky. Lanterns float up from the bottom; click or tap them to pop them. Keyboard: the arrow keys pick a lantern, Space or Enter pops it. Avoid the grey soot lantern. Mystery lanterns hold surprises. Press P or Escape to pause.</p>' +
          '<div class="an-hud" aria-hidden="true">' +
            '<div class="an-score"><span>Score</span><b data-score>0</b></div>' +
            '<div class="an-chain" data-chain>Chain x1</div>' +
            '<div class="an-timer" data-timer><span>Time</span><b data-time>30</b><svg viewBox="0 0 56 56"><circle class="an-t-bg" cx="28" cy="28" r="23"/><circle class="an-t-fg" cx="28" cy="28" r="23" data-ring/></svg></div>' +
          '</div>' +
          '<button type="button" class="btn-tilak an-pausebtn" data-pause aria-label="Pause the game (P)"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 6.5v11M15 6.5v11"/></svg></button>' +
          '<div class="an-banner" data-banner aria-hidden="true"><p class="an-banner-k" data-bk></p><p class="an-banner-t" data-bt></p></div>' +
          '<div class="an-screen" data-screen="start">' +
            '<div class="an-card">' +
              '<span class="an-stamp deva-stamp" lang="hi" aria-hidden="true">शुभ आरंभ</span>' +
              '<p class="an-kicker">Thirty seconds · infinite sky</p>' +
              '<h3 class="an-title">Pop the lanterns.<br><em>Spare the soot.</em></h3>' +
              '<ul class="an-legend">' + legend + '</ul>' +
              '<p class="an-controls">Tap to pop, or <kbd>←</kbd> <kbd>→</kbd> and <kbd>Space</kbd>. Pop fast to build a chain.</p>' +
              '<button type="button" class="btn-diya an-go" data-start><span>Light up the sky</span></button>' +
              '<p class="an-best">Sky record <b data-best>0</b></p>' +
              '<span class="an-warli" aria-hidden="true"></span>' +
            '</div>' +
          '</div>' +
          '<div class="an-screen" data-screen="pause" hidden><div class="an-card an-card--sm"><h3 class="an-title">Paused.</h3><p class="an-line">The lanterns are hovering politely.</p>' +
            '<button type="button" class="btn-diya an-go" data-resume><span>Resume</span></button>' +
            '<p class="an-pause-alt"><button type="button" class="btn-tilak btn-tilak--text" data-again><span>Start over</span></button></p></div></div>' +
          '<div class="an-screen" data-screen="over" hidden>' +
            '<div class="an-card">' +
              '<span class="an-stamp deva-stamp" lang="hi" aria-hidden="true">शुभ लाभ</span>' +
              '<p class="an-kicker" data-newbest hidden>New sky record!</p>' +
              '<p class="an-final"><b data-final>0</b><span>points</span></p>' +
              '<h3 class="an-title"><em data-tier></em></h3>' +
              '<p class="an-line" data-tierline></p>' +
              '<dl class="an-stats"><div><dt>Popped</dt><dd data-s-pop>0</dd></div><div><dt>Escaped</dt><dd data-s-esc>0</dd></div><div><dt>Best chain</dt><dd data-s-chain>0</dd></div><div><dt>Surprises</dt><dd data-s-sur>0</dd></div></dl>' +
              '<button type="button" class="btn-diya an-go" data-restart><span>Another round</span></button>' +
              '<p class="an-best">Sky record <b data-best>0</b></p>' +
              '<span class="an-warli" aria-hidden="true"></span>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<p class="an-sr" aria-live="polite" data-live></p>';
    stage.appendChild(root);

    var $ = function (s) { return root.querySelector(s); };
    var arena = $('.an-arena'), canvas = $('.an-canvas'), ctx = canvas.getContext('2d');
    var scr = { start: $('[data-screen=start]'), pause: $('[data-screen=pause]'), over: $('[data-screen=over]') };
    var ui = {
      score: $('[data-score]'), chain: $('[data-chain]'), time: $('[data-time]'), ring: $('[data-ring]'), timer: $('[data-timer]'),
      banner: $('[data-banner]'), bk: $('[data-bk]'), bt: $('[data-bt]'), live: $('[data-live]'),
      final: $('[data-final]'), tier: $('[data-tier]'), tierline: $('[data-tierline]'), newbest: $('[data-newbest]'),
      sp: $('[data-s-pop]'), se: $('[data-s-esc]'), sc: $('[data-s-chain]'), ss: $('[data-s-sur]')
    };
    var RING = 2 * Math.PI * 23;
    ui.ring.style.strokeDasharray = RING.toFixed(2);

    var W = 0, H = 0, dpr = 1, baseW = 60;
    var sky = document.createElement('canvas'), front = document.createElement('canvas');
    var lanterns = [], parts = [], pops = [], stars = [], lights = [];
    var hintEl = root.querySelector('[data-hint]'), pauseBtn = root.querySelector('[data-pause]');
    function hideHint() { if (hintEl) hintEl.classList.add('is-gone'); }
    var said10 = false, said5 = false;
    var S = { state: 'idle', elapsed: 0, bonus: 0, spawn: 0, score: 0, chain: 0, lastPop: -9, popped: 0, escaped: 0, maxChain: 0, surprises: 0, timeBonuses: 0, slow: 0, inView: false, target: null };
    var raf = 0, last = 0, attractT = 0, ready = false;
    // Revision 3: corridor breeze clock, the temple town's deepmala lamps (they flicker), full-screen effects
    var skyLamps = [], clock = 0;
    function lifeOn() { return !isReduced() && !isPausedPref(); }
    function breeze(t) { return 0.55 * Math.sin(t * 0.33) + 0.3 * Math.sin(t * 0.87 + 1.3) + 0.15 * Math.sin(t * 1.71 + 0.5); }
    var SFX = makeScreenFx('lanterns');

    /* R3.4 — every pop sends its light up the WHOLE screen: a soft column of light and embers that rise past
       the stage to the top of the viewport (light only inside the arena). */
    function lightRise(x, y, col, s) {
      var lvl = SFX.level(); if (!lvl) return;
      var p = SFX.spawn('wash', x, y, 0, -260 - 120 * s, 1.1 + 0.4 * s, 130 + 140 * s, col[0]);
      if (p) { p.a = (lvl < 0.5 ? 0.3 : 0.55) * (0.6 + 0.4 * s); p.drag = 0.99; }
      var n = Math.round((lvl < 0.5 ? 3 : 8 + 10 * s) * Math.min(lvl, 1.3));
      for (var i = 0; i < n; i++) {
        p = SFX.spawn('dot', x + rnd(-18, 18), y + rnd(-10, 10), rnd(-40, 40), -rnd(260, 620) * (lvl < 0.5 ? 0.5 : 1), rnd(1.2, 2.2), rnd(1.3, 2.4), col[i % col.length]);
        if (!p) break;
        p.drag = 0.992; p.g = -40; p.sway = rnd(8, 30); p.fl = 0.15;
      }
      SFX.glow(col[0], 0.18 + 0.22 * s, x, y);
    }
    /* R3.4 — the full-screen lantern sky: n small glowing kandils rise across the entire viewport at three depths,
       swaying and flickering, fading out as they near the top. Inside the arena they are mirrored dim and behind
       the game lanterns while a round runs (distant, never mistaken for targets); full strength between rounds. */
    var SKYT = ['kandil', 'kandil', 'globe', 'drum', 'jaali', 'golden'], skyVH = 800;
    function drawSkyLantern(c, p, a) {
      var d = p.data, spr = SPR[d.type]; if (!spr) return;
      var f = clamp(p.y / (skyVH * 0.32), 0, 1) * clamp((p.max - p.life) / 0.9, 0, 1); if (f <= 0) return;
      var w = d.w, h = w * 1.64, fl = 0.75 + 0.15 * Math.sin(p.ph * 4.1) + 0.1 * Math.sin(p.ph * 9.7 + d.z * 5);
      p.rot = Math.sin(p.ph * 0.9) * 0.07 + p.vx * 0.0015;
      if (glowSprite) {
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = a * f * (0.32 + 0.3 * d.z) * fl;
        var gs = w * 2.6; c.drawImage(glowSprite, -gs / 2, h * (TYPES[d.type].body - 0.5) - gs / 2, gs, gs);
        c.globalCompositeOperation = 'source-over';
      }
      c.globalAlpha = a * f * (0.42 + 0.55 * d.z);
      c.drawImage(spr, -w / 2, -h / 2, w, h);
    }
    function lanternSky(n) {
      var lvl = SFX.level(); if (!lvl || !ready) return;
      var l = SFX.layer(); if (!l) return;
      skyVH = l.h;
      var calm = lvl < 0.5, base = clamp(Math.min(l.w, l.h) * 0.045, 18, 40);
      n = Math.max(3, Math.round(n * (calm ? 0.35 : Math.min(lvl, 1.3))));
      for (var i = 0; i < n; i++) {
        // they appear across the lower screen (fading in) and from below it, so the sky fills within a breath
        var z = rnd(0.3, 1), vy = -(52 + 92 * z) * rnd(0.85, 1.15) * (calm ? 0.6 : 1), y = i % 3 ? rnd(l.h * 0.4, l.h * 1.02) : l.h + rnd(20, l.h * 0.4);
        var p = SFX.spawn('custom', rnd(0.03, 0.97) * l.w, y, rnd(-6, 6), vy, Math.min(14, (y + base * 3) / -vy + 0.5), base, '#FFD778');
        if (!p) break;
        p.sway = 6 + 14 * z; p.drag = 1; p.vr = 0; p.rot = 0;
        p.data = { type: SKYT[(Math.random() * SKYT.length) | 0], z: z, w: base * (0.55 + 0.75 * z) };
        p.draw = drawSkyLantern;
      }
      SFX.glow('#FFC46A', calm ? 0.25 : 0.45, l.w / 2, l.h * 0.85);
      loop();
    }

    loadSprites().then(function () {
      ready = true;
      root.querySelectorAll('[data-thumb]').forEach(function (el) {
        var k = el.getAttribute('data-thumb'), cv = SPR[k];
        if (!cv) return;
        var c = document.createElement('canvas'); c.width = 50; c.height = 80;
        c.getContext('2d').drawImage(cv, 0, 0, 50, 80);
        el.appendChild(c);
      });
      draw(); loop();
    });

    function resize() {
      var rc = arena.getBoundingClientRect();
      var nw = Math.round(rc.width), nh = Math.round(rc.height);
      if (!nw || !nh || (nw === W && nh === H)) return;
      var ow = W;
      W = nw; H = nh; dpr = Math.min(window.devicePixelRatio || 1, isMobile() ? 1.75 : 2);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      baseW = clamp(W * 0.065, 50, 82);
      if (ow) lanterns.forEach(function (L) { L.x0 *= W / ow; });
      skyLamps = paintSky(sky, W, H, dpr) || []; paintFront(front, W, H, dpr);
      stars = [];
      for (var i = 0; i < 28; i++) stars.push({ x: Math.random() * W, y: Math.random() * H * 0.7, ph: Math.random() * TAU, s: rnd(1, 2.2) });
      draw();
    }
    var ro = ('ResizeObserver' in window) ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(arena); else window.addEventListener('resize', resize);

    function show(name) {
      Object.keys(scr).forEach(function (k) { scr[k].hidden = k !== name; });
      root.classList.toggle('is-playing', S.state === 'playing');
    }
    function refreshBest() { var b = getBest(); root.querySelectorAll('[data-best]').forEach(function (el) { el.textContent = b; }); }
    refreshBest();
    function announce(m, assertive) { if (sr(m, assertive)) return; ui.live.textContent = ''; setTimeout(function () { ui.live.textContent = m; }, 30); }
    function banner(k, t) {
      ui.bk.textContent = k; ui.bt.textContent = t;
      ui.banner.classList.remove('is-on'); void ui.banner.offsetWidth; ui.banner.classList.add('is-on');
      clearTimeout(ui.banner._t); ui.banner._t = setTimeout(function () { ui.banner.classList.remove('is-on'); }, 2100);
      announce(k + ' ' + t);
    }
    function mult() { return 1 + Math.min(3, Math.floor(S.chain / 5)); }
    function remaining() { return Math.max(0, DURATION + S.bonus - S.elapsed); }
    function hud() {
      ui.score.textContent = S.score;
      var m = mult();
      ui.chain.textContent = 'Chain x' + m;
      ui.chain.classList.toggle('is-hot', m > 1);
      var rem = remaining();
      ui.time.textContent = Math.ceil(rem);
      ui.ring.style.strokeDashoffset = (RING * (1 - clamp(rem / DURATION, 0, 1))).toFixed(2);
      ui.timer.classList.toggle('is-hurry', rem <= 5 && S.state === 'playing');
      if (S.state === 'playing') {
        if (rem > 10.5) said10 = false;
        if (rem > 5.5) said5 = false;
        if (!said10 && rem <= 10 && rem > 5) { said10 = true; announce('10 seconds left. Score ' + S.score + '.'); }
        else if (!said5 && rem <= 5) { said5 = true; announce('5 seconds.'); }
      }
    }

    function spawn(t, opts) {
      opts = opts || {};
      var type = opts.type;
      if (!type) {
        var total = 0, bag = ORDER.map(function (k) {
          var w = TYPES[k].w;
          if (k === 'soot') w = opts.attract ? 0 : (t < 0.1 ? 0 : lerp(6, 13, t));
          if ((k === 'golden' || k === 'mystery') && opts.attract) w = 0;
          if (k === 'golden' && lanterns.some(function (L) { return L.type === 'golden'; })) w = 0;
          total += w; return [k, w];
        });
        var roll = Math.random() * total; type = 'kandil';
        for (var i = 0; i < bag.length; i++) { roll -= bag[i][1]; if (roll <= 0) { type = bag[i][0]; break; } }
      }
      var w = baseW * rnd(0.82, 1.12) * (type === 'golden' ? 0.9 : 1);
      var margin = clamp(W * 0.06, 18, 70) + w * 0.6;
      var speed = H * (opts.attract ? 0.08 : lerp(0.15, 0.3, t)) * rnd(0.85, 1.2) * (type === 'golden' ? 1.25 : 1);
      lanterns.push({
        type: type, x0: rnd(margin, W - margin), x: 0, y: H + w * 1.1, vy: speed, w: w,
        amp: rnd(8, 26), freq: rnd(0.6, 1.3), ph: rnd(0, TAU), rot: 0, t: 0, attract: !!opts.attract,
        ox: 0, ovx: 0, oy: 0, ovy: 0, orr: 0, orv: 0, wx: 0, wv: 0
      });
    }

    function burst(x, y, kind, cols, n) {
      if (isReduced()) n = Math.min(n, 6);
      var cap = Math.min(320, (maxP() / 2.5) | 0);
      for (var i = 0; i < n && parts.length < cap; i++) {
        var a = rnd(0, TAU), v = rnd(60, 260), p = { x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: rnd(0.5, 1.1), c: pick(cols), k: kind, s: rnd(2, 4), rot: rnd(0, TAU), vr: rnd(-8, 8), g: 220 };
        if (kind === 'star') { var sa = Math.round(a / (TAU / 8)) * (TAU / 8); p.vx = Math.cos(sa) * v * 1.2; p.vy = Math.sin(sa) * v * 1.2; p.g = 60; p.max = rnd(0.4, 0.7); }
        if (kind === 'paper') { p.vy = -rnd(20, 120); p.g = 140; p.s = rnd(3, 6); p.max = rnd(0.9, 1.5); }
        if (kind === 'shard') { p.s = rnd(3, 6); p.g = 420; }
        if (kind === 'smoke') { p.vx *= 0.25; p.vy = -rnd(10, 50); p.g = -10; p.s = rnd(8, 16); p.max = rnd(0.9, 1.4); }
        if (kind === 'ember') { p.vx *= 0.3; p.vy = -rnd(40, 160); p.g = -30; p.s = rnd(1.5, 2.6); }
        parts.push(p);
      }
    }
    function ring(x, y, color, r) { if (parts.length < 400) parts.push({ x: x, y: y, vx: 0, vy: 0, life: 0, max: 0.55, c: color, k: 'ring', s: r, g: 0 }); }
    function popup(x, y, text, color) { pops.push({ x: x, y: y, text: text, c: color, life: 0, max: 0.95 }); }
    function client(x, y) { var rc = canvas.getBoundingClientRect(); return { x: rc.left + x, y: rc.top + y }; }

    var SURPRISES = [
      { id: 'time', w: 3, run: function (pt) { S.bonus += 5; S.timeBonuses++; banner('Bonus time!', '+5 seconds. Your manager never saw this.'); sfx('chime'); impact(0.22, { x: pt.x, y: pt.y, color: '#6FE8E0', kind: 'surprise' }); } },
      { id: 'confetti', w: 3, run: function () {
        S.score += 30; banner('Confetti storm!', '+30, and a mess for Monday.'); sfx('win'); impact(0.3, { x: client(W / 2, H * 0.35).x, y: client(W / 2, H * 0.35).y, color: '#FFD778', kind: 'surprise' });
        for (var i = 0; i < 4; i++) (function (i) { setTimeout(function () { var p = client(W * (0.2 + i * 0.2), H * 0.35); fx('confetti', p.x, p.y, isMobile() ? 16 : 28); }, i * 150); })(i);
      } },
      { id: 'joke', w: 4, run: function (pt) { S.score += 25; banner('Inside this lantern…', pick(JOKES)); sfx('sparkle'); impact(0.12, { x: pt.x, y: pt.y, color: '#FFF4DC' }); } },
      { id: 'fireworks', w: 3, run: function () {
        S.score += 40; banner('Bonus fireworks!', '+40. The neighbours are jealous.');
        for (var i = 0; i < 3; i++) (function (i) { setTimeout(function () { var p = client(W * (0.25 + i * 0.25), H * rnd(0.18, 0.32)); fx('firework', p.x, p.y, { color: 'multi', type: pick(['peony', 'ring', 'willow']), size: 0.9 }); impact(0.38 + i * 0.05, { x: p.x, y: p.y, color: pick(['#FFD778', '#DB59C8', '#FF9F32']), kind: 'firework' }); }, i * 260); })(i);
      } },
      { id: 'frenzy', w: 2, run: function () {
        banner('Lantern frenzy!', 'Pop pop pop pop pop.'); sfx('whoosh'); impact(0.24, { color: '#FF9F32', kind: 'surprise' });
        for (var i = 0; i < 8; i++) (function (i) { setTimeout(function () { if (S.state === 'playing') spawn(0.5, { type: pick(['kandil', 'globe', 'drum', 'jaali']) }); }, i * 120); })(i);
      } },
      { id: 'slowmo', w: 2, run: function (pt) { S.slow = 4; banner('Slow-mo!', 'Matrix Diwali mode for 4 seconds.'); sfx('spin'); impact(0.2, { x: pt.x, y: pt.y, color: '#3FD0C9', kind: 'surprise' }); } }
    ];
    function surprise(pt) {
      S.surprises++;
      var opts = SURPRISES.filter(function (s) { return !(s.id === 'time' && S.timeBonuses >= 2); });
      var total = opts.reduce(function (a, s) { return a + s.w; }, 0), roll = Math.random() * total, pickS = opts[0];
      for (var i = 0; i < opts.length; i++) { roll -= opts[i].w; if (roll <= 0) { pickS = opts[i]; break; } }
      pickS.run(pt || client(W / 2, H / 2));
    }

    // the pop's pressure wave: nearby lanterns are shoved away and swing back on damped springs
    function shove(x, y, strength) {
      if (isReduced()) return;
      var R = Math.max(160, W * 0.28);
      for (var i = 0; i < lanterns.length; i++) {
        var L = lanterns[i], dx = L.x - x, dy = L.y - y, d = Math.sqrt(dx * dx + dy * dy) || 1;
        if (d > R) continue;
        var f = strength * (1 - d / R);
        L.ovx += dx / d * 260 * f; L.ovy += dy / d * 200 * f; L.orv += (dx > 0 ? 1 : -1) * 2.4 * f;
      }
    }
    // light spill: every pop briefly lights the sky (and the corridor piers) around it
    function spill(x, y, color, strength) { if (lights.length > 10) lights.shift(); lights.push({ x: x, y: y, c: color, s: strength, life: 0, max: 0.55 + 0.35 * strength }); }

    var POP_POWER = { kandil: 0.22, jaali: 0.26, globe: 0.2, drum: 0.21, golden: 0.42, mystery: 0.3 };
    function popLantern(L) {
      var i = lanterns.indexOf(L); if (i < 0) return;
      lanterns.splice(i, 1);
      if (S.target === L) S.target = null;
      var T = TYPES[L.type], h = L.w * 1.64, by = L.y + h * (T.body - 0.5), cp = client(L.x, by);
      if (L.type === 'soot') {
        S.score = Math.max(0, S.score + T.pts); S.chain = 0;
        burst(L.x, by, 'smoke', ['rgba(120,115,110,0.6)', 'rgba(70,65,60,0.6)'], 14);
        popup(L.x, by, '−15', '#BDB5AA'); sfx('thud');
        shove(L.x, by, 0.5);
        impact(0.16, { x: cp.x, y: cp.y, color: '#9A948C', kind: 'soot' });
        haptic('error');
        banner('Achoo!', 'That one was full of soot. −15.');
        hud(); return;
      }
      shove(L.x, by, L.type === 'golden' ? 1.2 : 0.8);
      spill(L.x, by, T.col[0], L.type === 'golden' ? 1 : 0.6);
      lightRise(cp.x, cp.y, T.col, L.type === 'golden' ? 1 : L.type === 'mystery' ? 0.7 : 0.45);
      impact(POP_POWER[L.type] || 0.2, { x: cp.x, y: cp.y, color: T.col[0], kind: 'pop' });
      // R4 haptics by lantern type: paper pops are a short burst, the golden lantern a success, mystery a knock
      if (L.type === 'golden') haptic('success');
      else if (L.type === 'mystery') haptic('medium');
      else haptic('burst', L.type === 'jaali' ? 0.45 : 0.32);
      var now = S.elapsed;
      S.chain = (now - S.lastPop < 1.1) ? S.chain + 1 : 1; S.lastPop = now;
      S.maxChain = Math.max(S.maxChain, S.chain);
      var gain = T.pts * mult();
      S.score += gain; S.popped++;
      popup(L.x, by, '+' + gain, L.type === 'golden' ? '#FFD778' : '#FFF4DC');
      if (L.type === 'kandil') { burst(L.x, by, 'star', T.col, 26); burst(L.x, by, 'paper', T.col, 8); sfx('pop'); }
      else if (L.type === 'jaali') { burst(L.x, by, 'shard', T.col, 16); burst(L.x, by, 'ember', ['#FFD778', '#FF9F32'], 10); sfx('crackle'); }
      else if (L.type === 'globe') { ring(L.x, by, '#FFC9F2', L.w * 0.6); burst(L.x, by, 'confetti', ['#E067C9', '#FFD778', '#FFF4DC', '#FF9F32'], 22); sfx('pop'); }
      else if (L.type === 'drum') { burst(L.x, by, 'paper', T.col, 16); burst(L.x, by, 'petal', ['#FF9F32', '#FFC93C'], 10); sfx('pop'); }
      else if (L.type === 'golden') {
        ring(L.x, by, '#FFF1C4', L.w); burst(L.x, by, 'star', T.col, 30); sfx('chime');
        var p = client(L.x, by); fx('firework', p.x, p.y, { color: '#FFD778', type: 'ring', size: 0.8 }); sfx('thump', { power: 0.4 });
        banner('Golden lantern!', '+' + gain + '. Lakshmi approves.');
        lanternSky(16);
      } else if (L.type === 'mystery') {
        ring(L.x, by, '#6FE8E0', L.w * 0.8); burst(L.x, by, 'star', T.col, 18); sfx('sparkle');
        surprise(cp);
      }
      if (S.chain === 5 || S.chain === 10 || S.chain === 15) { sfx('sparkle'); lanternSky(S.chain === 5 ? 9 : S.chain === 10 ? 15 : 24); if (L.type !== 'mystery' && L.type !== 'golden') banner('Chain x' + mult() + '!', S.chain === 5 ? 'Warming up.' : S.chain === 10 ? 'Unstoppable.' : 'Are you even human?'); else announce('Chain x' + mult() + '. Score ' + S.score + '.'); }
      hud();
    }

    function hitTest(x, y) {
      var tol = isMobile() ? 14 : 8;
      for (var i = lanterns.length - 1; i >= 0; i--) {
        var L = lanterns[i]; if (L.attract) continue;
        var h = L.w * 1.64, by = L.y + h * (TYPES[L.type].body - 0.5);
        var rx = L.w * 0.48 + tol, ry = h * 0.36 + tol;
        var dx = (x - L.x) / rx, dy = (y - by) / ry;
        if (dx * dx + dy * dy <= 1) return L;
      }
      return null;
    }

    /* ---------- flow ---------- */
    function start() {
      resize();
      lanterns.length = 0; parts.length = 0; pops.length = 0;
      S.elapsed = 0; S.bonus = 0; S.spawn = 200; S.score = 0; S.chain = 0; S.lastPop = -9; S.popped = 0; S.escaped = 0; S.maxChain = 0; S.surprises = 0; S.timeBonuses = 0; S.slow = 0; S.target = null;
      said10 = said5 = false; lights.length = 0; hideHint();
      S.inView = true; S.state = 'playing'; show(null); hud();
      try { canvas.focus({ preventScroll: true }); } catch (e) { canvas.focus(); }
      sfx('whoosh'); haptic('light'); announce('Go! 30 seconds. Pop the lanterns.');
      for (var i = 0; i < 3; i++) spawn(0, {});
      lanterns.forEach(function (L, k) { L.y = H * (0.75 + k * 0.1); });
      loop();
    }
    function pause(focusCard) {
      if (S.state !== 'playing') return;
      S.state = 'paused'; show('pause');
      announce('Paused at ' + S.score + ' points, ' + Math.ceil(remaining()) + ' seconds left. Press P or Resume to continue.');
      if (focusCard) { var rb = $('[data-resume]'); setTimeout(function () { try { rb.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }, 30); }
    }
    function resume() { if (S.state !== 'paused') return; S.state = 'playing'; show(null); try { canvas.focus({ preventScroll: true }); } catch (e) { /* ignore */ } announce('Resumed.'); loop(); }
    function end() {
      S.state = 'over';
      var isNew = S.score > 0 && setBest(S.score);
      refreshBest();
      var tier = TIERS[0]; TIERS.forEach(function (t) { if (S.score >= t.min) tier = t; });
      ui.final.textContent = S.score; ui.tier.textContent = tier.title; ui.tierline.textContent = tier.line;
      ui.sp.textContent = S.popped; ui.se.textContent = S.escaped; ui.sc.textContent = S.maxChain; ui.ss.textContent = S.surprises;
      ui.newbest.hidden = !isNew;
      show('over');
      lanterns.length = 0; S.target = null;
      sfx(S.score >= 120 ? 'win' : 'lose');
      lanternSky(clamp(14 + S.score / 10, 14, 34) * (isNew ? 1.2 : 1));
      if (isNew || S.score >= 260) { var p = client(W / 2, H * 0.3); fx('firework', p.x, p.y, { color: 'multi', type: 'peony', size: 1 }); impact(0.36, { x: p.x, y: p.y, color: '#FFD778' }); }
      else shake(2, 260);
      haptic(S.score >= 120 || isNew ? 'win' : 'medium');
      announce('Time! ' + S.score + ' points. ' + tier.title + '.' + (isNew ? ' New sky record.' : ''));
      var btn = $('[data-restart]'); setTimeout(function () { try { btn.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }, 60);
    }

    /* ---------- loop ---------- */
    function wantsLoop() {
      if (document.hidden || !ready) return false;
      if (S.state === 'playing') return true;
      if (parts.length || pops.length || lights.length || SFX.count()) return true;
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
      var t = Math.min(1, S.elapsed / DURATION);
      if (playing) {
        S.elapsed += dt;
        S.slow = Math.max(0, S.slow - dt);
        S.spawn -= dt * 1000;
        var cap = isMobile() ? 11 : 16;
        if (S.spawn <= 0) { if (lanterns.length < cap) spawn(t, {}); S.spawn = lerp(860, 380, t) * rnd(0.8, 1.2); }
        if (remaining() <= 0) { hud(); end(); return; }
        if (((S.elapsed * 10) | 0) !== S._h) { S._h = (S.elapsed * 10) | 0; hud(); }
        if (S.elapsed - S.lastPop > 1.4 && S.chain) { S.chain = 0; hud(); }
      } else if (S.state === 'idle' || S.state === 'over') {
        attractT -= dt * 1000;
        if (attractT <= 0 && S.inView && !isReduced() && !isPausedPref() && lanterns.length < 4) { spawn(0, { attract: true }); attractT = rnd(2400, 3800); }
      }
      var slowK = S.slow > 0 ? 0.35 : 1, live = lifeOn();
      clock += dt;
      var bz = live ? breeze(clock) : 0;
      for (var i = lanterns.length - 1; i >= 0; i--) {
        var L = lanterns[i];
        L.t += dt;
        // buoyancy: the hot air lifts in slight surges, so the rise is never perfectly even
        L.y -= L.vy * dt * (L.attract ? 1 : slowK) * (live ? 1 + 0.14 * Math.sin(L.t * 1.9 + L.ph) : 1);
        // corridor breeze: the paper body has inertia (wv), air drag, and a soft pull back to its own line
        if (live) { L.wv += (bz * 16 - L.wv * 0.9 - L.wx * 0.5) * dt; L.wx += L.wv * dt; }
        else if (L.wx || L.wv) { L.wx *= 0.9; L.wv = 0; }
        // springs: offsets from a neighbour's pop decay back to the lantern's own drift (paper has little mass)
        if (L.ovx || L.ox || L.ovy || L.oy || L.orv || L.orr) {
          L.ovx += (-L.ox * 38 - L.ovx * 5.5) * dt; L.ox += L.ovx * dt;
          L.ovy += (-L.oy * 38 - L.ovy * 5.5) * dt; L.oy += L.ovy * dt;
          L.orv += (-L.orr * 30 - L.orv * 4) * dt; L.orr += L.orv * dt;
          if (Math.abs(L.ox) + Math.abs(L.ovx) + Math.abs(L.oy) + Math.abs(L.ovy) < 0.02) L.ox = L.ovx = L.oy = L.ovy = 0;
          if (Math.abs(L.orr) + Math.abs(L.orv) < 0.002) L.orr = L.orv = 0;
        }
        L.x = L.x0 + Math.sin(L.t * L.freq + L.ph) * L.amp + (L.ox || 0) + L.wx;
        L.rot = Math.sin(L.t * L.freq * 1.3 + L.ph) * 0.07 + (L.orr || 0) + L.wv * 0.006;
        if (L.y < -L.w * 1.2) {
          lanterns.splice(i, 1);
          if (S.target === L) S.target = null;
          if (!L.attract && playing && L.type !== 'soot') S.escaped++;
        }
      }
      for (var p = parts.length - 1; p >= 0; p--) {
        var q = parts[p]; q.life += dt;
        if (q.life >= q.max) { parts.splice(p, 1); continue; }
        q.vx *= q.k === 'paper' || q.k === 'confetti' || q.k === 'petal' ? 0.95 : 0.97;
        q.vy = q.k === 'paper' || q.k === 'confetti' || q.k === 'petal' ? Math.min(q.vy + q.g * dt, 90) : q.vy + q.g * dt;
        q.x += q.vx * dt + (q.k === 'paper' || q.k === 'petal' ? Math.sin(q.life * 9 + q.rot) * 0.8 : 0);
        q.y += q.vy * dt; q.rot += q.vr * dt;
      }
      for (var k = pops.length - 1; k >= 0; k--) { pops[k].life += dt; if (pops[k].life >= pops[k].max) pops.splice(k, 1); }
      for (var li = lights.length - 1; li >= 0; li--) { lights[li].life += dt; if (lights[li].life >= lights[li].max) lights.splice(li, 1); }
    }
    function hexA(hex, a) { var n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a.toFixed(3) + ')'; }
    function drawLights() {
      if (!lights.length) return;
      ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < lights.length; i++) {
        var q = lights[i], k = 1 - q.life / q.max, a = k * k * 0.32 * q.s, R = baseW * (2.4 + 2.6 * q.s) * (1 + 0.5 * (1 - k));
        var g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, R);
        g.addColorStop(0, hexA(q.c, a)); g.addColorStop(0.45, hexA(q.c, a * 0.35)); g.addColorStop(1, hexA(q.c, 0));
        ctx.fillStyle = g; ctx.fillRect(q.x - R, q.y - R, R * 2, R * 2);
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    function drawPierLight() {
      // the corridor piers catch the light of nearby pops: a warm wash on the inner pier face
      if (!lights.length) return;
      var ww = clamp(W * 0.06, 18, 70);
      ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < lights.length; i++) {
        var q = lights[i], k = 1 - q.life / q.max;
        [[0, q.x], [W - ww, W - q.x]].forEach(function (side) {
          var near = clamp(1 - side[1] / (W * 0.45), 0, 1);
          if (near <= 0) return;
          var g = ctx.createRadialGradient(side[0] + ww / 2, q.y, 0, side[0] + ww / 2, q.y, H * 0.3);
          g.addColorStop(0, hexA(q.c, 0.22 * k * near * q.s)); g.addColorStop(1, hexA(q.c, 0));
          ctx.fillStyle = g; ctx.fillRect(side[0], q.y - H * 0.3, ww, H * 0.6);
        });
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    // the fine garland across the corridor: its sag breathes and each bead swings a little in the breeze
    function drawGarland(now, live) {
      var bz = live ? breeze(clock) : 0, sag = clamp(H * 0.06, 16, 40) * (1 + 0.06 * bz), y0 = 8, steps = 40, i;
      ctx.strokeStyle = 'rgba(255,215,120,0.3)'; ctx.lineWidth = 1;
      ctx.beginPath();
      for (i = 0; i <= steps; i++) { var t = i / steps, gx = t * W + Math.sin(t * Math.PI) * bz * 4, gy = y0 + Math.sin(t * Math.PI) * sag; if (i) ctx.lineTo(gx, gy); else ctx.moveTo(gx, gy); }
      ctx.stroke();
      var beads = Math.max(8, Math.round(W / 46));
      ctx.fillStyle = 'rgba(255,215,120,0.55)'; ctx.strokeStyle = 'rgba(255,215,120,0.22)';
      ctx.beginPath();
      for (var k = 1; k < beads; k++) {
        var tk = k / beads, kx = tk * W + Math.sin(tk * Math.PI) * bz * 4, ky = y0 + Math.sin(tk * Math.PI) * sag;
        var sw = live ? bz * 0.25 + Math.sin(now * 1.6 + k * 0.7) * 0.12 : 0, dx = Math.sin(sw) * 7, dy = Math.cos(sw) * 7;
        ctx.moveTo(kx, ky); ctx.lineTo(kx + dx, ky + dy);
      }
      ctx.stroke();
      ctx.beginPath();
      for (var b = 1; b < beads; b++) {
        var tb = b / beads, bx = tb * W + Math.sin(tb * Math.PI) * bz * 4, by = y0 + Math.sin(tb * Math.PI) * sag;
        var sb = live ? bz * 0.25 + Math.sin(now * 1.6 + b * 0.7) * 0.12 : 0, ex = bx + Math.sin(sb) * 7, ey = by + Math.cos(sb) * 7;
        ctx.moveTo(ex + 1.9, ey); ctx.arc(ex, ey, 1.9, 0, TAU);
      }
      ctx.fill();
    }
    function draw() {
      if (!W) return;
      var now = performance.now() / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H); // R4: the sky is transparent now, so every frame starts clean
      ctx.drawImage(sky, 0, 0, W, H);
      var live = lifeOn();
      // deepmala lamp towers in the distant temple town: tiny flames with a slow, irregular flicker
      if (skyLamps.length && glowSprite) {
        ctx.globalCompositeOperation = 'lighter';
        for (var lm = 0; lm < skyLamps.length; lm++) {
          var sl = skyLamps[lm], fk = (live ? 0.7 + 0.18 * Math.sin(now * 5.3 + sl.s) + 0.12 * Math.sin(now * 12.1 + sl.s * 2.1) : 0.8) * (sl.k == null ? 1 : sl.k);
          if (fk <= 0.01) continue;
          ctx.globalAlpha = 0.55 * fk; ctx.drawImage(glowSprite, sl.x - 5, sl.y - 5, 10, 10);
        }
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      }
      // R3.4: the screen-wide light continues through the arena (sky lanterns too, but only between rounds)
      if (SFX.count()) {
        var rcA = canvas.getBoundingClientRect();
        if (S.state === 'playing') { SFX.paint(ctx, dpr, rcA.left, rcA.top, W, H, true, 0.85); SFX.paint(ctx, dpr, rcA.left, rcA.top, W, H, 2, 0.42); }
        else SFX.paint(ctx, dpr, rcA.left, rcA.top, W, H, false, 0.85);
      }
      if (!isReduced()) {
        for (var s = 0; s < stars.length; s++) {
          var st = stars[s], a = 0.35 + 0.65 * Math.abs(Math.sin(now * 1.4 + st.ph));
          ctx.fillStyle = 'rgba(255,244,220,' + a.toFixed(2) + ')';
          ctx.fillRect(st.x, st.y, st.s, st.s);
        }
      }
      drawLights();
      for (var i = 0; i < lanterns.length; i++) {
        var L = lanterns[i];
        drawLantern(ctx, L, now, L.attract ? 0.38 : 1);
        if (S.target === L) {
          var h = L.w * 1.64, by = L.y + h * (TYPES[L.type].body - 0.5);
          ctx.save(); ctx.translate(L.x, by); ctx.rotate(now * 1.5);
          ctx.strokeStyle = '#FFD778'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
          ctx.beginPath(); ctx.arc(0, 0, L.w * 0.72, 0, TAU); ctx.stroke(); ctx.restore();
        }
      }
      if (parts.length) {
        for (var p = 0; p < parts.length; p++) {
          var q = parts[p], la = 1 - q.life / q.max;
          ctx.globalAlpha = la;
          if (q.k === 'ring') {
            ctx.strokeStyle = q.c; ctx.lineWidth = 3 * la;
            ctx.beginPath(); ctx.arc(q.x, q.y, q.s * (1 + (1 - la) * 1.6), 0, TAU); ctx.stroke();
          } else if (q.k === 'star' || q.k === 'ember') {
            ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = q.c; ctx.lineWidth = q.s * 0.7; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x - q.vx * 0.04, q.y - q.vy * 0.04); ctx.stroke();
            ctx.globalCompositeOperation = 'source-over';
          } else if (q.k === 'smoke') {
            ctx.fillStyle = q.c; ctx.beginPath(); ctx.arc(q.x, q.y, q.s * (1.6 - la * 0.6), 0, TAU); ctx.fill();
          } else {
            ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.rot); ctx.fillStyle = q.c;
            if (q.k === 'shard') { ctx.beginPath(); ctx.moveTo(0, -q.s); ctx.lineTo(q.s * 0.7, q.s * 0.6); ctx.lineTo(-q.s * 0.6, q.s * 0.4); ctx.closePath(); ctx.fill(); }
            else if (q.k === 'petal') { ctx.beginPath(); ctx.ellipse(0, 0, q.s * 0.6, q.s * 1.2, 0, 0, TAU); ctx.fill(); }
            else ctx.fillRect(-q.s / 2, -q.s * 0.3, q.s, q.s * (q.k === 'paper' ? 1.6 : 0.6));
            ctx.restore();
          }
        }
        ctx.globalAlpha = 1;
      }
      ctx.drawImage(front, 0, 0, W, H);
      drawGarland(now, live);
      drawPierLight();
      if (pops.length) {
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (var j = 0; j < pops.length; j++) {
          var po = pops[j], pr = po.life / po.max;
          ctx.globalAlpha = 1 - pr * pr;
          ctx.font = '400 ' + Math.round(26 + 7 * (1 - pr)) + 'px "Yatra One", "Mukta", Georgia, serif';
          ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(8,11,30,0.75)';
          ctx.strokeText(po.text, po.x, po.y - pr * 44); ctx.fillStyle = po.c; ctx.fillText(po.text, po.x, po.y - pr * 44);
        }
        ctx.globalAlpha = 1;
      }
      if (S.slow > 0) {
        ctx.fillStyle = 'rgba(63,208,201,' + (0.08 * Math.min(1, S.slow)).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H);
      }
    }

    /* ---------- input ---------- */
    canvas.addEventListener('pointerdown', function (e) {
      hideHint();
      if (S.state !== 'playing') return;
      var rc = canvas.getBoundingClientRect(), x = e.clientX - rc.left, y = e.clientY - rc.top;
      var L = hitTest(x, y);
      if (L) popLantern(L);
      else { burst(x, y, 'ember', ['#FFF4DC', '#FFD778'], 4); }
    });
    canvas.addEventListener('keydown', function (e) {
      var k = e.key;
      if (S.state === 'playing') {
        var live = lanterns.filter(function (L) { return !L.attract && L.y < H + 10; }).sort(function (a, b) { return a.x - b.x; });
        if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown') {
          e.preventDefault();
          if (!live.length) return;
          var idx = live.indexOf(S.target);
          if (idx < 0) { idx = 0; var best = 1e9; live.forEach(function (L, i) { var d = Math.abs(L.x - W / 2) + Math.abs(L.y - H / 2); if (d < best) { best = d; idx = i; } }); }
          else idx = (idx + ((k === 'ArrowLeft' || k === 'ArrowUp') ? -1 : 1) + live.length) % live.length;
          S.target = live[idx];
        } else if (k === ' ' || k === 'Enter') {
          e.preventDefault();
          if (!S.target && live.length) S.target = live[0];
          if (S.target) popLantern(S.target);
        } else if (k === 'Escape' || k === 'p' || k === 'P') { e.preventDefault(); e.stopPropagation(); pause(true); }
      } else if (S.state === 'paused' && (k === 'p' || k === 'P')) { e.preventDefault(); resume(); }
    });
    $('[data-start]').addEventListener('click', start);
    $('[data-restart]').addEventListener('click', start);
    $('[data-resume]').addEventListener('click', resume);
    $('[data-again]').addEventListener('click', function () { S.state = 'idle'; start(); });
    pauseBtn.addEventListener('click', function () { pause(true); });
    // R4: every button press answers with a tiny tap (primary actions add their own, stronger one first)
    root.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('button'); if (b && root.contains(b)) haptic('tap'); });
    root.addEventListener('keydown', function (e) {
      if (S.state === 'paused' && e.target !== canvas && (e.key === 'p' || e.key === 'P')) { e.preventDefault(); resume(); }
    });
    root.addEventListener('focusout', function (e) {
      if (S.state === 'playing' && e.relatedTarget && !root.contains(e.relatedTarget)) pause(false);
    });
    var A0 = E();
    if (A0.on) {
      A0.on('motion:pause', function () { if (S.state === 'playing') pause(false); lanterns = lanterns.filter(function (L) { return !L.attract; }); draw(); });
      A0.on('motion:resume', function () { loop(); });
      A0.on('prefs:change', function () { loop(); });
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { pause(); if (raf) { cancelAnimationFrame(raf); raf = 0; } } else loop();
    });

    root._qa = { sky: lanternSky, rise: lightRise }; // QA hook (DOM expando, no global): lets the preflight trigger effects
    game = {
      enter: function () { S.inView = true; resize(); refreshBest(); loop(); },
      leave: function () { S.inView = false; pause(); if (raf && S.state !== 'playing') { cancelAnimationFrame(raf); raf = 0; } }
    };
    resize();
    show('start');
  }

  /* =====================================================================
     E2M.releaseLanterns(n?) - finale: floods the viewport with gently rising
     lanterns on a fixed, pointer-transparent layer. Returns a Promise.
     ===================================================================== */
  var sky = null;
  function releaseLanterns(n) {
    var reduced = isReduced();
    var cap = Math.max(10, Math.floor(maxP() / 8));
    var count = Math.min(typeof n === 'number' ? n : (reduced ? 8 : isMobile() ? 12 : 22), cap);
    return loadSprites().then(function () {
      if (!sky) sky = createSky();
      sky.add(count, reduced);
      return sky.done();
    });
  }
  function createSky() {
    var layer = document.createElement('div');
    layer.className = 'act-lanterns-sky';
    layer.setAttribute('aria-hidden', 'true');
    var cv = document.createElement('canvas'); layer.appendChild(cv);
    document.body.appendChild(layer);
    var c = cv.getContext('2d'), W = 0, H = 0, dpr = 1;
    var list = [], raf = 0, last = 0, waiters = [];
    function size() {
      W = window.innerWidth; H = window.innerHeight; dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px';
    }
    size(); window.addEventListener('resize', size);
    var types = ['kandil', 'jaali', 'globe', 'drum', 'golden', 'kandil', 'globe'];
    function add(count, reduced) {
      var base = clamp(Math.min(W, H) * 0.085, 34, 86);
      for (var i = 0; i < count; i++) {
        var z = rnd(0.3, 1);
        list.push({
          type: pick(types), z: z, w: base * (0.45 + 0.6 * z), x0: rnd(0.04, 0.96) * W,
          y: H + base * 1.6 + (reduced ? rnd(-H * 0.6, -H * 0.1) : rnd(-H * 0.35, 0)), delay: reduced ? rnd(0, 0.8) : rnd(0, 1.8),
          vy: (H / (reduced ? 30 : lerp(11, 7, z))) * rnd(0.9, 1.1), amp: rnd(6, 18), freq: rnd(0.4, 0.9), ph: rnd(0, TAU), t: 0, rot: 0
        });
      }
      list.sort(function (a, b) { return a.z - b.z; });
      layer.classList.remove('is-out');
      layer.classList.add('is-on');
      // the release is a ~6s flourish behind the finale text: fade the layer out
      // from 4.6s, then clear whatever is still aloft
      clearTimeout(endT); clearTimeout(clearT);
      endT = setTimeout(function () {
        layer.classList.add('is-out');
        clearT = setTimeout(function () { list.length = 0; if (raf) { cancelAnimationFrame(raf); raf = 0; } finish(); }, 1300);
      }, 4600);
      kick();
    }
    var endT = 0, clearT = 0;
    function kick() { if (!raf && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } }
    function frame(ts) {
      raf = 0;
      var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016; last = ts;
      var now = ts / 1000;
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
      for (var i = list.length - 1; i >= 0; i--) {
        var L = list[i];
        if (L.delay > 0) { L.delay -= dt; continue; }
        L.t += dt; L.y -= L.vy * dt;
        L.x = L.x0 + Math.sin(L.t * L.freq + L.ph) * L.amp;
        L.rot = Math.sin(L.t * L.freq * 1.2 + L.ph) * 0.06;
        if (L.y < -L.w * 1.8) { list.splice(i, 1); continue; }
      }
      for (var j = 0; j < list.length; j++) {
        var M = list[j]; if (M.delay > 0) continue;
        var fade = clamp((M.y + M.w * 1.8) / (H * 0.28), 0, 1);
        drawLantern(c, M, now, (0.45 + 0.55 * M.z) * fade);
      }
      if (list.length && !document.hidden) raf = requestAnimationFrame(frame);
      else if (!list.length) finish();
    }
    function finish() {
      clearTimeout(endT); clearTimeout(clearT);
      layer.classList.remove('is-on');
      var w = waiters; waiters = [];
      setTimeout(function () { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height); layer.classList.remove('is-out'); w.forEach(function (f) { f(); }); }, 700);
    }
    document.addEventListener('visibilitychange', function () { if (!document.hidden && list.length) kick(); });
    return {
      add: add,
      done: function () { return new Promise(function (res) { if (!list.length) res(); else waiters.push(res); }); }
    };
  }

  var spec = {
    mount: function (el) { if (el) mount(el); },
    onEnter: function () { if (game) game.enter(); },
    onLeave: function () { if (game) game.leave(); }
  };
  function boot() {
    var api = window.E2M;
    if (!api || typeof api.register !== 'function') return false;
    ensureCss('act-lanterns');
    api.releaseLanterns = releaseLanterns;
    api.register(KEY, spec);
    return true;
  }
  if (!boot()) document.addEventListener('DOMContentLoaded', boot);
})();
