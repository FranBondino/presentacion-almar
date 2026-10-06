const fs = require('fs');
let content = fs.readFileSync('portal/components/carpetas/CarpetaMailTimeline.tsx', 'utf8');

const map = {
  'COT_2026_00060_Acindar_Shanghai.pdf': '/facturas/COT_2026_00060_Acindar_Shanghai.pdf',
  'MSC_Invoice_0098_00041234.pdf': '/facturas/MSC_Invoice_0098_00041234.pdf',
  'COT_2026_00061_Siderar_Ningbo.pdf': '/facturas/COT_2026_00061_Siderar_Ningbo.pdf',
  '7554566633.PDF': '/facturas/7554566633.PDF',
  'COT_2026_00357_Paladini_Terrestre.pdf': '/facturas/COT_2026_00357_Paladini_Terrestre.pdf',
  '0004-00000303.PDF': '/facturas/0004-00000303.PDF',
  'COT_2026_00610_Vicentin_Aereo.pdf': '/facturas/COT_2026_00610_Vicentin_Aereo.pdf',
  'COT_2026_00226_Molinos_Santos.pdf': '/facturas/COT_2026_00226_Molinos_Santos.pdf',
  'COT_2026_00105_Albertoni_FCL.pdf': '/facturas/COT_2026_00105_Albertoni_FCL.pdf',
  '7555554402.PDF': '/facturas/7555554402.PDF',
  'COT_2026_00428_Bertot_Aereo.pdf': '/facturas/COT_2026_00428_Bertot_Aereo.pdf',
  'COT_2026_00067_Secco_Hamburg.pdf': '/facturas/COT_2026_00067_Secco_Hamburg.pdf',
  '261005130R.pdf': '/facturas/261005130R.pdf',
  'COT_2026_00457_Saprograf_Cartagena.pdf': '/facturas/COT_2026_00457_Saprograf_Cartagena.pdf',
  'COT_2026_00113_Juan_Cuello_LCL.pdf': '/facturas/COT_2026_00113_Juan_Cuello_LCL.pdf',
  'COT_2026_00018_CONICET_GBP.pdf': '/facturas/COT_2026_00018_CONICET_GBP.pdf',
};

for (const [name, url] of Object.entries(map)) {
  const regex = new RegExp(`(name:\\s*'${name}',[\\s\\S]*?url:\\s*)'[^']+'`, 'g');
  content = content.replace(regex, `$1'${url}'`);
}

fs.writeFileSync('portal/components/carpetas/CarpetaMailTimeline.tsx', content, 'utf8');
console.log('CarpetaMailTimeline.tsx updated successfully!');
