# Shopnot Link + Image Reliability Fix Spec

## 1) Root Cause Findings: Broken-Looking Images

### Data path validity
- Product image values in `public/shopnot-inspired/data/products.json` use relative paths like `assets/placeholder-product-01.jpg`.
- With current app hosting (`public/shopnot-inspired` as site root), these paths resolve correctly.
- Result: no systemic data-path break was found in the current dataset.

### Asset validity
- Referenced placeholder assets exist in `public/shopnot-inspired/assets/`:
  - `placeholder-product-01.jpg`
  - `placeholder-product-02.jpg`
  - `placeholder-product-03.jpg`
  - `placeholder-product-04.jpg`
- Static reachability checks for `/assets/...` return success.
- Result: current local asset files are valid and present.

### Runtime `src` handling
- `public/shopnot-inspired/app.js` already has fallback plumbing:
  - `DEFAULT_PRODUCT_IMAGE`
  - `resolveImageSrc(...)`
  - delegated product-image `error` handler in `bindProductInteractions()`
  - lightbox image `error` handler in `bindLightbox()`
- Remaining reliability gap: `resolveImageSrc(...)` only trims and returns any non-empty string, so malformed-but-non-empty sources pass through until browser failure.
- Practical outcome: UI can still look broken intermittently when upstream image values are bad or when fallback source is unavailable in a future deploy context.

## 2) Root Cause Findings: Dead Outbound Deal URLs

- URL health scan of current `dealUrl` entries shows high failure rate:
  - Total checked: 23
  - Healthy (`2xx/3xx`): 2
  - Failing (`4xx`/error): 21
- Most links are direct product-detail slug URLs that are unstable over time (products removed, renamed, slug changed).
- Several stores return `403` to scripted requests (anti-bot/protection), which still indicates poor reliability for deep links in a generic aggregator flow.
- Stable category/search/store landing pages are significantly less likely to expire than deep product URLs.

## 3) Exact Files To Edit

- `public/shopnot-inspired/app.js`
- `public/shopnot-inspired/data/products.json`

## 4) Reliable Fix Plan

### A. Ensure cards always show a valid image
- In `app.js`, harden `resolveImageSrc(...)`:
  - Accept only non-empty strings.
  - Allow `http://`, `https://`, or relative `assets/...` style paths.
  - Return `DEFAULT_PRODUCT_IMAGE` for anything else.
- Keep existing delegated `error` handling for product images.
- Keep existing lightbox `error` handling and unavailable-state UI.
- Preserve current markup/CSS classes and interaction flow.

### B. Replace unstable dead product URLs with stable store URLs
- In `products.json`, replace each `dealUrl` deep product slug with one of:
  - store homepage,
  - store category listing,
  - store search URL seeded by product keyword.
- Constraint: every replacement URL must remain within the existing `STORE_DOMAIN_ALLOWLIST` and valid `http(s)` scheme.
- Keep `ctaLabel` unchanged unless a clearer label is required (`View deal` remains acceptable).

### C. Preserve existing styles and interactions
- Do not alter `styles.css` visual tokens, card structure, lightbox layout, or animation behavior.
- Limit code changes to URL/image reliability only.

## 5) Acceptance Checks

### Image load reliability
- Load page and verify all product cards render an image.
- Temporarily set one product image to an invalid path and verify card falls back to placeholder.
- Open that card in lightbox and verify no broken icon; fallback or "image unavailable" state appears.

### Deal link reliability
- Click several product CTAs across different stores.
- Confirm links open valid store pages (landing/category/search), not dead product slugs.
- Spot-check URL status for all `dealUrl` values: no known `404` links in dataset.

### Data validation compatibility
- Run current data validation workflow.
- Confirm all records still pass required fields, store/category/currency checks, and domain allowlist validation.
