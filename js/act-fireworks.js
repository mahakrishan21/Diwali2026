/* Activity I — Fireworks Playground. Self-registers with E2M.
   Revision 3: the WHOLE zone is the launch surface. Click / tap anywhere: a rocket climbs from the temple town
   and bursts there. HOLD to charge: a power ring grows at the pointer and a beam shows how high it will go; on
   release the shell flies higher, bursts bigger and breaks into more sub-bursts (0–1.6s); hold past full for a
   grand multi-break. Double-click / double-tap for the big one. Rainbow is the default colour (a hue sweep per
   shell, a full spectrum per burst). The sky is a full-screen layer (E2M.screenLayer), the skyline is a Hindu
   temple town (shikharas, gopurams, mandapas, deepmala lamp towers, ghat steps), and a guide that says "tap"
   or "click" to match the device teaches the gestures, then fades after three bursts.
   Revision 7: a real Diwali deck. CRACKERS — Rocket (udan khatola, a whistling streak), Aerial shell (the
   shapes: peony, ring, heart, willow, palm, crossette, chrysanthemum, strobe, E2M), Anar (ground fountain),
   Chakri (ground spinner), Ladi (a string of bangs), Bijli bomb (one huge bang), Phuljhadi (a sparkler that
   follows the pointer). LAUNCH — Single / Volley (3-5) / Barrage (hold to keep firing). A "Diwali night show"
   (a 40s choreographed sequence, stoppable with Esc or Stop show) and GO CRAZY. A "More options" tray holds
   shell shape, colour mode, power, wind, trails and echo. Every burst shakes the scene 2-8px (translate
   only), fires a haptic with an echo tail, and (sound on) an open-air echo. Choices persist. */
