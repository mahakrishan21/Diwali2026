/* E2M Diwali — core engine (window.E2M). Loaded first, defer, non-module.
   Contract: assets/foundation/CONTRACT.md  */
(function () {
  'use strict';
  var W = window, D = document;
  var E2M = W.E2M = W.E2M || {};
  var TAU = Math.PI * 2;

  /* ------------------------------------------------------------------ */
  /* Environment flags                                                    */
  /* ------------------------------------------------------------------ */
  var mqReduce = W.matchMedia ? W.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var mqCoarse = W.matchMedia ? W.matchMedia('(pointer: coarse)') : { matches: false };
  var mqFine = W.matchMedia ? W.matchMedia('(pointer: fine)') : { matches: true };
  E2M.reduced = !!mqReduce.matches;
  E2M.mobile = !!mqCoarse.matches || W.innerWidth < 760;
  E2M.maxParticles = E2M.reduced ? 150 : (E2M.mobile ? 350 : 900);
  E2M.state = E2M.state || {};
  if (!Array.isArray(E2M.state.diyas)) E2M.state.diyas = [];
  E2M.state.found = [];
  E2M.foundTotal = 7;

  /* ------------------------------------------------------------------ */
  /* Small helpers                                                        */
  /* ------------------------------------------------------------------ */
  E2M.rand = function (a, b) {
    if (b === undefined) { b = a === undefined ? 1 : a; a = 0; }
    return a + Math.random() * (b - a);
  };
  E2M.pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
  E2M.clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };
  E2M.svg = function (str) {
    var s = String(str || '').trim();
    var t = D.createElement('template');
    t.innerHTML = /^<svg[\s>]/i.test(s) ? s : '<svg xmlns="http://www.w3.org/2000/svg">' + s + '</svg>';
    return t.content.firstElementChild;
  };
  var rand = E2M.rand, pick = E2M.pick;

  /* ------------------------------------------------------------------ */
  /* Events                                                               */
  /* ------------------------------------------------------------------ */
  var handlers = {};
  E2M.on = function (evt, fn) {
    (handlers[evt] = handlers[evt] || []).push(fn);
    return function () { E2M.off(evt, fn); };
  };
  E2M.off = function (evt, fn) {
    var h = handlers[evt]; if (!h) return;
    var i = h.indexOf(fn); if (i > -1) h.splice(i, 1);
  };
  E2M.emit = function (evt, data) {
    (handlers[evt] || []).slice().forEach(function (fn) {
      try { fn(data); } catch (e) { console.error('[E2M] handler for "' + evt + '" failed', e); }
    });
  };

  /* ------------------------------------------------------------------ */
  /* Preferences (Revision 2 — the Toolkit)                               */
  /* E2M.prefs = { shake, motion:'standard'|'calm', intensity:'calm'|     */
  /*   'standard'|'max', textScale:1|1.12|1.25, contrast, volume 0..1,    */
  /*   paused }. Persisted in localStorage 'e2m-diwali:prefs'.            */
  /* E2M.setPrefs(patch) merges, persists, applies and emits              */
  /* 'prefs:change' { prefs, changed:[keys] }.                            */
  /* ------------------------------------------------------------------ */
  var PREF_KEY = 'e2m-diwali:prefs';
  var SYS_REDUCED = !!mqReduce.matches;
  E2M.systemReduced = SYS_REDUCED;
  /* Revision 7: motionExplicit = the visitor picked Motion (Calm or Standard) themselves in Tools. Without it,
     an OS reduced-motion flag still makes the site calm, but it no longer silently switches off the Fireworks
     Playground's own show (that zone shows a one-time chip with a "Turn off" instead). */
  var PREF_DEFAULTS = { shake: true, motion: SYS_REDUCED ? 'calm' : 'standard', motionExplicit: false, intensity: 'standard', textScale: 1, contrast: false, volume: 0.8, paused: false, haptics: true };
  function cleanPrefs(p) {
    var d = PREF_DEFAULTS, o = {};
    o.shake = typeof p.shake === 'boolean' ? p.shake : d.shake;
    o.motion = p.motion === 'calm' || p.motion === 'standard' ? p.motion : d.motion;
    o.motionExplicit = typeof p.motionExplicit === 'boolean' ? p.motionExplicit : d.motionExplicit;
    o.intensity = /^(calm|standard|max)$/.test(p.intensity) ? p.intensity : d.intensity;
    var ts = Number(p.textScale); o.textScale = isFinite(ts) ? Math.max(1, Math.min(1.25, ts)) : d.textScale;
    o.contrast = typeof p.contrast === 'boolean' ? p.contrast : d.contrast;
    var v = Number(p.volume); o.volume = isFinite(v) ? Math.max(0, Math.min(1, v)) : d.volume;
    o.paused = typeof p.paused === 'boolean' ? p.paused : d.paused;
    o.haptics = typeof p.haptics === 'boolean' ? p.haptics : d.haptics;
    return o;
  }
  function loadPrefs() {
    var raw = null;
    try { raw = JSON.parse(W.localStorage.getItem(PREF_KEY) || 'null'); } catch (e) { raw = null; }
    var p = {}, k;
    for (k in PREF_DEFAULTS) p[k] = PREF_DEFAULTS[k];
    if (raw && typeof raw === 'object') for (k in raw) if (k in PREF_DEFAULTS) p[k] = raw[k];
    return cleanPrefs(p);
  }
  E2M.prefs = loadPrefs();
  var INTENSITY = { calm: 0.5, standard: 1, max: 1.3 };
  /* calm = system reduced motion OR the Toolkit "Calm" motion setting. Activities keep reading E2M.reduced,
     which now mirrors calm mode live, so the Calm toggle cascades without per-activity changes. */
  E2M.isCalm = function () { var p = E2M.prefs; return p.motionExplicit ? p.motion === 'calm' : (SYS_REDUCED || p.motion === 'calm'); };
  E2M.isPaused = function () { return !!E2M.prefs.paused; };
  /* Revision 7: Calm the visitor chose (not just inherited from the OS). Only this — or Pause — stops the
     Fireworks Playground's show, shake and haptics. E2M.fwLive() = that zone may run its full show. */
  function calmExplicit() { var p = E2M.prefs; return p.motion === 'calm' && (p.motionExplicit || !SYS_REDUCED); }
  E2M.calmExplicit = calmExplicit;
  E2M.fwLive = function () { return !E2M.prefs.paused && !calmExplicit(); };
  E2M.osReducedOnly = function () { return SYS_REDUCED && !E2M.prefs.motionExplicit; };
  E2M.intensity = function () { return E2M.isCalm() ? Math.min(0.5, INTENSITY[E2M.prefs.intensity]) : INTENSITY[E2M.prefs.intensity]; };
  function baseParticles() { return E2M.isCalm() ? 150 : (E2M.mobile ? 350 : 900); }
  function applyPrefs() {
    var p = E2M.prefs, h = D.documentElement;
    E2M.reduced = E2M.isCalm();
    E2M.maxParticles = Math.round(baseParticles() * (E2M.isCalm() ? 1 : INTENSITY[p.intensity]));
    if (h) {
      h.classList.toggle('is-calm', E2M.isCalm());
      h.classList.toggle('is-contrast', !!p.contrast);
      h.classList.toggle('is-paused', !!p.paused);
      h.classList.toggle('no-shake', !p.shake || E2M.isCalm());
      h.classList.toggle('fw-calm', !E2M.fwLive());
      h.style.fontSize = p.textScale > 1 ? (p.textScale * 100).toFixed(1) + '%' : '';
      h.setAttribute('data-intensity', p.intensity);
    }
    if (typeof fxEng !== 'undefined' && fxEng) fxEng.cap = E2M.maxParticles;
    if (typeof A !== 'undefined' && A.master) { try { A.master.gain.value = 0.7 * p.volume; } catch (e) {} }
  }
  E2M.setPrefs = function (patch) {
    patch = patch || {};
    var prev = E2M.prefs, next = {}, k, changed = [];
    for (k in prev) next[k] = prev[k];
    for (k in patch) if (k in PREF_DEFAULTS) next[k] = patch[k];
    next = cleanPrefs(next);
    for (k in next) if (next[k] !== prev[k]) changed.push(k);
    if (!changed.length) return E2M.prefs;
    // mutate in place so modules holding a reference to E2M.prefs stay current
    for (k in next) prev[k] = next[k];
    try { W.localStorage.setItem(PREF_KEY, JSON.stringify(prev)); } catch (e) {}
    applyPrefs();
    E2M.emit('prefs:change', { prefs: prev, changed: changed });
    if (changed.indexOf('paused') > -1) E2M.emit(prev.paused ? 'motion:pause' : 'motion:resume', prev);
    return prev;
  };
  E2M.setPref = function (key, val) { var o = {}; o[key] = val; return E2M.setPrefs(o); };
  E2M.resetPrefs = function () { var o = {}, k; for (k in PREF_DEFAULTS) o[k] = PREF_DEFAULTS[k]; return E2M.setPrefs(o); };
  E2M.prefDefaults = PREF_DEFAULTS;
  applyPrefs();
  if (mqReduce.addEventListener) mqReduce.addEventListener('change', function (e) {
    SYS_REDUCED = E2M.systemReduced = !!e.matches; applyPrefs();
    E2M.emit('prefs:change', { prefs: E2M.prefs, changed: ['motion'] });
  });

  /* ------------------------------------------------------------------ */
  /* Screen-reader announcements: E2M.announce(msg, { assertive })        */
  /* Uses #e2m-live / #e2m-live-assertive (index.html). Throttled: at     */
  /* most one message per 900ms (latest wins), identical text within 2.5s */
  /* is dropped; assertive messages jump the queue.                       */
  /* ------------------------------------------------------------------ */
  var liveQ = null, liveT = 0, liveLast = '', liveLastAt = 0, liveAt = 0;
  function liveNode(assertive) {
    var id = assertive ? 'e2m-live-assertive' : 'e2m-live', el = D.getElementById(id);
    if (!el && D.body) {
      el = D.createElement('div'); el.id = id; el.className = 'sr-only';
      el.setAttribute('aria-live', assertive ? 'assertive' : 'polite'); el.setAttribute('aria-atomic', 'true');
      if (assertive) el.setAttribute('role', 'alert'); else el.setAttribute('role', 'status');
      D.body.appendChild(el);
    }
    return el;
  }
  function liveFlush() {
    liveT = 0;
    if (!liveQ) return;
    var m = liveQ; liveQ = null;
    var el = liveNode(m.assertive); if (!el) return;
    liveAt = performance.now(); liveLast = m.msg; liveLastAt = liveAt;
    el.textContent = '';
    setTimeout(function () { el.textContent = m.msg; }, 40);
  }
  E2M.announce = function (msg, opts) {
    msg = String(msg == null ? '' : msg).replace(/\s+/g, ' ').trim();
    if (!msg) return;
    var now = performance.now(), assertive = !!(opts && opts.assertive);
    if (msg === liveLast && now - liveLastAt < 2500) return;
    liveQ = { msg: msg, assertive: assertive };
    var wait = assertive ? 0 : Math.max(0, 900 - (now - liveAt));
    if (liveT) clearTimeout(liveT);
    liveT = setTimeout(liveFlush, wait);
  };

  /* ------------------------------------------------------------------ */
  /* Revision 4 — Haptics                                                 */
  /* E2M.haptic(nameOrPattern, power 0..1?) -> boolean (true = vibrated)  */
  /*  names: tap 10ms · select 6 · light 15 · medium 25 · thump 45 ·      */
  /*  success [18,40,28] · error|miss [12,30,12] · win [25,50,25,50,60] · */
  /*  burst (power-scaled 20-60ms + short tail) · rumble (patterned buzz, */
  /*  power-scaled, <= ~400ms). A number (ms) or an array pattern also    */
  /*  works. Feature-detected (navigator.vibrate; iOS Safari has none),   */
  /*  only after a user gesture, gated by E2M.prefs.haptics; in Calm only */
  /*  'tap'/'select' pass. Rate-limited: >= 35ms between calls and a long */
  /*  pattern is never interrupted by another one. E2M.hapticsSupported.  */
  /* ------------------------------------------------------------------ */
  var NAV = W.navigator || {};
  /* R7: desktop Chrome/Firefox expose navigator.vibrate but have no motor (the call is a silent no-op), so
     "supported" also needs a phone/tablet: a coarse primary pointer or a mobile user agent. */
  var HAPTIC_API = typeof NAV.vibrate === 'function';
  var HAPTIC_OK = HAPTIC_API && (mqCoarse.matches || /Android|Mobi|iPad|Tablet/i.test(NAV.userAgent || '') || !!(NAV.userAgentData && NAV.userAgentData.mobile));
  E2M.hapticsSupported = HAPTIC_OK;
  /* Revision 7 (Fireworks Playground): richer patterns.
     rocket   rising quick pulses (the climb)          charge  one growing tick (call every ~120ms)
     burst    power-scaled thump + a decaying echo tail of 2 pulses, timed to the audio echo delays
     grand    long rumble (GO CRAZY, grand shells)      bijli   huge thump + echo tail
     ladi     one sharp tick per bang                   fizz    a soft buzz (anar, chakri, phuljhadi) */
  function echoGaps() { var t = (typeof echoTapTimes === 'function') ? echoTapTimes() : null; return t && t.length ? t : [0.24, 0.5]; }
  function echoTail(thump, p, k) {
    var g = echoGaps(), d1 = Math.round(g[0] * 1000), d2 = Math.round((g[1] || g[0] * 2.05) * 1000);
    var e1 = Math.round((8 + 10 * p) * (k || 1)), e2 = Math.round((5 + 6 * p) * (k || 1));
    return [thump, Math.max(24, d1 - thump), e1, Math.max(24, d2 - d1 - e1), e2];
  }
  var HAPTICS = {
    tap: 10, select: 6, light: 15, medium: 25, thump: 45,
    success: [18, 40, 28], error: [12, 30, 12], miss: [12, 30, 12], win: [25, 50, 25, 50, 60],
    burst: function (p) { return echoTail(Math.round(22 + 48 * p), p); },
    rumble: function (p) {
      var k = 0.55 + 0.45 * p;
      return [Math.round(42 * k), 26, Math.round(36 * k), 26, Math.round(30 * k), 26, Math.round(24 * k), 26, Math.round(16 * k)];
    },
    rocket: function (p) { var k = 0.75 + 0.5 * p; return [Math.round(7 * k), 34, Math.round(9 * k), 27, Math.round(12 * k), 21, Math.round(15 * k), 16, Math.round(19 * k)]; },
    charge: function (p) { return Math.round(5 + 18 * p); },
    grand: function (p) { var k = 0.7 + 0.3 * p; return [Math.round(60 * k), 22, Math.round(52 * k), 22, Math.round(46 * k), 22, Math.round(40 * k), 22, Math.round(34 * k), 22, Math.round(26 * k), 22, Math.round(18 * k)]; },
    bijli: function (p) { return echoTail(Math.round(70 + 30 * p), 1, 1.4); },
    ladi: 9, fizz: 14
  };
  var hapGesture = false, hapLast = 0, hapBusyUntil = 0, hapLastAuto = 0, hapZoneFw = false, hapLastName = '', HAP_PRIORITY = { grand: 1, bijli: 1, rumble: 1 };
  E2M.on('zone:enter', function (k) { if (k === 'fireworks') hapZoneFw = true; });
  E2M.on('zone:leave', function (k) { if (k === 'fireworks') hapZoneFw = false; });
  function hapArm() { hapGesture = true; }
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (t) { W.addEventListener(t, hapArm, { capture: true, passive: true }); });
  function hapPattern(name, p) {
    if (typeof name === 'number') return Math.max(1, Math.min(400, Math.round(name)));
    if (Array.isArray(name)) return name.slice(0, 12).map(function (v) { return Math.max(0, Math.min(400, Math.round(Number(v) || 0))); });
    var h = HAPTICS[name];
    if (h == null) return null;
    return typeof h === 'function' ? h(p) : h;
  }
  function hapTotal(pat) { if (typeof pat === 'number') return pat; var t = 0; for (var i = 0; i < pat.length; i++) t += pat[i]; return t; }
  function hapGate(name) {
    if (!HAPTIC_OK || !E2M.prefs.haptics || D.hidden) return false;
    var act = NAV.userActivation;
    if (!(hapGesture || (act && act.hasBeenActive))) return false; // browsers ignore vibrate() before a gesture
    // R7: in the Fireworks Playground only a Calm the visitor chose quiets haptics (not the OS flag alone)
    var calm = hapZoneFw ? calmExplicit() : E2M.isCalm();
    if (calm && name !== 'tap' && name !== 'select') return false;
    return true;
  }
  var hapLog = [];
  function hapFire(name, power, auto) {
    if (!hapGate(name)) return false;
    var p = Math.max(0, Math.min(1, power == null ? 0.6 : Number(power) || 0));
    var pat = hapPattern(name, p);
    if (pat == null) return false;
    var now = performance.now();
    // an explicit call right after an automatic (impact) one replaces it; otherwise keep the 35ms floor
    var override = (!auto && hapLastAuto && now - hapLastAuto < 90) || (name === 'rocket' && hapLastName === 'charge'); // a launch replaces the last charge tick
    if (!override && now - hapLast < 35) return false;
    // never cut a long pattern short — except that the big ones (a grand rumble, a bijli bomb) replace a quieter
    // echo tail still playing (vibrate() swaps patterns, so they never overlap)
    if (!override && now < hapBusyUntil && !HAP_PRIORITY[name]) return false;
    var total = hapTotal(pat);
    hapLast = now; hapLastAuto = auto ? now : 0; hapLastName = name;
    hapBusyUntil = total > 60 ? now + total : 0;
    var ok = false;
    try { ok = NAV.vibrate(pat) !== false; } catch (e) { ok = false; }
    if (ok) {
      hapLog.push({ name: typeof name === 'string' ? name : 'custom', pattern: pat, at: Math.round(now) });
      if (hapLog.length > 60) hapLog.shift();
      E2M.emit('haptic', { name: name, pattern: pat, total: total, power: p });
    }
    return ok;
  }
  E2M.haptic = function (name, power) { return hapFire(name, power, false); };
  E2M.haptic.log = hapLog;

  /* ------------------------------------------------------------------ */
  /* Revision 4 — Impact + shake: TRANSLATE ONLY, never scale.            */
  /* E2M.shake(px = 3, ms = 320, { x, y, depth })                         */
  /*  A short damped translate tremor of the active zone's scenery        */
  /*  (depth 1) and stage (depth .55). px is clamped to 6. Returns true   */
  /*  when it ran. Off under Calm / Pause / Screen shake off / reduced    */
  /*  motion / hidden tab. No haptics (call E2M.haptic for that).         */
  /* E2M.impact(power 0..1, { x, y, color, kind, haptic })                */
  /*  The one place physical "shock" comes from:                          */
  /*   - event 'impact' {power,x,y,color,kind,calm} (scenery rim light)   */
  /*   - a soft warm glint at x,y (opacity pulse, no flash, no scale)     */
  /*   - a subtle shake: <.4 -> <=4px, otherwise <=6px; >=.9 or kind      */
  /*     'rumble' -> a short sustained rumble (~0.8s, <=5px)              */
  /*   - a matching haptic ('tap'|'light'|'medium'|'burst'|'rumble'),     */
  /*     unless o.haptic === false or o.haptic names another one          */
  /*  Calm / reduced / paused / shake-off: glint + event (+ 'tap') only.  */
  /* E2M.impactTarget(el, depth) adds a layer to the tremor ([data-impact-*/
  /* depth] inside the active zone works too). Never sets `scale`.        */
  /* ------------------------------------------------------------------ */
  /* Revision 7: the Fireworks Playground (and the finale) shake for real: 2-8px, a short damped spring
     (350-700ms) applied on the SAME frame as the call (so the kick is felt at full amplitude), bigger shells
     and GO CRAZY up to 8px with a short rumble. Elsewhere the R4 caps stay (<= 4px small actions, <= 6px).
     In the Fireworks zone the stage itself does not move (its deck stays still under the finger); its depth
     layers do: [data-impact-depth] elements, the zone's sky canvas and the ambient canvas. OS reduced motion
     alone does not stop the shake there — Screen shake / Calm / Pause in Tools do. */
  var SHAKE_MAX = 6, SHAKE_MAX_BIG = 8;
  var shocks = [], shockRaf = 0, shockLast = 0, impactTargets = [], shaken = [], lastAmbShake = 0;
  E2M.impactTarget = function (el, depth) {
    if (!el) return function () {};
    var t = { el: el, d: depth == null ? 1 : depth, seed: Math.random() * 10 };
    impactTargets.push(t);
    return function () { var i = impactTargets.indexOf(t); if (i > -1) impactTargets.splice(i, 1); el.style.translate = ''; };
  };
  function activeZoneEl(y) {
    var zs = D.querySelectorAll('.zone.is-active');
    if (!zs.length) return null;
    if (zs.length === 1 || y == null) return zs[0];
    for (var i = 0; i < zs.length; i++) { var r = zs[i].getBoundingClientRect(); if (y >= r.top && y <= r.bottom) return zs[i]; }
    return zs[0];
  }
  function zoneKeyAt(y) { var z = activeZoneEl(y); return z ? (z.getAttribute('data-zone') || '') : ''; }
  function bigZone(k) { return k === 'fireworks' || k === 'finale'; }
  function shakeLayers(y) {
    var list = impactTargets.slice(), z = activeZoneEl(y);
    if (z) {
      var sc = z.querySelector('.zone-scenery'), st = z.querySelector('.zone-stage');
      if (sc) list.push({ el: sc, d: z.id === 'zone-fireworks' ? 0.35 : 1, seed: 2.1 });
      if (st && st.getAttribute('data-impact-stage') !== 'none') list.push({ el: st, d: 0.55, seed: 3.7 });
      z.querySelectorAll('[data-impact-depth]').forEach(function (el, i) { var d = parseFloat(el.getAttribute('data-impact-depth')); list.push({ el: el, d: isFinite(d) ? d : 0.6, seed: 4 + i }); });
      if (z.id === 'zone-fireworks' && amb.cv && amb.run) list.push({ el: amb.cv, d: 0.55, seed: 9 });
    }
    return list;
  }
  function shakeOK(k) {
    var p = E2M.prefs;
    if (!p.shake || p.paused || D.hidden) return false;
    return k === 'fireworks' ? !calmExplicit() : !E2M.isCalm();
  }
  function clearShaken() { for (var i = 0; i < shaken.length; i++) shaken[i].style.translate = ''; shaken.length = 0; }
  function shockFrame(t) {
    shockRaf = 0;
    var dt = Math.max(0, Math.min(0.05, (t - shockLast) / 1000)); shockLast = Math.max(shockLast, t);
    var x = 0, y = 0, cap = 0, i, k;
    for (i = shocks.length - 1; i >= 0; i--) {
      k = shocks[i]; k.t += dt;
      if (k.t >= k.dur) { shocks.splice(i, 1); continue; }
      cap = Math.max(cap, k.cap);
      var ph = k.t * k.f * TAU;
      if (k.sustain) { // rumble / rattle: two incommensurate sines per axis, held then released
        var envR = k.t < k.sustain ? 1 - 0.3 * (k.t / k.sustain) : 0.7 * Math.exp(-(k.t - k.sustain) / 0.12);
        x += k.amp * envR * (0.62 * Math.sin(ph + k.p) + 0.38 * Math.sin(ph * 1.73 + k.p * 2));
        y += k.amp * envR * (0.55 * Math.sin(ph * 1.31 + k.p * 3) + 0.45 * Math.sin(ph * 2.07));
      } else { // thump: a damped spring along the push direction (full kick on frame one), plus a little side wobble
        var envT = Math.exp(-k.t / k.tau), sp = Math.cos(ph) * envT, wb = Math.sin(ph * 1.62 + k.p) * envT * 0.22;
        x += k.amp * (k.dx * sp - k.dy * wb); y += k.amp * (k.dy * sp + k.dx * wb);
      }
    }
    var mag = Math.sqrt(x * x + y * y), lim = cap || SHAKE_MAX;
    if (mag > lim) { x *= lim / mag; y *= lim / mag; }
    var live = shocks.length && shakeOK(shocks[shocks.length - 1].zk);
    if (!live) { shocks.length = 0; clearShaken(); return; }
    var list = shakeLayers(shocks[shocks.length - 1].y);
    // layers that left the active set since last frame return to rest
    for (i = shaken.length - 1; i >= 0; i--) {
      var keep = false;
      for (var j = 0; j < list.length; j++) if (list[j].el === shaken[i]) { keep = true; break; }
      if (!keep) { shaken[i].style.translate = ''; shaken.splice(i, 1); }
    }
    for (i = 0; i < list.length; i++) {
      var L = list[i];
      L.el.style.translate = (x * L.d).toFixed(2) + 'px ' + (y * L.d).toFixed(2) + 'px';
      if (shaken.indexOf(L.el) < 0) shaken.push(L.el);
    }
    E2M.shakeNow = mag > lim ? lim : mag;
    shockRaf = requestAnimationFrame(shockFrame);
  }
  E2M.shakeNow = 0;
  function pushShock(k) {
    if (shocks.length >= 5) shocks.shift(); // overlapping calls never stack beyond the clamp + 5 live shocks
    shocks.push(k);
    var now = performance.now();
    if (shockRaf) { cancelAnimationFrame(shockRaf); shockRaf = 0; } else shockLast = now;
    shockFrame(now); // apply this frame: the kick lands at full amplitude, not one frame late and decayed
  }
  function pushDir(x, y) {
    var cx = W.innerWidth / 2, cy = W.innerHeight / 2, dx = cx - x, dy = cy - y, dl = Math.sqrt(dx * dx + dy * dy) || 1;
    dx = dx / dl * 0.55; dy = 0.85 + dy / dl * 0.15;
    var dn = Math.sqrt(dx * dx + dy * dy);
    return { dx: dx / dn, dy: dy / dn };
  }
  /* E2M.shake(px = 3, ms = 320, { x, y, kind, sustain })
     px is clamped to 6 (8 in the Fireworks zone and the finale). kind 'ambient' = a background nudge,
     rate-limited to one per 600ms. sustain (s) = a rattle (two-sine buzz held for that long, then released). */
  E2M.shake = function (px, ms, o) {
    o = o || {};
    var x = o.x != null ? o.x : W.innerWidth / 2, y = o.y != null ? o.y : W.innerHeight * 0.4, zk = o.zone || zoneKeyAt(y);
    if (!shakeOK(zk)) return false;
    var capZ = bigZone(zk) ? SHAKE_MAX_BIG : SHAKE_MAX;
    var a = Math.max(0, Math.min(capZ, px == null ? 3 : Number(px) || 0));
    if (!a) return false;
    var now = performance.now();
    if (o.kind === 'ambient') { if (now - lastAmbShake < 600) return false; lastAmbShake = now; }
    var dur = Math.max(120, Math.min(1600, ms == null ? 320 : Number(ms) || 320)) / 1000, d = pushDir(x, y);
    if (o.sustain) pushShock({ t: 0, dur: dur, sustain: Math.min(dur * 0.85, o.sustain), amp: a, cap: a, f: o.f || 14, p: Math.random() * 6, dx: d.dx, dy: d.dy, y: y, zk: zk });
    else pushShock({ t: 0, dur: dur, tau: dur / 4.2, amp: a, cap: a, f: o.f || (7 + Math.random() * 2), p: Math.random() * 6, dx: d.dx, dy: d.dy, y: y, zk: zk });
    return true;
  };
  function softGlow(x, y, color, power) {
    var g = D.createElement('div');
    g.className = 'e2m-glint'; g.setAttribute('aria-hidden', 'true');
    var r = Math.round(50 + 150 * power);
    g.style.cssText = 'left:' + (x - r) + 'px;top:' + (y - r) + 'px;width:' + r * 2 + 'px;height:' + r * 2 + 'px;--gc:' + toHex(color) + ';--ga:' + (0.28 + 0.32 * power).toFixed(2);
    D.body.appendChild(g);
    setTimeout(function () { if (g.parentNode) g.parentNode.removeChild(g); }, 950);
  }
  var glintTimes = [], FW_KIND = /fire|burst|mega|crazy|finale|cracker|bijli|ladi|anar|chakri|rocket|grand|rumble|show/;
  E2M.impact = function (power, o) {
    o = o || {};
    power = Math.max(0, Math.min(1, Number(power) || 0));
    if (!power) return;
    var x = o.x != null ? o.x : W.innerWidth / 2, y = o.y != null ? o.y : W.innerHeight * 0.45;
    var color = o.color || '#FFD778', kind = o.kind || '', zk = o.zone || zoneKeyAt(y), big = bigZone(zk);
    var p = E2M.prefs, calm = zk === 'fireworks' ? !E2M.fwLive() : (E2M.isCalm() || p.paused);
    var mult = p.intensity === 'max' ? 1.15 : (p.intensity === 'calm' ? 0.6 : 1);
    var pw = Math.min(1, power * mult);
    var rumble = pw >= 0.9 || kind === 'rumble';
    E2M.emit('impact', { power: pw, x: x, y: y, color: color, kind: kind, calm: calm });
    if (D.hidden) return;
    // a matching haptic (explicit E2M.haptic calls right after take over)
    if (o.haptic !== false) {
      var hn = typeof o.haptic === 'string' ? o.haptic : (rumble ? (big ? 'grand' : 'rumble') : (FW_KIND.test(kind) ? 'burst' : (pw < 0.2 ? 'tap' : (pw < 0.4 ? 'light' : (pw < 0.7 ? 'medium' : 'thump')))));
      hapFire(calm ? 'tap' : hn, pw, true);
    }
    // a soft pulse of warm light where it happened (opacity only; at most 4 per second). In the Fireworks zone
    // the shell's own light does this job, and a glint there would sit over the zone's text.
    var now = performance.now();
    while (glintTimes.length && now - glintTimes[0] > 1000) glintTimes.shift();
    if (!(zk === 'fireworks' && FW_KIND.test(kind)) && glintTimes.length < 4) { glintTimes.push(now); softGlow(x, y, color, Math.max(0.15, pw * (calm ? 0.5 : 0.8))); }
    if (calm || !shakeOK(zk)) return;
    var d = pushDir(x, y);
    if (big) {
      // R7: 2-8px by weight; >= .9 (or 'rumble') adds a short sustained rumble at up to 8px
      if (rumble) pushShock({ t: 0, dur: 1.05, sustain: 0.6, amp: 5 + 3 * pw, cap: SHAKE_MAX_BIG, f: 12, p: Math.random() * 6, dx: d.dx, dy: d.dy, y: y, zk: zk });
      var dur = 0.36 + 0.34 * pw;
      pushShock({ t: 0, dur: dur, tau: dur / 4.2, amp: 2 + 6 * pw, cap: SHAKE_MAX_BIG, f: 9 - 2 * pw, p: Math.random() * 6, dx: d.dx, dy: d.dy, y: y, zk: zk });
      return;
    }
    if (rumble) pushShock({ t: 0, dur: 0.95, sustain: 0.6, amp: 3 + 2 * pw, cap: 5, f: 12, p: Math.random() * 6, dx: d.dx, dy: d.dy, y: y, zk: zk });
    else {
      var small = pw < 0.4, amp = small ? 1.2 + 7 * pw : 3 + 3 * pw; // small actions <= 4px, others <= 6px
      pushShock({ t: 0, dur: small ? 0.3 : 0.42, tau: small ? 0.07 : 0.1, amp: amp, cap: small ? 4 : SHAKE_MAX, f: small ? 9 : 7.5, p: 0, dx: d.dx, dy: d.dy, y: y, zk: zk });
    }
  };
  E2M.on('prefs:change', function () { if (shocks.length && !shakeOK(shocks[shocks.length - 1].zk)) { shocks.length = 0; clearShaken(); } });

  /* ------------------------------------------------------------------ */
  /* Audio — Revision 3: a procedural-but-realistic fireworks engine      */
  /* (WebAudio, no files). Off until the visitor turns it on.             */
  /*                                                                      */
  /* Master chain: voices -> [distance lowpass] -> dry + send -> open-air  */
  /* convolution reverb (generated 2.6s decaying, darkening noise impulse  */
  /* with early reflections off buildings) -> master (volume pref) ->      */
  /* limiter (compressor) -> out.                                          */
  /*                                                                      */
  /* E2M.audio.play(name, o) — o: { size 0..1, distance 0..1, pan -1..1,   */
  /*   x (viewport px, sets pan), gain }                                   */
  /*   'launch'  rocket: fuse hiss, rising air rush, faint whistle         */
  /*   'burst'   shell: ~5ms transient click, sub thump (120->35Hz), mid   */
  /*             crack (1-4kHz), low roll; reverb tail. Far = delayed (up  */
  /*             to ~0.9s), lowpassed, quieter, wetter. Small = crisp,     */
  /*             large = deeper and longer. Every call is detuned.          */
  /*   'crackle' crossette / crackling-willow sizzle: dozens of micro      */
  /*             ticks over 0.4-1.2s (pre-rendered sparse-impulse buffers) */
  /*   kept: bell pop whoosh boom sparkle thud win lose chime spin thump   */
  /*         rumble flick finale                                           */
  /* E2M.audio.loop('chakri', { rate 0..1 }) -> { set(rate), stop() }      */
  /*   continuous whirring hiss, pitch + whirr rate tied to RPM; safe to   */
  /*   create while sound is off (it starts when sound is turned on).      */
  /* Rapid fire: at most 16 concurrent firework voices (R7; background     */
  /* crackers at most 8 of them); a limiter on the master keeps volleys    */
  /* from clipping.                                                        */
  /* ------------------------------------------------------------------ */
  var A = { ctx: null, master: null, bus: null, verb: null, noise: null, crk: [], nodes: 0, ev: [], last: {} };
  function clamp01(v, d) { v = Number(v); return isFinite(v) ? Math.max(0, Math.min(1, v)) : d; }
  function impulse(c, dur) {
    var sr = c.sampleRate, len = Math.round(sr * dur), b = c.createBuffer(2, len, sr), pre = Math.round(sr * 0.009);
    // early reflections: facades and courtyard walls, a little different per ear
    var refl = [[0.013, 0.55], [0.031, 0.4], [0.052, 0.33], [0.087, 0.27], [0.133, 0.22], [0.204, 0.17], [0.296, 0.12], [0.418, 0.08], [0.61, 0.05]];
    for (var ch = 0; ch < 2; ch++) {
      var d = b.getChannelData(ch), lp = 0, peak = 0, i;
      for (i = pre; i < len; i++) {
        var t = (i - pre) / sr, k = 0.35 + 0.6 * Math.min(1, t / (dur * 0.7)); // the air darkens the tail
        lp = lp * k + (Math.random() * 2 - 1) * (1 - k);
        d[i] = lp * Math.exp(-t / 0.46) * (1 + 1.8 * k);
      }
      refl.forEach(function (r) {
        var j = pre + Math.round(sr * r[0] * (ch ? 1.083 : 1)), L = Math.round(sr * 0.004);
        for (var q = 0; q < L && j + q < len; q++) d[j + q] += r[1] * (Math.random() * 2 - 1) * Math.exp(-q / (L * 0.3));
      });
      for (i = 0; i < len; i++) { var a = Math.abs(d[i]); if (a > peak) peak = a; }
      if (peak) for (i = 0; i < len; i++) d[i] /= peak;
    }
    return b;
  }
  /* sparse micro-ticks: the crackle of split stars (some ticks come in pairs: "crk-crk") */
  function crackleBuf(c, dur, n) {
    var sr = c.sampleRate, len = Math.round(sr * dur), b = c.createBuffer(1, len, sr), d = b.getChannelData(0);
    function tick(j, amp) {
      var L = Math.round(sr * (0.0012 + Math.random() * 0.005)), sg = Math.random() < 0.5 ? -1 : 1;
      for (var q = 0; q < L && j + q < len; q++) d[j + q] += amp * Math.exp(-q / (L * 0.26)) * (q < 2 ? sg : Math.random() * 2 - 1);
    }
    for (var k = 0; k < n; k++) {
      var t = Math.pow(Math.random(), 1.45) * (dur - 0.03), j = Math.round(t * sr), amp = (0.22 + Math.random() * 0.78) * (1 - 0.55 * t / dur);
      tick(j, amp);
      if (Math.random() < 0.3) tick(j + Math.round(sr * (0.006 + Math.random() * 0.016)), amp * 0.7);
    }
    return b;
  }
  function audioCtx() {
    if (A.ctx) return A.ctx;
    var C = W.AudioContext || W.webkitAudioContext;
    if (!C) return null;
    try {
      var c = new C();
      var lim = c.createDynamicsCompressor();
      lim.threshold.value = -10; lim.knee.value = 6; lim.ratio.value = 14; lim.attack.value = 0.002; lim.release.value = 0.3;
      var m = c.createGain(); m.gain.value = 0.7 * E2M.prefs.volume;
      m.connect(lim); lim.connect(c.destination);
      var verb = c.createConvolver(); verb.buffer = impulse(c, 2.6);
      var vlp = c.createBiquadFilter(); vlp.type = 'lowpass'; vlp.frequency.value = 5200; vlp.Q.value = 0.4;
      var vout = c.createGain(); vout.gain.value = 0.85;
      verb.connect(vlp); vlp.connect(vout); vout.connect(m);
      // the bus for small UI voices (bells, chimes, pops): mostly dry, with a little of the same night air
      var bus = c.createGain(); bus.connect(m);
      var send = c.createGain(); send.gain.value = 0.18; bus.connect(send); send.connect(verb);
      var len = c.sampleRate * 2, nb = c.createBuffer(1, len, c.sampleRate), nd = nb.getChannelData(0);
      for (var i = 0; i < len; i++) nd[i] = Math.random() * 2 - 1;
      /* R7: the open-air echo — three slap-back taps off the temple town / the hills. Each tap is a delay, an
         ever-darker lowpass, a decaying gain and its own place in the stereo field; a little of each feeds the
         reverb so the repeats sit in the same night air. The Echo setting picks how many taps sound. */
      var echoIn = c.createGain(); echoIn.gain.value = 1;
      A.taps = [];
      for (var e = 0; e < 3; e++) {
        var dl = c.createDelay(3), elp = c.createBiquadFilter(), eg = c.createGain(), es = c.createGain(), en = eg;
        dl.delayTime.value = 0.3 * (e + 1); elp.type = 'lowpass'; elp.Q.value = 0.4; elp.frequency.value = 2400; eg.gain.value = 0;
        echoIn.connect(dl); dl.connect(elp); elp.connect(eg);
        if (c.createStereoPanner) { var ep = c.createStereoPanner(); ep.pan.value = e % 2 ? 0.45 : -0.45; eg.connect(ep); en = ep; }
        en.connect(m); es.gain.value = 0.3; eg.connect(es); es.connect(verb);
        A.taps.push({ dl: dl, lp: elp, g: eg });
      }
      A.echoIn = echoIn; A.vout = vout;
      A.ctx = c; A.master = m; A.verb = verb; A.bus = bus; A.noise = nb;
      applyEcho();
      A.crk = [crackleBuf(c, 1.3, 78), crackleBuf(c, 0.9, 44), crackleBuf(c, 1.5, 120), crackleBuf(c, 0.7, 30), crackleBuf(c, 1.2, 64)];
      return c;
    } catch (e) { return null; }
  }
  function env(g, t, a, peak, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  function track(node, g) { A.nodes++; A.stats.nodes++; node.onended = function () { A.nodes--; try { g.disconnect(); } catch (e) {} }; }
  /* R7 Echo presets: wet = reverb return level; taps = [delay s, gain, lowpass Hz]. */
  var ECHO = {
    off: { label: 'Off', wet: 0.5, taps: [] },
    soft: { label: 'Soft', wet: 0.85, taps: [[0.27, 0.3, 2600]] },
    hall: { label: 'Big hall', wet: 1.2, taps: [[0.19, 0.36, 3200], [0.43, 0.24, 2100]] },
    mountains: { label: 'Mountains', wet: 0.95, taps: [[0.58, 0.46, 1900], [1.24, 0.3, 1250], [1.98, 0.19, 820]] }
  };
  var echoName = 'hall';
  A.stats = { played: {}, voices: 0, echoSends: 0, echoRepeats: 0, dropped: 0, errors: 0, nodes: 0 };
  function applyEcho() {
    if (!A.ctx || !A.taps) return;
    var E = ECHO[echoName], t = A.ctx.currentTime;
    A.taps.forEach(function (tp, i) {
      var spec = E.taps[i];
      tp.g.gain.setTargetAtTime(spec ? spec[1] : 0, t, 0.05);
      if (spec) { tp.dl.delayTime.setValueAtTime(spec[0], t); tp.lp.frequency.setValueAtTime(spec[2], t); }
    });
    if (A.vout) A.vout.gain.setTargetAtTime(0.85 * E.wet, t, 0.05);
  }
  function echoTapTimes() { return ECHO[echoName].taps.map(function (s) { return s[0]; }); }
  function osc(type, f0, t, dur, peak, o) {
    o = o || {};
    var c = A.ctx, os = c.createOscillator(), g = c.createGain(), node = os, a = o.a || 0.005;
    os.type = type;
    os.frequency.setValueAtTime(f0, t);
    if (o.f1) os.frequency.exponentialRampToValueAtTime(o.f1, t + (o.glide || dur));
    if (o.detune) os.detune.value = o.detune;
    if (o.vib) {
      var l = c.createOscillator(), lg = c.createGain();
      l.frequency.value = o.vib; lg.gain.value = o.vibDepth || 7;
      l.connect(lg); lg.connect(os.frequency); l.start(t); l.stop(t + dur + a + 0.1);
    }
    if (o.lp) { var f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; os.connect(f); node = f; }
    node.connect(g); g.connect(o.dest || A.bus);
    env(g, t, a, peak, dur);
    os.start(t); os.stop(t + a + dur + 0.05);
    track(os, g);
  }
  function noise(t, dur, peak, o) {
    o = o || {};
    var c = A.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = A.noise;
    if (o.rate) s.playbackRate.value = o.rate;
    f.type = o.type || 'bandpass';
    f.frequency.setValueAtTime(o.f || 1000, t);
    if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t + (o.glide || dur));
    f.Q.value = o.q || 1;
    s.connect(f); f.connect(g); g.connect(o.dest || A.bus);
    env(g, t, o.a || 0.004, peak, dur);
    s.start(t, Math.max(0, Math.random() * (1.9 - dur)));
    s.stop(t + (o.a || 0.004) + dur + 0.1);
    track(s, g);
  }
  function buf(b, t, peak, o) {
    o = o || {};
    var c = A.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), rate = o.rate || 1;
    s.buffer = b; s.playbackRate.value = rate;
    f.type = o.type || 'highpass'; f.frequency.value = o.f || 1800; f.Q.value = o.q || 0.7;
    g.gain.value = peak;
    s.connect(f); f.connect(g); g.connect(o.dest || A.bus);
    s.start(t); s.stop(t + b.duration / rate + 0.05);
    track(s, g);
  }
  /* one spatial voice: everything for one launch / burst / crackle runs through it. Distance sets the
     air lowpass, level, and the dry/wet balance; pan places it across the stereo field. */
  function voice(t, o, life) {
    var c = A.ctx, d = clamp01(o.distance, 0.2);
    var g = c.createGain(), lp = c.createBiquadFilter(), dry = c.createGain(), wet = c.createGain(), node = g;
    g.gain.value = (o.gain == null ? 1 : o.gain) / (1 + d * 2.4);
    lp.type = 'lowpass'; lp.Q.value = 0.5;
    lp.frequency.value = 650 + 17500 * Math.pow(1 - d, 2.3);
    if (c.createStereoPanner) {
      var p = c.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, o.pan || 0)) * (0.85 - 0.4 * d);
      g.connect(p); node = p;
    }
    node.connect(lp);
    dry.gain.value = 1 - 0.55 * d; wet.gain.value = 0.2 + 0.75 * d;
    lp.connect(dry); dry.connect(A.master); lp.connect(wet); wet.connect(A.verb);
    // R7: every firework voice also feeds the echo taps (far shells a little more: more of what you hear is echo)
    var es = null, reps = ECHO[echoName].taps.length, ek = o.echo == null ? 1 : o.echo;
    if (A.echoIn && reps && ek > 0) {
      es = c.createGain(); es.gain.value = Math.min(1.2, (0.42 + 0.3 * d) * ek);
      lp.connect(es); es.connect(A.echoIn);
      A.stats.echoSends++; A.stats.echoRepeats += reps;
    }
    A.stats.voices++;
    A.ev.push(t + life);
    var tail = reps ? ECHO[echoName].taps[reps - 1][0] + 1 : 0;
    setTimeout(function () { try { g.disconnect(); lp.disconnect(); dry.disconnect(); wet.disconnect(); if (es) es.disconnect(); } catch (e) {} }, Math.max(0, (t - c.currentTime + life + 3.2 + tail) * 1000));
    return g;
  }
  function fwBusy(now) { var n = 0; for (var i = A.ev.length - 1; i >= 0; i--) { if (A.ev[i] < now) A.ev.splice(i, 1); else n++; } return n; }
  function sizeOf(o, d) { return clamp01(o.size, d == null ? 0.5 : d); }
  var SYN = {
    /* a rocket leaving the tube: fuse hiss, the rising rush of air, a faint wobbling whistle */
    launch: function (t, o) {
      var s = sizeOf(o), dur = 0.75 + s * 0.75 + rand(-0.1, 0.12);
      var v = voice(t, { distance: o.distance == null ? 0.12 : o.distance, pan: o.pan, gain: 0.85 * (o.gain == null ? 1 : o.gain), echo: 0.35 }, dur + 0.3);
      noise(t, 0.1, 0.4, { type: 'highpass', f: 3800, a: 0.002, dest: v });
      buf(A.crk[3], t, 0.42, { dest: v, f: 2600, rate: rand(1.5, 1.9) });
      noise(t + 0.04, dur * 0.45, 0.34 + 0.12 * s, { type: 'bandpass', f: 340 + rand(-50, 60), f1: 2400 + 1600 * (1 - s) + rand(-250, 250), glide: dur, q: 1.5, a: dur * 0.55, dest: v });
      if (Math.random() < 0.55) osc('sine', 820 + rand(-90, 90), t + 0.1, dur * 0.4, 0.03 + 0.025 * (1 - s), { f1: 1900 + rand(-200, 400), glide: dur, a: dur * 0.6, vib: rand(9, 15), vibDepth: 16, dest: v });
    },
    /* the shell breaking: transient, body, crack, roll — the reverb supplies the open-air tail */
    burst: function (t, o) {
      var s = sizeOf(o), det = rand(0.88, 1.12), tail = 0.45 + s * 1.5;
      var v = voice(t, { distance: o.distance, pan: o.pan, gain: (0.7 + 0.55 * s) * (o.gain == null ? 1 : o.gain), echo: o.echo == null ? 1 : o.echo }, tail + 0.5);
      noise(t, 0.005, 1.1, { type: 'highpass', f: 1500, a: 0.0006, dest: v });
      osc('sine', (132 - 54 * s) * det, t, 0.2 + 0.55 * s, 0.95 + 0.35 * s, { f1: (36 + 10 * (1 - s)) * det, glide: 0.16 + 0.26 * s, a: 0.0015, dest: v });
      osc('triangle', (70 - 22 * s) * det, t, 0.15 + 0.3 * s, 0.25 + 0.2 * s, { f1: 30, glide: 0.2, a: 0.002, dest: v });
      noise(t, 0.1 + 0.3 * s, 0.6, { type: 'lowpass', f: (440 - 140 * s) * det, q: 0.7, a: 0.0015, dest: v });
      noise(t + 0.002, 0.08 + 0.09 * s, 0.8, { type: 'bandpass', f: (3000 - 1500 * s) * det, q: 0.75, a: 0.0008, dest: v });
      if (s > 0.3) noise(t + 0.03, tail, 0.1 + 0.24 * s, { type: 'lowpass', f: 300, f1: 70, q: 0.5, a: 0.05, dest: v });
    },
    crackle: function (t, o) {
      var s = sizeOf(o), d = clamp01(o.distance, 0.25);
      var v = voice(t, { distance: d, pan: (o.pan || 0) + rand(-0.15, 0.15), gain: (0.5 + 0.45 * s) * (o.gain == null ? 1 : o.gain), echo: 0.55 }, 2);
      var b = pick(A.crk), rate = rand(0.85, 1.25) * (1.12 - 0.25 * s);
      buf(b, t, 0.85, { dest: v, f: 1500 + rand(0, 1800), rate: rate });
      if (s > 0.55) buf(pick(A.crk), t + rand(0.06, 0.22), 0.6, { dest: v, f: 2200 + rand(0, 1500), rate: rate * rand(0.9, 1.15) });
    },
    /* R7 — the rocket (udan khatola): a strong, wobbling whistle that climbs as it flies, over the fuse hiss */
    whistle: function (t, o) {
      var s = sizeOf(o), dur = (o.dur || (0.85 + s * 0.5)) + rand(-0.08, 0.1), f0 = rand(1250, 1650);
      var v = voice(t, { distance: o.distance == null ? 0.15 : o.distance, pan: o.pan, gain: 0.8 * (o.gain == null ? 1 : o.gain), echo: 0.45 }, dur + 0.45);
      noise(t, 0.08, 0.35, { type: 'highpass', f: 3600, a: 0.002, dest: v });
      buf(A.crk[3], t, 0.35, { dest: v, f: 2800, rate: rand(1.6, 2) });
      noise(t + 0.03, dur * 0.8, 0.2, { type: 'bandpass', f: 600, f1: 2600, glide: dur, q: 1.3, a: dur * 0.3, dest: v });
      osc('sine', f0, t + 0.05, dur, 0.08 + 0.04 * (1 - s), { f1: f0 * rand(1.5, 1.85), glide: dur * 0.9, a: 0.08, vib: rand(11, 17), vibDepth: 28, dest: v });
      osc('sine', f0 * 2.01, t + 0.05, dur * 0.8, 0.012, { f1: f0 * 3.3, glide: dur * 0.9, a: 0.1, dest: v });
    },
    /* R7 — an aerial shell leaving its mortar tube: a deep "thoomp", then the rush of the rising shell */
    mortar: function (t, o) {
      var s = sizeOf(o);
      var v = voice(t, { distance: o.distance == null ? 0.12 : o.distance, pan: o.pan, gain: (0.75 + 0.35 * s) * (o.gain == null ? 1 : o.gain), echo: 0.6 }, 1.2);
      noise(t, 0.004, 0.9, { type: 'highpass', f: 1200, a: 0.0006, dest: v });
      osc('sine', 110 - 30 * s, t, 0.16 + 0.1 * s, 0.85, { f1: 42, glide: 0.14, a: 0.002, dest: v });
      noise(t, 0.12, 0.45, { type: 'lowpass', f: 700, f1: 200, q: 0.6, a: 0.002, dest: v });
      noise(t + 0.05, 0.5 + 0.3 * s, 0.12, { type: 'bandpass', f: 500, f1: 1800, q: 1.1, a: 0.12, dest: v });
    },
    /* R7 — one ladi cracker: a hard paper-and-powder bang, short and bright */
    bang: function (t, o) {
      var s = sizeOf(o, 0.3), det = rand(0.88, 1.15);
      var v = voice(t, { distance: o.distance == null ? 0.1 : o.distance, pan: o.pan, gain: (0.55 + 0.4 * s) * (o.gain == null ? 1 : o.gain), echo: 0.75 }, 0.45);
      noise(t, 0.004, 1.2, { type: 'highpass', f: 1800, a: 0.0004, dest: v });
      noise(t + 0.001, 0.05 + 0.04 * s, 0.9, { type: 'bandpass', f: 2200 * det, q: 0.8, a: 0.0006, dest: v });
      osc('sine', (160 - 50 * s) * det, t, 0.07 + 0.08 * s, 0.6, { f1: 55, glide: 0.07, a: 0.001, dest: v });
    },
    /* R7 — the bijli bomb: one huge bang that you feel in the chest, then the long roll off the town */
    bijli: function (t, o) {
      var v = voice(t, { distance: o.distance == null ? 0.05 : o.distance, pan: o.pan, gain: 1.25 * (o.gain == null ? 1 : o.gain), echo: 1.25 }, 2.6);
      noise(t, 0.006, 1.4, { type: 'highpass', f: 1200, a: 0.0004, dest: v });
      noise(t + 0.001, 0.16, 1.1, { type: 'bandpass', f: 1600, q: 0.6, a: 0.0006, dest: v });
      osc('sine', 92, t, 0.95, 1.4, { f1: 24, glide: 0.7, a: 0.0015, dest: v });
      osc('triangle', 55, t, 0.6, 0.5, { f1: 22, glide: 0.5, a: 0.002, dest: v });
      noise(t + 0.02, 1.8, 0.42, { type: 'lowpass', f: 380, f1: 55, q: 0.5, a: 0.04, dest: v });
    },
    bell: function (t, o) {
      var f = o.pitch || rand(500, 640);
      [[1, 1, 2.6], [2, 0.5, 1.8], [2.76, 0.42, 1.3], [5.4, 0.2, 0.8], [8.93, 0.11, 0.5]].forEach(function (p) {
        osc('sine', f * p[0], t, p[2], 0.2 * p[1], { a: 0.002 });
      });
      noise(t, 0.03, 0.1, { type: 'highpass', f: 3200 });
    },
    pop: function (t) { osc('sine', 720, t, 0.12, 0.4, { f1: 110 }); noise(t, 0.05, 0.2, { type: 'highpass', f: 1500 }); },
    whoosh: function (t) {
      noise(t, 0.7, 0.16, { type: 'bandpass', f: 300, f1: 2600, q: 1.4, a: 0.22 });
      osc('sine', 1400, t + 0.05, 0.6, 0.02, { f1: 2900, a: 0.2 });
    },
    boom: function (t, o) { SYN.burst(t, { size: o.size == null ? 0.9 : o.size, distance: o.distance == null ? 0.18 : o.distance, pan: o.pan }); },
    sparkle: function (t) { for (var i = 0; i < 7; i++) osc('sine', rand(1800, 4600), t + i * 0.045, 0.28, 0.05, { a: 0.003 }); },
    thud: function (t) { osc('sine', 150, t, 0.3, 0.6, { f1: 48 }); noise(t, 0.12, 0.2, { type: 'lowpass', f: 500 }); },
    win: function (t) {
      [523.25, 587.33, 659.25, 783.99, 880, 1046.5].forEach(function (f, i) { osc('triangle', f, t + i * 0.085, 0.4, 0.13); });
      SYN.bell(t + 0.55, { pitch: 1046.5 });
    },
    lose: function (t) {
      [392, 369.99, 349.23].forEach(function (f, i) { osc('sawtooth', f, t + i * 0.34, 0.3, 0.09, { lp: 1100 }); });
      osc('sawtooth', 329.63, t + 1.02, 1.0, 0.1, { lp: 900, f1: 247, glide: 1.0, vib: 6, vibDepth: 9 });
    },
    chime: function (t) {
      osc('sine', 1318.5, t, 1.3, 0.12); osc('sine', 1318.5 * 2.76, t, 0.5, 0.024);
      osc('sine', 1760, t + 0.12, 1.4, 0.11); osc('sine', 1760 * 2.76, t + 0.12, 0.5, 0.024);
    },
    spin: function (t) {
      noise(t, 0.8, 0.12, { type: 'bandpass', f: 700, f1: 3400, q: 1.2, a: 0.08 });
      buf(A.crk[1], t + 0.05, 0.3, { f: 2600, rate: 1.3 });
    },
    thump: function (t, o) {
      var p = o.power == null ? 0.6 : o.power;
      osc('sine', 78, t, 0.42 + 0.3 * p, 0.35 + 0.45 * p, { f1: 32, glide: 0.4 });
      noise(t, 0.18, 0.12 + 0.15 * p, { type: 'lowpass', f: 240, q: 0.8 });
    },
    rumble: function (t) {
      osc('sine', 46, t, 1.4, 0.5, { f1: 28, glide: 1.3, a: 0.06 });
      noise(t, 1.5, 0.32, { type: 'lowpass', f: 180, f1: 60, q: 0.6, a: 0.08 });
    },
    flick: function (t) {
      noise(t, 0.16, 0.12, { type: 'bandpass', f: 900, f1: 2600, q: 2.2, a: 0.01 });
      osc('sine', 340, t, 0.12, 0.05, { f1: 620 });
    },
    finale: function (t) {
      [261.63, 329.63, 392, 523.25, 659.25].forEach(function (f) { osc('triangle', f, t, 3.4, 0.05, { a: 0.7 }); });
      SYN.burst(t, { size: 1, distance: 0.15 });
      SYN.bell(t + 0.3, { pitch: 523.25 }); SYN.bell(t + 0.8, { pitch: 783.99 }); SYN.bell(t + 1.3, { pitch: 1046.5 });
      SYN.crackle(t + 1.5, { size: 0.8, distance: 0.3 }); SYN.sparkle(t + 2.0); SYN.win(t + 2.4);
    }
  };
  var FW = { launch: 1, burst: 1, crackle: 1, boom: 1, whistle: 1, mortar: 1, bang: 1, bijli: 1 };
  var GAP = { launch: 30, whistle: 40, mortar: 35, bang: 16, bijli: 300, burst: 22, crackle: 45, pop: 28, boom: 60, whoosh: 55, sparkle: 45, bell: 60, thud: 40, spin: 120, thump: 70, rumble: 900, flick: 40, chime: 60 };

  /* the chakri: a spinning wheel's continuous hiss. Noise through a bandpass whose centre climbs with the
     RPM, amplitude-modulated at the rotation rate (the "whirr"), plus a looping spark crackle. */
  var loops = [];
  /* R7: the same loop voices the anar (a roaring fountain) and the phuljhadi (a fizzing sparkler).
     Each value is [at rate 0, added at rate 1]; 'chakri' keeps its original numbers exactly. */
  var LOOPS = {
    chakri: { hp: 420, q: 1.15, bp: [480, 3900], lfo: [2.5, 36], lfoG: [0.12, 0.3], ck: [0.1, 0.6], out: [0.06, 0.4], ckF: 2400, crk: 2 },
    anar: { hp: 650, q: 0.7, bp: [1000, 2400], lfo: [6, 9], lfoG: [0.05, 0.08], ck: [0.25, 0.75], out: [0.07, 0.42], ckF: 1700, crk: 0 },
    fizz: { hp: 2600, q: 0.9, bp: [4300, 2600], lfo: [10, 8], lfoG: [0.08, 0.12], ck: [0.3, 0.6], out: [0.04, 0.2], ckF: 3200, crk: 4 }
  };
  function loopStart(h) {
    if (h.node || h.stopped || !audio.enabled || !A.ctx) return;
    var c = A.ctx, t = c.currentTime + 0.01, P = h.P;
    try {
      var src = c.createBufferSource(); src.buffer = A.noise; src.loop = true;
      var hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = P.hp;
      var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = P.q;
      var am = c.createGain(); am.gain.value = 0.7;
      var lfo = c.createOscillator(); lfo.type = 'triangle';
      var lfoG = c.createGain(); lfoG.gain.value = 0.2;
      lfo.connect(lfoG); lfoG.connect(am.gain);
      var ck = c.createBufferSource(); ck.buffer = A.crk[P.crk]; ck.loop = true;
      var ckF = c.createBiquadFilter(); ckF.type = 'highpass'; ckF.frequency.value = P.ckF;
      var ckG = c.createGain(); ckG.gain.value = 0.0001;
      var out = c.createGain(); out.gain.value = 0.0001;
      var send = c.createGain(); send.gain.value = 0.25;
      src.connect(hp); hp.connect(bp); bp.connect(am); am.connect(out);
      ck.connect(ckF); ckF.connect(ckG); ckG.connect(out);
      out.connect(A.master); out.connect(send); send.connect(A.verb);
      src.start(t, rand(0, 1.5)); ck.start(t, rand(0, 1)); lfo.start(t);
      h.node = { src: src, ck: ck, lfo: lfo, bp: bp, lfoG: lfoG, ckG: ckG, out: out, send: send, parts: [hp, bp, am, lfoG, ckF, ckG, out, send] };
      loopSet(h, 0.02);
    } catch (e) { h.node = null; }
  }
  function loopSet(h, tc) {
    var n = h.node; if (!n) return;
    var t = A.ctx.currentTime, r = h.rate, k = tc || 0.07, P = h.P;
    n.bp.frequency.setTargetAtTime(P.bp[0] + P.bp[1] * r, t, k);
    n.lfo.frequency.setTargetAtTime(P.lfo[0] + P.lfo[1] * r, t, k);
    n.lfoG.gain.setTargetAtTime(P.lfoG[0] + P.lfoG[1] * r, t, k);
    n.ckG.gain.setTargetAtTime(r < 0.03 ? 0.0001 : P.ck[0] + P.ck[1] * r, t, k);
    n.out.gain.setTargetAtTime(r < 0.03 ? 0.0001 : P.out[0] + P.out[1] * r, t, k);
  }
  function loopKill(h) {
    var n = h.node; if (!n) return;
    h.node = null;
    var t = A.ctx.currentTime;
    try { n.out.gain.cancelScheduledValues(t); n.out.gain.setTargetAtTime(0.0001, t, 0.08); } catch (e) {}
    setTimeout(function () {
      try { n.src.stop(); n.ck.stop(); n.lfo.stop(); } catch (e) {}
      n.parts.forEach(function (p) { try { p.disconnect(); } catch (e) {} });
    }, 450);
  }

  var audio = E2M.audio = {
    enabled: false,
    loop: function (name, o) {
      var h = { name: name, P: LOOPS[name] || LOOPS.chakri, rate: clamp01(o && o.rate, 0), stopped: false, node: null };
      h.set = function (r) { if (h.stopped) return; h.rate = clamp01(r, 0); if (h.node) loopSet(h); else loopStart(h); };
      h.stop = function () { if (h.stopped) return; h.stopped = true; loopKill(h); var i = loops.indexOf(h); if (i > -1) loops.splice(i, 1); };
      loops.push(h);
      loopStart(h);
      return h;
    },
    play: function (name, o) {
      if (!audio.enabled || !A.ctx || !SYN[name]) return false;
      if (A.ctx.state === 'suspended') { try { A.ctx.resume(); } catch (e) {} }
      o = o || {};
      if (A.nodes > 170) { A.stats.dropped++; return false; }
      var now = performance.now(), gap = GAP[name] || 30;
      if (A.last[name] && now - A.last[name] < gap) return false;
      var at = A.ctx.currentTime + 0.01;
      if (FW[name]) {
        // R7: background crackers (o.bg) yield to the visitor's own: they get at most 8 of the live voices
        var busy = fwBusy(A.ctx.currentTime), lim = o.bg ? 8 : (name === 'bang' ? 22 : 16);
        if (busy >= lim) { A.stats.dropped++; return false; }
        if (o.x != null && o.pan == null) o.pan = (o.x / Math.max(1, W.innerWidth)) * 2 - 1;
        // speed of sound: far shells are heard after they are seen (up to ~0.9s)
        if (name !== 'launch' && name !== 'whistle' && name !== 'mortar') at += clamp01(o.distance, 0.2) * 0.9 * (o.delay === false ? 0 : 1);
      }
      A.last[name] = now;
      A.stats.played[name] = (A.stats.played[name] || 0) + 1;
      try { SYN[name](at, o); } catch (e) { A.stats.errors++; /* audio must never break play */ }
      return true;
    },
    /* R7: Echo — 'off' | 'soft' | 'hall' (Big hall) | 'mountains'. Sets the repeat count and the reverb wet. */
    echo: function (name) {
      if (name != null && ECHO[name] && name !== echoName) { echoName = name; applyEcho(); E2M.emit('audio:echo', echoName); }
      return echoName;
    },
    echoes: function () { return Object.keys(ECHO).map(function (k) { return { k: k, label: ECHO[k].label, repeats: ECHO[k].taps.length }; }); },
    stats: function () {
      var o = {}, k;
      for (k in A.stats) o[k] = typeof A.stats[k] === 'object' ? JSON.parse(JSON.stringify(A.stats[k])) : A.stats[k];
      o.echo = echoName; o.repeats = ECHO[echoName].taps.length; o.live = A.nodes; o.loops = loops.length; o.state = A.ctx ? A.ctx.state : 'none';
      o.taps = A.taps ? A.taps.map(function (tp) { return { delay: +tp.dl.delayTime.value.toFixed(3), gain: +tp.g.gain.value.toFixed(3) }; }) : [];
      return o;
    },
    toggle: function (force) {
      var next = typeof force === 'boolean' ? force : !audio.enabled;
      if (next) { var c = audioCtx(); if (c && c.state === 'suspended') { try { c.resume(); } catch (e) {} } next = !!c; }
      audio.enabled = next;
      syncSoundUI();
      loops.forEach(function (h) { if (next) loopStart(h); else loopKill(h); });
      E2M.emit('sound:toggle', audio.enabled);
      if (audio.enabled) audio.play('chime');
      return audio.enabled;
    }
  };
  function syncSoundUI() {
    D.querySelectorAll('[data-sound-toggle]').forEach(function (b) {
      b.setAttribute('aria-pressed', audio.enabled ? 'true' : 'false');
      b.classList.toggle('is-on', audio.enabled);
    });
    D.querySelectorAll('[data-sound-label]').forEach(function (l) { l.textContent = audio.enabled ? 'Sound on' : 'Sound off'; });
  }

  /* ------------------------------------------------------------------ */
  /* Revision 6: the Diwali-night bed. Only while sound is ON (never       */
  /* autoplay): distant crackers, a far temple bell about every 20s, a few */
  /* crickets. Very quiet, follows the volume pref, stops on mute / pause  */
  /* / hidden tab.                                                         */
  /* ------------------------------------------------------------------ */
  var night = { timers: [], on: false };
  function nightWant() { return audio.enabled && A.ctx && !E2M.isPaused() && !D.hidden; }
  function nightLater(fn, lo, hi) {
    var id = setTimeout(function () {
      night.timers = night.timers.filter(function (x) { return x !== id; });
      if (!night.on || !nightWant()) return;
      try { fn(); } catch (e) {}
      nightLater(fn, lo, hi);
    }, rand(lo, hi) * 1000);
    night.timers.push(id);
  }
  function nightBell() {
    var t = A.ctx.currentTime + 0.05, f = rand(380, 470);
    var g = A.ctx.createGain(); g.gain.value = 0.2; g.connect(A.bus);
    [[1, 1, 3.4], [2, 0.5, 2.4], [2.76, 0.42, 1.8], [5.4, 0.2, 1]].forEach(function (p) {
      osc('sine', f * p[0], t, p[2], 0.16 * p[1], { a: 0.004, dest: g });
    });
    setTimeout(function () { try { g.disconnect(); } catch (e) {} }, 5200);
  }
  function nightCricket() {
    var t = A.ctx.currentTime + 0.05, f = 4200 + rand(-160, 160), n = 3 + Math.floor(Math.random() * 3);
    var g = A.ctx.createGain(); g.gain.value = 0.5; g.connect(A.bus);
    for (var i = 0; i < n; i++) osc('sine', f, t + i * 0.085, 0.045, 0.011, { a: 0.012, dest: g });
    setTimeout(function () { try { g.disconnect(); } catch (e) {} }, 1500);
  }
  function nightSync() {
    var want = nightWant();
    if (want && !night.on) {
      night.on = true;
      nightLater(function () { audio.play('crackle', { size: rand(0.15, 0.45), distance: rand(0.8, 1), pan: rand(-0.8, 0.8), gain: 0.2 }); }, 2.2, 6.5);
      nightLater(nightBell, 17, 23);
      nightLater(nightCricket, 1.3, 3.2);
    } else if (!want && night.on) {
      night.on = false;
      night.timers.forEach(clearTimeout); night.timers = [];
    }
  }
  E2M.on('sound:toggle', nightSync);
  E2M.on('prefs:change', nightSync);
  D.addEventListener('visibilitychange', nightSync);

  /* ------------------------------------------------------------------ */
  /* Particle engine (shared by the overlay and any activity canvas)      */
  /* ------------------------------------------------------------------ */
  var COLORS = {
    gold: '#FFD778', saffron: '#FF9F32', orange: '#FF8A3D', pink: '#FF6FD0', magenta: '#DB59C8',
    purple: '#A77BFF', ivory: '#FFF4DC', ember: '#E8641A', teal: '#3FD0C9', white: '#FFFFFF', red: '#FF5E6C'
  };
  var MULTI = ['#FFD778', '#FF9F32', '#FF6FD0', '#A77BFF', '#FFF4DC', '#FF8A3D', '#DB59C8'];
  var GOLDS = ['#FFD778', '#FFC24A', '#FFE7A3', '#FFB547'];
  // Revision 1: confetti is gold-led (gold, champagne, ivory, saffron) with a single magenta accent.
  var CONFETTI = ['#FFD778', '#FFD778', '#F4E3BC', '#FFF4DC', '#E9B95C', '#FF9F32', '#C9902E', '#DB59C8'];
  var PETALS = ['#FF9F32', '#FFB52E', '#F28C1B', '#FFD24A', '#D7264F', '#E5487A', '#FF7A3D'];
  E2M.colors = COLORS;
  E2M.palette = MULTI;
  /* Revision 3: the rainbow — 24 saturated hues (a bounded set, so the cached glow sprites stay bounded).
     Blues and violets are lifted a touch so they read on the night navy. */
  function hsl2hex(h, s, l) {
    var a = s * Math.min(l, 1 - l);
    function f(n) { var k = (n + h / 30) % 12, c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); return ('0' + Math.round(c * 255).toString(16)).slice(-2); }
    return '#' + f(0) + f(8) + f(4);
  }
  var RAINBOW = [];
  for (var hi = 0; hi < 24; hi++) { var hh = hi * 15; RAINBOW.push(hsl2hex(hh, 1, hh >= 195 && hh <= 285 ? 0.7 : (hh >= 45 && hh <= 75 ? 0.6 : 0.63))); }
  var hueCursor = Math.random() * 24;
  E2M.rainbow = RAINBOW;
  /* the next hue in a slow sweep (so consecutive rainbow bursts walk round the wheel) */
  E2M.nextHue = function () { hueCursor = (hueCursor + 3 + Math.random() * 5) % 24; return RAINBOW[hueCursor | 0]; };

  var parseCv = D.createElement('canvas').getContext('2d');
  function toHex(c) {
    if (!c) return COLORS.gold;
    if (COLORS[c]) return COLORS[c];
    if (/^#[0-9a-f]{6}$/i.test(c)) return c;
    parseCv.fillStyle = '#000'; parseCv.fillStyle = c;
    var v = parseCv.fillStyle;
    return /^#[0-9a-f]{6}$/i.test(v) ? v : COLORS.gold;
  }
  function rgba(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  var dotCache = {}, glowCache = {};
  function dotSprite(c) {
    var s = dotCache[c]; if (s) return s;
    s = D.createElement('canvas'); s.width = s.height = 64;
    var g = s.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.1, rgba(c, 1));
    r.addColorStop(0.3, rgba(c, 0.38)); r.addColorStop(1, rgba(c, 0));
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
    return (dotCache[c] = s);
  }
  /* R7 perf: sprite ATLASES. Every spark used to be drawn from its own little canvas (one per colour). Chrome
     keeps small canvases in software, so each drawImage into a GPU canvas re-uploaded that texture — thousands of
     uploads a frame in a big show (pre-R7 GO CRAZY ran ~18fps on a GPU because of it). Now all spark colours live
     in one 1024px atlas and all glow colours in another: one texture each, uploaded once (pre-warmed at boot). */
  function makeAtlas(cell) { var cv = D.createElement('canvas'); cv.width = cv.height = 1024; return { cv: cv, g: cv.getContext('2d'), cell: cell, cols: Math.floor(1024 / cell), map: {}, n: 0 }; }
  function atlasCell(A, c, paint) {
    var e = A.map[c]; if (e) return e;
    if (A.n >= A.cols * A.cols) return null;
    var i = A.n++, x = (i % A.cols) * A.cell, y = Math.floor(i / A.cols) * A.cell;
    paint(A.g, x, y, A.cell, c);
    return (A.map[c] = { x: x, y: y });
  }
  function paintDot(g, x, y, L, c) {
    var h = L / 2, r = g.createRadialGradient(x + h, y + h, 0, x + h, y + h, h - 1);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.1, rgba(c, 1));
    r.addColorStop(0.3, rgba(c, 0.38)); r.addColorStop(1, rgba(c, 0));
    g.fillStyle = r; g.fillRect(x, y, L, L);
  }
  function paintGlow(g, x, y, L, c) {
    var h = L / 2, r = g.createRadialGradient(x + h, y + h, 0, x + h, y + h, h - 1);
    r.addColorStop(0, rgba(c, 0.55)); r.addColorStop(0.4, rgba(c, 0.18)); r.addColorStop(1, rgba(c, 0));
    g.fillStyle = r; g.fillRect(x, y, L, L);
  }
  var dotAtlas = null, glowAtlas = null;
  function drawDot(ctx, c, dx, dy, d) {
    if (!dotAtlas) dotAtlas = makeAtlas(64);
    var e = atlasCell(dotAtlas, c, paintDot);
    if (e) ctx.drawImage(dotAtlas.cv, e.x, e.y, 64, 64, dx, dy, d, d); else ctx.drawImage(dotSprite(c), dx, dy, d, d);
  }
  function drawGlow(ctx, c, dx, dy, d) {
    if (!glowAtlas) glowAtlas = makeAtlas(128);
    var e = atlasCell(glowAtlas, c, paintGlow);
    if (e) ctx.drawImage(glowAtlas.cv, e.x, e.y, 128, 128, dx, dy, d, d); else ctx.drawImage(glowSprite(c), dx, dy, d, d);
  }
  function warmAtlases() {
    var seen = {}, list = [];
    [RAINBOW, MULTI, GOLDS, CONFETTI, ['#FFF4DC', '#FFFFFF', '#FFE7A3', '#FFC46A', '#FF9F32', '#FFB547', '#E0283F', '#FFD28A']].forEach(function (a) { a.forEach(function (c) { if (!seen[c]) { seen[c] = 1; list.push(c); } }); });
    Object.keys(COLORS).forEach(function (k) { var c = COLORS[k]; if (!seen[c]) { seen[c] = 1; list.push(c); } });
    Object.keys(PALS).forEach(function (k) { PALS[k].forEach(function (c) { if (!seen[c]) { seen[c] = 1; list.push(c); } }); });
    if (!dotAtlas) dotAtlas = makeAtlas(64);
    if (!glowAtlas) glowAtlas = makeAtlas(128);
    list.forEach(function (c) { atlasCell(dotAtlas, c, paintDot); atlasCell(glowAtlas, c, paintGlow); });
  }
  function glowSprite(c) {
    var s = glowCache[c]; if (s) return s;
    s = D.createElement('canvas'); s.width = s.height = 128;
    var g = s.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, rgba(c, 0.55)); r.addColorStop(0.4, rgba(c, 0.18)); r.addColorStop(1, rgba(c, 0));
    g.fillStyle = r; g.fillRect(0, 0, 128, 128);
    return (glowCache[c] = s);
  }
  var textCache = {};
  function textPoints(str) {
    if (textCache[str]) return textCache[str];
    var fs = 120, c = D.createElement('canvas'), g = c.getContext('2d');
    c.width = Math.ceil(fs * 0.78 * str.length + 60); c.height = Math.ceil(fs * 1.25);
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '500 ' + fs + 'px "Cormorant Garamond", Georgia, serif';
    g.fillText(str, c.width / 2, c.height / 2);
    var data = g.getImageData(0, 0, c.width, c.height).data, pts = [], step = 4;
    for (var y = 0; y < c.height; y += step) for (var x = 0; x < c.width; x += step) {
      if (data[(y * c.width + x) * 4 + 3] > 140) pts.push([(x - c.width / 2) / fs, (y - c.height / 2) / fs]);
    }
    for (var i = pts.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0, tmp = pts[i]; pts[i] = pts[j]; pts[j] = tmp; }
    return (textCache[str] = pts);
  }
  function shuffled(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0, t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  var SPARK = 0, ROCKET = 1, CONF = 2, PETAL = 3;
  /* R7 colour modes: named palettes a shell can be painted with ('gold' stays a warm gold family). */
  var PALS = {
    gold: ['#FFD778', '#FFC24A', '#FFE7A3', '#FFB547', '#FFF4DC'],
    pinkpurple: ['#FF6FD0', '#DB59C8', '#A77BFF', '#C78BFF', '#FF9AE6', '#8F6BFF'],
    saffrongreen: ['#FF9F32', '#FF8A3D', '#FFB547', '#FFF4DC', '#3FD07A', '#6CFF8A', '#2EBD5A'],
    multi: MULTI
  };
  E2M.palettes = PALS;
  /* R7 flash safety, shared by every engine and the zone's sky light: at most 3 large flashes per second.
     Lights that land within 140ms of one another count as one flash; beyond the budget a light is drawn at
     a fifth of its strength (a glow, not a flash). Small lights (weight < .25) never count. */
  var flashTimes = [], flashLastAt = 0, flashLastK = 1;
  E2M.flashGate = function (weight) {
    if (!(weight >= 0.25)) return 1;
    var now = performance.now();
    if (now - flashLastAt < 140) return flashLastK;
    while (flashTimes.length && now - flashTimes[0] > 1000) flashTimes.shift();
    flashLastAt = now;
    if (flashTimes.length >= 3) return (flashLastK = 0.2);
    flashTimes.push(now);
    return (flashLastK = 1);
  };

  function makeEngine(canvas, opt) {
    opt = opt || {};
    var o = {
      trails: !!opt.trails,
      fade: opt.fade || 0.2,
      dprMax: opt.dprMax || (E2M.mobile ? 1.5 : 2),
      fullscreen: !!opt.fullscreen,
      onBurst: opt.onBurst || null,
      under: opt.under || null   // R3: draw hook before particles, returns true while it still has work
    };
    var ctx = canvas.getContext('2d');
    var w = 1, h = 1, dpr = 1, raf = 0, last = 0, paused = false, idle = 0;
    var parts = [], solids = [], flashes = [], pool = [], trailCount = 0, emitters = [];
    var q = opt.q != null ? opt.q : (E2M.reduced ? 0.35 : (E2M.mobile ? 0.6 : 1));
    var eng = { canvas: canvas, ctx: ctx, cap: opt.cap || E2M.maxParticles, scale: 1, wind: 0 };
    /* R7: quality (particle count factor), trails on/off and wind (px/s^2 sideways drift) can change live */
    eng.setQuality = function (v) { q = Math.max(0.2, Math.min(1.2, Number(v) || 1)); };
    eng.setTrails = function (on, fade) {
      o.trails = !!on; if (fade) o.fade = fade;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    function resize() {
      if (o.fullscreen) { w = W.innerWidth; h = W.innerHeight; }
      else { var r = canvas.getBoundingClientRect(); w = r.width || canvas.clientWidth || 300; h = r.height || canvas.clientHeight || 150; }
      dpr = Math.min(W.devicePixelRatio || 1, o.dprMax);
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      eng.scale = Math.max(0.55, Math.min(1.3, Math.min(w, h) / 680));
      eng.w = w; eng.h = h;
    }
    resize();
    eng.resize = resize;

    function alive() { return parts.length + solids.length; }
    function room() { return Math.max(0, eng.cap - alive()); }

    function spark(x, y, vx, vy, life, size, c) {
      var p = pool.pop() || {};
      p.k = SPARK; p.x = p.px = x; p.y = p.py = y; p.vx = vx; p.vy = vy;
      p.life = p.max = life; p.size = size; p.c = c;
      p.g = 90; p.drag = 0.962; p.fl = 0; p.st = true; p.gl = 0; p.sp = 0; p.seek = 0; p.tx = 0; p.ty = 0; p.a = 1; p.tr = false; p.o = null;
      parts.push(p);
      return p;
    }
    function recycle(p) { if (p.tr) trailCount--; p.o = null; pool.push(p); }

    function flash(x, y, c, r, fa) {
      // R7 perf: a flash is a soft bloom, not a light source — capped at 380px x scale, at most 8 alive, a little
      // shorter (a dozen 800px glows a frame is costly on a CPU rasteriser)
      if (flashes.length > 7) flashes.shift();
      r = Math.min(r || 200, 380 * eng.scale); fa = fa == null ? 1 : fa;
      fa *= E2M.flashGate(Math.min(1, (r / 300) * (r / 300)) * fa); // R7: <= 3 large flashes per second
      flashes.push({ x: x, y: y, c: toHex(c), r: r, life: 0.38, max: 0.38, a: fa });
      ensure();
    }

    function colorFn(spec, fallback) {
      if (spec === 'rainbow') {
        // R3: per-burst hue sweep + per-particle spread: a full ordered spectrum round the burst, a scattered
        // spectrum, or a narrow band of the next hue on the wheel
        var r = Math.random(), h0 = (hueCursor = (hueCursor + 4 + Math.random() * 6) % 24);
        if (r < 0.5) return function (ang) { var k = ang == null ? Math.random() * 24 : ang / TAU * 24 + h0; return RAINBOW[(((k % 24) + 24) % 24) | 0]; };
        if (r < 0.78) return function () { return RAINBOW[((h0 + Math.random() * 24) % 24) | 0]; };
        return function () { return Math.random() < 0.1 ? '#FFF4DC' : RAINBOW[((h0 + rand(-2.6, 2.6) + 24) % 24) | 0]; };
      }
      if (!spec || spec === 'multi' || spec === 'random') {
        var pal = fallback ? [fallback] : shuffled(MULTI).slice(0, 3);
        return function () { return pal[(Math.random() * pal.length) | 0]; };
      }
      if (PALS[spec] && spec !== 'gold') {
        var P = PALS[spec];
        if (Math.random() < 0.5) return function (ang) { return ang == null ? P[(Math.random() * P.length) | 0] : P[((ang / TAU * P.length * 2) % P.length + P.length) % P.length | 0]; };
        return function () { return P[(Math.random() * P.length) | 0]; };
      }
      if (spec === 'gold') return function () { return GOLDS[(Math.random() * GOLDS.length) | 0]; };
      var c = toHex(spec);
      return function () { return Math.random() < 0.12 ? '#FFF4DC' : c; };
    }

    function burst(x, y, op) {
      op = op || {};
      var type = op.type || 'peony', sz = op.size || 1, S = sz * eng.scale, i0 = parts.length;
      var speed = 235 * S * (op.speed || 1), cf, n, i, a, v, p;
      // R7 perf: as the engine fills up, new shells thin out smoothly instead of the engine sitting at its cap
      var qq = q; q = q * Math.max(0.4, Math.min(1, room() / (eng.cap * 0.45)));
      if (type === 'heart' && (!op.color || op.color === 'multi')) cf = function () { return Math.random() < 0.5 ? '#FF6FD0' : '#DB59C8'; };
      else if (type === 'willow' && (!op.color || op.color === 'multi')) cf = function () { return pick(GOLDS); };
      else cf = colorFn(op.color);
      var c0 = cf();
      flash(x, y, c0, 230 * S, op.alpha);
      if (o.onBurst && !op.sub) { try { o.onBurst(x, y, c0, sz, op); } catch (e) {} }

      if (type === 'mega') {
        burst(x, y, { type: 'peony', size: sz * 0.9, color: op.color, sound: false, sub: true });
        burst(x, y, { type: 'ring', size: sz * 1.25, color: op.color === 'rainbow' ? 'rainbow' : 'gold', sound: false, sub: true });
        burst(x, y, { type: 'willow', size: sz * 0.8, sound: false, sub: true });
        burst(x, y, { type: 'crossette', size: sz * 0.7, color: op.color, sound: false, sub: true });
        flash(x, y, '#FFF4DC', 420 * S);
      } else if (type === 'ring') {
        n = Math.min(room(), Math.round(72 * sz * q));
        var tilt = rand(TAU), sq = rand(0.28, 0.9), ct = Math.cos(tilt), st = Math.sin(tilt);
        for (i = 0; i < n; i++) {
          a = i / n * TAU; var ux = Math.cos(a), uy = Math.sin(a) * sq;
          v = speed * rand(0.97, 1.03);
          p = spark(x, y, (ux * ct - uy * st) * v, (ux * st + uy * ct) * v, rand(1.1, 1.5), rand(1.4, 2.2), cf(a));
          p.drag = 0.958; p.g = 70 * S;
        }
        n = Math.min(room(), Math.round(22 * sz * q));
        for (i = 0; i < n; i++) { a = rand(TAU); v = speed * rand(0.1, 0.4); p = spark(x, y, Math.cos(a) * v, Math.sin(a) * v, rand(0.8, 1.2), 1.4, '#FFF4DC'); p.g = 60 * S; }
      } else if (type === 'heart') {
        n = Math.min(room(), Math.round(84 * sz * q));
        for (i = 0; i < n; i++) {
          var t = i / n * TAU, hx = 16 * Math.pow(Math.sin(t), 3), hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
          p = spark(x, y, hx / 17 * speed, hy / 17 * speed, rand(1.4, 1.8), rand(1.5, 2.2), cf(t));
          p.drag = 0.952; p.g = 38 * S;
        }
      } else if (type === 'willow') {
        n = Math.min(room(), Math.round(86 * sz * q));
        for (i = 0; i < n; i++) {
          a = rand(TAU); v = speed * 0.78 * (0.3 + 0.7 * Math.sqrt(Math.random()));
          p = spark(x, y, Math.cos(a) * v, Math.sin(a) * v, rand(2.2, 3.3), rand(1.1, 1.7), cf(a));
          p.drag = 0.935; p.g = 30 * S; p.gl = 0.35;
        }
      } else if (type === 'palm') {
        n = Math.min(room(), Math.round(10 * sz * q) + 3);
        for (i = 0; i < n; i++) {
          a = i / n * TAU + rand(-0.12, 0.12); v = speed * rand(0.95, 1.12);
          p = spark(x, y, Math.cos(a) * v, Math.sin(a) * v, rand(1.3, 1.75), 3, cf(a));
          p.drag = 0.968; p.g = 115 * S; p.gl = 1.3;
        }
      } else if (type === 'crossette') {
        n = Math.min(room(), Math.round(22 * sz * q));
        for (i = 0; i < n; i++) {
          a = i / n * TAU + rand(-0.08, 0.08); v = speed * rand(0.85, 0.95);
          p = spark(x, y, Math.cos(a) * v, Math.sin(a) * v, rand(0.5, 0.68), 2.3, cf(a));
          p.sp = 4; p.g = 60 * S; p.drag = 0.955;
        }
      } else if (type === 'text') {
        var pts = textPoints(op.text || 'E2M'), th = (op.textSize || 120) * S;
        n = Math.min(room(), pts.length, Math.round(260 * sz * q));
        for (i = 0; i < n; i++) {
          p = spark(x, y, 0, 0, 0.6 + rand(1.3, 1.9), rand(1.3, 2), cf());
          p.seek = 0.6; p.tx = x + pts[i][0] * th; p.ty = y + pts[i][1] * th; p.g = 45 * S; p.drag = 0.96; p.st = false; p.fl = 0.15;
        }
      } else { // peony / chrysanthemum / strobe
        n = Math.min(room(), Math.round((type === 'strobe' ? 90 : 112) * sz * q));
        for (i = 0; i < n; i++) {
          a = rand(TAU); v = speed * (Math.random() < 0.72 ? rand(0.82, 1.0) : rand(0.2, 0.82));
          p = spark(x, y, Math.cos(a) * v, Math.sin(a) * v, rand(1.0, 1.65), rand(1.3, 2.3), type === 'strobe' ? pick(['#FFF4DC', '#FFD778']) : cf(a));
          p.g = 88 * S;
          if (type === 'chrysanthemum') { p.gl = 0.45; p.life = p.max = rand(1.4, 2); }
          if (type === 'strobe') { p.fl = 0.55; p.life = p.max = rand(1.5, 2.1); p.drag = 0.95; }
        }
      }
      q = qq;
      if (op.alpha != null && op.alpha < 1) for (i = i0; i < parts.length; i++) parts[i].a = op.alpha;
      if (op.sound !== false) {
        // R3: the realistic engine — size, distance (delay / air / reverb) and stereo position per shell
        var dist = op.distance != null ? op.distance : 0.22, pan = x / Math.max(1, w) * 2 - 1;
        var bsz = type === 'mega' ? 1 : Math.min(1, sz / 1.7), sg = op.gain, bg = !!op.bg;
        audio.play('burst', { size: bsz, distance: dist, pan: pan, gain: sg, bg: bg, echo: op.echo });
        if (/willow|crossette|chrysanthemum|strobe|palm|mega/.test(type) || (sz > 1.05 && Math.random() < 0.45) || op.crackle) setTimeout(function () { audio.play('crackle', { size: bsz, distance: dist, pan: pan, gain: sg, bg: bg }); }, 240 + rand(0, 180));
      }
      ensure();
    }

    function split(p) {
      var S = eng.scale;
      for (var k = 0; k < p.sp; k++) {
        if (alive() >= eng.cap) return;
        var a = Math.atan2(p.vy, p.vx) + Math.PI / 4 + k * Math.PI / 2, v = 130 * S;
        var c = spark(p.x, p.y, Math.cos(a) * v + p.vx * 0.2, Math.sin(a) * v + p.vy * 0.2, rand(0.55, 0.8), 1.5, p.c);
        c.g = 90 * S; c.drag = 0.95; c.a = p.a;
      }
    }

    function rocket(x0, y0, x1, y1, op) {
      op = op || {};
      if (alive() >= eng.cap - 4) { burst(x1, y1, op); if (op.after) { try { op.after(x1, y1); } catch (e) {} } return; }
      var T = op.T || rand(0.72, 1.02);
      var p = spark(x0, y0, (x1 - x0) / T, (y1 - y0) / T, T, 2, '#FFE7A3');
      p.k = ROCKET; p.o = op; p.g = 0; p.drag = 1; p.ph = rand(TAU);
      // R7: 'whistle' (udan rocket), 'mortar' (aerial shell from its tube), 'launch' (default), or none
      var ls = op.launchSound || 'launch';
      if (op.sound !== false && ls !== 'none') audio.play(ls, { size: Math.min(1, (op.size || 1) / 1.8), pan: x0 / Math.max(1, w) * 2 - 1, distance: op.distance != null ? op.distance * 0.75 : 0.1, gain: op.gain, dur: T, bg: !!op.bg });
      ensure();
    }

    /* R7: an emitter is fn(dt, t) called every frame (before the particles) until it returns false — the
       anar fountain, the chakri, the phuljhadi and the ladi string are emitters. eng.emit adds one spark. */
    eng.addEmitter = function (fn) { emitters.push(fn); ensure(); return function () { var i = emitters.indexOf(fn); if (i > -1) emitters.splice(i, 1); }; };
    eng.emit = function (x, y, vx, vy, life, size, c, po) {
      if (alive() >= eng.cap) return null;
      var p = spark(x, y, vx, vy, life, size, toHex(c));
      if (po) { if (po.g != null) p.g = po.g; if (po.drag != null) p.drag = po.drag; if (po.st != null) p.st = po.st; if (po.fl != null) p.fl = po.fl; if (po.gl != null) p.gl = po.gl; if (po.a != null) p.a = po.a; if (po.sp) p.sp = po.sp; }
      ensure();
      return p;
    };
    eng.room = room;
    eng.colorFn = colorFn;
    /* R7: a soft light drawn this frame (emitters use it for an anar mouth, a chakri hub, a sparkler tip) */
    eng.glow = function (x, y, r, c, a) {
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.max(0, Math.min(1, a)) * (o.trails ? 0.45 : 1);
      drawGlow(ctx, toHex(c), x - r, y - r, r * 2);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    };
    eng.isTrails = function () { return o.trails; };
    eng.firework = function (x, y, op) {
      op = op || {};
      if (op.rocket) {
        var fx = op.fromX != null ? op.fromX : x + rand(-w * 0.08, w * 0.08);
        var fy = op.fromY != null ? op.fromY : h + 10;
        rocket(fx, fy, x, y, op);
      } else burst(x, y, op);
    };
    eng.burst = burst;
    eng.flash = flash;

    eng.sparkBurst = function (x, y, color, n) {
      n = Math.min(room(), Math.round((n || 36) * (E2M.reduced ? 0.4 : 1)));
      var cf = color === 'multi' ? function () { return pick(MULTI); } : (color === 'rainbow' ? function () { return RAINBOW[(Math.random() * 24) | 0]; } : (function () { var c = toHex(color || '#FFD778'); return function () { return c; }; })());
      for (var i = 0; i < n; i++) {
        var a = rand(TAU), v = rand(60, 270) * eng.scale;
        var p = spark(x, y, Math.cos(a) * v, Math.sin(a) * v, rand(0.35, 0.85), rand(1, 2.1), cf());
        p.drag = 0.92; p.g = 160;
      }
      ensure();
    };

    eng.confetti = function (x, y, n, co) {
      co = co || {};
      n = Math.min(room(), Math.round((n || 60) * (E2M.reduced ? 0.4 : (E2M.mobile ? 0.7 : 1))));
      var ang = co.angle != null ? co.angle : -Math.PI / 2, spr = co.spread != null ? co.spread : Math.PI * 0.62;
      var pow = (co.power || 760) * Math.max(0.75, eng.scale);
      for (var i = 0; i < n; i++) {
        var p = pool.pop() || {}, a = ang + rand(-spr / 2, spr / 2), v = rand(0.4, 1) * pow;
        p.k = CONF; p.x = x; p.y = y; p.vx = Math.cos(a) * v; p.vy = Math.sin(a) * v;
        p.life = p.max = rand(2.6, 4.2); p.w = rand(6, 11); p.h = rand(3, 6); p.c = pick(CONFETTI);
        p.rot = rand(TAU); p.vr = rand(-11, 11); p.ph = rand(TAU); p.sway = rand(18, 55); p.drag = 0.962; p.g = 520; p.tr = false; p.o = null;
        solids.push(p);
      }
      ensure();
    };

    // po.calm: marigold-only, smaller and slower (ambient use). Default: the festive marigold + rose mix.
    eng.petals = function (n, po) {
      po = po || {};
      n = Math.min(room(), Math.round((n || 24) * (E2M.reduced ? 0.3 : (E2M.mobile ? 0.6 : 1))));
      for (var i = 0; i < n; i++) {
        var p = pool.pop() || {}, rose = !po.calm && Math.random() < 0.35;
        p.k = PETAL; p.x = rand(-20, w + 20); p.y = rand(-h * 0.25, -12); p.vx = rand(-18, 18); p.vy = po.calm ? rand(18, 34) : rand(42, 92);
        p.life = p.max = po.calm ? 40 : 16; p.w = rose ? rand(9, 13) : rand(6, 9) * (po.calm ? 0.8 : 1); p.h = rose ? rand(12, 17) : rand(9, 13) * (po.calm ? 0.8 : 1);
        p.c = rose ? pick(['#D7264F', '#E5487A', '#C2185B']) : (po.calm ? pick(['#E9A43A', '#D98A22', '#F2C15A']) : pick(PETALS.slice(0, 5)));
        p.rot = rand(TAU); p.vr = rand(-2.2, 2.2); p.ph = rand(TAU); p.sway = rand(16, 44); p.tr = false; p.o = null;
        solids.push(p);
      }
      ensure();
    };

    eng.goldenRain = function (n) {
      n = Math.min(room(), Math.round((n || 200) * q));
      for (var i = 0; i < n; i++) {
        var p = spark(rand(0, w), rand(-h * 0.15, h * 0.3), rand(-12, 12), rand(5, 60), rand(2.3, 4.2), rand(1, 1.9), pick(GOLDS));
        p.g = 55; p.drag = 0.985; p.fl = 0.3; p.gl = 0.04;
      }
      flash(w / 2, h * 0.15, '#FFD778', Math.max(w, h) * 0.6);
      ensure();
    };

    eng.trail = function (x, y) {
      if (trailCount > 60 || alive() >= eng.cap) return;
      var p = spark(x, y, rand(-26, 26), rand(-34, 8), rand(0.32, 0.6), rand(0.8, 1.7), pick(['#FFD778', '#FFC46A', '#FFF4DC']));
      p.g = -18; p.drag = 0.94; p.st = false; p.tr = true; trailCount++;
      ensure();
    };

    eng.show = function (ms, so) {
      so = so || {};
      ms = ms || 6000;
      var inten = so.intensity || 1, t0 = performance.now(), stopped = false, resolveFn;
      var prevCap = eng.cap;
      if (inten > 1 && (!E2M.reduced || so.live)) eng.cap = Math.round(prevCap * (E2M.mobile ? 1.3 : Math.min(2, inten)));
      var types = ['peony', 'ring', 'willow', 'palm', 'crossette', 'chrysanthemum', 'heart', 'strobe', 'peony'];
      var done = new Promise(function (r) { resolveFn = r; });
      function tick() {
        if (stopped) return;
        var el = performance.now() - t0;
        if (el >= ms) { finish(); return; }
        if (E2M.reduced && !so.live) {
          eng.firework(rand(0.2, 0.8) * w, rand(0.2, 0.45) * h, { type: 'peony', size: 0.7 });
          setTimeout(tick, 900); return;
        }
        var grand = ms - el < 1500, k = grand ? 3 : (Math.random() < 0.2 ? 4 : (Math.random() < 0.45 ? 2 : 1));
        for (var i = 0; i < k; i++) {
          var x = k >= 3 ? w * (0.1 + 0.8 * (i / (k - 1))) + rand(-30, 30) : rand(0.08, 0.92) * w;
          eng.firework(x, rand(0.1, 0.46) * h, {
            rocket: true, type: pick(types),
            color: Math.random() < 0.5 ? 'multi' : pick(['gold', 'saffron', 'pink', 'purple', 'orange']),
            size: rand(0.8, 1.35) * (grand ? 1.2 : 1) * (inten > 1 ? 1.1 : 1), sound: i === 0
          });
        }
        setTimeout(tick, grand ? rand(170, 260) : rand(260, 520) / Math.max(1, inten * 0.85));
      }
      function finish() {
        if (stopped) return;
        stopped = true;
        setTimeout(function () { eng.cap = prevCap; resolveFn(); }, 1800);
      }
      tick();
      done.stop = finish;
      return done;
    };

    eng.count = alive;
    eng.clear = function () {
      parts.forEach(recycle); solids.forEach(recycle); parts.length = 0; solids.length = 0; flashes.length = 0; trailCount = 0;
      ctx.clearRect(0, 0, w, h);
    };
    eng.pause = function () { paused = true; if (raf) { cancelAnimationFrame(raf); raf = 0; } };
    eng.resume = function () { if (!paused) return; paused = false; ensure(); };
    eng.isPaused = function () { return paused; };

    /* R7 fix: a burst or an emitter that adds sparks DURING a frame used to call ensure() while raf was 0, which
       started a second rAF chain next to the one the frame schedules itself — every in-frame burst (each rocket
       breaking) added another chain that redrew and stepped everything again, until the engine went idle. A long
       show piled up dozens of chains (~50,000 sprite draws a frame for ~1,000 sparks). Inside a frame, ensure() is
       now a no-op: the frame always schedules its own successor while anything is alive. */
    var inFrame = false;
    function ensure() {
      if (raf || paused || inFrame) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
    eng.ensure = ensure;

    function frame(t) {
      inFrame = true;
      try { frameBody(t); } finally { inFrame = false; }
    }
    function frameBody(t) {
      raf = 0;
      if (paused) return;
      var dt = Math.min(0.05, Math.max(0.001, (t - last) / 1000)); last = t;
      if (o.trails) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(0,0,0,' + o.fade + ')';
        ctx.fillRect(0, 0, w, h);
      } else ctx.clearRect(0, 0, w, h);
      var busy = false;
      if (o.under) {
        try { busy = !!o.under(ctx, dt, t, w, h); } catch (e) { busy = false; }
        ctx.globalAlpha = 1; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      if (emitters.length) {
        for (var ei = emitters.length - 1; ei >= 0; ei--) {
          var keepE = false;
          try { keepE = emitters[ei](dt, t) !== false; } catch (er) { keepE = false; }
          if (!keepE) emitters.splice(ei, 1);
        }
        if (emitters.length) busy = true;
        ctx.globalAlpha = 1; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      ctx.globalCompositeOperation = 'lighter';
      var i, j, p, f, a, wind = eng.wind || 0;
      for (i = flashes.length - 1; i >= 0; i--) {
        f = flashes[i]; f.life -= dt;
        if (f.life <= 0) { flashes.splice(i, 1); continue; }
        a = f.life / f.max;
        // On a trail canvas the fade pass already decays what was drawn; redrawing a flash every frame would
        // stack it into a bright disc whose low-alpha rim never fully fades (8-bit rounding). Draw it briefly.
        var fr = f.r;
        if (o.trails) { if (f.max - f.life > 0.05) continue; ctx.globalAlpha = 0.5 * Math.min(1, f.a); fr = f.r * 0.36; }
        else ctx.globalAlpha = a * a * 0.9 * f.a;
        drawGlow(ctx, f.c, f.x - fr, f.y - fr, fr * 2);
      }

      var S = eng.scale, keep = 0;
      for (j = 0; j < parts.length; j++) {
        p = parts[j];
        p.life -= dt;
        if (p.k === ROCKET) {
          if (p.life <= 0) {
            var op = p.o, bx = p.x, by = p.y; recycle(p); burst(bx, by, op);
            if (op && op.after) { try { op.after(bx, by); } catch (e) {} }
            continue;
          }
          p.px = p.x; p.py = p.y;
          var wob = p.o && p.o.wobble ? p.o.wobble : 0.4;
          p.x += p.vx * dt + Math.sin(t * 0.03 + p.ph) * wob; p.y += p.vy * dt;
          p.vx *= 0.995; p.vy *= 0.993; p.vx += wind * 0.25 * dt;
          var ra = p.o && p.o.alpha != null ? p.o.alpha : 1, rh = p.o && p.o.head ? p.o.head : 1, tl = p.o && p.o.tail ? p.o.tail : 0;
          if (alive() < eng.cap) {
            var e = spark(p.x, p.y, rand(-22, 22) * rh, rand(15, 70) * rh, rand(0.22, 0.5) * (tl ? 1.4 : 1), rand(0.8, 1.6) * rh, Math.random() < 0.5 ? '#FFC46A' : '#FF9F32');
            e.g = 80; e.st = false; e.a = ra;
          }
          if (tl) { // R7: a long, tapered rising streak so the climb itself reads from far away
            var tx0 = p.x - p.vx * 0.075 * tl, ty0 = p.y - p.vy * 0.075 * tl, lg = ctx.createLinearGradient(tx0, ty0, p.x, p.y);
            lg.addColorStop(0, 'rgba(255,170,70,0)'); lg.addColorStop(0.6, 'rgba(255,196,106,' + (0.45 * ra).toFixed(2) + ')'); lg.addColorStop(1, 'rgba(255,240,200,' + (0.95 * ra).toFixed(2) + ')');
            ctx.globalAlpha = 1; ctx.strokeStyle = lg; ctx.lineWidth = 2.2 * rh; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(tx0, ty0); ctx.lineTo(p.x, p.y); ctx.stroke();
          }
          ctx.globalAlpha = ra; ctx.strokeStyle = '#FFE7A3'; ctx.lineWidth = 2 * rh;
          ctx.beginPath(); ctx.moveTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03); ctx.lineTo(p.x, p.y); ctx.stroke();
          drawDot(ctx, '#FFF4DC', p.x - 6 * rh, p.y - 6 * rh, 12 * rh);
          parts[keep++] = p;
          continue;
        }
        if (p.life <= 0) { if (p.sp) split(p); recycle(p); continue; }
        p.px = p.x; p.py = p.y;
        if (p.seek > 0) {
          p.seek -= dt;
          var kk = 1 - Math.pow(0.0006, dt);
          p.x += (p.tx - p.x) * kk; p.y += (p.ty - p.y) * kk;
          if (p.seek <= 0) { p.vx = rand(-14, 14); p.vy = rand(-12, 8); }
        } else {
          var d = Math.pow(p.drag, dt * 60);
          p.vx *= d; p.vy *= d; p.vy += p.g * dt; p.vx += wind * dt;
          p.x += p.vx * dt; p.y += p.vy * dt;
          if (p.gl && Math.random() < p.gl * dt * 18 && alive() < eng.cap) {
            var gsp = spark(p.x, p.y, rand(-12, 12), rand(-6, 18), rand(0.35, 0.75), 0.9, '#FFE7A3');
            gsp.g = 45 * S; gsp.st = false; gsp.fl = 0.4; gsp.a = p.a;
          }
        }
        var lr = p.life / p.max;
        a = (lr < 0.38 ? lr / 0.38 : 1) * p.a;
        if (p.fl && Math.random() < p.fl) a *= 0.2;
        if (a < 0.03) { parts[keep++] = p; continue; } // R7 perf: an invisible spark costs no draw calls
        if (p.st && p.vx * p.vx + p.vy * p.vy > 1600) { // R7 perf: a slow spark's streak would be < 3px — skip the stroke
          ctx.globalAlpha = a * 0.9; ctx.strokeStyle = p.c; ctx.lineWidth = p.size * 0.55;
          ctx.beginPath(); ctx.moveTo(p.x - p.vx * 0.07, p.y - p.vy * 0.07); ctx.lineTo(p.x, p.y); ctx.stroke();
        }
        ctx.globalAlpha = a;
        var s = p.size * 2.1;
        drawDot(ctx, p.c, p.x - s, p.y - s, s * 2);
        parts[keep++] = p;
      }
      parts.length = keep;

      if (solids.length) {
        ctx.globalCompositeOperation = 'source-over';
        keep = 0;
        for (j = 0; j < solids.length; j++) {
          p = solids[j];
          p.life -= dt;
          if (p.life <= 0 || p.y > h + 60) { recycle(p); continue; }
          p.ph += dt * (p.k === PETAL ? 1.7 : 5);
          if (p.k === CONF) {
            var dd = Math.pow(p.drag, dt * 60);
            p.vx *= dd; p.vy = p.vy * dd + p.g * dt;
            p.x += (p.vx + Math.sin(p.ph) * p.sway * 0.6) * dt; p.y += p.vy * dt;
          } else {
            p.x += (p.vx + Math.sin(p.ph) * p.sway) * dt; p.y += p.vy * dt;
          }
          p.rot += p.vr * dt;
          var fa = p.life < 0.8 ? p.life / 0.8 : 1;
          var flip = Math.cos(p.ph * (p.k === CONF ? 1 : 0.6));
          var cr = Math.cos(p.rot), sr = Math.sin(p.rot);
          ctx.globalAlpha = fa * (p.k === PETAL ? 0.92 : 1);
          ctx.setTransform(dpr * cr, dpr * sr, -dpr * sr * flip, dpr * cr * flip, dpr * p.x, dpr * p.y);
          ctx.fillStyle = p.c;
          if (p.k === CONF) ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          else {
            ctx.beginPath(); ctx.moveTo(0, -p.h / 2);
            ctx.quadraticCurveTo(p.w * 0.62, -p.h * 0.1, 0, p.h / 2);
            ctx.quadraticCurveTo(-p.w * 0.62, -p.h * 0.1, 0, -p.h / 2);
            ctx.fill();
          }
          solids[keep++] = p;
        }
        solids.length = keep;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      if (parts.length + solids.length + flashes.length === 0 && !busy) {
        if (!o.trails || ++idle > 30) { ctx.clearRect(0, 0, w, h); idle = 0; return; }
      } else idle = 0;
      raf = requestAnimationFrame(frame);
    }
    return eng;
  }

  /* Overlay fx (fixed, full viewport, pointer-events:none) */
  var fxEng = null;
  function fxe() {
    if (fxEng) return fxEng;
    var c = D.getElementById('e2m-fx');
    if (!c) {
      c = D.createElement('canvas'); c.id = 'e2m-fx'; c.setAttribute('aria-hidden', 'true');
      (D.body || D.documentElement).appendChild(c);
    }
    fxEng = makeEngine(c, { fullscreen: true, cap: E2M.maxParticles });
    var rt = 0;
    W.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(fxEng.resize, 120); });
    return fxEng;
  }
  E2M.fx = {
    confetti: function (x, y, n, o) { fxe().confetti(x, y, n, o); },
    petals: function (n, o) { fxe().petals(n, o); },
    sparkBurst: function (x, y, color, n) { fxe().sparkBurst(x, y, color, n); },
    firework: function (x, y, opts) { fxe().firework(x, y, opts); },
    fireworkShow: function (ms, o) { return fxe().show(ms, o); },
    goldenRain: function (n) { fxe().goldenRain(n); },
    flash: function (x, y, color, r) { fxe().flash(x, y, color, r); },
    count: function () { return fxe().count(); },
    engine: function (canvas, opts) { return makeEngine(canvas, opts); }
  };

  /* ------------------------------------------------------------------ */
  /* Revision 3 — full-screen effect layers                               */
  /* E2M.screenLayer(key, { z:'back'|'front'|number, blend })             */
  /*  -> { canvas, ctx, w, h, dpr, key, visible, clear(), destroy(),       */
  /*       onResize(fn) }                                                  */
  /*  A fixed, full-viewport, pointer-events:none, DPR-correct (<=2)       */
  /*  canvas. ctx is pre-scaled: draw in CSS px. Idempotent per key.       */
  /*  'back' (default) = above sky + zone scenery, BELOW zone text and     */
  /*  controls; 'front' = above content, below HUD/toolkit/toasts.          */
  /*  dprMax (default 2, mobile 1.5) caps the backing resolution.          */
  /*  Shares the zone lifecycle: fades out (and is cleared) when zone      */
  /*  <key> leaves the viewport, fades back in on enter. `visible` mirrors */
  /*  that; skip drawing when false.                                       */
  /* ------------------------------------------------------------------ */
  var layers = {};
  function layerZ(z) {
    if (typeof z === 'number') return z;
    return z === 'front' ? 'var(--z-screen-front, 48)' : 'var(--z-screen-back, 1)';
  }
  E2M.screenLayer = function (key, o) {
    o = o || {};
    if (layers[key]) return layers[key];
    var c = D.createElement('canvas');
    c.className = 'e2m-screen e2m-screen--' + (o.z === 'front' ? 'front' : 'back');
    c.setAttribute('aria-hidden', 'true');
    c.setAttribute('data-screen', key);
    c.style.zIndex = layerZ(o.z);
    if (o.blend) c.style.mixBlendMode = o.blend;
    /* 'back' lives inside its zone (between .zone-scenery z0 and .zone-stage z2, which is the only way to sit
       under that zone's text and controls); position:fixed still makes it cover the whole viewport. */
    var zoneEl = o.z !== 'front' && typeof o.z !== 'number' ? D.getElementById('zone-' + key) : null;
    if (zoneEl) zoneEl.insertBefore(c, zoneEl.querySelector('.zone-stage') || zoneEl.firstChild);
    else (D.body || D.documentElement).appendChild(c);
    var L = { canvas: c, ctx: c.getContext('2d'), w: 1, h: 1, dpr: 1, key: key, visible: false, _rs: [] };
    var dmax = o.dprMax || (E2M.mobile ? 1.5 : 2);
    function resize() {
      L.w = W.innerWidth; L.h = W.innerHeight;
      L.dpr = Math.min(W.devicePixelRatio || 1, dmax);
      c.width = Math.max(1, Math.round(L.w * L.dpr)); c.height = Math.max(1, Math.round(L.h * L.dpr));
      L.ctx.setTransform(L.dpr, 0, 0, L.dpr, 0, 0);
      L._rs.forEach(function (fn) { try { fn(L); } catch (e) {} });
    }
    var rt = 0; function onRs() { clearTimeout(rt); rt = setTimeout(resize, 100); }
    W.addEventListener('resize', onRs);
    resize();
    L.resize = resize;
    L.onResize = function (fn) { L._rs.push(fn); return L; };
    L.clear = function () { L.ctx.setTransform(1, 0, 0, 1, 0, 0); L.ctx.clearRect(0, 0, c.width, c.height); L.ctx.setTransform(L.dpr, 0, 0, L.dpr, 0, 0); };
    L.show = function (on) { L.visible = !!on; c.classList.toggle('is-on', L.visible); };
    L.destroy = function () { W.removeEventListener('resize', onRs); if (c.parentNode) c.parentNode.removeChild(c); delete layers[key]; };
    L.show(E2M.isActive(key) || !registry[key]);
    layers[key] = L;
    return L;
  };
  E2M.on('zone:enter', function (k) { if (layers[k]) layers[k].show(true); });
  E2M.on('zone:leave', function (k) { var L = layers[k]; if (L) { L.show(false); setTimeout(function () { if (!L.visible) L.clear(); }, 700); } });

  /* E2M.screenGlow(color, power 0..1, x?, y?) — a full-viewport radial light that blooms and breathes
     out (~0.9–1.8s). x,y are viewport coords (default centre). Rate-capped, flash-safe (<= 3/sec,
     peak opacity <= .34 at power 1), soft-only in Calm, nothing when paused. Returns nothing. */
  var glowTimes = [], glowLive = 0;
  E2M.screenGlow = function (color, power, x, y) {
    if (!D.body || D.hidden || E2M.isPaused()) return;
    power = Math.max(0, Math.min(1, Number(power) || 0.5));
    var now = performance.now();
    while (glowTimes.length && now - glowTimes[0] > 1000) glowTimes.shift();
    if (glowTimes.length >= 3 || glowLive >= 3) return;
    glowTimes.push(now); glowLive++;
    var calm = E2M.isCalm(), hex = toHex(color);
    /* Revision 3 (perf): the light is a tiny 128px canvas (one pre-rendered radial gradient per colour,
       cached) stretched by CSS to the bloom size, animated with opacity + transform only — no blend mode, no
       filter, no repaint of a huge gradient. It lives inside the zone at the point (between the scenery and the
       stage, like a 'back' screen layer), so it lights the scenery but never sits over text or controls. */
    var px = x == null ? W.innerWidth / 2 : x, py = y == null ? W.innerHeight / 2 : y;
    var R = Math.round((0.38 + 0.52 * power) * Math.max(W.innerWidth, W.innerHeight)), dur = Math.round(900 + 900 * power);
    var g = D.createElement('canvas');
    g.width = g.height = 128; g.className = 'e2m-sglow'; g.setAttribute('aria-hidden', 'true');
    g.getContext('2d').drawImage(glowDisc(hex), 0, 0);
    g.style.cssText = 'left:' + (px - R).toFixed(0) + 'px;top:' + (py - R).toFixed(0) + 'px;width:' + R * 2 + 'px;height:' + R * 2 + 'px;--go:' +
      ((calm ? 0.12 : 0.3) * (0.35 + 0.65 * power)).toFixed(3) + ';--gd:' + dur + 'ms';
    var host = null, zs = D.querySelectorAll('.zone.is-active');
    for (var i = 0; i < zs.length && !host; i++) { var r = zs[i].getBoundingClientRect(); if (py >= r.top && py <= r.bottom) host = zs[i]; }
    host = host || zs[0] || null;
    if (host) host.insertBefore(g, host.querySelector('.zone-stage') || host.firstChild); else D.body.appendChild(g);
    setTimeout(function () { glowLive--; if (g.parentNode) g.parentNode.removeChild(g); }, dur + 80);
  };
  var discCache = {};
  function glowDisc(hex) {
    var c = discCache[hex]; if (c) return c;
    c = D.createElement('canvas'); c.width = c.height = 128;
    var g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64), n = parseInt(hex.slice(1), 16);
    var R0 = n >> 16 & 255, G0 = n >> 8 & 255, B0 = n & 255, mix = function (k) { return Math.round(k + (255 - k) * 0.18); };
    r.addColorStop(0, 'rgba(' + mix(R0) + ',' + mix(G0) + ',' + mix(B0) + ',1)');
    r.addColorStop(0.3, 'rgba(' + R0 + ',' + G0 + ',' + B0 + ',.46)');
    r.addColorStop(0.65, 'rgba(' + R0 + ',' + G0 + ',' + B0 + ',.12)');
    r.addColorStop(1, 'rgba(' + R0 + ',' + G0 + ',' + B0 + ',0)');
    g.fillStyle = r; g.fillRect(0, 0, 128, 128);
    return (discCache[hex] = c);
  }

  /* ------------------------------------------------------------------ */
  /* Revision 3 — the Hindu temple kit (shared SVG geometry)              */
  /* var k = E2M.temple.kit();                                            */
  /*  k.shikhara(cx, base, w, h, { spires, flag, bands, lit, door })      */
  /*    NAGARA tower: curvilinear profile, bhumi bands, amalaka disc,     */
  /*    kalasha + dhvaja; spires 1|2 adds clustered urushringas           */
  /*  k.gopuram(cx, base, w, h, { tiers, kalashas, lit, flag })           */
  /*    DRAVIDIAN gateway: base storey + doorway, tapering tiers with     */
  /*    kuta / shala shrines and niches, barrel-vault crown, kalasha row  */
  /*  k.mandapa(x, base, w, h, { steps, lit })  pillared hall, chhajja,   */
  /*    stepped phamsana roof, kalasha                                    */
  /*  k.deepmala(cx, base, h, { rows })  lamp tower (lamps -> k.lamp)      */
  /*  k.house(x, base, w, h, { lit, rnd })  haveli with a jharokha         */
  /*  k.wall(x, base, w, h, { niche })  prakara wall with diya niches      */
  /*  k.torana(cx, base, w, h)  pillars + three lintels with volutes       */
  /*  k.steps(x0, x1, base, n, stepH)  ghat steps                          */
  /*  k.svg({ id, fill, stroke, strokeOpacity, lineOpacity, win, lamp,    */
  /*         flag, cls })  -> '<defs/><g>…</g>' markup                     */
  /* Every shape is complete (finials, flags) and stands on its base line; */
  /* all sub-paths are wound clockwise, so one joined path never punches   */
  /* holes. k.pts holds tower outlines (for strings of lamps).             */
  /* ------------------------------------------------------------------ */
  function q1(n) { return Math.round(n * 10) / 10; }
  function rectD(x, y, w, h) { return 'M' + q1(x) + ' ' + q1(y + h) + 'V' + q1(y) + 'H' + q1(x + w) + 'V' + q1(y + h) + 'Z'; }
  function ellD(cx, cy, rx, ry) { return 'M' + q1(cx - rx) + ' ' + q1(cy) + 'A' + q1(rx) + ' ' + q1(ry) + ' 0 1 1 ' + q1(cx + rx) + ' ' + q1(cy) + 'A' + q1(rx) + ' ' + q1(ry) + ' 0 1 1 ' + q1(cx - rx) + ' ' + q1(cy) + 'Z'; }
  function triD(x0, y0, xa, ya, x1, y1) { return 'M' + q1(x0) + ' ' + q1(y0) + 'L' + q1(xa) + ' ' + q1(ya) + 'L' + q1(x1) + ' ' + q1(y1) + 'Z'; }
  function vaultD(cx, y, w, vh) { var x0 = cx - w / 2, x1 = cx + w / 2; return 'M' + q1(x0) + ' ' + q1(y) + 'V' + q1(y - vh * 0.45) + 'C' + q1(x0) + ' ' + q1(y - vh * 1.08) + ' ' + q1(x1) + ' ' + q1(y - vh * 1.08) + ' ' + q1(x1) + ' ' + q1(y - vh * 0.45) + 'V' + q1(y) + 'Z'; }
  function doorD(cx, base, w, h) { var x0 = cx - w / 2, x1 = cx + w / 2, s = Math.min(w * 0.14, h * 0.08); return 'M' + q1(x0) + ' ' + q1(base) + 'V' + q1(base - h + s * 2) + 'H' + q1(x0 + s) + 'V' + q1(base - h + s) + 'H' + q1(x0 + s * 2) + 'V' + q1(base - h) + 'H' + q1(x1 - s * 2) + 'V' + q1(base - h + s) + 'H' + q1(x1 - s) + 'V' + q1(base - h + s * 2) + 'H' + q1(x1) + 'V' + q1(base) + 'Z'; }
  function bz(a, b, c, d, t) { var u = 1 - t; return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d; }
  function templeKit() {
    var k = { sil: [], line: [], win: [], lamp: [], flag: [], spill: [], pts: [], z: 0 };
    function S(d) { k.sil.push({ d: d, z: k.z }); }
    function Ln(d) { k.line.push({ d: d, z: k.z }); }
    function Wn(d, o) { k.win.push({ d: d, o: o == null ? 0.5 : o, z: k.z }); }
    k.S = S; k.L = Ln; k.W = Wn;
    /* a temple kalasha: lotus seat, the pot, a narrow neck, the leaf rim, the coconut and a thin finial spike —
       stacked, so it never reads as a single onion bulb */
    k.kalasha = function (cx, y, r) {
      S(ellD(cx, y - r * 0.22, r * 1.2, r * 0.26));
      S(ellD(cx, y - r * 0.9, r * 0.95, r * 0.7));
      S(rectD(cx - r * 0.28, y - r * 1.86, r * 0.56, r * 0.34));
      S(ellD(cx, y - r * 1.96, r * 0.66, r * 0.2));
      S(ellD(cx, y - r * 2.36, r * 0.38, r * 0.3));
      S(rectD(cx - r * 0.09, y - r * 3.5, r * 0.18, r * 0.96));
      return y - r * 3.5;
    };
    k.dhvaja = function (x, y, len, side) {
      side = side || 1;
      S(rectD(x - 0.6, y - len, 1.2, len));
      var fy = y - len, fw = len * 0.72;
      k.flag.push({ d: 'M' + q1(x) + ' ' + q1(fy) + 'L' + q1(x + side * fw) + ' ' + q1(fy + len * 0.12) + 'L' + q1(x + side * fw * 0.74) + ' ' + q1(fy + len * 0.2) + 'L' + q1(x + side * fw) + ' ' + q1(fy + len * 0.3) + 'L' + q1(x) + ' ' + q1(fy + len * 0.35) + 'Z', z: k.z });
    };
    k.shikhara = function (cx, base, w, h, o) {
      o = o || {};
      var hw = w / 2;
      if (o.spires) {
        var sw = w * 0.52, sh = h * 0.58;
        if (o.spires > 1) { k.shikhara(cx - hw * 1.18, base, sw * 0.72, sh * 0.66, { flag: false, bands: 3, door: false }); k.shikhara(cx + hw * 1.18, base, sw * 0.72, sh * 0.66, { flag: false, bands: 3, door: false }); }
        k.shikhara(cx - hw * 0.74, base, sw, sh, { flag: false, bands: 4, door: false });
        k.shikhara(cx + hw * 0.74, base, sw, sh, { flag: false, bands: 4, door: false });
      }
      k.z++;
      var T = base - h * 0.8, wall = base - h * 0.13, tx = hw * 0.3, x0 = cx - hw, x1 = cx + hw;
      var c1y = wall - (wall - T) * 0.56, c2y = T + (wall - T) * 0.08, c2x = cx - hw * 0.66;
      S('M' + q1(x0) + ' ' + q1(base) + 'V' + q1(wall) + 'C' + q1(x0) + ' ' + q1(c1y) + ' ' + q1(c2x) + ' ' + q1(c2y) + ' ' + q1(cx - tx) + ' ' + q1(T) +
        'H' + q1(cx + tx) + 'C' + q1(2 * cx - c2x) + ' ' + q1(c2y) + ' ' + q1(x1) + ' ' + q1(c1y) + ' ' + q1(x1) + ' ' + q1(wall) + 'V' + q1(base) + 'Z');
      var nb = o.bands || 6, i, t, y, xl;
      for (i = 1; i <= nb; i++) {
        t = i / (nb + 1); y = bz(wall, c1y, c2y, T, t); xl = bz(x0, x0, c2x, cx - tx, t);
        Ln('M' + q1(xl) + ' ' + q1(y) + 'H' + q1(2 * cx - xl));
      }
      Ln('M' + q1(x0) + ' ' + q1(wall) + 'H' + q1(x1));
      Ln('M' + q1(cx - hw * 0.22) + ' ' + q1(wall) + 'L' + q1(cx - tx * 0.5) + ' ' + q1(T) + 'M' + q1(cx + hw * 0.22) + ' ' + q1(wall) + 'L' + q1(cx + tx * 0.5) + ' ' + q1(T));
      var pts = [], j, u;
      for (j = 0; j <= 14; j++) { u = j / 14; pts.push([bz(x0, x0, c2x, cx - tx, u), bz(wall, c1y, c2y, T, u)]); }
      for (j = 14; j >= 0; j--) { u = j / 14; pts.push([2 * cx - bz(x0, x0, c2x, cx - tx, u), bz(wall, c1y, c2y, T, u)]); }
      k.pts.push(pts);
      // griva (neck), then the amalaka: a wide, flat, ribbed stone disc
      var ny = T - h * 0.016, ar = h * 0.024, arx = tx * 1.34;
      S(rectD(cx - tx * 0.62, ny, tx * 1.24, T - ny + 0.6));
      S(ellD(cx, ny - ar, arx, ar));
      for (j = -3; j <= 3; j++) Ln('M' + q1(cx + j * arx * 0.27) + ' ' + q1(ny - ar * 1.8) + 'V' + q1(ny - ar * 0.2));
      S(rectD(cx - tx * 0.4, ny - ar * 2.3, tx * 0.8, ar * 0.42));
      var top = k.kalasha(cx, ny - ar * 2.2, Math.max(1.5, tx * 0.34));
      if (o.flag !== false) k.dhvaja(cx, top + 1, h * 0.16, o.flagSide || 1);
      if (o.door !== false) Wn(doorD(cx, base, hw * 0.34, Math.min(h * 0.16, (base - wall) * 1.15)), o.lit == null ? 0.55 : o.lit);
      return top;
    };
    k.gopuram = function (cx, base, w, h, o) {
      o = o || {};
      k.z++;
      var n = o.tiers || 5, hb = h * (o.hb || 0.3), crownH = h * (o.crown || 0.12), th = (h - hb - crownH) / n, i, q;
      S(rectD(cx - w / 2, base - hb, w, hb));
      if (o.door !== false) {
        Ln('M' + q1(cx - w / 2) + ' ' + q1(base - hb * 0.5) + 'H' + q1(cx + w / 2) + 'M' + q1(cx - w / 2) + ' ' + q1(base - hb * 0.08) + 'H' + q1(cx + w / 2));
        Wn(doorD(cx, base, w * (o.doorW || 0.2), hb * 0.84), o.lit == null ? 0.62 : o.lit);
        [-1, 1].forEach(function (sd) { Wn(rectD(cx + sd * w * 0.3 - w * 0.04, base - hb * 0.78, w * 0.08, hb * 0.22), 0.18); });
      }
      var y = base - hb, wi = w * 0.94;
      for (i = 0; i < n; i++) {
        var wn = w * (0.94 - 0.5 * (i + 1) / n);
        S('M' + q1(cx - wi / 2) + ' ' + q1(y) + 'L' + q1(cx - wn / 2) + ' ' + q1(y - th) + 'H' + q1(cx + wn / 2) + 'L' + q1(cx + wi / 2) + ' ' + q1(y) + 'Z');
        S(rectD(cx - wi / 2 - w * 0.025, y - th * 0.15, wi + w * 0.05, th * 0.15));
        var ky = y - th * 0.15, ks = th * 0.42;
        [-1, 1].forEach(function (sd) {
          var kx = cx + sd * (wi / 2 - ks * 0.3);
          S(rectD(kx - ks / 2, ky - ks * 0.55, ks, ks * 0.55));
          S(triD(kx - ks * 0.38, ky - ks * 0.55, kx, ky - ks * 1.05, kx + ks * 0.38, ky - ks * 0.55));
        });
        S(vaultD(cx, ky, ks * 1.6, ks * 0.66));
        var nn = Math.max(1, Math.round(wn / (th * 1.15)));
        for (q = 0; q < nn; q++) { var nx = cx - wn / 2 + (q + 0.5) * wn / nn; Wn(rectD(nx - th * 0.11, y - th * 0.82, th * 0.22, th * 0.44), (q + i) % 3 === 0 ? 0.42 : 0.12); }
        Ln('M' + q1(cx - wi / 2 - w * 0.025) + ' ' + q1(y - th * 0.15) + 'H' + q1(cx + wi / 2 + w * 0.025));
        y -= th; wi = wn;
      }
      S(vaultD(cx, y, wi * 1.04, crownH * 0.62));
      [-1, 1].forEach(function (sd) { S(ellD(cx + sd * wi * 0.5, y - crownH * 0.3, crownH * 0.2, crownH * 0.24)); });
      var nk = o.kalashas || 5, kr = Math.max(1.3, crownH * 0.095), top = y;
      for (q = 0; q < nk; q++) { var kx2 = cx - wi * 0.36 + q * (wi * 0.72) / (nk - 1); top = Math.min(top, k.kalasha(kx2, y - crownH * 0.56, kr)); }
      if (o.flag) k.dhvaja(cx, top + 1, h * 0.1);
      return top;
    };
    k.mandapa = function (x, base, w, h, o) {
      o = o || {};
      k.z++;
      var ph = h * 0.13, colTop = base - h * 0.6, n = Math.max(2, Math.round(w / (h * 0.3))), i;
      S(rectD(x - w * 0.04, base - ph, w * 1.08, ph));
      Ln('M' + q1(x - w * 0.04) + ' ' + q1(base - ph * 0.5) + 'H' + q1(x + w * 1.04));
      S(rectD(x, colTop, w, base - ph - colTop));
      var pw = w * 0.045, bay = (w - pw) / n, rnd = o.rnd || Math.random;
      for (i = 0; i < n; i++) { var bx = x + pw + i * bay; Wn(rectD(bx + bay * 0.06, colTop + h * 0.08, bay - pw - bay * 0.12, base - ph - colTop - h * 0.08), o.lit == null ? 0.18 + rnd() * 0.32 : o.lit); }
      for (i = 0; i <= n; i++) { var px = x + pw / 2 + i * bay; Ln('M' + q1(px - pw * 0.2) + ' ' + q1(base - ph) + 'V' + q1(colTop + h * 0.08) + 'M' + q1(px + pw * 0.2) + ' ' + q1(base - ph) + 'V' + q1(colTop + h * 0.08) + 'M' + q1(px - pw * 1.1) + ' ' + q1(colTop + h * 0.07) + 'H' + q1(px + pw * 1.1)); }
      var ey = colTop;
      S('M' + q1(x - w * 0.1) + ' ' + q1(ey + h * 0.06) + 'L' + q1(x) + ' ' + q1(ey - h * 0.035) + 'H' + q1(x + w) + 'L' + q1(x + w * 1.1) + ' ' + q1(ey + h * 0.06) + 'Z');
      var ry = ey - h * 0.035, rw = w * 0.9, steps = o.steps || 3, sh = h * 0.075;
      for (i = 0; i < steps; i++) { S(rectD(x + (w - rw) / 2, ry - sh, rw, sh)); Ln('M' + q1(x + (w - rw) / 2) + ' ' + q1(ry - sh * 0.3) + 'H' + q1(x + (w + rw) / 2)); ry -= sh; rw *= 0.72; }
      S(triD(x + (w - rw) / 2, ry, x + w / 2, ry - sh * 1.2, x + (w + rw) / 2, ry));
      return k.kalasha(x + w / 2, ry - sh * 1.05, Math.max(1.5, h * 0.028));
    };
    k.deepmala = function (cx, base, h, o) {
      o = o || {};
      k.z++;
      var bw = h * 0.095, tw = h * 0.056, rows = o.rows || 9, i;
      S(rectD(cx - bw * 1.15, base - h * 0.05, bw * 2.3, h * 0.05));
      S(rectD(cx - bw * 0.85, base - h * 0.09, bw * 1.7, h * 0.04));
      S('M' + q1(cx - bw / 2) + ' ' + q1(base - h * 0.09) + 'L' + q1(cx - tw / 2) + ' ' + q1(base - h * 0.9) + 'H' + q1(cx + tw / 2) + 'L' + q1(cx + bw / 2) + ' ' + q1(base - h * 0.09) + 'Z');
      var lr = Math.max(1.1, h * 0.0075);
      for (i = 0; i < rows; i++) {
        var t = (i + 0.5) / rows, y = base - h * 0.13 - t * h * 0.72, half = (bw + (tw - bw) * t) / 2, arm = half * 0.85 + h * 0.012;
        S(rectD(cx - half - arm, y, (half + arm) * 2, Math.max(0.8, h * 0.008)));
        k.lamp.push([cx - half - arm, y - lr * 1.2, lr], [cx + half + arm, y - lr * 1.2, lr]);
        if (i % 2 === 0) k.lamp.push([cx, y - h * 0.035, lr * 0.85]);
      }
      S(rectD(cx - tw * 0.95, base - h * 0.935, tw * 1.9, h * 0.035));
      k.lamp.push([cx - tw * 0.8, base - h * 0.95, lr], [cx + tw * 0.8, base - h * 0.95, lr]);
      k.spill.push([cx, base - h * 0.45, h * 0.42, h * 0.55]);
      return k.kalasha(cx, base - h * 0.935, Math.max(1.4, tw * 0.3));
    };
    k.house = function (x, base, w, h, o) {
      o = o || {};
      k.z++;
      var rnd = o.rnd || Math.random, i;
      S(rectD(x, base - h, w, h));
      S(rectD(x - w * 0.03, base - h - h * 0.06, w * 1.06, h * 0.06));
      Ln('M' + q1(x) + ' ' + q1(base - h * 0.5) + 'H' + q1(x + w));
      var kr = Math.max(1.3, h * 0.03);
      k.kalasha(x + w * 0.07, base - h - h * 0.06, kr); k.kalasha(x + w * 0.93, base - h - h * 0.06, kr);
      var jw = Math.min(w * 0.38, h * 0.5), jx = x + (w - jw) / 2, jh = h * 0.27, jy = base - h * 0.84;
      S(rectD(jx - jw * 0.08, jy, jw * 1.16, jh));
      S('M' + q1(jx - jw * 0.22) + ' ' + q1(jy + 0.6) + 'L' + q1(jx - jw * 0.06) + ' ' + q1(jy - jh * 0.2) + 'H' + q1(jx + jw * 1.06) + 'L' + q1(jx + jw * 1.22) + ' ' + q1(jy + 0.6) + 'Z');
      S(triD(jx + jw * 0.1, jy - jh * 0.2, jx + jw / 2, jy - jh * 0.55, jx + jw * 0.9, jy - jh * 0.2));
      [0.08, 0.5, 0.92].forEach(function (f) { S(triD(jx + jw * f - jw * 0.06, jy + jh, jx + jw * f, jy + jh * 1.35, jx + jw * f + jw * 0.06, jy + jh)); });
      Wn(rectD(jx + jw * 0.1, jy + jh * 0.16, jw * 0.8, jh * 0.68), o.lit == null ? 0.25 + rnd() * 0.4 : o.lit);
      var cols = Math.max(1, Math.floor(w / Math.max(10, h * 0.26)));
      for (i = 0; i < cols; i++) {
        var wx = x + (i + 0.5) * w / cols, ww = Math.min(w / cols * 0.42, h * 0.11);
        Wn(rectD(wx - ww / 2, base - h * 0.38, ww, h * 0.2), 0.06 + rnd() * 0.36);
      }
      return base - h - h * 0.06 - kr * 3.4;
    };
    k.wall = function (x, base, w, h, o) {
      o = o || {};
      k.z++;
      S(rectD(x, base - h, w, h));
      S(rectD(x - 2, base - h - h * 0.1, w + 4, h * 0.1));
      Ln('M' + q1(x) + ' ' + q1(base - h * 0.2) + 'H' + q1(x + w));
      var step = o.niche || Math.max(14, h * 0.6), lr = Math.max(0.8, h * 0.0105);
      for (var nx = x + step / 2; nx < x + w - 2; nx += step) {
        Wn(rectD(nx - lr * 1.8, base - h * 0.72, lr * 3.6, h * 0.3), 0.1);
        k.lamp.push([nx, base - h * 0.5, lr]);
      }
    };
    k.torana = function (cx, base, w, h) {
      k.z++;
      var pw = w * 0.075, lh = h * 0.06, gap = h * 0.13, i;
      S(rectD(cx - w / 2, base - h, pw, h)); S(rectD(cx + w / 2 - pw, base - h, pw, h));
      for (i = 0; i < 3; i++) {
        var ly = base - h - i * gap, ext = w * 0.1 + i * w * 0.025;
        S(rectD(cx - w / 2 - ext, ly - lh, w + ext * 2, lh));
        S(ellD(cx - w / 2 - ext, ly - lh / 2, lh * 0.8, lh * 0.8)); S(ellD(cx + w / 2 + ext, ly - lh / 2, lh * 0.8, lh * 0.8));
        if (i < 2) { S(rectD(cx - w / 2, ly - gap, pw, gap)); S(rectD(cx + w / 2 - pw, ly - gap, pw, gap)); S(rectD(cx - pw / 2, ly - gap, pw, gap)); }
      }
      return k.kalasha(cx, base - h - 2 * gap - lh, Math.max(1.6, w * 0.045));
    };
    k.steps = function (x0, x1, base, n, sh) {
      k.z++;
      S(rectD(x0, base - n * sh, x1 - x0, n * sh));
      for (var i = 1; i <= n; i++) Ln('M' + q1(x0) + ' ' + q1(base - i * sh) + 'H' + q1(x1));
    };
    /* a band of temple town between x0 and x1 (far layers): shrines, gopurams, havelis, mandapas, lamp towers */
    k.town = function (x0, x1, base, o) {
      o = o || {};
      var rnd = o.rnd || Math.random, sc = o.scale || 1, x = x0, r, w;
      while (x < x1) {
        r = rnd();
        if (r < 0.26) { w = (40 + rnd() * 34) * sc; k.shikhara(x + w / 2, base, w, w * (2.1 + rnd() * 0.8), { bands: 4, lit: 0.08 + rnd() * 0.3, flag: rnd() < 0.5, spires: rnd() < 0.3 ? 1 : 0 }); x += w * (rnd() < 0.3 ? 1.7 : 1.25) + 6 * sc; }
        else if (r < 0.4) { w = (70 + rnd() * 44) * sc; k.gopuram(x + w / 2, base, w, w * (1.35 + rnd() * 0.45), { tiers: 3 + (rnd() * 3 | 0), kalashas: 3 + (rnd() * 3 | 0), lit: 0.12 + rnd() * 0.3 }); x += w + 8 * sc; }
        else if (r < 0.62) { w = (60 + rnd() * 70) * sc; k.house(x, base, w, (44 + rnd() * 46) * sc, { rnd: rnd }); x += w + 4 * sc; }
        else if (r < 0.8) { w = (60 + rnd() * 60) * sc; k.mandapa(x, base, w, w * (0.55 + rnd() * 0.25), { rnd: rnd }); x += w * 1.14 + 6 * sc; }
        else if (r < 0.9) { k.deepmala(x + 9 * sc, base, (80 + rnd() * 60) * sc, { rows: 7 }); x += 26 * sc; }
        else { w = (40 + rnd() * 60) * sc; k.wall(x, base, w, (22 + rnd() * 16) * sc); x += w; }
      }
      return k;
    };
    k.svg = function (o) {
      o = o || {};
      var id = o.id || 'tk', sil = k.sil.map(function (s) { return s.d; }).join(''), ln = k.line.map(function (s) { return s.d; }).join('');
      var out = '<defs><radialGradient id="' + id + '-spill"><stop offset="0" stop-color="#FFB547" stop-opacity=".5"/><stop offset=".45" stop-color="#FF9F32" stop-opacity=".16"/><stop offset="1" stop-color="#FF9F32" stop-opacity="0"/></radialGradient>' +
        '<radialGradient id="' + id + '-halo"><stop offset="0" stop-color="#FFE7A3" stop-opacity=".7"/><stop offset=".3" stop-color="#FFB547" stop-opacity=".26"/><stop offset="1" stop-color="#FF9F32" stop-opacity="0"/></radialGradient></defs>';
      /* only:'static' = silhouette, hairlines, windows (never repaints); only:'live' = light spill, flickering
         lamps and swaying flags, to be rendered in a SEPARATE overlay <svg> with the same viewBox, so their CSS
         animation never forces the big silhouette path to repaint every frame */
      var st = o.only !== 'live', lv = o.only !== 'static';
      out += '<g class="tk ' + (o.cls || '') + '">';
      if (lv && k.spill.length && o.spill !== false) out += '<g class="tk-spill">' + k.spill.map(function (s) { return '<ellipse cx="' + q1(s[0]) + '" cy="' + q1(s[1]) + '" rx="' + q1(s[2]) + '" ry="' + q1(s[3]) + '" fill="url(#' + id + '-spill)"/>'; }).join('') + '</g>';
      if (st) out += '<path class="tk-sil" fill="' + (o.fill || '#090619') + '" d="' + sil + '"/>';
      if (st) out += '<path class="tk-edge" fill="none" stroke="' + (o.stroke || '#FFD778') + '" stroke-opacity="' + (o.strokeOpacity == null ? 0.1 : o.strokeOpacity) + '" stroke-width="' + (o.sw || 1) + '" vector-effect="non-scaling-stroke" d="' + sil + '"/>';
      if (st && ln) out += '<path class="tk-line" fill="none" stroke="' + (o.stroke || '#FFD778') + '" stroke-opacity="' + (o.lineOpacity == null ? 0.07 : o.lineOpacity) + '" stroke-width="' + (o.sw || 1) + '" vector-effect="non-scaling-stroke" d="' + ln + '"/>';
      if (st && k.win.length && o.win !== false) out += '<g class="tk-wins" fill="' + (o.winFill || '#E8A94A') + '">' + k.win.map(function (s) { return '<path d="' + s.d + '" opacity="' + s.o.toFixed(2) + '"/>'; }).join('') + '</g>';
      if (lv && k.lamp.length && o.lamp !== false) {
        var grp = ['', '', ''];
        k.lamp.forEach(function (l, i) { grp[i % 3] += '<circle cx="' + q1(l[0]) + '" cy="' + q1(l[1]) + '" r="' + q1(l[2] * 3.6) + '" fill="url(#' + id + '-halo)"/><circle cx="' + q1(l[0]) + '" cy="' + q1(l[1]) + '" r="' + q1(l[2]) + '" fill="#FFE2A0"/>'; });
        out += grp.map(function (g, i) { return g ? '<g class="tk-lamps tk-lamps--' + i + '">' + g + '</g>' : ''; }).join('');
      }
      if (lv && k.flag.length && o.flag !== false) out += '<g class="tk-flags" fill="' + (o.flagFill || '#C8642C') + '">' + k.flag.map(function (f, i) { return '<path class="tk-flag" style="animation-delay:-' + (i * 0.73 % 3).toFixed(2) + 's" d="' + f.d + '"/>'; }).join('') + '</g>';
      return out + '</g>';
    };
    return k;
  }
  function seededRnd(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  E2M.temple = { kit: templeKit, rect: rectD, door: doorD, ellipse: ellD, tri: triD, seeded: seededRnd };

  /* ------------------------------------------------------------------ */
  /* Revision 3 — input type: 'touch' (finger, pen) or 'mouse'. Mirrors   */
  /* html.is-touch so copy can say "tap" or "click". Event input:change.  */
  /* ------------------------------------------------------------------ */
  E2M.input = mqCoarse.matches ? 'touch' : 'mouse';
  D.documentElement.classList.toggle('is-touch', E2M.input === 'touch');
  W.addEventListener('pointerdown', function (e) {
    var t = e.pointerType === 'mouse' ? 'mouse' : (e.pointerType ? 'touch' : E2M.input);
    if (t === E2M.input) return;
    E2M.input = t; D.documentElement.classList.toggle('is-touch', t === 'touch');
    E2M.emit('input:change', t);
  }, true);

  /* ------------------------------------------------------------------ */
  /* Revision 3/4/7 — the Fireworks Playground's background show          */
  /* #e2m-ambient: a fixed canvas between the sky (z0) and the page (z2), */
  /* feathered to the Fireworks zone's on-screen box (CSS mask; core sets */
  /* --at / --ab). It runs ONLY while that zone is in view (R4) and fades */
  /* when it leaves; elsewhere the page stays calm dark space.            */
  /* R7: a lively, mixed show — about one launch every 0.4-1.2s, with     */
  /*  - udan ROCKETS: long rising streaks with a whistle, small crackling */
  /*    breaks; aerial SHELLS from mortar tubes: small and large peonies, */
  /*    rings, willows, palms, crossettes, strobes, chrysanthemums, hearts*/
  /*  - three depths: FAR (tiny, hazy, dim, quiet; heard late with more    */
  /*    echo), MID, NEAR (big, bright, loud; a 1-3px nudge, rate-limited) */
  /*  - rainbow / gold / pink-purple / multicolour / saffron-green shells */
  /*  - volleys (3-5 fanned), whistling rocket pairs, a far ladi crackle,  */
  /*    a salvo every ~8-12s and short rushes of activity                 */
  /*  Shells avoid the boxes where text sits (headers carry a dark scrim). */
  /*  Runs under OS reduced motion (the zone shows a one-time chip with a  */
  /*  Turn off); stops for Pause or a Calm the visitor chose in Tools.     */
  /*  Effects intensity scales the density; particle caps hold; large     */
  /*  flashes share the 3-per-second budget (E2M.flashGate).              */
  /* E2M.ambient.boost(m) | fire(kind) | smoke(x,y,size,color) | hold(on)  */
  /*  | wind(px/s^2) | touch() | isOn() | stats() | resetStats()           */
  /* Events: 'ambient:launch' {depth,kind}, 'ambient:burst' {x,y,color,    */
  /*  size,near,kind}.                                                     */
  /* ------------------------------------------------------------------ */
  function ambStats0() { return { launches: 0, bursts: 0, rockets: 0, shells: 0, airbursts: 0, small: 0, large: 0, far: 0, mid: 0, near: 0, volleys: 0, salvos: 0, rocketPairs: 0, crackleRuns: 0, rushes: 0, nudges: 0 }; }
  var amb = { eng: null, cv: null, t: 0, boost: 1, smoke: [], embers: [], flock: null, nextFlock: 0, run: false, zoneOn: false, zone: null, offT: 0, clipRaf: 0,
    hold: false, nextSalvo: 0, rushUntil: 0, nextRush: 0, wind: 0, userAt: 0, timers: [], stats: ambStats0() };
  function ambZone() { return amb.zone || (amb.zone = D.getElementById('zone-fireworks')); }
  function ambSkyRect() {
    var z = ambZone(); if (!z) return null;
    var sky = z.querySelector('.fw-sky');
    return { z: z.getBoundingClientRect(), s: sky ? sky.getBoundingClientRect() : z.getBoundingClientRect() };
  }
  function ambClip() {
    amb.clipRaf = 0;
    if (!amb.cv) return;
    var z = ambZone(); if (!z) return;
    var r = z.getBoundingClientRect();
    amb.cv.style.setProperty('--at', Math.round(r.top) + 'px');
    amb.cv.style.setProperty('--ab', Math.round(r.bottom) + 'px');
  }
  function ambClipReq() { if (!amb.clipRaf && (amb.run || amb.zoneOn)) amb.clipRaf = requestAnimationFrame(ambClip); }
  var DEPTH = {
    far: { size: [0.18, 0.42], alpha: [0.4, 0.6], dist: [0.8, 1], y: [0.08, 0.42], speed: 0.82, gain: 0.32, head: 0.5, tail: 0.9, T: [1.15, 1.6], rise: 0.24 },
    mid: { size: [0.46, 0.82], alpha: [0.62, 0.84], dist: [0.45, 0.7], y: [0.1, 0.46], speed: 0.92, gain: 0.42, head: 0.78, tail: 1.2, T: [0.9, 1.25], rise: 0.1 },
    near: { size: [0.95, 1.45], alpha: [0.86, 1], dist: [0.16, 0.32], y: [0.07, 0.42], speed: 1, gain: 0.52, head: 1, tail: 1.55, T: [0.82, 1.1], rise: 0 }
  };
  var AMB_SHELLS = ['peony', 'peony', 'chrysanthemum', 'willow', 'ring', 'palm', 'crossette', 'strobe', 'peony', 'chrysanthemum', 'ring', 'heart'];
  var TEXT_SEL = '.zh-kicker, .zh-title, .zh-line, .zh-hint, .opening-copy, .fn-reveal.is-on, .fn-go:not([hidden]), .foot-line, .foot-small, .act-fireworks .fw-guide:not(.is-gone) p, .act-fireworks .fw-status:not([hidden]) > :not([hidden])';
  function ambOK() { return !E2M.prefs.paused && !calmExplicit() && !D.hidden && !amb.hold && amb.zoneOn; }
  function ambCap() { return Math.round((E2M.mobile ? 230 : 600) * INTENSITY[E2M.prefs.intensity]); }
  function ambColour() {
    var r = Math.random();
    return r < 0.38 ? 'rainbow' : (r < 0.53 ? 'gold' : (r < 0.68 ? 'pinkpurple' : (r < 0.82 ? 'multi' : (r < 0.9 ? 'saffrongreen' : pick(['teal', 'orange', 'purple', 'ivory', 'pink'])))));
  }
  function ambDepth() { var r = Math.random(); return r < 0.38 ? 'far' : (r < 0.7 ? 'mid' : 'near'); }
  function textBoxes(R) {
    var out = [], vh = W.innerHeight;
    D.querySelectorAll(TEXT_SEL).forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (!r.width || r.bottom < -R || r.top > vh + R) return;
      out.push({ l: r.left - R, r: r.right + R, t: r.top - R, b: r.bottom + R });
    });
    return out;
  }
  function ambBand(d) {
    var e = amb.eng, rr = ambSkyRect(), y0 = d.y[0] * e.h, y1 = d.y[1] * e.h;
    // only inside the Fireworks zone's open sky: below its top edge, above the temple town
    if (rr) { y0 = Math.max(y0, rr.z.top + 150); y1 = Math.min(y1, rr.s.bottom - rr.s.height * 0.42); }
    return { y0: y0, y1: y1, rr: rr };
  }
  function ambSpot(d, R, near) {
    var e = amb.eng, boxes = textBoxes(R), b = ambBand(d);
    if (b.y1 - b.y0 < 40) return null;
    for (var k = 0; k < 12; k++) {
      var x = near != null ? E2M.clamp(near + rand(-90, 90), e.w * 0.03, e.w * 0.97) : rand(0.04, 0.96) * e.w, y = rand(b.y0, b.y1), ok = true;
      for (var i = 0; i < boxes.length; i++) { var bx = boxes[i]; if (x > bx.l && x < bx.r && y > bx.t && y < bx.b) { ok = false; break; } }
      if (ok) return { x: x, y: y, rr: b.rr };
    }
    return null;
  }
  function ambBase(rr) { var e = amb.eng; return rr ? Math.min(e.h + 14, rr.s.bottom - rr.s.height * 0.1) : e.h + 14; }
  function ambLater(fn, ms) {
    var id = setTimeout(function () { var i = amb.timers.indexOf(id); if (i > -1) amb.timers.splice(i, 1); if (amb.run) fn(); }, ms);
    amb.timers.push(id);
  }
  /* one background launch. depth 'far'|'mid'|'near'; kind 'rocket' (udan, whistling streak) | 'shell' */
  function ambFire(depth, kind, o) {
    var e = amb.eng; if (!e || !amb.run) return false;
    o = o || {};
    depth = DEPTH[depth] ? depth : 'mid'; kind = kind === 'rocket' ? 'rocket' : 'shell';
    var d = DEPTH[depth], size = (o.size || rand(d.size[0], d.size[1])) * (depth === 'near' && E2M.mobile ? 0.78 : 1);
    // text keeps a clear margin about the size of the shell's core (its faint halo may pass behind a scrim)
    var p = ambSpot(d, (depth === 'near' ? 80 : 110) * Math.min(1.2, size) * e.scale, o.x);
    if (!p) { if (depth !== 'far' && !o.noFallback) return ambFire(depth === 'near' ? 'mid' : 'far', kind, { noFallback: depth !== 'near', x: o.x }); return false; }
    var color = o.color || ambColour(), rocketBreak = kind === 'rocket';
    var type = o.type || (rocketBreak ? pick(['crossette', 'peony', 'strobe', 'peony']) : pick(AMB_SHELLS));
    var bsize = rocketBreak ? size * 0.62 : size;
    var op = { type: type, color: color, size: bsize, alpha: rand(d.alpha[0], d.alpha[1]), speed: d.speed, distance: rand(d.dist[0], d.dist[1]),
      gain: d.gain, head: d.head, bg: true, sound: depth !== 'far' || Math.random() < 0.75, crackle: rocketBreak, echo: depth === 'far' ? 1.3 : 1 };
    var base = ambBase(p.rr), from = base - (p.rr ? p.rr.s.height * d.rise : 0);
    // far shells sometimes just appear high up (their climb is lost in the haze); everything else climbs
    var air = !rocketBreak && depth === 'far' && Math.random() < 0.35;
    if (!air && from - p.y < 120) air = true;
    var st = amb.stats; st.launches++; st[depth]++;
    if (rocketBreak) st.rockets++; else if (air) st.airbursts++; else st.shells++;
    if (size < 0.5) st.small++; else if (size >= 0.95) st.large++;
    E2M.emit('ambient:launch', { depth: depth, kind: air ? 'air' : kind, size: size });
    function after(x, y) {
      st.bursts++;
      var c = color === 'rainbow' ? E2M.nextHue() : (PALS[color] ? PALS[color][0] : toHex(color));
      if (depth !== 'far') ambSmoke(x, y, size, c);
      // R7: near shells give the zone a small translate-only nudge (1-3px), never while the visitor is playing
      if (depth === 'near' && performance.now() - amb.userAt > 1200) {
        if (E2M.shake(1 + 2 * E2M.clamp((size - 0.95) / 0.5, 0, 1), 420, { x: x, y: y, kind: 'ambient', zone: 'fireworks' })) st.nudges++;
      }
      E2M.emit('ambient:burst', { x: x, y: y, color: c, size: size, near: depth === 'near', kind: depth });
    }
    if (air) { e.firework(p.x, p.y, op); after(p.x, p.y); return true; }
    op.rocket = true; op.fromX = E2M.clamp(p.x + rand(-60, 60) + (o.lean || 0), 6, e.w - 6); op.fromY = from;
    op.T = rand(d.T[0], d.T[1]) * (rocketBreak ? 0.92 : 1); op.after = after;
    op.tail = rocketBreak ? d.tail * 1.35 : d.tail * 0.7;
    op.wobble = rocketBreak ? 1.3 : 0.4;
    op.launchSound = rocketBreak ? (depth === 'far' ? 'launch' : 'whistle') : (depth === 'far' ? 'none' : 'mortar');
    e.firework(p.x, p.y, op);
    return true;
  }
  function ambVolley() {
    var depth = Math.random() < 0.5 ? 'mid' : (Math.random() < 0.7 ? 'far' : 'near'), n = 3 + (Math.random() * 3 | 0);
    var x0 = rand(0.18, 0.82) * amb.eng.w, sp = (depth === 'far' ? 70 : 120) * amb.eng.scale, color = ambColour(), type = pick(AMB_SHELLS), gap = rand(110, 240);
    amb.stats.volleys++;
    for (var i = 0; i < n; i++) (function (i) {
      ambLater(function () { ambFire(depth, 'shell', { x: x0 + (i - (n - 1) / 2) * sp, color: color, type: type, lean: (i - (n - 1) / 2) * 40 }); }, i * gap);
    })(i);
  }
  function ambRocketPair() {
    amb.stats.rocketPairs++;
    var depth = Math.random() < 0.6 ? 'mid' : 'near', w = amb.eng.w;
    ambFire(depth, 'rocket', { x: w * rand(0.12, 0.3), lean: -80 });
    ambLater(function () { ambFire(depth, 'rocket', { x: w * rand(0.7, 0.88), lean: 80 }); }, rand(160, 420));
  }
  /* a far ladi going off somewhere in the temple town: a run of tiny pops along the horizon, one crackle */
  function ambCrackleRun() {
    var e = amb.eng, rr = ambSkyRect(); if (!rr) return;
    var y = rr.s.bottom - rr.s.height * rand(0.36, 0.46); if (y < rr.z.top + 150 || y > e.h - 30) return;
    amb.stats.crackleRuns++;
    var n = 10 + (Math.random() * 9 | 0), x = rand(0.08, 0.7) * e.w, dir = 1, gap = rand(45, 75), c = pick(['#FFF4DC', '#FFD778', '#FFE7A3']);
    for (var i = 0; i < n; i++) (function (i) {
      ambLater(function () { e.burst(x + dir * i * rand(9, 15), y + rand(-6, 6), { type: 'peony', size: rand(0.06, 0.11), color: c, alpha: 0.55, sound: false, sub: true }); }, i * gap);
    })(i);
    audio.play('crackle', { size: 0.35, distance: 0.85, pan: x / Math.max(1, e.w) * 2 - 1, gain: 0.5, bg: true });
  }
  function ambSalvo() {
    var e = amb.eng, n = 7 + (Math.random() * 4 | 0), color = Math.random() < 0.5 ? 'rainbow' : ambColour();
    amb.stats.salvos++;
    for (var i = 0; i < n; i++) (function (i) {
      var side = i % 2 ? 1 : -1, k = Math.floor(i / 2) / Math.max(1, Math.ceil(n / 2) - 1);
      var x = e.w * (0.5 + side * (0.42 - 0.3 * k)) + rand(-30, 30), depth = i < 2 ? 'far' : (i < n - 2 ? 'mid' : 'near');
      ambLater(function () { ambFire(depth, Math.random() < 0.3 ? 'rocket' : 'shell', { x: x, color: color, lean: -side * 50 }); }, i * rand(140, 230));
    })(i);
    // the salvo's last word: one big near shell in the middle
    ambLater(function () { ambFire('near', 'shell', { x: e.w * rand(0.35, 0.65), size: rand(1.35, 1.6), type: pick(['willow', 'chrysanthemum', 'peony', 'ring']), color: color }); }, n * 190 + 260);
  }
  function ambTick() {
    clearTimeout(amb.t);
    if (!amb.eng || !amb.run) return;
    var now = performance.now(), inten = INTENSITY[E2M.prefs.intensity] * amb.boost;
    if (now >= amb.nextSalvo) { ambSalvo(); amb.nextSalvo = now + rand(8000, 12000) / Math.max(0.6, Math.min(1.6, inten)); }
    else {
      var r = Math.random();
      if (r < 0.11) ambVolley();
      else if (r < 0.17) ambRocketPair();
      else if (r < 0.22) ambCrackleRun();
      else ambFire(ambDepth(), Math.random() < 0.34 ? 'rocket' : 'shell');
    }
    if (now > amb.nextRush) { amb.rushUntil = now + rand(2600, 4200); amb.nextRush = now + rand(16000, 26000); amb.stats.rushes++; }
    var rush = now < amb.rushUntil ? 0.5 : 1;
    amb.t = setTimeout(ambTick, rand(400, 1200) * rush / Math.max(0.45, inten));
  }
  /* smoke: spent shells leave a soft drifting cloud, briefly lit by its own colour */
  var smokeSprite = null;
  function ambSmoke(x, y, size, c) {
    if (!amb.eng || !amb.run) return;
    if (!smokeSprite) {
      smokeSprite = D.createElement('canvas'); smokeSprite.width = smokeSprite.height = 96;
      var g = smokeSprite.getContext('2d'), r = g.createRadialGradient(48, 48, 0, 48, 48, 48);
      r.addColorStop(0, 'rgba(120,112,150,1)'); r.addColorStop(0.5, 'rgba(92,84,122,.5)'); r.addColorStop(1, 'rgba(70,64,100,0)');
      g.fillStyle = r; g.fillRect(0, 0, 96, 96);
    }
    var n = size > 0.9 ? 3 : 2;
    for (var i = 0; i < n && amb.smoke.length < 30; i++) {
      amb.smoke.push({ x: x + rand(-40, 40) * size, y: y + rand(-24, 30) * size, r: rand(50, 90) * size, gr: rand(6, 12), vx: rand(4, 14) + amb.wind * 0.4, vy: rand(-5, 3),
        life: rand(7, 11), max: 0, a: rand(0.035, 0.06) * Math.min(1, 0.55 + size * 0.4), c: toHex(c) });
      amb.smoke[amb.smoke.length - 1].max = amb.smoke[amb.smoke.length - 1].life;
    }
    amb.eng.ensure();
  }
  function newEmber(e, any) {
    return { x: rand(0, e.w), y: any ? rand(e.h * 0.45, e.h) : e.h + rand(4, 30), vy: -rand(10, 24), sw: rand(6, 18), ph: rand(TAU), r: rand(0.9, 2), a: rand(0.22, 0.5), tw: rand(0.6, 1.6), c: pick(['#FFB547', '#FFD778', '#FF9F32', '#FFE7A3']) };
  }
  function ambUnder(ctx, dt, t, w, h) {
    var busy = amb.run, i;
    // smoke (beneath everything, normal blending)
    for (i = amb.smoke.length - 1; i >= 0; i--) {
      var s = amb.smoke[i]; s.life -= dt;
      if (s.life <= 0) { amb.smoke.splice(i, 1); continue; }
      s.x += s.vx * dt; s.y += s.vy * dt; s.r += s.gr * dt;
      var k = s.life / s.max, age = s.max - s.life, fade = Math.min(1, age / 0.8) * Math.min(1, k * 2.2);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = s.a * fade;
      ctx.drawImage(smokeSprite, s.x - s.r, s.y - s.r, s.r * 2, s.r * 2);
      if (age < 1.4) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.1 * (1 - age / 1.4) * fade; drawGlow(ctx, s.c, s.x - s.r * 0.9, s.y - s.r * 0.9, s.r * 1.8); }
    }
    if (!amb.run) return amb.smoke.length > 0;
    // rising embers
    ctx.globalCompositeOperation = 'lighter';
    var want = E2M.mobile ? 6 : 11;
    while (amb.embers.length < want) amb.embers.push(newEmber(amb.eng, amb.embers.length < want - 2));
    if (amb.embers.length > want) amb.embers.length = want;
    for (i = 0; i < amb.embers.length; i++) {
      var m = amb.embers[i];
      m.y += m.vy * dt; m.ph += dt * 0.8; m.x += amb.wind * 0.15 * dt;
      if (m.y < h * 0.3) { amb.embers[i] = newEmber(amb.eng, false); continue; }
      var fy = Math.min(1, (m.y - h * 0.3) / (h * 0.25)), x = m.x + Math.sin(m.ph) * m.sw;
      ctx.globalAlpha = m.a * fy * (0.65 + 0.35 * Math.sin(t / 1000 * m.tw * 3 + m.ph));
      drawDot(ctx, m.c, x - m.r * 2, m.y - m.r * 2, m.r * 4);
    }
    // a rare flock of birds crossing the night (faint ivory strokes)
    if (!amb.flock && t > amb.nextFlock) {
      if (amb.nextFlock) {
        var dir = Math.random() < 0.5 ? 1 : -1, fb = [], nb = 3 + (Math.random() * 4 | 0), fy0 = h * rand(0.1, 0.3);
        for (i = 0; i < nb; i++) fb.push({ dx: -i * rand(16, 26), dy: (i % 2 ? 1 : -1) * Math.ceil(i / 2) * rand(7, 12), ph: rand(TAU), s: rand(4, 6.5) });
        amb.flock = { x: dir > 0 ? -60 : w + 60, y: fy0, dir: dir, v: rand(55, 85), b: fb, drift: rand(-6, 6) };
      }
      amb.nextFlock = t + rand(45000, 90000);
    }
    if (amb.flock) {
      var F = amb.flock; F.x += F.dir * F.v * dt; F.y += F.drift * dt;
      ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = 'rgba(255,244,220,.3)'; ctx.lineWidth = 1.1; ctx.globalAlpha = 1;
      ctx.beginPath();
      for (i = 0; i < F.b.length; i++) {
        var B = F.b[i], bx = F.x + B.dx * F.dir, by = F.y + B.dy, fl = Math.sin(t / 1000 * 9 + B.ph) * B.s * 0.55;
        ctx.moveTo(bx - B.s, by - fl); ctx.quadraticCurveTo(bx - B.s * 0.4, by - fl * 0.2, bx, by); ctx.quadraticCurveTo(bx + B.s * 0.4, by - fl * 0.2, bx + B.s, by - fl);
      }
      ctx.stroke();
      if ((F.dir > 0 && F.x > w + 140) || (F.dir < 0 && F.x < -140)) amb.flock = null;
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    return busy;
  }
  function ambSync() {
    if (!amb.eng) return;
    var on = ambOK();
    amb.eng.cap = ambCap();
    if (on === amb.run) return;
    amb.run = on;
    clearTimeout(amb.offT);
    if (on) {
      var now = performance.now();
      ambClip(); amb.cv.classList.add('is-on'); amb.eng.resume(); amb.eng.ensure();
      amb.nextSalvo = now + rand(3200, 5600); amb.nextRush = now + rand(9000, 14000);
      clearTimeout(amb.t); amb.t = setTimeout(ambTick, rand(250, 600));
    } else {
      clearTimeout(amb.t); amb.timers.forEach(clearTimeout); amb.timers.length = 0;
      amb.cv.classList.remove('is-on');
      var hard = E2M.prefs.paused || calmExplicit() || D.hidden;
      amb.offT = setTimeout(function () { if (amb.run) return; amb.eng.clear(); amb.smoke.length = 0; amb.embers.length = 0; amb.flock = null; amb.eng.pause(); }, hard ? 0 : 950);
    }
  }
  function ambInit() {
    if (amb.eng || !D.body) return;
    var c = D.createElement('canvas'); c.id = 'e2m-ambient'; c.setAttribute('aria-hidden', 'true');
    D.body.appendChild(c);
    amb.cv = c;
    amb.eng = makeEngine(c, { fullscreen: true, dprMax: E2M.mobile ? 1 : 1.25, cap: ambCap(), under: ambUnder, q: E2M.mobile ? 0.55 : 0.8 });
    var rt = 0;
    W.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { amb.eng.resize(); amb.embers.length = 0; }, 140); });
    E2M.on('prefs:change', ambSync);
    D.addEventListener('visibilitychange', ambSync);
    E2M.on('zone:enter', function (k) { if (k === 'fireworks') { amb.zoneOn = true; ambSync(); } });
    E2M.on('zone:leave', function (k) { if (k === 'fireworks') { amb.zoneOn = false; ambSync(); } });
    W.addEventListener('scroll', ambClipReq, { passive: true });
    W.addEventListener('resize', ambClipReq);
    amb.eng.pause();
    ambSync();
  }
  E2M.ambient = {
    boost: function (m) { amb.boost = Math.max(0.3, Math.min(2.6, Number(m) || 1)); }, // only matters while the Fireworks zone is active
    fire: function (kind) {
      if (!amb.run) return false;
      if (kind === 'volley') { ambVolley(); return true; }
      if (kind === 'salvo') { ambSalvo(); return true; }
      if (kind === 'rocket') return ambFire(ambDepth(), 'rocket');
      return ambFire(DEPTH[kind] ? kind : 'mid', 'shell');
    },
    smoke: function (x, y, size, color) { ambSmoke(x, y, size == null ? 0.8 : size, color || '#FFD778'); },
    isOn: function () { return amb.run; },
    /* hold(true) quiets the background crackers (e.g. while an activity owns the whole screen); hold(false) resumes */
    hold: function (on) { amb.hold = !!on; ambSync(); },
    wind: function (v) { amb.wind = Number(v) || 0; if (amb.eng) amb.eng.wind = amb.wind * 0.6; },
    touch: function () { amb.userAt = performance.now(); },
    stats: function () { var o = {}, k; for (k in amb.stats) o[k] = amb.stats[k]; o.particles = amb.eng ? amb.eng.count() : 0; o.cap = amb.eng ? amb.eng.cap : 0; o.run = amb.run; return o; },
    resetStats: function () { amb.stats = ambStats0(); }
  };

  /* ------------------------------------------------------------------ */
  /* Scores (localStorage, wrapped)                                       */
  /* ------------------------------------------------------------------ */
  var PFX = 'e2m-diwali:', mem = {};
  function readRaw(key) { try { var v = W.localStorage.getItem(PFX + key); return v === null ? (key in mem ? String(mem[key]) : null) : v; } catch (e) { return key in mem ? String(mem[key]) : null; } }
  E2M.score = {
    get: function (key) { var v = readRaw(key); if (v === null) return 0; var n = Number(v); return isNaN(n) ? v : n; },
    has: function (key) { return readRaw(key) !== null; },
    set: function (key, val) { mem[key] = val; try { W.localStorage.setItem(PFX + key, String(val)); } catch (e) {} },
    setBest: function (key, val, lowerIsBetter) {
      var raw = readRaw(key), prev = raw === null ? null : Number(raw);
      var better = prev === null || isNaN(prev) || (lowerIsBetter ? val < prev : val > prev);
      if (better) E2M.score.set(key, val);
      return better;
    }
  };

  /* ------------------------------------------------------------------ */
  /* Toasts                                                               */
  /* ------------------------------------------------------------------ */
  var lastToast = '', lastToastAt = 0;
  E2M.toast = function (msg, ms) {
    msg = String(msg || '');
    if (!msg) return null;
    var now = performance.now();
    if (msg === lastToast && now - lastToastAt < 1500) return null;
    lastToast = msg; lastToastAt = now;
    var box = D.getElementById('e2m-toasts');
    if (!box) { box = D.createElement('div'); box.id = 'e2m-toasts'; box.className = 'e2m-toasts'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); D.body.appendChild(box); }
    var el = D.createElement('div');
    el.className = 'e2m-toast'; el.textContent = msg;
    box.appendChild(el);
    while (box.children.length > 2) box.removeChild(box.firstElementChild);
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('is-in'); }); });
    setTimeout(function () {
      el.classList.add('is-out');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 450);
    }, ms || Math.min(5600, 2300 + msg.length * 30));
    return el;
  };

  /* ------------------------------------------------------------------ */
  /* Hidden collectibles                                                  */
  /* ------------------------------------------------------------------ */
  E2M.found = function (id) {
    var f = E2M.state.found;
    if (f.indexOf(id) > -1) return f.length;
    f.push(id);
    var c = f.length;
    D.querySelectorAll('[data-found-count]').forEach(function (el) { el.textContent = c; });
    E2M.emit('found', { id: id, count: c, total: E2M.foundTotal });
    if (c >= E2M.foundTotal) E2M.emit('found:all', { count: c });
    return c;
  };

  /* ------------------------------------------------------------------ */
  /* Zone registry: mount / enter / leave                                 */
  /* ------------------------------------------------------------------ */
  var registry = {}, mounted = {}, zoneOn = {}, domReady = false, zonesStarted = false;
  function call(key, fn) {
    var s = registry[key];
    if (s && typeof s[fn] === 'function') {
      try { s[fn](); } catch (e) { console.error('[E2M] ' + key + '.' + fn + ' failed', e); }
    }
  }
  function mountOne(key) {
    if (mounted[key] || !registry[key]) return;
    var el = D.querySelector('[data-mount="' + key + '"]');
    if (!el) return;
    mounted[key] = true;
    var s = registry[key];
    if (typeof s.mount === 'function') {
      try { s.mount(el); } catch (e) { console.error('[E2M] mount failed for "' + key + '"', e); }
    }
    if (zonesStarted && zoneOn[key]) call(key, 'onEnter');
  }
  E2M.register = function (key, spec) {
    registry[key] = spec || {};
    if (domReady) mountOne(key);
    return registry[key];
  };
  E2M.isActive = function (key) { return !!zoneOn[key]; };
  E2M.startZones = function () {
    if (zonesStarted) return;
    zonesStarted = true;
    var zones = D.querySelectorAll('.zone[data-zone]');
    if (!('IntersectionObserver' in W)) {
      zones.forEach(function (z) { zoneOn[z.dataset.zone] = true; z.classList.add('is-active'); call(z.dataset.zone, 'onEnter'); });
      return;
    }
    var th = []; for (var i = 0; i <= 20; i++) th.push(i / 20);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var key = en.target.getAttribute('data-zone');
        var vh = (en.rootBounds && en.rootBounds.height) || W.innerHeight;
        var denom = Math.min(en.boundingClientRect.height, vh) || 1;
        var frac = en.isIntersecting ? en.intersectionRect.height / denom : 0;
        var on = frac > (zoneOn[key] ? 0.3 : 0.35);
        if (on === !!zoneOn[key]) return;
        zoneOn[key] = on;
        en.target.classList.toggle('is-active', on);
        if (on) { call(key, 'onEnter'); E2M.emit('zone:enter', key); }
        else { call(key, 'onLeave'); E2M.emit('zone:leave', key); }
      });
    }, { threshold: th });
    zones.forEach(function (z) { io.observe(z); });
  };

  /* ------------------------------------------------------------------ */
  /* Cursor: a single faint, tiny glow that eases after the pointer       */
  /* (Revision 1 replaces the sparkle trail). Fine pointers only.         */
  /* ------------------------------------------------------------------ */
  function initCursorGlow() {
    var el = D.createElement('div');
    el.className = 'e2m-cursor'; el.setAttribute('aria-hidden', 'true');
    D.body.appendChild(el);
    var tx = -100, ty = -100, x = -100, y = -100, raf = 0, shown = false;
    function step() {
      raf = 0;
      x += (tx - x) * 0.18; y += (ty - y) * 0.18;
      el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      if (Math.abs(tx - x) + Math.abs(ty - y) > 0.4) raf = requestAnimationFrame(step);
    }
    D.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      tx = e.clientX; ty = e.clientY;
      if (!shown) { shown = true; x = tx; y = ty; el.classList.add('is-on'); }
      if (!raf) raf = requestAnimationFrame(step);
    }, { passive: true });
    D.documentElement.addEventListener('mouseleave', function () { shown = false; el.classList.remove('is-on'); });
  }

  /* ------------------------------------------------------------------ */
  /* Revision 6: phuljhadi (sparkler) cursor trail. Fine mouse pointers   */
  /* only; off in Calm / paused / reduced motion and on touch. Tiny       */
  /* white-gold sparks with short fizzing trails that fall with gravity;  */
  /* particle count capped; the loop sleeps when nothing is alive.        */
  /* ------------------------------------------------------------------ */
  function initSparkler() {
    var cv = D.createElement('canvas'), g = cv.getContext('2d'), P = [], CAP = 90, raf = 0, last = 0;
    var mx = -99, my = -99, px = -99, py = -99, hot = 0, dpr = 1;
    cv.id = 'e2m-sparkler'; cv.setAttribute('aria-hidden', 'true'); D.body.appendChild(cv);
    function size() { dpr = Math.min(2, W.devicePixelRatio || 1); cv.width = Math.round(W.innerWidth * dpr); cv.height = Math.round(W.innerHeight * dpr); }
    size(); W.addEventListener('resize', size);
    function gated() { return E2M.isCalm() || E2M.isPaused() || !mqFine.matches || D.hidden; }
    var COL = ['255,244,210', '255,226,150', '255,200,100', '255,170,70'];
    function emit(n) {
      for (var i = 0; i < n && P.length < CAP; i++) {
        var a = Math.random() * 6.283, v = 40 + Math.random() * 150;
        P.push({ x: mx, y: my, px: mx, py: my, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, life: 0, max: 0.32 + Math.random() * 0.5, c: COL[Math.floor(Math.random() * COL.length)] });
      }
    }
    function frame(ts) {
      raf = 0;
      var dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts;
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W.innerWidth, W.innerHeight);
      if (gated()) { P.length = 0; hot = 0; return; }
      if (hot > 0) {
        hot -= dt;
        // the burning tip: a bright pinpoint with a soft warm halo
        var gr = g.createRadialGradient(mx, my, 0, mx, my, 15);
        gr.addColorStop(0, 'rgba(255,255,240,.95)'); gr.addColorStop(.25, 'rgba(255,215,130,.55)'); gr.addColorStop(1, 'rgba(255,150,50,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(mx, my, 15, 0, 6.283); g.fill();
        emit(2);
      }
      g.lineCap = 'round'; g.globalCompositeOperation = 'lighter';
      for (var i = P.length - 1; i >= 0; i--) {
        var p = P[i]; p.life += dt;
        if (p.life >= p.max) { P.splice(i, 1); continue; }
        p.px = p.x; p.py = p.y;
        p.vy += 520 * dt; p.vx *= 0.97; p.x += p.vx * dt; p.y += p.vy * dt;
        var k = 1 - p.life / p.max;
        g.strokeStyle = 'rgba(' + p.c + ',' + (k * 0.95).toFixed(2) + ')'; g.lineWidth = 0.8 + k * 1.1;
        g.beginPath(); g.moveTo(p.px, p.py); g.lineTo(p.x, p.y); g.stroke();
        if (Math.random() < 0.05) { g.fillStyle = 'rgba(255,255,255,' + k.toFixed(2) + ')'; g.fillRect(p.x - 1, p.y - 1, 2, 2); }
      }
      g.globalCompositeOperation = 'source-over';
      if (P.length || hot > 0) raf = requestAnimationFrame(frame);
    }
    D.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      if (gated()) return;
      px = mx; py = my; mx = e.clientX; my = e.clientY; hot = 0.45;
      var d = Math.abs(mx - px) + Math.abs(my - py);
      if (d < 400) emit(Math.min(4, 1 + Math.floor(d / 14)));
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    }, { passive: true });
    D.documentElement.addEventListener('mouseleave', function () { hot = 0; });
    E2M.on('prefs:change', function () { if (gated()) { P.length = 0; hot = 0; g.clearRect(0, 0, cv.width, cv.height); } });
  }

  /* Revision 6: press spark burst for the diya button (flame is CSS) + a tap haptic */
  function initButtonSparks() {
    D.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('.btn-diya, .btn-primary, .btn-plate--primary');
      if (!b || b.disabled) return;
      E2M.haptic('tap');
      if (E2M.isCalm() || E2M.isPaused()) return;
      var r = b.getBoundingClientRect(), x = e.detail ? e.clientX : r.left + r.width / 2, y = e.detail ? e.clientY : r.top + r.height / 2;
      for (var i = 0; i < 9; i++) {
        var s = D.createElement('i'), a = -Math.PI * (0.1 + 0.8 * Math.random()), v = 26 + Math.random() * 46;
        s.className = 'btn-spark'; s.style.left = x + 'px'; s.style.top = y + 'px';
        s.style.setProperty('--sx', (Math.cos(a) * v).toFixed(1) + 'px'); s.style.setProperty('--sy', (Math.sin(a) * v + 18).toFixed(1) + 'px');
        D.body.appendChild(s); setTimeout(function (n) { n.remove(); }.bind(null, s), 620);
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Boot                                                                 */
  /* ------------------------------------------------------------------ */
  function boot() {
    domReady = true;
    try { warmAtlases(); } catch (e) {}
    fxe();
    ambInit();
    Object.keys(registry).forEach(mountOne);
    D.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-sound-toggle]');
      if (b) { audio.toggle(); E2M.haptic('tap'); }
    });
    syncSoundUI();
    initButtonSparks();
    if (mqFine.matches) initSparkler();
    if (!D.documentElement.classList.contains('has-opening')) E2M.startZones();
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
