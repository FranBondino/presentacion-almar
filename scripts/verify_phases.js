const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 950 });
    
    const filePath = 'file:///' + 'C:/Users/franc/relev-adm/index.html'.replace(/\\/g, '/');
    await page.goto(filePath, { waitUntil: 'load' });
    
    // Phase 4
    await page.evaluate(() => {
      const el = document.getElementById('fase-4');
      if (el) el.scrollIntoView();
    });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: 'test_relev_v2_phase4.png' });
    console.log('Saved test_relev_v2_phase4.png');

    // Phase 6
    await page.evaluate(() => {
      const el = document.getElementById('fase-6');
      if (el) el.scrollIntoView();
    });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: 'test_relev_v2_phase6.png' });
    console.log('Saved test_relev_v2_phase6.png');

    await browser.close();
  } catch (err) {
    console.error('Error:', err);
  }
})();
