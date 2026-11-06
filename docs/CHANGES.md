# v1 — Agent A notes (shell, engine, world, fireworks, diyas)

## Files (Agent A)
index.html · css/tokens.css base.css world.css zones.css act-fireworks.css act-diyas.css · js/core.js world.js act-fireworks.js act-diyas.js · CONCEPT.md

## What is built
- **Opening:** the gate is built from SVG, CSS and canvas, with GSAP. A cusped-arch portal (CSS mask), studded doors, nine threshold diyas, rising gold motes, distant fireworks and a lit facade. The title sequence is per-character. On click: the copy lifts, the central diya ignites, the doors swing inward (3D), the inner light rises, a golden burst fires, the camera zooms through the arch, a gold flash plays and the page lands on the open sky. Afterwards the gate stays open at the top of the page. The skip link enters instantly, and a #zone-* deep link enters straight away. The world stays `inert` until the gate opens.
- **HUD:** brand, diya-dot zone nav (current = flame, visited = lit; becomes a Map panel under 900px), hidden diyas counter x/7, sound toggle.
- **World:** a star sky that shifts hue per zone, parallax scenery, word-mask title reveals and once-only reveals. Ornaments are generated: toran garlands, bulb strings, the mandala and the finale palace. Bells ring and sway with scroll velocity. Four draggable lanterns (pointer, plus arrow keys; Shift moves further). Seven hidden diyas (hd1–hd7) call `E2M.found`. Clicking decoration fires confetti or sparks. Hover glow follows `[data-glow]`. Petals fall every 13 seconds.
- **Finale:** the giant button triggers `finale:start`, `E2M.lightAllDiyas`, `E2M.rangoliAnimate`, `E2M.releaseLanterns`, a mega burst, a 9.5 s overlay show and a local palace show. The palace outline draws on and its windows and bulbs light. Then confetti cannons, petals, an "E2M" text firework, golden rain, the headline reveal and the thanks line, then replay plus the hidden-diya score.
- **01 Fireworks:** its own trail canvas over the palace skyline. Tap launches a rocket. Hold gives a continuous shower. Double-tap or Shift+Enter gives a mega burst. Idle time brings surprise fireworks, including "E2M" sky-writing. Colour chips (gold, purple, pink, orange, multi) and shape chips (peony, ring, heart, willow, palm, crossette, surprise). A noise-level meter. GO CRAZY runs a 7 s full-screen sequence. Touch uses `pan-y`, so the page still scrolls.
- **02 Diyas:** nine diyas in six designs (classic spout, lotus, painted, peacock, brass kalash, grand five-wick) on a generated rangoli floor seen in perspective. Each has a layered SVG flame with ignite and flicker. The scene lights progressively through `--lit` (floor saturation, glow, arcade). LIGHT ALL DIYAS and "Blow them out". When all are lit it emits `diyas:allLit`, draws gold lines over the rangoli and runs a golden-particle canvas.

## Verified (Playwright, isolated contexts)
- 1280×800, 768×1024 and 390×844 (touch): no console errors or page errors, and no horizontal scroll.
- Reduced motion enters the world with no zoom or particle show, and all activities stay playable.
- Sound toggle, hidden diya count, bell, lantern arrow keys and GO CRAZY reset were all tested.

## Fixes made during testing
- The button plate fill (the span must not be positioned).
- The arch stroke: a dash animation with non-scaling-stroke is unreliable, so it is now a fade.
- Finer spark sprites.
- Horizontal overflow on mobile: the nebula sat inside a fixed box, and the floor-glow pools spilled out. `.zone` now has `overflow-x: clip`.
- Old-style Cormorant figures ("01" read as "OI"): numerals now use DM Sans.
- Activity overlays at z 40 covered the finale text: `html.finale-zone main { z-index: 42 }` applies while the finale is in view.

---
# Revision 1: luxury refinement (Agent A2: shell, engine, world, fireworks, diyas)
Follows CONTRACT.md § "REVISION 1". Same files as above. Every feature still works.

## Shared type and utilities (global; the other activities inherit these)
- Fonts: **Cormorant Garamond** 300/400/500 + italic 300/400 and **Jost** 300/400/500. DM Sans is gone, and 600/700 are not loaded.
- `tokens.css` adds `--font-display`, `--font-ui`, `--fw-display:300`, `--fw-ui:300`, `--track-label:.28em`, `--fs-label:.72rem`, `--lh-body:1.7`, `--ivory-80/-60/-40`, `--gold-hair` (.34), `--gold-hair-soft` (.18), `--gold-faint` (.10), `--gold-text`, slower easing (`--ease-out` expo, `--ease-lux`) and durations (`--dur-quick/--dur/--dur-slow`). The old token names are kept. The skies are darker.
- `base.css` defaults: body is Jost 300 at 17px/1.7, h1–h4 are Cormorant 300 (lining figures, tight leading), `em` in headings is italic, and `p` is ivory at 80%.
- New utilities: `.label-caps`, `.btn-quiet` (1px gold hairline with a gold fill-sweep on hover; modifiers `--sm` and `--bare`; `[aria-pressed]`/`.is-active` states), `.btn-primary` (the single gold-filled action), `.hairline-frame` (`--double`, `--arch`) and `.num` (Cormorant lining tabular figures). The legacy `.btn-plate` is now a quiet hairline button.
- Toasts are a hairline box with light type. Focus is a 1px gold outline.

## Shell, HUD, world (index.html, world.css, zones.css, world.js, core.js)
- **HUD:** a small E2M mark on the left. In the centre, zone progress is a 1px line with a gold diamond marker. The ten zone links are invisible segments over the line, each with a tracked label on hover or focus. Sound is on the right. The hidden-diya counter stays hidden until the first diya is found, then fades in, tiny, beside the sound toggle. Under 900px there is a "Zones" text button that opens a full-width list with roman numerals, and progress becomes a hairline along the HUD's bottom edge.
- **Zone headers:** one grammar everywhere, centred: a label such as "I — The Open Sky", a large light serif title with one italic word, and one short line. Removed: outline numerals, magenta asides, measuring rules, the shop board, the gift tag, the plaque, the spinning wheel, the eye and the vertical text.
- **Backdrops:** each zone is gradient depth plus one low-contrast signature element (line opacity 25% or less): a constellation, an arcade, a compass, a scalloped valance, corridor arches, an ember glow, a zari hairline, the shrine niche arch, and a still mandala at 4.5%. The striped awning, the bulb strings and the mandala rotation are gone. Each floor fades into the next zone.
- **Ambient noise cut:** about half the stars, few of which twinkle (slowly). About 70% fewer opening motes, which are also slower and dimmer. Distant fireworks are gold, small and come every 5–9 s. Idle petals are cut by about 85% (marigold only, slow). Clicking the scenery gives a small gold glint instead of confetti. The cursor is a single faint 34px glow instead of a sparkle trail. Bells no longer sway with scroll velocity; they ring only on click.
- **Props:** one restrained toran over the palace entrance (the only garland). Bells are in 2 places (the courtyard and the shrine). Lanterns are down to 2 (open sky and sky corridor), drawn in muted paper with a slow drift; dragging and arrow keys still work. All 7 hidden diyas are kept, dimmer, with a rare faint glint.
- **Opening:** a darker facade, 4 lit windows instead of 8, 4 threshold diyas plus the central one, and no paisleys. "THE FESTIVAL OF LIGHTS" is set in tracked uppercase Cormorant Light. The CTA is `.btn-quiet` and fills gold on hover. The title sequence is slow, with no rotation. Doors take 2.9 s, followed by one golden willow bloom and a soft flash. There are two gold welcome rockets at the edges, clear of the headline.
- **Finale (the one maximal moment):** the show is kept: palace lights, the mega burst, fireworks, the E2M sky-writing, confetti, petals, golden rain and released lanterns. Overlap fix: while the finale plays, `main` sits above the fx canvas (z 55 over 50), so every particle passes behind the palace and the headline and the type stays crisp. The headline sits in clear sky over a dark scrim, and the palace is drawn at its true 8:3 proportion, so its domes are no longer cropped. The finale frames itself in the viewport on play. `E2M.rangoliAnimate` now blooms on the courtyard floor (`{target: .fn-floor}`) instead of over the text. Palace bulbs are gold and ivory. The headline is tracked light caps, with a quiet replay button.
- **Engine:** confetti is gold-led with one magenta accent. `fx.petals(n, {calm:true})` was added. On trail canvases, flashes are drawn briefly and smaller, which removes the faint "disc" ghosts left by 8-bit alpha rounding. The text firework uses weight 500.

