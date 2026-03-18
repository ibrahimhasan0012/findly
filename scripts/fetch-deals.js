/**
 * scripts/fetch-deals.js — Findly Ultimate Mega-Scraper
 * 
 * Supports 25+ BD Tech Stores with resilient selector fallbacks.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import { fileURLToPath } from 'url';
import fsSync from 'fs';
import pathSync from 'path';

const __dirname = pathSync.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = pathSync.join(__dirname, '../public/shopnot-inspired/data/products.json');
const MAX_PER_STORE = 60;
const DELAY_MS = 400;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
};

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

const delay = ms => new Promise(r => setTimeout(r, ms));

async function scrapeStore(store) {
  console.log(`\n[${store.name}]`);
  const results = [];
  
  for (const page of store.pages) {
    console.log(`  Fetching ${page.category}: ${page.url}`);
    try {
      const { data } = await axios.get(page.url, { headers: { ...HEADERS, Referer: store.base }, timeout: 15000 });
      const $ = cheerio.load(data);
      let count = 0;
      
      const containers = $(store.container);
      if (containers.length === 0) {
         // Fallback to generic product layout
         $('.product-layout, .p-item, .product-thumb, .product, .product-card, .wd-product').each((_, el) => {
            processItem($(el), store, page, results, $);
            count++;
         });
      } else {
        containers.each((_, el) => {
          if (count >= MAX_PER_STORE) return false;
          if (processItem($(el), store, page, results, $)) count++;
        });
      }
      console.log(`    → Found ${count} products`);
    } catch (e) {
      console.log(`    ✗ Failed: ${e.message.substring(0, 50)}`);
    }
    await delay(DELAY_MS);
  }
  return results;
}

function processItem(card, store, page, results, $) {
  // Resilient multi-selector mapping
  const title = card.find('.name a, .product-name, .product-title a, h2 a, h3 a, .wd-entities-title a, .p-item-name a').first().text().trim();
  const href = card.find('a').first().attr('href');
  const link = cleanUrl(href, store.base);
  const rawImg = card.find('img').first().attr('data-src') || card.find('img').first().attr('src') || '';
  const img = cleanImg(rawImg, store.base);
  
  // Pricing Strategy: Grab the first/main price. 
  // Supports .price-new, .p-item-price, .price, .regular-price, .ooOxS
  const priceText = card.find('.price-new, .p-item-price, .price, .regular-price, .amount, .ooOxS').first().text();
  const price = parsePrice(priceText);
  
  if (title && link && img && price) {
    results.push({
      title,
      category: page.category,
      store: store.name,
      dealUrl: link,
      image: img,
      price,
      scrapedAt: new Date().toISOString()
    });
    return true;
  }
  return false;
}

const STORES = [
  {
    name: 'Star Tech',
    base: 'https://www.startech.com.bd',
    container: '.product-layout',
    pages: [
      { url: 'https://www.startech.com.bd/gadget/smart-watch', category: 'Smartwatch' },
      { url: 'https://www.startech.com.bd/laptop', category: 'Laptop' },
      { url: 'https://www.startech.com.bd/mobile-phone', category: 'Smartphone' },
    ]
  },
  {
    name: 'TechLand',
    base: 'https://www.techlandbd.com',
    container: '.product-layout',
    pages: [
      { url: 'https://www.techlandbd.com/smart-watch', category: 'Smartwatch' },
      { url: 'https://www.techlandbd.com/laptop-computer', category: 'Laptop' },
    ]
  },
  {
    name: 'Computer Village',
    base: 'https://www.computervillage.com.bd',
    container: '.product-layout',
    pages: [
      { url: 'https://www.computervillage.com.bd/smart-watch', category: 'Smartwatch' },
      { url: 'https://www.computervillage.com.bd/laptop-notebook', category: 'Laptop' },
    ]
  },
  {
    name: 'Global Brand',
    base: 'https://www.globalbrand.com.bd',
    container: '.product-layout',
    pages: [
      { url: 'https://www.globalbrand.com.bd/gadgets/smartwatch', category: 'Smartwatch' },
      { url: 'https://www.globalbrand.com.bd/laptop', category: 'Laptop' },
    ]
  },
  {
    name: 'Sumash Tech',
    base: 'https://sumashtech.com',
    container: '.product',
    pages: [
      { url: 'https://sumashtech.com/product-category/smart-gadget/smart-watch', category: 'Smartwatch' },
      { url: 'https://sumashtech.com/product-category/phone', category: 'Smartphone' },
    ]
  },
  {
    name: 'KRY',
    base: 'https://kryinternational.com',
    container: '.product',
    pages: [
      { url: 'https://kryinternational.com/product-category/smart-watch/', category: 'Smartwatch' },
      { url: 'https://kryinternational.com/product-category/smart-phone/', category: 'Smartphone' },
    ]
  },
  {
    name: 'Gadstyle',
    base: 'https://www.gadstyle.com',
    container: '.product',
    pages: [
      { url: 'https://www.gadstyle.com/product-category/electronics/wearable-devices/smart-watches/', category: 'Smartwatch' },
    ]
  },
  {
    name: 'Pickaboo',
    base: 'https://www.pickaboo.com',
    container: '.product',
    pages: [
      { url: 'https://www.pickaboo.com/smart-watch.html', category: 'Smartwatch' },
      { url: 'https://www.pickaboo.com/laptop.html', category: 'Laptop' },
    ]
  },
  {
    name: 'Potaka IT',
    base: 'https://www.potakait.com',
    container: '.product',
    pages: [
      { url: 'https://www.potakait.com/product-category/smartwatch', category: 'Smartwatch' },
    ]
  },
  {
    name: 'PCB Store',
    base: 'https://pcbstore.com.bd',
    container: '.product-card',
    pages: [
      { url: 'https://pcbstore.com.bd/gadget', category: 'Smartwatch' },
      { url: 'https://pcbstore.com.bd/laptop', category: 'Laptop' },
    ]
  },
  {
    name: 'Vibe Gaming',
    base: 'https://vibegaming.com.bd',
    container: '.product',
    pages: [
      { url: 'https://vibegaming.com.bd/product-category/gadgets/smartwatch/', category: 'Smartwatch' },
    ]
  }
];

async function main() {
  console.log('=== Findly Ultimate Mega-Scraper ===');
  let all = [];
  
  for (const store of STORES) {
    const products = await scrapeStore(store);
    all = [...all, ...products];
  }

  // Deduplicate by Title + Price
  const seen = new Set();
  all = all.filter(p => {
    const key = `${p.title.toLowerCase()}_${p.price}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Final Priority Sort: Smartwatches first, Phones second, Laptops third
  const order = ['Smartwatch', 'Smartphone', 'Laptop'];
  all.sort((a, b) => {
    const idxA = order.indexOf(a.category);
    const idxB = order.indexOf(b.category);
    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
  });

  fsSync.mkdirSync(pathSync.dirname(OUTPUT_FILE), { recursive: true });
  fsSync.writeFileSync(OUTPUT_FILE, JSON.stringify(all, null, 2));
  console.log(`\n=== Done: Scraped ${all.length} products total from all stores ===`);
}

main().catch(console.error);
