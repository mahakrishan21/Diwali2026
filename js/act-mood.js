/* ==========================================================================
   E2M Diwali Playground — Activity 09: Diwali Mood Oracle
   A rotating mandala with eight emblems. The centre medallion spins it to a
   result; a silk scroll unfurls with the mood, a description and fake stats.
   DOWNLOAD MY CARD draws the result to a 1080x1350 PNG with the Canvas API
   (no libraries). SHARE uses Web Share, falling back to the clipboard.
   Mounts into [data-mount="mood"] through E2M.register.
   ========================================================================== */
(function () {
  'use strict';

  var KEY = 'mood';
  var TAU = Math.PI * 2;

  /* ---------- emblems (flat fills, no ids, viewBox 0 0 120 120) ---------- */
  function rays(cx, cy, n, r0, r1, a0, a1, col, w) {
    var s = '';
    for (var i = 0; i < n; i++) {
      var a = (a0 + (a1 - a0) * (n === 1 ? 0.5 : i / (n - 1))) * Math.PI / 180;
      s += '<path d="M' + (cx + Math.cos(a) * r0).toFixed(1) + ' ' + (cy + Math.sin(a) * r0).toFixed(1) + ' L' + (cx + Math.cos(a) * r1).toFixed(1) + ' ' + (cy + Math.sin(a) * r1).toFixed(1) + '" stroke="' + (Array.isArray(col) ? col[i % col.length] : col) + '" stroke-width="' + w + '" stroke-linecap="round"/>';
    }
    return s;
  }
  function ring(cx, cy, n, r, rad, col) {
    var s = '';
    for (var i = 0; i < n; i++) { var a = i / n * TAU; s += '<circle cx="' + (cx + Math.cos(a) * r).toFixed(1) + '" cy="' + (cy + Math.sin(a) * r).toFixed(1) + '" r="' + rad + '" fill="' + (Array.isArray(col) ? col[i % col.length] : col) + '"/>'; }
    return s;
  }
  function petals(cx, cy, n, r, len, wid, fill, stroke, off) {
    var s = '';
    for (var i = 0; i < n; i++) {
      var deg = i * 360 / n + (off || 0);
      s += '<path transform="rotate(' + deg.toFixed(1) + ' ' + cx + ' ' + cy + ')" d="M' + cx + ' ' + (cy - r) + ' C' + (cx + wid) + ' ' + (cy - r - len * 0.35) + ' ' + (cx + wid * 0.6) + ' ' + (cy - r - len * 0.8) + ' ' + cx + ' ' + (cy - r - len) + ' C' + (cx - wid * 0.6) + ' ' + (cy - r - len * 0.8) + ' ' + (cx - wid) + ' ' + (cy - r - len * 0.35) + ' ' + cx + ' ' + (cy - r) + 'Z" fill="' + fill + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="1.2"' : '') + '/>';
    }
    return s;
  }

  var EMBLEM = {
    crackers:
      '<g stroke-linecap="round">' + rays(60, 50, 7, 8, 40, -160, -20, ['#FFD778', '#FFF4DC', '#FF9F32'], 3) + '</g>' +
      ring(60, 50, 7, 44, 2.6, ['#FFF4DC', '#DB59C8', '#FFD778']) +
      '<path d="M42 104 L51 58 H69 L78 104Z" fill="#DB59C8"/><path d="M45 88 H75 M48 73 H72" stroke="#FFD778" stroke-width="4"/>' +
      '<path d="M53 58 Q60 50 67 58Z" fill="#FF9F32"/><rect x="36" y="102" width="48" height="8" rx="2" fill="#FFD778"/>' +
      '<g transform="rotate(24 96 78)"><rect x="92" y="62" width="9" height="26" fill="#FF9F32"/><path d="M92 62 L96.5 52 L101 62Z" fill="#FFD778"/><path d="M96.5 88 V108" stroke="#C98A4A" stroke-width="2"/></g>',
    sweets:
      [[34, 92], [60, 92], [86, 92], [47, 68], [73, 68]].map(function (p) {
        return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="14" fill="#F08A24"/><circle cx="' + (p[0] - 4) + '" cy="' + (p[1] - 5) + '" r="4" fill="#FFF4DC" opacity=".45"/>' + ring(p[0] + 1, p[1] + 2, 5, 7, 1.3, '#B84A16');
      }).join('') +
      '<path d="M60 30 A14 14 0 1 0 73.5 40.4 A4.4 4.4 0 0 1 69.4 35.6 A4.4 4.4 0 0 1 65.8 31.2 A4.4 4.4 0 0 1 60 30Z" fill="#FF9F32"/>' +
      '<circle cx="55" cy="38" r="3.4" fill="#FFF4DC" opacity=".5"/>' +
      '<circle cx="82" cy="30" r="2" fill="#FF9F32"/><circle cx="88" cy="38" r="1.6" fill="#FF9F32"/><circle cx="90" cy="26" r="1.3" fill="#FFD778"/>' +
      '<rect x="20" y="106" width="80" height="5" rx="2.5" fill="#FFD778"/>',
    lighter:
      '<path d="M18 78 C22 100 40 110 60 110 C80 110 98 100 102 78Z" fill="#C2561F"/>' +
      '<path d="M30 96 Q60 108 90 96" stroke="#FFF4DC" stroke-width="3" stroke-dasharray=".1 8" stroke-linecap="round" fill="none"/>' +
      '<ellipse cx="60" cy="78" rx="42" ry="9" fill="#8E3414" stroke="#FFD778" stroke-width="2"/>' +
      '<path d="M60 26 C70 42 76 56 71 66 C68 72 64 74 60 74 C56 74 52 72 49 66 C44 56 50 42 60 26Z" fill="#FF9F32"/>' +
      '<path d="M60 44 C65 53 68 60 65 66 C64 69 62 70 60 70 C58 70 56 69 55 66 C52 60 55 53 60 44Z" fill="#FFF4DC"/>' +
      '<path d="M104 18 L80 50" stroke="#E3D0A6" stroke-width="5" stroke-linecap="round"/><circle cx="80" cy="50" r="5" fill="#E0301E"/>' +
      '<circle cx="22" cy="26" r="13" fill="#FFD778"/><path d="M22 17 l2.6 5.4 5.9 .8 -4.3 4.1 1 5.8 -5.2 -2.8 -5.2 2.8 1 -5.8 -4.3 -4.1 5.9 -.8Z" fill="#241044"/>',
    rangoli:
      '<circle cx="56" cy="56" r="44" fill="none" stroke="#FFD778" stroke-width="1.4" stroke-dasharray="2 4"/>' +
      petals(56, 56, 8, 12, 26, 10, '#DB59C8', '#FFD778', 0) +
      petals(56, 56, 8, 10, 16, 7, '#FF9F32', null, 22.5) +
      '<circle cx="56" cy="56" r="10" fill="#FFD778"/><circle cx="56" cy="56" r="4" fill="#241044"/>' +
      ring(56, 56, 8, 42, 2.4, '#FFF4DC') +
      '<g transform="rotate(-38 92 96)"><rect x="62" y="90" width="60" height="13" fill="#FFD778"/><path d="M68 90 V96 M74 90 V94 M80 90 V96 M86 90 V94 M92 90 V96 M98 90 V94 M104 90 V96 M110 90 V94 M116 90 V96" stroke="#241044" stroke-width="1.4"/></g>',
    spectator:
      '<g stroke-linecap="round">' + rays(60, 32, 12, 5, 22, 0, 330, ['#DB59C8', '#FFD778'], 2.6) + '</g>' +
      ring(60, 32, 12, 26, 2.2, ['#FFF4DC', '#FF9F32']) +
      '<path d="M50 54 C46 62 54 64 50 72 M62 52 C58 60 66 62 62 70" stroke="#FFF4DC" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/>' +
      '<path d="M36 78 L44 110 H76 L84 78Z" fill="#B8461F"/><ellipse cx="60" cy="78" rx="24" ry="6" fill="#7A2A10"/><ellipse cx="60" cy="78" rx="19" ry="4" fill="#C98A4A"/>' +
      '<path d="M40 92 H80" stroke="#FFD778" stroke-width="2" opacity=".7"/>',
    holidays:
      '<rect x="22" y="36" width="66" height="70" rx="3" fill="#FFF4DC"/><rect x="22" y="36" width="66" height="16" rx="3" fill="#DB59C8"/>' +
      '<circle cx="36" cy="36" r="3" fill="#241044"/><circle cx="74" cy="36" r="3" fill="#241044"/>' +
      '<text x="55" y="88" text-anchor="middle" font-family="Mukta, Arial, sans-serif" font-size="25" font-weight="500" fill="#E8641A">OFF</text>' +
      '<path d="M30 96 H80" stroke="#241044" stroke-width="1.4" opacity=".3"/>' +
      '<path d="M104 14 A16 16 0 1 0 104 46 A12 12 0 1 1 104 14Z" fill="#FFD778"/>' +
      '<text x="88" y="70" font-family="Georgia, serif" font-style="italic" font-size="13" font-weight="700" fill="#FFF4DC">z</text><text x="96" y="60" font-family="Georgia, serif" font-style="italic" font-size="16" font-weight="700" fill="#FFF4DC">z</text>',
    shopper:
      '<path d="M44 44 C44 24 76 24 76 44" stroke="#FFD778" stroke-width="5" fill="none"/>' +
      '<path d="M28 44 H92 L98 110 H22Z" fill="#DB59C8"/><path d="M28 44 H92 L93 54 H27Z" fill="#B23FA3"/>' +
      '<circle cx="60" cy="80" r="19" fill="#FFF4DC" stroke="#241044" stroke-width="3"/>' +
      '<path d="M60 80 L57.5 68 M60 80 L59.2 64.5" stroke="#241044" stroke-width="3" stroke-linecap="round"/><circle cx="60" cy="80" r="2.4" fill="#E0301E"/>' +
      '<path d="M4 64 H18 M8 76 H18 M2 88 H16" stroke="#FFD778" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M100 30 C104 36 105 40 102 43 C99 45 96 42 97 39 C98 36 99 33 100 30Z" fill="#3FD0C9"/>',
    champion:
      '<path d="M6 16 Q60 38 114 16" stroke="#FFD778" stroke-width="1.6" fill="none"/>' +
      [[18, '#DB59C8'], [38, '#FF9F32'], [60, '#FFD778'], [82, '#FF9F32'], [102, '#DB59C8']].map(function (f) {
        var y = 16 + 22 * (1 - Math.pow((f[0] - 60) / 54, 2));
        return '<path d="M' + (f[0] - 7) + ' ' + (y - 1).toFixed(1) + ' L' + (f[0] + 7) + ' ' + (y - 1).toFixed(1) + ' L' + f[0] + ' ' + (y + 13).toFixed(1) + 'Z" fill="' + f[1] + '"/>';
      }).join('') +
      '<path d="M38 50 C24 50 24 70 42 72 M82 50 C96 50 96 70 78 72" stroke="#FFD778" stroke-width="5" fill="none"/>' +
      '<path d="M36 46 H84 V58 C84 76 73 86 60 86 C47 86 36 76 36 58Z" fill="#FFD778"/>' +
      '<path d="M60 52 l3.4 7 7.6 1.1 -5.5 5.3 1.3 7.6 -6.8 -3.6 -6.8 3.6 1.3 -7.6 -5.5 -5.3 7.6 -1.1Z" fill="#FFF4DC"/>' +
      '<rect x="55" y="86" width="10" height="10" fill="#E0A93E"/><rect x="42" y="96" width="36" height="8" fill="#E0A93E"/><rect x="36" y="104" width="48" height="8" rx="1" fill="#DB59C8"/>'
  };

  var RESULTS = [
    { id: 'crackers', emblem: 'crackers', title: 'The Firecracker Addict',
      desc: 'You don’t attend Diwali, you headline it. Your lighter has a name, your neighbours own earplugs and the street dog has filed a formal complaint.',
      short: 'My lighter has a name.',
      stats: [['Decibel tolerance', 98], ['Eyebrows intact', 41], ['Times said “just one more”', 100]] },
    { id: 'sweets', emblem: 'sweets', title: 'The Sweet Destroyer',
      desc: 'You say “just one piece” with the confidence of someone who has never had just one piece. Kaju katli fears you. The dabba is empty and we all know why.',
      short: 'The dabba is empty and we all know why.',
      stats: [['Laddoos per hour', 96], ['Willingness to share', 7], ['Sugar in bloodstream', 100]] },
    { id: 'lighter', emblem: 'lighter', title: 'The Professional Diya Lighter',
      desc: 'One matchstick, forty-two diyas, zero wind casualties. Relatives book you in advance. The breeze respects you. You have opinions about wick length.',
      short: 'Forty-two diyas, one matchstick.',
      stats: [['Diyas lit', 100], ['Burnt fingertips', 38], ['Wick precision', 94]] },
    { id: 'rangoli', emblem: 'rangoli', title: 'The Rangoli Perfectionist',
      desc: 'Six hours, one protractor and a small breakdown later, every petal is exactly 22.5 degrees apart. Please do not walk near it. Please do not breathe near it.',
      short: 'Every petal, exactly 22.5 degrees apart.',
      stats: [['Symmetry obsession', 100], ['Colour on your clothes', 87], ['Chance you redo it', 93]] },
    { id: 'spectator', emblem: 'spectator', title: 'The Fireworks Spectator',
      desc: 'Best seat on the terrace, chai in hand, a perfectly timed “ooooh”. You enjoy every single firework from a safe, warm, blanket-wrapped distance.',
      short: 'Best seat on the terrace, chai in hand.',
      stats: [['Ooohs per minute', 92], ['Distance from crackers', 100], ['Chai refills', 78]] },
    { id: 'holidays', emblem: 'holidays', title: 'The Person Who Just Wants Holidays',
      desc: 'Your out-of-office went live in September. You love the lights, the sweets and the family, but mostly you love not opening your laptop.',
      short: 'Out-of-office since September.',
      stats: [['Nap quality', 97], ['Laptop openings', 2], ['Out-of-office strength', 100]] },
    { id: 'shopper', emblem: 'shopper', title: 'The Last-Minute Gift Shopper',
      desc: 'It is 9:47 PM on Diwali eve and you are negotiating for the last box of dry fruits like it is a hostage situation. Somehow, it always works out.',
      short: 'Negotiating for the last box of dry fruits.',
      stats: [['Panic level', 94], ['Shops visited', 81], ['Wrapping quality', 12]] },
    { id: 'champion', emblem: 'champion', title: 'The Office Celebration Champion',
      desc: 'You booked the venue, built the playlist, ran the potluck spreadsheet and still won best dressed. HR would like to clone you. Legal says no.',
      short: 'Booked the venue, built the playlist, won best dressed.',
      stats: [['Potluck dishes organised', 99], ['Decor budget exceeded', 88], ['Group photos clicked', 100]] }
  ];

  function emblemSVG(key, cls) {
    return '<svg class="' + (cls || '') + '" viewBox="0 0 120 120" aria-hidden="true" focusable="false">' + EMBLEM[key] + '</svg>';
  }

  function mandalaSVG() {
    function pt(r, deg) { var a = deg * Math.PI / 180; return (r * Math.sin(a)).toFixed(1) + ' ' + (-r * Math.cos(a)).toFixed(1); }
    var s = '', i;
    // outer petal crown
    for (i = 0; i < 24; i++) s += '<path transform="rotate(' + (i * 15) + ')" d="M0 -226 C4 -231 4 -238 0 -243 C-4 -238 -4 -231 0 -226Z" fill="#FFD778" opacity="' + (i % 2 ? .22 : .5) + '"/>';
    s += '<circle r="224" fill="none" stroke="#FFD778" stroke-width="1" opacity=".55"/>';
    // eight segments
    for (i = 0; i < 8; i++) {
      var a0 = i * 45 - 22.5, a1 = i * 45 + 22.5;
      s += '<path class="md-seg" data-i="' + i + '" d="M' + pt(210, a0) + ' A210 210 0 0 1 ' + pt(210, a1) + ' L' + pt(132, a1) + ' A132 132 0 0 0 ' + pt(132, a0) + 'Z"/>';
      s += '<path d="M' + pt(132, a0) + ' L' + pt(210, a0) + '" stroke="#FFD778" stroke-width="1" opacity=".32"/>';
      s += '<g transform="rotate(' + (i * 45) + ') translate(0 -171) scale(.5) translate(-60 -60)">' + EMBLEM[RESULTS[i].emblem] + '</g>';
    }
    s += '<circle r="132" fill="none" stroke="#FFD778" stroke-width="1" opacity=".6"/>';
    // lotus ring: hairline petals only
    for (i = 0; i < 16; i++) s += '<path transform="rotate(' + (i * 22.5 + 11.25) + ')" d="M0 -96 C12 -104 12 -118 0 -128 C-12 -118 -12 -104 0 -96Z" fill="none" stroke="#FFD778" stroke-width=".8" opacity=".42"/>';
    s += '<circle r="94" fill="none" stroke="#FFD778" stroke-width=".8" opacity=".4"/>';
    s += '<circle r="74" fill="#080B1E" stroke="#FFD778" stroke-width="1" opacity=".9"/>';
    // Revision 3: motes of light orbit the oracle on two counter-turning rings (CSS, gated by Calm/Pause)
    var orbit = function (n, r, off, cls) {
      var o = '<g class="md-orbit ' + cls + '">';
      for (var k = 0; k < n; k++) {
        var a = (k / n + off) * TAU, x = (Math.cos(a) * r).toFixed(1), y = (Math.sin(a) * r).toFixed(1);
        o += '<circle class="md-mote-halo" cx="' + x + '" cy="' + y + '" r="6.5"/><circle class="md-mote" cx="' + x + '" cy="' + y + '" r="' + (k % 2 ? 1.6 : 2.2) + '"/>';
      }
      return o + '</g>';
    };
    return '' +
      '<svg class="md-mandala" viewBox="-250 -250 500 500" aria-hidden="true" focusable="false">' +
        orbit(7, 236, 0.03, 'md-orbit--a') + orbit(5, 248, 0.11, 'md-orbit--b') +
        '<g class="md-rot">' + s + '</g>' +
        '<path class="md-focus" d="M' + pt(212, -22.5) + ' A212 212 0 0 1 ' + pt(212, 22.5) + ' L' + pt(130, 22.5) + ' A130 130 0 0 0 ' + pt(130, -22.5) + 'Z"/>' +
        '<g class="md-pointer"><path d="M0 -208 C-8 -220 -10 -234 0 -248 C10 -234 8 -220 0 -208Z" fill="#FF9F32"/><path d="M0 -216 C-4 -224 -5 -232 0 -240 C5 -232 4 -224 0 -216Z" fill="#FFF4DC"/></g>' +
      '</svg>';
  }

  /* Revision 5 (b): no full-screen layer for this zone. The revealed mood stays ONLY inside the oracle
     and its result card: no E2M.screenLayer('mood'), no full-viewport mandala bloom, no motes thrown
     across the page. The landing answers in-frame (segment glow, the oracle's own light, the pawl) plus
     a small spark at the pointer, a translate-only shake, haptics and the announcement. */

  function boot() {
    var E = window.E2M;
    if (!E || typeof E.register !== 'function') return false;
    E.register(KEY, makeMood(E));
    return true;
  }
  if (!boot()) document.addEventListener('DOMContentLoaded', boot, { once: true });

  function makeMood(E) {
    function fx(name) {
      var args = Array.prototype.slice.call(arguments, 1);
      try { if (E.fx && typeof E.fx[name] === 'function') E.fx[name].apply(E.fx, args); } catch (e) { /* decorative */ }
    }
    function sfx(name, o) { try { if (E.audio && E.audio.play) E.audio.play(name, o); } catch (e) { /* silent */ } }
    function toast(msg) { try { if (E.toast) E.toast(msg); } catch (e) { /* silent */ } }
    function reduced() { return !!E.reduced; }
    /* Revision 2 — immersion + accessibility hooks (guarded) */
    function impact(p, o) { try { if (typeof E.impact === 'function') E.impact(p, o || {}); } catch (e) { /* decorative */ } }
    /* Revision 4 — haptics + translate-only shake (core gates both by prefs / Calm / pause / reduced motion) */
    function haptic(n, p) { try { if (typeof E.haptic === 'function') E.haptic(n, p); } catch (e) { /* decorative */ } }
    function shake(px, ms, o) { try { if (typeof E.shake === 'function') E.shake(px, ms, o); } catch (e) { /* decorative */ } }
    var lastDetentBuzz = 0, lastTickAt = 0, lastAngle = 0;
    function announce(msg, assertive) {
      try { if (typeof E.announce === 'function') { E.announce(msg, { assertive: !!assertive }); return; } } catch (e) { /* fall back */ }
      if (liveEl) liveEl.textContent = msg;
    }
    function ambientOff() { return reduced() || !!(E.isPaused && E.isPaused()); }
    // the pointer is a sprung pawl: each segment edge flicks it, and it rings back to rest
    var pawl = 0, pawlV = 0, lastSeg = 0, settle = null, hintEl = null;

    var root, rot, oracle, revealBtn, waitEl, scroll, emblemEl, titleEl, descEl, statsEl, noteEl, liveEl, segs, pointer;
    var angle = 0, tween = null, raf = 0, last = 0, inView = false, mounted = false;
    var current = null, lastIdx = -1, spinning = false, blobCache = {}, mdUid = '';

    function build(stage) {
      root = document.createElement('div');
      root.className = 'act-mood';
      root.innerHTML = '' +
        '<p class="act-hint" data-hint>Press the glowing centre of the mandala to learn your Diwali mood. Enter or Space works too.</p>' +
        '<div class="md-oracle">' + mandalaSVG() +
          '<button type="button" class="md-reveal"><span class="md-reveal-k">Reveal my</span><span class="md-reveal-b">Diwali mood</span></button>' +
          '<span class="md-consult" aria-hidden="true"></span>' +
        '</div>' +
        '<div class="md-result">' +
          '<div class="md-wait">' +
            '<span class="md-seal" aria-hidden="true"><span lang="hi">श्री</span></span>' +
            '<p class="md-wait-title">The oracle is ready.</p>' +
            '<p class="md-wait-line">It has had three cups of chai and it knows things. Press the centre of the mandala and let it think.</p>' +
          '</div>' +
          '<div class="md-scroll" hidden>' +
            '<span class="md-rod md-rod--top" aria-hidden="true"></span>' +
            '<div class="md-paper">' +
              '<span class="md-stamp deva-stamp" lang="hi" aria-hidden="true">शुभ लाभ</span>' +
              '<p class="md-kicker">Your Diwali mood is</p>' +
              '<div class="md-emblem"></div>' +
              '<h3 class="md-title"></h3>' +
              '<p class="md-desc"></p>' +
              '<ul class="md-stats" role="list"></ul>' +
              '<span class="md-warli" aria-hidden="true"></span>' +
              '<div class="md-actions">' +
                '<button type="button" class="btn-diya md-plate md-download"><span>Download my card</span></button>' +
                '<button type="button" class="btn-marigold md-plate md-again"><span>Ask again</span></button>' +
                '<button type="button" class="btn-tilak btn-tilak--text md-plate md-share"><span>Share</span></button>' +
              '</div>' +
              '<p class="md-note" aria-live="polite"></p>' +
            '</div>' +
            '<span class="md-rod md-rod--bottom" aria-hidden="true"></span>' +
          '</div>' +
          '<p class="md-live" aria-live="polite"></p>' +
        '</div>';
      stage.appendChild(root);
      oracle = root.querySelector('.md-oracle');
      rot = root.querySelector('.md-rot');
      pointer = root.querySelector('.md-pointer');
      revealBtn = root.querySelector('.md-reveal');
      waitEl = root.querySelector('.md-wait');
      scroll = root.querySelector('.md-scroll');
      emblemEl = root.querySelector('.md-emblem');
      titleEl = root.querySelector('.md-title');
      descEl = root.querySelector('.md-desc');
      statsEl = root.querySelector('.md-stats');
      noteEl = root.querySelector('.md-note');
      liveEl = root.querySelector('.md-live');
      segs = root.querySelectorAll('.md-seg');
      hintEl = root.querySelector('[data-hint]');
      revealBtn.setAttribute('aria-describedby', 'md-desc-' + (mdUid = Math.random().toString(36).slice(2, 7)));
      var dsc = document.createElement('p'); dsc.className = 'md-live'; dsc.id = 'md-desc-' + mdUid;
      dsc.textContent = 'Spins the mandala of eight Diwali moods and lands on one. The result appears beside the mandala and is read out.';
      root.appendChild(dsc);

      revealBtn.addEventListener('click', reveal);
      root.querySelector('.md-again').addEventListener('click', reveal);
      root.querySelector('.md-download').addEventListener('click', download);
      // R4: every button press answers with a tiny tap (the reveal fires its own, stronger one first)
      root.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('button'); if (b && root.contains(b)) haptic('tap'); });
      root.querySelector('.md-share').addEventListener('click', share);
      Array.prototype.forEach.call(root.querySelectorAll('.md-plate, .md-reveal'), function (b) {
        b.addEventListener('pointermove', function (e) {
          var r = b.getBoundingClientRect();
          b.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
          b.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
        });
      });
      document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else if (inView) kick(); });
      setAngle(0);
    }

    function setAngle(a) { angle = a; rot.setAttribute('transform', 'rotate(' + (a % 360).toFixed(2) + ')'); }

    /* ---------- spin (Revision 6.4) ----------
       A real oracle makes you wait. Timeline (full motion, ~5.7s to the result, the card unfurls over the next second):
         0 - 0.35s  the wheel whips up to speed (attack)
         0.35 - 2.6s a sustained fast spin, ~7 full turns, with the medallion cycling "consulting" lines
         2.6 - 4.2s a long ease-out: the pointer ticks slow from a buzz to single clicks, the last second is a crawl
                    that creeps PAST the chosen segment onto its neighbour...
         4.2 - 4.5  ...and hangs there (the held breath)
         4.5 - 5.3  then clicks one notch back onto the chosen segment, a damped spring settles it, result unfurls.
       Calm / reduced motion: one short ~1.2s spin and a fade. */
    var CONSULT = ['Asking the diyas…', 'Counting laddoos…', 'Consulting Mama ji…', 'Reading the WhatsApp forwards…', 'Warming the chai…', 'Polishing the brass…', 'Shaking the rangoli sand…'];
    var T_SPIN = 4200, T_HOLD = 300, T_BACK = 820, OVERSHOOT = 29;
    var spinCurve = null; // cumulative distance (0..1) sampled over the spin, built once from the velocity profile
    function velocity(u) {
      var A = 0.085, D0 = 0.62;                       // attack share, start of the long ease-out
      if (u < A) { var k = u / A; return k * k * (3 - 2 * k); }
      if (u < D0) return 1 - 0.1 * ((u - A) / (D0 - A)); // slight natural drag during the sustained spin
      var w = (u - D0) / (1 - D0);
      return 0.9 * Math.pow(1 - w, 2.7);
    }
    function buildCurve() {
      var N = 460, c = [0], sum = 0, i;
      for (i = 1; i <= N; i++) { sum += velocity((i - 0.5) / N); c.push(sum); }
      for (i = 0; i <= N; i++) c[i] /= sum;
      spinCurve = c;
    }
    function curveAt(u) {
      if (!spinCurve) buildCurve();
      if (u <= 0) return 0; if (u >= 1) return 1;
      var f = u * (spinCurve.length - 1), i = f | 0;
      return spinCurve[i] + (spinCurve[i + 1] - spinCurve[i]) * (f - i);
    }
    var consultIdx = -1, consultEl = null, tickCtx = null;
    function consultLine(i) {
      if (i === consultIdx) return; consultIdx = i;
      if (consultEl) {
        consultEl.classList.remove('is-swap'); void consultEl.offsetWidth;
        consultEl.textContent = CONSULT[i % CONSULT.length]; consultEl.classList.add('is-swap');
      }
    }
    /* a soft wooden/brass tick for each segment edge; pitch and loudness follow the wheel's speed */
    function tick(speed) {
      if (!E.audio || !E.audio.enabled) return;
      try {
        var C = window.AudioContext || window.webkitAudioContext; if (!C) return;
        if (!tickCtx) tickCtx = new C();
        if (tickCtx.state === 'suspended') tickCtx.resume();
        var t = tickCtx.currentTime, vol = (E.prefs && E.prefs.volume != null ? E.prefs.volume : 0.7);
        var o = tickCtx.createOscillator(), g = tickCtx.createGain(), f = 1500 + Math.min(1, speed) * 900;
        o.type = 'triangle'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.55, t + 0.03);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05 * vol * (0.5 + 0.5 * Math.min(1, speed)), t + 0.002);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
        o.connect(g); g.connect(tickCtx.destination); o.start(t); o.stop(t + 0.06);
      } catch (e) { /* silent */ }
    }
    function setConsulting(on) {
      root.classList.toggle('is-consulting', on);
      if (on) {
        consultEl = root.querySelector('.md-consult'); consultIdx = -1; consultLine((Math.random() * CONSULT.length) | 0);
        revealBtn.setAttribute('aria-label', 'The oracle is thinking');
      } else { revealBtn.removeAttribute('aria-label'); }
    }

    function reveal() {
      if (spinning) return;
      inView = true;
      spinning = true;
      root.classList.add('is-spinning');
      revealBtn.setAttribute('aria-disabled', 'true');
      if (hintEl) hintEl.classList.add('is-gone');
      announce('The oracle is consulting the diyas, the laddoos and Mama ji. Your mood arrives in a few seconds.');
      haptic('medium'); shake(1.5, 220);
      settle = null;
      var idx;
      do { idx = (Math.random() * RESULTS.length) | 0; } while (idx === lastIdx);
      lastIdx = idx;
      for (var i = 0; i < segs.length; i++) segs[i].classList.remove('is-hit');
      if (current) { scroll.classList.remove('is-open', 'is-filled'); }
      noteEl.textContent = '';
      var red = reduced();
      var base = ((-idx * 45 - angle) % 360 + 360) % 360;
      setConsulting(true);
      if (red) {
        // short spin + fade: ~1.2s
        var tgt = angle + base + 360;
        tween = { kind: 'short', from: angle, to: tgt, end: tgt, t0: performance.now(), dur: 1200, idx: idx };
      } else {
        var turns = 7;
        var dir = Math.random() < 0.5 ? 1 : -1;   // which neighbour it nearly lands on (never past a half-segment of it)
        var end = angle + base + 360 * turns;
        tween = { kind: 'spin', from: angle, end: end, over: OVERSHOOT, t0: performance.now(), idx: idx, lastLine: 0, spinDur: T_SPIN, dist: end + OVERSHOOT - angle };
      }
      lastSeg = Math.floor((angle + 22.5) / 45);
      sfx('spin');
      kick();
    }

    function land(idx) {
      spinning = false;
      root.classList.remove('is-spinning');
      setConsulting(false);
      revealBtn.removeAttribute('aria-disabled');
      segs[idx].classList.add('is-hit');
      var r = pointer.getBoundingClientRect();
      fx('sparkBurst', r.left + r.width / 2, r.top + r.height, '#FFD778', reduced() ? 8 : 28);
      sfx('chime'); sfx('thump', { power: 0.35 });
      impact(0.36, { x: r.left + r.width / 2, y: r.top + r.height, color: '#FFD778', kind: 'mood' });
      haptic('success'); // R4: the reveal lands
      root.classList.remove('is-landed'); void root.offsetWidth; root.classList.add('is-landed');
      showResult(RESULTS[idx]);
    }

    function showResult(res) {
      current = res;
      emblemEl.innerHTML = emblemSVG(res.emblem, 'md-emblem-svg');
      titleEl.textContent = res.title;
      descEl.textContent = res.desc;
      statsEl.innerHTML = res.stats.map(function (s, i) {
        return '<li><span class="md-stat-k">' + s[0] + '</span><span class="md-bar" aria-hidden="true"><i style="--v:' + (s[1] / 100).toFixed(2) + ';transition-delay:' + (0.15 * i).toFixed(2) + 's"></i></span><b>' + s[1] + '%</b></li>';
      }).join('');
      waitEl.hidden = true;
      scroll.hidden = false;
      void scroll.offsetWidth;
      scroll.classList.add('is-open');
      setTimeout(function () { if (current === res) scroll.classList.add('is-filled'); }, reduced() ? 50 : 750);
      announce('Your Diwali mood is ' + res.title + '. ' + res.desc + ' ' + res.stats.map(function (s) { return s[0] + ' ' + s[1] + ' per cent'; }).join(', ') + '.');
      try { E.score && E.score.set && E.score.set('mood-last', res.id); } catch (e) { /* ok */ }
      if (window.matchMedia && window.matchMedia('(max-width: 900px)').matches) {
        setTimeout(function () {
          var rr = scroll.getBoundingClientRect();
          if (rr.top > window.innerHeight * 0.7) scroll.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' });
        }, 350);
      }
      setTimeout(function () { if (current === res) makeBlob(res); }, 1400); // warm the PNG so Share stays inside the user gesture
    }

    /* ---------- loop ---------- */
    function easeOutQuint(t) { return 1 - Math.pow(1 - t, 5); }
    function frame(now) {
      raf = 0;
      var dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
      last = now;
      if (tween && tween.kind === 'spin') {
        var el = now - tween.t0, tw = tween;
        if (el < T_SPIN) {
          setAngle(tw.from + tw.dist * curveAt(el / T_SPIN));
          var li = Math.floor(el / 1000); if (li !== tw.lastLine) { tw.lastLine = li; consultLine(consultIdx + 1); }
        } else if (el < T_SPIN + T_HOLD) {
          setAngle(tw.end + tw.over);                         // hanging on the neighbour: the held breath
        } else if (el < T_SPIN + T_HOLD + T_BACK) {
          var bu = (el - T_SPIN - T_HOLD) / T_BACK, be = bu < 0.5 ? 4 * bu * bu * bu : 1 - Math.pow(-2 * bu + 2, 3) / 2;
          setAngle(tw.end + tw.over * (1 - be));
        } else {
          tween = null;
          settle = { from: tw.end - 1.6, end: tw.end, t0: now, idx: tw.idx };
        }
      } else if (tween) {
        var t = Math.min(1, (now - tween.t0) / tween.dur);
        setAngle(tween.from + (tween.to - tween.from) * easeOutQuint(t));
        if (t >= 1) { var tws = tween; tween = null; setAngle(tws.end % 360); land(tws.idx); }
      } else if (settle) {
        var st = (now - settle.t0) / 1000, off = (settle.from - settle.end) * Math.exp(-st * 8) * Math.cos(st * 14);
        setAngle(settle.end + off);
        if (st > 0.38) { var si = settle.idx; settle = null; setAngle(angle % 360); land(si); }
      } else if (!ambientOff()) {
        setAngle(angle + 5 * dt);
      }
      // detents: every segment edge that passes the pointer flicks the pawl
      var prevAngleForTick = lastAngle; lastAngle = angle;
      var seg = Math.floor((angle + 22.5) / 45);
      if (seg !== lastSeg) {
        if (!reduced() && (tween || settle)) pawlV += (seg > lastSeg ? -1 : 1) * 90;
        // R4: each detent the pawl clicks over is a faint tick under the finger (throttled)
        if ((tween || settle) && now - lastDetentBuzz > 110) { lastDetentBuzz = now; haptic('select'); }
        // R6.4: the soft tick slows with the wheel (throttled so a fast spin is a purr, a crawl is single clicks)
        if ((tween || settle) && now - lastTickAt > 52) { lastTickAt = now; tick(Math.min(1, Math.abs(angle - prevAngleForTick) / Math.max(dt, .001) / 900)); }
        lastSeg = seg;
      }
      if (!reduced()) {
        pawlV += (-pawl * 420 - pawlV * 16) * dt; pawl += pawlV * dt; pawl = Math.max(-14, Math.min(14, pawl));
        pointer.setAttribute('transform', 'rotate(' + pawl.toFixed(2) + ' 0 -208)');
      }
      var pawlBusy = Math.abs(pawl) + Math.abs(pawlV) * 0.02 > 0.05;
      if (inView && !document.hidden && (tween || settle || pawlBusy || !ambientOff())) raf = requestAnimationFrame(frame);
    }
    function kick() {
      if (raf || !mounted || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      if (tween) { var idx = tween.idx; setAngle(tween.end % 360); tween = null; land(idx); } // never strand a spin
      else if (settle) { var si = settle.idx; setAngle(settle.end % 360); settle = null; land(si); }
    }

    /* ---------- PNG card (Canvas API, no libraries) ---------- */
    function fontsReady() {
      if (!document.fonts || !document.fonts.load) return Promise.resolve();
      return Promise.all([
        document.fonts.load('300 80px "Cormorant Garamond"'),
        document.fonts.load('italic 400 36px "Cormorant Garamond"'),
        document.fonts.load('500 30px "Mukta"'),
        document.fonts.load('600 24px "Mukta"'),
        document.fonts.load('400 40px "Yatra One"')
      ]).catch(function () { /* fall back to system fonts */ });
    }
    function emblemImage(res) {
      return new Promise(function (resolve) {
        var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="720" height="720">' + EMBLEM[res.emblem] + '</svg>';
        var img = new Image();
        img.onload = function () { resolve(img); };
        img.onerror = function () { resolve(null); };
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      });
    }
    function wrap(g, text, maxW) {
      var words = text.split(' '), lines = [], line = '';
      for (var i = 0; i < words.length; i++) {
        var test = line ? line + ' ' + words[i] : words[i];
        if (g.measureText(test).width > maxW && line) { lines.push(line); line = words[i]; } else line = test;
      }
      if (line) lines.push(line);
      return lines;
    }
    function tracked(g, text, x, y, px) {
      if ('letterSpacing' in g) { g.letterSpacing = px + 'px'; g.fillText(text, x, y); g.letterSpacing = '0px'; return; }
      g.fillText(text.split('').join(' '), x, y);
    }
    function lotus(g, x, y, s, col) {
      g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = col;
      g.beginPath(); g.moveTo(0, -14); g.bezierCurveTo(6, -8, 6, 2, 0, 6); g.bezierCurveTo(-6, 2, -6, -8, 0, -14); g.fill();
      g.beginPath(); g.moveTo(0, 6); g.bezierCurveTo(-10, 5, -15, -2, -15, -7); g.bezierCurveTo(-9, -6, -4, -1, 0, 6); g.fill();
      g.beginPath(); g.moveTo(0, 6); g.bezierCurveTo(10, 5, 15, -2, 15, -7); g.bezierCurveTo(9, -6, 4, -1, 0, 6); g.fill();
      g.restore();
    }
    function drawCard(res, img) {
      var W = 1080, H = 1350, c = document.createElement('canvas');
      c.width = W; c.height = H;
      var g = c.getContext('2d'), i;
      var bg = g.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#080B1E'); bg.addColorStop(0.6, '#140A2E'); bg.addColorStop(1, '#080B1E');
      g.fillStyle = bg; g.fillRect(0, 0, W, H);
      var glow = g.createRadialGradient(540, 330, 0, 540, 330, 560);
      glow.addColorStop(0, 'rgba(255,215,120,0.16)'); glow.addColorStop(0.6, 'rgba(255,215,120,0.03)'); glow.addColorStop(1, 'rgba(255,215,120,0)');
      g.fillStyle = glow; g.fillRect(0, 0, W, H);

      // mandala behind the emblem
      g.save(); g.translate(540, 330);
      g.strokeStyle = 'rgba(255,215,120,0.3)'; g.lineWidth = 1.5;
      [168, 206].forEach(function (r) { g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke(); });
      g.setLineDash([3, 10]); g.beginPath(); g.arc(0, 0, 188, 0, TAU); g.stroke(); g.setLineDash([]);
      for (i = 0; i < 32; i++) {
        g.save(); g.rotate(i / 32 * TAU);
        g.beginPath(); g.moveTo(0, -210); g.bezierCurveTo(8, -219, 8, -233, 0, -244); g.bezierCurveTo(-8, -233, -8, -219, 0, -210);
        g.fillStyle = i % 2 ? 'rgba(255,215,120,0.2)' : 'rgba(255,215,120,0.5)'; g.fill();
        g.restore();
      }
      g.restore();

      // frames: outer hairline + a temple-niche (devakoshtha) top. Revision 3: Hindu temple vocabulary, no
      // cusped arch — pilasters rise to a tiered, stepped superstructure that climbs around the mandala (every
      // corner stays clear of it) to an amalaka disc and a kalasha finial; small kalasha beads mark each tier.
      g.strokeStyle = 'rgba(255,215,120,0.55)'; g.lineWidth = 1.5; g.strokeRect(34, 34, W - 68, H - 68);
      var TIERS = [[476, 392], [440, 344], [398, 298], [350, 254], [296, 212], [236, 172], [176, 134], [96, 92]]; // [half width, top y]
      g.strokeStyle = 'rgba(255,215,120,0.85)'; g.lineWidth = 1.5; g.lineJoin = 'miter';
      g.beginPath(); g.moveTo(64, H - 64);
      TIERS.forEach(function (t, k) { if (k) g.lineTo(540 - t[0], TIERS[k - 1][1]); g.lineTo(540 - t[0], t[1]); });
      for (i = TIERS.length - 1; i >= 0; i--) { g.lineTo(540 + TIERS[i][0], TIERS[i][1]); if (i) g.lineTo(540 + TIERS[i][0], TIERS[i - 1][1]); }
      g.lineTo(W - 64, H - 64); g.closePath(); g.stroke();
      // a second, finer line inset inside the pilasters: carved stone has depth
      g.strokeStyle = 'rgba(255,215,120,0.32)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(80, H - 64); g.lineTo(80, 404); g.moveTo(W - 80, H - 64); g.lineTo(W - 80, 404); g.stroke();
      // each tier carries a cornice ledge (kapota) that overhangs its step, and a small kalasha on its corner
      g.strokeStyle = 'rgba(255,215,120,0.6)'; g.lineWidth = 1;
      g.fillStyle = '#FFD778';
      TIERS.forEach(function (t, k) {
        if (!k) return;
        [-1, 1].forEach(function (sd) {
          var x = 540 + sd * t[0];
          g.beginPath(); g.moveTo(x + sd * 7, t[1] + 6); g.lineTo(x - sd * 22, t[1] + 6); g.stroke();
          g.beginPath(); g.arc(x, t[1] - 5.5, 3.4, 0, TAU); g.fill();
          g.beginPath(); g.moveTo(x - 1.8, t[1] - 8.6); g.lineTo(x, t[1] - 13); g.lineTo(x + 1.8, t[1] - 8.6); g.closePath(); g.fill();
        });
      });
      // amalaka (ribbed disc) + kalasha (pot) + bud finial
      g.fillStyle = '#080B1E'; g.strokeStyle = 'rgba(255,215,120,0.9)'; g.lineWidth = 1.5;
      g.beginPath(); g.ellipse(540, 82, 52, 9, 0, 0, TAU); g.fill(); g.stroke();
      g.lineWidth = 1; for (i = -4; i <= 4; i++) { g.beginPath(); g.moveTo(540 + i * 10.5, 75); g.lineTo(540 + i * 10.5, 89); g.stroke(); }
      g.fillStyle = '#FFD778';
      g.beginPath(); g.moveTo(526, 72); g.lineTo(554, 72); g.lineTo(549, 68); g.lineTo(531, 68); g.closePath(); g.fill();
      g.beginPath(); g.arc(540, 57, 12, 0, TAU); g.fill();
      g.beginPath(); g.moveTo(532, 46); g.lineTo(548, 46); g.lineTo(545, 41); g.lineTo(535, 41); g.closePath(); g.fill();
      lotus(g, 540, 36, 0.62, '#FFF4DC');
      [[64, H - 64], [W - 64, H - 64]].forEach(function (p) { lotus(g, p[0], p[1] + 8, 1.1, '#FFD778'); });

      // emblem
      if (img) g.drawImage(img, 540 - 150, 330 - 150, 300, 300);
      else { lotus(g, 540, 350, 8, '#FFD778'); }

      // text block
      g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      var y = 622;
      g.fillStyle = '#FFBE55'; g.font = '400 36px "Yatra One", "Mukta", Georgia, serif';
      tracked(g, 'My Diwali mood is', 540, y, 1);
      y += 30;
      var tSize = 84;
      g.font = '300 ' + tSize + 'px "Cormorant Garamond", Georgia, serif';
      var tl = wrap(g, res.title, 880);
      if (tl.length > 2) { tSize = 70; g.font = '300 ' + tSize + 'px "Cormorant Garamond", Georgia, serif'; tl = wrap(g, res.title, 900); }
      g.fillStyle = '#FFF4DC';
      tl.forEach(function (l) { y += tSize * 1.02; g.fillText(l, 540, y); });
      y += 76;
      g.font = '400 30px "Mukta", Arial, sans-serif';
      g.fillStyle = 'rgba(255,244,220,0.94)';
      var dl = wrap(g, res.desc, 840), dlh = 40;
      if (dl.length > 3) { g.font = '400 27px "Mukta", Arial, sans-serif'; dl = wrap(g, res.desc, 870); dlh = 38; }
      dl.forEach(function (l) { g.fillText(l, 540, y); y += dlh; });
      y += 22;

      // stats
      var sx = 170, sw = 740;
      res.stats.forEach(function (s) {
        g.textAlign = 'left'; g.fillStyle = 'rgba(255,244,220,0.92)'; g.font = '500 24px "Mukta", Arial, sans-serif';
        g.fillText(s[0], sx, y);
        g.textAlign = 'right'; g.fillStyle = '#FFD778'; g.font = '400 38px "Yatra One", "Mukta", Georgia, serif';
        g.fillText(s[1] + '%', sx + sw, y + 4);
        var by = y + 16;
        g.fillStyle = 'rgba(255,215,120,0.18)'; g.fillRect(sx, by, sw, 2);
        g.fillStyle = '#FFD778'; g.fillRect(sx, by, Math.max(6, sw * s[1] / 100), 2);
        g.beginPath(); g.arc(sx + Math.max(6, sw * s[1] / 100), by + 1, 5, 0, TAU); g.fillStyle = '#FFF4DC'; g.fill();
        y += 58;
      });

      // footer
      g.textAlign = 'center';
      g.fillStyle = '#FFD778'; g.font = 'italic 400 38px "Cormorant Garamond", Georgia, serif';
      g.fillText('E2M · One Team. A Thousand Lights.', 540, H - 104);
      g.fillStyle = 'rgba(255,244,220,0.88)'; g.font = '500 22px "Mukta", Arial, sans-serif';
      tracked(g, 'Diwali 2026 · The Festival Playground', 540, H - 80, 1.5);
      // genda-phool garland: a swag of marigold and haldi flowers above the footer, and a kumkum stamp
      for (i = 0; i <= 26; i++) {
        var gx = 180 + i * (720 / 26), gy = H - 146 + Math.sin(i / 26 * Math.PI) * 8;
        g.beginPath(); g.arc(gx, gy, 7, 0, TAU); g.fillStyle = i % 2 ? '#FFD04A' : '#F28C18'; g.fill();
        g.beginPath(); g.arc(gx, gy, 3, 0, TAU); g.fillStyle = '#A84806'; g.fill();
      }
      g.save(); g.translate(868, 548); g.rotate(0.1);
      g.strokeStyle = 'rgba(200,22,46,0.9)'; g.lineWidth = 3; g.strokeRect(-92, -34, 184, 68);
      g.lineWidth = 1.2; g.strokeRect(-85, -27, 170, 54);
      g.fillStyle = '#FFBE55'; g.font = '400 36px "Yatra One", "Mukta", serif'; g.textBaseline = 'middle'; g.fillText('शुभ लाभ', 0, 2);
      g.restore(); g.textBaseline = 'alphabetic';
      return c;
    }
    function makeBlob(res) {
      if (blobCache[res.id]) return blobCache[res.id];
      var p = fontsReady().then(function () { return emblemImage(res); }).then(function (img) {
        var c = drawCard(res, img);
        return new Promise(function (resolve) {
          try {
            c.toBlob(function (b) { resolve(b || dataUrlBlob(c)); }, 'image/png');
          } catch (e) {
            // a tainted canvas (very old browsers with SVG images): redraw without the emblem
            var c2 = drawCard(res, null);
            c2.toBlob(function (b) { resolve(b); }, 'image/png');
          }
        });
      });
      blobCache[res.id] = p;
      p.then(function (b) { if (!b) delete blobCache[res.id]; });
      return p;
    }
    function dataUrlBlob(c) {
      try {
        var d = c.toDataURL('image/png'), bin = atob(d.split(',')[1]), arr = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        return new Blob([arr], { type: 'image/png' });
      } catch (e) { return null; }
    }
    function fileName(res) { return 'e2m-diwali-mood-' + res.id + '.png'; }

    function download() {
      if (!current) return;
      var res = current;
      noteEl.textContent = 'Painting your card…';
      makeBlob(res).then(function (blob) {
        if (!blob) { noteEl.textContent = 'Your browser would not paint the card. A screenshot works too.'; return; }
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = fileName(res); a.hidden = true;
        root.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
        noteEl.textContent = 'Card downloaded. Frame it. Or post it in the team chat.';
        sfx('sparkle');
      });
    }

    function shareText(res) {
      return 'My Diwali mood: ' + res.title + '. ' + res.short + ' Find yours at the E2M Diwali Playground.';
    }
    function share() {
      if (!current) return;
      var res = current, text = shareText(res), url = location.href.split('#')[0];
      if (navigator.share) {
        var cached = blobCache[res.id];
        var go = function (blob) {
          var data = { title: 'My Diwali mood', text: text, url: url };
          try {
            var file = blob && typeof File === 'function' ? new File([blob], fileName(res), { type: 'image/png' }) : null;
            if (file && navigator.canShare && navigator.canShare({ files: [file] })) data.files = [file];
          } catch (e) { /* share without the file */ }
          return navigator.share(data).then(function () { noteEl.textContent = 'Shared. Your mood is now public knowledge.'; });
        };
        (cached ? cached.then(go) : go(null)).catch(function (err) {
          if (err && err.name === 'AbortError') return;
          copyText(text + ' ' + url);
        });
      } else copyText(text + ' ' + url);
    }
    function copyText(t) {
      function ok() { noteEl.textContent = 'Copied! Paste it in the team chat.'; toast('Mood copied to your clipboard.'); }
      function legacy() {
        var ta = document.createElement('textarea');
        ta.value = t; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; ta.style.top = '0';
        root.appendChild(ta); ta.select();
        var done = false;
        try { done = document.execCommand('copy'); } catch (e) { done = false; }
        ta.remove();
        if (done) ok(); else noteEl.textContent = t;
      }
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(ok, legacy);
      else legacy();
    }

    return {
      mount: function (stage) {
        if (mounted || !stage) return;
        build(stage);
        mounted = true;
        if (E.on) {
          E.on('motion:pause', function () { if (root) root.classList.add('is-paused'); });
          E.on('motion:resume', function () { if (root && inView) { root.classList.remove('is-paused'); kick(); } });
          E.on('prefs:change', function () { if (inView) kick(); });
        }
      },
      onEnter: function () {
        if (!mounted) return;
        inView = true;
        root.classList.toggle('is-paused', !!(E.isPaused && E.isPaused()));
        kick();
      },
      onLeave: function () {
        if (!mounted) return;
        inView = false;
        stop();
        root.classList.add('is-paused');
      }
    };
  }
})();
