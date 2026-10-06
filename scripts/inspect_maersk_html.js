const fs = require('fs');

async function inspectHtml() {
  const res = await fetch('https://developer.maersk.com');
  const text = await res.text();
  console.log(text);
}

inspectHtml();