(function () {
  'use strict';
  var E2M = window.E2M;
  if (!E2M) return;
  var W = window, D = document, rand = E2M.rand, pick = E2M.pick, clamp = E2M.clamp;

  /* ---------- the deck vocabulary ---------- */
  var CLICK = '<span data-input="mouse">Click</span><span data-input="touch">Tap</span>';
  var DOUBLE = '<span data-input="mouse">Double-click</span><span data-input="touch">Double-tap</span>';
  var CRACKERS = [
    { k: 'rocket', label: 'Rocket', hi: 'रॉकेट', hint: 'Rocket (udan khatola): ' + CLICK.toLowerCase() + ' anywhere and it whistles up and cracks. Hold to send it higher.' },
    { k: 'shell', label: 'Aerial shell', hi: 'स्काई शॉट', hint: CLICK + ' anywhere to burst a shell <i></i> Hold to charge it higher <i></i> ' + DOUBLE + ' for a big one' },
    { k: 'anar', label: 'Anar', hi: 'अनार', hint: 'Anar: ' + CLICK.toLowerCase() + ' where it should stand. A fountain of sparks for three seconds. Hold for a taller one.' },
    { k: 'chakri', label: 'Chakri', hi: 'चकरी', hint: 'Chakri: ' + CLICK.toLowerCase() + ' to set one spinning on the spot. Hold for a long spin.' },
    { k: 'ladi', label: 'Ladi', hi: 'लड़ी', hint: 'Ladi: ' + CLICK.toLowerCase() + ' to light a string of bangs that runs across the sky. Hold for a longer string.' },
    { k: 'bijli', label: 'Bijli bomb', hi: 'बिजली बम', hint: 'Bijli bomb: ' + CLICK.toLowerCase() + ' to drop one. One huge bang. Cover your ears.' },
    { k: 'phuljhadi', label: 'Phuljhadi', hi: 'फुलझड़ी', hint: 'Phuljhadi: hold and move to draw with a sparkler.' }
  ];
  var CK = {}; CRACKERS.forEach(function (c) { CK[c.k] = c; });
  var MODES = [{ k: 'single', label: 'Single' }, { k: 'volley', label: 'Volley' }, { k: 'barrage', label: 'Barrage' }];
  var SHAPES = [
    { k: 'peony', label: 'Peony' }, { k: 'ring', label: 'Ring' }, { k: 'heart', label: 'Heart' }, { k: 'willow', label: 'Willow' },
    { k: 'palm', label: 'Palm' }, { k: 'crossette', label: 'Crossette' }, { k: 'chrysanthemum', label: 'Chrysanthemum' },
    { k: 'strobe', label: 'Strobe' }, { k: 'text', label: 'E2M' }, { k: 'surprise', label: 'Surprise' }
  ];
  var COLOURS = [
    { k: 'rainbow', label: 'Rainbow' }, { k: 'gold', label: 'Gold' }, { k: 'pinkpurple', label: 'Pink-purple' },
    { k: 'saffrongreen', label: 'Saffron-green' }, { k: 'random', label: 'Random per shell' }
  ];
  var WINDS = [{ k: '-1', label: 'Left' }, { k: '0', label: 'None' }, { k: '1', label: 'Right' }];
  var ECHOES = [{ k: 'off', label: 'Off' }, { k: 'soft', label: 'Soft' }, { k: 'hall', label: 'Big hall' }, { k: 'mountains', label: 'Mountains' }];
  var ICONS = {
    rocket: '<path d="M12 2.6c1.9 1.9 2.8 4.3 2.8 7v6.2H9.2V9.6c0-2.7.9-5.1 2.8-7z"/><path d="M9.2 12.6l-2.2 3v1.6h2.2M14.8 12.6l2.2 3v1.6h-2.2M12 16v5.4"/><path d="M10.6 21.4h2.8" opacity=".6"/>',
    shell: '<circle cx="12" cy="12" r="2"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/>',
    anar: '<path d="M8.6 21h6.8l-1.3-5.2H9.9z"/><path d="M12 15.6V12M12 12c-.6-2.4-2.4-4.4-4.6-5.6M12 12c.6-2.4 2.4-4.4 4.6-5.6M12 11.6c0-2.6-.2-5.2-.9-7.6M12 11.6c.3-2.6.9-5 1.9-7.2"/><path d="M6 9.4l-.6.4M18 9.4l.6.4M10.6 3.2l-.2-.6M14.2 3.6l.4-.6" opacity=".7"/>',
    chakri: '<circle cx="12" cy="12" r="2.2"/><path d="M12 9.8c1.6-3 4.6-4 7-3M14.2 12c3 1.6 4 4.6 3 7M12 14.2c-1.6 3-4.6 4-7 3M9.8 12c-3-1.6-4-4.6-3-7"/>',
    ladi: '<path d="M3 6.5c4.5 3.5 13.5 3.5 18 0" stroke-dasharray="1.4 1.6"/><path d="M5.4 8.6l-.8 4M9.4 9.8l-.4 4M14.6 9.8l.4 4M18.6 8.6l.8 4"/><path d="M3.8 12.6h1.6M8.2 13.8h1.6M14.2 13.8h1.6M18.6 12.6h1.6"/><path d="M12 15.4l1 2.2 2.2 1-2.2 1-1 2.2-1-2.2-2.2-1 2.2-1z" opacity=".75"/>',
    bijli: '<circle cx="10.6" cy="14" r="6.2"/><path d="M14.6 9.4l2.2-2.2M16.8 7.2c1-1 2.4-1 3.2-.2"/><path d="M11.6 10.6l-2.2 3.4h2.4l-1.6 3.4" /><path d="M20.6 4.4l.6-1M21.6 6.6l1-.2" opacity=".7"/>',
    phuljhadi: '<path d="M4.4 20.6l9-9"/><path d="M15.6 9.4V5.6M15.6 9.4h3.8M15.6 9.4l2.8-2.8M15.6 9.4l2.8 2.8M15.6 9.4l-2.6-2.8M15.6 9.4l1 3.6" /><circle cx="15.6" cy="9.4" r="1"/>',
    peony: '<circle cx="12" cy="12" r="2"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/>',
    ring: '<ellipse cx="12" cy="12" rx="9" ry="5" transform="rotate(-20 12 12)"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    willow: '<path d="M12 4c-3 3-6 6-7 13M12 4c3 3 6 6 7 13M12 4v15M12 4c-1.5 3-3 7-3.5 14M12 4c1.5 3 3 7 3.5 14"/>',
    palm: '<path d="M12 12C9 7 5 6 3 7M12 12c3-5 7-6 9-5M12 12c-2 2-4 5-4 9M12 12c2 2 4 5 4 9M12 12V3"/>',
    crossette: '<path d="M12 12l-5-5M12 12l5-5M12 12l-5 5M12 12l5 5M7 7l-2 1M7 7L6 5M17 7l2 1M17 7l1-2M7 17l-2-1M7 17l-1 2M17 17l2-1M17 17l1 2"/>',
    chrysanthemum: '<circle cx="12" cy="12" r="1.6"/><path d="M12 3.4v2.4M12 18.2v2.4M3.4 12h2.4M18.2 12h2.4M5.9 5.9l1.7 1.7M16.4 16.4l1.7 1.7M18.1 5.9l-1.7 1.7M7.6 16.4l-1.7 1.7"/><path d="M12 8v1M12 15v1M8 12h1M15 12h1" />',
    strobe: '<path d="M6.4 4.6l1 2 2 1-2 1-1 2-1-2-2-1 2-1zM17 3.4l.8 1.6 1.6.8-1.6.8-.8 1.6-.8-1.6-1.6-.8 1.6-.8zM13.6 12.6l1.2 2.4 2.4 1.2-2.4 1.2-1.2 2.4-1.2-2.4-2.4-1.2 2.4-1.2z"/>',
    text: '<text x="12" y="15.6" text-anchor="middle" font-size="8.6" font-weight="700" font-family="Mukta, sans-serif" fill="currentColor" stroke="none">E2M</text>',
    surprise: '<path d="M9 9a3 3 0 1 1 4.5 2.6c-1 .6-1.5 1.2-1.5 2.4M12 18v.5"/>'
  };
  var NOISE = [[0, 'Polite'], [8, 'Festive'], [20, 'Neighbours awake'], [40, 'Visible from space'], [70, 'HR has questions'], [120, 'Legendary']];
  var SURPRISE_TEXT = ['E2M', 'E2M', 'WOW', 'YAY'];
  var MAX_HOLD = 1600, GRAND_AFTER = 380, QUICK = 230;
  var INTENSITY = { calm: 0.5, standard: 1, max: 1.3 };
  var BARRAGE_MS = { rocket: 210, shell: 250, anar: 620, chakri: 620, ladi: 1350, bijli: 820 };

  /* ---------- persisted deck choices ---------- */
  var DECK_KEY = 'e2m-diwali:fw-deck';
  var deck = { cracker: 'shell', shape: 'peony', colour: 'rainbow', power: 60, wind: '0', trails: true, mode: 'single', echo: 'hall' };
  function okIn(list, v) { for (var i = 0; i < list.length; i++) if (list[i].k === v) return true; return false; }
  (function loadDeck() {
    var raw = null;
    try { raw = JSON.parse(W.localStorage.getItem(DECK_KEY) || 'null'); } catch (e) { raw = null; }
    if (!raw || typeof raw !== 'object') return;
    if (okIn(CRACKERS, raw.cracker)) deck.cracker = raw.cracker;
    if (okIn(SHAPES, raw.shape)) deck.shape = raw.shape;
    if (okIn(COLOURS, raw.colour)) deck.colour = raw.colour;
    if (okIn(MODES, raw.mode)) deck.mode = raw.mode;
    if (okIn(WINDS, String(raw.wind))) deck.wind = String(raw.wind);
    if (okIn(ECHOES, raw.echo)) deck.echo = raw.echo;
    var pw = Number(raw.power); if (isFinite(pw)) deck.power = clamp(Math.round(pw / 10) * 10, 20, 100);
    if (typeof raw.trails === 'boolean') deck.trails = raw.trails;
  })();
  function saveDeck() { try { W.localStorage.setItem(DECK_KEY, JSON.stringify(deck)); } catch (e) {} }

  /* ---------- the temple-town skyline ----------
     Built with the shared kit (E2M.temple) for the container's real aspect ratio, so the viewBox always matches
     the box: every tower is drawn whole (finials and flags included, never sliced by a crop) and the town runs
     edge to edge at any width (360 → 2560+). Two depth layers (a hazy distant town + the near temple town); the
     whole town is one composited layer that shakes at depth 1 (R7). Seeded randomness keeps the art stable. */
  function f1(n) { return Math.round(n * 10) / 10; }
  function skylineSVG(VW) {
    var T = E2M.temple, ox = VW / 2 - 800, rnd = T.seeded(20261105), far = T.kit(), near = T.kit(), B = 567;
    function X(x) { return x + ox; }
    far.S(T.rect(-80, 548, VW + 160, 52));
    far.town(-80, VW + 80, 560, { rnd: T.seeded(7), scale: 0.6 });
    near.steps(-60, VW + 60, 600, 3, 11);
    // the composition at the centre: the main Nagara temple on its jagati, flanked by mandapas, deepmalas and gopurams
    near.house(X(40), B, 120, 110, { rnd: rnd });
    near.gopuram(X(250), B, 160, 280, { tiers: 5, kalashas: 5, flag: true });
    near.deepmala(X(372), B, 220);
    near.house(X(396), B, 100, 96, { rnd: rnd });
    near.deepmala(X(524), B, 252);
    near.steps(X(552), X(1048), B, 3, 10);
    near.mandapa(X(564), 537, 100, 116, { rnd: rnd });
    near.shikhara(X(800), 537, 168, 330, { spires: 2, lit: 0.62 });
    near.mandapa(X(936), 537, 100, 116, { rnd: rnd });
    near.deepmala(X(1076), B, 252);
    near.house(X(1104), B, 100, 96, { rnd: rnd });
    near.deepmala(X(1228), B, 220);
    near.gopuram(X(1350), B, 160, 280, { tiers: 5, kalashas: 5, flag: true });
    near.house(X(1440), B, 120, 110, { rnd: rnd });
    // the wings: shrines, havelis, mandapas, gopurams and lamp towers, mirrored, descending towards the edges
    var pieces = [], cur = 0, need = Math.max(0, ox) + 160, w;
    while (cur < need) {
      var fall = Math.min(1, cur / 1400), r = rnd();
      if (r < 0.3) { w = 90 + rnd() * 80; pieces.push({ k: 'house', w: w, s: w, h: (128 - fall * 46) * (0.75 + rnd() * 0.4) }); }
      else if (r < 0.5) { w = 46 + rnd() * 26; pieces.push({ k: 'shrine', w: w, s: w * 1.3, h: w * (2.4 + rnd() * 0.6) * (1 - fall * 0.35) }); }
      else if (r < 0.68) { w = 100 + rnd() * 60; pieces.push({ k: 'mandapa', w: w, s: w * 1.2, h: w * 0.62 * (1 - fall * 0.2) }); }
      else if (r < 0.8) { pieces.push({ k: 'deepmala', w: 22, s: 30, h: 190 - fall * 64 }); }
      else if (r < 0.9) { w = 110 + rnd() * 40; pieces.push({ k: 'gopuram', w: w, s: w * 1.06, h: w * 1.5 * (1 - fall * 0.3) }); }
      else { w = 60 + rnd() * 50; pieces.push({ k: 'wall', w: w, s: w, h: 44 + rnd() * 20 }); }
      cur += pieces[pieces.length - 1].s + 6;
    }
    [-1, 1].forEach(function (side) {
      var x = side < 0 ? X(32) : X(1568);
      pieces.forEach(function (pc) {
        var x0 = side < 0 ? x - pc.s - 6 : x + 6, cx = x0 + pc.s / 2;
        if (pc.k === 'house') near.house(x0, B, pc.w, pc.h, { rnd: rnd });
        else if (pc.k === 'shrine') near.shikhara(cx, B, pc.w, pc.h, { bands: 4, flag: rnd() < 0.6, flagSide: side, lit: 0.18 + rnd() * 0.4 });
        else if (pc.k === 'mandapa') near.mandapa(x0 + pc.w * 0.1, B, pc.w, pc.h, { rnd: rnd });
        else if (pc.k === 'deepmala') near.deepmala(cx, B, pc.h, { rows: 8 });
        else if (pc.k === 'gopuram') near.gopuram(cx, B, pc.w, pc.h, { tiers: 4, kalashas: 4 });
        else near.wall(x0, B, pc.w, pc.h);
        x = side < 0 ? x0 - 6 : x0 + pc.s + 6;
      });
    });
    var wins = near.win.map(function (s) { return '<path class="fw-win" d="' + s.d + '" opacity="' + s.o.toFixed(2) + '"/>'; }).join('');
    var vb = 'viewBox="0 0 ' + f1(VW) + ' 600" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false"';
    // the base art never repaints; windows, lamps, light spill and flags live in a light overlay svg
    var live = '<svg class="fw-live" ' + vb + '><g class="fw-sl-near-live">' + near.svg({ id: 'fwl', only: 'live' }) +
      '<g class="fw-wins" fill="#E8A94A">' + wins + '</g><g class="fw-wins-flare" fill="#FFD28A" opacity="0">' + wins.replace(/ opacity="[^"]*"/g, '') + '</g></g></svg>';
    return '<svg ' + vb + '>' +
      '<defs><linearGradient id="fw-near-g" gradientUnits="userSpaceOnUse" x1="0" y1="160" x2="0" y2="600"><stop offset="0" stop-color="#0A0C27"/><stop offset=".55" stop-color="#06081A"/><stop offset="1" stop-color="#05070F"/></linearGradient>' +
      '<linearGradient id="fw-far-g" gradientUnits="userSpaceOnUse" x1="0" y1="380" x2="0" y2="600"><stop offset="0" stop-color="#121338"/><stop offset="1" stop-color="#0B0D28"/></linearGradient></defs>' +
      '<g class="fw-sl-far">' + far.svg({ id: 'fwf', fill: 'url(#fw-far-g)', strokeOpacity: 0.05, lineOpacity: 0.03, winFill: '#B9813C', only: 'static' }) + '</g>' +
      '<g class="fw-sl-near">' + near.svg({ id: 'fwn', fill: 'url(#fw-near-g)', strokeOpacity: 0.12, lineOpacity: 0.06, win: false, only: 'static' }) + '</g></svg>' + live;
  }
  var skylineW = 0, skylineH = 0;
  function renderSkyline(force) {
    var box = root && root.querySelector('.fw-skyline');
    if (!box || !E2M.temple) return;
    var r = box.getBoundingClientRect(), w = Math.round(r.width), h = Math.round(r.height);
    if (!w || !h || (!force && w === skylineW && h === skylineH)) return;
    skylineW = w; skylineH = h;
    // the art is 600 units tall; never narrower than the temple core (1250 units) — on very narrow screens the
    // aspect is kept with "meet", so the whole town is shown shorter rather than cropped
    var VW = Math.max(1250, w * 600 / h);
    box.innerHTML = skylineSVG(VW);
    winFlare = box.querySelector('.fw-wins-flare');
  }
  var winFlare = null, flareAnim = null;
  function flareWindows(color, power) {
    if (!winFlare || !winFlare.animate) return;
    winFlare.setAttribute('fill', warm(color));
    if (flareAnim) flareAnim.cancel();
    var peak = Math.min(0.95, 0.25 + power * 0.8);
    flareAnim = winFlare.animate([{ opacity: peak }, { opacity: peak * 0.55, offset: 0.35 }, { opacity: 0 }], { duration: 650 + power * 500, easing: 'cubic-bezier(.2,.7,.3,1)' });
  }
  // mix a firework colour towards warm lamplight so windows (and, R4, the sky glow) read warm, never neon or muddy
  function warm(c) {
    var m = /^#?([0-9a-f]{6})$/i.exec(c || '');
    if (!m) return '#FFD28A';
    var n = parseInt(m[1], 16), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255;
    r = Math.round(r * 0.45 + 255 * 0.55); g = Math.round(g * 0.45 + 210 * 0.55); b = Math.round(b * 0.45 + 140 * 0.55);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  /* ---------- state ---------- */
  var root, zoneEl, sky, layer, eng, rim, skyglow, guide, countEl, noiseEl, crazyBtn, showBtn, moreBtn, moreSum, tray, legend, charge, chArc, chBeam, chLabel, zhHint;
  var invite, rmChip, hapBtn, hapLabel, showBar, flashEl, powerIn, powerOut, trailsBtn, echoNote, echoOn;
  var launched = 0, noiseTier = 0, active = false, crazy = false, userBursts = 0;
  var idleT = 0, lastUser = 0, surpriseToast = false, crazyAt = 0, grandToast = false, chargeToast = false, bijliToast = false;
  var down = null, chargeRaf = 0, fuse = null, lastTap = { t: 0, x: 0, y: 0 }, lastTick = 0, lastChargeHap = 0;
  var pieces = [], show = null, barrageT = 0, sparkler = null, lastBijli = 0;

  function live() { return E2M.fwLive ? E2M.fwLive() : !E2M.reduced; }
  function powerK() { return 0.65 + 0.7 * (deck.power / 100); }
  function colourFor() { return deck.colour === 'random' ? pick(['rainbow', 'gold', 'pinkpurple', 'saffrongreen', 'multi', 'gold', 'rainbow']) : deck.colour; }
  function engCap() { return Math.round((live() ? (E2M.mobile ? 350 : 900) * (INTENSITY[E2M.prefs.intensity] || 1) : E2M.maxParticles) * 1.6); }
  function engQ() { return live() ? (E2M.mobile ? 0.6 : 1) : 0.35; }

  /* ---------- markup ---------- */
  function icon(k) { return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">' + ICONS[k] + '</svg>'; }
  function radios(list, attr, cur, cls, inner) {
    return list.map(function (it) {
      var on = it.k === cur;
      return '<button type="button" role="radio" class="' + (cls || '') + '" aria-checked="' + on + '" tabindex="' + (on ? 0 : -1) + '" data-' + attr + '="' + it.k + '">' + (inner ? inner(it) : '<span>' + it.label + '</span>') + '</button>';
    }).join('');
  }
  var ICON_MOUSE = '<svg class="fw-gi-mouse" data-input="mouse" viewBox="0 0 40 56" aria-hidden="true"><rect x="7" y="4" width="26" height="42" rx="13" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M20 4v14M7.4 18h25.2" fill="none" stroke="currentColor" stroke-width="1.1"/><rect class="fw-gi-btn" x="7.6" y="4.6" width="12" height="13" rx="6" fill="currentColor" opacity=".0"/></svg>';
  var ICON_HAND = '<svg class="fw-gi-hand" data-input="touch" viewBox="0 0 40 56" aria-hidden="true"><path d="M17 30V9.5a3 3 0 0 1 6 0V26l9.6 2.4c2.6.7 4 3.2 3.4 5.8L33 46c-.6 2.4-2.8 4-5.2 4H18.6a6 6 0 0 1-4.6-2.2L6.4 38.6a3 3 0 0 1 4.2-4.2L17 39" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"/></svg>';
  var BELL = '<svg class="fw-bell" aria-hidden="true" viewBox="0 0 32 46"><use href="#i-bell"/></svg>';

  function build(stage) {
    root = D.createElement('div');
    root.className = 'act-fireworks';
    root.innerHTML =
      '<div class="fw-sky" tabindex="0" role="button" aria-label="Fireworks sky. Click or tap anywhere in this zone to light the chosen cracker; hold to charge it higher; double-click for a huge one. With the keyboard: Enter lights one, hold Space to charge (or to keep firing in Barrage), Shift plus Enter for a huge one." aria-describedby="fw-desc">' +
        '<p class="sr-only" id="fw-desc">A night sky over a Hindu temple town of shikharas, gopurams and lamp towers, with crackers going off all around. Each rocket bursts into light and the temple windows glow in its colour.</p>' +
        '<div class="fw-skyglow" aria-hidden="true"></div>' +
        '<div class="fw-rim" aria-hidden="true"></div>' +
        '<div class="fw-skyline" aria-hidden="true" data-impact-depth="1"></div>' +
        '<div class="fw-guide" aria-hidden="true">' +
          '<span class="fw-guide-icon"><i class="fw-gi-ring"></i>' + ICON_MOUSE + ICON_HAND + '</span>' +
          '<p class="fw-guide-l1">' + CLICK + ' anywhere to burst</p>' +
          '<p class="fw-guide-l2">Hold to charge it higher</p>' +
          '<p class="fw-guide-l3">' + DOUBLE + ' for a big one</p>' +
        '</div>' +
      '</div>' +
      // status strip over the top of the sky: the sound invite and the one-time reduced-motion chip
      '<div class="fw-status">' +
        '<p class="fw-invite" hidden>' + BELL + '<span class="fw-invite-l">Sound is off — turn it on for crackers with echo</span>' +
          '<button class="btn-marigold btn-marigold--sm fw-sound-on" type="button"><span>Turn sound on</span></button></p>' +
        '<p class="fw-rmchip" hidden><span class="fw-rm-l">Reduced motion detected — fireworks background is on for this section</span>' +
          '<button class="btn-tilak btn-tilak--text fw-rm-off" type="button"><span>Turn off</span></button>' +
          '<button class="fw-rm-x" type="button" aria-label="Keep it on and dismiss this note"><span aria-hidden="true">×</span></button></p>' +
      '</div>' +
      '<div class="fw-deck">' +
        '<i class="fw-showbar" aria-hidden="true"><b></b></i>' +
        '<div class="fw-row fw-row--crackers">' +
          '<p class="fw-glabel" id="fw-l-cracker">Cracker</p>' +
          '<div class="fw-crackers" role="radiogroup" aria-labelledby="fw-l-cracker">' +
            radios(CRACKERS, 'cracker', deck.cracker, 'fw-ck', function (c) { return icon(c.k) + '<span class="fw-ck-l">' + c.label + '</span><span class="fw-ck-hi" lang="hi" aria-hidden="true">' + c.hi + '</span>'; }) +
          '</div>' +
        '</div>' +
        '<div class="fw-row fw-row--main">' +
          '<div class="fw-field fw-field--mode"><p class="fw-glabel" id="fw-l-mode">Launch</p><div class="seg seg--sm fw-seg" role="radiogroup" aria-labelledby="fw-l-mode">' + radios(MODES, 'mode', deck.mode) + '</div></div>' +
          '<p class="fw-meter"><b class="fw-count">0</b><span class="fw-meter-l">launched</span><span class="fw-sep" aria-hidden="true"></span><span class="fw-noise"><span class="sr-only">Noise level: </span><b>Polite</b></span></p>' +
          '<button class="fw-hap" type="button" aria-pressed="false"><i class="fw-hap-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><rect x="8" y="4" width="8" height="16" rx="2"/><path d="M4.6 9v6M2.4 10.6v2.8M19.4 9v6M21.6 10.6v2.8"/></svg></i><span class="fw-hap-l">Haptics</span></button>' +
          '<div class="fw-tools">' +
            '<button class="btn-marigold btn-marigold--sm fw-more" type="button" aria-expanded="false" aria-controls="fw-tray"><span>More options</span></button>' +
            '<button class="btn-diya btn-diya--sm fw-show" type="button" aria-pressed="false"><span>Diwali night show</span></button>' +
            '<button class="btn-diya btn-diya--sm btn-diya--brass fw-crazy" type="button"><span>Go crazy</span></button>' +
          '</div>' +
        '</div>' +
        '<div class="fw-tray" id="fw-tray" role="group" aria-label="More firework options" hidden>' +
          '<div class="fw-tsec fw-tsec--shape"><p class="fw-tlabel" id="fw-l-shape">Shell shape <small>for aerial shells</small></p>' +
            '<div class="fw-chips" role="radiogroup" aria-labelledby="fw-l-shape">' + radios(SHAPES, 'shape', deck.shape, 'fw-chip', function (s) { return icon(s.k) + '<span class="fw-chip-l">' + s.label + '</span>'; }) + '</div></div>' +
          '<div class="fw-tsec fw-tsec--colour"><p class="fw-tlabel" id="fw-l-colour">Colour</p>' +
            '<div class="fw-chips" role="radiogroup" aria-labelledby="fw-l-colour">' + radios(COLOURS, 'colour', deck.colour, 'fw-chip fw-chip--gem', function (c) { return '<span class="fw-gem fw-gem--' + c.k + '" aria-hidden="true"></span><span class="fw-chip-l">' + c.label + '</span>'; }) + '</div></div>' +
          '<div class="fw-tsec fw-tsec--feel">' +
            '<div class="fw-tfield fw-tfield--power"><label class="fw-tlabel" for="fw-power">Power</label><input class="fw-range" id="fw-power" type="range" min="20" max="100" step="10" value="' + deck.power + '"><output class="fw-out" for="fw-power">' + deck.power + '%</output></div>' +
            '<div class="fw-tfield"><p class="fw-tlabel" id="fw-l-wind">Wind</p><div class="seg seg--sm fw-seg" role="radiogroup" aria-labelledby="fw-l-wind">' + radios(WINDS, 'wind', deck.wind) + '</div></div>' +
            '<div class="fw-tfield"><p class="fw-tlabel" id="fw-l-trails">Trails</p><button class="fw-switch" type="button" role="switch" aria-checked="' + deck.trails + '" aria-labelledby="fw-l-trails"><i aria-hidden="true"></i><span aria-hidden="true">' + (deck.trails ? 'On' : 'Off') + '</span></button></div>' +
          '</div>' +
          '<div class="fw-tsec fw-tsec--echo"><p class="fw-tlabel" id="fw-l-echo">Echo <small class="fw-echo-note">turn sound on to hear it</small></p>' +
            '<div class="fw-echo-row"><div class="seg seg--sm fw-seg" role="radiogroup" aria-labelledby="fw-l-echo">' + radios(ECHOES, 'echo', deck.echo) + '</div>' +
            '<button class="btn-tilak btn-tilak--text fw-sound-on fw-echo-on" type="button"><span>Turn sound on</span></button></div></div>' +
          '<div class="fw-tfoot"><button class="btn-tilak btn-tilak--text fw-reset" type="button"><span>Reset the deck</span></button><button class="btn-marigold btn-marigold--sm fw-tray-done" type="button"><span>Done</span></button></div>' +
        '</div>' +
        '<p class="fw-legend"></p>' +
      '</div>';
    stage.appendChild(root);
    // R7: the stage itself stays still under the finger; its depth layers shake (core: data-impact-stage)
    stage.setAttribute('data-impact-stage', 'none');
    sky = root.querySelector('.fw-sky'); rim = root.querySelector('.fw-rim'); skyglow = root.querySelector('.fw-skyglow');
    guide = root.querySelector('.fw-guide'); countEl = root.querySelector('.fw-count'); noiseEl = root.querySelector('.fw-noise b');
    crazyBtn = root.querySelector('.fw-crazy'); showBtn = root.querySelector('.fw-show');
    moreBtn = root.querySelector('.fw-more'); tray = root.querySelector('.fw-tray'); legend = root.querySelector('.fw-legend');
    invite = root.querySelector('.fw-invite'); rmChip = root.querySelector('.fw-rmchip');
    hapBtn = root.querySelector('.fw-hap'); hapLabel = root.querySelector('.fw-hap-l');
    showBar = root.querySelector('.fw-showbar b');
    powerIn = root.querySelector('#fw-power'); powerOut = root.querySelector('.fw-out');
    trailsBtn = root.querySelector('.fw-switch'); echoNote = root.querySelector('.fw-echo-note'); echoOn = root.querySelector('.fw-echo-on');
    zoneEl = stage.closest('.zone') || stage;
    zhHint = zoneEl.querySelector('.zh-hint');
    // the charge meter lives on the zone (not the stage, which an impact thump translates)
    charge = D.createElement('div');
    charge.className = 'fw-charge'; charge.setAttribute('aria-hidden', 'true');
    charge.innerHTML = '<i class="fw-ch-beam"></i><i class="fw-ch-ring"></i><i class="fw-ch-core"></i><span class="fw-ch-label">Hold</span>';
    zoneEl.appendChild(charge);
    chArc = charge.querySelector('.fw-ch-ring'); chBeam = charge.querySelector('.fw-ch-beam'); chLabel = charge.querySelector('.fw-ch-label');
    // a soft, capped white flash for the bijli bomb: inside the zone, BEHIND its text and controls
    flashEl = D.createElement('div'); flashEl.className = 'fw-flash'; flashEl.setAttribute('aria-hidden', 'true');
    zoneEl.insertBefore(flashEl, stage);
  }

  /* ---------- deck state → UI ---------- */
  function setRadio(attr, val) {
    root.querySelectorAll('[data-' + attr + ']').forEach(function (b) {
      var on = b.getAttribute('data-' + attr) === String(val);
      b.setAttribute('aria-checked', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1;
    });
  }
  // the hint as plain words for a screen reader, in the visitor's input language (click / tap)
  function plain(html) {
    var d = D.createElement('div'); d.innerHTML = html;
    d.querySelectorAll('[data-input]').forEach(function (n) { if (n.getAttribute('data-input') !== E2M.input) n.parentNode.removeChild(n); });
    d.querySelectorAll('i').forEach(function (n) { n.textContent = '. '; });
    return d.textContent.replace(/\s+/g, ' ').replace(/\s\./g, '.').trim();
  }
  function labelOf(list, k) { for (var i = 0; i < list.length; i++) if (list[i].k === k) return list[i].label; return k; }
  function syncLegend() {
    var c = CK[deck.cracker], m = deck.mode === 'volley' ? ' <i></i> Volley: three to five at once' : (deck.mode === 'barrage' && deck.cracker !== 'phuljhadi' ? ' <i></i> Barrage: hold to keep firing' : '');
    legend.innerHTML = c.hint + m;
    root.classList.toggle('is-draw', deck.cracker === 'phuljhadi');
    if (moreBtn) moreBtn.setAttribute('aria-label', 'More options. Now: ' + labelOf(COLOURS, deck.colour) + ', ' + labelOf(SHAPES, deck.shape) + ' shells, power ' + deck.power + ' percent, echo ' + labelOf(ECHOES, deck.echo) + '.');
  }
  function applyFeel() {
    if (eng) { eng.wind = Number(deck.wind) * 40; eng.setTrails(deck.trails, 0.17); }
    if (E2M.ambient && E2M.ambient.wind) E2M.ambient.wind(Number(deck.wind) * 40);
    if (E2M.audio.echo) E2M.audio.echo(deck.echo);
    trailsBtn.setAttribute('aria-checked', deck.trails ? 'true' : 'false');
    trailsBtn.querySelector('span').textContent = deck.trails ? 'On' : 'Off';
    powerIn.value = deck.power; powerOut.textContent = deck.power + '%';
    powerIn.setAttribute('aria-valuetext', deck.power + ' percent');
  }
  function syncStatus() { var n = (invite.hidden ? 0 : 1) + (rmChip.hidden ? 0 : 1); root.classList.toggle('has-status', n === 1); root.classList.toggle('has-status-2', n === 2); }
  function syncSound() {
    var on = E2M.audio.enabled;
    invite.hidden = on;
    echoNote.hidden = on; echoOn.hidden = on;
    syncStatus();
  }
  function syncHap() {
    var sup = !!E2M.hapticsSupported, on = sup && !!E2M.prefs.haptics;
    hapBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    hapBtn.setAttribute('aria-disabled', sup ? 'false' : 'true');
    hapBtn.classList.toggle('is-unsupported', !sup);
    hapLabel.textContent = !sup ? 'Haptics: not supported on this device (try a phone)' : (on ? 'Haptics on' : 'Haptics off');
  }
  function setTray(open) {
    tray.hidden = !open;
    moreBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    moreBtn.classList.toggle('is-active', open);
  }

  /* ---------- light, thump and smoke for every explosion ---------- */
  var lastImpactAt = 0;
  function skyPct(x, y) { var r = sky.getBoundingClientRect(); return { x: ((x - r.left) / (r.width || 1) * 100).toFixed(1), y: ((y - r.top) / (r.height || 1) * 100).toFixed(1) }; }
  function lightSky(xPct, yPct, c, a, ms) {
    if (!skyglow || !skyglow.animate || a < 0.02) return;
    skyglow.style.setProperty('--gx', xPct + '%'); skyglow.style.setProperty('--gy', yPct + '%'); skyglow.style.setProperty('--gc', c);
    skyglow.animate([{ opacity: a }, { opacity: 0 }], { duration: ms, easing: 'cubic-bezier(.2,.7,.3,1)' });
  }
  function rimLight(xPct, c, a, ms) {
    if (!rim || !rim.animate || a < 0.02) return;
    rim.style.setProperty('--fx', xPct + '%'); rim.style.setProperty('--fc', c);
    rim.animate([{ opacity: a }, { opacity: 0 }], { duration: ms, easing: 'cubic-bezier(.2,.7,.3,1)' });
  }
  function showK() { return show ? clamp((performance.now() - show.t0) / 40000, 0, 1) : 0; }
  function onBurst(x, y, c, size, op) {
    var now = performance.now(), user = crazy || !!show || now - lastUser < 2800 || (op && op.user), pc = skyPct(x, y);
    // R7 flash safety: the sky light counts against the shared budget of 3 large flashes per second
    var k = E2M.flashGate ? E2M.flashGate(Math.min(1, 0.2 + size * 0.45)) : 1;
    rimLight(pc.x, c, Math.min(0.9, 0.45 + size * 0.25) * k, 900 + size * 300);
    lightSky(pc.x, pc.y, c, Math.min(0.85, 0.3 + size * 0.28) * k, 1000 + size * 400);
    /* R7: every shell the visitor lights shakes the scene 2-8px (by size; translate only) and gives a burst
       haptic whose two-pulse tail lands with the sound's echo. Idle surprise shells only nudge (no haptic). */
    var power = Math.min(1, 0.12 + size * 0.42);
    if (crazy) power *= 0.5 + 0.5 * Math.min(1, (now - crazyAt) / 6400);
    if (show) power *= 0.6 + 0.4 * showK();
    flareWindows(c, Math.max(user ? power : power * 0.45, crazy ? 0.4 : 0));
    // the night show escalates: thumps at most every ~380ms early on, tightening to ~190ms for the finale
    if (now - lastImpactAt > (crazy ? 190 : (show ? 380 - 190 * showK() : 80))) {
      lastImpactAt = now;
      if (user) {
        if (E2M.impact) E2M.impact(power, { x: x, y: y, color: c, kind: (op && op.kind) || 'firework', haptic: false, zone: 'fireworks' });
        if (E2M.haptic) E2M.haptic('burst', power);
      } else if (E2M.shake) E2M.shake(Math.min(3, 1 + size * 1.3), 380, { x: x, y: y, kind: 'ambient', zone: 'fireworks' });
    }
    if (user && !crazy && size >= 1.15 && E2M.screenGlow) E2M.screenGlow(warm(c), Math.min(1, size / 1.9), x, y);
    if (user && E2M.ambient && Math.random() < 0.7) E2M.ambient.smoke(x, y, Math.min(1.3, size), c);
    if (user && !crazy && !show) { userBursts++; if (userBursts === 3 && guide) guide.classList.add('is-gone'); }
  }
  function touchUser() { lastUser = performance.now(); if (E2M.ambient && E2M.ambient.touch) E2M.ambient.touch(); if (zhHint) zhHint.classList.add('is-done'); }

  /* ---------- where things go ---------- */
  // rockets leave from the temple town if it is on screen, otherwise from just below the viewport
  function launchBase() {
    var r = sky.getBoundingClientRect(), vh = W.innerHeight;
    return Math.min(vh + 14, r.bottom - r.height * 0.1);
  }
  function groundY(y) { return clamp(y, 70, launchBase() - 18); }
  function targetY(y, p) {
    var top = Math.max(W.innerHeight * 0.07, 40), base = launchBase();
    var ty = p < 0.1 ? y : y - (y - top) * Math.min(1, p * 0.96);
    return Math.max(top, Math.min(ty, base - 150));
  }
  function skySpot(fx, fy) { var r = sky.getBoundingClientRect(); return { x: W.innerWidth * fx, y: clamp(r.top + r.height * fy, 70, W.innerHeight * 0.72) }; }
  function groundSpot(fx) { var r = sky.getBoundingClientRect(); return { x: W.innerWidth * fx, y: Math.min(W.innerHeight - 40, r.bottom - r.height * 0.15) }; }

  /* ---------- aerial crackers: shells and rockets ---------- */
  function resolveShape() {
    var s = deck.shape;
    if (s === 'text') return { type: 'text', text: 'E2M' };
    if (s !== 'surprise') return { type: s };
    if (Math.random() < 0.18) return { type: 'text', text: pick(SURPRISE_TEXT) };
    return { type: pick(['peony', 'ring', 'heart', 'willow', 'palm', 'crossette', 'chrysanthemum', 'strobe']) };
  }
  function shellOpts(x, ty, p, o) {
    o = o || {};
    var base = launchBase(), t = o.type ? { type: o.type, text: o.text } : resolveShape();
    return {
      rocket: true, fromX: clamp(x + rand(-46, 46), 10, W.innerWidth - 10), fromY: base,
      T: 0.62 + p * 0.62 + rand(0, 0.14), type: t.type, text: t.text, color: o.color || colourFor(),
      size: (0.56 + p * 1.14) * (E2M.mobile ? 0.86 : 1) * (o.k || powerK()), textSize: 90,
      distance: 0.1 + 0.3 * clamp(1 - ty / W.innerHeight, 0, 1), launchSound: 'mortar', tail: 0.8, user: true
    };
  }
  function shell(x, y, p, o) {
    var ty = targetY(y, p), op = shellOpts(x, ty, p, o);
    if (p > 0.45) op.after = function (bx, by) { subBursts(bx, by, p, op.color); };
    eng.firework(x, ty, op);
    if (E2M.haptic) E2M.haptic('rocket', 0.3 + 0.5 * p);
    bump(1);
    if (p > 0.6 && !chargeToast) { chargeToast = true; setTimeout(function () { E2M.toast('Charged shells climb higher and break wider. Hold it all the way for a grand one.'); }, 900); }
  }
  /* the udan rocket: a thin, wobbling streak with a real whistle; it cracks into a small crackling star */
  function rocket(x, y, p, big, o) {
    o = o || {};
    var ty = targetY(y, Math.max(p, 0.25)), k = (big ? 1.45 : 1) * (o.k || powerK());
    eng.firework(x, ty, {
      rocket: true, fromX: clamp(x + rand(-30, 30), 10, W.innerWidth - 10), fromY: launchBase(), T: 0.82 + 0.5 * p + rand(0, 0.12),
      launchSound: 'whistle', tail: 2, wobble: 1.7, head: 1.15, type: pick(['crossette', 'peony', 'strobe', 'crossette']),
      color: o.color || colourFor(), size: (0.5 + 0.45 * p) * k, crackle: true, distance: 0.16, user: true, kind: 'rocket',
      after: function (bx, by) { if (p > 0.5 || big) subBursts(bx, by, 0.6, o.color); }
    });
    if (E2M.haptic) E2M.haptic('rocket', 0.5 + 0.5 * p);
    bump(1);
  }
  function subBursts(bx, by, p, col) {
    var n = Math.round((p - 0.35) * 8), sc = eng.scale;
    for (var i = 0; i < n; i++) (function (i) {
      setTimeout(function () {
        if (!active) return;
        var a = Math.random() * Math.PI * 2, r = rand(70, 150) * p * sc;
        eng.firework(bx + Math.cos(a) * r, by + Math.sin(a) * r * 0.7, { type: pick(['crossette', 'peony', 'chrysanthemum', 'strobe']), color: col || colourFor(), size: rand(0.4, 0.62), sound: i % 2 === 0, distance: 0.3, sub: true });
      }, 180 + i * rand(90, 140));
    })(i);
  }
  function grand(x, y) {
    var ty = targetY(y, 1), op = shellOpts(x, ty, 1), col = op.color;
    op.type = 'mega'; op.size = E2M.mobile ? 1.45 : 1.95; op.T = 1.3; op.distance = 0.22; op.kind = 'grand';
    op.after = function (bx, by) {
      if (E2M.screenGlow) E2M.screenGlow(warm(E2M.nextHue ? E2M.nextHue() : '#FFD778'), 1, bx, by);
      if (E2M.impact) E2M.impact(0.95, { x: bx, y: by, color: '#FFF4DC', kind: 'grand', zone: 'fireworks', haptic: 'grand' });
      E2M.audio.play('thump', { power: 0.8 });
      for (var i = 0; i < 10; i++) (function (i) {
        setTimeout(function () {
          var a = i / 10 * Math.PI * 2 + rand(-0.2, 0.2), r = rand(150, 270) * eng.scale;
          eng.firework(bx + Math.cos(a) * r, by + Math.sin(a) * r * 0.62, { type: pick(['peony', 'ring', 'crossette', 'chrysanthemum', 'palm']), color: col, size: rand(0.6, 0.95), sound: i % 3 === 0, distance: 0.28, sub: true });
        }, 280 + i * 115);
      })(i);
      setTimeout(function () { if (active) eng.goldenRain(E2M.mobile ? 50 : 100); }, 1550);
    };
    eng.firework(x, ty, op);
    if (E2M.haptic) E2M.haptic('rocket', 1);
    bump(5);
    if (!grandToast) { grandToast = true; setTimeout(function () { E2M.toast('Fully charged. That one had a pension plan.'); }, 1600); }
    if (E2M.announce) E2M.announce('Grand shell launched.');
  }
  function mega(x, y, col) {
    var yy = Math.min(y, launchBase() - 160), c = col || colourFor();
    eng.firework(x, yy, { type: 'mega', size: (E2M.mobile ? 1.5 : 2.2) * Math.min(1.15, powerK()), color: c, distance: 0.12, user: true, kind: 'mega' });
    if (E2M.screenGlow) E2M.screenGlow(warm(E2M.colors[c] || (E2M.nextHue ? E2M.nextHue() : '#FFD778')), 0.9, x, yy);
    bump(3);
  }

  /* ---------- ground crackers: emitters on the zone's sky canvas ---------- */
  function track(h) { pieces.push(h); return h; }
  function untrack(h) { var i = pieces.indexOf(h); if (i > -1) pieces.splice(i, 1); }
  function stopPieces() { pieces.slice().forEach(function (h) { h.stop(); }); pieces.length = 0; }
  // R7 perf: emitters yield when the sky engine is more than half full, and never emit more than `max` a frame
  function budget(n, max) { var room = eng.room ? eng.room() : 999, k = Math.max(0, Math.min(1, room / (eng.cap * 0.5))); return Math.min(max, Math.round(n * k)); }
  function hueCycle(t) { return E2M.rainbow ? E2M.rainbow[Math.floor(t * 6) % 24] : '#FFD778'; }
  function sparkColour(mode, t, cf) {
    if (Math.random() < 0.55) return Math.random() < 0.5 ? '#FFF4DC' : '#FFD778';
    return mode === 'rainbow' ? hueCycle(t + Math.random() * 0.5) : cf();
  }
  /* ANAR: a clay pot fountain at the point — sparks spray up for ~3s, ramping in and dying down */
  function anar(x, y, big, o) {
    o = o || {};
    var gx = x, gy = groundY(y), pw = deck.power / 100, dur = (big ? 4.2 : 3.1) * (0.85 + 0.3 * pw), H = (210 + 300 * pw) * eng.scale * (big ? 1.3 : 1);
    var mode = o.color || colourFor(), cf = eng.colorFn(mode === 'rainbow' ? 'multi' : mode), t0 = 0, hapAt = 0, stopped = false;
    var snd = E2M.audio.enabled ? E2M.audio.loop('anar', { rate: 0.1 }) : null, v0 = Math.sqrt(2 * 380 * H);
    var h = track({ stop: function () { stopped = true; if (snd) snd.stop(); } });
    eng.addEmitter(function (dt) {
      t0 += dt;
      var k = t0 < 0.35 ? t0 / 0.35 : (t0 > dur - 0.7 ? Math.max(0, (dur - t0) / 0.7) : 1);
      if (stopped) k = 0;
      var n = budget((E2M.mobile ? 4 : 7) * k * (big ? 1.35 : 1) * (dt * 60), 12);
      for (var i = 0; i < n; i++) {
        var a = -Math.PI / 2 + rand(-0.3, 0.3) * (0.7 + 0.3 * k), v = v0 * rand(0.55, 1.02) * (0.55 + 0.45 * Math.sqrt(k));
        eng.emit(gx + rand(-3, 3), gy - 4, Math.cos(a) * v, Math.sin(a) * v, rand(0.6, 1.15), rand(0.8, 1.7), sparkColour(mode, t0, cf), { g: 380, drag: 0.984, gl: Math.random() < 0.08 ? 0.25 : 0, st: Math.random() < 0.6 });
      }
      if (k > 0) eng.glow(gx, gy - 6, 26 + 18 * k, '#FFC46A', 0.1 * k);
      if (snd) snd.set(0.12 + 0.6 * k);
      if (t0 - hapAt > 0.2 && k > 0.2) { hapAt = t0; if (E2M.haptic) E2M.haptic('fizz', k); }
      if (t0 >= dur || (stopped && t0 > 0)) { if (snd) snd.stop(); untrack(h); return false; }
      return true;
    });
    if (E2M.shake) E2M.shake(3 + (big ? 1 : 0), 900, { x: gx, y: gy, sustain: 0.5, f: 11, zone: 'fireworks' });
    if (E2M.haptic) E2M.haptic('fizz', 0.8);
    var pc = skyPct(gx, gy); rimLight(pc.x, '#FFD778', 0.5, 2200);
    bump(1);
    return h;
  }
  /* CHAKRI: a ground spinner at the point, flinging a ring of sparks tangentially as it spins up and down */
  function chakri(x, y, big, o) {
    o = o || {};
    var cx = x, cy = groundY(y), dur = big ? 4.6 : 3.3, R = 15 * eng.scale, ang = rand(0, 6.28), t0 = 0, hapAt = 0, stopped = false;
    var mode = o.color || colourFor(), cf = eng.colorFn(mode === 'rainbow' ? 'multi' : mode), wmax = big ? 34 : 27;
    var snd = E2M.audio.enabled ? E2M.audio.loop('chakri', { rate: 0.1 }) : null;
    var h = track({ stop: function () { stopped = true; if (snd) snd.stop(); } });
    eng.addEmitter(function (dt) {
      t0 += dt;
      var k = t0 < 0.6 ? t0 / 0.6 : (t0 > dur - 0.9 ? Math.max(0, (dur - t0) / 0.9) : 1);
      if (stopped) k = 0;
      var wv = wmax * k; ang += wv * dt;
      for (var j = 0; j < 3; j++) {
        var a = ang + j * 2.094, px = cx + Math.cos(a) * R, py = cy + Math.sin(a) * R * 0.42, n = budget(2 * k * (dt * 60) * (E2M.mobile ? 0.7 : 1), 4);
        for (var i = 0; i < n; i++) {
          // sparks leave the rim at about the rim's own speed, then curl down: a wheel of fire, not a starburst
          var sp = wv * R * rand(0.8, 1.35) + rand(30, 70), tx = -Math.sin(a), ty = Math.cos(a) * 0.42;
          eng.emit(px, py, tx * sp + rand(-15, 15), ty * sp - rand(20, 70) * k, rand(0.28, 0.6), rand(0.8, 1.5), sparkColour(mode, t0 + j * 0.3, cf), { g: 420, drag: 0.93 });
        }
      }
      if (k > 0) eng.glow(cx, cy, 22 + 26 * k, '#FFD778', 0.13 * k);
      if (snd) snd.set(0.1 + 0.85 * k);
      if (t0 - hapAt > 0.16 && k > 0.25) { hapAt = t0; if (E2M.haptic) E2M.haptic('fizz', k * 0.8); }
      if (t0 >= dur || (stopped && t0 > 0)) { if (snd) snd.stop(); untrack(h); return false; }
      return true;
    });
    if (E2M.shake) E2M.shake(2.6 + (big ? 1.2 : 0), 1400, { x: cx, y: cy, sustain: 1, f: 15, zone: 'fireworks' });
    bump(1);
    return h;
  }
  /* LADI: a string of crackers that goes off bang-bang-bang along a sagging line, left to right */
  function ladi(x, y, big, o) {
    o = o || {};
    var n = big ? 40 : 26, dir = o.dir || (x > W.innerWidth * 0.62 ? -1 : 1), gap = (o.gap || 0.055), span = Math.min(W.innerWidth * (big ? 0.82 : 0.6), n * 24 * eng.scale);
    var y0 = clamp(y, 80, launchBase() - 30), sag = 26 * eng.scale, t0 = 0, done = 0, stopped = false, fxp = [];
    for (var i = 0; i < n; i++) { var u = i / (n - 1); fxp.push({ x: x + dir * u * span, y: y0 + sag * 4 * u * (1 - u), at: i * gap + rand(-0.012, 0.016) }); }
    var h = track({ stop: function () { stopped = true; } });
    eng.addEmitter(function (dt) {
      t0 += dt;
      // the unlit part of the string: a faint red cord with paper crackers
      var ctx = eng.ctx, a = eng.isTrails() ? 0.1 : 0.55;
      if (done < n && !stopped) {
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = a; ctx.strokeStyle = '#C8162E'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(fxp[done].x, fxp[done].y);
        for (var q = done + 1; q < n; q++) ctx.lineTo(fxp[q].x, fxp[q].y);
        ctx.stroke(); ctx.fillStyle = '#E0283F';
        for (q = done; q < n; q += 2) ctx.fillRect(fxp[q].x - 1.5, fxp[q].y, 3, 7);
        ctx.globalAlpha = 1;
      }
      while (done < n && !stopped && t0 >= fxp[done].at) {
        var b = fxp[done], last = done === n - 1;
        eng.flash(b.x, b.y, '#FFF4DC', (last ? 120 : 64) * eng.scale, 0.85);
        for (var s = 0; s < (last ? 26 : 12); s++) { var aa = rand(0, 6.283), v = rand(80, 260) * eng.scale; eng.emit(b.x, b.y, Math.cos(aa) * v, Math.sin(aa) * v - 40, rand(0.18, 0.45), rand(0.8, 1.5), Math.random() < 0.7 ? '#FFF4DC' : '#FFD778', { g: 260, drag: 0.92 }); }
        for (s = 0; s < 3; s++) eng.emit(b.x, b.y, rand(-90, 90), rand(-160, -40), rand(0.6, 1), 1.2, '#E0283F', { g: 320, drag: 0.97, st: false });
        E2M.audio.play('bang', { size: last ? 0.8 : rand(0.15, 0.45), distance: 0.12, x: b.x });
        if (E2M.haptic) E2M.haptic('ladi');
        if (done % 4 === 0 && E2M.ambient) E2M.ambient.smoke(b.x, b.y, 0.32, '#FFE7A3');
        if (last) { if (E2M.impact) E2M.impact(0.55, { x: b.x, y: b.y, color: '#FFF4DC', kind: 'ladi', zone: 'fireworks', haptic: false }); if (E2M.haptic) E2M.haptic('burst', 0.5); }
        done++;
      }
      if (done >= n || stopped) { untrack(h); return false; }
      return true;
    });
    // one rattle that runs the length of the string
    if (E2M.shake) E2M.shake(2.4 + (big ? 0.6 : 0), (n * gap + 0.35) * 1000, { x: x, y: y0, sustain: n * gap, f: 17, zone: 'fireworks' });
    if (E2M.audio.enabled) E2M.audio.play('crackle', { size: 0.6, distance: 0.2, x: x });
    bump(1);
    return h;
  }
  /* BIJLI BOMB: a short sparkling fuse, then one huge bang — a capped white flash, a shockwave ring, 8px shake */
  function bijli(x, y, big, o) {
    o = o || {};
    var now = performance.now();
    if (now - lastBijli < 700) return null;
    lastBijli = now;
    var bx = x, by = clamp(y, 80, launchBase() - 30), t0 = 0, fuseT = o.fuse != null ? o.fuse : 0.38, boomed = false, stopped = false, ringR = 0;
    var h = track({ stop: function () { stopped = true; } });
    eng.addEmitter(function (dt) {
      t0 += dt;
      if (stopped) { untrack(h); return false; }
      if (!boomed) {
        for (var i = 0; i < 3; i++) eng.emit(bx + rand(-2, 2), by - 6, rand(-60, 60), rand(-140, -40), rand(0.12, 0.3), 0.9, '#FFE7A3', { g: 300, drag: 0.93 });
        eng.glow(bx, by - 6, 14, '#FFC46A', 0.35);
        if (t0 >= fuseT) { boomed = true; boom(); }
        return true;
      }
      ringR += dt * 900 * eng.scale;
      var ra = Math.max(0, 1 - ringR / (300 * eng.scale));
      if (ra > 0) {
        var ctx = eng.ctx; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35 * ra; ctx.strokeStyle = '#FFF4DC'; ctx.lineWidth = 2 + 4 * ra;
        ctx.beginPath(); ctx.ellipse(bx, by, ringR, ringR * 0.55, 0, 0, 6.283); ctx.stroke(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        return true;
      }
      untrack(h); return false;
    });
    function boom() {
      var s = (big ? 1.25 : 1) * Math.min(1.15, powerK());
      eng.flash(bx, by, '#FFFFFF', 420 * eng.scale * s, 1);
      var nn = Math.min(budget(170, 170), Math.round((E2M.mobile ? 80 : 140) * s));
      for (var i = 0; i < nn; i++) { var a = rand(0, 6.283), v = rand(160, 620) * eng.scale * s; eng.emit(bx, by, Math.cos(a) * v, Math.sin(a) * v * 0.8 - 60, rand(0.25, 0.7), rand(1, 2.2), Math.random() < 0.75 ? '#FFF4DC' : (Math.random() < 0.5 ? '#FFD778' : '#FF9F32'), { g: 200, drag: 0.93 }); }
      // a soft white flash behind the zone's text: opacity <= .16, counted against the 3-per-second budget
      var k = E2M.flashGate ? E2M.flashGate(1) : 1;
      if (flashEl && flashEl.animate && k > 0.5) flashEl.animate([{ opacity: 0.16 }, { opacity: 0 }], { duration: 320, easing: 'cubic-bezier(.2,.7,.3,1)' });
      if (E2M.screenGlow) E2M.screenGlow('#FFF4DC', 0.9, bx, by);
      E2M.audio.play('bijli', { x: bx });
      if (E2M.impact) E2M.impact(1, { x: bx, y: by, color: '#FFFFFF', kind: 'bijli', zone: 'fireworks', haptic: false });
      if (E2M.haptic) E2M.haptic('bijli', 1);
      if (E2M.ambient) { E2M.ambient.smoke(bx, by, 1.3, '#FFF4DC'); E2M.ambient.smoke(bx, by - 30, 1.1, '#FFD778'); }
      flareWindows('#FFFFFF', 1);
      var pc = skyPct(bx, by); rimLight(pc.x, '#FFF4DC', 0.9 * k, 1400);
      if (!bijliToast) { bijliToast = true; setTimeout(function () { E2M.toast('Bijli bomb. Three car alarms agree.'); }, 900); }
    }
    if (E2M.haptic) E2M.haptic('tap');
    bump(2);
    return h;
  }
  /* PHULJHADI: a sparkler at the pointer while it is held — draw with it (the trails keep the light) */
  function startSparkler(x, y) {
    stopSparkler();
    var sp = { x: x, y: y, on: true, t: 0, hapAt: 0, mode: colourFor() }, cf = eng.colorFn(sp.mode === 'rainbow' ? 'multi' : sp.mode);
    sp.snd = E2M.audio.enabled ? E2M.audio.loop('fizz', { rate: 0.6 }) : null;
    sparkler = sp;
    eng.addEmitter(function (dt) {
      sp.t += dt;
      if (!sp.on) { if (sp.snd) sp.snd.stop(); return false; }
      var n = budget((E2M.mobile ? 4 : 7) * (dt * 60), 12);
      for (var i = 0; i < n; i++) {
        var a = rand(0, 6.283), v = rand(40, 270) * eng.scale;
        eng.emit(sp.x, sp.y, Math.cos(a) * v, Math.sin(a) * v - 20, rand(0.12, 0.42), rand(0.6, 1.3), Math.random() < 0.78 ? (Math.random() < 0.6 ? '#FFFFFF' : '#FFE7A3') : (sp.mode === 'rainbow' ? hueCycle(sp.t) : cf()), { g: 170, drag: 0.9, sp: Math.random() < 0.14 ? 2 : 0 });
      }
      eng.glow(sp.x, sp.y, 16, '#FFF4DC', 0.42);
      if (sp.t - sp.hapAt > 0.22) { sp.hapAt = sp.t; if (E2M.haptic) E2M.haptic('fizz', 0.4); }
      return true;
    });
    if (E2M.shake) E2M.shake(0.9, 260, { x: x, y: y, zone: 'fireworks' });
    bump(1);
  }
  function stopSparkler() { if (sparkler) { sparkler.on = false; if (sparkler.snd) sparkler.snd.stop(); sparkler = null; } }

  /* ---------- one action of the chosen cracker, and the launch modes ---------- */
  function one(c, x, y, p, big, o) {
    o = o || {};
    if (c === 'rocket') return rocket(x, y, p, big, o);
    if (c === 'anar') return anar(x, y, big, o);
    if (c === 'chakri') return chakri(x, y, big, o);
    if (c === 'ladi') return ladi(x, y, big, o);
    if (c === 'bijli') return bijli(x, y, big, o);
    if (big) return mega(x, y, o.color);
    return shell(x, y, p, o);
  }
  function act(x, y, p, big) {
    var c = deck.cracker;
    touchUser();
    if (c === 'phuljhadi') { autoSparkler(x, y, 1.8); return; }
    if (deck.mode === 'volley' && !big) { volley(c, x, y, p); return; }
    one(c, x, y, p, big);
  }
  function volley(c, x, y, p) {
    var n = 3 + (Math.random() * 3 | 0), ground = c === 'anar' || c === 'chakri' || c === 'bijli', sp = (ground ? 95 : 110) * eng.scale, col = colourFor();
    if (c === 'ladi') n = 2;
    for (var i = 0; i < n; i++) (function (i) {
      setTimeout(function () {
        if (!active) return;
        var off = (i - (n - 1) / 2) * sp, yy = c === 'ladi' ? y - i * 46 * eng.scale : y + (ground ? 0 : rand(-40, 30));
        one(c, clamp(x + off, 20, W.innerWidth - 20), yy, p, false, { color: col, fuse: 0.3 + i * 0.05 });
      }, c === 'bijli' ? i * 760 : i * rand(110, 200));
    })(i);
    if (E2M.announce && !volley.said) { volley.said = true; E2M.announce('Volley: ' + n + ' at once.'); }
  }
  function startBarrage(d) {
    var c = deck.cracker, ms = BARRAGE_MS[c] || 250;
    function tick() {
      if (!down || down !== d) return;
      touchUser();
      var p = c === 'rocket' || c === 'shell' ? 0.25 + 0.25 * Math.random() : 0;
      one(c, d.x + rand(-24, 24), d.y + rand(-20, 20), p, false);
      barrageT = setTimeout(tick, ms * rand(0.85, 1.15));
    }
    charge.classList.add('is-on', 'is-barrage'); charge.style.transform = 'translate3d(' + d.x.toFixed(1) + 'px,' + d.y.toFixed(1) + 'px,0)';
    chLabel.textContent = 'Barrage';
    tick();
  }
  function stopBarrage() { clearTimeout(barrageT); barrageT = 0; charge.classList.remove('is-barrage'); }
  // keyboard / Enter: a sparkler that swirls by itself for a moment (a figure of eight)
  function autoSparkler(x, y, secs) {
    startSparkler(x, y);
    var sp = sparkler, t = 0, r = 70 * eng.scale, last = performance.now();
    (function step() {
      if (!sp.on || sparkler !== sp) return;
      var now = performance.now(); t += (now - last) / 1000; last = now;
      sp.x = x + Math.sin(t * 3.2) * r * 1.4; sp.y = y + Math.sin(t * 6.4) * r * 0.5;
      if (t >= secs) { stopSparkler(); return; }
      requestAnimationFrame(step);
    })();
  }

  var userActs = 0;
  function bump(n) {
    launched += n;
    if (!show && !crazy && ++userActs === 3 && guide) guide.classList.add('is-gone'); // R7: any three crackers teach it
    countEl.textContent = launched;
    var tier = 0;
    for (var i = 0; i < NOISE.length; i++) if (launched >= NOISE[i][0]) tier = i;
    noiseEl.textContent = NOISE[tier][1];
    if (tier > noiseTier) {
      noiseTier = tier;
      if (tier >= 2 && !show && !crazy) E2M.toast('Noise level: ' + NOISE[tier][1] + '. ' + pick(['Worth it.', 'Keep going.', 'No regrets.', 'Iconic.']));
      if (E2M.announce) E2M.announce(launched + ' launched. Noise level: ' + NOISE[tier][1] + '.');
    }
  }
  // a client-coord impact for overlay (full-screen) bursts during GO CRAZY
  function boom(power, fx, fy, c, kind) { if (E2M.impact) E2M.impact(power, { x: fx, y: fy, color: c || '#FFD778', kind: kind || 'crazy', zone: 'fireworks', haptic: power >= 0.9 ? 'grand' : 'burst' }); flareWindows(c || '#FFD778', power); }

  /* ---------- charging: a power ring at the pointer + a beam to the burst height ---------- */
  function aerial() { return deck.cracker === 'rocket' || deck.cracker === 'shell'; }
  function showCharge() {
    if (!down) return;
    charge.classList.add('is-on'); charge.classList.remove('is-full', 'is-grand', 'is-barrage');
    positionCharge(0);
    if (E2M.audio.enabled && E2M.audio.loop && aerial()) fuse = E2M.audio.loop('chakri', { rate: 0.06 });
  }
  function hideCharge() {
    charge.classList.remove('is-on', 'is-full', 'is-grand', 'is-barrage');
    if (chargeRaf) { cancelAnimationFrame(chargeRaf); chargeRaf = 0; }
    if (fuse) { fuse.stop(); fuse = null; }
  }
  function positionCharge(p) {
    var ty = aerial() ? targetY(down.y, p) : down.y, beam = Math.max(0, down.y - ty);
    charge.style.transform = 'translate3d(' + down.x.toFixed(1) + 'px,' + down.y.toFixed(1) + 'px,0)';
    chArc.style.setProperty('--p', p.toFixed(3));
    chBeam.style.height = beam.toFixed(0) + 'px';
    chBeam.style.opacity = p < 0.1 || !aerial() ? 0 : 0.35 + p * 0.6;
  }
  function chargeFrame() {
    chargeRaf = 0;
    if (!down) return;
    var now = performance.now(), held = now - down.t, p = Math.min(1, held / MAX_HOLD), isGrand = aerial() && held > MAX_HOLD + GRAND_AFTER;
    if (held > QUICK) {
      positionCharge(p);
      chLabel.textContent = isGrand ? 'Grand!' : (aerial() ? (p >= 1 ? 'Full' : (p > 0.55 ? 'Bigger' : 'Higher')) : (p > 0.55 ? 'Bigger' : 'Hold'));
      charge.classList.toggle('is-full', p >= 1);
      charge.classList.toggle('is-grand', isGrand);
      if (fuse) fuse.set(0.08 + p * 0.3);
      // R7: a growing pulse tick every ~120ms while charging
      if (now - lastChargeHap > 120 && E2M.haptic) { lastChargeHap = now; E2M.haptic(isGrand ? 'medium' : 'charge', p); }
      var tick = isGrand ? 4 : Math.floor(p * 3);
      if (tick > lastTick) { lastTick = tick; if (tick >= 3) E2M.audio.play('flick'); }
    }
    chargeRaf = requestAnimationFrame(chargeFrame);
  }

  /* ---------- pointer handling: the whole zone is the surface ---------- */
  function excluded(t) {
    return !!(t && t.closest && t.closest('button, a, input, select, textarea, label, output, [role="dialog"], .fw-deck, .fw-status, .w-lantern, .hidden-diya, .hud'));
  }
  function bindPointer() {
    zoneEl.addEventListener('contextmenu', function (e) { if (!excluded(e.target)) e.preventDefault(); });
    zoneEl.addEventListener('pointerdown', function (e) {
      if (e.button > 0 || crazy || down || excluded(e.target) || !eng) return;
      down = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() };
      lastTick = 0; lastChargeHap = 0;
      touchUser();
      try { zoneEl.setPointerCapture(e.pointerId); } catch (er) {}
      if (deck.cracker === 'phuljhadi') { down.kind = 'spark'; startSparkler(down.x, down.y); return; }
      if (deck.mode === 'barrage') { down.kind = 'barrage'; startBarrage(down); return; }
      showCharge();
      chargeRaf = requestAnimationFrame(chargeFrame);
    });
    zoneEl.addEventListener('pointermove', function (e) {
      if (!down || down.id !== e.pointerId) return;
      down.x = e.clientX; down.y = e.clientY;
      if (down.kind === 'spark' && sparkler) { sparkler.x = down.x; sparkler.y = down.y; }
      if (down.kind === 'barrage') charge.style.transform = 'translate3d(' + down.x.toFixed(1) + 'px,' + down.y.toFixed(1) + 'px,0)';
    });
    function up(e, cancelled) {
      if (!down || down.id !== e.pointerId) return;
      var d = down, held = performance.now() - d.t, now = performance.now();
      down = null;
      if (d.kind === 'spark') { stopSparkler(); return; }
      if (d.kind === 'barrage') { stopBarrage(); hideCharge(); return; }
      hideCharge();
      if (cancelled) return;
      touchUser();
      // R7: no generic release buzz — each cracker fires its own pattern (a rocket's rising pulses, a fizz, a bang)
      if (aerial() && held > MAX_HOLD + GRAND_AFTER) { grand(d.x, d.y); lastTap.t = 0; return; }
      var dt = now - lastTap.t, dx = d.x - lastTap.x, dy = d.y - lastTap.y;
      if (held < QUICK && dt < 380 && dx * dx + dy * dy < 3600) { one(deck.cracker, d.x, d.y, 0.6, true); lastTap.t = 0; return; }
      lastTap = held < QUICK ? { t: now, x: d.x, y: d.y } : { t: 0, x: 0, y: 0 };
      var p = held < QUICK ? 0 : Math.min(1, held / MAX_HOLD);
      act(d.x, d.y, p, !aerial() && p > 0.55);
    }
    zoneEl.addEventListener('pointerup', function (e) { up(e, false); });
    zoneEl.addEventListener('pointercancel', function (e) { up(e, true); });
    // keyboard: Enter lights one, Shift+Enter the big one, holding Space charges (or keeps firing / draws)
    var keyHold = null;
    sky.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        var r = sky.getBoundingClientRect(), x = W.innerWidth * rand(0.18, 0.82), y = Math.max(80, r.top + r.height * rand(0.2, 0.45));
        if (!aerial() && deck.cracker !== 'ladi') { var g = groundSpot(rand(0.2, 0.8)); x = g.x; y = g.y; }
        if (deck.cracker === 'ladi') x = W.innerWidth * 0.2;
        if (e.shiftKey) { touchUser(); one(deck.cracker === 'phuljhadi' ? 'shell' : deck.cracker, x, y, 0.6, true); }
        else act(x, y, rand(0.1, 0.4), false);
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        if (e.repeat || keyHold || down) return;
        var rr = sky.getBoundingClientRect();
        keyHold = { x: W.innerWidth * rand(0.3, 0.7), y: Math.min(W.innerHeight * 0.7, rr.top + rr.height * 0.62) };
        down = { id: 'key', x: keyHold.x, y: keyHold.y, t: performance.now() };
        lastTick = 0; lastChargeHap = 0; touchUser();
        if (deck.cracker === 'phuljhadi') { down.kind = 'spark'; down.y = Math.min(W.innerHeight * 0.6, rr.top + rr.height * 0.42); autoSparkler(down.x, down.y, 30); return; }
        if (deck.mode === 'barrage') { down.kind = 'barrage'; startBarrage(down); return; }
        showCharge(); chargeRaf = requestAnimationFrame(chargeFrame);
      }
    });
    sky.addEventListener('keyup', function (e) {
      if ((e.key === ' ' || e.key === 'Spacebar') && keyHold) { e.preventDefault(); keyHold = null; up({ pointerId: 'key' }, false); }
    });
    sky.addEventListener('blur', function () { if (keyHold) { keyHold = null; up({ pointerId: 'key' }, true); } });
  }

  /* ---------- a surprise in the sky while idle (the background show carries the rest) ---------- */
  function idleLoop() {
    clearTimeout(idleT);
    if (!active) return;
    if (!D.hidden && !crazy && !show && !down && live() && performance.now() - lastUser > 12000) {
      var x = eng.w * rand(0.15, 0.85), y = eng.h * rand(0.14, 0.36);
      if (Math.random() < 0.4) {
        eng.firework(x, y, { rocket: true, fromY: launchBase(), type: Math.random() < 0.7 ? 'text' : 'heart', text: 'E2M', textSize: 90, color: 'rainbow', size: 1, distance: 0.4, launchSound: 'mortar', tail: 0.8 });
        if (!surpriseToast) { surpriseToast = true; setTimeout(function () { E2M.toast('Surprise! The sky has a sense of humour.'); }, 1100); }
      }
    }
    idleT = setTimeout(idleLoop, rand(12000, 18000));
  }

  /* ---------- GO CRAZY ---------- */
  function goCrazy() {
    if (crazy || show) return;
    crazy = true; crazyAt = performance.now();
    if (E2M.haptic) E2M.haptic('grand', 0.6);
    crazyBtn.disabled = true; showBtn.disabled = true;
    crazyBtn.querySelector('span').textContent = 'Crazy in progress…';
    E2M.toast(pick(['Deploying maximum festivity…', 'Your manager has been notified. Just kidding. Mostly.', 'Hold on to your laddoos.']));
    var vw = W.innerWidth, vh = W.innerHeight, T = [];
    function at(ms, fn) { T.push(setTimeout(fn, ms)); }
    if (!live()) {
      for (var r = 0; r < 4; r++) (function (r) { at(r * 700, function () { E2M.fx.firework(vw * (0.2 + 0.2 * r), vh * 0.35, { type: 'peony', color: 'rainbow', size: 0.8 }); }); })(r);
      at(3000, finish);
    } else {
      E2M.fx.fireworkShow(6400, { intensity: 2, live: true });
      eng.show(6400, { intensity: 2, live: true });
      D.documentElement.classList.add('is-crazy');
      if (root) root.classList.add('is-crazy');
      if (E2M.ambient) E2M.ambient.boost(1.5);
      at(120, function () { boom(0.3, vw * 0.3, vh * 0.3, '#FFD778'); E2M.audio.play('thump', { power: 0.3 }); });
      at(700, function () { boom(0.4, vw * 0.7, vh * 0.28, '#FF6FD0'); });
      for (var i = 0; i < 9; i++) (function (i) {
        at(i * 150, function () {
          var fx = vw * (0.06 + 0.88 * i / 8);
          E2M.fx.firework(fx, vh * rand(0.16, 0.4), { rocket: true, fromX: fx, type: pick(['peony', 'ring', 'chrysanthemum']), color: 'rainbow', size: 1.05, sound: i % 3 === 0, distance: 0.3, launchSound: i % 2 ? 'whistle' : 'mortar', tail: 1.2 });
        });
      })(i);
      for (var k = 0; k < 4; k++) (function (k) { at(1800 + k * 170, function () { var cc = ['gold', 'pink', 'purple', 'teal'][k]; E2M.fx.firework(vw / 2, vh * 0.36, { type: 'ring', size: 0.8 + k * 0.38, color: k % 2 ? 'rainbow' : cc, sound: k === 0 }); if (k % 2 === 0) boom(0.5 + k * 0.08, vw / 2, vh * 0.36, E2M.colors[cc]); }); })(k);
      at(2900, function () { E2M.fx.firework(vw / 2, vh * 0.32, { type: 'text', text: 'E2M', size: E2M.mobile ? 1 : 1.5, color: 'rainbow' }); E2M.audio.play('boom'); boom(0.75, vw / 2, vh * 0.32, '#FFD778'); E2M.audio.play('thump', { power: 0.7 }); if (E2M.screenGlow) E2M.screenGlow('#FFD778', 0.8, vw / 2, vh * 0.32); });
      at(3900, function () {
        for (var j = 0; j < 5; j++) E2M.fx.firework(vw * (0.1 + 0.2 * j), vh * 0.2, { type: 'willow', size: 1.1, sound: j === 2, distance: 0.35 });
        E2M.fx.goldenRain(160);
        boom(0.85, vw / 2, vh * 0.2, '#FFC24A');
      });
      at(5300, function () {
        E2M.fx.firework(vw / 2, vh * 0.42, { type: 'mega', size: E2M.mobile ? 1.5 : 2.3, color: 'rainbow', distance: 0.12 });
        E2M.fx.confetti(vw / 2, vh * 0.92, 80);
        boom(1, vw / 2, vh * 0.42, '#FFF4DC', 'rumble');
        E2M.audio.play('rumble');
        if (E2M.screenGlow) E2M.screenGlow(warm(E2M.nextHue ? E2M.nextHue() : '#FF6FD0'), 1, vw / 2, vh * 0.42);
      });
      at(7300, finish);
    }
    function finish() {
      crazy = false;
      D.documentElement.classList.remove('is-crazy');
      if (root) root.classList.remove('is-crazy');
      if (E2M.ambient) E2M.ambient.boost(1);
      E2M.announce && E2M.announce('Go crazy finished. ' + launched + ' launched. Noise level: ' + noiseEl.textContent + '.');
      crazyBtn.disabled = false; showBtn.disabled = false;
      crazyBtn.querySelector('span').textContent = 'Go crazy';
      bump(40);
      E2M.toast('Okay. That was a lot. We love it.');
    }
  }

  /* ---------- the Diwali night show: 40 seconds, choreographed, stoppable ---------- */
  var SHOW_MS = 40000;
  function startShow() {
    if (show || crazy || !eng) return;
    if (!live()) { E2M.toast('The night show needs motion on. Turn off Calm or Pause in Tools.'); return; }
    show = { t0: performance.now(), T: [], tick: 0 };
    root.classList.add('is-show'); D.documentElement.classList.add('fw-show-on');
    showBtn.setAttribute('aria-pressed', 'true'); crazyBtn.disabled = true;
    if (E2M.ambient) E2M.ambient.boost(1.15);
    if (guide) guide.classList.add('is-gone');
    if (E2M.announce) E2M.announce('Diwali night show: forty seconds of rockets, volleys, anar, chakri, bijli and a ladi finale. Press Escape or Stop show to end it.', { assertive: true });
    if (!E2M.audio.enabled) E2M.toast('Night show! It is twice as good with sound on.');
    if (E2M.haptic) E2M.haptic('rocket', 0.9);
    var S = skySpot, G = groundSpot;
    function at(ms, fn) { show.T.push(setTimeout(function () { if (show && active) { try { fn(); } catch (e) {} } }, ms)); }
    // aer: one aerial shell (or, with ls 'whistle', an udan rocket) aimed at a point of the sky box
    function aer(fx, fy, o) {
      var p = S(fx, fy); o = o || {};
      eng.firework(p.x, p.y, { rocket: true, fromX: clamp(p.x + rand(-40, 40), 10, W.innerWidth - 10), fromY: launchBase(), T: o.T || rand(0.9, 1.2), launchSound: o.ls || 'mortar', tail: o.tail || 0.8, wobble: o.wobble,
        type: o.type || 'peony', text: o.text, color: o.color || 'rainbow', size: (o.size || 1) * (E2M.mobile ? 0.86 : 1), crackle: o.crackle, distance: 0.22, user: true, kind: 'show', textSize: 90 });
      bump(1);
    }
    function rk(fx, fy, col) { aer(fx, fy, { ls: 'whistle', tail: 2, wobble: 1.7, type: pick(['crossette', 'peony', 'strobe']), color: col || 'rainbow', size: 0.65, crackle: true, T: rand(0.95, 1.2) }); if (E2M.haptic) E2M.haptic('rocket', 0.6); }
    function vol(fx, n, type, col, sz) { for (var i = 0; i < n; i++) (function (i) { at0(i * 150, function () { aer(fx + (i - (n - 1) / 2) * 0.07, rand(0.2, 0.32), { type: type, color: col, size: sz || 0.8 }); }); })(i); }
    function at0(ms, fn) { show.T.push(setTimeout(function () { if (show && active) { try { fn(); } catch (e) {} } }, ms)); }
    function gnd(kind, fx, big, col) { var g = G(fx); one(kind, g.x, g.y, 0.6, !!big, { color: col || 'gold' }); }
    // I — shubh aarambh: whistling rockets, the first shells, a row of anars
    at(0, function () { rk(0.18, 0.3, 'gold'); });
    at(600, function () { rk(0.82, 0.26, 'rainbow'); });
    at(1500, function () { aer(0.5, 0.28, { type: 'peony', color: 'gold', size: 1.05 }); });
    at(2600, function () { aer(0.3, 0.24, { type: 'ring', color: 'rainbow' }); });
    at(3200, function () { gnd('anar', 0.3); gnd('anar', 0.5); gnd('anar', 0.7); });
    at(4300, function () { aer(0.7, 0.2, { type: 'willow', color: 'gold', size: 1.1 }); });
    at(5200, function () { rk(0.12, 0.26); rk(0.88, 0.24); });
    at(6200, function () { aer(0.5, 0.2, { type: 'chrysanthemum', color: 'pinkpurple', size: 1.1 }); });
    // II — volleys over spinning chakris
    at(7000, function () { vol(0.36, 4, 'peony', 'rainbow'); });
    at(8000, function () { gnd('chakri', 0.18, false, 'gold'); gnd('chakri', 0.82, false, 'rainbow'); });
    at(9000, function () { vol(0.64, 4, 'ring', 'pinkpurple'); });
    at(10000, function () { aer(0.5, 0.26, { type: 'heart', size: 1.1 }); });
    at(11000, function () { vol(0.5, 5, 'crossette', 'saffrongreen', 0.85); });
    at(12500, function () { aer(0.24, 0.24, { type: 'palm', color: 'gold' }); aer(0.76, 0.24, { type: 'palm', color: 'gold' }); });
    at(14000, function () { aer(0.5, 0.24, { type: 'text', text: 'E2M', color: 'rainbow', size: 1.1 }); });
    // III — the rainbow fan, palms and strobes, the first bijli
    for (var f = 0; f < 7; f++) (function (f) { at(15000 + f * 170, function () { aer(0.1 + f * 0.133, 0.22 + Math.abs(f - 3) * 0.03, { type: 'peony', color: 'rainbow', size: 0.95 }); }); })(f);
    at(17200, function () { aer(0.2, 0.2, { type: 'palm', color: 'saffrongreen' }); aer(0.8, 0.2, { type: 'palm', color: 'saffrongreen' }); });
    at(18500, function () { aer(0.5, 0.2, { type: 'strobe', color: 'gold' }); rk(0.15, 0.3); rk(0.85, 0.3); });
    at(19500, function () { vol(0.3, 4, 'peony', 'gold'); vol(0.7, 4, 'ring', 'rainbow'); });
    at(21000, function () { vol(0.3, 4, 'chrysanthemum', 'pinkpurple'); vol(0.7, 4, 'willow', 'gold'); });
    at(22500, function () { aer(0.5, 0.18, { type: 'chrysanthemum', color: 'rainbow', size: 1.35 }); });
    at(23600, function () { gnd('bijli', 0.5); });
    // IV — barrage: escalating, alternating sides, anars and chakris on the ground
    at(24000, function () { if (E2M.ambient) E2M.ambient.boost(1.45); });
    for (var b = 0; b < 22; b++) (function (b) {
      at(24200 + b * 330 + rand(-40, 40), function () { var side = b % 2 ? rand(0.12, 0.42) : rand(0.58, 0.88); aer(side, rand(0.16, 0.34), { type: pick(['peony', 'ring', 'crossette', 'palm', 'chrysanthemum', 'strobe']), color: pick(['rainbow', 'gold', 'pinkpurple', 'multi']), size: 0.7 + 0.5 * b / 21, ls: b % 3 ? 'mortar' : 'whistle', tail: b % 3 ? 0.8 : 1.6 }); });
    })(b);
    at(26000, function () { [0.2, 0.4, 0.6, 0.8].forEach(function (x) { gnd('anar', x, false, 'rainbow'); }); });
    at(27200, function () { [0.28, 0.5, 0.72].forEach(function (x) { gnd('chakri', x, false, 'gold'); }); });
    at(29300, function () { gnd('bijli', 0.3); });
    at(30600, function () { gnd('bijli', 0.7); });
    // V — the ladi finale: strings of bangs running both ways, rockets whistling over them
    at(32000, function () { var g = G(0.1); ladi(g.x, g.y - 30, true, { dir: 1, gap: 0.05 }); });
    at(34300, function () { var g = G(0.9); ladi(g.x, g.y - 90, true, { dir: -1, gap: 0.05 }); });
    for (var r = 0; r < 6; r++) (function (r) { at(35000 + r * 230, function () { rk(0.1 + r * 0.16, 0.24); }); })(r);
    at(36600, function () { gnd('bijli', 0.5, true); });
    // VI — grand finale: three mega shells, golden willow rain, the E2M, one long rumble
    at(37200, function () { var p = S(0.5, 0.26); mega(p.x, p.y, 'rainbow'); });
    at(37800, function () { var p = S(0.25, 0.22); mega(p.x, p.y, 'gold'); });
    at(38300, function () { var p = S(0.75, 0.22); mega(p.x, p.y, 'pinkpurple'); });
    at(38800, function () { for (var j = 0; j < 5; j++) aer(0.1 + j * 0.2, 0.16, { type: 'willow', color: 'gold', size: 1.15 }); if (eng) eng.goldenRain(E2M.mobile ? 60 : 140); });
    at(39300, function () { aer(0.5, 0.22, { type: 'text', text: 'E2M', color: 'gold', size: 1.2 }); });
    at(39600, function () { var c = skySpot(0.5, 0.3); if (E2M.impact) E2M.impact(1, { x: c.x, y: c.y, color: '#FFD778', kind: 'rumble', zone: 'fireworks', haptic: 'grand' }); E2M.audio.play('rumble'); if (E2M.screenGlow) E2M.screenGlow('#FFD778', 1, c.x, c.y); });
    show.T.push(setTimeout(function () { endShow(true); }, SHOW_MS + 1600));
    showTick();
  }
  function showTick() {
    if (!show) return;
    var el = performance.now() - show.t0, k = clamp(el / SHOW_MS, 0, 1), left = Math.max(0, Math.ceil((SHOW_MS - el) / 1000));
    showBar.style.width = (k * 100).toFixed(1) + '%';
    showBtn.querySelector('span').textContent = 'Stop show · 0:' + (left < 10 ? '0' : '') + left;
    showBtn.setAttribute('aria-label', 'Stop the Diwali night show (' + left + ' seconds left)');
    if (E2M.ambient && E2M.ambient.touch) E2M.ambient.touch(); // the background's nudges defer to the show's own thumps
    show.tick = setTimeout(showTick, 250);
  }
  function endShow(finished) {
    if (!show) return;
    show.T.forEach(clearTimeout); clearTimeout(show.tick);
    show = null;
    stopPieces();
    root.classList.remove('is-show'); D.documentElement.classList.remove('fw-show-on');
    showBtn.setAttribute('aria-pressed', 'false'); showBtn.removeAttribute('aria-label');
    showBtn.querySelector('span').textContent = 'Diwali night show';
    showBar.style.width = '0';
    crazyBtn.disabled = false;
    if (E2M.ambient) E2M.ambient.boost(1);
    if (finished) { bump(10); E2M.toast('That was the Diwali night show. Shubh Deepavali! Encore?'); if (E2M.announce) E2M.announce('The night show is over.'); }
    else if (E2M.announce) E2M.announce('Night show stopped.');
  }

  /* ---------- the background crackers rim-light the temple town too ---------- */
  function onAmbient(d) {
    if (!active || !d || d.kind === 'far' || !sky) return;
    var pc = skyPct(d.x, d.y), k = E2M.flashGate ? E2M.flashGate(d.near ? 0.3 : 0) : 1;
    flareWindows(d.color, d.near ? 0.32 : 0.16);
    rimLight(pc.x, d.color, (d.near ? 0.5 : 0.28) * k, 900);
  }

  /* ---------- the one-time reduced-motion chip ---------- */
  var RM_KEY = 'e2m-diwali:fw-rm-chip', rmT = 0;
  function maybeRmChip() {
    if (!rmChip || !(E2M.osReducedOnly && E2M.osReducedOnly()) || !live()) return;
    var seen = null; try { seen = W.localStorage.getItem(RM_KEY); } catch (e) {}
    if (seen) return;
    try { W.localStorage.setItem(RM_KEY, '1'); } catch (e) {}
    rmChip.hidden = false; syncStatus();
    if (E2M.announce) E2M.announce('Reduced motion detected. The fireworks background is on for this section. A Turn off button is at the top of the sky.');
    rmT = setTimeout(function () { rmChip.hidden = true; syncStatus(); }, 16000);
  }

  /* ---------- deck controls ---------- */
  function choose(attr, val, btn) {
    setRadio(attr, val);
    if (attr === 'cracker') {
      deck.cracker = val;
      if (E2M.announce) E2M.announce(CK[val].label + ' selected. ' + plain(CK[val].hint));
    } else if (attr === 'mode') { deck.mode = val; if (E2M.announce) E2M.announce('Launch: ' + labelOf(MODES, val)); }
    else if (attr === 'shape') {
      deck.shape = val;
      if (deck.cracker !== 'shell') { deck.cracker = 'shell'; setRadio('cracker', 'shell'); }
      if (E2M.announce) E2M.announce(labelOf(SHAPES, val) + ' aerial shells.');
    } else if (attr === 'colour') { deck.colour = val; if (E2M.announce) E2M.announce('Colour: ' + labelOf(COLOURS, val)); }
    else if (attr === 'wind') { deck.wind = val; applyFeel(); if (E2M.announce) E2M.announce('Wind: ' + labelOf(WINDS, val)); }
    else if (attr === 'echo') {
      deck.echo = val; applyFeel();
      if (E2M.announce) E2M.announce('Echo: ' + labelOf(ECHOES, val));
      if (E2M.audio.enabled) { var p = skySpot(0.5, 0.3); demo(p); }
    }
    saveDeck(); syncLegend();
    if (E2M.haptic) E2M.haptic('select');
    E2M.audio.play('pop');
    // a little preview in the sky for the visual choices
    if ((attr === 'shape' || attr === 'colour' || attr === 'cracker') && sky) {
      var r = sky.getBoundingClientRect();
      if (r.bottom > 0 && r.top < W.innerHeight && deck.cracker !== 'phuljhadi') {
        var x = W.innerWidth * rand(0.3, 0.7);
        if (aerial()) eng.firework(x, targetY(r.top + r.height * 0.4, 0.2), { rocket: true, fromY: launchBase(), type: deck.shape === 'surprise' ? 'peony' : (deck.shape === 'text' ? 'text' : deck.shape), text: 'E2M', textSize: 80, color: colourFor(), size: 0.72, distance: 0.35, launchSound: deck.cracker === 'rocket' ? 'whistle' : 'mortar', tail: deck.cracker === 'rocket' ? 1.8 : 0.8 });
      }
    }
  }
  function demo(p) { eng.firework(p.x, p.y, { rocket: true, fromY: launchBase(), type: 'peony', color: colourFor(), size: 0.85, distance: 0.25, launchSound: 'mortar', tail: 0.8, user: true }); }
  function soundOn() {
    if (!E2M.audio.enabled) E2M.audio.toggle(true);
    if (E2M.audio.echo) E2M.audio.echo(deck.echo);
    if (E2M.haptic) E2M.haptic('tap');
    if (E2M.audio.enabled) {
      if (E2M.announce) E2M.announce('Sound on. Echo: ' + labelOf(ECHOES, deck.echo) + '.');
      var r = sky.getBoundingClientRect();
      if (r.bottom > 80 && r.top < W.innerHeight) setTimeout(function () { demo(skySpot(rand(0.35, 0.65), 0.28)); }, 260);
    }
  }
  function bindDeck() {
    root.addEventListener('click', function (e) {
      var t = e.target, b;
      if ((b = t.closest('[role="radio"]')) && root.contains(b)) {
        var attrs = ['cracker', 'mode', 'shape', 'colour', 'wind', 'echo'];
        for (var i = 0; i < attrs.length; i++) if (b.hasAttribute('data-' + attrs[i])) { choose(attrs[i], b.getAttribute('data-' + attrs[i]), b); return; }
      }
      if (t.closest('.fw-sound-on')) { soundOn(); return; }
      if (t.closest('.fw-switch')) {
        deck.trails = !deck.trails; applyFeel(); saveDeck();
        if (E2M.haptic) E2M.haptic('select');
        if (E2M.announce) E2M.announce('Trails ' + (deck.trails ? 'on' : 'off'));
        return;
      }
      if (t.closest('.fw-more')) { setTray(tray.hidden); if (!tray.hidden) { var f = tray.querySelector('[role="radio"][tabindex="0"]'); if (f) f.focus(); } if (E2M.haptic) E2M.haptic('tap'); return; }
      if (t.closest('.fw-tray-done')) { setTray(false); moreBtn.focus(); return; }
      if (t.closest('.fw-reset')) {
        deck = { cracker: 'shell', shape: 'peony', colour: 'rainbow', power: 60, wind: '0', trails: true, mode: 'single', echo: 'hall' };
        ['cracker', 'shape', 'colour', 'mode', 'wind', 'echo'].forEach(function (a) { setRadio(a, deck[a]); });
        applyFeel(); saveDeck(); syncLegend();
        if (E2M.announce) E2M.announce('Deck reset: aerial shell, peony, rainbow, single, power 60 percent, no wind, trails on, big hall echo.');
        return;
      }
      if (t.closest('.fw-show')) { if (show) endShow(false); else startShow(); return; }
      if (t.closest('.fw-crazy')) { goCrazy(); return; }
      if (t.closest('.fw-hap')) {
        if (!E2M.hapticsSupported) { E2M.toast('Haptics need a phone that can vibrate (Android Chrome works; iPhone Safari has no vibration).'); if (E2M.announce) E2M.announce('Haptics are not supported on this device.'); return; }
        E2M.setPref('haptics', !E2M.prefs.haptics);
        if (E2M.prefs.haptics && E2M.haptic) E2M.haptic('burst', 0.6);
        if (E2M.announce) E2M.announce('Haptics ' + (E2M.prefs.haptics ? 'on' : 'off'));
        return;
      }
      if (t.closest('.fw-rm-off')) {
        clearTimeout(rmT);
        E2M.setPrefs({ motion: 'calm', motionExplicit: true });
        rmChip.querySelector('.fw-rm-l').textContent = 'Fireworks background off. Change it any time in Tools.';
        rmChip.querySelector('.fw-rm-off').hidden = true;
        if (E2M.announce) E2M.announce('Fireworks background turned off. Change it any time in Tools.');
        rmT = setTimeout(function () { rmChip.hidden = true; syncStatus(); }, 5000);
        return;
      }
      if (t.closest('.fw-rm-x')) { clearTimeout(rmT); rmChip.hidden = true; syncStatus(); if (sky) sky.focus({ preventScroll: true }); return; }
    });
    powerIn.addEventListener('input', function () { deck.power = clamp(Number(powerIn.value) || 60, 20, 100); powerOut.textContent = deck.power + '%'; powerIn.setAttribute('aria-valuetext', deck.power + ' percent'); });
    powerIn.addEventListener('change', function () { saveDeck(); syncLegend(); if (E2M.haptic) E2M.haptic('select'); });
    // radiogroups: roving tabindex + arrow keys (Home / End too); Esc closes the tray
    root.addEventListener('keydown', function (e) {
      var r = e.target.closest && e.target.closest('[role="radio"]');
      if (r && /^(ArrowLeft|ArrowRight|ArrowUp|ArrowDown|Home|End)$/.test(e.key)) {
        e.preventDefault();
        var g = Array.prototype.slice.call(r.parentNode.querySelectorAll('[role="radio"]')), k = g.indexOf(r);
        if (e.key === 'Home') k = 0; else if (e.key === 'End') k = g.length - 1;
        else k = (k + (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1) + g.length) % g.length;
        g[k].focus(); g[k].click();
        return;
      }
      if (e.key === 'Escape' && !tray.hidden) { e.stopPropagation(); setTray(false); moreBtn.focus(); }
    });
    D.addEventListener('keydown', function (e) { if (e.key === 'Escape' && show) { e.preventDefault(); endShow(false); if (showBtn) showBtn.focus({ preventScroll: true }); } });
  }

  /* read-only status (and the night show's start/stop) for other code and for tests */
  E2M.fireworks = {
    status: function () { return { particles: eng ? eng.count() : 0, pieces: pieces.length, launched: launched, show: !!show, crazy: crazy, deck: JSON.parse(JSON.stringify(deck)) }; },
    startShow: function () { startShow(); }, stopShow: function () { endShow(false); }
  };

  /* ---------- lifecycle ---------- */
  function resize() { if (eng) eng.resize(); renderSkyline(); }
  function syncLive() {
    if (!eng) return;
    eng.cap = engCap(); eng.setQuality(engQ());
    if (!live() && show) endShow(false);
  }
  E2M.register('fireworks', {
    mount: function (stage) {
      build(stage);
      renderSkyline(true);
      var dmax = 1.5;
      layer = E2M.screenLayer('fireworks', { dprMax: dmax });
      layer.canvas.setAttribute('data-impact-depth', '.8'); // R7: the zone's own sky shakes with its town
      eng = E2M.fx.engine(layer.canvas, { trails: deck.trails, fade: 0.17, fullscreen: true, dprMax: dmax, cap: engCap(), q: engQ(), onBurst: onBurst });
      eng.isTrails = eng.isTrails || function () { return deck.trails; };
      eng.glow = eng.glow || function () {};
      eng.pause();
      applyFeel(); syncLegend(); syncSound(); syncHap();
      bindPointer(); bindDeck();
      E2M.on('prefs:change', function (d) { syncLive(); syncHap(); });
      E2M.on('sound:toggle', syncSound);
      E2M.on('haptic', function () { if (!hapBtn) return; hapBtn.classList.remove('is-buzz'); void hapBtn.offsetWidth; hapBtn.classList.add('is-buzz'); });
      E2M.on('ambient:burst', onAmbient);
      var rt = 0;
      W.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 150); });
      D.addEventListener('visibilitychange', function () {
        if (D.hidden) { eng.pause(); down = null; hideCharge(); stopBarrage(); stopSparkler(); if (show) endShow(false); stopPieces(); }
        else if (active) eng.resume();
      });
    },
    onEnter: function () {
      active = true;
      resize();
      eng.resume();
      lastUser = performance.now() - 2500;
      idleLoop();
      maybeRmChip();
    },
    onLeave: function () {
      active = false;
      clearTimeout(idleT);
      down = null; hideCharge(); stopBarrage(); stopSparkler();
      if (show) endShow(false);
      stopPieces();
      eng.pause();
    }
  });
})();
