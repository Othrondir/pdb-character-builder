/* eslint-disable */
/**
 * Phase-07 copy verifier. Confirms that:
 *  - shellCopyEs.magic.* namespace contains every required key from UI-SPEC.
 *  - shellCopyEs.stepper.levelSubSteps.spells label changed to 'Magia'.
 *  - shellCopyEs.stepper.sheetTabs.spells label still 'Conjuros'.
 *  - No `shellCopyEs as any` or `shellCopyEs as unknown as { magic?` leaks
 *    remain in apps/planner/src/features/magic/.
 */
const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const esPath = path.join(repoRoot, 'apps', 'planner', 'src', 'lib', 'copy', 'es.ts');
const es = fs.readFileSync(esPath, 'utf8');

const required = [
  'domainsStepTitle',
  'spellbookStepTitle',
  'knownSpellsStepTitle',
  'preparedStepTitle',
  'noCastingStepTitle',
  'addToSpellbook',
  'removeFromSpellbook',
  'learnSpell',
  'swapSpell',
  'missingDescription',
  'missingGrants',
  'validationLegal',
  'validationRepair',
  'validationIllegal',
  'rejectionPrefixHard',
  'slotOverflow',
  'knownOverflow',
  'domainMismatch',
  'domainGrantHeading',
  'domainBonusSpellsHeading',
  'preparedCasterInfo',
  'repairCalloutBanner',
];

let failed = false;

for (const key of required) {
  if (!es.includes(key)) {
    console.error('MISSING key:', key);
    failed = true;
  }
}

// The magic namespace MUST contain `spells: 'Magia'` inside levelSubSteps.
if (!/levelSubSteps[\s\S]*?spells:\s*'Magia'/m.test(es)) {
  console.error("FAIL: levelSubSteps.spells must be 'Magia'");
  failed = true;
}

// The sheet-tab label MUST remain 'Conjuros'.
if (!/sheetTabs[\s\S]*?spells:\s*'Conjuros'/m.test(es)) {
  console.error("FAIL: sheetTabs.spells must still be 'Conjuros'");
  failed = true;
}

// Scan magic feature folder for forbidden cast patterns. Use fs.readdir +
// read so we never shell out to grep — works identically on Windows + Linux.
const magicDir = path.join(
  repoRoot,
  'apps',
  'planner',
  'src',
  'features',
  'magic',
);
const forbidden = [
  /shellCopyEs\s+as\s+any/,
  /shellCopyEs\s+as\s+unknown\s+as\s*\{\s*magic\??/,
];

for (const entry of fs.readdirSync(magicDir)) {
  if (!entry.endsWith('.tsx') && !entry.endsWith('.ts')) continue;
  const full = path.join(magicDir, entry);
  const src = fs.readFileSync(full, 'utf8');
  for (const re of forbidden) {
    if (re.test(src)) {
      console.error(`FAIL: forbidden cast pattern ${re} found in ${entry}`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log('OK: phase-07 copy verification passed');
