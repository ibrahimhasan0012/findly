/**
 * scripts/fetch-deals.js — Findly Multi-Store Live Deal Scraper
 * 
 * UPDATED: Prioritizes Gadgets and Accessories at the top. 
 * Corrected Star Tech and Gadget & Gear URLs based on research.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import { fileURLToPath } from 'url';
import fsSync from 'fs';
import pathSync from 'path';

const __dirname = pathSync.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = pathSync.join(__dirname, '../public/shopnot-inspired/data/products.json');
const MAX_PER_CATEGORY = 24;
const DELAY_MS = 600;

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
  href = href.split('?')[0];
  if (href.startsWith('http')) return href;
  if (href.startsWith('//')) return 'https:' + href;
  try {
    const origin = new URL(base).origin;
    return origin + (href.startsWith('/') ? href : '/' + href);
  } catch (e) { return href; }
}

function cleanImg(src = '', base = '') {
  if (!src || src.startsWith('data:')) return '';
  if (src.startsWith('http')) return src;
  if (src.startsWith('//')) return 'https:' + src;
  try {
    const origin = new URL(base).origin;
    return origin + (src.startsWith('/') ? src : '/' + src);
  } catch (e) { return src; }
}

function extractBrand(title = '') {
  const brands = [
    'Samsung', 'Apple', 'iPhone', 'Xiaomi', 'Redmi', 'POCO', 'Realme', 'OPPO', 'Vivo', 'OnePlus',
    'ASUS', 'Lenovo', 'HP', 'Dell', 'Acer', 'MSI', 'Gigabyte', 'Razer', 'Intel', 'AMD', 'NVIDIA',
    'Sony', 'LG', 'AOC', 'Logitech', 'Corsair', 'HyperX', 'SteelSeries', 'TP-Link', 'Tenda',
    'Seagate', 'WD', 'Kingston', 'Anker', 'Baseus', 'UGREEN', 'Orico', 'Hoco', 'Remax', 'Joyroom',
    'Amazfit', 'Garmin', 'Huawei', 'Honor', 'Jabra', 'JBL', 'Bose', 'Nothing', 'Motorola'
  ];
  const lower = title.toLowerCase();
  for (const b of brands) {
    if (lower.includes(b.toLowerCase())) return b;
  }
  return title.split(' ')[0];
}

const delay = ms => new Promise(r => setTimeout(r, ms));

// ── Generic Scrapers ──────────────────────────────────────────────────────────
async function scrapeOpenCart(name, baseUrl, pages) {
  const results = [];
  for (const { url, category } of pages) {
    console.log(`  [${name}] ${category}...`);
    try {
      const { data } = await axios.get(url, { headers: { ...HEADERS, Referer: baseUrl }, timeout: 15000 });
      const $ = cheerio.load(data);
      let count = 0;
      $('.product-layout, .p-item, .product-thumb').each((_, el) => {
        if (count >= MAX_PER_CATEGORY) return false;
        const card = $(el);
        const title = card.find('.caption .name a, h4 a, .p-item-name a, .name a, .product-name a').first().text().trim();
        const href = card.find('a').first().attr('href');
        const link = cleanUrl(href, baseUrl);
        const rawImg = card.find('img').first().attr('data-src') || card.find('img').first().attr('src') || '';
        const img = cleanImg(rawImg, baseUrl);
        const priceText = card.find('.price-new, .p-item-price, .price, .regular-price').first().text();
        const price = parsePrice(priceText);
        if (title && link && img && price) {
          results.push({ title, category, store: name, dealUrl: link, image: img, price, brand: extractBrand(title) });
          count++;
        }
      });
      console.log(`    → ${count} products`);
    } catch (e) { console.log(`    ✗ ${e.message.substring(0, 40)}`); }
    await delay(DELAY_MS);
  }
  return results;
}

async function scrapeWooCommerce(name, baseUrl, pages) {
  const results = [];
  for (const { url, category } of pages) {
    console.log(`  [${name}] ${category}...`);
    try {
      const { data } = await axios.get(url, { headers: { ...HEADERS, Referer: baseUrl }, timeout: 15000 });
      const $ = cheerio.load(data);
      let count = 0;
      $('li.product, .product-item, .product-card').each((_, el) => {
        if (count >= MAX_PER_CATEGORY) return false;
        const card = $(el);
        const title = card.find('.woocommerce-loop-product__title, h2, h3, .product-title, .RfADt').first().text().trim();
        const href = card.find('a').first().attr('href');
        const link = cleanUrl(href, baseUrl);
        const rawImg = card.find('img').first().attr('data-src') || card.find('img').first().attr('src') || '';
        const img = cleanImg(rawImg, baseUrl);
        const priceText = card.find('.price, .amount, .ooOxS').first().text();
        const price = parsePrice(priceText);
        if (title && link && img && price) {
          results.push({ title, category, store: name, dealUrl: link, image: img, price, brand: extractBrand(title) });
          count++;
        }
      });
      console.log(`    → ${count} products`);
    } catch (e) { console.log(`    ✗ ${e.message.substring(0, 40)}`); }
    await delay(DELAY_MS);
  }
  return results;
}

// ── Store Config ──────────────────────────────────────────────────────────────
const STORES = [
  {
    name: 'Star Tech',
    base: 'https://www.startech.com.bd',
    type: 'opencart',
    pages: [
      { url: 'https://www.startech.com.bd/gadget/smart-watch', category: 'Smartwatches' },
      { url: 'https://www.startech.com.bd/earphone', category: 'Earphones' },
      { url: 'https://www.startech.com.bd/power-bank', category: 'Powerbanks' },
      { url: 'https://www.startech.com.bd/mobile-phone', category: 'Smartphones' },
      { url: 'https://www.startech.com.bd/laptop', category: 'Laptops' },
    ]
  },
  {
    name: 'Gadget & Gear',
    base: 'https://www.gadgetandgear.com',
    type: 'woo',
    pages: [
      { url: 'https://www.gadgetandgear.com/smart-watch', category: 'Smartwatches' },
      { url: 'https://www.gadgetandgear.com/category/headphone', category: 'Earphones' },
      { url: 'https://www.gadgetandgear.com/mobile-phone', category: 'Smartphones' },
    ]
  },
  {
    name: 'Apple Gadgets BD',
    base: 'https://www.applegadgetsbd.com',
    type: 'woo',
    pages: [
      { url: 'https://www.applegadgetsbd.com/product-category/apple-watch', category: 'Smartwatches' },
      { url: 'https://www.applegadgetsbd.com/product-category/airpods', category: 'Earphones' },
      { url: 'https://www.applegadgetsbd.com/product-category/power-bank', category: 'Powerbanks' },
    ]
  },
  {
    name: 'TechLand BD',
    base: 'https://www.techlandbd.com',
    type: 'opencart',
    pages: [
      { url: 'https://www.techlandbd.com/smart-watch', category: 'Smartwatches' },
      { url: 'https://www.techlandbd.com/power-bank', category: 'Powerbanks' },
      { url: 'https://www.techlandbd.com/earphone-headphone', category: 'Earphones' },
    ]
  },
  {
    name: 'Pickaboo',
    base: 'https://www.pickaboo.com',
    type: 'woo',
    pages: [
      { url: 'https://www.pickaboo.com/smart-watch.html', category: 'Smartwatches' },
      { url: 'https://www.pickaboo.com/power-bank.html', category: 'Powerbanks' },
    ]
  }
];

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== Findly Gadget-First Scraper (Verified URLs) ===\n');
  let all = [];

  for (const store of STORES) {
    console.log(`\n[${store.name}]`);
    let products = (store.type === 'opencart') 
      ? await scrapeOpenCart(store.name, store.base, store.pages)
      : await scrapeWooCommerce(store.name, store.base, store.pages);
    all = [...all, ...products];
  }

  // Deduplicate
  const seen = new Set();
  all = all.filter(p => {
    const key = p.title.toLowerCase().substring(0, 48);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // PRIORITY SORT: Accessories first
  const order = ['Smartwatches', 'Earphones', 'Powerbanks', 'Smartphones', 'Laptops'];
  all.sort((a, b) => {
    const idxA = order.indexOf(a.category);
    const idxB = order.indexOf(b.category);
    if (idxA !== idxB) return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    return 0;
  });

  // Demote Symphony/Cheap phones from the start
  all.sort((a, b) => {
    const aSym = a.brand === 'Symphony' || a.brand === 'itel' || a.brand === 'Walton';
    const bSym = b.brand === 'Symphony' || b.brand === 'itel' || b.brand === 'Walton';
    if (aSym && !bSym) return 1;
    if (!aSym && bSym) return -1;
    return 0;
  });

  // Re-order by store logic (optional, for variety)
  // Let's just group by category then store
  
  // Final IDs
  all.forEach((p, i) => {
    p.id = i + 1;
    p.currency = 'BDT';
    p.ctaLabel = 'View deal';
    p.scrapedAt = new Date().toISOString();
  });

  fsSync.mkdirSync(pathSync.dirname(OUTPUT_FILE), { recursive: true });
  fsSync.writeFileSync(OUTPUT_FILE, JSON.stringify(all, null, 2));
  console.log(`\n=== Done: ${all.length} products saved (Gadgets prioritised) ===`);
}

main().catch(console.error);
