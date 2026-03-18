# ShopNot-Inspired Website Recreation Spec

## Goal and Constraints
- Recreate an original ecommerce discovery homepage inspired by https://www.shopnot.co/.
- Keep the result original: similar information architecture and product-search experience, but no direct visual or text cloning.
- Implement inside the current workspace, which currently has no frontend app scaffold.

## Current Project Analysis
- Current root has utility/data folders and scripts, but no dedicated frontend source directory.
- Existing static asset location already present: `public/`.
- Existing data source already present: `public/data/articles.json` (not product-shaped, so new product JSON should be added for this page).
- `package.json` currently contains only runtime dependencies (`axios`, `dotenv`, `rss-parser`, `uuid`, `@vitalets/google-translate-api`) and no frontend framework/tooling scripts.

## 1) Target Files To Create/Edit

### Files to create
1. `public/shopnot-inspired/index.html`
2. `public/shopnot-inspired/styles.css`
3. `public/shopnot-inspired/app.js`
4. `public/shopnot-inspired/data/products.json`
5. `public/shopnot-inspired/assets/logo-wordmark.svg`
6. `public/shopnot-inspired/assets/placeholder-product-01.jpg`
7. `public/shopnot-inspired/assets/placeholder-product-02.jpg`
8. `public/shopnot-inspired/assets/placeholder-product-03.jpg`
9. `public/shopnot-inspired/assets/placeholder-product-04.jpg`
10. `docs/SubAgent docs/shopnot-inspired-site-spec.md` (this file)

### Files to edit
1. `package.json` (optional, only if adding local preview scripts)

### Why this placement
- `public/` is already the workspace static asset root.
- Isolating under `public/shopnot-inspired/` avoids collisions with existing content.
- This supports a framework-free first implementation and allows incremental migration later.

## 2) Page Structure and Sections

### Page map (single-page MVP)
1. Top utility bar
- Brand microcopy and lightweight trust text.

2. Header and navigation
- Left: brand mark.
- Center/right: nav items (`Home`, `Shops`, `Categories`, `About`) and a primary CTA (`Open App`).

3. Hero section
- Bold headline communicating cross-store search/discovery.
- Subheadline with value proposition.
- Primary search field with category/store chips.
- Supporting CTA buttons (`Start Searching`, `Browse Trends`).

4. Featured stores strip
- Horizontal list/cards of store badges (logo, store name, item count).

5. Search results/product grid
- Section title + active query indicator.
- 3-4 column card grid on desktop.
- Card fields: image, product title, store, price (BDT), optional old price, save badge, quick action.

6. Curated collections
- 2-3 editorial blocks (e.g., `Minimal Jewelry`, `Festive Wear`, `Under 2000 BDT`) with cover visuals.

7. Why use this platform section
- 3 icon-text value pillars: multi-store discovery, transparent prices, faster comparison.

8. Newsletter/footer CTA
- Email capture and social links.

9. Footer
- Sitemap links, legal links, copyright, product note.

## 3) Visual Design System (Original, Not Copy)

### Typography
- Heading font: `Fraunces` (serif, expressive).
- Body/UI font: `Manrope` (clean sans).
- Fallbacks: `serif` and `sans-serif`.

### Color system (CSS variables)
- `--bg-base: #f8f7f3`
- `--bg-elevated: #ffffff`
- `--bg-accent-soft: #e9efe7`
- `--text-primary: #1d2a24`
- `--text-secondary: #55635c`
- `--brand-primary: #195f4a`
- `--brand-secondary: #d28a2e`
- `--border-soft: #d9ded9`
- `--success: #2f7a4b`

### Spacing and sizing
- Base spacing scale: 4, 8, 12, 16, 24, 32, 48, 64.
- Max content width: 1200px.
- Section vertical rhythm: 64px desktop, 40px mobile.
- Card radius: 14px; button radius: 999px.

### Background style
- Layered background: soft neutral base with subtle radial highlights.
- Decorative abstract blobs in hero corners (low-opacity).
- Avoid flat single-color look.

### Component style notes
- Product cards: light shadow + 1px soft border.
- Hover state: slight lift (`translateY(-3px)`) and stronger shadow.
- Chips: rounded pills with active/inactive states.

