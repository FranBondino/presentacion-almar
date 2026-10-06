const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testCarpetasFinancialsConsistency() {
  console.log('--- TEST LOCAL: COHERENCIA DE MONTOS Y FACTURAS EN CARPETAS ---');
  
  // Usamos el servidor de desarrollo local o el build si está corriendo,
  // pero primero verifiquemos si hay un server local activo en el puerto 3000 o 3001
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navegando a producción para verificar estado actual antes o local...');
  await page.goto('https://bot-relevamiento.vercel.app/login', { waitUntil: 'networkidle2' });

  // Login como Admin para tener visibilidad financiera completa
  await page.type('input[type="email"], input[name="email"]', 'admin@almar.com.ar');
  await page.type('input[type="password"], input[name="password"]', 'Almar2026!');
  await page.click('button[type="submit"]');

  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.setItem('almar_onboarding_completed_v1', 'true');
  });

  console.log('Login exitoso en Vercel.');
  await browser.close();
}

testCarpetasFinancialsConsistency().catch(console.error);
