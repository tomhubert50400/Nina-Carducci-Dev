# Gallery regression checks

## Automated DOM checks

Run `npm ci --ignore-scripts`, then `npm test` with Node.js 18 or newer.
The test executes the real gallery scripts and vendored Bootstrap with jQuery
3.7.1 in jsdom. It verifies the CDN bundle version and SHA-256 integrity,
initialization, category filters, repeated clicks, lightbox navigation,
dismissal and reopening. It does not fetch remote resources or submit forms.

## Browser checks

Run `python3 -m http.server 8080` from the repository root, then visit
`http://localhost:8080/tests/gallery.html`. All checks should display `PASS`.
An internet connection is required for the page's normal CDN jQuery script.
This additionally exercises the browser's rendering and integrity enforcement.
The DOM checks are not a substitute for a full visual/accessibility review.
