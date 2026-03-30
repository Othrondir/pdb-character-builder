import { z } from 'zod';

import { canonicalIdRegex } from './canonical-id';

const VALIDATION_EVIDENCE_LAYERS = [
  'base-game',
  'puerta-snapshot',
  'manual-override',
  'override-evidence',
  'forum-doc',
  'stale-doc',
] as const;

export type ValidationStatus = 'legal' | 'illegal' | 'blocked';
export type BlockKind =
  | 'unsupported'
  | 'conflict'
  | 'missing-source'
  | 'not-verifiable';

export const validationEvidenceSchema = z.object({
  layer: z.enum(VALIDATION_EVIDENCE_LAYERS),
  resref: z.string().min(1).optional(),
  restype: z.number().int().nonnegative().optional(),
  rowIndex: z.number().int().nonnegative().optional(),
  label: z.string().min(1).optional(),
  strref: z.number().int().nonnegative().optional(),
  manifestSha1: z.string().min(1).optional(),
  evidenceId: z.string().min(1).optional(),
});

export type ValidationEvidence = z.infer<typeof validationEvidenceSchema>;

const VALIDATION_STATUSES = ['legal', 'illegal', 'blocked'] as const satisfies readonly ValidationStatus[];
const BLOCK_KINDS = [
  'unsupported',
  'conflict',
  'missing-source',
  'not-verifiable',
] as const satisfies readonly BlockKind[];

const validationOutcomeBaseSchema = z.object({
  code: z.string().min(1),
  messageKey: z.string().min(1),
  evidence: z.array(validationEvidenceSchema),
  affectedIds: z.array(z.string().regex(canonicalIdRegex)),
});

const legalValidationOutcomeSchema = validationOutcomeBaseSchema.extend({
  status: z.literal('legal'),
});

const illegalValidationOutcomeSchema = validationOutcomeBaseSchema.extend({
  status: z.literal('illegal'),
});

const blockedValidationOutcomeSchema = validationOutcomeBaseSchema.extend({
  status: z.literal('blocked'),
  blockKind: z.enum(BLOCK_KINDS),
});

export const validationOutcomeSchema = z.discriminatedUnion('status', [
  legalValidationOutcomeSchema,
  illegalValidationOutcomeSchema,
  blockedValidationOutcomeSchema,
]);

export type ValidationOutcome = z.infer<typeof validationOutcomeSchema>;

export interface ResolveValidationOutcomeInput {
  ruleKnown: boolean;
  passesRule: boolean;
  hasConflict: boolean;
  hasMissingEvidence: boolean;
  evidence?: ReadonlyArray<ValidationEvidence>;
  affectedIds?: ReadonlyArray<string>;
  blockKind?: Exclude<BlockKind, 'conflict'>;
}

export function resolveValidationOutcome(
  input: ResolveValidationOutcomeInput,
): ValidationOutcome {
  const evidence = [...(input.evidence ?? [])];
  const affectedIds = [...new Set(input.affectedIds ?? [])];

  if (input.hasConflict) {
    return {
      status: 'blocked',
      blockKind: 'conflict',
      code: 'RULE_CONFLICT',
      messageKey: 'validation.blocked.conflict',
      evidence,
      affectedIds,
    };
  }

  if (!input.ruleKnown) {
    return {
      status: 'blocked',
      blockKind: input.blockKind ?? 'unsupported',
      code: 'RULE_NOT_VERIFIABLE',
      messageKey: 'validation.blocked.notVerifiable',
      evidence,
      affectedIds,
    };
  }

  if (input.hasMissingEvidence) {
    return {
      status: 'blocked',
      blockKind: input.blockKind ?? 'missing-source',
      code: 'RULE_NOT_VERIFIABLE',
      messageKey: 'validation.blocked.notVerifiable',
      evidence,
      affectedIds,
    };
  }

  if (!input.passesRule) {
    return {
      status: 'illegal',
      code: 'RULE_FAILED',
      messageKey: 'validation.illegal',
      evidence,
      affectedIds,
    };
  }

  return {
    status: 'legal',
    code: 'RULE_OK',
    messageKey: 'validation.legal',
    evidence,
    affectedIds,
  };
}
