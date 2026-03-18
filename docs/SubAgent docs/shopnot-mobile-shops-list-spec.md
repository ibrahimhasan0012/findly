# Shopnot-Inspired Mobile Shops List Spec

## Objective
Add/update a section titled exactly:
- Top Mobile Accessories, Gadgets and Hardware shops

With this exact list and order:
1. Apple Gadgets BD
2. Sumash Tech
3. Gadget n Gear
4. Shei Tech
5. PCB Store

## Current Implementation Findings (Exact Locations)

### Section copy and placement
- Stores section starts at `public/shopnot-inspired/index.html` line 89 (`<section id="stores" ...>`).
- Stores heading/subcopy currently at lines 92-93:
  - `Featured Stores`
  - `Popular Bangladesh tech retailers people compare now.`
- Featured stores list mount node is `#store-list` at line 95.
- Results section starts at line 99. Best insertion point for new companion section is between `#stores` and `#results`.

### List rendering (existing runtime behavior)
- Featured store cards are rendered dynamically via `renderStoreStrip(stores)` in `public/shopnot-inspired/app.js` line 156.
- Source of rendered stores is `storeOptions` built from validated `state.products` in `init()` at line 109.
- Store chips are rendered by `renderFilterChips()` at line 357 using `storeOptions`.
- Store filter logic is in `getFilteredProducts()` at line 252.

### Validation coupling (store names)
- Allowed store names are hardcoded in `ALLOWED_STORES` at line 28.
- Per-store domain constraints are in `STORE_DOMAIN_ALLOWLIST` at line 42.
- Validation enforces exact store membership at `validateProducts()` line 612 (`ALLOWED_STORES.includes(item.store)`).

## Scope Decision: Content-Only vs Filter/Data Integration

Decision for this request: content-only section update.

Why:
- The request is specifically for section copy/list update.
- Existing filters and featured store UI are data-driven from `products.json` plus strict validation.
- Integrating these 5 names into filters requires coordinated domain allowlist + data updates; otherwise entries will be dropped by validation.

Therefore for this task:
- Update/add section copy and visible list in `public/shopnot-inspired/index.html`.
- Do not change `ALLOWED_STORES`, `STORE_DOMAIN_ALLOWLIST`, or filtering logic.

## Implementation Spec

### 1) Add/update companion section in HTML
File: `public/shopnot-inspired/index.html`

- Insert a new section between existing `#stores` (line 89) and `#results` (line 99).
- Reuse existing structural classes (`container`, `section-head`) for consistent style.
- Include exact heading text and a simple list rendering (semantic `<ul>` + `<li>`), preserving requested order.

Required content:
- Heading: `Top Mobile Accessories, Gadgets and Hardware shops`
- List items exactly:
  - Apple Gadgets BD
  - Sumash Tech
  - Gadget n Gear
  - Shei Tech
  - PCB Store

### 2) No JS/data changes for this scope
Do not modify:
- `public/shopnot-inspired/app.js`
- `public/shopnot-inspired/data/products.json`

This keeps the new list informational and avoids data-validation side effects.

## Optional Future Integration Path (Not in this change)

If these 5 names later must drive featured-store cards/chips/filtering, implement safely as follows:

### A) Canonical names
Use canonical store values exactly as:
- Apple Gadgets BD
- Sumash Tech
- Gadget n Gear
- Shei Tech
- PCB Store

### B) Normalize before validation
In `public/shopnot-inspired/app.js`, add pre-validation normalization in `init()` before `validateProducts()`.

Suggested approach:
1. Normalize incoming store text with trim + case-fold + punctuation-insensitive key.
2. Map aliases to canonical names.
3. Validate only against canonical values.

Suggested alias examples:
- `gadget & gear` -> `Gadget n Gear`
- `gadget and gear` -> `Gadget n Gear`
- `gadget n gear` -> `Gadget n Gear`
- `sumash` -> `Sumash Tech`
- `apple gadgets` -> `Apple Gadgets BD`

Normalization key suggestion:
- lowercase
- replace `&` with `and`
- remove punctuation/non-alphanumeric except spaces
- collapse spaces

### C) Integration prerequisites
- Add canonical names to `ALLOWED_STORES`.
- Add verified domains to `STORE_DOMAIN_ALLOWLIST` for each canonical name.
- Ensure `products.json` includes at least one valid item per canonical store.

## Acceptance Checks

### Content checks (required for this task)
1. New heading appears exactly as:
   - `Top Mobile Accessories, Gadgets and Hardware shops`
2. All five list items render in exact order and exact spelling.
3. Section appears between Stores and Results sections.

### Regression checks (required for this task)
1. Existing featured stores (`#store-list`) still render as before.
2. Existing store chips (`#store-chips`) still render and filter correctly.
3. No console/runtime errors after page load.

### Non-scope confirmation
1. No changes to `ALLOWED_STORES` or `STORE_DOMAIN_ALLOWLIST`.
2. No changes to `public/shopnot-inspired/data/products.json`.

## Deliverable
- `docs/SubAgent docs/shopnot-mobile-shops-list-spec.md` (this file)
