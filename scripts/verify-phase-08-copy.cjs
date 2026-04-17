#!/usr/bin/env node
/**
 * Phase 08 copy verifier (mirrors the deleted verify-phase-07-copy.cjs pattern).
 *
 * Reads apps/planner/src/lib/copy/es.ts as text and asserts every Phase-8 copy key is
 * present. Runs in CI to guard against regressions where a rename or merge loses a
 * Spanish copy key used by the Resumen screen / footer / persistence dialogs.
 *
 * Exits 1 with a diagnostic listing every missing marker if the file has drifted.
 */
const fs = require('node:fs');
const path = require('node:path');

const COPY_PATH = path.resolve(
  __dirname,
  '..',
  'apps/planner/src/lib/copy/es.ts',
);
const source = fs.readFileSync(COPY_PATH, 'utf8');

const REQUIRED_SUBSTRINGS = [
  // footer
  'footer: {',
  'datasetAria:',
  // resumen
  'resumen: {',
  'identityBlockHeading:',
  'progressionBlockHeading:',
  'skillsBlockHeading:',
  'columnLabels: {',
  'attribute:',
  'modifier:',
  'level:',
  'className:',
  'bab:',
  'fortitude:',
  'reflex:',
  'will:',
  'actions: {',
  'save:',
  'load:',
  'export:',
  'import:',
  'share:',
  // persistence
  'persistence: {',
  'saveDialog: {',
  'overwriteDialog: {',
  'loadDialog: {',
  'importError:',
  'importSuccess:',
  'saveSuccess:',
  'loadSuccess:',
  'privateModeUnavailable:',
  // 08-02 copy keys (share URL + version mismatch)
  'versionMismatch: {',
  'rulesetLabel:',
  'datasetLabel:',
  'downloadJson:',
  'shareError: {',
  'emptyPayload:',
  'invalidPayload:',
  'returnHome:',
  'shareLoading:',
  'shareSuccess:',
  'shareFallback:',
];

const missing = REQUIRED_SUBSTRINGS.filter((s) => !source.includes(s));
if (missing.length > 0) {
  console.error(
    'Phase 08 copy keys missing in apps/planner/src/lib/copy/es.ts:',
  );
  missing.forEach((s) => console.error('  - ' + s));
  process.exit(1);
}
console.log(
  `Phase 08 copy OK (${REQUIRED_SUBSTRINGS.length} markers present).`,
);