## Activities I–II
- **Fireworks:** a lower-contrast skyline with still windows, and a quiet "Tap the sky" hint. The deck is one hairline row: colour gems, then the count ("12 rockets — Festive"), then "Shape · Peony" (opens a tray of shapes) and "Go crazy". Idle surprises are rarer and gold-led. The shake is smaller.
- **Diyas:** the floor is a dark bronze until lit. The rangoli is recoloured to gold, champagne, saffron and plum, with one muted rose ring. Sparks and the glory particles are about 55% lower. Flames ignite more slowly. The status line has a Cormorant count, an italic quip, **Light all diyas** (`.btn-primary`) and a bare "Blow them out".

## Verified (Playwright, own contexts; served on a threaded server)
- 1440×900, 768×1024 and 390×844 (touch): no console or page errors, no failed requests, and no horizontal scroll.
- Flows checked: opening to world, the HUD link jump and progress marker, hidden diya found (counter appears at 1/7), bell, lantern drag and arrow keys, the fireworks tap and shape tray, light-all diyas plus the glory state, and the finale at 2, 5, 7 and 13 s at 1440 and 390 (headline crisp, no overlap). Reduced motion enters, and the finale reveal shows.

---
# Revision 2: immersion, background fixes, usability, accessibility, toolkit (Agent A3: shell, engine, world, fireworks, diyas, toolkit, wish)
Follows CONTRACT.md § "REVISION 2". The Revision 1 restraint is kept. The CAPITAL light-serif headings of the hero and the finale are unchanged.
Files: index.html · css/tokens.css base.css world.css zones.css act-fireworks.css act-diyas.css **toolkit.css act-wish.css (new)** · js/core.js world.js act-fireworks.js act-diyas.js **toolkit.js act-wish.js (new)**.

## R2.1 Immersion API (core.js)
- `E2M.impact(power, {x, y, color, kind})` is the one source of "shock".
  - Below .2 it gives a soft glint.
  - From .2 it gives a damped-spring thump on the sky (depth .35), the active zone's scenery (1.0) and its stage (.4), clamped to 14px. Any `[data-impact-depth]` layer also moves.
  - From .3 it adds a warm flash at 12% opacity or less, capped at 3 per second (WCAG 2.3.1). From .35 it adds a gold shockwave ring.
  - From .9, or with `kind: 'rumble'`, it gives a sustained damped rumble of about 1.2s. Mobile vibrates, gated.
  - Calm, reduced motion, paused or shake off reduce it to a glow only. At most 4 shocks are live at once.
  - It emits an `impact` event. The individual `translate`/`scale` properties are used, so GSAP transforms are never fought.
- `E2M.announce(msg, {assertive})` writes to the `#e2m-live` / `#e2m-live-assertive` regions. It is throttled to one message per 900ms (latest wins) and drops duplicates within 2.5s.
- `E2M.prefs` is persisted in `e2m-diwali:prefs`. `E2M.setPrefs` / `setPref` fire `prefs:change`, plus `motion:pause` / `motion:resume`. Helpers: `isCalm()`, `isPaused()` and `intensity()`.
  - `E2M.reduced` now mirrors Calm mode live, so every activity inherits it. `E2M.maxParticles` is rescaled live.
  - `<html>` gets `.is-calm`, `.is-contrast`, `.is-paused`, `.no-shake` and `data-intensity`.
- New sounds: `thump` (sub-bass body under explosions), `rumble` and `flick` (a flame-lick). The master volume follows `prefs.volume`.

