import { describe, expect, it } from 'vitest';
import { evaluateClassEntry } from '@rules-engine/progression/class-entry-rules';
import {
  getPhase04ClassRecord,
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

  it('keeps wizard illegal below INT 11', () => {
    const evaluation = evaluateClassEntry({
      classRecord: getClassRecord('class:wizard'),
      foundation: {
        alignmentId: 'alignment:neutral-good',
        baseAttributes: {
          cha: 8,
          con: 8,
          dex: 8,
          int: 10,
          str: 8,
          wis: 8,
        },
        deityId: 'deity:none',
      },
    });

    expect(evaluation.summaryStatus).toBe('illegal');
  });

  it('keeps shadowdancer blocked while deferred requirements are pending', () => {
    const evaluation = evaluateClassEntry({
      classRecord: getClassRecord('class:shadowdancer'),
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