## 4) Animations and Interactions

### Motion principles
- Keep motion meaningful and fast (180ms-400ms), not decorative noise.
- Respect reduced motion preference.

### Planned interactions
1. Hero reveal sequence
- Stagger headline, subheadline, search bar, then CTA buttons on page load.

2. Product card hover
- Image scale to 1.03, card lift, save badge pulse once.

3. Filter chip toggles
- Active chip transitions background and text color.

4. Search interaction
- Typing in search input filters local JSON products in real time.
- Debounce at 120-180ms for smoothness.

5. Scroll reveal
- `IntersectionObserver` for section fade-up entry.

6. Keyboard accessibility
- Enter in search input triggers filter commit.
- Focus rings visible on all interactive controls.

## 5) Responsive Behavior

### Breakpoints
- Mobile: <= 640px
- Tablet: 641px-1024px
- Desktop: >= 1025px

### Layout adaptation
1. Header
- Desktop full nav, mobile collapses to hamburger drawer.

2. Hero
- Desktop two-column visual balance; mobile single-column with centered actions.

3. Product grid
- Desktop 4 cols, tablet 2-3 cols, mobile 1-2 cols depending on width.

4. Store strip
- Horizontal snap-scroll on mobile.

5. Typography
- Clamp headings (`clamp(2rem, 4vw, 4rem)`) and body text for readability.

### Performance considerations
- Use responsive images (`srcset`) where possible.
- Lazy-load non-critical product images.

## 6) Dependency Requirements Based on Existing package.json

### Existing state
- No frontend framework dependency present.
- No scripts for dev server or build in `package.json`.

### Required for MVP
- Zero mandatory new runtime dependencies if implemented as static HTML/CSS/JS under `public/shopnot-inspired/`.

### Optional (recommended) additions
1. Add `live-server` as a dev dependency for local preview.
2. Add `npm` scripts:
- `preview:shopnot`: `live-server public/shopnot-inspired --port=48297 --host=127.0.0.1 --no-browser`

### Alternative advanced option
- If long-term scaling is required, adopt Vite + vanilla TS or React, but this is not required for the MVP spec.

## 7) Implementation Steps With Acceptance Checks

1. Scaffold files and folders
- Create all paths listed in section 1.
- Acceptance check: opening `public/shopnot-inspired/index.html` loads without 404 for CSS/JS.

2. Build semantic page skeleton
- Implement sections from section 2 with semantic tags (`header`, `main`, `section`, `footer`).
- Acceptance check: all target sections are present in DOM and keyboard navigable.

3. Apply design system
- Define CSS variables, typography imports, spacing utilities, and base layout.
- Acceptance check: color tokens used consistently and no hardcoded one-off colors except image treatments.

4. Implement product data and rendering
- Add `products.json` with at least 24 items from multiple mock stores.
- Render cards via `app.js`.
- Acceptance check: product grid renders from JSON, not hardcoded HTML duplication.

5. Add search and chip filtering
- Implement text search + category/store chip filtering.
- Acceptance check: typing and chip toggles update visible cards immediately and accurately.

6. Add motion and accessibility
- Add reveal animations, hover motion, focus states, reduced-motion handling, and ARIA labels.
- Acceptance check: keyboard-only navigation works; reduced-motion media query disables nonessential animation.

7. Responsive polish
- Implement breakpoints and test mobile/tablet/desktop.
- Acceptance check: no horizontal overflow at 360px, and cards remain readable/clickable.

8. Optional preview scripts
- Update `package.json` only if adding preview workflow.
- Acceptance check: `npm run preview:shopnot` serves the page on configured port.

9. Final QA pass
- Verify Lighthouse basics (performance/accessibility best-effort for static page).
- Acceptance check: no console errors, no missing image/data requests, and stable layout during load.

## Non-Goals (for this phase)
- Full ecommerce checkout flow.
- Authentication and account management.
- Live store API integrations.
- Admin CMS.

## Deliverable
- An original ShopNot-inspired static web experience located under `public/shopnot-inspired/`, with documented structure, design tokens, interaction behaviors, and clear acceptance criteria for implementation.