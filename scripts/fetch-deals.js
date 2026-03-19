/**
 * scripts/fetch-deals.js — Findly Diversity Scraper
 *
 * Stores (all URLs verified via web search):
 *   Sumash Tech, Gadget & Gear, Star Tech, Skyland, Universal Computer BD
 *
 * 20 categories, gadget-first order, no synthetic data.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import fsSync from 'fs';
import pathSync from 'path';
import { fileURLToPath } from 'url';

const __dirname = pathSync.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = pathSync.join(__dirname, '../public/shopnot-inspired/data/products.json');
const MAX_PAGES   = 5;
const DELAY_MS    = 350;
const MIN_PER_CAT = 40;

const HEADERS = {
  'User-Agent'     : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept'         : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
};

// ── Final display order ───────────────────────────────────────────────────────
const TARGET_CATEGORIES = [
  'Smartphone', 'Audio', 'Powerbank', 'Smartwatch', 'Charger',
  'Protector',  'Speaker', 'Fan', 'Health', 'TV Box',
  'Keyboard',   'Mouse', 'Monitor', 'Laptop', 'Desktop',
  'Router',     'Apple', 'Power Supply', 'Storage', 'Camera',
];

// ── Minimum BDT price per category ───────────────────────────────────────────
const MIN_PRICE = {
  'Smartphone'  : 10000,
  'Laptop'      : 20000,
  'Desktop'     : 15000,
  'Monitor'     :  4000,
  'Smartwatch'  :   800,
  'Audio'       :   250,
  'Speaker'     :   400,
  'Powerbank'   :   350,
  'Charger'     :   120,
  'Router'      :   800,
  'Storage'     :   400,
  'Power Supply':  1500,
  'Keyboard'    :   250,
  'Mouse'       :   150,
  'Fan'         :   200,
  'Health'      :   300,
  'Protector'   :    50,
  'TV Box'      :  1500,
  'Apple'       :  5000,
  'Camera'      :  2000,
};

// ── Feature phone blocklist ───────────────────────────────────────────────────
const FEATURE_PHONE_KW = [
  'feature phone','button phone','keypad phone','bar phone',
  'symphony b','symphony l','symphony hero','symphony i',
  'nokia 105','nokia 106','nokia 110','nokia 112','nokia 130',
  'nokia 150','nokia 215','nokia 225','nokia 230','nokia 3310',
  'itel it','tecno t','lava a','micromax bharat',
  'walton olvio','walton l','winstar',
];

function isFeaturePhone(title, price, cat) {
  if (cat !== 'Smartphone') return false;
  const low = title.toLowerCase();
  if (FEATURE_PHONE_KW.some(kw => low.includes(kw))) return true;
  if (price > 0 && price < 10000) return true;
  return false;
}

function parsePrice(raw = '') {
  if (!raw) return null;
  const matches = raw.match(/[\d][\d,.]*/g);
  if (!matches || !matches.length) return null;

  const nums = matches
    .map(s => parseFloat(String(s).replace(/,/g, '')))
    .filter(n => Number.isFinite(n) && n > 0 && n < 100_000_000)
    .map(n => Math.round(n));

  if (!nums.length) return null;
  return Math.min(...nums);
}

function cleanUrl(href = '', base = '') {
  if (!href) return '';
  href = href.split('?')[0].trim();
  if (href.startsWith('http')) return href;
  if (href.startsWith('//'))   return 'https:' + href;
  try { return new URL(href, base).href; } catch { return href; }
}

const delay = ms => new Promise(r => setTimeout(r, ms));

