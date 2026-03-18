import axios from 'axios';
import * as cheerio from 'cheerio';

const URLS = [
  'https://www.startech.com.bd/laptop',
  'https://www.techlandbd.com/shop-laptop-computer',
  'https://www.pchouse.com.bd/laptop'
];

async function test() {
  for (const url of URLS) {
    try {
      const response = await axios.get(url, { headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }, timeout: 15000 });
      const $ = cheerio.load(response.data);
      const selectors = '.product-layout, .p-item, .product-thumb, .product, .product-card, .wd-product, li.product, .oe_product, .product-item, .col-6.col-md-4.col-xl-3, .single-product-item, .product-miniature';
      const items = $(selectors);
      console.log(`[${url}] MATCHED: ${items.length} items`);
      
      if (items.length > 0) {
          const card = $(items[0]);
          const title = card.find('.name a, .product-name, .product-title a, h2 a, h3 a, .wd-entities-title a, .p-item-name a, .woocommerce-loop-product__title, .title a, a h2').first().text().trim();
          const priceText = card.find('.price-new, .p-item-price, .price, .regular-price, .amount, .ooOxS, span.price, .p-price').first().text();
          console.log(`  Sample Title: ${title}`);
          console.log(`  Sample Price Text: ${priceText}`);
      } else {
        console.log('  NO ITEMS FOUND. Printing body start:', $('body').text().substring(0, 100));
      }
    } catch(e) {
      console.log(`[${url}] Error: ${e.message}`);
    }
  }
}
test();
