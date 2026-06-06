import { describe, expect, it } from 'vitest';
import { evaluateClassEntry } from '@rules-engine/progression/class-entry-rules';
import {
  getPhase04ClassRecord,
  phase04ClassFixture,
} from '@planner/features/level-progression/class-fixture';

function getClassRecord(classId: Parameters<typeof getPhase04ClassRecord>[0]) {
  const classRecord = getPhase04ClassRecord(classId);

  if (!classRecord) {
    throw new Error(`Missing class fixture for ${classId}`);
  }

  return classRecord;
}

describe('phase 04 class prerequisites', () => {
  it('keeps paladin illegal outside lawful good alignment', () => {
    const evaluation = evaluateClassEntry({
      classRecord: getClassRecord('class:paladin'),
      foundation: {
        alignmentId: 'alignment:neutral-good',
        baseAttributes: {
          cha: 8,
          con: 8,
          dex: 8,
          int: 8,
          str: 8,
          wis: 8,
        },
        deityId: 'deity:none',
      },
    });

    expect(evaluation.summaryStatus).toBe('illegal');
  });

  it('cleric is legal without deity (P1-b: Puerta handles deity via scripts, overlay removed)', () => {
    const evaluation = evaluateClassEntry({
      classRecord: getClassRecord('class:cleric'),
      foundation: {
        alignmentId: 'alignment:neutral-good',
        baseAttributes: {
          cha: 8,
          con: 8,
          dex: 8,
          int: 8,
          str: 8,
          wis: 8,
        },
        deityId: 'deity:none',
      },
    });

    expect(evaluation.summaryStatus).toBe('legal');
  });

  it.each([
    ['class:wizard', 'alignment:neutral-good'],
    ['class:paladin', 'alignment:lawful-good'],
    ['class:druid', 'alignment:true-neutral'],
    ['class:sorcerer', 'alignment:neutral-good'],
    ['class:warlock', 'alignment:chaotic-neutral'],
  ] as const)(
    'keeps %s legal with low casting attributes because characteristics are not class prerequisites',
    (classId, alignmentId) => {
      const evaluation = evaluateClassEntry({
        classRecord: getClassRecord(classId),
        foundation: {
          alignmentId,
          baseAttributes: {
            cha: 8,
            con: 8,
            dex: 8,
            int: 8,
            str: 8,
            wis: 8,
          },
          deityId: 'deity:none',
        },
      });

      expect(evaluation.summaryStatus).toBe('legal');
      expect(
        evaluation.requirementRows.some((row) =>
          /^(CAR|INT|SAB|DES|CON|FUE)\b/.test(row.label),
        ),
      ).toBe(false);
    },
  );

  it('does not keep ability-score requirements on any runtime class record', () => {
    for (const classRecord of phase04ClassFixture.classes) {
      expect(
        'minimumAbilityScores' in classRecord.implementedRequirements,
        `${classRecord.id} must not declare ability-score class requirements`,
      ).toBe(false);
    }
  });

  it('ignores legacy minimumAbilityScores if an old class record shape is passed in', () => {
    const evaluation = evaluateClassEntry({
      classRecord: {
        deferredRequirementLabels: [],
        id: 'class:test-low-attributes',
        implementedRequirements: {
          minimumAbilityScores: [
            { key: 'int', score: 18 },
            { key: 'wis', score: 18 },
            { key: 'cha', score: 18 },
          ],
        } as never,
        kind: 'base',
        label: 'Clase de prueba',
      },
      foundation: {
        alignmentId: 'alignment:neutral-good',
        baseAttributes: {
          cha: 8,
          con: 8,
          dex: 8,
          int: 8,
          str: 8,
          wis: 8,
        },
        deityId: 'deity:none',
      },
    });

    expect(evaluation.summaryStatus).toBe('legal');
    expect(evaluation.requirementRows).toEqual([]);
  });

  it('keeps class records blocked while deferred requirements are pending', () => {
    const evaluation = evaluateClassEntry({
      classRecord: {
        deferredRequirementLabels: [
          'Pendiente de dotes o habilidades de fases posteriores.',
        ],
        id: 'class:shadowdancer',
        implementedRequirements: {},
        kind: 'prestige',
        label: 'Danzarín sombrío',
      },
      foundation: {
        alignmentId: 'alignment:neutral-good',
        baseAttributes: {
          cha: 8,
          con: 8,
          dex: 14,
          int: 12,
          str: 8,
          wis: 8,
        },
        deityId: 'deity:none',
      },
    });

    expect(evaluation.summaryStatus).toBe('blocked');
    expect(
      evaluation.requirementRows.some((row) =>
        row.label.includes('Pendiente de dotes o habilidades de fases posteriores.'),
      ),
    ).toBe(true);
  });
});
