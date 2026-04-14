import { describe, expect, it } from 'vitest';
import { evaluateMulticlassLegality } from '@rules-engine/progression/multiclass-rules';
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

describe('phase 04 multiclass rules', () => {
  it('keeps a broken minimum commitment non-legal', () => {
    const evaluation = evaluateMulticlassLegality({
      classRecord: getClassRecord('class:fighter'),
      classes: phase04ClassFixture.classes,
      level: 2,
      levels: [
        { classId: 'class:rogue', level: 1 },
        { classId: 'class:fighter', level: 2 },
      ],
    });

    expect(evaluation.summaryStatus).toBe('illegal');
  });

  it('lets puerta.shadowdancer-rogue-bridge bypass the default commitment break', () => {
    const evaluation = evaluateMulticlassLegality({
      classRecord: getClassRecord('class:shadowdancer'),
      classes: phase04ClassFixture.classes,
      level: 2,
      levels: [
        { classId: 'class:rogue', level: 1 },
        { classId: 'class:shadowdancer', level: 2 },
      ],
    });

    expect(evaluation.appliedOverrides).toContain(
      'puerta.shadowdancer-rogue-bridge',
    );
    expect(evaluation.summaryStatus).toBe('blocked');
    expect(evaluation.issues.some((issue) => issue.status === 'illegal')).toBe(false);
  });

  it('keeps deferred prestige requirements blocked rather than legal', () => {
    const evaluation = evaluateMulticlassLegality({
      classRecord: getClassRecord('class:shadowdancer'),
      classes: phase04ClassFixture.classes,
      level: 1,
      levels: [{ classId: 'class:shadowdancer', level: 1 }],
    });

    expect(evaluation.summaryStatus).toBe('blocked');
  });
});
