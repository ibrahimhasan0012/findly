# Shopnot-Inspired Bangladesh Tech Sellers Spec

## Objective
Refocus the current tech-deals static experience to Bangladesh-first seller sources and buyer language, while preserving the existing single-page architecture, styling system, and filter UX.

## Current Implementation Snapshot (Research)
- App is static HTML/CSS/JS in public/shopnot-inspired.
- Data source is local JSON loaded by fetch from data/products.json.
- Filtering currently supports keyword, exact category chip, and exact store chip matching.
- Category chip list is hardcoded in app.js as TECH_CATEGORIES.
- Store chips and featured store strip are derived from data values.
- Currency rendering currently uses Intl.NumberFormat with USD in data.
- Purchase CTA exists as an external link using item.dealUrl with safe rel attributes.
- Preview script is package.json -> preview:shopnot = live-server public/shopnot-inspired --port=48297 --host=127.0.0.1 --no-browser.

## 1) Bangladesh Seller/Store Sources (Gadgets + PC Components)
Use this seller set as the canonical Bangladesh-focused source list for initial rollout.

Priority stores (recommended for first dataset pass):
1. Star Tech
2. Ryans Computers
3. TechLand BD
4. UCC (UCC Shop)
5. Global Brand Pvt Ltd
6. Computer Mania BD
7. Potaka IT
8. Smart Technologies (smarttech.com.bd)
9. Gadget & Gear
10. Pickaboo
11. Daraz Mall (official tech stores only)
12. Apple Gadgets / iStore Bangladesh equivalent authorized seller entries (if verified)

Rules for store inclusion:
- Prefer official or established Bangladeshi ecommerce/computer retailers.
- Allow marketplace sellers only when store identity is explicit and trusted.
- Keep store value stable and normalized (no spelling variants in data).

Store normalization map (example):
- "Startech" -> "Star Tech"
- "Ryans" -> "Ryans Computers"
- "Daraz" + official flagship constraint -> "Daraz Mall"

## 2) Bangladesh-Oriented Category Taxonomy
Replace/extend TECH_CATEGORIES to reflect local buying behavior and naming.

Required taxonomy (chip labels and item.category values must match exactly):
1. All
2. Smartphones
3. Laptops
4. Desktop PCs
5. PC Components
6. Monitors
7. Gaming
8. Accessories
9. Networking
10. Storage
11. Power Backup
12. Office Equipment

Taxonomy notes:
- Keep "PC Components" for CPU, GPU, RAM, motherboard, PSU, cooling.
- Add "Desktop PCs" because prebuilt desktops are common in BD catalogs.
- Add "Power Backup" for UPS/IPS and power-protection devices.
- Add "Office Equipment" for printers/scanners frequently sold by BD tech stores.

## 3) Required Data Fields + External Link Validation
### Required fields per product item
1. id: number (unique)
2. title: string
3. store: string (must match allowed store list)
4. category: string (must match taxonomy)
5. price: number (BDT amount)
6. oldPrice: number|null
7. currency: string (must be "BDT")
8. image: string (https URL or local asset path)
9. alt: string
10. dealUrl: string (external purchase/product URL)
11. ctaLabel: string ("View deal" or "Buy now")

Recommended fields for BD utility:
1. location: string (Dhaka, Chattogram, Nationwide)
2. deliveryInfo: string
3. warranty: string
4. stockStatus: string
5. paymentMethods: string[] (COD, card, bKash, Nagad, Rocket)

### Validation rules for purchase links
1. dealUrl must start with https:// (reject plain http unless unavoidable legacy endpoint).
2. dealUrl hostname must match or belong to the declared store domain allowlist.
3. dealUrl must not be empty, javascript:, mailto:, tel:, or relative-only when external purchase is expected.
4. Optional tracking query params are allowed but URL must still resolve to product/search page.
5. For marketplace entries, URL must include seller storefront context when possible.

Example domain allowlist:
- startech.com.bd
- ryans.com
- techlandbd.com
- ucc.com.bd
- globalbrand.com.bd
- computermania.com.bd
- potakait.com
- smarttech.com.bd
- gadgetandgear.com
- pickaboo.com
- daraz.com.bd

Pricing validation:
1. price > 0
2. oldPrice is null or oldPrice > price
3. currency === "BDT" for all items

## 4) UI Copy Updates for Bangladesh Focus
Update visible copy to clearly indicate Bangladesh region context.

