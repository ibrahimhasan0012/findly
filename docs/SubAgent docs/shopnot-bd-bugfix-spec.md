# Shopnot BD Bugfix Diagnosis + Fix Spec

## Scope
Diagnose and fix reported interaction issues in the Shopnot-inspired site under [public/shopnot-inspired/index.html](public/shopnot-inspired/index.html), [public/shopnot-inspired/app.js](public/shopnot-inspired/app.js), [public/shopnot-inspired/styles.css](public/shopnot-inspired/styles.css), and [public/shopnot-inspired/data/products.json](public/shopnot-inspired/data/products.json).

## Issue-By-Issue Diagnosis

### 1) Search for "galaxy s26 ultra" returns no result
Root cause:
- The current dataset does not contain any item matching "Galaxy S26 Ultra" (or similar token sequence), so exact keyword discovery cannot happen for that term. See [public/shopnot-inspired/data/products.json#L4](public/shopnot-inspired/data/products.json#L4) and there are no "s26" entries in the file.
- Search matching only checks title/store/category/brand/specHighlights in code; there is no dedicated searchable alias field (for model synonyms, abbreviations, or typo-tolerant terms). See [public/shopnot-inspired/app.js#L233](public/shopnot-inspired/app.js#L233).

Fix direction:
- Add a `searchTerms` array support in product model (optional) and include it in text matching.
- Seed at least one relevant Galaxy Ultra item (or mapped alias terms) in [public/shopnot-inspired/data/products.json](public/shopnot-inspired/data/products.json) so user query intent is discoverable.
- Keep normalization with whitespace/delimiter cleanup and apply it to `searchTerms` too.

Required behavior after fix:
- Query `galaxy s26 ultra` returns one or more relevant Samsung Galaxy Ultra deals (real item or explicitly mapped alias).
- Query remains case-insensitive and resilient to extra spaces/hyphens.

### 2) Keyboard Enter in search does not work
Root cause:
- Search Enter handling depends on `keydown` listener attached directly to the input only. See [public/shopnot-inspired/app.js#L225](public/shopnot-inspired/app.js#L225).
- Search UI is not a semantic form; button is `type="button"`, so native submit behavior is absent for some keyboard/mobile IME paths. See [public/shopnot-inspired/index.html#L69](public/shopnot-inspired/index.html#L69) and [public/shopnot-inspired/index.html#L70](public/shopnot-inspired/index.html#L70).

Fix direction:
- Convert `.search-shell` into a `<form id="search-form">` and make button `type="submit"`.
- In JS, bind `submit` on the form and call `preventDefault()` + commit search.
- Keep click and input debounce behavior, but route all commit paths through one shared `commitSearch()` function.

Required behavior after fix:
- Pressing Enter in search input always runs search.
- Mobile keyboard action keys trigger search consistently.

### 3) Header links (Home, Stores, Categories, Deals) do not navigate/work
Root cause:
- Home uses `href="#"` instead of a meaningful top anchor, which can feel non-functional. See [public/shopnot-inspired/index.html#L40](public/shopnot-inspired/index.html#L40).
- Deals points to `#about`, but that section is hero copy, not a deals destination. See [public/shopnot-inspired/index.html#L43](public/shopnot-inspired/index.html#L43) and [public/shopnot-inspired/index.html#L61](public/shopnot-inspired/index.html#L61).
- No offset handling for sticky header; anchored sections can land hidden under header, perceived as broken navigation.

Fix direction:
- Add semantic IDs and map links consistently:
  - Home -> `#top` (or hero section ID).
  - Stores -> `#stores`.
  - Categories -> `#categories` (new ID on featured categories section) or `#results` if intended.
  - Deals -> `#results`.
- Add CSS `scroll-margin-top` on anchor sections (or `scroll-padding-top` on html) to account for sticky header.
- Optional: enable smooth scrolling with `scroll-behavior: smooth` (respect reduced-motion media query).

Required behavior after fix:
- Each header item visibly scrolls to its intended section and does not land under header.

### 4) Featured Stores entries are not working as links/interactions
Root cause:
- Store cards are rendered as plain `<article>` with no click or keyboard interaction. See [public/shopnot-inspired/app.js#L155](public/shopnot-inspired/app.js#L155).

Fix direction:
- Render each store card as interactive control:
  - Option A: `<button>` that sets `state.selectedStore` and re-renders.
  - Option B: `<a href="#results">` with data-store and click handler to filter.
- Add active visual state and ensure keyboard accessibility (`Enter`/`Space` for buttons).

Required behavior after fix:
- Activating a featured store filters results to that store and jumps/focuses to results summary.

### 5) Image preview does not work (example: RTX 4060)
Root cause:
- Product image is static `<img>` with hover zoom only; no preview interaction/modal/lightbox exists. See [public/shopnot-inspired/app.js#L277](public/shopnot-inspired/app.js#L277) and [public/shopnot-inspired/styles.css#L421](public/shopnot-inspired/styles.css#L421).

Fix direction:
- Add preview interaction pattern:
  - Wrap image in preview trigger button/link with accessible label.
  - Open modal/lightbox showing larger image and product title.
  - Provide close button, overlay click close, and Escape key close.
- Ensure image paths remain valid (current placeholder assets exist under [public/shopnot-inspired/assets](public/shopnot-inspired/assets)).

Required behavior after fix:
- Clicking RTX 4060 image opens larger preview; user can close via close button, overlay, and Escape.

### 6) Featured Categories "Explore Category" links do not work
Root cause:
- All three links only navigate to `#results`; they do not pass category intent or update filters. See [public/shopnot-inspired/index.html#L122](public/shopnot-inspired/index.html#L122), [public/shopnot-inspired/index.html#L127](public/shopnot-inspired/index.html#L127), [public/shopnot-inspired/index.html#L132](public/shopnot-inspired/index.html#L132).

Fix direction:
- Add `data-category` per link (e.g., Smartphones, PC Components, Accessories or intended mapped categories).
- Add delegated click handler in JS to set `state.selectedCategory`, re-render chips/results, and move focus to results summary.

Required behavior after fix:
- Clicking each Explore Category applies the intended category filter and updates result count/cards.

## Exact Files and Sections To Edit
1. [public/shopnot-inspired/index.html](public/shopnot-inspired/index.html)
- Search shell markup around [public/shopnot-inspired/index.html#L69](public/shopnot-inspired/index.html#L69)
- Desktop/mobile nav links around [public/shopnot-inspired/index.html#L39](public/shopnot-inspired/index.html#L39)
- Featured Categories links around [public/shopnot-inspired/index.html#L122](public/shopnot-inspired/index.html#L122)
- Add IDs/anchors for reliable section navigation (top/categories/deals mapping)

2. [public/shopnot-inspired/app.js](public/shopnot-inspired/app.js)
- `bindSearch()` around [public/shopnot-inspired/app.js#L208](public/shopnot-inspired/app.js#L208)
- `getFilteredProducts()` around [public/shopnot-inspired/app.js#L233](public/shopnot-inspired/app.js#L233)
- `renderStoreStrip()` around [public/shopnot-inspired/app.js#L146](public/shopnot-inspired/app.js#L146)
- `renderProducts()` around [public/shopnot-inspired/app.js#L255](public/shopnot-inspired/app.js#L255) for image preview trigger
- New handlers: category-link interaction + image modal state/events

3. [public/shopnot-inspired/styles.css](public/shopnot-inspired/styles.css)
- Anchor offset/smooth scroll styles
- Interactive states for store cards/category links
- Modal/lightbox styling and focus-visible states

4. [public/shopnot-inspired/data/products.json](public/shopnot-inspired/data/products.json)
- Add relevant item(s) or aliases (`searchTerms`) enabling `galaxy s26 ultra` discovery

## Accessibility Considerations
- Use semantic controls (`form`, `button`, actionable `a`) rather than click-only containers.
- Preserve visible focus indicators for all interactive elements (existing focus styles in [public/shopnot-inspired/styles.css#L677](public/shopnot-inspired/styles.css#L677)).
- Modal requirements:
  - `role="dialog"`, `aria-modal="true"`, labeled title.
  - Initial focus on close button, focus trap while open, restore focus on close.
  - Escape closes modal.
- Announce result updates via existing live region on product grid ([public/shopnot-inspired/index.html#L109](public/shopnot-inspired/index.html#L109)); ensure summary updates remain text-based and readable.
- Respect `prefers-reduced-motion` for smooth scroll/animation.

## Acceptance Checks
1. Search behavior
- Typing `galaxy s26 ultra` and pressing Enter shows relevant results.
- Clicking Find Deals and pressing Enter produce identical output.

2. Header navigation
- Home/Stores/Categories/Deals each moves to intended section.
- Target heading is not obscured by sticky header.

3. Featured Stores interaction
- Activating a store card filters products to that store.
- Store interaction is keyboard operable.

4. Image preview
- Clicking RTX 4060 image opens preview modal.
- Escape and close button both close modal.

5. Featured Categories links
- Each Explore Category link applies specific category filter and updates result summary.

6. Regression checks
- Deal CTA links still open external pages in new tab.
- Category/store chips still work and combine correctly with search.

## Quick Manual Test Plan
1. Open page and verify initial load shows all products and summaries.
2. In search input, enter `galaxy s26 ultra`; test Enter key and button click.
3. Click header links in desktop and mobile menu; confirm anchor destination and visibility under sticky header.
4. Click each Featured Store card; confirm store chip selection and filtered results.
5. Click RTX 4060 card image; verify modal open/close via close button, overlay, and Escape; verify focus behavior.
6. Click each Featured Categories Explore Category; verify selected category chip and result changes.
7. Run keyboard-only pass (Tab/Shift+Tab/Enter/Space/Escape) across all new interactions.
8. Run reduced-motion check (`prefers-reduced-motion`) and confirm no forced smooth animation.
