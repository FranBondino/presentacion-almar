const fs = require('fs');

const content = fs.readFileSync('portal/components/carpetas/CarpetaMailTimeline.tsx', 'utf8');

const carpetas = ['C1234', 'C1434', 'IT1486', 'C1482', 'C1024', 'TL1436', 'C1289', 'EA1561', 'C1471', 'C1056', 'C367', 'C620'];

const out = [];
function log(...args) {
  out.push(args.join(' '));
  console.log(...args);
}

carpetas.forEach(code => {
  log('================================================================');
  log('CARPETA:', code);
  
  // 1. ACTORS
  const aStart = content.indexOf('export const CARPETA_ACTORS_MAP');
  const aKey = content.indexOf(code + ': [', aStart);
  let aEnd = content.indexOf('],', aKey);
  if (aEnd === -1) aEnd = content.indexOf('};', aKey);
  const aBlock = content.slice(aKey, aEnd);
  
  const actorMatches = [...aBlock.matchAll(/rol:\s*'([^']+)'[\s\S]*?nombre:\s*'([^']+)'[\s\S]*?email:\s*'([^']+)'[\s\S]*?entidad:\s*'([^']+)'[\s\S]*?tipo:\s*'([^']+)'/g)];
  log('ACTORES (' + actorMatches.length + '):');
  actorMatches.forEach((a, i) => {
    log(`  ${i+1}. [${a[5]}] ${a[1]}: ${a[2]} <${a[3]}> (${a[4]})`);
  });

  // 2. MAILS
  const mStart = content.indexOf('export const CARPETA_MAILS_MAP');
  const mKey = content.indexOf(code + ': [', mStart);
  let arrayDepth = 0;
  let mArrayStart = content.indexOf('[', mKey);
  let mArrayEnd = -1;
  for (let i = mArrayStart; i < content.length; i++) {
    if (content[i] === '[') arrayDepth++;
    else if (content[i] === ']') {
      arrayDepth--;
      if (arrayDepth === 0) {
        mArrayEnd = i;
        break;
      }
    }
  }
  const mBlock = content.slice(mArrayStart, mArrayEnd + 1);
  const ids = [...mBlock.matchAll(/id:\s*'([^']+)'/g)].map(m => m[1]);
  log('CORREOS (' + ids.length + '):');
  
  ids.forEach((id, i) => {
    const idPos = mBlock.indexOf("'" + id + "'");
    const nextIdPos = mBlock.indexOf("id: '", idPos + 10);
    const sub = mBlock.slice(idPos, nextIdPos > 0 ? nextIdPos : undefined);
    
    const fromM = sub.match(/from:\s*'([^']+)'/);
    const fromNameM = sub.match(/fromName:\s*'([^']+)'/);
    const toM = sub.match(/to:\s*\[([\s\S]*?)\]/);
    const subjM = sub.match(/subject:\s*'([^']+)'/);
    const dateM = sub.match(/date:\s*'([^']+)'/);
    const codeM = sub.match(/codigoCotizacion:\s*'([^']+)'/);
    const bodyM = sub.match(/bodyExcerpt:\s*\n\s*'([^']+)'/);
    const attM = sub.match(/name:\s*'([^']+)'/);
    const attUrlM = sub.match(/url:\s*'([^']+)'/);

    log(`  Email ${i+1}: ID: ${id}`);
    log(`    Fecha: ${dateM ? dateM[1] : 'N/A'}`);
    log(`    De: ${fromM ? fromM[1] : 'N/A'} (${fromNameM ? fromNameM[1] : 'N/A'})`);
    log(`    Para: ${toM ? toM[1].replace(/\s+/g, ' ').trim() : 'N/A'}`);
    log(`    Asunto: ${subjM ? subjM[1] : 'N/A'}`);
    if (codeM) log(`    Cotización Vinculada: ${codeM[1]}`);
    if (attM) log(`    Adjunto: ${attM[1]} (${attUrlM ? attUrlM[1] : ''})`);
    if (bodyM) log(`    Cita: "${bodyM[1].slice(0, 100)}..."`);
  });
});

fs.writeFileSync('scripts/timeline_audit_output.txt', out.join('\n'), 'utf8');
console.log('Saved to scripts/timeline_audit_output.txt (UTF-8)');
