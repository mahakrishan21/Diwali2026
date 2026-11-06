# E2M Diwali 2026 — The Festival of Lights

*One Team. A Thousand Lights.*

An interactive Diwali celebration for the E2M team: a temple courtyard at night with ten playable zones — Fireworks Playground, Light Up the Diya (Goddess Lakshmi), Rangoli Studio, Laddoo Stall, Sky Lanterns, Spin the Chakri, Gift Carpet, Diwali Mood Oracle, Wish Card Studio and the Grand Finale.

Plain static HTML / CSS / JS. No build step, no backend, no external APIs. Scores and settings live in `localStorage`. GSAP and Google Fonts load from CDNs.

## Run locally

```bash
npm run dev        # or: python3 e2m-diwali-server.py
# open http://localhost:5173
```

Serve it over `http://` (not `file://`). Any static host works; the site root is this folder.

## Notes

- Sound is off until the visitor turns it on (Tools or the bell button). Haptics need a phone; desktop browsers cannot vibrate.
- Motion, screen shake and haptics can be changed in **Tools**. OS "reduce motion" is respected.
- `docs/` holds the change log, concept note and the locked design contract.
- `assets/e2m-logo-white.svg` is the E2M logo; it belongs to E2M.
