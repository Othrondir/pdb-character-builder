/**
 * Phase 12.4-06 — Prestige class reachability gate.
 *
 * Pure helper: no React, no store, no browser APIs, and zero cross-package
 * imports from the extractor (CLAUDE.md "Prescriptive Shape": rules-engine
 * is a pure TypeScript domain model). Callers in apps/planner translate
 * `CompiledClass` → `ClassPrereqInput` at the boundary — mirrors the 12.4-03
 * per-level-budget inline-input pattern.
 *
 * Decision tree (SPEC R1 / D-02):
 *   1. Base class → { reachable: true, blockers: [] } (always reachable;
 *      foundation gate handled elsewhere).
 *   2. Prestige at L1 → { reachable: false, blockers: [l1] }.
 *   3. Prestige at L2+ with `enriched: false` → { reachable: false,
 *      blockers: [unvetted] }. Fail-closed until extractor prereq
 *      enrichment lands (Phase 13.x per CONTEXT.md <deferred>).
 *   4. Prestige at L2+ with `enriched: true` → decode `decodedPrereqs`,
 *      emit one blocker per unmet requirement. Empty list ⇒ reachable.
 *
 * Copy source: shellCopyEs.progression.prestigePrereqTemplates (apps/planner).
 * Labels are rendered inline here so callers emit ready-to-display copy
 * without re-applying template interpolation — single source of truth.
 */

/**
 * Minimal structural input describing a class row. Lists ONLY the fields the
 * gate reads. Keeps rules-engine framework-agnostic per CLAUDE.md.
 */
export interface ClassPrereqInput {
  id: string;
  isBase: boolean;
  /**
   * Decoded prerequisite columns. Optional because extractor enrichment is
   * deferred to Phase 13.x (see CONTEXT.md <deferred>). When absent, callers
   * should also pass `enriched: false` so the gate fails-closed to
   * 'Requisitos en revisión'.
   */
  decodedPrereqs?: {
    minBab?: number;
    minSkillRanks?: ReadonlyArray<{
      skillId: string;
      amount: number;
      skillName: string;
    }>;
    requiredFeats?: ReadonlyArray<{ featId: string; featName: string }>;
    minClassLevel?: { classId: string; amount: number; className: string };
  };
}

export type BlockerKind =
  | 'bab'
  | 'skill-rank'
  | 'feat'
  | 'class-level'
  | 'l1'
  | 'unvetted';

export interface PrestigeBlocker {
  kind: BlockerKind;
  threshold: number | string;
  /** Spanish UI copy, threshold-only per D-02 — ready to render. */
  label: string;
}

export interface PrestigeGateResult {
  reachable: boolean;
  blockers: PrestigeBlocker[];
}

export interface PrestigeGateInput {
  classRow: ClassPrereqInput;
  /** Character level the row is evaluated against (1..16). */
  level: number;
  abilityScores: Record<string, number>;
  bab: number;
  skillRanks: Record<string, number>;
  featIds: Set<string>;
  classLevels: Record<string, number>;
  /** false → prestige row lacks decoded prereqs → fail-closed to 'Requisitos en revisión'. */
  enriched: boolean;
}

// ---------------------------------------------------------------------------
// Copy templates (Spanish-first, threshold-only per D-02).
// Mirrors shellCopyEs.progression.prestigePrereqTemplates (apps/planner/src/
// lib/copy/es.ts). Values kept inline so the helper emits ready-to-display
// labels and the UI layer does not re-apply template interpolation.
// ---------------------------------------------------------------------------

function babLabel(n: number): string {
  return `Requiere BAB ≥ ${n}`;
}

function skillRankLabel(n: number, skillName: string): string {
  return n === 1
    ? `Requiere 1 rango de ${skillName}`
    : `Requiere ${n} rangos de ${skillName}`;
}

function classLevelLabel(n: number, className: string): string {
  return n === 1
    ? `Requiere 1 nivel de ${className}`
    : `Requiere ${n} niveles de ${className}`;
}

function featLabel(featName: string): string {
  return `Requiere dote: ${featName}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function reachableAtLevelN(input: PrestigeGateInput): PrestigeGateResult {
  const { classRow, level, bab, skillRanks, featIds, classLevels, enriched } =
    input;

  // Branch 1 — base class: always reachable. Foundation-gate (alignment,
  // ability minimums, etc.) is handled by class-entry-rules/evaluateClassEntry,
  // not here.
  if (classRow.isBase) {
    return { reachable: true, blockers: [] };
  }

  // Branch 2 — prestige at L1: never reachable (NWN1 EE canonical rule).
  if (level === 1) {
    return {
      reachable: false,
      blockers: [
        { kind: 'l1', threshold: 2, label: 'Disponible a partir del nivel 2' },
      ],
    };
  }

  // Branch 3 — prestige at L2+ without extractor enrichment: fail closed.
  // Matches class-fixture.ts `DEFERRED_LABEL_PRESTIGE` / `DEFERRED_LABEL_UNVETTED_BASE`
  // semantics at the gate layer (BASE_CLASS_ALLOWLIST handles base-side).
  if (!enriched || !classRow.decodedPrereqs) {
    return {
      reachable: false,
      blockers: [
        { kind: 'unvetted', threshold: 0, label: 'Requisitos en revisión' },
      ],
    };
  }

  // Branch 4 — prestige with enrichment: decode blockers per unmet requirement.
  const blockers: PrestigeBlocker[] = [];
  const p = classRow.decodedPrereqs;

  if (p.minBab !== undefined && bab < p.minBab) {
    blockers.push({
      kind: 'bab',
      threshold: p.minBab,
      label: babLabel(p.minBab),
    });
  }

  for (const req of p.minSkillRanks ?? []) {
    if ((skillRanks[req.skillId] ?? 0) < req.amount) {
      blockers.push({
        kind: 'skill-rank',
        threshold: req.amount,
        label: skillRankLabel(req.amount, req.skillName),
      });
    }
  }

  for (const req of p.requiredFeats ?? []) {
    if (!featIds.has(req.featId)) {
      blockers.push({
        kind: 'feat',
        threshold: req.featId,
        label: featLabel(req.featName),
      });
    }
  }

  if (
    p.minClassLevel &&
    (classLevels[p.minClassLevel.classId] ?? 0) < p.minClassLevel.amount
  ) {
    blockers.push({
      kind: 'class-level',
      threshold: p.minClassLevel.amount,
      label: classLevelLabel(
        p.minClassLevel.amount,
        p.minClassLevel.className,
      ),
    });
  }

  return { reachable: blockers.length === 0, blockers };
}

// Note: `abilityScores` is accepted in PrestigeGateInput but currently unused
// — reserved for future prereq kinds (e.g. MinAbility) once the extractor
// surfaces them. Kept on the input shape so callers do not need to reshape
// the contract when Phase 13.x lands.
