# Shopnot Spec: Remove Mobile Shops Section + Real Hero Stats

## Request
1. Remove the entire section titled "Top Mobile Accessories, Gadgets and Hardware shops".
2. Replace static hero stats (currently hard-coded "24%" and static footnote text) with data-driven values derived from `public/shopnot-inspired/data/products.json`.

## Current Implementation Findings

### Files and Exact Locations
- `public/shopnot-inspired/index.html`
  - Hero stat card static content at line 84 (label), 85 (value), 86 (foot text).
  - Mobile accessories/hardware section starts at line 99 (`.extended-shop-panel`) and includes heading at line 101.
- `public/shopnot-inspired/app.js`
  - Data loading and validation pipeline in `init()` starts at line 106.
  - Validated dataset assignment at line 122 (`state.products = validItems;`).
  - Existing metric helper `getDiscountPercent()` at line 221.
  - Existing post-load summary update call at line 153 (`updateSpotlightSummary();`).
- `public/shopnot-inspired/styles.css`
  - Hero stat styles at lines 331, 339, 345.
  - Removed-section styles `.extended-shop-panel` and `.mobile-shops-list` at lines 403-429.

## Data-Driven Metric Definitions

### Dataset Scope
Use `state.products` after `validateProducts(...)` filtering in `init()`. This guarantees metrics only use valid, user-visible products.

### Primary Hero Metric (recommended)
- **Metric name:** Average Bangladesh tech savings found
- **Formula:** Weighted average discount using old price as weight.

\[
\text{avgDiscountPct} = \frac{\sum_{i \in D}(oldPrice_i - price_i)}{\sum_{i \in D} oldPrice_i} \times 100
\]

Where:
- \(D\) = products with `oldPrice != null` and `oldPrice > price`
- round display to 1 decimal place (e.g., `6.0%`)

Rationale:
- More stable than simple unweighted mean because higher-value products contribute proportionally.
- Aligns with user-facing "savings" claim without skew from low-price items.

### Supporting Hero Context Metric
- **Product count:**

\[
\text{productCount} = |state.products|
\]

- **Store count:** unique normalized store names from `state.products`.
  - Reuse existing store normalization behavior (`normalizeStoreName` + alias map).

\[
\text{storeCount} = |\{normalizeStoreName(item.store)\}|
\]

### Fallback Behavior
If no discount-eligible products exist (`D` empty):
- show `0.0%` (or `N/A`) for value
- still show product/store counts in foot text

## Proposed Implementation Plan

### 1) Remove the section from HTML
Edit `public/shopnot-inspired/index.html`:
- Delete the entire `.extended-shop-panel` block inside `#stores` (line 99 through end of the `<ul>` block).
- Keep surrounding `#store-list` and section structure unchanged.

### 2) Make hero stat text dynamically updatable
Edit `public/shopnot-inspired/index.html` hero stat card:
- Add IDs for JS hooks while preserving classes and semantics:
  - label: `id="hero-stat-label"`
  - value: `id="hero-stat-value"`
  - foot: `id="hero-stat-foot"`
- Keep existing class names (`stat-label`, `stat-value`, `stat-foot`) so visual style remains unchanged.

### 3) Compute + render real stats in JS
Edit `public/shopnot-inspired/app.js`:
- Add new DOM references in `dom` object for the three hero stat nodes.
- Add helper `computeHeroStats(products)` that returns:
  - `avgDiscountPct` (weighted formula above)
  - `productCount`
  - `storeCount`
- Add `updateHeroStats()` function that writes:
  - label: `Average Bangladesh tech savings found`
  - value: `${avgDiscountPct.toFixed(1)}%`
  - foot: `Across ${productCount} live deals from ${storeCount} trusted BD stores`
- Call `updateHeroStats()` in `init()` after `state.products = validItems;` and before first render.

### 4) Optional CSS cleanup
Edit `public/shopnot-inspired/styles.css`:
- Remove now-unused selectors for `.extended-shop-panel` and `.mobile-shops-list`.
- Do not modify hero stat styles.

## Accessibility and Visual Style Requirements
- Keep hero stat as plain text in existing semantic `<p>` elements.
- Do not alter color, typography, spacing classes for hero stat card.
- Ensure removed section leaves no empty wrappers causing layout gaps.
- Preserve keyboard and screen-reader behavior (no new interactive controls added).

## Acceptance Checks

### Functional
1. The heading text "Top Mobile Accessories, Gadgets and Hardware shops" no longer exists in DOM.
2. Hero stat value is no longer hard-coded `24%`; it is computed from loaded data.
3. Hero foot text includes real dynamic counts (products + stores).
4. Changing `products.json` values (e.g., price/oldPrice or item count) changes hero value/footnote on reload.

### Data correctness checks
1. Metric uses validated `state.products`, not raw fetch payload.
2. Discount set includes only items where `oldPrice > price`.
3. Weighted formula implementation matches spec equation exactly.
4. Display rounds to 1 decimal place.

### Regression
1. Featured Stores strip still renders and filters normally.
2. Search, category/store chips, sort, and spotlight summary continue to work.
3. Hero card visual style remains consistent with previous design.

## Sample Expected Output (Current Dataset Snapshot)
Using current `public/shopnot-inspired/data/products.json` (23 products):
- `productCount = 23`
- `storeCount = 11`
- `discountEligibleCount = 23`
- `avgDiscountPct (weighted by oldPrice) = 6.023698...%`
- Displayed hero value: **`6.0%`**
- Displayed foot text: **`Across 23 live deals from 11 trusted BD stores`**

## Notes
- Current unweighted average discount is ~7.41%; weighted is ~6.02%. This spec uses weighted as the canonical hero number.
- Store aliases already normalize to canonical names in load flow, so store count stays stable.
