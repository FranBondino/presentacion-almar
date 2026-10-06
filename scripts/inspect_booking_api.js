const fs = require('fs');

async function inspectBookingApi() {
  const url = 'https://developerportal.msc.com/api-details?api=DPO-DCSABookingAPI-V1';
  const res = await fetch(url);
  const text = await res.text();
  console.log('Booking API HTML length:', text.length);
  // Search for operations or endpoints
  const matches = text.match(/(?:GET|POST|PUT|DELETE)\s+[^\s<"]+/gi) || [];
  console.log('Operations:', matches);
  const paths = text.match(/\/dpo\/[a-zA-Z0-9_\-\/]+/gi) || [];
  console.log('DPO paths:', [...new Set(paths)]);
}

inspectBookingApi();