## Fireworks (the designer's headline ask)
- **Skyline rebuilt:**
  - The art is generated to the box's real aspect, so the viewBox equals the box and nothing is ever "slice"-cropped. Every dome, finial and minaret is whole.
  - The palace wings (havelis with parapets, chhatris, minarets) are mirrored outward to both edges and descend gently. Behind them sits a hazy distant city layer, edge to edge.
  - Windows are small jharokha arches. The box is 28px wider than the viewport on each side, so a thump never exposes an edge.
  - The base is masked into a ground gradient that continues into the deck, so there is no seam.
  - Verified at 2420×739 (the designer's case), 2560, 1440, 768 and 390.
- **Shock:**
  - Every burst you launch lands an impact scaled by its size. The sky lights in the burst's colour behind the silhouettes, the windows flare warm in that colour (about 0.6–1.1s), and a sub-bass `thump` sits under the boom.
  - A rocket launch lights the foot of the skyline a little. Ambient and idle bursts only light the sky, so nothing shakes while you read.
  - Mega (double-tap or Shift+Enter) adds a .82 hit.
  - GO CRAZY escalates: .3 → .38 → rings .45–.57 → E2M .7 → willow rain .78 → the mega at 1.0 as a rumble. The show's own bursts swell with progress, the star field drifts (parallax) and all windows glow.
- **Fixed an old cut edge:** the `.fw-rim` colour wash overflowed its box and showed a hard top edge at the burst height. It is now contained and feathered, and the new sky glow is feathered too.
- Noise tiers and the GO CRAZY result are announced. The meter is no longer an `aria-live` region that spoke every count. Idle surprises stop while paused, and the particle cap follows prefs.

## Other immersion (world.js, act-diyas.js)
- Diya ignition: a `flick` flame-lick, then sparkle. Warm light spills onto the two ring neighbours and the centre lamp. The lamp squashes when it catches, with a .15 glint. All-lit lands a .42 impact.
- Bells: one hairline ring ripples from the lip, with a .22 impact. Lanterns: drag has inertia (throw and glide), and a damped pendulum sway follows the horizontal velocity. Arrow keys nudge the sway too.
- Hidden diyas: a gold shimmer sweep, chime then sparkle, and a .2 impact.
- Finale: a 1.0 rumble on the mega, then two softer aftershocks. The headline style is untouched.

## R2.2 Background fixes
- Fireworks skyline: as above.
- Opening facade: on screens wider than 16:9 the viewBox widens to the real aspect, so towers and domes are no longer cropped at the top at 2560×1100. The wing walls are extended and one more slim tower sits at each far edge. Narrower screens keep the centred side-crop.
- Lantern-corridor arcade: masked on both axes, so its hard rectangular top edge (visible at 2560) is gone.
- Gift-carpet zari hairline: dissolves before the viewport edges.
- `.sky` (fixed) bleeds 28px past the viewport, so impact kicks never show an edge.
- The fx canvas was checked to cover the viewport exactly at 390, 768, 1440 and 2560.

## R2.3 Toolkit (toolkit.js + toolkit.css)
- A hairline "TOOLS" button in the HUD (`aria-expanded`, `aria-controls`, `aria-haspopup="dialog"`, `aria-keyshortcuts="T"`). It opens a right drawer on desktop and a bottom sheet under 600px. The drawer is a modal dialog with a focus trap; Esc closes it and focus returns to where it was.
- Controls:
  - Sound switch and a volume slider.
  - Motion (Standard / Calm). It defaults to Calm when the OS asks for reduced motion and is locked there.
  - Effects (Calm / Standard / Max).
  - Screen shake switch.
  - Pause all motion (WCAG 2.2.2). It pauses every CSS animation and the JS ambient loops; games still play.
  - Text size A− / A / A+, from 100% to 125% of the root size.
  - High contrast: token overrides, brighter text, 2px hairlines.
  - Fullscreen, hidden when unsupported.
  - Keyboard shortcuts list.
  - Reset progress: an inline confirm clears every `e2m-diwali:*` key except prefs, then reloads.
- Radiogroups use a roving tabindex and arrow, Home and End keys. Changes are announced.
- Global shortcuts: `?` opens the shortcuts, `T` opens Tools, `M` toggles sound, `1–9` jump to zones I–IX, and `0` jumps to the Wish studio. Before entering, a shortcut goes straight into the world at that zone. Focus moves to the zone title. Shortcuts are ignored in form fields and when a game has already handled the key.
- "Sound is off" hint: shown once on the first interaction in a sound-led zone.
- Onboarding: a one-time tip under Tools, about 10s after entering. It offers "Open Tools" and "Got it", auto-hides after 12s and is remembered.

## R2.4 Wish Card Studio (zone `wish`, X, between mood and the finale)
- index.html: the zone markup (the scribe's-desk backdrop), HUD list entry "X Wish Cards" (the finale is now XI) and the progress line (zone-driven). Sky colours added.
- act-wish.js:
  - Fields: a For name (32 characters), and an optional From.
  - Wishes: 8 one-liners, or "Write my own" (90 characters, with a counter).
  - Styles: 3 hairline-frame templates (Midnight Gold, Plum Ivory, Rangoli Mandala).
  - A live 1080×1350 canvas. Fonts are loaded with `document.fonts.load` before drawing, and the headline uses the hero's tracked CAPITAL light serif.
  - Download PNG via `toBlob`, with the file named after the recipient.
  - Share: Web Share with the file, falling back to copying the card text with a clipboard API or `execCommand` fallback.
  - "Light a diya for them": the flame ignites and flickers on the card, and is included in the PNG.
  - The canvas is `role="img"` with a full text description. Both choices are radiogroups with arrow keys.
- The meta description mentions the wish card. No copy claims a zone count.

## R2.5 Accessibility
- "Skip to the celebration" (exists: enters instantly). Polite and assertive live regions are now in index.html.
- Focus ring: 2px gold, offset 3px, on everything. It is ivory on gold buttons and 3px in high contrast.
- Contrast:
  - `--ivory-40` measured 3.5:1 on navy. The dim text tokens are raised: `--ivory-40` to .66, `--ivory-60` to .72, plus a new `--ivory-72`. Every activity inherits this.
  - `--fs-label` and the new `--fs-micro` are 12px. The HUD, chip and op-sound labels were raised from 10.2–10.9px.
  - Automated audit at 1440 over 487 visible text nodes (computed foreground over the composited background): **0 failures**. The only hit was the decorative `aria-hidden` outline wordmark in the footer.
- HUD: safe-area padding, and the mobile zone list scrolls and focuses the current zone when opened.

## R2.6 Usability
- A quiet "how to" line under the title of fireworks (keyboard keys), diyas and wish. It is dismissed by the first interaction in that zone. B3's seven zones carry their own in-stage hints, so the header hint was removed there to avoid doubling.
- "Scroll to explore" cue on the first zone, which hides on the first scroll.
- Disabled buttons show `not-allowed` and no fill-sweep.

## Verified (Playwright, own contexts, threaded server on :5173)
- Console and page errors: none at 2560, 2420, 1440, 768 and 390 (touch), or with reduced motion. Horizontal scroll: none at 390, 768, 1440 or 2560 (`scrollWidth` equals `innerWidth`).
- Fireworks tap: scenery thump about 7px, stage about 3px, ring, flash and window flare 0.63. GO CRAZY escalates to about 8px, with no cut edges at 1440 or 2560 at peak. Finale rumble peaks at about 10px, and the headline is unchanged and legible.
- Calm: glint only, no translate. Shake off: no translate. Pause: animations paused. OS reduced motion: the app defaults to Calm. Announce throttle: latest wins.
- Keyboard-only:
  - The skip link comes first, and Enter enters the world.
  - Tools focus trap held over 26 tabs.
  - Motion arrow keys switch to Calm. Text size A+ (112%) and contrast persist.
  - Esc returns focus. `?` opens the shortcuts. `M` toggles sound. `2` and `0` jump and focus the titles.
  - The Wish studio works by keyboard, and Download produced `e2m-diwali-card-asha.png`.

## Revision 2 follow-up (B3's report on A3 scenery and shortcuts)
- **Gift zone:** the full-width zari double hairline (`.zs-carpet::before`) ran straight behind the boxes at every width. Removed; the gifts stage draws its own zari border.
- **Lantern corridor piers:** they sat at `top: -10%` inside the clipped scenery, so they were sliced at the zone's top edge. They now stay inside the zone and dissolve over a fixed 90→340px band at both ends, wider than the ±11px parallax drift.
- **Zone seams:** every `.zone-scenery` is now feathered at the top (64px) and bottom (160px). The laddoo and finale floor glows were centred at the very bottom of the box and stopped dead at the next zone; their centres moved up as well.
- **Finale palace:** the base dissolves into the night instead of standing on a hard line above the footer.
- A boundary sweep of all 11 zone edges at 2560 (brightened 2.6×) shows no seams. The only lines left are the intentional hairlines: the laddoo valance, the counter rule and the stage frames.
- **Shortcuts while a game has focus:** inside `role="application"` canvases (laddoo, lanterns, rangoli), any canvas, or a slider, the digit jumps and the T / ? modals are not taken. They would scroll away from, or cover, a running game. M (mute) still works everywhere. Verified: with the laddoo canvas focused, "3" and "t" do nothing and focus stays on the canvas; M toggles sound; after leaving the game, "3" jumps to Rangoli. The shortcut list in Tools now says "Tab: leave a game to use T, ? and 1–9 (M works everywhere)".


# Revision 3: real fireworks, Hindu architecture, full-screen effects, logo, more life (Agent A4: shell, engine, world, fireworks, diyas, wish, toolkit)
Pre-edit snapshot: scratchpad `v1-before-r3`.

## R3.1 Fireworks sound engine (core.js `E2M.audio`)
- New master chain:
  - Each voice passes through a distance lowpass, then splits into a dry path and a send to a generated convolution reverb, then the master volume and a limiter.
  - The reverb is open air: a stereo 2.6s impulse of decaying noise that darkens as it fades, with early reflections off buildings at 13–610ms.
  - The limiter is a fast, 14:1 compressor.
- `launch`: fuse hiss, a crackly ignition, a bandpassed rush of air that rises as the rocket climbs, and sometimes a faint wobbling whistle.
- `burst`: a ~5ms transient click, a sub thump falling from about 130 Hz to 35 Hz, a low air "whump", a mid crack (1–4 kHz) and, for big shells, a long low roll into the reverb.
  - Small shells are higher and crisp; large ones are deeper and longer.
  - Every shell is randomly detuned.
- `crackle`: crossette / crackling-willow sizzle. It plays five pre-rendered sparse-impulse buffers of 30–120 micro-ticks over 0.7–1.5s, some ticks paired, at random rates and filters.
- Distance model:
  - Far shells are heard up to 0.9s after they are seen (speed of sound).
  - They are also lowpassed (cutoff 650 Hz–18 kHz by distance), quieter, wetter and narrower in stereo.
  - Pan comes from `pan` or `x`.
- Rapid fire is capped at 10 concurrent firework voices, with per-voice gap limits.
- `E2M.audio.loop('chakri', {rate})` returns `{set(rate), stop()}`.
  - The sound is noise through a bandpass that climbs with RPM, amplitude-modulated at the rotation rate (the whirr), plus a looping spark crackle.
  - The handle can be created while sound is off; it starts when sound is turned on and goes quiet when sound is turned off.
- Every existing voice name is kept, and they now run through the same night air. Sound stays opt-in, and the volume pref is respected.
- The particle engine now uses `launch`/`burst`/`crackle` with size, distance, pan and gain per shell.

## R3.2 Hindu temple architecture (every mosque or Mughal element replaced)
- New shared kit: `E2M.temple.kit()` in core.js.
  - Shapes:
    - NAGARA shikhara: curvilinear tower, bhumi bands, central latas, a ribbed amalaka disc on a griva, a kalasha and a dhvaja flag, with optional clustered urushringa spires.
    - DRAVIDIAN gopuram: base storey and doorway, tapering tiers with kuta/shala miniature shrines and niches, a barrel-vault crown with kudu ends and a row of kalashas.
    - Pillared mandapa with chhajja and a stepped phamsana roof.
    - Deepmala lamp tower.
    - Haveli with a jharokha (flat chhajja, brackets, kalasha).
    - Prakara wall with diya niches.
    - Torana with three lintels and volutes.
    - Ghat steps.
    - A seeded `town()` band.
  - The kalasha is a stacked pot (seat, pot, neck, leaf rim, coconut, spike), so it never reads as an onion bulb.
  - Every shape is complete, and every sub-path is wound clockwise, so one joined silhouette never punches holes.
  - It renders silhouette, gold hairlines, lit windows, flickering lamps, light spill and swaying flags.
  - `only:'static'` / `only:'live'` split the art into a static SVG and a light overlay SVG, so the CSS lamp and flag loops never repaint the big silhouette. This was measured: the skyline went from 80fps to 120fps.
- Opening: a temple dwar.
  - The gate is now a gopuram (5 tiers, 7 kalashas) drawn in the gate's own 100:140 box, so the real HTML doors always sit in its doorway.
  - The doorway is a rectangle with a corbelled stepped lintel (new `--arch` mask), inside three carved door-frame bands (dwarashakha), under a makara torana with a kirtimukha lozenge.
  - The door leaves now carry brass studs and panels.
  - Two temple bells hang in the doorway, sway in the air and ring when the doors open.
  - Diya niches are lit in the base storey.
  - Around the gate: prakara walls with lit diya-niche rows, kuta shrines and mandapa pavilions on the walls, deepmala lamp towers at the gate, and two great shikharas with spires and flags.
  - Behind them, a seeded temple-town horizon continues past both screen edges. The viewBox is still fitted for ultra-wide screens.
- Fireworks skyline: a temple town built to the box's real aspect.
  - The central Nagara temple stands on a jagati, flanked by mandapas, deepmalas, havelis and two gopurams.
  - Mirrored wings descend to the edges, and a hazy distant town and ghat steps run the full width.
  - Shapes are whole and edge to edge from 360 to 2560+, with no sliced tops. This was verified at 390, 1440 and 2560.
- Finale: a glowing temple complex.
  - A central shikhara with spires on a stepped jagati, two mandapas, two gopurams with flags, four deepmalas and prakara walls.
  - Each building draws itself in gold (one path per building, staggered), its doors and niches warm up, and strings of lights climb every tower outline and the platform.
  - A warm aura lights the whole complex.
- Zone scenery (zones.css):
  - The diyas courtyard's cusped arcade is now a mandapa colonnade: fluted pillars, stepped bracket capitals, a double beam and a lamp per bay.
  - The lantern corridor's cusped piers are now temple pillars with corbelled capitals.
  - The angry shrine niche is removed.
- Sprite (index.html): `#i-arch` is redrawn as a temple-niche torana under the same id. Added `#i-shikhara`, `#i-kalasha`, `#i-deepmala`, `#i-torana` and `#i-gopuram`.
- Wish card: the cusped arch window is now a devakoshtha niche, a pillared frame under a small shikhara with amalaka and finial. It is drawn in the PNG too.
- Copy: "palace" is now "temple town / temple gate" in the toast, finale line, footer link and fireworks description.

## R3.3 Fireworks Playground rework + ambient background crackers
- Launch surface:
  - The whole zone (header, sky and skyline) is the launch surface. The deck, buttons, links, lanterns and hidden diyas are excluded.
  - The zone keeps `touch-action: pan-y`, has no text selection or long-press callout, and uses a crosshair cursor.
- Controls:
  - Click or tap: the rocket rises from the temple town (or just below the viewport) and bursts at the pointer.
  - Hold (0–1.6s) charges the shell. A gold conic power ring and a "Higher / Bigger / Full" label follow the pointer, and a dashed beam shows the burst height. A soft fuse sizzle plays if sound is on, with haptic ticks on mobile.
  - On release, the shell flies higher (the climb time grows with charge), bursts bigger (0.56 → 1.7) and breaks into up to 5 sub-bursts.
  - Holding past full (+0.38s) shows "Grand!" with a pulsing saffron ring and launches a grand multi-break: a mega shell, a 10-shell ring of rainbow breaks, golden rain, a full-screen glow and a strong thump.
  - Double-click or double-tap gives the big one. GO CRAZY is kept, now in rainbow.
  - Keyboard: Enter launches, holding Space charges (release to launch), Shift+Enter is the big one.
- Rainbow is the default colour gem (a conic gem that spins slowly while selected). The engine's `color:'rainbow'` gives a hue sweep per shell and a per-particle spread: an ordered full spectrum around the burst, a scattered spectrum, or a narrow band of the next hue. There are 24 bounded hues (`E2M.rainbow`, `E2M.nextHue()`). Gold, Pink, Purple, Teal and Orange gems remain.
- Guide:
  - An animated mouse (or finger on touch) presses and holds, with a ripple ring.
  - Its three lines are "Click/Tap anywhere to burst · Hold to charge it higher · Double-click/Double-tap for a big one".
  - It fades after 3 user bursts. A small legend line stays in the deck.
  - The copy adapts live: `html.is-touch` follows the pointer type, with `[data-input]` spans in the header line, guide and legend. The header hint now mentions holding Space.
- Ambient background crackers (`#e2m-ambient`, z 1, between the sky and the page):
  - Shells come at three depths:
    - NEAR: big and bright, rising from below the screen, louder.
    - MID.
    - FAR: tiny, dim (alpha .34–.52), slow, rising from behind the horizon, heard late and muffled.
  - About 78% are rainbow. They come every 1.2–3.5s, with 12% volleys of 3–5 shells.
  - The rate is 1.65× over Fireworks and the Finale and 0.85× at the gate.
  - Spent near and mid shells leave drifting smoke, briefly lit by their own colour. Embers rise from the bottom, and a rare flock of birds crosses every 45–90s.
  - Shells avoid every visible text box (kicker, title, line, hint, opening copy, finale reveal, footer lines), padded by the burst radius.
  - Particles are capped (320 desktop / 150 mobile × intensity), with DPR capped at 1.25.
  - Gating:
    - Off under OS reduced motion, Pause and hidden tabs.
    - In Calm: far only, every 6.5–11s, no smoke or birds.
  - Near bursts emit `ambient:burst`; the fireworks skyline windows and rim light, and the gate's temple town, rim-light themselves.
  - API: `E2M.ambient.boost(mult)`, `.fire(kind)`, `.smoke(x,y,size,color)`, `.hold(bool)` (for activities that take over the screen), `.isOn()`.
- Header legibility: every `.zone-head` has a soft dark radial scrim behind its text.

## R3.4 Full-screen layers (API for B4)
- `E2M.screenLayer(key, {z:'back'|'front'|number, blend, dprMax})` returns `{canvas, ctx, w, h, dpr, visible, clear(), destroy(), onResize(fn), show()}`.
  - It is a fixed, DPR-correct canvas (ctx pre-scaled to CSS px), idempotent per key.
  - `'back'` is inserted inside its zone between the scenery and the stage, so it covers the whole viewport but stays under that zone's text and controls. `'front'` is on the body under the HUD.
  - It fades in and out with the zone's enter and leave, and is cleared after leaving.
- `E2M.screenGlow(color, power, x, y)`: a full-viewport radial bloom that breathes out. It is flash-safe (≤3/s, ≤3 live, peak ≤.3) and soft in Calm.
- Fireworks: the sky is now a full-screen back layer, so bursts cover the whole viewport behind the header and skyline. User shells ≥1.15 add a screen glow and drifting smoke.
- Diyas: each new flame washes the screen with warm light (the glow grows with the count). A fixed courtyard flood (`.zone-flood`) holds the whole screen warm in proportion to `--lit`, with a slow flicker. Lighting all nine adds a full-screen gold bloom and a floor glow.
- Wish: lighting the card's diya breathes a full-screen warm glow.
- Finale: its sky is a full-screen back layer, with screen glows on the big beats, rainbow volleys from both edges and rainbow ambient shells before the button.

## R3.5 Angry Diya removed
- Deleted `js/act-angry.js` and `css/act-angry.css`, and removed their link and script tags.
- Removed the zone markup, the HUD entry, its sky colours and its scenery CSS.
- Zones are renumbered I–X (Mood VIII, Wish IX, Finale X) in both the HUD and the headers.
- Shortcuts: 1–9 jump to I–IX and 0 jumps to the Finale. The help list was updated, and `angry` was removed from the loud-zone sound hint.
- Verified: no 404s and no console errors.

## R3.6 Logo
- The official white E2M mark (`assets/e2m-logo-white.svg`, used as-is, never redrawn) appears:
  - In the HUD, at 28px with the link labelled "E2M, back to the temple gate".
  - Above the opening eyebrow, with alt "E2M". It fades with the copy.
  - In the finale reveal, with alt "E2M".
  - As a faint footer mark (decorative, alt="").
- All instances have padding for clear space and keep a 1:1 aspect.

## R3.7 Motion and real life
- Camera breathing: the nebula and stars drift slowly. It is translate-only and composited (a scale version measured as the costliest loop, so it was removed).
- Scroll depth: stars and nebula move at two different rates, on top of the existing scenery parallax.
- Header pointer parallax: the title and kicker shift a few px with the mouse.
- Stages rise into place on first view.
- Dhvaja flags sway, deepmala and niche lamps flicker irregularly (3 desynchronised groups, low amplitude), and warm light spills on the stone.
- The toran garland and gate bells sway. Smoke, embers and birds come from the ambient layer.
- Buttons and chips have a tactile press (scale plus warm glow).
- Performance:
  - Off-screen sections pause their CSS loops (`.is-away`, IntersectionObserver with a 200px margin). This also helps every activity.
  - Live and static SVG split, as noted under R3.2.
  - Everything is gated by Calm, Pause and reduced motion.

## Verified (Playwright, own browser contexts, threaded server :5173)
- No console errors, page errors or 404s at 390 (touch), 768, 1440 and 2560, including a full-page scroll pass and OS reduced motion.
- No horizontal scroll: `scrollWidth` equals `innerWidth` at 390, 768, 1440 and 2560.
- Fireworks:
  - The hold ring and beam track the pointer, and charged shells climb higher and break wider.
  - Grand multi-break works.
  - Rainbow bursts show the full spectrum.
  - The guide says "Tap" on touch and "Click" on mouse, and hides after 3 bursts.
  - The skyline spans −28px to the width +28px at 390 and 2560 with whole shapes.
- Ambient:
  - The worst ambient pixel under any header text leaves ivory-72 text at **9.2:1** worst case.
  - In the mood zone with near shells firing: 118fps (120Hz display), p95 9.2ms, 0 long frames.
  - In the fireworks sky under a loaded machine: about 78–85fps, p95 about 19ms, 0 long frames.
- Audio:
  - Enabling sound works.
  - All voices play without errors, and 40 simultaneous bursts are limited without errors.
  - The chakri loop starts, rate-changes and stops, and a loop created while sound was off starts when sound is turned on.
- Gating:
  - OS reduced motion leaves the ambient layer off.
  - Calm leaves it on but sparse.
  - Pause turns it off, and it resumes afterwards.
- Shortcuts: 0 jumps to the Finale, 8 jumps to Mood and focuses its title. HUD shows I–X.

## Revision 3 follow-up (A4, from B4's report)
- **Lantern corridor:** `.zs-corridor` now repeats a carved temple-pillar colonnade (fluted shaft, kumbha band, stepped bracket capital, beam) with a small temple bell between the pillars. There are no arches of any kind.
- **Laddoo stall:** `.zs-awning`'s scalloped valance is now a toran (bandhanwar) of mango leaves and marigolds with a slow sway (still in Calm).
- **Sweep:** zones.css, world.css, base.css, index.html, world.js, core.js and act-fireworks.js have no remaining cusped, onion, minaret, dome or scallop shapes. Only historical comments mention them.
- **First-visit tip:**
  - It is now a 44px strip inside the HUD bar, between the brand or progress line and the Sound button, so it never overlays page content.
  - Wording: "Sound & motion: Tools · ? keys". On touch it drops the keys hint and the Open button.
  - It auto-dismisses after 7s, or on scroll, or on any tap elsewhere.
  - It is held back until the visitor has not touched a stage for 4s.
- **Toasts:**
  - They now drop over the HUD bar (`pointer-events: none`, so the HUD stays usable), one at a time and compact.
  - They no longer sit on any play area or bottom game control. Verified: the chakri Hold button is clear at 390, 1024 and 1440.
- **`.zs-pit`:** the bottom band is translucent (.26 → .42) and feathered.
- **`E2M.screenGlow`:**
  - It is now a 128px canvas holding a cached pre-rendered radial gradient per colour, stretched by CSS and animated with opacity and transform only. There is no blend mode, filter or full-viewport gradient repaint.
  - It is inserted inside the zone at the point (between scenery and stage), so it lights opaque scenery bands instead of hiding behind them.
  - A storm of maximum-power glows at the 3/s cap made no measurable FPS difference (72 vs 73fps).

# Revision 4: dark space theme, no zoom, subtle shake, haptics, Lakshmi diya (Agent A5: shell, engine, world, fireworks, diyas, wish, toolkit)

## R4(1) One continuous deep-space backdrop, seamless zones
- Tokens: `--space-0 #05070F`, `--space-1 #080B1E`, `--space-2 #12103A`, `--space-3 #241044`, `--nebula-indigo`, `--nebula-magenta` (both 11% or less), `--space-mist` and `--space-floor` for feathered floors.
- `.sky` is one fixed backdrop: a deep-space gradient, a faint indigo and magenta nebula, and three star depths (`.sky-stars--far/mid/near`, built by world.js).
  - Each depth drifts by translate only and moves at its own rate on scroll.
  - Some stars twinkle, by opacity only. The sky bleeds 64px past the viewport.
- The per-zone sky colour tween is removed, so there are no colour jumps between zones.
- Every zone's scenery is now transparent over the sky and recoloured to space tones with gold hairlines. Removed:
  - the brown laddoo glow and counter, and the plum gift carpet, wish desk and courtyard floor;
  - the ember-orange chakri pit (now a 7% gold glow);
  - the saffron finale glow;
  - the brown lantern-corridor bell.
- The opening facade, gopuram, fireworks skyline and finale silhouettes are recoloured from plum to navy and indigo. The Hindu temple shapes and the no-cut-edge fixes are unchanged.
- Seams:
  - `.zone-scenery` fades over at least 220px at the top and 240px at the bottom, so at every boundary only the continuous sky shows. Neighbouring zones cross-fade over more than 400px.
  - The opening's ground now continues 260px below the gate and dissolves into space (`.opening::after`, `overflow-x: clip`).
  - The full-width laddoo counter hairline, which read as a seam, is removed.
- Verified at 360, 390, 768, 1440 and 2560: no visible band at any of the 9 zone boundaries.

## R4(2) No background zoom anywhere
- `E2M.impact` no longer scales anything. It no longer writes `style.scale`, and the shockwave ring and screen flash are removed.
- Removed from the sky: GO CRAZY `stars-drift` `scale(1.012)` and the nebula "camera breathing" loop. Removed elsewhere:
  - `e2m-sglow` (screenGlow) scale keyframes: now opacity only;
  - `e2m-glint` scale: opacity only;
  - the temple flag `scaleX` (skew only now);
  - the old diyas `scaleY` floor and scale flicker. The new diya has no scale at all.
- The opening gate zoom stays as the one entrance transition. `finishEnter` resets it to scale 1, and it never runs during or after activities.
- Remaining `scale()` in A5 files is foreground only:
  - flame flicker in base.css;
  - button and chip press;
  - fireworks UI (charge ring, guide, gem);
  - hidden-diya glint and shimmer, and the bell ripple;
  - the scroll-cue line.
- Exception: `.fn-floor` keeps a static, never-animated `scaleY(.2)` perspective so the finale rangoli lies flat on the floor.
- Measured during fireworks, GO CRAZY, diya lighting and the finale at 390, 1440 and 2560. On `.sky`, the star layers, `.sky-nebula`, `#e2m-ambient`, every active `.zone-scenery` and `.zone-stage`, `.fw-skyline` and the finale stage:
  - matrix a and d stayed 1 (maximum deviation 0);
  - the computed `scale` stayed `none`;
  - shake shifts were 0.5 to 4.7px.

## R4(3) Immersion only in the Fireworks zone
- Ambient crackers (`#e2m-ambient`) run only while the Fireworks zone is active. They fade in when it enters and fade out over 0.9s when it leaves.
- The canvas is masked to the zone's on-screen box, with a 160px feather at the top and 220px at the bottom (`--at`/`--ab`, updated on scroll). Shells burst only in the zone's open sky, above the temple town.
- The opening, every other zone and the finale have no ambient crackers. The finale keeps its own show.
- Every cracker that explodes shakes the zone subtly, by translate only:
  - your own shells go through `E2M.impact`: 4px or less when small, 6px or less when big, with a 'burst' haptic;
  - idle shells shake 3px or less with no haptic;
  - near background shells shake about 2.6 to 4px, mid shells about 1.5 to 2.5px, far shells not at all.
- The sky glow behind big bursts is mixed towards warm light (`warm()`), so rainbow greens no longer muddy the space backdrop.
- The wish card's diya glow is cut from 0.75 to 0.28 power, so the rest of the page stays calm.

## R4(4) Haptics
- `E2M.haptic(name|ms|pattern, power)` (core.js) is feature-detected (`E2M.hapticsSupported`). It works as follows:
  - it fires only after a user gesture;
  - it is gated by the new persisted pref `E2M.prefs.haptics` (default on);
  - in Calm only 'tap' and 'select' pass;
  - calls are at least 35ms apart, and a pattern longer than 60ms is never interrupted;
  - an explicit call within 90ms after an automatic impact haptic replaces it.
- `E2M.impact` fires a matching haptic automatically. `o.haptic: false` suppresses it, and `o.haptic: 'name'` picks one.
- The Tools panel has a "Haptics" switch. Where the API is missing (iOS Safari), it is muted with "Not supported on this device".
- Wired in A5 zones:
  - fireworks: launch, charge ticks, bursts, grand shell, GO CRAZY, chips;
  - diya: 'success' on lighting, 'light' when put out;
  - wish: style and wish picks, download, share, card diya;
  - HUD and Tools: sound, Tools button, zone menu, every switch and segment;
  - world: bells, hidden diyas ('success'), Enter, finale button.

## R4(5) "Light Up the Diya": the Lakshmi shrine (act-diyas.js and act-diyas.css rewritten)
- The stage is one framed shrine:
  - a temple niche with a corbelled lintel and gold hairline frame;
  - a Nagara shikhara crest with two side spires, an amalaka, a kalasha and a dhvaja flag;
  - kalasha finials at the corners.
- Custom SVG Gajalakshmi (800×860):
  - Lakshmi seated in padmasana on a full-bloom pink padmapitha: upturned back and front petals, a gold seed-pod rim and downturned petals;
  - a red-and-gold sari with pallu, a choli, feet with alta and toe rings, a kirita crown with jewels, maang tikka, bindi, nath, jhumkas, two necklaces with a lotus pendant, and armlets and bangles;
  - four arms: two hold lotuses, one is in abhaya mudra, one showers gold coins;
  - a prabha halo with jwala flames;
  - two attendant elephants with gold forehead plates, jhool cloths, anklets and tusks, raising kalasha pots;
  - a lotus pond with pads and buds, and stars on the back wall;
  - a brass diya on a stand in front of her.
- Lighting it (the diya `<button>` "Light the diya", the "Light the diya" primary, or Enter/Space):
  - the flame ignites and flickers (skew and rotate);
  - the night veil lifts, a warm pool and an aura bloom behind her, and her halo lights;
  - god-rays fan out from the crown and from the diya, then rotate and sway slowly;
  - golden motes rise and spiral round her (canvas clipped to the niche);
  - coins fall from her hand, the lotus petals open by rotation, the pots glint and the water streams flow;
  - the stars brighten;
  - flick, chime and bell sounds, a 'success' haptic, a 2.4px shake, and an announcement: "The diya is lit. Goddess Lakshmi's blessings glow."
- All of this stays inside the frame. Nothing is full-screen, and there is no `screenGlow`, `zone-flood` or `fx` overlay.
- Idle: the flame breathes, motes drift and the rays turn slowly.
- "Extinguish" then "Light again" replays it, with a wisp of smoke and a whoosh.
- Calm and reduced motion give a static lit glow: no rotation, coins, flicker or motes. Pause stops the canvas and the CSS loops.
- Compat:
  - `E2M.state.diyas` is now `[lit]` (length 1);
  - `E2M.lightAllDiyas()` lights it with the full effect if it is unlit (the finale uses this);
  - `diyas:allLit` fires once, the first time it is lit;
  - the hidden diya and bell in the zone header are unchanged.
- Header copy: "The Shrine", "Light Up the Diya", one short line, and an input-aware hint. The HUD label is "Lakshmi Diya".

## Verified (Playwright, own contexts, :5173)
- No console errors, page errors or failed requests at 360, 390 (touch), 768, 1440 and 2560, including a full scroll pass, the fireworks, GO CRAZY, the diya and the finale.
- No horizontal scroll: `scrollWidth` equals `innerWidth` at every width.
- `navigator.vibrate` was stubbed and its calls recorded:
  - fireworks gave 17 to 21 calls (25 Enter, 10 launch, `[33,28,9]` burst, 6 charge tick, 15 held launch);
  - the diya gave `[18,40,28]`.
- Gating:
  - Calm blocks 'success' and passes 'tap';
  - with Haptics off there are 0 calls;
  - two taps 5ms apart produce 1 call, and a 'win' pattern is not interrupted;
  - `E2M.shake` returns false under Calm, Pause, Screen shake off and OS reduced motion;
  - ambient is off under Pause and OS reduced motion, and resumes after Pause.

---

# Revision 5 (a): Lakshmi's sun rays go full-screen, Lakshmi stays clean (Agent A6: act-diyas.js, act-diyas.css)
Files touched: `js/act-diyas.js`, `css/act-diyas.css` only. No edits to core.js, world.js, zones.css or index.html: the rays layer is created by act-diyas.js and styled in act-diyas.css. Pre-edit snapshot: scratchpad `v1-before-r5`.

## R5(a)1 The sun: full-screen rays from behind Lakshmi
- New fixed layer `.dy-sun` (aria-hidden, pointer-events none), inserted right after `.sky`: z 1, above the deep-space sky (z 0) and below the whole page (`main`, z 2). Every heading, line and control stays in front of it.
- It is just two composited quads. Each is a small pre-rendered canvas (1024px, or 768 on mobile) sized by CSS. There is no scale transform.
  - **Wheel A** holds three radially centred elements: the sun's core glow (sized to the shrine, 1.9 x frame width), a broad faint dawn lift across the whole screen, and 24 soft beams (8 nested wedges each, so the beam profile falls off like a real shaft of light).
  - **Wheel B** holds 16 finer beams.
  - The wheels turn in opposite directions (220s and 330s per turn, CSS animation, transform rotate only). Where their beams cross, the light shimmers.
  - Wheel A is repainted only when the viewport or shrine proportions change by more than 3%.
- The origin follows her halo (frame centre, 236/860 of its height) using `translate3d` on a will-change wrapper.
- Opacity is tied to how much of the shrine is on screen: `smoothstep(seen / 0.85)`. The rays are full while about 85% of her shows, fade smoothly over roughly 500px of scroll as she leaves, and are fully gone (opacity 0, `visibility: hidden`, rotation paused) once she is out of view. They come back on return while still lit.
  - Updates run on scroll (rAF-throttled), resize, a ResizeObserver on `#main` (hints collapsing, text size, fonts) and a ResizeObserver on the frame.
- Lighting raises the sun over 2.6s, starting 0.26s after the flame catches. Extinguish sets it over 1.5s. `.is-sunlit` is set on `#zone-diyas` while lit.
- Dawn lift: the shrine's back wall warms to a sunrise. A new `lk-dawn` radial wash behind everything inside the niche fades in over 2.8s. Outside the shrine, the zone's mandapa colonnade thins to 0.17 while sunlit, so the light reads through it as soft silhouettes rather than blocks.
- Legibility in sunlight:
  - A second header scrim (`.zone--diyas .zone-head::after`) fades in only while sunlit.
  - A soft dark pool sits behind the status line and buttons (`.dy-controls::before`).
  - Measured worst case (5th percentile of pixels, 8 ray angles, 390/1440/2560): kicker 12px is 4.95:1 or better, heading line 6.1:1 or better, status 5.8:1 or better, button 8.3:1 or better, title 11:1 or better.
- Calm / prefers-reduced-motion: a static soft glow. Wheel A is still at 0.68 opacity, wheel B is off, and nothing rotates.
- Pause all motion: the rotation freezes (the global `html.is-paused` rule applies).
- Flash safety: the only changes are a slow rotation and opacity that follows scroll or the 1.5s/2.6s state fades. There are no flashes.

## R5(a)2 Lakshmi stays clean
- The art is now two stacked SVGs with the same viewBox, with the motes canvas between them, so no particle can cross her.
  - **Back** (`.lk-art--back`, aria-hidden): wall, dawn wash, in-frame rays, aura, streams, halo, elephants, pond, lamp pool.
  - **Front** (`.lk-art--front`, role="img"): lotus throne, the goddess, coins, veil, diya, frame and crest.
  - Gradients and the clip live in the back SVG's `<defs>` and are referenced document-wide.
  - The lamp pool moved behind the lotus.
- Coins: the falling stream now leaves just below and outside her fingertips (x 509-517, y 462) and drifts outward into the lotus. It stays clear of the sari edge and is hidden behind the rim and petals. The heap moved from her lap onto the lotus rim beside her.
- Native tooltip removed. The SVG `<title>` is gone. The front SVG has `role="img"` plus `aria-label="Goddess Lakshmi in a temple shrine"`, and `aria-describedby` points to a visually hidden `<p id="lk-d">` carrying the full description. Verified: no `<title>` and no `[title]` anywhere in the stage.
- Perf: `.dy-frame { contain: layout paint }` keeps the shrine's per-frame repaints (flame, coins, in-frame rays) scoped to the frame instead of re-recording a page-sized layer.

## Kept
`E2M.lightAllDiyas()` (the finale lights her while she is off screen; the sun appears when you scroll back), `E2M.state.diyas` (length 1), `'diyas:allLit'` (emitted once), haptics ('success', 'tap', 'light'), `E2M.announce` lines, the soft `E2M.shake`, the Calm/pause/reduced gating of the in-frame animations, and keyboard and focus behaviour. There is no `scale()` on any background.

## Verified (Playwright, own browser contexts, :5173)
- Screenshots at 390, 1440 and 2560 in these states: unlit, lit (full-screen rays), zone header with the sun rising behind the shrine, mid-scroll fade, scrolled into Rangoli (rays gone), and scrolled back (rays return).
- Fade steps at 1440: frame top 106 gives 1.0, then -218 gives 0.90, -380 gives 0.54, -542 gives 0.16, and fully out gives 0.
- DPR-2 close-ups: her face, crown and arms are crisp, with nothing drawn over them.
- Hovering her face for 2s produces no tooltip, and there is no `<title>` or `[title]` in the stage.
- No console errors. No horizontal scroll at 375, 390, 768, 1280, 1440, 1920 or 2560.
- Scale proof: 228 elements checked on the sun layer, the sky and the diyas scenery, sampled three times. Every computed transform has scale 1.000 and the `scale` property is none on all of them.
- Calm, OS reduced motion, Pause, extinguish and relight, and the finale `lightAllDiyas` path all pass.
- Paint trace: the sun adds 0 paints per frame (compositor only).
- GPU compositing (ANGLE/Metal): a locked 60 fps lit at 390, 1440 and 2560, the same as without the sun and as pre-R5.
- Software compositing (headless SwiftShader) drops from 25 to about 15 fps at 1440 with the two rotating full-screen quads. That configuration only applies to GPU-blocklisted machines.

## Found, not changed (outside A6's files)
`world.js` `initHints()` collapses each zone's "how to" hint on the stage's `pointerdown`. Under OS prefers-reduced-motion the collapse is instant, so the stage jumps up (about 28px) between press and release. The first mouse click on a zone's primary control (for example "Light the diya") is lost. A second click works. This reproduces identically on the pre-R5 snapshot.

Suggested fix for the world.js owner: for `e.type === 'pointerdown'`, defer `hint.classList.add('is-done')` until after the release. Listen once on window for `pointerup`/`pointercancel` (capture), then use `setTimeout(…, 0)` so the click lands first.

---
# Revision 7: Fireworks Playground — lively background, real shake, haptics you can see, echo, more options (Agent A8)

Files: `js/core.js` (prefs, haptics, shake/impact, audio echo + voices, particle engine, ambient show), `js/act-fireworks.js` (rewritten deck and crackers), `css/act-fireworks.css` (deck, tray, status strip), `js/toolkit.js` + `css/toolkit.css` (explicit Motion, note, reset keeps deck), `js/world.js` (ambient boost 1, was .85), `index.html` (fireworks hint mentions Esc). No other activity file was touched.

## Why it was flat (diagnosis confirmed in code)
- Ambient: one event every 1.2–3.5s divided by a .85 boost, and `ambOK()` returned false under OS reduced motion.
- Shake: a cosine spring with tau .07 that reached the screen one frame late (already decayed), applied to the stage at depth .55: ~0.6–1px.
- OS reduced motion made `isCalm()` true, which zeroed ambient, shake and most haptics in the zone; Tools refused "Standard".
- Found while measuring, pre-existing: the particle engine started an extra rAF chain every time a burst or emitter added sparks during a frame. A long show piled up dozens of chains (~50,000 sprite draws per frame for ~1,000 sparks). This is why the pre-R7 GO CRAZY ran ~18fps even on a GPU.

## R7.1 Lively background (core.js `E2M.ambient`)
- About one launch every 0.4–1.2s, plus volleys (3–5 fanned), whistling rocket pairs, a far ladi crackle run, a salvo every 8–12s (7–10 launches ending in one big near shell) and short rushes of activity.
- Udan rockets with long tapered streaks and a whistle; aerial shells from mortar tubes (peony, ring, willow, palm, crossette, strobe, chrysanthemum, heart).
- Three depths: far (tiny, hazy, quiet, heard late with more echo), mid, near (big, bright, loud; a 1–3px nudge, at most one per 600ms, never while the visitor is playing).
- Colours: rainbow, gold, pink-purple, multicolour, saffron-green and singles.
- Shells keep clear of text boxes (header, guide, status strip). Zone only; fades when the zone leaves.
- Runs under OS reduced motion. Stops only for Pause or a Calm the visitor chose. Effects intensity scales density.
- New pref `motionExplicit`. New helpers: `E2M.fwLive()`, `E2M.calmExplicit()`, `E2M.osReducedOnly()`.
- One-time chip: "Reduced motion detected — fireworks background is on for this section · Turn off". Turn off sets an explicit Calm. The chip is remembered in `e2m-diwali:fw-rm-chip`.
- Tools: a Motion choice is explicit (it overrides the OS both ways). A note explains the OS case. Screen shake is greyed only under an explicit Calm.
- API additions: `E2M.ambient.wind()`, `.touch()`, `.stats()`, `.resetStats()`, `fire('volley' | 'salvo' | 'rocket' | depth)`. Events `ambient:launch` and `ambient:burst`.

## R7.2 Real shake (core.js `E2M.shake` / `E2M.impact`)
- The kick is applied on the same frame as the call. It is a damped spring (dur/4.2) with a little side wobble. Translate only.
- Fireworks zone and finale: 2–8px by weight, 350–700ms; ≥ .9 or 'rumble' adds a short sustained rumble up to 8px.
- Other zones keep the R4 caps: ≤ 4px small, ≤ 6px otherwise. Note: their kick now also lands at full designed amplitude on frame one (impact .6 measures 4.8px; impact .25 measures 2.95px).
- `E2M.shake(px, ms, { kind: 'ambient' })` is rate-limited. `{ sustain }` gives a rattle (ladi, anar, chakri).
- In the Fireworks zone the stage and deck never move (`data-impact-stage="none"`). The layers that move: temple town 1.0, zone sky canvas .8, ambient canvas .55, scenery .35. Each is its own compositor layer (`will-change: translate`).

## R7.3 Haptics you can see
New patterns:
- `rocket`: rising pulses.
- `burst`: thump plus two echo pulses timed to the current Echo delays.
- `charge`: a growing tick every ~120ms while holding.
- `grand`: long rumble.
- `bijli`: huge thump plus tail.
- `ladi`: one tick per bang.
- `fizz`: anar, chakri and phuljhadi.

Rules:
- In the Fireworks zone, only an explicit Calm limits haptics.
- grand / bijli / rumble may replace a quieter tail.
- A launch replaces the last charge tick.
- `E2M.hapticsSupported` now also needs a phone or tablet (desktop Chrome exposes a no-op `vibrate`).
- Event `haptic` and `E2M.haptic.log`.

Deck chip:
- States: "Haptics on", "Haptics off", "Haptics: not supported on this device (try a phone)".
- It toggles the pref, and its little phone buzzes whenever a haptic actually fires.

## R7.4 Echo sound (core.js audio)
- Three echo taps (delay → darker lowpass → decaying gain → own pan, part into the reverb) on a shared bus. Every firework voice sends to them; far voices send more.
- `E2M.audio.echo('off' | 'soft' | 'hall' | 'mountains')` sets repeats 0/1/2/3 and the reverb wet. Default: Big hall.
- New voices: `whistle` (udan rocket), `mortar` (shell lift), `bang` (ladi), `bijli`. Loops: `anar` and `fizz` (the chakri loop is unchanged).
- Background voices (`bg`) get at most 8 of 16 concurrent voices.
- `E2M.audio.stats()` reports counters and tap state.
- In the zone: "Sound is off — turn it on for crackers with echo" + "Turn sound on". It plays a demo shell with echo.
- The Toolkit's generic sound toast no longer fires in this zone.

## R7.5 The deck (act-fireworks.js / .css)
- **Primary row:** Cracker radiogroup with icon, name and Hindi name: Rocket · Aerial shell · Anar · Chakri · Ladi · Bijli bomb · Phuljhadi.
- **Main row:** Launch Single/Volley/Barrage (`.seg`), launched count + noise level, Haptics chip, More options (`.btn-marigold`), Diwali night show (`.btn-diya`), Go crazy (`.btn-diya--brass`).
- **More options tray** (genda-phool toran edge): shell shape (10 incl. E2M and Surprise), colour mode (Rainbow, Gold, Pink-purple, Saffron-green, Random per shell), Power slider, Wind (Left/None/Right), Trails switch, Echo (Off/Soft/Big hall/Mountains), Reset the deck, Done.
- Every group is a radiogroup with roving tabindex and arrow keys (Home/End). Esc closes the tray and returns focus.
- **Crackers:**
  - Rocket: whistle, streak, crackling break.
  - Aerial shell: hold-charge, grand, double-click mega.
  - Anar: about 3s fountain at the point.
  - Chakri: ground spinner.
  - Ladi: 26–40 bangs along a sagging red cord.
  - Bijli: fuse, then a huge bang with a capped white flash (opacity ≤ .16, behind text), a shockwave ring and 8px.
  - Phuljhadi: a sparkler that follows the pointer; trails keep the drawing. Keyboard swirls it.
- Volley fires 3–5. Barrage keeps firing while held (also hold Space).
- **Diwali night show:** 40s in six acts (rockets, anar row, volleys over chakris, rainbow fan, bijlis, an escalating barrage, a ladi finale both ways, three mega shells, golden willow, E2M, a long rumble). The button becomes "Stop show · 0:NN" with a progress bar. Esc stops it. Shake and haptics escalate with progress.
- GO CRAZY is kept.
- Deck choices persist in `e2m-diwali:fw-deck` (Reset progress keeps it).
- `E2M.fireworks.status()` / `.startShow()` / `.stopShow()`.

## Engine (core.js `makeEngine`, shared by every canvas on the site)
- **Fixed:** duplicate rAF chains (`ensure()` is a no-op inside a frame).
- Spark and glow sprites now come from two pre-warmed 1024px atlases.
- Flash bloom capped at 380px × scale, at most 8 alive. Large flashes share `E2M.flashGate`: ≤ 3 per second, the rest drawn at 20%.
- New shells thin out as the engine fills. Invisible sparks skip drawing. Slow sparks skip the streak stroke.
- New: wind, a live trails toggle, quality, `addEmitter`, `emit`, `glow`, `isTrails`, `colorFn`, rocket `tail`/`wobble`/`launchSound`, named palettes (`E2M.palettes`).

## Verified (Playwright, own contexts, :5173; numbers in the A8 report)
- Ambient per 10s, OS reduced motion on and off.
- Shake 2–8px with 0 scale violations.
- Haptic patterns from a stubbed `navigator.vibrate`, and the chip states.
- Echo taps and scheduled voices, 0 audio errors.
- All 7 crackers and the 3 modes.
- Keyboard, persistence and Esc.
- Contrast ≥ 6.8:1 with bursts present (≥ 8.4:1 with shells burst behind the heading).
- ≤ 3 large flashes per second.
- No console errors, no horizontal scroll at 390/768/1440.
- 60fps on GPU through the whole night show at 1440 and 390.
