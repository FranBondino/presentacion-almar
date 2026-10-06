const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Test at 1920x1080
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  
  const filePath = 'file://' + path.resolve(__dirname, '../presentacion-ejecutiva-almar.html').replace(/\\/g, '/');
  await page.goto(filePath, { waitUntil: 'networkidle0' });

  const totalSlides = await page.evaluate(() => document.querySelectorAll('.slide-item').length);
  console.log(`Checking ${totalSlides} slides at 1920x1080...`);

  const results = [];

  for (let i = 1; i <= totalSlides; i++) {
    await page.evaluate((n) => window.goToSlide(n), i);
    await new Promise(r => setTimeout(r, 200));

    const check = await page.evaluate((slideNum) => {
      const slide = document.querySelector(`.slide-item[data-slide="${slideNum}"]`);
      if (!slide) return { error: `Slide ${slideNum} not found` };

      const canvas = document.getElementById('slideCanvas');
      const canvasRect = canvas.getBoundingClientRect();
      const slideRect = slide.getBoundingClientRect();
      
      const slideBody = slide.querySelector('.slide-body');
      const bodyScrollHeight = slideBody ? slideBody.scrollHeight : 0;
      const bodyClientHeight = slideBody ? slideBody.clientHeight : 0;
      const bodyOverflow = bodyScrollHeight > bodyClientHeight + 1;

      // Find all elements inside slide and check if any are clipped by slide bounds
      const allElements = slide.querySelectorAll('*');
      const overflowElements = [];

      allElements.forEach(el => {
        // Skip hidden or zero-size
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;
        
        // Check if element has internal scroll overflow
        if (el.scrollHeight > el.clientHeight + 2 && el.clientHeight > 0) {
          // If it's not meant to scroll
          const overflowY = window.getComputedStyle(el).overflowY;
          if (overflowY !== 'auto' && overflowY !== 'scroll') {
            overflowElements.push({
              tag: el.tagName,
              className: el.className,
              scrollHeight: el.scrollHeight,
              clientHeight: el.clientHeight,
              diff: el.scrollHeight - el.clientHeight
            });
          }
        }

        // Check if element extends beyond the bottom of slideRect
        if (rect.bottom > slideRect.bottom + 2) {
          overflowElements.push({
            tag: el.tagName,
            className: el.className,
            bottom: rect.bottom,
            slideBottom: slideRect.bottom,
            exceedsBy: rect.bottom - slideRect.bottom
          });
        }
      });

      return {
        slideNum,
        slideTitle: slide.querySelector('.slide-title')?.textContent?.trim() || 'N/A',
        slideHeight: slideRect.height,
        slideWidth: slideRect.width,
        bodyScrollHeight,
        bodyClientHeight,
        bodyOverflow,
        overflowElementsCount: overflowElements.length,
        overflowElements: overflowElements.slice(0, 5) // top 5
      };
    }, i);

    results.push(check);

    // Save screenshot for visual audit
    const screenshotDir = path.resolve(__dirname, '../screenshots/slide_audit_1080p');
    if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
    
    // Screenshot of the slide canvas specifically
    const canvasHandle = await page.$('#slideCanvas');
    if (canvasHandle) {
      await canvasHandle.screenshot({
        path: path.join(screenshotDir, `canvas_slide_${String(i).padStart(2, '0')}.png`)
      });
    }
  }

  console.log('\n--- SLIDE AUDIT RESULTS ---');
  let hasAnyIssue = false;
  results.forEach(r => {
    const isCropped = r.bodyOverflow || r.overflowElementsCount > 0;
    if (isCropped) hasAnyIssue = true;
    const status = isCropped ? '❌ CROPPED / OVERFLOW' : '✅ BALANCED & FIT';
    console.log(`Slide ${String(r.slideNum).padStart(2, '0')} [${status}]: "${r.slideTitle}"`);
    if (r.bodyOverflow) {
      console.log(`   -> slide-body scrollHeight: ${r.bodyScrollHeight}px > clientHeight: ${r.bodyClientHeight}px (diff: ${r.bodyScrollHeight - r.bodyClientHeight}px)`);
    }
    if (r.overflowElementsCount > 0) {
      console.log(`   -> ${r.overflowElementsCount} overflow elements found:`, JSON.stringify(r.overflowElements, null, 2));
    }
  });

  await browser.close();
})();
