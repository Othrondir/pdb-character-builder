/* eslint-disable */
/**
 * Phase-07.1 copy verifier. Confirms that:
 *  - shellCopyEs.stepper.openNav exists with Spanish label.
 *  - shellCopyEs.stepper.closeNav exists with Spanish label.
 */
const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const esPath = path.join(repoRoot, 'apps', 'planner', 'src', 'lib', 'copy', 'es.ts');
const es = fs.readFileSync(esPath, 'utf8');

let failed = false;

// Both keys must appear inside a stepper: { ... } block.
if (!/stepper:\s*\{[\s\S]*?openNav:\s*'[^']+'/m.test(es)) {
  console.error("FAIL: shellCopyEs.stepper.openNav missing or not a string literal");
  failed = true;
}
if (!/stepper:\s*\{[\s\S]*?closeNav:\s*'[^']+'/m.test(es)) {
  console.error("FAIL: shellCopyEs.stepper.closeNav missing or not a string literal");
  failed = true;
}

if (failed) process.exit(1);
console.log('OK: phase-07.1 copy verification passed');
