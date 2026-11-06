/* Activity II — Light Up the Diya (Revision 4: the Lakshmi shrine).
   One framed stage: a temple-niche shrine (corbelled lintel, a small Nagara shikhara crest) holding a custom
   SVG Gajalakshmi — the goddess seated on a full-bloom pink lotus, four arms (two lotuses, abhaya mudra, a hand
   showering gold coins), kirita crown, prabha halo, red-and-gold sari, two attendant elephants raising water
   pots, a lotus pond — and a brass diya on a stand in front of her. The scene starts in night blue; lighting the
   diya runs a light sequence (aura, god-rays from the diya and the crown, golden motes spiralling round her,
   coins falling from her hand, the lotus opening a little, the pots and water shimmering, stars brightening).
   Revision 5: once lit, the SUN rises — long soft rays fan out from behind her across the whole viewport (a
   fixed layer between the sky and the page, see "the sun" below) with a warm dawn lift, tied to how much of the
   shrine is on screen. Lakshmi stays clean: the art is two SVGs (back: wall, light, halo, elephants, pond;
   front: lotus throne, the goddess, coins, diya, frame) with the motes canvas BETWEEN them, so no particle,
   ray or glow is ever drawn over her; the coin stream and heap sit outside her silhouette. No <title> on the
   art (it rendered a native hover tooltip): role="img" + aria-label + aria-describedby instead.
   Compat: E2M.lightAllDiyas() lights it (if unlit) with the full effect, E2M.state.diyas is [lit] (length 1),
   'diyas:allLit' is emitted once, the first time it is lit. */
