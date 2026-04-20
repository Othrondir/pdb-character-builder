import { describe, expect, it } from 'vitest';

import {
  collectVisibleClassOptions,
  evaluateClassEntry,
} from '@rules-engine/progression/class-entry-rules';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import {
  decodeAlignRestrict,
  getPhase04ClassRecord,
  phase04ClassFixture,
} from '@planner/features/level-progression/class-fixture';
import { compiledClassCatalog } from '@planner/data/compiled-classes';

/**
 * Phase 12.2-03 — prestige filter + AlignRestrict decoder at L1.
 *
 * UAT-2026-04-20 amendment (P1-b + P1-c):
 *   - cleric overlay no longer carries `requiresDeity` (Puerta maneja deidades
 *     via scripts, not 2DA — Phase 05.1 decision). Foundation.deityId stays
 *     null and the overlay gate was blocking cleric forever. Cleric at L1 with
 *     Legal Bueno Humano is now fully legal (no deity row, no blocked status).
 *   - BASE_CLASS_ALLOWLIST extended 11 → 18 to cover Puerta custom base
 *     classes: Alma Predilecta, Caballero de Luz, Paladin Oscuro, Paladin
 *     Vengador, Artífice, Brujo, Espadachin. These rows no longer emit
 *     DEFERRED_LABEL_UNVETTED_BASE and are legal at L1 (absent other gates).
 *
 * Locks contract:
 *  (1) Clérigo (`class:cleric`) legal at L1 with Legal Bueno Humano.
 *  (2) Puerta custom base classes legal at L1 via allowlist.
 *  (3) Guerrero stays legal (guards against over-gating).
 *  (4) Shadowdancer stays blocked with the 12.1-01 deferred label
 *      (preserves prior contract — prestige path unchanged).
 *  (5) `decodeAlignRestrict` handles NWN Aurora hex-bit convention:
 *      0x01=LG, 0x02=LN, 0x04=LE, 0x08=NG, 0x10=TN, 0x20=NE, 0x40=CG,
 *      0x80=CN, 0x100=CE. `InvertRestrict="1"` inverts the mask; `0x00`
 *      (with or without inversion) emits no gate.
 *  (6) `CLASS_SERVER_RULE_OVERLAY` wins over decoded values per-field
 *      (paladin stays LG-only).
 *
 * Long-term fix (tracked in 12.2-CONTEXT.md <deferred>): extractor emits
 * real `PreReqTable` decoding or a `reachableAtLevelOne: boolean` field so
 * the `BASE_CLASS_ALLOWLIST` escape hatch can shrink to empty.
 */

const DEFERRED_LABEL_UNVETTED_BASE =
  'Prerrequisitos específicos del servidor. Revisa las dotes, nivel de lanzador o atributos requeridos.';

