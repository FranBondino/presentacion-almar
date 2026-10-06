const fs = require('fs');

async function inspectApiDetails() {
  const res = await fetch('https://developerportal.msc.com/api-details');
  const text = await res.text();
  console.log('Length:', text.length);
  // look for subscribe buttons or templates
  const matches = text.match(/(?:subscribe|subscription|primaryKey|secretKey|test-operation)[^<]{0,40}/gi) || [];
  console.log('Matches:', [...new Set(matches)]);
}

inspectApiDetails();
