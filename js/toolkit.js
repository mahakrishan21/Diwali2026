/* E2M Diwali — Toolkit (Revision 2, CONTRACT R2.3 / R2.5 / R2.6).
   A HUD "Tools" drawer: sound + volume, motion, effects intensity, screen shake, text size, high contrast,
   fullscreen, pause all motion, keyboard shortcuts, reset progress. Also owns the global keyboard shortcuts,
   the "sound is off" hint and the one-time onboarding tip. Loaded right after core.js (defer). */
(function () {
  'use strict';
  var W = window, D = document, H = D.documentElement;
  var E2M = W.E2M;
  if (!E2M || !E2M.setPrefs) return;

  // Revision 3: ten zones (I–X). 1–9 jump to I–IX, 0 jumps to X, the finale.
  var ZONE_KEYS = { 1: 'fireworks', 2: 'diyas', 3: 'rangoli', 4: 'laddoo', 5: 'lanterns', 6: 'chakri', 7: 'gifts', 8: 'mood', 9: 'wish', 0: 'finale' };
  var STEPS = [1, 1.06, 1.12, 1.18, 1.25];
  var SHORTCUTS = [
    ['?', 'Show these shortcuts'],
    ['T', 'Open or close Tools'],
    ['M', 'Sound on or off'],
    ['1 – 9', 'Jump to zones I to IX'],
    ['0', 'Jump to the Grand Finale'],
    ['Esc', 'Close a panel, stop the Diwali night show, or pause a running game'],
    ['Tab', 'Leave a game to use T, ? and 1 – 9 (M works everywhere)'],
    ['Space / Enter', 'Play: launch, pop, spin or press, in each game (hold Space in Fireworks to charge)'],
    ['Arrow keys', 'Move baskets, lanterns and selections'],
    ['P', 'Pause or resume the timed games']
  ];

  function el(tag, cls, html) { var e = D.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function $(s, r) { return (r || D).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || D).querySelectorAll(s)); }
  function store(k, v) { try { if (v === undefined) return W.localStorage.getItem('e2m-diwali:' + k); W.localStorage.setItem('e2m-diwali:' + k, v); } catch (e) { return null; } return null; }

  /* ------------------------------------------------------------------ */
  /* Markup                                                               */
  /* ------------------------------------------------------------------ */
  function seg(name, label, opts) {
    var h = '<div class="tk-row tk-row--seg"><span class="tk-label" id="tk-l-' + name + '">' + label + '</span>' +
      '<div class="tk-seg" role="radiogroup" aria-labelledby="tk-l-' + name + '" data-pref="' + name + '">';
    opts.forEach(function (o) { h += '<button type="button" role="radio" aria-checked="false" tabindex="-1" data-val="' + o[0] + '"' + (o[2] ? ' aria-label="' + o[2] + '"' : '') + '>' + o[1] + '</button>'; });
    return h + '</div></div>';
  }
  function sw(name, label, desc) {
    return '<div class="tk-row"><span class="tk-label" id="tk-l-' + name + '">' + label + (desc ? '<small id="tk-d-' + name + '">' + desc + '</small>' : '') + '</span>' +
      '<button type="button" class="tk-switch" role="switch" aria-checked="false" aria-labelledby="tk-l-' + name + '"' + (desc ? ' aria-describedby="tk-d-' + name + '"' : '') + ' data-switch="' + name + '"><i aria-hidden="true"></i><span class="tk-sw-state" aria-hidden="true">Off</span></button></div>';
  }
  function build() {
    var scrim = el('div', 'tk-scrim'); scrim.setAttribute('aria-hidden', 'true'); scrim.hidden = true;
    var tk = el('div', 'tk');
    tk.id = 'e2m-toolkit'; tk.hidden = true;
    tk.setAttribute('role', 'dialog'); tk.setAttribute('aria-modal', 'true'); tk.setAttribute('aria-labelledby', 'tk-title');
    var keys = SHORTCUTS.map(function (k) { return '<div class="tk-key"><dt><kbd>' + k[0] + '</kbd></dt><dd>' + k[1] + '</dd></div>'; }).join('');
    tk.innerHTML =
      '<div class="tk-panel">' +
        '<header class="tk-head">' +
          '<p class="tk-kicker label-caps">The Toolkit</p>' +
          '<h2 class="tk-title" id="tk-title">Tools</h2>' +
          '<button type="button" class="tk-close" aria-label="Close Tools"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg></button>' +
        '</header>' +
        '<div class="tk-body">' +
          '<section class="tk-sec" aria-labelledby="tk-h-sound"><h3 class="tk-h" id="tk-h-sound">Sound</h3>' +
            sw('sound', 'Sound', 'Real-sounding fireworks, bells and chimes, made live in your browser. Never plays on its own.') +
            '<div class="tk-row tk-row--range"><label class="tk-label" for="tk-vol">Volume</label><input class="tk-range" id="tk-vol" type="range" min="0" max="100" step="5"><output class="tk-out" for="tk-vol" id="tk-vol-out">80%</output></div>' +
          '</section>' +
          '<section class="tk-sec" aria-labelledby="tk-h-motion"><h3 class="tk-h" id="tk-h-motion">Motion</h3>' +
            seg('motion', 'Motion', [['standard', 'Standard'], ['calm', 'Calm']]) +
            '<p class="tk-note" id="tk-motion-note" hidden>Your device asks for reduced motion, so the site stays calm. The Fireworks Playground still plays its show there: choose Calm here to stop that too, or Standard for full motion everywhere.</p>' +
            seg('intensity', 'Effects', [['calm', 'Calm'], ['standard', 'Standard'], ['max', 'Max']]) +
            sw('shake', 'Screen shake', 'The screen moves a little when something explodes (more in the Fireworks Playground).') +
            sw('haptics', 'Haptics', E2M.hapticsSupported ? 'A light buzz on your device when you light, burst, catch or open something.' : 'Not supported on this device.') +
            sw('paused', 'Pause all motion', 'Stops ambient loops and animation. Games still play.') +
          '</section>' +
          '<section class="tk-sec" aria-labelledby="tk-h-read"><h3 class="tk-h" id="tk-h-read">Reading</h3>' +
            '<div class="tk-row tk-row--seg"><span class="tk-label" id="tk-l-text">Text size <small><output id="tk-text-out">100%</output></small></span>' +
              '<div class="tk-seg tk-seg--text" role="group" aria-labelledby="tk-l-text">' +
                '<button type="button" data-text="-1" aria-label="Smaller text">A−</button><button type="button" data-text="0" aria-label="Reset text size">A</button><button type="button" data-text="1" aria-label="Larger text">A+</button>' +
              '</div></div>' +
            sw('contrast', 'High contrast', 'Brighter text and thicker gold lines.') +
            '<div class="tk-row tk-row--fs"><span class="tk-label" id="tk-l-fs">Fullscreen</span><button type="button" class="btn-marigold btn-marigold--sm tk-fs" aria-pressed="false" aria-labelledby="tk-l-fs"><span>Enter</span></button></div>' +
          '</section>' +
          '<section class="tk-sec" aria-labelledby="tk-h-help"><h3 class="tk-h" id="tk-h-help">Help</h3>' +
            '<div class="tk-row"><span class="tk-label" id="tk-l-keys">Keyboard shortcuts</span><button type="button" class="btn-marigold btn-marigold--sm tk-keys-btn" aria-expanded="false" aria-controls="tk-keys"><span>Show</span></button></div>' +
            '<dl class="tk-keys" id="tk-keys" hidden aria-labelledby="tk-l-keys">' + keys + '</dl>' +
            '<div class="tk-row"><span class="tk-label" id="tk-l-reset">Reset progress<small>Clears best scores and saved progress on this device. Your Tools settings stay.</small></span><button type="button" class="btn-marigold btn-marigold--sm tk-reset" aria-describedby="tk-l-reset"><span>Reset</span></button></div>' +
            '<div class="tk-confirm" hidden role="group" aria-labelledby="tk-confirm-q"><p id="tk-confirm-q">Clear every best score and start fresh? The page will reload.</p><div class="tk-confirm-acts"><button type="button" class="btn-diya btn-diya--sm tk-reset-yes"><span>Yes, reset</span></button><button type="button" class="btn-marigold btn-marigold--sm tk-reset-no"><span>Keep my scores</span></button></div></div>' +
          '</section>' +
        '</div>' +
      '</div>';
    D.body.appendChild(scrim); D.body.appendChild(tk);
    return { tk: tk, scrim: scrim };
  }

  /* ------------------------------------------------------------------ */
  /* State sync                                                           */
  /* ------------------------------------------------------------------ */
  var ui, tk, scrim, btn, opener = null, isOpen = false;
  function sync() {
    var p = E2M.prefs;
    $$('[data-pref]', tk).forEach(function (g) {
      var name = g.getAttribute('data-pref'), val = String(p[name]);
      if (name === 'motion') val = E2M.isCalm() ? 'calm' : 'standard';
      $$('[role="radio"]', g).forEach(function (r) {
        var on = r.getAttribute('data-val') === val;
        r.setAttribute('aria-checked', on ? 'true' : 'false');
        r.tabIndex = on ? 0 : -1;
      });
    });
    setSwitch('sound', E2M.audio.enabled);
    setSwitch('shake', p.shake);
    setSwitch('haptics', !!(p.haptics && E2M.hapticsSupported));
    setSwitch('paused', p.paused);
    setSwitch('contrast', p.contrast);
    // R7: only a Calm the visitor chose greys out Screen shake; with an OS-only reduced-motion flag it still
    // controls the Fireworks Playground's shake
    var calm = E2M.calmExplicit ? E2M.calmExplicit() : E2M.isCalm();
    var note = $('#tk-motion-note', tk); if (note) note.hidden = !(E2M.osReducedOnly && E2M.osReducedOnly());
    var shakeBtn = $('[data-switch="shake"]', tk);
    shakeBtn.setAttribute('aria-disabled', calm ? 'true' : 'false');
    shakeBtn.closest('.tk-row').classList.toggle('is-muted', calm);
    // Revision 4: haptics need the Vibration API (not on iOS Safari); in Calm only tiny taps remain
    var hapBtn = $('[data-switch="haptics"]', tk);
    if (hapBtn) {
      hapBtn.setAttribute('aria-disabled', E2M.hapticsSupported ? 'false' : 'true');
      hapBtn.closest('.tk-row').classList.toggle('is-muted', !E2M.hapticsSupported);
    }
    var vol = $('#tk-vol', tk); vol.value = Math.round(p.volume * 100);
    $('#tk-vol-out', tk).textContent = Math.round(p.volume * 100) + '%';
    vol.setAttribute('aria-valuetext', Math.round(p.volume * 100) + ' percent');
    $('#tk-text-out', tk).textContent = Math.round(p.textScale * 100) + '%';
    $('[data-text="-1"]', tk).disabled = p.textScale <= STEPS[0];
    $('[data-text="1"]', tk).disabled = p.textScale >= STEPS[STEPS.length - 1];
    var fsOn = !!(D.fullscreenElement || D.webkitFullscreenElement);
    var fs = $('.tk-fs', tk); fs.setAttribute('aria-pressed', fsOn ? 'true' : 'false'); fs.querySelector('span').textContent = fsOn ? 'Exit' : 'Enter';
    if (btn) btn.classList.toggle('has-alert', !!p.paused);
  }
  function setSwitch(name, on) {
    var b = $('[data-switch="' + name + '"]', tk); if (!b) return;
    b.setAttribute('aria-checked', on ? 'true' : 'false');
    b.querySelector('.tk-sw-state').textContent = on ? 'On' : 'Off';
  }

  /* ------------------------------------------------------------------ */
  /* Open / close + focus trap                                            */
  /* ------------------------------------------------------------------ */
  function focusables() {
    return $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', tk).filter(function (n) {
      return !n.disabled && !n.closest('[hidden]') && n.offsetParent !== null;
    });
  }
  function open(focusSel) {
    if (isOpen) { if (focusSel) { var f0 = $(focusSel, tk); if (f0) f0.focus(); } return; }
    isOpen = true;
    opener = D.activeElement && D.activeElement !== D.body ? D.activeElement : btn;
    sync();
    tk.hidden = false; scrim.hidden = false;
    requestAnimationFrame(function () { requestAnimationFrame(function () { tk.classList.add('is-open'); scrim.classList.add('is-open'); }); });
    if (btn) btn.setAttribute('aria-expanded', 'true');
    H.classList.add('tk-open');
    var first = focusSel ? $(focusSel, tk) : $('.tk-close', tk);
    setTimeout(function () { (first || $('.tk-close', tk)).focus(); }, 40);
    dismissCoach();
  }
  function close() {
    if (!isOpen) return;
    isOpen = false;
    tk.classList.remove('is-open'); scrim.classList.remove('is-open');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    H.classList.remove('tk-open');
    setTimeout(function () { if (!isOpen) { tk.hidden = true; scrim.hidden = true; } }, E2M.isCalm() ? 10 : 420);
    var back = opener && D.contains(opener) && opener.offsetParent !== null ? opener : btn;
    if (back && back.focus) back.focus({ preventScroll: true });
    hideConfirm();
  }
  E2M.toolkit = { open: open, close: close, isOpen: function () { return isOpen; } };

  function onPanelKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (!$('.tk-confirm', tk).hidden) { hideConfirm(); $('.tk-reset', tk).focus(); } else close(); return; }
    if (e.key === 'Tab') {
      var f = focusables(); if (!f.length) return;
      var i = f.indexOf(D.activeElement);
      if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && (i === f.length - 1 || i === -1)) { e.preventDefault(); f[0].focus(); }
      return;
    }
    // radiogroups: roving tabindex + arrows
    var r = e.target.closest && e.target.closest('[role="radio"]');
    if (r && /^(ArrowLeft|ArrowRight|ArrowUp|ArrowDown|Home|End)$/.test(e.key)) {
      e.preventDefault();
      var g = $$('[role="radio"]', r.parentNode), k = g.indexOf(r);
      if (e.key === 'Home') k = 0; else if (e.key === 'End') k = g.length - 1;
      else k = (k + (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1) + g.length) % g.length;
      g[k].focus(); g[k].click();
    }
  }

  /* ------------------------------------------------------------------ */
  /* Controls                                                             */
  /* ------------------------------------------------------------------ */
  var LABELS = { motion: { standard: 'Standard motion', calm: 'Calm motion: fewer particles, no shake or parallax' }, intensity: { calm: 'Effects: calm', standard: 'Effects: standard', max: 'Effects: max' } };
  function onPanelClick(e) {
    var t = e.target;
    var radio = t.closest('[role="radio"]');
    if (radio) {
      var g = radio.closest('[data-pref]'), name = g.getAttribute('data-pref'), val = radio.getAttribute('data-val');
      // R7: a Motion choice made here is explicit: it overrides the OS flag (both ways) and is remembered
      if (name === 'motion') E2M.setPrefs({ motion: val, motionExplicit: true });
      else E2M.setPref(name, val);
      if (E2M.haptic) E2M.haptic('select');
      E2M.announce(LABELS[name] ? LABELS[name][val] : val);
      return;
    }
    var swb = t.closest('[data-switch]');
    if (swb) {
      var n = swb.getAttribute('data-switch');
      if (n === 'sound') { E2M.audio.toggle(); return; }
      if (n === 'shake' && (E2M.calmExplicit ? E2M.calmExplicit() : E2M.isCalm())) { E2M.announce('Screen shake is off while Calm motion is on.'); return; }
      if (n === 'haptics' && !E2M.hapticsSupported) { E2M.announce('Haptics are not supported on this device.'); E2M.toast('Haptics are not supported on this device.'); return; }
      E2M.setPref(n, !E2M.prefs[n]);
      var on = E2M.prefs[n];
      if (E2M.haptic) E2M.haptic(n === 'haptics' && on ? 'light' : 'tap');
      if (n === 'shake' && on && E2M.shake) E2M.shake(3, 300);
      E2M.announce({ shake: 'Screen shake ', haptics: 'Haptics ', paused: 'All motion ', contrast: 'High contrast ' }[n] + (n === 'paused' ? (on ? 'paused' : 'resumed') : (on ? 'on' : 'off')));
      return;
    }
    var tb = t.closest('[data-text]');
    if (tb) {
      var d = +tb.getAttribute('data-text'), cur = E2M.prefs.textScale, idx = 0;
      for (var i = 0; i < STEPS.length; i++) if (Math.abs(STEPS[i] - cur) < 0.02) idx = i;
      idx = d === 0 ? 0 : Math.max(0, Math.min(STEPS.length - 1, idx + d));
      E2M.setPref('textScale', STEPS[idx]);
      if (E2M.haptic) E2M.haptic('select');
      E2M.announce('Text size ' + Math.round(STEPS[idx] * 100) + ' percent');
      return;
    }
    if (t.closest('.tk-close')) { close(); return; }
    if (t.closest('.tk-fs')) { toggleFs(); return; }
    if (t.closest('.tk-keys-btn')) { toggleKeys(); return; }
    if (t.closest('.tk-reset')) { showConfirm(); return; }
    if (t.closest('.tk-reset-no')) { hideConfirm(); $('.tk-reset', tk).focus(); return; }
    if (t.closest('.tk-reset-yes')) { resetProgress(); return; }
  }
  function toggleKeys(force) {
    var list = $('#tk-keys', tk), b = $('.tk-keys-btn', tk);
    var on = typeof force === 'boolean' ? force : list.hidden;
    list.hidden = !on; b.setAttribute('aria-expanded', on ? 'true' : 'false'); b.querySelector('span').textContent = on ? 'Hide' : 'Show';
  }
  function showConfirm() { var c = $('.tk-confirm', tk); c.hidden = false; $('.tk-reset-no', tk).focus(); }
  function hideConfirm() { var c = tk && $('.tk-confirm', tk); if (c) c.hidden = true; }
  function resetProgress() {
    try {
      var drop = [];
      // settings stay: the Tools prefs and the Fireworks deck choices (R7)
      for (var i = 0; i < W.localStorage.length; i++) { var k = W.localStorage.key(i); if (k && k.indexOf('e2m-diwali:') === 0 && k !== 'e2m-diwali:prefs' && k !== 'e2m-diwali:fw-deck' && k !== 'e2m-diwali:fw-rm-chip') drop.push(k); }
      drop.forEach(function (k) { W.localStorage.removeItem(k); });
    } catch (e) { /* storage blocked: nothing persisted anyway */ }
    E2M.announce('Progress reset. Reloading.', { assertive: true });
    E2M.toast('Fresh start. Every score is back to zero.');
    setTimeout(function () { W.location.hash = ''; W.location.reload(); }, 900);
  }
  function toggleFs() {
    var on = D.fullscreenElement || D.webkitFullscreenElement;
    try {
      if (on) (D.exitFullscreen || D.webkitExitFullscreen).call(D);
      else { var r = H.requestFullscreen || H.webkitRequestFullscreen; var pr = r && r.call(H); if (pr && pr.catch) pr.catch(function () { E2M.toast('Fullscreen is not available here.'); }); }
    } catch (e) { E2M.toast('Fullscreen is not available here.'); }
  }

  /* ------------------------------------------------------------------ */
  /* Global keyboard shortcuts                                            */
  /* ------------------------------------------------------------------ */
  function typing(t) {
    if (!t || !t.closest) return false;
    if (t.isContentEditable) return true;
    var tag = (t.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select';
  }
  function jump(key) {
    var zone = D.getElementById('zone-' + key); if (!zone) return;
    var title = zone.querySelector('.zh-title');
    var go = function () {
      zone.scrollIntoView({ behavior: E2M.isCalm() ? 'auto' : 'smooth', block: 'start' });
      if (title) { title.setAttribute('tabindex', '-1'); setTimeout(function () { title.focus({ preventScroll: true }); }, E2M.isCalm() ? 30 : 650); }
      E2M.announce('Zone ' + (zone.querySelector('.zh-roman') ? zone.querySelector('.zh-roman').textContent.replace(/^Zone\s*/, '') : '') + ': ' + (title ? title.textContent : key));
    };
    if (E2M.isEntered && !E2M.isEntered() && E2M.enterWorld) { E2M.enterWorld('#zone-' + key); setTimeout(function () { if (title) { title.setAttribute('tabindex', '-1'); title.focus({ preventScroll: true }); } }, 120); return; }
    go();
  }
  function onGlobalKey(e) {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    if (typing(e.target)) return;
    if (isOpen) return; // the panel handles its own keys
    var k = e.key;
    // A focused game surface (role="application" canvases: laddoo, lanterns, rangoli; any canvas) owns the
    // keyboard: zone jumps and the Tools modal would scroll away from or cover a running game, so they are
    // not taken there. M (mute) stays available everywhere — it is harmless mid-game.
    var inGame = !!(e.target.closest && e.target.closest('[role="application"], canvas, [role="slider"], [role="spinbutton"]'));
    if (k === 'm' || k === 'M') { e.preventDefault(); var on = E2M.audio.toggle(); E2M.announce(on ? 'Sound on' : 'Sound off'); return; }
    if (inGame) return;
    if (k === '?' || (k === '/' && e.shiftKey)) { e.preventDefault(); open('.tk-keys-btn'); toggleKeys(true); return; }
    if (k === 't' || k === 'T') { e.preventDefault(); open(); return; }
    if (/^[0-9]$/.test(k) && !e.shiftKey && ZONE_KEYS[k]) { e.preventDefault(); jump(ZONE_KEYS[k]); }
  }

  /* ------------------------------------------------------------------ */
  /* Sound hint + onboarding                                              */
  /* ------------------------------------------------------------------ */
  // R7: the Fireworks Playground shows its own "Sound is off — turn it on for crackers with echo" invite
  var soundHinted = false, LOUD = /^(chakri|laddoo|lanterns|gifts|finale|diyas)$/;
  function soundHint(e) {
    if (soundHinted || E2M.audio.enabled) return;
    var stage = e.target.closest && e.target.closest('.zone-stage');
    var z = stage && stage.closest('.zone');
    if (!z || !LOUD.test(z.getAttribute('data-zone') || '')) return;
    soundHinted = true;
    setTimeout(function () { if (!E2M.audio.enabled) E2M.toast(E2M.input === 'touch' ? 'Sound is off. It matters here: turn it on in Tools.' : 'Sound is off. It matters here: turn it on in Tools, or press M.', 4800); }, 700);
  }
  var coach = null, coachT = 0;
  function dismissCoach() {
    if (!coach) return;
    clearTimeout(coachT);
    var c = coach; coach = null;
    c.classList.remove('is-in');
    H.classList.remove('has-coach');
    store('onboarded', '1');
    W.removeEventListener('scroll', coachScroll); D.removeEventListener('pointerdown', coachAway, true);
    setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 700);
  }
  var coachAt = 0, lastPlay = 0;
  // the tip sits in the HUD bar itself: from just after the brand (or the progress line, when there is room)
  // to just before the Sound button — it never overlays page content
  function placeCoach() {
    if (!coach) return;
    var hudEl = D.getElementById('hud'), brand = $('.hud-brand'), track = $('.hud-track'), right = $('.hud-right');
    if (!hudEl || !brand || !right) return;
    var hr = hudEl.getBoundingClientRect(), rr = right.getBoundingClientRect(), br = brand.getBoundingClientRect();
    var endX = rr.left - 10, startX = br.right + 12;
    if (track && W.innerWidth > 899) { var tr = track.getBoundingClientRect(); if (endX - (tr.right + 16) >= 250) startX = tr.right + 16; }
    var w = Math.max(120, Math.min(380, endX - startX));
    coach.style.right = Math.round(hr.right - endX) + 'px';
    coach.style.width = Math.round(w) + 'px';
  }
  W.addEventListener('resize', function () { if (coach) placeCoach(); });
  function coachScroll() { if (performance.now() - coachAt > 1500) dismissCoach(); }
  function coachAway(e) { if (coach && !coach.contains(e.target) && !(btn && btn.contains(e.target))) dismissCoach(); }
  D.addEventListener('pointerdown', function (e) { if (e.target.closest && e.target.closest('.zone-stage, .zone--fireworks')) lastPlay = performance.now(); }, true);
  function showCoach() {
    if (store('onboarded') === '1' || !btn || coach) return;
    // never interrupt someone mid-game: wait until they have not touched a stage for 4s
    if (performance.now() - lastPlay < 4000 || isOpen) { setTimeout(showCoach, 3000); return; }
    coach = el('div', 'tk-coach');
    coach.setAttribute('role', 'note'); coach.setAttribute('aria-label', 'Tip');
    coach.innerHTML = '<p>Sound &amp; motion: <b>Tools</b><span class="tk-k">' + (E2M.input === 'touch' ? '' : ' · <kbd>?</kbd> keys') + '</span></p>' +
      '<button type="button" class="tk-coach-open">Open</button><button type="button" class="tk-coach-ok" aria-label="Dismiss tip">×</button>';
    var hudEl = D.getElementById('hud') || D.body;
    hudEl.appendChild(coach);
    placeCoach();
    coach.addEventListener('click', function (e) {
      if (e.target.closest('.tk-coach-open')) { dismissCoach(); open(); }
      else if (e.target.closest('.tk-coach-ok')) { dismissCoach(); if (btn) btn.focus({ preventScroll: true }); }
    });
    coachAt = performance.now();
    H.classList.add('has-coach');
    W.addEventListener('scroll', coachScroll, { passive: true }); D.addEventListener('pointerdown', coachAway, true);
    requestAnimationFrame(function () { requestAnimationFrame(function () { if (coach) coach.classList.add('is-in'); }); });
    coachT = setTimeout(dismissCoach, 7000);
  }

  /* ------------------------------------------------------------------ */
  /* Boot                                                                 */
  /* ------------------------------------------------------------------ */
  function boot() {
    ui = build(); tk = ui.tk; scrim = ui.scrim;
    btn = $('.hud-tools');
    if (btn) btn.addEventListener('click', function () { if (E2M.haptic) E2M.haptic('tap'); if (isOpen) close(); else open(); });
    scrim.addEventListener('click', close);
    tk.addEventListener('click', onPanelClick);
    tk.addEventListener('keydown', onPanelKey);
    var vol = $('#tk-vol', tk);
    vol.addEventListener('input', function () { E2M.setPref('volume', vol.value / 100); });
    vol.addEventListener('change', function () { if (E2M.audio.enabled) E2M.audio.play('chime'); });
    D.addEventListener('keydown', onGlobalKey);
    D.addEventListener('pointerdown', soundHint, true);
    D.addEventListener('fullscreenchange', sync); D.addEventListener('webkitfullscreenchange', sync);
    if (!(H.requestFullscreen || H.webkitRequestFullscreen)) { var fr = $('.tk-row--fs', tk); if (fr) fr.hidden = true; }
    E2M.on('prefs:change', sync);
    E2M.on('sound:toggle', function () { if (tk) sync(); });
    E2M.on('world:enter', function () { setTimeout(showCoach, 9800); });
    sync();
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', boot); else boot();
})();
