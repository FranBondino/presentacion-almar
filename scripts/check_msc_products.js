const fs = require('fs');

async function checkProducts() {
  const urls = [
    'https://developerportal.msc.com/products',
    'https://developerportal.msc.com/api-catalogue'
  ];

  for (const u of urls) {
    try {
      const res = await fetch(u);
      console.log(u, '-> Status:', res.status);
      const text = await res.text();
      const titles = text.match(/<h[2-4][^>]*>([^<]+)<\/h[2-4]>/gi) || [];
      console.log('Titles:', titles);
      const links = text.match(/href="[^"]*"/gi) || [];
      const prodLinks = links.filter(l => l.includes('product') || l.includes('api') || l.includes('catalogue'));
      console.log('ProdLinks:', prodLinks.slice(0, 15));
    } catch(e) {
      console.log('Err:', e.message);
    }
  }
}

checkProducts();