// ── STORES — verified URLs ────────────────────────────────────────────────────
const STORES = [

  // ── SUMASH TECH ───────────────────────────────────────────────────────────
  // URL pattern confirmed: sumashtech.com/category/<slug>
  {
    name: 'Sumash Tech',
    base: 'https://www.sumashtech.com',
    pPattern: 'query',
    pages: [
      // Smartphones
      { url: 'https://www.sumashtech.com/category/phone-smartphone',              category: 'Smartphone' },
      // Apple
      { url: 'https://www.sumashtech.com/category/apple',                         category: 'Apple' },
      // Smartwatch — confirmed slugs from search
      { url: 'https://www.sumashtech.com/category/smart-watch',                   category: 'Smartwatch' },
      { url: 'https://www.sumashtech.com/category/accessories-smart-watch',       category: 'Smartwatch' },
      // Powerbank — confirmed from search
      { url: 'https://www.sumashtech.com/category/accessories-power-bank',        category: 'Powerbank' },
      { url: 'https://www.sumashtech.com/category/power-bank-wireless',           category: 'Powerbank' },
      // Audio — nav menu shows: AirPods, Earbuds, Headphones, Overhead, Neckband, Earphone
      { url: 'https://www.sumashtech.com/category/sound-appliance-airpods',       category: 'Audio' },
      { url: 'https://www.sumashtech.com/category/sound-appliance-earbuds',       category: 'Audio' },
      { url: 'https://www.sumashtech.com/category/sound-appliance-headphones',    category: 'Audio' },
      { url: 'https://www.sumashtech.com/category/sound-appliance-neckband',      category: 'Audio' },
      { url: 'https://www.sumashtech.com/category/sound-appliance-earphone',      category: 'Audio' },
      // Speakers — nav: Bluetooth Speaker, Soundbar, Smart Speaker
      { url: 'https://www.sumashtech.com/category/sound-appliance-bluetooth-speaker', category: 'Speaker' },
      { url: 'https://www.sumashtech.com/category/sound-appliance-soundbar',      category: 'Speaker' },
      // Charger — nav: Wired, Wireless, Car Charger (all under accessories)
      { url: 'https://www.sumashtech.com/category/accessories-charger',           category: 'Charger' },
      { url: 'https://www.sumashtech.com/category/accessories-car-charger',       category: 'Charger' },
      { url: 'https://www.sumashtech.com/category/accessories-wireless-charger',  category: 'Charger' },
      // Protector — nav: Covers
      { url: 'https://www.sumashtech.com/category/accessories-covers',            category: 'Protector' },
      // Fan — nav: Portable Fan under Smart Appliance
      { url: 'https://www.sumashtech.com/category/smart-appliance-portable-fan',  category: 'Fan' },
      // Health — trimmer/shaver etc
      { url: 'https://www.sumashtech.com/category/smart-appliance-trimmer',       category: 'Health' },
      // Laptop
      { url: 'https://www.sumashtech.com/category/laptop',                        category: 'Laptop' },
      // Monitor
      { url: 'https://www.sumashtech.com/category/monitor',                       category: 'Monitor' },
    ]
  },

  // ── GADGET & GEAR ─────────────────────────────────────────────────────────
  // All URLs confirmed from search results
  {
    name: 'Gadget & Gear',
    base: 'https://gadgetandgear.com',
    pPattern: 'query',
    pages: [
      { url: 'https://gadgetandgear.com/category/phone',                    category: 'Smartphone' },
      { url: 'https://gadgetandgear.com/category/apple',                    category: 'Apple' },
      { url: 'https://gadgetandgear.com/category/ipad',                     category: 'Apple' },
      { url: 'https://gadgetandgear.com/category/smart-watch',              category: 'Smartwatch' },
      { url: 'https://gadgetandgear.com/category/smart-bands',              category: 'Smartwatch' },
      { url: 'https://gadgetandgear.com/category/earphone',                 category: 'Audio' },
      { url: 'https://gadgetandgear.com/category/headphone',                category: 'Audio' },
      { url: 'https://gadgetandgear.com/category/speaker',                  category: 'Speaker' },
      { url: 'https://gadgetandgear.com/category/power-banks',              category: 'Powerbank' },
      { url: 'https://gadgetandgear.com/category/charger-adapters',         category: 'Charger' },
      { url: 'https://gadgetandgear.com/category/adapter',                  category: 'Charger' },
      { url: 'https://gadgetandgear.com/category/cases-screen-protectors',  category: 'Protector' },
      { url: 'https://gadgetandgear.com/category/gadget',                   category: 'Fan' },
      { url: 'https://gadgetandgear.com/category/daily-lifestyle',          category: 'Health' },
      { url: 'https://gadgetandgear.com/category/router',                   category: 'Router' },
      { url: 'https://gadgetandgear.com/category/computer-accessories',     category: 'Keyboard' },
      { url: 'https://gadgetandgear.com/category/mobile-phone-accessories', category: 'Protector' },
    ]
  },

  // ── STAR TECH — confirmed working pages from last run ─────────────────────
  {
    name: 'Star Tech',
    base: 'https://www.startech.com.bd',
    pPattern: 'query',
    pages: [
      { url: 'https://www.startech.com.bd/laptop-notebook/laptop',            category: 'Laptop' },
      { url: 'https://www.startech.com.bd/monitor',                           category: 'Monitor' },
      { url: 'https://www.startech.com.bd/networking/router',                 category: 'Router' },
      { url: 'https://www.startech.com.bd/component/power-supply',            category: 'Power Supply' },
      { url: 'https://www.startech.com.bd/component/ram',                     category: 'Storage' },
      { url: 'https://www.startech.com.bd/accessories/mouse',                 category: 'Mouse' },
      { url: 'https://www.startech.com.bd/camera',                            category: 'Camera' },
      { url: 'https://www.startech.com.bd/apple',                             category: 'Apple' },
      { url: 'https://www.startech.com.bd/accessories/power-bank',            category: 'Powerbank' },
      { url: 'https://www.startech.com.bd/accessories/speaker-and-home-theater', category: 'Speaker' },
      // Desktop — try alternative slug
      { url: 'https://www.startech.com.bd/desktop/desktop-pc',                category: 'Desktop' },
      // SSD — try alternative slug
      { url: 'https://www.startech.com.bd/component/storage/solid-state-drive', category: 'Storage' },
      { url: 'https://www.startech.com.bd/component/storage/hard-disk-drive',  category: 'Storage' },
      // Keyboard alternative
      { url: 'https://www.startech.com.bd/accessories/keyboard-mouse/keyboard', category: 'Keyboard' },
    ]
  },

  // ── SKYLAND — confirmed working: router, keyboard, mouse ─────────────────
  {
    name: 'Skyland',
    base: 'https://www.skyland.com.bd',
    pPattern: 'query',
    pages: [
      { url: 'https://www.skyland.com.bd/networking/router',       category: 'Router' },
      { url: 'https://www.skyland.com.bd/accessories/keyboard',    category: 'Keyboard' },
      { url: 'https://www.skyland.com.bd/accessories/mouse',       category: 'Mouse' },
    ]
  },

  // ── UNIVERSAL COMPUTER BD — confirmed working: router, PSU, keyboard, mouse
  {
    name: 'Universal Computer BD',
    base: 'https://www.universal.com.bd',
    pPattern: 'query',
    pages: [
      { url: 'https://www.universal.com.bd/router',                category: 'Router' },
      { url: 'https://www.universal.com.bd/power-supply',          category: 'Power Supply' },
      { url: 'https://www.universal.com.bd/keyboard',              category: 'Keyboard' },
      { url: 'https://www.universal.com.bd/mouse',                 category: 'Mouse' },
    ]
  },

];

