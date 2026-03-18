/**
 * scripts/fetch-deals.js — Findly Live Deal Scraper
 *
 * Scrapes live product listings from Bangladeshi tech stores.
 * Saves results to public/shopnot-inspired/data/products.json
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, '../public/shopnot-inspired/data/products.json');
const MAX_PER_PAGE = 12;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.startech.com.bd/',
};

function parsePrice(raw = '') {
  const n = parseFloat(raw.replace(/[^\d.]/g, ''));
  return isNaN(n) || n <= 0 ? null : Math.round(n);
}

function extractBrand(title = '') {
  const brands = ['Samsung', 'Apple', 'iPhone', 'Xiaomi', 'Redmi', 'Realme', 'OPPO', 'Vivo',
    'OnePlus', 'ASUS', 'Asus', 'Lenovo', 'HP', 'Dell', 'Acer', 'MSI', 'Gigabyte',
    'Intel', 'AMD', 'Nvidia', 'Sony', 'LG', 'AOC', 'Logitech', 'TP-Link',
    'Anker', 'Baseus', 'Amazfit', 'Huawei', 'Jabra', 'JBL', 'Nothing', 'Motorola',
    'Nokia', 'Seagate', 'Western Digital', 'Kingston', 'Corsair', 'Razer', 'Garmin'
  ];
  for (const b of brands) {
    if (title.toLowerCase().includes(b.toLowerCase())) return b;
  }
  return title.split(' ')[0];
}

// ── Star Tech (works with Cheerio as it returns server-rendered HTML) ──────────
async function scrapeStarTech() {
  const PAGES = [
    { url: 'https://www.startech.com.bd/mobile-phone', category: 'Smartphones' },
    { url: 'https://www.startech.com.bd/laptop', category: 'Laptops' },
    { url: 'https://www.startech.com.bd/component/processor', category: 'PC Components' },
    { url: 'https://www.startech.com.bd/component/graphics-card', category: 'PC Components' },
    { url: 'https://www.startech.com.bd/monitor', category: 'Monitors' },
    { url: 'https://www.startech.com.bd/accessories/power-bank', category: 'Powerbanks' },
    { url: 'https://www.startech.com.bd/accessories/earphone-headphone', category: 'Earphones' },
    { url: 'https://www.startech.com.bd/accessories/smart-watch', category: 'Smartwatches' },
    { url: 'https://www.startech.com.bd/networking', category: 'Networking' },
    { url: 'https://www.startech.com.bd/ups-ips', category: 'Power Backup' },
  ];

  const results = [];
  for (const page of PAGES) {
    console.log(`  [StarTech] ${page.category}...`);
    try {
      const { data } = await axios.get(page.url, { headers: HEADERS, timeout: 20000 });
      const $ = cheerio.load(data);

      let count = 0;
      $('.p-item').each((_, el) => {
        if (count >= MAX_PER_PAGE) return false;
        const card = $(el);
        const title = card.find('.p-item-name').text().trim();
        const href = card.find('a.p-item-img, .p-item-name a').first().attr('href') || '';
        const link = href.startsWith('http') ? href : `https://www.startech.com.bd${href}`;
        const img = card.find('.p-item-img img').attr('data-src') || card.find('.p-item-img img').attr('src') || '';
        const realImg = img.startsWith('//') ? `https:${img}` : img;
        const priceText = card.find('.price-new').text() || card.find('.p-item-price').text();
        const price = parsePrice(priceText);
        const oldText = card.find('.price-old').text();
        const oldPrice = parsePrice(oldText);

        if (title && link && realImg && price) {
          results.push({ title, category: page.category, store: 'Star Tech', dealUrl: link, image: realImg, price, oldPrice, brand: extractBrand(title) });
          count++;
        }
      });
      console.log(`    → ${count} products`);
    } catch (err) {
      console.log(`    ✗ ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 800));
  }
  return results;
}

// ── Daraz via their public search API ──────────────────────────────────────────
async function scrapeDaraz() {
  const SEARCHES = [
    { q: 'smartphone', category: 'Smartphones' },
    { q: 'smartwatch', category: 'Smartwatches' },
    { q: 'earbuds wireless', category: 'Earphones' },
    { q: 'power bank', category: 'Powerbanks' },
    { q: 'gaming laptop', category: 'Laptops' },
    { q: 'gaming console', category: 'Gaming' },
  ];

  const BASE = 'https://www.daraz.com.bd/catalog/?_keyori=ss&from=input&page=1&q=';
  const results = [];

  for (const item of SEARCHES) {
    console.log(`  [Daraz] ${item.category}...`);
    try {
      const { data } = await axios.get(`${BASE}${encodeURIComponent(item.q)}&spm=a2a0e.home.search.1`, {
        headers: { ...HEADERS, 'Referer': 'https://www.daraz.com.bd/' },
        timeout: 20000
      });
      const $ = cheerio.load(data);

      let count = 0;
      $('[data-qa-locator="product-item"], .c16H9d, .Bm3ON').each((_, el) => {
        if (count >= 8) return false;
        const card = $(el);
        const title = card.find('.RfADt, .c16H9d a, [title]').attr('title') || card.find('.RfADt').text().trim();
        const link = card.find('a').first().attr('href') || '';
        const fullLink = link.startsWith('http') ? link : `https:${link}`;
        const img = card.find('img').first().attr('src') || card.find('img').first().attr('data-src') || '';
        const priceText = card.find('.ooOxS, .price-sales').first().text();
        const price = parsePrice(priceText);

        if (title && fullLink && img && price) {
          results.push({ title, category: item.category, store: 'Daraz Mall', dealUrl: fullLink, image: img, price, oldPrice: null, brand: extractBrand(title) });
          count++;
        }
      });
      console.log(`    → ${count} products`);
    } catch (err) {
      console.log(`    ✗ ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  return results;
}

// ── TechLand BD ────────────────────────────────────────────────────────────────
async function scrapeTechLandBD() {
  const PAGES = [
    { url: 'https://www.techlandbd.com/smartphones', category: 'Smartphones' },
    { url: 'https://www.techlandbd.com/processor', category: 'PC Components' },
    { url: 'https://www.techlandbd.com/smart-watch', category: 'Smartwatches' },
    { url: 'https://www.techlandbd.com/earphone-headphone', category: 'Earphones' },
  ];

  const results = [];
  for (const page of PAGES) {
    console.log(`  [TechLandBD] ${page.category}...`);
    try {
      const { data } = await axios.get(page.url, { headers: HEADERS, timeout: 20000 });
      const $ = cheerio.load(data);

      let count = 0;
      $('.product-layout, .product-grid .product-thumb').each((_, el) => {
        if (count >= MAX_PER_PAGE) return false;
        const card = $(el);
        const title = card.find('.caption .name a, h4 a').first().text().trim();
        const link = card.find('.caption .name a, h4 a').first().attr('href') || '';
        const img = card.find('img').first().attr('data-src') || card.find('img').first().attr('src') || '';
        const priceText = card.find('.price-new, .price').first().text();
        const price = parsePrice(priceText);
        const oldText = card.find('.price-old').text();
        const oldPrice = parsePrice(oldText);

        if (title && link && img && price) {
          results.push({ title, category: page.category, store: 'TechLand BD', dealUrl: link, image: img, price, oldPrice, brand: extractBrand(title) });
          count++;
        }
      });
      console.log(`    → ${count} products`);
    } catch (err) {
      console.log(`    ✗ ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 800));
  }
  return results;
}

// ── UCC Shop ────────────────────────────────────────────────────────────────
async function scrapeUCCShop() {
  const PAGES = [
    { url: 'https://www.ucc.com.bd/graphics-card', category: 'PC Components' },
    { url: 'https://www.ucc.com.bd/ssd', category: 'Storage' },
  ];

  const results = [];
  for (const page of PAGES) {
    console.log(`  [UCC Shop] ${page.category}...`);
    try {
      const { data } = await axios.get(page.url, { headers: HEADERS, timeout: 20000 });
      const $ = cheerio.load(data);

      let count = 0;
      $('.product-layout, .product-thumb').each((_, el) => {
        if (count >= MAX_PER_PAGE) return false;
        const card = $(el);
        const title = card.find('.name a, h4 a').first().text().trim();
        const link = card.find('.name a, h4 a').first().attr('href') || '';
        const img = card.find('img').first().attr('src') || '';
        const priceText = card.find('.price-new, .price').first().text();
        const price = parsePrice(priceText);
        if (title && link && price) {
          results.push({ title, category: page.category, store: 'UCC Shop', dealUrl: link, image: img, price, oldPrice: null, brand: extractBrand(title) });
          count++;
        }
      });
      console.log(`    → ${count} products`);
    } catch (err) {
      console.log(`    ✗ ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 800));
  }
  return results;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Findly Live Scraper ===\n');
  let all = [];

  console.log('\n[Star Tech]');
  all = [...all, ...await scrapeStarTech()];

  console.log('\n[TechLand BD]');
  all = [...all, ...await scrapeTechLandBD()];

  console.log('\n[UCC Shop]');
  all = [...all, ...await scrapeUCCShop()];

  console.log('\n[Daraz Mall]');
  all = [...all, ...await scrapeDaraz()];

  // Deduplicate
  const seen = new Set();
  all = all.filter(p => {
    const key = p.title.toLowerCase().substring(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Filter out bogus products
  all = all.filter(p => p.title.length > 5 && p.price > 0);

  // Assign final IDs
  all.forEach((p, i) => {
    p.id = i + 1;
    p.currency = 'BDT';
    p.alt = p.title;
    p.ctaLabel = 'View deal';
    p.scrapedAt = new Date().toISOString();
  });

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(all, null, 2));
  console.log(`\n=== Done: ${all.length} live products saved ===`);
}

main().catch(console.error);
