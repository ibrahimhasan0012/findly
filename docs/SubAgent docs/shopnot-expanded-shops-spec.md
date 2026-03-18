# Shopnot-Inspired Expanded Shop Coverage Spec

## Goal
Expand shop coverage in Shopnot-inspired so these additional names are clearly represented while preserving existing stores and validation behavior:
- Motion View
- KRY
- PhoneSellBD
- EZ Gadgets
- Vibe Gaming
- Gadstyle BD
- SMS Gadget
- Gadget Importers
- Computer Mania
- Global Brand PLC

Keep existing listed stores in place (currently used in data/validation/UI):
- Star Tech
- Ryans Computers
- TechLand BD
- UCC Shop
- Global Brand Pvt Ltd
- Computer Mania BD
- Potaka IT
- Smart Technologies
- Gadget & Gear
- Pickaboo
- Daraz Mall

## Current Implementation Findings
- Store validation is strict and hardcoded in [public/shopnot-inspired/app.js](public/shopnot-inspired/app.js): `ALLOWED_STORES` and `STORE_DOMAIN_ALLOWLIST`.
- Product filtering/chips/store cards derive from product `store` values after validation in [public/shopnot-inspired/app.js](public/shopnot-inspired/app.js).
- Informational shop list is static in [public/shopnot-inspired/index.html](public/shopnot-inspired/index.html): section `Top Mobile Accessories, Gadgets and Hardware shops`.
- Styles/responsiveness/accessibility are already established in [public/shopnot-inspired/styles.css](public/shopnot-inspired/styles.css).

## Scope
1. Update informational sections/lists so the new names appear clearly.
2. Integrate canonical naming in chips/filters where matching product data exists.
3. Preserve strict validation with alias normalization for variants.
4. Keep existing visual style, responsive behavior, and accessibility patterns.
5. Add acceptance checks for data integrity and UI behavior.

## Canonical Naming Model
Use canonical names for rendering/filtering when records map to known aliases.

### Canonical targets for variant pairs
- `Computer Mania` is canonical; alias: `Computer Mania BD`
- `Global Brand PLC` is canonical; alias: `Global Brand Pvt Ltd`

### Additional aliases (case/spacing tolerant)
- `computermania` -> `Computer Mania`
- `global brand pvt ltd` -> `Global Brand PLC`
- `global brand plc` -> `Global Brand PLC`

### Non-variant new names
Treat these as direct names (no alias required initially):
- Motion View, KRY, PhoneSellBD, EZ Gadgets, Vibe Gaming, Gadstyle BD, SMS Gadget, Gadget Importers

## Implementation Plan

### A) Informational Sections (clear visibility)
Files:
- [public/shopnot-inspired/index.html](public/shopnot-inspired/index.html)

Changes:
- Keep the existing mobile/gadget/hardware section.
- Replace current list items with a curated list that includes all newly requested names.
- Add short supporting copy clarifying this is a broader ecosystem list and not limited to currently indexed feed stores.
- Keep semantic markup (`section`, `h2`, `ul`, `li`) unchanged for accessibility.

### B) Data normalization before validation
Files:
- [public/shopnot-inspired/app.js](public/shopnot-inspired/app.js)

Changes:
- Add `STORE_ALIAS_MAP` and `normalizeStoreName(rawStore)`.
- Normalize each product record store before calling `validateProducts`.
- Keep validation strict after normalization.

Suggested flow in `init()`:
1. Load raw JSON.
2. Normalize store field for each item.
3. Validate normalized items.
4. Build `storeOptions` and render chips/cards from normalized valid items.

### C) Validation compatibility and allowlist updates
Files:
- [public/shopnot-inspired/app.js](public/shopnot-inspired/app.js)

Changes:
- Keep `ALLOWED_STORES` as the source of truth.
- Update allowlist strategy to avoid regressions:
  - Continue supporting existing stores.
  - Add canonical names where they are intended to appear in UI chips/filters.
  - Keep domain allowlist entries synchronized with canonical keys.
- For variant pairs, domain validation should pass using canonical key domain mapping.

Recommended approach:
- Include `Computer Mania` and `Global Brand PLC` in canonical allowlist.
- Preserve backward compatibility via alias normalization (legacy names still accepted through transform).

### D) Chips/filters canonical display behavior
Files:
- [public/shopnot-inspired/app.js](public/shopnot-inspired/app.js)

Changes:
- No new UI component needed.
- Because `storeOptions` is data-derived, canonicalization will automatically unify chips/cards (example: no duplicate `Computer Mania BD` + `Computer Mania` chips).
- If no matching products exist for a newly added shop, it should appear in informational list only (not store chips/cards).

### E) Products data alignment (only where applicable)
Files:
- [public/shopnot-inspired/data/products.json](public/shopnot-inspired/data/products.json)

Changes:
- If existing records contain `Computer Mania BD` or `Global Brand Pvt Ltd`, keep source flexible but rely on normalization for rendered output.
- Add or update records for new shops only if valid domains and real deal URLs are available; otherwise keep them informational-only to avoid `validateProducts` drops.

## Non-Goals
- No redesign of layout/components.
- No relaxation of URL/domain validation rules.
- No requirement to force chips/cards for shops with no valid products.

## Acceptance Checks

### 1) Informational coverage
- The section `Top Mobile Accessories, Gadgets and Hardware shops` includes all 10 requested new names.
- Existing list presentation remains readable on desktop/mobile.

### 2) Canonical chip/filter behavior
- If product data contains `Computer Mania BD`, UI chips/cards display `Computer Mania`.
- If product data contains `Global Brand Pvt Ltd`, UI chips/cards display `Global Brand PLC`.
- No duplicate chips/cards caused by alias variants.

### 3) Validation integrity
- Unknown store names still fail strict validation.
- Domain checks still run against canonical store mapping.
- Existing valid products continue rendering after normalization.

### 4) Accessibility/responsiveness
- Section headings and list semantics remain intact.
- Keyboard navigation and ARIA behavior for existing filters/store cards remain unchanged.
- Mobile layout remains stable (no overflow/regression in list section).

### 5) Runtime checks
- App loads without JS errors.
- Result summary updates correctly during search/category/store filtering.

## Suggested Verification Commands
- Preview site: `npm run preview:shopnot` (or fallback script in [package.json](package.json)).
- Data sanity (PowerShell validator pattern already used in workspace):
  - `invalidStore = 0`
  - `invalidUrlDomain = 0`
  - `missingRequired = 0`
- Manual checks:
  - Informational list includes all requested new names.
  - Chips/cards show canonical names for variant pairs when matching products exist.
