const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const filePath = 'file://' + path.resolve(__dirname, '../presentacion-ejecutiva-almar.html').replace(/\\/g, '/');

  const resolutions = [
    { name: '1366x768 (Standard Laptop)', width: 1366, height: 768 },
    { name: '1280x720 (720p Projector)', width: 1280, height: 720 },
    { name: '1600x900 (HD+ Laptop)', width: 1600, height: 900 }
  ];

  for (const res of resolutions) {
    console.log(`\n========================================`);
    console.log(`TESTING RESOLUTION: ${res.name}`);
    console.log(`========================================`);
    
    await page.setViewport({ width: res.width, height: res.height, deviceScaleFactor: 1 });
    await page.goto(filePath, { waitUntil: 'networkidle0' });

    const totalSlides = await page.evaluate(() => document.querySelectorAll('.slide-item').length);

    for (let i = 1; i <= totalSlides; i++) {
      await page.evaluate((n) => window.goToSlide(n), i);
      await new Promise(r => setTimeout(r, 100));

      const check = await page.evaluate((slideNum) => {
        const slide = document.querySelector(`.slide-item[data-slide="${slideNum}"]`);
        const slideBody = slide.querySelector('.slide-body');
        const bodyScrollHeight = slideBody ? slideBody.scrollHeight : 0;
        const bodyClientHeight = slideBody ? slideBody.clientHeight : 0;
        const bodyOverflow = bodyScrollHeight > bodyClientHeight + 1;

        // Check if any visible text or content element overflows
        const allElements = slide.querySelectorAll('.slide-body *');
        let clippedCount = 0;
        const clippedList = [];

        allElements.forEach(el => {
          if (el.tagName === 'svg' || el.tagName === 'path') return;
          if (el.scrollHeight > el.clientHeight + 2 && el.clientHeight > 0) {
            const overflowY = window.getComputedStyle(el).overflowY;
            if (overflowY !== 'auto' && overflowY !== 'scroll') {
              clippedCount++;
              clippedList.push({
                tag: el.tagName,
                className: el.className,
                diff: el.scrollHeight - el.clientHeight
              });
            }
          }
        });

        return {
          slideNum,
          bodyScrollHeight,
          bodyClientHeight,
          bodyOverflow,
          clippedCount,
          clippedList: clippedList.slice(0, 3)
        };
      }, i);

      if (check.bodyOverflow || check.clippedCount > 0) {
        console.log(`❌ Slide ${String(i).padStart(2, '0')}: OVERFLOW DETECTED! Body diff: ${check.bodyScrollHeight - check.bodyClientHeight}px, Clipped elements: ${check.clippedCount}`);
        if (check.clippedList.length > 0) {
          console.log('   Clipped sample:', JSON.stringify(check.clippedList));
        }
      } else {
        console.log(`✅ Slide ${String(i).padStart(2, '0')}: OK`);
      }
    }
  }

  await browser.close();
})();