describe('Phase 12.2-03 — prestige filter + AlignRestrict decoder at L1', () => {
  const foundation = {
    alignmentId: 'alignment:lawful-good' as CanonicalId,
    baseAttributes: { str: 16, dex: 12, con: 16, int: 11, wis: 10, cha: 10 },
    deityId: null,
  };

  describe('L1 Legal Bueno Humano build — class picker', () => {
    const options = collectVisibleClassOptions({
      classes: phase04ClassFixture.classes,
      foundation,
      selectedClassId: null,
    });
    const byId = new Map(options.map((o) => [o.id, o]));

    it('cleric is legal at L1 with lawful-good alignment (P1-b: requiresDeity removed)', () => {
      const cleric = byId.get('class:cleric' as CanonicalId);
      expect(cleric).toBeDefined();
      expect(cleric!.status).toBe('legal');

      const clericRecord = getPhase04ClassRecord('class:cleric' as CanonicalId);
      expect(clericRecord).not.toBeNull();

      const evaluation = evaluateClassEntry({
        classRecord: clericRecord!,
        foundation,
      });
      const alignmentRow = evaluation.requirementRows.find((r) =>
        /Alineamiento/i.test(r.label),
      );
      if (alignmentRow) expect(alignmentRow.status).not.toBe('illegal');

      const deityRow = evaluation.requirementRows.find((r) => /deidad/i.test(r.label));
      expect(deityRow).toBeUndefined();

      // Falsifiability guard (plan-checker W1): prove BASE_CLASS_ALLOWLIST
      // membership so a regression where the allowlist silently drops Cleric
      // cannot pass vacuously.
      expect(clericRecord!.deferredRequirementLabels).not.toContain(
        DEFERRED_LABEL_UNVETTED_BASE,
      );
    });

    // NOTE (plan canary reconciliation): the plan enumerates
    // `class:caballero-de-luz`, but the compiled catalog slugs the
    // "Caballero de Luz" row as `class:paladin-antiguos` (id derived from
    // feat-table ref CLS_FEAT_PALA, not the Spanish label). Using the real
    // compiled id gives us a hard assertion instead of the plan's soft-skip
    // branch, which is the stronger guard against regression. The soft-skip
    // path is preserved below in case a future extractor re-emission changes
    // any of these ids.
    it.each([
      'class:almapredilecta',
      'class:paladin-antiguos',
      'class:paladin-oscuro',
      'class:paladin-vengador',
      'class:artifice',
      // UAT-2026-04-20 P1-a: Brujo + Espadachin forced to isBase via
      // ISBASE_FORCED set in class-fixture.ts (extractor emits isBase=false
      // pese a "CLASE BASICA" en la descripción).
      'class:warlock',
      'class:swashbuckler',
    ])('%s is a Puerta custom base class legal at L1 (P1-a/c: allowlist + isBase force)', (id) => {
      const compiledExists = compiledClassCatalog.classes.some(
        (c) => c.id === id,
      );
      if (!compiledExists) {
        // Extractor coverage gap — skip loudly so a future extractor
        // re-emission that drops a canary does not masquerade as a
        // wiring regression.
        // eslint-disable-next-line no-console
        console.warn(`[phase-12.2-03] canary ${id} not present in compiled catalog`);
        return;
      }
      const option = byId.get(id as CanonicalId);
      expect(option).toBeDefined();
      expect(option!.status).toBe('legal');

      const record = getPhase04ClassRecord(id as CanonicalId);
      expect(record).not.toBeNull();
      expect(record!.kind).toBe('base');
      expect(record!.deferredRequirementLabels).not.toContain(
        DEFERRED_LABEL_UNVETTED_BASE,
      );
    });

    it('fighter stays legal (guard against over-gating)', () => {
      const fighter = byId.get('class:fighter' as CanonicalId);
      expect(fighter?.status).toBe('legal');
    });

    it('shadowdancer still blocked with deferred label (preserves 12.1-01 contract)', () => {
      const sd = byId.get('class:shadowdancer' as CanonicalId);
      expect(sd?.status).toBe('blocked');

      const record = getPhase04ClassRecord('class:shadowdancer' as CanonicalId);
      expect(record?.deferredRequirementLabels).toContain(
        'Pendiente de dotes o habilidades de fases posteriores.',
      );
    });
  });

  describe('decodeAlignRestrict — pure hex-mask helper', () => {
    it('0x00 mask, non-inverted → undefined (no gate)', () => {
      expect(decodeAlignRestrict('0x00', '0')).toBeUndefined();
    });
    it('0x00 mask, inverted → undefined (no gate; inverted of nothing is still nothing)', () => {
      expect(decodeAlignRestrict('0x00', '1')).toBeUndefined();
    });
    it('0x01 mask, non-inverted → [LG]', () => {
      expect(decodeAlignRestrict('0x01', '0')).toEqual(['alignment:lawful-good']);
    });
    it('0x01 mask, inverted → the 8 non-LG alignments', () => {
      const result = decodeAlignRestrict('0x01', '1');
      expect(result).toBeDefined();
      expect(result).toHaveLength(8);
      expect(result).not.toContain('alignment:lawful-good');
    });
    it('0x10 mask, non-inverted → [TN]', () => {
      expect(decodeAlignRestrict('0x10', '0')).toEqual(['alignment:true-neutral']);
    });
    it('null mask → undefined', () => {
      expect(decodeAlignRestrict(null, '0')).toBeUndefined();
    });
  });

  describe('CLASS_SERVER_RULE_OVERLAY precedence over decoded metadata', () => {
    it('paladin overlay wins: allowedAlignmentIds = [lawful-good]', () => {
      const paladin = getPhase04ClassRecord('class:paladin' as CanonicalId);
      expect(paladin?.implementedRequirements.allowedAlignmentIds).toEqual([
        'alignment:lawful-good',
      ]);
    });
    it('cleric overlay: requiresDeity removed (P1-b — Puerta handles deity via scripts)', () => {
      const cleric = getPhase04ClassRecord('class:cleric' as CanonicalId);
      expect(cleric?.implementedRequirements.requiresDeity).toBeUndefined();
    });
  });
});
