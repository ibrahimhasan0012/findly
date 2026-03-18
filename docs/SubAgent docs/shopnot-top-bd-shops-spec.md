# Shopnot-Inspired Top Bangladesh Shops Update Spec

## Objective
Update the shopnot-inspired site so store-focused UI and filtering reflect this exact top computer shop list for Bangladesh:
- Star Tech
- Sell Tech BD
- Ryans
- Global Brand
- Computer Source
- Techland
- Binary Logic
- Dolphin
- Computer Village
- Potaka IT

Also add UI copy for a second section titled:
- Top Mobile Accessories, Gadgets and Hardware shops

## Current Implementation Findings (Exact Locations)

### 1) Store names and validation rules
- Store allowlist is hardcoded in `public/shopnot-inspired/app.js` under `ALLOWED_STORES` (around line 28).
- URL domain validation per store is hardcoded in `public/shopnot-inspired/app.js` under `STORE_DOMAIN_ALLOWLIST` (around line 42).
- Product store validity is enforced in `validateProducts(products)` via `ALLOWED_STORES.includes(item.store)` in `public/shopnot-inspired/app.js` (around line 612).

### 2) Featured stores rendering
- Featured store cards are rendered by `renderStoreStrip(stores)` in `public/shopnot-inspired/app.js` (around line 156).
- Stores displayed there come from runtime `storeOptions` derived from loaded product data in `init()` (`new Set(state.products.map((item) => item.store))`) in `public/shopnot-inspired/app.js` (around line 109).
- `#store-list` mount node is in `public/shopnot-inspired/index.html` in section `#stores` (around line 95).

### 3) Store filters rendering
- Store filter chips are rendered by `renderFilterChips()` -> `renderChips(dom.storeChips, storeOptions, ...)` in `public/shopnot-inspired/app.js` (around line 362).
- Store filtering logic is in `getFilteredProducts()` comparing `state.selectedStore` to `item.store` in `public/shopnot-inspired/app.js` (around line 281).
- Store chip container is `#store-chips` in `public/shopnot-inspired/index.html` (around line 110).

### 4) Section copy currently controlling store-focused text
- Stores section heading/subcopy in `public/shopnot-inspired/index.html`:
  - `<h2>Featured Stores</h2>` (around line 93)
  - `<p>Popular Bangladesh tech retailers people compare now.</p>` (around line 94)
- Spotlight text template includes top store wording in `updateSpotlightSummary()` in `public/shopnot-inspired/app.js`:
  - `Top BD store: ...` (around lines 225-226)

## Name Normalization Plan

### Canonical store names for UI/data (target)
Use these exact canonical names in `products.json` and UI:
- Star Tech
- Sell Tech BD
- Ryans
- Global Brand
- Computer Source
- Techland
- Binary Logic
- Dolphin
- Computer Village
- Potaka IT

### Alias normalization map (for transition safety)
Implement a normalization layer in `public/shopnot-inspired/app.js` before validation and rendering:

`STORE_NAME_ALIASES` (proposed):
- Ryans Computers -> Ryans
- TechLand BD -> Techland
- Global Brand Pvt Ltd -> Global Brand

Optional aliases (if found in future imports):
- Techland BD -> Techland
- Ryans Computer -> Ryans

Normalization rule:
1. Trim and collapse whitespace.
2. Case-insensitive alias lookup.
3. Replace with canonical value before `validateProducts` checks and `storeOptions` generation.

## Data and Rendering Update Specification

### A) Update store validation lists
In `public/shopnot-inspired/app.js`:
- Replace `ALLOWED_STORES` entries with the exact 10 canonical names listed above.
- Replace `STORE_DOMAIN_ALLOWLIST` keys to match those same canonical names.
- Add domain values per canonical store.

Domain mapping expectation:
- Existing stores keep current real domains where applicable:
  - Star Tech -> `startech.com.bd`
  - Ryans -> `ryans.com`
  - Global Brand -> `globalbrand.com.bd`
  - Techland -> `techlandbd.com`
  - Potaka IT -> `potakait.com`
- Newly introduced stores need valid production domains before shipping:
  - Sell Tech BD
  - Computer Source
  - Binary Logic
  - Dolphin
  - Computer Village

Note: Until those domains are supplied, products using those stores will fail URL allowlist validation and be dropped by `validateProducts`.