// ── Scraper ───────────────────────────────────────────────────────────────────
const CARD_SELECTORS = [
  '.product-layout', '.p-item', '.product-thumb', '.product-card',
  '.wd-product', 'li.product', '.oe_product', '.product-item',
  '.col-6.col-md-4.col-xl-3', '.single-product-item', '.product-miniature',
  '[class*="ProductCard"]', '[class*="product-card"]',
  '.item-box', '.product-box', '.product',
].join(', ');

const TITLE_SELECTORS = [
  '.name a', '.product-name', '.product-title a',
  'h2 a', 'h3 a', 'h4 a',
  '.wd-entities-title a', '.p-item-name a',
  '.woocommerce-loop-product__title',
  '.title a', 'a h2', 'a h3',
  '[class*="product-title"]', '[class*="ProductTitle"]',
].join(', ');

const PRICE_SELECTORS = [
  '.price-new', '.p-item-price', '.price', '.regular-price',
  '.amount', 'span.price', '.p-price',
  '[class*="price"]', '[class*="Price"]',
].join(', ');

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
        const res = await axios.get(url, {
          headers: { ...HEADERS, Referer: store.base },
          timeout: 12000,
        });
        const $ = cheerio.load(res.data);
        let count = 0;

        $(CARD_SELECTORS).each((_, el) => {
          const card   = $(el);
          const title  = card.find(TITLE_SELECTORS).first().text().trim();
          const href   = card.find('a[href]').first().attr('href');
          const link   = cleanUrl(href, store.base);
          const imgEl  = card.find('img').first();
          const rawImg = imgEl.attr('data-src') || imgEl.attr('data-lazy-src') || imgEl.attr('src') || '';
          const img    = cleanUrl(rawImg, store.base);
          const price  = parsePrice(card.find(PRICE_SELECTORS).first().text());

          if (!title || !link || !img || !price) return;
          if (isFeaturePhone(title, price, page.category)) {
            console.log(`  [SKIP] ${title} ৳${price}`);
            return;
          }
          const minP = MIN_PRICE[page.category] || 0;
          if (price < minP) return;

          results.push({
            title, category: page.category, store: store.name,
            dealUrl: link, image: img, price,
            scrapedAt: new Date().toISOString(),
          });
          count++;
        });

        console.log(`  ${page.category} p${pNum}: ${count} items`);
        if (count === 0 && pNum > 1) break;

      } catch (e) {
        console.log(`  [${page.category} p${pNum}] ${e.message}`);
        break;
      }
      await delay(DELAY_MS);
    }
  }
  return results;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== Findly Scraper — Diversity Edition ===\n');
  let all = [];

  for (const store of STORES) {
    const products = await scrapeStore(store);
    all = [...all, ...products];
  }

  console.log(`\nTotal raw scraped: ${all.length}`);

  const grouped = {};
  all.forEach(p => {
    if (!grouped[p.category]) grouped[p.category] = [];
    grouped[p.category].push(p);
  });

  let finalProducts = [];
  console.log('\n--- Category Breakdown ---');

  for (const cat of TARGET_CATEGORIES) {
    let items = grouped[cat] || [];

    // Deduplicate
    const seen = new Set();
    items = items.filter(p => {
      const key = `${p.title.toLowerCase().replace(/\s+/g, ' ')}_${p.price}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Shuffle so no single store dominates top slots
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }

    if (items.length < MIN_PER_CAT) {
      console.warn(`  ⚠  ${cat}: only ${items.length} — needs more store URLs`);
    }

    console.log(`  ${cat}: ${items.length} products`);
    finalProducts = [...finalProducts, ...items];
  }

  finalProducts.forEach((p, i) => { p.id = i + 1; });

  fsSync.mkdirSync(pathSync.dirname(OUTPUT_FILE), { recursive: true });
  fsSync.writeFileSync(OUTPUT_FILE, JSON.stringify(finalProducts, null, 2));
  console.log(`\n=== Done: ${finalProducts.length} products → ${OUTPUT_FILE} ===`);
}

main().catch(console.error);
