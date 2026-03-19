/**
 * scripts/fetch-deals.js — Findly Diversity & Scale Scraper
 * Goal: 50+ real products for 20 specific categories.
 * Enforces gadget ordering, filters feature phones aggressively, avoids synthetic data.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import fsSync from 'fs';
import pathSync from 'path';
import { fileURLToPath } from 'url';

const __dirname = pathSync.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = pathSync.join(__dirname, '../public/shopnot-inspired/data/products.json');
const MAX_PAGES = 5;   // increased to get more real products
const DELAY_MS = 300;
const MIN_PER_CATEGORY = 50;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5'
};

// ─── Price filter per category (minimum price in BDT) ───────────────────────
const CATEGORY_MIN_PRICE = {
  'Smartphone':    10000,  // no feature phones (raised from 5000)
  'Laptop':        20000,
  'Desktop':       15000,
  'Monitor':        5000,
  'Smartwatch':     1000,
  'Audio':           300,
  'Speaker':         500,
  'Powerbank':       400,
  'Charger':         150,
  'Router':         1000,
  'Storage':        500,
  'Power Supply':   2000,
  'Keyboard':       300,
  'Mouse':          200,
};

// ─── Feature phone detection ─────────────────────────────────────────────────
// Broad keyword list covering Symphony, Nokia, Itel, Tecno basic models etc.
const FEATURE_PHONE_KEYWORDS = [
  'feature phone', 'button phone', 'keypad phone', 'bar phone',
  'symphony b', 'symphony l', 'symphony hero',       // Symphony basic lines
  'nokia 105', 'nokia 106', 'nokia 110', 'nokia 112', 'nokia 130', 'nokia 150',
  'nokia 215', 'nokia 225', 'nokia 230', 'nokia 3310',
  'itel it',                                          // Itel feature phones: IT2xxx
  'tecno t', 'lava a', 'micromax bharat',
  'walton olvio', 'walton l',                         // Walton basic lines
];

function isFeaturePhone(title = '', price = 0, category = '') {
  if (category !== 'Smartphone') return false;
  const lower = title.toLowerCase();
  if (FEATURE_PHONE_KEYWORDS.some(kw => lower.includes(kw))) return true;
  // Anything under 10,000 BDT in the Smartphone category is almost certainly a feature phone
  if (price > 0 && price < 10000) return true;
  return false;
}

function parsePrice(raw = '') {
  if (!raw) return null;
  const match = raw.match(/[\d,.]+/);
  if (!match) return null;
  const clean = match[0].replace(/,/g, '');
  const n = parseFloat(clean);
  return isNaN(n) || n <= 0 ? null : Math.round(n);
}

function cleanUrl(href = '', base = '') {
  if (!href) return '';
  href = href.split('?')[0];
  if (href.startsWith('http')) return href;
  if (href.startsWith('//')) return 'https:' + href;
  try { return new URL(href, base).href; } catch (e) { return href; }
}

const delay = ms => new Promise(r => setTimeout(r, ms));

// ─── Stores ───────────────────────────────────────────────────────────────────
// Added more stores and filled in missing category URLs
const STORES = [
  {
    name: 'Star Tech',
    base: 'https://www.startech.com.bd',
    pPattern: 'query',
    pages: [
      { url: 'https://www.startech.com.bd/phone/smartphone', category: 'Smartphone' },
      { url: 'https://www.startech.com.bd/laptop', category: 'Laptop' },
      { url: 'https://www.startech.com.bd/desktop', category: 'Desktop' },
      { url: 'https://www.startech.com.bd/monitor', category: 'Monitor' },
      { url: 'https://www.startech.com.bd/networking/router', category: 'Router' },
      { url: 'https://www.startech.com.bd/component/power-supply', category: 'Power Supply' },
      { url: 'https://www.startech.com.bd/component/ssd', category: 'Storage' },
      { url: 'https://www.startech.com.bd/component/hdd', category: 'Storage' },
      { url: 'https://www.startech.com.bd/accessories/keyboard', category: 'Keyboard' },
      { url: 'https://www.startech.com.bd/accessories/mouse', category: 'Mouse' },
      { url: 'https://www.startech.com.bd/accessories/speaker', category: 'Speaker' },
      { url: 'https://www.startech.com.bd/accessories/headphone-headset', category: 'Audio' },
      { url: 'https://www.startech.com.bd/camera', category: 'Camera' },
    ]
  },
  {
    name: 'Ryans Computers',
    base: 'https://www.ryans.com',
    pPattern: 'query',
    pages: [
      { url: 'https://www.ryans.com/category/laptops-and-notebooks/all-laptop', category: 'Laptop' },
      { url: 'https://www.ryans.com/category/desktop', category: 'Desktop' },
      { url: 'https://www.ryans.com/category/monitor', category: 'Monitor' },
      { url: 'https://www.ryans.com/category/keyboard', category: 'Keyboard' },
      { url: 'https://www.ryans.com/category/mouse', category: 'Mouse' },
      { url: 'https://www.ryans.com/category/storage-device/ssd', category: 'Storage' },
      { url: 'https://www.ryans.com/category/power-supply-unit', category: 'Power Supply' },
      { url: 'https://www.ryans.com/category/router-and-networking', category: 'Router' },
    ]
  },
  {
    name: 'Universal Computer BD',
    base: 'https://www.universal.com.bd',
    pPattern: 'query',
    pages: [
      { url: 'https://www.universal.com.bd/smartphone', category: 'Smartphone' },
      { url: 'https://www.universal.com.bd/speaker', category: 'Speaker' },
      { url: 'https://www.universal.com.bd/monitor', category: 'Monitor' },
      { url: 'https://www.universal.com.bd/laptop', category: 'Laptop' },
      { url: 'https://www.universal.com.bd/desktop', category: 'Desktop' },
      { url: 'https://www.universal.com.bd/router', category: 'Router' },
      { url: 'https://www.universal.com.bd/power-supply', category: 'Power Supply' },
      { url: 'https://www.universal.com.bd/earphone', category: 'Audio' },
      { url: 'https://www.universal.com.bd/smart-watch', category: 'Smartwatch' },
      { url: 'https://www.universal.com.bd/power-bank', category: 'Powerbank' },
      { url: 'https://www.universal.com.bd/charger', category: 'Charger' },
    ]
  },
  {
    name: 'Skyland',
    base: 'https://www.skyland.com.bd',
    pPattern: 'query',
    pages: [
      { url: 'https://www.skyland.com.bd/components/monitor', category: 'Monitor' },
      { url: 'https://www.skyland.com.bd/networking/router', category: 'Router' },
      { url: 'https://www.skyland.com.bd/components/power-supply', category: 'Power Supply' },
      { url: 'https://www.skyland.com.bd/components/ssd', category: 'Storage' },
      { url: 'https://www.skyland.com.bd/laptop', category: 'Laptop' },
    ]
  },
  {
    name: 'Gadget & Gear',
    base: 'https://www.gadgetandgear.com',
    pPattern: 'query',
    pages: [
      { url: 'https://www.gadgetandgear.com/smartphone', category: 'Smartphone' },
      { url: 'https://www.gadgetandgear.com/smart-watch', category: 'Smartwatch' },
      { url: 'https://www.gadgetandgear.com/earphone', category: 'Audio' },
      { url: 'https://www.gadgetandgear.com/speaker', category: 'Speaker' },
      { url: 'https://www.gadgetandgear.com/power-bank', category: 'Powerbank' },
      { url: 'https://www.gadgetandgear.com/charger', category: 'Charger' },
      { url: 'https://www.gadgetandgear.com/camera', category: 'Camera' },
    ]
  },
  {
    name: 'Daraz BD',
    base: 'https://www.daraz.com.bd',
    pPattern: 'query',
    pages: [
      { url: 'https://www.daraz.com.bd/smartphones/', category: 'Smartphone' },
      { url: 'https://www.daraz.com.bd/smart-watches/', category: 'Smartwatch' },
      { url: 'https://www.daraz.com.bd/portable-speakers/', category: 'Speaker' },
      { url: 'https://www.daraz.com.bd/power-banks/', category: 'Powerbank' },
      { url: 'https://www.daraz.com.bd/phone-chargers/', category: 'Charger' },
      { url: 'https://www.daraz.com.bd/screen-protectors/', category: 'Protector' },
      { url: 'https://www.daraz.com.bd/digital-cameras/', category: 'Camera' },
      { url: 'https://www.daraz.com.bd/fans/', category: 'Fan' },
      { url: 'https://www.daraz.com.bd/health-monitors/', category: 'Health' },
      { url: 'https://www.daraz.com.bd/android-tv-boxes/', category: 'TV Box' },
      { url: 'https://www.daraz.com.bd/mac-computers/', category: 'Apple' },
    ]
  },
  {
    name: 'Pickaboo',
    base: 'https://www.pickaboo.com',
    pPattern: 'query',
    pages: [
      { url: 'https://www.pickaboo.com/mobile-phone', category: 'Smartphone' },
      { url: 'https://www.pickaboo.com/smart-watch', category: 'Smartwatch' },
      { url: 'https://www.pickaboo.com/earphone-headphone', category: 'Audio' },
      { url: 'https://www.pickaboo.com/speaker', category: 'Speaker' },
      { url: 'https://www.pickaboo.com/power-bank', category: 'Powerbank' },
      { url: 'https://www.pickaboo.com/charger', category: 'Charger' },
      { url: 'https://www.pickaboo.com/laptop', category: 'Laptop' },
      { url: 'https://www.pickaboo.com/apple', category: 'Apple' },
      { url: 'https://www.pickaboo.com/screen-protector', category: 'Protector' },
    ]
  }
];

// ─── Scraper ──────────────────────────────────────────────────────────────────
async function scrapeStore(store) {
  console.log(`\n[${store.name}]`);
  const results = [];

  for (const page of store.pages) {
    for (let pNum = 1; pNum <= MAX_PAGES; pNum++) {
      let url = page.url;
      if (pNum > 1) {
        url += store.pPattern === 'slash' ? `/page/${pNum}/` : `?page=${pNum}`;
      }

      try {
        const response = await axios.get(url, {
          headers: { ...HEADERS, Referer: store.base },
          timeout: 10000
        });
        const $ = cheerio.load(response.data);
        let count = 0;

        const selectors = [
          '.product-layout', '.p-item', '.product-thumb', '.product-card',
          '.wd-product', 'li.product', '.oe_product', '.product-item',
          '.col-6.col-md-4.col-xl-3', '.single-product-item', '.product-miniature',
          '.product', '[class*="ProductCard"]', '[class*="product-card"]',
          '.item-box', '.product-box'
        ].join(', ');

        $(selectors).each((_, el) => {
          const card = $(el);

          const title = card.find([
            '.name a', '.product-name', '.product-title a',
            'h2 a', 'h3 a', 'h4 a',
            '.wd-entities-title a', '.p-item-name a',
            '.woocommerce-loop-product__title',
            '.title a', 'a h2', 'a h3',
            '[class*="product-title"]', '[class*="ProductTitle"]'
          ].join(', ')).first().text().trim();

          const href = card.find('a[href]').first().attr('href');
          const link = cleanUrl(href, store.base);

          const imgEl = card.find('img').first();
          const rawImg = imgEl.attr('data-src') || imgEl.attr('data-lazy-src') || imgEl.attr('src') || '';
          const img = cleanUrl(rawImg, store.base);

          const priceText = card.find([
            '.price-new', '.p-item-price', '.price',
            '.regular-price', '.amount', 'span.price',
            '.p-price', '[class*="price"]', '[class*="Price"]'
          ].join(', ')).first().text();
          const price = parsePrice(priceText);

          if (!title || !link || !img || !price) return;

          // ── Feature phone filter ──
          if (isFeaturePhone(title, price, page.category)) {
            console.log(`  [SKIP feature phone] ${title} (৳${price})`);
            return;
          }

          // ── Category minimum price filter ──
          const minPrice = CATEGORY_MIN_PRICE[page.category];
          if (minPrice && price < minPrice) return;

          results.push({
            title,
            category: page.category,
            store: store.name,
            dealUrl: link,
            image: img,
            price,
            scrapedAt: new Date().toISOString()
          });
          count++;
        });

        console.log(`  ${page.category} p${pNum}: ${count} items (url: ${url})`);
        if (count === 0 && pNum > 1) break;

      } catch (e) {
        console.log(`  [${page.category} p${pNum}] Error: ${e.message}`);
        break;
      }
      await delay(DELAY_MS);
    }
  }
  return results;
}

// ─── Category order (fixed — no re-sorting that breaks priority) ──────────────
// This IS the final order. Priority gadget categories come first as written.
const TARGET_CATEGORIES = [
  'Smartphone', 'Apple', 'Smartwatch', 'Audio', 'Powerbank',
  'Charger', 'Protector', 'Speaker', 'Fan', 'Health',
  'TV Box', 'Camera', 'Router', 'Keyboard', 'Mouse',
  'Storage', 'Power Supply', 'Monitor', 'Laptop', 'Desktop'
];

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== Findly Scraper ===');
  let all = [];

  for (const store of STORES) {
    const products = await scrapeStore(store);
    all = [...all, ...products];
  }

  console.log(`\nTotal scraped (before grouping): ${all.length}`);

  // Group by category
  const grouped = {};
  all.forEach(p => {
    if (!grouped[p.category]) grouped[p.category] = [];
    grouped[p.category].push(p);
  });

  let finalProducts = [];
  console.log('\n--- Category Breakdown ---');

  for (const cat of TARGET_CATEGORIES) {
    let items = grouped[cat] || [];

    // Deduplicate by title+price
    const seen = new Set();
    items = items.filter(p => {
      const key = `${p.title.toLowerCase()}_${p.price}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const realCount = items.length;

    if (realCount < MIN_PER_CATEGORY) {
      // Log warning instead of silently padding with fake data
      console.warn(`  ⚠ ${cat}: only ${realCount} real products (below ${MIN_PER_CATEGORY} target). Consider adding more store URLs for this category.`);
    }

    // Sort real products by price ascending (cheapest first within category)
    items.sort((a, b) => a.price - b.price);

    console.log(`  ${cat}: ${items.length} products (${realCount} real)`);
    finalProducts = [...finalProducts, ...items];
  }

  finalProducts.forEach((p, i) => { p.id = i + 1; });

  fsSync.mkdirSync(pathSync.dirname(OUTPUT_FILE), { recursive: true });
  fsSync.writeFileSync(OUTPUT_FILE, JSON.stringify(finalProducts, null, 2));
  console.log(`\n=== Done: ${finalProducts.length} products saved to ${OUTPUT_FILE} ===`);
}

main().catch(console.error);