### B) Normalize loaded product store names before validation
In `init()` in `public/shopnot-inspired/app.js`:
- Add transform step right after JSON load:
  - `const normalized = loaded.map(normalizeProductStore)`
  - Validate `normalized` instead of raw `loaded`.

In `validateProducts(products)`:
- Keep strict validation against canonical `ALLOWED_STORES`.
- This ensures legacy names still pass only through explicit alias mapping.

### C) Update dataset to reflect target stores
In `public/shopnot-inspired/data/products.json`:
- Replace legacy/non-target stores (`UCC Shop`, `Computer Mania BD`, `Smart Technologies`, `Gadget & Gear`, `Pickaboo`, `Daraz Mall`) from this shop-focused surface dataset.
- Ensure every product `store` belongs to the canonical 10-store list.
- Ensure each canonical store has at least 1 item so it appears in:
  - Featured Stores strip (`#store-list`)
  - Store filter chips (`#store-chips`)
- Keep current required schema enforced by `hasRequiredFields` and `validateProducts`.

### D) Ensure featured stores and filters reflect exact list
Because UI lists are data-derived:
- If dataset contains all 10 canonical stores and no non-canonical stores,
- Then `storeOptions` and `renderStoreStrip()` will automatically reflect that exact list.

Optional ordering control (recommended if exact visible order matters):
- Add `TOP_BD_STORES_ORDER` array in `public/shopnot-inspired/app.js` with the 10 names in requested order.
- Sort `storeOptions` by this array (after `All`).
- Use same ordered array for `renderStoreStrip()` input to keep Featured Stores in exact sequence.

## UI Copy Changes

### 1) Existing stores section copy
In `public/shopnot-inspired/index.html` section `#stores`:
- Change heading:
  - From: `Featured Stores`
  - To: `Top Computer Shops in Bangladesh`
- Change subcopy to explicitly describe the curated top 10 list.

### 2) New section copy block (required)
Add a new section in `public/shopnot-inspired/index.html` (recommended below `#stores` and above `#results`):
- Section title: `Top Mobile Accessories, Gadgets and Hardware shops`
- Supporting copy should clarify this is a companion list to the top computer shops section.
- Reuse existing visual section structure (`section-head` + chip/list/card style) to avoid new component complexity.

Implementation options:
- Option A (copy-only): static explanatory block with paragraph + optional bullet/tag list.
- Option B (data-driven): second filtered store strip backed by a curated subset or new dataset tag.

For this scope, Option A is sufficient unless product tagging for shop type is introduced.

### 3) Spotlight text alignment
In `updateSpotlightSummary()` in `public/shopnot-inspired/app.js`:
- Keep dynamic top-store metric behavior.
- Update wording if needed to align with new copy language (for example, “Top computer shop now: ...”).

## Acceptance Checks

1. Store set integrity
- All rendered store names in `#store-list` are exactly the 10 canonical names.
- No non-listed store appears in featured stores or store chips.

2. Alias compatibility
- Products with legacy names (`Ryans Computers`, `TechLand BD`, `Global Brand Pvt Ltd`) are normalized to canonical names and still render.

3. Validation integrity
- `validateProducts` still rejects items with unknown store names.
- URL domain checks remain active per canonical store.

4. UI copy
- Stores section heading reads `Top Computer Shops in Bangladesh`.
- New section exists with heading `Top Mobile Accessories, Gadgets and Hardware shops`.

5. Filter behavior
- Clicking a featured store card filters results to that store.
- Store chips include all canonical stores plus `All`.

6. Data coverage
- `products.json` contains at least one valid product per canonical store.

7. Runtime sanity
- Site loads without JS errors.
- `#result-summary` updates correctly under search/store/category filtering.

## Suggested Verification Steps
- Run local preview (`npm run preview:shopnot` or project fallback script).
- In browser, verify:
  - Stores section title and new accessories/gadgets/hardware section copy.
  - Featured store cards count and names.
  - Store chip list and per-store filtering.
- Execute existing product validation script pattern (PowerShell) against `public/shopnot-inspired/data/products.json` to confirm:
  - `invalidStore = 0`
  - `invalidUrlDomain = 0`
  - no missing required fields.

## Deliverables (Implementation Phase)
- `public/shopnot-inspired/app.js` updated for canonical store list + aliases + optional order lock.
- `public/shopnot-inspired/data/products.json` aligned to canonical stores and domains.
- `public/shopnot-inspired/index.html` updated with new top-computer-shops copy and new mobile-accessories/gadgets/hardware section copy.
