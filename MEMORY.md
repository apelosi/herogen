## Project memory

This file captures high-signal context that should persist across AI coding sessions.

For incident writeups and step-by-step debugging, see `docs/troubleshooting.md`.

### 2026-04-03 — Public share links failing in incognito (Netlify Functions size limit)

- **Symptom**: Public share URL like `/#/share/<comicId>` failed in incognito with:
  - `502` from `/.netlify/functions/public_comic?id=<comicId>`
  - Error body: `{"errorType":"Function.ResponseSizeTooLarge", ...}`
- **Root cause**: `public_comic` returned the full comic including base64-encoded panel images. The JSON payload exceeded Netlify Functions’ max response size (~6MB).
- **Fix**:
  - `public_comic` returns lightweight comic metadata + captions only.
  - Each panel’s `imageUrl` is replaced with a per-panel endpoint: `/.netlify/functions/public_panel_image?comicId=...&panelId=...`.
  - `public_panel_image` serves a single panel as `image/png` and sets strong caching: `cache-control: public, max-age=31536000, immutable`.
- **Verification**:
  - `curl -i "https://hero.vibez.ventures/.netlify/functions/public_comic?id=<comicId>"` returns `200` and small JSON.
  - `curl -i "https://hero.vibez.ventures/.netlify/functions/public_panel_image?comicId=<comicId>&panelId=1"` returns `200` and `content-type: image/png`.
  - Incognito load of `https://hero.vibez.ventures/#/share/<comicId>` works.

