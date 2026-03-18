/**
 * scripts/fetch-deals.js — Findly Multi-Store Live Deal Scraper
 *
 * Scrapes 25+ BD tech stores covering smartphones, laptops, PC components,
 * smartwatches, earphones, powerbanks, and all accessories.
 *
 * Stores: Star Tech, Sell Tech BD, Ryans, Global Brand, Computer Source,
 *         TechLand BD, Binary Logic, Dolphin, Computer Village, Potaka IT,
 *         Gadget & Gear, Shei Tech, PCB Store, Computer Mania,
 *         UCC Shop, and more.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, '../public/shopnot-inspired/data/products.json');
const MAX_PER_PAGE = 10;
const DELAY_MS = 700;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

// ── Utility ───────────────────────────────────────────────────────────────────
function parsePrice(raw = '') {
  const n = parseFloat(String(raw).replace(/[^\d.]/g, ''));
  return isNaN(n) || n <= 0 ? null : Math.round(n);
}

function cleanUrl(href = '', base = '') {
  if (!href) return '';
  href = href.split('?')[0]; // strip tracking params for cleanliness
  if (href.startsWith('http')) return href;
  if (href.startsWith('//')) return 'https:' + href;
  const origin = new URL(base).origin;
  return origin + (href.startsWith('/') ? href : '/' + href);
}

function cleanImg(src = '', base = '') {
  if (!src || src.startsWith('data:')) return '';
  if (src.startsWith('http')) return src;
  if (src.startsWith('//')) return 'https:' + src;
  const origin = new URL(base).origin;
  return origin + (src.startsWith('/') ? src : '/' + src);
}

function extractBrand(title = '') {
  const brands = [
    'Samsung', 'Apple', 'Xiaomi', 'Redmi', 'POCO', 'Realme', 'OPPO', 'Vivo', 'OnePlus',
    'ASUS', 'Asus', 'Lenovo', 'HP', 'Dell', 'Acer', 'MSI', 'Gigabyte', 'Razer',
    'Intel', 'AMD', 'NVIDIA', 'Nvidia', 'Sony', 'LG', 'AOC', 'Philips', 'ViewSonic',
    'Logitech', 'Corsair', 'HyperX', 'SteelSeries', 'Roccat', 'Havit', 'A4Tech',
    'TP-Link', 'Tenda', 'Netgear', 'Asus', 'D-Link', 'Mikrotik',
    'Seagate', 'Western Digital', 'WD', 'Kingston', 'Transcend', 'Samsung',
    'Anker', 'Baseus', 'UGREEN', 'Orico', 'Hoco', 'Remax', 'Joyroom',
    'Amazfit', 'Garmin', 'Huawei', 'Honor', 'Jabra', 'JBL', 'Bose', 'Audio-Technica',
    'Nothing', 'Motorola', 'Nokia', 'Tecno', 'Infinix', 'itel', 'Symphony', 'Walton',
    'PlayStation', 'Xbox', 'Nintendo', 'MSI', 'ZOTAC',
  ];
  const lower = title.toLowerCase();
  for (const b of brands) {
    if (lower.includes(b.toLowerCase())) return b;
  }
  return title.split(' ')[0];
}

const delay = ms => new Promise(r => setTimeout(r, ms));

// ── Generic OpenCart scraper (used by most BD stores) ────────────────────────
async function scrapeOpenCart(name, baseUrl, pages) {
  const results = [];
  for (const { url, category } of pages) {
    console.log(`  [${name}] ${category}: ${url}`);
    try {
      const { data } = await axios.get(url, { headers: { ...HEADERS, Referer: baseUrl }, timeout: 18000 });
      const $ = cheerio.load(data);
      let count = 0;

      // OpenCart uses .product-layout > .product-thumb
      $('.product-layout').each((_, el) => {
        if (count >= MAX_PER_PAGE) return false;
        const card = $(el);
        const title = card.find('.caption .name a, h4 a').first().text().trim();
        const href = card.find('.caption .name a, h4 a').first().attr('href') || card.find('a').first().attr('href');
        const link = cleanUrl(href, baseUrl);
        const rawImg = card.find('img').first().attr('data-src') || card.find('img').first().attr('src') || '';
        const img = cleanImg(rawImg, baseUrl);
        const priceEl = card.find('.price-new, .price-normal, .price').first();
        const price = parsePrice(priceEl.text());
        const oldPrice = parsePrice(card.find('.price-old').first().text());

        if (title && link && img && price) {
          results.push({ title, category, store: name, dealUrl: link, image: img, price, oldPrice: oldPrice || null, brand: extractBrand(title) });
          count++;
        }
      });
      console.log(`    → ${count} products`);
    } catch (e) {
      console.log(`    ✗ ${e.message.substring(0, 60)}`);
    }
    await delay(DELAY_MS);
  }
  return results;
}

// ── Generic WooCommerce scraper ───────────────────────────────────────────────
async function scrapeWooCommerce(name, baseUrl, pages) {
  const results = [];
  for (const { url, category } of pages) {
    console.log(`  [${name}] ${category}: ${url}`);
    try {
      const { data } = await axios.get(url, { headers: { ...HEADERS, Referer: baseUrl }, timeout: 18000 });
      const $ = cheerio.load(data);
      let count = 0;

      $('li.product, .product-item, article.product').each((_, el) => {
        if (count >= MAX_PER_PAGE) return false;
        const card = $(el);
        const title = card.find('.woocommerce-loop-product__title, h2.title, .product-title').first().text().trim();
        const href = card.find('a.woocommerce-loop-product__link, .product-image-link, a').first().attr('href');
        const link = cleanUrl(href, baseUrl);
        const rawImg = card.find('img').first().attr('data-src') || card.find('img').first().attr('src') || '';
        const img = cleanImg(rawImg, baseUrl);
        const priceEl = card.find('ins .amount, .price .amount, .price').first();
        const price = parsePrice(priceEl.text());
        const oldPrice = parsePrice(card.find('del .amount').first().text());

        if (title && link && img && price) {
          results.push({ title, category, store: name, dealUrl: link, image: img, price, oldPrice: oldPrice || null, brand: extractBrand(title) });
          count++;
        }
      });
      console.log(`    → ${count} products`);
    } catch (e) {
      console.log(`    ✗ ${e.message.substring(0, 60)}`);
    }
    await delay(DELAY_MS);
  }
  return results;
}

// ── Store Definitions ─────────────────────────────────────────────────────────
const STORES = [
  // ── OpenCart Stores ──
  {
    name: 'Star Tech',
    base: 'https://www.startech.com.bd',
    type: 'opencart',
    pages: [
      { url: 'https://www.startech.com.bd/mobile-phone', category: 'Smartphones' },
      { url: 'https://www.startech.com.bd/laptop/all-laptop', category: 'Laptops' },
      { url: 'https://www.startech.com.bd/component/processor', category: 'PC Components' },
      { url: 'https://www.startech.com.bd/component/graphics-card', category: 'PC Components' },
      { url: 'https://www.startech.com.bd/component/ram', category: 'PC Components' },
      { url: 'https://www.startech.com.bd/component/ssd', category: 'Storage' },
      { url: 'https://www.startech.com.bd/monitor', category: 'Monitors' },
      { url: 'https://www.startech.com.bd/accessories/power-bank', category: 'Powerbanks' },
      { url: 'https://www.startech.com.bd/accessories/earphone-headphone', category: 'Earphones' },
      { url: 'https://www.startech.com.bd/accessories/smart-watch', category: 'Smartwatches' },
      { url: 'https://www.startech.com.bd/networking', category: 'Networking' },
    ]
  },
  {
    name: 'Sell Tech BD',
    base: 'https://www.selltech.com.bd',
    type: 'opencart',
    pages: [
      { url: 'https://www.selltech.com.bd/laptop', category: 'Laptops' },
      { url: 'https://www.selltech.com.bd/desktop', category: 'PC Components' },
      { url: 'https://www.selltech.com.bd/monitor', category: 'Monitors' },
      { url: 'https://www.selltech.com.bd/accessories', category: 'Accessories' },
    ]
  },
  {
    name: 'Computer Source',
    base: 'https://www.computersource.com.bd',
    type: 'opencart',
    pages: [
      { url: 'https://www.computersource.com.bd/laptop', category: 'Laptops' },
      { url: 'https://www.computersource.com.bd/desktop', category: 'PC Components' },
      { url: 'https://www.computersource.com.bd/components', category: 'PC Components' },
      { url: 'https://www.computersource.com.bd/accessories', category: 'Accessories' },
    ]
  },
  {
    name: 'TechLand BD',
    base: 'https://www.techlandbd.com',
    type: 'opencart',
    pages: [
      { url: 'https://www.techlandbd.com/smartphones', category: 'Smartphones' },
      { url: 'https://www.techlandbd.com/smart-watch', category: 'Smartwatches' },
      { url: 'https://www.techlandbd.com/earphone-headphone', category: 'Earphones' },
      { url: 'https://www.techlandbd.com/power-bank', category: 'Powerbanks' },
      { url: 'https://www.techlandbd.com/laptop', category: 'Laptops' },
      { url: 'https://www.techlandbd.com/graphics-card', category: 'PC Components' },
      { url: 'https://www.techlandbd.com/processor', category: 'PC Components' },
      { url: 'https://www.techlandbd.com/monitor', category: 'Monitors' },
    ]
  },
  {
    name: 'Computer Village',
    base: 'https://www.computervillage.com.bd',
    type: 'opencart',
    pages: [
      { url: 'https://www.computervillage.com.bd/laptop', category: 'Laptops' },
      { url: 'https://www.computervillage.com.bd/desktop', category: 'PC Components' },
      { url: 'https://www.computervillage.com.bd/component', category: 'PC Components' },
      { url: 'https://www.computervillage.com.bd/monitor', category: 'Monitors' },
      { url: 'https://www.computervillage.com.bd/accessories', category: 'Accessories' },
    ]
  },
  {
    name: 'Dolphin',
    base: 'https://www.dolphin.com.bd',
    type: 'opencart',
    pages: [
      { url: 'https://www.dolphin.com.bd/laptop', category: 'Laptops' },
      { url: 'https://www.dolphin.com.bd/smartwatch', category: 'Smartwatches' },
      { url: 'https://www.dolphin.com.bd/earbuds', category: 'Earphones' },
      { url: 'https://www.dolphin.com.bd/power-bank', category: 'Powerbanks' },
      { url: 'https://www.dolphin.com.bd/graphics-card', category: 'PC Components' },
    ]
  },
  {
    name: 'UCC Shop',
    base: 'https://www.ucc.com.bd',
    type: 'opencart',
    pages: [
      { url: 'https://www.ucc.com.bd/graphics-card', category: 'PC Components' },
      { url: 'https://www.ucc.com.bd/processor', category: 'PC Components' },
      { url: 'https://www.ucc.com.bd/laptop', category: 'Laptops' },
      { url: 'https://www.ucc.com.bd/monitor', category: 'Monitors' },
    ]
  },
  {
    name: 'Global Brand',
    base: 'https://www.globalbrand.com.bd',
    type: 'opencart',
    pages: [
      { url: 'https://www.globalbrand.com.bd/mobile', category: 'Smartphones' },
      { url: 'https://www.globalbrand.com.bd/laptop', category: 'Laptops' },
      { url: 'https://www.globalbrand.com.bd/monitor', category: 'Monitors' },
      { url: 'https://www.globalbrand.com.bd/accessories', category: 'Accessories' },
    ]
  },
  {
    name: 'Computer Mania',
    base: 'https://www.computermania.com.bd',
    type: 'opencart',
    pages: [
      { url: 'https://www.computermania.com.bd/laptop', category: 'Laptops' },
      { url: 'https://www.computermania.com.bd/desktop', category: 'PC Components' },
      { url: 'https://www.computermania.com.bd/components', category: 'PC Components' },
      { url: 'https://www.computermania.com.bd/accessories', category: 'Accessories' },
    ]
  },
  {
    name: 'Binary Logic',
    base: 'https://www.binarylogicbd.com',
    type: 'opencart',
    pages: [
      { url: 'https://www.binarylogicbd.com/laptop', category: 'Laptops' },
      { url: 'https://www.binarylogicbd.com/components', category: 'PC Components' },
    ]
  },

  // ── WooCommerce Stores ──
  {
    name: 'Potaka IT',
    base: 'https://www.potakait.com',
    type: 'woo',
    pages: [
      { url: 'https://www.potakait.com/product-category/smartwatch', category: 'Smartwatches' },
      { url: 'https://www.potakait.com/product-category/earphone', category: 'Earphones' },
      { url: 'https://www.potakait.com/product-category/power-bank', category: 'Powerbanks' },
      { url: 'https://www.potakait.com/product-category/mobile-phone', category: 'Smartphones' },
      { url: 'https://www.potakait.com/product-category/laptop', category: 'Laptops' },
    ]
  },
  {
    name: 'Gadget & Gear',
    base: 'https://www.gadgetandgear.com',
    type: 'woo',
    pages: [
      { url: 'https://www.gadgetandgear.com/product-category/mobile-phone', category: 'Smartphones' },
      { url: 'https://www.gadgetandgear.com/product-category/laptop', category: 'Laptops' },
      { url: 'https://www.gadgetandgear.com/product-category/smartwatch', category: 'Smartwatches' },
      { url: 'https://www.gadgetandgear.com/product-category/headphone', category: 'Earphones' },
    ]
  },
  {
    name: 'Shei Tech',
    base: 'https://www.sheitech.com.bd',
    type: 'woo',
    pages: [
      { url: 'https://www.sheitech.com.bd/product-category/smartwatch', category: 'Smartwatches' },
      { url: 'https://www.sheitech.com.bd/product-category/phone', category: 'Smartphones' },
      { url: 'https://www.sheitech.com.bd/product-category/earbuds', category: 'Earphones' },
    ]
  },
  {
    name: 'Apple Gadgets BD',
    base: 'https://www.applegadgetsbd.com',
    type: 'woo',
    pages: [
      { url: 'https://www.applegadgetsbd.com/product-category/iphone', category: 'Smartphones' },
      { url: 'https://www.applegadgetsbd.com/product-category/apple-watch', category: 'Smartwatches' },
      { url: 'https://www.applegadgetsbd.com/product-category/airpods', category: 'Earphones' },
      { url: 'https://www.applegadgetsbd.com/product-category/macbook', category: 'Laptops' },
    ]
  },
  {
    name: 'PCB Store',
    base: 'https://www.pcbstore.com.bd',
    type: 'woo',
    pages: [
      { url: 'https://www.pcbstore.com.bd/product-category/laptop', category: 'Laptops' },
      { url: 'https://www.pcbstore.com.bd/product-category/components', category: 'PC Components' },
      { url: 'https://www.pcbstore.com.bd/product-category/accessories', category: 'Accessories' },
    ]
  },
  {
    name: 'EZ Gadgets',
    base: 'https://www.ezgadgets.com.bd',
    type: 'woo',
    pages: [
      { url: 'https://www.ezgadgets.com.bd/product-category/smartphones', category: 'Smartphones' },
      { url: 'https://www.ezgadgets.com.bd/product-category/smartwatch', category: 'Smartwatches' },
      { url: 'https://www.ezgadgets.com.bd/product-category/earbuds', category: 'Earphones' },
    ]
  },
  {
    name: 'Vibe Gaming',
    base: 'https://www.vibegaming.com.bd',
    type: 'woo',
    pages: [
      { url: 'https://www.vibegaming.com.bd/product-category/gaming-accessories', category: 'Gaming' },
      { url: 'https://www.vibegaming.com.bd/product-category/gaming-laptop', category: 'Laptops' },
      { url: 'https://www.vibegaming.com.bd/product-category/gaming-peripherals', category: 'Accessories' },
    ]
  },
  {
    name: 'Gadstyle BD',
    base: 'https://www.gadstyle.com',
    type: 'woo',
    pages: [
      { url: 'https://www.gadstyle.com/product-category/smartwatch', category: 'Smartwatches' },
      { url: 'https://www.gadstyle.com/product-category/earphone', category: 'Earphones' },
      { url: 'https://www.gadstyle.com/product-category/powerbank', category: 'Powerbanks' },
    ]
  },
];

// ── Star Tech custom parser (slightly different class names) ──────────────────
async function scrapeStarTech(store) {
  const results = [];
  for (const { url, category } of store.pages) {
    console.log(`  [Star Tech] ${category}...`);
    try {
      const { data } = await axios.get(url, { headers: { ...HEADERS, Referer: store.base }, timeout: 18000 });
      const $ = cheerio.load(data);
      let count = 0;

      $('.p-item').each((_, el) => {
        if (count >= MAX_PER_PAGE) return false;
        const card = $(el);
        const title = card.find('.p-item-name').text().trim();
        const href = card.find('a.p-item-img, .p-item-name a').first().attr('href') || '';
        const link = cleanUrl(href, store.base);
        const rawImg = card.find('.p-item-img img').attr('data-src') || card.find('.p-item-img img').attr('src') || '';
        const img = cleanImg(rawImg, store.base);
        const price = parsePrice(card.find('.price-new').text() || card.find('.p-item-price').text());
        const oldPrice = parsePrice(card.find('.price-old').text());

        if (title && link && img && price) {
          results.push({ title, category, store: 'Star Tech', dealUrl: link, image: img, price, oldPrice: oldPrice || null, brand: extractBrand(title) });
          count++;
        }
      });
      console.log(`    → ${count} products`);
    } catch (e) {
      console.log(`    ✗ ${e.message.substring(0, 60)}`);
    }
    await delay(DELAY_MS);
  }
  return results;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== Findly Multi-Store Scraper ===\n');
  let all = [];

  for (const store of STORES) {
    console.log(`\n[${store.name}]`);
    let products = [];
    if (store.name === 'Star Tech') {
      products = await scrapeStarTech(store);
    } else if (store.type === 'opencart') {
      products = await scrapeOpenCart(store.name, store.base, store.pages);
    } else {
      products = await scrapeWooCommerce(store.name, store.base, store.pages);
    }
    all = [...all, ...products];
    console.log(`  → ${store.name}: ${products.length} total`);
  }

  // Deduplicate by title similarity
  const seen = new Set();
  all = all.filter(p => {
    const key = p.title.toLowerCase().replace(/\s+/g, ' ').substring(0, 45);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Filter junk
  all = all.filter(p => p.title.length > 5 && p.price > 0 && p.image);

  // Assign IDs and extra fields
  all.forEach((p, i) => {
    p.id = i + 1;
    p.currency = 'BDT';
    p.alt = p.title;
    p.ctaLabel = 'View deal';
    p.scrapedAt = new Date().toISOString();
  });

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(all, null, 2));
  console.log(`\n=== Done: ${all.length} live products from ${STORES.length} stores ===`);
}

main().catch(console.error);
