# Troubleshooting

## Share link fails or hangs in incognito

### Symptoms

- `https://hero.vibez.ventures/#/share/<comic_id>` takes a long time, hangs, or shows **SAGA UNAVAILABLE**
- Browser console shows a failed request to:
  - `/.netlify/functions/public_comic?id=<comic_id>`
- Network response is `502` with:
  - `Function.ResponseSizeTooLarge`

### Root cause

Netlify Functions have a **maximum response payload size**. If `public_comic` returns the full comic including base64-encoded panel images, the JSON response can exceed the limit and fail with `502 Function.ResponseSizeTooLarge`.

### Fix pattern (required)

Do **not** return base64 panel images inside the `public_comic` JSON response.

Instead:

- `public_comic` returns:
  - comic metadata (id/title/theme/alignment/isPublic/etc)
  - panels with captions
  - each `panel.imageUrl` replaced with a per-panel endpoint URL
- `public_panel_image` returns:
  - one panel image as `image/png`
  - long-lived caching headers, e.g. `cache-control: public, max-age=31536000, immutable`

### How to verify in production

1) `public_comic` returns **200** and a small JSON body:

- `curl -i "https://hero.vibez.ventures/.netlify/functions/public_comic?id=<comic_id>"`

2) The returned `panels[*].imageUrl` values point at `public_panel_image`.

3) `public_panel_image` returns an image:

- `curl -I "https://hero.vibez.ventures/.netlify/functions/public_panel_image?comicId=<comic_id>&panelId=1"`

### How to verify deployment

Use Netlify CLI while linked to the correct site:

- `npx netlify status`
- `npx netlify functions:list --json`

Both functions should show `isDeployed: true`.

## Verification discipline (process)

If someone reports “this is merged” or “this exists on `main`”, verify before claiming:

- Use GitHub API to check file presence:
  - `gh api repos/<owner>/<repo>/contents/<path>?ref=main`
- Or verify via git:
  - `git show origin/main:<path>` (check exit code)
- For production behavior, reproduce in a real browser session (include incognito where relevant) and capture Network/console evidence.

