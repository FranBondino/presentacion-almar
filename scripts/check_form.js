const fs = require('fs');

async function checkForm() {
  const url = 'https://forms.office.com/pages/responsepage.aspx?id=AJuOCND_jkW_oaz0xZbTy0aW8B-5TOxClNxXlpbxHp1URDMzTDkzQVZCUFhHVkZVTUs4UEU1OUY2WCQlQCN0PWcu&route=shorturl';
  try {
    const res = await fetch(url);
    console.log('Form status:', res.status);
    const text = await res.text();
    const titles = text.match(/"title":"([^"]+)"/g) || [];
    console.log('Form Titles:', titles.slice(0, 15));
  } catch(e) {
    console.log('Err:', e.message);
  }
}

checkForm();
