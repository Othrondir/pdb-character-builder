#!/usr/bin/env node
// Phase 12.4-08 — hand-patch compiled-feats.ts to add parameterizedFeatFamily
// to each family variant (Soltura con una habilidad / escuela de magia / arma,
// Soltura mayor con..., Especialización en arma). Mirrors the runtime
// detectFamily() logic in packages/data-extractor/src/assemblers/feat-assembler.ts
// — next `pnpm extract` run will regenerate the same field via detectFamily().
//
// Strategy: parse compiled-feats.ts as text, walk the `feats` array via a
// simple state machine that tracks `label`, `sourceRow`, and the {…} boundary,
// then splice `parameterizedFeatFamily: { canonicalId, groupKey, paramLabel }`
// BEFORE the `prerequisites:` key (preserves alphabetical ordering).

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const FILE = resolve(
  process.cwd(),
  'apps/planner/src/data/compiled-feats.ts',
);

const FAMILIES = [
  {
    re: /^Soltura\s+mayor\s+con\s+una\s+escuela\s+de\s+magia\s*\(/i,
    canonicalId: 'feat:greater-spell-focus',
    groupKey: 'feat:greater-spell-focus',
    paramLabel: 'escuela de magia',
  },
  {
    re: /^Soltura\s+mayor\s+con\s+un\s+arma\s*\(/i,
    canonicalId: 'feat:greater-weapon-focus',
    groupKey: 'feat:greater-weapon-focus',
    paramLabel: 'arma',
  },
  {
    re: /^Soltura\s+con\s+una\s+habilidad\s*\(/i,
    canonicalId: 'feat:skill-focus',
    groupKey: 'feat:skill-focus',
    paramLabel: 'habilidad',
  },
  {
    re: /^Soltura\s+con\s+una\s+escuela\s+de\s+magia\s*\(/i,
    canonicalId: 'feat:spell-focus',
    groupKey: 'feat:spell-focus',
    paramLabel: 'escuela de magia',
  },
  {
    re: /^Soltura\s+con\s+un\s+arma\s*\(/i,
    canonicalId: 'feat:weapon-focus',
    groupKey: 'feat:weapon-focus',
    paramLabel: 'arma',
  },
  {
    re: /^Especializaci[oó]n\s+en\s+armas?\s*\(/i,
    canonicalId: 'feat:weapon-specialization',
    groupKey: 'feat:weapon-specialization',
    paramLabel: 'arma',
  },
];

function detectFamily(label) {
  for (const fam of FAMILIES) {
    if (fam.re.test(label)) return fam;
  }
  return null;
}

const src = readFileSync(FILE, 'utf8');
const lines = src.split('\n');

const out = [];
let patched = 0;
let scanned = 0;

let i = 0;
while (i < lines.length) {
  const line = lines[i];
  // Detect start of a feat object: a line that is exactly `    {` inside the
  // feats array. Peek ahead for the `"label": "..."` line (the feat object
  // always emits keys alphabetically: allClassesCanUse, category,
  // description, id, label, prerequisites, sourceRow).
  if (/^\s{4}\{\s*$/.test(line)) {
    // Collect the block until its matching closing brace at same indent
    const block = [line];
    let j = i + 1;
    let depth = 1;
    while (j < lines.length && depth > 0) {
      const l = lines[j];
      block.push(l);
      // Balance braces on THIS line only in a lightweight way:
      //   +1 for every `{` that is NOT inside a string literal,
      //   -1 for every `}` that is NOT inside a string literal.
      // The generator emits single-quoted JSON-ish keys inside ""; none of
      // the values we care about contain unmatched braces.
      for (let k = 0; k < l.length; k++) {
        const ch = l[k];
        if (ch === '"') {
          // skip string
          k++;
          while (k < l.length && l[k] !== '"') {
            if (l[k] === '\\') k++;
            k++;
          }
          continue;
        }
        if (ch === '{') depth++;
        else if (ch === '}') depth--;
      }
      j++;
    }

    // block now runs from lines[i]..lines[j-1] inclusive. Look for `"label":`
    // and `"sourceRow":` lines. Only process the block if it contains both
    // AND we haven't already patched it (idempotent).
    let labelMatch = null;
    let prereqIdx = -1;
    let hasFamily = false;
    for (let k = 0; k < block.length; k++) {
      const bl = block[k];
      const m = bl.match(/^\s*"label":\s*"((?:[^"\\]|\\.)*)"/);
      if (m) labelMatch = m[1];
      if (/^\s*"parameterizedFeatFamily":/.test(bl)) hasFamily = true;
      if (/^\s*"prerequisites":/.test(bl) && prereqIdx === -1) prereqIdx = k;
    }

    if (labelMatch) {
      scanned++;
      const fam = detectFamily(labelMatch);
      if (fam && !hasFamily && prereqIdx !== -1) {
        // Splice a new line BEFORE the prerequisites line.
        // Match the indent of the prerequisites line.
        const prereqLine = block[prereqIdx];
        const indent = prereqLine.match(/^(\s*)/)[1];
        const insert =
          `${indent}"parameterizedFeatFamily": {\n` +
          `${indent}  "canonicalId": "${fam.canonicalId}",\n` +
          `${indent}  "groupKey": "${fam.groupKey}",\n` +
          `${indent}  "paramLabel": "${fam.paramLabel}"\n` +
          `${indent}},`;
        block.splice(prereqIdx, 0, insert);
        patched++;
      }
    }

    // Emit the (possibly patched) block.
    for (const bl of block) out.push(bl);
    i = j;
    continue;
  }

  out.push(line);
  i++;
}

writeFileSync(FILE, out.join('\n'), 'utf8');
console.log(
  `compiled-feats.ts: scanned ${scanned} feat objects, patched ${patched} family variants.`,
);
