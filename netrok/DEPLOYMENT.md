# Production deployment notes

Netrok Web 1.0 is a static application. No backend, cookies or remote APIs are required.

## Required

- Serve over HTTPS in production.
- Keep all files in this package on the same origin/path tree.
- MIME types:
  - `.js` → `text/javascript` or `application/javascript`
  - `.css` → `text/css`
  - `.ogg` → `audio/ogg`
  - `.wav` → `audio/wav`
  - `.mid` → `audio/midi` (or `audio/mid` on older servers)
  - `.svg` → `image/svg+xml`
- Do not rewrite asset requests to `index.html`; missing assets must return a real 404 so the game's loader can report the deployment error.

## Caching

For simple non-fingerprinted deployments, a safe starting point is:

- `index.html`, `editor/index.html`, `VERSION`: `Cache-Control: no-cache`
- JS/CSS: short cache or `no-cache` during rollout
- `assets/`: long cache after the release is stable

If you later fingerprint JS/CSS filenames, they can also use immutable long-lived caching.

## Security headers

The HTML files already include a restrictive Content Security Policy. Prefer mirroring it as an HTTP response header if your hosting allows it:

`default-src 'self' blob:; script-src 'self'; style-src 'self'; img-src 'self' data:; media-src 'self' blob:; object-src 'none'; base-uri 'none'; form-action 'self'; connect-src 'none'`

Also recommended:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Cross-Origin-Resource-Policy: same-origin`

Only enable HSTS when the whole host is permanently HTTPS-ready.
