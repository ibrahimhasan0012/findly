/**
 * api/search.js — Vercel serverless function
 * Proxies Google Custom Search API so keys stay server-side
 * Usage: /api/search?q=samsung+galaxy+s25
 */

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { q, start = 1 } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: 'Query too short' });
  }

  const key = process.env.GOOGLE_API_KEY;
  const cx  = process.env.GOOGLE_CX;

  if (!key || !cx) {
    return res.status(500).json({ error: 'Search not configured' });
  }

  try {
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', key);
    url.searchParams.set('cx', cx);
    url.searchParams.set('q', q.trim());
    url.searchParams.set('num', '10');
    url.searchParams.set('start', String(start));

    const response = await fetch(url.toString());
    const data     = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Google API error' });
    }

    // Normalize results for the frontend
    const items = (data.items || []).map(item => {
      // Try to extract price from snippet or title
      const priceMatch = (item.snippet + ' ' + item.title)
        .match(/৳\s*([\d,]+)|BDT\s*([\d,]+)|([\d,]+)\s*(?:taka|tk)/i);
      const price = priceMatch
        ? parseInt((priceMatch[1] || priceMatch[2] || priceMatch[3] || '0').replace(/,/g, ''), 10)
        : 0;

      return {
        title  : item.title.replace(/\s[-|–—].*$/, '').trim(),
        store  : new URL(item.link).hostname.replace('www.', ''),
        dealUrl: item.link,
        image  : item.pagemap?.cse_image?.[0]?.src
               || item.pagemap?.cse_thumbnail?.[0]?.src
               || '',
        price,
        snippet: item.snippet || '',
      };
    });

    return res.status(200).json({
      query     : q,
      totalResults: data.searchInformation?.totalResults || '0',
      items,
    });

  } catch (err) {
    console.error('Search error:', err);
    return res.status(500).json({ error: 'Search failed' });
  }
}
