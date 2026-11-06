/* E2M Diwali — world: opening gate, HUD, scroll storytelling, world props, finale. Loaded last (defer). */
(function () {
  'use strict';
  var W = window, D = document, H = D.documentElement;
  var E2M = W.E2M;
  if (!E2M) { H.classList.remove('has-opening'); return; }
  E2M.worldReady = true;
  var gsap = W.gsap, ST = W.ScrollTrigger;
  if (gsap && ST) gsap.registerPlugin(ST);
  var rand = E2M.rand, pick = E2M.pick;
  var fine = W.matchMedia && W.matchMedia('(pointer: fine)').matches;
  var entered = false, entering = false;

  function $(s, r) { return (r || D).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || D).querySelectorAll(s)); }
  function centerOf(el) { var r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r }; }
  function safe(fn) { if (typeof fn === 'function') { try { fn(); } catch (e) { console.error('[E2M] finale hook failed', e); } } }

  // Keep the world out of the tab order until the gate opens.
  var worldEl = $('#world'), footEl = $('.site-foot'), hud = $('#hud');
  if (H.classList.contains('has-opening')) [worldEl, footEl, hud].forEach(function (el) { if (el) el.setAttribute('inert', ''); });

  /* ================================================================== */
  /* Generated ornaments: stars, garlands, mandala                        */
  /* ================================================================== */
  /* Revision 4: three star depths in the one fixed deep-space sky (far = many, tiny, dim; near = few,
     brighter). Each layer drifts by translate only (CSS) and a few stars twinkle by opacity only. */
  function buildStars() {
    var layers = $$('.sky-stars'); if (!layers.length) return;
    var m = E2M.mobile ? 0.5 : 1;
    var spec = { far: [Math.round(130 * m), 0.3, 0.6, 0.18, 0.46, 0.05], mid: [Math.round(64 * m), 0.5, 0.95, 0.3, 0.62, 0.12], near: [Math.round(22 * m), 0.9, 1.5, 0.45, 0.85, 0.3] };
    layers.forEach(function (svg) {
      var k = svg.getAttribute('data-depth') || 'mid', c = spec[k] || spec.mid, s = '';
      for (var i = 0; i < c[0]; i++) {
        var r = rand(c[1], c[2]), tw = Math.random() < c[5] && !E2M.reduced;
        var col = Math.random() < 0.12 ? '#CFD6FF' : (Math.random() < 0.1 ? '#FFE7A3' : '#FFF4DC');
        s += '<circle cx="' + rand(0, 100).toFixed(2) + '%" cy="' + rand(0, 100).toFixed(2) + '%" r="' + r.toFixed(2) + '" fill="' + col + '" opacity="' + rand(c[3], c[4]).toFixed(2) + '"' +
          (tw ? ' class="tw" style="animation-delay:-' + rand(0, 9).toFixed(2) + 's;animation-duration:' + rand(5, 11).toFixed(2) + 's"' : '') + '/>';
      }
      svg.innerHTML = s;
    });
  }

  // Revision 1: one restrained toran (over the palace entrance). Small, muted marigolds, a hairline cord.
  function garland() {
    var Wd = 1440, Hh = 74, sag = 26, sz = 11, seg = Wd / 8;
    var s = '<svg viewBox="0 0 ' + Wd + ' ' + Hh + '" preserveAspectRatio="xMidYMin slice" aria-hidden="true">';
    s += '<path d="M0 4.5H' + Wd + '" stroke="#B8862E" stroke-opacity=".55" stroke-width="1"/>';
    for (var lx = 12; lx < Wd; lx += 30) s += '<use href="#i-leaf" x="' + (lx - 3.5) + '" y="5" width="7" height="' + (12 + (lx % 3) * 2) + '" style="color:#6E5420"/>';
    var pal = [['#C98A2E', '#E8B65A', '#6E3E12'], ['#DDA445', '#C98A2E', '#6E3E12']];
    for (var g = 0; g < 8; g++) {
      for (var i = 1; i < 16; i++) {
        var t = i / 16, mx = g * seg + seg * t, my = 9 + sag * Math.sin(Math.PI * t), p = pal[i % 2];
        s += '<use href="#i-marigold" x="' + (mx - sz / 2).toFixed(1) + '" y="' + (my - sz / 2).toFixed(1) + '" width="' + sz + '" height="' + sz + '" style="color:' + p[0] + ';--sym-core:' + p[1] + ';--sym-eye:' + p[2] + '"/>';
      }
    }
    for (var d = 0; d <= 8; d++) {
      for (var j = 1; j <= 2; j++) {
        var q = pal[j % 2];
        s += '<use href="#i-marigold" x="' + (d * seg - sz / 2) + '" y="' + (4 + j * (sz - 2)) + '" width="' + sz + '" height="' + sz + '" style="color:' + q[0] + ';--sym-core:' + q[1] + ';--sym-eye:' + q[2] + '"/>';
      }
      s += '<use href="#i-leaf" x="' + (d * seg - 3.5) + '" y="' + (8 + 2 * (sz - 2)) + '" width="7" height="15" style="color:#8C6A2A"/>';
    }
    return s + '</svg>';
  }
  function buildGarlands() { $$('[data-garland]').forEach(function (el) { el.innerHTML = garland(el.getAttribute('data-garland')); }); }

  function buildMandala() {
    $$('[data-mandala]').forEach(function (svg) {
      var s = '<g fill="none" stroke="#FFD778" stroke-width="1">';
      [192, 186, 88, 84, 36].forEach(function (r, i) { s += '<circle r="' + r + '"' + (i === 3 ? ' stroke-dasharray="3 5"' : '') + '/>'; });
      function petals(n, r1, r2, w) {
        var out = '', rm = (r1 + r2) / 2;
        for (var i = 0; i < n; i++) out += '<path transform="rotate(' + (i * 360 / n).toFixed(2) + ')" d="M0 ' + (-r1) + 'Q' + w + ' ' + (-rm) + ' 0 ' + (-r2) + 'Q' + (-w) + ' ' + (-rm) + ' 0 ' + (-r1) + 'z"/>';
        return out;
      }
      s += petals(24, 150, 184, 9) + petals(16, 92, 138, 15) + petals(12, 40, 80, 14) + petals(8, 9, 33, 8) + '</g><g fill="#FFD778">';
      for (var i = 0; i < 48; i++) { var a = i / 48 * Math.PI * 2; s += '<circle cx="' + (Math.cos(a) * 143).toFixed(1) + '" cy="' + (Math.sin(a) * 143).toFixed(1) + '" r="1.8"/>'; }
      svg.innerHTML = s + '<circle r="5"/></g>';
    });
  }

  /* ================================================================== */
  /* Opening: palace gate                                                 */
  /* ================================================================== */
  var opening = $('#opening'), opOn = true;
  var gate = $('.gate'), facade = $('.op-facade'), flashEl = $('.gold-flash');
  var cta = $('.op-cta'), copyEl = $('.opening-copy');
  var motes = [], moteCv = $('.op-motes'), moteCtx = null, moteRaf = 0, moteW = 0, moteH = 0, moteDpr = 1, moteSprite = null;

  function splitChars(line) {
    var txt = line.textContent; line.textContent = '';
    for (var i = 0; i < txt.length; i++) {
      var c = txt[i], sp = D.createElement('span');
      sp.className = 'ch'; sp.setAttribute('aria-hidden', 'true');
      sp.textContent = c === ' ' ? ' ' : c;
      line.appendChild(sp);
    }
  }

  function initMotes() {
    if (!moteCv || E2M.reduced) return;
    moteCtx = moteCv.getContext('2d');
    moteSprite = D.createElement('canvas'); moteSprite.width = moteSprite.height = 32;
    var g = moteSprite.getContext('2d'), r = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    r.addColorStop(0, 'rgba(255,244,220,1)'); r.addColorStop(0.3, 'rgba(255,215,120,.7)'); r.addColorStop(1, 'rgba(255,159,50,0)');
    g.fillStyle = r; g.fillRect(0, 0, 32, 32);
    sizeMotes();
    var n = E2M.mobile ? 10 : 22;
    for (var i = 0; i < n; i++) motes.push(newMote(true));
  }
  function sizeMotes() {
    if (!moteCv) return;
    var rc = moteCv.getBoundingClientRect(); moteW = rc.width; moteH = rc.height;
    moteDpr = Math.min(W.devicePixelRatio || 1, E2M.mobile ? 1.5 : 2);
    moteCv.width = Math.round(moteW * moteDpr); moteCv.height = Math.round(moteH * moteDpr);
    if (moteCtx) moteCtx.setTransform(moteDpr, 0, 0, moteDpr, 0, 0);
  }
  function newMote(any) {
    return { x: rand(0, moteW), y: any ? rand(0, moteH) : moteH + 10, r: rand(1.4, 3.6), vy: rand(-11, -4), ph: rand(0, 6.28), sw: rand(4, 14), a: rand(0.14, 0.42), tw: rand(0.3, 0.9) };
  }
  var moteLast = 0;
  function moteFrame(t) {
    moteRaf = 0;
    if (!opOn || D.hidden || !moteCtx) return;
    var dt = Math.min(0.05, (t - moteLast) / 1000 || 0.016); moteLast = t;
    moteCtx.clearRect(0, 0, moteW, moteH);
    moteCtx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < motes.length; i++) {
      var m = motes[i];
      m.y += m.vy * dt; m.ph += dt * 0.35;
      if (m.y < -20) motes[i] = m = newMote(false);
      var x = m.x + Math.sin(m.ph) * m.sw;
      moteCtx.globalAlpha = m.a * (0.6 + 0.4 * Math.sin(t / 1000 * m.tw + m.ph));
      moteCtx.drawImage(moteSprite, x - m.r, m.y - m.r, m.r * 2, m.r * 2);
    }
    moteCtx.globalAlpha = 1;
    moteRaf = requestAnimationFrame(moteFrame);
  }
  function startOpeningLoops() {
    if (E2M.reduced || (E2M.isPaused && E2M.isPaused())) return;
    if (!moteRaf && moteCtx) { moteLast = performance.now(); moteRaf = requestAnimationFrame(moteFrame); }
  }
  function stopOpeningLoops() { if (moteRaf) { cancelAnimationFrame(moteRaf); moteRaf = 0; } }

  /* Revision 3: the temple gate. The gopuram (tiered gateway tower) is drawn with the shared temple kit in the
     gate's own 100x140 box, so the HTML doors always sit exactly in its doorway. The temple town around it:
     prakara walls with lit diya niches, kuta shrines and pavilions on the walls, deepmala lamp towers at the
     gate, two great shikharas and a horizon of shrines, all complete and continuing past both screen edges. */
  function buildGopuram() {
    var svg = $('.gopuram'); if (!svg || !E2M.temple) return;
    var k = E2M.temple.kit(), T = E2M.temple;
    k.gopuram(50, 140, 92, 134, { tiers: 5, kalashas: 7, hb: 0.52, crown: 0.12, door: false });
    // pilasters and diya niches on the base storey, either side of the door
    k.L('M8.6 140V71M24.6 140V75M75.4 140V75M91.4 140V71');
    [13, 19.6, 80.4, 87].forEach(function (x) { for (var y = 86; y <= 126; y += 10) { k.W(T.rect(x - 1.5, y - 4.2, 3, 4.6), 0.12); k.lamp.push([x, y - 1.6, 0.55]); } });
    var fr = '';
    // the dwarashakha: three carved door-frame bands around the doorway, then the makara torana above it
    [[1.4, 0.34], [2.9, 0.24], [4.4, 0.15]].forEach(function (b) { fr += '<rect x="' + (31 - b[0]) + '" y="' + (79.8 - b[0]) + '" width="' + (38 + b[0] * 2) + '" height="' + (50.8 + b[0]) + '" fill="none" stroke="#FFD778" stroke-opacity="' + b[1] + '" vector-effect="non-scaling-stroke"/>'; });
    fr += '<path d="M25.6 79.4c0-2.6 1.6-3.9 3.4-3.4 1.4.4 1.6 2.2.3 2.6M74.4 79.4c0-2.6-1.6-3.9-3.4-3.4-1.4.4-1.6 2.2-.3 2.6M28.2 76.4C33 73.6 40 71.6 45.6 71.2L50 68.4l4.4 2.8C60 71.6 67 73.6 71.8 76.4" fill="none" stroke="#FFD778" stroke-opacity=".42" stroke-linecap="round" vector-effect="non-scaling-stroke"/>';
    fr += '<path d="M50 69.6l1.6 1.6-1.6 1.6-1.6-1.6z" fill="#FFD778" fill-opacity=".55"/>';
    svg.innerHTML = '<defs><linearGradient id="gp-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#12143A"/><stop offset=".6" stop-color="#0B0D28"/><stop offset="1" stop-color="#07091C"/></linearGradient></defs>' +
      k.svg({ id: 'gp', fill: 'url(#gp-fill)', strokeOpacity: 0.22, lineOpacity: 0.12, only: 'static' }) + fr;
    var live = D.createElementNS('http://www.w3.org/2000/svg', 'svg');
    live.setAttribute('class', 'gopuram gopuram-live'); live.setAttribute('viewBox', '0 0 100 140'); live.setAttribute('preserveAspectRatio', 'xMidYMax meet'); live.setAttribute('aria-hidden', 'true');
    live.innerHTML = k.svg({ id: 'gpl', only: 'live', spill: false });
    svg.parentNode.insertBefore(live, svg.nextSibling);
  }
  function buildFacade() {
    if (!facade || !E2M.temple) return;
    var T = E2M.temple, rnd = T.seeded(1105), far = T.kit(), near = T.kit(), x;
    far.town(-1400, 3000, 820, { rnd: rnd, scale: 1.1 });
    far.shikhara(290, 770, 176, 480, { spires: 2, lit: 0.42 });
    far.shikhara(1310, 770, 176, 480, { spires: 2, lit: 0.42, flagSide: -1 });
    near.wall(-1400, 900, 1905, 196, { niche: 36 });
    near.wall(1095, 900, 1905, 196, { niche: 36 });
    for (x = -1330; x < 430; x += 152) if (x < 60 || x > 330) near.shikhara(x, 684, 42, 92, { bands: 3, door: false, flag: rnd() < 0.45 });
    for (x = 1170; x < 2930; x += 152) if (x < 1270 || x > 1540) near.shikhara(x, 684, 42, 92, { bands: 3, door: false, flag: rnd() < 0.45, flagSide: -1 });
    near.mandapa(110, 684, 190, 168, { rnd: rnd });
    near.mandapa(1300, 684, 190, 168, { rnd: rnd });
    near.deepmala(452, 900, 430); near.deepmala(1148, 900, 430);
    near.deepmala(-150, 900, 330); near.deepmala(1750, 900, 330);
    var art = facade.querySelector('.op-facade-art'), live = facade.querySelector('.op-facade-live');
    live.innerHTML = '<g class="fac-far-live" opacity=".72">' + far.svg({ id: 'ffl', only: 'live' }) + '</g><g class="fac-near-live">' + near.svg({ id: 'fnl', only: 'live' }) + '</g>';
    art.innerHTML = '<defs><linearGradient id="fac-near" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0C0E2C"/><stop offset="1" stop-color="#06081A"/></linearGradient>' +
      '<linearGradient id="fac-far" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#13143A"/><stop offset="1" stop-color="#0B0D28"/></linearGradient></defs>' +
      '<g class="fac-far" data-depth="far" opacity=".72">' + far.svg({ id: 'ff', fill: 'url(#fac-far)', strokeOpacity: 0.09, lineOpacity: 0.05, only: 'static' }) + '</g>' +
      '<g class="fac-near" data-depth="near">' + near.svg({ id: 'fn', fill: 'url(#fac-near)', strokeOpacity: 0.18, lineOpacity: 0.08, only: 'static' }) + '</g>';
  }
  /* near ambient shells rim-light the temple town for a moment */
  var opRim = null;
  function rimOpening(d) {
    if (!opOn || !d || d.kind === 'far' || !opRim || !opRim.animate || E2M.reduced) return;
    var r = opening.getBoundingClientRect();
    opRim.style.setProperty('--fx', ((d.x - r.left) / (r.width || 1) * 100).toFixed(1) + '%');
    opRim.style.setProperty('--fc', d.color);
    opRim.animate([{ opacity: d.near ? 0.75 : 0.4 }, { opacity: 0 }], { duration: 1100 + d.size * 500, easing: 'cubic-bezier(.2,.7,.3,1)' });
  }

  function openingIntro() {
    $$('.op-line').forEach(splitChars);
    var h1 = $('.op-title'); if (h1) h1.setAttribute('aria-label', 'The Festival of Lights');
    if (!gsap) return;
    gsap.set(gate, { xPercent: -50, x: 0 });
    if (E2M.reduced) return;
    // Revision 1: a slow, composed title sequence — no rotation, no bounce.
    var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from(facade, { opacity: 0, y: 30, duration: 3.2 }, 0)
      .from(gate, { opacity: 0, y: 40, duration: 2.8 }, 0.15)
      .from('.op-toran', { opacity: 0, yPercent: -40, duration: 2.6 }, 0.6)
      .from('.arch-line', { opacity: 0, duration: 3, ease: 'power2.out' }, 0.4)
      .from('.op-brand', { opacity: 0, y: 8, duration: 2 }, 0.5)
      .from('.op-eyebrow', { opacity: 0, y: 10, duration: 1.8 }, 0.7)
      .from('.op-title .ch', { yPercent: 36, opacity: 0, duration: 2.2, stagger: 0.045 }, 0.85)
      .from('.op-sub', { opacity: 0, y: 12, duration: 1.8 }, 1.7)
      .from('.op-deva', { opacity: 0, y: 10, duration: 1.8 }, 1.85)
      .from('.op-copy', { opacity: 0, y: 12, duration: 1.8 }, 1.9)
      .from('.op-actions', { opacity: 0, y: 12, duration: 1.8 }, 2.15);
    var flames = $$('.th-diya .e2m-flame'), order = [];
    for (var i = 0; i < flames.length / 2; i++) { order.push(flames[i]); order.push(flames[flames.length - 1 - i]); }
    tl.fromTo(order, { opacity: 0 }, { opacity: 1, duration: 1.2, stagger: 0.22, ease: 'power1.out' }, 1.1);
    if (fine) {
      var fx = gsap.quickTo(facade, 'x', { duration: 2.4, ease: 'power3.out' });
      var gx = gsap.quickTo(gate, 'x', { duration: 2.4, ease: 'power3.out' });
      opening.addEventListener('pointermove', function (e) {
        if (entering) return;
        var nx = e.clientX / W.innerWidth - 0.5;
        fx(nx * -8); gx(nx * -3);
      });
    }
  }

  function enterWorld(fast, targetHash) {
    if (entering) return;
    if (entered) { (D.getElementById('zone-fireworks') || worldEl).scrollIntoView({ behavior: E2M.reduced ? 'auto' : 'smooth' }); return; }
    entering = true;
    var cd = $('.central-diya'), cdc = centerOf(cd), vw = W.innerWidth, vh = W.innerHeight;
    var doorL = $('.door--l'), doorR = $('.door--r'), light = $('.portal-light'), glow = $('.cd-glow'), flame = $('.cd-flame');
    E2M.audio.play('sparkle');
    if (fast || !gsap || E2M.reduced) {
      cd.classList.add('is-lit');
      [doorL, doorR].forEach(function (d, i) { d.style.transition = 'transform 1s ease'; d.style.transform = 'rotateY(' + (i ? -92 : 92) + 'deg)'; });
      light.style.opacity = 1; glow.style.opacity = 1; glow.style.transform = 'translate(-50%,50%) scale(1)';
      if (!E2M.reduced && !fast) E2M.fx.sparkBurst(cdc.x, cdc.y, '#FFD778', 16);
      setTimeout(function () { finishEnter(targetHash); }, fast ? 0 : (E2M.reduced ? 350 : 1200));
      return;
    }
    gsap.set(flame, { '--fs': 0 });
    gsap.set(glow, { x: 0, y: 0, xPercent: -50, yPercent: 50, scale: 0.2 });
    var tl = gsap.timeline({ onComplete: function () { finishEnter(targetHash); } });
    // Revision 1: slower, quieter — the copy dissolves, one flame is lit, the doors part, one golden bloom.
    tl.to(['.op-brand', '.op-eyebrow', '.op-title', '.op-sub', '.op-deva', '.op-copy', '.op-actions', '.op-toran'], { y: -18, opacity: 0, duration: 1.1, stagger: 0.06, ease: 'power2.inOut' }, 0)
      .add(function () { cd.classList.add('is-lit'); E2M.fx.sparkBurst(cdc.x, cdc.y - 10, '#FFD778', 14); E2M.audio.play('chime'); }, 0.7)
      .to(flame, { '--fs': 1.15, duration: 1.4, ease: 'expo.out' }, 0.7)
      .to(glow, { opacity: 1, scale: 1, xPercent: -50, yPercent: 50, duration: 2.4, ease: 'expo.out' }, 0.8)
      .to(light, { opacity: 1, duration: 2.6, ease: 'power2.inOut' }, 1.3)
      .to(doorL, { rotationY: 92, duration: 2.9, ease: 'power3.inOut' }, 1.35)
      .to(doorR, { rotationY: -92, duration: 2.9, ease: 'power3.inOut' }, 1.35)
      .to('.portal-seam', { opacity: 0, duration: 1 }, 1.5)
      .add(function () {
        E2M.audio.play('bell', { pitch: 523 }); setTimeout(function () { E2M.audio.play('bell', { pitch: 659 }); }, 260);
        $$('.gate-bell').forEach(function (b, i) { setTimeout(function () { b.classList.remove('is-ringing'); void b.offsetWidth; b.classList.add('is-ringing'); }, i * 220); });
      }, 1.4)
      .add(function () {
        E2M.fx.firework(vw / 2, vh * 0.32, { type: 'willow', color: 'gold', size: 1.1, distance: 0.25 });
        if (E2M.screenGlow) E2M.screenGlow('#FFD778', 0.7, vw / 2, vh * 0.5);
        E2M.fx.goldenRain(60);
      }, 2.7)
      .to(gate, { scale: 3.6, duration: 2, ease: 'power3.in' }, 3.1)
      .to(facade, { scale: 1.5, opacity: 0.15, duration: 2, ease: 'power3.in' }, 3.1)
      .to(flashEl, { opacity: 1, duration: 0.9, ease: 'power2.in' }, 4.2);
  }

  function finishEnter(targetHash) {
    entered = true; entering = false;
    H.classList.remove('has-opening');
    [worldEl, footEl, hud].forEach(function (el) { if (el) el.removeAttribute('inert'); });
    if (gsap) {
      gsap.set(gate, { scale: 1, x: 0, y: 0, xPercent: -50, opacity: 1 });
      gsap.set(facade, { scale: 1, x: 0, y: 0, opacity: 1 });
      gsap.set(['.op-brand', '.op-eyebrow', '.op-title', '.op-sub', '.op-deva', '.op-copy', '.op-actions', '.op-toran'], { clearProps: 'transform,opacity' });
    }
    var target = (targetHash && D.querySelector(targetHash)) || D.getElementById('zone-fireworks');
    var prev = H.style.scrollBehavior; H.style.scrollBehavior = 'auto';
    W.scrollTo(0, target.getBoundingClientRect().top + W.pageYOffset);
    H.style.scrollBehavior = prev;
    if (worldEl) worldEl.focus({ preventScroll: true });
    E2M.startZones();
    if (ST) ST.refresh();
    E2M.emit('world:enter');
    if (gsap) gsap.to(flashEl, { opacity: 0, duration: E2M.reduced ? 0.2 : 2, ease: 'power2.out', delay: 0.1 });
    else flashEl.style.opacity = 0;
    if (!E2M.reduced && !targetHash) {
      setTimeout(function () {
        var vw = W.innerWidth, vh = W.innerHeight;
        // Welcome rockets burst in empty sky, never over the zone headline.
        var narrow = vw < 760, y1 = narrow ? vh * 0.5 : vh * 0.24, y2 = narrow ? vh * 0.58 : vh * 0.2;
        E2M.fx.firework(vw * (narrow ? 0.3 : 0.16), y1, { rocket: true, type: 'peony', color: 'rainbow', size: narrow ? 0.65 : 0.8, distance: 0.35 });
        setTimeout(function () { E2M.fx.firework(vw * (narrow ? 0.72 : 0.84), y2, { rocket: true, type: 'willow', color: 'rainbow', size: narrow ? 0.65 : 0.8, distance: 0.45 }); }, 1100);
      }, 900);
    }
    setTimeout(function () { E2M.toast('Psst. Seven tiny diyas are hiding around the temple town. Find them all.', 5600); }, 3600);
  }

  // Revision 2: the Toolkit's zone shortcuts (1–9, 0) can enter the world straight to a zone
  E2M.enterWorld = function (hash) {
    if (entered) { var t = hash && D.querySelector(hash); if (t) t.scrollIntoView({ behavior: E2M.reduced ? 'auto' : 'smooth' }); return; }
    enterWorld(true, hash || null);
  };
  E2M.isEntered = function () { return entered; };
  /* Revision 2: on screens wider than 16:9 the facade's viewBox widens to the real aspect, so the palace is
     never cropped at the top (towers and shikharas stay whole); narrower screens keep the centred side-crop. */
  function fitFacade() {
    if (!facade || !opening) return;
    var r = opening.getBoundingClientRect(), w = r.width || W.innerWidth, h = r.height || W.innerHeight;
    var VW = Math.max(1600, 900 * w / h), vb = (800 - VW / 2).toFixed(1) + ' 0 ' + VW.toFixed(1) + ' 900';
    $$('svg', facade).forEach(function (s) { s.setAttribute('viewBox', vb); });
  }
  function initOpening() {
    if (!opening) return;
    buildFacade(); buildGopuram();
    fitFacade();
    W.addEventListener('resize', fitFacade);
    opRim = D.createElement('div'); opRim.className = 'op-rim'; opRim.setAttribute('aria-hidden', 'true');
    opening.insertBefore(opRim, $('.gate', opening));
    E2M.on('ambient:burst', rimOpening);
    initMotes();
    if ('IntersectionObserver' in W) {
      new IntersectionObserver(function (es) {
        opOn = es[0].isIntersecting;
        if (opOn) startOpeningLoops(); else stopOpeningLoops();
      }, { threshold: 0.02 }).observe(opening);
    }
    startOpeningLoops();
    D.addEventListener('visibilitychange', function () { if (D.hidden) stopOpeningLoops(); else if (opOn) startOpeningLoops(); });
    W.addEventListener('resize', sizeMotes);
    openingIntro();
    if (cta) cta.addEventListener('click', function () { if (E2M.haptic) E2M.haptic('medium'); enterWorld(false); });
    var skip = $('.skip-link');
    if (skip) skip.addEventListener('click', function (e) { if (!entered) { e.preventDefault(); enterWorld(true); } });
    var h = W.location.hash;
    if (h && h.length > 1 && h !== '#opening' && h !== '#main') {
      var t = null; try { t = D.querySelector(h); } catch (er) {}
      if (t) setTimeout(function () { enterWorld(true, h); }, 60);
    }
  }

  /* ================================================================== */
  /* HUD                                                                  */
  /* ================================================================== */
  function initProgress() {
    var zones = $$('.zone[data-zone]'), n = zones.length, raf = 0;
    if (!hud || !n) return;
    function update() {
      raf = 0;
      var y = W.innerHeight * 0.45, p = 0;
      for (var i = 0; i < n; i++) {
        var r = zones[i].getBoundingClientRect();
        if (r.top <= y && r.bottom > y) { p = (i + E2M.clamp((y - r.top) / (r.height || 1), 0, 1)) / n; break; }
        if (i === n - 1 && r.bottom <= y) p = 1;
      }
      hud.style.setProperty('--hud-p', (p * 100).toFixed(2) + '%');
    }
    function req() { if (!raf) raf = requestAnimationFrame(update); }
    W.addEventListener('scroll', req, { passive: true });
    W.addEventListener('resize', req);
    E2M.on('world:enter', req);
    req();
  }
  function initHud() {
    var nav = $('.hud-nav'), mapBtn = $('.hud-map');
    var onScroll = function () { hud.classList.toggle('is-scrolled', W.pageYOffset > 30); };
    W.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    if (mapBtn) {
      mapBtn.addEventListener('click', function () {
        var open = !nav.classList.contains('is-open');
        if (E2M.haptic) E2M.haptic('tap');
        nav.classList.toggle('is-open', open); mapBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) { var cur = $('.hud-zones a.is-current') || $('.hud-zones a'); if (cur) setTimeout(function () { cur.focus(); }, 30); }
      });
      D.addEventListener('click', function (e) {
        if (!nav.classList.contains('is-open')) return;
        if (!e.target.closest('.hud-nav') || e.target.closest('.hud-zones a')) { nav.classList.remove('is-open'); mapBtn.setAttribute('aria-expanded', 'false'); }
      });
      D.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('is-open')) { nav.classList.remove('is-open'); mapBtn.setAttribute('aria-expanded', 'false'); mapBtn.focus(); } });
    }
    E2M.on('zone:enter', function (key) {
      $$('.hud-zones a').forEach(function (a) {
        var me = a.getAttribute('data-dot') === key;
        a.classList.toggle('is-current', me);
        if (me) { a.classList.add('is-visited'); a.setAttribute('aria-current', 'location'); } else a.removeAttribute('aria-current');
      });
      // Revision 4: one continuous deep-space sky for every zone (no per-zone colour tween). The background
      // crackers live only in the Fireworks zone (core.js gates them on that zone).
    });
    E2M.on('found', function (d) {
      var f = $('.hud-found');
      if (f && !f.classList.contains('is-shown')) { f.classList.add('is-shown'); requestAnimationFrame(function () { requestAnimationFrame(function () { f.classList.add('is-in'); }); }); }
      var msgs = ['', 'Hidden diya 1 of 7! You have a good eye. Suspiciously good.', '2 of 7. You are officially the office detective.',
        '3 of 7. Keep going, they are terrible at hiding.', '4 of 7. More than halfway. The diyas are nervous.', '5 of 7. Someone check whether you are actually working.',
        '6 of 7. One left, and it knows you are coming.'];
      if (d.count < E2M.foundTotal) E2M.toast(msgs[d.count] || d.count + ' of 7 hidden diyas found.');
    });
    E2M.on('found:all', function () {
      E2M.toast('All 7 hidden diyas found! You are now our Chief Light Officer.', 5200);
      E2M.audio.play('win');
      E2M.fx.goldenRain(140);
    });
  }

  /* ================================================================== */
  /* Scroll storytelling                                                  */
  /* ================================================================== */
  function esc(t) { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function wrapWords(txt) {
    return txt.split(/(\s+)/).map(function (part) {
      if (!part) return '';
      return /^\s+$/.test(part) ? ' ' : '<span class="w"><span>' + esc(part) + '</span></span>';
    }).join('');
  }
  // Splits into masked words while keeping inline emphasis (<em>) intact.
  function splitWords(el) {
    var out = '';
    Array.prototype.forEach.call(el.childNodes, function (nd) {
      if (nd.nodeType === 3) out += wrapWords(nd.textContent);
      else if (nd.nodeType === 1) { var tag = nd.tagName.toLowerCase(); out += '<' + tag + '>' + wrapWords(nd.textContent) + '</' + tag + '>'; }
    });
    el.innerHTML = out.trim();
  }
  var parallaxTweens = [];
  function setParallax(on) {
    if (!gsap || !ST) return;
    parallaxTweens.forEach(function (t) { if (t.scrollTrigger) t.scrollTrigger.kill(); t.kill(); });
    parallaxTweens = [];
    $$('[data-parallax]').forEach(function (el) {
      if (!on) { gsap.set(el, { y: 0 }); return; }
      var s = parseFloat(el.getAttribute('data-parallax')) || 0.15, zone = el.closest('.zone') || el.parentNode;
      parallaxTweens.push(gsap.fromTo(el, { y: -s * 90 }, { y: s * 90, ease: 'none', scrollTrigger: { trigger: zone, start: 'top bottom', end: 'bottom top', scrub: 1.2 } }));
    });
  }
  function initStory() {
    $$('[data-split]').forEach(splitWords);
    E2M.on('prefs:change', function (d) { if (d.changed.indexOf('motion') > -1) { setParallax(!E2M.reduced); if (ST) ST.refresh(); } });
    if (!gsap || !ST || E2M.reduced) return;
    $$('.zone-head').forEach(function (head) {
      var tl = gsap.timeline({ scrollTrigger: { trigger: head, start: 'top 80%', once: true } });
      var words = $$('[data-split] .w > span', head), rev = $$('[data-reveal]', head);
      var kick = rev.filter(function (r) { return r.classList.contains('zh-kicker'); }), rest = rev.filter(function (r) { return kick.indexOf(r) < 0; });
      if (kick.length) tl.from(kick, { opacity: 0, y: 8, duration: 1.6, ease: 'power3.out' }, 0);
      if (words.length) tl.from(words, { yPercent: 108, duration: 1.8, stagger: 0.09, ease: 'expo.out' }, 0.2);
      if (rest.length) tl.from(rest, { opacity: 0, y: 14, duration: 1.6, stagger: 0.12, ease: 'power3.out' }, 0.65);
    });
    // Scenery drifts very slightly with scroll (depth, not decoration). Calm mode turns it off live.
    setParallax(true);
    // R3.7: every stage rises into place the first time it scrolls into view (eased, staggered after its header)
    $$('.zone-stage').forEach(function (st) {
      gsap.from(st, { opacity: 0, y: 34, duration: 1.7, ease: 'power3.out', clearProps: 'opacity,transform', scrollTrigger: { trigger: st, start: 'top 90%', once: true } });
    });
  }
  /* R3.7: depth — the stars and the nebula sit at different distances and drift at different rates as the page
     scrolls (3 sky depths + the zone scenery parallax + the headers' pointer parallax). */
  function initSkyDepth() {
    // Revision 4: the three star depths and the nebula move at different rates as the page scrolls — translate
    // only (the layers bleed 64px past the viewport, so the travel never shows an edge)
    var layers = $$('.sky-stars'), neb = $('.sky-nebula'), raf = 0, rate = { far: 10, mid: 22, near: 40 };
    if (!layers.length) return;
    function upd() {
      raf = 0;
      if (E2M.reduced) { layers.forEach(function (l) { l.style.translate = ''; }); if (neb) neb.style.translate = ''; return; }
      var max = Math.max(1, D.documentElement.scrollHeight - W.innerHeight), p = W.pageYOffset / max;
      layers.forEach(function (l) { l.style.translate = '0 ' + (-p * (rate[l.getAttribute('data-depth')] || 20)).toFixed(1) + 'px'; });
      if (neb) neb.style.translate = '0 ' + (-p * 30).toFixed(1) + 'px';
    }
    function req() { if (!raf) raf = requestAnimationFrame(upd); }
    W.addEventListener('scroll', req, { passive: true });
    W.addEventListener('resize', req);
    E2M.on('prefs:change', req);
    req();
  }
  /* R3.7 performance: CSS loops (flames, lamps, flags, motes…) in sections that are off screen hold still, so
     the 60fps budget is spent only on what can be seen. Sections un-pause ~200px before they scroll in. */
  function initAwayPause() {
    if (!('IntersectionObserver' in W)) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { en.target.classList.toggle('is-away', !en.isIntersecting); });
    }, { rootMargin: '200px 0px' });
    $$('.zone, .opening, .site-foot').forEach(function (el) { io.observe(el); });
  }
  function initHeadParallax() {
    if (!fine) return;
    var ev = null, raf = 0, last = null;
    D.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      ev = e; if (!raf) raf = requestAnimationFrame(apply);
    }, { passive: true });
    function apply() {
      raf = 0;
      if (!ev || E2M.reduced || E2M.isPaused()) return;
      var nx = (ev.clientX / W.innerWidth - 0.5) * 2, ny = (ev.clientY / W.innerHeight - 0.5) * 2;
      var zs = D.querySelectorAll('.zone.is-active');
      if (last && last.length) Array.prototype.forEach.call(last, function (z) { if (!z.classList.contains('is-active')) { z.style.removeProperty('--px'); z.style.removeProperty('--py'); } });
      Array.prototype.forEach.call(zs, function (z) { z.style.setProperty('--px', nx.toFixed(3)); z.style.setProperty('--py', ny.toFixed(3)); });
      last = zs;
    }
  }

  /* ================================================================== */
  /* World props: bells, lanterns, hidden diyas, decorative clicks        */
  /* ================================================================== */
  var bellToast = false;
  function initBells() {
    $$('.bell').forEach(function (b) {
      b.addEventListener('click', function () {
        b.classList.remove('is-ringing'); void b.offsetWidth; b.classList.add('is-ringing');
        E2M.audio.play('bell', { pitch: parseFloat(b.getAttribute('data-pitch')) || 560 });
        var c = centerOf(b); E2M.fx.sparkBurst(c.x, c.r.bottom - 4, '#FFD778', 8); if (E2M.haptic) E2M.haptic('light');
        if (E2M.impact) E2M.impact(0.22, { x: c.x, y: c.r.bottom - 6, color: '#FFD778', kind: 'bell' });
        if (!E2M.audio.enabled && !bellToast) { bellToast = true; E2M.toast('Ding! Sound is off. Turn it on in Tools (or press M) to actually hear it.'); }
      });
    });
  }

  var LANTERN_LINES = ['This lantern is on a break. Union rules.', 'Lanterns: like deadlines, they drift if you let go.', 'Not a bug. A floating feature.', 'It glows. It floats. It has never once asked for a status update.'];
  var lanternToast = false;
  function initLanterns() {
    $$('.w-lantern').forEach(function (el) {
      var dx = 0, dy = 0, sx = 0, sy = 0, ox = 0, oy = 0, moved = false, pid = null;
      // Revision 2: inertia and sway — the lantern keeps drifting after you let go and swings on its cord
      var vx = 0, vy = 0, lastX = 0, lastY = 0, lastT = 0, sway = 0, swayV = 0, glide = 0;
      function setSway(v) { el.style.setProperty('--sway', v.toFixed(2) + 'deg'); }
      function physics() {
        glide = 0;
        var t = performance.now(), dt = Math.min(0.05, (t - lastT) / 1000 || 0.016); lastT = t;
        if (pid === null) { vx *= Math.pow(0.06, dt); vy *= Math.pow(0.06, dt); var px = dx, py = dy; set(dx + vx * dt, dy + vy * dt); if (dx === px) vx = 0; if (dy === py) vy = 0; }
        // damped pendulum driven by horizontal velocity
        var target = E2M.clamp(-vx * 0.035, -16, 16);
        swayV += ((target - sway) * 38 - swayV * 7) * dt; sway += swayV * dt;
        setSway(sway);
        if (Math.abs(vx) + Math.abs(vy) > 4 || Math.abs(sway) > 0.08 || Math.abs(swayV) > 0.08 || pid !== null) glide = requestAnimationFrame(physics);
        else { setSway(0); }
      }
      function kick() { if (!glide && !E2M.reduced) { lastT = performance.now(); glide = requestAnimationFrame(physics); } }
      function set(x, y) {
        var host = el.offsetParent || el.parentNode, hr = host.getBoundingClientRect();
        var bx = el.offsetLeft, by = el.offsetTop, ew = el.offsetWidth, eh = el.offsetHeight;
        dx = E2M.clamp(x, -bx + 4, hr.width - bx - ew - 4);
        dy = E2M.clamp(y, -by + 4, Math.max(hr.height, 300) - by - eh);
        el.style.setProperty('--dx', dx.toFixed(1) + 'px'); el.style.setProperty('--dy', dy.toFixed(1) + 'px');
      }
      el.addEventListener('pointerdown', function (e) {
        if (e.button > 0) return;
        pid = e.pointerId; try { el.setPointerCapture(pid); } catch (er) {}
        sx = e.clientX; sy = e.clientY; ox = dx; oy = dy; moved = false;
        vx = vy = 0; lastX = e.clientX; lastY = e.clientY; lastT = performance.now();
        el.classList.add('is-dragging'); el.classList.remove('is-flying');
      });
      el.addEventListener('pointermove', function (e) {
        if (pid !== e.pointerId) return;
        var mx = e.clientX - sx, my = e.clientY - sy;
        if (!moved && mx * mx + my * my < 25) return;
        moved = true; set(ox + mx, oy + my);
        var t = performance.now(), dtm = Math.max(8, t - lastT);
        vx = vx * 0.6 + (e.clientX - lastX) / dtm * 1000 * 0.4; vy = vy * 0.6 + (e.clientY - lastY) / dtm * 1000 * 0.4;
        lastX = e.clientX; lastY = e.clientY;
        kick();
      });
      function end(e) {
        if (pid !== e.pointerId) return;
        pid = null; el.classList.remove('is-dragging');
        if (performance.now() - lastT > 90) { vx = 0; vy = 0; }
        vx = E2M.clamp(vx, -1400, 1400); vy = E2M.clamp(vy, -1400, 1400);
        kick();
        if (moved && !lanternToast) { lanternToast = true; E2M.toast('Lantern relocated. Facilities has been notified.'); }
      }
      el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
      el.addEventListener('click', function () {
        if (moved) { moved = false; return; }
        var c = centerOf(el); E2M.fx.sparkBurst(c.x, c.y, '#FFD778', 10); E2M.audio.play('sparkle');
        if (Math.random() < 0.6) E2M.toast(pick(LANTERN_LINES));
      });
      el.addEventListener('keydown', function (e) {
        var step = e.shiftKey ? 48 : 14, k = e.key;
        if (k === 'ArrowLeft') { set(dx - step, dy); vx = -260; } else if (k === 'ArrowRight') { set(dx + step, dy); vx = 260; }
        else if (k === 'ArrowUp') set(dx, dy - step); else if (k === 'ArrowDown') set(dx, dy + step);
        else return;
        e.preventDefault();
        if (pid === null) { setTimeout(function () { vx = 0; }, 0); swayV += (k === 'ArrowLeft' ? 30 : k === 'ArrowRight' ? -30 : 0); kick(); }
      });
      el._e2mFly = function () {
        if (E2M.reduced) return;
        el.classList.add('is-flying'); el.style.setProperty('--dy', (-(el.offsetTop + 260)) + 'px');
        setTimeout(function () { el.classList.remove('is-flying'); el.style.setProperty('--dx', '0px'); el.style.setProperty('--dy', '0px'); dx = dy = 0; }, 11000);
      };
    });
  }

  function initHiddenDiyas() {
    $$('.hidden-diya').forEach(function (b) {
      b.style.setProperty('--gd', rand(0, 6).toFixed(2) + 's');
      b.addEventListener('click', function () {
        var c = centerOf(b);
        if (b.classList.contains('is-found')) { E2M.fx.sparkBurst(c.x, c.y, '#FFD778', 6); return; }
        b.classList.add('is-found', 'is-shimmer');
        setTimeout(function () { b.classList.remove('is-shimmer'); }, 1500);
        b.setAttribute('aria-label', 'Hidden diya found and lit');
        E2M.fx.sparkBurst(c.x, c.y, '#FFD778', 22);
        E2M.fx.flash(c.x, c.y, '#FFD778', 80);
        E2M.audio.play('chime'); setTimeout(function () { E2M.audio.play('sparkle'); }, 160);
        if (E2M.impact) E2M.impact(0.2, { x: c.x, y: c.y, color: '#FFD778', kind: 'found', haptic: 'success' });
        E2M.found(b.getAttribute('data-hid'));
      });
    });
  }

  function initDecorClicks() {
    D.addEventListener('click', function (e) {
      var t = e.target;
      if (!t.closest || t.closest('button, a, input, select, textarea, label, [role="button"], [tabindex], canvas, .zone-stage, .hud, .e2m-toasts')) return;
      if (!t.closest('.zone, .opening, .site-foot')) return;
      if (t.closest('.zone--fireworks')) return; // R3: that whole zone is the fireworks launch surface
      // Revision 1: a click on the scenery answers with a small gold glint, not a confetti spray.
      E2M.fx.sparkBurst(e.clientX, e.clientY, '#FFD778', 10);
      if (Math.random() < 0.3) E2M.audio.play('sparkle');
    });
  }

  function initGlow() {
    if (!fine) return;
    var pending = null, ev = null;
    D.addEventListener('pointermove', function (e) {
      ev = e;
      if (pending) return;
      pending = requestAnimationFrame(function () {
        pending = null;
        var t = ev.target.closest && ev.target.closest('[data-glow]');
        if (!t) return;
        var r = t.getBoundingClientRect();
        t.style.setProperty('--mx', ((ev.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        t.style.setProperty('--my', ((ev.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      });
    }, { passive: true });
  }

  function initPetals() {
    if (E2M.reduced) return;
    // Revision 1: ambient petals cut by ~85% — a few, rarely.
    setInterval(function () {
      if (!entered || D.hidden || finalePlaying || E2M.reduced || E2M.isPaused()) return;
      E2M.fx.petals(E2M.mobile ? 2 : 3, { calm: true });
    }, 26000);
  }

  /* ================================================================== */
  /* Finale                                                               */
  /* ================================================================== */
  var finalePlaying = false;
  /* Revision 3: the finale is a glowing Hindu temple complex — a central Nagara shikhara with its clustered
     spires on a stepped jagati, pillared mandapas, two Dravidian gopurams, deepmala lamp towers and prakara walls.
     Every building draws itself in gold (one path per building), its doors and niches warm up, and its lamps
     and outline strings come on as bulbs. */
  function templeSVG() {
    var T = E2M.temple, k = T.kit(), x;
    k.steps(430, 1170, 600, 6, 20);
    k.shikhara(800, 480, 220, 410, { spires: 2, lit: 0.7 });
    k.mandapa(462, 480, 132, 150, { lit: 0.55 });
    k.mandapa(1006, 480, 132, 150, { lit: 0.55 });
    k.gopuram(238, 600, 236, 350, { tiers: 5, kalashas: 5, flag: true, lit: 0.62 });
    k.gopuram(1362, 600, 236, 350, { tiers: 5, kalashas: 5, flag: true, lit: 0.62 });
    k.deepmala(398, 600, 300); k.deepmala(1202, 600, 300);
    k.deepmala(48, 600, 232); k.deepmala(1552, 600, 232);
    k.wall(-40, 600, 160, 92); k.wall(1480, 600, 160, 92);
    var groups = {}, order = [];
    k.sil.forEach(function (s0) { if (!groups[s0.z]) { groups[s0.z] = []; order.push(s0.z); } groups[s0.z].push(s0.d); });
    var sil = '', lines = '', wins = '', lit = '', bulbs = '', bi = 0, cols = ['#FFD778', '#FFE7A3', '#FFF4DC', '#FFB547'];
    function dl(z) { return (0.1 + (z % 40) * 0.055).toFixed(2); }
    order.forEach(function (z) { var d = groups[z].join(''); sil += d; lines += '<path class="fp-draw" pathLength="1" style="--d:' + dl(z) + 's" d="' + d + '"/>'; });
    k.win.forEach(function (w) { wins += '<path d="' + w.d + '"/>'; lit += '<path class="fp-lit" style="--d:' + dl(w.z) + 's" data-o="' + w.o.toFixed(2) + '" d="' + w.d + '"/>'; });
    function bulb(px, py, base, r) { bulbs += '<circle class="fp-bulb" cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="' + (r || 3.2) + '" fill="' + cols[bi++ % 4] + '" style="--d:' + (base + bi * 0.005).toFixed(3) + 's"/>'; }
    k.lamp.forEach(function (l) { bulb(l[0], l[1], 0.8, Math.max(2.4, l[2] * 1.3)); });
    // strings of lights up every tower outline, along the jagati and the mandapa eaves
    k.pts.forEach(function (pts, n) { var big = n === k.pts.length - 1 || pts[0][0] > 700 && pts[0][0] < 900; pts.forEach(function (pt, m) { if (m % (big ? 1 : 2) === 0) bulb(pt[0], pt[1], 1.05 + n * 0.02, 3); }); });
    for (x = 444; x <= 1156; x += 22) bulb(x, 480, 0.9);
    for (x = 330; x <= 1270; x += 26) if (x < 440 || x > 1160) bulb(x, 540, 0.7, 2.6);
    var flags = k.flag.map(function (f, i) { return '<path class="tk-flag" style="animation-delay:-' + (i * 0.7 % 3).toFixed(2) + 's" d="' + f.d + '"/>'; }).join('');
    return '<svg viewBox="0 0 1600 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' +
      '<defs><filter id="fp-glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '<radialGradient id="fp-aura" cx="50%" cy="62%" r="50%"><stop offset="0" stop-color="#FFB547" stop-opacity=".34"/><stop offset=".5" stop-color="#FF9F32" stop-opacity=".1"/><stop offset="1" stop-color="#FF9F32" stop-opacity="0"/></radialGradient></defs>' +
      '<ellipse class="fp-lit" style="--d:.6s" cx="800" cy="420" rx="760" ry="330" fill="url(#fp-aura)"/>' +
      '<path fill="#080A1E" stroke="#FFD778" stroke-opacity=".12" stroke-width="1" vector-effect="non-scaling-stroke" d="' + sil + '"/>' +
      '<path fill="none" stroke="#FFD778" stroke-opacity=".06" stroke-width="1" vector-effect="non-scaling-stroke" d="' + k.line.map(function (l) { return l.d; }).join('') + '"/>' +
      '<g fill="#0E1030">' + wins + '</g><g fill="url(#g-warm)">' + lit + '</g>' +
      '<g fill="none" stroke="#FFD778" stroke-width="1.4" filter="url(#fp-glow)">' + lines + '</g>' +
      '<g filter="url(#fp-glow)">' + bulbs + '</g><g class="tk-flags" fill="#C8642C">' + flags + '</g></svg>';
  }

  E2M.register('finale', (function () {
    var stage, finEl, floorEl, eng, palace, go, reveal, replay, scoreEl, fnDiya, ambientT = 0, active = false;
    // Before the button is pressed the sky here is almost still: a rare, small gold bloom.
    function ambient() {
      clearTimeout(ambientT);
      if (!active || E2M.reduced) return;
      if (!D.hidden && !finalePlaying && eng && !E2M.isPaused()) eng.firework(eng.w * pick([rand(0.08, 0.3), rand(0.7, 0.92)]), eng.h * rand(0.1, 0.3), { rocket: true, fromY: eng.h * 0.7, type: pick(['peony', 'willow', 'chrysanthemum']), color: pick(['gold', 'rainbow']), size: rand(0.4, 0.6), distance: 0.6, gain: 0.5 });
      ambientT = setTimeout(ambient, rand(5200, 8400));
    }
    function revealText() {
      reveal.classList.add('is-on');
      var n = E2M.state.found.length;
      scoreEl.textContent = n + '/7 hidden diyas found. ' + (n >= 7 ? 'Show-off. We love it.' : (n === 0 ? 'They are still up there somewhere, quietly glowing.' : 'The rest are still partying somewhere up there.'));
      if (replay) replay.disabled = false;
      if (!gsap || E2M.reduced) return;
      var lines = $$('.fn-hello-line', reveal);
      lines.forEach(function (l) { if (!l.firstElementChild) l.innerHTML = '<span>' + l.textContent + '</span>'; });
      gsap.timeline()
        .fromTo('.fn-kicker', { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 1.4, ease: 'power3.out' }, 0)
        .fromTo($$('.fn-hello-line > span', reveal), { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 2.2, stagger: 0.24, ease: 'expo.out' }, 0.1)
        .fromTo('.fn-stamps', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 1.6, ease: 'power3.out' }, 0.9)
        .fromTo('.fn-thanks', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1.8, ease: 'power3.out' }, 1)
        .fromTo(['.fn-replay', '.fn-score'], { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 1.4, stagger: 0.16, ease: 'power3.out' }, 1.8);
    }
    function play() {
      if (finalePlaying) return;
      finalePlaying = true;
      H.classList.add('finale-on');
      go.classList.add('is-gone');
      setTimeout(function () { if (finalePlaying) go.hidden = true; }, 800);
      reveal.classList.remove('is-on');
      palace.classList.add('is-instant'); palace.classList.remove('is-lit'); fnDiya.classList.remove('is-lit');
      void palace.offsetWidth; palace.classList.remove('is-instant');
      // Frame the whole finale in the viewport: palace on the floor, headline in clear sky above it.
      var ft = finEl.getBoundingClientRect().top + W.pageYOffset;
      W.scrollTo({ top: ft, behavior: E2M.reduced ? 'auto' : 'smooth' });
      var vw = W.innerWidth, vh = W.innerHeight;
      var cy = vh * 0.3, cx = vw / 2;
      E2M.emit('finale:start');
      E2M.audio.play('finale');
      safe(E2M.lightAllDiyas);
      safe(function () { var r = E2M.rangoliAnimate && E2M.rangoliAnimate({ target: floorEl, hold: 5200 }); if (r && r.catch) r.catch(function () {}); });
      safe(E2M.releaseLanterns);
      if (E2M.announce) E2M.announce('The grand finale is playing. Happy Diwali, E2M Family!', { assertive: false });
      setTimeout(function () { palace.classList.add('is-lit'); }, 200);
      setTimeout(function () { fnDiya.classList.add('is-lit'); }, 700);
      $$('.w-lantern').forEach(function (l) { if (l._e2mFly) l._e2mFly(); });
      if (E2M.reduced) {
        E2M.fx.sparkBurst(cx, cy, '#FFD778', 40);
        setTimeout(revealText, 300);
        setTimeout(done, 1500);
        return;
      }
      E2M.fx.flash(cx, cy, '#FFF4DC', Math.max(vw, vh) * 0.8);
      E2M.fx.firework(cx, cy, { type: 'mega', size: E2M.mobile ? 1.5 : 2.1, color: 'gold', distance: 0.15 });
      if (E2M.screenGlow) { E2M.screenGlow('#FFD778', 1, cx, cy); setTimeout(function () { E2M.screenGlow('#FF9F32', 0.8, cx, vh * 0.75); }, 1400); setTimeout(function () { E2M.screenGlow(E2M.nextHue ? E2M.nextHue() : '#FF6FD0', 0.7, cx, vh * 0.3); }, 6900); }
      // the one maximal moment: a sustained, damped rumble, then two softer aftershocks
      if (E2M.impact) {
        E2M.impact(1, { x: cx, y: cy, color: '#FFD778', kind: 'rumble' }); E2M.audio.play('rumble');
        setTimeout(function () { E2M.impact(0.5, { x: cx, y: vh * 0.28, color: '#FFD778', kind: 'finale' }); }, 2150);
        setTimeout(function () { E2M.impact(0.55, { x: cx, y: vh * 0.3, color: '#FF6FD0', kind: 'finale' }); }, 6850);
      }
      E2M.fx.fireworkShow(9500, { intensity: 2 });
      if (eng) eng.show(9000, { intensity: 1.4 });
      setTimeout(function () {
        E2M.fx.confetti(0, vh, 90, { angle: -Math.PI / 3, spread: 0.7, power: 1150 });
        E2M.fx.confetti(vw, vh, 90, { angle: -2 * Math.PI / 3, spread: 0.7, power: 1150 });
      }, 550);
      setTimeout(function () { E2M.fx.petals(40); }, 900);
      setTimeout(function () { E2M.fx.firework(cx, vh * 0.28, { type: 'text', text: 'E2M', size: E2M.mobile ? 0.9 : 1.3, color: 'gold' }); }, 2100);
      setTimeout(function () { revealText(); E2M.fx.goldenRain(200); }, 3300);
      setTimeout(function () {
        E2M.fx.confetti(vw * 0.3, vh, 70, { power: 1000 });
        E2M.fx.confetti(vw * 0.7, vh, 70, { power: 1000 });
        E2M.fx.petals(50);
      }, 5600);
      setTimeout(function () { E2M.fx.firework(cx, vh * 0.3, { type: 'heart', size: 1.4 }); }, 6800);
      // rainbow volleys from the temple town at both edges of the screen
      [1200, 2600, 4200, 5200, 7600, 8600].forEach(function (t0, n) { setTimeout(function () { var side = n % 2 ? rand(0.06, 0.24) : rand(0.76, 0.94); E2M.fx.firework(vw * side, vh * rand(0.12, 0.3), { rocket: true, fromY: vh + 10, type: pick(['peony', 'chrysanthemum', 'ring', 'palm']), color: 'rainbow', size: rand(0.9, 1.25), distance: 0.3 }); }, t0); });
      setTimeout(done, 10500);
    }
    function done() { finalePlaying = false; H.classList.remove('finale-on'); }
    E2M.on('motion:pause', function () { clearTimeout(ambientT); if (eng && !finalePlaying) eng.pause(); });
    E2M.on('motion:resume', function () { if (active) { if (eng) eng.resume(); ambient(); } });
    return {
      mount: function (el) {
        stage = el; finEl = $('.finale', el); floorEl = $('.fn-floor', el);
        palace = $('.fn-palace', el); go = $('.fn-go', el); reveal = $('.fn-reveal', el); replay = $('.fn-replay', el); scoreEl = $('[data-finale-score]', el);
        palace.innerHTML = templeSVG();
        $$('.fp-lit[data-o]', palace).forEach(function (w) { w.style.setProperty('--o', Math.min(1, parseFloat(w.getAttribute('data-o')) * 1.5 + 0.25).toFixed(2)); });
        fnDiya = D.createElement('div'); fnDiya.className = 'fn-diya'; fnDiya.setAttribute('aria-hidden', 'true');
        fnDiya.innerHTML = '<span class="fn-diya-glow"></span><svg viewBox="0 0 64 40"><use href="#i-diya"/></svg><span class="e2m-flame"><i></i></span>';
        el.querySelector('.finale').appendChild(fnDiya);
        // R3.4: the finale's sky is full screen (a fixed layer under the temple and the headline)
        var layer = E2M.screenLayer ? E2M.screenLayer('finale', { dprMax: 1.5 }) : null;
        if (layer) eng = E2M.fx.engine(layer.canvas, { trails: true, fade: 0.14, fullscreen: true, dprMax: 1.5, cap: E2M.mobile ? 280 : 650 });
        go.addEventListener('click', function () { if (E2M.haptic) E2M.haptic('success'); play(); });
        replay.addEventListener('click', play);
        W.addEventListener('resize', function () { if (eng) eng.resize(); });
      },
      onEnter: function () { active = true; H.classList.add('finale-zone'); if (eng) { eng.resize(); eng.resume(); } ambient(); },
      onLeave: function () { active = false; H.classList.remove('finale-zone'); clearTimeout(ambientT); if (eng && !finalePlaying) eng.pause(); }
    };
  })());

  /* ================================================================== */
  /* Usability (Revision 2): per-zone "how to" hints + first-zone scroll cue */
  /* ================================================================== */
  function initHints() {
    $$('.zone').forEach(function (z) {
      var hint = $('.zh-hint[data-hint]', z), stage = $('.zone-stage', z), off = false;
      if (!hint || !stage) return;
      function done(e) {
        if (off) return;
        if (e && e.type === 'keydown' && !/^(Enter| |Spacebar|Arrow)/.test(e.key)) return;
        off = true;
        hint.classList.add('is-done');
      }
      // collapse the hint only AFTER the press is released, so the layout shift
      // can never move the control out from under the pointer and eat the click
      stage.addEventListener('pointerdown', function (e) {
        if (off) return;
        var fin = function () {
          W.removeEventListener('pointerup', fin, true);
          W.removeEventListener('pointercancel', fin, true);
          setTimeout(function () { done(e); }, 0);
        };
        W.addEventListener('pointerup', fin, true);
        W.addEventListener('pointercancel', fin, true);
      }, true);
      stage.addEventListener('keydown', done, true);
      stage.addEventListener('input', done, true);
    });
  }
  function initScrollCue() {
    var cue = $('.scroll-cue'), fw = D.getElementById('zone-fireworks'), gone = false;
    if (!cue || !fw) return;
    function hide() { if (gone) return; gone = true; cue.classList.add('is-gone'); setTimeout(function () { H.classList.remove('show-scroll-cue'); }, 1100); }
    function onS() { if (!gone && entered && fw.getBoundingClientRect().top < -160) hide(); }
    E2M.on('world:enter', function () { if (!gone) { H.classList.add('show-scroll-cue'); setTimeout(hide, 14000); } });
    W.addEventListener('scroll', onS, { passive: true });
  }
  E2M.on('motion:pause', function () { stopOpeningLoops(); });
  E2M.on('motion:resume', function () { if (opOn) startOpeningLoops(); });

  /* ================================================================== */
  /* Boot                                                                 */
  /* ================================================================== */
  function boot() {
    buildStars(); buildGarlands(); buildMandala();
    initOpening(); initHud(); initProgress(); initStory();
    initBells(); initLanterns(); initHiddenDiyas(); initDecorClicks(); initGlow(); initPetals();
    initHints(); initScrollCue(); initSkyDepth(); initHeadParallax(); initAwayPause();
    if (E2M.ambient) E2M.ambient.boost(1); // R7: the Fireworks zone's background show runs at full life (was .85)
    D.addEventListener('visibilitychange', function () { if (!D.hidden && ST) ST.refresh(); });
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', boot); else boot();
})();
