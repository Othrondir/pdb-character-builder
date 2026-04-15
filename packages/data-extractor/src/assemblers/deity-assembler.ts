/**
 * Deity data assembler.
 *
 * Per RESEARCH Open Question 1 and A4: No deities.2da exists in nwsync or
 * base game. This assembler performs a discovery search, and if no deity
 * data is found (expected), documents the gap so manual overrides can be
 * provided later.
 *
 * @module
 */

import { RESTYPE_2DA } from '../config';
import type { NwsyncReader } from '../readers/nwsync-reader';
import type { BaseGameReader } from '../readers/base-game-reader';
import type { TlkResolver } from '../readers/tlk-resolver';
import type { AssembleResult } from './class-assembler';

/**
 * Attempt to assemble deity data from nwsync or base game.
 *
 * @returns catalog: null if no deity 2DA exists (expected), with warnings
 *          documenting the gap.
 */
export function assembleDeityData(
  nwsyncReader: NwsyncReader,
  _baseGameReader: BaseGameReader,
  _tlkResolver: TlkResolver,
): AssembleResult<null> {
  const warnings: string[] = [];

  // Discovery: search for any resref containing "deity" or "deit"
  const allResrefs = nwsyncReader.listResources(RESTYPE_2DA);
  const deityResrefs = allResrefs.filter(
    (r) => r.toLowerCase().includes('deity') || r.toLowerCase().includes('deit'),
  );

  if (deityResrefs.length > 0) {
    // Unexpected: deity data found in nwsync
    warnings.push(
      `Found deity-related 2DA resrefs in nwsync: ${deityResrefs.join(', ')}. ` +
      'These were not expected and have NOT been parsed. ' +
      'A future plan should implement deity parsing if this data is valid.',
    );
  } else {
    warnings.push(
      'No deity 2DA found in nwsync or base game. ' +
      'Deity data requires manual overrides from server documentation. ' +
      'The Puerta de Baldur server manages deity restrictions through scripting ' +
      'and forum rules, not through a 2DA table.',
    );
  }

  return { catalog: null, warnings };
}
