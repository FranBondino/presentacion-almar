const fs = require('fs');

async function inspectMainBundle() {
  const res = await fetch('https://developer.maersk.com/assets/index-DWVaTjc5.js');
  const text = await res.text();
  console.log('Bundle length:', text.length);

  const matches = text.match(/https?:\/\/[a-zA-Z0-9.-]*maersk\.[a-z]+[^\s"\'`]+/g) || [];
  const unique = [...new Set(matches)];
  console.log('Found Maersk URLs:');
  unique.forEach(u => console.log(' -', u));

  // Look for API endpoints definitions
  const endpoints = text.match(/\/api\/[a-zA-Z0-9_\-\/]+/g) || [];
  const uniqueEndpoints = [...new Set(endpoints)];
  console.log('Found API endpoints:');
  uniqueEndpoints.forEach(e => console.log(' -', e));
}

inspectMainBundle();
