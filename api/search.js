/**
 * api/search.js — Vercel serverless function
 * Searches the local products index generated at build time
 * Usage: /api/search?q=samsung+galaxy+s25
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';

const productsCache = new Map();

async function loadProductsFromFile() {
  const filePath = path.join(process.cwd(), 'public', 'shopnot-inspired', 'data', 'products.json');
  const raw = await readFile(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

async function loadProductsFromOrigin(origin) {
  const url = new URL('/data/products.json', origin);
  const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Failed to load products (${response.status})`);
  const parsed = await response.json();
  return Array.isArray(parsed) ? parsed : [];
}

async function getProducts({ origin }) {
  const cacheKey = origin ? `origin:${origin}` : 'file';
  const cached = productsCache.get(cacheKey);
  if (cached) return cached;

  const p = (async () => {
    if (origin) return loadProductsFromOrigin(origin);
    return loadProductsFromFile();
  })().catch(err => {
    productsCache.delete(cacheKey);
    throw err;
  });

  productsCache.set(cacheKey, p);
  return p;
}

function localSearch(products, q, start, num) {
  const query = q.trim();
  const queryLower = query.toLowerCase();
  const tokens = (queryLower.match(/[a-z0-9]+/g) || []).filter(t => t.length >= 2);
  const uniqueTokens = [...new Set(tokens)];

  const scored = [];
  for (const p of products) {
    const title = String(p?.title || '');
    const store = String(p?.store || '');
    const category = String(p?.category || '');
    if (store.toLowerCase() === 'othoba') continue;
    const hay = `${title} ${store} ${category}`.toLowerCase();

    let tokenMatches = 0;
    for (const t of uniqueTokens) {
      if (hay.includes(t)) tokenMatches += 1;
    }
    if (uniqueTokens.length && tokenMatches === 0) continue;
    if (!uniqueTokens.length && !hay.includes(queryLower)) continue;

    let score = tokenMatches * 10;
    if (title.toLowerCase().includes(queryLower)) score += 25;
    if (store.toLowerCase().includes(queryLower)) score += 5;
    if (category.toLowerCase().includes(queryLower)) score += 3;

    scored.push({ p, score });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const ap = Number(a.p?.price || 0);
    const bp = Number(b.p?.price || 0);
    const aHasPrice = ap > 0;
    const bHasPrice = bp > 0;
    if (aHasPrice !== bHasPrice) return aHasPrice ? -1 : 1;
    if (aHasPrice && bHasPrice && ap !== bp) return ap - bp;
    return Number(a.p?.id || 0) - Number(b.p?.id || 0);
  });

  const safeStart = Math.max(1, Number.parseInt(String(start), 10) || 1);
  const safeNum = Math.min(20, Math.max(1, Number.parseInt(String(num), 10) || 10));
  const offset = safeStart - 1;

  const sliced = scored.slice(offset, offset + safeNum).map(x => ({
    ...x.p,
    snippet: x.p?.snippet || '',
  }));

  return {
    query,
    totalResults: String(scored.length),
    items: sliced,
    source: 'local',
  };
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { q, start = 1, num = 10 } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: 'Query too short' });
  }

  try {
    const protoHeader = req.headers?.['x-forwarded-proto'];
    const hostHeader = req.headers?.['x-forwarded-host'] || req.headers?.host;
    const origin = hostHeader ? `${protoHeader || 'https'}://${hostHeader}` : null;

    try {
      const products = await getProducts({ origin });
      return res.status(200).json(localSearch(products, q, start, num));
    } catch (originErr) {
      const products = await getProducts({ origin: null });
      return res.status(200).json(localSearch(products, q, start, num));
    }
  } catch (err) {
    console.error('Local search error:', err);
    return res.status(500).json({ error: 'Local search failed' });
  }
}
