# Findly BD

Findly is a minimalist aggregator of tech deals and products from top tech retailers in Bangladesh. It actively monitors leading e-commerce platforms and stores including Star Tech, Ryans, TechLand BD, Computer Village, Global Brand, and more.

## Features
- Minimalist, fast design inspired by ShopNot.co
- Automatic daily deal fetching via GitHub Actions
- Price tracking and deal discovery
- Hosted statically on GitHub Pages

## Automated Updates
Live products are fetched via `scripts/fetch-deals.js` running on a scheduled GitHub Actions cron job every 6 hours, which commits the new `products.json` file back to the repository and deploys to GitHub Pages.

## Development

1. `npm install`
2. `npm run preview:shopnot` to run the local dev server
3. `npm run fetch-deals` to manually run the live scraper locally
