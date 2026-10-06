const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 950 });
    
    const filePath = 'file:///' + 'C:/Users/franc/relev-adm/index.html'.replace(/\\/g, '/');
    console.log('Opening:', filePath);
    await page.goto(filePath, { waitUntil: 'load' });
    
    const title = await page.title();
    const phases = await page.$$eval('.phase-block', els => els.map(e => e.querySelector('.phase-title').innerText));
    const textareas = await page.$$eval('textarea.q-notes-box', els => els.length);
    const checkboxes = await page.$$eval('input[type="checkbox"]', els => els.length);
    const images = await page.$$eval('img', els => els.map(i => ({ srcPrefix: i.src.slice(0, 30), width: i.naturalWidth, height: i.naturalHeight })));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

    console.log('Page Title:', title);
    console.log('Total Phases Found:', phases.length);
    phases.forEach((p, idx) => console.log(`  Phase ${idx + 1}: ${p}`));
    console.log('Total Textareas:', textareas);
    console.log('Total Checkboxes:', checkboxes);
    console.log('Images Rendered:', images);
    console.log('Horizontal Overflow (> 1280px):', overflow);

    await page.screenshot({ path: 'test_relev_v2_top.png', clip: { x: 0, y: 0, width: 1280, height: 950 } });
    console.log('Screenshot saved: test_relev_v2_top.png');

    await browser.close();
    console.log('✅ Audit finished successfully!');
  } catch (err) {
    console.error('Error during audit:', err);
    process.exit(1);
  }
})();
