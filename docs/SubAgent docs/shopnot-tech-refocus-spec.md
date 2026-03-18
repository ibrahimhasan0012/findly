# Shopnot-Inspired Tech Deals Refocus Spec

## Objective
Refocus the existing shopnot-inspired static experience into a tech-deals-first discovery homepage while preserving current visual quality, layout rhythm, interaction patterns, responsiveness, and accessibility behavior.

## Current Implementation Findings
- The page is a static, framework-free app under public/shopnot-inspired with HTML/CSS/JS.
- Product cards are rendered from JSON in app.js and support text search, category chips, and store chips.
- Current domain is lifestyle/fashion/home. Product cards currently use a non-purchasing CTA button labeled Quick View.
- Store strip counts are generated dynamically from the loaded dataset.
- Visual system is already polished (tokens, motion, sticky header, reveal animations, responsive breakpoints, reduced motion support, visible focus styles).
- Local preview script exists in package.json: preview:shopnot using live-server.

## Scope
In-scope:
- Content and data retheme to technology deals (mobile, gadgets, PC components, accessories).
- Taxonomy update for categories and filter chips.
- Product-card CTA conversion to direct purchase/deal links.
- Homepage section copy/content updates to spotlight tech deals.
- Dataset expansion with realistic tech inventory fields and pricing.

Out-of-scope:
- Framework migration.
- Checkout flow, auth, or backend APIs.
- Major layout redesign or component architecture rewrite.

## Information Architecture (Preserve Structure, Retheme Content)
Keep the current section order and visual structure from index.html, but update copy and section payload:
1. Utility bar: shift message to tech savings and deal freshness.
2. Header nav labels: keep structure, update wording toward Deals, Categories, Stores.
3. Hero: retheme to cross-store tech deal discovery; update search placeholder to tech queries.
4. Featured Stores strip: populate with realistic tech retailers/marketplaces.
5. Search Results: keep filter UI and grid behavior; now tech products only.
6. Curated Collections: convert to Featured Categories and/or deal-focused editorial cards.
7. Why section: rewrite value props for tech buyers (price tracking, specs clarity, quick compare).
8. Newsletter: retheme to weekly tech drops and price alerts.
9. Footer: keep structure, update textual references to tech deals hub.

## Category Taxonomy and Filter Chips
Use this concrete category taxonomy for product.category and category chips:
- All
- Smartphones
- Laptops
- PC Components
- Gaming
- Audio
- Wearables
- Smart Home
- Accessories
- Networking
- Storage

Optional secondary chips (if implemented later):
- Budget Picks
- Flagship Deals
- Clearance
- New Drops

Rules:
- Category values in products.json must exactly match chip labels (except All).
- Each category should have at least 3 products in the expanded dataset.
- Search must continue matching title, store, and category, now with tech-oriented terms.

## Product Card CTA Requirement (Mandatory)
Every product card must include a clear purchasing link CTA.

Required behavior:
- Replace button.quick-action with an anchor CTA inside each card.
- CTA labels allowed: Buy now or View deal.
- CTA must open product destination in a new tab with safe link attributes:
  - target="_blank"
  - rel="noopener noreferrer"
- CTA must have accessible label text that includes product name context.

Rendering contract updates in app.js:
- Product objects must include:
  - dealUrl (required)
  - ctaLabel (optional; default to View deal)
- If dealUrl is missing, card should not render a broken CTA; fallback should be a disabled text state such as Deal unavailable (but target dataset should provide links for 100% of items).

## Data Model and Dataset Refocus
Replace or expand public/shopnot-inspired/data/products.json with realistic tech inventory.

Minimum dataset size:
- 36 products recommended (minimum 30)
- 8 to 12 stores
- Balanced spread across taxonomy

Required fields per product:
- id: number
- title: string
- store: string
- category: taxonomy value
- price: number
- oldPrice: number or null
- currency: string (use BDT or USD consistently)
- image: string (URL/path)
- alt: string
- dealUrl: string
- ctaLabel: string (Buy now or View deal)

