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
    /** Phase 12.8-02 (D-08, UAT-2026-04-23 F5) — new evaluator branches. */
    minArcaneSpellLevel?: number;
    minSpellLevel?: number;
    excludedClassIds?: ReadonlyArray<{ classId: string; className: string }>;
    requiredAnyFeatGroups?: ReadonlyArray<
      ReadonlyArray<{ featId: string; featName: string }>
    >;
    requiredAnyRaceIds?: ReadonlyArray<{ raceId: string; raceName: string }>;
    requiredAnyClassLevels?: ReadonlyArray<{
      classId: string;
      className: string;
      amount: number;
    }>;
  };
}

export type BlockerKind =
  | 'bab'
  | 'skill-rank'
  | 'feat'
  | 'class-level'
  | 'l1'
  | 'unvetted'
  | 'arcane-spell-level'
  | 'spell-level'
  | 'excluded-class'
  | 'any-feat-group'
  | 'any-race'
  | 'any-class-level';

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
  /**
   * Phase 12.8-02 (D-08) — highest arcane spell level the character can cast.
   * Feeds `minArcaneSpellLevel` evaluator branch. Optional because Phase 07.2
   * descoped the magic pipeline; when undefined the evaluator treats the
   * value as 0 so any `minArcaneSpellLevel` override fails closed until a
   * future magic phase surfaces the real value.
   */
  highestArcaneSpellLevel?: number;
  /**
   * Phase 12.8-02 (D-08) — highest spell level the character can cast across
   * any class (arcane or divine). Reserved for future caller wiring; the
   * `minSpellLevel` evaluator branch currently fail-closes regardless per
   * Phase 07.2 magic descope (see evaluator inline comment).
   */
  highestSpellLevel?: number;
  /**
   * Phase 12.8-02 (D-08) — canonical race id for `requiredAnyRaceIds` checks.
   * `string | null` accepts `foundationStore.raceId` which is null until the
   * user picks a race. Undefined means "caller does not surface race state".
   */
  raceId?: string | null;
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

// Phase 12.8-02 (D-08) — labels for the six new evaluator branches. Spanish
// copy mirrored in shellCopyEs.progression.prestigePrereqTemplates. Empty-array
// fallbacks stay inline (defensive only — real override data never exercises
// them).

function arcaneSpellLevelLabel(n: number): string {
  return n === 1
    ? 'Requiere lanzar 1 nivel de conjuro arcano'
    : `Requiere lanzar conjuros arcanos de nivel ${n}`;
}

function spellLevelLabel(n: number): string {
  return n === 1
    ? 'Requiere lanzar 1 nivel de conjuro'
    : `Requiere lanzar conjuros de nivel ${n}`;
}

function excludedClassLabel(className: string): string {
  return `Incompatible con ${className}`;
}

function anyFeatGroupLabel(featNames: ReadonlyArray<string>): string {
  if (featNames.length === 0) {
    return 'Requiere al menos una dote del grupo';
  }
  if (featNames.length === 1) {
    return `Requiere dote: ${featNames[0]}`;
  }
  return `Requiere una de estas dotes: ${featNames.join(', ')}`;
}

function anyRaceLabel(raceNames: ReadonlyArray<string>): string {
  if (raceNames.length === 0) {
    return 'Requiere una raza específica';
  }
  return `Requiere raza: ${raceNames.join(' o ')}`;
}

function anyClassLevelLabel(
  entries: ReadonlyArray<{ className: string; amount: number }>,
): string {
  if (entries.length === 0) {
    return 'Requiere niveles en una clase';
  }
  const parts = entries.map((e) =>
    e.amount === 1
      ? `1 nivel de ${e.className}`
      : `${e.amount} niveles de ${e.className}`,
  );
  return `Requiere ${parts.join(' o ')}`;
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

  // Phase 12.8-02 (D-08, UAT-2026-04-23 F5) — new evaluator branches.
  if (p.minArcaneSpellLevel !== undefined) {
    const arcaneLevel = input.highestArcaneSpellLevel ?? 0;
    if (arcaneLevel < p.minArcaneSpellLevel) {
      blockers.push({
        kind: 'arcane-spell-level',
        threshold: p.minArcaneSpellLevel,
        label: arcaneSpellLevelLabel(p.minArcaneSpellLevel),
      });
    }
  }

  if (p.minSpellLevel !== undefined) {
    // Per Phase 07.2 magic descope, no spell-level runtime tracking exists.
    // Fail-closed — any override declaring this field blocks until caller surfaces a value.
    blockers.push({
      kind: 'spell-level',
      threshold: p.minSpellLevel,
      label: spellLevelLabel(p.minSpellLevel),
    });
  }

  for (const excluded of p.excludedClassIds ?? []) {
    if ((classLevels[excluded.classId] ?? 0) > 0) {
      blockers.push({
        kind: 'excluded-class',
        threshold: excluded.classId,
        label: excludedClassLabel(excluded.className),
      });
    }
  }

  for (const group of p.requiredAnyFeatGroups ?? []) {
    const anyMatch = group.some((f) => featIds.has(f.featId));
    if (!anyMatch) {
      blockers.push({
        kind: 'any-feat-group',
        threshold: group.length,
        label: anyFeatGroupLabel(group.map((f) => f.featName)),
      });
    }
  }

  if (p.requiredAnyRaceIds !== undefined && p.requiredAnyRaceIds.length > 0) {
    const raceId = input.raceId ?? '';
    const match = p.requiredAnyRaceIds.some((r) => r.raceId === raceId);
    if (!match) {
      blockers.push({
        kind: 'any-race',
        threshold: p.requiredAnyRaceIds.length,
        label: anyRaceLabel(p.requiredAnyRaceIds.map((r) => r.raceName)),
      });
    }
  }

  if (
    p.requiredAnyClassLevels !== undefined &&
    p.requiredAnyClassLevels.length > 0
  ) {
    const anyMatch = p.requiredAnyClassLevels.some(
      (c) => (classLevels[c.classId] ?? 0) >= c.amount,
    );
    if (!anyMatch) {
      blockers.push({
        kind: 'any-class-level',
        threshold: p.requiredAnyClassLevels.length,
        label: anyClassLevelLabel(
          p.requiredAnyClassLevels.map((c) => ({
            className: c.className,
            amount: c.amount,
          })),
        ),
      });
    }
  }

  return { reachable: blockers.length === 0, blockers };
}

// Note: `abilityScores` is accepted in PrestigeGateInput but currently unused
// — reserved for future prereq kinds (e.g. MinAbility) once the extractor
// surfaces them. Kept on the input shape so callers do not need to reshape
// the contract when Phase 13.x lands.
