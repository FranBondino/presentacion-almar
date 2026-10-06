const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function verifyInBrowser() {
  const filePath = 'C:\\Users\\franc\\Downloads\\ALMAR - Guia de Relevamiento Administracion y Facturacion - Clave.html';
  console.log('Verifying HTML in Puppeteer Chrome:', filePath);

  if (!fs.existsSync(filePath)) {
    throw new Error('File does not exist: ' + filePath);
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));

  await page.goto('file:///' + filePath.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });

  // Evaluate page structure
  const audit = await page.evaluate(() => {
    const questions = document.querySelectorAll('.q-card');
    const imgDiagram = document.querySelector('.diagram-container img');
    const tables = document.querySelectorAll('table.clave-table');
    const textareas = document.querySelectorAll('.q-notes-box');

    return {
      totalQuestions: questions.length,
      diagramPresent: !!imgDiagram,
      diagramNaturalWidth: imgDiagram ? imgDiagram.naturalWidth : 0,
      diagramNaturalHeight: imgDiagram ? imgDiagram.naturalHeight : 0,
      totalTables: tables.length,
      totalTextareas: textareas.length,
      title: document.title,
      containerScrollWidth: document.querySelector('.document-container').scrollWidth,
      containerClientWidth: document.querySelector('.document-container').clientWidth
    };
  });

  console.log('AUDIT RESULTS:');
  console.log('Total Questions found:', audit.totalQuestions);
  console.log('Diagram Natural Dimensions:', audit.diagramNaturalWidth, 'x', audit.diagramNaturalHeight);
  console.log('Total Tables:', audit.totalTables);
  console.log('Total Textareas:', audit.totalTextareas);
  console.log('Container Width Fit:', audit.containerScrollWidth === audit.containerClientWidth ? 'PERFECT FIT (No overflow)' : 'OVERFLOW DETECTED');

  // Capture Screenshots
  // 1. Top Section & Header
  await page.screenshot({
    path: 'relevamiento_top_section.png',
    clip: { x: 150, y: 0, width: 980, height: 750 }
  });
  console.log('Captured: relevamiento_top_section.png');

  // 2. Diagram & Actor Table Section
  const diagramElem = await page.$('.diagram-container');
  if (diagramElem) {
    const box = await diagramElem.boundingBox();
    await page.screenshot({
      path: 'relevamiento_diagram_section.png',
      clip: { x: 150, y: Math.max(0, box.y - 40), width: 980, height: box.height + 350 }
    });
    console.log('Captured: relevamiento_diagram_section.png');
  }

  // 3. Questions Section
  const firstQ = await page.$('.q-card');
  if (firstQ) {
    const qBox = await firstQ.boundingBox();
    await page.screenshot({
      path: 'relevamiento_questions_section.png',
      clip: { x: 150, y: Math.max(0, qBox.y - 60), width: 980, height: 750 }
    });
    console.log('Captured: relevamiento_questions_section.png');
  }

  await browser.close();
  console.log('Browser visual verification completed successfully!');
}

verifyInBrowser().catch(err => {
  console.error('Browser verification failed:', err);
  process.exit(1);
});
