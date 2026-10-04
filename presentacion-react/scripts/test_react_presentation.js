/**
 * Runner de pruebas E2E para presentacion-react (ES Module)
 * Invoca el test suite canónico ubicado en `scripts/test_presentacion_react.js`.
 */

import { fileURLToPath } from 'url';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testSuitePath = path.resolve(__dirname, '../../scripts/test_presentacion_react.js');

try {
  const { runReactPresentationTestSuite } = require(testSuitePath);
  runReactPresentationTestSuite().catch((err) => {
    console.error('Error fatal durante la ejecución de la suite de pruebas:', err);
    process.exit(1);
  });
} catch (e) {
  console.error('No se pudo cargar el script de pruebas desde:', testSuitePath, e);
  process.exit(1);
}
