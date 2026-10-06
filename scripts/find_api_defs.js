const fs = require('fs');

async function findApiDefs() {
  const apis = [
    'DPO-DCSACommercialSchedulesAPI-V1',
    'DPO-DCSABookingAPI-V1',
    'DPO-DCSATrackAndTrace-API-V2',
    'dpo-referential-api-v1'
  ];

  for (const api of apis) {
    const urls = [
      `https://developerportal.msc.com/api-details?api=${api}`,
      `https://developerportal.msc.com/docs/services/${api}/export?format=openapi`,
      `https://developerportal.msc.com/docs/services/${api}/export?format=swagger`,
      `https://ovhweportalapim.developer.azure-api.net/docs/services/${api}/export?format=openapi`
    ];
    for (const u of urls) {
      try {
        const res = await fetch(u);
        if (res.status === 200) {
          console.log(`Found: ${u} -> 200!`);
          const text = await res.text();
          console.log(text.slice(0, 200));
        }
      } catch(e) {}
    }
  }
}

findApiDefs();
