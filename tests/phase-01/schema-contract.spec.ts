import { describe, expect, it } from 'vitest';

import {
  canonicalRecordSchema,
  type SourceAnchor,
} from '../../packages/data-extractor/src/contracts/canonical-record';
import {
  EVIDENCE_PRECEDENCE,
  MECHANICS_PRECEDENCE,
  isRuntimeTruthSource,
  resolveMechanicsLayer,
} from '../../packages/data-extractor/src/contracts/source-precedence';
import { canonicalIdRegex } from '../../packages/rules-engine/src/contracts/canonical-id';

const baseAnchor: SourceAnchor = {
  layer: 'base-game',
  rowIndex: 0,
};

describe('VALI-04 canonical schema contract', () => {
  it('accepts stable canonical IDs and rejects display labels as IDs', () => {
    const acceptedIds = [
      'feat:289',
      'class:5',
      'rule:heavy-armor-tumble-block',
    ];

    for (const id of acceptedIds) {
      expect(canonicalIdRegex.test(id)).toBe(true);

      const result = canonicalRecordSchema.safeParse({
        id,
        kind: id.split(':', 1)[0],
        sourceAnchors: [baseAnchor],
      });

      expect(result.success).toBe(true);
    }

    expect(canonicalIdRegex.test('Golpe divino')).toBe(false);
    expect(
      canonicalRecordSchema.safeParse({
        id: 'Golpe divino',
        kind: 'feat',
        sourceAnchors: [baseAnchor],
      }).success,
    ).toBe(false);
  });

  it('resolves mechanics by override, snapshot, then base-game precedence', () => {
    expect(MECHANICS_PRECEDENCE).toEqual([
      'manual-override',
      'puerta-snapshot',
      'base-game',
    ]);

    expect(resolveMechanicsLayer(['base-game'])).toBe('base-game');
    expect(resolveMechanicsLayer(['base-game', 'puerta-snapshot'])).toBe(
      'puerta-snapshot',
    );
    expect(
      resolveMechanicsLayer([
        'base-game',
        'puerta-snapshot',
        'manual-override',
      ]),
    ).toBe('manual-override');
  });

  it('models forum evidence as non-runtime truth until captured by overrides', () => {
    expect(EVIDENCE_PRECEDENCE).toEqual([
      'override-evidence',
      'forum-doc',
      'stale-doc',
    ]);

    expect(isRuntimeTruthSource('manual-override')).toBe(true);
    expect(isRuntimeTruthSource('puerta-snapshot')).toBe(true);
    expect(isRuntimeTruthSource('base-game')).toBe(true);
    expect(isRuntimeTruthSource('forum-doc')).toBe(false);
    expect(resolveMechanicsLayer(['forum-doc', 'stale-doc'])).toBeNull();
    expect(
      resolveMechanicsLayer(['forum-doc', 'override-evidence', 'base-game']),
    ).toBe('base-game');
    expect(
      resolveMechanicsLayer(['forum-doc', 'override-evidence', 'manual-override']),
    ).toBe('manual-override');
  });
});
