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
 *     DEFERRED_LABEL_UNVETTED_BASE; their alignment gates still apply.
 *
 * Locks contract:
 *  (1) Clérigo (`class:cleric`) legal at L1 with Legal Bueno Humano.
 *  (2) Puerta custom base classes stay in the base roster via allowlist.
 *  (3) Guerrero stays legal (guards against over-gating).
 *  (4) Shadowdancer stays blocked with the 12.1-01 deferred label
 *      (preserves prior contract — prestige path unchanged).
 *  (5) `decodeAlignRestrict` handles NWN class component masks plus
 *      `AlignRstrctType`, including evil-only Paladin Oscuro.
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
    ])('%s is a Puerta custom base class in the base roster (P1-a/c: allowlist + isBase force)', (id) => {
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

      const record = getPhase04ClassRecord(id as CanonicalId);
      expect(record).not.toBeNull();
      expect(record!.kind).toBe('base');
      expect(record!.deferredRequirementLabels).not.toContain(
        DEFERRED_LABEL_UNVETTED_BASE,
      );
    });

    it('Paladin Oscuro is not legal for Legal Bueno', () => {
      const option = byId.get('class:paladin-oscuro' as CanonicalId);
      expect(option?.status).toBe('illegal');
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

  describe('L1 Legal Maligno build — class picker', () => {
    const evilFoundation = {
      ...foundation,
      alignmentId: 'alignment:lawful-evil' as CanonicalId,
    };
    const options = collectVisibleClassOptions({
      classes: phase04ClassFixture.classes,
      foundation: evilFoundation,
      selectedClassId: null,
    });
    const byId = new Map(options.map((o) => [o.id, o]));

    it('Paladin Oscuro is legal for Legal Maligno', () => {
      expect(byId.get('class:paladin-oscuro' as CanonicalId)?.status).toBe(
        'legal',
      );
    });
  });

  describe('decodeAlignRestrict — classes.2da component-mask helper', () => {
    it('0x00 mask, non-inverted → undefined (no gate)', () => {
      expect(decodeAlignRestrict('0x00', '0x00', '0')).toBeUndefined();
    });
    it('0x00 mask, inverted → undefined (no gate; inverted of nothing is still nothing)', () => {
      expect(decodeAlignRestrict('0x00', '0x03', '1')).toBeUndefined();
    });
    it('barbarian-style 0x02 law/chaos non-inverted forbids lawful', () => {
      expect(decodeAlignRestrict('0x02', '0x01', '0')).toEqual([
        'alignment:neutral-good',
        'alignment:true-neutral',
        'alignment:neutral-evil',
        'alignment:chaotic-good',
        'alignment:chaotic-neutral',
        'alignment:chaotic-evil',
      ]);
    });
    it('monk-style 0x05 law/chaos non-inverted allows lawful only', () => {
      expect(decodeAlignRestrict('0x05', '0x01', '0')).toEqual([
        'alignment:lawful-good',
        'alignment:lawful-neutral',
        'alignment:lawful-evil',
      ]);
    });
    it('assassin / paladin oscuro 0x09 good/evil non-inverted allows evil only', () => {
      expect(decodeAlignRestrict('0x09', '0x02', '0')).toEqual([
        'alignment:lawful-evil',
        'alignment:neutral-evil',
        'alignment:chaotic-evil',
      ]);
    });
    it('druid-style 0x01 both-axes inverted allows any neutral component', () => {
      expect(decodeAlignRestrict('0x01', '0x03', '1')).toEqual([
        'alignment:lawful-neutral',
        'alignment:neutral-good',
        'alignment:true-neutral',
        'alignment:neutral-evil',
        'alignment:chaotic-neutral',
      ]);
    });
    it('warlock-style 0x14 both-axes inverted allows evil or chaotic', () => {
      expect(decodeAlignRestrict('0x14', '0x03', '1')).toEqual([
        'alignment:lawful-evil',
        'alignment:neutral-evil',
        'alignment:chaotic-good',
        'alignment:chaotic-neutral',
        'alignment:chaotic-evil',
      ]);
    });
    it('null mask → undefined', () => {
      expect(decodeAlignRestrict(null, '0x03', '0')).toBeUndefined();
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
