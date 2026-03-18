# Shopnot-Inspired Bangladesh Tech Deals: Same-Flow Implementation Spec

## 1) Goal and Non-Goals

### Goal
Restructure the current Bangladesh tech deals page under public/shopnot-inspired to follow this high-level flow while preserving existing brand voice, copy style, and visual identity:
1. Utility bar
2. Sticky header nav + CTA
3. Hero with search + quick chips
4. Featured stores strip
5. Featured categories cards
6. Deals result grid with filters/sort affordance
7. Trust/value section
8. Newsletter/signup block
9. Footer links

### Non-Goals
- No cloning of external layout markup, copy, styling tokens, or visual motifs.
- No removal of current working interactions (search typing + Enter submit, category chips, store chips/cards, deal links, image preview lightbox).
- No change to fundamental product schema validation rules already used by app.js.

## 2) Current-State Summary (What Exists Now)

- Utility bar, sticky header, hero/search/chips exist.
- Featured stores exists.
- Featured categories exists but is currently placed after results.
- Results section exists with search/store filtering and spotlight summary.
- Trust/value section exists as Why Findly.
- Newsletter and footer exist.
- Supplemental Top Mobile Accessories/Gadgets/Hardware list exists between stores and results.
- Sorting control does not exist yet in results.

## 3) Target Information Architecture and Section IDs

Use this exact section order in index.html:

1. utility-bar (top utility info)
2. site-header (sticky nav and primary CTA)
3. section#hero (hero + search + quick chips)
4. section#stores (featured store strip)
5. section#categories (featured categories cards)
6. section#results (deals results + filters + sort)
7. section#trust (trust/value section)
8. section#newsletter (newsletter/signup)
9. footer#footer (footer links)

### Anchor Requirements
- Header nav links:
  - Home -> #hero
  - Stores -> #stores
  - Categories -> #categories
  - Deals -> #results
  - Trust -> #trust (new nav item)
- Hero actions:
  - Browse Categories -> #categories
  - Get Price Alerts -> #newsletter
- Brand logo click -> #hero
- Footer quick links keep Deals/Stores/Newsletter, add Trust -> #trust.

### Scroll/Offset Requirements
- Keep smooth scrolling.
- Keep sticky-offset behavior using scroll-padding-top and section scroll-margin-top.
- Ensure all target sections include consistent scroll-margin-top at desktop and mobile breakpoints.

## 4) Exact File Edits

## A) public/shopnot-inspired/index.html

### A1. Main section reordering
- Keep Utility bar and site header at top.
- In main, reorder to:
  - Hero first (set id from about to hero).
  - Stores strip second.
  - Categories third (move existing categories block above results).
  - Results fourth.
  - Trust section fifth (rename Why section id to trust).
  - Newsletter sixth.
- Footer remains after main; set footer id=footer.

### A2. Navigation and anchors
- Update all Home links from #top to #hero.
- Add Trust link in desktop and mobile nav menus.
- Keep CTA Browse Deals linking to #results.
- Update hero Browse Categories button to #categories (currently points to #results).

### A3. Results section structure additions
Inside section#results:
- Keep existing heading and summary block ids:
  - #result-summary
  - #spotlight-summary
- Keep #store-chips container.
- Add sort affordance block adjacent to store chips:
  - label for sort-select
  - select#sort-select with options:
    - relevance (default)
    - price-low-high
    - price-high-low
    - discount-high-low
    - newest
- Keep #product-grid unchanged for rendering target.

### A4. Featured stores and extended shop listing handling
- Keep section#stores as featured store strip.
- Keep Bangladesh expanded shop ecosystem list, but convert current mobile-shops section into a subpanel within #stores (or directly after store cards inside #stores) to avoid breaking target top-level flow.
- Recommended markup:
  - div.extended-shop-panel with heading and ul.mobile-shops-list.
- Preserve existing/new shop listing names already present.

### A5. Section semantics and accessibility
- Ensure each section has appropriate aria-labelledby when section heading exists.
- Keep lightbox markup and ids unchanged:
  - #image-lightbox, #lightbox-close, #lightbox-image, #lightbox-title.

## B) public/shopnot-inspired/styles.css

### B1. Add/adjust section-level selectors
- Add styling hooks for new ids: #hero, #trust, #footer.
- Ensure section spacing remains consistent after reorder.

### B2. Results controls layout
Add styling for a new sort control group in results header:
- .results-controls wrapper (for store chips + sort block)
- .sort-control label/select
- responsive stacking behavior at tablet/mobile

### B3. Featured stores + extended list composition
- Create styles for .extended-shop-panel within stores area.
- Keep current mobile-shops-list visual style, but scope so it can render inside stores section without requiring separate top-level section spacing.

### B4. Responsive requirements
- >= 1200px:
  - product grid 4 columns (existing)
  - store strip compact card row/grid
- 768px-1199px:
  - product grid 2-3 columns based on existing media queries
  - results controls wrap cleanly; sort control stays visible and reachable
- <= 767px:
  - product grid 1 column
  - nav uses drawer
  - chips wrap without clipping
  - sort control full-width below chips
  - all anchor jumps land with heading visible under sticky header

