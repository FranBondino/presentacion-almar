const fs = require('fs');

async function inspectBundle() {
  const res = await fetch('https://developer.maersk.com/assets/index-qyj8OXaU.js');
  const text = await res.text();
  console.log('Bundle length:', text.length);

  const matches = text.match(/https?:\/\/[a-zA-Z0-9.-]*maersk\.com[^\s"\'`]+/g) || [];
  const unique = [...new Set(matches)];
  console.log('Found Maersk URLs:');
  unique.forEach(u => console.log(' -', u));

  // Also search for /dcsa or /commercial or api endpoints
  const apiPaths = text.match(/["']\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)+["']/g) || [];
  const dcsaPaths = [...new Set(apiPaths.filter(p => p.includes('dcsa') || p.includes('schedule') || p.includes('track') || p.includes('booking')))];
  console.log('Found potential API paths:');
  dcsaPaths.forEach(p => console.log(' -', p));
}

inspectBundle();
