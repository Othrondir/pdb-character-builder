import type { SourceAnchor } from '../src/contracts/canonical-record';
import type { ResolveValidationOutcomeInput, ValidationEvidence } from '../../rules-engine/src/contracts/validation-outcome';

const domainWarEvidence = [
  {
    layer: 'override-evidence',
    evidenceId: 'forum:domains-war',
    label: 'Forum reconciliation note',
  },
] as const satisfies ReadonlyArray<ValidationEvidence>;

const domainWarAnchors = [
  {
    layer: 'puerta-snapshot',
    label: 'domains.2da row 14',
    resref: 'domains',
    rowIndex: 14,
    manifestSha1: 'puerta-snapshot-sha1',
  },
  {
    layer: 'override-evidence',
    evidenceId: 'forum:domains-war',
    label: 'Forum reconciliation note',
  },
] as const satisfies ReadonlyArray<SourceAnchor>;

export const mechanicalConflictFixture = {
  conflictingValues: ['alignment=chaotic-good', 'alignment=lawful-good'],
  conflictRecord: {
    id: 'conflict:domain-war-mechanical',
    severity: 'mechanical',
    affectedIds: ['domain:war'],
    evidence: domainWarAnchors,
    notes: 'Competing legality-critical domain alignment values remain unresolved.',
  },
  outcomeInput: {
    ruleKnown: true,
    passesRule: true,
    hasConflict: true,
    hasMissingEvidence: false,
    evidence: domainWarEvidence,
    affectedIds: ['domain:war'],
  } as const satisfies ResolveValidationOutcomeInput,
} as const;

export const missingSourceFixture = {
  canonicalId: 'domain:phase-01-not-verifiable',
  conflictRecord: {
    id: 'conflict:domain-phase-01-not-verifiable',
    severity: 'mechanical',
    affectedIds: ['domain:phase-01-not-verifiable'],
    evidence: [
      {
        layer: 'stale-doc',
        evidenceId: 'forum:obsolete-domain-thread',
        label: 'Outdated forum note',
      },
    ],
    notes: 'No authoritative Puerta source is available for this domain override.',
  },
  outcomeInput: {
    ruleKnown: false,
    passesRule: false,
    hasConflict: false,
    hasMissingEvidence: true,
    blockKind: 'missing-source',
    evidence: [
      {
        layer: 'stale-doc',
        evidenceId: 'forum:obsolete-domain-thread',
        label: 'Outdated forum note',
      },
    ],
    affectedIds: ['domain:phase-01-not-verifiable'],
  } as const satisfies ResolveValidationOutcomeInput,
} as const;

export const textOnlyConflictFixture = {
  labels: ['Guerra', 'Dominio de la Guerra'],
  conflictRecord: {
    id: 'conflict:domain-war-text',
    severity: 'text',
    affectedIds: ['domain:war'],
    evidence: [
      {
        layer: 'override-evidence',
        evidenceId: 'forum:domain-label-variant',
        label: 'Spanish label variance',
      },
    ],
    resolution: 'warning-only',
    notes: 'Presentation strings disagree while legality-critical fields remain identical.',
  },
  outcomeInput: {
    ruleKnown: true,
    passesRule: true,
    hasConflict: false,
    hasMissingEvidence: false,
    evidence: [
      {
        layer: 'override-evidence',
        evidenceId: 'forum:domain-label-variant',
        label: 'Spanish label variance',
      },
    ],
    affectedIds: ['domain:war'],
  } as const satisfies ResolveValidationOutcomeInput,
} as const;
