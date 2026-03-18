import fs from 'fs';

try {
  const data = JSON.parse(fs.readFileSync('C:/Users/User/Downloads/AMCS 261/public/shopnot-inspired/data/products.json', 'utf8'));
  const categoryCounts = {};
  data.forEach(p => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  });
  console.log("Total Products:", data.length);
  console.log("Category Breakdown:");
  for (const [cat, count] of Object.entries(categoryCounts).sort((a,b) => b[1] - a[1])) {
    console.log(`- ${cat}: ${count}`);
  }
} catch(e) {
  console.log("Error reading file:", e.message);
}
