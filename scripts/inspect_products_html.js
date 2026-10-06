const fs = require('fs');

async function inspectProductsHtml() {
  const res = await fetch('https://developerportal.msc.com/products');
  const text = await res.text();
  console.log('Length:', text.length);
  // look for any data or scripts or links
  const matches = text.match(/<a[^>]+href="([^"]+)"[^>]*>([^<]*)<\/a>/gi) || [];
  console.log('Links found:', matches);
  // look for text inside article or main
  const bodyClean = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  console.log('Clean text:', bodyClean.slice(0, 1000));
}

inspectProductsHtml();
