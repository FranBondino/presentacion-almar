async function testMscLive() {
  console.log("================================================================================");
  console.log("🚢 PRUEBA DE CONEXIÓN EN VIVO: MSC (Mediterranean Shipping Company)");
  console.log("   Ruta: Shanghai (CNSHA) ➔ Buenos Aires (ARBUE)");
  console.log("================================================================================\n");

  const url = new URL('https://portal.api.msc.com/dpo/ovconnectsch/routes/v1/sailingRoutes');
  url.searchParams.set('isIncludeLivePortCall', 'true');
  url.searchParams.set('datesRelated', 'POL');
  url.searchParams.set('fromPortUNCode', 'CNSHA');
  url.searchParams.set('toPortUNCode', 'ARBUE');
  url.searchParams.set('fromDate', '2026-09-15T00:00:00Z');
  url.searchParams.set('toDate', '2026-10-15T00:00:00Z');

  const t0 = Date.now();
  const res = await fetch(url.toString(), {
    headers: { 'Accept': 'application/json' }
  });
  const ms = Date.now() - t0;

  console.log(`⏱️ Tiempo de respuesta: ${ms} ms | Código HTTP: ${res.status} OK`);
  const data = await res.json();
  const txs = data.MSCSchedule?.Transactions || [];

  console.log(`✅ Opciones de buques encontradas: ${txs.length}\n`);

  txs.slice(0, 3).forEach((tx, idx) => {
    console.log(`--------------------------------------------------------------------------------`);
    console.log(`📦 OPCIÓN ${idx + 1}`);
    console.log(`--------------------------------------------------------------------------------`);
    (tx.Schedules || []).forEach((sch, sIdx) => {
      const legType = sIdx === 0 ? "Tramo Principal / Origen" : "Conexión / Transbordo";
      console.log(`  [${legType}]`);
      console.log(`  Buque:       ${sch.TransportationMeansName} (IMO: ${sch.IMONumber || 'N/A'})`);
      console.log(`  Viaje:       ${sch.Voyages?.[0]?.Description || 'TBN'}`);
      (sch.Calls || []).forEach(c => {
        const dateTypes = (c.CallDates || []).map(d => `${d.Type}: ${d.CallDateTime}`).join(' | ');
        console.log(`  * ${c.Type.padEnd(4)} ${c.Name.padEnd(25)} (${c.Code}): ${dateTypes}`);
      });
    });
    console.log();
  });
}

testMscLive();
