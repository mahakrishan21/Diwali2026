/* Activity X — Wish Card Studio (Revision 2, CONTRACT R2.4). Self-registers with E2M as 'wish'.
   Type a name, pick (or write) a wish, choose one of three hairline-frame card styles, watch the live canvas,
   then Download PNG (1080x1350, drawn on our own canvas), Share (Web Share with the file, else copy the text)
   or "Light a diya for them". Keyboard + screen-reader friendly: real inputs, radiogroups with arrow keys,
   the canvas is role="img" with a live text alternative. */
(function () {
  'use strict';
  var E2M = window.E2M;
  if (!E2M) return;
  var W = window, D = document, TAU = Math.PI * 2;

  var WISHES = [
    'May your inbox be as empty as the sweet box by Tuesday.',
    'Wishing you light, laddoos and zero unread messages.',
    'May your diyas stay lit and your deadlines stay polite.',
    'More light, less load. Happy Diwali.',
    'May this year bring you calm mornings and loud fireworks.',
    'Here is to bright ideas, brighter rangoli and the brightest you.',
    'May your chai stay hot and your Wi-Fi stay strong.',
    'Thank you for being one of the thousand lights.'
  ];
  var STYLES = [
    { k: 'midnight', name: 'Midnight Gold', desc: 'navy with gold hairlines' },
    { k: 'plum', name: 'Plum Ivory', desc: 'ivory paper with plum ink' },
    { k: 'mandala', name: 'Rangoli Mandala', desc: 'a gold mandala on deep plum' }
  ];
  var TH = {
    midnight: { bg0: '#0E1233', bg1: '#04050F', line: '#FFD778', line2: 'rgba(255,215,120,.34)', ink: '#FFF4DC', ink2: 'rgba(255,244,220,.82)', accent: '#FFD778', soft: 'rgba(255,215,120,.6)', diya: ['#E7B95A', '#A26A1E', '#5E3A0C'] },
    plum: { bg0: '#FFF8E8', bg1: '#F1DFBE', line: '#8A5A12', line2: 'rgba(138,90,18,.36)', ink: '#241044', ink2: 'rgba(36,16,68,.84)', accent: '#7A2E6E', soft: 'rgba(36,16,68,.62)', diya: ['#D2703A', '#9A4119', '#5A200B'] },
    mandala: { bg0: '#2A1450', bg1: '#0E0620', line: '#FFD778', line2: 'rgba(255,215,120,.3)', ink: '#FFF4DC', ink2: 'rgba(255,244,220,.84)', accent: '#FFB86B', soft: 'rgba(255,215,120,.6)', diya: ['#E7B95A', '#A26A1E', '#5E3A0C'] }
  };
  var CW = 1080, CH = 1350;
  // Revision 3: a Hindu temple niche (devakoshtha) — a pillared frame under a small curvilinear shikhara with an
  // amalaka disc and finial (replaces the cusped Mughal arch)
  var ARCH = 'M0 140V66H100V140M6 140V72H94V140M10 66C10 48 27 32 42 22H58C73 32 90 48 90 66M18 56H82M25 46H75M33 36H67M40 27H60M41 19a9 2.6 0 1 1 18 0a9 2.6 0 1 1-18 0M50 16.4V11';
  var LOTUS = ['M32 3c-6 10-6 22 0 31 6-9 6-21 0-31z', 'M32 34C22 30 16 20 16 9c8 4 14 13 16 25z', 'M32 34c10-4 16-14 16-25-8 4-14 13-16 25z', 'M32 36C18 36 8 28 3 17c11 2 21 9 29 19z', 'M32 36c14 0 24-8 29-19-11 2-21 9-29 19z', 'M12 38.5h40'];
  var DIYA_BODY = 'M3 15.5c9 .8 21 1.2 30 1.1 10-.1 20-1.1 28-4.1-1.8 8.6-8.8 18.5-23 21.4h-12C13 31.3 5.6 24.6 3 15.5z';
  var DIYA_FOOT = 'M25 33.9h14l-2 4.6H27z';

  var S = { to: '', from: '', wish: 0, custom: '', own: false, style: 'midnight', lit: false, litAt: 0 };
  var root, cv, ctx, form, toIn, fromIn, ownIn, ownWrap, countEl, desc, dlBtn, shareBtn, diyaBtn, active = false, raf = 0, fontsReady = false, bgCache = {};
  var hasPath2D = typeof W.Path2D === 'function' && typeof W.DOMMatrix === 'function';

  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function wishText() { return S.own ? (S.custom.trim() || 'Wishing you every light there is.') : WISHES[S.wish]; }
  function toName() { return S.to.trim(); }
  function fromName() { return S.from.trim(); }

  /* ------------------------------------------------------------------ */
  /* Markup                                                               */
  /* ------------------------------------------------------------------ */
  function build(stage) {
    root = D.createElement('div');
    root.className = 'act-wish';
    var wishes = WISHES.map(function (w, i) {
      return '<button type="button" class="wc-wish" role="radio" aria-checked="' + (i === 0) + '" tabindex="' + (i === 0 ? 0 : -1) + '" data-wish="' + i + '"><span>' + esc(w) + '</span></button>';
    }).join('') + '<button type="button" class="wc-wish wc-wish--own" role="radio" aria-checked="false" tabindex="-1" data-wish="own"><span><i>Write my own</i></span></button>';
    var styles = STYLES.map(function (s, i) {
      return '<button type="button" class="wc-style wc-style--' + s.k + '" role="radio" aria-checked="' + (i === 0) + '" tabindex="' + (i === 0 ? 0 : -1) + '" data-style="' + s.k + '" aria-label="' + s.name + ', ' + s.desc + '"><span class="wc-swatch" aria-hidden="true"></span><span class="wc-style-n">' + s.name + '</span></button>';
    }).join('');
    root.innerHTML =
      '<div class="wc-grid">' +
        '<figure class="wc-preview">' +
          '<div class="wc-frame"><canvas class="wc-canvas" width="' + CW + '" height="' + CH + '" role="img" aria-describedby="wc-desc"></canvas></div>' +
          '<figcaption class="wc-cap wc-hint">Live preview · 1080 × 1350</figcaption>' +
          '<p class="sr-only" id="wc-desc"></p>' +
        '</figure>' +
        '<form class="wc-form" novalidate onsubmit="return false">' +
          '<div class="wc-fields">' +
            '<div class="wc-field"><label class="wc-lab" for="wc-to">For</label><input id="wc-to" class="wc-input" type="text" maxlength="32" autocomplete="off" spellcheck="false" placeholder="Their name" aria-describedby="wc-to-h"><p class="wc-help" id="wc-to-h">Up to 32 letters. Leave blank for “everyone”.</p></div>' +
            '<div class="wc-field"><label class="wc-lab" for="wc-from">From <span class="wc-opt">(optional)</span></label><input id="wc-from" class="wc-input" type="text" maxlength="32" autocomplete="off" spellcheck="false" placeholder="Your name"></div>' +
          '</div>' +
          '<fieldset class="wc-set"><legend class="wc-lab" id="wc-l-wish">Choose a wish</legend>' +
            '<div class="wc-wishes" role="radiogroup" aria-labelledby="wc-l-wish">' + wishes + '</div>' +
            '<div class="wc-own" hidden><label class="sr-only" for="wc-own">Your own wish</label><textarea id="wc-own" class="wc-input wc-textarea" maxlength="90" rows="2" placeholder="Write your wish, up to 90 characters" aria-describedby="wc-count"></textarea><p class="wc-count" id="wc-count"><b>0</b>/90</p></div>' +
          '</fieldset>' +
          '<fieldset class="wc-set"><legend class="wc-lab" id="wc-l-style">Card style</legend>' +
            '<div class="wc-styles" role="radiogroup" aria-labelledby="wc-l-style">' + styles + '</div>' +
          '</fieldset>' +
          '<div class="wc-actions">' +
            '<button type="button" class="btn-diya btn-diya--lg wc-dl"><span>Download PNG</span></button>' +
            '<button type="button" class="btn-marigold wc-share"><span>Share</span></button>' +
            '<button type="button" class="btn-tilak btn-tilak--text wc-diya" aria-pressed="false"><span>Light a diya for them</span></button>' +
          '</div>' +
        '</form>' +
      '</div>';
    stage.appendChild(root);
    cv = root.querySelector('.wc-canvas'); ctx = cv.getContext('2d');
    form = root.querySelector('.wc-form');
    toIn = root.querySelector('#wc-to'); fromIn = root.querySelector('#wc-from');
    ownIn = root.querySelector('#wc-own'); ownWrap = root.querySelector('.wc-own'); countEl = root.querySelector('.wc-count b');
    desc = root.querySelector('#wc-desc');
    dlBtn = root.querySelector('.wc-dl'); shareBtn = root.querySelector('.wc-share'); diyaBtn = root.querySelector('.wc-diya');
  }

  /* ------------------------------------------------------------------ */
  /* Drawing                                                              */
  /* ------------------------------------------------------------------ */
  function P(d, sx, sy, tx, ty) {
    if (!hasPath2D) return null;
    var out = new Path2D();
    out.addPath(new Path2D(d), new DOMMatrix([sx, 0, 0, sy, tx, ty]));
    return out;
  }
  function background(th, key) {
    if (bgCache[key]) return bgCache[key];
    var c = D.createElement('canvas'); c.width = CW; c.height = CH;
    var g = c.getContext('2d');
    var rg = g.createRadialGradient(CW / 2, CH * 0.42, 40, CW / 2, CH * 0.5, CH * 0.78);
    rg.addColorStop(0, th.bg0); rg.addColorStop(1, th.bg1);
    g.fillStyle = rg; g.fillRect(0, 0, CW, CH);
    if (key === 'plum') {
      // paper: a faint laid texture of fine horizontal lines
      g.globalAlpha = 0.05; g.fillStyle = '#5A3A10';
      for (var y = 0; y < CH; y += 6) g.fillRect(0, y, CW, 1);
      g.globalAlpha = 1;
    }
    if (key === 'mandala') mandala(g, CW / 2, CH * 0.47, 470, th);
    if (key === 'midnight') {
      // a few still stars
      var seed = 7; function r() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      g.fillStyle = '#FFF4DC';
      for (var i = 0; i < 70; i++) { g.globalAlpha = 0.15 + r() * 0.45; g.beginPath(); g.arc(80 + r() * (CW - 160), 80 + r() * (CH * 0.55), 0.6 + r() * 1.4, 0, TAU); g.fill(); }
      g.globalAlpha = 1;
      var glow = g.createRadialGradient(CW / 2, CH * 0.86, 10, CW / 2, CH * 0.86, 420);
      glow.addColorStop(0, 'rgba(255,170,70,.16)'); glow.addColorStop(1, 'rgba(255,170,70,0)');
      g.fillStyle = glow; g.fillRect(0, 0, CW, CH);
    }
    // the double hairline frame
    g.strokeStyle = th.line; g.lineWidth = 2; g.strokeRect(44, 44, CW - 88, CH - 88);
    g.strokeStyle = th.line2; g.lineWidth = 1.5; g.strokeRect(60, 60, CW - 120, CH - 120);
    // jaali diamonds at the corners
    [[44, 44], [CW - 44, 44], [44, CH - 44], [CW - 44, CH - 44]].forEach(function (p) {
      g.save(); g.translate(p[0], p[1]); g.rotate(Math.PI / 4);
      g.fillStyle = th.bg1; g.fillRect(-11, -11, 22, 22);
      g.strokeStyle = th.line; g.lineWidth = 1.6; g.strokeRect(-11, -11, 22, 22); g.strokeRect(-5, -5, 10, 10);
      g.restore();
    });
    // the temple niche window
    var ap = key !== 'mandala' && P(ARCH, 8.1, 7.0, CW / 2 - 405, 150);
    if (ap) { g.strokeStyle = th.line2; g.lineWidth = 1.6; g.stroke(ap); }
    // lotus crown
    g.strokeStyle = th.line; g.lineWidth = 1.8; g.lineJoin = 'round';
    LOTUS.forEach(function (d) { var lp = P(d, 2.2, 2.2, CW / 2 - 70.4, 92); if (lp) g.stroke(lp); });
    return (bgCache[key] = c);
  }
  function mandala(g, cx, cy, R, th) {
    g.save(); g.translate(cx, cy);
    g.strokeStyle = 'rgba(255,215,120,.22)'; g.lineWidth = 1.4;
    function petals(n, r1, r2, w, rot) {
      for (var i = 0; i < n; i++) {
        g.save(); g.rotate((i + (rot || 0)) / n * TAU);
        g.beginPath(); g.moveTo(0, -r1); g.quadraticCurveTo(w, -(r1 + r2) / 2, 0, -r2); g.quadraticCurveTo(-w, -(r1 + r2) / 2, 0, -r1); g.stroke();
        g.restore();
      }
    }
    [R, R * 0.96, R * 0.6, R * 0.57, R * 0.3].forEach(function (r) { g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke(); });
    petals(32, R * 0.7, R * 0.95, 18); petals(16, R * 0.32, R * 0.58, 28); petals(12, R * 0.08, R * 0.29, 16, 0.5);
    g.fillStyle = 'rgba(255,184,107,.3)';
    for (var i = 0; i < 64; i++) { var a = i / 64 * TAU; g.beginPath(); g.arc(Math.cos(a) * R * 0.78, Math.sin(a) * R * 0.78, 3, 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(219,89,200,.28)';
    for (var k = 0; k < 16; k++) { var b = (k + 0.5) / 16 * TAU; g.beginPath(); g.arc(Math.cos(b) * R * 0.45, Math.sin(b) * R * 0.45, 4, 0, TAU); g.fill(); }
    g.restore();
  }
  function wrap(text, maxW) {
    var words = text.split(/\s+/), lines = [], line = '';
    words.forEach(function (w) {
      var t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
    });
    if (line) lines.push(line);
    return lines;
  }
  function tracked(text, x, y, track) {
    // canvas letterSpacing where supported, else manual tracking
    if ('letterSpacing' in ctx) { ctx.letterSpacing = track + 'px'; ctx.fillText(text, x + track / 2, y); ctx.letterSpacing = '0px'; return; }
    var w = 0, i; for (i = 0; i < text.length; i++) w += ctx.measureText(text[i]).width + track;
    var sx = x - (w - track) / 2, al = ctx.textAlign; ctx.textAlign = 'left';
    for (i = 0; i < text.length; i++) { ctx.fillText(text[i], sx, y); sx += ctx.measureText(text[i]).width + track; }
    ctx.textAlign = al;
  }
  function fitFont(spec, size, text, maxW, min) {
    var s = size;
    do { ctx.font = spec.replace('{s}', s); if (ctx.measureText(text).width <= maxW) break; s -= 4; } while (s > min);
    return s;
  }
  function drawDiya(th, t) {
    var sc = 3.4, w = 64 * sc, x0 = CW / 2 - w / 2, y0 = CH - 286;
    var body = P(DIYA_BODY, sc, sc, x0, y0), foot = P(DIYA_FOOT, sc, sc, x0, y0);
    // the lamp's own warm pool on the card
    if (S.lit) {
      var pool = ctx.createRadialGradient(CW / 2, y0 + 40, 10, CW / 2, y0 + 40, 380);
      pool.addColorStop(0, 'rgba(255,190,90,' + (0.34 * litK(t)).toFixed(3) + ')'); pool.addColorStop(1, 'rgba(255,190,90,0)');
      ctx.fillStyle = pool; ctx.fillRect(0, y0 - 380, CW, 760);
    }
    if (body) {
      var gr = ctx.createLinearGradient(0, y0 + 40, 0, y0 + 140);
      gr.addColorStop(0, th.diya[0]); gr.addColorStop(0.55, th.diya[1]); gr.addColorStop(1, th.diya[2]);
      ctx.fillStyle = gr; ctx.fill(body); ctx.fill(foot);
      ctx.strokeStyle = 'rgba(255,215,120,.55)'; ctx.lineWidth = 1.5;
      var rim = P('M5.5 18.3c8 1 19.6 1.5 27.5 1.4 9-.1 17.5-1 24.6-3.2', sc, sc, x0, y0); if (rim) ctx.stroke(rim);
    }
    // wick tip near the spout
    var fx = x0 + 52 * sc, fy = y0 + 14 * sc;
    if (!S.lit) { ctx.fillStyle = '#3A1606'; ctx.beginPath(); ctx.arc(fx, fy - 2, 4, 0, TAU); ctx.fill(); return; }
    var k = litK(t), still = E2M.reduced || E2M.isPaused();
    var fl = still ? 1 : 1 + 0.06 * Math.sin(t / 95) + 0.035 * Math.sin(t / 37 + 1.3);
    var sway = still ? 0 : 3 * Math.sin(t / 210);
    var fh = 120 * k * fl, fw = 34 * Math.min(1, k * 1.2);
    var halo = ctx.createRadialGradient(fx, fy - fh * 0.45, 4, fx, fy - fh * 0.45, 210);
    halo.addColorStop(0, 'rgba(255,214,140,' + (0.5 * k).toFixed(3) + ')'); halo.addColorStop(1, 'rgba(255,170,70,0)');
    ctx.fillStyle = halo; ctx.fillRect(fx - 220, fy - fh - 220, 440, 440 + fh);
    ctx.save(); ctx.translate(fx, fy);
    var fg = ctx.createRadialGradient(0, -fh * 0.22, 2, 0, -fh * 0.3, fh * 0.75);
    fg.addColorStop(0, '#FFFFFF'); fg.addColorStop(0.22, '#FFF1C4'); fg.addColorStop(0.5, '#FFC65A'); fg.addColorStop(0.78, '#FF9F32'); fg.addColorStop(1, 'rgba(232,100,26,0)');
    ctx.fillStyle = fg;
    ctx.beginPath(); ctx.moveTo(0, 4);
    ctx.bezierCurveTo(fw, 0, fw * 0.8, -fh * 0.5, sway, -fh);
    ctx.bezierCurveTo(-fw * 0.8, -fh * 0.5, -fw, 0, 0, 4);
    ctx.fill();
    ctx.fillStyle = 'rgba(130,170,255,.5)'; ctx.beginPath(); ctx.ellipse(0, -4, fw * 0.28, 7, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function litK(t) { if (!S.lit) return 0; if (E2M.reduced) return 1; var e = Math.min(1, (t - S.litAt) / 900); return 1 - Math.pow(1 - e, 3); }

  function draw(t) {
    t = t || performance.now();
    var th = TH[S.style];
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.drawImage(background(th, S.style), 0, 0);
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    // kicker
    ctx.fillStyle = th.soft; ctx.font = '400 24px Mukta, "Noto Sans Devanagari", sans-serif';
    tracked('E2M  ·  DIWALI 2026', CW / 2, 262, 7);
    // the headline: the hero's CAPITAL light serif
    ctx.fillStyle = th.accent;
    fitFont('300 {s}px "Cormorant Garamond", Georgia, serif', 112, 'HAPPY DIWALI', 760, 60);
    tracked('HAPPY DIWALI', CW / 2, 410, 12);
    // for {name}
    var to = toName() || 'everyone';
    ctx.fillStyle = th.ink;
    fitFont('italic 300 {s}px "Cormorant Garamond", Georgia, serif', 70, 'for ' + to, 720, 40);
    ctx.fillText('for ' + to, CW / 2, 500);
    // a short hairline rule with a diamond
    ctx.strokeStyle = th.line2; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(CW / 2 - 120, 560); ctx.lineTo(CW / 2 - 14, 560); ctx.moveTo(CW / 2 + 14, 560); ctx.lineTo(CW / 2 + 120, 560); ctx.stroke();
    ctx.save(); ctx.translate(CW / 2, 560); ctx.rotate(Math.PI / 4); ctx.fillStyle = th.line; ctx.fillRect(-4.5, -4.5, 9, 9); ctx.restore();
    // the wish
    ctx.fillStyle = th.ink2;
    var size = 54; ctx.font = 'italic 300 ' + size + 'px "Cormorant Garamond", Georgia, serif';
    var lines = wrap('“' + wishText() + '”', 740);
    while (lines.length > 4 && size > 38) { size -= 4; ctx.font = 'italic 300 ' + size + 'px "Cormorant Garamond", Georgia, serif'; lines = wrap('“' + wishText() + '”', 760); }
    var lh = size * 1.32, y = 660 + Math.max(0, (3 - lines.length)) * lh * 0.35;
    lines.forEach(function (l, i) { ctx.fillText(l, CW / 2, y + i * lh); });
    // signature
    ctx.fillStyle = th.ink;
    var sig = fromName() ? 'With love, ' + fromName() : 'With love, from all of us at E2M';
    fitFont('300 {s}px Mukta, "Noto Sans Devanagari", sans-serif', 30, sig, 700, 20);
    ctx.fillText(sig, CW / 2, Math.min(CH - 430, y + lines.length * lh + 70));
    drawDiya(th, t);
    // footer line
    ctx.fillStyle = th.soft; ctx.font = '400 21px Mukta, "Noto Sans Devanagari", sans-serif';
    tracked('ONE TEAM  ·  A THOUSAND LIGHTS', CW / 2, CH - 104, 6);
  }
  function describe() {
    var st = STYLES.filter(function (s) { return s.k === S.style; })[0];
    var text = 'Card preview, ' + st.name + ' style. Happy Diwali, for ' + (toName() || 'everyone') + '. “' + wishText() + '” ' +
      (fromName() ? 'With love, ' + fromName() + '.' : 'With love, from all of us at E2M.') + (S.lit ? ' A lit diya glows at the bottom.' : '');
    cv.setAttribute('aria-label', 'Wish card preview');
    desc.textContent = text;
  }
  var descT = 0;
  function refresh() {
    if (!raf) draw();
    clearTimeout(descT); descT = setTimeout(describe, 700);
  }
  function loop(t) {
    raf = 0;
    draw(t);
    var settling = S.lit && t - S.litAt < 1000;
    if (active && !D.hidden && S.lit && (settling || (!E2M.reduced && !E2M.isPaused()))) raf = requestAnimationFrame(loop);
  }
  function animate() { if (!raf && active) raf = requestAnimationFrame(loop); }

  function loadFonts() {
    if (!D.fonts || !D.fonts.load) { fontsReady = true; return Promise.resolve(); }
    return Promise.all([
      D.fonts.load('300 112px "Cormorant Garamond"', 'HAPPY DIWALI'),
      D.fonts.load('italic 300 54px "Cormorant Garamond"', 'May your'),
      D.fonts.load('400 30px Mukta', 'With love'),
      D.fonts.load('600 24px Mukta', 'E2M')
    ]).then(function () { fontsReady = true; }, function () { fontsReady = true; });
  }

  /* ------------------------------------------------------------------ */
  /* Actions                                                              */
  /* ------------------------------------------------------------------ */
  function fileName() {
    var n = (toName() || 'everyone').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'card';
    return 'e2m-diwali-card-' + n + '.png';
  }
  function cardText() { return 'Happy Diwali, ' + (toName() || 'everyone') + '! “' + wishText() + '” ' + (fromName() ? '— ' + fromName() : '— from all of us at E2M'); }
  function blob() {
    return loadFonts().then(function () {
      draw(performance.now() + 2000);
      return new Promise(function (res, rej) {
        if (cv.toBlob) cv.toBlob(function (b) { b ? res(b) : rej(new Error('no blob')); }, 'image/png');
        else { try { var d = cv.toDataURL('image/png'), bin = atob(d.split(',')[1]), a = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); res(new Blob([a], { type: 'image/png' })); } catch (e) { rej(e); } }
      });
    });
  }
  function centreOf(el) { var r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
  function download() {
    dlBtn.disabled = true;
    blob().then(function (b) {
      var url = URL.createObjectURL(b), a = D.createElement('a');
      a.href = url; a.download = fileName(); a.rel = 'noopener';
      D.body.appendChild(a); a.click(); a.parentNode.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      var c = centreOf(cv); E2M.fx.sparkBurst(c.x, c.y, '#FFD778', 18); E2M.audio.play('chime');
      if (E2M.impact) E2M.impact(0.25, { x: c.x, y: c.y, color: '#FFD778', kind: 'wish', haptic: 'success' });
      E2M.toast('Card saved. Hand-delivered by the internet.');
      E2M.announce('Card downloaded as ' + fileName());
    }).catch(function () { E2M.toast('That card refused to leave the studio. Try again?'); })
      .then(function () { dlBtn.disabled = false; });
  }
  function share() {
    var text = cardText();
    blob().then(function (b) {
      var file = null;
      try { file = new File([b], fileName(), { type: 'image/png' }); } catch (e) { file = null; }
      if (file && navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
        return navigator.share({ files: [file], title: 'Happy Diwali', text: text }).then(function () {
          E2M.announce('Card shared.'); E2M.toast('Shared. Somebody is about to smile.'); if (E2M.haptic) E2M.haptic('success');
        }, function () { /* cancelled */ });
      }
      return copyText(text);
    }).catch(function () { return copyText(text); });
  }
  function copyText(text) {
    function ok() { E2M.toast('No share sheet here, so the card text is copied. Paste it anywhere.'); E2M.announce('Card text copied to the clipboard.'); }
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).then(ok, fallback);
    fallback();
    function fallback() {
      var ta = D.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      D.body.appendChild(ta); ta.select();
      var done = false; try { done = D.execCommand('copy'); } catch (e) { done = false; }
      ta.parentNode.removeChild(ta);
      if (done) ok(); else E2M.toast('Copy this: ' + text, 7000);
    }
  }
  function lightDiya() {
    if (S.lit) {
      S.lit = false; diyaBtn.setAttribute('aria-pressed', 'false'); diyaBtn.querySelector('span').textContent = 'Light a diya for them';
      if (E2M.haptic) E2M.haptic('light');
      refresh(); E2M.announce('The card diya is out.');
      return;
    }
    S.lit = true; S.litAt = performance.now();
    diyaBtn.setAttribute('aria-pressed', 'true'); diyaBtn.querySelector('span').textContent = 'Diya lit · blow it out';
    var r = cv.getBoundingClientRect(), fx = r.left + r.width * ((CW / 2 - 108.8 + 52 * 3.4) / CW), fy = r.top + r.height * ((CH - 286 + 14 * 3.4) / CH);
    E2M.audio.play('flick'); setTimeout(function () { E2M.audio.play('chime'); }, 200);
    E2M.fx.sparkBurst(fx, fy, '#FFD778', 14);
    if (E2M.impact) E2M.impact(0.2, { x: fx, y: fy, color: '#FF9F32', kind: 'diya', haptic: 'success' });
    // R4: the rest of the page is calm dark space, so the flame only warms the card's surroundings a little
    if (E2M.screenGlow) E2M.screenGlow('#FF9F32', 0.28, fx, fy);
    E2M.announce('A diya is lit on the card for ' + (toName() || 'everyone') + '.');
    animate(); describe();
  }

  /* ------------------------------------------------------------------ */
  /* Radiogroups (roving tabindex + arrows)                               */
  /* ------------------------------------------------------------------ */
  function roving(group, onPick) {
    group.addEventListener('click', function (e) { var b = e.target.closest('[role="radio"]'); if (b && group.contains(b)) select(b); });
    group.addEventListener('keydown', function (e) {
      var b = e.target.closest('[role="radio"]'); if (!b) return;
      var all = Array.prototype.slice.call(group.querySelectorAll('[role="radio"]')), i = all.indexOf(b), n = all.length;
      var k = e.key, next = -1;
      if (k === 'ArrowDown' || k === 'ArrowRight') next = (i + 1) % n;
      else if (k === 'ArrowUp' || k === 'ArrowLeft') next = (i - 1 + n) % n;
      else if (k === 'Home') next = 0; else if (k === 'End') next = n - 1;
      if (next < 0) return;
      e.preventDefault(); all[next].focus(); select(all[next]);
    });
    function select(b) {
      group.querySelectorAll('[role="radio"]').forEach(function (r) { var on = r === b; r.setAttribute('aria-checked', on ? 'true' : 'false'); r.tabIndex = on ? 0 : -1; });
      if (E2M.haptic) E2M.haptic('select');
      onPick(b);
    }
  }

  E2M.register('wish', {
    mount: function (stage) {
      build(stage);
      draw();
      loadFonts().then(function () { bgCache = {}; draw(); describe(); });
      describe();
      toIn.addEventListener('input', function () { S.to = toIn.value; refresh(); });
      fromIn.addEventListener('input', function () { S.from = fromIn.value; refresh(); });
      ownIn.addEventListener('input', function () {
        S.custom = ownIn.value.slice(0, 90); countEl.textContent = S.custom.length; refresh();
        if (S.custom.length >= 90) E2M.announce('90 characters, the limit.');
      });
      roving(root.querySelector('.wc-wishes'), function (b) {
        var v = b.getAttribute('data-wish');
        S.own = v === 'own'; if (!S.own) S.wish = +v;
        ownWrap.hidden = !S.own;
        if (S.own) setTimeout(function () { ownIn.focus(); }, 30);
        refresh(); E2M.audio.play('pop');
      });
      roving(root.querySelector('.wc-styles'), function (b) {
        S.style = b.getAttribute('data-style'); refresh(); E2M.audio.play('sparkle');
        var c = centreOf(cv); if (E2M.impact) E2M.impact(0.12, { x: c.x, y: c.y, color: '#FFD778', kind: 'wish-style' });
      });
      dlBtn.addEventListener('click', download);
      shareBtn.addEventListener('click', share);
      diyaBtn.addEventListener('click', lightDiya);
      E2M.on('prefs:change', function () { refresh(); if (S.lit) animate(); });
      D.addEventListener('visibilitychange', function () { if (!D.hidden && active && S.lit) animate(); });
    },
    onEnter: function () { active = true; if (S.lit) animate(); },
    onLeave: function () { active = false; if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  });
})();