(function () {
  'use strict';
  var E2M = window.E2M;
  if (!E2M) return;
  var W = window, D = document, rand = E2M.rand, pick = E2M.pick, TAU = Math.PI * 2;
  var VW = 800, VH = 860, FX = 400, FY = 744; // the flame's base in the art

  function f(n) { return Math.round(n * 10) / 10; }

  /* ------------------------------------------------------------------ */
  /* Art helpers                                                          */
  /* ------------------------------------------------------------------ */
  // a lotus petal with its base at 0,0 pointing up (h > 0) or down (h < 0)
  function petal(w, h) {
    return 'M0 0C' + f(-w * 0.56) + ' ' + f(-h * 0.3) + ' ' + f(-w * 0.44) + ' ' + f(-h * 0.8) + ' 0 ' + f(-h) +
      'C' + f(w * 0.44) + ' ' + f(-h * 0.8) + ' ' + f(w * 0.56) + ' ' + f(-h * 0.3) + ' 0 0Z';
  }
  function lin(id, stops, x2, y2) {
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + (x2 || 0) + '" y2="' + (y2 == null ? 1 : y2) + '">' +
      stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : '') + '/>'; }).join('') + '</linearGradient>';
  }
  function rad(id, cx, cy, r, stops) {
    return '<radialGradient id="' + id + '" gradientUnits="userSpaceOnUse" cx="' + cx + '" cy="' + cy + '" r="' + r + '">' +
      stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '" stop-opacity="' + s[2] + '"/>'; }).join('') + '</radialGradient>';
  }
  function seeded(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  var NICHE = 'M40 852V164H54V148H70V132H730V148H746V164H760V852Z';
  var NICHE_IN = 'M52 840V174H64V158H80V144H720V158H736V174H748V840Z';

  function defs() {
    return '<defs>' +
      '<clipPath id="lk-clip"><path d="' + NICHE + '"/></clipPath>' +
      lin('lk-night', [[0, '#0D1338'], [0.45, '#090D27'], [1, '#05070F']]) +
      lin('lk-gold', [[0, '#FFF1BE'], [0.42, '#F2C25A'], [1, '#A86F18']], 0.4, 1) +
      lin('lk-gold-dk', [[0, '#E6B451'], [1, '#7A4A0C']]) +
      lin('lk-skin', [[0, '#F8D6AE'], [1, '#E2A979']]) +
      lin('lk-skin-arm', [[0, '#F1C596'], [1, '#D7975F']], 1, 0) +
      lin('lk-sari', [[0, '#D21E43'], [0.6, '#A9122F'], [1, '#7C0A22']]) +
      lin('lk-pallu', [[0, '#B5132F'], [1, '#7A0920']], 1, 1) +
      lin('lk-blouse', [[0, '#C9183A'], [1, '#8E0C27']]) +
      lin('lk-petal', [[0, '#FCD8E2'], [0.45, '#EE8AA8'], [1, '#B42C5A']]) +
      lin('lk-petal-bk', [[0, '#F2B2C6'], [0.5, '#C9567D'], [1, '#7E1B44']]) +
      lin('lk-petal-dn', [[0, '#9C2450'], [0.55, '#D86A90'], [1, '#F7C3D2']]) +
      lin('lk-ele', [[0, '#9C9AC2'], [0.55, '#6E6B98'], [1, '#3E3B68']]) +
      lin('lk-ele-dk', [[0, '#7C79A6'], [1, '#34315C']]) +
      lin('lk-jhool', [[0, '#B8143A'], [1, '#6E0820']]) +
      lin('lk-water', [[0, '#0B1534', 0], [0.12, '#0B1534', 0.92], [1, '#05070F', 1]]) +
      lin('lk-pad', [[0, '#2A6670'], [1, '#123A42']]) +
      lin('lk-brass', [[0, '#FFE9A8'], [0.45, '#D9A441'], [1, '#6E430B']], 1, 1) +
      lin('lk-oil', [[0, '#3A1A06'], [1, '#160903']]) +
      lin('lk-fo', [[0, '#FF6A1A', 0], [0.25, '#FF7A22'], [1, '#FFB547']], 0, 1) +
      lin('lk-fm', [[0, '#FFC24A'], [1, '#FFE7A3']]) +
      rad('lk-aura', 400, 300, 360, [[0, '#FFE8B0', 0.62], [0.32, '#FFC266', 0.3], [0.62, '#FF8A3D', 0.09], [1, '#FF8A3D', 0]]) +
      // Revision 5: the shrine's back wall warms to a sunrise once the diya is lit (behind everything else)
      rad('lk-dawn', 400, 250, 700, [[0, '#FFE9BC', 0.62], [0.2, '#FFCB80', 0.42], [0.46, '#E9925E', 0.24], [0.75, '#9C4F6E', 0.16], [1, '#4A2A5E', 0.12]]) +
      rad('lk-pool', 400, 744, 260, [[0, '#FFD98A', 0.55], [0.4, '#FFAA4A', 0.18], [1, '#FF8A3D', 0]]) +
      rad('lk-rayg', 400, 236, 560, [[0, '#FFEBB0', 0.6], [0.35, '#FFD778', 0.2], [1, '#FFD778', 0]]) +
      rad('lk-drayg', 400, 720, 420, [[0, '#FFE2A0', 0.55], [0.5, '#FFC266', 0.14], [1, '#FFC266', 0]]) +
      rad('lk-halo', 400, 236, 104, [[0, '#FFE9B0', 0], [0.7, '#FFD778', 0.1], [0.94, '#FFD778', 0.32], [1, '#FFD778', 0.06]]) +
      rad('lk-halo-lit', 400, 236, 120, [[0, '#FFF6D8', 0.75], [0.55, '#FFE3A0', 0.42], [0.86, '#FFD778', 0.3], [1, '#FFD778', 0]]) +
      rad('lk-glow', 0, 0, 40, [[0, '#FFF6D8', 1], [0.35, '#FFD778', 0.55], [1, '#FF9F32', 0]]) +
      rad('lk-coin', 0, -1.5, 6.5, [[0, '#FFF6CC', 1], [0.6, '#F2C25A', 1], [1, '#A86F18', 1]]) +
      '</defs>';
  }

  /* the shrine's back wall: a faint hairline mandala, stars */
  function backWall() {
    var s = '<rect width="800" height="860" fill="url(#lk-night)"/><rect class="lk-dawn" width="800" height="860" fill="url(#lk-dawn)"/>', i, rnd = seeded(1105);
    s += '<g class="lk-wall" fill="none" stroke="#FFD778" stroke-opacity=".08" stroke-width="1">';
    [262, 226, 188].forEach(function (r, k) { s += '<circle cx="400" cy="300" r="' + r + '"' + (k === 1 ? ' stroke-dasharray="2 7"' : '') + '/>'; });
    for (i = 0; i < 36; i++) s += '<path transform="translate(400 300) rotate(' + (i * 10) + ')" d="M0 -232C9 -240 9 -252 0 -258C-9 -252 -9 -240 0 -232Z"/>';
    s += '</g><g class="lk-stars">';
    for (i = 0; i < 54; i++) {
      var x = 60 + rnd() * 680, y = 150 + Math.pow(rnd(), 1.3) * 380, r = rnd() < 0.15 ? 1.6 : 0.7 + rnd() * 0.7;
      s += '<circle class="lk-star" cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(r) + '" style="--d:-' + f(rnd() * 6) + 's;--t:' + f(3 + rnd() * 4) + 's"/>';
    }
    return s + '</g>';
  }

  /* light: god-rays from the crown, rays fanning from the diya, the aura, the pool of lamplight */
  function lights() {
    var s = '<g class="lk-rays-wrap"><g class="lk-rays">', i;
    for (i = 0; i < 28; i++) {
      var a = i * 360 / 28, hw = i % 2 ? 1.1 : 1.9, L = i % 2 ? 470 : 560;
      var a1 = (a - hw) * Math.PI / 180, a2 = (a + hw) * Math.PI / 180;
      s += '<path class="lk-ray" style="--i:' + (i % 14) + '" d="M400 236L' + f(400 + Math.sin(a1) * L) + ' ' + f(236 - Math.cos(a1) * L) + 'L' + f(400 + Math.sin(a2) * L) + ' ' + f(236 - Math.cos(a2) * L) + 'Z"/>';
    }
    s += '</g></g><circle class="lk-aura" cx="400" cy="300" r="360" fill="url(#lk-aura)"/>';
    s += '<g class="lk-drays">';
    for (i = 0; i < 11; i++) {
      var b = -75 + i * 15, w2 = 2.6, L2 = 430 - Math.abs(b) * 1.3;
      var b1 = (b - w2) * Math.PI / 180, b2 = (b + w2) * Math.PI / 180;
      s += '<path class="lk-dray" style="--i:' + Math.abs(i - 5) + '" d="M400 720L' + f(400 + Math.sin(b1) * L2) + ' ' + f(720 - Math.cos(b1) * L2) + 'L' + f(400 + Math.sin(b2) * L2) + ' ' + f(720 - Math.cos(b2) * L2) + 'Z"/>';
    }
    return s + '</g>';
  }

  /* the prabha: a halo with a ring of flame tongues (jwala) */
  function halo() {
    var s = '<g class="lk-halo"><circle cx="400" cy="236" r="104" fill="url(#lk-halo)"/>' +
      '<circle cx="400" cy="236" r="100" fill="none" stroke="url(#lk-gold)" stroke-width="2.4"/>' +
      '<circle cx="400" cy="236" r="91" fill="none" stroke="#FFD778" stroke-opacity=".45" stroke-width="1" stroke-dasharray="1.5 5"/><g fill="url(#lk-gold)">';
    for (var i = 0; i < 30; i++) s += '<path transform="translate(400 236) rotate(' + (i * 12) + ')" d="M0 -102C5 -107 6 -113 0 -122C-6 -113 -5 -107 0 -102Z"/>';
    return s + '</g><circle class="lk-halo-lit" cx="400" cy="236" r="120" fill="url(#lk-halo-lit)"/></g>';
  }

  /* a kalasha pot (centre 0,0, mouth up), tipped to pour */
  function pot(tx, ty, rot) {
    return '<g transform="translate(' + tx + ' ' + ty + ') rotate(' + rot + ')">' +
      '<path d="M-19 2C-19 -12 -10 -20 0 -20C10 -20 19 -12 19 2C19 15 10 22 0 22C-10 22 -19 15 -19 2Z" fill="url(#lk-gold)"/>' +
      '<path d="M-17 0H17M-15 9H15" stroke="#7A4A0C" stroke-opacity=".55" stroke-width="1.2"/>' +
      '<rect x="-7" y="-28" width="14" height="9" fill="url(#lk-gold-dk)"/><ellipse cy="-29" rx="12" ry="3.6" fill="url(#lk-gold)" stroke="#7A4A0C" stroke-opacity=".5"/>' +
      '<path class="lk-pot-glint" d="M-11 -8C-9 -14 -4 -17 2 -17" stroke="#FFFBEA" stroke-width="2.4" stroke-linecap="round" fill="none"/></g>';
  }

  /* one attendant elephant facing right (the other is a mirror) */
  function elephant() {
    var s = '<g class="lk-ele" transform="translate(-8 45) scale(.8)">';
    // pedestal lotus pad
    s += '<ellipse cx="178" cy="600" rx="118" ry="15" fill="url(#lk-pad)" stroke="#8FE0D2" stroke-opacity=".18"/>';
    for (var i = 0; i < 7; i++) s += '<path transform="translate(' + (98 + i * 27) + ' 598) rotate(' + ((i - 3) * 9) + ')" d="' + petal(22, 22) + '" fill="url(#lk-petal-bk)" opacity=".8"/>';
    // far legs, body, near legs
    s += '<path d="M128 500L130 584C130 590 134 594 140 594H156C162 594 164 590 164 584L162 502Z" fill="url(#lk-ele-dk)"/>' +
      '<path d="M200 500L203 584C203 590 207 594 213 594H229C235 594 238 590 238 584L235 498Z" fill="url(#lk-ele-dk)"/>' +
      '<path d="M84 468C82 418 116 380 172 374C222 368 262 384 276 418C286 444 282 484 270 506C262 520 246 526 228 526H120C98 524 86 500 84 468Z" fill="url(#lk-ele)"/>' +
      '<path d="M88 452C82 470 78 494 82 512" fill="none" stroke="#43406E" stroke-width="3" stroke-linecap="round"/><path d="M78 508l4 12 6-11z" fill="#2A2850"/>' +
      '<path d="M96 494L100 588C100 594 106 598 112 598H132C138 598 142 594 142 588L140 498Z" fill="url(#lk-ele)"/>' +
      '<path d="M226 496L230 588C230 594 236 598 242 598H262C268 598 272 594 272 588L268 494Z" fill="url(#lk-ele)"/>' +
      '<g fill="#F3EBD9" opacity=".8"><path d="M104 598a5 4 0 0 1 10 0zM116 598a5 4 0 0 1 10 0zM128 598a5 4 0 0 1 10 0z"/><path d="M234 598a5 4 0 0 1 10 0zM246 598a5 4 0 0 1 10 0zM258 598a5 4 0 0 1 10 0z"/></g>' +
      '<g fill="url(#lk-gold)"><rect x="99" y="566" width="42" height="5"/><rect x="229" y="566" width="42" height="5"/></g>' +
      '<g fill="#FFD778"><circle cx="106" cy="575" r="2.2"/><circle cx="120" cy="576" r="2.2"/><circle cx="134" cy="575" r="2.2"/><circle cx="236" cy="575" r="2.2"/><circle cx="250" cy="576" r="2.2"/><circle cx="264" cy="575" r="2.2"/></g>';
    // the jhool (ceremonial cloth) with a gold border and tassels
    s += '<path d="M128 384C156 372 212 370 242 382C246 410 248 436 246 456C218 474 158 476 126 458C124 434 124 408 128 384Z" fill="url(#lk-jhool)"/>' +
      '<path d="M128 384C156 372 212 370 242 382C246 410 248 436 246 456C218 474 158 476 126 458C124 434 124 408 128 384Z" fill="none" stroke="url(#lk-gold)" stroke-width="4"/>' +
      '<path d="M136 394C162 384 208 382 234 392C237 414 238 434 237 448C212 462 162 464 135 450C133 432 133 412 136 394Z" fill="none" stroke="#FFD778" stroke-opacity=".55" stroke-width="1"/>' +
      '<g fill="#FFD778" opacity=".75"><circle cx="160" cy="418" r="2.4"/><circle cx="186" cy="412" r="2.4"/><circle cx="212" cy="416" r="2.4"/><circle cx="172" cy="440" r="2.4"/><circle cx="200" cy="438" r="2.4"/><circle cx="186" cy="426" r="3.4"/></g>';
    for (var t = 0; t < 7; t++) { var tx = 132 + t * 18.5, ty = 459 + Math.sin(t / 6 * Math.PI) * 11; s += '<path d="M' + tx + ' ' + f(ty) + 'v7" stroke="#FFD778" stroke-width="1.2"/><circle cx="' + tx + '" cy="' + f(ty + 10) + '" r="2.4" fill="url(#lk-gold)"/>'; }
    // head, ear, eye, tusk
    s += '<path d="M246 380C258 350 292 334 322 344C350 354 360 384 352 414C346 436 330 448 312 452C292 456 270 446 258 430Z" fill="url(#lk-ele)"/>' +
      '<path d="M264 382C242 382 226 404 228 432C230 456 248 470 270 462C278 446 278 408 264 382Z" fill="url(#lk-ele-dk)"/>' +
      '<g fill="#E9B7C6" opacity=".45"><circle cx="246" cy="420" r="3"/><circle cx="252" cy="436" r="2.4"/><circle cx="242" cy="440" r="2"/></g>' +
      '<path d="M320 384Q329 378 337 385Q329 390 320 384Z" fill="#14122A"/><circle cx="331" cy="383.5" r="1" fill="#fff" opacity=".7"/>' +
      '<path d="M326 438C334 454 350 462 372 458C356 454 344 444 338 432Z" fill="#F6EEDC"/>';
    // the raised trunk, curling round the pot
    s += '<path d="M350 404C366 362 366 300 350 262C342 242 332 224 318 210L304 218C316 232 324 250 332 272C344 312 340 360 326 412Z" fill="url(#lk-ele)"/>' +
      '<path d="M334 400c6 1 12 1 18-2M338 374c6 1 11 1 16-2M339 348c6 1 10 0 15-3M337 322c5 1 9-1 13-4M332 296c5 0 8-2 12-5M325 272c4 0 7-3 10-6" fill="none" stroke="#34315C" stroke-opacity=".55" stroke-width="1.2"/>';
    // the gold forehead plate (nettipattam-like) with a ruby and tassels
    s += '<path d="M292 344L316 340L330 370L308 396L288 368Z" fill="url(#lk-gold)" stroke="#7A4A0C" stroke-opacity=".5"/>' +
      '<circle cx="309" cy="366" r="5" fill="#C8173A" stroke="#FFE7A3" stroke-width="1"/>' +
      '<g fill="url(#lk-gold)"><circle cx="300" cy="352" r="2.2"/><circle cx="318" cy="350" r="2.2"/><circle cx="308" cy="384" r="2.2"/></g>' +
      '<path d="M308 396v12M302 392v10M314 392v10" stroke="#FFD778" stroke-width="1.1"/>';
    s += pot(296, 194, 72);
    return s + '</g>';
  }

  /* water poured from the pots over the goddess: a few shimmering strands */
  function streams() {
    var L = 'M254 190C282 178 304 190 314 214C322 234 324 262 322 296', s = '<g class="lk-streams" fill="none" stroke-linecap="round">';
    [[0, 3, '.85'], [6, 1.8, '.66'], [-6, 1.3, '.55']].forEach(function (o) {
      var d = L.replace(/(\d+(?:\.\d+)?) (\d+(?:\.\d+)?)/g, function (m, x, y) { return (Number(x) + o[0]) + ' ' + y; });
      s += '<path class="lk-stream" d="' + d + '" stroke="#DDEEFF" stroke-opacity="' + o[2] + '" stroke-width="' + o[1] + '"/>';
      s += '<path class="lk-stream" transform="matrix(-1 0 0 1 800 0)" d="' + d + '" stroke="#DDEEFF" stroke-opacity="' + o[2] + '" stroke-width="' + o[1] + '"/>';
    });
    return s + '</g>';
  }

  /* the padmapitha: a back row and a front row of upturned petals, a gold seed-pod rim, down-turned petals */
  function lotusBack() {
    var s = '<g class="lk-lotus-back">', i;
    for (i = -4; i <= 4; i++) {
      var x = 400 + i * 46, y = 526 - (4 - Math.abs(i)) * 2.5, h = 96 - Math.abs(i) * 7, tilt = i * 11;
      s += '<g transform="translate(' + x + ' ' + f(y) + ') rotate(' + tilt + ')"><path class="lk-pet" style="--o:' + f(i * 1.6) + '" d="' + petal(52, h) + '" fill="url(#lk-petal-bk)"/></g>';
    }
    return s + '</g>';
  }
  function lotusFront() {
    var s = '<g class="lk-lotus-front">', i;
    // upturned front petals at the sides (the centre ones would hide her)
    [-5, -4, -3, 3, 4, 5].forEach(function (k) {
      var x = 400 + k * 40, y = 532, h = 64 - Math.abs(k) * 3, tilt = k * 12;
      s += '<g transform="translate(' + x + ' ' + y + ') rotate(' + tilt + ')"><path class="lk-pet" style="--o:' + f(k * 1.8) + '" d="' + petal(44, h) + '" fill="url(#lk-petal)" stroke="#FFF1F5" stroke-opacity=".35" stroke-width=".8"/>' +
        '<path d="M0 -6V' + f(-h * 0.78) + '" stroke="#FFF1F5" stroke-opacity=".35" stroke-width=".8"/></g>';
    });
    s += '<ellipse cx="400" cy="532" rx="206" ry="17" fill="url(#lk-gold)"/><ellipse cx="400" cy="529" rx="198" ry="11" fill="none" stroke="#7A4A0C" stroke-opacity=".45"/>';
    for (i = 0; i < 25; i++) { var a = (i / 24) * Math.PI; s += '<circle cx="' + f(400 - Math.cos(a) * 194) + '" cy="' + f(538 + Math.sin(a) * 6) + '" r="2" fill="#FFF1BE"/>'; }
    for (i = -5; i <= 5; i++) {
      var dx = 400 + i * 37, dy = 546 - Math.abs(i) * 1.2, dh = -(56 - Math.abs(i) * 2.6);
      s += '<g transform="translate(' + dx + ' ' + f(dy) + ') rotate(' + (-i * 7) + ')"><path d="' + petal(40, dh) + '" fill="url(#lk-petal-dn)" stroke="#FFE7A3" stroke-opacity=".3" stroke-width=".8"/></g>';
    }
    return s + heap() + '</g>';
  }

  /* a small lotus bloom held in a hand (centre at the bloom's base) */
  function bloom(x, y) {
    var s = '<g transform="translate(' + x + ' ' + y + ')">';
    [[-30, 20, 26], [30, 20, 26], [-14, 22, 32], [14, 22, 32], [0, 22, 36]].forEach(function (p) {
      s += '<g transform="rotate(' + p[0] + ')"><path d="' + petal(p[1], p[2]) + '" fill="url(#lk-petal)" stroke="#FFF1F5" stroke-opacity=".45" stroke-width=".7"/></g>';
    });
    return s + '<ellipse cx="0" cy="1" rx="9" ry="3" fill="url(#lk-gold)"/></g>';
  }

  /* the goddess */
  function lakshmi() {
    var s = '<g class="lk-devi">';
    // hair behind
    s += '<path d="M366 212C356 252 350 302 338 356L462 356C450 302 444 252 434 212C430 198 416 190 400 190C384 190 370 198 366 212Z" fill="#170C1C"/>';
    // back arms holding lotuses
    s += '<path d="M352 312C334 316 316 330 303 352L316 362C326 344 340 334 358 328Z" fill="url(#lk-skin-arm)"/>' +
      '<path d="M303 352C297 334 298 312 303 292L316 293C313 312 314 336 316 362Z" fill="url(#lk-skin-arm)"/>' +
      '<path d="M448 312C466 316 484 330 497 352L484 362C474 344 460 334 442 328Z" fill="url(#lk-skin-arm)"/>' +
      '<path d="M497 352C503 334 502 312 497 292L484 293C487 312 486 336 484 362Z" fill="url(#lk-skin-arm)"/>' +
      '<g fill="url(#lk-gold)"><rect x="302" y="300" width="15" height="3" rx="1.5"/><rect x="302" y="305" width="15" height="2.4" rx="1.2"/><rect x="483" y="300" width="15" height="3" rx="1.5"/><rect x="483" y="305" width="15" height="2.4" rx="1.2"/></g>' +
      '<path d="M309 291V250M491 291V250" stroke="#4E7B4A" stroke-width="2.4"/>' +
      '<ellipse cx="309.5" cy="290" rx="8.5" ry="7" fill="#EFC08F"/><ellipse cx="490.5" cy="290" rx="8.5" ry="7" fill="#EFC08F"/>' +
      bloom(309, 252) + bloom(491, 252);
    // torso, midriff
    s += '<path d="M344 312C352 298 372 292 400 292C428 292 448 298 456 312C462 334 458 364 452 384C446 404 430 418 400 420C370 418 354 404 348 384C342 364 338 334 344 312Z" fill="url(#lk-skin)"/>' +
      '<path d="M398 392q2 3 4 0" fill="none" stroke="#B87A4E" stroke-width="1.2" stroke-linecap="round"/>';
    // blouse with gold trim
    s += '<path d="M346 316C356 302 376 297 400 297C424 297 444 302 454 316C456 336 452 352 446 360C432 368 416 366 400 360C384 366 368 368 354 360C348 352 344 336 346 316Z" fill="url(#lk-blouse)"/>' +
      '<path d="M354 360C368 368 384 366 400 360C416 366 432 368 446 360" fill="none" stroke="url(#lk-gold)" stroke-width="3"/>';
    // neck, necklaces, pendant
    s += '<path d="M388 266V298H412V266Z" fill="#E7B286"/><path d="M388 284C394 290 406 290 412 284V298H388Z" fill="#D59A68" opacity=".7"/>' +
      '<path d="M372 300C384 318 416 318 428 300" fill="none" stroke="url(#lk-gold)" stroke-width="3.4"/>' +
      '<path d="M366 304C378 338 422 338 434 304" fill="none" stroke="url(#lk-gold)" stroke-width="2.4"/>' +
      '<g fill="#FFF1BE">' + (function () { var b = ''; for (var i = 0; i < 9; i++) { var t = i / 8, x = 372 + t * 56, y = 300 + Math.sin(t * Math.PI) * 13.5; b += '<circle cx="' + f(x) + '" cy="' + f(y + 0.5) + '" r="1.5"/>'; } return b; })() + '</g>' +
      '<path d="M393 330Q400 320 407 330Q405 341 400 346Q395 341 393 330Z" fill="url(#lk-gold)"/><circle cx="400" cy="333" r="3" fill="#C8173A"/>';
    // the pallu across the chest and falling behind her left shoulder
    s += '<path d="M452 306C470 330 474 380 468 432L452 430C456 386 452 342 446 318Z" fill="url(#lk-pallu)"/>' +
      '<path d="M440 298C456 302 464 318 460 336C430 360 386 392 358 416L340 402C370 374 410 338 440 298Z" fill="url(#lk-pallu)"/>' +
      '<path d="M440 298C456 302 464 318 460 336C430 360 386 392 358 416" fill="none" stroke="url(#lk-gold)" stroke-width="3.2"/>' +
      '<path d="M440 298C410 338 370 374 340 402" fill="none" stroke="url(#lk-gold)" stroke-width="2"/>' +
      '<g fill="#FFD778" opacity=".8"><circle cx="424" cy="334" r="1.8"/><circle cx="404" cy="354" r="1.8"/><circle cx="384" cy="372" r="1.8"/><circle cx="364" cy="390" r="1.8"/><circle cx="440" cy="318" r="1.8"/></g>';
    // lower arms: abhaya (her right) and the coin-showering hand (her left)
    s += '<path d="M352 318C342 340 335 366 334 392L348 394C348 368 352 344 362 326Z" fill="url(#lk-skin-arm)"/>' +
      '<path d="M334 392C330 378 330 364 332 352L345 352C344 366 346 380 348 394Z" fill="url(#lk-skin-arm)"/>' +
      '<rect x="331" y="356" width="15" height="3" rx="1.5" fill="url(#lk-gold)"/><rect x="331" y="361" width="15" height="2.4" rx="1.2" fill="url(#lk-gold)"/>' +
      '<path d="M329 354C327 342 327 332 328 324C328 320 332 320 332 324L333 331L334 319C334 315 338 315 338 319L339 330L340 317C340 313 344 313 344 317L344 330L345 321C345 317 349 317 349 321L349 341C352 337 356 338 355 343C353 349 350 353 346 357Z" fill="#F1C596" stroke="#C98A5C" stroke-opacity=".5" stroke-width=".6"/>' +
      '<circle cx="339" cy="342" r="2.6" fill="#C8173A" opacity=".85"/>' +
      '<path d="M448 318C458 340 465 366 466 392L452 394C452 368 448 344 438 326Z" fill="url(#lk-skin-arm)"/>' +
      '<path d="M454 388C466 396 478 406 488 416L479 428C469 418 459 410 450 402Z" fill="url(#lk-skin-arm)"/>' +
      '<g fill="url(#lk-gold)"><rect x="472" y="406" width="4" height="15" rx="1.5" transform="rotate(-48 474 413)"/><rect x="477" y="410" width="3" height="15" rx="1.2" transform="rotate(-48 478 417)"/></g>' +
      '<path d="M481 414C491 412 499 418 501 428L503 446C503 450 499 450 498 446L496 436L497 450C497 454 493 454 492 450L490 436L490 450C490 454 486 454 485 450L484 434L483 444C482 448 478 447 478 443L477 428C476 420 477 416 481 414Z" fill="#F1C596" stroke="#C98A5C" stroke-opacity=".5" stroke-width=".6"/>';
    // waist belt and the seated lower body in the sari
    s += '<path d="M302 488C300 452 330 422 362 414C380 420 420 420 438 414C470 422 500 452 498 488C496 512 470 528 400 530C330 528 304 512 302 488Z" fill="url(#lk-sari)"/>' +
      '<path d="M392 420L378 528M400 420V530M408 420L422 528" stroke="#5E0718" stroke-opacity=".6" stroke-width="1.2"/>' +
      '<path d="M310 500C334 522 466 522 490 500" fill="none" stroke="url(#lk-gold)" stroke-width="5"/>' +
      '<path d="M316 510C340 528 460 528 484 510" fill="none" stroke="#FFD778" stroke-opacity=".6" stroke-width="1"/>' +
      '<g fill="#FFD778" opacity=".7"><circle cx="340" cy="470" r="2"/><circle cx="364" cy="486" r="2"/><circle cx="436" cy="486" r="2"/><circle cx="460" cy="470" r="2"/><circle cx="330" cy="494" r="2"/><circle cx="470" cy="494" r="2"/></g>' +
      '<path d="M474 468C474 459 466 455 456 457L436 461C428 462 424 467 427 472C430 477 437 478 445 478L461 480C469 481 474 476 474 468Z" fill="#F6CFA6" stroke="#C8173A" stroke-width="2.2"/>' +
      '<g fill="#F6CFA6" stroke="#C8173A" stroke-width="1"><circle cx="425" cy="463" r="3"/><circle cx="423" cy="469" r="2.6"/><circle cx="424" cy="474.5" r="2.4"/></g>' +
      '<path d="M470 461c-3 6-3 12 0 17" fill="none" stroke="url(#lk-gold)" stroke-width="2" stroke-dasharray="1.6 1.6"/>' +
      '<path d="M326 480C326 471 334 467 344 469L364 473C372 474 376 479 373 484C370 489 363 490 355 490L339 492C331 493 326 488 326 480Z" fill="#F6CFA6" stroke="#C8173A" stroke-width="2.2"/>' +
      '<g fill="#F6CFA6" stroke="#C8173A" stroke-width="1"><circle cx="375" cy="475" r="3"/><circle cx="377" cy="481" r="2.6"/><circle cx="376" cy="486.5" r="2.4"/></g>' +
      '<path d="M330 473c3 6 3 12 0 17" fill="none" stroke="url(#lk-gold)" stroke-width="2" stroke-dasharray="1.6 1.6"/>' +
      '<path d="M318 470C334 456 350 452 366 454M482 470C466 456 450 452 434 454" fill="none" stroke="#5E0718" stroke-opacity=".55" stroke-width="1.4"/>' +
      '<path d="M352 404C370 416 430 416 448 404L450 414C430 426 370 426 350 414Z" fill="url(#lk-gold)"/><circle cx="400" cy="418" r="3.6" fill="#C8173A" stroke="#FFE7A3"/>';
    // face
    s += '<path d="M370 226C370 202 384 196 400 196C416 196 430 202 430 226C430 252 418 272 400 276C382 272 370 252 370 226Z" fill="url(#lk-skin)"/>' +
      '<ellipse cx="368" cy="240" rx="4" ry="8" fill="#E7B286"/><ellipse cx="432" cy="240" rx="4" ry="8" fill="#E7B286"/>' +
      '<path d="M366 230C364 206 380 194 400 196C420 194 436 206 434 230C428 214 416 208 400 210C384 208 372 214 366 230Z" fill="#170C1C"/>' +
      '<path d="M400 198V211" stroke="#FFD778" stroke-width="1.4"/><path d="M396 210Q400 217 404 210Z" fill="url(#lk-gold)"/><circle cx="400" cy="214" r="1.6" fill="#C8173A"/>' +
      '<path d="M377 224Q386 218 395 223M405 223Q414 218 423 224" fill="none" stroke="#3A1A10" stroke-width="1.7" stroke-linecap="round"/>' +
      '<path d="M378 234C383 239 390 239 396 235M404 235C410 239 417 239 422 234" fill="none" stroke="#2A1208" stroke-width="2.1" stroke-linecap="round"/>' +
      '<path d="M376 233l-4-2M424 233l4-2" stroke="#2A1208" stroke-width="1.4" stroke-linecap="round"/>' +
      '<path d="M381 236.4C385 238.6 390 238.6 393 236.8M407 236.8C410 238.6 415 238.6 419 236.4" fill="none" stroke="#5A2A14" stroke-opacity=".4" stroke-width="1"/>' +
      '<path d="M400 222c-1.6 0-2.6 1.4-2.6 2.8 0 1.6 2.6 4 2.6 4s2.6-2.4 2.6-4c0-1.4-1-2.8-2.6-2.8z" fill="#C8173A"/>' +
      '<path d="M400 238L397.6 250Q400 253 403 251" fill="none" stroke="#C98A5C" stroke-width="1.3" stroke-linecap="round"/>' +
      '<circle cx="405.5" cy="251" r="3.2" fill="none" stroke="#FFD778" stroke-width="1"/>' +
      '<path d="M392.5 259Q400 255 407.5 259Q400 265 392.5 259Z" fill="#B4233C"/><path d="M393 259Q400 261 407 259" stroke="#7A1022" stroke-width=".8" fill="none"/>' +
      '<g fill="url(#lk-gold)"><path d="M362 252Q368 244 374 252L373 262H363Z"/><path d="M426 252Q432 244 438 252L437 262H427Z"/></g>' +
      '<g fill="#FFF1BE"><circle cx="364" cy="265" r="1.5"/><circle cx="368" cy="266" r="1.5"/><circle cx="372" cy="265" r="1.5"/><circle cx="428" cy="265" r="1.5"/><circle cx="432" cy="266" r="1.5"/><circle cx="436" cy="265" r="1.5"/></g>';
    // the kirita crown
    s += '<path d="M362 204L366 176L376 172L381 150L392 144L400 118L408 144L419 150L424 172L434 176L438 204Z" fill="url(#lk-gold)" stroke="#7A4A0C" stroke-opacity=".55"/>' +
      '<path d="M362 198H438M366 180H434M378 156H422" stroke="#7A4A0C" stroke-opacity=".45" stroke-width="1"/>' +
      '<path d="M362 204C356 196 350 196 346 202C352 200 356 204 358 210ZM438 204C444 196 450 196 454 202C448 200 444 204 442 210Z" fill="url(#lk-gold)"/>' +
      '<circle cx="400" cy="188" r="5" fill="#C8173A" stroke="#FFE7A3"/><circle cx="381" cy="189" r="2.6" fill="#2E8B6E"/><circle cx="419" cy="189" r="2.6" fill="#2E8B6E"/>' +
      '<circle cx="400" cy="166" r="3" fill="#C8173A"/><circle cx="400" cy="140" r="2.2" fill="#FFF6D8"/>' +
      '<path d="M370 202v-4M378 202v-4M386 202v-4M414 202v-4M422 202v-4M430 202v-4" stroke="#FFF1BE" stroke-width="1.6" stroke-linecap="round"/>';
    return s + '</g>';
  }

  /* coins showering from her hand (they fall only while lit). Revision 5: the stream leaves just BELOW and
     OUTSIDE her fingertips (x >= 502, y >= 456) and drifts outward, clear of the sari edge (x <= 498), into the
     lotus — nothing crosses her figure. The little heap now sits on the lotus rim beside her (see lotusFront). */
  function coins() {
    var s = '<g class="lk-coins">', i;
    for (i = 0; i < 9; i++) {
      s += '<g class="lk-coin" style="--i:' + i + ';--dx:' + f(2 + (i % 3) * 5 + (i * 7 % 5)) + 'px;--dur:' + f(2.6 + (i % 4) * 0.35) + 's">' +
        '<g transform="translate(' + (509 + (i % 3) * 4) + ' 462)"><circle r="5.6" fill="url(#lk-coin)" stroke="#8A5A12" stroke-width=".8"/><rect x="-1.4" y="-1.4" width="2.8" height="2.8" fill="#8A5A12" opacity=".7"/></g></g>';
    }
    return s + '</g>';
  }
  function heap() {
    var s = '<g class="lk-heap">';
    [[512, 525], [524, 526], [536, 524], [518, 520], [530, 520], [524, 515]].forEach(function (c) { s += '<ellipse cx="' + c[0] + '" cy="' + c[1] + '" rx="6" ry="3" fill="url(#lk-gold)" stroke="#8A5A12" stroke-width=".6"/>'; });
    return s + '</g>';
  }

  /* the lotus pond at her feet */
  function pond() {
    var s = '<rect x="0" y="548" width="800" height="312" fill="url(#lk-water)"/>' +
      '<ellipse class="lk-reflect" cx="400" cy="640" rx="240" ry="40" fill="url(#lk-pool)"/>' +
      '<g fill="none" stroke="#AFC2FF" stroke-opacity=".12" stroke-width="1"><ellipse cx="400" cy="626" rx="270" ry="10"/><ellipse cx="400" cy="676" rx="330" ry="14"/><ellipse cx="400" cy="740" rx="370" ry="16"/><ellipse cx="400" cy="808" rx="380" ry="16"/></g>';
    [[128, 668, 62, 17, 4], [672, 676, 66, 18, -4], [214, 792, 72, 20, 3], [604, 806, 60, 17, -3], [76, 762, 44, 13, 0], [730, 764, 42, 12, 0]].forEach(function (p) {
      s += '<g transform="translate(' + p[0] + ' ' + p[1] + ') rotate(' + p[4] + ')"><path d="M0 0L' + f(p[2] * 0.96) + ' ' + f(-p[3] * 0.3) + 'A' + p[2] + ' ' + p[3] + ' 0 1 1 ' + f(p[2] * 0.96) + ' ' + f(p[3] * 0.3) + 'Z" fill="url(#lk-pad)" stroke="#8FE0D2" stroke-opacity=".28"/>' +
        '<path d="M0 0L' + f(-p[2] * 0.7) + ' ' + f(-p[3] * 0.5) + 'M0 0L' + f(-p[2] * 0.8) + ' ' + f(p[3] * 0.3) + 'M0 0L' + f(p[2] * 0.2) + ' ' + f(p[3] * 0.85) + '" stroke="#8FE0D2" stroke-opacity=".16" fill="none"/></g>';
    });
    [[118, 640], [690, 650], [250, 772]].forEach(function (b) {
      s += '<g transform="translate(' + b[0] + ' ' + b[1] + ')"><path d="M0 8V26" stroke="#2F5E46" stroke-width="2"/><path d="' + petal(16, 26) + '" transform="translate(0 8)" fill="url(#lk-petal)"/></g>';
    });
    return s;
  }

  /* the brass diya on its stand, and its flame */
  function diya() {
    var s = '<g class="lk-diya">' +
      '<ellipse cx="400" cy="846" rx="66" ry="6" fill="#000" opacity=".45"/>' +
      '<path d="M346 846H454L444 832H356Z" fill="url(#lk-brass)"/><path d="M362 832H438L430 820H370Z" fill="url(#lk-brass)"/>' +
      '<path d="M393 820C389 800 391 786 395 776H405C409 786 411 800 407 820Z" fill="url(#lk-brass)"/>' +
      '<ellipse cx="400" cy="803" rx="10" ry="3.4" fill="url(#lk-gold)"/><ellipse cx="400" cy="788" rx="8" ry="3" fill="url(#lk-gold)"/>' +
      '<path d="M370 776H430L424 768H376Z" fill="url(#lk-brass)"/>' +
      '<path d="M334 744C338 766 366 780 400 780C434 780 462 766 466 744C444 752 356 752 334 744Z" fill="url(#lk-brass)"/>' +
      '<path d="M342 756C360 770 440 770 458 756" fill="none" stroke="#7A4A0C" stroke-opacity=".5" stroke-width="1.2"/>' +
      '<g fill="#FFF1BE" opacity=".8"><circle cx="356" cy="760" r="1.6"/><circle cx="372" cy="766" r="1.6"/><circle cx="388" cy="768" r="1.6"/><circle cx="412" cy="768" r="1.6"/><circle cx="428" cy="766" r="1.6"/><circle cx="444" cy="760" r="1.6"/></g>' +
      '<path d="M334 744C350 734 450 734 466 744C450 754 350 754 334 744Z" fill="url(#lk-oil)" stroke="url(#lk-gold)" stroke-width="2.2"/>' +
      '<path d="M388 748C392 758 408 758 412 748Z" fill="url(#lk-brass)"/>' +
      '<path d="M400 748V740" stroke="#2A1206" stroke-width="2.4" stroke-linecap="round"/><circle class="lk-ember" cx="400" cy="739.5" r="1.8" fill="#FF5A1F"/>' +
      '</g>' +
      '<g class="lk-flame" transform="translate(' + FX + ' ' + FY + ')"><g class="lk-flame-in">' +
        '<circle cx="0" cy="-22" r="40" fill="url(#lk-glow)" class="lk-flame-glow"/>' +
        '<path d="M0 -62C8 -44 19 -30 19 -14C19 -3 11 4 0 4C-11 4 -19 -3 -19 -14C-19 -30 -8 -44 0 -62Z" fill="url(#lk-fo)"/>' +
        '<path d="M0 -46C5 -34 12 -24 12 -12C12 -4 7 1 0 1C-7 1 -12 -4 -12 -12C-12 -24 -5 -34 0 -46Z" fill="url(#lk-fm)"/>' +
        '<path d="M0 -26C3 -19 6 -14 6 -8C6 -3 3.5 0 0 0C-3.5 0 -6 -3 -6 -8C-6 -14 -3 -19 0 -26Z" fill="#FFFDF4"/>' +
        '<ellipse cx="0" cy="-1" rx="4" ry="3" fill="#7FA8FF" opacity=".6"/></g></g>' +
      '<g class="lk-smoke" transform="translate(' + FX + ' ' + (FY - 8) + ')"><path d="M0 0C-6 -14 6 -22 0 -36C-6 -50 6 -58 0 -72" fill="none" stroke="#C9C6E6" stroke-opacity=".5" stroke-width="2.4" stroke-linecap="round"/></g>';
    return s;
  }

  /* the frame: the niche outline, inner hairline, kalasha finials and a small Nagara shikhara crest */
  function frameArt() {
    var s = '<g class="lk-frame" fill="none" stroke-linejoin="round">' +
      '<path d="' + NICHE + '" stroke="url(#lk-gold)" stroke-width="2"/>' +
      '<path d="' + NICHE_IN + '" stroke="#FFD778" stroke-opacity=".32" stroke-width="1"/>' +
      '<path d="M40 852H760" stroke="#FFD778" stroke-opacity=".5"/></g>' +
      '<g class="lk-crest">' +
      '<path d="M300 132H318V120H482V132H500" fill="none" stroke="url(#lk-gold)" stroke-width="1.4"/>' +
      // two half-height spires (urushringa) lean on the main Nagara tower
      [[338, 1], [462, -1]].map(function (u) { return '<path d="M' + (u[0] - 20) + ' 120L' + (u[0] - 18) + ' 104C' + (u[0] - 16) + ' 92 ' + (u[0] - 9) + ' 84 ' + (u[0] - 4) + ' 80H' + (u[0] + 4) + 'C' + (u[0] + 9) + ' 84 ' + (u[0] + 16) + ' 92 ' + (u[0] + 18) + ' 104L' + (u[0] + 20) + ' 120Z" fill="#0C0F2E" stroke="url(#lk-gold)" stroke-width="1.2"/><ellipse cx="' + u[0] + '" cy="77.5" rx="9" ry="2.6" fill="url(#lk-gold)"/><path d="M' + (u[0] - 2.5) + ' 75L' + u[0] + ' 68L' + (u[0] + 2.5) + ' 75Z" fill="url(#lk-gold)"/>'; }).join('') +
      '<path d="M356 120L358 84C360 66 368 52 382 42H418C432 52 440 66 442 84L444 120Z" fill="#0C0F2E" stroke="url(#lk-gold)" stroke-width="1.6"/>' +
      '<path d="M390 120V44M410 120V44" stroke="#FFD778" stroke-opacity=".34" stroke-width="1" fill="none"/>' +
      '<path d="M357 108h8M435 108h8M357 96h8M435 96h8M358 84h8M434 84h8M361 72h8M431 72h8M366 60h7M427 60h7M373 50h6M421 50h6" stroke="#FFD778" stroke-opacity=".6" stroke-width="1.4"/>' +
      '<path class="lk-crest-niche" d="M392 120V104H395V101H405V104H408V120Z" fill="#1A1A3E" stroke="#FFD778" stroke-opacity=".55"/>' +
      '<path d="M380 42H420L416 37H384Z" fill="url(#lk-gold-dk)"/>' +
      '<ellipse cx="400" cy="32" rx="22" ry="5.6" fill="url(#lk-gold)"/><path d="M382 32h36M387 28.5v7M394 27.2v9.6M400 27v10M406 27.2v9.6M413 28.5v7" stroke="#5E3A08" stroke-opacity=".5" stroke-width="1" fill="none"/>' +
      '<path d="M393 26C391 20 395 16 400 16C405 16 409 20 407 26Z" fill="url(#lk-gold)"/><path d="M397.5 16L400 7L402.5 16Z" fill="url(#lk-gold)"/>' +
      '<path d="M416 28V2" stroke="#FFD778" stroke-width="1.2"/><path class="lk-flag" d="M416 2L444 7.5L416 14Z" fill="#E8641A"/>' +
      [70, 730].map(function (x) { return '<g transform="translate(' + x + ' 132)"><path d="M-9 0C-9 -8 -5 -12 0 -12C5 -12 9 -8 9 0Z" fill="url(#lk-gold)"/><path d="M-3 -12L0 -20L3 -12Z" fill="url(#lk-gold)"/></g>'; }).join('') +
      '</g>';
    return s;
  }

  /* Revision 5: two stacked SVGs (same viewBox) with the motes canvas between them. The back one holds every
     light effect (dawn wash, rays, aura, halo, the lamp pool on the water); the front one holds the lotus throne,
     the goddess, the coins, the veil, the diya and the frame. Gradients/clip live in the back SVG's <defs> and
     are referenced document-wide. The front SVG carries the accessible name — and has NO <title>, which is what
     drew the native hover tooltip. */
  var LK_LABEL = 'Goddess Lakshmi in a temple shrine';
  var LK_DESC = 'Goddess Lakshmi sits on a full-bloom pink lotus in a red and gold sari, wearing a gold crown before a gold halo. In her four hands she holds two lotuses, raises one hand in blessing and showers gold coins from the other. Two elephants raise water pots on either side, above a lotus pond. A brass diya stands in front of her.';
  function sceneBack() {
    return '<svg class="lk-art lk-art--back" viewBox="0 0 ' + VW + ' ' + VH + '" aria-hidden="true" focusable="false">' +
      defs() +
      '<g clip-path="url(#lk-clip)">' + backWall() + lights() + streams() + halo() +
        elephant() + '<g transform="matrix(-1 0 0 1 800 0)">' + elephant() + '</g>' +
        pond() +
        '<ellipse class="lk-pool" cx="400" cy="744" rx="260" ry="150" fill="url(#lk-pool)"/>' +
      '</g></svg>';
  }
  function sceneFront() {
    return '<svg class="lk-art lk-art--front" viewBox="0 0 ' + VW + ' ' + VH + '" role="img" aria-label="' + LK_LABEL + '" aria-describedby="lk-d" focusable="false">' +
      '<g clip-path="url(#lk-clip)">' + lotusBack() + lakshmi() + coins() + lotusFront() +
        '<rect class="lk-veil" width="800" height="860" fill="#060A26"/>' +
        diya() +
      '</g>' + frameArt() + '</svg>';
  }

  /* ------------------------------------------------------------------ */
  /* State + behaviour                                                    */
  /* ------------------------------------------------------------------ */
  var lit = E2M.state.diyas;
  lit.length = 0; lit.push(false);
  var root, frameEl, hit, lightBtn, outBtn, statusEl, cv, ctx, active = false, allLitFired = false, quipped = false;
  var motes = [], sparks = [], raf = 0, last = 0, cw = 1, ch = 1, dpr = 1, sprite = null, outT = 0;
  var QUIPS = ['Blessings unlocked. Terms and conditions: be kind to everyone.', 'Lakshmi approves. Your wallet has been notified.', 'The goddess of good fortune is now officially in the room.'];
  var FLARE = ['Already lit. She appreciates the attention.', 'Extra sparkle applied. No charge.', 'The diya is showing off now.'];

  function build(stage) {
    root = D.createElement('div');
    root.className = 'act-diyas';
    root.innerHTML =
      '<div class="dy-frame">' + sceneBack() +
        '<canvas class="dy-motes" aria-hidden="true"></canvas>' +
        sceneFront() +
        '<p class="sr-only" id="lk-d">' + LK_DESC + '</p>' +
        '<button type="button" class="dy-hit" aria-label="Light the diya" aria-describedby="dy-status"></button>' +
      '</div>' +
      '<div class="dy-controls">' +
        '<p class="dy-status" id="dy-status">The shrine is dark</p>' +
        '<div class="dy-acts">' +
          '<button type="button" class="btn-diya btn-diya--lg dy-light"><span>Light the diya</span></button>' +
          '<button type="button" class="btn-marigold btn-marigold--sm dy-out" hidden><span>Extinguish</span></button>' +
        '</div>' +
      '</div>';
    stage.appendChild(root);
    frameEl = root.querySelector('.dy-frame'); hit = root.querySelector('.dy-hit');
    lightBtn = root.querySelector('.dy-light'); outBtn = root.querySelector('.dy-out'); statusEl = root.querySelector('.dy-status');
    cv = root.querySelector('.dy-motes'); ctx = cv.getContext('2d');
  }

  function flamePt() { return { x: FX / VW * cw, y: (FY - 30) / VH * ch }; }
  function centreOfFlame() { var r = frameEl.getBoundingClientRect(); return { x: r.left + r.width * FX / VW, y: r.top + r.height * (FY - 30) / VH }; }

  function light(source) {
    if (lit[0]) {
      if (source === 'user') { sparkle(16); E2M.audio.play('sparkle'); if (E2M.haptic) E2M.haptic('tap'); if (Math.random() < 0.5) E2M.toast(pick(FLARE)); }
      return;
    }
    lit[0] = true;
    clearTimeout(outT);
    root.classList.remove('is-out');
    root.classList.add('is-lit'); if (lightBtn) lightBtn.classList.add('is-lit');
    hit.setAttribute('aria-label', 'The diya is lit. Press for a little sparkle.');
    statusEl.textContent = 'The diya is lit';
    lightBtn.hidden = true; outBtn.hidden = false;
    if (source !== 'finale' && D.activeElement === lightBtn) outBtn.focus({ preventScroll: true });
    E2M.audio.play('flick');
    setTimeout(function () { E2M.audio.play('chime'); }, 180);
    setTimeout(function () { E2M.audio.play('bell', { pitch: 660 }); }, 620);
    if (E2M.haptic) E2M.haptic('success');
    // a soft physical response, kept small: everything else happens inside the frame
    if (E2M.shake) E2M.shake(2.4, 320, centreOfFlame());
    sparkle(34);
    if (E2M.announce) E2M.announce("The diya is lit. Goddess Lakshmi's blessings glow.");
    if (source === 'user' && !quipped) { quipped = true; setTimeout(function () { E2M.toast(pick(QUIPS)); }, 900); }
    if (!allLitFired) { allLitFired = true; E2M.emit('diyas:allLit', { count: 1 }); }
    startMotes();
    sunTo(1, 2600, 260); // the sun rises behind her (just after the flame catches)
  }
  function extinguish() {
    if (!lit[0]) return;
    lit[0] = false;
    root.classList.remove('is-lit'); if (lightBtn) lightBtn.classList.remove('is-lit');
    root.classList.add('is-out');
    clearTimeout(outT); outT = setTimeout(function () { root.classList.remove('is-out'); }, 2400);
    hit.setAttribute('aria-label', 'Light the diya');
    statusEl.textContent = 'The shrine is dark again';
    lightBtn.hidden = false; outBtn.hidden = true;
    lightBtn.querySelector('span').textContent = 'Light again';
    if (D.activeElement === outBtn || D.activeElement === D.body) lightBtn.focus({ preventScroll: true });
    E2M.audio.play('whoosh');
    if (E2M.haptic) E2M.haptic('light');
    if (E2M.announce) E2M.announce('The diya is out. Light it again whenever you like.');
    sunTo(0, 1500); // and sets again
  }

  /* ---------- motes: golden particles drifting up and spiralling round her (canvas, clipped to the niche) ---------- */
  function size() {
    var r = frameEl.getBoundingClientRect();
    cw = Math.max(1, r.width); ch = Math.max(1, r.height);
    dpr = Math.min(W.devicePixelRatio || 1, E2M.mobile ? 1.5 : 2);
    cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
  }
  function getSprite() {
    if (sprite) return sprite;
    sprite = D.createElement('canvas'); sprite.width = sprite.height = 32;
    var g = sprite.getContext('2d'), r = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    r.addColorStop(0, 'rgba(255,248,220,1)'); r.addColorStop(0.3, 'rgba(255,215,120,.75)'); r.addColorStop(1, 'rgba(255,159,50,0)');
    g.fillStyle = r; g.fillRect(0, 0, 32, 32);
    return sprite;
  }
  function newMote(any) {
    var fromDiya = Math.random() < 0.45;
    return {
      a: rand(TAU), r: fromDiya ? rand(10, 60) : rand(120, 230), w: rand(0.18, 0.42) * (Math.random() < 0.5 ? -1 : 1),
      y: fromDiya ? rand(690, 730) : rand(470, 600), vy: -rand(14, 34), gr: rand(4, 14),
      life: any ? rand(0, 7) : 0, max: rand(7, 11), s: rand(1.4, 3.4), tw: rand(1, 3), ph: rand(TAU)
    };
  }
  function sparkle(n) {
    if (E2M.reduced) return;
    var p = flamePt();
    for (var i = 0; i < n; i++) {
      var a = rand(-Math.PI * 0.95, -Math.PI * 0.05), v = rand(60, 210);
      sparks.push({ x: p.x, y: p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(0.5, 1.1), max: 1, s: rand(1, 2.6) });
      sparks[sparks.length - 1].max = sparks[sparks.length - 1].life;
    }
    kick();
  }
  function startMotes() {
    if (E2M.reduced) return;
    var want = E2M.mobile ? 34 : 70;
    while (motes.length < want) motes.push(newMote(true));
    kick();
  }
  function kick() { if (!raf && active && !D.hidden && !E2M.isPaused()) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  function clip() {
    // the niche, in canvas px (step corners included)
    var sx = cw / VW, sy = ch / VH;
    ctx.beginPath();
    ctx.moveTo(40 * sx, 852 * sy); ctx.lineTo(40 * sx, 164 * sy); ctx.lineTo(54 * sx, 164 * sy); ctx.lineTo(54 * sx, 148 * sy); ctx.lineTo(70 * sx, 148 * sy); ctx.lineTo(70 * sx, 132 * sy);
    ctx.lineTo(730 * sx, 132 * sy); ctx.lineTo(730 * sx, 148 * sy); ctx.lineTo(746 * sx, 148 * sy); ctx.lineTo(746 * sx, 164 * sy); ctx.lineTo(760 * sx, 164 * sy); ctx.lineTo(760 * sx, 852 * sy);
    ctx.closePath(); ctx.clip();
  }
  function frame(t) {
    raf = 0;
    var dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t;
    var sx = cw / VW, sy = ch / VH, spr = getSprite(), i;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.save(); clip();
    ctx.globalCompositeOperation = 'lighter';
    var on = lit[0];
    for (i = motes.length - 1; i >= 0; i--) {
      var m = motes[i];
      m.life += dt; m.a += m.w * dt; m.y += m.vy * dt; m.r += m.gr * dt * (m.r < 70 ? 1.6 : 0.4);
      if (m.life > m.max || m.y < 150) { if (on) motes[i] = newMote(false); else motes.splice(i, 1); continue; }
      var k = m.life / m.max, fade = Math.min(1, m.life / 0.9) * Math.min(1, (1 - k) * 2.4);
      var front = Math.sin(m.a), x = (400 + Math.cos(m.a) * m.r) * sx, y = (m.y + front * m.r * 0.26) * sy;
      var alpha = fade * (0.35 + 0.45 * (front > 0 ? 1 : 0.55)) * (0.7 + 0.3 * Math.sin(t / 1000 * m.tw + m.ph));
      if (!on) alpha *= 0.6;
      var s = m.s * (front > 0 ? 1.15 : 0.8) * Math.max(0.6, Math.min(1.4, sx * 1.6));
      ctx.globalAlpha = alpha; ctx.drawImage(spr, x - s * 2, y - s * 2, s * 4, s * 4);
    }
    for (i = sparks.length - 1; i >= 0; i--) {
      var p = sparks[i];
      p.life -= dt; if (p.life <= 0) { sparks.splice(i, 1); continue; }
      p.vy += 160 * dt; p.vx *= 0.97; p.vy *= 0.97; p.x += p.vx * dt * sx * 1.6; p.y += p.vy * dt * sy * 1.6;
      ctx.globalAlpha = Math.min(1, p.life / p.max * 1.6);
      ctx.drawImage(spr, p.x - p.s * 2, p.y - p.s * 2, p.s * 4, p.s * 4);
    }
    ctx.restore();
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    if ((motes.length || sparks.length) && active && !D.hidden && !E2M.isPaused()) raf = requestAnimationFrame(frame);
    else if (!motes.length && !sparks.length) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); }
  }

  /* ------------------------------------------------------------------ */
  /* Revision 5 — the sun: full-screen rays from behind Lakshmi           */
  /* One fixed, pointer-events:none layer at z 1 — above the deep-space   */
  /* sky (z 0), below the whole page (main, z 2), so it sits behind every */
  /* text and control. Just TWO composited quads, each a small            */
  /* pre-rendered texture (1024px; 768 on mobile) that CSS sizes to the   */
  /* viewport: wheel A = the sun's core glow (sized to the shrine) + a    */
  /* broad dawn lift + 24 soft beams, all radially centred so rotating it */
  /* only turns the beams; wheel B = 16 finer beams turning the other way */
  /* (their crossings are the shimmer). Per frame the compositor only     */
  /* rotates the wheels (CSS animation; Calm = none, B off) and the       */
  /* origin follows her halo by translate; scroll sets opacity. No        */
  /* scale(), no repaint of anything large, no flashes. Wheel A is        */
  /* repainted only when the viewport/shrine proportions change.          */
  /* ------------------------------------------------------------------ */
  var sun = { el: null, org: null, ra: null, rb: null, zone: null, on: false, n: 1024, coreAt: 0,
    k: 0, kFrom: 0, kTo: 0, kT0: 0, kDur: 1, vis: 0, ox: 0, oy: 0, raf: 0 };
  var HALO_Y = 236 / VH; // the halo centre, as a fraction of the frame height

  // a wheel of soft sunbeams: irregular spacing, widths and strengths; each beam is 8 nested wedges (narrow and
  // strong -> wide and faint) so its profile falls off like a real shaft of light; then one radial alpha
  // falloff (hidden core, long tail, transparent rim)
  function paintRays(c, n, seed, o) {
    c.width = c.height = n;
    var g = c.getContext('2d'), h = n / 2, rnd = seeded(seed), i, k, gaps = [], sum = 0;
    for (i = 0; i < o.count; i++) { gaps.push(0.5 + rnd()); sum += gaps[i]; }
    g.translate(h, h);
    var col = g.createRadialGradient(0, 0, 0, 0, 0, h);
    col.addColorStop(0, 'rgb(255,248,222)'); col.addColorStop(0.3, 'rgb(255,226,158)'); col.addColorStop(1, 'rgb(255,198,116)');
    g.fillStyle = col; g.globalCompositeOperation = 'lighter';
    var a = rnd() * TAU;
    for (i = 0; i < o.count; i++) {
      a += gaps[i] / sum * TAU;
      var w = (o.w[0] + rnd() * (o.w[1] - o.w[0])) * Math.PI / 180, s = o.s[0] + rnd() * (o.s[1] - o.s[0]);
      for (k = 0; k < 8; k++) {
        var ww = w * (0.3 + k * 0.25);
        g.globalAlpha = s * 0.21 * (1 - k / 9);
        g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, h, a - ww, a + ww); g.closePath(); g.fill();
      }
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'destination-in';
    var m = g.createRadialGradient(0, 0, 0, 0, 0, h);
    m.addColorStop(0, 'rgba(0,0,0,0)'); m.addColorStop(0.03, 'rgba(0,0,0,.5)'); m.addColorStop(0.12, 'rgba(0,0,0,1)');
    m.addColorStop(0.42, 'rgba(0,0,0,.78)'); m.addColorStop(0.75, 'rgba(0,0,0,.42)'); m.addColorStop(0.94, 'rgba(0,0,0,.12)'); m.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = m; g.fillRect(-h, -h, n, n);
  }
  // wheel A's radially symmetric light, drawn BEHIND its beams (destination-over): the sun's core — luminous,
  // spilling round the shrine, falling off quickly so the far screen stays deep space and the beams read as
  // beams — and under it a broad, faint dawn lift that warms the whole screen. cr = the core's radius in texels.
  function paintCore(c, cr) {
    var g = c.getContext('2d'), h = c.width / 2, r, l;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'destination-over';
    r = g.createRadialGradient(h, h, 0, h, h, cr);
    r.addColorStop(0, 'rgba(255,244,212,1)'); r.addColorStop(0.1, 'rgba(255,228,168,.8)'); r.addColorStop(0.22, 'rgba(255,206,126,.46)');
    r.addColorStop(0.38, 'rgba(255,182,104,.22)'); r.addColorStop(0.58, 'rgba(244,156,110,.09)'); r.addColorStop(0.8, 'rgba(220,130,120,.03)'); r.addColorStop(1, 'rgba(220,130,120,0)');
    g.fillStyle = r; g.fillRect(0, 0, c.width, c.height);
    l = g.createRadialGradient(h, h, 0, h, h, h);
    l.addColorStop(0, 'rgba(255,204,146,.11)'); l.addColorStop(0.3, 'rgba(255,192,136,.08)'); l.addColorStop(0.6, 'rgba(255,180,124,.05)'); l.addColorStop(0.9, 'rgba(255,170,120,.015)'); l.addColorStop(1, 'rgba(255,170,120,0)');
    g.fillStyle = l; g.fillRect(0, 0, c.width, c.height);
    g.globalCompositeOperation = 'source-over';
  }
  function paintWheelA(coreRatio) {
    paintRays(sun.ra, sun.n, 2611, { count: 24, w: [0.6, 2.2], s: [0.2, 0.55] });
    paintCore(sun.ra, Math.max(8, Math.min(1, coreRatio) * sun.n / 2));
    sun.coreAt = coreRatio;
  }
  function buildSun() {
    var el = D.createElement('div');
    el.className = 'dy-sun'; el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<div class="dy-sun-org"><canvas class="dy-sun-ray dy-sun-ray--a"></canvas><canvas class="dy-sun-ray dy-sun-ray--b"></canvas></div>';
    var sky = D.querySelector('.sky');
    if (sky && sky.parentNode) sky.parentNode.insertBefore(el, sky.nextSibling); else D.body.insertBefore(el, D.body.firstChild);
    sun.el = el; sun.org = el.querySelector('.dy-sun-org');
    sun.ra = el.querySelector('.dy-sun-ray--a'); sun.rb = el.querySelector('.dy-sun-ray--b');
    sun.n = E2M.mobile ? 768 : 1024;
    paintRays(sun.rb, sun.n, 1105, { count: 16, w: [0.4, 1.2], s: [0.16, 0.4] });
    sunLayout();
  }
  function sunLayout() {
    if (!sun.el) return;
    var vw = W.innerWidth, vh = W.innerHeight;
    // the wheels reach every viewport corner from any origin that can still be on screen (the halo can sit up
    // to ~0.75 vh above or below the viewport while the frame is partly visible); the core is sized to the shrine
    var fw = frameEl.getBoundingClientRect().width || 640;
    var R = Math.ceil(Math.sqrt(Math.pow(vw * 0.6, 2) + Math.pow(vh * 1.8, 2))), G = Math.max(fw * 1.9, Math.min(vw, vh) * 0.9);
    function place(c, r) { var s = c.style; s.left = s.top = -r + 'px'; s.width = s.height = 2 * r + 'px'; }
    place(sun.ra, R); place(sun.rb, R);
    if (!sun.coreAt || Math.abs(G / R - sun.coreAt) / sun.coreAt > 0.03) paintWheelA(G / R);
  }
  function smooth(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function sunMeasure() {
    var r = frameEl.getBoundingClientRect(), vh = W.innerHeight;
    sun.ox = r.left + r.width / 2; sun.oy = r.top + r.height * HALO_Y;
    // how much of the shrine is on screen: full rays once ~85% of it shows, fading to nothing as it leaves
    var seen = (Math.min(r.bottom, vh) - Math.max(r.top, 0)) / Math.max(1, Math.min(r.height, vh));
    sun.vis = smooth(seen / 0.85);
  }
  function sunApply() {
    var a = sun.vis * sun.k;
    if (a < 0.004) {
      if (sun.on) { sun.on = false; sun.el.classList.remove('is-on'); sun.ra.style.opacity = sun.rb.style.opacity = '0'; }
      return;
    }
    if (!sun.on) { sun.on = true; sun.el.classList.add('is-on'); }
    var calm = E2M.isCalm();
    sun.org.style.transform = 'translate3d(' + sun.ox.toFixed(1) + 'px,' + sun.oy.toFixed(1) + 'px,0)';
    sun.ra.style.opacity = (a * (calm ? 0.68 : 1)).toFixed(3);
    sun.rb.style.opacity = calm ? '0' : (a * 0.72).toFixed(3);
  }
  function sunFrame(t) {
    sun.raf = 0;
    var tweening = sun.k !== sun.kTo;
    if (tweening) {
      var p = Math.max(0, Math.min(1, (t - sun.kT0) / sun.kDur));
      var e = sun.kTo > sun.kFrom ? 1 - Math.pow(1 - p, 3) : p * p * (3 - 2 * p);
      sun.k = p >= 1 ? sun.kTo : sun.kFrom + (sun.kTo - sun.kFrom) * e;
    }
    sunMeasure(); sunApply();
    if (sun.k !== sun.kTo) sun.raf = requestAnimationFrame(sunFrame);
  }
  function sunReq() { if (sun.el && (sun.k > 0 || sun.kTo > 0) && !sun.raf) sun.raf = requestAnimationFrame(sunFrame); }
  function sunTo(target, ms, delay) {
    if (!sun.el) return;
    sun.kFrom = sun.k; sun.kTo = target; sun.kDur = Math.max(1, ms); sun.kT0 = performance.now() + (delay || 0);
    if (sun.zone) sun.zone.classList.toggle('is-sunlit', target > 0);
    if (!sun.raf) sun.raf = requestAnimationFrame(sunFrame);
  }
  function initSun(stage) {
    buildSun();
    sun.zone = stage.closest ? stage.closest('.zone') : null;
    W.addEventListener('scroll', sunReq, { passive: true });
    var rt = 0;
    W.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { sunLayout(); sunReq(); }, 100); });
    // anything above the shrine changing height (a hint collapsing, text size, fonts) moves her without a scroll
    if ('ResizeObserver' in W) {
      new ResizeObserver(sunReq).observe(D.getElementById('main') || D.body);
      new ResizeObserver(function () { sunLayout(); sunReq(); }).observe(frameEl); // the sun's core is sized to the shrine
    }
    E2M.on('prefs:change', sunReq);
  }

  /* ------------------------------------------------------------------ */
  /* Compat + registration                                                */
  /* ------------------------------------------------------------------ */
  E2M.lightAllDiyas = function () { if (root && !lit[0]) light('finale'); };
  E2M.register('diyas', {
    mount: function (stage) {
      build(stage);
      size();
      initSun(stage);
      hit.addEventListener('click', function () { light('user'); });
      lightBtn.addEventListener('click', function () { light('user'); });
      outBtn.addEventListener('click', extinguish);
      var rt = 0;
      W.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(size, 120); });
      D.addEventListener('visibilitychange', function () { if (D.hidden) stop(); else if (lit[0]) kick(); });
      E2M.on('motion:pause', stop);
      E2M.on('motion:resume', function () { if (lit[0]) startMotes(); });
      E2M.on('prefs:change', function () { if (E2M.reduced) { motes.length = 0; sparks.length = 0; } else if (lit[0]) startMotes(); });
    },
    onEnter: function () { active = true; size(); if (lit[0]) startMotes(); },
    onLeave: function () { active = false; stop(); }
  });
})();
