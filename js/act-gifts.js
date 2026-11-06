/* ==========================================================================
   E2M Diwali Playground — Activity 07: Mystery Gift Boxes
   Six hand-decorated boxes on a zari-bordered carpet. Each opens with its
   own animation and reveals one of sixteen surprises (drawn from a shuffled
   deck, so a round of six never repeats). WRAP AGAIN re-ties them all.
   Mounts into [data-mount="gifts"] through E2M.register.
   ========================================================================== */
(function () {
  'use strict';

  var KEY = 'gifts';
  var SEEN_KEY = 'e2m-diwali:gifts-seen';


  /* ------------------------------------------------------------------
     Box geometry: three-quarter view cube (front face + right side)
     ------------------------------------------------------------------ */
  function n1(v) { return (Math.round(v * 10) / 10).toString(); }
  function P(pts) {
    return 'M' + pts.map(function (p) { return n1(p[0]) + ' ' + n1(p[1]); }).join(' L') + 'Z';
  }

  function bow(bx, by, s, fill, edge) {
    return '' +
      '<g class="gf-bow">' +
        '<path d="M' + n1(bx) + ' ' + n1(by) + ' C' + n1(bx - 30 * s) + ' ' + n1(by - 28 * s) + ' ' + n1(bx - 42 * s) + ' ' + n1(by + 2 * s) + ' ' + n1(bx) + ' ' + n1(by) + 'Z" fill="' + fill + '" stroke="' + edge + '" stroke-width="1"/>' +
        '<path d="M' + n1(bx) + ' ' + n1(by) + ' C' + n1(bx + 30 * s) + ' ' + n1(by - 28 * s) + ' ' + n1(bx + 42 * s) + ' ' + n1(by + 2 * s) + ' ' + n1(bx) + ' ' + n1(by) + 'Z" fill="' + fill + '" stroke="' + edge + '" stroke-width="1"/>' +
        '<path d="M' + n1(bx - 4 * s) + ' ' + n1(by - 3 * s) + ' C' + n1(bx - 18 * s) + ' ' + n1(by - 16 * s) + ' ' + n1(bx - 26 * s) + ' ' + n1(by - 4 * s) + ' ' + n1(bx - 6 * s) + ' ' + n1(by) + '" fill="none" stroke="' + edge + '" stroke-width="1.2" opacity=".8"/>' +
        '<path d="M' + n1(bx + 4 * s) + ' ' + n1(by - 3 * s) + ' C' + n1(bx + 18 * s) + ' ' + n1(by - 16 * s) + ' ' + n1(bx + 26 * s) + ' ' + n1(by - 4 * s) + ' ' + n1(bx + 6 * s) + ' ' + n1(by) + '" fill="none" stroke="' + edge + '" stroke-width="1.2" opacity=".8"/>' +
        '<path d="M' + n1(bx - 2) + ' ' + n1(by + 2) + ' L' + n1(bx - 13 * s) + ' ' + n1(by + 24 * s) + ' L' + n1(bx - 7 * s) + ' ' + n1(by + 20 * s) + ' L' + n1(bx - 4 * s) + ' ' + n1(by + 27 * s) + ' L' + n1(bx + 1) + ' ' + n1(by + 3) + 'Z" fill="' + fill + '" stroke="' + edge + '" stroke-width="1"/>' +
        '<path d="M' + n1(bx + 2) + ' ' + n1(by + 2) + ' L' + n1(bx + 14 * s) + ' ' + n1(by + 22 * s) + ' L' + n1(bx + 8 * s) + ' ' + n1(by + 19 * s) + ' L' + n1(bx + 6 * s) + ' ' + n1(by + 26 * s) + ' L' + n1(bx - 1) + ' ' + n1(by + 3) + 'Z" fill="' + fill + '" stroke="' + edge + '" stroke-width="1"/>' +
        '<ellipse cx="' + n1(bx) + '" cy="' + n1(by) + '" rx="' + n1(6 * s) + '" ry="' + n1(4.6 * s) + '" fill="' + fill + '" stroke="' + edge + '" stroke-width="1.2"/>' +
        '<ellipse cx="' + n1(bx - 1.5 * s) + '" cy="' + n1(by - 1.4 * s) + '" rx="' + n1(2 * s) + '" ry="' + n1(1.3 * s) + '" fill="#FFF4DC" opacity=".55"/>' +
      '</g>';
  }

  function cube(o) {
    var s = 0.55, x0 = o.x0, x1 = o.x1, yt = o.yt, yb = o.yb, d = o.d, ov = 5, lh = o.lidH || 18;
    var dy = d * s, lT = yt - lh + 5, lB = yt + 5, lx0 = x0 - ov, lx1 = x1 + ov;
    var mx = x0 + (x1 - x0) * (o.rx == null ? 0.5 : o.rx), rw = o.rw || 13;
    function sy(x, y, base) { return y - (x - base) * s; }
    var sx0 = x1 + d * 0.5 - rw * 0.32, sx1 = x1 + d * 0.5 + rw * 0.32;
    var lsx0 = lx1 + d * 0.5 - rw * 0.32, lsx1 = lx1 + d * 0.5 + rw * 0.32;
    var q = 0.2, t1 = 0.5 - q, t2 = 0.5 + q;
    var rib = o.ribbon, re = o.ribbonEdge;

    var frontRect = P([[x0, yt], [x1, yt], [x1, yb], [x0, yb]]);
    var sideP = P([[x1, yt], [x1 + d, yt - dy], [x1 + d, yb - dy], [x1, yb]]);
    var insideP = P([[x0, yt], [x0 + d, yt - dy], [x1 + d, yt - dy], [x1, yt]]);
    var beamP = P([[x0 + 6, yt - dy * 0.5], [x1 + d - 6, yt - dy * 0.5], [x1 + d + 22, -40], [x0 - 22, -40]]);

    var ribbons = o.noRibbon ? '' :
      '<path class="gf-ribbon" d="' + P([[mx - rw / 2, yt], [mx + rw / 2, yt], [mx + rw / 2, yb], [mx - rw / 2, yb]]) + '" fill="' + rib + '"/>' +
      '<path d="M' + n1(mx - rw / 2 + 2) + ' ' + yt + ' V' + yb + 'M' + n1(mx + rw / 2 - 2) + ' ' + yt + ' V' + yb + '" stroke="' + re + '" stroke-width=".8" fill="none" class="gf-ribbon"/>';
    var sideRib = o.noRibbon ? '' :
      '<path class="gf-ribbon" d="' + P([[sx0, sy(sx0, yt, x1)], [sx1, sy(sx1, yt, x1)], [sx1, sy(sx1, yb, x1)], [sx0, sy(sx0, yb, x1)]]) + '" fill="' + re + '"/>';
    var lidRibbons = o.noRibbon ? '' :
      '<path d="' + P([[mx - rw / 2, lT], [mx + rw / 2, lT], [mx + rw / 2, lB], [mx - rw / 2, lB]]) + '" fill="' + rib + '"/>' +
      '<path d="' + P([[lsx0, sy(lsx0, lT, lx1)], [lsx1, sy(lsx1, lT, lx1)], [lsx1, sy(lsx1, lB, lx1)], [lsx0, sy(lsx0, lB, lx1)]]) + '" fill="' + re + '"/>' +
      '<path d="' + P([[mx - rw / 2, lT], [mx + rw / 2, lT], [mx + rw / 2 + d, lT - dy], [mx - rw / 2 + d, lT - dy]]) + '" fill="' + rib + '"/>' +
      '<path d="' + P([[lx0 + d * t1, lT - dy * t1], [lx1 + d * t1, lT - dy * t1], [lx1 + d * t2, lT - dy * t2], [lx0 + d * t2, lT - dy * t2]]) + '" fill="' + rib + '"/>';

    return '' +
      '<ellipse class="gf-shadow" cx="' + n1((x0 + x1 + d) / 2) + '" cy="' + n1(yb + 4) + '" rx="' + n1((x1 - x0 + d) / 2 + 10) + '" ry="7"/>' +
      '<g class="gf-all">' +
        '<g class="gf-body">' +
          '<path class="gf-back" d="' + frontRect + '"/>' +
          '<path d="' + sideP + '" fill="' + o.side + '"/>' +
          (o.sidePat ? '<path d="' + sideP + '" fill="url(#' + o.sidePat + ')"/>' : '') +
          '<path d="' + sideP + '" fill="#080B1E" opacity=".28"/>' +
          (o.sideDeco || '') + sideRib +
          '<path class="gf-inside" d="' + insideP + '"/>' +
          '<path class="gf-glow" d="' + insideP + '"/>' +
          '<g class="gf-front">' +
            '<path d="' + frontRect + '" fill="' + o.front + '"/>' +
            (o.frontPat ? '<path d="' + frontRect + '" fill="url(#' + o.frontPat + ')"/>' : '') +
            (o.frontDeco || '') + ribbons +
            '<path d="' + frontRect + '" fill="url(#gf-shade)"/>' +
          '</g>' +
        '</g>' +
        '<path class="gf-beam" d="' + beamP + '"/>' +
        '<g class="gf-lid">' +
          '<path d="' + P([[lx1, lT], [lx1 + d, lT - dy], [lx1 + d, lB - dy], [lx1, lB]]) + '" fill="' + o.lidSide + '"/>' +
          '<path d="' + P([[lx0, lT], [lx1, lT], [lx1, lB], [lx0, lB]]) + '" fill="' + o.lidFront + '"/>' +
          (o.lidDeco ? o.lidDeco(lx0, lx1, lT, lB) : '') +
          '<path d="' + P([[lx0, lT], [lx0 + d, lT - dy], [lx1 + d, lT - dy], [lx1, lT]]) + '" fill="' + o.lidTop + '"/>' +
          lidRibbons +
          '<path d="M' + lx0 + ' ' + n1(lT) + ' H' + lx1 + ' L' + n1(lx1 + d) + ' ' + n1(lT - dy) + '" fill="none" stroke="#FFF4DC" stroke-opacity=".35" stroke-width="1"/>' +
          (o.noRibbon ? '' : bow(mx + d * 0.5, lT - dy * 0.5, o.bowScale || 1, o.bow, re)) +
        '</g>' +
      '</g>';
  }

  function zariBand(x0, x1, y, h) {
    return '<rect x="' + x0 + '" y="' + n1(y) + '" width="' + n1(x1 - x0) + '" height="' + h + '" fill="url(#gf-zari)"/>' +
      '<path d="M' + x0 + ' ' + n1(y) + ' H' + x1 + ' M' + x0 + ' ' + n1(y + h) + ' H' + x1 + '" stroke="#FFD778" stroke-width=".8"/>';
  }

  function lotusMotif(x, y, s, fill, stroke) {
    return '<g transform="translate(' + n1(x) + ' ' + n1(y) + ') scale(' + s + ')">' +
      '<path d="M0 -9 C4 -5 4 1 0 4 C-4 1 -4 -5 0 -9Z" fill="' + fill + '" stroke="' + stroke + '" stroke-width=".8"/>' +
      '<path d="M0 4 C-7 3 -10 -2 -10 -5 C-6 -4 -3 -1 0 4Z M0 4 C7 3 10 -2 10 -5 C6 -4 3 -1 0 4Z" fill="' + fill + '" stroke="' + stroke + '" stroke-width=".8"/>' +
      '<path d="M-8 6 H8" stroke="' + stroke + '" stroke-width=".8"/></g>';
  }

  var BOXES = [
    {
      name: 'The Rani', style: 'flip', desc: 'the tall magenta box with a gold paisley print',
      svg: function () {
        return cube({
          x0: 44, x1: 116, yt: 86, yb: 214, d: 26, lidH: 20,
          front: '#DB59C8', side: '#A83C97', frontPat: 'gf-paisley', sidePat: 'gf-paisley',
          lidFront: '#C2449F', lidSide: '#8E2F80', lidTop: '#E77BD6',
          ribbon: '#FFD778', ribbonEdge: '#D9A441', bow: '#FFD778',
          frontDeco: zariBand(44, 116, 94, 7) + zariBand(44, 116, 198, 7),
          lidDeco: function (a, b, t, bt) { return zariBand(a, b, t + 6, 6); }
        });
      }
    },
    {
      name: 'The Jaali', style: 'spin', desc: 'the saffron box with a lattice pattern',
      svg: function () {
        return cube({
          x0: 36, x1: 122, yt: 124, yb: 214, d: 26,
          front: '#FF9F32', side: '#D97A1E', frontPat: 'gf-jaali', sidePat: 'gf-jaali',
          lidFront: '#F08A24', lidSide: '#B9661A', lidTop: '#FFB65C',
          ribbon: '#DB59C8', ribbonEdge: '#9B2F8C', bow: '#DB59C8',
          frontDeco: '<path d="M36 206 H122" stroke="#241044" stroke-width="2" opacity=".5"/>'
        });
      }
    },
    {
      name: 'The Hatbox', style: 'slide', desc: 'the round purple hatbox with lotus motifs',
      svg: function () {
        var lot = '';
        for (var i = 0; i < 5; i++) lot += lotusMotif(46 + i * 20, 168, 0.95, '#FFD778', '#C99A35');
        var dots = '';
        for (var j = 0; j < 12; j++) dots += '<circle cx="' + (37 + j * 9.5) + '" cy="140" r="1.6" fill="#FFD778"/><circle cx="' + (37 + j * 9.5) + '" cy="196" r="1.6" fill="#FFD778"/>';
        return '' +
          '<ellipse class="gf-shadow" cx="86" cy="216" rx="66" ry="8"/>' +
          '<g class="gf-all">' +
            '<g class="gf-body">' +
              '<path d="M30 122 V210 A56 15 0 0 0 142 210 V122Z" fill="url(#gf-cyl)"/>' +
              '<path d="M30 152 A56 15 0 0 0 142 152 V184 A56 15 0 0 1 30 184Z" fill="#DB59C8" opacity=".22"/>' +
              '<path d="M30 152 A56 15 0 0 0 142 152 M30 184 A56 15 0 0 0 142 184" fill="none" stroke="#FFD778" stroke-width="1"/>' +
              lot + dots +
              '<path class="gf-ribbon" d="M83 122 V224 H89 V122Z" fill="#DB59C8"/>' +
              '<ellipse class="gf-inside" cx="86" cy="122" rx="56" ry="15"/>' +
              '<ellipse class="gf-glow" cx="86" cy="122" rx="56" ry="15"/>' +
            '</g>' +
            '<path class="gf-beam" d="M36 120 H136 L160 -40 H12Z"/>' +
            '<g class="gf-lid">' +
              '<path d="M26 104 V122 A60 16 0 0 0 146 122 V104Z" fill="#E9B54E"/>' +
              '<path d="M26 104 V122 A60 16 0 0 0 146 122 V104Z" fill="url(#gf-cylLid)"/>' +
              '<path d="M26 113 A60 16 0 0 0 146 113" fill="none" stroke="#7A3A12" stroke-width=".8" stroke-dasharray="2 3"/>' +
              '<ellipse cx="86" cy="104" rx="60" ry="16" fill="#FFE3A0"/>' +
              '<ellipse cx="86" cy="104" rx="46" ry="11.5" fill="none" stroke="#C99A35" stroke-width="1"/>' +
              '<g transform="translate(86 104) scale(1 .27)">' +
                '<circle r="30" fill="none" stroke="#DB59C8" stroke-width="3"/>' +
                '<path d="M0 -26 C8 -14 8 -6 0 0 C-8 -6 -8 -14 0 -26Z M0 26 C8 14 8 6 0 0 C-8 6 -8 14 0 26Z M-26 0 C-14 8 -6 8 0 0 C-6 -8 -14 -8 -26 0Z M26 0 C14 8 6 8 0 0 C6 -8 14 -8 26 0Z" fill="#DB59C8"/>' +
              '</g>' +
              '<path class="gf-ribbon" d="M83 104 V136 H89 V104Z" fill="#DB59C8"/>' +
              '<g class="gf-bow">' +
                '<path d="M86 102 C78 90 70 96 80 103Z M86 102 C94 90 102 96 92 103Z" fill="#DB59C8" stroke="#9B2F8C" stroke-width="1"/>' +
                '<circle cx="86" cy="102" r="4" fill="#DB59C8" stroke="#9B2F8C"/>' +
                '<path d="M86 104 Q82 120 80 138 M86 104 Q90 120 93 136" stroke="#FFD778" stroke-width="2" fill="none"/>' +
                '<path d="M76 138 L84 138 L82 152 L78 152Z M89 136 L97 136 L95 150 L91 150Z" fill="#FFD778"/>' +
              '</g>' +
            '</g>' +
          '</g>';
      }
    },
    {
      name: 'The Mandala', style: 'unfold', desc: 'the wide ivory box with a mandala stamp',
      svg: function () {
        var petals = '';
        for (var i = 0; i < 8; i++) petals += '<path transform="rotate(' + (i * 45) + ' 66 185)" d="M66 168 C71 174 71 180 66 184 C61 180 61 174 66 168Z" fill="#DB59C8" opacity=".85"/>';
        return cube({
          x0: 22, x1: 136, yt: 156, yb: 214, d: 24, lidH: 16, rx: 0.8, rw: 12,
          front: '#FFF4DC', side: '#E3D0A6',
          lidFront: '#F3E2BE', lidSide: '#CDB68A', lidTop: '#FFF9EA',
          ribbon: '#E8641A', ribbonEdge: '#A9450F', bow: '#E8641A', bowScale: 1.1,
          frontDeco: '<rect x="22" y="160" width="114" height="6" fill="#FF9F32"/><rect x="22" y="204" width="114" height="6" fill="#FF9F32"/>' +
            '<path d="M22 168 H136 M22 202 H136" stroke="#DB59C8" stroke-width="1"/>' +
            petals + '<circle cx="66" cy="185" r="15" fill="none" stroke="#C99A35" stroke-width="1.4"/><circle cx="66" cy="185" r="5" fill="#FFD778" stroke="#C99A35"/>' +
            '<circle cx="66" cy="185" r="19.5" fill="none" stroke="#C99A35" stroke-width=".8" stroke-dasharray="1.5 2.5"/>' +
            '<path d="M34 185 l4 -4 l4 4 l-4 4Z M90 185 l4 -4 l4 4 l-4 4Z" fill="#FF9F32"/>',
          lidDeco: function (a, b, t) { return '<path d="M' + a + ' ' + (t + 8) + ' H' + b + '" stroke="#FF9F32" stroke-width="2" stroke-dasharray="4 3"/>'; }
        });
      }
    },
    {
      name: 'The Bandhani', style: 'bounce', desc: 'the small red tie-dye box with an oversized bow',
      svg: function () {
        return cube({
          x0: 50, x1: 118, yt: 146, yb: 214, d: 22, lidH: 17,
          front: '#C2401E', side: '#922E14', frontPat: 'gf-bandhani', sidePat: 'gf-bandhani',
          lidFront: '#AD3519', lidSide: '#7F2711', lidTop: '#D9562F',
          ribbon: '#FFD778', ribbonEdge: '#D9A441', bow: '#FFD778', bowScale: 1.45,
          frontDeco: '<path d="M50 150 H118" stroke="#FFD778" stroke-width="1.5" stroke-dasharray="1 3"/>'
        });
      }
    },
    {
      // Revision 3: a temple box (Hindu nagara vocabulary) — devakoshtha niches with diyas on the front, and a
      // stepped nagara shikhara lid: tiered bhumi bands, two miniature urushringa spires, amalaka, kalasha, dhvaja
      name: 'The Mandir', style: 'burst', desc: 'the temple box with a shikhara spire lid',
      svg: function () {
        var niches = '';
        [56, 78, 100].forEach(function (x) {
          // stepped temple niche: pilasters, a two-step corbelled top rising to a small pointed rekha cap
          niches += '<path d="M' + (x - 8) + ' 206 V186 H' + (x - 6) + ' V182 H' + (x - 3.5) + ' V178 L' + x + ' 170 L' + (x + 3.5) + ' 178 V182 H' + (x + 6) + ' V186 H' + (x + 8) + ' V206Z" fill="url(#gf-nicheGlow)" stroke="#FFD778" stroke-width="1.1" stroke-linejoin="miter"/>' +
            '<path d="M' + (x - 5) + ' 206 V188 M' + (x + 5) + ' 206 V188" stroke="#FFD778" stroke-width=".6" opacity=".6"/>' +
            '<path d="M' + (x - 3.4) + ' 201 Q' + x + ' 205 ' + (x + 3.4) + ' 201Z" fill="#E8641A"/>' +
            '<path class="gf-niche-flame" d="M' + x + ' 193.5 C' + (x + 1.8) + ' 196.5 ' + (x + 1.6) + ' 199.6 ' + x + ' 200.4 C' + (x - 1.6) + ' 199.6 ' + (x - 1.8) + ' 196.5 ' + x + ' 193.5Z" fill="#FFD778"/>';
        });
        var body = cube({
          x0: 42, x1: 120, yt: 146, yb: 214, d: 24, noRibbon: true, lidH: 14,
          front: '#2E1858', side: '#1D0E3C', frontPat: 'gf-dots',
          lidFront: '#FFD778', lidSide: '#C99A35', lidTop: '#FFE7A8',
          frontDeco: zariBand(42, 120, 152, 6) + niches + '<path d="M42 209 H120" stroke="#FFD778" stroke-width="1" opacity=".55"/>',
          lidDeco: function (a, b, t) { return '<path d="M' + a + ' ' + (t + 7) + ' H' + b + '" stroke="#DB59C8" stroke-width="2"/>'; }
        });
        var DX = 93, DB = 129;
        function spire(cx, base, hw, h) {
          // a nagara rekha profile: near-vertical lower walls curving in to a narrow neck (convex, never onion)
          return 'M' + n1(cx - hw) + ' ' + base + ' C' + n1(cx - hw) + ' ' + n1(base - h * 0.45) + ' ' + n1(cx - hw * 0.72) + ' ' + n1(base - h * 0.85) + ' ' + n1(cx - hw * 0.34) + ' ' + n1(base - h) +
            ' H' + n1(cx + hw * 0.34) + ' C' + n1(cx + hw * 0.72) + ' ' + n1(base - h * 0.85) + ' ' + n1(cx + hw) + ' ' + n1(base - h * 0.45) + ' ' + n1(cx + hw) + ' ' + base + 'Z';
        }
        var tiers = '', i;
        for (i = 1; i <= 5; i++) {
          // bhumi-amalaka bands: horizontal tiers that follow the tower's taper
          var ty = DB - i * 10.4, k = 1 - Math.pow(i / 6.1, 2.1), hw = 24 * (0.36 + 0.64 * k);
          tiers += '<path d="M' + n1(DX - hw) + ' ' + n1(ty) + ' H' + n1(DX + hw) + '" stroke="#9C6A22" stroke-width="1.1" opacity=".75"/>' +
            '<circle cx="' + n1(DX - hw + 2.4) + '" cy="' + n1(ty) + '" r="1.3" fill="#FFF1C4"/><circle cx="' + n1(DX + hw - 2.4) + '" cy="' + n1(ty) + '" r="1.3" fill="#FFF1C4"/>';
        }
        var ribs = '';
        for (i = -3; i <= 3; i++) ribs += '<path d="M' + n1(DX + i * 4.2) + ' ' + (DB - 61) + ' v-4.4" stroke="#9C6A22" stroke-width=".9"/>';
        var shikhara = '' +
          '<g class="gf-shikhara">' +
            // the platform (jagati) the tower stands on
            '<path d="M' + (DX - 36) + ' ' + DB + ' H' + (DX + 36) + '" stroke="#FFD778" stroke-width="3"/>' +
            // urushringa: miniature spires leaning on the main tower
            '<path d="' + spire(DX - 29, DB, 8, 27) + '" fill="url(#gf-shikhara)" stroke="#C99A35" stroke-width=".9"/>' +
            '<path d="' + spire(DX + 29, DB, 8, 27) + '" fill="url(#gf-shikhara)" stroke="#C99A35" stroke-width=".9"/>' +
            '<path d="M' + (DX - 35) + ' ' + (DB - 9) + ' H' + (DX - 23) + ' M' + (DX - 34) + ' ' + (DB - 18) + ' H' + (DX - 24) + ' M' + (DX + 23) + ' ' + (DB - 9) + ' H' + (DX + 35) + ' M' + (DX + 24) + ' ' + (DB - 18) + ' H' + (DX + 34) + '" stroke="#9C6A22" stroke-width=".9" opacity=".7"/>' +
            '<ellipse cx="' + (DX - 29) + '" cy="' + (DB - 28) + '" rx="3.6" ry="1.4" fill="#FFE7A8" stroke="#C99A35" stroke-width=".6"/><ellipse cx="' + (DX + 29) + '" cy="' + (DB - 28) + '" rx="3.6" ry="1.4" fill="#FFE7A8" stroke="#C99A35" stroke-width=".6"/>' +
            '<circle cx="' + (DX - 29) + '" cy="' + (DB - 31.4) + '" r="1.7" fill="#FFD778"/><circle cx="' + (DX + 29) + '" cy="' + (DB - 31.4) + '" r="1.7" fill="#FFD778"/>' +
            // main rekha tower
            '<path d="' + spire(DX, DB, 26, 60) + '" fill="url(#gf-shikhara)" stroke="#C99A35" stroke-width="1"/>' +
            // central offset (latina projection) and its niche
            '<path d="M' + (DX - 5) + ' ' + DB + ' V' + (DB - 56) + ' M' + (DX + 5) + ' ' + DB + ' V' + (DB - 56) + '" stroke="#C99A35" stroke-width=".8" opacity=".7"/>' +
            '<path d="M' + (DX - 4) + ' ' + (DB - 3) + ' V' + (DB - 13) + ' L' + DX + ' ' + (DB - 18) + ' L' + (DX + 4) + ' ' + (DB - 13) + ' V' + (DB - 3) + 'Z" fill="#2E1858" stroke="#FFD778" stroke-width=".8"/>' +
            tiers +
            // amalaka: the ribbed stone disc that crowns a nagara shikhara
            '<ellipse cx="' + DX + '" cy="' + (DB - 63) + '" rx="13.5" ry="4.2" fill="#FFE7A8" stroke="#C99A35" stroke-width="1"/>' + ribs +
            // kalasha finial
            '<path d="M' + (DX - 4.5) + ' ' + (DB - 67) + ' H' + (DX + 4.5) + '" stroke="#C99A35" stroke-width="1.4"/>' +
            '<circle cx="' + DX + '" cy="' + (DB - 72) + '" r="4.6" fill="#FFD778" stroke="#C99A35" stroke-width=".8"/>' +
            '<path d="M' + (DX - 2.6) + ' ' + (DB - 76.4) + ' H' + (DX + 2.6) + ' L' + (DX + 1.6) + ' ' + (DB - 79) + ' H' + (DX - 1.6) + 'Z" fill="#FFD778"/>' +
            '<path d="M' + DX + ' ' + (DB - 79) + ' C' + (DX + 2.2) + ' ' + (DB - 81) + ' ' + (DX + 1.4) + ' ' + (DB - 84) + ' ' + DX + ' ' + (DB - 86) + ' C' + (DX - 1.4) + ' ' + (DB - 84) + ' ' + (DX - 2.2) + ' ' + (DB - 81) + ' ' + DX + ' ' + (DB - 79) + 'Z" fill="#FFF1C4"/>' +
            // dhvaja: the temple flag on its staff
            '<path d="M' + (DX + 2) + ' ' + (DB - 72) + ' V' + (DB - 100) + '" stroke="#C99A35" stroke-width="1"/>' +
            '<path class="gf-dhvaja" d="M' + (DX + 2) + ' ' + (DB - 100) + ' L' + (DX + 17) + ' ' + (DB - 95.5) + ' L' + (DX + 2) + ' ' + (DB - 91) + 'Z" fill="#FF9F32"/>' +
          '</g>';
        var cut = body.lastIndexOf('</g></g>'); // close of .gf-lid then .gf-all
        return body.slice(0, cut) + shikhara + body.slice(cut);
      }
    }
  ];

  /* ------------------------------------------------------------------
     Sixteen surprises
     ------------------------------------------------------------------ */
  var ART = {
    katli: '<svg viewBox="0 0 100 100"><path d="M50 62 L86 74 L50 86 L14 74Z" fill="#E5C892"/><path d="M14 74 L50 86 V92 L14 80Z" fill="#C2A06A"/><path d="M50 86 L86 74 V80 L50 92Z" fill="#AD8A55"/>' +
      '<path d="M50 44 L86 56 L50 68 L14 56Z" fill="#EED7AB"/><path d="M14 56 L50 68 V74 L14 62Z" fill="#C9A874"/><path d="M50 68 L86 56 V62 L50 74Z" fill="#B8945F"/>' +
      '<path d="M50 26 L86 38 L50 50 L14 38Z" fill="#F5E4C3"/><path d="M14 38 L50 50 V56 L14 44Z" fill="#D2B07B"/><path d="M50 50 L86 38 V44 L50 56Z" fill="#BE9A63"/>' +
      '<path d="M50 30 L77 39 L50 47 L23 39Z" fill="#E8EBF3" opacity=".9"/><path d="M40 36 L56 41 M46 33 L62 38" stroke="#FFFFFF" stroke-width="1.2" opacity=".8"/>' +
      '<path d="M78 16 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2Z" fill="#FFD778"/></svg>',
    laddoo: '<svg viewBox="0 0 100 100"><g>' +
      [[32, 70], [68, 70], [50, 42]].map(function (p) {
        return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="19" fill="#F08A24"/><circle cx="' + (p[0] + 3) + '" cy="' + (p[1] + 3) + '" r="16" fill="#E8641A" opacity=".35"/>' +
          '<circle cx="' + (p[0] - 6) + '" cy="' + (p[1] - 7) + '" r="5" fill="#FFF4DC" opacity=".45"/>' +
          '<g fill="#B84A16" opacity=".6"><circle cx="' + (p[0] + 5) + '" cy="' + (p[1] - 4) + '" r="1.6"/><circle cx="' + (p[0] - 7) + '" cy="' + (p[1] + 5) + '" r="1.6"/><circle cx="' + (p[0] + 8) + '" cy="' + (p[1] + 8) + '" r="1.6"/><circle cx="' + p[0] + '" cy="' + (p[1] + 2) + '" r="1.6"/><circle cx="' + (p[0] - 2) + '" cy="' + (p[1] + 11) + '" r="1.6"/></g>';
      }).join('') +
      '<path d="M42 26 l3 -6 M52 24 l1 -7 M60 27 l4 -5" stroke="#FFF4DC" stroke-width="1.6" stroke-linecap="round"/></g></svg>',
    popper: '<svg viewBox="0 0 100 100"><path d="M18 90 L40 40 L64 64Z" fill="#DB59C8"/><path d="M26 72 L46 50 L52 56 L30 78Z M34 54 L42 46 L49 52 L40 60Z" fill="#FFD778"/><path d="M40 40 L64 64" stroke="#FFF4DC" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M54 34 C58 22 70 26 66 16 M66 48 C78 46 76 34 88 34 M60 40 C66 30 78 34 78 22" fill="none" stroke="#FF9F32" stroke-width="2.4" stroke-linecap="round"/>' +
      '<rect x="72" y="10" width="6" height="4" fill="#3FD0C9" transform="rotate(25 75 12)"/><rect x="84" y="46" width="6" height="4" fill="#FFD778" transform="rotate(-20 87 48)"/><circle cx="50" cy="22" r="2.6" fill="#FFF4DC"/><circle cx="88" cy="24" r="2.4" fill="#DB59C8"/><rect x="74" y="60" width="5" height="3.5" fill="#DB59C8" transform="rotate(40 76 62)"/><circle cx="62" cy="10" r="2" fill="#FFD778"/></svg>',
    marigold: (function () {
      var s = '<svg viewBox="0 0 100 100"><path d="M50 74 C40 86 24 88 16 84 C26 78 38 74 50 74Z M50 74 C62 88 78 88 86 82 C74 78 62 74 50 74Z" fill="#3B7A3F"/>';
      for (var i = 0; i < 16; i++) { var a = i / 16 * Math.PI * 2; s += '<circle cx="' + n1(50 + Math.cos(a) * 25) + '" cy="' + n1(48 + Math.sin(a) * 25) + '" r="11" fill="#FF9F32" stroke="#E8641A" stroke-width="1"/>'; }
      for (i = 0; i < 12; i++) { a = i / 12 * Math.PI * 2 + 0.2; s += '<circle cx="' + n1(50 + Math.cos(a) * 15) + '" cy="' + n1(48 + Math.sin(a) * 15) + '" r="9" fill="#FFB547" stroke="#E8641A" stroke-width=".8"/>'; }
      return s + '<circle cx="50" cy="48" r="10" fill="#E8641A"/><circle cx="47" cy="45" r="2" fill="#FFD778"/><circle cx="54" cy="50" r="1.6" fill="#FFD778"/><circle cx="49" cy="53" r="1.4" fill="#FFD778"/></svg>';
    })(),
    rocket: '<svg viewBox="0 0 100 100"><g transform="rotate(18 50 50)"><path d="M50 8 C58 16 60 24 60 30 H40 C40 24 42 16 50 8Z" fill="#FFD778"/><rect x="40" y="30" width="20" height="36" fill="#DB59C8"/><rect x="40" y="36" width="20" height="4" fill="#FFD778"/><rect x="40" y="56" width="20" height="4" fill="#FFD778"/><path d="M44 44 l6 4 6 -4" stroke="#FFF4DC" stroke-width="1.6" fill="none"/><path d="M50 66 V96" stroke="#9B6A3C" stroke-width="2.5"/></g>' +
      '<g stroke="#FFD778" stroke-width="2" stroke-linecap="round"><path d="M36 80 l-8 6 M40 86 l-4 9 M30 72 l-10 1"/></g><circle cx="22" cy="88" r="2" fill="#FF9F32"/><circle cx="30" cy="95" r="1.6" fill="#FFF4DC"/></svg>',
    jack: '<svg viewBox="0 0 100 120"><path class="gf-spring" d="M50 116 L36 110 L64 104 L36 98 L64 92 L36 86 L64 80 L36 74 L50 68" fill="none" stroke="#FFD778" stroke-width="3" stroke-linejoin="round"/>' +
      '<g class="gf-jhead"><path d="M50 4 C58 14 60 22 56 28 C54 32 46 32 44 28 C40 22 42 14 50 4Z" fill="#FF9F32"/><path d="M50 14 C54 20 55 24 52 28 C51 30 49 30 48 28 C45 24 46 20 50 14Z" fill="#FFF4DC"/>' +
      '<path d="M16 34 C18 58 34 70 50 70 C66 70 82 58 84 34Z" fill="#C2561F"/><ellipse cx="50" cy="34" rx="34" ry="6" fill="#7A3112"/><path d="M16 34 C18 58 34 70 50 70 C66 70 82 58 84 34" fill="none" stroke="#FFD778" stroke-width="1.5"/>' +
      '<ellipse cx="38" cy="46" rx="6" ry="7" fill="#FFF4DC"/><ellipse cx="62" cy="46" rx="6" ry="7" fill="#FFF4DC"/><circle cx="39" cy="47" r="3" fill="#080B1E"/><circle cx="61" cy="47" r="3" fill="#080B1E"/><path d="M40 56 Q50 66 60 56 Q50 60 40 56Z" fill="#3B0F14"/>' +
      '<circle cx="28" cy="54" r="3" fill="#DB59C8" opacity=".6"/><circle cx="72" cy="54" r="3" fill="#DB59C8" opacity=".6"/></g></svg>',
    ooo: '<svg viewBox="0 0 100 100"><g transform="rotate(-6 50 50)"><path d="M18 14 H72 L84 26 V88 H18Z" fill="#FFF4DC"/><path d="M72 14 V26 H84Z" fill="#E3D0A6"/>' +
      '<text x="24" y="32" font-family="Mukta, sans-serif" font-size="8.5" font-weight="500" fill="#241044" letter-spacing=".5">OUT OF</text><text x="24" y="42" font-family="Mukta, sans-serif" font-size="8.5" font-weight="500" fill="#241044" letter-spacing=".5">OFFICE</text>' +
      '<path d="M24 48 H70 M24 54 H62" stroke="#241044" stroke-width="1.2" opacity=".35"/>' +
      '<circle cx="40" cy="66" r="3.4" fill="#241044"/><circle cx="60" cy="66" r="3.4" fill="#241044"/><circle cx="41" cy="65" r="1" fill="#FFF4DC"/><circle cx="61" cy="65" r="1" fill="#FFF4DC"/>' +
      '<ellipse class="gf-mouth" cx="50" cy="77" rx="6" ry="4" fill="#DB59C8"/></g></svg>',
    soan: '<svg viewBox="0 0 100 100"><path d="M14 34 L60 22 L88 34 L42 46Z" fill="#FFE08A"/><path d="M14 34 L42 46 V84 L14 72Z" fill="#F5C451"/><path d="M42 46 L88 34 V72 L42 84Z" fill="#E0A93E"/>' +
      '<path d="M18 50 L38 58 V66 L18 58Z" fill="#E8641A"/><text x="47" y="58" font-family="Mukta, sans-serif" font-size="7" font-weight="500" fill="#7A3112" transform="skewY(-14)">SOAN</text>' +
      '<g transform="rotate(-14 66 58)"><circle cx="66" cy="62" r="11" fill="none" stroke="#DB59C8" stroke-width="2" stroke-dasharray="3 2"/><text x="66" y="65" text-anchor="middle" font-family="Mukta, sans-serif" font-size="8" font-weight="500" fill="#DB59C8">x14</text></g>' +
      '<path d="M24 28 L70 40" stroke="#FFF4DC" stroke-width="5" opacity=".7"/><circle cx="20" cy="92" r="1.6" fill="#FFE08A"/><circle cx="30" cy="94" r="1.2" fill="#FFE08A"/><circle cx="80" cy="90" r="1.4" fill="#FFE08A"/></svg>',
    minibox: '<svg viewBox="0 0 100 100"><rect x="22" y="48" width="56" height="40" fill="#DB59C8"/><rect x="18" y="38" width="64" height="12" fill="#C2449F"/><rect x="46" y="38" width="8" height="50" fill="#FFD778"/>' +
      '<path d="M50 38 C40 24 30 32 46 38Z M50 38 C60 24 70 32 54 38Z" fill="#FFD778" stroke="#D9A441"/>' +
      '<g transform="translate(58 14) scale(.32)"><rect x="22" y="48" width="56" height="40" fill="#FF9F32"/><rect x="18" y="38" width="64" height="12" fill="#F08A24"/><rect x="46" y="38" width="8" height="50" fill="#DB59C8"/><path d="M50 38 C40 24 30 32 46 38Z M50 38 C60 24 70 32 54 38Z" fill="#DB59C8"/></g>' +
      '<text x="80" y="12" font-family="Cormorant Garamond, serif" font-size="12" font-style="italic" fill="#FFD778">?</text></svg>',
    coin: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="36" fill="#E0A93E"/><circle cx="50" cy="48" r="36" fill="#FFD778"/><circle cx="50" cy="48" r="28" fill="none" stroke="#C99A35" stroke-width="2"/><circle cx="50" cy="48" r="31" fill="none" stroke="#C99A35" stroke-width="1" stroke-dasharray="1.5 2.5"/>' +
      '<g transform="translate(50 52) scale(1.7)"><path d="M0 -9 C4 -5 4 1 0 4 C-4 1 -4 -5 0 -9Z" fill="#E0A93E"/><path d="M0 4 C-7 3 -10 -2 -10 -5 C-6 -4 -3 -1 0 4Z M0 4 C7 3 10 -2 10 -5 C6 -4 3 -1 0 4Z" fill="#E0A93E"/></g>' +
      '<path d="M30 30 Q36 22 46 20" stroke="#FFF4DC" stroke-width="3" stroke-linecap="round" fill="none" opacity=".8"/><path d="M82 14 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2Z" fill="#FFF4DC"/></svg>',
    heart: (function () {
      var s = '<svg viewBox="0 0 100 100">';
      for (var i = 0; i < 34; i++) {
        var t = i / 34 * Math.PI * 2;
        var x = 16 * Math.pow(Math.sin(t), 3), y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        s += '<circle cx="' + n1(50 + x * 2.3) + '" cy="' + n1(46 - y * 2.3) + '" r="' + (i % 2 ? 2.2 : 3) + '" fill="' + (i % 3 ? '#DB59C8' : '#FFD778') + '"/>';
      }
      for (i = 0; i < 10; i++) { var a = i / 10 * Math.PI * 2; s += '<path d="M' + n1(50 + Math.cos(a) * 6) + ' ' + n1(46 + Math.sin(a) * 6) + ' L' + n1(50 + Math.cos(a) * 14) + ' ' + n1(46 + Math.sin(a) * 14) + '" stroke="#FFF4DC" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>'; }
      return s + '</svg>';
    })(),
    moth: '<svg viewBox="0 0 100 100"><g class="gf-wing gf-wing-l"><path d="M48 46 C30 20 8 26 12 44 C14 56 34 58 48 50Z" fill="#E3D0A6"/><path d="M48 52 C32 60 22 76 34 80 C44 82 48 66 48 56Z" fill="#CDB68A"/><circle cx="26" cy="40" r="5" fill="#9B6A3C" opacity=".6"/></g>' +
      '<g class="gf-wing gf-wing-r"><path d="M52 46 C70 20 92 26 88 44 C86 56 66 58 52 50Z" fill="#E3D0A6"/><path d="M52 52 C68 60 78 76 66 80 C56 82 52 66 52 56Z" fill="#CDB68A"/><circle cx="74" cy="40" r="5" fill="#9B6A3C" opacity=".6"/></g>' +
      '<ellipse cx="50" cy="54" rx="5" ry="16" fill="#7A5534"/><circle cx="50" cy="38" r="5" fill="#7A5534"/><path d="M48 34 C44 24 38 22 34 22 M52 34 C56 24 62 22 66 22" stroke="#7A5534" stroke-width="1.5" fill="none"/>' +
      '<circle cx="48" cy="37" r="1.4" fill="#FFF4DC"/><circle cx="52" cy="37" r="1.4" fill="#FFF4DC"/><text x="72" y="16" font-family="Mukta, sans-serif" font-size="11" font-weight="500" fill="#FFD778">?</text></svg>',
    stamp: '<svg viewBox="0 0 100 100"><g transform="rotate(-12 50 50)"><rect x="10" y="28" width="80" height="44" rx="4" fill="none" stroke="#E8641A" stroke-width="3.5"/><rect x="15" y="33" width="70" height="34" rx="2" fill="none" stroke="#E8641A" stroke-width="1.2"/>' +
      '<text x="50" y="50" text-anchor="middle" font-family="Mukta, sans-serif" font-size="15" font-weight="500" fill="#E8641A" letter-spacing="2">LEAVE</text>' +
      '<text x="50" y="62" text-anchor="middle" font-family="Mukta, sans-serif" font-size="8.5" font-weight="500" fill="#E8641A" letter-spacing="1.6">APPROVED</text></g></svg>',
    socks: '<svg viewBox="0 0 100 100"><g transform="rotate(-8 40 50)"><path d="M24 12 H44 V58 L58 70 C64 76 58 88 48 84 L26 70 C22 67 24 62 24 58Z" fill="#DB59C8"/><path d="M24 22 H44 M24 30 H44 M24 38 H44" stroke="#FFD778" stroke-width="3"/><rect x="22" y="8" width="24" height="8" fill="#FFF4DC"/><path d="M48 84 C58 88 64 76 58 70 L54 67 C52 74 50 80 48 84Z" fill="#FFD778"/></g>' +
      '<g transform="rotate(10 64 50)"><path d="M56 14 H76 V60 L90 72 C96 78 90 90 80 86 L58 72 C54 69 56 64 56 60Z" fill="#FF9F32"/><path d="M56 24 H76 M56 32 H76 M56 40 H76" stroke="#241044" stroke-width="3" opacity=".6"/><rect x="54" y="10" width="24" height="8" fill="#FFF4DC"/></g></svg>',
    sparkler: (function () {
      var s = '<svg viewBox="0 0 100 100"><path d="M18 94 L62 40" stroke="#8A8FA3" stroke-width="3" stroke-linecap="round"/><path d="M50 55 L62 40" stroke="#3D3B48" stroke-width="4" stroke-linecap="round"/>';
      for (var i = 0; i < 16; i++) {
        var a = i / 16 * Math.PI * 2, r1 = 4, r2 = 14 + (i % 3) * 7;
        s += '<path d="M' + n1(64 + Math.cos(a) * r1) + ' ' + n1(36 + Math.sin(a) * r1) + ' L' + n1(64 + Math.cos(a) * r2) + ' ' + n1(36 + Math.sin(a) * r2) + '" stroke="' + (i % 2 ? '#FFF4DC' : '#FFD778') + '" stroke-width="1.8" stroke-linecap="round"/>';
      }
      return s + '<circle cx="64" cy="36" r="5" fill="#FFF4DC"/><circle cx="86" cy="18" r="1.8" fill="#FF9F32"/><circle cx="40" cy="20" r="1.5" fill="#FFD778"/></svg>';
    })(),
    dryfruit: '<svg viewBox="0 0 100 100"><ellipse cx="50" cy="52" rx="38" ry="10" fill="#7A3112"/>' +
      '<path d="M22 50 C26 40 38 38 44 44 C40 46 34 46 30 50Z M54 44 C60 36 72 38 76 46 C70 46 64 46 60 50Z M38 48 C42 38 54 38 58 46 C52 46 46 46 42 50Z" fill="#F1DDB5" stroke="#C9A874" stroke-width=".8"/>' +
      '<ellipse cx="34" cy="44" rx="7" ry="3.6" fill="#9B5A2E" transform="rotate(-24 34 44)"/><ellipse cx="66" cy="42" rx="7" ry="3.6" fill="#9B5A2E" transform="rotate(20 66 42)"/><ellipse cx="50" cy="40" rx="7" ry="3.6" fill="#8A4E26"/>' +
      '<circle cx="44" cy="48" r="2.6" fill="#3B1020"/><circle cx="58" cy="48" r="2.6" fill="#3B1020"/><circle cx="26" cy="49" r="2.2" fill="#3B1020"/><circle cx="74" cy="49" r="2.2" fill="#3B1020"/>' +
      '<path d="M12 52 C14 76 32 88 50 88 C68 88 86 76 88 52 C80 60 66 62 50 62 C34 62 20 60 12 52Z" fill="#FFD778"/><path d="M12 52 C20 60 34 62 50 62 C66 62 80 60 88 52" fill="none" stroke="#C99A35" stroke-width="1.5"/>' +
      '<path d="M26 70 H74" stroke="#C99A35" stroke-width="1" stroke-dasharray="2 3"/><path d="M40 94 H60" stroke="#C99A35" stroke-width="4" stroke-linecap="round"/></svg>'
  };

  var OUTCOMES = [
    { id: 'katli', art: 'katli', anim: 'rise', title: 'A stack of kaju katli', line: 'Diamond-shaped, silver-leafed and already one piece short. Who did that?', fx: 'katli' },
    { id: 'rain', art: 'laddoo', anim: 'rise', title: 'Mithai rain', line: 'Laddoos from the sky. The diet starts Monday. Which Monday? Unclear.', fx: 'rain' },
    { id: 'confetti', art: 'popper', anim: 'wobble', title: 'Confetti cannon', line: 'Congratulations. You are now forty per cent glitter. This is permanent.', fx: 'confetti' },
    { id: 'petals', art: 'marigold', anim: 'rise', title: 'Marigold shower', line: 'Blessings delivered fresh. Vacuum cleaner sold separately.', fx: 'petals' },
    { id: 'firework', art: 'rocket', anim: 'launch', title: 'A pocket firework', line: 'It was supposed to stay in the box. It did not stay in the box.', fx: 'firework' },
    { id: 'jack', art: 'jack', anim: 'spring', title: 'Jack-in-the-box diya', line: 'BOING. Deepu says hi. Deepu lives in this box now. Deepu pays no rent.', fx: 'jack' },
    { id: 'ooo', art: 'ooo', anim: 'flutter', title: 'A talking out-of-office note', line: '"I am out of office until Bhai Dooj. For urgent laddoo requests, please contact Mom."', fx: 'ooo' },
    { id: 'soan', art: 'soan', anim: 'rise', title: 'Vintage soan papdi', line: 'Regifted fourteen times across six cities. It has seen things. Pass it on.', fx: 'soan' },
    { id: 'boxception', art: 'minibox', anim: 'wobble', title: 'Another box', line: 'Inside is a smaller box. Inside that, gratitude. Mostly, though, it is box.', fx: 'boxception' },
    { id: 'gold', art: 'coin', anim: 'spinIn', title: 'Golden rain', line: 'Pure gold! Metaphorically. Please do not forward this to Finance.', fx: 'gold' },
    { id: 'heart', art: 'heart', anim: 'rise', title: 'A heart-shaped firework', line: 'From everyone at E2M, with love and slightly singed eyebrows.', fx: 'heart' },
    { id: 'moth', art: 'moth', anim: 'away', title: 'One confused moth', line: 'The box was empty apart from Kevin. Kevin was looking for the diya.', fx: 'moth' },
    { id: 'leave', art: 'stamp', anim: 'stamp', title: 'Leave: APPROVED', line: 'One extra day off! Valid inside this box only. Terms, conditions and managers apply.', fx: 'leave' },
    { id: 'socks', art: 'socks', anim: 'wobble', title: 'Socks. Again.', line: 'Every year, Mama ji. Every single year. They are very warm, though.', fx: 'socks' },
    { id: 'sparkler', art: 'sparkler', anim: 'rise', title: 'A sparkler, already lit', line: 'Write your name in the air at arm’s length. Spelling is optional.', fx: 'sparkler' },
    { id: 'dryfruit', art: 'dryfruit', anim: 'rise', title: 'Premium dry fruits', line: 'Cashews, almonds, raisins. Your ranking in the family just went up two places.', fx: 'dryfruit' }
  ];

  var REVEAL_DELAY = { flip: 380, spin: 520, slide: 760, unfold: 560, bounce: 500, burst: 900 };
  // Revision 2: every box has its own heft — how hard the carpet (and the page) takes the opening
  var BAD_GIFT = { socks: 1, moth: 1, soan: 1 }; // R4: the duds get the 'error' buzz
  var WEIGHT = { flip: 0.38, spin: 0.44, slide: 0.28, unfold: 0.4, bounce: 0.52, burst: 0.6 };
  var SPILL = { flip: '#FFD778', spin: '#FF9F32', slide: '#DB59C8', unfold: '#FFE7A3', bounce: '#FFB547', burst: '#FFD778' };
  // some surprises hit harder than the box they came in
  var FX_POWER = { firework: 0.46, heart: 0.46, gold: 0.5, confetti: 0.36, rain: 0.34, jack: 0.32, leave: 0.3, soan: 0.22, socks: 0.12, moth: 0.1, ooo: 0.14 };

  var RAIN_SWEETS = [
    '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="15" fill="#F08A24"/><circle cx="15" cy="14" r="4" fill="#FFF4DC" opacity=".45"/><g fill="#B84A16" opacity=".6"><circle cx="24" cy="18" r="1.4"/><circle cx="16" cy="25" r="1.4"/><circle cx="26" cy="27" r="1.4"/></g></svg>',
    '<svg viewBox="0 0 40 40"><path d="M20 20 m-3 0 a3 3 0 1 1 6 0 a6 6 0 1 1 -12 0 a9 9 0 1 1 18 0 a12 12 0 1 1 -24 0" fill="none" stroke="#FF9F32" stroke-width="4" stroke-linecap="round"/></svg>',
    '<svg viewBox="0 0 40 40"><path d="M20 4 L36 20 L20 36 L4 20Z" fill="#EED7AB" stroke="#C9A874"/><path d="M20 9 L31 20 L20 31 L9 20Z" fill="#E8EBF3" opacity=".8"/></svg>',
    '<svg viewBox="0 0 40 40"><rect x="6" y="10" width="28" height="20" rx="3" fill="#DB59C8"/><rect x="6" y="10" width="28" height="7" rx="3" fill="#F4A6E6"/><circle cx="14" cy="13" r="1.4" fill="#3B7A3F"/><circle cx="26" cy="13" r="1.4" fill="#3B7A3F"/></svg>'
  ];

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0, t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
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
  /*      'petal'/'conf' tumbling solids, 'custom' -> p.draw(ctx,p,a)    */
  /*      extra fields you may set after spawn: g (gravity px/s2),      */
  /*      drag (per-60fps-frame factor), rot, vr, sway, w, h, fl         */
  /*      (flicker 0..1), draw, data, floor (y px: lands and bounces)   */
  /*      bounce (0..1 restitution on that floor)                       */
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
      p.w = size; p.h = size; p.fl = 0; p.a = 1; p.draw = null; p.data = null; p.floor = 0; p.bounce = 0;
      parts.push(p);
      if (!raf) kick();
      return p;
    }
    function recycleAll() { for (var i = 0; i < parts.length; i++) { parts[i].draw = null; parts[i].data = null; pool.push(parts[i]); } parts.length = 0; }
    function clear() { recycleAll(); hooks.length = 0; if (L) { try { L.clear(); } catch (e) { /* ok */ } } }
    function kick() { if (!raf && !inFrame && layer()) { last = 0; raf = requestAnimationFrame(frame); } } // spawning inside a hook never double-schedules
    function hook(fn) { if (hooks.indexOf(fn) < 0) hooks.push(fn); kick(); }
    // a soft full-screen light: drawn on this layer (measured ~5fps cheaper than a blended DOM glow in software
    // rendering); falls back to E2M.screenGlow. Peak alpha <= .3, one per call, so it stays flash-safe.
    function glow(hex, power, x, y) {
      power = Math.max(0, Math.min(1, Number(power) || 0.5));
      var l = layer(), lv = level();
      if (l && l.visible && lv > 0) {
        var M = Math.max(l.w, l.h), p = spawn('wash', x == null ? l.w / 2 : x, y == null ? l.h / 2 : y, 0, 0, 0.9 + 0.9 * power, M * (0.36 + 0.5 * power), hex);
        if (p) { p.a = (lv < 0.5 ? 0.45 : 1) * 0.56 * (0.42 + 0.58 * power); return; } // sprite core .6 x .56 = peak ~.34
      }
      try { var a = A(); if (typeof a.screenGlow === 'function') a.screenGlow(hex, power, x, y); } catch (e) { /* decorative */ }
    }
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
        if (p.floor && p.y > p.floor) { // landing: restitution, floor friction, the spin bleeds off
          p.y = p.floor;
          if (p.vy > 0) { p.vy = p.vy > 70 ? -p.vy * p.bounce : 0; p.vx *= 0.62; p.vr *= 0.5; p.sway *= 0.3; }
        }
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
          var age = p.max - p.life, rise = age < 0.14 ? age / 0.14 : 1, wr = p.size; // R4: a light wash fades in and out at a fixed size (never grows)
          c.globalAlpha = Math.min(1, rise * (p.life / p.max) * p.a); c.drawImage(soft(p.c), p.x - wr, p.y - wr, wr * 2, wr * 2);
        }
      }
      parts.length = keep;
      // solids pass (petals, confetti, custom sprites)
      c.globalCompositeOperation = 'source-over';
      for (i = 0; i < parts.length; i++) {
        p = parts[i];
        if (p.k === 'spark' || p.k === 'dot' || p.k === 'wash') continue;
        a = p.life / p.max; a = (a < 0.3 ? a / 0.3 : 1) * p.a;
        if (p.max - p.life < 0.35) a *= (p.max - p.life) / 0.35; // solids fade in: nothing pops into being mid-air
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

  function makeGifts(E) {
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
    function announce(msg, assertive) {
      try { if (typeof E.announce === 'function') { E.announce(msg, { assertive: !!assertive }); return; } } catch (e) { /* fall back */ }
      if (liveEl) { liveEl.textContent = ''; setTimeout(function () { liveEl.textContent = msg; }, 30); }
    }
    var liveEl = null, hintEl = null;

    var root, row, tag, tagKicker, tagTitle, tagLine, countEl, wrapBtn, rainLayer;
    var slots = [], deck = [], seen = {}, mounted = false, inView = false;

    function loadSeen() {
      try { var raw = localStorage.getItem(SEEN_KEY); var arr = raw ? JSON.parse(raw) : []; arr.forEach(function (id) { seen[id] = 1; }); } catch (e) { /* private mode */ }
    }
    function saveSeen() {
      try { localStorage.setItem(SEEN_KEY, JSON.stringify(Object.keys(seen))); } catch (e) { /* private mode */ }
      try { if (E.score && E.score.setBest) E.score.setBest(KEY, Object.keys(seen).length); } catch (e) { /* ok */ }
    }
    function draw() {
      if (!deck.length) deck = shuffle(OUTCOMES.slice());
      return deck.pop();
    }

    function defs() {
      return '' +
        '<svg class="gf-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>' +
          '<pattern id="gf-paisley" width="22" height="26" patternUnits="userSpaceOnUse">' +
            '<path d="M8 6 C14 4 17 10 13 14 C10 17 6 16 6 20 C3 16 2 8 8 6Z" fill="none" stroke="#FFD778" stroke-width="1" opacity=".75"/>' +
            '<circle cx="10" cy="10" r="1.3" fill="#FFD778" opacity=".8"/><circle cx="18" cy="21" r="1" fill="#FFF4DC" opacity=".6"/>' +
          '</pattern>' +
          '<pattern id="gf-jaali" width="14" height="14" patternUnits="userSpaceOnUse">' +
            '<path d="M7 0 L14 7 L7 14 L0 7Z" fill="none" stroke="#241044" stroke-width="1" opacity=".42"/><circle cx="7" cy="7" r="1.4" fill="#241044" opacity=".45"/>' +
          '</pattern>' +
          '<pattern id="gf-bandhani" width="16" height="16" patternUnits="userSpaceOnUse">' +
            '<g fill="#FFF4DC" opacity=".85"><circle cx="8" cy="5" r="1.2"/><circle cx="5" cy="8" r="1.2"/><circle cx="11" cy="8" r="1.2"/><circle cx="8" cy="11" r="1.2"/></g><circle cx="8" cy="8" r=".9" fill="#FFD778"/>' +
          '</pattern>' +
          '<pattern id="gf-dots" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r=".9" fill="#FFD778" opacity=".45"/></pattern>' +
          '<pattern id="gf-zari" width="8" height="7" patternUnits="userSpaceOnUse">' +
            '<rect width="8" height="7" fill="#E0A93E"/><path d="M0 3.5 L4 0.6 L8 3.5 L4 6.4Z" fill="#FFE7A8"/><circle cx="4" cy="3.5" r=".9" fill="#7A3112"/>' +
          '</pattern>' +
          '<linearGradient id="gf-shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF4DC" stop-opacity=".12"/><stop offset=".6" stop-color="#080B1E" stop-opacity="0"/><stop offset="1" stop-color="#080B1E" stop-opacity=".28"/></linearGradient>' +
          '<linearGradient id="gf-cyl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#160A2E"/><stop offset=".35" stop-color="#4A2580"/><stop offset=".55" stop-color="#3A1C66"/><stop offset="1" stop-color="#12082A"/></linearGradient>' +
          '<linearGradient id="gf-cylLid" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7A3112" stop-opacity=".45"/><stop offset=".35" stop-color="#FFF4DC" stop-opacity=".25"/><stop offset="1" stop-color="#7A3112" stop-opacity=".5"/></linearGradient>' +
          '<linearGradient id="gf-beam" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#FFD778" stop-opacity=".85"/><stop offset=".5" stop-color="#FF9F32" stop-opacity=".25"/><stop offset="1" stop-color="#FF9F32" stop-opacity="0"/></linearGradient>' +
          '<radialGradient id="gf-glowGrad" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="#FFF4DC"/><stop offset=".45" stop-color="#FFD778"/><stop offset="1" stop-color="#FF9F32" stop-opacity=".2"/></radialGradient>' +
          // the shikhara is lit from the upper left: a carved sandstone-gold tower, not a polished bulb
          '<linearGradient id="gf-shikhara" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFF1C4"/><stop offset=".42" stop-color="#FFD778"/><stop offset=".78" stop-color="#E0A93E"/><stop offset="1" stop-color="#A9742A"/></linearGradient>' +
          '<linearGradient id="gf-nicheGlow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#DB59C8" stop-opacity=".6"/><stop offset="1" stop-color="#FF9F32" stop-opacity=".42"/></linearGradient>' +
        '</defs></svg>';
    }

    function build(stage) {
      root = document.createElement('div');
      root.className = 'act-gifts';
      var items = BOXES.map(function (b, i) {
        return '' +
          '<li class="gf-slot" data-i="' + i + '">' +
            '<span class="gf-spill" aria-hidden="true" style="--sc:' + SPILL[b.style] + '"></span>' +
            '<div class="gf-pop" aria-hidden="true"></div>' +
            '<button type="button" class="gf-box" data-style="' + b.style + '" aria-label="Gift ' + (i + 1) + ' of 6: ' + b.desc + '. Still wrapped.">' +
              '<svg class="gf-svg" viewBox="0 0 180 240" aria-hidden="true" focusable="false">' + b.svg() + '</svg>' +
              '<span class="gf-glint" aria-hidden="true"></span>' +
            '</button>' +
            '<span class="gf-name" aria-hidden="true">' + b.name + '</span>' +
          '</li>';
      }).join('');
      root.innerHTML = defs() +
        '<p class="act-hint" data-hint>Tap a box to open it · each one opens its own way · Wrap again to start over</p>' +
        '<div class="gf-scene">' +
          '<div class="gf-carpet" aria-hidden="true"><span class="gf-carpet-medallion"></span></div>' +
          '<ul class="gf-row" role="list">' + items + '</ul>' +
          '<div class="gf-rain" aria-hidden="true"></div>' +
        '</div>' +
        '<div class="gf-foot">' +
          '<div class="gf-tag">' +
            '<span class="gf-tag-string" aria-hidden="true"></span>' +
            '<span class="gf-tag-stamp deva-stamp" lang="hi" aria-hidden="true">शुभ दीपावली</span>' +
            '<p class="gf-tag-kicker">Six boxes. Sixteen surprises. Zero refunds.</p>' +
            '<p class="gf-tag-title">Pick a box. Any box.</p>' +
            '<p class="gf-tag-line">Not that one. Kidding. Any box.</p>' +
          '</div>' +
          '<div class="gf-controls">' +
            '<p class="gf-count"></p>' +
            '<button type="button" class="gf-wrap btn-marigold" disabled><span>Wrap again</span></button>' +
          '</div>' +
        '</div>' +
        '<span class="gf-warli" aria-hidden="true"></span>' +
        '<p class="gf-sr" aria-live="polite"></p>';
      stage.appendChild(root);

      row = root.querySelector('.gf-row');
      tag = root.querySelector('.gf-tag');
      tagKicker = root.querySelector('.gf-tag-kicker');
      tagTitle = root.querySelector('.gf-tag-title');
      tagLine = root.querySelector('.gf-tag-line');
      countEl = root.querySelector('.gf-count');
      wrapBtn = root.querySelector('.gf-wrap');
      rainLayer = root.querySelector('.gf-rain');
      liveEl = root.querySelector('.gf-sr');
      hintEl = root.querySelector('[data-hint]');

      Array.prototype.forEach.call(root.querySelectorAll('.gf-slot'), function (li, i) {
        var s = { i: i, li: li, btn: li.querySelector('.gf-box'), pop: li.querySelector('.gf-pop'), glint: li.querySelector('.gf-glint'), open: false, timers: [] };
        slots.push(s);
        s.btn.addEventListener('click', function () { openBox(s); });
        s.btn.addEventListener('pointermove', function (e) { glow(s.btn, e); });
      });
      wrapBtn.addEventListener('click', wrapAll);
      wrapBtn.addEventListener('pointermove', function (e) { glow(wrapBtn, e); });
      loadSeen();
      updateCount();
    }

    function glow(el, e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    }

    function later(s, fn, ms) { s.timers.push(setTimeout(fn, ms)); }

    function openBox(s) {
      if (s.open) {
        s.btn.classList.remove('is-nudge'); void s.btn.offsetWidth; s.btn.classList.add('is-nudge');
        setTag('Box ' + (s.i + 1) + ' · ' + BOXES[s.i].name, 'Already opened.', 'It is empty now. That is how boxes work. Try WRAP AGAIN.');
        announce('Box ' + (s.i + 1) + ' is already open. Use Wrap again to re-wrap all boxes.');
        sfx('thud'); haptic('miss');
        return;
      }
      s.open = true;
      s.li.classList.remove('is-idle');
      if (hintEl) hintEl.classList.add('is-gone');
      var out = draw();
      var b = BOXES[s.i];
      s.btn.classList.remove('is-wrapping');
      s.btn.classList.add('is-open');
      // first touch: a small knock as the ribbon gives way (the big one comes with the reveal)
      var p0 = point(s); impact(0.12, { x: p0.x, y: p0.y, color: SPILL[b.style] }); haptic('light');
      s.btn.setAttribute('aria-label', 'Gift ' + (s.i + 1) + ' of 6: ' + b.desc + '. Opened: ' + out.title + '.');
      sfx(b.style === 'burst' ? 'whoosh' : b.style === 'bounce' ? 'thud' : 'pop');
      wrapBtn.disabled = false;
      var delay = reduced() ? 120 : REVEAL_DELAY[b.style] || 400;
      later(s, function () { reveal(s, out); }, delay);
    }

    function reveal(s, out) {
      s.pop.innerHTML = '<div class="gf-pop-art gf-pop--' + out.anim + '">' + ART[out.art] + '</div>';
      runFx(s, out);
      var b = BOXES[s.i], p = point(s), w = Math.max(WEIGHT[b.style] || 0.4, FX_POWER[out.fx] || 0);
      impact(w, { x: p.x, y: p.y, color: SPILL[b.style], kind: 'gift' });
      // R4 haptics by what came out: a dud buzzes, a firework bursts, everything else lands as a success
      haptic(BAD_GIFT[out.id] ? 'error' : (out.fx === 'firework' || out.fx === 'heart') ? 'burst' : 'success', w);
      if (w >= 0.45) sfx('thump', { power: w });
      s.li.classList.add('is-lit');
      // the neighbours feel it: adjacent boxes jostle on the carpet, harder for heavier boxes
      if (!reduced()) [s.i - 1, s.i + 1].forEach(function (j) {
        var n = slots[j]; if (!n) return;
        n.li.style.setProperty('--jd', j < s.i ? '-1' : '1'); n.li.style.setProperty('--jw', w.toFixed(2));
        n.li.classList.remove('is-jostle'); void n.li.offsetWidth; n.li.classList.add('is-jostle');
        later(n, function () { n.li.classList.remove('is-jostle'); }, 700);
      });
      announce('Box ' + (s.i + 1) + ', ' + b.name + ': ' + out.title + '. ' + out.line);
      setTag('Box ' + (s.i + 1) + ' · ' + BOXES[s.i].name + ' held', out.title, out.line);
      var isNew = !seen[out.id];
      seen[out.id] = 1;
      s.revealed = true;
      saveSeen();
      updateCount();
      var shown = slots.filter(function (x) { return x.revealed; }).length;
      if (shown === slots.length) {
        later(s, function () { toast('All six opened. Greedy. We respect it.'); wrapBtn.classList.add('is-ready', 'is-active'); }, 1400);
      } else if (isNew && Object.keys(seen).length === OUTCOMES.length) {
        later(s, function () { toast('You found all sixteen surprises. Santa is threatened.'); }, 1200);
      }
    }

    function point(s) {
      var r = s.btn.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height * 0.42 };
    }

    /* ---------- Revision 3: every surprise fills the whole screen (screen layer 'back', under the text) ---------- */
    var SFX = makeScreenFx(KEY), SPR = null, TAU = Math.PI * 2;
    var CONF_COLS = ['#FFD778', '#FFD778', '#F4E3BC', '#FFF4DC', '#E9B95C', '#FF9F32', '#C9902E', '#DB59C8'];
    var PETAL_COLS = ['#FF9F32', '#FFB52E', '#F28C1B', '#FFD24A', '#E8641A', '#D7264F', '#E5487A'];
    var RAINBOW = ['#FF5E6C', '#FF9F32', '#FFD778', '#7EE08A', '#3FD0C9', '#7FA8FF', '#A77BFF', '#DB59C8'];
    var GOLDS = ['#FFD778', '#FFC24A', '#FFE7A3', '#FFB547'];
    function rnd(a, b) { return a + Math.random() * (b - a); }
    function pick(a) { return a[(Math.random() * a.length) | 0]; }
    function vw() { var L = SFX.layer(); return L ? L.w : window.innerWidth; }
    function vh() { var L = SFX.layer(); return L ? L.h : window.innerHeight; }
    function spr(w, h, paint) {
      var c = document.createElement('canvas'); c.width = Math.ceil(w * 2); c.height = Math.ceil(h * 2);
      var g = c.getContext('2d'); g.scale(2, 2); paint(g, w, h); return c;
    }
    function sprites() {
      if (SPR) return SPR;
      function laddoo(g) {
        g.fillStyle = '#F08A24'; g.beginPath(); g.arc(20, 20, 15, 0, TAU); g.fill();
        g.globalAlpha = 0.35; g.fillStyle = '#E8641A'; g.beginPath(); g.arc(23, 23, 12.5, 0, TAU); g.fill();
        g.globalAlpha = 0.45; g.fillStyle = '#FFF4DC'; g.beginPath(); g.arc(14.5, 13.5, 4.4, 0, TAU); g.fill();
        g.globalAlpha = 0.6; g.fillStyle = '#B84A16';
        [[25, 17], [16, 25], [26, 27], [20, 21], [12, 19], [21, 30]].forEach(function (d) { g.beginPath(); g.arc(d[0], d[1], 1.4, 0, TAU); g.fill(); });
        g.globalAlpha = 1;
      }
      function jalebi(g) {
        g.lineCap = 'round'; g.strokeStyle = '#FF9F32'; g.lineWidth = 4; g.beginPath();
        for (var i = 0; i <= 60; i++) { var t = i / 60, a = t * TAU * 2.4, r = 2 + 13 * t; var x = 20 + Math.cos(a) * r, y = 20 + Math.sin(a) * r; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
        g.stroke(); g.strokeStyle = 'rgba(255,231,163,.65)'; g.lineWidth = 1; g.stroke();
      }
      function barfi(g) {
        g.fillStyle = '#EED7AB'; g.strokeStyle = '#C9A874'; g.lineWidth = 1;
        g.beginPath(); g.moveTo(20, 4); g.lineTo(36, 20); g.lineTo(20, 36); g.lineTo(4, 20); g.closePath(); g.fill(); g.stroke();
        g.fillStyle = 'rgba(232,235,243,.85)'; g.beginPath(); g.moveTo(20, 9); g.lineTo(31, 20); g.lineTo(20, 31); g.lineTo(9, 20); g.closePath(); g.fill();
      }
      function pinkBarfi(g) {
        g.fillStyle = '#DB59C8'; g.fillRect(6, 10, 28, 20); g.fillStyle = '#F4A6E6'; g.fillRect(6, 10, 28, 7);
        g.fillStyle = '#3B7A3F'; g.beginPath(); g.arc(14, 13, 1.4, 0, TAU); g.arc(26, 13, 1.4, 0, TAU); g.fill();
      }
      function coin(g) {
        g.fillStyle = '#E0A93E'; g.beginPath(); g.arc(18, 19, 16, 0, TAU); g.fill();
        g.fillStyle = '#FFD778'; g.beginPath(); g.arc(18, 18, 15, 0, TAU); g.fill();
        g.strokeStyle = '#C99A35'; g.lineWidth = 1.2; g.beginPath(); g.arc(18, 18, 11.5, 0, TAU); g.stroke();
        g.fillStyle = '#E0A93E'; g.beginPath(); g.moveTo(18, 11); g.bezierCurveTo(21, 14, 21, 18, 18, 21); g.bezierCurveTo(15, 18, 15, 14, 18, 11); g.fill();
        g.strokeStyle = 'rgba(255,244,220,.8)'; g.lineWidth = 1.6; g.beginPath(); g.arc(18, 18, 13, Math.PI * 1.1, Math.PI * 1.45); g.stroke();
      }
      function cashew(g) {
        g.fillStyle = '#F1DDB5'; g.strokeStyle = '#C9A874'; g.lineWidth = 1;
        g.beginPath(); g.moveTo(4, 12); g.bezierCurveTo(4, 2, 22, 0, 27, 8); g.bezierCurveTo(29, 13, 24, 15, 21, 11); g.bezierCurveTo(18, 7, 10, 8, 10, 14); g.bezierCurveTo(10, 19, 4, 19, 4, 12); g.closePath(); g.fill(); g.stroke();
      }
      function almond(g) {
        g.fillStyle = '#9B5A2E'; g.beginPath(); g.moveTo(3, 9); g.bezierCurveTo(8, 1, 22, 1, 28, 9); g.bezierCurveTo(22, 17, 8, 17, 3, 9); g.fill();
        g.strokeStyle = 'rgba(60,26,10,.5)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(8, 9); g.lineTo(24, 9); g.moveTo(10, 6.5); g.lineTo(21, 6.5); g.stroke();
      }
      function raisin(g) {
        g.fillStyle = '#3B1020'; g.beginPath(); g.ellipse(8, 8, 6.5, 5.2, 0.4, 0, TAU); g.fill();
        g.fillStyle = 'rgba(255,244,220,.35)'; g.beginPath(); g.arc(6, 6, 1.6, 0, TAU); g.fill();
      }
      function minibox(fill, lid, rib) {
        return function (g) {
          g.fillStyle = fill; g.fillRect(6, 15, 24, 18); g.fillStyle = lid; g.fillRect(4, 10, 28, 6);
          g.fillStyle = rib; g.fillRect(16, 10, 4, 23);
          g.beginPath(); g.moveTo(18, 10); g.bezierCurveTo(12, 2, 7, 7, 16, 10); g.moveTo(18, 10); g.bezierCurveTo(24, 2, 29, 7, 20, 10); g.fill();
        };
      }
      function sock(g) {
        g.fillStyle = '#DB59C8'; g.beginPath(); g.moveTo(8, 2); g.lineTo(20, 2); g.lineTo(20, 26); g.lineTo(27, 32); g.bezierCurveTo(30, 36, 26, 41, 20, 38); g.lineTo(9, 30); g.bezierCurveTo(7, 28, 8, 26, 8, 24); g.closePath(); g.fill();
        g.fillStyle = '#FFD778'; g.fillRect(8, 7, 12, 2.4); g.fillRect(8, 12, 12, 2.4); g.fillStyle = '#FFF4DC'; g.fillRect(7, 0, 14, 4);
      }
      function note(g) {
        g.fillStyle = '#FFF4DC'; g.beginPath(); g.moveTo(2, 2); g.lineTo(34, 2); g.lineTo(42, 10); g.lineTo(42, 32); g.lineTo(2, 32); g.closePath(); g.fill();
        g.fillStyle = '#E3D0A6'; g.beginPath(); g.moveTo(34, 2); g.lineTo(34, 10); g.lineTo(42, 10); g.fill();
        g.fillStyle = '#241044'; g.font = '500 6.5px Mukta, Arial, sans-serif'; g.fillText('OUT OF', 6, 12); g.fillText('OFFICE', 6, 19.5);
        g.fillStyle = 'rgba(36,16,68,.3)'; g.fillRect(6, 23, 28, 1); g.fillRect(6, 27, 20, 1);
      }
      SPR = {
        sweets: [spr(40, 40, laddoo), spr(40, 40, jalebi), spr(40, 40, barfi), spr(40, 40, pinkBarfi)],
        katli: [spr(40, 40, barfi)],
        coin: [spr(36, 37, coin)],
        nuts: [spr(32, 20, cashew), spr(32, 20, almond), spr(16, 16, raisin), spr(32, 20, cashew)],
        boxes: [spr(36, 36, minibox('#DB59C8', '#C2449F', '#FFD778')), spr(36, 36, minibox('#FF9F32', '#F08A24', '#DB59C8')), spr(36, 36, minibox('#FFF4DC', '#F3E2BE', '#E8641A'))],
        socks: [spr(32, 42, sock)],
        note: [spr(44, 34, note)]
      };
      return SPR;
    }
    function drawSpr(c, p) { c.drawImage(p.data, -p.w / 2, -p.h / 2, p.w, p.h); }
    function drawCoin(c, p) { var k = Math.cos(p.ph * 2.6); c.scale(k > -0.14 && k < 0.14 ? 0.14 : k, 1); c.drawImage(p.data, -p.w / 2, -p.h / 2, p.w, p.h); }
    function drawMoth(c, p) {
      var f = 0.3 + 0.7 * Math.abs(Math.sin(p.ph * 9)); // the wing beat
      c.translate(0, Math.sin(p.ph * 1.7) * 18);
      c.fillStyle = '#E3D0A6';
      c.save(); c.scale(f, 1);
      c.beginPath(); c.moveTo(0, -2); c.bezierCurveTo(-14, -20, -30, -14, -26, -2); c.bezierCurveTo(-24, 6, -10, 6, 0, 2); c.fill();
      c.beginPath(); c.moveTo(0, -2); c.bezierCurveTo(14, -20, 30, -14, 26, -2); c.bezierCurveTo(24, 6, 10, 6, 0, 2); c.fill();
      c.fillStyle = '#CDB68A';
      c.beginPath(); c.moveTo(0, 2); c.bezierCurveTo(-12, 8, -16, 18, -8, 18); c.bezierCurveTo(-2, 18, 0, 10, 0, 4); c.fill();
      c.beginPath(); c.moveTo(0, 2); c.bezierCurveTo(12, 8, 16, 18, 8, 18); c.bezierCurveTo(2, 18, 0, 10, 0, 4); c.fill();
      c.restore();
      c.fillStyle = '#7A5534'; c.beginPath(); c.ellipse(0, 4, 3, 10, 0, 0, TAU); c.fill();
    }
    // sprites that fall from above the viewport and land on its floor
    function rainSpr(list, n, o) {
      var W = vw(), H = vh(), k = 0;
      for (var i = 0; i < n; i++) {
        var p = SFX.spawn('custom', rnd(0.03, 0.97) * W, -rnd(30, H * (o.spread || 0.75)), rnd(-40, 40), rnd(40, 200), rnd(3.8, 5.2) + (o.extra || 0), 1, '#FFD778');
        if (!p) break;
        var sp = list[i % list.length], sz = (o.size || 34) * rnd(0.7, 1.25);
        p.data = sp; p.draw = o.draw || drawSpr; p.w = sz; p.h = sz * sp.height / sp.width;
        p.g = o.g || 640; p.drag = 0.996; p.vr = rnd(-5, 5) * (o.spin == null ? 1 : o.spin); p.sway = o.sway || 0;
        p.floor = H - rnd(6, 30) - p.h * 0.4; p.bounce = rnd(0.22, 0.42);
        k++;
      }
      return k;
    }
    // sprites thrown up out of the box: real ballistic arcs across the screen, a bounce, then rest
    function tossSpr(list, n, x, y, o) {
      var W = vw(), H = vh();
      for (var i = 0; i < n; i++) {
        var p = SFX.spawn('custom', x + rnd(-10, 10), y, rnd(-1, 1) * W * 0.55, -rnd(0.75, 1.35) * H, rnd(3.6, 4.8), 1, '#FFD778');
        if (!p) return;
        var sp = list[i % list.length], sz = (o.size || 26) * rnd(0.75, 1.2);
        p.data = sp; p.draw = drawSpr; p.w = sz; p.h = sz * sp.height / sp.width;
        p.g = H * 1.9; p.drag = 0.995; p.vr = rnd(-9, 9); p.floor = H - rnd(6, 34); p.bounce = rnd(0.3, 0.48);
      }
    }
    function cannons(n) {
      var W = vw(), H = vh();
      for (var side = 0; side < 2; side++) for (var i = 0; i < n; i++) {
        var a = -Math.PI / 2 + (side ? -1 : 1) * rnd(0.16, 0.66), v = rnd(0.55, 1) * H * 1.95;
        var p = SFX.spawn('conf', side ? W + 6 : -6, H * rnd(0.86, 0.98), Math.cos(a) * v, Math.sin(a) * v, rnd(3.4, 4.8), 1, pick(CONF_COLS));
        if (!p) return;
        p.w = rnd(7, 12); p.h = rnd(3, 6); p.g = 520; p.drag = 0.968; p.vr = rnd(-12, 12); p.sway = rnd(10, 42);
      }
    }
    function flutterDown(n, cols, kind, o) {
      var W = vw(), H = vh();
      for (var i = 0; i < n; i++) {
        var p = SFX.spawn(kind, rnd(-0.04, 1.04) * W, rnd(-H * (o.spread || 0.6), H * 0.14), rnd(-14, 26), rnd(o.v0 || 90, (o.v0 || 90) + 60), rnd(o.life || 9, (o.life || 9) + 3), 1, pick(cols));
        if (!p) return;
        p.w = rnd(o.w0, o.w1); p.h = rnd(o.h0, o.h1); p.g = o.g || 24; p.drag = 0.997; p.vr = rnd(-2.4, 2.4); p.sway = rnd(20, 58);
      }
    }
    function radial(x, y, n, cols, speed, o) {
      o = o || {};
      for (var i = 0; i < n; i++) {
        var a = Math.random() * TAU, v = speed * (Math.random() < 0.7 ? rnd(0.8, 1) : rnd(0.25, 0.8));
        var p = SFX.spawn(o.kind || 'spark', x, y, Math.cos(a) * v, Math.sin(a) * v * (o.squash || 1), rnd(1.1, 1.9), rnd(1.2, 2.4), cols[i % cols.length]);
        if (!p) return;
        p.g = o.g == null ? 180 : o.g; p.drag = o.drag || 0.962; p.fl = o.fl || 0;
      }
    }
    function ringWave(x, y, col, ms, maxR) {
      var t0 = 0, D = ms / 1000;
      SFX.hook(function (c, dt) {
        t0 += dt; var k = t0 / D; if (k >= 1) return false;
        var e = 1 - Math.pow(1 - k, 3), r = 24 + maxR * e;
        c.globalCompositeOperation = 'lighter'; c.strokeStyle = col;
        c.globalAlpha = (1 - k) * 0.5; c.lineWidth = 1 + 3 * (1 - k);
        c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
        c.globalAlpha = (1 - k) * 0.22; c.lineWidth = 1;
        c.beginPath(); c.arc(x, y, r * 0.84, 0, TAU); c.stroke();
        return true;
      });
    }
    function fountain(x, y, ms, cols) {
      var t0 = 0, acc = 0, D = ms / 1000, H = vh(), soft = SFX.soft('#FFD778');
      SFX.hook(function (c, dt, t, L, lvl) {
        t0 += dt; if (t0 > D) return false;
        acc += dt * 240 * Math.max(0.3, lvl);
        while (acc >= 1) {
          acc -= 1;
          var a = -Math.PI / 2 + rnd(-0.62, 0.62), v = rnd(0.5, 1.05) * H * 1.28;
          var p = SFX.spawn('spark', x, y, Math.cos(a) * v, Math.sin(a) * v, rnd(0.9, 1.7), rnd(1, 2), pick(cols));
          if (p) { p.g = H * 1.1; p.drag = 0.988; p.fl = 0.22; }
        }
        var r = 60 + 24 * Math.random();
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.55 * Math.min(1, (D - t0) * 2);
        c.drawImage(soft, x - r, y - r, r * 2, r * 2);
        return true;
      });
    }
    function rocketTo(x0, y0, x1, y1, then) {
      var t0 = 0, T = 0.8, acc = 0, head = SFX.sprite('#FFF4DC');
      SFX.hook(function (c, dt, t, L, lvl) {
        t0 += dt; var k = Math.min(1, t0 / T), e = 1 - (1 - k) * (1 - k);
        var x = x0 + (x1 - x0) * e + Math.sin(t0 * 30) * 1.2, y = y0 + (y1 - y0) * e;
        acc += dt * 110 * Math.max(0.35, lvl);
        while (acc >= 1) { acc -= 1; var p = SFX.spawn('spark', x + rnd(-2, 2), y, rnd(-30, 30), rnd(40, 150), rnd(0.3, 0.65), rnd(0.9, 1.7), Math.random() < 0.5 ? '#FFC46A' : '#FF9F32'); if (p) { p.g = 160; p.drag = 0.95; } }
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = 1; c.drawImage(head, x - 10, y - 10, 20, 20);
        if (k >= 1) { then(x, y); return false; }
        return true;
      });
    }
    function heartSparks(cx, cy, R, n) {
      var K = 0.2083; // with drag .92/frame a particle travels ~v*0.208 s before it stops: aim each spark at its point
      for (var i = 0; i < n; i++) {
        var t = i / n * TAU, hx = 16 * Math.pow(Math.sin(t), 3), hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        var tx = hx / 17 * R, ty = hy / 17 * R;
        var p = SFX.spawn('dot', cx, cy, tx / K, ty / K, rnd(1.9, 2.7), rnd(1.6, 2.6), i % 3 ? '#FF6FD0' : '#FFD778');
        if (!p) return;
        p.drag = 0.92; p.g = 14; p.fl = 0.08;
      }
    }

    function screenFx(s, out) {
      if (!SFX.layer()) return false;
      var lvl = SFX.level(), p = point(s), x = p.x, y = p.y, W = vw(), H = vh(), M = Math.max(W, H), S;
      function n(k) { return Math.max(0, Math.round(k * lvl)); }
      S = sprites();
      switch (out.fx) {
        case 'katli': // silver vark leaf drifts down the whole screen; a few katli tumble out of the box
          flutterDown(n(46), ['#E8EBF3', '#FFFFFF', '#CFD4E0', '#F4E3BC'], 'conf', { w0: 4, w1: 8, h0: 3, h1: 6, v0: 70, life: 6, g: 18 });
          tossSpr(S.katli, n(7), x, y, { size: 30 });
          SFX.glow('#FFF4DC', 0.34, x, y); sfx('sparkle'); break;
        case 'rain':
          rainSpr(S.sweets, n(26), { size: 36 });
          SFX.glow('#FF9F32', 0.4, W / 2, H * 0.2); sfx('whoosh'); break;
        case 'confetti': // two cannons fire from the bottom corners of the screen
          cannons(n(62));
          SFX.glow('#FFD778', 0.42, W / 2, H * 0.8); sfx('pop'); setTimeout(function () { sfx('pop'); }, 90); break;
        case 'petals':
          flutterDown(n(84), PETAL_COLS, 'petal', { w0: 7, w1: 11, h0: 10, h1: 15, v0: 90, life: 9 });
          SFX.glow('#FF9F32', 0.3, W / 2, 0); sfx('chime'); break;
        case 'firework': // it escapes the box: a rocket climbs to the top of the screen and bursts in rainbow
          sfx('launch', { size: 0.5 });
          rocketTo(x, y - 20, x + (W / 2 - x) * 0.4, H * 0.2, function (bx, by) {
            radial(bx, by, n(170), RAINBOW, M * 1.25, { fl: 0.06 });
            SFX.glow('#FFD778', 0.6, bx, by); sfx('burst', { size: 0.7, distance: 0.1 }); impact(0.36, { x: bx, y: by, color: '#FFD778', kind: 'gift' });
          });
          break;
        case 'jack':
          ringWave(x, y - 30, '#FFD778', 1000, M * 0.75);
          radial(x, y - 40, n(56), ['#FFD778', '#FFF4DC', '#FF9F32'], M * 0.62, { g: 420 });
          SFX.glow('#FFD778', 0.32, x, y); sfx('pop'); break;
        case 'ooo': // the out-of-office notes blow across the screen on a breeze
          for (var i = 0; i < n(9); i++) {
            var q = SFX.spawn('custom', -50 - i * 40, H * rnd(0.12, 0.72), rnd(170, 300), rnd(-24, 30), rnd(6, 7.5), 1, '#FFF4DC');
            if (!q) break;
            q.data = S.note[0]; q.draw = drawSpr; q.w = rnd(34, 50); q.h = q.w * 34 / 44; q.g = 16; q.sway = rnd(20, 44); q.vr = rnd(-1.2, 1.2);
          }
          SFX.glow('#FFF4DC', 0.18, x, y); sfx('bell'); break;
        case 'soan': // the flakes it has shed over fourteen regiftings
          flutterDown(n(70), ['#FFE08A', '#F5C451', '#FFF4DC', '#E0A93E'], 'conf', { w0: 3, w1: 6, h0: 2, h1: 4, v0: 60, life: 7, g: 14 });
          SFX.glow('#FFE08A', 0.24, x, y); sfx('thud'); break;
        case 'boxception':
          rainSpr(S.boxes, n(15), { size: 38, spin: 0.6 });
          SFX.glow('#DB59C8', 0.28, x, y); sfx('pop'); break;
        case 'gold': // golden rain from the top of the screen, coins that flip and ring on the floor
          for (var j = 0; j < n(150); j++) {
            var g = SFX.spawn('spark', rnd(0, W), -rnd(0, H * 0.8), rnd(-10, 10), rnd(130, 270), rnd(3, 4.4), rnd(1, 1.8), pick(GOLDS));
            if (!g) break;
            g.g = 60; g.drag = 0.995; g.fl = 0.35;
          }
          rainSpr(S.coin, n(12), { size: 26, draw: drawCoin, spin: 0.2, extra: 0.6 });
          SFX.glow('#FFD778', 0.6, W / 2, H * 0.15); sfx('sparkle'); setTimeout(function () { sfx('chime'); }, 1100); break;
        case 'heart': // a heart drawn in sparks across the middle of the screen
          sfx('launch', { size: 0.4 });
          heartSparks(W / 2, H * 0.44, Math.min(W, H) * 0.34, n(150));
          SFX.glow('#DB59C8', 0.55, W / 2, H * 0.44); setTimeout(function () { sfx('burst', { size: 0.6, distance: 0.2 }); }, 60); break;
        case 'moth': // Kevin goes looking for the light, across the whole screen
          var m = SFX.spawn('custom', x, y - 30, (x > W / 2 ? -1 : 1) * rnd(150, 210), -rnd(60, 100), 6.5, 1, '#E3D0A6');
          if (m) { m.draw = drawMoth; m.w = 1; m.h = 1; m.sway = 110; m.g = -4; m.rot = 0; m.a = 0.95; }
          SFX.glow('#FFE7A3', 0.18, x, y); sfx('whoosh'); break;
        case 'leave': // the stamp lands: a shock ring across the screen and a saffron spray
          sfx('thud'); setTimeout(function () { sfx('win'); }, 260);
          ringWave(x, y - 30, '#FF9F32', 1100, M * 0.9);
          radial(x, y - 30, n(46), ['#FF9F32', '#FFD778', '#E8641A'], M * 0.5, { g: 260, squash: 0.55 });
          cannons(n(18));
          SFX.glow('#FF9F32', 0.36, x, y); break;
        case 'socks': // every year: socks tumble from the ceiling, the light dims a little
          rainSpr(S.socks, n(8), { size: 38, g: 520, spin: 0.5 });
          SFX.glow('#A77BFF', 0.14, x, y); sfx('lose'); break;
        case 'sparkler': // a spark fountain that throws across the whole screen
          fountain(x, y - 40, 2400, ['#FFF4DC', '#FFD778', '#FFD778', '#FF9F32']);
          SFX.glow('#FFD778', 0.4, x, y); sfx('crackle', { size: 0.5, distance: 0.1 }); setTimeout(function () { sfx('crackle', { size: 0.4, distance: 0.1 }); }, 900); break;
        case 'dryfruit':
          tossSpr(S.nuts, n(30), x, y, { size: 28 });
          SFX.glow('#FFF4DC', 0.28, x, y); sfx('chime'); break;
        default: return false;
      }
      return true;
    }

    function runFx(s, out) {
      if (screenFx(s, out)) return;
      // no screen layer (older core): the Revision 2 stage-sized effects
      var p = point(s), x = p.x, y = p.y, red = reduced();
      switch (out.fx) {
        case 'katli': fx('confetti', x, y, red ? 10 : 28); sfx('sparkle'); break;
        case 'rain': mithaiRain(); sfx('whoosh'); break;
        case 'confetti': fx('confetti', x, y, red ? 20 : 64); sfx('pop'); break;
        case 'petals': fx('petals', red ? 12 : 34); sfx('chime'); break;
        case 'firework': fx('firework', x, Math.max(60, y - 220), { color: 'multi', type: 'ring', size: 1 }); sfx('boom'); break;
        case 'jack': fx('sparkBurst', x, y - 40, '#FFD778', red ? 10 : 36); sfx('pop'); break;
        case 'ooo': sfx('bell'); break;
        case 'soan': sfx('thud'); break;
        case 'boxception': sfx('pop'); break;
        case 'gold': fx('goldenRain'); sfx('sparkle'); break;
        case 'heart': fx('firework', x, Math.max(60, y - 220), { color: '#DB59C8', type: 'heart', size: 1.1 }); sfx('boom'); break;
        case 'moth': sfx('whoosh'); break;
        case 'leave': sfx('thud'); setTimeout(function () { sfx('win'); }, 260); fx('sparkBurst', x, y - 30, '#FF9F32', red ? 8 : 24); break;
        case 'socks': sfx('lose'); break;
        case 'sparkler': fx('sparkBurst', x, y - 40, '#FFD778', red ? 12 : 44); sfx('crackle'); break;
        case 'dryfruit': fx('sparkBurst', x, y - 30, '#FFF4DC', red ? 8 : 26); sfx('chime'); break;
      }
    }

    function mithaiRain() {
      var n = reduced() ? 6 : (E.mobile ? 12 : 20);
      var frag = document.createDocumentFragment();
      for (var i = 0; i < n; i++) {
        var sp = document.createElement('span');
        sp.className = 'gf-sweet';
        sp.style.left = (Math.random() * 96).toFixed(1) + '%';
        sp.style.setProperty('--d', (Math.random() * 0.9).toFixed(2) + 's');
        sp.style.setProperty('--t', (1.4 + Math.random() * 0.9).toFixed(2) + 's');
        sp.style.setProperty('--r', ((Math.random() * 2 - 1) * 540).toFixed(0) + 'deg');
        sp.style.setProperty('--s', (0.7 + Math.random() * 0.7).toFixed(2));
        sp.innerHTML = RAIN_SWEETS[i % RAIN_SWEETS.length];
        frag.appendChild(sp);
      }
      rainLayer.appendChild(frag);
      setTimeout(function () {
        Array.prototype.slice.call(rainLayer.querySelectorAll('.gf-sweet'), 0, n).forEach(function (el) { el.remove(); });
      }, 3600);
    }

    function setTag(kicker, title, line) {
      tagKicker.textContent = kicker;
      tagTitle.textContent = title;
      tagLine.textContent = line;
      tag.classList.remove('is-swing'); void tag.offsetWidth; tag.classList.add('is-swing');
    }

    function updateCount() {
      var opened = slots.filter(function (x) { return x.open; }).length;
      var found = Object.keys(seen).filter(function (id) { return OUTCOMES.some(function (o) { return o.id === id; }); }).length;
      countEl.innerHTML = '<span><b>' + opened + '</b> of 6 opened</span><span><b>' + found + '</b> of ' + OUTCOMES.length + ' surprises found</span>';
    }

    /* ---------- Revision 3: idle life — a wrapped box shuffles on its spring now and then, or catches a glint.
       Off in Calm / reduced motion / Pause all motion, and whenever the zone is off screen. ---------- */
    var idleT = 0;
    function idleOff() { return reduced() || !!(E.isPaused && E.isPaused()) || !!(E.isCalm && E.isCalm()); }
    function idleStop() { if (idleT) { clearTimeout(idleT); idleT = 0; } }
    function idleStart() { idleStop(); if (inView && !idleOff()) idleT = setTimeout(idleTick, 1400 + Math.random() * 1600); }
    function idleTick() {
      idleT = 0;
      if (!inView || idleOff()) return;
      if (!document.hidden) {
        var free = slots.filter(function (x) { return !x.open && !x.btn.classList.contains('is-wrapping') && !x.li.classList.contains('is-jostle') && !x.li.classList.contains('is-idle'); });
        if (free.length) {
          var s = free[(Math.random() * free.length) | 0];
          if (Math.random() < 0.5) {
            s.li.style.setProperty('--jd', Math.random() < 0.5 ? '-1' : '1');
            s.li.style.setProperty('--jw', (0.45 + Math.random() * 0.55).toFixed(2));
            s.li.classList.add('is-idle');
            later(s, function () { s.li.classList.remove('is-idle'); }, 1000);
          } else if (s.glint) {
            s.glint.style.setProperty('--gx', (24 + Math.random() * 52).toFixed(1) + '%');
            s.glint.style.setProperty('--gy', (40 + Math.random() * 42).toFixed(1) + '%');
            s.glint.classList.remove('is-on'); void s.glint.offsetWidth; s.glint.classList.add('is-on');
          }
        }
      }
      idleT = setTimeout(idleTick, 2200 + Math.random() * 2600);
    }

    function wrapAll() {
      var any = false;
      slots.forEach(function (s) {
        s.timers.forEach(clearTimeout);
        s.timers = [];
        s.li.classList.remove('is-idle');
        if (!s.open) return;
        any = true;
        s.open = false;
        s.revealed = false;
        s.pop.innerHTML = '';
        s.li.classList.remove('is-lit', 'is-jostle');
        s.btn.classList.remove('is-open', 'is-nudge');
        s.btn.classList.add('is-wrapping');
        s.btn.setAttribute('aria-label', 'Gift ' + (s.i + 1) + ' of 6: ' + BOXES[s.i].desc + '. Still wrapped.');
        later(s, function () { s.btn.classList.remove('is-wrapping'); }, 1300);
      });
      if (!any) return;
      haptic('medium'); shake(1.5, 240);
      wrapBtn.disabled = true;
      wrapBtn.classList.remove('is-ready', 'is-active');
      sfx('chime');
      setTag('Freshly re-wrapped', 'Nobody saw anything.', 'Six new surprises are hiding inside. Probably. Go on.');
      announce('All boxes re-wrapped. Six new surprises inside.');
      updateCount();
      // keep focus somewhere sensible once the button disables itself
      if (document.activeElement === wrapBtn) slots[0].btn.focus({ preventScroll: true });
    }

    return {
      mount: function (stage) {
        if (mounted || !stage) return;
        build(stage);
        mounted = true;
        if (E.on) {
          E.on('motion:pause', function () { if (root) root.classList.add('is-paused'); idleStop(); });
          E.on('motion:resume', function () { if (root && inView) { root.classList.remove('is-paused'); idleStart(); } });
          E.on('prefs:change', function () { if (inView) idleStart(); });
        }
      },
      onEnter: function () { if (root) { inView = true; root.classList.toggle('is-paused', !!(E.isPaused && E.isPaused())); idleStart(); } },
      onLeave: function () { if (root) { inView = false; root.classList.add('is-paused'); idleStop(); } }
    };
  }

  // registered last: core.js may mount synchronously inside register()
  function boot() {
    var E = window.E2M;
    if (!E || typeof E.register !== 'function') return false;
    E.register(KEY, makeGifts(E));
    return true;
  }
  if (!boot()) document.addEventListener('DOMContentLoaded', boot, { once: true });
})();