Recommended additional fields for tech realism:
- brand: string
- rating: number (0-5)
- reviewCount: number
- specHighlights: array of short strings (2-3 items)
- shipping: string (for example Free shipping)
- stockStatus: string (In stock, Limited stock)

Pricing rules:
- oldPrice should be greater than price when present.
- Include mixed discount depths (for example 5%-35%).
- Include a few non-discounted products (oldPrice null) to keep data realistic.

## Homepage Section Changes for Tech Deals Spotlight
Preserve section shells; update content payload:

1. Hero copy and search hints
- Headline example direction: Find today’s best tech deals across top stores.
- Placeholder examples: Search for RTX 4070, iPhone 15, NVMe SSD, ANC earbuds.

2. Featured stores
- Example store set: TechWorld, GadgetHub, PC Arena, MobileMart, SoundLab, ByteKart, GameGrid, SmartLiving.
- Keep dynamic item count behavior from current JS.

3. Curated collections section
- Rename heading to Featured Categories or Hot Tech Picks.
- Replace three cards with:
  - Smartphone Deals Under Budget
  - PC Build Essentials
  - WFH and Creator Setup

4. New or repurposed spotlight signals
- Add micro-content for:
  - Hot Deals (largest discount products)
  - Top Stores (highest product count or best average discount)
- Can be implemented by reusing existing section/card patterns; no major new layout required.

## Responsive and Accessibility Requirements
Must keep and verify existing behavior:
- Breakpoints and grid adaptation remain functional.
- Mobile drawer remains keyboard and screen-reader friendly.
- Focus-visible outlines remain clear on all interactive controls.
- Reduced-motion media query continues to disable non-essential animations.
- Product images keep meaningful alt text.
- CTA links must be keyboard reachable and visually obvious.

## Exact Files to Edit
1. public/shopnot-inspired/index.html
- Update metadata and all section copy to tech/deals-first language.
- Update nav/CTA labels where needed.
- Update curated collections and section headings for tech themes.

2. public/shopnot-inspired/app.js
- Keep filtering architecture.
- Update card template to render link CTA (Buy now/View deal) instead of Quick View button.
- Optionally support new optional fields (brand, rating, specHighlights) if surfaced in card UI.
- Keep search, chips, store strip, and reveal logic behavior.

3. public/shopnot-inspired/styles.css
- Preserve existing design system and structure.
- Retheme only where needed (copy-driven visual tweaks, CTA link styling, potential small icon/tag styles).
- Ensure new CTA link style remains accessible and consistent across hover/focus states.

4. public/shopnot-inspired/data/products.json
- Replace lifestyle inventory with tech-focused dataset using required schema and realistic pricing.
- Ensure complete category/store coverage and valid dealUrl entries.

5. package.json (only if needed)
- Keep existing preview:shopnot script.
- No required dependency change for this refocus.

## Acceptance Checks
1. Domain retheme
- All visible product and section content is tech-oriented; no leftover fashion/home copy.

2. Category taxonomy
- Category chips show the defined taxonomy.
- Selecting each category returns relevant tech items.

3. CTA compliance
- Every rendered product card includes a clear purchasing link CTA.
- Clicking CTA opens valid destination URL in new tab.

4. Dataset quality
- Dataset meets size target and schema requirements.
- oldPrice/price relationships are valid where discounts are shown.

5. Spotlight sections
- Homepage clearly surfaces featured categories, hot deals messaging, and top stores messaging.

6. UX integrity
- Existing polished visual structure remains intact.
- No regressions in responsive layout from desktop to mobile.

7. Accessibility
- Keyboard navigation works for filters, search, and CTAs.
- Focus states and reduced-motion behavior still function.

8. Runtime sanity
- No console errors during initial load, filtering, or CTA interactions.
- preview:shopnot still serves the page correctly.

## Implementation Notes
- Prioritize content/data and CTA behavior first, then refine copy and section emphasis.
- Do not introduce unnecessary dependencies.
- Keep changes incremental and easily reviewable.
