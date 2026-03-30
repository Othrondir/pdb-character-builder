import { describe, expect, it } from 'vitest';

import {
  mechanicalConflictFixture,
  missingSourceFixture,
  textOnlyConflictFixture,
} from '../../packages/data-extractor/fixtures/phase1-conflict-fixtures';
import { conflictRecordSchema } from '../../packages/data-extractor/src/contracts/conflict-record';
import blockedMarker from '../../packages/overrides/blocked/phase-01-not-verifiable-domain.json';
import {
  resolveValidationOutcome,
  validationOutcomeSchema,
} from '../../packages/rules-engine/src/contracts/validation-outcome';

describe('conflict policy contract', () => {
  it('fails closed for unresolved mechanical conflicts', () => {
    const conflict = conflictRecordSchema.parse(mechanicalConflictFixture.conflictRecord);
    const outcome = resolveValidationOutcome(mechanicalConflictFixture.outcomeInput);

    expect(conflict).toMatchObject({
      severity: 'mechanical',
      resolution: 'blocked',
    });
    expect(outcome).toMatchObject({
      status: 'blocked',
      blockKind: 'conflict',
      code: 'RULE_CONFLICT',
      messageKey: 'validation.blocked.conflict',
      affectedIds: ['domain:war'],
    });
    expect(validationOutcomeSchema.safeParse(outcome).success).toBe(true);
  });

  it('blocks missing-source cases and ships a blocked marker fixture', () => {
    const outcome = resolveValidationOutcome(missingSourceFixture.outcomeInput);

    expect(outcome).toMatchObject({
      status: 'blocked',
      blockKind: 'missing-source',
      code: 'RULE_NOT_VERIFIABLE',
      messageKey: 'validation.blocked.notVerifiable',
    });
    expect(blockedMarker).toMatchObject({
      id: 'blocked:phase-01-not-verifiable-domain',
      status: 'blocked',
      blockKind: 'not-verifiable',
      code: 'RULE_NOT_VERIFIABLE',
      canonicalId: 'domain:phase-01-not-verifiable',
      reason: 'Missing authoritative Puerta source',
    });
  });

  it('distinguishes known failed rules from known passing rules', () => {
    const illegalOutcome = resolveValidationOutcome({
      ruleKnown: true,
      passesRule: false,
      hasConflict: false,
      hasMissingEvidence: false,
      evidence: mechanicalConflictFixture.outcomeInput.evidence,
      affectedIds: ['domain:war'],
    });

    expect(illegalOutcome).toMatchObject({
      status: 'illegal',
      code: 'RULE_FAILED',
      messageKey: 'validation.illegal',
      evidence: mechanicalConflictFixture.outcomeInput.evidence,
      affectedIds: ['domain:war'],
    });

    const legalOutcome = resolveValidationOutcome(textOnlyConflictFixture.outcomeInput);
    expect(validationOutcomeSchema.safeParse(legalOutcome).success).toBe(true);
    expect(legalOutcome).toMatchObject({
      status: 'legal',
      code: 'RULE_OK',
      messageKey: 'validation.legal',
      evidence: textOnlyConflictFixture.outcomeInput.evidence,
      affectedIds: ['domain:war'],
    });
  });

  it('allows text-only conflicts to downgrade to warning-only without changing legality', () => {
    const conflict = conflictRecordSchema.parse(textOnlyConflictFixture.conflictRecord);
    const outcome = resolveValidationOutcome(textOnlyConflictFixture.outcomeInput);

    expect(conflict).toMatchObject({
      severity: 'text',
      resolution: 'warning-only',
    });
    expect(outcome).toMatchObject({
      status: 'legal',
      code: 'RULE_OK',
    });
  });
});