Required copy direction:
1. Utility bar: "Compare live Bangladesh tech deals from trusted local stores."
2. Hero eyebrow: "Bangladesh tech deal discovery"
3. Hero title: "Find today’s best gadget and PC deals across Bangladesh."
4. Hero subtitle: mention BDT pricing and local retailers.
5. Search placeholder examples: "Search RTX 4060, iPhone 15, Ryzen 7, IPS monitor..."
6. Featured stores section subtitle: "Popular Bangladesh tech retailers people compare now."
7. Summary/spotlight messaging: include "Bangladesh" and/or "BD stores" context.
8. Footer microcopy: "Built for Bangladesh-focused tech deal discovery."

Tone and language:
- Keep English UI for now.
- Use locally relevant purchasing terms (official warranty, cash on delivery, nationwide delivery).

## 5) JavaScript Logic Updates (Filters/Search/Store Chips)
Update app.js behavior to align with Bangladesh data and avoid brittle matching.

Required JS changes:
1. Replace TECH_CATEGORIES with the Bangladesh taxonomy above.
2. Normalize text comparisons for search/filter:
- Trim and lowercase for query/store/category.
- Normalize punctuation/extra spaces in store names before equality checks.
3. Add data validation pass after JSON load:
- Collect invalid items (missing required fields, bad URL, non-BDT currency, invalid category/store).
- Exclude invalid items from rendering.
- Show a concise warning in console with invalid item ids/count.
4. Build store chips from validated products only.
5. Keep selectedCategory/selectedStore fallback to All if current selection disappears after validation.
6. Preserve current CTA safety attrs: target="_blank" and rel="noopener noreferrer".
7. Optional enhancement: sort store chips alphabetically after All for consistent UX.

Search behavior:
- Continue matching against title, store, and category.
- Recommended addition: include brand and specHighlights in search if available.

## 6) Preview Reliability Fixes + Exact Windows Run Instructions
### Reliability fixes
1. Keep existing script:
- preview:shopnot = live-server public/shopnot-inspired --port=48297 --host=127.0.0.1 --no-browser
2. Add one stable script variant with explicit host and no auto-open:
- preview:shopnot:stable = live-server public/shopnot-inspired --port=48297 --host=127.0.0.1 --no-browser
3. Use root workspace as execution directory (same folder as package.json).
4. Ensure relative fetch path remains data/products.json (works when serving public/shopnot-inspired root).

### Exact Windows PowerShell commands
From workspace root:

1. Install dependencies (first run only)
- npm install

2. Start preview server
- npm run preview:shopnot

3. If script not recognized or global conflict, use npx fallback
- npx live-server public/shopnot-inspired --port=48297 --host=127.0.0.1 --no-browser

4. Open in browser
- http://127.0.0.1:48297

5. Stop server
- Ctrl+C in the same terminal

## 7) Exact Files To Edit + Acceptance Checks
### Exact files to edit
1. public/shopnot-inspired/data/products.json
- Replace stores with Bangladesh seller list.
- Convert prices/currency to BDT.
- Ensure all dealUrl values map to approved BD seller domains.

2. public/shopnot-inspired/app.js
- Update taxonomy constant.
- Add validation + normalization helpers.
- Ensure chips/search/filter use validated dataset.
- Keep safe external link rendering.

3. public/shopnot-inspired/index.html
- Update region-specific copy in utility bar, hero, featured stores text, footer, and related headings.
- Update search placeholder to BD-relevant examples.

4. package.json
- Keep existing preview script.
- Add preview:shopnot:stable script for reliability.

Optional (if visual labels are added):
5. public/shopnot-inspired/styles.css
- Small badge/copy styling for "Bangladesh" region cues if needed.

### Acceptance checks
1. Data validity
- 100% rendered items have required fields.
- currency is BDT for every rendered item.
- oldPrice rule passes for all discounted products.

2. Seller integrity
- Every rendered item.store belongs to approved BD seller list.
- Every dealUrl hostname belongs to configured allowlist.

3. Filter integrity
- Category chips exactly match Bangladesh taxonomy.
- Store chips are generated from validated stores.
- Search returns expected matches for local terms and store names.

4. UI copy
- No leftover global/non-BD phrasing in key sections.
- Hero and utility copy clearly state Bangladesh focus.

5. External links
- Every CTA opens in a new tab with rel="noopener noreferrer".
- No broken or unsafe URL scheme in rendered CTAs.

6. Preview reliability
- npm run preview:shopnot works from Windows PowerShell.
- npm run preview:shopnot:stable works and serves at 127.0.0.1:48297.
- No console errors on initial load and basic filtering actions.

## Implementation Sequence (Recommended)
1. Update products.json with BD stores + BDT data.
2. Add validation/normalization logic in app.js.
3. Update copy in index.html.
4. Add stable preview script in package.json.
5. Run acceptance checks manually in browser + console.
