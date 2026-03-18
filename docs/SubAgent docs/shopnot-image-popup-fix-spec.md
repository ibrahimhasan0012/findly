# Shopnot Image + Popup Fix Spec

## Scope
Investigate popup/lightbox behavior and product image loading in:
- public/shopnot-inspired/index.html
- public/shopnot-inspired/app.js
- public/shopnot-inspired/styles.css
- public/shopnot-inspired/data/products.json

## Diagnosis Summary

### 1) Root cause of mysterious popup UI
The lightbox container is marked with the HTML hidden attribute in index.html, but CSS forces it visible.

- Markup starts hidden: `id="image-lightbox" class="lightbox" hidden` (index.html, line ~172).
- CSS rule `.lightbox { display: grid; ... }` (styles.css, line ~605) overrides the browser hidden behavior.
- Result: on initial page load, a partial/odd popup bar with the close button can appear even before any image click.

Why this happens:
- Browsers apply `[hidden] { display: none; }` by default.
- Author CSS `.lightbox { display: grid; }` has sufficient precedence to override that default in practice.

### 2) Root cause of image load failures report
Image paths in products.json are valid relative paths and actual files exist, but there is no runtime fallback when an image fails to load.

Evidence:
- products.json uses image paths like `assets/placeholder-product-01.jpg` (multiple records).
- Files exist in `public/shopnot-inspired/assets/`:
  - placeholder-product-01.jpg
  - placeholder-product-02.jpg
  - placeholder-product-03.jpg
  - placeholder-product-04.jpg
- Live reachability check returned HTTP 200 for:
  - `/data/products.json`
  - `/assets/placeholder-product-01.jpg`
- app.js renders `<img src="${item.image}" ...>` and sets lightbox image src directly with `dom.lightboxImage.src = src;`.
- No `onerror` handler, no `fallback` path, and no guard for malformed/empty image values.

Impact:
- If any record later contains a bad path/URL (or asset is moved/missing), UI shows broken images with no graceful recovery.
- Lightbox can open with broken image content and no fallback state.

## Exact Fixes

### Fix A: Ensure hidden lightbox stays hidden until opened
File: public/shopnot-inspired/styles.css

Add this rule near the lightbox block:

```css
.lightbox[hidden] {
  display: none !important;
}
```

Expected result:
- On initial page load, no lightbox UI is visible.
- Lightbox only appears after clicking a product image.

### Fix B: Add robust image fallback for product cards and lightbox
File: public/shopnot-inspired/app.js

1. Introduce a constant:
- `const DEFAULT_PRODUCT_IMAGE = "assets/placeholder-product-01.jpg";`

2. Add helper(s):
- `resolveImageSrc(value)`
  - Returns default placeholder when value is missing/empty/non-string.
  - Otherwise returns normalized string.
- Optional: `isLikelyImagePath(value)` for basic validation.

3. Product-card image rendering:
- Use resolved source rather than raw `item.image`.
- Add `data-fallback-src` and an error handler (event delegation recommended).

Implementation pattern:
- In `renderProducts()`, include image element with data attributes:
  - `data-product-image="true"`
  - `data-fallback-src="${DEFAULT_PRODUCT_IMAGE}"`
- Add one delegated listener on `dom.grid` for image `error` event (capture phase):
  - If failing src is not fallback, swap to fallback.
  - If fallback also fails, add a class and avoid infinite retry loop.

4. Lightbox image fallback:
- In `openLightbox(...)` set `dom.lightboxImage.src = resolveImageSrc(src)`.
- Attach a one-time `error` handler:
  - First failure -> fallback src.
  - Second failure -> keep dialog open with readable message/title update (or hide image element and show text).

5. Data validation hardening (optional but recommended):
- Extend `validateProducts()` with `imageValid` check:
  - string and non-empty after trim.
- Keep product if invalid image but force fallback image (do not drop otherwise valid deal records).

### Fix C: Keep path expectations explicit in data contract
File: public/shopnot-inspired/data/products.json

- Retain image values as paths relative to `public/shopnot-inspired/`.
- Document accepted forms in code comments or README section:
  - `assets/file.jpg` (preferred)
  - absolute http(s) URL (optional if future data source uses CDN)

## Acceptance Checks

### Popup behavior
1. Load page fresh.
2. Confirm no visible popup, close button, or lightbox chrome before any click.
3. Click a product image.
4. Confirm lightbox opens normally.
5. Click backdrop and close button; press Escape.
6. Confirm lightbox closes reliably and focus returns to previous trigger.

### Product image loading
1. Verify all current product images render without broken icon.
2. In devtools, inspect several cards and confirm image src resolves under `/assets/...`.
3. Temporarily set one product image to a non-existent file.
4. Reload page and confirm product card image switches to fallback placeholder, not broken icon.
5. Click that card image and confirm lightbox also uses fallback or a graceful empty state.

### Network/path validation
1. Confirm `/data/products.json` returns 200.
2. Confirm `/assets/placeholder-product-01.jpg` returns 200.
3. Confirm no console errors for uncaught image failures after fallback logic is added.

## Notes
- Current image path resolution is not the primary failure in this snapshot; assets are present and reachable.
- Immediate user-visible popup issue is primarily CSS hidden/display conflict.
- The image problem is resilience-related: missing fallback/error handling causes brittle behavior when any image path is wrong or unavailable.
