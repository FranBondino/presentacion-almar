const fs = require('fs');

async function inspectForm() {
  const url = 'https://forms.office.com/pages/responsepage.aspx?id=AJuOCND_jkW_oaz0xZbTy0aW8B-5TOxClNxXlpbxHp1URDMzTDkzQVZCUFhHVkZVTUs4UEU1OUY2WCQlQCN0PWcu&route=shorturl';
  try {
    const res = await fetch(url);
    const text = await res.text();
    fs.writeFileSync('scripts/msc_form_raw.html', text);
    console.log('Saved raw HTML, length:', text.length);

    // Search for JSON payloads in page
    const regex = /"formTitle":\s*"([^"]+)"/g;
    let m = regex.exec(text);
    if (m) console.log('Form Title:', m[1]);

    // Search for questions
    const qRegex = /"title":\s*"([^"]+)"/g;
    let match;
    const questions = [];
    while ((match = qRegex.exec(text)) !== null) {
      questions.push(match[1]);
    }
    console.log('Questions found:', questions);
  } catch(e) {
    console.log('Err:', e.message);
  }
}

inspectForm();
