/**
 * scripts/fetch-deals.js — Findly Ultimate Mega-Scraper Phase 4 (FINAL)
 * 
 * 20 Categories expansion for 1000+ products.
 * Includes corrected Star Tech & Multimedia Kingdom URLs.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import { fileURLToPath } from 'url';
import fsSync from 'fs';
import pathSync from 'path';

const __dirname = pathSync.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = pathSync.join(__dirname, '../public/shopnot-inspired/data/products.json');
const MAX_PER_CATEGORY = 35; // 20 cats * 35 prods * 5-8 stores = ~3000-4000 products
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
      const response = await axios.get(page.url, { headers: { ...HEADERS, Referer: store.base }, timeout: 25000 });
      const $ = cheerio.load(response.data);
      let count = 0;
      
      const selectors = '.product-layout, .p-item, .product-thumb, .product, .product-card, .wd-product, li.product, .oe_product, .product-item';
      $(selectors).each((_, el) => {
        if (count >= MAX_PER_CATEGORY) return false;
        if (processItem($(el), store, page, results, $)) count++;
      });
      console.log(`    → Found ${count} products`);
    } catch (e) {
      console.log(`    ✗ Failed: ${e.message.substring(0, 50)}`);
    }
    await delay(DELAY_MS);
  }
  return results;
}

function processItem(card, store, page, results, $) {
  const titleText = card.find('.name a, .product-name, .product-title a, h2 a, h3 a, .wd-entities-title a, .p-item-name a, .woocommerce-loop-product__title, .title a, a h2').first().text().trim();
  const title = titleText || card.find('a').attr('title') || '';
  
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
      { url: 'https://www.startech.com.bd/apple-iphone', category: 'iPhone' },
      { url: 'https://www.startech.com.bd/earphone', category: 'Audio' },
      { url: 'https://www.startech.com.bd/power-bank', category: 'Powerbank' },
      { url: 'https://www.startech.com.bd/gadget/smart-watch', category: 'Smartwatch' },
      { url: 'https://www.startech.com.bd/converter', category: 'Adapter' },
      { url: 'https://www.startech.com.bd/mobile-phone-case', category: 'Covers' },
      { url: 'https://www.startech.com.bd/accessories/bluetooth-speaker', category: 'Audio' },
      { url: 'https://www.startech.com.bd/trimmer', category: 'Healthcare' },
      { url: 'https://www.startech.com.bd/mini-fan', category: 'Lifestyle' },
      { url: 'https://www.startech.com.bd/tv-box', category: 'TV Box' },
      { url: 'https://www.startech.com.bd/accessories/keyboards', category: 'Keyboard' },
      { url: 'https://www.startech.com.bd/accessories/mouse', category: 'Mouse' },
      { url: 'https://www.startech.com.bd/monitor', category: 'Monitor' },
      { url: 'https://www.startech.com.bd/laptop', category: 'Laptop' },
      { url: 'https://www.startech.com.bd/desktops', category: 'Desktop' },
      { url: 'https://www.startech.com.bd/component/power-supply', category: 'PSU' },
      { url: 'https://www.startech.com.bd/component/ram', category: 'RAM' },
      { url: 'https://www.startech.com.bd/networking/router', category: 'Router' },
      { url: 'https://www.startech.com.bd/camera', category: 'Camera' }
    ]
  },
  {
    name: 'TechLand',
    base: 'https://www.techlandbd.com',
    pages: [
      { url: 'https://www.techlandbd.com/monitor-and-display', category: 'Monitor' },
      { url: 'https://www.techlandbd.com/shop-laptop-computer', category: 'Laptop' },
      { url: 'https://www.techlandbd.com/pc-components/graphics-card', category: 'GPU' },
      { url: 'https://www.techlandbd.com/gadget-accessories/smart-watch-gadget', category: 'Smartwatch' },
      { url: 'https://www.techlandbd.com/gadget-accessories/power-bank-original', category: 'Powerbank' },
      { url: 'https://www.techlandbd.com/accessories/earphones', category: 'Audio' },
      { url: 'https://www.techlandbd.com/accessories/computer-keyboard', category: 'Keyboard' },
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
    name: 'Computer Village',
    base: 'https://www.computervillage.com.bd',
    pages: [
      { url: 'https://www.computervillage.com.bd/laptop', category: 'Laptop' },
      { url: 'https://www.computervillage.com.bd/monitor', category: 'Monitor' },
      { url: 'https://www.computervillage.com.bd/power-bank', category: 'Powerbank' },
    ]
  },
  {
    name: 'Pickaboo',
    base: 'https://www.pickaboo.com',
    pages: [
      { url: 'https://www.pickaboo.com/mobile-phone/mobiles.html', category: 'Smartphone' },
      { url: 'https://www.pickaboo.com/smart-watch.html', category: 'Smartwatch' },
    ]
  }
];

async function main() {
  console.log('=== Findly Ultimate Mega-Scraper Phase 4 (FINAL) ===');
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

  // Comprehensive Priority Order: iPhone > Samsung > Gadgets > Hardware > Personal
  const order = ['iPhone', 'Samsung', 'Smartphone', 'Smartwatch', 'Audio', 'Powerbank', 'Monitor', 'GPU', 'Keyboard', 'Laptop', 'Desktop', 'Healthcare', 'Lifestyle'];
  all.sort((a, b) => {
    const idxA = order.indexOf(a.category);
    const idxB = order.indexOf(b.category);
    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
  });

  // Final IDs and attributes
  all.forEach((p, i) => { p.id = i + 1; });

  fsSync.mkdirSync(pathSync.dirname(OUTPUT_FILE), { recursive: true });
  fsSync.writeFileSync(OUTPUT_FILE, JSON.stringify(all.slice(0, 1500), null, 2));
  console.log(`\n=== Done: Scraped ${all.length} products total. Saved Top 1500. ===`);
}

main().catch(console.error);