### B5. Preserve branding/copy/design system
- Keep existing palette variables, typography stack, gradients, ambient background, and button styles.
- No replacement of brand name Findly or Bangladesh-focused copy tone.

## C) public/shopnot-inspired/app.js

### C1. New DOM hooks
Add/select:
- dom.sortSelect -> document.getElementById("sort-select")

### C2. State additions
Add to state:
- sortBy: "relevance"

### C3. Existing interaction preservation (must remain)
Do not regress:
- search input debounced filtering
- Enter submit via form submit handler
- category chip selection
- store chip selection
- featured store card click -> set store + jump to results
- featured category card click -> set category + jump to results
- dealUrl target blank link behavior
- image fallback + lightbox keyboard support (Escape + focus trap)

### C4. Sorting implementation
- Apply sorting after getFilteredProducts and before render output.
- Implement applySorting(filteredItems, sortBy):
  - relevance: keep current filtered order
  - price-low-high: ascending item.price
  - price-high-low: descending item.price
  - discount-high-low: descending getDiscountPercent(item), null treated as -1
  - newest: descending item.id (or createdAt if added later; for now id)
- Keep filtering logic unchanged; sorting is additive only.

### C5. Binding sort control
- Add bindSortControl() called in init after data and DOM are ready.
- On sort-select change:
  - update state.sortBy
  - re-render products
  - preserve selected filters/query

### C6. Anchor/focus behavior
- Keep focusResultsSection behavior for programmatic jumps.
- Ensure Home/brand anchors point to #hero (not #top/about).

### C7. Optional robustness tweak (safe)
- In setupMenuToggle, guard null checks for menu elements before adding listeners to avoid runtime issues if markup evolves.

## D) public/shopnot-inspired/data/products.json

### D1. Data continuity requirements
- Keep all current valid category and store coverage required by validator:
  - Categories: Smartphones, Laptops, Desktop PCs, PC Components, Monitors, Gaming, Accessories, Networking, Storage, Power Backup, Office Equipment
  - Allowed stores include existing canonical names and current alias-normalized forms in app.js
- Preserve and/or expand Bangladesh tech-deals listings; do not remove current represented stores/items unless invalid.

### D2. Optional data enhancement for sorting UX
- Optional: add createdAt ISO date for future newest sort.
- If createdAt is not added, newest uses id descending.

## 5) Behavioral Contract

### Filtering and Search
- Search must match current behavior (title/store/category/brand/location/stock/spec/searchTerms normalized matching).
- Enter on search field submits and updates result list.
- Category/store filters combine with search query as AND logic.

### Sorting
- Sorting must not reset active search or filters.
- Sorting must update result count text consistently.

### Navigation
- Header/mobile nav links scroll to matching sections.
- Sticky header must not obscure section headings after anchor jump.

### Image and link behavior
- Product card image click opens lightbox.
- Broken image fallback path remains active.
- Deal CTA opens merchant URL in a new tab with rel=noopener noreferrer.

## 6) Acceptance Checks

Run these checks after implementation:

1. Flow order check
- Visually confirm top-to-bottom order matches 9-step target flow.

2. Anchor map check
- Click each nav link (desktop and mobile): Home, Stores, Categories, Deals, Trust.
- Verify each lands at correct section and heading is visible.

3. Search/Enter check
- Type a keyword (example: RTX 4060) and press Enter.
- Confirm summary updates and filtered cards show expected items.

4. Category/store filters check
- Click one category chip and one store chip.
- Confirm combined filtering works.
- Click featured store card and featured category card; confirm jump to results with applied filter.

5. Sort check
- Test all sort options with active query/filter.
- Confirm ordering changes correctly while item count and filters stay intact.

6. Lightbox check
- Click product image -> lightbox opens.
- Press Escape -> closes and focus returns to trigger.
- Tab/Shift+Tab keep focus trapped while open.

7. Merchant link check
- Click deal button; verify new tab open behavior and no console security warning from missing rel attributes.

8. Responsive check
- Validate at 1440px, 1024px, 768px, 390px widths:
  - no horizontal scroll
  - nav/drawer behavior correct
  - result controls and sort remain usable
  - product grid adapts per breakpoint

9. Data validation check
- Re-run product schema/domain checks currently used in project scripts/manual checks.
- Confirm zero invalid required fields/store/category/currency/price/url-domain entries.

## 7) Smoke Test Steps (Execution Sequence)

1. Start static preview for public/shopnot-inspired.
2. Open page and verify section order and nav anchors.
3. Run a basic query and Enter submit.
4. Apply category + store filters, then switch sort options.
5. Open and close lightbox via click and Escape.
6. Test one product CTA external link.
7. Resize to mobile and repeat nav + search + sort + filter sanity.
8. Confirm no new console errors.

## 8) Implementation Notes for Future Agent

- Keep edits minimal and targeted to existing files only:
  - public/shopnot-inspired/index.html
  - public/shopnot-inspired/styles.css
  - public/shopnot-inspired/app.js
  - public/shopnot-inspired/data/products.json (only if needed)
- Preserve current naming/style patterns where possible.
- Prefer additive JS changes and avoid refactoring unrelated logic.
- Maintain Bangladesh tech-deals focus and existing expanded store ecosystem references.
