import axios from 'axios';
import * as cheerio from 'cheerio';

const STORE_URLS = [
  'https://www.ryanscomputers.com/category/monitor',
  'https://www.skyland.com.bd/components/monitor',
  'https://www.pchouse.com.bd/monitor',
  'https://www.applegadgetsbd.com/product-category/smartphones/apple',
  'https://www.custommacbd.com/collections/macbook-pro',
  'https://www.bdshop.com/gadget',
  'https://gadgetandgear.com/category/smart-watch',
  'https://www.pickaboo.com/smartphones',
  'https://motionview.com.bd/category/smart-watch'
];

const SELECTORS = '.product-layout, .p-item, .product-thumb, .product, .product-card, .wd-product, li.product, .oe_product, .product-item, .col-6.col-md-4.col-xl-3';

async function verify() {
  for (const url of STORE_URLS) {
    try {
      const response = await axios.get(url, { headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }});
      const $ = cheerio.load(response.data);
      let count = 0;
      $(SELECTORS).each((_, el) => { count++; });
      console.log(`[${url}] Match Count: ${count}`);
      if(count === 0) {
        console.log($('body').text().substring(0, 50)); // basic check
      }
    } catch(e) {
      console.log(`[${url}] Error: ${e.message}`);
    }
  }
}
verify();
