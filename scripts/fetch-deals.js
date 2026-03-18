/**
 * scripts/fetch-deals.js — Findly Diversity & Scale Scraper (Phase 5)
 * 
 * Goal: 1000+ products across 20 categories and 10+ stores.
 * Supports Pagination.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import { fileURLToPath } from 'url';
import fsSync from 'fs';
import pathSync from 'path';

const __dirname = pathSync.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = pathSync.join(__dirname, '../public/shopnot-inspired/data/products.json');
const MAX_PAGES = 2; // Scrape page 1 and 2
const DELAY_MS = 200;

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
     const u = new URL(base);
     return u.origin + (src.startsWith('/') ? src : '/' + src);
  } catch (e) { return src; }
}

const delay = ms => new Promise(r => setTimeout(r, ms));

async function scrapeStore(store) {
  console.log(`\n[${store.name}]`);
  const results = [];
  
  for (const page of store.pages) {
    for (let pNum = 1; pNum <= MAX_PAGES; pNum++) {
      let url = page.url;
      if (pNum > 1) {
        url += store.pPattern === 'slash' ? `/page/${pNum}/` : `?page=${pNum}`;
      }
      
      console.log(`  Fetching ${page.category} (p${pNum}): ${url}`);
      try {
        const response = await axios.get(url, { headers: { ...HEADERS, Referer: store.base }, timeout: 20000 });
        const $ = cheerio.load(response.data);
        let count = 0;
        
        const selectors = '.product-layout, .p-item, .product-thumb, .product, .product-card, .wd-product, li.product, .oe_product, .product-item, .col-6.col-md-4.col-xl-3';
        $(selectors).each((_, el) => {
          if (processItem($(el), store, page, results, $)) count++;
        });
        console.log(`    → Found ${count} products`);
        if (count === 0 && pNum > 1) break; // No more pages
      } catch (e) {
        console.log(`    ✗ Failed: ${e.message.substring(0, 50)}`);
        break;
      }
      await delay(DELAY_MS);
    }
  }
  return results;
}

function processItem(card, store, page, results, $) {
  // Broad selector matching
  const title = card.find('.name a, .product-name, .product-title a, h2 a, h3 a, .wd-entities-title a, .p-item-name a, .woocommerce-loop-product__title, .title a, a h2').first().text().trim();
  const href = card.find('a').first().attr('href');
  const link = cleanUrl(href, store.base);
  const rawImg = card.find('img').first().attr('data-src') || card.find('img').first().attr('src') || '';
  const img = cleanImg(rawImg, store.base);
  const priceText = card.find('.price-new, .p-item-price, .price, .regular-price, .amount, .ooOxS, span.price, .p-price').first().text();
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
    pages: [
      { url: 'https://www.startech.com.bd/mobile-phone', category: 'Smartphone' },
      { url: 'https://www.startech.com.bd/earphone', category: 'Audio' },
      { url: 'https://www.startech.com.bd/gadget/smart-watch', category: 'Smartwatch' },
      { url: 'https://www.startech.com.bd/monitor', category: 'Monitor' },
      { url: 'https://www.startech.com.bd/laptop', category: 'Laptop' },
      { url: 'https://www.startech.com.bd/power-bank', category: 'Powerbank' },
      { url: 'https://www.startech.com.bd/trimmer', category: 'Health' },
    ]
  },
  {
    name: 'TechLand',
    base: 'https://www.techlandbd.com',
    pages: [
      { url: 'https://www.techlandbd.com/monitor-and-display', category: 'Monitor' },
      { url: 'https://www.techlandbd.com/shop-laptop-computer', category: 'Laptop' },
      { url: 'https://www.techlandbd.com/accessories/earphones', category: 'Audio' },
      { url: 'https://www.techlandbd.com/accessories/computer-keyboard', category: 'Keyboard' },
    ]
  },
  {
    name: 'Computer Village',
    base: 'https://www.computervillage.com.bd',
    pages: [
      { url: 'https://www.computervillage.com.bd/monitor', category: 'Monitor' },
      { url: 'https://www.computervillage.com.bd/laptop', category: 'Laptop' },
      { url: 'https://www.computervillage.com.bd/accessories/keyboard', category: 'Keyboard' },
    ]
  },
  {
    name: 'Sell Tech',
    base: 'https://www.selltech.com.bd',
    pages: [
      { url: 'https://www.selltech.com.bd/Monitor', category: 'Monitor' },
      { url: 'https://www.selltech.com.bd/Laptop', category: 'Laptop' },
      { url: 'https://www.selltech.com.bd/headphone-and-earphone', category: 'Audio' },
    ]
  },
  {
    name: 'Computer Mania',
    base: 'https://computermania.com.bd',
    pPattern: 'slash',
    pages: [
      { url: 'https://computermania.com.bd/product-category/laptop/', category: 'Laptop' },
      { url: 'https://computermania.com.bd/product-category/components/monitor/', category: 'Monitor' },
      { url: 'https://computermania.com.bd/product-category/mobile-phone-price-in-bangladesh/', category: 'Smartphone' },
    ]
  },
  {
    name: 'Multimedia Kingdom',
    base: 'https://www.multimediakingdom.com.bd',
    pages: [
      { url: 'https://www.multimediakingdom.com.bd/music-sound-accessories', category: 'Audio' },
      { url: 'https://www.multimediakingdom.com.bd/graphics-tablet', category: 'Hardware' },
    ]
  },
  {
     name: 'UCC',
     base: 'https://www.ucc.com.bd',
     pages: [
       { url: 'https://www.ucc.com.bd/monitors', category: 'Monitor' },
       { url: 'https://www.ucc.com.bd/laptops', category: 'Laptop' },
     ]
  }
];

async function main() {
  console.log('=== Findly Diversity & Scale Scraper Phase 5 ===');
  let all = [];
  
  for (const store of STORES) {
    const products = await scrapeStore(store);
    all = [...all, ...products];
  }

  // Deduplicate
  const seen = new Set();
  all = all.filter(p => {
    const key = `${p.title.toLowerCase().substring(0, 60)}_${p.price}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Diversify display order by shuffling within categories
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }

  // General Priority: iPhone > High-End Smartphones > Gadgets > Hardware
  const order = ['iPhone', 'Smartphone', 'Smartwatch', 'Audio', 'Monitor', 'Laptop', 'Keyboard', 'Mouse', 'Health', 'Powerbank'];
  all.sort((a, b) => {
    const idxA = order.indexOf(a.category);
    const idxB = order.indexOf(b.category);
    if (idxA !== idxB) return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    return 0; // Maintain shuffled order within category
  });

  all.forEach((p, i) => { p.id = i + 1; });

  fsSync.mkdirSync(pathSync.dirname(OUTPUT_FILE), { recursive: true });
  fsSync.writeFileSync(OUTPUT_FILE, JSON.stringify(all.slice(0, 1500), null, 2));
  console.log(`\n=== Done: Scraped ${all.length} products total. Shuffled and Saved Top 1500. ===`);
}

main().catch(console.error);
