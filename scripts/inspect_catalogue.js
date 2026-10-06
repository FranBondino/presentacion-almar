const fs = require('fs');

async function inspectCatalogue() {
  const res = await fetch('https://developerportal.msc.com/api-catalogue');
  const text = await res.text();
  console.log('Length:', text.length);
  // look for API names or headings or buttons
  const apis = text.match(/(?:DCSA|Track|Schedule|Rate|Booking|Routing)[^<]{1,50}/gi) || [];
  console.log('APIs found in catalogue:', [...new Set(apis)]);
}

inspectCatalogue();
